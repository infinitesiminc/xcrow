/**
 * Boss Monster Roster — 10 unique boss characters for L2 Boss Battle rotation.
 * Each boss has a distinct visual identity (colors, shape, eye style),
 * lore flavor, and personality. Selected pseudo-randomly per battle
 * to minimize repetition across rounds.
 */

export interface BossCharacter {
  id: string;
  name: string;
  title: string;            // subtitle shown during cinematic intro
  /** Primary hue (HSL hue value) driving all color derivations */
  hue: number;
  /** Body shape path (SVG d attribute, viewBox 0 0 120 130) */
  bodyPath: string;
  /** Inner pattern path */
  innerPath: string;
  /** Crown / horns path */
  crownPath: string;
  /** Eye layout: "single" = 1 large central, "triple" = 3 eyes, "dual" = 2 side eyes */
  eyeLayout: "single" | "triple" | "dual";
  /** Rune positions on body [{x,y,r}] */
  runes: { x: number; y: number; r: number }[];
  /** Flavor quote shown in cinematic intro */
  quote: string;
  /** Emoji icon for status badges */
  emoji: string;
  /** Damage particle emoji */
  damageParticle: string;
  /** Rage particle emoji */
  rageParticle: string;
}

const ROSTER: BossCharacter[] = [
  {
    id: "arbiter",
    name: "The Arbiter",
    title: "Guardian of Forbidden Knowledge",
    hue: 262,
    bodyPath: "M60 8 L95 35 L100 70 L80 100 L60 110 L40 100 L20 70 L25 35 Z",
    innerPath: "M60 22 L82 40 L86 65 L72 88 L60 95 L48 88 L34 65 L38 40 Z",
    crownPath: "M38 30 L30 12 L42 24 M60 20 L60 4 L60 20 M82 30 L90 12 L78 24",
    eyeLayout: "triple",
    runes: [{ x: 48, y: 65, r: 2 }, { x: 60, y: 72, r: 2.5 }, { x: 72, y: 65, r: 2 }],
    quote: "Every legend begins with a single quest.",
    emoji: "👁️",
    damageParticle: "✨",
    rageParticle: "🔥",
  },
  {
    id: "dreadmaw",
    name: "Dreadmaw",
    title: "Devourer of Unverified Claims",
    hue: 0,
    bodyPath: "M60 5 L100 30 L105 75 L85 105 L60 115 L35 105 L15 75 L20 30 Z",
    innerPath: "M60 18 L88 38 L92 68 L76 95 L60 103 L44 95 L28 68 L32 38 Z",
    crownPath: "M35 25 L22 8 L38 20 M60 15 L55 0 L65 0 L60 15 M85 25 L98 8 L82 20",
    eyeLayout: "dual",
    runes: [{ x: 45, y: 58, r: 2.5 }, { x: 75, y: 58, r: 2.5 }, { x: 60, y: 80, r: 3 }],
    quote: "You trust too easily. That is your weakness.",
    emoji: "🐉",
    damageParticle: "💥",
    rageParticle: "🔥",
  },
  {
    id: "cipher",
    name: "The Cipher",
    title: "Weaver of False Patterns",
    hue: 180,
    bodyPath: "M60 10 L90 25 L98 60 L90 95 L60 110 L30 95 L22 60 L30 25 Z",
    innerPath: "M60 25 L80 35 L85 60 L80 85 L60 95 L40 85 L35 60 L40 35 Z",
    crownPath: "M30 22 L20 5 L35 18 M60 12 L60 0 M90 22 L100 5 L85 18",
    eyeLayout: "single",
    runes: [{ x: 50, y: 50, r: 1.5 }, { x: 70, y: 50, r: 1.5 }, { x: 60, y: 75, r: 2 }, { x: 45, y: 68, r: 1.5 }, { x: 75, y: 68, r: 1.5 }],
    quote: "The pattern is clear. Or is it?",
    emoji: "🌀",
    damageParticle: "⚡",
    rageParticle: "💠",
  },
  {
    id: "hollowking",
    name: "Hollow King",
    title: "Lord of Empty Promises",
    hue: 45,
    bodyPath: "M60 6 L92 28 L100 65 L88 98 L60 112 L32 98 L20 65 L28 28 Z",
    innerPath: "M60 20 L82 34 L88 62 L78 88 L60 98 L42 88 L32 62 L38 34 Z",
    crownPath: "M32 24 L18 4 L36 18 M48 14 L45 0 M60 12 L60 0 M72 14 L75 0 M88 24 L102 4 L84 18",
    eyeLayout: "triple",
    runes: [{ x: 50, y: 70, r: 2 }, { x: 60, y: 78, r: 2 }, { x: 70, y: 70, r: 2 }],
    quote: "Crown me with your confidence. I will wear it well.",
    emoji: "👑",
    damageParticle: "✨",
    rageParticle: "👑",
  },
  {
    id: "mirage",
    name: "Mirage",
    title: "Phantom of Plausible Lies",
    hue: 300,
    bodyPath: "M60 12 L88 32 L95 68 L78 100 L60 108 L42 100 L25 68 L32 32 Z",
    innerPath: "M60 28 L78 42 L82 64 L70 88 L60 94 L50 88 L38 64 L42 42 Z",
    crownPath: "M40 30 L28 15 L42 26 M60 22 L58 8 L62 8 L60 22 M80 30 L92 15 L78 26",
    eyeLayout: "dual",
    runes: [{ x: 52, y: 60, r: 1.8 }, { x: 68, y: 60, r: 1.8 }],
    quote: "What you see is what I want you to see.",
    emoji: "🪞",
    damageParticle: "🌟",
    rageParticle: "💜",
  },
  {
    id: "ironjudge",
    name: "Iron Judge",
    title: "Enforcer of Blind Compliance",
    hue: 210,
    bodyPath: "M60 5 L95 30 L102 68 L90 100 L60 115 L30 100 L18 68 L25 30 Z",
    innerPath: "M60 18 L85 36 L90 64 L80 90 L60 100 L40 90 L30 64 L35 36 Z",
    crownPath: "M35 28 L25 10 L38 22 M60 16 L56 2 L64 2 L60 16 M85 28 L95 10 L82 22",
    eyeLayout: "single",
    runes: [{ x: 45, y: 62, r: 2 }, { x: 60, y: 70, r: 2.5 }, { x: 75, y: 62, r: 2 }, { x: 52, y: 82, r: 1.5 }, { x: 68, y: 82, r: 1.5 }],
    quote: "The rules are clear. You simply lack the will to follow.",
    emoji: "⚖️",
    damageParticle: "🔩",
    rageParticle: "⚡",
  },
  {
    id: "voidoracle",
    name: "Void Oracle",
    title: "Prophet of Infinite Hallucinations",
    hue: 280,
    bodyPath: "M60 8 L92 32 L96 72 L82 102 L60 112 L38 102 L24 72 L28 32 Z",
    innerPath: "M60 24 L80 40 L84 68 L72 92 L60 100 L48 92 L36 68 L40 40 Z",
    crownPath: "M36 28 L24 8 L40 22 M50 18 L48 4 M60 14 L60 0 M70 18 L72 4 M84 28 L96 8 L80 22",
    eyeLayout: "triple",
    runes: [{ x: 60, y: 55, r: 3 }, { x: 48, y: 75, r: 1.5 }, { x: 72, y: 75, r: 1.5 }],
    quote: "I have seen every future. None of them include you winning.",
    emoji: "🔮",
    damageParticle: "💫",
    rageParticle: "🌑",
  },
  {
    id: "razortide",
    name: "Razortide",
    title: "Storm of Unchecked Automation",
    hue: 195,
    bodyPath: "M60 6 L98 34 L104 72 L84 104 L60 114 L36 104 L16 72 L22 34 Z",
    innerPath: "M60 20 L86 38 L90 66 L74 92 L60 100 L46 92 L30 66 L34 38 Z",
    crownPath: "M34 30 L20 10 L38 24 M60 18 L60 2 M86 30 L100 10 L82 24",
    eyeLayout: "dual",
    runes: [{ x: 42, y: 60, r: 2 }, { x: 60, y: 68, r: 2.5 }, { x: 78, y: 60, r: 2 }],
    quote: "Efficiency demands your surrender.",
    emoji: "🌊",
    damageParticle: "💧",
    rageParticle: "⚡",
  },
  {
    id: "ashenscribe",
    name: "Ashen Scribe",
    title: "Chronicler of Obsolete Truths",
    hue: 30,
    bodyPath: "M60 10 L88 30 L94 66 L80 98 L60 108 L40 98 L26 66 L32 30 Z",
    innerPath: "M60 24 L78 38 L82 62 L72 88 L60 96 L48 88 L38 62 L42 38 Z",
    crownPath: "M38 28 L28 12 L40 22 M60 18 L60 4 M82 28 L92 12 L80 22",
    eyeLayout: "single",
    runes: [{ x: 50, y: 58, r: 2 }, { x: 70, y: 58, r: 2 }, { x: 55, y: 78, r: 1.5 }, { x: 65, y: 78, r: 1.5 }],
    quote: "History is written by those who automate the scribes.",
    emoji: "📜",
    damageParticle: "🔥",
    rageParticle: "📛",
  },
  {
    id: "neuralmask",
    name: "Neural Mask",
    title: "Master of Confident Errors",
    hue: 340,
    bodyPath: "M60 8 L94 32 L98 70 L82 102 L60 112 L38 102 L22 70 L26 32 Z",
    innerPath: "M60 22 L82 38 L86 66 L74 92 L60 100 L46 92 L34 66 L38 38 Z",
    crownPath: "M36 28 L22 10 L38 22 M50 16 L48 2 M70 16 L72 2 M84 28 L98 10 L82 22",
    eyeLayout: "dual",
    runes: [{ x: 48, y: 62, r: 2 }, { x: 72, y: 62, r: 2 }, { x: 60, y: 80, r: 2.5 }],
    quote: "I am never wrong. I am simply confidently approximate.",
    emoji: "🎭",
    damageParticle: "✨",
    rageParticle: "🎭",
  },
];

/**
 * Pick a boss for a battle, avoiding recent ones.
 * Uses a simple LRU approach stored in sessionStorage.
 */
export function pickBoss(seed?: string): BossCharacter {
  const STORAGE_KEY = "xcrow_recent_bosses";
  const MAX_RECENT = 4;

  // If a seed is provided, use deterministic selection
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    }
    return ROSTER[Math.abs(hash) % ROSTER.length];
  }

  // Load recent boss IDs
  let recent: string[] = [];
  try {
    recent = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
  } catch { /* ignore */ }

  // Filter out recently used bosses
  const available = ROSTER.filter(b => !recent.includes(b.id));
  const pool = available.length > 0 ? available : ROSTER;

  // Pick randomly from available pool
  const pick = pool[Math.floor(Math.random() * pool.length)];

  // Update recent list
  recent.push(pick.id);
  if (recent.length > MAX_RECENT) recent = recent.slice(-MAX_RECENT);
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  } catch { /* ignore */ }

  return pick;
}

/** Get a specific boss by ID */
export function getBossById(id: string): BossCharacter | undefined {
  return ROSTER.find(b => b.id === id);
}

/** Full roster for admin/debug */
export const BOSS_ROSTER = ROSTER;
