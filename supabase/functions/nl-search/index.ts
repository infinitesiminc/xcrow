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
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Step 1: Use AI to interpret the natural language query
    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `You extract structured search filters from natural language job search queries. Extract the relevant fields to search a jobs database. Be generous with synonyms and related terms.`,
            },
            {
              role: "user",
              content: query.trim(),
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "search_jobs",
                description:
                  "Search the jobs database with structured filters extracted from a natural language query.",
                parameters: {
                  type: "object",
                  properties: {
                    title_keywords: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "Job title keywords/synonyms to search for (e.g. for 'coding jobs' → ['software engineer', 'developer', 'programmer']). Include the original term and common professional synonyms.",
                    },
                    department_keywords: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "Department/field keywords (e.g. 'engineering', 'marketing', 'finance')",
                    },
                    company_keywords: {
                      type: "array",
                      items: { type: "string" },
                      description: "Company name keywords if mentioned",
                    },
                    seniority: {
                      type: "string",
                      enum: [
                        "junior",
                        "mid",
                        "senior",
                        "lead",
                        "manager",
                        "director",
                        "vp",
                        "c_level",
                      ],
                      description: "Seniority level if mentioned",
                    },
                    country: {
                      type: "string",
                      description:
                        "Country name if location is mentioned (full name, e.g. 'United States', 'United Kingdom')",
                    },
                    work_mode: {
                      type: "string",
                      enum: ["remote", "hybrid", "onsite"],
                      description: "Work mode if mentioned",
                    },
                    risk_preference: {
                      type: "string",
                      enum: ["low_risk", "high_risk"],
                      description:
                        "If user asks for 'safe' or 'future-proof' roles → low_risk. If they ask about 'most at risk' or 'most automated' → high_risk.",
                    },
                  },
                  required: ["title_keywords"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "search_jobs" },
          },
        }),
      }
    );

    if (!aiRes.ok) {
      // Fallback: just return empty, let client do basic ilike
      console.error("AI gateway error:", aiRes.status, await aiRes.text());
      return new Response(JSON.stringify({ results: [], fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ results: [], fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const filters = JSON.parse(toolCall.function.arguments);
    console.log("NL search filters:", JSON.stringify(filters));

    // Step 2: Build and execute Supabase query
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Build OR conditions for title keywords using ilike
    const titleKeywords: string[] = filters.title_keywords || [];
    const deptKeywords: string[] = filters.department_keywords || [];
    const companyKeywords: string[] = filters.company_keywords || [];

    // We'll run parallel queries for each title keyword and merge
    const queries = titleKeywords.slice(0, 5).map((kw: string) => {
      let q = sb
        .from("jobs")
        .select(
          "id, title, department, seniority, country, work_mode, automation_risk_percent, augmented_percent, companies(name, industry)"
        )
        .ilike("title", `%${kw}%`);

      if (filters.seniority) q = q.eq("seniority", filters.seniority);
      if (filters.country) q = q.ilike("country", `%${filters.country}%`);
      if (filters.work_mode) q = q.eq("work_mode", filters.work_mode);

      if (filters.risk_preference === "high_risk") {
        q = q.order("automation_risk_percent", { ascending: false });
      } else if (filters.risk_preference === "low_risk") {
        q = q.order("automation_risk_percent", { ascending: true });
      } else {
        q = q.order("augmented_percent", { ascending: false });
      }

      return q.limit(6);
    });

    // Also search by department if provided
    if (deptKeywords.length > 0) {
      for (const dk of deptKeywords.slice(0, 2)) {
        queries.push(
          sb
            .from("jobs")
            .select(
              "id, title, department, seniority, country, work_mode, automation_risk_percent, augmented_percent, companies(name, industry)"
            )
            .ilike("department", `%${dk}%`)
            .order("augmented_percent", { ascending: false })
            .limit(6)
        );
      }
    }

    // Search by company name
    if (companyKeywords.length > 0) {
      for (const ck of companyKeywords.slice(0, 2)) {
        queries.push(
          sb
            .from("jobs")
            .select(
              "id, title, department, seniority, country, work_mode, automation_risk_percent, augmented_percent, companies!inner(name, industry)"
            )
            .ilike("companies.name", `%${ck}%`)
            .order("augmented_percent", { ascending: false })
            .limit(6)
        );
      }
    }

    const results = await Promise.all(queries);
    const allJobs = results.flatMap((r) => r.data || []);

    // Deduplicate
    const seen = new Set<string>();
    const unique = allJobs
      .filter((j: any) => {
        if (seen.has(j.id)) return false;
        seen.add(j.id);
        return true;
      })
      .slice(0, 10);

    const mapped = unique.map((j: any) => ({
      id: j.id,
      title: j.title,
      department: j.department,
      automation_risk_percent: j.automation_risk_percent,
      augmented_percent: j.augmented_percent,
      company_name: j.companies?.name || null,
      industry: j.companies?.industry || null,
      seniority: j.seniority,
      country: j.country,
      work_mode: j.work_mode,
    }));

    return new Response(
      JSON.stringify({ results: mapped, filters, fallback: false }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("nl-search error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
        results: [],
        fallback: true,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
