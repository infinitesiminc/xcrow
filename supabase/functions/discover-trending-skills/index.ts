import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Step 1: Get recent job_future_skills not yet in canonical catalogue
    const { data: canonical } = await sb
      .from("canonical_future_skills")
      .select("id, name, category, demand_count, aliases");

    const canonicalNames = new Set(
      (canonical || []).flatMap((c: any) => [
        c.name.toLowerCase().trim(),
        ...(c.aliases || []).map((a: string) => a.toLowerCase().trim()),
      ])
    );
    const canonicalList = (canonical || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      demand: c.demand_count,
    }));

    // Step 2: Aggregate uncatalogued skills from job_future_skills
    const { data: rawSkills } = await sb
      .from("job_future_skills")
      .select("skill_name, category, job_id")
      .is("canonical_skill_id", null)
      .limit(5000);

    if (!rawSkills || rawSkills.length === 0) {
      return new Response(
        JSON.stringify({ message: "No uncatalogued skills found", suggestions: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group by normalized name
    const groups = new Map<string, { names: Map<string, number>; categories: Map<string, number>; jobIds: Set<string> }>();
    for (const row of rawSkills) {
      const norm = row.skill_name.toLowerCase().trim();
      if (canonicalNames.has(norm)) continue; // already catalogued
      if (!groups.has(norm)) {
        groups.set(norm, { names: new Map(), categories: new Map(), jobIds: new Set() });
      }
      const g = groups.get(norm)!;
      g.names.set(row.skill_name, (g.names.get(row.skill_name) || 0) + 1);
      if (row.category) g.categories.set(row.category, (g.categories.get(row.category) || 0) + 1);
      if (row.job_id) g.jobIds.add(row.job_id);
    }

    // Filter to skills appearing in 2+ jobs (signal vs noise)
    const candidates: { name: string; category: string; demand: number; jobs: number }[] = [];
    for (const [, g] of groups) {
      if (g.jobIds.size < 2) continue;
      let bestName = ""; let bestCount = 0;
      for (const [name, count] of g.names) {
        if (count > bestCount) { bestName = name; bestCount = count; }
      }
      let bestCat = "Technical"; let bestCatCount = 0;
      for (const [cat, count] of g.categories) {
        if (count > bestCatCount) { bestCat = cat; bestCatCount = count; }
      }
      candidates.push({ name: bestName, category: bestCat, demand: bestCount, jobs: g.jobIds.size });
    }

    candidates.sort((a, b) => b.jobs - a.jobs);
    const topCandidates = candidates.slice(0, 20);

    if (topCandidates.length === 0) {
      return new Response(
        JSON.stringify({ message: "No new trending skills detected", suggestions: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: AI analysis - how each candidate relates to existing catalogue
    const topCanonical = canonicalList
      .sort((a: any, b: any) => b.demand - a.demand)
      .slice(0, 50)
      .map((c: any) => `${c.name} (${c.category}, demand: ${c.demand})`);

    const prompt = `You are a workforce skills analyst. Analyze these newly discovered skills from job market data and determine how each should be integrated into an existing skills catalogue.

EXISTING CATALOGUE (top 50 by demand):
${topCanonical.join("\n")}

NEW CANDIDATE SKILLS TO ANALYZE:
${topCandidates.map((c, i) => `${i + 1}. "${c.name}" — Category: ${c.category}, Found in ${c.jobs} job roles, ${c.demand} mentions`).join("\n")}

For each candidate, determine:
1. action: "new" (genuinely novel skill), "merge" (duplicate/variant of existing skill), "alias" (should be added as alias to existing), or "ignore" (too generic/noisy)
2. If merge/alias: which existing catalogue skill it maps to (by name)
3. reasoning: 1-sentence explanation
4. recommended_category: best fit from [Technical, Analytical, Strategic, Communication, Leadership, Creative, Ethics & Compliance, Human Edge]
5. trend_signal: "rising" | "stable" | "emerging" — how the skill is trending
6. priority: "high" | "medium" | "low" — how urgently it should be added`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Return ONLY valid JSON. No markdown." },
          { role: "user", content: prompt },
        ],
        max_tokens: 4096,
        tools: [{
          type: "function",
          function: {
            name: "analyze_skills",
            description: "Analyze candidate skills for catalogue integration",
            parameters: {
              type: "object",
              properties: {
                analyses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      skill_name: { type: "string" },
                      action: { type: "string", enum: ["new", "merge", "alias", "ignore"] },
                      merge_target: { type: "string", description: "Name of existing skill to merge into, or null" },
                      reasoning: { type: "string" },
                      recommended_category: { type: "string" },
                      trend_signal: { type: "string", enum: ["rising", "stable", "emerging"] },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                    },
                    required: ["skill_name", "action", "reasoning", "recommended_category", "trend_signal", "priority"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["analyses"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_skills" } },
      }),
    });

    if (!aiResp.ok) {
      throw new Error(`AI gateway error: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No AI tool call response");

    const { analyses } = JSON.parse(toolCall.function.arguments);

    // Step 4: Find merge target IDs
    const canonicalByName = new Map(
      (canonical || []).map((c: any) => [c.name.toLowerCase().trim(), c.id])
    );

    // Step 5: Upsert suggestions
    let inserted = 0;
    for (const analysis of analyses) {
      const candidate = topCandidates.find(
        (c) => c.name.toLowerCase() === analysis.skill_name.toLowerCase()
      );
      if (!candidate) continue;

      const mergeTargetId = analysis.merge_target
        ? canonicalByName.get(analysis.merge_target.toLowerCase().trim()) || null
        : null;

      // Get avg exposure/impact from job_task_clusters for this skill
      const { data: clusterStats } = await sb
        .from("job_task_clusters")
        .select("ai_exposure_score, job_impact_score")
        .contains("skill_names", [candidate.name])
        .limit(100);

      const avgExposure = clusterStats?.length
        ? Math.round(clusterStats.reduce((s: number, c: any) => s + (c.ai_exposure_score || 50), 0) / clusterStats.length)
        : 50;
      const avgImpact = clusterStats?.length
        ? Math.round(clusterStats.reduce((s: number, c: any) => s + (c.job_impact_score || 50), 0) / clusterStats.length)
        : 50;

      // Use insert with manual dedup instead of upsert (partial unique index not supported)
      // First check if pending suggestion already exists
      const { data: existing } = await sb
        .from("skill_discovery_suggestions")
        .select("id")
        .eq("status", "pending")
        .ilike("skill_name", candidate.name)
        .limit(1);

      if (existing && existing.length > 0) {
        // Update existing
        const { error } = await sb.from("skill_discovery_suggestions")
          .update({
            category: analysis.recommended_category || candidate.category,
            demand_count: candidate.demand,
            job_count: candidate.jobs,
            avg_exposure: avgExposure,
            avg_impact: avgImpact,
            ai_analysis: {
              action: analysis.action,
              reasoning: analysis.reasoning,
              merge_target: analysis.merge_target || null,
              trend_signal: analysis.trend_signal,
              priority: analysis.priority,
            },
            action: analysis.action,
            merge_target_id: mergeTargetId,
            discovered_at: new Date().toISOString(),
          })
          .eq("id", existing[0].id);
        if (!error) inserted++;
        else console.error(`Update ${candidate.name}: ${error.message}`);
      } else {
        const { error } = await sb.from("skill_discovery_suggestions").insert({
          skill_name: candidate.name,
          category: analysis.recommended_category || candidate.category,
          demand_count: candidate.demand,
          job_count: candidate.jobs,
          avg_exposure: avgExposure,
          avg_impact: avgImpact,
          ai_analysis: {
            action: analysis.action,
            reasoning: analysis.reasoning,
            merge_target: analysis.merge_target || null,
            trend_signal: analysis.trend_signal,
            priority: analysis.priority,
          },
          action: analysis.action,
          merge_target_id: mergeTargetId,
          status: "pending",
          discovered_at: new Date().toISOString(),
        });
        if (!error) inserted++;
        else console.error(`Skip ${candidate.name}: ${error.message}`);
      }

      if (!error) inserted++;
      else console.error(`Skip ${candidate.name}: ${error.message}`);
    }

    console.log(`Discovered ${inserted} skill suggestions from ${rawSkills.length} raw skills`);

    return new Response(
      JSON.stringify({
        suggestions: inserted,
        candidates_analyzed: topCandidates.length,
        raw_uncatalogued: rawSkills.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("discover-trending-skills error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
