/**
 * MapIntroGuide — Auto-play coach bubbles that greet and guide first-time visitors.
 * Uses localStorage to track whether the intro has been seen.
 * 4 steps that auto-advance, each pointing at a map feature.
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MapPin, MousePointerClick, UserPlus } from "lucide-react";

const STORAGE_KEY = "xcrow_intro_seen";

interface GuideStep {
  icon: React.ReactNode;
  title: string;
  body: string;
  position: "center" | "bottom-left" | "top-right" | "bottom-center";
}

const STEPS: GuideStep[] = [
  {
    icon: <Sparkles className="h-5 w-5 text-primary" />,
    title: "Welcome to your Territory Map",
    body: "This is your AI-era skill landscape — 8 domains, 180+ skills. Explore what the future demands.",
    position: "center",
  },
  {
    icon: <MapPin className="h-5 w-5 text-primary" />,
    title: "Each island is a domain",
    body: "From AI & Data to Leadership & Ethics — hover over any island to see its skills.",
    position: "bottom-left",
  },
  {
    icon: <MousePointerClick className="h-5 w-5 text-primary" />,
    title: "Click any skill node",
    body: "See demand stats, which roles need it, and where it fits in your career path.",
    position: "top-right",
  },
  {
    icon: <UserPlus className="h-5 w-5 text-primary" />,
    title: "Ready to claim your territory?",
    body: "Create a free account to track your progress, run simulations, and build your skill map.",
    position: "bottom-center",
  },
];

const POSITION_CLASSES: Record<string, string> = {
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  "bottom-left": "bottom-24 left-8",
  "top-right": "top-20 right-8",
  "bottom-center": "bottom-24 left-1/2 -translate-x-1/2",
};

const AUTO_ADVANCE_MS = 5500;

export default function MapIntroGuide() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setVisible(true);
  }, []);

  // Auto-advance timer
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      if (step < STEPS.length - 1) {
        setStep((s) => s + 1);
      } else {
        dismiss();
      }
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [step, visible]);

  const dismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  }, []);

  const advance = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }, [step, dismiss]);

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.95 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={`absolute z-50 ${POSITION_CLASSES[current.position]}`}
      >
        <div
          className="max-w-xs rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl p-4 cursor-pointer"
          onClick={advance}
        >
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {current.icon}
              <span className="text-sm font-bold text-foreground">{current.title}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismiss();
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip
            </button>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">{current.body}</p>

          {/* Progress dots */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === step ? "w-4 bg-primary" : i < step ? "w-1.5 bg-primary/50" : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {step < STEPS.length - 1 ? "Click to continue" : "Click to start"}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
