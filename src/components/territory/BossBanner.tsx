/**
 * BossBanner — Expiring banner overlay on top of the map.
 * Shows available boss battles with a dismiss/expire mechanism.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, X, ChevronRight } from "lucide-react";
import type { FutureSkill } from "@/hooks/use-future-skills";

interface BossBannerProps {
  availableBosses: { skill: FutureSkill; skillId: string }[];
  onLaunchBoss: (skillId: string, skillName: string) => void;
  onDismiss: () => void;
}

export default function BossBanner({ availableBosses, onLaunchBoss, onDismiss }: BossBannerProps) {
  const [visible, setVisible] = useState(true);
  const [expiresIn, setExpiresIn] = useState(30);

  // Auto-expire after 30 seconds
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setExpiresIn(prev => {
        if (prev <= 1) {
          setVisible(false);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, onDismiss]);

  if (!visible || availableBosses.length === 0) return null;

  const firstBoss = availableBosses[0];
  const count = availableBosses.length;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-md pointer-events-none"
        >
          <div
            className="relative rounded-xl px-4 py-3 flex items-center gap-3 overflow-hidden cursor-pointer group pointer-events-auto"
            onClick={() => onLaunchBoss(firstBoss.skillId, firstBoss.skill.name)}
            style={{
              background: "linear-gradient(135deg, hsl(262 40% 12% / 0.95), hsl(0 30% 12% / 0.95))",
              border: "1px solid hsl(45 90% 55% / 0.3)",
              boxShadow: "0 4px 24px hsl(45 90% 55% / 0.12), 0 0 0 1px hsl(262 60% 40% / 0.2), inset 0 1px 0 hsl(45 90% 55% / 0.08)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Animated shimmer */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(90deg, transparent 0%, hsl(45 90% 55% / 0.06) 50%, transparent 100%)",
              }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />

            {/* Icon */}
            <motion.div
              className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background: "linear-gradient(135deg, hsl(0 60% 45%), hsl(45 80% 45%))",
                boxShadow: "0 0 12px hsl(0 60% 50% / 0.3)",
              }}
            >
              <Swords className="h-5 w-5 text-white" />
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4
                  className="text-sm font-bold truncate"
                  style={{ fontFamily: "'Cinzel', serif", color: "hsl(45 90% 65%)" }}
                >
                  ⚔️ {count > 1 ? `${count} Boss Battles` : "Boss Battle"} Available
                </h4>
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {count > 1
                  ? `${firstBoss.skill.name} and ${count - 1} more — tap to challenge`
                  : `Challenge the ${firstBoss.skill.name} Arbiter`}
              </p>
            </div>

            {/* Timer + Arrow */}
            <div className="shrink-0 flex items-center gap-2">
              <span
                className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded"
                style={{
                  background: "hsl(0 0% 100% / 0.06)",
                  color: expiresIn <= 10 ? "hsl(0 60% 60%)" : "hsl(var(--muted-foreground))",
                }}
              >
                {expiresIn}s
              </span>
              <ChevronRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                style={{ color: "hsl(45 90% 65%)" }}
              />
            </div>

            {/* Dismiss button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setVisible(false);
                onDismiss();
              }}
              className="absolute top-1 right-1 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
