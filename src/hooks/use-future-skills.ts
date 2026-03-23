/**
 * Hook to fetch canonical future skills from the database.
 * Powers the Territory Map with AI-era skill catalogue.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FutureSkillCategory =
  | "Technical"
  | "Analytical"
  | "Strategic"
  | "Communication"
  | "Leadership"
  | "Creative"
  | "Ethics & Compliance"
  | "Human Edge";

export interface FutureSkill {
  id: string;
  name: string;
  category: FutureSkillCategory;
  description: string | null;
  iconEmoji: string | null;
  demandCount: number;
  jobCount: number;
  avgRelevance: number;
}

let _cache: FutureSkill[] | null = null;
let _promise: Promise<FutureSkill[]> | null = null;

function mapRow(row: any): FutureSkill {
  return {
    id: row.id,
    name: row.name,
    category: row.category as FutureSkillCategory,
    description: row.description,
    iconEmoji: row.icon_emoji,
    demandCount: row.demand_count ?? 1,
    jobCount: row.job_count ?? 1,
    avgRelevance: row.avg_relevance ?? 50,
  };
}

async function fetchOnce(): Promise<FutureSkill[]> {
  // Return cached data if we have actual skills
  if (_cache && _cache.length > 0) return _cache;
  if (_promise) return _promise;

  _promise = (async () => {
    const { data, error } = await supabase
      .from("canonical_future_skills")
      .select("*")
      .order("demand_count", { ascending: false });

    if (error || !data || data.length === 0) {
      console.warn("Failed to fetch future skills:", error?.message);
      // Don't cache empty — allow retry on next mount
      _promise = null;
      return [];
    }

    _cache = data.map(mapRow);
    return _cache;
  })();

  return _promise;
}

export function useFutureSkills() {
  const [skills, setSkills] = useState<FutureSkill[]>(_cache || []);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    fetchOnce().then((s) => {
      setSkills(s);
      setLoading(false);
    });
  }, []);

  return { futureSkills: skills, loading };
}

/** Category metadata for territory layout */
export const FUTURE_CATEGORY_META: Record<FutureSkillCategory, { emoji: string; terrain: string; baseHue: number }> = {
  Technical:            { emoji: "🔮", terrain: "Arcane Forge",       baseHue: 262 },
  Analytical:           { emoji: "🏔️", terrain: "Data Highlands",    baseHue: 200 },
  Strategic:            { emoji: "⚔️", terrain: "Command Summit",    baseHue: 340 },
  Communication:        { emoji: "🌉", terrain: "Bridge Isles",      baseHue: 150 },
  Leadership:           { emoji: "👑", terrain: "Crown Heights",     baseHue: 45 },
  Creative:             { emoji: "🌈", terrain: "Prism Coast",       baseHue: 30 },
  "Ethics & Compliance": { emoji: "🛡️", terrain: "Sentinel Watch",   baseHue: 170 },
  "Human Edge":         { emoji: "🔥", terrain: "Soul Springs",      baseHue: 300 },
};
