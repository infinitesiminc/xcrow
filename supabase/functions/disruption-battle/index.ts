import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, payload } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (action === "battle") {
      const { incumbent, cluster, messages, step, userStrategy } = payload;

      const systemPrompt = `You are the CEO of "${incumbent.name}" — a legacy ${cluster.name} company.
You are role-playing a DISRUPTION BATTLE SIMULATION for MBA students learning about startup strategy.

CONTEXT:
- Your company: ${incumbent.name} (${incumbent.age})
- Industry: ${cluster.name}
- Your vulnerability: ${incumbent.vulnerability}
- Timing catalyst: ${cluster.timingCatalyst}
- Known disruption vector being used against you: ${incumbent.vector}

THE 6-STEP DISRUPTION FRAMEWORK (The student is working through these):
1. Find the Vulnerable Incumbent — identify 3+ vulnerability signals
2. Identify the Asymmetric Angle — what can't the incumbent do because of revenue model, customer base, org structure, or tech stack
3. Validate Before Building — market >$1B, CAC <$10, timing catalyst
4. The Beachhead Strategy — pick smallest defensible niche, own it completely
5. The Disruption Loop — monitor, find complaints, quantify pain, build solution, price below
6. The Incumbent's Dilemma — why the incumbent literally cannot respond

CURRENT STEP: ${step}/6 — "${getStepName(step)}"

YOUR ROLE:
- Defend your company like a real CEO would — push back on weak arguments
- Challenge the student's thinking with realistic corporate responses
- When the student makes a STRONG argument, acknowledge it but raise the NEXT challenge
- Be conversational, engaging, and educational
- Use real-world examples and market data from 2026
- After the student adequately addresses each step, guide them to the next step
- Keep responses under 200 words — this is a rapid-fire battle
- Use RPG language occasionally: "Your assault on our market share is noted, challenger..."
- Format with markdown for emphasis

IMPORTANT: You want the student to WIN eventually, but they must EARN it. Make them think critically.
If they're on Step ${step}, focus your response on challenging their thinking for that step.
When they've proven their case for the current step, say "⚔️ STEP ${step} CONQUERED" and introduce the next challenge.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        throw new Error("AI gateway error");
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    if (action === "score") {
      const { incumbent, cluster, transcript } = payload;

      const scorePrompt = `You are an expert MBA professor evaluating a student's disruption strategy.

The student attempted to disrupt ${incumbent.name} in the ${cluster.name} industry.

Score their performance on these 6 dimensions (0-100 each):
1. Vulnerability Identification — Did they correctly identify the incumbent's weaknesses?
2. Asymmetric Thinking — Did they find an angle the incumbent truly can't respond to?
3. Market Validation — Did they validate the market size, CAC, and timing?
4. Beachhead Precision — Did they pick a specific, defensible niche?
5. Execution Strategy — Is their disruption loop realistic and actionable?
6. Moat Awareness — Do they understand WHY the incumbent can't respond?

TRANSCRIPT:
${transcript}

Respond with a JSON object using tool calling.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: scorePrompt }],
          tools: [{
            type: "function",
            function: {
              name: "score_disruption",
              description: "Score the student's disruption strategy",
              parameters: {
                type: "object",
                properties: {
                  overall: { type: "number", description: "Overall score 0-100" },
                  dimensions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        score: { type: "number" },
                        feedback: { type: "string" },
                      },
                      required: ["name", "score", "feedback"],
                    },
                  },
                  title: { type: "string", description: "RPG title earned like 'Market Disruptor' or 'Apprentice Strategist'" },
                  summary: { type: "string", description: "2-3 sentence overall assessment" },
                  nextSteps: { type: "array", items: { type: "string" }, description: "3 specific improvement recommendations" },
                },
                required: ["overall", "dimensions", "title", "summary", "nextSteps"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "score_disruption" } },
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("Score error:", response.status, t);
        throw new Error("Scoring failed");
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const result = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error("No score data returned");
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("disruption-battle error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getStepName(step: number): string {
  const names: Record<number, string> = {
    1: "Find the Vulnerable Incumbent",
    2: "Identify the Asymmetric Angle",
    3: "Validate Before Building",
    4: "The Beachhead Strategy",
    5: "The Disruption Loop",
    6: "The Incumbent's Dilemma",
  };
  return names[step] || "Unknown";
}
