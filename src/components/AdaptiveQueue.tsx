import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Target, ChevronRight, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface QueueItem {
  id: string;
  job_title: string;
  task_name: string;
  department: string | null;
  weak_category: string;
  weak_score: number;
  threshold: number;
  attempt_number: number;
  max_attempts: number;
  status: string;
  coaching_tip: string | null;
  created_at: string;
}

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  tool_awareness: { label: "AI Tool Awareness", icon: "🤖", color: "text-primary" },
  human_value_add: { label: "Human Value-Add", icon: "💡", color: "text-warning" },
  adaptive_thinking: { label: "Adaptive Thinking", icon: "🔄", color: "text-accent-foreground" },
  domain_judgment: { label: "Domain Judgment", icon: "🎯", color: "text-success" },
};

export default function AdaptiveQueue({ userId, onLaunchSim }: {
  userId: string;
  onLaunchSim?: (taskName: string, jobTitle: string) => void;
}) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("simulation_queue")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      setQueue((data as QueueItem[]) || []);
      setLoading(false);
    };
    fetch();

    // Realtime subscription for new queue items
    const channel = supabase
      .channel("adaptive-queue")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "simulation_queue",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setQueue(prev => [payload.new as QueueItem, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  if (loading || queue.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 text-warning" />
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Recommended Retries
        </h2>
        <Badge variant="secondary" className="text-[10px]">{queue.length}</Badge>
      </div>

      <Card className="border-warning/30 bg-gradient-to-r from-warning/5 via-background to-warning/5">
        <CardContent className="p-4 space-y-0.5">
          <p className="text-xs text-muted-foreground mb-3">
            Based on your recent quests, these areas need more training to reach the <span className="font-semibold text-foreground">60% power threshold</span>.
          </p>

          <div className="divide-y divide-border/40">
            {queue.slice(0, 5).map((item) => {
              const meta = CATEGORY_META[item.weak_category] || { label: item.weak_category, icon: "📊", color: "text-foreground" };
              const gap = item.threshold - item.weak_score;

              return (
                <div key={item.id} className="py-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.task_name}</p>
                      <p className="text-[11px] text-muted-foreground">{item.job_title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px] border-warning/30">
                        Attempt {item.attempt_number}/{item.max_attempts}
                      </Badge>
                      {onLaunchSim && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 border-warning/30 text-warning hover:bg-warning/10"
                          onClick={() => onLaunchSim(item.task_name, item.job_title)}
                        >
                          Retry <ChevronRight className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Weak category indicator */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{meta.icon}</span>
                    <span className="text-xs text-muted-foreground">{meta.label}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <Progress value={item.weak_score} className="h-1.5 flex-1" />
                      <span className="text-xs font-semibold text-destructive">{item.weak_score}%</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">need +{gap}%</span>
                  </div>

                  {/* Coaching tip */}
                  {item.coaching_tip && (
                    <div className="flex items-start gap-2 bg-accent/40 rounded-md px-3 py-2">
                      <Lightbulb className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                      <p className="text-[11px] text-foreground leading-relaxed">{item.coaching_tip}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {queue.length > 5 && (
            <p className="text-[10px] text-muted-foreground pt-2 text-center">
              +{queue.length - 5} more areas to improve
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
