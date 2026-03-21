import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Map, X, Swords, ScrollText } from "lucide-react";
import OnboardingQuest from "@/components/OnboardingQuest";
import AdaptiveQueue from "@/components/AdaptiveQueue";

import { useFutureSkills } from "@/hooks/use-future-skills";
import FutureTerritoryMap from "@/components/territory/FutureTerritoryMap";
import FutureSkillsTable from "@/components/territory/FutureSkillsTable";
import MapIntroGuide from "@/components/territory/MapIntroGuide";
import { getLevel, levelProgress } from "@/lib/skill-map";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useChatContext, useChatViewContext } from "@/contexts/ChatContext";
import type { ViewContext } from "@/contexts/ChatContext";
import RolePreviewPanel from "@/components/RolePreviewPanel";
import InlineRoleCarousel, { BatchedRoleCarousel, type RoleResult, type RoleBatch } from "@/components/InlineRoleCarousel";
import SkillSuggestionCards from "@/components/SkillSuggestionCards";
import HumanEdgesCard, { type EdgeContext } from "@/components/HumanEdgesCard";
import TerritoryMap, { type SkillRarityInfo } from "@/components/territory/TerritoryMap";
import TerritoryOverlay from "@/components/territory/TerritoryOverlay";
import CompactHUD from "@/components/territory/CompactHUD";
import MyRolesPanel from "@/components/territory/MyRolesPanel";
import CastleNode from "@/components/territory/CastleNode";
import QuestBoard from "@/components/territory/QuestBoard";
import { getCastleState } from "@/lib/castle-levels";
import { useSkills, type DbSkill } from "@/hooks/use-skills";
import {
  SKILL_TAXONOMY,
  CATEGORY_META,
  aggregateSkillXP,
  type SkillCategory,
  type SkillXP,
  type SimRecord,
  type TaxonomySkill,
} from "@/lib/skill-map";

const CATEGORY_ORDER: SkillCategory[] = [
  "technical", "analytical", "communication",
  "leadership", "creative", "compliance",
];

/* ── helpers ─────────────────────────────────────── */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning quest awaits";
  if (hour < 18) return "Your territory grows";
  return "Night raid ready";
}

function rolesToSkillIds(roles: RoleResult[]): Set<string> {
  const ids = new Set<string>();
  for (const role of roles) {
    const text = `${role.title} ${role.company || ""}`.toLowerCase();
    for (const skill of SKILL_TAXONOMY) {
      if (skill.keywords.some((kw) => text.includes(kw))) {
        ids.add(skill.id);
      }
    }
  }
  return ids;
}

/* ── Demo seed data for mid-game visualization ── */
const DEMO_SEED_SKILLS: SkillXP[] = [
  // Citadel tier (600+ XP) - mastered skills
  { id: "data-analysis", name: "Data Analysis", category: "analytical", xp: 720, ...skillMeta("data-analysis", 720) },
  { id: "writing-docs", name: "Writing & Docs", category: "communication", xp: 650, ...skillMeta("writing-docs", 650) },
  // Fortress tier (300-599 XP)
  { id: "code-dev", name: "Software Dev", category: "technical", xp: 475, ...skillMeta("code-dev", 475) },
  { id: "project-mgmt", name: "Project Mgmt", category: "leadership", xp: 380, ...skillMeta("project-mgmt", 380) },
  { id: "research", name: "Research & Discovery", category: "analytical", xp: 340, ...skillMeta("research", 340) },
  { id: "prompt-eng", name: "Prompt Engineering", category: "technical", xp: 310, ...skillMeta("prompt-eng", 310) },
  // Outpost tier (100-299 XP)
  { id: "design-ux", name: "Design & UX", category: "creative", xp: 250, ...skillMeta("design-ux", 250) },
  { id: "stakeholder-mgmt", name: "Stakeholder Mgmt", category: "communication", xp: 200, ...skillMeta("stakeholder-mgmt", 200) },
  { id: "risk-assessment", name: "Risk Assessment", category: "analytical", xp: 175, ...skillMeta("risk-assessment", 175) },
  { id: "ai-ml", name: "AI & ML", category: "technical", xp: 150, ...skillMeta("ai-ml", 150) },
  { id: "strategy", name: "Strategy & Planning", category: "leadership", xp: 130, ...skillMeta("strategy", 130) },
  { id: "financial-modeling", name: "Financial Modeling", category: "analytical", xp: 100, ...skillMeta("financial-modeling", 100) },
  // Ruins (locked) — rest of taxonomy fills automatically
];

function skillMeta(id: string, xp: number) {
  const tax = SKILL_TAXONOMY.find(s => s.id === id);
  const lvl = getLevel(xp);
  return {
    level: lvl.name,
    levelIndex: lvl.index,
    progress: levelProgress(xp),
    aiExposure: tax?.aiExposure ?? 50,
    humanEdge: tax?.humanEdge,
    taskCount: Math.ceil(xp / 100),
  };
}

/** Merge seed into full taxonomy so locked skills also appear */
function buildDemoSkills(): SkillXP[] {
  const seeded = new globalThis.Map(DEMO_SEED_SKILLS.map(s => [s.id, s]));
  return SKILL_TAXONOMY.map(t => seeded.get(t.id) ?? {
    id: t.id,
    name: t.name,
    category: t.category,
    xp: 0,
    level: "Beginner" as const,
    levelIndex: 0,
    progress: 0,
    aiExposure: t.aiExposure,
    humanEdge: t.humanEdge,
    taskCount: 0,
  });
}

/* ── Right panel tab type ────────────────────────── */
type RightTab = "territory" | "table" | "roles";

/* ── component ───────────────────────────────────── */

const Index = () => {
  const { profile, user } = useAuth();
  const isMobile = useIsMobile();
  const { skills: dbSkills } = useSkills();

  const { futureSkills } = useFutureSkills();

  // Convert DB skills to TaxonomySkill format for layout/aggregation
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

  // Build rarity map for special drop styling
  const rarityMap = useMemo(() => {
    const m = new globalThis.Map<string, SkillRarityInfo>();
    for (const s of dbSkills) {
      if (s.rarity !== "common" || s.dropExpiresAt) {
        m.set(s.id, {
          id: s.id,
          rarity: s.rarity,
          dropExpiresAt: s.dropExpiresAt,
          iconEmoji: s.iconEmoji,
          description: s.description,
        });
      }
    }
    return m;
  }, [dbSkills]);

  const [hasInteracted, setHasInteracted] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleResult | null>(null);
  const [fullScreenRole, setFullScreenRole] = useState<RoleResult | null>(null);
  const [roleBatches, setRoleBatches] = useState<RoleBatch[]>([]);
  const [externalPrompt, setExternalPrompt] = useState<string | null>(null);
  const [activeEdge, setActiveEdge] = useState<EdgeContext | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>("territory");
  const [chatOpen, setChatOpen] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState<"table" | "roles">("table");
  const [lastSimResult, setLastSimResult] = useState<ViewContext["lastSimResult"]>(null);
  const [myRolesTab, setMyRolesTab] = useState<"saved" | "practiced">("saved");
  const batchCounter = useRef(0);
  const [territoryOpen, setTerritoryOpen] = useState(false);
  const [lastPracticedSkillId, setLastPracticedSkillId] = useState<string | null>("code-dev");
  const [hasOpenedTerritory, setHasOpenedTerritory] = useState(false);
  const [territoryFocusSkillId, setTerritoryFocusSkillId] = useState<string | null>(null);
  const [territoryXpGain, setTerritoryXpGain] = useState(0);

  const [realSkills, setRealSkills] = useState<SkillXP[]>([]);
  const [targetSkillIds, setTargetSkillIds] = useState<Set<string>>(new Set());

  // Use demo seed when no real sim data exists
  const displaySkills = useMemo(
    () => (realSkills.length > 0 ? realSkills : buildDemoSkills()),
    [realSkills]
  );

  const allRolesFlat = useMemo(() => roleBatches.flatMap((b) => b.roles), [roleBatches]);
  const demoHighlighted = useMemo(() => rolesToSkillIds(allRolesFlat), [allRolesFlat]);
  const skillMap = useMemo(() => {
    const m = new globalThis.Map(displaySkills.map(s => [s.id, s]));
    return m;
  }, [displaySkills]);
  const latestBatchId = roleBatches.length > 0 ? roleBatches[roleBatches.length - 1].id : 0;

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [simsRes, profileRes] = await Promise.all([
        supabase
          .from("completed_simulations")
          .select("task_name, job_title, skills_earned, tool_awareness_score, human_value_add_score, adaptive_thinking_score, domain_judgment_score")
          .eq("user_id", user.id),
        supabase
          .from("profiles")
          .select("target_roles")
          .eq("id", user.id)
          .single(),
      ]);

      const sims = (simsRes.data || []) as SimRecord[];
      setRealSkills(aggregateSkillXP(sims, taxonomy));

      const targetRoles = ((profileRes.data as any)?.target_roles || []) as {
        job_id: string;
      }[];
      if (targetRoles.length > 0) {
        const jobIds = targetRoles.map((r) => r.job_id);
        const { data: clusters } = await supabase
          .from("job_task_clusters")
          .select("skill_names")
          .in("job_id", jobIds);
        const names = new Set<string>();
        for (const c of clusters || []) {
          for (const s of c.skill_names || []) names.add(s.toLowerCase());
        }
        const ids = new Set<string>();
        for (const skill of taxonomy) {
          if (names.has(skill.name.toLowerCase())) ids.add(skill.id);
          for (const kw of skill.keywords) {
            if (names.has(kw)) ids.add(skill.id);
          }
        }
        setTargetSkillIds(ids);
      }
    })();
  }, [user, taxonomy]);

  // Territory overlay is only opened manually via the "Full Map" button

  const handleChatStart = useCallback(() => setHasInteracted(true), []);

  const handleRolesAskChat = useCallback((prompt: string) => {
    setExternalPrompt(prompt);
    setRightTab("territory");
    setHasInteracted(true);
  }, []);

  const handleRolesFound = useCallback((roles: RoleResult[]) => {
    if (roles.length === 0) return;
    batchCounter.current += 1;
    const newBatch: RoleBatch = { id: batchCounter.current, roles };
    setRoleBatches((prev) => [...prev, newBatch]);
  }, []);

  const handleRoleSelect = useCallback(
    (role: RoleResult) => setSelectedRole((prev) => (prev?.jobId === role.jobId ? null : role)),
    []
  );

  const handleEdgeClick = useCallback((prompt: string, edge: EdgeContext) => {
    setExternalPrompt(prompt);
    setActiveEdge(edge);
  }, []);

  const handleTileClick = useCallback(() => {
    // No-op — skill nodes are visual only now
  }, []);

  const handleExpandRole = useCallback((role: RoleResult) => {
    setFullScreenRole(role);
  }, []);

  const handleViewTerritory = useCallback((skillId: string, xpGain: number) => {
    setTerritoryFocusSkillId(skillId);
    setTerritoryXpGain(xpGain);
    setLastPracticedSkillId(skillId);
    setTerritoryOpen(true);
  }, []);

  const greeting = getGreeting();
  const userName = profile?.displayName?.split(" ")[0];
  const isSignedIn = !!user;
  const showOnboarding = isSignedIn && profile && !profile.onboardingCompleted;
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  // Inject view context into the unified chat
  const chatViewCtx = useMemo(() => ({
    page: "home" as const,
    activePanel: selectedRole ? "role-preview" : rightTab === "roles" ? "roles" : "territory",
    selectedRole: selectedRole ? { title: selectedRole.title, company: selectedRole.company, jobId: selectedRole.jobId } : null,
    selectedTab: rightTab === "roles" ? myRolesTab : undefined,
    lastSimResult,
  }), [selectedRole, rightTab, myRolesTab, lastSimResult]);
  useChatViewContext(chatViewCtx, [chatViewCtx]);

  // Wire up role callbacks from the unified chat
  const { onRolesFoundRef, onRoleSelectRef, sendMessage: chatSendMessage, setIsOpen: setChatDockOpen } = useChatContext();
  useEffect(() => {
    onRolesFoundRef.current = handleRolesFound;
    onRoleSelectRef.current = handleRoleSelect;
  }, [handleRolesFound, handleRoleSelect, onRolesFoundRef, onRoleSelectRef]);

  /* ── Onboarding Quest ── */
  if (showOnboarding && !onboardingDismissed) {
    return (
      <OnboardingQuest
        open
        userId={user!.id}
        onComplete={() => setOnboardingDismissed(true)}
      />
    );
  }

  /* ── Mobile ───────────────────────────────────── */

  if (isMobile) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">
        <div className="flex-1 flex flex-col items-center px-4 pt-6 pb-4 overflow-y-auto">
          <AnimatePresence mode="wait">
            {!hasInteracted && (
              <motion.div
                key="greeting"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
                className="text-center mb-6 shrink-0"
              >
                <h1 className="text-2xl font-display font-bold text-foreground leading-tight">
                  {isSignedIn
                    ? `${greeting}${userName ? `, ${userName}` : ""} ⚔️`
                    : "Level up your career"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  {isSignedIn
                    ? "Choose your next quest and conquer new territory"
                    : "Explore kingdoms, practice quests, claim your territory"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Chat is now in the unified dock bar */}
          {!user && <SkillSuggestionCards />}
          {user && (
            <div className="w-full max-w-lg mb-4 space-y-4">
              <QuestBoard />
              <AdaptiveQueue userId={user.id} />
            </div>
          )}
        </div>

        <AnimatePresence>
          {(selectedRole || fullScreenRole) && (
            <motion.div
              key="mobile-preview"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 bg-background"
            >
              <RolePreviewPanel
                role={fullScreenRole || selectedRole!}
                onClose={() => { setSelectedRole(null); setFullScreenRole(null); }}
                edgeContext={activeEdge}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Territory overlay */}
        <TerritoryOverlay
          open={territoryOpen}
          onClose={() => {
            setTerritoryOpen(false);
            setTerritoryFocusSkillId(null);
            setTerritoryXpGain(0);
          }}
          skills={displaySkills}
          lastPracticedSkillId={lastPracticedSkillId}
          focusSkillId={territoryFocusSkillId}
          xpGain={territoryXpGain}
        />

        {/* Territory button (floating) */}
        {isSignedIn && !territoryOpen && (
          <button
            onClick={() => setTerritoryOpen(true)}
            className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground shadow-lg hover:shadow-xl transition-all active:scale-[0.95]"
          >
            <Map className="h-3.5 w-3.5" />
            🏰 Territory
          </button>
        )}
      </div>
    );
  }

  /* ── Desktop ──────────────────────────────────── */

  return (
    <div className="h-[calc(100vh-3.5rem)] relative overflow-hidden">
      {/* ── Full-screen Territory Map (background) ── */}
      <div className="absolute inset-0 z-0">
        <FutureTerritoryMap skills={futureSkills} />
      </div>

      {/* Guided intro for first-time visitors */}
      {!isSignedIn && <MapIntroGuide />}

      {/* ── HUD overlay (top) ── */}
      {displaySkills.length > 0 && (
        <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
          <div className="pointer-events-auto">
            <CompactHUD
              skills={displaySkills}
              targetSkillIds={targetSkillIds}
              userName={userName}
            />
          </div>
        </div>
      )}

      {/* ── Floating tab bar (top-right) ── */}
      <div className="absolute top-14 right-4 z-20 flex items-center gap-1 bg-card/80 backdrop-blur-md border border-border/50 rounded-lg p-1 shadow-lg">
        <button
          onClick={() => { setRightPanelTab("table"); setChatOpen(true); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            rightPanelTab === "table" && chatOpen
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ScrollText className="h-3 w-3" />
          Skill Forge
        </button>
        {isSignedIn && (
          <button
            onClick={() => { setRightPanelTab("roles"); setChatOpen(true); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              rightPanelTab === "roles" && chatOpen
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Swords className="h-3 w-3" />
            Kingdoms
          </button>
        )}
      </div>

      {/* ── Floating side panel (right) ── */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            key="side-panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="absolute top-24 right-4 bottom-4 w-[420px] z-20 flex flex-col bg-card/90 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={() => setChatOpen(false)}
              className="absolute top-2 right-2 z-10 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {rightPanelTab === "table" ? (
              <div className="flex-1 overflow-hidden">
                <FutureSkillsTable skills={futureSkills} />
              </div>
            ) : rightPanelTab === "roles" && isSignedIn ? (
              <div className="flex-1 overflow-hidden">
                <MyRolesPanel
                  onSelectRole={(role) => {
                    setSelectedRole(role);
                    setRightPanelTab("table");
                  }}
                  onAskChat={(prompt) => {
                    setChatDockOpen(true);
                    chatSendMessage(prompt);
                  }}
                  onTabChange={setMyRolesTab}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 p-4">
                <div className="text-center mb-4">
                  <h1 className="text-xl font-display font-bold text-foreground leading-tight">
                    {isSignedIn
                      ? `${greeting}${userName ? `, ${userName}` : ""} ⚔️`
                      : "Level up your career"}
                  </h1>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {isSignedIn
                      ? "Your AI career coach is ready"
                      : "Explore kingdoms, practice quests, claim territory"}
                  </p>
                </div>
                {!user && <SkillSuggestionCards />}
                {user && (
                  <div className="space-y-3 mb-3">
                    <QuestBoard />
                    <AdaptiveQueue userId={user.id} />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reopen panel button (when closed) ── */}
      <AnimatePresence>
        {!chatOpen && (
          <motion.button
            key="reopen"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setChatOpen(true)}
            className="fixed bottom-4 left-4 z-20 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-card/90 backdrop-blur-md border border-border/50 text-sm font-medium text-foreground shadow-lg hover:shadow-xl transition-all active:scale-[0.97]"
          >
            <ScrollText className="h-4 w-4 text-primary" />
            Open Panel
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Quest board (floating bottom-left) ── */}
      {isSignedIn && !hasInteracted && (
        <div className="absolute bottom-4 left-4 z-10 w-72">
          {/* Quest summary could go here */}
        </div>
      )}

      {/* ── Role preview overlay ── */}
      <AnimatePresence>
        {(selectedRole || fullScreenRole) && (
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
                  style={{ background: `hsl(${((fullScreenRole || selectedRole)!.title.length * 47) % 360}, 55%, 45%)` }}
                >
                  {((fullScreenRole || selectedRole)!.company || (fullScreenRole || selectedRole)!.title)[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground leading-tight">{(fullScreenRole || selectedRole)!.title}</h2>
                  {(fullScreenRole || selectedRole)!.company && (
                    <p className="text-xs text-muted-foreground">{(fullScreenRole || selectedRole)!.company}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => { setSelectedRole(null); setFullScreenRole(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all active:scale-[0.97]"
              >
                <X className="h-3.5 w-3.5" />
                Close
              </button>
            </div>
            <div className="h-[calc(100%-3.25rem)] overflow-hidden">
              <RolePreviewPanel
                role={(fullScreenRole || selectedRole)!}
                onClose={() => { setSelectedRole(null); setFullScreenRole(null); }}
                edgeContext={activeEdge}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Territory overlay (personal skills map) */}
      <TerritoryOverlay
        open={territoryOpen}
        onClose={() => {
          setTerritoryOpen(false);
          setTerritoryFocusSkillId(null);
          setTerritoryXpGain(0);
        }}
        skills={displaySkills}
        lastPracticedSkillId={lastPracticedSkillId}
        focusSkillId={territoryFocusSkillId}
        xpGain={territoryXpGain}
      />

      {/* Personal territory button */}
      {isSignedIn && !territoryOpen && (
        <button
          onClick={() => setTerritoryOpen(true)}
          className="fixed bottom-4 left-4 z-20 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card/90 backdrop-blur-md border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground shadow-lg hover:shadow-xl transition-all active:scale-[0.95]"
        >
          <Map className="h-3.5 w-3.5" />
          🏰 My Territory
        </button>
      )}
    </div>
  );
};

export default Index;
