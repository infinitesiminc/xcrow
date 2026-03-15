import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const { prompt, documentText, userId } = await req.json();

    if (!prompt && !documentText) {
      return new Response(JSON.stringify({ error: "Provide either prompt or documentText" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sourceText = prompt || documentText!;
    const sourceType = prompt ? "prompt" : "document";

    // Step 1: Extract structured sim metadata from the input
    const extractPrompt = `You are analyzing a user's input to create a custom AI-readiness simulation.

USER INPUT (${sourceType === "prompt" ? "free-text description" : "uploaded document content"}):
"""
${sourceText.slice(0, 5000)}
"""

Extract the following and return as JSON:
1. "job_title": The role/job title this simulation is about (infer if not stated)
2. "company": Company name if mentioned, or null
3. "task_name": A specific 3-6 word task name for the simulation
4. "description": One sentence describing what the simulation practices
5. "ai_state": One of "mostly_human", "human_ai", "mostly_ai" — how much AI currently does this task
6. "ai_trend": One of "stable", "increasing_ai", "fully_ai_soon"
7. "impact_level": One of "low", "medium", "high"
8. "priority": One of "critical", "important", "helpful"
9. "skill_names": Array of 2-4 skills tested in this simulation

Respond ONLY with valid JSON, no markdown.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: extractPrompt }],
        temperature: 0.5,
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

    let parsed: any;
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
      parsed = JSON.parse(jsonMatch[1].trim());
    } catch {
      throw new Error("Failed to parse AI extraction response");
    }

    // Step 2: Apply deterministic template scoring
    const state = parsed.ai_state || "human_ai";
    const impact = parsed.impact_level || "medium";
    const priority = parsed.priority || "important";
    const skillCount = (parsed.skill_names || []).length;

    let score = 0;
    score += state === "mostly_human" ? 3 : state === "human_ai" ? 2 : 1;
    score += impact === "high" ? 3 : impact === "medium" ? 2 : 1;
    score += priority === "critical" ? 3 : priority === "important" ? 2 : 1;
    if (skillCount >= 4) score += 2; else if (skillCount >= 3) score += 1;

    const recommended_template = score >= 9 ? "case-challenge" : score >= 6 ? "deep-dive" : "quick-pulse";
    const sim_duration = score >= 9 ? 30 : score >= 6 ? 15 : 3;

    // Step 3: Persist to custom_simulations table
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const row = {
      user_id: userId,
      job_title: parsed.job_title || "Custom Role",
      company: parsed.company || null,
      task_name: parsed.task_name || "Custom Task",
      source_type: sourceType,
      source_prompt: prompt || null,
      source_document_text: documentText ? documentText.slice(0, 10000) : null,
      recommended_template,
      ai_state: state,
      ai_trend: parsed.ai_trend || "increasing_ai",
      impact_level: impact,
      priority,
      sim_duration,
    };

    const { data: inserted, error: insertErr } = await sb
      .from("custom_simulations")
      .insert(row)
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      throw new Error("Failed to save custom simulation");
    }

    return new Response(JSON.stringify({
      simulation: {
        ...inserted,
        description: parsed.description,
        skill_names: parsed.skill_names || [],
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("compile-custom-sim error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
