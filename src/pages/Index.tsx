import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Map, Bookmark, X } from "lucide-react";
import HomepageChat, { type ViewContext } from "@/components/HomepageChat";
import RolePreviewPanel from "@/components/RolePreviewPanel";
import InlineRoleCarousel, { BatchedRoleCarousel, type RoleResult, type RoleBatch } from "@/components/InlineRoleCarousel";
import SkillSuggestionCards from "@/components/SkillSuggestionCards";
import HumanEdgesCard, { type EdgeContext } from "@/components/HumanEdgesCard";
import TerritoryGrid from "@/components/territory/TerritoryGrid";
import CompactHUD from "@/components/territory/CompactHUD";
import MyRolesPanel from "@/components/territory/MyRolesPanel";
import {
  SKILL_TAXONOMY,
  aggregateSkillXP,
  type SkillXP,
  type SimRecord,
} from "@/lib/skill-map";

/* ── helpers ─────────────────────────────────────── */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
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

/* ── Right panel tab type ────────────────────────── */
type RightTab = "territory" | "roles";

/* ── component ───────────────────────────────────── */

const Index = () => {
  const { profile, user } = useAuth();
  const isMobile = useIsMobile();

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

  const [realSkills, setRealSkills] = useState<SkillXP[]>([]);
  const [targetSkillIds, setTargetSkillIds] = useState<Set<string>>(new Set());

  const allRolesFlat = useMemo(() => roleBatches.flatMap((b) => b.roles), [roleBatches]);
  const demoHighlighted = useMemo(() => rolesToSkillIds(allRolesFlat), [allRolesFlat]);
  const latestBatchId = roleBatches.length > 0 ? roleBatches[roleBatches.length - 1].id : 0;

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [simsRes, profileRes] = await Promise.all([
        supabase
          .from("completed_simulations")
          .select("task_name, job_title, skills_earned")
          .eq("user_id", user.id),
        supabase
          .from("profiles")
          .select("target_roles")
          .eq("id", user.id)
          .single(),
      ]);

      const sims = (simsRes.data || []) as SimRecord[];
      setRealSkills(aggregateSkillXP(sims));

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
        for (const skill of SKILL_TAXONOMY) {
          if (names.has(skill.name.toLowerCase())) ids.add(skill.id);
          for (const kw of skill.keywords) {
            if (names.has(kw)) ids.add(skill.id);
          }
        }
        setTargetSkillIds(ids);
      }
    })();
  }, [user]);

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

  const handleTileClick = useCallback(
    (skillId: string, skillName: string) => {
      setExternalPrompt(`Find me roles where I can practice ${skillName}`);
    },
    []
  );

  const handleExpandRole = useCallback((role: RoleResult) => {
    setFullScreenRole(role);
  }, []);

  const greeting = getGreeting();
  const userName = profile?.displayName?.split(" ")[0];
  const isSignedIn = !!user;

  // Build live view context for AI chat
  const viewContext = useMemo<ViewContext>(() => ({
    activePanel: selectedRole ? "role-preview" : rightTab === "roles" ? "roles" : "territory",
    selectedRole: selectedRole ? { title: selectedRole.title, company: selectedRole.company, jobId: selectedRole.jobId } : null,
    selectedTab: rightTab === "roles" ? myRolesTab : undefined,
    lastSimResult,
  }), [selectedRole, rightTab, myRolesTab, lastSimResult]);

  /* ── Mobile ───────────────────────────────────── */

  if (isMobile) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">
        <div className="flex-1 flex flex-col items-center px-4 pt-6 pb-4 overflow-hidden">
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
                    ? `${greeting}${userName ? `, ${userName}` : ""}`
                    : "The workforce is shifting"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  {isSignedIn
                    ? "Expand your territory"
                    : "Discover where you fit — and what to build"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {!hasInteracted && !user && <SkillSuggestionCards />}
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
      </div>
    );
  }

  /* ── Desktop ──────────────────────────────────── */

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {isSignedIn && realSkills.length > 0 && (
        <CompactHUD
          skills={realSkills}
          targetSkillIds={targetSkillIds}
          userName={userName}
        />
      )}

      <div className="flex-1 flex min-h-0">
        {/* ── Left: Chat ─────────────────────────── */}
        <div className="w-1/2 flex flex-col border-r border-border">
          <div className="flex-1 flex flex-col items-center px-5 pt-8 pb-4 overflow-hidden">
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
                      ? `${greeting}${userName ? `, ${userName}` : ""}`
                      : "The workforce is shifting"}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                    {isSignedIn
                      ? "Your scout is ready. Explore roles and expand your territory."
                      : "Ask about any career — watch your territory light up as you explore."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={`w-full max-w-xl ${hasInteracted ? "flex-1 flex flex-col min-h-0" : ""}`}>
              <HomepageChat
                onRolesFound={handleRolesFound}
                onRoleSelect={handleRoleSelect}
                onChatStart={handleChatStart}
                hasInteracted={hasInteracted}
                selectedJobId={selectedRole?.jobId}
                inlineCards={false}
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
                  Territory
                </button>
                <button
                  onClick={() => setRightTab("roles")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors border-b-2 ${
                    rightTab === "roles"
                      ? "border-primary text-foreground bg-background/50"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bookmark className="h-3 w-3" />
                  My Roles
                </button>
              </div>
            )}

            {/* Role carousel — only on territory tab */}
            {roleBatches.length > 0 && rightTab === "territory" && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-4 pt-2"
              >
                <BatchedRoleCarousel
                  batches={roleBatches}
                  onSelectRole={handleRoleSelect}
                  selectedJobId={selectedRole?.jobId}
                  latestBatchId={latestBatchId}
                />
              </motion.div>
            )}
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
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="territory"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="h-full"
                >
                  {isSignedIn ? (
                    <TerritoryGrid
                      skills={realSkills}
                      targetSkillIds={targetSkillIds}
                      onTileClick={handleTileClick}
                    />
                  ) : (
                    <div className="h-full flex flex-col">
                      <TerritoryGrid
                        demoMode
                        highlightedSkillIds={demoHighlighted}
                        onTileClick={handleTileClick}
                      />
                      {demoHighlighted.size > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.4 }}
                          className="px-4 pb-4"
                        >
                          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-center">
                            <p className="text-xs text-foreground font-medium">
                              Sign up to keep your territory
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Progress resets without an account
                            </p>
                          </div>
                        </motion.div>
                      )}
                      {roleBatches.length === 0 && !hasInteracted && (
                        <div className="px-4 pb-4">
                          <HumanEdgesCard onEdgeClick={handleEdgeClick} />
                        </div>
                      )}
                    </div>
                  )}
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
    </div>
  );
};

export default Index;
