/**
 * Force-directed layout engine for the skill territory map.
 * 
 * Positions skills in 2D space using spring forces from relationships.
 * No categories — skills cluster naturally by their connections.
 * Deterministic: uses seeded positions and fixed iterations.
 */

import { SKILL_TAXONOMY } from "./skill-map";
import { SKILL_EDGES } from "./skill-relationships";

export interface NodePosition {
  id: string;
  x: number;
  y: number;
}

interface ForceNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// Seeded random for deterministic layout
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

const LAYOUT_WIDTH = 900;
const LAYOUT_HEIGHT = 700;
const PADDING = 80;
const ITERATIONS = 200;

// Force parameters
const REPULSION = 8000;       // Nodes push each other away
const SPRING_LENGTH = 100;    // Ideal edge length (strength 2)
const SPRING_K = 0.15;        // Spring stiffness
const DAMPING = 0.92;         // Velocity dampening
const CENTER_GRAVITY = 0.01;  // Pull toward center

/**
 * Compute force-directed positions for all skills.
 * Returns stable positions after ITERATIONS steps.
 */
export function computeForceLayout(): NodePosition[] {
  const rand = seededRandom(42);
  const cx = LAYOUT_WIDTH / 2;
  const cy = LAYOUT_HEIGHT / 2;

  // Initialize nodes in a rough circle
  const nodes: ForceNode[] = SKILL_TAXONOMY.map((skill, i) => {
    const angle = (2 * Math.PI * i) / SKILL_TAXONOMY.length;
    const r = 150 + rand() * 100;
    return {
      id: skill.id,
      x: cx + r * Math.cos(angle) + (rand() - 0.5) * 40,
      y: cy + r * Math.sin(angle) + (rand() - 0.5) * 40,
      vx: 0,
      vy: 0,
    };
  });

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Run simulation
  for (let iter = 0; iter < ITERATIONS; iter++) {
    const temp = 1 - iter / ITERATIONS; // cooling

    // Repulsive forces between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const force = (REPULSION * temp) / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    // Spring (attractive) forces along edges
    for (const edge of SKILL_EDGES) {
      const a = nodeMap.get(edge.from);
      const b = nodeMap.get(edge.to);
      if (!a || !b) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      
      // Stronger relationships = shorter ideal distance
      const idealDist = SPRING_LENGTH / edge.strength;
      const displacement = dist - idealDist;
      const force = SPRING_K * displacement * temp;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    // Center gravity
    for (const node of nodes) {
      node.vx += (cx - node.x) * CENTER_GRAVITY;
      node.vy += (cy - node.y) * CENTER_GRAVITY;
    }

    // Apply velocity + damping
    for (const node of nodes) {
      node.vx *= DAMPING;
      node.vy *= DAMPING;
      node.x += node.vx;
      node.y += node.vy;

      // Clamp to bounds
      node.x = Math.max(PADDING, Math.min(LAYOUT_WIDTH - PADDING, node.x));
      node.y = Math.max(PADDING, Math.min(LAYOUT_HEIGHT - PADDING, node.y));
    }
  }

  return nodes.map(n => ({
    id: n.id,
    x: Math.round(n.x),
    y: Math.round(n.y),
  }));
}

export { LAYOUT_WIDTH, LAYOUT_HEIGHT };
