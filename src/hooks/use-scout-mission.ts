/**
 * useScoutMission — Central mission state for "Scout the AI Frontier".
 *
 * 4-phase student-focused progression:
 *   Discover → Experiment → Challenge → Master
 *
 * Per-skill tiers map to castle levels:
 *   Ruins=undiscovered, Outpost=First Contact, Fortress=Apprentice,
 *   Citadel=Challenger, Grandmaster=Commander
 *
 * Global phases are milestone celebrations, not gates:
 *   - Discover: Scout territories, talk to NPCs
 *   - Experiment: Try your first sims (Bronze/Silver)
 *   - Challenge: Reach Gold on 5+ skills
 *   - Master: Reach Platinum on 3+ skills, conquer territories
 *
 * Persists to localStorage so progress survives page refreshes.
 */
import { useState, useCallback, useMemo, useEffect } from "react";

export type MissionPhase = "discover" | "experiment" | "challenge" | "master";

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
  /** Total skills with XP > 0 (have been practiced) */
  skillsConquered: number;
}

const STORAGE_KEY = "xcrow_scout_mission";

/** Migrate old 3-phase values to new 4-phase */
function migratePhase(raw: string): MissionPhase {
  if (raw === "scout") return "discover";
  if (raw === "battle") return "experiment";
  if (raw === "conquer") return "master";
  if (["discover", "experiment", "challenge", "master"].includes(raw)) return raw as MissionPhase;
  return "discover";
}

function loadState(): MissionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      scoutedSkills: parsed.scoutedSkills || [],
      territoriesScouted: new Set(parsed.territoriesScouted || []),
      rolesSpokenTo: new Set(parsed.rolesSpokenTo || []),
      phase: migratePhase(parsed.phase || "discover"),
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
    phase: "discover",
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

      // Auto-advance: discover → experiment after scouting 3+ skills
      let phase = prev.phase;
      if (phase === "discover" && newScouted.length >= 3) phase = "experiment";

      return { ...prev, scoutedSkills: newScouted, territoriesScouted: newTerritories, rolesSpokenTo: newRoles, phase };
    });
  }, []);

  /** Record a skill conquered via simulation */
  const conquerSkill = useCallback(() => {
    setState(prev => {
      const conquered = prev.skillsConquered + 1;
      let phase = prev.phase;
      // experiment → challenge after 5+ skills practiced
      if (phase === "experiment" && conquered >= 5) phase = "challenge";
      // challenge → master after 10+ skills conquered
      if (phase === "challenge" && conquered >= 10) phase = "master";
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
    const discoverWeight = 0.25;
    const experimentWeight = 0.25;
    const challengeWeight = 0.25;
    const masterWeight = 0.25;

    const discoverPct = Math.min(1, state.territoriesScouted.size / TOTAL_TERRITORIES);
    const experimentPct = Math.min(1, state.scoutedSkills.length / 20);
    const challengePct = Math.min(1, state.skillsConquered / 15);
    const masterPct = Math.min(1, state.skillsConquered / 30);

    return Math.round(
      (discoverPct * discoverWeight +
       experimentPct * experimentWeight +
       challengePct * challengeWeight +
       masterPct * masterWeight) * 100
    );
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
