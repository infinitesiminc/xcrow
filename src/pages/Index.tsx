import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Map, Bookmark, X, Sparkles, Swords, ScrollText } from "lucide-react";
import OnboardingQuest from "@/components/OnboardingQuest";
import { useFutureSkills } from "@/hooks/use-future-skills";
import FutureTerritoryMap from "@/components/territory/FutureTerritoryMap";
import FutureSkillsTable from "@/components/territory/FutureSkillsTable";
import { getLevel, levelProgress } from "@/lib/skill-map";
import { TooltipProvider } from "@/components/ui/tooltip";
import HomepageChat, { type ViewContext } from "@/components/HomepageChat";
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

  // Build live view context for AI chat
  const viewContext = useMemo<ViewContext>(() => ({
    activePanel: selectedRole ? "role-preview" : rightTab === "roles" ? "roles" : "territory",
    selectedRole: selectedRole ? { title: selectedRole.title, company: selectedRole.company, jobId: selectedRole.jobId } : null,
    selectedTab: rightTab === "roles" ? myRolesTab : undefined,
    lastSimResult,
  }), [selectedRole, rightTab, myRolesTab, lastSimResult]);

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
          {!hasInteracted && !user && <SkillSuggestionCards />}
          {!hasInteracted && user && <div className="w-full max-w-lg mb-4"><QuestBoard /></div>}
          <div className={`w-full max-w-lg ${hasInteracted ? "flex-1 flex flex-col min-h-0" : ""}`}>
            <HomepageChat
              onRolesFound={handleRolesFound}
              onRoleSelect={handleRoleSelect}
              onChatStart={handleChatStart}
              hasInteracted={hasInteracted}
              selectedJobId={selectedRole?.jobId}
              inlineCards
              externalPrompt={externalPrompt}
              onExternalPromptConsumed={() => setExternalPrompt(null)}
              viewContext={viewContext}
            />
          </div>
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
          onClose={() => setTerritoryOpen(false)}
          skills={displaySkills}
          lastPracticedSkillId={lastPracticedSkillId}
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
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {displaySkills.length > 0 && (
        <CompactHUD
          skills={displaySkills}
          targetSkillIds={targetSkillIds}
          userName={userName}
        />
      )}

      <div className="flex-1 flex min-h-0">
        {/* ── Left: Chat ─────────────────────────── */}
        <div className="w-1/2 flex flex-col border-r border-border">
          <div className="flex-1 flex flex-col items-center px-5 pt-8 pb-4 overflow-y-auto">
            <AnimatePresence mode="wait">
              {!hasInteracted && (
                <motion.div
                  key="greeting"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
                  className="text-center mb-8 shrink-0"
                >
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-[1.1]">
                    {isSignedIn
                      ? `${greeting}${userName ? `, ${userName}` : ""} ⚔️`
                      : "Level up your career"}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                    {isSignedIn
                      ? "Your AI career coach is ready. Explore kingdoms and claim new territory."
                      : "Explore any career kingdom — watch your territory light up as you conquer quests."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {!hasInteracted && user && <div className="w-full max-w-xl mb-4"><QuestBoard /></div>}
            <div className={`w-full max-w-xl ${hasInteracted ? "flex-1 flex flex-col min-h-0" : ""}`}>
              <HomepageChat
                onRolesFound={handleRolesFound}
                onRoleSelect={handleRoleSelect}
                onChatStart={handleChatStart}
                hasInteracted={hasInteracted}
                selectedJobId={selectedRole?.jobId}
                inlineCards
                externalPrompt={externalPrompt}
                onExternalPromptConsumed={() => setExternalPrompt(null)}
                viewContext={viewContext}
              />
            </div>
          </div>
        </div>

        {/* ── Right: Adaptive panel ─────────────── */}
        <div className="w-1/2 flex flex-col bg-muted/5">
          {/* Tab bar + role carousel */}
          <div className="shrink-0 border-b border-border">
            {/* Tab switcher */}
            {isSignedIn && (
              <div className="flex items-center gap-1 px-4 pt-3 pb-0">
                <button
                  onClick={() => setRightTab("territory")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors border-b-2 ${
                    rightTab === "territory"
                      ? "border-primary text-foreground bg-background/50"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Map className="h-3 w-3" />
                  World Map
                </button>
                <button
                  onClick={() => setRightTab("table")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors border-b-2 ${
                    rightTab === "table"
                      ? "border-primary text-foreground bg-background/50"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ScrollText className="h-3 w-3" />
                  Skill Forge
                </button>
                <button
                  onClick={() => setRightTab("roles")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors border-b-2 ${
                    rightTab === "roles"
                      ? "border-primary text-foreground bg-background/50"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Swords className="h-3 w-3" />
                  Kingdoms
                </button>
              </div>
            )}

            {/* Role carousel removed — cards now inline in chat */}
          </div>

          {/* Main area */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {/* Selected role preview (inline) */}
              {selectedRole && rightTab === "territory" ? (
                <motion.div
                  key={selectedRole.jobId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full relative"
                >
                  <RolePreviewPanel
                    role={selectedRole}
                    onClose={() => setSelectedRole(null)}
                    edgeContext={activeEdge}
                  />
                  {/* Expand to full screen button */}
                  <button
                    onClick={() => setFullScreenRole(selectedRole)}
                    className="absolute top-3 right-12 p-1.5 rounded-md bg-background/80 border border-border/50 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all active:scale-[0.95] z-10"
                    title="Expand to full screen"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </button>
                </motion.div>
              ) : rightTab === "roles" && isSignedIn ? (
                <motion.div
                  key="my-roles"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <MyRolesPanel
                    onSelectRole={(role) => {
                      setSelectedRole(role);
                      setRightTab("territory");
                    }}
                    onAskChat={handleRolesAskChat}
                    onTabChange={setMyRolesTab}
                  />
                </motion.div>
              ) : rightTab === "table" ? (
                <motion.div
                  key="table"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="h-full overflow-hidden"
                >
                  <FutureSkillsTable skills={futureSkills} />
                </motion.div>
              ) : (
                <motion.div
                  key="territory"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="h-full overflow-hidden"
                >
                  <FutureTerritoryMap skills={futureSkills} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Full-screen role deep dive ────────── */}
      <AnimatePresence>
        {fullScreenRole && (
          <motion.div
            key="fullscreen-role"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 bg-background"
          >
            {/* Close bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: `hsl(${(fullScreenRole.title.length * 47) % 360}, 55%, 45%)` }}
                >
                  {(fullScreenRole.company || fullScreenRole.title)[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground leading-tight">{fullScreenRole.title}</h2>
                  {fullScreenRole.company && (
                    <p className="text-[11px] text-muted-foreground">{fullScreenRole.company}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setFullScreenRole(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all active:scale-[0.97]"
              >
                <X className="h-3.5 w-3.5" />
                Close
              </button>
            </div>
            <div className="h-[calc(100%-3.25rem)] overflow-hidden">
              <RolePreviewPanel
                role={fullScreenRole}
                onClose={() => setFullScreenRole(null)}
                edgeContext={activeEdge}
              />
            </div>
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
};

export default Index;
