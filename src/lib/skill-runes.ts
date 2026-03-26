/**
 * Skill Runes — Deterministic geometric SVG path generator.
 * Each of the 183 skills gets a unique runic symbol based on its category
 * and a hash of its ID. Symbols are mystical, geometric, and category-themed.
 *
 * Category shape vocabularies:
 *   Technical     → Angular circuitry / gear fragments
 *   Analytical    → Concentric arcs / lens patterns
 *   Strategic     → Diamond lattice / compass geometry
 *   Creative      → Spiral / burst / asymmetric marks
 *   Communication → Interlocking waves / echo rings
 *   Leadership    → Crown geometry / ascending lines
 *   Ethics        → Balance scales / shield geometry
 *   Human Edge    → Organic curves / heart geometry
 */

/** Simple deterministic hash from string → number */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Seed-based pseudo-random [0,1) */
function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 9301 + i * 49297 + 233280) * 43758.5453;
  return x - Math.floor(x);
}

type RuneCategory =
  | "Technical"
  | "Analytical"
  | "Strategic"
  | "Creative"
  | "Communication"
  | "Leadership"
  | "Ethics & Compliance"
  | "Human Edge";

/**
 * Generate a unique SVG path string for a skill rune.
 * Centered at (0,0), fits within a ±6 unit bounding box.
 */
export function generateSkillRune(skillId: string, category: string): string {
  const seed = hashStr(skillId);
  const s = (i: number) => seeded(seed, i);
  const cat = category as RuneCategory;

  switch (cat) {
    case "Technical":
      return technicalRune(seed, s);
    case "Analytical":
      return analyticalRune(seed, s);
    case "Strategic":
      return strategicRune(seed, s);
    case "Creative":
      return creativeRune(seed, s);
    case "Communication":
      return communicationRune(seed, s);
    case "Leadership":
      return leadershipRune(seed, s);
    case "Ethics & Compliance":
      return ethicsRune(seed, s);
    case "Human Edge":
      return humanEdgeRune(seed, s);
    default:
      return defaultRune(seed, s);
  }
}

// ─── TECHNICAL: angular circuitry / gear teeth ───────────────────

function technicalRune(seed: number, s: (i: number) => number): string {
  const sides = 4 + Math.floor(s(0) * 3); // 4-6 sides
  const r1 = 4.5;
  const r2 = 2.5 + s(1) * 1.5;
  const rot = s(2) * Math.PI * 2;
  let d = "";
  // Star/gear polygon
  for (let i = 0; i < sides; i++) {
    const a1 = rot + (i / sides) * Math.PI * 2;
    const a2 = rot + ((i + 0.5) / sides) * Math.PI * 2;
    const ox = Math.cos(a1) * r1, oy = Math.sin(a1) * r1;
    const ix = Math.cos(a2) * r2, iy = Math.sin(a2) * r2;
    d += i === 0 ? `M${f(ox)} ${f(oy)}` : `L${f(ox)} ${f(oy)}`;
    d += `L${f(ix)} ${f(iy)}`;
  }
  d += "Z";
  // Inner dot
  const dotR = 1 + s(3) * 0.5;
  d += ` M${f(dotR)} 0 A${f(dotR)} ${f(dotR)} 0 1 0 ${f(-dotR)} 0 A${f(dotR)} ${f(dotR)} 0 1 0 ${f(dotR)} 0Z`;
  return d;
}

// ─── ANALYTICAL: concentric arcs / lens ──────────────────────────

function analyticalRune(seed: number, s: (i: number) => number): string {
  const arcs = 2 + Math.floor(s(0) * 2);
  let d = "";
  for (let i = 0; i < arcs; i++) {
    const r = 2 + i * 1.5;
    const startA = -60 + s(i + 1) * 30;
    const endA = 60 + s(i + 2) * 30;
    const x1 = Math.cos(deg(startA)) * r, y1 = Math.sin(deg(startA)) * r;
    const x2 = Math.cos(deg(endA)) * r, y2 = Math.sin(deg(endA)) * r;
    d += `M${f(x1)} ${f(y1)} A${f(r)} ${f(r)} 0 0 1 ${f(x2)} ${f(y2)} `;
  }
  // Central crosshair
  const cl = 1.5 + s(5) * 0.8;
  d += `M${f(-cl)} 0 L${f(cl)} 0 M0 ${f(-cl)} L0 ${f(cl)}`;
  return d;
}

// ─── STRATEGIC: diamond lattice / compass ────────────────────────

function strategicRune(seed: number, s: (i: number) => number): string {
  const r = 4.5;
  const inner = 1.8 + s(0) * 1.2;
  const twist = s(1) * 0.4;
  // Outer diamond
  let d = `M0 ${f(-r)} L${f(r)} 0 L0 ${f(r)} L${f(-r)} 0 Z`;
  // Inner rotated diamond
  const ir = inner;
  const a = Math.PI / 4 + twist;
  const pts = [0, 1, 2, 3].map(i => {
    const ang = a + (i * Math.PI) / 2;
    return [Math.cos(ang) * ir, Math.sin(ang) * ir];
  });
  d += ` M${f(pts[0][0])} ${f(pts[0][1])}`;
  pts.slice(1).forEach(p => { d += ` L${f(p[0])} ${f(p[1])}`; });
  d += " Z";
  // Cardinal ticks
  const tl = 1 + s(2) * 0.5;
  d += ` M0 ${f(-r - tl)} L0 ${f(-r)} M0 ${f(r)} L0 ${f(r + tl)}`;
  d += ` M${f(-r - tl)} 0 L${f(-r)} 0 M${f(r)} 0 L${f(r + tl)} 0`;
  return d;
}

// ─── CREATIVE: spiral / burst ────────────────────────────────────

function creativeRune(seed: number, s: (i: number) => number): string {
  const rays = 5 + Math.floor(s(0) * 4); // 5-8
  const r = 4.5;
  const twist = s(1) * 0.6;
  let d = "";
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + twist;
    const len = r * (0.6 + s(i + 2) * 0.4);
    d += `M0 0 L${f(Math.cos(a) * len)} ${f(Math.sin(a) * len)} `;
  }
  // Central spiral hint
  const sr = 1.5;
  d += `M${f(sr)} 0 A${f(sr)} ${f(sr)} 0 1 1 ${f(-sr)} 0`;
  return d;
}

// ─── COMMUNICATION: wave / echo rings ────────────────────────────

function communicationRune(seed: number, s: (i: number) => number): string {
  let d = "";
  // Echo arcs from center
  const waves = 2 + Math.floor(s(0) * 2);
  for (let i = 0; i < waves; i++) {
    const r = 2 + i * 1.2;
    const spread = 40 + s(i + 1) * 20;
    // Right side
    d += `M${f(Math.cos(deg(-spread)) * r)} ${f(Math.sin(deg(-spread)) * r)} `;
    d += `A${f(r)} ${f(r)} 0 0 1 ${f(Math.cos(deg(spread)) * r)} ${f(Math.sin(deg(spread)) * r)} `;
    // Left side (mirror)
    d += `M${f(-Math.cos(deg(-spread)) * r)} ${f(Math.sin(deg(-spread)) * r)} `;
    d += `A${f(r)} ${f(r)} 0 0 0 ${f(-Math.cos(deg(spread)) * r)} ${f(Math.sin(deg(spread)) * r)} `;
  }
  // Center dot
  d += `M1 0 A1 1 0 1 0 -1 0 A1 1 0 1 0 1 0Z`;
  return d;
}

// ─── LEADERSHIP: crown / ascending ───────────────────────────────

function leadershipRune(seed: number, s: (i: number) => number): string {
  const peaks = 3 + Math.floor(s(0) * 2); // 3-4
  const w = 4;
  const h = 4;
  let d = `M${f(-w)} ${f(h * 0.3)}`;
  // Crown zigzag
  for (let i = 0; i < peaks; i++) {
    const px = -w + ((i + 0.5) / peaks) * w * 2;
    const py = -h * (0.7 + s(i + 1) * 0.3);
    const vx = -w + ((i + 1) / peaks) * w * 2;
    d += ` L${f(px)} ${f(py)} L${f(vx)} ${f(h * 0.3)}`;
  }
  // Base
  d += ` L${f(w)} ${f(h * 0.3)} L${f(w)} ${f(h * 0.5)} L${f(-w)} ${f(h * 0.5)} Z`;
  // Central gem
  const gr = 1 + s(5) * 0.5;
  d += ` M0 ${f(-gr)} L${f(gr)} 0 L0 ${f(gr)} L${f(-gr)} 0 Z`;
  return d;
}

// ─── ETHICS: balance / shield ────────────────────────────────────

function ethicsRune(seed: number, s: (i: number) => number): string {
  // Shield outline
  const w = 3.5 + s(0) * 0.5;
  const h = 5;
  let d = `M${f(-w)} ${f(-h * 0.5)} L${f(w)} ${f(-h * 0.5)} L${f(w)} ${f(0)} Q${f(w)} ${f(h * 0.5)} 0 ${f(h * 0.5)} Q${f(-w)} ${f(h * 0.5)} ${f(-w)} 0 Z`;
  // Inner vertical line (balance)
  d += ` M0 ${f(-h * 0.35)} L0 ${f(h * 0.25)}`;
  // Horizontal bar
  const bw = 2 + s(1) * 1;
  d += ` M${f(-bw)} ${f(-h * 0.1)} L${f(bw)} ${f(-h * 0.1)}`;
  return d;
}

// ─── HUMAN EDGE: organic curves / heart geometry ─────────────────

function humanEdgeRune(seed: number, s: (i: number) => number): string {
  const r = 4;
  const petals = 3 + Math.floor(s(0) * 3);
  let d = "";
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2 - Math.PI / 2;
    const tip = r * (0.7 + s(i + 1) * 0.3);
    const cx1 = Math.cos(a - 0.3) * tip * 0.6;
    const cy1 = Math.sin(a - 0.3) * tip * 0.6;
    const cx2 = Math.cos(a + 0.3) * tip * 0.6;
    const cy2 = Math.sin(a + 0.3) * tip * 0.6;
    const ex = Math.cos(a) * tip;
    const ey = Math.sin(a) * tip;
    d += `M0 0 Q${f(cx1)} ${f(cy1)} ${f(ex)} ${f(ey)} Q${f(cx2)} ${f(cy2)} 0 0 `;
  }
  // Center circle
  d += `M1.2 0 A1.2 1.2 0 1 0 -1.2 0 A1.2 1.2 0 1 0 1.2 0Z`;
  return d;
}

// ─── DEFAULT ─────────────────────────────────────────────────────

function defaultRune(seed: number, s: (i: number) => number): string {
  const r = 4;
  const sides = 6;
  let d = "";
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    d += i === 0 ? `M${f(x)} ${f(y)}` : ` L${f(x)} ${f(y)}`;
  }
  d += "Z";
  return d;
}

// ─── Helpers ─────────────────────────────────────────────────────

function deg(d: number): number {
  return (d * Math.PI) / 180;
}

function f(n: number): string {
  return n.toFixed(2);
}

/** Cache to avoid re-computing paths */
const runeCache = new Map<string, string>();

export function getSkillRune(skillId: string, category: string): string {
  const key = `${skillId}:${category}`;
  let path = runeCache.get(key);
  if (!path) {
    path = generateSkillRune(skillId, category);
    runeCache.set(key, path);
  }
  return path;
}
