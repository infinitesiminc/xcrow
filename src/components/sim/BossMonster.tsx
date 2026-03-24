/**
 * BossMonster — Animated floating boss entity for L2 Boss Battle simulations.
 * Each boss has a unique frightening animal form with creature-specific detail paths.
 */
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BossCharacter } from "@/lib/boss-roster";

export type BossState = "idle" | "damaged" | "enraged" | "defeated";

interface BossMonsterProps {
  hp: number;
  maxHp: number;
  state: BossState;
  name?: string;
  checkpointsDone: number;
  totalCheckpoints: number;
  boss?: BossCharacter;
}

function makeColors(hue: number, state: BossState, isDead: boolean) {
  const core = isDead
    ? `hsl(${hue} 20% 25%)`
    : state === "enraged"
      ? `hsl(0 70% 50%)`
      : state === "damaged"
        ? `hsl(45 80% 55%)`
        : `hsl(${hue} 80% 55%)`;

  const glow = isDead
    ? `hsl(${hue} 20% 15% / 0)`
    : state === "enraged"
      ? `hsl(0 70% 50% / 0.4)`
      : state === "damaged"
        ? `hsl(45 80% 55% / 0.3)`
        : `hsl(${hue} 80% 55% / 0.25)`;

  const eye = isDead
    ? `hsl(${hue} 10% 30%)`
    : state === "enraged"
      ? `hsl(0 90% 60%)`
      : `hsl(45 90% 60%)`;

  const nameplate = state === "enraged"
    ? `hsl(0 70% 60%)`
    : `hsl(${hue} 80% 70%)`;

  const statusColor = isDead
    ? "hsl(142 60% 50%)"
    : state === "enraged"
      ? "hsl(0 70% 60%)"
      : state === "damaged"
        ? "hsl(45 80% 60%)"
        : `hsl(${hue} 60% 60%)`;

  const crown = state === "enraged"
    ? `hsl(0 70% 50%)`
    : `hsl(${hue} 60% 50%)`;

  return { core, glow, eye, nameplate, statusColor, crown };
}

const DEFAULT_BOSS: BossCharacter = {
  id: "arbiter",
  name: "The Arbiter",
  title: "Guardian of Forbidden Knowledge",
  hue: 262,
  bodyPath: "M40 8 L28 2 L26 30 L16 48 L14 70 L22 94 L38 112 L60 120 L82 112 L98 94 L106 70 L104 48 L94 30 L92 2 L80 8 L60 16 Z",
  innerPath: "M45 30 L35 44 L32 64 L38 84 L52 100 L60 104 L68 100 L82 84 L88 64 L85 44 L75 30 L60 24 Z",
  crownPath: "M28 2 L20 -10 L30 8 M92 2 L100 -10 L90 8",
  detailPaths: [],
  eyeLayout: "dual",
  eyePositions: [{ cx: 42, cy: 55, r: 7 }, { cx: 78, cy: 55, r: 7 }],
  runes: [{ x: 60, y: 80, r: 2.5 }],
  quote: "Every legend begins with a single quest.",
  emoji: "🦉",
  damageParticle: "🪶",
  rageParticle: "🔥",
};

export default function BossMonster({
  hp, maxHp, state, name, checkpointsDone, totalCheckpoints, boss,
}: BossMonsterProps) {
  const b = boss || DEFAULT_BOSS;
  const displayName = name || b.name;
  const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const isDead = state === "defeated";
  const colors = useMemo(() => makeColors(b.hue, state, isDead), [b.hue, state, isDead]);

  const filterId = `boss-glow-${b.id}`;
  const damageFilterId = `boss-damage-${b.id}`;

  return (
    <div className="relative flex flex-col items-center select-none" style={{ pointerEvents: "none" }}>
      {/* Name plate */}
      <motion.div className="text-center mb-1" animate={{ opacity: isDead ? 0.4 : 1 }}>
        <span
          className="text-[11px] font-bold uppercase tracking-[0.15em]"
          style={{
            fontFamily: "'Cinzel', serif",
            color: colors.nameplate,
            textShadow: `0 0 8px ${colors.glow}`,
          }}
        >
          {isDead ? "💀" : b.emoji} {displayName}
        </span>
      </motion.div>

      {/* HP Bar */}
      <div className="w-28 mb-2">
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{
            background: `hsl(${b.hue} 30% 15%)`,
            border: `1px solid hsl(${b.hue} 40% 25%)`,
          }}
        >
          <motion.div
            className="h-full rounded-full"
            animate={{
              width: `${hpPct}%`,
              background: hpPct > 60 ? "hsl(0 70% 50%)" : hpPct > 30 ? "hsl(45 80% 55%)" : "hsl(142 60% 50%)",
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

      {/* Boss Body SVG */}
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
        <svg width="120" height="130" viewBox="-10 -15 140 160" fill="none">
          <defs>
            <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id={damageFilterId} x="-20%" y="-20%" width="140%" height="140%">
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
            cx="60" cy="60" r="50"
            fill="none" stroke={colors.core} strokeWidth="1" opacity={0.15}
            animate={{
              r: isDead ? [50, 50] : [46, 54, 46],
              opacity: isDead ? 0 : [0.08, 0.18, 0.08],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Creature detail paths (legs, tentacles, wings, teeth) */}
          {b.detailPaths.map((d, i) => (
            <motion.path
              key={`detail-${i}`}
              d={d}
              fill="none"
              stroke={colors.core}
              strokeWidth={1.2}
              strokeLinecap="round"
              opacity={isDead ? 0.15 : 0.6}
              animate={isDead ? {} : { opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}

          {/* Outer body shell */}
          <motion.path
            d={b.bodyPath}
            fill={isDead ? `hsl(${b.hue} 15% 12%)` : `hsl(${b.hue} 30% 14%)`}
            stroke={colors.core}
            strokeWidth={state === "enraged" ? 2.5 : 1.5}
            filter={state === "damaged" ? `url(#${damageFilterId})` : `url(#${filterId})`}
            animate={{ strokeOpacity: isDead ? 0.2 : [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Inner pattern */}
          <motion.path
            d={b.innerPath}
            fill="none"
            stroke={colors.core}
            strokeWidth="0.8"
            strokeDasharray="4 3"
            animate={{ strokeDashoffset: isDead ? 0 : [0, -14] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            opacity={isDead ? 0.1 : 0.4}
          />

          {/* Crown / horns / ears */}
          {b.crownPath && (
            <motion.path
              d={b.crownPath}
              stroke={colors.crown}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity={isDead ? 0.2 : 0.8}
            />
          )}

          {/* Eyes using eyePositions */}
          {b.eyePositions.map((eye, i) => (
            <g key={`eye-${i}`}>
              <motion.circle
                cx={eye.cx} cy={eye.cy}
                fill={colors.eye}
                filter={`url(#${filterId})`}
                animate={{
                  r: isDead ? [eye.r * 0.6, eye.r * 0.6] : state === "enraged"
                    ? [eye.r, eye.r * 1.3, eye.r]
                    : [eye.r * 0.85, eye.r, eye.r * 0.85],
                  opacity: isDead ? 0.15 : 1,
                }}
                transition={{ duration: state === "enraged" ? 0.8 : 2, repeat: Infinity, delay: i * 0.15 }}
              />
              {!isDead && (
                <motion.ellipse
                  cx={eye.cx} cy={eye.cy}
                  rx={eye.r * 0.22}
                  ry={state === "enraged" ? eye.r * 1.2 : eye.r * 0.8}
                  fill="hsl(0 0% 5%)"
                  animate={{
                    ry: state === "enraged"
                      ? [eye.r * 1.2, eye.r * 0.4, eye.r * 1.2]
                      : [eye.r * 0.8, eye.r * 0.6, eye.r * 0.8],
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                />
              )}
            </g>
          ))}

          {/* Rune marks */}
          {b.runes.map((rune, i) => (
            <motion.circle
              key={`rune-${i}`}
              cx={rune.x} cy={rune.y} r={rune.r}
              fill={colors.core}
              opacity={isDead ? 0.05 : 0.3}
              animate={isDead ? {} : { opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}

          {/* Defeat X marks */}
          {isDead && (
            <>
              {b.eyePositions.map((eye, i) => (
                <g key={`x-${i}`}>
                  <line x1={eye.cx - 4} y1={eye.cy - 5} x2={eye.cx + 4} y2={eye.cy + 5} stroke="hsl(0 60% 55%)" strokeWidth="2" opacity="0.6" />
                  <line x1={eye.cx + 4} y1={eye.cy - 5} x2={eye.cx - 4} y2={eye.cy + 5} stroke="hsl(0 60% 55%)" strokeWidth="2" opacity="0.6" />
                </g>
              ))}
            </>
          )}
        </svg>

        {/* Particle effects */}
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
                  {b.damageParticle}
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
                  {b.rageParticle}
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
          style={{ fontFamily: "'Cinzel', serif", color: colors.statusColor }}
        >
          {isDead ? "☠️ Defeated" : state === "enraged" ? `${b.rageParticle} Enraged` : state === "damaged" ? "⚡ Weakened" : `${b.emoji} Watching`}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
