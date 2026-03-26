import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { guardianId, category, guardianName, guardianTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are designing a Territory Trial for a gamified AI skills platform targeting high school and university students. Generate exactly 3 rounds of A/B "Technique vs Technique" questions themed to the "${category}" skill territory.

Guardian context: ${guardianName}, ${guardianTitle}

## Rules
- Each round presents a realistic task scenario where a student would use AI
- Offer exactly 2 approaches (A and B) — both use AI, but one is significantly better technique
- The scenarios should be relatable to students (school projects, internships, student org work, personal projects)
- Do NOT require deep domain expertise — test reasoning about AI approach quality
- Make the better option clearly better on reflection, but not obvious at first glance
- Vary the scenarios across the 3 rounds — don't repeat the same pattern

## Territory themes
- Technical: coding, debugging, building apps, automation scripts
- Analytical: data analysis, research, interpreting results, spotting patterns
- Strategic: planning projects, making decisions, evaluating options, prioritizing
- Communication: writing, presenting, explaining complex ideas, stakeholder comms
- Leadership: team coordination, delegation, mentoring, project management
- Creative: design, content creation, brainstorming, visual storytelling
- Ethics & Compliance: bias detection, fairness, privacy, responsible AI use
- Human Edge: empathy, relationship building, judgment calls, moral reasoning

Return valid JSON only, no markdown fences.`;

    const userPrompt = `Generate 3 Territory Trial rounds for the ${category} territory. Return this exact JSON structure:
{
  "rounds": [
    {
      "scenario": "A brief scenario description (1-2 sentences)",
      "optionA": "Description of approach A (1-2 sentences)",
      "optionB": "Description of approach B (1-2 sentences)",
      "correct": "A" or "B",
      "explanation": "Why the correct answer is better (1-2 sentences)"
    }
  ]
}`;

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
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Failed to generate trial" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const parsed = JSON.parse(content);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("guardian-trial error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
