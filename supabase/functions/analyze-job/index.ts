import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `You are an AI job impact analyst. Given a job title and/or job description, and optional company name, analyze how AI is transforming that role at the task level.

You MUST respond by calling the "job_analysis" function with structured data. Do not return plain text.

If a job description is provided, use it as the PRIMARY source for identifying tasks. Extract real responsibilities from the JD rather than guessing generic ones. Also extract the exact job title from the JD if no title was provided separately.

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

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

interface DbJob {
  id: string;
  title: string;
  automation_risk_percent: number | null;
  augmented_percent: number | null;
  new_skills_percent: number | null;
  department: string | null;
  company_id: string | null;
  similarity?: number;
}

interface DbSkill {
  name: string;
  category: string | null;
  priority: string | null;
  description: string | null;
}

interface IndustryBenchmark {
  industry: string;
  totalRoles: number;
  avgAutomationRisk: number;
  avgAugmented: number;
  rolesInSameIndustry: { title: string; automationRisk: number; augmented: number }[];
}

async function findMatchingJob(sb: any, jobTitle: string): Promise<{ job: DbJob | null; skills: DbSkill[] }> {
  if (!jobTitle) return { job: null, skills: [] };

  // Use trigram similarity for fuzzy matching
  const { data: matches } = await sb.rpc("similarity_search_jobs", { search_title: jobTitle.toLowerCase() });
  
  // Fallback to ilike if rpc doesn't exist
  if (!matches || matches.length === 0) {
    const { data } = await sb
      .from("jobs")
      .select("id, title, automation_risk_percent, augmented_percent, new_skills_percent, department, company_id")
      .ilike("title", `%${jobTitle}%`)
      .limit(1);
    
    if (!data || data.length === 0) return { job: null, skills: [] };
    
    const job = data[0];
    const { data: skills } = await sb
      .from("job_skills")
      .select("name, category, priority, description")
      .eq("job_id", job.id)
      .order("priority", { ascending: true });
    
    return { job, skills: skills || [] };
  }

  const job = matches[0];
  const { data: skills } = await sb
    .from("job_skills")
    .select("name, category, priority, description")
    .eq("job_id", job.id)
    .order("priority", { ascending: true });

  return { job, skills: skills || [] };
}

async function getIndustryBenchmark(sb: any, companyName?: string, jobTitle?: string): Promise<IndustryBenchmark | null> {
  // First try to find the company's industry
  let industry: string | null = null;

  if (companyName) {
    const { data: companies } = await sb
      .from("companies")
      .select("industry")
      .ilike("name", `%${companyName}%`)
      .limit(1);
    
    if (companies && companies.length > 0) {
      industry = companies[0].industry;
    }
  }

  // If no industry found from company, try to infer from the matched job
  if (!industry && jobTitle) {
    const { data } = await sb
      .from("jobs")
      .select("company_id")
      .ilike("title", `%${jobTitle}%`)
      .limit(1);
    
    if (data && data.length > 0 && data[0].company_id) {
      const { data: comp } = await sb
        .from("companies")
        .select("industry")
        .eq("id", data[0].company_id)
        .single();
      if (comp) industry = comp.industry;
    }
  }

  if (!industry) return null;

  // Get all jobs in this industry that have been analyzed (non-zero scores)
  const { data: industryJobs } = await sb
    .from("jobs")
    .select("title, automation_risk_percent, augmented_percent, company_id, companies!inner(industry)")
    .eq("companies.industry", industry)
    .gt("automation_risk_percent", 0)
    .limit(100);

  // Also get total count of roles in this industry
  const { count } = await sb
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("companies.industry", industry);

  const analyzed = industryJobs || [];
  if (analyzed.length === 0) {
    return { industry, totalRoles: count || 0, avgAutomationRisk: 0, avgAugmented: 0, rolesInSameIndustry: [] };
  }

  const avgRisk = Math.round(analyzed.reduce((s: number, j: any) => s + (j.automation_risk_percent || 0), 0) / analyzed.length);
  const avgAug = Math.round(analyzed.reduce((s: number, j: any) => s + (j.augmented_percent || 0), 0) / analyzed.length);

  return {
    industry,
    totalRoles: count || analyzed.length,
    avgAutomationRisk: avgRisk,
    avgAugmented: avgAug,
    rolesInSameIndustry: analyzed.slice(0, 5).map((j: any) => ({
      title: j.title,
      automationRisk: j.automation_risk_percent || 0,
      augmented: j.augmented_percent || 0,
    })),
  };
}

async function storeAnalysisResults(sb: any, jobId: string, summary: any) {
  try {
    await sb.from("jobs").update({
      automation_risk_percent: summary.automationRiskPercent,
      augmented_percent: summary.augmentedPercent,
      new_skills_percent: summary.newSkillsPercent,
    }).eq("id", jobId);
    console.log("Stored analysis results back to job:", jobId);
  } catch (e) {
    console.error("Failed to store results:", e);
  }
}

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

    const sb = getSupabaseAdmin();

    // Usage gating: check if authenticated user has remaining analyses
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabaseAnon = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseAnon.auth.getUser(token);
        // Usage limits removed — platform is free for all users
    }

    // 0. Check cache first (only for title-only queries without custom JD)
    const cacheKey = {
      title: (jobTitle || "").trim().toLowerCase(),
      company: (company || "").trim().toLowerCase(),
    };

    if (!jobDescription && !jdUrl && cacheKey.title) {
      const { data: cached } = await sb
        .from("cached_analyses")
        .select("result")
        .eq("job_title_lower", cacheKey.title)
        .eq("company_lower", cacheKey.company)
        .maybeSingle();

      if (cached?.result) {
        console.log("Cache hit for:", cacheKey.title);
        return new Response(JSON.stringify(cached.result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("Cache miss for:", cacheKey.title);
    }

    // 1. Look up matching job in DB
    const { job: matchedJob, skills: curatedSkills } = await findMatchingJob(sb, jobTitle);
    console.log("DB match:", matchedJob?.title || "none", "skills:", curatedSkills.length);

    // 2. If the matched job already has analysis scores and no JD was provided, return cached results
    if (matchedJob && matchedJob.automation_risk_percent && matchedJob.automation_risk_percent > 0 && !jobDescription && !jdUrl) {
      // We have cached results — but we still need tasks/skills from AI
      // So we'll still call AI but inject the cached scores context
      console.log("Found cached scores for:", matchedJob.title);
    }

    // 3. Get industry benchmark
    const benchmark = await getIndustryBenchmark(sb, company, jobTitle);
    console.log("Industry benchmark:", benchmark?.industry || "none");

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

    // Build enriched prompt with DB context
    let userPrompt = "";
    if (truncatedJd && jobTitle) {
      userPrompt = `Analyze the role of "${jobTitle}"${company ? ` at "${company}"` : ""}.\n\nHere is the actual job description — use it to identify the real tasks and responsibilities:\n\n---\n${truncatedJd}\n---`;
    } else if (truncatedJd) {
      userPrompt = `Analyze the role described in the following job description${company ? ` at "${company}"` : ""}. Extract the job title from it.\n\n---\n${truncatedJd}\n---`;
    } else if (company) {
      userPrompt = `Analyze the role of "${jobTitle}" at "${company}". Consider the specific industry and company context.`;
    } else {
      userPrompt = `Analyze the role of "${jobTitle}". Consider typical responsibilities across industries.`;
    }

    // Inject curated skills context if available
    if (curatedSkills.length > 0) {
      const skillsList = curatedSkills.map((s, i) => `${i + 1}. ${s.name}`).join("\n");
      userPrompt += `\n\nIMPORTANT: Our database identifies these as the KEY HUMAN SKILLS for this role (prioritized). Factor them into your analysis — especially when recommending "human_skills" category skills:\n${skillsList}`;
    }

    // Inject industry context if available
    if (benchmark && benchmark.avgAutomationRisk > 0) {
      userPrompt += `\n\nINDUSTRY CONTEXT: In the "${benchmark.industry}" industry, the average automation risk across ${benchmark.totalRoles} analyzed roles is ${benchmark.avgAutomationRisk}% and average augmentation is ${benchmark.avgAugmented}%. Use this for calibration.`;
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
                  extractedJobTitle: { type: "string", description: "The job title extracted from the JD or confirmed from input" },
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
                        aiExposureScore: { type: "number", description: "0-100: how much AI tools can currently handle this task. 80+ means AI does most of it, 20- means deeply human." },
                        jobImpactScore: { type: "number", description: "0-100: how critical this task is to overall role success. 80+ is core responsibility, 20- is peripheral." },
                        priority: { type: "string", enum: ["high", "medium", "low"], description: "Learning urgency: high = must upskill now, low = can defer" },
                      },
                      required: ["name", "currentState", "trend", "impactLevel", "description", "aiExposureScore", "jobImpactScore", "priority"],
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
                  compensation: {
                    type: "object",
                    description: "Salary/compensation data extracted from the JD. Only populate if explicitly mentioned.",
                    properties: {
                      salaryMin: { type: "number", description: "Minimum salary as integer" },
                      salaryMax: { type: "number", description: "Maximum salary as integer" },
                      salaryCurrency: { type: "string", description: "ISO currency code (e.g. USD, GBP, EUR)" },
                      salaryPeriod: { type: "string", enum: ["annual", "hourly"], description: "Keep original period" },
                      equityText: { type: "string", description: "Equity/stock/RSU text if mentioned" },
                    },
                    required: ["salaryMin", "salaryMax", "salaryCurrency", "salaryPeriod"],
                    additionalProperties: false,
                  },
                },
                required: ["extractedJobTitle", "summary", "tasks", "skills"],
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

    const responseText = await response.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.error("Failed to parse AI response body:", responseText.slice(0, 500));
      return new Response(JSON.stringify({ error: "AI returned an invalid response. Please try again." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let analysis: any;
    try {
      analysis = JSON.parse(toolCall.function.arguments);
    } catch (parseErr) {
      console.error("Failed to parse tool call arguments:", toolCall.function.arguments?.slice(0, 500));
      return new Response(JSON.stringify({ error: "AI returned malformed analysis. Please try again." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store results back to DB if we had a match
    if (matchedJob) {
      await storeAnalysisResults(sb, matchedJob.id, analysis.summary);
    }

    const result: Record<string, unknown> = {
      jobTitle: jobTitle || analysis.extractedJobTitle || "Unknown Role",
      company: company || "",
      summary: analysis.summary,
      tasks: analysis.tasks,
      skills: analysis.skills,
    };

    // Add compensation data if extracted
    if (analysis.compensation && analysis.compensation.salaryMin) {
      result.compensation = analysis.compensation;
      // Store salary to DB if we had a matched job
      if (matchedJob) {
        await sb.from("jobs").update({
          salary_min: analysis.compensation.salaryMin,
          salary_max: analysis.compensation.salaryMax,
          salary_currency: analysis.compensation.salaryCurrency || "USD",
          salary_period: analysis.compensation.salaryPeriod || "annual",
          ...(analysis.compensation.equityText ? { equity_text: analysis.compensation.equityText } : {}),
        }).eq("id", matchedJob.id);
      }
    }

    // Add curated skills from DB
    if (curatedSkills.length > 0) {
      result.curatedSkills = curatedSkills.map(s => ({
        name: s.name,
        priority: s.priority,
        category: s.category || "human_skills",
      }));
    }

    // Add industry benchmark
    if (benchmark) {
      result.industryBenchmark = benchmark;
    }

    // Flag if this was a DB-enhanced result
    result.dbEnhanced = !!(matchedJob || curatedSkills.length > 0 || benchmark);

    // Store in cache for future lookups (only title-based queries)
    if (!jobDescription && !jdUrl && cacheKey.title) {
      try {
        const { error: cacheErr } = await sb.from("cached_analyses").upsert({
          job_title_lower: cacheKey.title,
          company_lower: cacheKey.company,
          result,
        }, { onConflict: "job_title_lower,company_lower" });
        if (cacheErr) console.error("Cache store error:", JSON.stringify(cacheErr));
        else console.log("Cached result for:", cacheKey.title, "at", cacheKey.company);
      } catch (e) {
        console.error("Cache store exception:", e);
      }
    }

    // Also save to analysis_history if user is authenticated
    if (authHeader) {
      try {
        const supabaseAnon = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!
        );
        const token = authHeader.replace("Bearer ", "");
        const { data: userData } = await supabaseAnon.auth.getUser(token);
        if (userData?.user) {
          const userId = userData.user.id;
          const jobTitleFinal = result.jobTitle as string || jobTitle || "";
          const companyFinal = (result.company as string) || company || null;
          
          // Upsert into analysis_history
          const { data: existing } = await sb.from("analysis_history")
            .select("id")
            .eq("user_id", userId)
            .eq("job_title", jobTitleFinal)
            .eq("company", companyFinal || "")
            .maybeSingle();
          
          if (existing) {
            await sb.from("analysis_history").update({
              tasks_count: (analysis.tasks || []).length,
              augmented_percent: analysis.summary?.augmentedPercent || 0,
              automation_risk_percent: analysis.summary?.automationRiskPercent || 0,
              analyzed_at: new Date().toISOString(),
            }).eq("id", existing.id);
          } else {
            await sb.from("analysis_history").insert({
              user_id: userId,
              job_title: jobTitleFinal,
              company: companyFinal,
              tasks_count: (analysis.tasks || []).length,
              augmented_percent: analysis.summary?.augmentedPercent || 0,
              automation_risk_percent: analysis.summary?.automationRiskPercent || 0,
            });
          }
          console.log("Saved analysis_history for user:", userId, jobTitleFinal);
        }
      } catch (e) {
        console.error("Failed to save analysis_history:", e);
      }
    }

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
