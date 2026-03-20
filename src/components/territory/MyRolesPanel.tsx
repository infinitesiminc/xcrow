/**
 * MyRolesPanel — slide-down panel showing saved (bookmarked) and practiced roles.
 * Toggled from CompactHUD. Provides quick actions: practice, check readiness.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Play, ChevronRight, Trophy, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface SavedRole {
  job_title: string;
  company: string | null;
  augmented_percent: number | null;
  automation_risk_percent: number | null;
}

interface PracticedRole {
  job_title: string;
  task_name: string;
  company: string | null;
  completed_at: string;
  correct_answers: number;
  total_questions: number;
}

interface MyRolesPanelProps {
  open: boolean;
  onClose: () => void;
  onAskChat: (prompt: string) => void;
}

export default function MyRolesPanel({ open, onClose, onAskChat }: MyRolesPanelProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"saved" | "practiced">("saved");
  const [savedRoles, setSavedRoles] = useState<SavedRole[]>([]);
  const [practicedRoles, setPracticedRoles] = useState<PracticedRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !open) return;
    setLoading(true);

    Promise.all([
      supabase
        .from("bookmarked_roles")
        .select("job_title, company, augmented_percent, automation_risk_percent")
        .eq("user_id", user.id)
        .order("bookmarked_at", { ascending: false })
        .limit(20),
      supabase
        .from("completed_simulations")
        .select("job_title, task_name, company, completed_at, correct_answers, total_questions")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(30),
    ]).then(([savedRes, practicedRes]) => {
      setSavedRoles((savedRes.data as SavedRole[]) || []);
      setPracticedRoles((practicedRes.data as PracticedRole[]) || []);
      setLoading(false);
    });
  }, [user, open]);

  // Deduplicate practiced roles by job_title
  const uniquePracticed = practicedRoles.reduce<
    (PracticedRole & { taskCount: number; avgScore: number })[]
  >((acc, r) => {
    const existing = acc.find(
      (a) => a.job_title === r.job_title && a.company === r.company
    );
    if (existing) {
      existing.taskCount += 1;
      existing.avgScore = Math.round(
        (existing.avgScore * (existing.taskCount - 1) +
          (r.total_questions > 0
            ? Math.round((r.correct_answers / r.total_questions) * 100)
            : 0)) /
          existing.taskCount
      );
    } else {
      acc.push({
        ...r,
        taskCount: 1,
        avgScore:
          r.total_questions > 0
            ? Math.round((r.correct_answers / r.total_questions) * 100)
            : 0,
      });
    }
    return acc;
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden border-b border-border bg-card"
        >
          <div className="px-4 py-3 max-h-[320px] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                <button
                  onClick={() => setTab("saved")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    tab === "saved"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bookmark className="h-3 w-3" />
                  Saved ({savedRoles.length})
                </button>
                <button
                  onClick={() => setTab("practiced")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    tab === "practiced"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Trophy className="h-3 w-3" />
                  Practiced ({uniquePracticed.length})
                </button>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : tab === "saved" ? (
              savedRoles.length === 0 ? (
                <div className="text-center py-6">
                  <Bookmark className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No saved roles yet. Ask the chat to find roles for you.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {savedRoles.map((role, i) => (
                    <motion.div
                      key={`${role.job_title}-${role.company}-${i}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.3 }}
                      className="group flex items-center gap-3 rounded-lg border border-border/40 bg-background/50 px-3 py-2.5 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                      onClick={() =>
                        onAskChat(
                          `How ready am I for ${role.job_title}${role.company ? ` at ${role.company}` : ""}?`
                        )
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {role.job_title}
                        </p>
                        {role.company && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {role.company}
                          </p>
                        )}
                      </div>
                      {role.augmented_percent != null && (
                        <Badge
                          variant="outline"
                          className="text-[9px] shrink-0 border-primary/20 text-primary"
                        >
                          {role.augmented_percent}% augmented
                        </Badge>
                      )}
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                    </motion.div>
                  ))}
                </div>
              )
            ) : uniquePracticed.length === 0 ? (
              <div className="text-center py-6">
                <Play className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  No practiced roles yet. Run a simulation to start building skills.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {uniquePracticed.map((role, i) => (
                  <motion.div
                    key={`${role.job_title}-${role.company}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    className="group flex items-center gap-3 rounded-lg border border-border/40 bg-background/50 px-3 py-2.5 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                    onClick={() =>
                      onAskChat(
                        `How ready am I for ${role.job_title}${role.company ? ` at ${role.company}` : ""}? What else should I practice?`
                      )
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {role.job_title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {role.company ? `${role.company} · ` : ""}
                        {role.taskCount} task{role.taskCount > 1 ? "s" : ""} practiced
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${
                            role.avgScore >= 70
                              ? "text-success"
                              : role.avgScore >= 50
                              ? "text-warning"
                              : "text-destructive"
                          }`}
                        >
                          {role.avgScore}%
                        </p>
                        <p className="text-[8px] text-muted-foreground uppercase tracking-wider">
                          Avg score
                        </p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
