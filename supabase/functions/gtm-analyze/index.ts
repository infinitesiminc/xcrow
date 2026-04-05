import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function searchApolloContacts(titles: string[], industry: string, company: any): Promise<any[]> {
  const APOLLO_API_KEY = Deno.env.get("APOLLO_API_KEY");
  if (!APOLLO_API_KEY) return [];

  try {
    const res = await fetch("https://api.apollo.io/v1/mixed_people/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": APOLLO_API_KEY,
      },
      body: JSON.stringify({
        person_titles: titles,
        q_organization_keyword_tags: industry ? [industry] : undefined,
        person_locations: ["United States"],
        organization_num_employees_ranges: company.employee_range ? [mapEmployeeRangeToApollo(company.employee_range)] : undefined,
        per_page: 10,
        page: 1,
      }),
    });

    if (!res.ok) {
      console.error("Apollo people search failed:", res.status, await res.text());
      return [];
    }

    const data = await res.json();
    return (data.people || []).map((p: any) => ({
      name: p.name || "Unknown",
      title: p.title || "",
      company: p.organization?.name || "",
      linkedin_url: p.linkedin_url || null,
      city: p.city || null,
      state: p.state || null,
      email: p.email || null,
      headline: p.headline || "",
      photo_url: p.photo_url || null,
      org_website: p.organization?.website_url || null,
      org_size: p.organization?.estimated_num_employees || null,
    }));
  } catch (e) {
    console.error("Apollo people search error:", e);
    return [];
  }
}

function mapEmployeeRangeToApollo(range: string): string {
  const map: Record<string, string> = {
    "1-10": "1,10",
    "11-50": "11,50",
    "51-200": "51,200",
    "201-500": "201,500",
    "501-1000": "501,1000",
    "1001-5000": "1001,5000",
    "5001-10000": "5001,10000",
    "10000+": "10001,1000000",
  };
  return map[range] || "1,10000";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { stepId, company, previousResults } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // LinkedIn Reveal: use Apollo people search + AI formatting
    if (stepId === "linkedin-reveal") {
      // Extract buyer titles from previous buyer-id step
      const buyerContent = previousResults?.["buyer-id"] || "";
      
      // Use AI to extract search titles from prior analysis
      const extractRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: "Extract the top 5 job titles to search for from this buyer analysis. Return ONLY a JSON array of strings, nothing else." },
            { role: "user", content: buyerContent || `Key buyer personas for ${company.name} in ${company.industry}` },
          ],
        }),
      });

      let searchTitles = ["VP Sales", "Head of Marketing", "CTO", "CEO", "Director of Operations"];
      if (extractRes.ok) {
        const extractData = await extractRes.json();
        const raw = extractData.choices?.[0]?.message?.content || "";
        try {
          const parsed = JSON.parse(raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
          if (Array.isArray(parsed) && parsed.length > 0) searchTitles = parsed.slice(0, 5);
        } catch { /* use defaults */ }
      }

      console.log("Searching Apollo for titles:", searchTitles, "industry:", company.industry);

      // Search Apollo for real people
      const people = await searchApolloContacts(searchTitles, company.industry || "", company);

      if (people.length === 0) {
        // Fallback: AI-generated guidance if Apollo returns nothing
        return await runAIStep(LOVABLE_API_KEY, {
          system: "You are a sales intelligence researcher.",
          user: `No live results found for ${company.name} (${company.industry}). Searched titles: ${searchTitles.join(", ")}.\n\nProvide LinkedIn Sales Navigator search filters and outreach templates that would find these buyers. Explain what to search.`,
        });
      }

      // Format real results with AI
      const peopleList = people.map((p, i) => 
        `${i + 1}. **${p.name}** — ${p.title} at ${p.company}${p.city ? ` (${p.city}${p.state ? `, ${p.state}` : ""})` : ""}${p.linkedin_url ? `\n   LinkedIn: ${p.linkedin_url}` : ""}${p.email ? `\n   Email: ${p.email}` : ""}${p.org_website ? `\n   Company: ${p.org_website}` : ""}`
      ).join("\n\n");

      const formatRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a GTM analyst presenting real prospect data. Format the results clearly. Add a brief note on why each person is a good prospect based on their title and company. Do NOT invent additional people." },
            { role: "user", content: `Company being analyzed: ${company.name} (${company.industry})\nDescription: ${company.description}\n\nReal prospects found matching your ICP:\n\n${peopleList}\n\nFormat these results with:\n1. A summary header (how many found, what titles)\n2. Each person as a clean profile card\n3. For the top 3, add a one-line personalized outreach opener` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "submit_analysis",
              description: "Submit formatted prospect list",
              parameters: {
                type: "object",
                properties: {
                  reasoning: { type: "string" },
                  content: { type: "string" },
                },
                required: ["reasoning", "content"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "submit_analysis" } },
        }),
      });

      if (!formatRes.ok) throw new Error("AI formatting failed");
      const formatData = await formatRes.json();
      const toolCall = formatData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("No formatted result");
      return respond(JSON.parse(toolCall.function.arguments));
    }

    // All other steps: AI-only analysis
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
        system: "You are a GTM strategist building a Product-Market Fit matrix. IMPORTANT: Do NOT use wide tables. Instead, present each product line as its own section with headers and bullet points. Use this format for each product:\n\n## Product Name\n- **Pain it solves:** ...\n- **Who feels this pain:** ...\n- **Budget source:** ...\n- **Entry point:** ...",
        user: `Company: ${company.name}\nDescription: ${company.description}\nIndustry: ${company.industry}\n\nFor each product line, analyze:\n- What PAIN does it solve?\n- WHO feels this pain? (job title + company type)\n- Where does the BUDGET come from? (IT, marketing, ops, C-suite)\n- What's the ENTRY POINT? (how would a seller get in the door?)\n\nPresent each product line as its own section. Be specific about pain points.`
      },
      "icp-tree": {
        system: "You are an ICP mapping specialist. Build a 3-layer niche tree.",
        user: `Company: ${company.name}\nDescription: ${company.description}\nIndustry: ${company.industry}\nEmployees: ${company.employee_range || "Unknown"}\n\nBuild a 3-layer ICP tree showing WHO would buy from this company:\n\nLevel 1 — Verticals (industries): 3-4 verticals\nLevel 2 — Segments (company types within each vertical): 2-3 per vertical\nLevel 3 — Personas (job titles): 2-3 per segment\n\nFor each persona, note if they're a Decision Maker (DM), Champion, or Influencer.`
      },
      "buyer-id": {
        system: "You are a sales intelligence analyst identifying decision makers.",
        user: `Company: ${company.name}\nDescription: ${company.description}\nIndustry: ${company.industry}\n\nIdentify the TOP 5 buyer personas who would purchase from ${company.name}:\n\n1. Job title + seniority\n2. Why THEY would buy (what pain do they feel?)\n3. Their role in the buying committee (DM / Champion / Influencer / Blocker)\n4. Best channel to reach them (LinkedIn / Email / Event / Referral)\n5. What would make them reply to cold outreach?\n\nBe specific — e.g. "VP of Engineering at Series B fintech with 50-200 employees scaling their data team".`
      },
    };

    const prompt = stepPrompts[stepId];
    if (!prompt) return respond({ content: "Unknown step.", reasoning: "" });

    return await runAIStep(LOVABLE_API_KEY, prompt);
  } catch (e) {
    console.error("gtm-analyze error:", e);
    return respond({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

async function runAIStep(apiKey: string, prompt: { system: string; user: string }) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      tools: [{
        type: "function",
        function: {
          name: "submit_analysis",
          description: "Submit the GTM analysis result",
          parameters: {
            type: "object",
            properties: {
              reasoning: { type: "string", description: "Brief explanation (1-2 sentences)" },
              content: { type: "string", description: "Full analysis, markdown formatted" },
            },
            required: ["reasoning", "content"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "submit_analysis" } },
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 429) return respond({ error: "Rate limited — please try again." }, 429);
    if (status === 402) return respond({ error: "Credits exhausted." }, 402);
    throw new Error("AI request failed");
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("No analysis returned");
  return respond(JSON.parse(toolCall.function.arguments));
}
