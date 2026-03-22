/**
 * Index — Quest-focused homepage.
 * Single Quest Focus: one dominant "Next Quest" card + kingdom progress strip.
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Swords, Shield, Map, ChevronRight, Sparkles, Flame,
  BookOpen, Crown, Star, Loader2, X, Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import OnboardingQuest from "@/components/OnboardingQuest";
import { getCastleState, type CastleTier } from "@/lib/castle-levels";
import { useChatContext, useChatViewContext } from "@/contexts/ChatContext";
import RolePreviewPanel from "@/components/RolePreviewPanel";
import type { RoleResult } from "@/components/InlineRoleCarousel";
import SkillSuggestionCards from "@/components/SkillSuggestionCards";

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
};

const TIER_COLORS: Record<CastleTier, string> = {
  ruins: "border-border/30",
  outpost: "border-emerald-500/30",
  fortress: "border-blue-500/30",
  citadel: "border-amber-500/30",
};

/* ── Component ── */

const Index = () => {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { setIsOpen: setChatDockOpen, sendMessage: chatSendMessage } = useChatContext();

  const isSignedIn = !!user;
  const userName = profile?.displayName?.split(" ")[0];
  const greeting = getGreeting();

  // Onboarding state
  const showOnboarding = isSignedIn && profile && !profile.onboardingCompleted;
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  // Data
  const [targetRoles, setTargetRoles] = useState<TargetRole[]>([]);
  const [kingdoms, setKingdoms] = useState<KingdomSummary[]>([]);
  const [nextQuest, setNextQuest] = useState<QuestTask | null>(null);
  const [questPool, setQuestPool] = useState<QuestTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RoleResult | null>(null);

  // Adaptive queue items
  const [retryQuests, setRetryQuests] = useState<{ id: string; taskName: string; jobTitle: string; weakCategory: string; weakScore: number }[]>([]);

  // View context
  const chatViewCtx = useMemo(() => ({
    page: "home" as const,
    activePanel: "quest-dashboard",
  }), []);
  useChatViewContext(chatViewCtx as any, [chatViewCtx]);

  // Load data
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      setLoading(true);

      // Get profile target roles
      const { data: profileData } = await supabase
        .from("profiles")
        .select("target_roles")
        .eq("id", user.id)
        .single();

      const roles = ((profileData as any)?.target_roles || []) as TargetRole[];
      setTargetRoles(roles);

      if (roles.length === 0) {
        setLoading(false);
        return;
      }

      const jobIds = roles.map(r => r.job_id);

      // Load tasks, sims, and bookmarks in parallel
      const [tasksRes, simsRes, queueRes] = await Promise.all([
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
      ]);

      // Build completed task set
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

      // Build quest pool from uncompleted tasks
      const allQuests: QuestTask[] = [];
      const kingdomMap = new globalThis.Map<string, KingdomSummary>();

      for (const task of (tasksRes.data || []) as any[]) {
        const job = task.jobs;
        if (!job) continue;
        const jobTitle = job.title;
        const company = job.companies?.name || null;
        const jobId = task.job_id;

        // Track kingdom
        if (!kingdomMap.has(jobId)) {
          const key = jobTitle.toLowerCase();
          const simData = simsByRole.get(key) || { completed: 0, xp: 0 };
          kingdomMap.set(jobId, {
            jobId,
            title: jobTitle,
            company,
            questsCompleted: simData.completed,
            totalQuests: 0,
            xp: simData.xp,
            augmented: job.augmented_percent || 0,
          });
        }
        const kingdom = kingdomMap.get(jobId)!;
        kingdom.totalQuests += 1;

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
    const slug = quest.jobTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    navigate(`/role/${slug}?job=${quest.jobId}&task=${encodeURIComponent(quest.clusterName)}`);
  }, [navigate]);

  const handleOpenKingdom = useCallback((kingdom: KingdomSummary) => {
    setSelectedRole({
      jobId: kingdom.jobId,
      title: kingdom.title,
      company: kingdom.company,
      augmented: kingdom.augmented,
    } as RoleResult);
  }, []);

  /* ── Onboarding ── */
  if (showOnboarding && !onboardingDismissed) {
    return (
      <OnboardingQuest
        open
        userId={user!.id}
        onComplete={async () => {
          await refreshProfile();
          setOnboardingDismissed(true);
        }}
      />
    );
  }

  /* ── Signed-out landing ── */
  if (!isSignedIn) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg"
        >
          <span className="text-5xl mb-4 block">⚔️</span>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            Level up your career
          </h1>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
            Explore kingdoms, practice quests, and build your skill territory in the age of AI
          </p>
          <SkillSuggestionCards />
          <div className="flex gap-3 justify-center mt-6">
            <Button size="lg" onClick={() => navigate("/map")}>
              <Map className="h-4 w-4 mr-2" />
              Explore Skill Map
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  /* ── Signed-in Dashboard ── */
  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            {greeting}{userName ? `, ${userName}` : ""} ⚔️
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {nextQuest
              ? "Your next quest is ready"
              : kingdoms.length > 0
                ? "All quests conquered! Explore new kingdoms"
                : "Claim your first kingdom to start questing"}
          </p>
        </motion.div>

        {/* ── Next Quest Hero Card ── */}
        {nextQuest && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card p-5 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Swords className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Next Quest</span>
                <span className="text-[10px] text-muted-foreground ml-2">+125 XP</span>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">{nextQuest.clusterName}</h2>
            <p className="text-xs text-muted-foreground mb-4">
              {nextQuest.company ? `${nextQuest.company} · ` : ""}{nextQuest.jobTitle}
            </p>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1.5">
                <Flame className="h-3 w-3 text-orange-400" />
                <span className="text-[11px] text-muted-foreground">{nextQuest.aiExposure}% AI Threat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-amber-400" />
                <span className="text-[11px] text-muted-foreground capitalize">{nextQuest.impact} impact</span>
              </div>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={() => handleStartQuest(nextQuest)}
            >
              <Swords className="h-4 w-4 mr-2" />
              Start Quest
            </Button>
          </motion.div>
        )}

        {/* ── More Quests ── */}
        {questPool.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Available Quests ({questPool.length})
            </h3>
            <div className="space-y-2">
              {questPool.slice(1, 4).map((quest, i) => (
                <button
                  key={quest.id}
                  onClick={() => handleStartQuest(quest)}
                  className="w-full flex items-center gap-3 rounded-xl border border-border/50 bg-card hover:border-primary/30 p-3 transition-all text-left group"
                >
                  <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <Shield className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{quest.clusterName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {quest.company ? `${quest.company} · ` : ""}{quest.jobTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-muted-foreground">{quest.aiExposure}%</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
              {questPool.length > 4 && (
                <p className="text-[11px] text-muted-foreground text-center pt-1">
                  +{questPool.length - 4} more quests available
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Retry Quests (Adaptive Queue) ── */}
        {retryQuests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h3 className="text-xs font-medium text-orange-400 uppercase tracking-wider mb-3">
              ⚡ Train Up — Weak Spots
            </h3>
            <div className="space-y-2">
              {retryQuests.map(q => (
                <button
                  key={q.id}
                  onClick={() => {
                    const slug = q.jobTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                    navigate(`/role/${slug}?task=${encodeURIComponent(q.taskName)}`);
                  }}
                  className="w-full flex items-center gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 hover:border-orange-500/40 p-3 transition-all text-left"
                >
                  <div className="h-8 w-8 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
                    <Flame className="h-4 w-4 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{q.taskName}</p>
                    <p className="text-[11px] text-muted-foreground">{q.jobTitle}</p>
                  </div>
                  <span className="text-[10px] text-orange-400 font-medium shrink-0">{q.weakScore}%</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Kingdom Progress Strip ── */}
        {kingdoms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Your Kingdoms
              </h3>
              <button
                onClick={() => navigate("/map")}
                className="text-[11px] text-primary hover:underline flex items-center gap-1"
              >
                <Map className="h-3 w-3" />
                Skill Map
              </button>
            </div>
            <div className="grid gap-3">
              {kingdoms.map((k, i) => {
                const castle = getCastleState(k.xp);
                const progress = k.totalQuests > 0 ? (k.questsCompleted / k.totalQuests) * 100 : 0;
                return (
                  <motion.button
                    key={k.jobId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.05 }}
                    onClick={() => handleOpenKingdom(k)}
                    className={`flex items-center gap-3 rounded-xl border ${TIER_COLORS[castle.tier]} bg-card hover:bg-card/80 p-3 transition-all text-left`}
                  >
                    <span className="text-xl shrink-0">{TIER_EMOJI[castle.tier]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{k.title}</p>
                        <span className="text-[9px] text-muted-foreground capitalize shrink-0">{castle.tier}</span>
                      </div>
                      {k.company && <p className="text-[11px] text-muted-foreground">{k.company}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Progress value={progress} className="h-1 flex-1 bg-muted/30" />
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {k.questsCompleted}/{k.totalQuests}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-primary">{k.xp} XP</p>
                      <div className="flex items-center gap-0.5 justify-end mt-0.5">
                        <Flame className="h-2.5 w-2.5 text-orange-400" />
                        <span className="text-[9px] text-muted-foreground">{k.augmented}%</span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Empty State: No Kingdoms ── */}
        {kingdoms.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-border/50 bg-card p-6 text-center"
          >
            <span className="text-4xl block mb-3">🏰</span>
            <h2 className="text-lg font-semibold text-foreground mb-2">No Kingdoms Yet</h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Explore the Skill Map to discover roles and claim your first kingdom
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/map")}>
                <Map className="h-4 w-4 mr-2" />
                Skill Map
              </Button>
              <Button onClick={() => { setChatDockOpen(true); chatSendMessage("Help me find my first kingdom"); }}>
                <Sparkles className="h-4 w-4 mr-2" />
                Ask AI Coach
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Quick Actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3 justify-center pb-8"
        >
          <button
            onClick={() => navigate("/map")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/50 bg-card hover:bg-card/80 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
          >
            <Map className="h-3.5 w-3.5" />
            Skill Map
          </button>
          <button
            onClick={() => navigate("/leaderboard")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/50 bg-card hover:bg-card/80 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
          >
            <Crown className="h-3.5 w-3.5" />
            Leaderboard
          </button>
        </motion.div>
      </div>

      {/* ── Role Preview Overlay ── */}
      <AnimatePresence>
        {selectedRole && (
          <motion.div
            key="role-preview"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 bg-background"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ background: `hsl(${(selectedRole.title.length * 47) % 360}, 55%, 45%)` }}
                >
                  {(selectedRole.company || selectedRole.title)[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground leading-tight">{selectedRole.title}</h2>
                  {selectedRole.company && (
                    <p className="text-xs text-muted-foreground">{selectedRole.company}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedRole(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all active:scale-[0.97]"
              >
                <X className="h-3.5 w-3.5" />
                Close
              </button>
            </div>
            <div className="h-[calc(100%-3.25rem)] overflow-hidden">
              <RolePreviewPanel
                role={selectedRole}
                onClose={() => setSelectedRole(null)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
