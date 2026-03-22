/**
 * Index — Guest landing page.
 * Authenticated users are redirected to /map (Territory HQ).
 */
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Map } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import OnboardingQuest from "@/components/OnboardingQuest";
import SkillSuggestionCards from "@/components/SkillSuggestionCards";
import { useState } from "react";

const Index = () => {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const isSignedIn = !!user;

  // Onboarding state
  const showOnboarding = isSignedIn && profile && !profile.onboardingCompleted;
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

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

  /* ── Signed-in → redirect to /map ── */
  if (isSignedIn) {
    return <Navigate to="/map" replace />;
  }

  /* ── Signed-out landing ── */
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
};

export default Index;
