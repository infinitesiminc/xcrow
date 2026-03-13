import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `You are an AI job impact analyst. Given a job title, optional company name, and optional job description, analyze how AI is transforming that role at the task level.

You MUST respond by calling the "job_analysis" function with structured data. Do not return plain text.

If a job description is provided, use it as the PRIMARY source for identifying tasks. Extract real responsibilities from the JD rather than guessing generic ones.

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

For each skill, include "relatedTasks" — an array of task names (matching the task names you defined) that this skill helps address. Each skill should map to 1-3 tasks.

Provide 6-8 tasks and 5-7 skills. Be specific to the role, not generic.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobTitle, company, jobDescription, jdUrl } = await req.json();

    if (!jobTitle && !jobDescription && !jdUrl) {
      return new Response(JSON.stringify({ error: "Job title or job description is required" }), {
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

    // If jdUrl is provided, scrape it to get the JD text
    let resolvedJd = jobDescription || "";
    if (!resolvedJd && jdUrl) {
      const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
      if (apiKey) {
        try {
          let formattedUrl = jdUrl.trim();
          if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
            formattedUrl = `https://${formattedUrl}`;
          }
          console.log("Scraping JD URL:", formattedUrl);
          const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: formattedUrl,
              formats: ["markdown"],
              onlyMainContent: true,
            }),
          });
          if (scrapeRes.ok) {
            const scrapeData = await scrapeRes.json();
            resolvedJd = scrapeData.data?.markdown || scrapeData.markdown || "";
            console.log("Scraped JD length:", resolvedJd.length);
          } else {
            console.error("Failed to scrape JD URL:", scrapeRes.status);
          }
        } catch (e) {
          console.error("Error scraping JD URL:", e);
        }
      }
    }

    // Truncate JD to avoid token limits
    const truncatedJd = resolvedJd.slice(0, 6000);

    let userPrompt = "";
    if (truncatedJd) {
      userPrompt = `Analyze the role of "${jobTitle}"${company ? ` at "${company}"` : ""}.\n\nHere is the actual job description — use it to identify the real tasks and responsibilities:\n\n---\n${truncatedJd}\n---`;
    } else if (company) {
      userPrompt = `Analyze the role of "${jobTitle}" at "${company}". Consider the specific industry and company context.`;
    } else {
      userPrompt = `Analyze the role of "${jobTitle}". Consider typical responsibilities across industries.`;
    }

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
                        relatedTasks: {
                          type: "array",
                          items: { type: "string", description: "Name of a task this skill helps address" },
                          description: "1-3 task names this skill maps to",
                        },
                      },
                      required: ["name", "priority", "category", "description", "resources", "relatedTasks"],
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
