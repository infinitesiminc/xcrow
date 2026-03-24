import { supabase } from "@/integrations/supabase/client";

export interface CanonicalFutureSkillRow {
  id: string;
  name: string;
  category: string;
  description: string | null;
  icon_emoji: string | null;
  skill_number: number | null;
  demand_count: number | null;
  job_count: number | null;
  avg_relevance: number | null;
}

const CACHE_KEY = "canonical_future_skills_cache_v1";
const REQUEST_TIMEOUT_MS = 30000;
const MAX_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function loadCachedRows(): CanonicalFutureSkillRow[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CanonicalFutureSkillRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCachedRows(rows: CanonicalFutureSkillRow[]) {
  if (typeof window === "undefined" || rows.length === 0) return;

  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
  } catch {
    // Ignore storage errors
  }
}

async function queryCanonicalRowsOnce(): Promise<CanonicalFutureSkillRow[]> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { data, error } = await supabase
      .from("canonical_future_skills")
      .select("id, name, category, description, icon_emoji, job_count, demand_count, avg_relevance")
      .order("demand_count", { ascending: false })
      .abortSignal(controller.signal);

    if (error) throw error;
    if (!data || data.length === 0) throw new Error("canonical_future_skills_empty");

    return data as CanonicalFutureSkillRow[];
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchCanonicalFutureSkillsRows(): Promise<CanonicalFutureSkillRow[]> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const rows = await queryCanonicalRowsOnce();
      saveCachedRows(rows);
      return rows;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) {
        await sleep(350 * attempt);
      }
    }
  }

  const cached = loadCachedRows();
  if (cached.length > 0) {
    console.warn("Using cached canonical skills after repeated fetch failure", lastError);
    return cached;
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to fetch canonical skills");
}
