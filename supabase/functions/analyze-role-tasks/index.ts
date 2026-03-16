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

  try {
    const { jobId, jobTitle, company, description, forceRefresh } = await req.json();
    if (!jobId || !jobTitle) {
      return new Response(JSON.stringify({ error: "jobId and jobTitle required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Check existing clusters
    const { data: existing } = await sb
      .from("job_task_clusters")
      .select("id, cluster_name, description, outcome, skill_names, sort_order, ai_exposure_score, job_impact_score, priority")
      .eq("job_id", jobId)
      .order("sort_order");

    const { data: jobRow } = await sb
      .from("jobs")
      .select("augmented_percent")
      .eq("id", jobId)
      .maybeSingle();

    const needsBackfill = !!existing?.length && (jobRow?.augmented_percent ?? 0) === 0;

    // Return cached unless force refresh or needs backfill
    if (existing && existing.length > 0 && !needsBackfill && !forceRefresh) {
      return new Response(JSON.stringify({ tasks: existing, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existing && existing.length > 0 && (needsBackfill || forceRefresh)) {
      await sb.from("job_task_clusters").delete().eq("job_id", jobId);
    }

    // Generate task analysis via AI
    const prompt = `Analyze the job role "${jobTitle}"${company ? ` at ${company}` : ""} and break it down into 8-12 discrete task clusters.

${description ? `Job Description:\n${description.slice(0, 3000)}\n\n` : ""}

For each task cluster, assess TWO dimensions:
1. How much AI is involved in this task today
2. How critical this task is to the overall job's success

Return a JSON array of objects with these fields:

1. "cluster_name": Short task name (3-6 words)
2. "description": One sentence describing what this task involves
3. "outcome": What successful completion looks like
4. "skill_names": Array of 2-4 skills needed for this task
5. "ai_exposure_score": Integer 0-100 — how much AI can do this task today (0 = fully human, 100 = fully AI-driven)
6. "job_impact_score": Integer 0-100 — how critical this task is to job success (0 = negligible impact, 100 = core to the role)
7. "priority": One of "high", "medium", "low" — how urgently this task needs AI upskilling

Order tasks from highest AI exposure to lowest.

Respond ONLY with a valid JSON array, no markdown.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (res.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await res.text();
      throw new Error(`AI API error (${res.status}): ${text}`);
    }

    const responseText = await res.text();
    if (!responseText || responseText.trim().length === 0) {
      throw new Error("AI returned empty response");
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse AI response JSON:", responseText.slice(0, 500));
      throw new Error("AI returned invalid JSON response");
    }

    const raw = data?.choices?.[0]?.message?.content;
    if (!raw || raw.trim().length === 0) {
      console.error("AI returned empty content. Full response:", JSON.stringify(data).slice(0, 500));
      throw new Error("AI returned empty content");
    }

    let tasks: any[];
    try {
      // Try markdown code block first, then raw JSON
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();
      // Also handle case where response starts with text before JSON array
      const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        tasks = JSON.parse(arrayMatch[0]);
      } else {
        tasks = JSON.parse(jsonStr);
      }
      if (!Array.isArray(tasks) || tasks.length === 0) {
        throw new Error("Parsed result is not a non-empty array");
      }
    } catch (parseErr) {
      console.error("Parse error:", parseErr.message, "Raw content:", raw.slice(0, 500));
      throw new Error("Failed to parse AI task analysis response");
    }

    // Store task clusters in DB
    const rows = tasks.map((t: any, i: number) => ({
      job_id: jobId,
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
    if (insertErr) console.error("Insert error:", insertErr);

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
    }).eq("id", jobId);

    // Return enriched tasks
    const enrichedTasks = tasks.map((t: any, i: number) => ({
      id: crypto.randomUUID(),
      cluster_name: t.cluster_name,
      description: t.description || null,
      outcome: t.outcome || null,
      skill_names: t.skill_names || null,
      sort_order: i,
      ai_exposure_score: Math.min(Math.max(t.ai_exposure_score ?? 50, 0), 100),
      job_impact_score: Math.min(Math.max(t.job_impact_score ?? 50, 0), 100),
      priority: t.priority || "medium",
    }));

    return new Response(JSON.stringify({ tasks: enrichedTasks, cached: false, jobScore }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-role-tasks error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
