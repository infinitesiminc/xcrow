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

    const { phase } = await req.json().catch(() => ({ phase: "all" }));
    console.log(`Running phase: ${phase}`);

    // Load canonical skills
    const { data: canonSkills } = await sb
      .from("canonical_future_skills")
      .select("id, name, aliases, category");
    if (!canonSkills) throw new Error("No canonical skills");

    const nameToSkill = new Map<string, { id: string; name: string; category: string }>();
    for (const cs of canonSkills) {
      nameToSkill.set(cs.name.toLowerCase().trim(), cs);
      if (cs.aliases) {
        for (const a of cs.aliases) {
          if (a) nameToSkill.set(a.toLowerCase().trim(), cs);
        }
      }
    }

    const results: Record<string, number> = {};

    // Phase 1: Exact-match unlinked job_future_skills
    if (phase === "all" || phase === "exact") {
      let linked = 0;
      let offset = 0;
      const PAGE = 2000;
      
      while (true) {
        const { data: unlinked } = await sb
          .from("job_future_skills")
          .select("id, skill_name")
          .is("canonical_skill_id", null)
          .range(offset, offset + PAGE - 1);
        
        if (!unlinked || unlinked.length === 0) break;
        
        for (const row of unlinked) {
          const match = nameToSkill.get(row.skill_name.toLowerCase().trim());
          if (match) {
            await sb.from("job_future_skills")
              .update({ canonical_skill_id: match.id })
              .eq("id", row.id);
            linked++;
          }
        }
        
        if (unlinked.length < PAGE) break;
        offset += PAGE;
      }
      
      results.exact_linked = linked;
      console.log(`Exact-matched: ${linked}`);
    }

    // Phase 2: Expand from job_task_clusters
    if (phase === "all" || phase === "expand") {
      let inserted = 0;
      let offset = 0;
      const PAGE = 1000;
      
      // Get existing links to avoid duplicates
      const existingLinks = new Set<string>();
      let eo = 0;
      while (true) {
        const { data: ex } = await sb
          .from("job_future_skills")
          .select("job_id, canonical_skill_id")
          .not("canonical_skill_id", "is", null)
          .range(eo, eo + 5000 - 1);
        if (!ex || ex.length === 0) break;
        for (const e of ex) existingLinks.add(`${e.job_id}:${e.canonical_skill_id}`);
        if (ex.length < 5000) break;
        eo += 5000;
      }
      console.log(`Existing links: ${existingLinks.size}`);

      while (true) {
        const { data: clusters } = await sb
          .from("job_task_clusters")
          .select("job_id, skill_names")
          .not("skill_names", "is", null)
          .range(offset, offset + PAGE - 1);
        
        if (!clusters || clusters.length === 0) break;
        
        const batch: any[] = [];
        
        for (const c of clusters) {
          if (!c.skill_names) continue;
          for (const sn of c.skill_names) {
            if (!sn) continue;
            const snLow = sn.toLowerCase().trim();
            const match = nameToSkill.get(snLow);
            if (!match) continue;
            
            const key = `${c.job_id}:${match.id}`;
            if (existingLinks.has(key)) continue;
            existingLinks.add(key);
            
            batch.push({
              job_id: c.job_id,
              canonical_skill_id: match.id,
              skill_id: match.id,
              skill_name: match.name,
              category: match.category,
              cluster_name: sn,
            });
          }
        }
        
        // Insert batch
        if (batch.length > 0) {
          for (let i = 0; i < batch.length; i += 200) {
            const sub = batch.slice(i, i + 200);
            const { error } = await sb.from("job_future_skills").insert(sub);
            if (error) {
              console.error(`Batch error: ${error.message}`);
              // Try individually for this sub-batch
              for (const item of sub) {
                const { error: se } = await sb.from("job_future_skills").insert(item);
                if (!se) inserted++;
              }
            } else {
              inserted += sub.length;
            }
          }
        }
        
        if (clusters.length < PAGE) break;
        offset += PAGE;
      }
      
      results.expanded_links = inserted;
      console.log(`Expanded: ${inserted}`);
    }

    // Phase 3: Recalculate counters
    if (phase === "all" || phase === "counters") {
      const skillStats = new Map<string, { demand: number; jobs: Set<string> }>();
      let offset = 0;
      const PAGE = 5000;
      
      while (true) {
        const { data: rows } = await sb
          .from("job_future_skills")
          .select("canonical_skill_id, job_id")
          .not("canonical_skill_id", "is", null)
          .range(offset, offset + PAGE - 1);
        
        if (!rows || rows.length === 0) break;
        
        for (const r of rows) {
          if (!skillStats.has(r.canonical_skill_id)) {
            skillStats.set(r.canonical_skill_id, { demand: 0, jobs: new Set() });
          }
          const s = skillStats.get(r.canonical_skill_id)!;
          s.demand++;
          if (r.job_id) s.jobs.add(r.job_id);
        }
        
        if (rows.length < PAGE) break;
        offset += PAGE;
      }
      
      let updated = 0;
      for (const [sid, stats] of skillStats) {
        await sb.from("canonical_future_skills")
          .update({ demand_count: stats.demand, job_count: stats.jobs.size })
          .eq("id", sid);
        updated++;
      }
      
      results.counters_updated = updated;
      console.log(`Counters updated: ${updated}`);
    }

    return json(results);
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
