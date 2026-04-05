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

async function searchApolloContacts(titles: string[], company: any): Promise<any[]> {
  const APOLLO_API_KEY = Deno.env.get("APOLLO_API_KEY");
  if (!APOLLO_API_KEY) {
    console.warn("APOLLO_API_KEY not set — skipping people search");
    return [];
  }

  // Extract domain from company website for precise matching
  let domain = "";
  try {
    if (company.website) {
      domain = new URL(company.website.startsWith("http") ? company.website : `https://${company.website}`).hostname.replace(/^www\./, "");
    }
  } catch { /* ignore */ }

  try {
    const searchBody: Record<string, unknown> = {
      person_titles: titles,
      per_page: 10,
      page: 1,
    };

    // Prefer domain match (finds people AT this company), fall back to name
    if (domain) {
      searchBody.q_organization_domains = domain;
    } else {
      searchBody.q_organization_name = company.name;
    }

    console.log("Apollo search:", JSON.stringify(searchBody));

    const searchRes = await fetch("https://api.apollo.io/api/v1/mixed_people/api_search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": APOLLO_API_KEY },
      body: JSON.stringify(searchBody),
    });

    if (!searchRes.ok) {
      console.error("Apollo api_search failed:", searchRes.status, await searchRes.text());
      return [];
    }

    const searchData = await searchRes.json();
    const partialPeople = searchData.people || [];
    if (partialPeople.length === 0) {
      console.log("Apollo returned 0 people for domain:", domain, "name:", company.name);
      return [];
    }

    // Enrich with bulk_match for full profiles
    const details = partialPeople.slice(0, 10).map((p: any) => ({ id: p.id })).filter((d: any) => d.id);
    let enrichedPeople = partialPeople;

    if (details.length > 0) {
      try {
        const enrichRes = await fetch("https://api.apollo.io/api/v1/people/bulk_match", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Api-Key": APOLLO_API_KEY },
          body: JSON.stringify({ details, reveal_personal_emails: false }),
        });
        if (enrichRes.ok) {
          const enrichData = await enrichRes.json();
          if (enrichData.people?.length) enrichedPeople = enrichData.people;
        }
      } catch (e) {
        console.warn("Apollo bulk_match error, using partial data:", e);
      }
    }

    return enrichedPeople.map((p: any) => ({
      name: p.name || (p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : (p.first_name || "Unknown")),
      title: p.title || "",
      company: p.organization?.name || p.organization_name || company.name,
      linkedin_url: p.linkedin_url || null,
      city: p.city || null,
      state: p.state || null,
      email: p.email || null,
      headline: p.headline || "",
      photo_url: p.photo_url || null,
    }));
  } catch (e) {
    console.error("Apollo people search error:", e);
    return [];
  }
}

function mapEmployeeRangeToApollo(range: string): string {
  const map: Record<string, string> = {
    "1-10": "1,10", "11-50": "11,50", "51-200": "51,200",
    "201-500": "201,500", "501-1000": "501,1000", "1001-5000": "1001,5000",
    "5001-10000": "5001,10000", "10000+": "10001,1000000",
  };
  return map[range] || "1,10000";
}

const CONCISE = "Be concise. Use bullets and short sections. Under 250 words total.";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { stepId, company, previousResults } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prevProduct = previousResults?.["product-map"] || "";
    const prevPMF = previousResults?.["pmf-matrix"] || "";
    const prevICP = previousResults?.["icp-tree"] || "";
    const prevBuyer = previousResults?.["buyer-id"] || "";

    // LinkedIn Reveal: Apollo + AI formatting with product traceability
    if (stepId === "linkedin-reveal") {
      const extractRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: "Extract the top 5 decision-maker job titles from this buyer analysis. Return ONLY a JSON array of strings." },
            { role: "user", content: prevBuyer || `Key buyer personas for ${company.name} in ${company.industry}` },
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

      console.log("Searching Apollo for titles:", searchTitles);
      const people = await searchApolloContacts(searchTitles, company);

      if (people.length === 0) {
        return await runAIStep(LOVABLE_API_KEY, {
          system: "You are a sales intelligence researcher.",
          user: `No live results for ${company.name}. Searched: ${searchTitles.join(", ")}.\n\nProvide LinkedIn Sales Navigator search filters and outreach templates.`,
        });
      }

      const peopleList = people.map((p: any, i: number) =>
        `${i + 1}. ${p.name} — ${p.title} at ${p.company}${p.city ? ` (${p.city}${p.state ? `, ${p.state}` : ""})` : ""}${p.linkedin_url ? `\n   LinkedIn: ${p.linkedin_url}` : ""}${p.email ? `\n   Email: ${p.email}` : ""}`
      ).join("\n\n");

      const formatRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: `You are a GTM analyst mapping real prospects to specific product lines. ${CONCISE}

CRITICAL: For each person, map them to a specific product line (P1, P2, etc.) from the product analysis and tag their role (Decision Maker, Champion, or Influencer).

Use this format per person:
**Name** — Title at Company
📦 Product: P# (Product Name)
🎯 Role: Decision Maker / Champion / Influencer — why
🔗 LinkedIn: url
📧 Email: email

Do NOT invent people. Only format the real data provided.` },
            { role: "user", content: `Company: ${company.name}\nProduct lines:\n${prevProduct}\n\nBuyer personas:\n${prevBuyer}\n\nReal prospects found:\n\n${peopleList}\n\nMap each person to a product line and role.` },
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

    // All other steps
    const stepPrompts: Record<string, { system: string; user: string }> = {
      "company-dna": {
        system: `You are a GTM analyst extracting company signals. ${CONCISE}`,
        user: `Analyze this company:\nName: ${company.name}\nWebsite: ${company.website}\nDescription: ${company.description}\nIndustry: ${company.industry}\nEmployees: ${company.employee_range || company.estimated_employees || "Unknown"}\nFunding: ${company.funding_stage || "Unknown"}\nHQ: ${company.headquarters || "Unknown"}\n\nExtract:\n1. What they do (one sentence)\n2. Who their customers are\n3. Business model\n4. Buying signals\n5. Tech maturity`,
      },
      "product-map": {
        system: `You are a product analyst. ${CONCISE}\n\nCRITICAL: Assign each product line a short ID: P1, P2, P3, etc. These IDs will be referenced in all subsequent steps.\n\nFormat:\n## P1 — Product Name\n- **Target user:** ...\n- **Pricing:** ...\n- **Competitors:** ...`,
        user: `Company: ${company.name}\nDescription: ${company.description}\nWebsite: ${company.website}\nIndustry: ${company.industry}\n\nMap every product line with a unique ID (P1, P2, P3...).`,
      },
      "pmf-matrix": {
        system: `You are a GTM strategist. ${CONCISE}\n\nReference product IDs (P1, P2...) from the product map. Present each product as its own section:\n\n## P1 — Product Name\n- **Pain:** ...\n- **Who feels it:** ...\n- **Budget source:** ...\n- **Entry point:** ...`,
        user: `Company: ${company.name}\nIndustry: ${company.industry}\n\nProduct lines identified:\n${prevProduct}\n\nFor each product (using their P# IDs), analyze pain, buyer, budget source, and entry point.`,
      },
      "icp-tree": {
        system: `You are an ICP mapping specialist. ${CONCISE}\n\nBuild the ICP tree PER PRODUCT LINE using their P# IDs.\n\nFormat:\n## P1 — Product Name\n### Vertical: Industry\n- **Segment:** Company type → Persona (DM/Champion/Influencer)`,
        user: `Company: ${company.name}\nIndustry: ${company.industry}\n\nProduct lines:\n${prevProduct}\n\nPMF matrix:\n${prevPMF}\n\nBuild a 3-layer ICP tree (Vertical→Segment→Persona) for each product line. Tag each persona as DM, Champion, or Influencer.`,
      },
      "buyer-id": {
        system: `You are a sales intelligence analyst. ${CONCISE}\n\nGroup buyers BY PRODUCT LINE using P# IDs. For each buyer specify:\n- Title + seniority\n- Role: Decision Maker / Champion / Influencer\n- Why they buy THIS specific product\n- Best outreach channel\n\nFormat:\n## P1 — Product Name\n1. **Title** — Role (DM/Champion) — Why they buy — Channel`,
        user: `Company: ${company.name}\nIndustry: ${company.industry}\n\nProduct lines:\n${prevProduct}\n\nICP tree:\n${prevICP}\n\nIdentify the top buyers PER PRODUCT LINE. Group by P# ID. Tag each as DM, Champion, or Influencer.`,
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
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
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
