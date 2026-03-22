/**
 * AdaptiveQueue — Smart "what to practice next" panel.
 * Reads from simulation_queue (auto-populated by DB trigger)
 * and surfaces coaching-aware retry recommendations sorted by priority.
 */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Shield, Flame, Star, ChevronRight, Lightbulb, Target, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { CoachingContext } from "@/lib/simulator";

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

const CATEGORY_META: Record<string, { label: string; emoji: string; Icon: typeof Swords }> = {
  tool_awareness: { label: "Tool Mastery", emoji: "🎯", Icon: Target },
  human_value_add: { label: "Human Edge", emoji: "🛡️", Icon: Shield },
  adaptive_thinking: { label: "Adaptation", emoji: "🔥", Icon: Flame },
  domain_judgment: { label: "Domain Lore", emoji: "⭐", Icon: Star },
};

/** Priority: higher gap + lower attempt number = more urgent */
function sortPriority(a: QueueItem, b: QueueItem): number {
  const gapA = a.threshold - a.weak_score;
  const gapB = b.threshold - b.weak_score;
  // Primary: larger gap first
  if (gapA !== gapB) return gapB - gapA;
  // Secondary: earlier attempt first
  return a.attempt_number - b.attempt_number;
}

export default function AdaptiveQueue({ userId, onLaunchSim }: {
  userId: string;
  onLaunchSim?: (taskName: string, jobTitle: string, coaching?: CoachingContext) => void;
}) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueue = async () => {
      const { data } = await supabase
        .from("simulation_queue")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      setQueue((data as QueueItem[]) || []);
      setLoading(false);
    };
    fetchQueue();

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

  const sorted = useMemo(() => [...queue].sort(sortPriority), [queue]);

  if (loading || sorted.length === 0) return null;

  // Group by urgency
  const urgent = sorted.filter(q => (q.threshold - q.weak_score) >= 30);
  const moderate = sorted.filter(q => {
    const gap = q.threshold - q.weak_score;
    return gap > 0 && gap < 30;
  });

  const handleLaunch = (item: QueueItem) => {
    const meta = CATEGORY_META[item.weak_category];
    const coaching: CoachingContext = {
      weakCategory: meta?.label || item.weak_category,
      weakScore: item.weak_score,
      tip: item.coaching_tip || `Focus on improving your ${meta?.label || item.weak_category} skills.`,
      previousOverall: item.weak_score,
    };
    onLaunchSim?.(item.task_name, item.job_title, coaching);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-warning" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-warning">
          Quest Queue
        </h2>
        <Badge variant="secondary" className="text-[10px]">{sorted.length}</Badge>
      </div>

      <Card className="border-warning/30 bg-gradient-to-r from-warning/5 via-background to-warning/5">
        <CardContent className="p-4 space-y-0.5">
          <p className="text-xs text-muted-foreground mb-3">
            Based on your recent battles, these areas need training to reach the <span className="font-semibold text-foreground">60% power threshold</span>.
          </p>

          {/* Urgent quests */}
          {urgent.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="h-3 w-3 text-destructive" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">Critical</span>
              </div>
              <div className="space-y-1">
                {urgent.slice(0, 3).map((item) => (
                  <QueueRow key={item.id} item={item} onLaunch={handleLaunch} />
                ))}
              </div>
            </div>
          )}

          {/* Moderate quests */}
          {moderate.length > 0 && (
            <div>
              {urgent.length > 0 && (
                <div className="flex items-center gap-1.5 mb-2 mt-3">
                  <TrendingUp className="h-3 w-3 text-warning" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-warning">Train Up</span>
                </div>
              )}
              <div className="space-y-1">
                {moderate.slice(0, 3).map((item) => (
                  <QueueRow key={item.id} item={item} onLaunch={handleLaunch} />
                ))}
              </div>
            </div>
          )}

          {sorted.length > 6 && (
            <p className="text-[10px] text-muted-foreground pt-2 text-center">
              +{sorted.length - 6} more quests to conquer
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ── Individual queue row ── */
function QueueRow({ item, onLaunch }: { item: QueueItem; onLaunch: (item: QueueItem) => void }) {
  const [showTip, setShowTip] = useState(false);
  const meta = CATEGORY_META[item.weak_category] || { label: item.weak_category, emoji: "📊", Icon: Swords };
  const gap = item.threshold - item.weak_score;
  const Icon = meta.Icon;

  return (
    <div className="rounded-xl border border-border/30 bg-background/50 p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-warning" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{item.task_name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{item.job_title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-[9px] border-warning/30">
            ⚔️ Attempt {item.attempt_number}/{item.max_attempts}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px] gap-1 border-warning/30 text-warning hover:bg-warning/10"
            onClick={() => onLaunch(item)}
          >
            Battle <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Power bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground shrink-0">{meta.label}</span>
        <div className="flex-1 flex items-center gap-2">
          <Progress value={item.weak_score} className="h-1.5 flex-1" />
          <span className="text-[10px] font-bold text-destructive">{item.weak_score}%</span>
        </div>
        <span className="text-[9px] text-muted-foreground">need +{gap}%</span>
      </div>

      {/* Coaching tip toggle */}
      {item.coaching_tip && (
        <>
          <button
            onClick={() => setShowTip(!showTip)}
            className="text-[10px] text-primary/70 hover:text-primary transition-colors flex items-center gap-1"
          >
            <Lightbulb className="h-3 w-3" />
            {showTip ? "Hide battle tip" : "Show battle tip"}
          </button>
          <AnimatePresence>
            {showTip && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2 bg-primary/5 rounded-lg px-3 py-2">
                  <Lightbulb className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <p className="text-[11px] text-foreground leading-relaxed">{item.coaching_tip}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
