/**
 * Boss Monster Roster — 10 unique boss characters for L2 Boss Battle rotation.
 * Each boss has a distinct animal-inspired visual identity with unique silhouette,
 * creature detail paths, colors, and personality.
 */

export interface BossCharacter {
  id: string;
  name: string;
  title: string;
  /** Primary hue (HSL hue value) driving all color derivations */
  hue: number;
  /** Body shape path (SVG d attribute, viewBox 0 0 120 130) */
  bodyPath: string;
  /** Inner pattern path */
  innerPath: string;
  /** Crown / horns / ears path */
  crownPath: string;
  /** Extra creature detail paths (teeth, tentacles, claws, wings, etc.) */
  detailPaths: string[];
  /** Eye layout: "single" = 1 large central, "triple" = 3 eyes, "dual" = 2 side eyes */
  eyeLayout: "single" | "triple" | "dual";
  /** Eye position overrides */
  eyePositions: { cx: number; cy: number; r: number }[];
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
    // OWL — all-seeing, wise & terrifying
    id: "arbiter",
    name: "The Arbiter",
    title: "Guardian of Forbidden Knowledge",
    hue: 262,
    bodyPath: "M40 8 L28 2 L26 30 L16 48 L14 70 L22 94 L38 112 L60 120 L82 112 L98 94 L106 70 L104 48 L94 30 L92 2 L80 8 L60 16 Z",
    innerPath: "M45 30 L35 44 L32 64 L38 84 L52 100 L60 104 L68 100 L82 84 L88 64 L85 44 L75 30 L60 24 Z",
    crownPath: "M28 2 L20 -10 L30 8 M92 2 L100 -10 L90 8 M60 16 L60 6",
    detailPaths: [
      // Feather tufts on sides
      "M16 48 L6 42 L14 52",
      "M104 48 L114 42 L106 52",
      // Talons at base
      "M38 112 L32 124 L40 118 M52 118 L48 128 L56 120",
      "M82 112 L88 124 L80 118 M68 120 L72 128 L64 118",
    ],
    eyeLayout: "dual",
    eyePositions: [
      { cx: 42, cy: 55, r: 7 },
      { cx: 78, cy: 55, r: 7 },
    ],
    runes: [{ x: 60, y: 80, r: 2.5 }, { x: 50, y: 90, r: 1.5 }, { x: 70, y: 90, r: 1.5 }],
    quote: "Every legend begins with a single quest.",
    emoji: "🦉",
    damageParticle: "🪶",
    rageParticle: "🔥",
  },
  {
    // DRAGON — horned, fanged, terrifying jaw
    id: "dreadmaw",
    name: "Dreadmaw",
    title: "Devourer of Unverified Claims",
    hue: 0,
    bodyPath: "M60 8 L45 2 L25 10 L15 32 L12 58 L18 82 L32 102 L48 114 L60 118 L72 114 L88 102 L102 82 L108 58 L105 32 L95 10 L75 2 Z",
    innerPath: "M60 22 L42 18 L30 28 L24 48 L22 65 L28 80 L40 94 L60 102 L80 94 L92 80 L98 65 L96 48 L90 28 L78 18 Z",
    crownPath: "M25 10 L12 -5 L22 14 M45 2 L38 -12 L48 6 M75 2 L82 -12 L72 6 M95 10 L108 -5 L98 14",
    detailPaths: [
      // Jaw fangs
      "M36 102 L30 116 L38 108",
      "M48 110 L45 124 L52 114",
      "M68 114 L75 124 L72 110",
      "M84 108 L90 116 L84 102",
      // Spine ridges
      "M60 8 L58 0 L62 0 L60 8",
      // Nostrils
      "M50 72 L48 68 L52 68 Z",
      "M70 72 L68 68 L72 68 Z",
    ],
    eyeLayout: "dual",
    eyePositions: [
      { cx: 40, cy: 48, r: 6 },
      { cx: 80, cy: 48, r: 6 },
    ],
    runes: [{ x: 45, y: 65, r: 2.5 }, { x: 75, y: 65, r: 2.5 }, { x: 60, y: 85, r: 3 }],
    quote: "You trust too easily. That is your weakness.",
    emoji: "🐉",
    damageParticle: "💥",
    rageParticle: "🔥",
  },
  {
    // SPIDER — bulbous body with radiating legs
    id: "cipher",
    name: "The Cipher",
    title: "Weaver of False Patterns",
    hue: 180,
    bodyPath: "M60 22 L80 25 L94 40 L98 60 L94 80 L80 94 L60 98 L40 94 L26 80 L22 60 L26 40 L40 25 Z",
    innerPath: "M60 35 L72 37 L82 48 L85 60 L82 72 L72 82 L60 85 L48 82 L38 72 L35 60 L38 48 L48 37 Z",
    crownPath: "M60 22 L58 12 L62 12 L60 22",
    detailPaths: [
      // 8 spider legs
      "M40 25 L22 8 L18 15",
      "M26 40 L5 28 L8 36",
      "M22 60 L2 55 L5 62",
      "M26 80 L8 92 L15 88",
      "M80 25 L98 8 L102 15",
      "M94 40 L115 28 L112 36",
      "M98 60 L118 55 L115 62",
      "M94 80 L112 92 L105 88",
      // Chelicerae / fangs
      "M52 98 L48 112 L54 106",
      "M68 98 L72 112 L66 106",
    ],
    eyeLayout: "triple",
    eyePositions: [
      { cx: 60, cy: 52, r: 5 },
      { cx: 48, cy: 46, r: 3 },
      { cx: 72, cy: 46, r: 3 },
    ],
    runes: [{ x: 60, y: 68, r: 2 }, { x: 48, y: 72, r: 1.5 }, { x: 72, y: 72, r: 1.5 }],
    quote: "The pattern is clear. Or is it?",
    emoji: "🕷️",
    damageParticle: "🕸️",
    rageParticle: "💠",
  },
  {
    // LION — radiating mane, powerful jaw
    id: "hollowking",
    name: "Hollow King",
    title: "Lord of Empty Promises",
    hue: 45,
    bodyPath: "M60 28 L78 30 L92 44 L98 64 L90 84 L74 100 L60 108 L46 100 L30 84 L22 64 L28 44 L42 30 Z",
    innerPath: "M60 40 L72 42 L82 52 L86 64 L80 78 L70 90 L60 95 L50 90 L40 78 L34 64 L38 52 L48 42 Z",
    crownPath: "",
    detailPaths: [
      // Mane spikes radiating outward
      "M42 30 L28 12 L44 28",
      "M60 28 L60 6 L60 26",
      "M78 30 L92 12 L76 28",
      "M92 44 L112 34 L90 42",
      "M98 64 L118 60 L96 64",
      "M90 84 L108 96 L88 82",
      "M28 44 L8 34 L30 42",
      "M22 64 L2 60 L24 64",
      "M30 84 L12 96 L32 82",
      // Fangs
      "M50 100 L48 112 L54 104",
      "M70 100 L72 112 L66 104",
    ],
    eyeLayout: "dual",
    eyePositions: [
      { cx: 46, cy: 58, r: 5 },
      { cx: 74, cy: 58, r: 5 },
    ],
    runes: [{ x: 60, y: 75, r: 2 }, { x: 52, y: 82, r: 1.5 }, { x: 68, y: 82, r: 1.5 }],
    quote: "Crown me with your confidence. I will wear it well.",
    emoji: "🦁",
    damageParticle: "✨",
    rageParticle: "👑",
  },
  {
    // FOX / JACKAL — tall pointed ears, sleek, deceptive
    id: "mirage",
    name: "Mirage",
    title: "Phantom of Plausible Lies",
    hue: 300,
    bodyPath: "M60 118 L42 106 L30 88 L24 66 L26 46 L32 32 L44 20 L60 16 L76 20 L88 32 L94 46 L96 66 L90 88 L78 106 Z",
    innerPath: "M60 105 L48 96 L38 82 L34 64 L36 48 L42 38 L52 30 L60 28 L68 30 L78 38 L84 48 L86 64 L82 82 L72 96 Z",
    crownPath: "M44 20 L28 -4 L42 16 M76 20 L92 -4 L78 16",
    detailPaths: [
      // Whiskers
      "M42 70 L18 64",
      "M42 74 L16 76",
      "M42 78 L20 86",
      "M78 70 L102 64",
      "M78 74 L104 76",
      "M78 78 L100 86",
      // Snout
      "M52 92 L60 102 L68 92",
      // Inner ears
      "M44 20 L36 4 L46 18",
      "M76 20 L84 4 L74 18",
    ],
    eyeLayout: "dual",
    eyePositions: [
      { cx: 46, cy: 50, r: 5 },
      { cx: 74, cy: 50, r: 5 },
    ],
    runes: [{ x: 52, y: 64, r: 1.8 }, { x: 68, y: 64, r: 1.8 }],
    quote: "What you see is what I want you to see.",
    emoji: "🦊",
    damageParticle: "🌟",
    rageParticle: "💜",
  },
  {
    // BULL / MINOTAUR — massive horizontal horns, thick
    id: "ironjudge",
    name: "Iron Judge",
    title: "Enforcer of Blind Compliance",
    hue: 210,
    bodyPath: "M60 22 L82 24 L98 38 L106 58 L100 80 L88 100 L60 114 L32 100 L20 80 L14 58 L22 38 L38 24 Z",
    innerPath: "M60 34 L74 36 L86 46 L92 60 L88 76 L78 90 L60 98 L42 90 L32 76 L28 60 L34 46 L46 36 Z",
    crownPath: "M38 24 L18 10 L2 2 L14 16 L24 28 M82 24 L102 10 L118 2 L106 16 L96 28",
    detailPaths: [
      // Nose ring
      "M52 82 Q56 90 60 88 Q64 90 68 82",
      // Nostrils
      "M52 76 L50 72 L54 74",
      "M68 76 L70 72 L66 74",
      // Brow ridge
      "M38 40 L46 36 M82 40 L74 36",
    ],
    eyeLayout: "dual",
    eyePositions: [
      { cx: 42, cy: 52, r: 5 },
      { cx: 78, cy: 52, r: 5 },
    ],
    runes: [{ x: 50, y: 66, r: 2 }, { x: 60, y: 72, r: 2.5 }, { x: 70, y: 66, r: 2 }],
    quote: "The rules are clear. You simply lack the will to follow.",
    emoji: "🐂",
    damageParticle: "🔩",
    rageParticle: "⚡",
  },
  {
    // OCTOPUS / KRAKEN — dome head, hanging tentacles
    id: "voidoracle",
    name: "Void Oracle",
    title: "Prophet of Infinite Hallucinations",
    hue: 280,
    bodyPath: "M60 10 L82 16 L98 32 L106 54 L100 72 L82 82 L60 86 L38 82 L20 72 L14 54 L22 32 L38 16 Z",
    innerPath: "M60 24 L74 28 L86 40 L92 54 L88 66 L76 74 L60 78 L44 74 L32 66 L28 54 L34 40 L46 28 Z",
    crownPath: "M60 10 L58 2 L62 2 L60 10 M42 14 L38 6 M78 14 L82 6",
    detailPaths: [
      // Tentacles hanging down
      "M38 82 L32 98 L28 112 L26 126",
      "M46 84 L42 102 L45 118 L42 130",
      "M54 86 L50 106 L53 122",
      "M66 86 L70 106 L67 122",
      "M74 84 L78 102 L75 118 L78 130",
      "M82 82 L88 98 L92 112 L94 126",
      // Suckers on tentacles
      "M30 105 L32 102",
      "M90 105 L88 102",
    ],
    eyeLayout: "triple",
    eyePositions: [
      { cx: 60, cy: 48, r: 6 },
      { cx: 44, cy: 42, r: 3.5 },
      { cx: 76, cy: 42, r: 3.5 },
    ],
    runes: [{ x: 60, y: 62, r: 3 }, { x: 48, y: 68, r: 1.5 }, { x: 72, y: 68, r: 1.5 }],
    quote: "I have seen every future. None of them include you winning.",
    emoji: "🐙",
    damageParticle: "💫",
    rageParticle: "🌑",
  },
  {
    // SHARK — dorsal fin, streamlined predator, teeth
    id: "razortide",
    name: "Razortide",
    title: "Storm of Unchecked Automation",
    hue: 195,
    bodyPath: "M60 32 L82 36 L98 50 L106 70 L98 90 L80 108 L60 114 L40 108 L22 90 L14 70 L22 50 L38 36 Z",
    innerPath: "M60 44 L74 46 L86 56 L92 70 L86 84 L74 96 L60 100 L46 96 L34 84 L28 70 L34 56 L46 46 Z",
    crownPath: "M58 32 L56 4 L60 0 L64 4 L62 32",
    detailPaths: [
      // Pectoral fins
      "M22 50 L2 38 L16 54",
      "M98 50 L118 38 L104 54",
      // Tail fin hint
      "M40 108 L32 120 L44 112",
      "M80 108 L88 120 L76 112",
      // Teeth / jaw
      "M42 96 L38 104 L44 100",
      "M50 100 L48 108 L54 102",
      "M66 102 L72 108 L70 100",
      "M78 100 L82 104 L78 96",
      // Gill slits
      "M30 62 L28 58 M30 66 L28 62 M30 70 L28 66",
      "M90 62 L92 58 M90 66 L92 62 M90 70 L92 66",
    ],
    eyeLayout: "dual",
    eyePositions: [
      { cx: 40, cy: 60, r: 5 },
      { cx: 80, cy: 60, r: 5 },
    ],
    runes: [{ x: 50, y: 74, r: 2 }, { x: 60, y: 80, r: 2.5 }, { x: 70, y: 74, r: 2 }],
    quote: "Efficiency demands your surrender.",
    emoji: "🦈",
    damageParticle: "💧",
    rageParticle: "⚡",
  },
  {
    // RAVEN — sharp beak, wing-cape, ominous
    id: "ashenscribe",
    name: "Ashen Scribe",
    title: "Chronicler of Obsolete Truths",
    hue: 30,
    bodyPath: "M60 10 L78 18 L92 32 L100 52 L95 72 L82 88 L68 98 L60 102 L52 98 L38 88 L25 72 L20 52 L28 32 L42 18 Z",
    innerPath: "M60 24 L72 30 L82 40 L88 54 L84 68 L74 80 L64 88 L60 90 L56 88 L46 80 L36 68 L32 54 L38 40 L48 30 Z",
    crownPath: "M60 10 L56 2 L60 6 L64 2 L60 10",
    detailPaths: [
      // Beak
      "M52 98 L48 110 L55 106 L60 120 L65 106 L72 110 L68 98",
      // Wing feathers left
      "M25 72 L8 76 L6 66 L12 60",
      "M20 60 L4 58 L8 50",
      // Wing feathers right
      "M95 72 L112 76 L114 66 L108 60",
      "M100 60 L116 58 L112 50",
      // Tail feathers
      "M48 98 L42 108 L46 104",
      "M72 98 L78 108 L74 104",
    ],
    eyeLayout: "dual",
    eyePositions: [
      { cx: 46, cy: 48, r: 5 },
      { cx: 74, cy: 48, r: 5 },
    ],
    runes: [{ x: 54, y: 62, r: 2 }, { x: 66, y: 62, r: 2 }, { x: 60, y: 78, r: 1.5 }],
    quote: "History is written by those who automate the scribes.",
    emoji: "🐦‍⬛",
    damageParticle: "🔥",
    rageParticle: "📛",
  },
  {
    // WOLF — angular, pointed ears, fierce muzzle
    id: "neuralmask",
    name: "Neural Mask",
    title: "Master of Confident Errors",
    hue: 340,
    bodyPath: "M60 118 L42 104 L28 86 L22 64 L25 44 L32 30 L44 20 L60 16 L76 20 L88 30 L95 44 L98 64 L92 86 L78 104 Z",
    innerPath: "M60 108 L48 98 L36 82 L32 64 L34 48 L40 36 L50 28 L60 26 L70 28 L80 36 L86 48 L88 64 L84 82 L72 98 Z",
    crownPath: "M44 20 L26 -6 L40 14 M76 20 L94 -6 L80 14",
    detailPaths: [
      // Snout / muzzle
      "M48 88 L42 98 L50 94 L60 106 L70 94 L78 98 L72 88",
      // Fangs
      "M50 94 L48 102",
      "M70 94 L72 102",
      // Inner ears
      "M44 20 L34 2 L46 18",
      "M76 20 L86 2 L74 18",
      // Ruff / neck fur
      "M28 86 L20 92 L30 88",
      "M92 86 L100 92 L90 88",
      // Brow ridges
      "M36 38 L44 34",
      "M84 38 L76 34",
    ],
    eyeLayout: "dual",
    eyePositions: [
      { cx: 44, cy: 48, r: 5.5 },
      { cx: 76, cy: 48, r: 5.5 },
    ],
    runes: [{ x: 52, y: 62, r: 2 }, { x: 68, y: 62, r: 2 }, { x: 60, y: 76, r: 2.5 }],
    quote: "I am never wrong. I am simply confidently approximate.",
    emoji: "🐺",
    damageParticle: "✨",
    rageParticle: "🐺",
  },
  {
    // SCORPION — armored, pincers, curved stinger tail
    id: "venomclause",
    name: "Venom Clause",
    title: "Arbiter of Hidden Conditions",
    hue: 52,
    bodyPath: "M60 30 L80 34 L95 48 L100 68 L92 88 L75 102 L60 108 L45 102 L28 88 L20 68 L25 48 L40 34 Z",
    innerPath: "M60 42 L72 44 L82 54 L86 68 L80 82 L68 92 L60 96 L52 92 L40 82 L34 68 L38 54 L48 44 Z",
    crownPath: "",
    detailPaths: [
      // Pincers
      "M25 48 L8 32 L2 22 L12 30 L10 38",
      "M8 32 L4 28 L14 34",
      "M95 48 L112 32 L118 22 L108 30 L110 38",
      "M112 32 L116 28 L106 34",
      // Stinger tail curving up
      "M60 30 L58 18 L55 8 L52 2 L50 -4 L54 0 L56 6",
      // Armored segments
      "M40 60 L32 58 M40 68 L30 68 M40 76 L32 78",
      "M80 60 L88 58 M80 68 L90 68 M80 76 L88 78",
      // Leg stubs
      "M28 88 L18 96 L22 92",
      "M92 88 L102 96 L98 92",
    ],
    eyeLayout: "dual",
    eyePositions: [
      { cx: 48, cy: 56, r: 4.5 },
      { cx: 72, cy: 56, r: 4.5 },
    ],
    runes: [{ x: 60, y: 72, r: 2 }, { x: 52, y: 80, r: 1.5 }, { x: 68, y: 80, r: 1.5 }],
    quote: "Read the fine print. Oh wait — there is none.",
    emoji: "🦂",
    damageParticle: "💚",
    rageParticle: "☠️",
  },
  {
    // SERPENT — coiled, hooded cobra, hypnotic
    id: "eclipsecoil",
    name: "Eclipse Coil",
    title: "Serpent of Subtle Misdirection",
    hue: 145,
    bodyPath: "M60 12 L76 16 L88 28 L95 46 L92 66 L82 82 L68 94 L60 98 L52 94 L38 82 L28 66 L25 46 L32 28 L44 16 Z",
    innerPath: "M60 26 L70 28 L80 38 L84 50 L82 64 L74 76 L64 84 L60 86 L56 84 L46 76 L38 64 L36 50 L40 38 L50 28 Z",
    crownPath: "",
    detailPaths: [
      // Hood flare
      "M44 16 L28 8 L18 12 L24 20 L32 24",
      "M76 16 L92 8 L102 12 L96 20 L88 24",
      // Hood inner lines
      "M32 24 L28 18",
      "M88 24 L92 18",
      // Coiled body below
      "M52 94 L42 104 L38 112 L44 118 L56 120 L68 118 L76 112 L80 104 L72 96",
      "M44 118 L40 124 L50 128 L62 128 L72 124 L76 118",
      // Forked tongue
      "M58 86 L56 96 L54 100 M58 86 L60 96 L62 100",
      // Scale pattern
      "M44 50 L40 46 M44 58 L38 56 M44 66 L40 68",
      "M76 50 L80 46 M76 58 L82 56 M76 66 L80 68",
    ],
    eyeLayout: "single",
    eyePositions: [
      { cx: 60, cy: 46, r: 7 },
    ],
    runes: [{ x: 50, y: 60, r: 1.8 }, { x: 70, y: 60, r: 1.8 }, { x: 60, y: 72, r: 2 }],
    quote: "Sssleep now. The answer will come to you... wrong.",
    emoji: "🐍",
    damageParticle: "💀",
    rageParticle: "🐍",
  },
];

/**
 * Pick a boss for a battle, avoiding recent ones.
 * Uses a simple LRU approach stored in sessionStorage.
 */
export function pickBoss(seed?: string): BossCharacter {
  const STORAGE_KEY = "xcrow_recent_bosses";
  const MAX_RECENT = 4;

  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    }
    return ROSTER[Math.abs(hash) % ROSTER.length];
  }

  let recent: string[] = [];
  try {
    recent = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
  } catch { /* ignore */ }

  const available = ROSTER.filter(b => !recent.includes(b.id));
  const pool = available.length > 0 ? available : ROSTER;
  const pick = pool[Math.floor(Math.random() * pool.length)];

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
