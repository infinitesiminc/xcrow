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
    const { companyId, batchSize = 5, department, jobIds, forceRefresh = false } = await req.json();
    if (!companyId) {
      return new Response(JSON.stringify({ error: "companyId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let jobQuery = sb
      .from("jobs")
      .select("id, title, description, department, augmented_percent")
      .eq("company_id", companyId);
    if (department) jobQuery = jobQuery.eq("department", department);
    if (jobIds?.length) jobQuery = jobQuery.in("id", jobIds);
    const { data: allJobs, error: jobsErr } = await jobQuery.order("title");

    if (jobsErr) throw new Error(jobsErr.message);
    if (!allJobs?.length) {
      return new Response(JSON.stringify({ error: "No jobs found", total: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get DISTINCT job_ids that already have task clusters
    const { data: existingClusters, error: clusterErr } = await sb
      .from("job_task_clusters")
      .select("job_id")
      .in("job_id", allJobs.map(j => j.id));

    if (clusterErr) throw new Error(clusterErr.message);
    const analyzedJobIds = new Set((existingClusters || []).map(c => c.job_id));

    // Find jobs needing backfill (have clusters but no score) OR forceRefresh all
    console.log(`[bulk-analyze] forceRefresh=${forceRefresh}, analyzedJobIds=${analyzedJobIds.size}, total=${allJobs.length}`);
    const backfillJobIds = new Set(
      allJobs
        .filter(j => analyzedJobIds.has(j.id) && (forceRefresh || (j.augmented_percent ?? 0) === 0))
        .map(j => j.id)
    );
    console.log(`[bulk-analyze] backfillJobIds=${backfillJobIds.size}`);

    const pendingJobs = allJobs.filter(j => !analyzedJobIds.has(j.id) || backfillJobIds.has(j.id));
    console.log(`[bulk-analyze] pendingJobs=${pendingJobs.length}`);
    if (pendingJobs.length === 0) {
      return new Response(JSON.stringify({
        total: allJobs.length, alreadyAnalyzed: analyzedJobIds.size,
        justProcessed: 0, remaining: 0, batchProcessed: 0, results: [],
        debug: { forceRefresh, backfillCount: backfillJobIds.size },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const batch = pendingJobs.slice(0, Math.min(batchSize, 10));
    const results: { jobId: string; title: string; status: string; taskCount?: number }[] = [];

    for (const job of batch) {
      try {
        const shouldBackfill = backfillJobIds.has(job.id);
        const { data: existing } = await sb
          .from("job_task_clusters")
          .select("id")
          .eq("job_id", job.id)
          .limit(1);

        if (existing && existing.length > 0 && !shouldBackfill) {
          results.push({ jobId: job.id, title: job.title, status: "already_exists" });
          continue;
        }
        if (existing && existing.length > 0 && shouldBackfill) {
          await sb.from("job_task_clusters").delete().eq("job_id", job.id);
        }

        const prompt = `Analyze the job role "${job.title}" and break it down into 8-12 discrete task clusters.

${job.description ? `Job Description:\n${job.description.slice(0, 2000)}\n\n` : ""}

For each task cluster return a JSON array of objects with:
1. "cluster_name": Short task name (3-6 words)
2. "description": One sentence describing the task
3. "outcome": What successful completion looks like
4. "skill_names": Array of 2-4 skills needed
5. "ai_exposure_score": Integer 0-100 — how much AI is involved today (0 = fully human, 100 = fully AI)
6. "job_impact_score": Integer 0-100 — how critical this task is to job success (0 = negligible, 100 = core to role)
7. "priority": "high", "medium", or "low"

Order from highest AI exposure to lowest. Respond ONLY with valid JSON array.`;

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.6,
          }),
        });

        if (!res.ok) {
          const txt = await res.text();
          if (res.status === 429) {
            results.push({ jobId: job.id, title: job.title, status: "rate_limited" });
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

        // Log parsed scores for diagnostics
        const sampleTask = tasks[0];
        console.log(`[${job.title}] Sample task scores:`, JSON.stringify({
          cluster_name: sampleTask?.cluster_name,
          ai_exposure_score: sampleTask?.ai_exposure_score,
          job_impact_score: sampleTask?.job_impact_score,
          keys: sampleTask ? Object.keys(sampleTask) : [],
        }));

        const rows = tasks.map((t: any, i: number) => ({
          job_id: job.id,
          cluster_name: t.cluster_name,
          description: t.description || null,
          outcome: t.outcome || null,
          skill_names: t.skill_names || null,
          sort_order: i,
          ai_exposure_score: Math.min(Math.max(t.ai_exposure_score ?? 50, 0), 100),
          job_impact_score: Math.min(Math.max(t.job_impact_score ?? 50, 0), 100),
          priority: t.priority || "medium",
        }));

        const { error: insertErr } = await sb.from("job_task_clusters").insert(rows);
        if (insertErr) {
          results.push({ jobId: job.id, title: job.title, status: "insert_error: " + insertErr.message });
        } else {
          // Compute job-level AI exposure weighted by job impact
          let totalWeight = 0;
          let weightedSum = 0;
          for (const t of tasks) {
            const impact = Math.max(t.job_impact_score ?? 50, 1);
            totalWeight += impact;
            weightedSum += (t.ai_exposure_score ?? 50) * impact;
          }
          const jobScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

          await sb.from("jobs").update({
            augmented_percent: Math.min(jobScore, 100),
            automation_risk_percent: 0,
            new_skills_percent: 0,
          }).eq("id", job.id);

          results.push({ jobId: job.id, title: job.title, status: "success", taskCount: rows.length });
        }

        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        results.push({ jobId: job.id, title: job.title, status: `error: ${err.message}` });
      }
    }

    const successCount = results.filter(r => r.status === "success" || r.status === "already_exists").length;

    return new Response(JSON.stringify({
      total: allJobs.length,
      alreadyAnalyzed: analyzedJobIds.size,
      justProcessed: successCount,
      remaining: pendingJobs.length - successCount,
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
