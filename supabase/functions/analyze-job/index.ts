import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `You are an AI job impact analyst. Given a job title and optional company name, analyze how AI is transforming that role at the task level.

You MUST respond by calling the "job_analysis" function with structured data. Do not return plain text.

Be specific and realistic. Consider current AI capabilities and near-term trends (1-3 years).
For each task:
- currentState: "mostly_human" (AI barely used), "human_ai" (AI assists humans), or "mostly_ai" (AI does most of the work)
- trend: "stable" (unlikely to change soon), "increasing_ai" (AI taking on more), or "fully_ai_soon" (will be mostly AI within 1-3 years)
- impactLevel: "low", "medium", or "high"

For skill recommendations, categorize into:
- "ai_tools": specific AI tools and platforms to learn
- "human_skills": uniquely human skills to strengthen
- "new_capabilities": new emerging skills to develop

For each skill, also provide 1-3 top tools or resources with:
- name: the tool/course/resource name
- url: a real URL to the tool or resource
- summary: a one-sentence description of what it does and why it's useful

Provide 6-8 tasks and 5-7 skills. Be specific to the role, not generic.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobTitle, company } = await req.json();

    if (!jobTitle) {
      return new Response(JSON.stringify({ error: "Job title is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = company
      ? `Analyze the role of "${jobTitle}" at "${company}". Consider the specific industry and company context.`
      : `Analyze the role of "${jobTitle}". Consider typical responsibilities across industries.`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "job_analysis",
              description: "Return the structured job analysis result",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "object",
                    properties: {
                      augmentedPercent: { type: "number", description: "Percentage of tasks augmented by AI (0-100)" },
                      automationRiskPercent: { type: "number", description: "Percentage at risk of full automation (0-100)" },
                      newSkillsPercent: { type: "number", description: "Percentage requiring new skills (0-100)" },
                    },
                    required: ["augmentedPercent", "automationRiskPercent", "newSkillsPercent"],
                    additionalProperties: false,
                  },
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        currentState: { type: "string", enum: ["mostly_human", "human_ai", "mostly_ai"] },
                        trend: { type: "string", enum: ["stable", "increasing_ai", "fully_ai_soon"] },
                        impactLevel: { type: "string", enum: ["low", "medium", "high"] },
                        description: { type: "string" },
                      },
                      required: ["name", "currentState", "trend", "impactLevel", "description"],
                      additionalProperties: false,
                    },
                  },
                  skills: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        category: { type: "string", enum: ["ai_tools", "human_skills", "new_capabilities"] },
                        description: { type: "string" },
                        resources: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string", description: "Tool or resource name" },
                              url: { type: "string", description: "URL to the tool or resource" },
                              summary: { type: "string", description: "One-sentence description" },
                            },
                            required: ["name", "url", "summary"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["name", "priority", "category", "description", "resources"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["summary", "tasks", "skills"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "job_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to analyze job" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    const result = {
      jobTitle,
      company: company || "",
      summary: analysis.summary,
      tasks: analysis.tasks,
      skills: analysis.skills,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-job error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
