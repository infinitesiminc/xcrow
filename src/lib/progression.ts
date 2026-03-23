/**
 * Unified Progression System
 *
 * Three nested layers where each feeds the next:
 *   Sim → Skill Rings → Castle Tier → Kingdom Tier → Player Rank
 *
 * Layer 1: SKILL CASTLES (per skill, the atom)
 *   - 3-Ring model: Foundation (passive), AI Mastery (L1 sims), Human Edge (L2 sims)
 *   - Castle tier = derived from ring fill, using CASTLE_TIERS thresholds
 *   - Replaces the old duplicate LEVELS from skill-map.ts
 *
 * Layer 2: KINGDOMS (per role)
 *   - Scouted → Contested → Fortified → Conquered
 *   - Driven by: # of linked skill castles at each tier
 *   - L2 unlocks at "Fortified" (3+ skills at Fortress tier)
 *
 * Layer 3: PLAYER RANK (aggregate)
 *   - Recruit → Explorer → Strategist → Commander → Legend
 *   - Driven by: breadth of castles + kingdoms, not raw XP
 */

import { CASTLE_TIERS, getCastleState, type CastleTier, type CastleState } from "@/lib/castle-levels";
import { calculateGrowth, type GrowthDimensions } from "@/lib/skill-growth";

// ═══════════════════════════════════════════════════════════════
//  LAYER 1: SKILL CASTLES — re-export castle-levels as the single source
// ═══════════════════════════════════════════════════════════════

// Re-export everything from castle-levels so consumers import from one place
export { CASTLE_TIERS, getCastleState, type CastleTier, type CastleState };
export { calculateGrowth, type GrowthDimensions };

/**
 * Castle tier names mapped to the old "level" names for backward compat.
 * Ruins=Novice, Outpost=Apprentice, Fortress=Adept, Citadel=Master, Grandmaster=Grandmaster
 */
export const CASTLE_TIER_TO_LEVEL: Record<CastleTier, string> = {
  ruins: "Novice",
  outpost: "Apprentice",
  fortress: "Adept",
  citadel: "Master",
  grandmaster: "Grandmaster",
};

// ═══════════════════════════════════════════════════════════════
//  LAYER 2: KINGDOMS (per role)
// ═══════════════════════════════════════════════════════════════

export type KingdomTier = "scouted" | "contested" | "fortified" | "conquered";

export interface KingdomState {
  tier: KingdomTier;
  label: string;
  emoji: string;
  /** Whether L2 content is unlocked for this kingdom */
  l2Unlocked: boolean;
  /** Descriptive requirement for next tier */
  nextRequirement: string | null;
}

export const KINGDOM_TIERS = [
  { tier: "scouted" as const, label: "Scouted", emoji: "👁️" },
  { tier: "contested" as const, label: "Contested", emoji: "⚔️" },
  { tier: "fortified" as const, label: "Fortified", emoji: "🏰" },
  { tier: "conquered" as const, label: "Conquered", emoji: "👑" },
] as const;

/**
 * Derive kingdom tier from the castle tiers of skills linked to this role.
 *
 * - Scouted: viewed/bookmarked (no sim activity)
 * - Contested: 1+ linked skill at Outpost+ tier
 * - Fortified: 3+ linked skills at Fortress+ tier  → unlocks L2
 * - Conquered: All linked skills at Citadel+ tier
 */
export function getKingdomTier(linkedSkillCastles: CastleTier[]): KingdomState {
  if (linkedSkillCastles.length === 0) {
    return {
      tier: "scouted",
      label: "Scouted",
      emoji: "👁️",
      l2Unlocked: false,
      nextRequirement: "Complete a simulation to claim your first skill castle",
    };
  }

  const tierOrder: Record<CastleTier, number> = {
    ruins: 0,
    outpost: 1,
    fortress: 2,
    citadel: 3,
    grandmaster: 4,
  };

  const atOutpostPlus = linkedSkillCastles.filter(t => tierOrder[t] >= 1).length;
  const atFortressPlus = linkedSkillCastles.filter(t => tierOrder[t] >= 2).length;
  const atCitadelPlus = linkedSkillCastles.filter(t => tierOrder[t] >= 3).length;
  const totalLinked = linkedSkillCastles.length;

  // Conquered: ALL linked skills at Citadel+
  if (atCitadelPlus >= totalLinked && totalLinked > 0) {
    return {
      tier: "conquered",
      label: "Conquered",
      emoji: "👑",
      l2Unlocked: true,
      nextRequirement: null,
    };
  }

  // Fortified: 3+ linked skills at Fortress+
  if (atFortressPlus >= 3) {
    const remaining = totalLinked - atCitadelPlus;
    return {
      tier: "fortified",
      label: "Fortified",
      emoji: "🏰",
      l2Unlocked: true,
      nextRequirement: remaining > 0
        ? `Level ${remaining} more skill${remaining > 1 ? "s" : ""} to Citadel to conquer this kingdom`
        : null,
    };
  }

  // Contested: 1+ linked skill at Outpost+
  if (atOutpostPlus >= 1) {
    const neededForFortified = Math.max(0, 3 - atFortressPlus);
    return {
      tier: "contested",
      label: "Contested",
      emoji: "⚔️",
      l2Unlocked: false,
      nextRequirement: `Level ${neededForFortified} more skill${neededForFortified > 1 ? "s" : ""} to Fortress to reach Fortified`,
    };
  }

  // Scouted: no skills at Outpost yet
  return {
    tier: "scouted",
    label: "Scouted",
    emoji: "👁️",
    l2Unlocked: false,
    nextRequirement: "Claim your first skill castle (150 XP) to contest this kingdom",
  };
}

// ═══════════════════════════════════════════════════════════════
//  LAYER 3: PLAYER RANK (aggregate)
// ═══════════════════════════════════════════════════════════════

export type PlayerRankName = "Recruit" | "Explorer" | "Strategist" | "Commander" | "Legend";

export interface PlayerRankState {
  rank: PlayerRankName;
  emoji: string;
  index: number;
  /** Progress toward next rank, 0-100 */
  progress: number;
  nextRequirement: string | null;
}

export const PLAYER_RANKS = [
  { rank: "Recruit" as const, emoji: "🌱", castlesAtOutpost: 0, castlesAtFortress: 0, kingdomsFortified: 0, kingdomsConquered: 0 },
  { rank: "Explorer" as const, emoji: "🧭", castlesAtOutpost: 5, castlesAtFortress: 0, kingdomsFortified: 0, kingdomsConquered: 0 },
  { rank: "Strategist" as const, emoji: "🗡️", castlesAtOutpost: 0, castlesAtFortress: 15, kingdomsFortified: 2, kingdomsConquered: 0 },
  { rank: "Commander" as const, emoji: "⚔️", castlesAtOutpost: 0, castlesAtFortress: 30, kingdomsFortified: 0, kingdomsConquered: 5 },
  { rank: "Legend" as const, emoji: "✨", castlesAtOutpost: 0, castlesAtFortress: 0, kingdomsFortified: 0, kingdomsConquered: 10 },
] as const;

/**
 * Derive player rank from breadth metrics.
 *
 * Recruit:     0 requirements
 * Explorer:    5 castles at Outpost+
 * Strategist:  15 castles at Fortress+ AND 2 Kingdoms Fortified
 * Commander:   30 castles at Fortress+ AND 5 Kingdoms Conquered
 * Legend:      50 castles at Citadel+ AND 10 Kingdoms Conquered
 */
export function getPlayerRank(
  castleTiers: CastleTier[],
  kingdomTiers: KingdomTier[],
): PlayerRankState {
  const tierOrder: Record<CastleTier, number> = {
    ruins: 0,
    outpost: 1,
    fortress: 2,
    citadel: 3,
    grandmaster: 4,
  };

  const atOutpost = castleTiers.filter(t => tierOrder[t] >= 1).length;
  const atFortress = castleTiers.filter(t => tierOrder[t] >= 2).length;
  const atCitadel = castleTiers.filter(t => tierOrder[t] >= 3).length;

  const kingdomsFortified = kingdomTiers.filter(t => t === "fortified" || t === "conquered").length;
  const kingdomsConquered = kingdomTiers.filter(t => t === "conquered").length;

  // Check from highest to lowest
  // Legend: 50 castles at Citadel+ AND 10 Kingdoms Conquered
  if (atCitadel >= 50 && kingdomsConquered >= 10) {
    return { rank: "Legend", emoji: "✨", index: 4, progress: 100, nextRequirement: null };
  }

  // Commander: 30 castles at Fortress+ AND 5 Kingdoms Conquered
  if (atFortress >= 30 && kingdomsConquered >= 5) {
    const castleProgress = Math.min(100, Math.round((atCitadel / 50) * 50));
    const kingdomProgress = Math.min(100, Math.round((kingdomsConquered / 10) * 50));
    return {
      rank: "Commander",
      emoji: "⚔️",
      index: 3,
      progress: Math.round((castleProgress + kingdomProgress) / 2),
      nextRequirement: `${50 - atCitadel} more Citadel castles + ${10 - kingdomsConquered} more Conquered kingdoms for Legend`,
    };
  }

  // Strategist: 15 castles at Fortress+ AND 2 Kingdoms Fortified
  if (atFortress >= 15 && kingdomsFortified >= 2) {
    const castleProgress = Math.min(100, Math.round((atFortress / 30) * 50));
    const kingdomProgress = Math.min(100, Math.round((kingdomsConquered / 5) * 50));
    return {
      rank: "Strategist",
      emoji: "🗡️",
      index: 2,
      progress: Math.round((castleProgress + kingdomProgress) / 2),
      nextRequirement: `${30 - atFortress} more Fortress castles + ${5 - kingdomsConquered} more Conquered kingdoms for Commander`,
    };
  }

  // Explorer: 5 castles at Outpost+
  if (atOutpost >= 5) {
    const castleProgress = Math.min(100, Math.round((atFortress / 15) * 60));
    const kingdomProgress = Math.min(100, Math.round((kingdomsFortified / 2) * 40));
    return {
      rank: "Explorer",
      emoji: "🧭",
      index: 1,
      progress: Math.round((castleProgress + kingdomProgress) / 2),
      nextRequirement: `${15 - atFortress} more Fortress castles + ${2 - kingdomsFortified} more Fortified kingdoms for Strategist`,
    };
  }

  // Recruit
  return {
    rank: "Recruit",
    emoji: "🌱",
    index: 0,
    progress: Math.min(100, Math.round((atOutpost / 5) * 100)),
    nextRequirement: `${5 - atOutpost} more Outpost castles for Explorer`,
  };
}

// ═══════════════════════════════════════════════════════════════
//  BACKWARD COMPATIBILITY — aliasing old LEVELS to CASTLE_TIERS
// ═══════════════════════════════════════════════════════════════

/** @deprecated Use getCastleState() from progression.ts instead */
export const LEVELS = CASTLE_TIERS.map(t => ({
  name: CASTLE_TIER_TO_LEVEL[t.tier] as "Novice" | "Apprentice" | "Adept" | "Master" | "Grandmaster",
  threshold: t.threshold,
}));

export type LevelName = (typeof LEVELS)[number]["name"];

/** @deprecated Use getCastleState() instead */
export function getLevel(xp: number): { name: LevelName; index: number } {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].threshold) return { name: LEVELS[i].name, index: i };
  }
  return { name: "Novice", index: 0 };
}

/** @deprecated Use getCastleState().tierProgress instead */
export function levelProgress(xp: number): number {
  return getCastleState(xp).tierProgress;
}

/** @deprecated */
export function getNextLevel(xp: number): { name: LevelName; threshold: number; xpNeeded: number } | null {
  const castle = getCastleState(xp);
  if (castle.xpToNextTier === null) return null;
  const nextIdx = LEVELS.findIndex(l => l.threshold > xp);
  if (nextIdx < 0) return null;
  return { name: LEVELS[nextIdx].name, threshold: LEVELS[nextIdx].threshold, xpNeeded: castle.xpToNextTier };
}
