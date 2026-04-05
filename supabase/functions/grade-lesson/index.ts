import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lessonType, lessonContent, userResponse, companyContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (lessonType === "concept") {
      // Quiz-style: generate a question from concept content, grade the answer
      systemPrompt = `You are a GTM Academy instructor grading a student's understanding of a concept.
Return a JSON object with tool calling.`;
      userPrompt = `Concept taught: "${lessonContent.think}"

Student's answer to comprehension check: "${userResponse}"

Grade on:
- judgment_score (0-100): Does the student understand the core concept?
- speed_score: Not applicable, set to 75.
- override_score: Not applicable, set to 75.
- tool_score: Not applicable, set to 75.
- overall_score (0-100): Weighted average
- feedback: 2-3 sentences of specific feedback
- passed: true if overall >= 70`;
    } else if (lessonType === "prompt_lab") {
      systemPrompt = `You are a GTM Academy instructor evaluating a student's prompt engineering and strategic thinking.
Grade how well the student's response addresses the exercise.`;
      userPrompt = `Exercise: "${lessonContent.prompt}"
Context: "${lessonContent.think}"
Validation criteria: "${lessonContent.validate}"

Student's response:
"${userResponse}"

${companyContext ? `Company context: ${JSON.stringify(companyContext)}` : ""}

Grade on:
- judgment_score (0-100): Did they identify the RIGHT signals/targets/strategies?
- speed_score (0-100): Was their response focused and efficient (not rambling)?
- override_score (0-100): Did they add original insight beyond what AI would generate?
- tool_score (0-100): Did they demonstrate understanding of which tool to use?
- overall_score (0-100): (judgment*0.4 + speed*0.2 + override*0.25 + tool*0.15)
- feedback: 2-3 sentences of specific, actionable feedback
- passed: true if overall >= 70`;
    } else if (lessonType === "challenge") {
      systemPrompt = `You are a GTM Academy Live Lab grader. This is a hands-on challenge using real company data.
Be rigorous but fair. Grade against professional GTM standards.`;
      userPrompt = `Challenge: "${lessonContent.prompt}"
Think framework: "${lessonContent.think}"
Scoring: "${lessonContent.validate}"

${companyContext ? `Company data:\n${JSON.stringify(companyContext, null, 2)}` : ""}

Student's submission:
"${userResponse}"

Grade on:
- judgment_score (0-100): Did they pick the RIGHT niche/person/message? (40% weight)
- speed_score (0-100): Was their analysis focused and decisive? (20% weight)
- override_score (0-100): Did they add insight AI wouldn't generate? (25% weight)
- tool_score (0-100): Did they use the right approach for the task? (15% weight)
- overall_score (0-100): Weighted as specified above
- feedback: 3-4 sentences of specific feedback with one concrete improvement suggestion
- highlights: Array of 1-3 things the student did well
- improvements: Array of 1-3 specific areas to improve
- passed: true if overall >= 70`;
    } else {
      // tool_lab
      systemPrompt = `You are a GTM Academy instructor evaluating tool usage proficiency.`;
      userPrompt = `Exercise: "${lessonContent.prompt}"
Context: "${lessonContent.think}"

Student's response:
"${userResponse}"

Grade on:
- judgment_score (0-100): Did they target the right data?
- speed_score (0-100): Was their approach efficient?
- override_score (0-100): Did they interpret results with original judgment?
- tool_score (0-100): Did they use the tool correctly and effectively?
- overall_score (0-100): (judgment*0.4 + speed*0.2 + override*0.25 + tool*0.15)
- feedback: 2-3 sentences
- passed: true if overall >= 70`;
    }

    const tools = [{
      type: "function",
      function: {
        name: "submit_grade",
        description: "Submit the grading result for a student lesson",
        parameters: {
          type: "object",
          properties: {
            judgment_score: { type: "number", minimum: 0, maximum: 100 },
            speed_score: { type: "number", minimum: 0, maximum: 100 },
            override_score: { type: "number", minimum: 0, maximum: 100 },
            tool_score: { type: "number", minimum: 0, maximum: 100 },
            overall_score: { type: "number", minimum: 0, maximum: 100 },
            feedback: { type: "string" },
            highlights: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            passed: { type: "boolean" },
          },
          required: ["judgment_score", "speed_score", "override_score", "tool_score", "overall_score", "feedback", "passed"],
          additionalProperties: false,
        },
      },
    }];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "submit_grade" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", status, t);
      throw new Error("AI grading failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No grade returned");

    const grade = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(grade), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("grade-lesson error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
