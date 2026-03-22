/**
 * HQPanel — Territory HQ dashboard inside the map side panel.
 * Dark Fantasy RPG styled with stone surfaces, Cinzel headings, filigree accents.
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Swords, Shield, ChevronRight, Flame, Zap,
  Sparkles, Crown, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getCastleState, type CastleTier } from "@/lib/castle-levels";
import { useChatContext } from "@/contexts/ChatContext";
import XcrowLoader from "@/components/XcrowLoader";
import type { RoleResult } from "@/components/InlineRoleCarousel";

/* ── Types ── */

interface TargetRole {
  job_id: string;
  title: string;
  company: string | null;
}

interface QuestTask {
  id: string;
  clusterName: string;
  jobTitle: string;
  company: string | null;
  jobId: string;
  aiExposure: number;
  impact: string;
  aiState: string;
}

interface KingdomSummary {
  jobId: string;
  title: string;
  company: string | null;
  questsCompleted: number;
  totalQuests: number;
  xp: number;
  augmented: number;
}

/* ── Helpers ── */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning quest awaits";
  if (hour < 18) return "Your territory grows";
  return "Night raid ready";
}

const TIER_EMOJI: Record<CastleTier, string> = {
  ruins: "🏚️",
  outpost: "🏕️",
  fortress: "🏰",
  citadel: "👑",
  grandmaster: "✨",
};

interface HQPanelProps {
  onSelectRole?: (role: RoleResult) => void;
}

/* ── Shared fantasy card style ── */
const fantasyCard = {
  background: "hsl(var(--surface-stone))",
  border: "1px solid hsl(var(--filigree) / 0.2)",
  boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 2px 6px hsl(var(--emboss-shadow))",
};

const fantasySectionHeader = "text-[10px] uppercase tracking-[0.12em] text-muted-foreground";
const fantasySectionHeaderStyle = { fontFamily: "'Cinzel', serif" };

export default function HQPanel({ onSelectRole }: HQPanelProps) {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { setIsOpen: setChatDockOpen, sendMessage: chatSendMessage } = useChatContext();

  const userName = profile?.displayName?.split(" ")[0];
  const greeting = getGreeting();

  const [kingdoms, setKingdoms] = useState<KingdomSummary[]>([]);
  const [nextQuest, setNextQuest] = useState<QuestTask | null>(null);
  const [questPool, setQuestPool] = useState<QuestTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryQuests, setRetryQuests] = useState<{ id: string; taskName: string; jobTitle: string; weakCategory: string; weakScore: number }[]>([]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      setLoading(true);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("target_roles")
        .eq("id", user.id)
        .single();

      const roles = ((profileData as any)?.target_roles || []) as TargetRole[];

      if (roles.length === 0) {
        setLoading(false);
        return;
      }

      const jobIds = roles.map(r => r.job_id);

      const [tasksRes, simsRes, queueRes, jobsRes] = await Promise.all([
        supabase
          .from("job_task_clusters")
          .select("id, cluster_name, job_id, ai_exposure_score, impact_level, ai_state, jobs(title, companies(name), augmented_percent)")
          .in("job_id", jobIds)
          .order("sort_order"),
        supabase
          .from("completed_simulations")
          .select("task_name, job_title, correct_answers, total_questions")
          .eq("user_id", user.id),
        supabase
          .from("simulation_queue")
          .select("id, task_name, job_title, weak_category, weak_score")
          .eq("user_id", user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("jobs")
          .select("id, title, augmented_percent, companies(name)")
          .in("id", jobIds),
      ]);

      const completedTasks = new Set<string>();
      const simsByRole = new globalThis.Map<string, { completed: number; xp: number }>();
      for (const sim of (simsRes.data || []) as any[]) {
        completedTasks.add(`${sim.task_name}|${sim.job_title}`.toLowerCase());
        const key = sim.job_title.toLowerCase();
        const prev = simsByRole.get(key) || { completed: 0, xp: 0 };
        prev.completed += 1;
        prev.xp += (sim.correct_answers || 0) * 25;
        simsByRole.set(key, prev);
      }

      const kingdomMap = new globalThis.Map<string, KingdomSummary>();
      for (const job of (jobsRes.data || []) as any[]) {
        const simData = simsByRole.get(job.title.toLowerCase()) || { completed: 0, xp: 0 };
        kingdomMap.set(job.id, {
          jobId: job.id,
          title: job.title,
          company: job.companies?.name || null,
          questsCompleted: simData.completed,
          totalQuests: 0,
          xp: simData.xp,
          augmented: job.augmented_percent || 0,
        });
      }
      for (const role of roles) {
        if (!kingdomMap.has(role.job_id)) {
          kingdomMap.set(role.job_id, {
            jobId: role.job_id,
            title: role.title,
            company: role.company,
            questsCompleted: 0,
            totalQuests: 0,
            xp: 0,
            augmented: 0,
          });
        }
      }

      const allQuests: QuestTask[] = [];
      for (const task of (tasksRes.data || []) as any[]) {
        const job = task.jobs;
        if (!job) continue;
        const jobTitle = job.title;
        const company = job.companies?.name || null;
        const jobId = task.job_id;
        const kingdom = kingdomMap.get(jobId);
        if (kingdom) kingdom.totalQuests += 1;

        const taskKey = `${task.cluster_name}|${jobTitle}`.toLowerCase();
        if (!completedTasks.has(taskKey)) {
          allQuests.push({
            id: task.id,
            clusterName: task.cluster_name,
            jobTitle,
            company,
            jobId,
            aiExposure: task.ai_exposure_score || 50,
            impact: task.impact_level || "medium",
            aiState: task.ai_state || "human_ai",
          });
        }
      }

      setKingdoms(Array.from(kingdomMap.values()));
      setQuestPool(allQuests);
      setNextQuest(allQuests[0] || null);
      setRetryQuests((queueRes.data || []) as any);
      setLoading(false);
    })();
  }, [user]);

  const handleStartQuest = useCallback((quest: QuestTask) => {
    const slug = quest.jobTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    navigate(`/role/${slug}?job=${quest.jobId}&task=${encodeURIComponent(quest.clusterName)}`);
  }, [navigate]);

  const handleOpenKingdom = useCallback((k: KingdomSummary) => {
    onSelectRole?.({
      jobId: k.jobId,
      title: k.title,
      company: k.company,
      augmented: k.augmented,
    } as RoleResult);
  }, [onSelectRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <XcrowLoader title="Loading HQ…" size="sm" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
      {/* Greeting */}
      <div className="text-center">
        <h2
          className="text-lg font-bold text-foreground"
          style={{
            fontFamily: "'Cinzel', serif",
            textShadow: "0 0 16px hsl(var(--filigree-glow) / 0.3)",
          }}
        >
          {greeting}{userName ? `, ${userName}` : ""} 🏰
        </h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {nextQuest
            ? "Your next quest is ready"
            : kingdoms.length > 0
              ? "All quests conquered! Explore new kingdoms"
              : "Claim your first kingdom to start"}
        </p>
      </div>

      {/* Next Quest — hero card */}
      {nextQuest && (
        <div
          className="rounded-xl p-4"
          style={{
            ...fantasyCard,
            borderColor: "hsl(var(--primary) / 0.3)",
            background: "linear-gradient(135deg, hsl(var(--surface-stone)), hsl(var(--primary) / 0.06))",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(var(--primary) / 0.15)" }}
            >
              <Swords className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <span
                className="text-[10px] font-medium uppercase tracking-[0.12em]"
                style={{ color: "hsl(var(--filigree-glow))", fontFamily: "'Cinzel', serif" }}
              >
                Next Quest
              </span>
              <span className="text-[10px] text-muted-foreground ml-2">+125 XP</span>
            </div>
          </div>
          <h3
            className="text-sm font-semibold text-foreground mb-0.5"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {nextQuest.clusterName}
          </h3>
          <p className="text-[11px] text-muted-foreground mb-3">
            {nextQuest.company ? `${nextQuest.company} · ` : ""}{nextQuest.jobTitle}
          </p>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1">
              <Flame className="h-3 w-3" style={{ color: "hsl(var(--territory-leadership))" }} />
              <span className="text-[10px] text-muted-foreground">{nextQuest.aiExposure}% Threat</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" style={{ color: "hsl(var(--filigree-glow))" }} />
              <span className="text-[10px] text-muted-foreground capitalize">{nextQuest.impact}</span>
            </div>
          </div>
          <Button className="w-full" size="sm" onClick={() => handleStartQuest(nextQuest)}>
            <Swords className="h-3.5 w-3.5 mr-1.5" />
            Start Quest
          </Button>
        </div>
      )}

      {/* More Quests */}
      {questPool.length > 1 && (
        <div>
          <h4 className={fantasySectionHeader} style={fantasySectionHeaderStyle}>
            Available Quests ({questPool.length})
          </h4>
          <div className="space-y-1.5 mt-2">
            {questPool.slice(1, 4).map((quest) => (
              <button
                key={quest.id}
                onClick={() => handleStartQuest(quest)}
                className="w-full flex items-center gap-2.5 rounded-lg p-2.5 transition-all text-left group"
                style={{
                  ...fantasyCard,
                }}
              >
                <div
                  className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 transition-colors"
                  style={{ background: "hsl(var(--muted) / 0.5)" }}
                >
                  <Shield className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{quest.clusterName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {quest.company ? `${quest.company} · ` : ""}{quest.jobTitle}
                  </p>
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Retry Quests */}
      {retryQuests.length > 0 && (
        <div>
          <h4
            className="text-[10px] uppercase tracking-[0.12em] mb-2"
            style={{ color: "hsl(var(--territory-leadership))", fontFamily: "'Cinzel', serif" }}
          >
            ⚡ Train Up — Weak Spots
          </h4>
          <div className="space-y-1.5">
            {retryQuests.map(q => (
              <button
                key={q.id}
                onClick={() => {
                  const slug = q.jobTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                  navigate(`/role/${slug}?task=${encodeURIComponent(q.taskName)}`);
                }}
                className="w-full flex items-center gap-2.5 rounded-lg p-2.5 transition-all text-left"
                style={{
                  background: "hsl(var(--territory-leadership) / 0.06)",
                  border: "1px solid hsl(var(--territory-leadership) / 0.2)",
                  boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))",
                }}
              >
                <div
                  className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: "hsl(var(--territory-leadership) / 0.15)" }}
                >
                  <Flame className="h-3.5 w-3.5" style={{ color: "hsl(var(--territory-leadership))" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{q.taskName}</p>
                  <p className="text-[10px] text-muted-foreground">{q.jobTitle}</p>
                </div>
                <span className="text-[10px] font-medium shrink-0" style={{ color: "hsl(var(--territory-leadership))" }}>{q.weakScore}%</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Kingdoms */}
      {kingdoms.length > 0 && (
        <div>
          <h4 className={fantasySectionHeader} style={fantasySectionHeaderStyle}>
            Your Kingdoms
          </h4>
          <div className="space-y-1.5 mt-2">
            {kingdoms.map((k) => {
              const castle = getCastleState(k.xp);
              const progress = k.totalQuests > 0 ? (k.questsCompleted / k.totalQuests) * 100 : 0;
              return (
                <button
                  key={k.jobId}
                  onClick={() => handleOpenKingdom(k)}
                  className="w-full flex items-center gap-2.5 rounded-lg p-2.5 transition-all text-left"
                  style={fantasyCard}
                >
                  <span className="text-lg shrink-0">{TIER_EMOJI[castle.tier]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-foreground truncate">{k.title}</p>
                      <span
                        className="text-[9px] capitalize shrink-0"
                        style={{ color: "hsl(var(--filigree))" }}
                      >
                        {castle.tier}
                      </span>
                    </div>
                    {k.company && <p className="text-[10px] text-muted-foreground">{k.company}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={progress} className="h-1 flex-1 bg-muted/30" />
                      <span className="text-[9px] text-muted-foreground shrink-0">
                        {k.questsCompleted}/{k.totalQuests}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="text-[11px] font-semibold"
                      style={{ color: "hsl(var(--filigree-glow))" }}
                    >
                      {k.xp} XP
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {kingdoms.length === 0 && !loading && (
        <div
          className="rounded-xl p-5 text-center"
          style={fantasyCard}
        >
          <span className="text-3xl block mb-2">🏰</span>
          <h3
            className="text-sm font-semibold text-foreground mb-1.5"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            No Kingdoms Yet
          </h3>
          <p className="text-[11px] text-muted-foreground mb-3">
            Ask the AI Coach to discover roles and claim your first kingdom
          </p>
          <Button size="sm" onClick={() => { setChatDockOpen(true); chatSendMessage("Help me find my first kingdom"); }}>
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Ask AI Coach
          </Button>
        </div>
      )}
    </div>
  );
}
