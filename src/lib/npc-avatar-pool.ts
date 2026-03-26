/**
 * NPC Avatar Pool — 3 portrait variants per wandering NPC archetype.
 * The spawn system picks a variant based on the hourly seed so users
 * see different faces each session without repetition within a session.
 */

import npcMerchant from "@/assets/npc-merchant.png";
import npcMerchantV2 from "@/assets/npc-merchant-v2.png";
import npcMerchantV3 from "@/assets/npc-merchant-v3.png";

import npcOracle from "@/assets/npc-oracle.png";
import npcOracleV2 from "@/assets/npc-oracle-v2.png";
import npcOracleV3 from "@/assets/npc-oracle-v3.png";

import npcRival from "@/assets/npc-rival.png";
import npcRivalV2 from "@/assets/npc-rival-v2.png";
import npcRivalV3 from "@/assets/npc-rival-v3.png";

import npcScout from "@/assets/npc-scout.png";
import npcScoutV2 from "@/assets/npc-scout-v2.png";
import npcScoutV3 from "@/assets/npc-scout-v3.png";

import npcBlacksmith from "@/assets/npc-blacksmith.png";
import npcBlacksmithV2 from "@/assets/npc-blacksmith-v2.png";
import npcBlacksmithV3 from "@/assets/npc-blacksmith-v3.png";

import npcBard from "@/assets/npc-bard.png";
import npcBardV2 from "@/assets/npc-bard-v2.png";
import npcBardV3 from "@/assets/npc-bard-v3.png";

export const NPC_AVATAR_POOL: Record<string, string[]> = {
  merchant:   [npcMerchant, npcMerchantV2, npcMerchantV3],
  oracle:     [npcOracle, npcOracleV2, npcOracleV3],
  rival:      [npcRival, npcRivalV2, npcRivalV3],
  scout:      [npcScout, npcScoutV2, npcScoutV3],
  blacksmith: [npcBlacksmith, npcBlacksmithV2, npcBlacksmithV3],
  bard:       [npcBard, npcBardV2, npcBardV3],
};

/**
 * Pick an avatar variant for a given NPC archetype using a seed.
 * Same seed → same variant within a session, different seed → different face.
 */
export function getNPCAvatar(archetypeId: string, seed?: number): string {
  const pool = NPC_AVATAR_POOL[archetypeId];
  if (!pool || pool.length === 0) return "";
  const s = seed ?? Math.floor(Date.now() / (1000 * 60 * 60));
  const hash = Math.abs(Math.sin(s * 9301 + archetypeId.length * 7919) * 10000);
  return pool[Math.floor(hash) % pool.length];
}
