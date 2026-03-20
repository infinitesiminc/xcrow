import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import HomepageChat from "@/components/HomepageChat";
import RolePreviewPanel from "@/components/RolePreviewPanel";
import InlineRoleCarousel, { type RoleResult } from "@/components/InlineRoleCarousel";
import SkillSuggestionCards from "@/components/SkillSuggestionCards";
import HumanEdgesCard, { type EdgeContext } from "@/components/HumanEdgesCard";
import TerritoryGrid from "@/components/territory/TerritoryGrid";
import CompactHUD from "@/components/territory/CompactHUD";
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

/** Map role results → skill IDs by matching task cluster skill_names to taxonomy keywords */
function rolesToSkillIds(roles: RoleResult[]): Set<string> {
  // We match role titles to taxonomy keywords as a lightweight heuristic
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

/* ── component ───────────────────────────────────── */

const Index = () => {
  const { profile, user } = useAuth();
  const isMobile = useIsMobile();

  const [hasInteracted, setHasInteracted] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleResult | null>(null);
  const [allRoles, setAllRoles] = useState<RoleResult[]>([]);
  const [externalPrompt, setExternalPrompt] = useState<string | null>(null);
  const [activeEdge, setActiveEdge] = useState<EdgeContext | null>(null);

  // Real mode data (signed-in users)
  const [realSkills, setRealSkills] = useState<SkillXP[]>([]);
  const [targetSkillIds, setTargetSkillIds] = useState<Set<string>>(new Set());

  // Demo mode: skill IDs highlighted from discovered roles
  const demoHighlighted = useMemo(() => rolesToSkillIds(allRoles), [allRoles]);

  // Load real skill data for signed-in users
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

      // Extract target role skill IDs
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
        // Match names to taxonomy IDs
        const ids = new Set<string>();
        for (const skill of SKILL_TAXONOMY) {
          if (names.has(skill.name.toLowerCase())) ids.add(skill.id);
          // Also check keywords
          for (const kw of skill.keywords) {
            if (names.has(kw)) ids.add(skill.id);
          }
        }
        setTargetSkillIds(ids);
      }
    })();
  }, [user]);

  const handleChatStart = useCallback(() => setHasInteracted(true), []);
  const handleRolesFound = useCallback((roles: RoleResult[]) => setAllRoles(roles), []);
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

  const greeting = getGreeting();
  const userName = profile?.displayName?.split(" ")[0];
  const isSignedIn = !!user;

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
          {!hasInteracted && user && <SkillSuggestionCards />}
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
            />
          </div>
        </div>

        {/* Mobile overlay for preview */}
        <AnimatePresence>
          {selectedRole && (
            <motion.div
              key="mobile-preview"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 bg-background"
            >
              <RolePreviewPanel role={selectedRole} onClose={() => setSelectedRole(null)} edgeContext={activeEdge} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ── Desktop ──────────────────────────────────── */

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Compact HUD for signed-in users */}
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

            {!hasInteracted && user && <SkillSuggestionCards />}
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
              />
            </div>
          </div>
        </div>

        {/* ── Right: Territory + Preview ─────────── */}
        <div className="w-1/2 flex flex-col bg-muted/5">
          {/* Role carousel (only when roles discovered) */}
          {allRoles.length > 0 && (
            <div className="shrink-0 border-b border-border p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Matching roles
              </p>
              <InlineRoleCarousel
                roles={allRoles}
                onSelectRole={handleRoleSelect}
                selectedJobId={selectedRole?.jobId}
              />
            </div>
          )}

          {/* Main area: Preview or Territory */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {selectedRole ? (
                <motion.div
                  key={selectedRole.jobId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <RolePreviewPanel
                    role={selectedRole}
                    onClose={() => setSelectedRole(null)}
                    edgeContext={activeEdge}
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
                      {/* Sign up CTA for guests */}
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
                      {/* Human edges when no roles yet */}
                      {allRoles.length === 0 && !hasInteracted && (
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
    </div>
  );
};

export default Index;
