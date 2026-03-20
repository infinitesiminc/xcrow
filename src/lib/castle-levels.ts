/**
 * Castle Levels — progression tiers for the territory map.
 *
 * Each skill is a castle that evolves visually:
 *   Ruins (locked, < 100 XP) → Outpost (100 XP) → Fortress (300 XP) → Citadel (600 XP)
 *
 * The game is never-ending: new job contexts always yield XP,
 * and diminishing returns from repeating the same context
 * encourages breadth.
 */

export type CastleTier = "ruins" | "outpost" | "fortress" | "citadel";

export interface CastleState {
  tier: CastleTier;
  label: string;
  emoji: string;
  unlocked: boolean;
  /** How "full" the current tier is, 0-100 */
  tierProgress: number;
  xpToNextTier: number | null;
}

export const CASTLE_TIERS = [
  { tier: "ruins" as const, threshold: 0, label: "Ruins", emoji: "🏚️" },
  { tier: "outpost" as const, threshold: 100, label: "Outpost", emoji: "🏕️" },
  { tier: "fortress" as const, threshold: 300, label: "Fortress", emoji: "🏰" },
  { tier: "citadel" as const, threshold: 600, label: "Citadel", emoji: "⚔️" },
] as const;

export const UNLOCK_THRESHOLD = 100; // XP needed to unlock (claim) a castle

export function getCastleState(xp: number): CastleState {
  let currentIdx = 0;
  for (let i = CASTLE_TIERS.length - 1; i >= 0; i--) {
    if (xp >= CASTLE_TIERS[i].threshold) {
      currentIdx = i;
      break;
    }
  }

  const current = CASTLE_TIERS[currentIdx];
  const next = currentIdx < CASTLE_TIERS.length - 1 ? CASTLE_TIERS[currentIdx + 1] : null;

  const tierProgress = next
    ? Math.min(100, Math.round(((xp - current.threshold) / (next.threshold - current.threshold)) * 100))
    : 100;

  return {
    tier: current.tier,
    label: current.label,
    emoji: current.emoji,
    unlocked: xp >= UNLOCK_THRESHOLD,
    tierProgress,
    xpToNextTier: next ? next.threshold - xp : null,
  };
}

/**
 * Calculate XP bonus for practicing in a new job context.
 * Base XP = 100. New context = +25 bonus. Repeated context = -25 penalty (min 50).
 */
export function contextXPBonus(contextCount: number): { base: number; bonus: number; total: number } {
  const base = 100;
  if (contextCount <= 1) return { base, bonus: 25, total: 125 };
  // Repeated — diminishing but never zero
  const penalty = Math.min(50, (contextCount - 1) * 10);
  return { base, bonus: -penalty, total: base - penalty };
}
