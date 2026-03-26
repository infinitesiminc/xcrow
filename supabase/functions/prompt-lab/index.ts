import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data: claimsData, error: claimsError } = await sb.auth.getClaims(
    authHeader.replace("Bearer ", "")
  );
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = (claimsData.claims as any).sub as string;

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing API key" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "generate-scenario") {
      return await handleGenerateScenario(body, apiKey);
    }
    if (action === "evaluate-prompt") {
      return await handleEvaluatePrompt(body, apiKey, sb, userId);
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("prompt-lab error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/* ─── Generate scenario ─── */
async function handleGenerateScenario(
  body: { skillName: string; skillCategory: string; difficulty: string },
  apiKey: string
) {
  const { skillName, skillCategory, difficulty } = body;

  const difficultyGuide: Record<string, string> = {
    guided:
      "Provide a simple, well-constrained task. Include a hint about which prompt technique to use (e.g. chain-of-thought, persona, few-shot). The task should have a clear correct answer.",
    "semi-open":
      "Provide a moderately complex task. Don't specify the technique—let the user choose. The task should have multiple valid approaches.",
    open:
      "Provide a challenging, real-world task with ambiguity. The user must decide the approach, constraints, and output format entirely on their own.",
  };

  const systemPrompt = `You are a prompt engineering instructor creating practice scenarios.
The student is practicing prompting for the skill: "${skillName}" (category: ${skillCategory}).
Difficulty: ${difficulty}.
${difficultyGuide[difficulty] || difficultyGuide.guided}

Return a scenario using the provided tool.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate a prompt engineering practice scenario for the skill "${skillName}" at ${difficulty} difficulty.`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "create_scenario",
            description: "Create a prompt engineering practice scenario",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Short scenario title (3-8 words)" },
                context: {
                  type: "string",
                  description:
                    "The situation/context the user is in. 2-3 sentences describing what they need to accomplish.",
                },
                task: {
                  type: "string",
                  description:
                    "The specific prompting task. What prompt should they write? 1-2 sentences.",
                },
                hint: {
                  type: "string",
                  description:
                    "A helpful hint about technique or approach. Only for guided difficulty, empty string for others.",
                },
                ideal_techniques: {
                  type: "array",
                  items: { type: "string" },
                  description:
                    "List of prompt techniques that would work well (e.g. chain-of-thought, persona, few-shot, structured-output)",
                },
              },
              required: ["title", "context", "task", "hint", "ideal_techniques"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "create_scenario" } },
    }),
  });

  if (!res.ok) {
    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const t = await res.text();
    console.error("AI error:", res.status, t);
    throw new Error("AI gateway error");
  }

  const data = await res.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("No scenario generated");

  const scenario = JSON.parse(toolCall.function.arguments);
  return new Response(JSON.stringify(scenario), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/* ─── Evaluate user prompt ─── */
async function handleEvaluatePrompt(
  body: {
    skillId: string;
    skillName: string;
    difficulty: string;
    scenarioPrompt: string;
    userPrompt: string;
    idealTechniques: string[];
  },
  apiKey: string,
  sb: any,
  userId: string
) {
  const { skillId, skillName, difficulty, scenarioPrompt, userPrompt, idealTechniques } = body;

  const systemPrompt = `You are an expert prompt engineering evaluator.
The student was given this scenario for the skill "${skillName}" (difficulty: ${difficulty}):
---
${scenarioPrompt}
---
Ideal techniques: ${idealTechniques.join(", ")}

Evaluate the student's prompt on 4 dimensions (each 0-25, total 0-100):
1. **Clarity** — Is the prompt clear, unambiguous, and well-structured?
2. **Specificity** — Does it include proper constraints, format specs, and boundaries?
3. **Technique Application** — Does it use effective prompting techniques (chain-of-thought, few-shot, persona, etc.)?
4. **Output Quality** — Would this prompt likely produce a high-quality, useful AI response?

Also provide:
- Constructive feedback (2-3 sentences)
- An improved version of their prompt

Use the provided tool to return your evaluation.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Student's prompt:\n\n${userPrompt}` },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "evaluate_prompt",
            description: "Evaluate a student's prompt and return scores",
            parameters: {
              type: "object",
              properties: {
                score_clarity: { type: "integer", minimum: 0, maximum: 25 },
                score_specificity: { type: "integer", minimum: 0, maximum: 25 },
                score_technique: { type: "integer", minimum: 0, maximum: 25 },
                score_output_quality: { type: "integer", minimum: 0, maximum: 25 },
                feedback: { type: "string", description: "2-3 sentence constructive feedback" },
                improved_prompt: { type: "string", description: "An improved version of the student's prompt" },
              },
              required: [
                "score_clarity",
                "score_specificity",
                "score_technique",
                "score_output_quality",
                "feedback",
                "improved_prompt",
              ],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "evaluate_prompt" } },
    }),
  });

  if (!res.ok) {
    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const t = await res.text();
    console.error("AI error:", res.status, t);
    throw new Error("AI gateway error");
  }

  const data = await res.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("No evaluation generated");

  const evaluation = JSON.parse(toolCall.function.arguments);

  // Save to database
  await sb.from("prompt_attempts").insert({
    user_id: userId,
    skill_id: skillId,
    difficulty,
    scenario_prompt: scenarioPrompt,
    user_prompt: userPrompt,
    score_clarity: evaluation.score_clarity,
    score_specificity: evaluation.score_specificity,
    score_technique: evaluation.score_technique,
    score_output_quality: evaluation.score_output_quality,
    ai_feedback: evaluation.feedback,
    improved_prompt: evaluation.improved_prompt,
  });

  return new Response(JSON.stringify(evaluation), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
