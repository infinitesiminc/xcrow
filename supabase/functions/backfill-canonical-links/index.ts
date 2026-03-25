import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth guard — superadmin only
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await sb.auth.getUser(token);
    if (!userData?.user) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await sb.rpc("is_superadmin", { _user_id: userData.user.id });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    console.log("Starting canonical links backfill...");

    // Step 1: Build canonical lookup from DB
    const { data: canonSkills, error: csErr } = await sb
      .from("canonical_future_skills")
      .select("id, name, aliases");
    if (csErr) throw csErr;

    console.log(`Loaded ${canonSkills.length} canonical skills`);

    // Build a name→id map (lowercase) for exact + alias matching
    const nameToId = new Map<string, string>();
    for (const cs of canonSkills) {
      nameToId.set(cs.name.toLowerCase().trim(), cs.id);
      if (cs.aliases && Array.isArray(cs.aliases)) {
        for (const alias of cs.aliases) {
          if (alias) nameToId.set(alias.toLowerCase().trim(), cs.id);
        }
      }
    }

    // Step 2: Link unlinked job_future_skills using exact name match
    let exactLinked = 0;
    const { data: unlinked, error: ulErr } = await sb
      .from("job_future_skills")
      .select("id, skill_name")
      .is("canonical_skill_id", null)
      .limit(10000);
    if (ulErr) throw ulErr;

    const batchUpdates: { id: string; canonical_skill_id: string }[] = [];
    for (const row of unlinked) {
      const norm = row.skill_name.toLowerCase().trim();
      const cid = nameToId.get(norm);
      if (cid) {
        batchUpdates.push({ id: row.id, canonical_skill_id: cid });
      }
    }

    // Execute updates in batches
    const BATCH = 200;
    for (let i = 0; i < batchUpdates.length; i += BATCH) {
      const batch = batchUpdates.slice(i, i + BATCH);
      for (const item of batch) {
        await sb
          .from("job_future_skills")
          .update({ canonical_skill_id: item.canonical_skill_id })
          .eq("id", item.id);
        exactLinked++;
      }
    }
    console.log(`Step 2: Exact-matched ${exactLinked} job_future_skills`);

    // Step 3: Expand coverage via job_task_clusters.skill_names → canonical fuzzy match
    // Get distinct skill_names from job_task_clusters
    const { data: clusters, error: clErr } = await sb
      .from("job_task_clusters")
      .select("job_id, skill_names")
      .not("skill_names", "is", null)
      .limit(10000);
    if (clErr) throw clErr;

    // For each cluster skill_name, try to match to a canonical skill
    // Use exact match first, then substring containment
    const canonNames = canonSkills.map(cs => ({ id: cs.id, name: cs.name, nameLower: cs.name.toLowerCase().trim() }));
    
    let fuzzyLinked = 0;
    const jobCanonicalMap = new Map<string, Set<string>>(); // job_id → Set<canonical_skill_id>

    for (const cluster of clusters) {
      if (!cluster.skill_names || !Array.isArray(cluster.skill_names)) continue;
      
      for (const sn of cluster.skill_names) {
        if (!sn) continue;
        const snLower = sn.toLowerCase().trim();
        
        // Try exact match first
        let matchedId = nameToId.get(snLower);
        
        // Try containment match (canonical name is contained in skill_name or vice versa)
        if (!matchedId) {
          for (const cn of canonNames) {
            if (snLower.includes(cn.nameLower) || cn.nameLower.includes(snLower)) {
              // Only match if the shorter string is at least 60% of the longer
              const ratio = Math.min(snLower.length, cn.nameLower.length) / Math.max(snLower.length, cn.nameLower.length);
              if (ratio >= 0.5) {
                matchedId = cn.id;
                break;
              }
            }
          }
        }
        
        if (matchedId) {
          const key = `${cluster.job_id}:${matchedId}`;
          if (!jobCanonicalMap.has(key)) {
            jobCanonicalMap.set(key, new Set());
            // Track for counting
            if (!jobCanonicalMap.has(matchedId)) {
              jobCanonicalMap.set(matchedId, new Set());
            }
            (jobCanonicalMap.get(matchedId) as Set<string>).add(cluster.job_id);
          }
        }
      }
    }

    // Now insert missing job_future_skills links for cluster-matched skills
    // First check what links already exist
    const existingLinks = new Set<string>();
    const { data: existing } = await sb
      .from("job_future_skills")
      .select("job_id, canonical_skill_id")
      .not("canonical_skill_id", "is", null)
      .limit(50000);
    
    if (existing) {
      for (const e of existing) {
        existingLinks.add(`${e.job_id}:${e.canonical_skill_id}`);
      }
    }

    // Insert new links
    const newLinks: any[] = [];
    for (const cluster of clusters) {
      if (!cluster.skill_names || !Array.isArray(cluster.skill_names)) continue;
      
      for (const sn of cluster.skill_names) {
        if (!sn) continue;
        const snLower = sn.toLowerCase().trim();
        
        let matchedId = nameToId.get(snLower);
        if (!matchedId) {
          for (const cn of canonNames) {
            if (snLower.includes(cn.nameLower) || cn.nameLower.includes(snLower)) {
              const ratio = Math.min(snLower.length, cn.nameLower.length) / Math.max(snLower.length, cn.nameLower.length);
              if (ratio >= 0.5) {
                matchedId = cn.id;
                break;
              }
            }
          }
        }
        
        if (matchedId && !existingLinks.has(`${cluster.job_id}:${matchedId}`)) {
          existingLinks.add(`${cluster.job_id}:${matchedId}`);
          const matchedSkill = canonSkills.find(cs => cs.id === matchedId);
          newLinks.push({
            job_id: cluster.job_id,
            canonical_skill_id: matchedId,
            skill_id: matchedId,
            skill_name: matchedSkill?.name || sn,
            category: "Technical",
            cluster_name: sn,
          });
        }
      }
    }

    // Insert in batches
    for (let i = 0; i < newLinks.length; i += BATCH) {
      const batch = newLinks.slice(i, i + BATCH);
      const { error: insertErr } = await sb.from("job_future_skills").insert(batch);
      if (insertErr) {
        console.error(`Insert batch ${i} error:`, insertErr.message);
        // Try individually
        for (const item of batch) {
          const { error: sErr } = await sb.from("job_future_skills").insert(item);
          if (!sErr) fuzzyLinked++;
        }
      } else {
        fuzzyLinked += batch.length;
      }
    }
    console.log(`Step 3: Fuzzy-inserted ${fuzzyLinked} new job_future_skills links`);

    // Step 4: Recalculate job_count and demand_count for all canonical skills
    const { data: counts, error: cntErr } = await sb
      .from("job_future_skills")
      .select("canonical_skill_id, job_id")
      .not("canonical_skill_id", "is", null);
    
    if (cntErr) throw cntErr;

    const skillStats = new Map<string, { demand: number; jobs: Set<string> }>();
    for (const row of counts) {
      if (!skillStats.has(row.canonical_skill_id)) {
        skillStats.set(row.canonical_skill_id, { demand: 0, jobs: new Set() });
      }
      const s = skillStats.get(row.canonical_skill_id)!;
      s.demand++;
      if (row.job_id) s.jobs.add(row.job_id);
    }

    let countersUpdated = 0;
    for (const [skillId, stats] of skillStats) {
      const { error: upErr } = await sb
        .from("canonical_future_skills")
        .update({ demand_count: stats.demand, job_count: stats.jobs.size })
        .eq("id", skillId);
      if (!upErr) countersUpdated++;
    }
    console.log(`Step 4: Updated counters for ${countersUpdated} canonical skills`);

    return json({
      exact_linked: exactLinked,
      fuzzy_new_links: fuzzyLinked,
      counters_updated: countersUpdated,
      total_canonical: canonSkills.length,
    });
  } catch (e) {
    console.error("Error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
