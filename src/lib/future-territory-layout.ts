/**
 * Future Territory Layout — positions for 8-category future skill map.
 * Arranges islands in a wider hex pattern to accommodate all categories.
 */

import { type FutureSkill, type FutureSkillCategory, FUTURE_CATEGORY_META } from "@/hooks/use-future-skills";

export interface FutureNodePosition {
  x: number;
  y: number;
  skillId: string;
}

export interface FutureIslandLayout {
  category: FutureSkillCategory;
  cx: number;
  cy: number;
  nodes: FutureNodePosition[];
  theme: { emoji: string; terrain: string; baseHue: number };
}

export const FUTURE_MAP_WIDTH = 1100;
export const FUTURE_MAP_HEIGHT = 850;

// 8 islands in a 3-3-2 hex arrangement
const ISLAND_CENTERS: Record<FutureSkillCategory, { cx: number; cy: number }> = {
  Technical:              { cx: 200, cy: 180 },
  Analytical:             { cx: 550, cy: 150 },
  Strategic:              { cx: 900, cy: 180 },
  Communication:          { cx: 150, cy: 430 },
  Leadership:             { cx: 475, cy: 400 },
  Creative:               { cx: 800, cy: 430 },
  "Ethics & Compliance":  { cx: 325, cy: 670 },
  "Human Edge":           { cx: 700, cy: 670 },
};

const ALL_CATEGORIES: FutureSkillCategory[] = [
  "Technical", "Analytical", "Strategic",
  "Communication", "Leadership", "Creative",
  "Ethics & Compliance", "Human Edge",
];

/**
 * Position skill nodes around each island center.
 * Only show top N skills per category to avoid overcrowding.
 */
function positionNodes(
  category: FutureSkillCategory,
  cx: number,
  cy: number,
  skills: FutureSkill[],
  maxPerIsland: number = 12,
): FutureNodePosition[] {
  const catSkills = skills
    .filter(s => s.category === category)
    .slice(0, maxPerIsland); // already sorted by demand_count

  const count = catSkills.length;
  if (count === 0) return [];

  const radius = count <= 4 ? 55 : count <= 8 ? 70 : 85;

  return catSkills.map((skill, i) => {
    if (count === 1) return { x: cx, y: cy, skillId: skill.id };

    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    const r = radius + (i % 2 === 0 ? 5 : -5);
    return {
      x: Math.round(cx + r * Math.cos(angle)),
      y: Math.round(cy + r * Math.sin(angle)),
      skillId: skill.id,
    };
  });
}

export function buildFutureMapLayout(skills: FutureSkill[]): FutureIslandLayout[] {
  return ALL_CATEGORIES.map(cat => {
    const center = ISLAND_CENTERS[cat];
    return {
      category: cat,
      cx: center.cx,
      cy: center.cy,
      nodes: positionNodes(cat, center.cx, center.cy, skills),
      theme: FUTURE_CATEGORY_META[cat],
    };
  });
}

export interface FuturePathConnection {
  from: string;
  to: string;
  crossIsland?: boolean;
}

/** Build intra-island connections (ring) */
export function buildFutureConnections(layout: FutureIslandLayout[]): FuturePathConnection[] {
  const connections: FuturePathConnection[] = [];
  for (const island of layout) {
    const nodes = island.nodes;
    for (let i = 0; i < nodes.length; i++) {
      const next = (i + 1) % nodes.length;
      connections.push({ from: nodes[i].skillId, to: nodes[next].skillId });
    }
  }
  return connections;
}
