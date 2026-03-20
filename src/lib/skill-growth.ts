/**
 * Skill Growth Dimensions — every skill has 3 layers of mastery.
 *
 * 1. Foundation — core knowledge (widely available in curricula)
 * 2. AI Mastery — understanding how AI reshapes this skill
 * 3. Human Edge — strengthening the uniquely human aspect
 *
 * Coverage tiers are framed positively:
 *   "Widely Taught" / "Growing" / "Emerging" — never "not covered"
 */

export type CoverageTier = "widely_taught" | "growing" | "emerging";

export interface GrowthDimensions {
  foundation: { tier: CoverageTier; label: string };
  aiMastery: { score: number; label: string };   // 0-100 from sim scores
  humanEdge: { score: number; label: string };    // 0-100 from sim scores
  filledRings: number; // 0-3 quick summary
}

/**
 * Derive coverage tier from AI exposure score.
 * Lower AI exposure → more traditional/widely taught.
 * Higher AI exposure → fewer programs cover the AI dimension.
 */
export function getCoverageTier(aiExposure: number): CoverageTier {
  if (aiExposure <= 35) return "widely_taught";
  if (aiExposure <= 65) return "growing";
  return "emerging";
}

export const COVERAGE_LABELS: Record<CoverageTier, string> = {
  widely_taught: "Widely Taught",
  growing: "Growing in Curricula",
  emerging: "Emerging Skill",
};

export const DIMENSION_INFO = {
  foundation: {
    label: "Foundation",
    emoji: "🎓",
    description: "Core knowledge available in many programs",
  },
  aiMastery: {
    label: "AI Mastery",
    emoji: "⚡",
    description: "How AI reshapes this skill — tools, workflows, augmentation",
  },
  humanEdge: {
    label: "Human Edge",
    emoji: "✦",
    description: "What AI can't replace — judgment, empathy, creativity",
  },
} as const;

/**
 * Calculate growth dimensions from simulation data.
 *
 * @param aiExposure - from SKILL_TAXONOMY
 * @param xp - accumulated XP for this skill
 * @param simScores - aggregated sim scores for this skill
 */
export function calculateGrowth(
  aiExposure: number,
  xp: number,
  simScores?: {
    avgToolAwareness?: number;
    avgAdaptiveThinking?: number;
    avgHumanValueAdd?: number;
    avgDomainJudgment?: number;
  }
): GrowthDimensions {
  const tier = getCoverageTier(aiExposure);

  // Foundation is "unlocked" for widely taught skills, partially for others
  const foundationScore = tier === "widely_taught" ? 80 : tier === "growing" ? 50 : 20;

  // AI Mastery from sim scores (tool awareness + adaptive thinking)
  const aiScore = simScores
    ? Math.round(((simScores.avgToolAwareness || 0) + (simScores.avgAdaptiveThinking || 0)) / 2)
    : 0;

  // Human Edge from sim scores (human value add + domain judgment)
  const humanScore = simScores
    ? Math.round(((simScores.avgHumanValueAdd || 0) + (simScores.avgDomainJudgment || 0)) / 2)
    : 0;

  // Count filled rings (threshold: 40+)
  let filledRings = 0;
  if (foundationScore >= 40) filledRings++;
  if (aiScore >= 40) filledRings++;
  if (humanScore >= 40) filledRings++;

  return {
    foundation: {
      tier,
      label: COVERAGE_LABELS[tier],
    },
    aiMastery: {
      score: aiScore,
      label: aiScore >= 60 ? "Strong" : aiScore >= 30 ? "Developing" : "Explore",
    },
    humanEdge: {
      score: humanScore,
      label: humanScore >= 60 ? "Strong" : humanScore >= 30 ? "Developing" : "Explore",
    },
    filledRings,
  };
}
