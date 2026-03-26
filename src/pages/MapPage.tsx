/**
 * MapPage — Split-panel layout: left panel (Forge/Kingdoms/Allies) + right map.
 */
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import type { FutureSkill } from "@/hooks/use-future-skills";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { X, Users, BookOpen, ChevronDown, ChevronUp, Save } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import BossBanner from "@/components/territory/BossBanner";
import SimulatorModal from "@/components/SimulatorModal";
import type { SimLaunchRequest, PromptLabRequest } from "@/components/territory/SkillLaunchCard";
import PromptLab from "@/components/sim/PromptLab";
import { preloadTerritoryImages } from "@/lib/territory-hero-images";
import CreditGate from "@/components/CreditGate";
import { Coins } from "lucide-react";
import { useSimCheckpoints, type SimCheckpoint } from "@/hooks/use-sim-checkpoints";

/** IDs of skills where user has completed a L2 boss battle */
type Level2CompletedIds = Set<string>;

import { useFutureSkills } from "@/hooks/use-future-skills";
import FutureTerritoryMap from "@/components/territory/FutureTerritoryMap";
import QuestJournal from "@/components/territory/QuestJournal";
import MapIntroGuide from "@/components/territory/MapIntroGuide";
import { getLevel, levelProgress } from "@/lib/skill-map";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useChatContext, useChatViewContext } from "@/contexts/ChatContext";
import RolePreviewPanel from "@/components/RolePreviewPanel";
import type { RoleResult } from "@/components/InlineRoleCarousel";
import type { EdgeContext } from "@/components/HumanEdgesCard";

import CompactHUD from "@/components/territory/CompactHUD";
import QuestTrackerStrip from "@/components/territory/QuestTrackerStrip";

import AlliesPanel from "@/components/territory/AlliesPanel";
import CodexPanel from "@/components/territory/CodexPanel";
import ToolDetailCard from "@/components/territory/ToolDetailCard";
import ToolsPanel from "@/components/territory/ToolsPanel";


import { useSkills } from "@/hooks/use-skills";
import SkillDetailDrawer from "@/components/territory/SkillDetailDrawer";
import { useFriends } from "@/hooks/use-friends";
import {
  SKILL_TAXONOMY,
  aggregateSkillXP,
  type SkillCategory,
  type SkillXP,
  type SimRecord,
  type TaxonomySkill,
} from "@/lib/skill-map";
import { calculateGrowth, type GrowthDimensions } from "@/lib/skill-growth";
import { useScoutMission } from "@/hooks/use-scout-mission";
/** Aggregated growth data per canonical future skill */
export interface CanonicalSkillGrowth {
  level1Xp: number;
  level2Xp: number;
  level1Sims: number;
  level2Sims: number;
  growth: GrowthDimensions;
}

/* ── helpers ── */

function buildEmptySkills(taxonomy: TaxonomySkill[]): SkillXP[] {
  return taxonomy.map(t => ({
    id: t.id,
    name: t.name,
    category: t.category,
    xp: 0,
    level: "Novice" as const,
    levelIndex: 0,
    progress: 0,
    aiExposure: t.aiExposure,
    humanEdge: t.humanEdge,
    taskCount: 0,
  }));
}

/** Runic SVG icon paths for the 3 tabs */
const JournalRuneIcon = ({ size = 22, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg viewBox="-8 -8 16 16" width={size} height={size} fill="none" stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M-4-6 L4-6 L5-4 L5 5 L-5 5 L-5-4Z" />
    <path d="M-3-3 L3-3 M-3 0 L1 0 M-3 2.5 L2 2.5" />
    <circle cx="3" cy="2" r="1.5" />
    <path d="M-5-6 L-5 5" strokeWidth={1.8} />
  </svg>
);

const CodexRuneIcon = ({ size = 22, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg viewBox="-8 -8 16 16" width={size} height={size} fill="none" stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="-5" y="-6" width="10" height="12" rx="1" />
    <path d="M-3-3 L3-3 M-3 0 L3 0 M-3 3 L1 3" />
    <path d="M-5-6 L-5 6" strokeWidth={1.8} />
  </svg>
);

const AlliesRuneIcon = ({ size = 22, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg viewBox="-8 -8 16 16" width={size} height={size} fill="none" stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="-3" cy="-3" r="2" />
    <circle cx="3" cy="-3" r="2" />
    <path d="M-6 4 Q-3 0 0 2 Q3 0 6 4" />
    <circle cx="0" cy="-1" r="1.5" />
  </svg>
);

const ToolsRuneIcon = ({ size = 22, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg viewBox="-8 -8 16 16" width={size} height={size} fill="none" stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M-2-6 L2-6 L3-4 L3 2 L0 6 L-3 2 L-3-4Z" />
    <circle cx="0" cy="-2" r="1.5" />
    <path d="M-1.5 1 L1.5 1 M0 1 L0 4" />
  </svg>
);

const TAB_ITEMS = [
  { key: "table" as const, RuneIcon: JournalRuneIcon, label: "Journal" },
  { key: "codex" as const, RuneIcon: CodexRuneIcon, label: "Codex" },
  { key: "allies" as const, RuneIcon: AlliesRuneIcon, label: "Allies" },
] as const;

type PendingSimLaunch = SimLaunchRequest & { taskName?: string };

const MapPage = () => {
  const navigate = useNavigate();
  const { profile, user, isSuperAdmin, loading: authLoading } = useAuth();
  const { skills: dbSkills } = useSkills();
  const { futureSkills } = useFutureSkills();
  const mission = useScoutMission();

  const taxonomy: TaxonomySkill[] = useMemo(() =>
    dbSkills.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      keywords: s.keywords,
      aiExposure: s.aiExposure,
      humanEdge: s.humanEdge,
    })),
    [dbSkills]
  );

  const [selectedRole, setSelectedRole] = useState<RoleResult | null>(null);
  const [selectedKingdomCtx, setSelectedKingdomCtx] = useState<{ tier?: string; xp?: number; questsCompleted?: number; totalQuests?: number } | null>(null);
  const [activeEdge, setActiveEdge] = useState<EdgeContext | null>(null);
  const [activeTab, setActiveTab] = useState<"table" | "codex" | "allies" | "tools">("table");
  const [panelCollapsed, setPanelCollapsed] = useState(true);
  const [mapFocusSkillId, setMapFocusSkillId] = useState<string | null>(null);
  const [forgeFocusSkillId, setForgeFocusSkillId] = useState<string | null>(null);
  
  const [drawerSkill, setDrawerSkill] = useState<FutureSkill | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [realSkills, setRealSkills] = useState<SkillXP[]>([]);
  const [targetSkillIds, setTargetSkillIds] = useState<Set<string>>(new Set());
  const [level2SkillIds, setLevel2SkillIds] = useState<Set<string>>(new Set());
  const [level2CompletedIds, setLevel2CompletedIds] = useState<Level2CompletedIds>(new Set());
  const [skillGrowthMap, setSkillGrowthMap] = useState<Map<string, CanonicalSkillGrowth>>(new Map());
  const [bossCount, setBossCount] = useState(0);
  const [avgDegreeLevel, setAvgDegreeLevel] = useState(1);
  const { toast } = useToast();
  const hasShownBossToast = useRef(false);

  // In-place sim overlay state — gated by credits
  const [activeSim, setActiveSim] = useState<PendingSimLaunch | null>(null);
  const [pendingSimReq, setPendingSimReq] = useState<PendingSimLaunch | null>(null);
  const handleLaunchSim = useCallback((req: PendingSimLaunch) => setPendingSimReq(req), []);
  const handleCloseSim = useCallback(() => setActiveSim(null), []);

  // Saved checkpoints
  const { loadCheckpoints } = useSimCheckpoints();
  const [savedCheckpoints, setSavedCheckpoints] = useState<SimCheckpoint[]>([]);
  useEffect(() => {
    if (!user) return;
    loadCheckpoints().then(setSavedCheckpoints);
  }, [user, loadCheckpoints, activeSim]); // reload after sim closes

  // Prompt Lab overlay state
  const [activePromptLab, setActivePromptLab] = useState<PromptLabRequest | null>(null);
  const handleLaunchPromptLab = useCallback((req: PromptLabRequest) => setActivePromptLab(req), []);
  const handleClosePromptLab = useCallback(() => setActivePromptLab(null), []);

  const displaySkills = useMemo(
    () => (realSkills.length > 0 ? realSkills : buildEmptySkills(taxonomy)),
    [realSkills, taxonomy]
  );

  const isSignedIn = !!user;
  const userName = profile?.displayName?.split(" ")[0];

  const { onRolesFoundRef, onRoleSelectRef, sendMessage: chatSendMessage, setIsOpen: setChatDockOpen } = useChatContext();
  const { updatePresence, goOffline, pendingCount, unreadCount } = useFriends();

  // Preload territory backdrop images on mount
  useEffect(() => { preloadTerritoryImages(); }, []);

  // Wire events from SkillDetailDrawer
  useEffect(() => {
    const handleLaunchFromDrawer = (e: Event) => {
      const { skillId, skillName, level, masteryTier } = (e as CustomEvent).detail;
      handleLaunchSim({ jobTitle: skillName, taskName: skillName, skillId, level, masteryTier });
    };
    const handleOpenDrawer = (e: Event) => {
      const { skillId } = (e as CustomEvent).detail;
      const skill = futureSkills.find(s => s.id === skillId);
      if (skill) { setDrawerSkill(skill); setDrawerOpen(true); }
    };
    window.addEventListener("launch_skill_sim", handleLaunchFromDrawer);
    window.addEventListener("open_skill_drawer", handleOpenDrawer);
    return () => {
      window.removeEventListener("launch_skill_sim", handleLaunchFromDrawer);
      window.removeEventListener("open_skill_drawer", handleOpenDrawer);
    };
  }, [futureSkills, handleLaunchSim]);

  useEffect(() => {
    onRoleSelectRef.current = (role: RoleResult) => { setSelectedRole(role); };
    return () => { onRoleSelectRef.current = null; };
  }, [onRoleSelectRef]);

  useEffect(() => {
    if (!user) return;
    updatePresence("Exploring the Map");
    const interval = setInterval(() => updatePresence("Exploring the Map"), 60_000);
    return () => { clearInterval(interval); goOffline(); };
  }, [user, updatePresence, goOffline]);

  // Load real skills + target roles + Level 2 unlock detection
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [simsRes, profileRes] = await Promise.all([
        supabase
          .from("completed_simulations")
          .select("task_name, job_title, skills_earned, tool_awareness_score, human_value_add_score, adaptive_thinking_score, domain_judgment_score, sim_level")
          .eq("user_id", user.id),
        supabase
          .from("profiles")
          .select("target_roles")
          .eq("id", user.id)
          .single(),
      ]);

      const sims = (simsRes.data || []) as (SimRecord & { sim_level?: number })[];
      setRealSkills(aggregateSkillXP(sims, taxonomy));

      const growthAcc = new Map<string, { l1Xp: number; l2Xp: number; l1Sims: number; l2Sims: number; toolScores: number[]; adaptiveScores: number[]; humanScores: number[]; domainScores: number[] }>();
      for (const sim of sims) {
        const earned = sim.skills_earned as { skill_id: string; xp: number }[] | null;
        if (!Array.isArray(earned)) continue;
        const lvl = (sim as any).sim_level ?? 1;
        for (const se of earned) {
          let entry = growthAcc.get(se.skill_id);
          if (!entry) {
            entry = { l1Xp: 0, l2Xp: 0, l1Sims: 0, l2Sims: 0, toolScores: [], adaptiveScores: [], humanScores: [], domainScores: [] };
            growthAcc.set(se.skill_id, entry);
          }
          if (lvl === 2) { entry.l2Xp += se.xp; entry.l2Sims++; }
          else { entry.l1Xp += se.xp; entry.l1Sims++; }
          if (sim.tool_awareness_score != null) entry.toolScores.push(sim.tool_awareness_score);
          if (sim.adaptive_thinking_score != null) entry.adaptiveScores.push(sim.adaptive_thinking_score);
          if (sim.human_value_add_score != null) entry.humanScores.push(sim.human_value_add_score);
          if (sim.domain_judgment_score != null) entry.domainScores.push(sim.domain_judgment_score);
        }
      }
      const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
      const growthMap = new Map<string, CanonicalSkillGrowth>();
      for (const [skillId, acc] of growthAcc) {
        const growth = calculateGrowth(50, acc.l1Xp + acc.l2Xp, {
          avgToolAwareness: avg(acc.toolScores),
          avgAdaptiveThinking: avg(acc.adaptiveScores),
          avgHumanValueAdd: avg(acc.humanScores),
          avgDomainJudgment: avg(acc.domainScores),
        });
        growthMap.set(skillId, { level1Xp: acc.l1Xp, level2Xp: acc.l2Xp, level1Sims: acc.l1Sims, level2Sims: acc.l2Sims, growth });
      }
      setSkillGrowthMap(growthMap);

      // Compute average automation degree from sim scores
      if (sims.length > 0) {
        const scores = sims.map(s => {
          const risk = ((s.tool_awareness_score || 50) + (s.adaptive_thinking_score || 50)) / 2;
          const aug = ((s.human_value_add_score || 50) + (s.domain_judgment_score || 50)) / 2;
          return Math.round(risk * 0.6 + aug * 0.4);
        });
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const lvl = avgScore >= 80 ? 5 : avgScore >= 60 ? 4 : avgScore >= 40 ? 3 : avgScore >= 20 ? 2 : 1;
        setAvgDegreeLevel(lvl);
      }

      // Superadmins always see bosses as available for repeated testing
      const l2Completed = new Set<string>();
      if (!isSuperAdmin) {
        for (const [skillId, acc] of growthAcc) {
          if (acc.l2Sims > 0) l2Completed.add(skillId);
        }
      }
      setLevel2CompletedIds(l2Completed);

      const roleCounts = new Map<string, number>();
      const qualifiedRoles = new Set<string>();
      for (const sim of sims) {
        const title = sim.job_title?.toLowerCase() || "";
        roleCounts.set(title, (roleCounts.get(title) || 0) + 1);
        const avgScore = ((sim.tool_awareness_score || 0) + (sim.human_value_add_score || 0) + (sim.adaptive_thinking_score || 0) + (sim.domain_judgment_score || 0)) / 4;
        if (avgScore >= 80) qualifiedRoles.add(title);
      }
      for (const [title, count] of roleCounts) {
        if (count >= 3) qualifiedRoles.add(title);
      }

      const DEMO_LEVEL2_SKILLS = new Set([
        "ai-ethics-governance", "complex-problem-solving-humanai-teams", "strategic-problem-solving",
        "ai-strategy-governance", "critical-ai-evaluation", "prompt-engineering",
        "ai-agent-collaboration", "ai-operations-aiops", "bias-detection-ethical-ai-use",
        "datadriven-narrative-development", "ethical-ai-development", "complex-solution-architecture",
      ]);

      let finalL2Ids = DEMO_LEVEL2_SKILLS;

      if (sims.length > 0 && qualifiedRoles.size === 0) {
        finalL2Ids = DEMO_LEVEL2_SKILLS;
      } else if (qualifiedRoles.size > 0) {
        const { data: jobs } = await supabase.from("jobs").select("id, title").in("title", Array.from(qualifiedRoles));
        if (jobs && jobs.length > 0) {
          const jobIds = jobs.map(j => j.id);
          const { data: futureSkillLinks } = await supabase.from("job_future_skills").select("canonical_skill_id").in("job_id", jobIds).not("canonical_skill_id", "is", null);
          const l2ids = new Set<string>();
          for (const link of futureSkillLinks || []) { if (link.canonical_skill_id) l2ids.add(link.canonical_skill_id); }
          for (const id of DEMO_LEVEL2_SKILLS) l2ids.add(id);
          finalL2Ids = l2ids;
        }
      }

      setLevel2SkillIds(finalL2Ids);

      // Count undefeated bosses
      const undefeatedCount = [...finalL2Ids].filter(id => !l2Completed.has(id)).length;
      if (undefeatedCount > 0) {
        setBossCount(undefeatedCount);
        try { localStorage.setItem("xcrow-boss-count", String(undefeatedCount)); } catch {}
      }

      const targetRoles = ((profileRes.data as any)?.target_roles || []) as { job_id: string }[];
      if (targetRoles.length > 0) {
        const jobIds = targetRoles.map(r => r.job_id);
        const { data: clusters } = await supabase.from("job_task_clusters").select("skill_names").in("job_id", jobIds);
        const names = new Set<string>();
        for (const c of clusters || []) { for (const s of c.skill_names || []) names.add(s.toLowerCase()); }
        const ids = new Set<string>();
        for (const skill of taxonomy) {
          if (names.has(skill.name.toLowerCase())) ids.add(skill.id);
          for (const kw of skill.keywords) { if (names.has(kw)) ids.add(skill.id); }
        }
        setTargetSkillIds(ids);
      }
    })();
  }, [user, taxonomy]);

  const chatViewCtx = useMemo(() => ({
    page: "map" as const,
    activePanel: activeTab === "allies" ? "allies" : activeTab === "codex" ? "codex" : "territory",
    selectedRole: selectedRole ? { title: selectedRole.title, company: selectedRole.company, jobId: selectedRole.jobId } : null,
  }), [selectedRole, activeTab]);
  useChatViewContext(chatViewCtx as any, [chatViewCtx]);

  // Wait for auth to resolve, then redirect if onboarding incomplete
  if (authLoading) return null;
  if (user && (!profile || !profile.onboardingCompleted)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden relative">
      {/* ── Top Strip: always visible — tab icons + toggle ── */}
      <div
        className="relative z-20 flex items-center gap-1 px-3 py-1.5 shrink-0"
        style={{
          background: "hsl(var(--surface-stone) / 0.97)",
          borderBottom: "1px solid hsl(var(--filigree) / 0.2)",
          boxShadow: "0 2px 12px hsl(var(--emboss-shadow))",
        }}
      >
        {/* Tab icons */}
        {TAB_ITEMS.map(({ key, RuneIcon, label }) => {
          if (key !== "table" && !isSignedIn) return null;
          const isActive = activeTab === key && !panelCollapsed;
          const activeColor = "hsl(var(--filigree-glow))";
          const inactiveColor = "hsl(var(--muted-foreground))";
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    if (activeTab === key && !panelCollapsed) {
                      setPanelCollapsed(true);
                    } else {
                      setActiveTab(key);
                      setPanelCollapsed(false);
                    }
                  }}
                  className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                  style={{
                    ...(isActive
                      ? { background: "hsl(var(--filigree) / 0.12)", boxShadow: "0 0 12px hsl(var(--filigree-glow) / 0.3)" }
                      : {}),
                  }}
                >
                  <RuneIcon size={22} color={isActive ? activeColor : inactiveColor} />
                  {key === "allies" && (pendingCount + unreadCount) > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold animate-pulse"
                      style={{ background: "hsl(var(--filigree-glow))", color: "hsl(var(--background))" }}
                    >
                      {pendingCount + unreadCount}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-semibold" style={{ fontFamily: "'Cinzel', serif" }}>
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Spacer + quest tracker + mini HUD in strip */}
        <div className="flex-1" />
        <QuestTrackerStrip
          phase={mission.phase}
          territoriesScouted={mission.territoriesScouted}
          scoutedSkillCount={mission.scoutedSkills.length}
          skillsConquered={mission.skillsConquered}
          missionProgress={mission.missionProgress}
        />
        <div className="w-px h-4 opacity-30" style={{ background: "hsl(var(--filigree))" }} />
        {displaySkills.length > 0 && (
          <CompactHUD skills={displaySkills} targetSkillIds={targetSkillIds} userName={userName} avgDegreeLevel={avgDegreeLevel} />
        )}

        {/* Expand/collapse toggle */}
        <button
          onClick={() => setPanelCollapsed(c => !c)}
          className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-muted/30"
          style={{ color: "hsl(var(--muted-foreground))" }}
          title={panelCollapsed ? "Expand panel" : "Collapse panel"}
        >
          {panelCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {/* ── Overlay panel: drops down over the map ── */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence>
          {!panelCollapsed && (
            <motion.div
              key="overlay-panel"
              initial={{ y: "-100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 top-0 z-30 flex flex-col overflow-hidden w-auto min-w-[320px] max-w-[480px] rounded-br-xl"
              style={{
                maxHeight: "60%",
                background: "hsl(var(--surface-stone) / 0.97)",
                borderBottom: "1px solid hsl(var(--filigree) / 0.2)",
                boxShadow: "0 8px 32px hsl(var(--emboss-shadow))",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                {activeTab === "table" ? (
                    <QuestJournal
                      skills={futureSkills}
                      skillGrowthMap={skillGrowthMap}
                      level2SkillIds={level2SkillIds}
                      focusSkillId={forgeFocusSkillId}
                      onLaunchSim={handleLaunchSim}
                      missionPhase={mission.phase}
                      missionProgress={mission.missionProgress}
                      scoutedSkills={mission.scoutedSkills}
                      territoriesScouted={mission.territoriesScouted}
                      skillsConquered={mission.skillsConquered}
                      onSkillClick={(skill) => {
                        setMapFocusSkillId(skill.id);
                        setTimeout(() => setMapFocusSkillId(null), 100);
                        setDrawerSkill(skill);
                        setDrawerOpen(true);
                      }}
                    />
                ) : activeTab === "codex" && isSignedIn ? (
                  <CodexPanel />
                ) : activeTab === "allies" && isSignedIn ? (
                  <AlliesPanel onLaunchSim={handleLaunchSim} />
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Click-away backdrop */}
        <AnimatePresence>
          {!panelCollapsed && (
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20"
              style={{ background: "hsl(var(--background) / 0.3)" }}
              onClick={() => setPanelCollapsed(true)}
            />
          )}
        </AnimatePresence>

        {/* ── Territory Map ── */}
        {/* Saved Checkpoints Banner */}
        {savedCheckpoints.length > 0 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {savedCheckpoints.slice(0, 2).map(cp => (
              <button
                key={cp.id}
                onClick={() => {
                  setActiveSim({
                    jobTitle: cp.jobTitle,
                    taskName: cp.taskName,
                    company: cp.company || undefined,
                    level: cp.level as 1 | 2,
                    resumeCheckpointId: cp.id,
                  } as any);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs backdrop-blur-md transition-all hover:scale-105"
                style={{
                  background: "hsl(var(--card) / 0.9)",
                  border: "1px solid hsl(var(--primary) / 0.3)",
                  boxShadow: "0 2px 8px hsl(var(--primary) / 0.15)",
                }}
              >
                <Save className="h-3 w-3 text-primary" />
                <span className="font-medium text-foreground truncate max-w-[140px]">{cp.taskName}</span>
                <span className="text-muted-foreground">R{cp.roundCount}</span>
              </button>
            ))}
          </div>
        )}

        {/* Boss Battle Banner */}
        {bossCount > 0 && (
          <BossBanner
            availableBosses={
              [...level2SkillIds]
                .filter(id => !level2CompletedIds.has(id))
                .map(id => {
                  const skill = futureSkills.find(s => s.id === id);
                  return skill ? { skill, skillId: id } : null;
                })
                .filter(Boolean) as { skill: FutureSkill; skillId: string }[]
            }
            onLaunchBoss={(skillId, skillName) => {
              handleLaunchSim({
                jobTitle: skillName,
                taskName: skillName,
                skillId,
                level: 2,
              });
            }}
            onDismiss={() => setBossCount(0)}
          />
        )}
        <FutureTerritoryMap
          skills={futureSkills}
          focusSkillId={mapFocusSkillId}
          level2SkillIds={level2SkillIds}
          level2CompletedIds={level2CompletedIds}
          skillGrowthMap={skillGrowthMap}
          onLaunchSim={handleLaunchSim}
          onLaunchPromptLab={handleLaunchPromptLab}
          onSkillSelect={(skill) => {
            setActiveTab("table");
            setForgeFocusSkillId(skill.id);
            setTimeout(() => setForgeFocusSkillId(null), 200);
            setDrawerSkill(skill);
            setDrawerOpen(true);
          }}
        />
        <MapIntroGuide isSignedIn={isSignedIn} />
      </div>

      {/* Role preview overlay */}
      <AnimatePresence>
        {selectedRole && (
          <motion.div
            key="role-preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "hsl(var(--background) / 0.6)", backdropFilter: "blur(6px)" }}
            onClick={() => setSelectedRole(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-[95vw] max-w-4xl h-[85vh] rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--filigree) / 0.2)",
                boxShadow: "0 25px 80px hsl(var(--emboss-shadow)), 0 0 40px hsl(var(--background) / 0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex items-center justify-between px-5 py-3 shrink-0"
                style={{
                  background: "hsl(var(--surface-stone) / 0.9)",
                  borderBottom: "1px solid hsl(var(--filigree) / 0.2)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold text-white"
                    style={{ background: `hsl(${(selectedRole.title.length * 47) % 360}, 55%, 45%)` }}
                  >
                    {(selectedRole.company || selectedRole.title)[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground leading-tight" style={{ fontFamily: "'Cinzel', serif" }}>
                      {selectedRole.title}
                    </h2>
                    {selectedRole.company && <p className="text-xs text-muted-foreground">{selectedRole.company}</p>}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-all active:scale-[0.97]"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  <X className="h-3.5 w-3.5" /> Close
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <RolePreviewPanel role={selectedRole} onClose={() => { setSelectedRole(null); setSelectedKingdomCtx(null); }} edgeContext={activeEdge} kingdomContext={selectedKingdomCtx} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credit Gate overlay — checks before launching sim */}
      <AnimatePresence>
        {pendingSimReq && !activeSim && (
          <motion.div
            key="credit-gate-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[55] flex items-center justify-center"
            style={{ background: "hsl(var(--background) / 0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setPendingSimReq(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-xl p-6 max-w-sm w-full mx-4"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--filigree) / 0.3)",
                boxShadow: "0 20px 60px hsl(var(--emboss-shadow))",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <Coins className="h-8 w-8 mx-auto mb-2" style={{ color: "hsl(var(--filigree-glow))" }} />
                <h3 className="text-sm font-semibold" style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--foreground))" }}>
                  Launch Quest
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingSimReq.taskName || pendingSimReq.jobTitle}
                </p>
              </div>
              <CreditGate
                action={pendingSimReq.level === 2 ? "simulation_l2" : "simulation_l1"}
                onProceed={() => {
                  setActiveSim(pendingSimReq);
                  setPendingSimReq(null);
                }}
                className="w-full"
              >
                <button
                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:brightness-110"
                  style={{
                    background: "hsl(var(--primary))",
                    color: "hsl(var(--primary-foreground))",
                  }}
                >
                  Start {pendingSimReq.level === 2 ? "Boss Battle" : "Quest"}
                </button>
              </CreditGate>
              <button
                onClick={() => setPendingSimReq(null)}
                className="w-full mt-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* In-place Sim overlay — preserves map state underneath */}
      <AnimatePresence>
        {activeSim && (
          <motion.div
            key="sim-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] flex items-center justify-center"
            style={{ background: "hsl(var(--background) / 0.6)", backdropFilter: "blur(6px)" }}
            onClick={handleCloseSim}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-[95vw] max-w-3xl h-[85vh] rounded-2xl overflow-hidden"
              style={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--filigree) / 0.2)",
                boxShadow: "0 25px 80px hsl(var(--emboss-shadow)), 0 0 40px hsl(var(--background) / 0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <SimulatorModal
                open={true}
                onClose={handleCloseSim}
                taskName={activeSim.taskName || activeSim.jobTitle}
                jobTitle={activeSim.jobTitle}
                company={activeSim.company}
                level={activeSim.level || 1}
                masteryTier={(activeSim as any).masteryTier}
                inline
                onCompleted={() => { mission.conquerSkill(); handleCloseSim(); }}
                onBackToFeed={handleCloseSim}
                roleChallenge={activeSim.roleChallenge}
                linkedSkillIds={activeSim.linkedSkillIds}
                resumeCheckpointId={(activeSim as any).resumeCheckpointId}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skill Detail Drawer */}
      <SkillDetailDrawer
        skill={drawerSkill}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        level2Unlocked={drawerSkill ? level2SkillIds.has(drawerSkill.id) : false}
        level2Completed={drawerSkill ? level2CompletedIds.has(drawerSkill.id) : false}
        level1Xp={drawerSkill ? (skillGrowthMap.get(drawerSkill.id)?.level1Xp ?? 0) : 0}
        level2Xp={drawerSkill ? (skillGrowthMap.get(drawerSkill.id)?.level2Xp ?? 0) : 0}
        level1SimsCompleted={drawerSkill ? (skillGrowthMap.get(drawerSkill.id)?.level1Sims ?? 0) : 0}
        onLaunchBoss={drawerSkill && level2SkillIds.has(drawerSkill.id) && !level2CompletedIds.has(drawerSkill.id) ? () => {
          const growth = skillGrowthMap.get(drawerSkill.id);
          const roles2 = []; // will use first role from drawer
          handleLaunchSim({
            jobTitle: drawerSkill.name,
            taskName: drawerSkill.name,
            skillId: drawerSkill.id,
            level: 2,
          });
          setDrawerOpen(false);
        } : undefined}
      />

      {/* Prompt Lab overlay */}
      {activePromptLab && (
        <PromptLab
          open={true}
          onClose={handleClosePromptLab}
          skillId={activePromptLab.skillId}
          skillName={activePromptLab.skillName}
          skillCategory={activePromptLab.skillCategory}
        />
      )}
    </div>
  );
};

export default MapPage;
