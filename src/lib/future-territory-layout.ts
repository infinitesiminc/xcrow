/**
 * Future Territory Layout — positions for 8-category future skill map.
 * Designed to fill a full-screen viewport with readable islands at default zoom.
 * Shows top skills per island; rest accessible via Skill Forge table.
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

// Viewport-friendly dimensions — wider ratio to fill screen
export const FUTURE_MAP_WIDTH = 1600;
export const FUTURE_MAP_HEIGHT = 900;

// 8 islands — spread to fill screen, 2 rows of 4
const ISLAND_CENTERS: Record<FutureSkillCategory, { cx: number; cy: number }> = {
  Technical:              { cx: 200,  cy: 260 },
  Analytical:             { cx: 550,  cy: 220 },
  "Human Edge":           { cx: 900,  cy: 260 },
  Strategic:              { cx: 1250, cy: 220 },
  Communication:          { cx: 200,  cy: 640 },
  Creative:               { cx: 550,  cy: 680 },
  Leadership:             { cx: 900,  cy: 640 },
  "Ethics & Compliance":  { cx: 1250, cy: 680 },
};

const ALL_CATEGORIES: FutureSkillCategory[] = [
  "Technical", "Analytical", "Human Edge", "Strategic",
  "Communication", "Creative", "Leadership", "Ethics & Compliance",
];

/** Show top 8 skills per island for readability — rest in Skill Forge table */
const MAX_PER_ISLAND = 8;

/**
 * Position skill nodes in a clean ring around island center.
 */
function positionNodes(
  cx: number,
  cy: number,
  skills: FutureSkill[],
): FutureNodePosition[] {
  const catSkills = skills.slice(0, MAX_PER_ISLAND);
  const count = catSkills.length;
  if (count === 0) return [];
  if (count === 1) return [{ x: cx, y: cy, skillId: catSkills[0].id }];

  const positions: FutureNodePosition[] = [];

  if (count <= 4) {
    // Single ring
    const r = 70;
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      positions.push({
        x: Math.round(cx + r * Math.cos(angle)),
        y: Math.round(cy + r * Math.sin(angle)),
        skillId: catSkills[i].id,
      });
    }
  } else {
    // Inner ring (3-4) + outer ring (rest)
    const inner = Math.min(4, Math.ceil(count / 2));
    const outer = count - inner;
    const r1 = 55;
    const r2 = 100;
    for (let i = 0; i < inner; i++) {
      const angle = (2 * Math.PI * i) / inner - Math.PI / 2;
      positions.push({
        x: Math.round(cx + r1 * Math.cos(angle)),
        y: Math.round(cy + r1 * Math.sin(angle)),
        skillId: catSkills[i].id,
      });
    }
    for (let i = 0; i < outer; i++) {
      const angle = (2 * Math.PI * i) / outer - Math.PI / 2 + Math.PI / outer;
      positions.push({
        x: Math.round(cx + r2 * Math.cos(angle)),
        y: Math.round(cy + r2 * Math.sin(angle)),
        skillId: catSkills[inner + i].id,
      });
    }
  }

  return positions;
}

export function buildFutureMapLayout(skills: FutureSkill[]): FutureIslandLayout[] {
  return ALL_CATEGORIES.map(cat => {
    const center = ISLAND_CENTERS[cat];
    const catSkills = skills
      .filter(s => s.category === cat)
      .sort((a, b) => b.demandCount - a.demandCount); // top demand first
    const visibleCount = Math.min(catSkills.length, MAX_PER_ISLAND);
    return {
      category: cat,
      cx: center.cx,
      cy: center.cy,
      radius: 120,
      nodes: positionNodes(center.cx, center.cy, catSkills),
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
