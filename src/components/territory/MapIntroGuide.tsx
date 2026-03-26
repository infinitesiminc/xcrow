/**
 * MapIntroGuide — Post-onboarding welcome for signed-in users (NPC Scout + tooltip tour)
 * and generic intro bubbles for anonymous visitors.
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MapPin, MousePointerClick, Compass, BookOpen, Swords, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNPCAvatar } from "@/lib/npc-avatar-pool";

const ANON_KEY = "xcrow_intro_seen";
const AUTH_KEY = "xcrow_welcome_tour_seen";

/* ── Anonymous guide steps (original) ── */
interface GuideStep {
  icon: React.ReactNode;
  title: string;
  body: string;
  position: "center" | "bottom-left" | "top-right" | "bottom-center" | "top-left" | "top-center";
}

const ANON_STEPS: GuideStep[] = [
  {
    icon: <Sparkles className="h-5 w-5" style={{ color: "hsl(var(--filigree-glow))" }} />,
    title: "Welcome to the World Map",
    body: "This is your AI-era skill landscape — 8 territories, 180+ skills. Explore what the future demands.",
    position: "center",
  },
  {
    icon: <MapPin className="h-5 w-5" style={{ color: "hsl(var(--territory-analytical))" }} />,
    title: "Each island is a territory",
    body: "From Circuit Peaks to Soul Springs — hover over any island to reveal its skills.",
    position: "bottom-left",
  },
  {
    icon: <MousePointerClick className="h-5 w-5" style={{ color: "hsl(var(--territory-technical))" }} />,
    title: "Click any skill node",
    body: "See demand stats, which kingdoms need it, and where it fits in your conquest.",
    position: "top-right",
  },
];

/* ── Signed-in tour steps (after NPC welcome) ── */
const AUTH_TOUR_STEPS: GuideStep[] = [
  {
    icon: <BookOpen className="h-5 w-5" style={{ color: "hsl(var(--filigree-glow))" }} />,
    title: "Quest Journal",
    body: "Open the Journal tab (top-left) to track your missions, intel collected, and battle scores.",
    position: "top-left",
  },
  {
    icon: <MapPin className="h-5 w-5" style={{ color: "hsl(var(--territory-creative))" }} />,
    title: "Explore Territories",
    body: "Click any glowing territory to reveal its skill nodes. Each skill has quests that earn you XP.",
    position: "center",
  },
  {
    icon: <Swords className="h-5 w-5" style={{ color: "hsl(var(--territory-technical))" }} />,
    title: "Talk to NPCs",
    body: "See the characters on the map? Click them for intel, challenges, and skill-forging quests.",
    position: "bottom-center",
  },
];

const POSITION_CLASSES: Record<string, string> = {
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  "bottom-left": "bottom-24 left-8",
  "top-right": "top-20 right-8",
  "top-left": "top-20 left-8",
  "top-center": "top-20 left-1/2 -translate-x-1/2",
  "bottom-center": "bottom-24 left-1/2 -translate-x-1/2",
};

const cinzel = { fontFamily: "'Cinzel', serif" };

/* ─── NPC Welcome Panel (Scout) ─── */
function ScoutWelcome({ onContinue }: { onContinue: () => void }) {
  const scoutAvatar = getNPCAvatar("scout");
  const hue = 150;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "hsl(0 0% 0% / 0.65)" }}
        onClick={onContinue}
      />

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-[4] w-full max-w-xl mx-4 mb-8"
      >
        <div
          className="rounded-xl border-2 overflow-hidden backdrop-blur-xl flex"
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 30% 8% / 0.95), hsl(${hue} 20% 12% / 0.95))`,
            borderColor: `hsl(${hue} 45% 35%)`,
            boxShadow: `0 0 50px hsl(${hue} 55% 30% / 0.4), inset 0 1px 0 hsl(${hue} 35% 28% / 0.3)`,
          }}
        >
          {/* Scout portrait */}
          <motion.div
            animate={{
              boxShadow: [
                `4px 0 15px hsl(${hue} 55% 40% / 0.2)`,
                `4px 0 30px hsl(${hue} 55% 40% / 0.45)`,
                `4px 0 15px hsl(${hue} 55% 40% / 0.2)`,
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-32 shrink-0 relative pointer-events-none"
            style={{ borderRight: `2px solid hsl(${hue} 45% 32%)` }}
          >
            <img src={scoutAvatar} alt="Scout" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(to right, transparent 60%, hsl(${hue} 30% 8% / 0.4))` }}
            />
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="px-5 pt-4 pb-2">
              <span
                className="text-[10px] uppercase tracking-[0.15em] font-medium"
                style={{ color: `hsl(${hue} 35% 52%)` }}
              >
                Wandering Scout
              </span>
              <h3
                className="text-lg font-bold tracking-wide"
                style={{ ...cinzel, color: `hsl(${hue} 45% 72%)` }}
              >
                Kael the Pathfinder
              </h3>
            </div>

            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.45 }}
              className="px-5 pb-3"
            >
              <div
                className="rounded-lg px-4 py-3 text-sm leading-relaxed"
                style={{
                  background: `hsl(${hue} 18% 10% / 0.7)`,
                  borderLeft: `3px solid hsl(${hue} 45% 42%)`,
                  color: `hsl(${hue} 12% 80%)`,
                  fontStyle: "italic",
                }}
              >
                "Welcome, adventurer! You've arrived at the World Map — your gateway to mastering
                the skills that define the AI era. I'll show you around."
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="px-5 pb-3"
            >
              <p className="text-xs text-muted-foreground leading-relaxed">
                Each territory holds skills that the job market demands. Explore them, complete quests, and build your empire. Let me point out a few things…
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.4 }}
              className="px-5 pb-4"
            >
              <Button
                size="lg"
                className="w-full gap-2 text-sm font-semibold"
                style={{
                  background: `linear-gradient(135deg, hsl(${hue} 45% 32%), hsl(${hue} 55% 42%))`,
                  color: "white",
                  boxShadow: `0 0 25px hsl(${hue} 55% 38% / 0.35)`,
                }}
                onClick={onContinue}
              >
                <Compass size={16} />
                Show Me Around
                <ChevronRight size={14} />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Tooltip Step Bubble ─── */
function TooltipBubble({
  step,
  total,
  current,
  onAdvance,
  onDismiss,
}: {
  step: GuideStep;
  total: number;
  current: number;
  onAdvance: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      key={current}
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute z-50 ${POSITION_CLASSES[step.position]}`}
    >
      <div
        className="max-w-xs rounded-xl backdrop-blur-xl p-4 cursor-pointer"
        onClick={onAdvance}
        style={{
          background: "hsl(var(--surface-stone) / 0.92)",
          border: "1px solid hsl(var(--filigree) / 0.3)",
          boxShadow: "0 8px 32px hsl(var(--emboss-shadow)), inset 0 1px 0 hsl(var(--emboss-light))",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {step.icon}
            <span className="text-sm font-bold text-foreground" style={cinzel}>
              {step.title}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            style={cinzel}
          >
            Skip
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">{step.body}</p>

        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 16 : 6,
                  background:
                    i === current
                      ? "hsl(var(--filigree-glow))"
                      : i < current
                        ? "hsl(var(--filigree) / 0.5)"
                        : "hsl(var(--border))",
                }}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {current < total - 1 ? "Click to continue" : "Click to begin"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Component ─── */

interface MapIntroGuideProps {
  isSignedIn?: boolean;
}

export default function MapIntroGuide({ isSignedIn = false }: MapIntroGuideProps) {
  const storageKey = isSignedIn ? AUTH_KEY : ANON_KEY;
  const steps = isSignedIn ? AUTH_TOUR_STEPS : ANON_STEPS;

  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"npc" | "tour">(isSignedIn ? "npc" : "tour");
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    if (!seen) setVisible(true);
  }, [storageKey]);

  // Auto-advance for anonymous tour only
  useEffect(() => {
    if (!visible || phase !== "tour" || isSignedIn) return;
    const timer = setTimeout(() => {
      if (step < steps.length - 1) setStep((s) => s + 1);
      else dismiss();
    }, 5500);
    return () => clearTimeout(timer);
  }, [step, visible, phase, isSignedIn]);

  const dismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(storageKey, "1");
  }, [storageKey]);

  const advance = useCallback(() => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }, [step, steps.length, dismiss]);

  const handleNPCContinue = useCallback(() => {
    setPhase("tour");
    setStep(0);
  }, []);

  if (!visible) return null;

  return (
    <AnimatePresence mode="wait">
      {phase === "npc" && isSignedIn ? (
        <ScoutWelcome key="scout" onContinue={handleNPCContinue} />
      ) : (
        <TooltipBubble
          key={`step-${step}`}
          step={steps[step]}
          total={steps.length}
          current={step}
          onAdvance={advance}
          onDismiss={dismiss}
        />
      )}
    </AnimatePresence>
  );
}
