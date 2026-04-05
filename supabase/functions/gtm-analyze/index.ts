import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { stepId, company } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const stepPrompts: Record<string, { system: string; user: string }> = {
      "company-dna": {
        system: "You are a GTM analyst. Analyze this company and extract key signals. Be specific and factual.",
        user: `Analyze this company:\nName: ${company.name}\nWebsite: ${company.website}\nDescription: ${company.description}\nIndustry: ${company.industry}\nEmployees: ${company.employee_range || company.estimated_employees || "Unknown"}\nFunding: ${company.funding_stage || "Unknown"}\nHQ: ${company.headquarters || "Unknown"}\nARR: ${company.estimated_arr || "Unknown"}\n\nExtract:\n1. What they actually do (one sentence)\n2. Who their customers are\n3. Their business model (SaaS, marketplace, etc.)\n4. Buying signals (are they growing? hiring? expanding?)\n5. Tech maturity level`
      },
      "product-map": {
        system: "You are a product analyst. Map this company's product lines.",
        user: `Company: ${company.name}\nDescription: ${company.description}\nWebsite: ${company.website}\nIndustry: ${company.industry}\n\nMap their product portfolio:\n- Product Line name\n- Target user (who uses it)\n- Pricing model (per-seat, usage, enterprise, freemium)\n- Key competitors for THIS specific product line\n\nList each product line separately. Be accurate over comprehensive.`
      },
      "pmf-matrix": {
        system: "You are a GTM strategist building a Product-Market Fit matrix.",
        user: `Company: ${company.name}\nDescription: ${company.description}\nIndustry: ${company.industry}\n\nFor each product line:\n- What PAIN does it solve?\n- WHO feels this pain? (job title + company type)\n- Where does the BUDGET come from? (IT, marketing, ops, C-suite)\n- What's the ENTRY POINT? (how would a seller get in the door?)\n\nFormat as a clear matrix. Be specific about pain points.`
      },
      "icp-tree": {
        system: "You are an ICP mapping specialist. Build a 3-layer niche tree.",
        user: `Company: ${company.name}\nDescription: ${company.description}\nIndustry: ${company.industry}\nEmployees: ${company.employee_range || "Unknown"}\n\nBuild a 3-layer ICP tree showing WHO would buy from this company:\n\nLevel 1 — Verticals (industries): 3-4 verticals\nLevel 2 — Segments (company types within each vertical): 2-3 per vertical\nLevel 3 — Personas (job titles): 2-3 per segment\n\nFor each persona, note if they're a Decision Maker (DM), Champion, or Influencer.`
      },
      "buyer-id": {
        system: "You are a sales intelligence analyst identifying decision makers.",
        user: `Company: ${company.name}\nDescription: ${company.description}\nIndustry: ${company.industry}\n\nIdentify the TOP 5 buyer personas who would purchase from ${company.name}:\n\n1. Job title + seniority\n2. Why THEY would buy (what pain do they feel?)\n3. Their role in the buying committee (DM / Champion / Influencer / Blocker)\n4. Best channel to reach them (LinkedIn / Email / Event / Referral)\n5. What would make them reply to cold outreach?\n\nBe specific — e.g. "VP of Engineering at Series B fintech with 50-200 employees scaling their data team".`
      },
      "linkedin-reveal": {
        system: "You are a sales intelligence researcher. Provide actionable LinkedIn search criteria and outreach templates.",
        user: `Company: ${company.name}\nIndustry: ${company.industry}\nDescription: ${company.description}\n\nProvide:\n\n1. EXACT LinkedIn Sales Navigator search filters:\n   - Job titles to search\n   - Company size range\n   - Industry filters\n   - Geography\n   - Keywords\n\n2. For each of the top 3 personas:\n   - What their LinkedIn headline typically looks like\n   - What to look for in their profile (posts, activity, job changes)\n   - Opening line for a connection request\n\n3. OUTREACH TEMPLATE for the #1 persona:\n   - Subject line\n   - 3-sentence email\n   - LinkedIn connection note (300 chars max)\n\nMake this actionable — someone should be able to copy these filters into Sales Navigator immediately.`
      },
    };

    const prompt = stepPrompts[stepId];
    if (!prompt) {
      return new Response(JSON.stringify({ content: "Unknown step.", reasoning: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tools = [{
      type: "function",
      function: {
        name: "submit_analysis",
        description: "Submit the GTM analysis result",
        parameters: {
          type: "object",
          properties: {
            reasoning: { type: "string", description: "Brief explanation of the analytical approach (1-2 sentences)" },
            content: { type: "string", description: "The full analysis output, formatted with markdown" },
          },
          required: ["reasoning", "content"],
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
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "submit_analysis" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", status, t);
      throw new Error("AI request failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No analysis returned");

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("gtm-analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
