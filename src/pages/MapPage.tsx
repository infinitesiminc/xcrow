/**
 * MapPage — Split-panel layout: left panel (Forge/Kingdoms/Allies) + right map.
 */
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import type { FutureSkill } from "@/hooks/use-future-skills";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { X, ScrollText, Users, BookOpen, Compass, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import BossBanner from "@/components/territory/BossBanner";
import SimulatorModal from "@/components/SimulatorModal";
import type { SimLaunchRequest, PromptLabRequest } from "@/components/territory/SkillLaunchCard";
import PromptLab from "@/components/sim/PromptLab";
import { preloadTerritoryImages } from "@/lib/territory-hero-images";

/** IDs of skills where user has completed a L2 boss battle */
type Level2CompletedIds = Set<string>;

import { useFutureSkills } from "@/hooks/use-future-skills";
import FutureTerritoryMap from "@/components/territory/FutureTerritoryMap";
import FutureSkillsTable from "@/components/territory/FutureSkillsTable";
import MapIntroGuide from "@/components/territory/MapIntroGuide";
import { getLevel, levelProgress } from "@/lib/skill-map";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useChatContext, useChatViewContext } from "@/contexts/ChatContext";
import RolePreviewPanel from "@/components/RolePreviewPanel";
import type { RoleResult } from "@/components/InlineRoleCarousel";
import type { EdgeContext } from "@/components/HumanEdgesCard";

import CompactHUD from "@/components/territory/CompactHUD";

import AlliesPanel from "@/components/territory/AlliesPanel";
import CodexPanel from "@/components/territory/CodexPanel";
import ScoutPanel from "@/components/territory/ScoutPanel";

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

const TAB_ITEMS = [
  { key: "table" as const, icon: ScrollText, label: "Skill Forge" },
  { key: "scout" as const, icon: Compass, label: "Scout" },
  { key: "codex" as const, icon: BookOpen, label: "Codex" },
  { key: "allies" as const, icon: Users, label: "Allies" },
] as const;

type PendingSimLaunch = SimLaunchRequest & { taskName?: string };

const MapPage = () => {
  const { profile, user, isSuperAdmin } = useAuth();
  const { skills: dbSkills } = useSkills();
  const { futureSkills } = useFutureSkills();

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
  const [activeTab, setActiveTab] = useState<"table" | "scout" | "codex" | "allies">("table");
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [scoutSubTab, setScoutSubTab] = useState<"matched" | "browse" | "kingdoms">("matched");
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
    activePanel: activeTab === "scout" ? "scout" : activeTab === "allies" ? "allies" : activeTab === "codex" ? "codex" : "territory",
    selectedRole: selectedRole ? { title: selectedRole.title, company: selectedRole.company, jobId: selectedRole.jobId } : null,
  }), [selectedRole, activeTab]);
  useChatViewContext(chatViewCtx as any, [chatViewCtx]);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex overflow-hidden relative">
      {/* ── Left Panel: HUD + Tabs + Content ── */}
      <AnimatePresence initial={false}>
        {!panelCollapsed && (
          <motion.div
            key="left-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 420, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col h-full z-10 shrink-0 overflow-hidden"
            style={{
              background: "hsl(var(--surface-stone) / 0.97)",
              borderRight: "1px solid hsl(var(--filigree) / 0.2)",
              boxShadow: "2px 0 20px hsl(var(--emboss-shadow))",
            }}
          >
        {/* Mini HUD stats row */}
        {displaySkills.length > 0 && (
          <CompactHUD skills={displaySkills} targetSkillIds={targetSkillIds} userName={userName} avgDegreeLevel={avgDegreeLevel} />
        )}

        {/* Tab bar */}
        <div
          className="flex items-center gap-1 px-3 py-1.5"
          style={{ borderBottom: "1px solid hsl(var(--filigree) / 0.15)" }}
        >
          {TAB_ITEMS.map(({ key, icon: Icon, label }) => {
            if (key !== "table" && !isSignedIn) return null;
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all relative"
                style={{
                  fontFamily: "'Cinzel', serif",
                  letterSpacing: "0.05em",
                  ...(isActive
                    ? { color: "hsl(var(--filigree-glow))", background: "hsl(var(--filigree) / 0.12)", textShadow: "0 0 8px hsl(var(--filigree-glow) / 0.5)" }
                    : { color: "hsl(var(--muted-foreground))" }),
                }}
              >
                <Icon className="h-3 w-3" />
                {label}
                {key === "allies" && (pendingCount + unreadCount) > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold animate-pulse"
                    style={{ background: "hsl(var(--filigree-glow))", color: "hsl(var(--background))" }}
                  >
                    {pendingCount + unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {activeTab === "table" ? (
            <FutureSkillsTable
              skills={futureSkills}
              skillGrowthMap={skillGrowthMap}
              level2SkillIds={level2SkillIds}
              focusSkillId={forgeFocusSkillId}
              onLaunchSim={handleLaunchSim}
              onSkillClick={(skill) => {
                setMapFocusSkillId(skill.id);
                setTimeout(() => setMapFocusSkillId(null), 100);
                setDrawerSkill(skill);
                setDrawerOpen(true);
              }}
            />
          ) : activeTab === "scout" && isSignedIn ? (
            <ScoutPanel
              activeSubTab={scoutSubTab}
              onSubTabChange={setScoutSubTab}
              onOpenRole={(role, kCtx) => { setSelectedRole(role); setSelectedKingdomCtx(kCtx || null); }}
            />
          ) : activeTab === "codex" && isSignedIn ? (
            <CodexPanel />
          ) : activeTab === "allies" && isSignedIn ? (
            <AlliesPanel onLaunchSim={handleLaunchSim} />
          ) : null}
        </div>

        {/* Collapse button inside panel */}
        <button
          onClick={() => setPanelCollapsed(true)}
          className="absolute top-2 right-2 z-20 w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-muted/50"
          style={{ color: "hsl(var(--muted-foreground))" }}
          title="Collapse panel"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </motion.div>
        )}
      </AnimatePresence>

      {/* Expand button when collapsed */}
      {panelCollapsed && (
        <button
          onClick={() => setPanelCollapsed(false)}
          className="absolute top-2 left-2 z-20 w-9 h-9 rounded-lg flex items-center justify-center backdrop-blur-md border transition-colors hover:bg-muted/30"
          style={{
            background: "hsl(var(--card) / 0.85)",
            borderColor: "hsl(var(--border) / 0.5)",
            color: "hsl(var(--foreground))",
          }}
          title="Show panel"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      {/* ── Right: Territory Map ── */}
      <div className="flex-1 relative">
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
        {!isSignedIn && <MapIntroGuide />}
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
                inline
                onCompleted={handleCloseSim}
                onBackToFeed={handleCloseSim}
                roleChallenge={activeSim.roleChallenge}
                linkedSkillIds={activeSim.linkedSkillIds}
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
