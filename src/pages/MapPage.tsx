/**
 * MapPage — Split-panel layout: left panel (Forge/Kingdoms/Allies) + right map.
 */
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { X, Swords, ScrollText, Users } from "lucide-react";
import SimulatorModal from "@/components/SimulatorModal";
import type { SimLaunchRequest } from "@/components/territory/SkillLaunchCard";

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
import MyRolesPanel from "@/components/territory/MyRolesPanel";
import AlliesPanel from "@/components/territory/AlliesPanel";
import { useSkills } from "@/hooks/use-skills";
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
  { key: "roles" as const, icon: Swords, label: "Kingdoms" },
  { key: "allies" as const, icon: Users, label: "Allies" },
] as const;

const MapPage = () => {
  const { profile, user } = useAuth();
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
  const [activeEdge, setActiveEdge] = useState<EdgeContext | null>(null);
  const [activeTab, setActiveTab] = useState<"table" | "roles" | "allies">("table");
  const [mapFocusSkillId, setMapFocusSkillId] = useState<string | null>(null);
  const [forgeFocusSkillId, setForgeFocusSkillId] = useState<string | null>(null);
  const [myRolesTab, setMyRolesTab] = useState<"saved" | "practiced">("saved");

  const [realSkills, setRealSkills] = useState<SkillXP[]>([]);
  const [targetSkillIds, setTargetSkillIds] = useState<Set<string>>(new Set());
  const [level2SkillIds, setLevel2SkillIds] = useState<Set<string>>(new Set());
  const [skillGrowthMap, setSkillGrowthMap] = useState<Map<string, CanonicalSkillGrowth>>(new Map());

  // In-place sim overlay state
  const [activeSim, setActiveSim] = useState<SimLaunchRequest | null>(null);
  const handleLaunchSim = useCallback((req: SimLaunchRequest) => setActiveSim(req), []);
  const handleCloseSim = useCallback(() => setActiveSim(null), []);

  const displaySkills = useMemo(
    () => (realSkills.length > 0 ? realSkills : buildEmptySkills(taxonomy)),
    [realSkills, taxonomy]
  );

  const isSignedIn = !!user;
  const userName = profile?.displayName?.split(" ")[0];

  const { onRolesFoundRef, onRoleSelectRef, sendMessage: chatSendMessage, setIsOpen: setChatDockOpen } = useChatContext();
  const { updatePresence, goOffline, pendingCount } = useFriends();

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

      if (sims.length > 0 && qualifiedRoles.size === 0) {
        setLevel2SkillIds(DEMO_LEVEL2_SKILLS);
      } else if (qualifiedRoles.size > 0) {
        const { data: jobs } = await supabase.from("jobs").select("id, title").in("title", Array.from(qualifiedRoles));
        if (jobs && jobs.length > 0) {
          const jobIds = jobs.map(j => j.id);
          const { data: futureSkillLinks } = await supabase.from("job_future_skills").select("canonical_skill_id").in("job_id", jobIds).not("canonical_skill_id", "is", null);
          const l2ids = new Set<string>();
          for (const link of futureSkillLinks || []) { if (link.canonical_skill_id) l2ids.add(link.canonical_skill_id); }
          for (const id of DEMO_LEVEL2_SKILLS) l2ids.add(id);
          setLevel2SkillIds(l2ids);
        } else {
          setLevel2SkillIds(DEMO_LEVEL2_SKILLS);
        }
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
    activePanel: activeTab === "roles" ? "roles" : activeTab === "allies" ? "allies" : "territory",
    selectedRole: selectedRole ? { title: selectedRole.title, company: selectedRole.company, jobId: selectedRole.jobId } : null,
    selectedTab: activeTab === "roles" ? myRolesTab : undefined,
  }), [selectedRole, activeTab, myRolesTab]);
  useChatViewContext(chatViewCtx as any, [chatViewCtx]);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex overflow-hidden">
      {/* ── Left Panel: HUD + Tabs + Content ── */}
      <div
        className="flex flex-col w-[420px] min-w-[340px] max-w-[480px] h-full z-10 shrink-0"
        style={{
          background: "hsl(var(--surface-stone) / 0.97)",
          borderRight: "1px solid hsl(var(--filigree) / 0.2)",
          boxShadow: "2px 0 20px hsl(var(--emboss-shadow))",
        }}
      >
        {/* Mini HUD stats row */}
        {displaySkills.length > 0 && (
          <CompactHUD skills={displaySkills} targetSkillIds={targetSkillIds} userName={userName} />
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
                {key === "allies" && pendingCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold animate-pulse"
                    style={{ background: "hsl(var(--filigree-glow))", color: "hsl(var(--background))" }}
                  >
                    {pendingCount}
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
              }}
            />
          ) : activeTab === "roles" && isSignedIn ? (
            <MyRolesPanel
              onSelectRole={(role) => { setSelectedRole(role); setActiveTab("table"); }}
              onAskChat={(prompt) => { setChatDockOpen(true); chatSendMessage(prompt); }}
              onTabChange={setMyRolesTab}
            />
          ) : activeTab === "allies" && isSignedIn ? (
            <AlliesPanel />
          ) : null}
        </div>
      </div>

      {/* ── Right: Territory Map ── */}
      <div className="flex-1 relative">
        <FutureTerritoryMap
          skills={futureSkills}
          focusSkillId={mapFocusSkillId}
          level2SkillIds={level2SkillIds}
          skillGrowthMap={skillGrowthMap}
          onLaunchSim={handleLaunchSim}
          onSkillSelect={(skill) => {
            setActiveTab("table");
            setForgeFocusSkillId(skill.id);
            setTimeout(() => setForgeFocusSkillId(null), 200);
          }}
        />
        {!isSignedIn && <MapIntroGuide />}
      </div>

      {/* Role preview overlay */}
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
            <div
              className="flex items-center justify-between px-5 py-3 backdrop-blur-sm"
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
            <div className="h-[calc(100%-3.25rem)] overflow-hidden">
              <RolePreviewPanel role={selectedRole} onClose={() => setSelectedRole(null)} edgeContext={activeEdge} />
            </div>
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
                taskName={activeSim.jobTitle}
                jobTitle={activeSim.jobTitle}
                company={activeSim.company}
                level={activeSim.level || 1}
                inline
                onCompleted={handleCloseSim}
                onBackToFeed={handleCloseSim}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapPage;
