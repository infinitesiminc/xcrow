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
    offering: "Tells stories about skill origins, industry lore, and AI history.",
    greeting: "Gather 'round! Let me tell you the tale of how this skill changed an industry forever...",
    interactionType: "story",
    spawnWeight: 2,
  },
];

export interface NPCSpawn {
  npc: WanderingNPC;
  territory: FutureSkillCategory;
  /** Offset from territory center (px in SVG coords) */
  offsetX: number;
  offsetY: number;
}

const ALL_TERRITORIES: FutureSkillCategory[] = [
  "Technical", "Analytical", "Strategic", "Communication",
  "Leadership", "Creative", "Ethics & Compliance", "Human Edge",
];

/**
 * Generate NPC spawns for the current session.
 * Uses a session seed so NPCs stay consistent during a visit but change between sessions.
 */
export function generateNPCSpawns(seed?: number): NPCSpawn[] {
  const s = seed ?? Math.floor(Date.now() / (1000 * 60 * 60)); // changes hourly
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

  for (let i = 0; i < count && spawns.length < count; i++) {
    const npcIdx = Math.floor(seededRand(i * 13 + 1) * pool.length);
    const npc = pool[npcIdx];
    if (usedIds.has(npc.id)) continue;

    const terrIdx = Math.floor(seededRand(i * 17 + 3) * ALL_TERRITORIES.length);
    const territory = ALL_TERRITORIES[terrIdx];
    if (usedTerritories.has(territory)) continue;

    usedIds.add(npc.id);
    usedTerritories.add(territory);

    spawns.push({
      npc,
      territory,
      offsetX: (seededRand(i * 23 + 5) - 0.5) * 80,
      offsetY: (seededRand(i * 29 + 7) - 0.5) * 60,
    });
  }

  return spawns;
}

/** Get NPC by archetype ID */
export function getNPCById(id: NPCArchetype): WanderingNPC | undefined {
  return WANDERING_NPCS.find(n => n.id === id);
}
