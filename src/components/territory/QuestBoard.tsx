/**
 * QuestBoard — RPG-themed panel showing suggested next quests.
 * Pulls from adaptive queue (retry quests) + bookmarked roles (kingdom goals).
 */
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Swords, Shield, Flame, Star, ChevronRight, Sparkles, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface QueueItem {
  id: string;
  taskName: string;
  jobTitle: string;
  weakCategory: string;
  weakScore: number;
  coachingTip: string | null;
  attemptNumber: number;
}

interface BookmarkedRole {
  jobTitle: string;
  company: string | null;
  augmentedPercent: number | null;
  automationRiskPercent: number | null;
}

const CATEGORY_ICONS: Record<string, typeof Swords> = {
  tool_awareness: Swords,
  human_value_add: Shield,
  adaptive_thinking: Flame,
  domain_judgment: Star,
};

const CATEGORY_LABELS: Record<string, string> = {
  tool_awareness: "Tool Mastery",
  human_value_add: "Human Edge",
  adaptive_thinking: "Adaptation",
  domain_judgment: "Domain Lore",
};

const DIFFICULTY_COLORS = [
  "from-emerald-500/20 to-emerald-600/5",
  "from-amber-500/20 to-amber-600/5",
  "from-rose-500/20 to-rose-600/5",
];

export default function QuestBoard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkedRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      supabase
        .from("simulation_queue")
        .select("id, task_name, job_title, weak_category, weak_score, coaching_tip, attempt_number")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("bookmarked_roles")
        .select("job_title, company, augmented_percent, automation_risk_percent")
        .eq("user_id", user.id)
        .order("bookmarked_at", { ascending: false })
        .limit(4),
    ]).then(([qRes, bRes]) => {
      setQueue(
        (qRes.data || []).map((q: any) => ({
          id: q.id,
          taskName: q.task_name,
          jobTitle: q.job_title,
          weakCategory: q.weak_category,
          weakScore: q.weak_score,
          coachingTip: q.coaching_tip,
          attemptNumber: q.attempt_number,
        }))
      );
      setBookmarks(
        (bRes.data || []).map((b: any) => ({
          jobTitle: b.job_title,
          company: b.company,
          augmentedPercent: b.augmented_percent,
          automationRiskPercent: b.automation_risk_percent,
        }))
      );
      setLoading(false);
    });
  }, [user]);

  if (loading) return null;
  if (queue.length === 0 && bookmarks.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Retry quests */}
      {queue.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Target className="h-3.5 w-3.5 text-warning" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-warning">
              Active Quests
            </h3>
          </div>
          <div className="space-y-2">
            {queue.slice(0, 3).map((q, i) => {
              const Icon = CATEGORY_ICONS[q.weakCategory] || Star;
              const diffColor = DIFFICULTY_COLORS[Math.min(q.attemptNumber - 1, 2)];
              return (
                <motion.button
                  key={q.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => navigate(`/analysis?title=${encodeURIComponent(q.jobTitle)}&task=${encodeURIComponent(q.taskName)}`)}
                  className={`w-full text-left rounded-xl border border-border/40 bg-gradient-to-r ${diffColor} p-3 hover:border-primary/40 transition-all group`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-background/60 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-warning" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{q.taskName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {CATEGORY_LABELS[q.weakCategory] || q.weakCategory} · Attempt {q.attemptNumber}
                      </p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Kingdom goals */}
      {bookmarks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
              Your Kingdoms
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {bookmarks.map((b, i) => {
              const hue = (b.jobTitle.length * 47) % 360;
              return (
                <motion.button
                  key={`${b.jobTitle}-${b.company}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => navigate(`/analysis?title=${encodeURIComponent(b.jobTitle)}${b.company ? `&company=${encodeURIComponent(b.company)}` : ""}`)}
                  className="text-left rounded-xl border border-border/40 bg-card/50 p-3 hover:border-primary/30 transition-all group"
                >
                  <div
                    className="w-6 h-6 rounded-md mb-2 flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: `hsl(${hue}, 55%, 42%)` }}
                  >
                    {b.jobTitle[0]?.toUpperCase()}
                  </div>
                  <p className="text-xs font-semibold text-foreground truncate">{b.jobTitle}</p>
                  {b.company && (
                    <p className="text-[10px] text-muted-foreground truncate">{b.company}</p>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
