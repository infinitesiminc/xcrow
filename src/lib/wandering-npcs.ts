/**
 * Wandering NPCs — 6 character archetypes that appear randomly on the territory map.
 * Each provides a different type of interaction: intel, trades, challenges, or coaching.
 * NPCs rotate positions and appear based on session activity / time-of-day.
 */

import type { FutureSkillCategory } from "@/hooks/use-future-skills";

export type NPCArchetype = "merchant" | "oracle" | "rival" | "scout" | "blacksmith" | "bard";

export interface WanderingNPC {
  id: NPCArchetype;
  name: string;
  title: string;
  emoji: string;
  /** Lucide icon name for reliable rendering */
  iconName: "gem" | "eye" | "swords" | "compass" | "hammer" | "scroll-text";
  /** What this NPC offers */
  offering: string;
  /** Greeting line */
  greeting: string;
  /** Interaction type determines what UI opens */
  interactionType: "shop" | "prophecy" | "duel" | "intel" | "upgrade" | "story";
  /** How often this NPC appears (higher = more frequent) */
  spawnWeight: number;
}

export const WANDERING_NPCS: WanderingNPC[] = [
  {
    id: "merchant",
    name: "Zara the Trader",
    title: "Credit Merchant",
    emoji: "🧙‍♀️",
    iconName: "gem",
    offering: "Trade credits for skill boosts, hint scrolls, or cosmetic upgrades.",
    greeting: "Psst! Looking for an edge? I've got rare scrolls that might interest you...",
    interactionType: "shop",
    spawnWeight: 3,
  },
  {
    id: "oracle",
    name: "The Farseer",
    title: "Market Oracle",
    emoji: "🔮",
    iconName: "eye",
    offering: "Reveals trending skills, industry demand shifts, and career path predictions.",
    greeting: "I see patterns in the data streams that others miss. Shall I share what I've seen?",
    interactionType: "prophecy",
    spawnWeight: 4,
  },
  {
    id: "rival",
    name: "Echo",
    title: "Shadow Rival",
    emoji: "⚔️",
    iconName: "swords",
    offering: "Challenges you to a timed skill duel for bonus XP and bragging rights.",
    greeting: "So you think you're ready? Let's see if you can match my score...",
    interactionType: "duel",
    spawnWeight: 2,
  },
  {
    id: "scout",
    name: "Pathfinder Kai",
    title: "Territory Scout",
    emoji: "🗺️",
    iconName: "compass",
    offering: "Shares intel on unexplored territory skills, recommended learning paths.",
    greeting: "I've mapped every corner of these territories. Want to know what's worth exploring next?",
    interactionType: "intel",
    spawnWeight: 4,
  },
  {
    id: "blacksmith",
    name: "Anvil",
    title: "Skill Forgemaster",
    emoji: "🔨",
    iconName: "hammer",
    offering: "Upgrades weak skills through targeted practice drills and combo exercises.",
    greeting: "Bring me your weakest skill and I'll temper it into something formidable.",
    interactionType: "upgrade",
    spawnWeight: 3,
  },
  {
    id: "bard",
    name: "Verse",
    title: "Lorekeeper",
    emoji: "📜",
    iconName: "scroll-text",
    offering: "Tells stories about skill origins, industry lore, and AI history.",
    greeting: "Gather 'round! Let me tell you the tale of how this skill changed an industry forever...",
    interactionType: "story",
    spawnWeight: 2,
  },
];

export type NPCActivationRule = "proactive" | "reactive" | "provocative" | "ambient" | "passive";

/** When and how each NPC archetype activates */
export const NPC_BEHAVIORS: Record<NPCArchetype, { rule: NPCActivationRule; description: string }> = {
  scout:      { rule: "proactive",   description: "Greets first, suggests unexplored territories" },
  oracle:     { rule: "ambient",     description: "Drops lore toasts periodically" },
  rival:      { rule: "provocative", description: "Interrupts after idle time" },
  merchant:   { rule: "reactive",    description: "Appears after milestone completions" },
  blacksmith: { rule: "reactive",    description: "Appears after practicing skills" },
  bard:       { rule: "ambient",     description: "Shares lore in the background" },
};

export interface NPCSpawn {
  npc: WanderingNPC;
  territory: FutureSkillCategory;
  /** Offset from territory center (px in SVG coords) */
  offsetX: number;
  offsetY: number;
  activationRule: NPCActivationRule;
}

const ALL_TERRITORIES: FutureSkillCategory[] = [
  "Technical", "Analytical", "Strategic", "Communication",
  "Leadership", "Creative", "Ethics & Compliance", "Human Edge",
];

/** Simple string hash for deterministic seeding */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/** Pick a territory the user hasn't explored yet */
function pickUnexplored(
  exploredTerritories: Set<string>,
  seed: number,
  index: number
): FutureSkillCategory {
  const unexplored = ALL_TERRITORIES.filter(t => !exploredTerritories.has(t));
  if (unexplored.length === 0) return ALL_TERRITORIES[seed % ALL_TERRITORIES.length];
  const seededRand = Math.sin(seed * 9301 + index * 4919) * 10000;
  return unexplored[Math.floor(Math.abs(seededRand - Math.floor(seededRand)) * unexplored.length)];
}

/**
 * Generate NPC spawns for a specific user session.
 * Uses userId + date for per-user daily-stable layouts.
 * Falls back to hourly global seed for anonymous users.
 */
export function generateNPCSpawns(seed?: number): NPCSpawn[] {
  const s = seed ?? Math.floor(Date.now() / (1000 * 60 * 60));
  return generateNPCSpawnsInternal(s, new Set());
}

/**
 * Generate user-aware NPC spawns with progress biasing.
 * NPCs prefer territories the user hasn't explored yet.
 */
export function generateUserNPCSpawns(
  userId: string,
  exploredTerritories: Set<string>
): NPCSpawn[] {
  const seed = hashCode(userId + new Date().toDateString());
  return generateNPCSpawnsInternal(seed, exploredTerritories);
}

function generateNPCSpawnsInternal(s: number, exploredTerritories: Set<string>): NPCSpawn[] {
  const seededRand = (i: number) => {
    const x = Math.sin(s * 9301 + i * 7919) * 10000;
    return x - Math.floor(x);
  };

  // Spawn 3–4 NPCs per session
  const count = 3 + (seededRand(0) > 0.5 ? 1 : 0);

  // Weighted selection
  const pool = WANDERING_NPCS.flatMap(npc =>
    Array.from({ length: npc.spawnWeight }, () => npc)
  );

  const spawns: NPCSpawn[] = [];
  const usedIds = new Set<string>();
  const usedTerritories = new Set<string>();

  for (let i = 0; i < count * 3 && spawns.length < count; i++) {
    const npcIdx = Math.floor(seededRand(i * 13 + 1) * pool.length);
    const npc = pool[npcIdx];
    if (usedIds.has(npc.id)) continue;

    // Pick territory — bias toward unexplored if user has progress
    let territory: FutureSkillCategory;
    const candidateIdx = Math.floor(seededRand(i * 17 + 3) * ALL_TERRITORIES.length);
    const candidate = ALL_TERRITORIES[candidateIdx];

    if (exploredTerritories.size > 0 && exploredTerritories.has(candidate)) {
      territory = pickUnexplored(exploredTerritories, s, i);
    } else {
      territory = candidate;
    }

    if (usedTerritories.has(territory)) continue;

    usedIds.add(npc.id);
    usedTerritories.add(territory);

    spawns.push({
      npc,
      territory,
      offsetX: (seededRand(i * 23 + 5) - 0.5) * 80,
      offsetY: (seededRand(i * 29 + 7) - 0.5) * 60,
      activationRule: NPC_BEHAVIORS[npc.id].rule,
    });
  }

  return spawns;
}

/** Get NPC by archetype ID */
export function getNPCById(id: NPCArchetype): WanderingNPC | undefined {
  return WANDERING_NPCS.find(n => n.id === id);
}
