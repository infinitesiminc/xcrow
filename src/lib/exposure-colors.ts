/**
 * Unified AI-Exposure Color Spectrum
 * ===================================
 * A 7-stop gradient mapping AI exposure scores (0–100%) to a continuous
 * colour ramp that runs from brand-human (blue) through brand-mid (purple)
 * to brand-ai (pink/red).
 *
 * Stops (CSS variables defined in index.css):
 *   --spectrum-0   Blue        (0–14%)
 *   --spectrum-1   Teal        (15–24%)
 *   --spectrum-2   Cyan-green  (25–34%)
 *   --spectrum-3   Purple      (35–49%)  ← brand-mid
 *   --spectrum-4   Amber       (50–59%)
 *   --spectrum-5   Orange      (60–69%)
 *   --spectrum-6   Pink/Red    (70%+)    ← brand-ai
 *
 * Usage:
 *   import { exposureClasses, exposureHsl } from "@/lib/exposure-colors";
 *   <Badge className={exposureClasses(score).badge}>…</Badge>
 *   <div style={{ color: exposureHsl(score) }} />
 */

// ── Stop index from score ─────────────────────────────────────────
function stopIndex(score: number): number {
  if (score >= 70) return 6;
  if (score >= 60) return 5;
  if (score >= 50) return 4;
  if (score >= 35) return 3;
  if (score >= 25) return 2;
  if (score >= 15) return 1;
  return 0;
}

// ── Labels ────────────────────────────────────────────────────────
const STOP_LABELS = [
  "Human-Led",
  "Low Exposure",
  "Emerging",
  "Moderate",
  "Notable",
  "High",
  "Critical",
] as const;

export type ExposureLabel = (typeof STOP_LABELS)[number];

// ── Tailwind class helpers (use CSS variables) ────────────────────
const STOP_TW = [
  /* 0 */ { bg: "bg-spectrum-0",   text: "text-spectrum-0",   badgeBg: "bg-spectrum-0/10",   badgeBorder: "border-spectrum-0/20" },
  /* 1 */ { bg: "bg-spectrum-1",   text: "text-spectrum-1",   badgeBg: "bg-spectrum-1/10",   badgeBorder: "border-spectrum-1/20" },
  /* 2 */ { bg: "bg-spectrum-2",   text: "text-spectrum-2",   badgeBg: "bg-spectrum-2/10",   badgeBorder: "border-spectrum-2/20" },
  /* 3 */ { bg: "bg-spectrum-3",   text: "text-spectrum-3",   badgeBg: "bg-spectrum-3/10",   badgeBorder: "border-spectrum-3/20" },
  /* 4 */ { bg: "bg-spectrum-4",   text: "text-spectrum-4",   badgeBg: "bg-spectrum-4/10",   badgeBorder: "border-spectrum-4/20" },
  /* 5 */ { bg: "bg-spectrum-5",   text: "text-spectrum-5",   badgeBg: "bg-spectrum-5/10",   badgeBorder: "border-spectrum-5/20" },
  /* 6 */ { bg: "bg-spectrum-6",   text: "text-spectrum-6",   badgeBg: "bg-spectrum-6/10",   badgeBorder: "border-spectrum-6/20" },
];

export interface ExposureStyle {
  /** Combined badge classes: bg + text + border */
  badge: string;
  /** Solid dot/bg class */
  dot: string;
  /** Text class only */
  text: string;
  /** HSL string for inline styles / charts */
  hsl: string;
  /** Human-readable label */
  label: ExposureLabel;
  /** Stop index 0-6 */
  stop: number;
}

/** Get Tailwind classes + inline HSL for a given AI exposure score (0-100). */
export function exposureStyle(score: number): ExposureStyle {
  const idx = stopIndex(score);
  const tw = STOP_TW[idx];
  return {
    badge: `${tw.badgeBg} ${tw.text} ${tw.badgeBorder}`,
    dot: tw.bg,
    text: tw.text,
    hsl: `hsl(var(--spectrum-${idx}))`,
    label: STOP_LABELS[idx],
    stop: idx,
  };
}

/** Shorthand: just the HSL string for inline styles / charts. */
export function exposureHsl(score: number): string {
  return `hsl(var(--spectrum-${stopIndex(score)}))`;
}

/** Shorthand: just the badge Tailwind classes. */
export function exposureClasses(score: number) {
  return exposureStyle(score);
}

// ── Backward-compatible 3-tier helpers (maps to stops 0, 3, 6) ──
export function riskTierClasses(riskPercent: number) {
  if (riskPercent >= 35) return exposureStyle(70); // brand-ai  → stop 6
  if (riskPercent >= 25) return exposureStyle(42); // brand-mid → stop 3
  return exposureStyle(10);                         // brand-human → stop 0
}

// ── Heatmap helpers (kept for backward compat, uses spectrum) ────
export function heatmapColor(score: number | null): string {
  if (score === null) return "hsl(var(--muted))";
  // Map 0-8 disruption score to spectrum
  if (score >= 7) return `hsl(var(--spectrum-6))`;
  if (score >= 5) return `hsl(var(--spectrum-4))`;
  if (score >= 3) return `hsl(var(--spectrum-3))`;
  return `hsl(var(--spectrum-0))`;
}

export function heatmapLabel(score: number | null): string {
  if (score === null) return "N/A";
  if (score >= 7) return "Critical";
  if (score >= 5) return "High";
  if (score >= 3) return "Moderate";
  return "Low";
}
