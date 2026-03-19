import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import HomepageChat from "@/components/HomepageChat";
import RolePreviewPanel from "@/components/RolePreviewPanel";
import InlineRoleCarousel, { type RoleResult } from "@/components/InlineRoleCarousel";
import SkillSuggestionCards from "@/components/SkillSuggestionCards";
import HumanEdgesCard, { type EdgeContext } from "@/components/HumanEdgesCard";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const Index = () => {
  const { profile, user } = useAuth();
  const isMobile = useIsMobile();

  const [hasInteracted, setHasInteracted] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleResult | null>(null);
  const [allRoles, setAllRoles] = useState<RoleResult[]>([]);
  const [externalPrompt, setExternalPrompt] = useState<string | null>(null);
  const [activeEdge, setActiveEdge] = useState<EdgeContext | null>(null);

  const handleChatStart = useCallback(() => {
    setHasInteracted(true);
  }, []);

  const handleRolesFound = useCallback((roles: RoleResult[]) => {
    setAllRoles(roles);
  }, []);

  const handleRoleSelect = useCallback((role: RoleResult) => {
    setSelectedRole((prev) => (prev?.jobId === role.jobId ? null : role));
  }, []);

  const handleEdgeClick = useCallback((prompt: string, edge: EdgeContext) => {
    setExternalPrompt(prompt);
    setActiveEdge(edge);
  }, []);

  const greeting = getGreeting();
  const userName = profile?.displayName?.split(" ")[0];

  if (isMobile) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">
        {/* Mobile: stacked layout */}
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
                  {greeting}{userName ? `, ${userName}` : ""}
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Ask me about any career or role
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

  // Desktop: permanent two-column layout
  return (
    <div className="h-[calc(100vh-3.5rem)] flex">
      {/* ── Left: Chat ─────────────────────────────── */}
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
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-tight">
                  {greeting}{userName ? `, ${userName}` : ""}
                </h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  Ask me about any career, role, or industry — I'll show you how AI is reshaping it.
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

      {/* ── Right: Carousel + Preview ──────────────── */}
      <div className="w-1/2 flex flex-col bg-muted/5">
        {/* Top: Role carousel */}
        {allRoles.length > 0 ? (
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
        ) : (
          <div className="shrink-0 border-b border-border p-5 space-y-4">
            <p className="text-sm text-muted-foreground/60 text-center">
              {hasInteracted
                ? "Ask about a role to see matching jobs here"
                : "Roles will appear here as you explore"}
            </p>
            {!hasInteracted && <HumanEdgesCard onEdgeClick={handleEdgeClick} />}
          </div>
        )}

        {/* Bottom: Role details */}
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
                <RolePreviewPanel role={selectedRole} onClose={() => setSelectedRole(null)} edgeContext={activeEdge} />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex items-center justify-center"
              >
                <p className="text-sm text-muted-foreground/50">
                  Click a role card to preview it here
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Index;
