/**
 * Future Territory Layout — positions for 8-category future skill map.
 * Arranges islands in a wider hex pattern with proportional sizing.
 * Updated for 183 deduplicated skills with uneven distribution.
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
  radius: number;
  nodes: FutureNodePosition[];
  theme: { emoji: string; terrain: string; baseHue: number };
  skillCount: number;
}

export const FUTURE_MAP_WIDTH = 1800;
export const FUTURE_MAP_HEIGHT = 1400;

// 8 islands — positioned for new balanced distribution
const ISLAND_CENTERS: Record<FutureSkillCategory, { cx: number; cy: number }> = {
  Technical:              { cx: 300, cy: 280 },   // largest — top left
  Analytical:             { cx: 900, cy: 250 },   // 2nd — top center
  "Human Edge":           { cx: 1500, cy: 300 },  // 3rd — top right
  Communication:          { cx: 250, cy: 700 },   // mid left
  Creative:               { cx: 750, cy: 680 },   // mid center-left
  Leadership:             { cx: 1250, cy: 700 },  // mid center-right
  "Ethics & Compliance":  { cx: 500, cy: 1100 },  // bottom left
  Strategic:              { cx: 1100, cy: 1100 },  // bottom right (smallest)
};

const ALL_CATEGORIES: FutureSkillCategory[] = [
  "Strategic", "Technical", "Analytical", "Human Edge",
  "Communication", "Ethics & Compliance", "Creative", "Leadership",
];

/** Max skills shown per island — show all skills now that catalogue is optimized to 183 */
const MAX_PER_ISLAND: Record<FutureSkillCategory, number> = {
  Technical:              43,
  Analytical:             41,
  "Human Edge":           24,
  Communication:          18,
  Creative:               17,
  Leadership:             17,
  "Ethics & Compliance":  13,
  Strategic:              10,
};

/**
 * Position skill nodes in concentric rings around island center.
 * Inner ring: top skills; outer ring: remaining.
 */
function positionNodes(
  category: FutureSkillCategory,
  cx: number,
  cy: number,
  skills: FutureSkill[],
): FutureNodePosition[] {
  const maxCount = MAX_PER_ISLAND[category] ?? 12;
  const catSkills = skills
    .filter(s => s.category === category)
    .slice(0, maxCount);

  const count = catSkills.length;
  if (count === 0) return [];
  if (count === 1) return [{ x: cx, y: cy, skillId: catSkills[0].id }];

  // Distribute in concentric rings
  const rings: number[] = [];
  if (count <= 6) {
    rings.push(count);
  } else if (count <= 14) {
    const inner = Math.min(6, Math.ceil(count / 2));
    rings.push(inner, count - inner);
  } else if (count <= 24) {
    const inner = Math.min(6, Math.ceil(count / 3));
    const mid = Math.min(10, Math.ceil((count - inner) / 2));
    rings.push(inner, mid, count - inner - mid);
  } else {
    // 4 rings for large categories like Strategic
    const r1 = 5;
    const r2 = 8;
    const r3 = Math.min(10, Math.ceil((count - r1 - r2) / 2));
    rings.push(r1, r2, r3, count - r1 - r2 - r3);
  }

  const positions: FutureNodePosition[] = [];
  let skillIdx = 0;
  const ringRadii = [45, 80, 115, 150];

  for (let ringIdx = 0; ringIdx < rings.length; ringIdx++) {
    const ringCount = rings[ringIdx];
    const radius = ringRadii[ringIdx];
    for (let i = 0; i < ringCount; i++) {
      if (skillIdx >= catSkills.length) break;
      const angle = (2 * Math.PI * i) / ringCount - Math.PI / 2;
      const jitter = (skillIdx % 2 === 0 ? 3 : -3);
      positions.push({
        x: Math.round(cx + (radius + jitter) * Math.cos(angle)),
        y: Math.round(cy + (radius + jitter) * Math.sin(angle)),
        skillId: catSkills[skillIdx].id,
      });
      skillIdx++;
    }
  }

  return positions;
}

/** Compute visual island radius based on skill count */
function getIslandRadius(count: number): number {
  if (count <= 3) return 60;
  if (count <= 6) return 75;
  if (count <= 10) return 95;
  if (count <= 14) return 110;
  if (count <= 20) return 130;
  return 160;
}

export function buildFutureMapLayout(skills: FutureSkill[]): FutureIslandLayout[] {
  return ALL_CATEGORIES.map(cat => {
    const center = ISLAND_CENTERS[cat];
    const catSkills = skills.filter(s => s.category === cat);
    const maxCount = MAX_PER_ISLAND[cat] ?? 12;
    const visibleCount = Math.min(catSkills.length, maxCount);
    return {
      category: cat,
      cx: center.cx,
      cy: center.cy,
      radius: getIslandRadius(visibleCount),
      nodes: positionNodes(cat, center.cx, center.cy, skills),
      theme: FUTURE_CATEGORY_META[cat],
      skillCount: catSkills.length,
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
      if (nodes.length > 1) {
        connections.push({ from: nodes[i].skillId, to: nodes[next].skillId });
      }
    }
  }
  return connections;
}
