/**
 * Territory Layout — hex-grid positions for the RPG skill map.
 *
 * 6 island regions arranged in a honeycomb pattern.
 * Each island has skill nodes positioned around a central point.
 */

import { type SkillCategory, SKILL_TAXONOMY, type TaxonomySkill } from "./skill-map";

export interface NodePosition {
  x: number;
  y: number;
  skillId: string;
}

export interface IslandLayout {
  category: SkillCategory;
  cx: number;
  cy: number;
  nodes: NodePosition[];
  theme: {
    emoji: string;
    terrain: string; // flavor name
    baseHue: number;
  };
}

export interface PathConnection {
  from: string; // skillId
  to: string;   // skillId
  crossIsland?: boolean;
}

const ISLAND_THEMES: Record<SkillCategory, { emoji: string; terrain: string; baseHue: number }> = {
  technical:     { emoji: "⚙️", terrain: "Circuit Peaks",    baseHue: 262 },
  analytical:    { emoji: "📊", terrain: "Data Highlands",   baseHue: 200 },
  communication: { emoji: "💬", terrain: "Bridge Isles",     baseHue: 150 },
  leadership:    { emoji: "🎯", terrain: "Command Summit",   baseHue: 340 },
  creative:      { emoji: "🎨", terrain: "Prism Coast",      baseHue: 30 },
  compliance:    { emoji: "📋", terrain: "Sentinel Watch",   baseHue: 45 },
};

// Map dimensions (viewBox)
export const MAP_WIDTH = 900;
export const MAP_HEIGHT = 700;

// Island centers in a hex-like arrangement
const ISLAND_CENTERS: Record<SkillCategory, { cx: number; cy: number }> = {
  technical:     { cx: 225, cy: 170 },
  analytical:    { cx: 675, cy: 170 },
  communication: { cx: 150, cy: 420 },
  leadership:    { cx: 450, cy: 350 },
  creative:      { cx: 750, cy: 420 },
  compliance:    { cx: 450, cy: 580 },
};

/**
 * Position skill nodes around each island center.
 * Uses a radial layout with some randomness for organic feel.
 */
function positionNodes(category: SkillCategory, cx: number, cy: number): NodePosition[] {
  const skills = SKILL_TAXONOMY.filter(s => s.category === category);
  const count = skills.length;
  const radius = count <= 4 ? 55 : count <= 6 ? 65 : 75;

  return skills.map((skill, i) => {
    if (count === 1) return { x: cx, y: cy, skillId: skill.id };

    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    // Slight offset for organic feel
    const r = radius + (i % 2 === 0 ? 5 : -5);
    return {
      x: Math.round(cx + r * Math.cos(angle)),
      y: Math.round(cy + r * Math.sin(angle)),
      skillId: skill.id,
    };
  });
}

export function buildMapLayout(): IslandLayout[] {
  const categories: SkillCategory[] = [
    "technical", "analytical", "communication",
    "leadership", "creative", "compliance",
  ];

  return categories.map(cat => {
    const { cx, cy } = ISLAND_CENTERS[cat];
    return {
      category: cat,
      cx,
      cy,
      nodes: positionNodes(cat, cx, cy),
      theme: ISLAND_THEMES[cat],
    };
  });
}

/**
 * Build connections between skills within the same island
 * and a few cross-island bridges.
 */
export function buildConnections(layout: IslandLayout[]): PathConnection[] {
  const connections: PathConnection[] = [];

  // Intra-island: connect adjacent nodes in radial order
  for (const island of layout) {
    const nodes = island.nodes;
    for (let i = 0; i < nodes.length; i++) {
      const next = (i + 1) % nodes.length;
      connections.push({ from: nodes[i].skillId, to: nodes[next].skillId });
    }
  }

  // Cross-island bridges (thematic links)
  const bridges: [string, string][] = [
    ["code-dev", "data-engineering"],    // tech ↔ tech (already same island)
    ["data-analysis", "financial-modeling"], // analytical internal
    ["ai-ml", "data-analysis"],           // tech → analytical
    ["prompt-eng", "content-seo"],        // tech → creative
    ["strategy", "stakeholder-mgmt"],     // leadership → communication
    ["regulatory", "risk-assessment"],    // compliance → analytical
    ["design-ux", "product-sense"],       // creative internal
    ["team-mgmt", "change-mgmt"],         // leadership internal
    ["writing-docs", "presentation"],     // communication internal
  ];

  for (const [from, to] of bridges) {
    // Check they're not already connected and in different islands
    const exists = connections.some(c =>
      (c.from === from && c.to === to) || (c.from === to && c.to === from)
    );
    if (!exists) {
      const fromCat = SKILL_TAXONOMY.find(s => s.id === from)?.category;
      const toCat = SKILL_TAXONOMY.find(s => s.id === to)?.category;
      connections.push({ from, to, crossIsland: fromCat !== toCat });
    }
  }

  return connections;
}
