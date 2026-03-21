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

    const { tasks, jobTitle, company, jobId } = await req.json();

    if (!tasks?.length || !jobTitle) {
      return new Response(JSON.stringify({ error: "tasks[] and jobTitle required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check cache first
    if (jobId) {
      const { data: cached } = await sb
        .from("task_future_predictions")
        .select("cluster_name, prediction")
        .eq("job_id", jobId)
        .gt("expires_at", new Date().toISOString());

      if (cached && cached.length === tasks.length) {
        const predictions: Record<string, any> = {};
        cached.forEach((c: any) => { predictions[c.cluster_name] = c.prediction; });
        return new Response(JSON.stringify({ predictions, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Predict in parallel (max 5 concurrent)
    const predictions: Record<string, any> = {};
    const batchSize = 5;

    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (task: any) => {
          const prompt = `You are a workforce futurist analyzing how emerging AI technologies will transform specific job tasks in the next 2-5 years.

CONTEXT:
- Job: ${jobTitle}${company ? ` at ${company}` : ""}
- Task: "${task.name}"
- Current AI Exposure: ${task.aiExposureScore ?? 50}%
- Current Job Impact: ${task.jobImpactScore ?? 50}%
${task.description ? `- Description: ${task.description}` : ""}

EMERGING TECHNOLOGIES TO CONSIDER:
- AI Agents (autonomous task execution, multi-step reasoning)
- OpenClaw / Physical AI Workers (robotics + AI for physical tasks)
- Multimodal AI (vision, audio, text combined understanding)
- Code Generation AI (Devin, Cursor, autonomous coding agents)
- AI-to-AI Communication (systems that negotiate and coordinate without humans)
- Synthetic Content Generation (AI-created media, reports, designs)
- Real-time AI Translation & Communication (breaking language barriers)

Return a JSON object with:
- collapse_summary: One sentence on what gets automated away (max 100 chars)
- new_human_role: One sentence describing the transformed human role (max 120 chars)
- disrupting_tech: Array of 1-3 specific technologies causing the change
- future_exposure: Integer 0-100 (predicted AI exposure in 2-5 years)
- timeline: "1-2 years" | "2-3 years" | "3-5 years"
- future_skills: Array of 2-3 objects with id, name, category, description, icon_emoji
- simulation_scenario: Object with title (max 60 chars) and context (max 150 chars)

Be specific and grounded.`;

          const aiResp = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: "You are a workforce futurist. Return ONLY valid JSON, no markdown." },
                  { role: "user", content: prompt },
                ],
                max_tokens: 1024,
                tools: [
                  {
                    type: "function",
                    function: {
                      name: "predict_task_future",
                      description: "Return Level 2 prediction for a job task",
                      parameters: {
                        type: "object",
                        properties: {
                          collapse_summary: { type: "string" },
                          new_human_role: { type: "string" },
                          disrupting_tech: { type: "array", items: { type: "string" } },
                          future_exposure: { type: "integer" },
                          timeline: { type: "string", enum: ["1-2 years", "2-3 years", "3-5 years"] },
                          future_skills: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                category: { type: "string" },
                                description: { type: "string" },
                                icon_emoji: { type: "string" },
                              },
                              required: ["id", "name", "category", "description", "icon_emoji"],
                              additionalProperties: false,
                            },
                          },
                          simulation_scenario: {
                            type: "object",
                            properties: {
                              title: { type: "string" },
                              context: { type: "string" },
                            },
                            required: ["title", "context"],
                            additionalProperties: false,
                          },
                        },
                        required: ["collapse_summary", "new_human_role", "disrupting_tech", "future_exposure", "timeline", "future_skills", "simulation_scenario"],
                        additionalProperties: false,
                      },
                    },
                  },
                ],
                tool_choice: { type: "function", function: { name: "predict_task_future" } },
              }),
            }
          );

          if (!aiResp.ok) {
            console.error(`AI error for task "${task.name}":`, aiResp.status);
            return { name: task.name, prediction: null };
          }

          const aiData = await aiResp.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (!toolCall) return { name: task.name, prediction: null };

          return { name: task.name, prediction: JSON.parse(toolCall.function.arguments) };
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled" && r.value.prediction) {
          predictions[r.value.name] = r.value.prediction;
        }
      }
    }

    // Cache predictions
    if (jobId && Object.keys(predictions).length > 0) {
      const rows = Object.entries(predictions).map(([cluster_name, prediction]) => ({
        job_id: jobId,
        cluster_name,
        prediction,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }));
      await sb.from("task_future_predictions").upsert(rows, { onConflict: "job_id,cluster_name" }).then(
        ({ error }) => { if (error) console.error("Cache write error:", error); }
      );
    }

    return new Response(JSON.stringify({ predictions, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("batch-predict-future error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
