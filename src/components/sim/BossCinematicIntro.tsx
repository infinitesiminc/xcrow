/**
 * BossCinematicIntro — Full-screen cinematic reveal before a Boss Battle begins.
 * Now renders the selected boss character's unique silhouette, colors, and lore.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BossCharacter } from "@/lib/boss-roster";

interface BossCinematicIntroProps {
  skillName: string;
  boss?: BossCharacter;
  /** @deprecated Use boss.name instead */
  bossName?: string;
  onComplete: () => void;
}

export default function BossCinematicIntro({
  skillName,
  boss,
  bossName,
  onComplete,
}: BossCinematicIntroProps) {
  const [phase, setPhase] = useState<"title" | "reveal" | "ready">("title");
  const name = boss?.name || bossName || "The Arbiter";
  const title = boss?.title || "Guardian of forbidden knowledge";
  const hue = boss?.hue ?? 262;
  const bodyPath = boss?.bodyPath || "M60 8 L95 35 L100 70 L80 100 L60 110 L40 100 L20 70 L25 35 Z";
  const crownPath = boss?.crownPath || "M38 30 L30 12 L42 24 M60 20 L60 4 L60 20 M82 30 L90 12 L78 24";

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), 2000);
    const t2 = setTimeout(() => setPhase("ready"), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        background: `radial-gradient(ellipse at center, hsl(var(--sentinel-arena-bg)), hsl(var(--background)))`,
      }}
    >
      {/* Ambient particles — colored by boss hue */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            background: `hsl(${hue} 80% 70%)`,
            left: `${8 + (i * 7.5) % 85}%`,
            top: `${10 + (i * 11) % 75}%`,
          }}
          animate={{ opacity: [0, 0.4, 0], y: [0, -30, 0] }}
          transition={{ duration: 4 + (i % 3), repeat: Infinity, delay: i * 0.3 }}
        />
      ))}

      <div className="text-center relative z-10 max-w-md px-6">
        <AnimatePresence mode="wait">
          {/* Phase 1: Title card */}
          {phase === "title" && (
            <motion.div
              key="title"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.6 }}
              className="space-y-3"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-px mx-auto"
                style={{ background: `linear-gradient(90deg, transparent, hsl(${hue} 80% 55%), transparent)` }}
              />
              <span
                className="text-[11px] uppercase tracking-[0.25em] block"
                style={{ color: `hsl(${hue} 80% 70%)`, fontFamily: "'Cinzel', serif" }}
              >
                Boss Battle
              </span>
              <h2
                className="text-2xl font-bold text-foreground"
                style={{
                  fontFamily: "'Cinzel', serif",
                  textShadow: "0 0 20px hsl(var(--filigree-glow) / 0.4)",
                }}
              >
                {skillName}
              </h2>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                className="h-px mx-auto"
                style={{ background: `linear-gradient(90deg, transparent, hsl(${hue} 80% 55%), transparent)` }}
              />
            </motion.div>
          )}

          {/* Phase 2: Boss reveal — renders the boss's unique SVG */}
          {phase === "reveal" && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              <motion.div
                className="mx-auto relative"
                initial={{ y: 30 }}
                animate={{ y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              >
                <svg width="140" height="150" viewBox="0 0 120 130" className="mx-auto">
                  <defs>
                    <filter id="intro-glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <motion.circle
                    cx="60" cy="55" r="50"
                    fill="none" stroke={`hsl(${hue} 80% 55%)`} strokeWidth="1"
                    initial={{ r: 20, opacity: 0 }}
                    animate={{ r: [45, 50, 45], opacity: [0.1, 0.25, 0.1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <motion.path
                    d={bodyPath}
                    fill={`hsl(${hue} 30% 10%)`}
                    stroke={`hsl(${hue} 80% 55%)`}
                    strokeWidth="2"
                    filter="url(#intro-glow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5 }}
                  />
                  <motion.path
                    d={crownPath}
                    stroke={`hsl(${hue} 60% 50%)`}
                    strokeWidth="2" strokeLinecap="round" fill="none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ delay: 0.8 }}
                  />
                  <motion.circle
                    cx="60" cy="50"
                    fill="hsl(45 90% 60%)"
                    filter="url(#intro-glow)"
                    initial={{ r: 0 }}
                    animate={{ r: [5, 6, 5] }}
                    transition={{ delay: 1, duration: 2, repeat: Infinity }}
                  />
                </svg>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-lg font-bold"
                style={{
                  fontFamily: "'Cinzel', serif",
                  color: `hsl(${hue > 30 ? 0 : hue} 70% 60%)`,
                  textShadow: `0 0 12px hsl(${hue} 70% 50% / 0.4)`,
                }}
              >
                {name}
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 0.9 }}
                className="text-[13px] text-muted-foreground"
              >
                {title}
              </motion.p>
            </motion.div>
          )}

          {/* Phase 3: Ready */}
          {phase === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <span
                  className="text-[11px] uppercase tracking-[0.2em] block"
                  style={{ color: `hsl(${hue} 80% 70%)`, fontFamily: "'Cinzel', serif" }}
                >
                  Prepare yourself
                </span>
                <h3
                  className="text-xl font-bold"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    color: "hsl(45 90% 65%)",
                    textShadow: "0 0 16px hsl(45 90% 55% / 0.3)",
                  }}
                >
                  {name} awaits
                </h3>
                <p className="text-[13px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Identify the critical flaws in AI-generated future scenarios. 
                  Every correct verdict weakens the boss. Miss too many and it grows stronger.
                </p>
                {boss?.quote && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ delay: 0.4 }}
                    className="text-[12px] italic text-muted-foreground pt-2"
                  >
                    "{boss.quote}"
                  </motion.p>
                )}
              </div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  size="lg"
                  onClick={onComplete}
                  className="gap-2 text-sm rounded-xl px-8"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    background: `linear-gradient(135deg, hsl(${Math.max(0, hue - 30)} 70% 45%), hsl(${hue} 60% 40%))`,
                    boxShadow: `0 0 25px hsl(${hue} 70% 50% / 0.3), 0 0 50px hsl(${hue} 80% 55% / 0.15)`,
                    border: `1px solid hsl(${hue} 60% 50% / 0.3)`,
                  }}
                >
                  <Swords className="h-4 w-4" />
                  ⚔️ Begin Boss Battle
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
