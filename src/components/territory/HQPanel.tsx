/**
 * HQPanel — Territory HQ dashboard inside the map side panel.
 * Shows next quest, available quests, retry quests, and kingdom progress.
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

const TIER_COLORS: Record<CastleTier, string> = {
  ruins: "border-border/30",
  outpost: "border-emerald-500/30",
  fortress: "border-blue-500/30",
  citadel: "border-amber-500/30",
  grandmaster: "border-purple-500/30",
};

interface HQPanelProps {
  onSelectRole?: (role: RoleResult) => void;
}

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
        <h2 className="text-lg font-display font-bold text-foreground">
          {greeting}{userName ? `, ${userName}` : ""} ⚔️
        </h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {nextQuest
            ? "Your next quest is ready"
            : kingdoms.length > 0
              ? "All quests conquered! Explore new kingdoms"
              : "Claim your first kingdom to start"}
        </p>
      </div>

      {/* Next Quest */}
      {nextQuest && (
        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <Swords className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Next Quest</span>
              <span className="text-[10px] text-muted-foreground ml-2">+125 XP</span>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-0.5">{nextQuest.clusterName}</h3>
          <p className="text-[11px] text-muted-foreground mb-3">
            {nextQuest.company ? `${nextQuest.company} · ` : ""}{nextQuest.jobTitle}
          </p>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-400" />
              <span className="text-[10px] text-muted-foreground">{nextQuest.aiExposure}% Threat</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-400" />
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
          <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Available Quests ({questPool.length})
          </h4>
          <div className="space-y-1.5">
            {questPool.slice(1, 4).map((quest) => (
              <button
                key={quest.id}
                onClick={() => handleStartQuest(quest)}
                className="w-full flex items-center gap-2.5 rounded-lg border border-border/50 bg-card hover:border-primary/30 p-2.5 transition-all text-left group"
              >
                <div className="h-7 w-7 rounded-md bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
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
          <h4 className="text-[10px] font-medium text-orange-400 uppercase tracking-wider mb-2">
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
                className="w-full flex items-center gap-2.5 rounded-lg border border-orange-500/20 bg-orange-500/5 hover:border-orange-500/40 p-2.5 transition-all text-left"
              >
                <div className="h-7 w-7 rounded-md bg-orange-500/15 flex items-center justify-center shrink-0">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{q.taskName}</p>
                  <p className="text-[10px] text-muted-foreground">{q.jobTitle}</p>
                </div>
                <span className="text-[10px] text-orange-400 font-medium shrink-0">{q.weakScore}%</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Kingdoms */}
      {kingdoms.length > 0 && (
        <div>
          <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Your Kingdoms
          </h4>
          <div className="space-y-1.5">
            {kingdoms.map((k) => {
              const castle = getCastleState(k.xp);
              const progress = k.totalQuests > 0 ? (k.questsCompleted / k.totalQuests) * 100 : 0;
              return (
                <button
                  key={k.jobId}
                  onClick={() => handleOpenKingdom(k)}
                  className={`w-full flex items-center gap-2.5 rounded-lg border ${TIER_COLORS[castle.tier]} bg-card hover:bg-card/80 p-2.5 transition-all text-left`}
                >
                  <span className="text-lg shrink-0">{TIER_EMOJI[castle.tier]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-foreground truncate">{k.title}</p>
                      <span className="text-[9px] text-muted-foreground capitalize shrink-0">{castle.tier}</span>
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
                    <p className="text-[11px] font-semibold text-primary">{k.xp} XP</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {kingdoms.length === 0 && !loading && (
        <div className="rounded-xl border border-border/50 bg-card p-5 text-center">
          <span className="text-3xl block mb-2">🏰</span>
          <h3 className="text-sm font-semibold text-foreground mb-1.5">No Kingdoms Yet</h3>
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
