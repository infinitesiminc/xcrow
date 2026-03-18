import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import HomepageChat from "@/components/HomepageChat";
import RolePreviewPanel from "@/components/RolePreviewPanel";
import type { RoleResult } from "@/components/InlineRoleCarousel";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const Index = () => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();

  const [hasInteracted, setHasInteracted] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleResult | null>(null);

  const handleChatStart = useCallback(() => {
    setHasInteracted(true);
  }, []);

  const handleRoleSelect = useCallback((role: RoleResult) => {
    setSelectedRole((prev) => (prev?.jobId === role.jobId ? null : role));
  }, []);

  const greeting = getGreeting();
  const userName = profile?.displayName?.split(" ")[0];

  return (
    <div className="h-[calc(100vh-3.5rem)] flex">
      {/* ── Chat column ────────────────────────────── */}
      <div
        className={`flex flex-col transition-all duration-300 ${
          selectedRole && !isMobile ? "w-1/2" : "w-full"
        }`}
      >
        <div className="flex-1 flex flex-col items-center px-5 pt-8 pb-4 overflow-hidden">
          {/* Greeting */}
          <AnimatePresence mode="wait">
            {!hasInteracted && (
              <motion.div
                key="greeting"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
                className="text-center mb-8 shrink-0"
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground leading-tight">
                  {greeting}{userName ? `, ${userName}` : ""}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-md mx-auto">
                  Ask me about any career, role, or industry — I'll show you how AI is reshaping it.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat */}
          <div className={`w-full max-w-2xl ${hasInteracted ? "flex-1 flex flex-col min-h-0" : ""}`}>
            <HomepageChat
              onRoleSelect={handleRoleSelect}
              onChatStart={handleChatStart}
              hasInteracted={hasInteracted}
              selectedJobId={selectedRole?.jobId}
            />
          </div>
        </div>
      </div>

      {/* ── Preview panel (desktop: side-by-side) ─── */}
      {!isMobile && (
        <AnimatePresence>
          {selectedRole && (
            <motion.div
              key="preview"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "50%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full overflow-hidden"
            >
              <RolePreviewPanel
                role={selectedRole}
                onClose={() => setSelectedRole(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ── Preview panel (mobile: full overlay) ──── */}
      {isMobile && (
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
              <RolePreviewPanel
                role={selectedRole}
                onClose={() => setSelectedRole(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default Index;
