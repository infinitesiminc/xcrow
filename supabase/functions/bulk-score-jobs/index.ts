import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing API key" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batchSize || 25, 50);
    const companyId = body.companyId || null; // optional: scope to a company

    // Find jobs with descriptions but no Layer 1 scores
    let query = sb
      .from("jobs")
      .select("id, title, department, description, companies(name)")
      .or("augmented_percent.is.null,augmented_percent.eq.0")
      .not("description", "is", null)
      .order("imported_at", { ascending: false })
      .limit(batchSize);

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data: jobs, error: fetchErr } = await query;
    if (fetchErr) throw new Error(`Fetch error: ${fetchErr.message}`);
    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No jobs need scoring" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { id: string; title: string; score: number; status: string }[] = [];
    let rateLimited = false;

    for (const job of jobs) {
      if (rateLimited) break;

      const desc = (job.description || "").trim();
      if (desc.length < 50) {
        results.push({ id: job.id, title: job.title, score: 0, status: "skipped_short" });
        continue;
      }

      const companyName = (job.companies as any)?.name || "";

      const prompt = `You are an AI workforce analyst. Given the job description below, estimate the overall AI exposure level for this role as a single integer from 0 to 100.

0 = no AI impact at all (purely manual/human work)
100 = this role could be almost entirely automated by AI today

Consider: which tasks in this role can AI already do, how much of the workload is affected, and whether AI tools are commonly used in this domain.

Job Title: ${job.title}
${companyName ? `Company: ${companyName}` : ""}
Department: ${job.department || "Unknown"}

Description (first 2000 chars):
${desc.slice(0, 2000)}

Respond with ONLY a JSON object: {"score": <number 0-100>}`;

      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
          }),
        });

        if (res.status === 429) {
          rateLimited = true;
          results.push({ id: job.id, title: job.title, score: 0, status: "rate_limited" });
          continue;
        }
        if (!res.ok) {
          results.push({ id: job.id, title: job.title, score: 0, status: `error_${res.status}` });
          continue;
        }

        const data = await res.json();
        const raw = data?.choices?.[0]?.message?.content || "";
        const match = raw.match(/\{\s*"score"\s*:\s*(\d+)\s*\}/);
        const score = match ? Math.min(Math.max(parseInt(match[1], 10), 0), 100) : 0;

        if (score > 0) {
          await sb.from("jobs").update({
            augmented_percent: score,
            automation_risk_percent: 0,
            new_skills_percent: 0,
          }).eq("id", job.id);
        }

        results.push({ id: job.id, title: job.title, score, status: score > 0 ? "scored" : "zero" });
      } catch (err) {
        results.push({ id: job.id, title: job.title, score: 0, status: "error" });
      }

      // Small delay between calls
      await new Promise(r => setTimeout(r, 200));
    }

    const scored = results.filter(r => r.status === "scored").length;
    const skipped = results.filter(r => r.status !== "scored").length;

    return new Response(JSON.stringify({
      processed: results.length,
      scored,
      skipped,
      rateLimited,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("bulk-score-jobs error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
