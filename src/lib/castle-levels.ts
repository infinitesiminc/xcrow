/**
 * Castle Levels — progression tiers for the territory map.
 *
 * Each skill is a castle that evolves visually:
 *   Ruins (locked, < 150 XP) → Outpost (150 XP) → Fortress (500 XP) → Citadel (1200 XP) → Citadel+Glow (2500 XP)
 *
 * The game is never-ending: new job contexts always yield XP,
 * and diminishing returns from repeating the same context
 * encourages breadth.
 */

export type CastleTier = "ruins" | "outpost" | "fortress" | "citadel" | "grandmaster";

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
  { tier: "outpost" as const, threshold: 150, label: "Outpost", emoji: "🏕️" },
  { tier: "fortress" as const, threshold: 500, label: "Fortress", emoji: "🏰" },
  { tier: "citadel" as const, threshold: 1200, label: "Citadel", emoji: "⚔️" },
  { tier: "grandmaster" as const, threshold: 2500, label: "Grandmaster", emoji: "✨" },
] as const;

export const UNLOCK_THRESHOLD = 150; // XP needed to unlock (claim) a castle

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
 * Calculate XP earned for a skill in a simulation.
 * Base XP = 40. Score multiplier = overallScore / 50 (0x–2x).
 * Context bonus = +20 XP for first time in a new job context.
 * Max ~100 XP per skill per sim.
 */
export function calculateSkillXP(overallScore: number, isNewContext: boolean): number {
  const base = 40;
  const multiplier = Math.max(0, overallScore / 50);
  const scoreXP = Math.round(base * multiplier);
  const contextBonus = isNewContext ? 20 : 0;
  return Math.min(100, scoreXP + contextBonus);
}

/**
 * Calculate XP bonus for practicing in a new job context.
 * @deprecated Use calculateSkillXP instead
 */
export function contextXPBonus(contextCount: number): { base: number; bonus: number; total: number } {
  const base = 40;
  if (contextCount <= 1) return { base, bonus: 20, total: 60 };
  const penalty = Math.min(30, (contextCount - 1) * 8);
  return { base, bonus: -penalty, total: base - penalty };
}
