/**
 * Index — Guest landing page (The Gate).
 * Authenticated users are redirected to /map (Territory HQ).
 */
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Map, Sword, Sparkles } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import OnboardingQuest from "@/components/OnboardingQuest";
import SkillSuggestionCards from "@/components/SkillSuggestionCards";
import { useState } from "react";
import xcrowLogo from "@/assets/xcrow-logo.png";

const KINGDOM_CARDS = [
  { title: "Product Manager", emoji: "🎯", territory: "Strategic", color: "var(--territory-strategic)" },
  { title: "Data Analyst", emoji: "📊", territory: "Analytical", color: "var(--territory-analytical)" },
  { title: "UX Designer", emoji: "🎨", territory: "Creative", color: "var(--territory-creative)" },
];

const Index = () => {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const isSignedIn = !!user;

  const showOnboarding = isSignedIn && profile && !profile.onboardingCompleted;
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

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

  if (isSignedIn) {
    return <Navigate to="/map" replace />;
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(var(--filigree-glow) / 0.06), transparent 70%)" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg relative"
      >
        {/* Crow mascot */}
        <motion.img
          src={xcrowLogo}
          alt="Xcrow"
          className="h-20 w-20 mx-auto mb-4 drop-shadow-[0_0_12px_hsl(var(--filigree-glow)/0.3)]"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        <h1 className="text-3xl md:text-4xl font-fantasy font-bold text-foreground mb-3">
          Your Territory Awaits
        </h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          Scout kingdoms, complete quests, and conquer skill territories in the age of AI
        </p>

        {/* Floating kingdom cards */}
        <div className="flex justify-center gap-3 mb-6">
          {KINGDOM_CARDS.map((k, i) => (
            <motion.div
              key={k.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="rounded-xl border border-[hsl(var(--filigree)/0.15)] px-3 py-2.5 text-center cursor-default"
              style={{
                background: "hsl(var(--surface-stone))",
                boxShadow: `inset 0 1px 0 hsl(var(--emboss-light)), 0 2px 8px hsl(var(--emboss-shadow))`,
              }}
            >
              <span className="text-lg block mb-0.5">{k.emoji}</span>
              <span className="text-[10px] font-semibold text-foreground leading-tight block">{k.title}</span>
              <span className="text-[9px] font-mono block mt-0.5" style={{ color: `hsl(${k.color})` }}>
                {k.territory}
              </span>
            </motion.div>
          ))}
        </div>

        <SkillSuggestionCards />

        <div className="flex gap-3 justify-center mt-6">
          <Button size="lg" onClick={() => navigate("/map")}
            style={{ boxShadow: "0 0 16px hsl(var(--filigree-glow) / 0.2)" }}>
            <Map className="h-4 w-4 mr-2" />
            Enter the World Map
          </Button>
        </div>

        {/* Social proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-[11px] text-muted-foreground mt-4 flex items-center justify-center gap-1.5"
        >
          <Sparkles className="h-3 w-3 text-[hsl(var(--filigree-glow))]" />
          21,000+ kingdoms to scout · 34,000+ quests available
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Index;
