/**
 * BossMonster — Animated floating boss entity for L2 Boss Battle simulations.
 * Reacts in real-time to user performance: powers down on correct verdicts,
 * powers up on incorrect ones. Features idle floating animation, damage/rage
 * visual states, and a defeat sequence.
 */
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type BossState = "idle" | "damaged" | "enraged" | "defeated";

interface BossMonsterProps {
  /** 0–100 HP remaining */
  hp: number;
  maxHp: number;
  /** Current visual state */
  state: BossState;
  /** Boss name displayed beneath */
  name?: string;
  /** Number of checkpoints completed */
  checkpointsDone: number;
  totalCheckpoints: number;
}

/** SVG-based animated boss entity */
export default function BossMonster({
  hp,
  maxHp,
  state,
  name = "The Arbiter",
  checkpointsDone,
  totalCheckpoints,
}: BossMonsterProps) {
  const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const isLowHp = hpPct <= 30;
  const isDead = state === "defeated";

  // Color shifts based on state
  const coreColor = useMemo(() => {
    if (isDead) return "hsl(262 20% 25%)";
    if (state === "enraged") return "hsl(0 70% 50%)";
    if (state === "damaged") return "hsl(45 80% 55%)";
    return "hsl(262 80% 55%)";
  }, [state, isDead]);

  const glowColor = useMemo(() => {
    if (isDead) return "hsl(262 20% 15% / 0)";
    if (state === "enraged") return "hsl(0 70% 50% / 0.4)";
    if (state === "damaged") return "hsl(45 80% 55% / 0.3)";
    return "hsl(262 80% 55% / 0.25)";
  }, [state, isDead]);

  const eyeColor = useMemo(() => {
    if (isDead) return "hsl(262 10% 30%)";
    if (state === "enraged") return "hsl(0 90% 60%)";
    return "hsl(45 90% 60%)";
  }, [state, isDead]);

  return (
    <div className="relative flex flex-col items-center select-none" style={{ pointerEvents: "none" }}>
      {/* Boss name plate */}
      <motion.div
        className="text-center mb-1"
        animate={{ opacity: isDead ? 0.4 : 1 }}
      >
        <span
          className="text-[11px] font-bold uppercase tracking-[0.15em]"
          style={{
            fontFamily: "'Cinzel', serif",
            color: state === "enraged" ? "hsl(0 70% 60%)" : "hsl(262 80% 70%)",
            textShadow: `0 0 8px ${glowColor}`,
          }}
        >
          {isDead ? "💀" : "⚔️"} {name}
        </span>
      </motion.div>

      {/* HP Bar */}
      <div className="w-28 mb-2">
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{
            background: "hsl(262 30% 15%)",
            border: "1px solid hsl(262 40% 25%)",
          }}
        >
          <motion.div
            className="h-full rounded-full"
            animate={{
              width: `${hpPct}%`,
              background: hpPct > 60
                ? "hsl(0 70% 50%)"
                : hpPct > 30
                  ? "hsl(45 80% 55%)"
                  : "hsl(142 60% 50%)",
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              boxShadow: `0 0 6px ${hpPct > 60 ? "hsl(0 70% 50% / 0.4)" : hpPct > 30 ? "hsl(45 80% 55% / 0.3)" : "hsl(142 60% 50% / 0.4)"}`,
            }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[9px] text-muted-foreground font-mono">{Math.round(hpPct)}%</span>
          <span className="text-[9px] text-muted-foreground">{checkpointsDone}/{totalCheckpoints}</span>
        </div>
      </div>

      {/* Boss Body — SVG creature */}
      <motion.div
        className="relative"
        animate={
          isDead
            ? { y: 20, opacity: 0.3, rotate: 15, scale: 0.8 }
            : state === "enraged"
              ? { y: [0, -4, 2, -3, 0], scale: [1, 1.05, 0.98, 1.03, 1] }
              : { y: [0, -6, 0], scale: 1 }
        }
        transition={
          isDead
            ? { duration: 1.2, ease: "easeOut" }
            : state === "enraged"
              ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
              : { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <svg width="120" height="130" viewBox="0 0 120 130" fill="none">
          <defs>
            {/* Core glow filter */}
            <filter id="boss-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Damage flash */}
            <filter id="boss-damage" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feFlood floodColor="hsl(45 80% 55%)" floodOpacity="0.3" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Ambient aura */}
          <motion.circle
            cx="60"
            cy="55"
            r="45"
            fill="none"
            stroke={coreColor}
            strokeWidth="1"
            opacity={0.15}
            animate={{
              r: isDead ? [45, 45] : [42, 48, 42],
              opacity: isDead ? 0 : [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Outer shell — angular/crystalline body */}
          <motion.path
            d="M60 8 L95 35 L100 70 L80 100 L60 110 L40 100 L20 70 L25 35 Z"
            fill={isDead ? "hsl(262 15% 12%)" : "hsl(262 30% 14%)"}
            stroke={coreColor}
            strokeWidth={state === "enraged" ? 2.5 : 1.5}
            filter={state === "damaged" ? "url(#boss-damage)" : "url(#boss-glow)"}
            animate={{
              strokeOpacity: isDead ? 0.2 : [0.6, 1, 0.6],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Inner core pattern */}
          <motion.path
            d="M60 22 L82 40 L86 65 L72 88 L60 95 L48 88 L34 65 L38 40 Z"
            fill="none"
            stroke={coreColor}
            strokeWidth="0.8"
            strokeDasharray="4 3"
            animate={{ strokeDashoffset: isDead ? 0 : [0, -14] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            opacity={isDead ? 0.1 : 0.4}
          />

          {/* Central eye */}
          <motion.circle
            cx="60"
            cy="50"
            fill={eyeColor}
            filter="url(#boss-glow)"
            animate={{
              r: isDead ? [4, 4] : state === "enraged" ? [6, 8, 6] : [5, 6, 5],
              opacity: isDead ? 0.2 : 1,
            }}
            transition={{ duration: state === "enraged" ? 0.8 : 2, repeat: Infinity }}
          />

          {/* Eye slit pupil */}
          {!isDead && (
            <motion.ellipse
              cx="60"
              cy="50"
              rx="1.5"
              ry={state === "enraged" ? 8 : 5}
              fill="hsl(0 0% 5%)"
              animate={{
                ry: state === "enraged" ? [8, 3, 8] : [5, 4, 5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          {/* Side eyes */}
          {!isDead && (
            <>
              <motion.circle
                cx="42" cy="45" r="2.5"
                fill={eyeColor}
                opacity={0.7}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
              />
              <motion.circle
                cx="78" cy="45" r="2.5"
                fill={eyeColor}
                opacity={0.7}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.6 }}
              />
            </>
          )}

          {/* Crown / horns */}
          <motion.path
            d="M38 30 L30 12 L42 24 M60 20 L60 4 L60 20 M82 30 L90 12 L78 24"
            stroke={state === "enraged" ? "hsl(0 70% 50%)" : "hsl(262 60% 50%)"}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity={isDead ? 0.2 : 0.8}
          />

          {/* Rune marks on body */}
          {[
            { x: 48, y: 65, r: 2 },
            { x: 60, y: 72, r: 2.5 },
            { x: 72, y: 65, r: 2 },
          ].map((rune, i) => (
            <motion.circle
              key={i}
              cx={rune.x}
              cy={rune.y}
              r={rune.r}
              fill={coreColor}
              opacity={isDead ? 0.05 : 0.3}
              animate={isDead ? {} : { opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}

          {/* Defeat X marks */}
          {isDead && (
            <>
              <line x1="52" y1="43" x2="58" y2="57" stroke="hsl(0 60% 55%)" strokeWidth="2" opacity="0.6" />
              <line x1="58" y1="43" x2="52" y2="57" stroke="hsl(0 60% 55%)" strokeWidth="2" opacity="0.6" />
              <line x1="62" y1="43" x2="68" y2="57" stroke="hsl(0 60% 55%)" strokeWidth="2" opacity="0.6" />
              <line x1="68" y1="43" x2="62" y2="57" stroke="hsl(0 60% 55%)" strokeWidth="2" opacity="0.6" />
            </>
          )}
        </svg>

        {/* Particle effects around boss */}
        <AnimatePresence>
          {state === "damaged" && (
            <>
              {[0, 1, 2, 3].map(i => (
                <motion.div
                  key={`dmg-${i}`}
                  className="absolute text-xs"
                  initial={{ opacity: 1, y: 0, x: 30 + i * 15 }}
                  animate={{ opacity: 0, y: -25, x: 30 + i * 15 + (i % 2 ? 10 : -10) }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  style={{ top: "40%", left: 0 }}
                >
                  ✨
                </motion.div>
              ))}
            </>
          )}
          {state === "enraged" && (
            <>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={`rage-${i}`}
                  className="absolute text-xs"
                  initial={{ opacity: 0.8, scale: 1 }}
                  animate={{ opacity: [0.8, 0, 0.8], y: [0, -15, 0], scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
                  style={{ top: `${20 + i * 20}%`, left: `${15 + i * 30}%` }}
                >
                  🔥
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Status text */}
      <AnimatePresence mode="wait">
        <motion.span
          key={state}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-[10px] font-bold uppercase tracking-widest mt-1"
          style={{
            fontFamily: "'Cinzel', serif",
            color: isDead
              ? "hsl(142 60% 50%)"
              : state === "enraged"
                ? "hsl(0 70% 60%)"
                : state === "damaged"
                  ? "hsl(45 80% 60%)"
                  : "hsl(262 60% 60%)",
          }}
        >
          {isDead ? "☠️ Defeated" : state === "enraged" ? "🔥 Enraged" : state === "damaged" ? "⚡ Weakened" : "👁️ Watching"}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
