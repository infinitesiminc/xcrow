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

export const FUTURE_MAP_WIDTH = 1400;
export const FUTURE_MAP_HEIGHT = 1000;

// 8 islands — larger categories get more space
const ISLAND_CENTERS: Record<FutureSkillCategory, { cx: number; cy: number }> = {
  Strategic:              { cx: 350, cy: 220 },   // largest — top center-left
  Technical:              { cx: 900, cy: 200 },   // 2nd — top right
  Analytical:             { cx: 1200, cy: 450 },  // 3rd — right middle
  "Human Edge":           { cx: 200, cy: 500 },   // 4th — left middle
  Communication:          { cx: 650, cy: 520 },   // center
  "Ethics & Compliance":  { cx: 450, cy: 800 },   // bottom left
  Creative:               { cx: 900, cy: 780 },   // bottom right
  Leadership:             { cx: 1150, cy: 720 },  // bottom far right
};

const ALL_CATEGORIES: FutureSkillCategory[] = [
  "Strategic", "Technical", "Analytical", "Human Edge",
  "Communication", "Ethics & Compliance", "Creative", "Leadership",
];

/** Max skills shown per island — scales with category size */
const MAX_PER_ISLAND: Record<FutureSkillCategory, number> = {
  Strategic:              28,
  Technical:              20,
  Analytical:             18,
  "Human Edge":           14,
  Communication:          14,
  "Ethics & Compliance":  10,
  Creative:               10,
  Leadership:             3,
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
