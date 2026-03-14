/**
 * Unified risk tier color system used across the entire project.
 * Based on the dot-color tokens defined in index.css / tailwind.config.ts:
 *   - dot-purple → High Risk (≥35%)
 *   - dot-amber  → Moderate Risk (≥25%)
 *   - dot-teal   → Lower Risk (<25%)
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
  { label: "High",     dotClass: "bg-dot-purple", color: "hsl(var(--dot-purple))", bgClass: "bg-dot-purple/10", textClass: "text-dot-purple" },
  { label: "Moderate", dotClass: "bg-dot-amber",  color: "hsl(var(--dot-amber))",  bgClass: "bg-dot-amber/10",  textClass: "text-dot-amber" },
  { label: "Low",      dotClass: "bg-dot-teal",   color: "hsl(var(--dot-teal))",   bgClass: "bg-dot-teal/10",   textClass: "text-dot-teal" },
];

export function getRiskTier(risk: number): RiskTier {
  if (risk >= 35) return TIERS[0]; // High
  if (risk >= 25) return TIERS[1]; // Moderate
  return TIERS[2];                 // Low
}

/**
 * Heatmap disruption score (0–8) → color.
 * Uses the same purple → amber → teal palette with interpolated steps.
 */
export function getHeatColor(score: number | null): string {
  if (score === null) return "hsl(var(--muted))";
  if (score >= 7) return "hsl(var(--dot-purple))";
  if (score >= 5) return "hsl(var(--dot-amber))";
  if (score >= 3) return "hsl(var(--dot-amber) / 0.7)";
  return "hsl(var(--dot-teal))";
}

export function getHeatLabel(score: number | null): string {
  if (score === null) return "N/A";
  if (score >= 7) return "Critical";
  if (score >= 5) return "High";
  if (score >= 3) return "Moderate";
  return "Low";
}
