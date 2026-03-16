/**
 * Unified risk tier color system used across the entire project.
 * Based on the brand metaphor: Red (AI) → Purple (mid) → Blue (Human)
 *   - brand-ai   → High Risk (≥35%)
 *   - brand-mid  → Moderate Risk (≥25%)
 *   - brand-human → Lower Risk (<25%)
 */

export interface RiskTier {
  label: string;
  /** Tailwind bg class for the colored dot */
  dotClass: string;
  /** Raw HSL string for inline styles / charts */
  color: string;
  /** Tailwind bg/text classes for badges */
  bgClass: string;
  textClass: string;
}

const TIERS: RiskTier[] = [
  { label: "High",     dotClass: "bg-brand-ai",    color: "hsl(var(--brand-ai))",    bgClass: "bg-brand-ai/10",    textClass: "text-brand-ai" },
  { label: "Moderate", dotClass: "bg-brand-mid",    color: "hsl(var(--brand-mid))",   bgClass: "bg-brand-mid/10",   textClass: "text-brand-mid" },
  { label: "Low",      dotClass: "bg-brand-human",  color: "hsl(var(--brand-human))", bgClass: "bg-brand-human/10", textClass: "text-brand-human" },
];

export function getRiskTier(risk: number): RiskTier {
  if (risk >= 35) return TIERS[0]; // High
  if (risk >= 25) return TIERS[1]; // Moderate
  return TIERS[2];                 // Low
}

/**
 * Heatmap disruption score (0–8) → color.
 * Uses the same brand-ai → brand-mid → brand-human palette.
 */
export function getHeatColor(score: number | null): string {
  if (score === null) return "hsl(var(--muted))";
  if (score >= 7) return "hsl(var(--brand-ai))";
  if (score >= 5) return "hsl(var(--brand-mid))";
  if (score >= 3) return "hsl(var(--brand-mid) / 0.7)";
  return "hsl(var(--brand-human))";
}

export function getHeatLabel(score: number | null): string {
  if (score === null) return "N/A";
  if (score >= 7) return "Critical";
  if (score >= 5) return "High";
  if (score >= 3) return "Moderate";
  return "Low";
}
