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
    const { companyId, batchSize = 5 } = await req.json();
    if (!companyId) {
      return new Response(JSON.stringify({ error: "companyId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all jobs for this company
    const { data: allJobs, error: jobsErr } = await sb
      .from("jobs")
      .select("id, title, description")
      .eq("company_id", companyId)
      .order("title");

    if (jobsErr) throw new Error(jobsErr.message);
    if (!allJobs?.length) {
      return new Response(JSON.stringify({ error: "No jobs found", total: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get jobs that already have task clusters
    const { data: existingClusters } = await sb
      .from("job_task_clusters")
      .select("job_id")
      .in("job_id", allJobs.map(j => j.id));

    const analyzedJobIds = new Set((existingClusters || []).map(c => c.job_id));
    const pendingJobs = allJobs.filter(j => !analyzedJobIds.has(j.id));

    if (pendingJobs.length === 0) {
      return new Response(JSON.stringify({
        message: "All jobs already analyzed",
        total: allJobs.length,
        analyzed: analyzedJobIds.size,
        remaining: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process a batch
    const batch = pendingJobs.slice(0, Math.min(batchSize, 10));
    const results: { jobId: string; title: string; status: string; taskCount?: number }[] = [];

    for (const job of batch) {
      try {
        const prompt = `Analyze the job role "${job.title}" and break it down into 8-12 discrete task clusters.

${job.description ? `Job Description:\n${job.description.slice(0, 2000)}\n\n` : ""}

For each task cluster return a JSON array of objects with:
1. "cluster_name": Short task name (3-6 words)
2. "description": One sentence describing the task
3. "outcome": What successful completion looks like
4. "skill_names": Array of 2-4 skills needed

Order from highest AI impact to lowest. Respond ONLY with valid JSON array.`;

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.6,
          }),
        });

        if (!res.ok) {
          const txt = await res.text();
          if (res.status === 429) {
            results.push({ jobId: job.id, title: job.title, status: "rate_limited" });
            // Stop processing further to respect rate limit
            break;
          }
          results.push({ jobId: job.id, title: job.title, status: `error_${res.status}` });
          continue;
        }

        const data = await res.json();
        const raw = data.choices[0].message.content;
        let tasks: any[];
        try {
          const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
          tasks = JSON.parse(jsonMatch[1].trim());
        } catch {
          results.push({ jobId: job.id, title: job.title, status: "parse_error" });
          continue;
        }

        const rows = tasks.map((t: any, i: number) => ({
          job_id: job.id,
          cluster_name: t.cluster_name,
          description: t.description || null,
          outcome: t.outcome || null,
          skill_names: t.skill_names || null,
          sort_order: i,
        }));

        const { error: insertErr } = await sb.from("job_task_clusters").insert(rows);
        if (insertErr) {
          results.push({ jobId: job.id, title: job.title, status: "insert_error" });
        } else {
          results.push({ jobId: job.id, title: job.title, status: "success", taskCount: rows.length });
        }

        // Small delay between calls to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        results.push({ jobId: job.id, title: job.title, status: `error: ${err.message}` });
      }
    }

    return new Response(JSON.stringify({
      total: allJobs.length,
      alreadyAnalyzed: analyzedJobIds.size,
      remaining: pendingJobs.length - batch.length,
      batchProcessed: results.length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("bulk-analyze error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
