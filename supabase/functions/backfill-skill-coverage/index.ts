import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * backfill-skill-coverage
 * 
 * Finds canonical_future_skills with < 3 analyzed jobs,
 * generates synthetic job titles via AI, and calls analyze-job
 * for each. Designed to be called repeatedly (idempotent) —
 * skips skills that already meet the threshold.
 * 
 * Processes BATCH_SIZE skills per invocation to stay within
 * edge function time limits. Cron retries handle continuation.
 */

const BATCH_SIZE = 5; // skills per invocation (conservative for reliability)
const JOBS_PER_SKILL = 3; // target minimum
const MAX_RETRIES_PER_ANALYSIS = 2;

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  const sb = createClient(supabaseUrl, serviceKey);

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // 1. Find skills with < 3 analyzed jobs
    const { data: allSkills } = await sb
      .from("canonical_future_skills")
      .select("id, name, category, description");

    if (!allSkills || allSkills.length === 0) {
      return respond(corsHeaders, { status: "done", message: "No skills found" });
    }

    // For each skill, count analyzed jobs
    const underCovered: { id: string; name: string; category: string; description: string | null; gap: number }[] = [];

    for (const skill of allSkills) {
      const { count } = await sb
        .from("job_future_skills")
        .select("id", { count: "exact", head: true })
        .eq("canonical_skill_id", skill.id)
        .not("job_id", "is", null);

      // Now check how many of those jobs are actually analyzed
      const { data: linkedJobs } = await sb
        .from("job_future_skills")
        .select("job_id")
        .eq("canonical_skill_id", skill.id)
        .not("job_id", "is", null)
        .limit(10);

      let analyzedCount = 0;
      if (linkedJobs && linkedJobs.length > 0) {
        const jobIds = linkedJobs.map((j: any) => j.job_id).filter(Boolean);
        if (jobIds.length > 0) {
          const { count: ac } = await sb
            .from("jobs")
            .select("id", { count: "exact", head: true })
            .in("id", jobIds)
            .not("automation_risk_percent", "is", null);
          analyzedCount = ac || 0;
        }
      }

      const gap = JOBS_PER_SKILL - analyzedCount;
      if (gap > 0) {
        underCovered.push({ ...skill, gap });
      }
    }

    if (underCovered.length === 0) {
      return respond(corsHeaders, {
        status: "complete",
        message: "All 183 skills have 3+ analyzed jobs! 🎉",
        totalSkills: allSkills.length,
      });
    }

    // Sort: prioritize skills with 0 coverage, then by gap size
    underCovered.sort((a, b) => {
      const aZero = a.gap === JOBS_PER_SKILL ? 0 : 1;
      const bZero = b.gap === JOBS_PER_SKILL ? 0 : 1;
      return aZero - bZero || b.gap - a.gap;
    });

    // Take a batch
    const batch = underCovered.slice(0, BATCH_SIZE);
    const results: any[] = [];

    for (const skill of batch) {
      console.log(`Processing skill: "${skill.name}" (gap: ${skill.gap})`);

      // Generate synthetic job titles for this skill
      const jobTitles = await generateJobTitles(apiKey, skill, skill.gap);
      console.log(`Generated ${jobTitles.length} job titles for "${skill.name}"`);

      for (const jt of jobTitles) {
        let success = false;
        for (let attempt = 0; attempt <= MAX_RETRIES_PER_ANALYSIS; attempt++) {
          try {
            console.log(`  Analyzing: "${jt.title}" at "${jt.company}" (attempt ${attempt + 1})`);
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
              console.log(`  ✅ Analyzed: "${jt.title}"`);
              break;
            } else {
              const errText = await res.text();
              console.error(`  ❌ Attempt ${attempt + 1} failed (${res.status}): ${errText.slice(0, 200)}`);
              if (attempt < MAX_RETRIES_PER_ANALYSIS) {
                await sleep(2000 * (attempt + 1)); // backoff
              }
            }
          } catch (e) {
            console.error(`  ❌ Attempt ${attempt + 1} error: ${e.message}`);
            if (attempt < MAX_RETRIES_PER_ANALYSIS) {
              await sleep(2000 * (attempt + 1));
            }
          }
        }

        results.push({
          skill: skill.name,
          jobTitle: jt.title,
          company: jt.company,
          success,
        });

        // Small delay between analyses to avoid rate limits
        await sleep(1500);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return respond(corsHeaders, {
      status: "batch_complete",
      processed: batch.length,
      remaining: underCovered.length - batch.length,
      analyses: { success: successCount, failed: failCount },
      details: results,
    });
  } catch (err) {
    console.error("backfill-skill-coverage error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function generateJobTitles(
  apiKey: string,
  skill: { name: string; category: string; description: string | null },
  count: number
): Promise<{ title: string; company: string }[]> {
  const prompt = `Generate exactly ${count} realistic job titles that would require the skill "${skill.name}" (${skill.category}).
${skill.description ? `Skill description: ${skill.description}` : ""}

Requirements:
- Each job title should be a REAL job title found on job boards (not made up)
- Pair each with a well-known company where this role would exist
- Vary the seniority levels and industries
- Focus on US-based companies

Respond ONLY with a JSON array:
[{"title": "...", "company": "..."}, ...]`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
    }),
  });

  if (!res.ok) {
    console.error("AI error generating job titles:", await res.text());
    // Fallback: generic titles
    return Array.from({ length: count }, (_, i) => ({
      title: `${skill.name} Specialist`,
      company: ["Google", "Microsoft", "Amazon"][i % 3],
    }));
  }

  const data = await res.json();
  const content = data.choices[0].message.content;

  try {
    const match = content.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(match ? match[0] : content);
    return parsed.slice(0, count);
  } catch {
    return Array.from({ length: count }, (_, i) => ({
      title: `${skill.name} Specialist`,
      company: ["Google", "Microsoft", "Amazon"][i % 3],
    }));
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function respond(headers: Record<string, string>, body: any) {
  return new Response(JSON.stringify(body), {
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
