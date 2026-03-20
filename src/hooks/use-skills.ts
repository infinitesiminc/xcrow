/**
 * Hook to fetch skills from the database with realtime updates.
 * Falls back to hardcoded SKILL_TAXONOMY if DB fetch fails.
 * Also manages user skill unlocks.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  SKILL_TAXONOMY,
  type TaxonomySkill,
  type SkillCategory,
} from "@/lib/skill-map";
import { useAuth } from "@/contexts/AuthContext";

export interface DbSkill extends TaxonomySkill {
  unlockType: string;
  unlockRequirement: any;
  isDefault: boolean;
  description: string | null;
  iconEmoji: string | null;
  rarity: string;
  dropExpiresAt: string | null;
}

export interface SkillUnlock {
  skillId: string;
  unlockedAt: string;
  unlockMethod: string;
}

function mapRow(row: any): DbSkill {
  return {
    id: row.id,
    name: row.name,
    category: row.category as SkillCategory,
    keywords: row.keywords || [],
    aiExposure: row.ai_exposure ?? 50,
    humanEdge: row.human_edge ?? undefined,
    unlockType: row.unlock_type ?? "default",
    unlockRequirement: row.unlock_requirement,
    isDefault: row.is_default ?? true,
    description: row.description,
    iconEmoji: row.icon_emoji,
    rarity: row.rarity ?? "common",
    dropExpiresAt: row.drop_expires_at,
  };
}

/** Global cache so multiple components share the same data */
let _cachedSkills: DbSkill[] | null = null;
let _fetchPromise: Promise<DbSkill[]> | null = null;

async function fetchSkillsOnce(): Promise<DbSkill[]> {
  if (_cachedSkills) return _cachedSkills;
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = (async () => {
    const { data, error } = await supabase
      .from("skills")
      .select("*")
      .order("category")
      .order("name");

    if (error || !data || data.length === 0) {
      console.warn("Failed to fetch skills from DB, using hardcoded fallback:", error?.message);
      // Map hardcoded taxonomy to DbSkill shape
      _cachedSkills = SKILL_TAXONOMY.map((s) => ({
        ...s,
        unlockType: "default",
        unlockRequirement: null,
        isDefault: true,
        description: null,
        iconEmoji: null,
        rarity: "common",
        dropExpiresAt: null,
      }));
    } else {
      _cachedSkills = data.map(mapRow);
    }
    return _cachedSkills;
  })();

  return _fetchPromise;
}

/** Invalidate cache (called when realtime fires) */
function invalidateCache() {
  _cachedSkills = null;
  _fetchPromise = null;
}

export function useSkills() {
  const [skills, setSkills] = useState<DbSkill[]>(
    _cachedSkills || SKILL_TAXONOMY.map((s) => ({
      ...s,
      unlockType: "default",
      unlockRequirement: null,
      isDefault: true,
      description: null,
      iconEmoji: null,
      rarity: "common",
      dropExpiresAt: null,
    }))
  );
  const [loading, setLoading] = useState(!_cachedSkills);

  useEffect(() => {
    fetchSkillsOnce().then((s) => {
      setSkills(s);
      setLoading(false);
    });

    // Subscribe to realtime skill drops
    const channel = supabase
      .channel("skills-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "skills" },
        () => {
          invalidateCache();
          fetchSkillsOnce().then(setSkills);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { skills, loading };
}

export function useSkillUnlocks() {
  const { user } = useAuth();
  const [unlocks, setUnlocks] = useState<SkillUnlock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUnlocks = useCallback(async () => {
    if (!user) {
      setUnlocks([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("user_skill_unlocks")
      .select("skill_id, unlocked_at, unlock_method")
      .eq("user_id", user.id);

    setUnlocks(
      (data || []).map((r: any) => ({
        skillId: r.skill_id,
        unlockedAt: r.unlocked_at,
        unlockMethod: r.unlock_method,
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchUnlocks();

    if (!user) return;

    // Realtime unlock updates
    const channel = supabase
      .channel("unlocks-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_skill_unlocks",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchUnlocks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchUnlocks]);

  const unlockSkill = useCallback(
    async (skillId: string, method: string = "task_completion") => {
      if (!user) return false;
      const { error } = await supabase
        .from("user_skill_unlocks")
        .upsert(
          { user_id: user.id, skill_id: skillId, unlock_method: method },
          { onConflict: "user_id,skill_id" }
        );
      if (!error) fetchUnlocks();
      return !error;
    },
    [user, fetchUnlocks]
  );

  const isUnlocked = useCallback(
    (skillId: string) => {
      // Default skills are always unlocked
      return unlocks.some((u) => u.skillId === skillId);
    },
    [unlocks]
  );

  return { unlocks, loading, unlockSkill, isUnlocked };
}
