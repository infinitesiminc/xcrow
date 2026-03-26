/**
 * Territory Guardians — 8 named boss-like characters, one per skill territory.
 * Each guardian has unique lore, personality, and visual theming tied to their domain.
 * They serve as narrative anchors and skill-domain gatekeepers on the territory map.
 */

import type { FutureSkillCategory } from "@/hooks/use-future-skills";

export interface TerritoryGuardian {
  id: string;
  name: string;
  title: string;
  category: FutureSkillCategory;
  emoji: string;
  /** Short lore blurb shown on encounter */
  lore: string;
  /** Challenge quote when player approaches */
  challengeQuote: string;
  /** Coaching hint the guardian gives after defeat */
  coachingHint: string;
  /** Visual: HSL hue for glow effects */
  hue: number;
  /** Personality archetype for AI dialogue generation */
  personality: "sage" | "trickster" | "warrior" | "scholar" | "mystic" | "sentinel" | "artisan" | "empath";
}

export const TERRITORY_GUARDIANS: TerritoryGuardian[] = [
  {
    id: "ironclad",
    name: "Ironclad",
    title: "Warden of the Circuit Peaks",
    category: "Technical",
    emoji: "⚙️",
    hue: 200,
    personality: "warrior",
    lore: "Forged in silicon and tempered by a thousand failed deploys, Ironclad guards the Technical peaks. Only those who truly understand systems architecture may pass.",
    challengeQuote: "Code without comprehension is just noise. Show me you understand what you build.",
    coachingHint: "Master the fundamentals — abstractions crumble without solid foundations.",
  },
  {
    id: "lexicon",
    name: "Lexicon",
    title: "Oracle of the Data Highlands",
    category: "Analytical",
    emoji: "📊",
    hue: 170,
    personality: "scholar",
    lore: "Lexicon has catalogued every dataset ever corrupted and every insight ever missed. She tests whether you can find truth hidden in noise.",
    challengeQuote: "Numbers don't lie — but the untrained eye sees only what it wants to see.",
    coachingHint: "Question every metric. The most dangerous insight is the one you accept without verification.",
  },
  {
    id: "sovereign",
    name: "Sovereign",
    title: "Commander of the Summit",
    category: "Strategic",
    emoji: "🎯",
    hue: 280,
    personality: "sage",
    lore: "From the Command Summit, Sovereign has watched empires of strategy rise and fall. She rewards those who think three moves ahead.",
    challengeQuote: "Tactics win battles. Strategy wins wars. Which are you playing?",
    coachingHint: "Zoom out before zooming in. The best decision often looks counterintuitive at first glance.",
  },
  {
    id: "herald",
    name: "Herald",
    title: "Voice of the Bridge Isles",
    category: "Communication",
    emoji: "💬",
    hue: 30,
    personality: "empath",
    lore: "Herald has bridged kingdoms and dissolved conflicts with nothing but the right words at the right time. He tests your ability to convey the complex simply.",
    challengeQuote: "The most powerful technology is useless if you cannot explain it to the person who needs it.",
    coachingHint: "Clarity is kindness. Every extra word you add is a wall between you and understanding.",
  },
  {
    id: "crownweaver",
    name: "Crownweaver",
    title: "Keeper of Crown Heights",
    category: "Leadership",
    emoji: "👑",
    hue: 45,
    personality: "sage",
    lore: "Crownweaver has crowned and dethroned a hundred leaders. She knows that true leadership is not authority — it is the ability to make others believe in a future worth building.",
    challengeQuote: "Anyone can give orders. Can you inspire someone to exceed what they thought possible?",
    coachingHint: "Lead by showing what's possible, not by dictating what must be done.",
  },
  {
    id: "prisma",
    name: "Prisma",
    title: "Muse of the Prism Coast",
    category: "Creative",
    emoji: "🎨",
    hue: 320,
    personality: "artisan",
    lore: "Prisma shapes light into meaning and chaos into beauty. She challenges those who confuse decoration with design.",
    challengeQuote: "A beautiful interface that nobody can use is just expensive wallpaper. Show me design with purpose.",
    coachingHint: "Creativity is problem-solving with style. Start with the problem, not the palette.",
  },
  {
    id: "aegis",
    name: "Aegis",
    title: "Sentinel of the Watch",
    category: "Ethics & Compliance",
    emoji: "🛡️",
    hue: 150,
    personality: "sentinel",
    lore: "Aegis stands at the boundary between innovation and harm. She has seen what happens when builders move fast without thinking about consequences.",
    challengeQuote: "Speed without ethics is just recklessness with a venture-backed budget.",
    coachingHint: "Ask 'who could this hurt?' before asking 'how fast can we ship it?'",
  },
  {
    id: "kindred",
    name: "Kindred",
    title: "Spirit of Soul Springs",
    category: "Human Edge",
    emoji: "✦",
    hue: 340,
    personality: "mystic",
    lore: "Kindred embodies the qualities no machine can replicate: empathy, intuition, moral reasoning. She guards the skills that make humans irreplaceable.",
    challengeQuote: "Machines can optimize. Machines can predict. But can they care? That is your edge.",
    coachingHint: "Your human edge isn't a fallback — it's your superpower. Sharpen it deliberately.",
  },
];

/** Get guardian by territory category */
export function getGuardianByCategory(category: FutureSkillCategory): TerritoryGuardian | undefined {
  return TERRITORY_GUARDIANS.find(g => g.category === category);
}

/** Get guardian by ID */
export function getGuardianById(id: string): TerritoryGuardian | undefined {
  return TERRITORY_GUARDIANS.find(g => g.id === id);
}
