/**
 * Role NPC avatar portraits — multiple variants per territory for visual variety.
 */
import roleNpcTechnical from "@/assets/role-npc-technical.png";
import roleNpcTechnicalV2 from "@/assets/role-npc-technical-v2.png";
import roleNpcTechnicalV3 from "@/assets/role-npc-technical-v3.png";
import roleNpcTechnicalV4 from "@/assets/role-npc-technical-v4.png";

import roleNpcAnalytical from "@/assets/role-npc-analytical.png";
import roleNpcAnalyticalV2 from "@/assets/role-npc-analytical-v2.png";
import roleNpcAnalyticalV3 from "@/assets/role-npc-analytical-v3.png";

import roleNpcCreative from "@/assets/role-npc-creative.png";
import roleNpcCreativeV2 from "@/assets/role-npc-creative-v2.png";
import roleNpcCreativeV3 from "@/assets/role-npc-creative-v3.png";

import roleNpcStrategic from "@/assets/role-npc-strategic.png";
import roleNpcStrategicV2 from "@/assets/role-npc-strategic-v2.png";
import roleNpcStrategicV3 from "@/assets/role-npc-strategic-v3.png";

import roleNpcCommunication from "@/assets/role-npc-communication.png";
import roleNpcCommunicationV2 from "@/assets/role-npc-communication-v2.png";
import roleNpcCommunicationV3 from "@/assets/role-npc-communication-v3.png";

import roleNpcLeadership from "@/assets/role-npc-leadership.png";
import roleNpcLeadershipV2 from "@/assets/role-npc-leadership-v2.png";
import roleNpcLeadershipV3 from "@/assets/role-npc-leadership-v3.png";

import roleNpcEthics from "@/assets/role-npc-ethics.png";
import roleNpcEthicsV2 from "@/assets/role-npc-ethics-v2.png";

import roleNpcHumanEdge from "@/assets/role-npc-human-edge.png";
import roleNpcHumanEdgeV2 from "@/assets/role-npc-human-edge-v2.png";

/** Legacy single-avatar map (backward compat) */
export const ROLE_NPC_AVATARS: Record<string, string> = {
  "Technical": roleNpcTechnical,
  "Analytical": roleNpcAnalytical,
  "Creative": roleNpcCreative,
  "Strategic": roleNpcStrategic,
  "Communication": roleNpcCommunication,
  "Leadership": roleNpcLeadership,
  "Ethics & Compliance": roleNpcEthics,
  "Human Edge": roleNpcHumanEdge,
};

/** Pool of variants per territory */
const ROLE_NPC_AVATAR_POOL: Record<string, string[]> = {
  "Technical": [roleNpcTechnical, roleNpcTechnicalV2, roleNpcTechnicalV3, roleNpcTechnicalV4],
  "Analytical": [roleNpcAnalytical, roleNpcAnalyticalV2, roleNpcAnalyticalV3],
  "Creative": [roleNpcCreative, roleNpcCreativeV2, roleNpcCreativeV3],
  "Strategic": [roleNpcStrategic, roleNpcStrategicV2, roleNpcStrategicV3],
  "Communication": [roleNpcCommunication, roleNpcCommunicationV2, roleNpcCommunicationV3],
  "Leadership": [roleNpcLeadership, roleNpcLeadershipV2, roleNpcLeadershipV3],
  "Ethics & Compliance": [roleNpcEthics, roleNpcEthicsV2],
  "Human Edge": [roleNpcHumanEdge, roleNpcHumanEdgeV2],
};

/**
 * Get a role NPC avatar by territory + index so nearby NPCs look different.
 */
export function getRoleNPCAvatar(territory: string, index: number): string {
  const pool = ROLE_NPC_AVATAR_POOL[territory] || ROLE_NPC_AVATAR_POOL["Strategic"];
  return pool[index % pool.length];
}
