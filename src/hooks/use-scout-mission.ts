/**
 * useScoutMission — Central mission state for "Scout the AI Frontier".
 *
 * Tracks:
 *  - Which skills have been scouted (via NPC conversations)
 *  - Which territories have been visited
 *  - Which roles the player has spoken to
 *  - Mission phase: scout → battle → conquer
 *
 * Persists to localStorage so progress survives page refreshes.
 */
import { useState, useCallback, useMemo, useEffect } from "react";

export type MissionPhase = "scout" | "battle" | "conquer";

export interface ScoutedSkill {
  id: string;
  name: string;
  category: string;
  scoutedAt: number;
  scoutedFrom: string; // role NPC jobId
}

export interface MissionState {
  /** Skills discovered through NPC conversations */
  scoutedSkills: ScoutedSkill[];
  /** Territory categories visited */
  territoriesScouted: Set<string>;
  /** Role NPC jobIds spoken to */
  rolesSpokenTo: Set<string>;
  /** Current mission phase */
  phase: MissionPhase;
  /** Total skills collected (post-battle, confirmed via sims) */
  skillsConquered: number;
}

const STORAGE_KEY = "xcrow_scout_mission";

function loadState(): MissionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      scoutedSkills: parsed.scoutedSkills || [],
      territoriesScouted: new Set(parsed.territoriesScouted || []),
      rolesSpokenTo: new Set(parsed.rolesSpokenTo || []),
      phase: parsed.phase || "scout",
      skillsConquered: parsed.skillsConquered || 0,
    };
  } catch {
    return defaultState();
  }
}

function defaultState(): MissionState {
  return {
    scoutedSkills: [],
    territoriesScouted: new Set(),
    rolesSpokenTo: new Set(),
    phase: "scout",
    skillsConquered: 0,
  };
}

function saveState(state: MissionState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    scoutedSkills: state.scoutedSkills,
    territoriesScouted: Array.from(state.territoriesScouted),
    rolesSpokenTo: Array.from(state.rolesSpokenTo),
    phase: state.phase,
    skillsConquered: state.skillsConquered,
  }));
}

export function useScoutMission() {
  const [state, setState] = useState<MissionState>(loadState);

  // Persist on change
  useEffect(() => { saveState(state); }, [state]);

  /** Record an NPC conversation and the skills discovered */
  const scoutRole = useCallback((roleJobId: string, territory: string, skills: { id: string; name: string; category: string }[]) => {
    setState(prev => {
      const newScouted = [...prev.scoutedSkills];
      const existingIds = new Set(newScouted.map(s => s.id));
      for (const s of skills) {
        if (!existingIds.has(s.id)) {
          newScouted.push({ ...s, scoutedAt: Date.now(), scoutedFrom: roleJobId });
        }
      }
      const newTerritories = new Set(prev.territoriesScouted);
      newTerritories.add(territory);
      const newRoles = new Set(prev.rolesSpokenTo);
      newRoles.add(roleJobId);

      // Auto-advance phase
      let phase = prev.phase;
      if (phase === "scout" && newScouted.length >= 3) phase = "battle";

      return { ...prev, scoutedSkills: newScouted, territoriesScouted: newTerritories, rolesSpokenTo: newRoles, phase };
    });
  }, []);

  /** Record a skill conquered via simulation */
  const conquerSkill = useCallback(() => {
    setState(prev => {
      const conquered = prev.skillsConquered + 1;
      let phase = prev.phase;
      if (phase === "battle" && conquered >= 5) phase = "conquer";
      return { ...prev, skillsConquered: conquered, phase };
    });
  }, []);

  /** Check if a skill has been scouted (unlocked for battle) */
  const isSkillScouted = useCallback((skillId: string) => {
    return state.scoutedSkills.some(s => s.id === skillId);
  }, [state.scoutedSkills]);

  /** Set of scouted skill IDs for fast lookup */
  const scoutedSkillIds = useMemo(
    () => new Set(state.scoutedSkills.map(s => s.id)),
    [state.scoutedSkills]
  );

  /** Mission completion percentage */
  const missionProgress = useMemo(() => {
    const TOTAL_TERRITORIES = 8;
    const scoutWeight = 0.4;
    const battleWeight = 0.4;
    const conquerWeight = 0.2;

    const scoutPct = Math.min(1, state.territoriesScouted.size / TOTAL_TERRITORIES);
    const battlePct = Math.min(1, state.scoutedSkills.length / 20); // 20 skills as target
    const conquerPct = Math.min(1, state.skillsConquered / 10); // 10 conquered as target

    return Math.round((scoutPct * scoutWeight + battlePct * battleWeight + conquerPct * conquerWeight) * 100);
  }, [state]);

  return {
    ...state,
    scoutRole,
    conquerSkill,
    isSkillScouted,
    scoutedSkillIds,
    missionProgress,
  };
}
