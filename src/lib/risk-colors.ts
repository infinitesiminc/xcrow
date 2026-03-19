/**
 * Unified risk tier color system.
 * Now delegates to the 7-stop exposure spectrum for consistency.
 * Kept for backward compatibility — prefer `exposureStyle()` for new code.
 */

import { exposureStyle, heatmapColor, heatmapLabel, type ExposureStyle } from "./exposure-colors";

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

export function getRiskTier(risk: number): RiskTier {
  // Map risk % → exposure score so we hit the right spectrum stop
  const style: ExposureStyle =
    risk >= 35 ? exposureStyle(70) :
    risk >= 25 ? exposureStyle(42) :
    exposureStyle(10);

  const label = risk >= 35 ? "High" : risk >= 25 ? "Moderate" : "Low";
  return {
    label,
    dotClass: style.dot,
    color: style.hsl,
    bgClass: `${style.dot}/10`,
    textClass: style.text,
  };
}

/** @deprecated Use heatmapColor from exposure-colors instead */
export const getHeatColor = heatmapColor;

/** @deprecated Use heatmapLabel from exposure-colors instead */
export const getHeatLabel = heatmapLabel;
