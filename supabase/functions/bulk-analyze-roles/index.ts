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
    const { companyId, batchSize = 5, department, jobIds } = await req.json();
    if (!companyId) {
      return new Response(JSON.stringify({ error: "companyId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all jobs for this company (optionally filtered by department)
    let jobQuery = sb
      .from("jobs")
      .select("id, title, description, department, augmented_percent, automation_risk_percent, new_skills_percent")
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

    // Get DISTINCT job_ids that already have task clusters for this company
    const { data: existingClusters, error: clusterErr } = await sb
      .from("job_task_clusters")
      .select("job_id, id")
      .limit(10000);

    if (clusterErr) {
      console.error("Cluster query error:", clusterErr.message);
    }

    const allJobIds = new Set(allJobs.map(j => j.id));
    const analyzedJobIds = new Set(
      (existingClusters || [])
        .filter(c => allJobIds.has(c.job_id))
        .map(c => c.job_id)
    );

    const backfillJobIds = new Set(
      allJobs
        .filter(j => analyzedJobIds.has(j.id) && (j.augmented_percent ?? 0) === 0 && (j.automation_risk_percent ?? 0) === 0 && (j.new_skills_percent ?? 0) === 0)
        .map(j => j.id)
    );

    const pendingJobs = allJobs.filter(j => !analyzedJobIds.has(j.id) || backfillJobIds.has(j.id));

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
        // Double-check this job doesn't already have clusters (race condition guard)
        const { data: existing } = await sb
          .from("job_task_clusters")
          .select("id")
          .eq("job_id", job.id)
          .limit(1);

        if (existing && existing.length > 0) {
          results.push({ jobId: job.id, title: job.title, status: "already_exists" });
          continue;
        }

        const prompt = `Analyze the job role "${job.title}" and break it down into 8-12 discrete task clusters.

${job.description ? `Job Description:\n${job.description.slice(0, 2000)}\n\n` : ""}

For each task cluster return a JSON array of objects with:
1. "cluster_name": Short task name (3-6 words)
2. "description": One sentence describing the task
3. "outcome": What successful completion looks like
4. "skill_names": Array of 2-4 skills needed
5. "ai_state": One of "mostly_human", "human_ai", "mostly_ai"
6. "impact_level": One of "low", "medium", "high"
7. "priority": "critical", "important", or "helpful"

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
          results.push({ jobId: job.id, title: job.title, status: "insert_error: " + insertErr.message });
        } else {
          // Compute job-level scores from task signals
          const totalTasks = tasks.length || 1;
          const augmentedCount = tasks.filter((t: any) => (t.ai_state || "human_ai") === "human_ai").length;
          const mostlyAiCount = tasks.filter((t: any) => (t.ai_state || "human_ai") === "mostly_ai").length;
          const highImpactCount = tasks.filter((t: any) => (t.impact_level || "medium") === "high").length;
          const criticalCount = tasks.filter((t: any) => (t.priority || "important") === "critical").length;

          const augmented_percent = Math.round((augmentedCount / totalTasks) * 100);
          const automation_risk_percent = Math.round(((mostlyAiCount * 1.0 + highImpactCount * 0.5) / totalTasks) * 60 + (criticalCount / totalTasks) * 20);
          const new_skills_percent = Math.round(
            tasks.reduce((sum: number, t: any) => sum + Math.min((t.skill_names || []).length, 4), 0) / (totalTasks * 4) * 100
          );

          await sb.from("jobs").update({
            augmented_percent: Math.min(augmented_percent, 100),
            automation_risk_percent: Math.min(automation_risk_percent, 100),
            new_skills_percent: Math.min(new_skills_percent, 100),
          }).eq("id", job.id);

          results.push({ jobId: job.id, title: job.title, status: "success", taskCount: rows.length });
        }

        // Small delay between calls to avoid rate limits
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
