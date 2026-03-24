import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * backfill-skill-coverage
 * 
 * Finds canonical_future_skills with < 3 analyzed jobs via a single
 * RPC call, generates synthetic job titles via AI, and calls analyze-job.
 * Processes BATCH_SIZE skills per invocation. Cron auto-retries every 5min.
 */

const BATCH_SIZE = 3; // skills per invocation (conservative — each triggers up to 3 analyses)
const MAX_RETRIES = 2;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  const sb = createClient(supabaseUrl, serviceKey);

  if (!apiKey) {
    return json({ error: "Missing LOVABLE_API_KEY" }, 500);
  }

  try {
    // Single query: get all under-covered skills sorted by priority
    const { data: underCovered, error } = await sb.rpc("get_undercovered_skills", { min_analyzed: 3 });

    if (error) {
      console.error("RPC error:", error);
      return json({ error: error.message }, 500);
    }

    if (!underCovered || underCovered.length === 0) {
      // All done! Unschedule the cron
      console.log("🎉 All skills covered! Unscheduling cron.");
      try {
        await sb.rpc("unschedule_backfill");
      } catch (_) { /* cron function may not exist */ }
      return json({ status: "complete", message: "All skills have 3+ analyzed jobs! 🎉" });
    }

    console.log(`Found ${underCovered.length} under-covered skills. Processing batch of ${BATCH_SIZE}.`);

    const batch = underCovered.slice(0, BATCH_SIZE);
    const results: any[] = [];

    for (const skill of batch) {
      console.log(`\n📌 Skill: "${skill.skill_name}" (${skill.category}) — need ${skill.gap} more`);

      // Generate synthetic job titles
      const jobTitles = await generateJobTitles(apiKey, skill);

      for (const jt of jobTitles) {
        let success = false;
        for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
          try {
            console.log(`  → Analyzing: "${jt.title}" at ${jt.company} (attempt ${attempt})`);
            const res = await fetch(`${supabaseUrl}/functions/v1/analyze-job`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${serviceKey}`,
              },
              body: JSON.stringify({ jobTitle: jt.title, company: jt.company }),
            });

            if (res.ok) {
              success = true;
              console.log(`  ✅ Done: "${jt.title}"`);

              // Link the new job to the target canonical skill
              const { data: jobs } = await sb
                .from("jobs")
                .select("id")
                .eq("title", jt.title)
                .order("imported_at", { ascending: false })
                .limit(1);

              if (jobs && jobs.length > 0) {
                const jobId = jobs[0].id;
                // Insert a direct link to the canonical skill
                const { error: linkErr } = await sb
                  .from("job_future_skills")
                  .upsert({
                    job_id: jobId,
                    canonical_skill_id: skill.skill_id,
                    skill_id: skill.skill_id,
                    skill_name: skill.skill_name,
                    category: skill.category,
                    cluster_name: skill.skill_name,
                  }, { onConflict: "id" });

                if (linkErr) {
                  console.error(`  ⚠️ Link error: ${linkErr.message}`);
                } else {
                  console.log(`  🔗 Linked job to canonical skill: ${skill.skill_name}`);
                }
              }

              break;
            } else {
              console.error(`  ❌ ${res.status}: ${(await res.text()).slice(0, 150)}`);
              if (attempt <= MAX_RETRIES) await sleep(2000 * attempt);
            }
          } catch (e) {
            console.error(`  ❌ Error: ${e.message}`);
            if (attempt <= MAX_RETRIES) await sleep(2000 * attempt);
          }
        }
        results.push({ skill: skill.skill_name, job: jt.title, company: jt.company, success });

        // Throttle between analyses
        await sleep(1000);
      }
    }

    const ok = results.filter(r => r.success).length;
    const fail = results.filter(r => !r.success).length;

    return json({
      status: "batch_done",
      skillsProcessed: batch.length,
      remaining: underCovered.length - batch.length,
      analyses: { success: ok, failed: fail },
      details: results,
    });
  } catch (err) {
    console.error("Fatal:", err);
    return json({ error: err.message }, 500);
  }
});

async function generateJobTitles(
  apiKey: string,
  skill: { skill_name: string; category: string; description: string | null; gap: number }
): Promise<{ title: string; company: string }[]> {
  const count = Math.min(skill.gap, 3);
  const prompt = `Generate exactly ${count} realistic job titles that REQUIRE the skill "${skill.skill_name}" (${skill.category}).
${skill.description ? `Skill: ${skill.description}` : ""}

Rules:
- Real job titles from job boards — not invented
- Pair with well-known US companies where this role exists
- Vary seniority and industry
- Keep titles concise (e.g. "Data Analyst", "Product Marketing Manager")

Respond ONLY with JSON array: [{"title":"...","company":"..."}]`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
      }),
    });

    if (!res.ok) throw new Error(`AI ${res.status}`);
    const data = await res.json();
    const content = data.choices[0].message.content;
    const match = content.match(/\[[\s\S]*\]/);
    return JSON.parse(match ? match[0] : content).slice(0, count);
  } catch (e) {
    console.error("Fallback job titles for:", skill.skill_name, e.message);
    const companies = ["Google", "Microsoft", "Amazon", "Meta", "Apple"];
    return Array.from({ length: count }, (_, i) => ({
      title: `${skill.skill_name} Specialist`,
      company: companies[i % companies.length],
    }));
  }
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
