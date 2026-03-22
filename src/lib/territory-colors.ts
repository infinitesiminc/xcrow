/**
 * Territory Color System
 * ======================
 * Maps the 8 skill domains to consistent colors, labels, and RPG metadata.
 * Colors reference CSS variables defined in index.css so they adapt to dark/light mode.
 *
 * Usage:
 *   import { getTerritory, TERRITORIES } from "@/lib/territory-colors";
 *   const t = getTerritory("Technical");
 *   <div className={t.tw.bg}>…</div>
 *   <span style={{ color: t.hsl }}>…</span>
 */

import type { FutureSkillCategory } from "@/hooks/use-future-skills";

export interface TerritoryMeta {
  /** Category key matching FutureSkillCategory */
  category: FutureSkillCategory;
  /** RPG terrain name */
  terrain: string;
  /** Emoji icon */
  emoji: string;
  /** CSS variable name (without --) */
  cssVar: string;
  /** Inline-style HSL string */
  hsl: string;
  /** Tailwind class helpers */
  tw: {
    text: string;
    bg: string;
    border: string;
    bgSubtle: string;
    ring: string;
  };
}

const TERRITORY_MAP: Record<FutureSkillCategory, Omit<TerritoryMeta, "hsl" | "tw">> = {
  Technical:             { category: "Technical",             terrain: "Circuit Peaks",   emoji: "⚙️",  cssVar: "territory-technical" },
  Analytical:            { category: "Analytical",            terrain: "Data Highlands",  emoji: "📊",  cssVar: "territory-analytical" },
  Strategic:             { category: "Strategic",             terrain: "Command Summit",  emoji: "🎯",  cssVar: "territory-strategic" },
  Communication:         { category: "Communication",         terrain: "Bridge Isles",    emoji: "💬",  cssVar: "territory-communication" },
  Leadership:            { category: "Leadership",            terrain: "Crown Heights",   emoji: "👑",  cssVar: "territory-leadership" },
  Creative:              { category: "Creative",              terrain: "Prism Coast",     emoji: "🎨",  cssVar: "territory-creative" },
  "Ethics & Compliance": { category: "Ethics & Compliance",   terrain: "Sentinel Watch",  emoji: "🛡️",  cssVar: "territory-ethics" },
  "Human Edge":          { category: "Human Edge",            terrain: "Soul Springs",    emoji: "✦",   cssVar: "territory-humanedge" },
};

/** All territory categories in display order */
export const TERRITORY_ORDER: FutureSkillCategory[] = [
  "Technical", "Analytical", "Strategic", "Communication",
  "Leadership", "Creative", "Ethics & Compliance", "Human Edge",
];

/** All territories with full metadata */
export const TERRITORIES: TerritoryMeta[] = TERRITORY_ORDER.map((cat) => {
  const base = TERRITORY_MAP[cat];
  return {
    ...base,
    hsl: `hsl(var(--${base.cssVar}))`,
    tw: {
      text: `text-territory-${base.cssVar.replace("territory-", "")}`,
      bg: `bg-territory-${base.cssVar.replace("territory-", "")}`,
      border: `border-territory-${base.cssVar.replace("territory-", "")}`,
      bgSubtle: `bg-territory-${base.cssVar.replace("territory-", "")}/10`,
      ring: `ring-territory-${base.cssVar.replace("territory-", "")}`,
    },
  };
});

/** Get territory metadata by category name */
export function getTerritory(category: FutureSkillCategory): TerritoryMeta {
  const base = TERRITORY_MAP[category];
  if (!base) {
    // Fallback to Technical
    return getTerritory("Technical");
  }
  const key = base.cssVar.replace("territory-", "");
  return {
    ...base,
    hsl: `hsl(var(--${base.cssVar}))`,
    tw: {
      text: `text-territory-${key}`,
      bg: `bg-territory-${key}`,
      border: `border-territory-${key}`,
      bgSubtle: `bg-territory-${key}/10`,
      ring: `ring-territory-${key}`,
    },
  };
}

/** Get territory HSL for inline styles */
export function territoryHsl(category: FutureSkillCategory): string {
  const base = TERRITORY_MAP[category];
  return base ? `hsl(var(--${base.cssVar}))` : `hsl(var(--primary))`;
}

/** Map of category → CSS variable for setting --t-color on .territory-accent */
export function territoryCssVar(category: FutureSkillCategory): string {
  const base = TERRITORY_MAP[category];
  return base ? `var(--${base.cssVar})` : `var(--primary)`;
}
