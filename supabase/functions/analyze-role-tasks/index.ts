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
    const { jobId, jobTitle, company, description } = await req.json();
    if (!jobId || !jobTitle) {
      return new Response(JSON.stringify({ error: "jobId and jobTitle required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if task clusters already exist
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: existing } = await sb
      .from("job_task_clusters")
      .select("id, cluster_name, description, outcome, skill_names, sort_order")
      .eq("job_id", jobId)
      .order("sort_order");

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ tasks: existing, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate task analysis via AI
    const prompt = `Analyze the job role "${jobTitle}"${company ? ` at ${company}` : ""} and break it down into 8-12 discrete task clusters.

${description ? `Job Description:\n${description.slice(0, 3000)}\n\n` : ""}

For each task cluster, assess AI's current and future impact. Return a JSON array of objects with these fields:

1. "cluster_name": Short task name (3-6 words)
2. "description": One sentence describing what this task involves
3. "outcome": What successful completion looks like
4. "skill_names": Array of 2-4 skills needed for this task
5. "ai_state": One of "mostly_human", "human_ai", "mostly_ai"
6. "ai_trend": One of "stable", "increasing_ai", "fully_ai_soon"
7. "impact_level": One of "low", "medium", "high"
8. "priority": "critical", "important", or "helpful" — how urgently this task needs AI upskilling

Order tasks from highest AI impact to lowest.

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

    const data = await res.json();
    const raw = data.choices[0].message.content;

    let tasks: any[];
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
      tasks = JSON.parse(jsonMatch[1].trim());
    } catch {
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
    }));

    const { error: insertErr } = await sb.from("job_task_clusters").insert(rows);
    if (insertErr) console.error("Insert error:", insertErr);

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
    }).eq("id", jobId);

    // Deterministic template selection based on task signals
    function pickTemplate(t: any): { template: string; duration: number } {
      const state = t.ai_state || "human_ai";
      const impact = t.impact_level || "medium";
      const priority = t.priority || "important";
      const skillCount = (t.skill_names || []).length;

      // Score: higher = more complex format needed
      let score = 0;

      // AI state: mostly_human tasks need deeper practice
      if (state === "mostly_human") score += 3;
      else if (state === "human_ai") score += 2;
      else score += 1; // mostly_ai — just awareness check

      // Impact level
      if (impact === "high") score += 3;
      else if (impact === "medium") score += 2;
      else score += 1;

      // Priority is the tiebreaker — critical always gets at least Deep Dive
      if (priority === "critical") score += 3;
      else if (priority === "important") score += 2;
      else score += 1;

      // Skill breadth
      if (skillCount >= 4) score += 2;
      else if (skillCount >= 3) score += 1;

      // Map score to template
      // 3-5 → Quick Pulse, 6-8 → Deep Dive, 9+ → Case Challenge
      if (score >= 9) return { template: "case-challenge", duration: 30 };
      if (score >= 6) return { template: "deep-dive", duration: 15 };
      return { template: "quick-pulse", duration: 3 };
    }

    // Return enriched tasks (with AI metadata that isn't stored in DB)
    const enrichedTasks = tasks.map((t: any, i: number) => {
      const { template, duration } = pickTemplate(t);
      return {
        id: crypto.randomUUID(),
        cluster_name: t.cluster_name,
        description: t.description || null,
        outcome: t.outcome || null,
        skill_names: t.skill_names || null,
        sort_order: i,
        ai_state: t.ai_state || "human_ai",
        ai_trend: t.ai_trend || "increasing_ai",
        impact_level: t.impact_level || "medium",
        recommended_template: template,
        priority: t.priority || "important",
        sim_duration: duration,
      };
    });

    return new Response(JSON.stringify({ tasks: enrichedTasks, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-role-tasks error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
