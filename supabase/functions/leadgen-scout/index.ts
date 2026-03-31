const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function aiCall(prompt: string, userContent: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("AI gateway error:", res.status, err);
    throw new Error(`AI call failed: ${res.status}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { website, phone } = await req.json();
    if (!website || !phone) return json({ success: false, error: "website and phone required" }, 400);

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) return json({ success: false, error: "Firecrawl not configured" }, 500);

    // --- Step 1: Scrape user's website ---
    let formattedUrl = website.trim();
    if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

    console.log("Scraping website:", formattedUrl);

    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    const scrapeData = await scrapeRes.json();
    const siteContent = scrapeData?.data?.markdown || scrapeData?.markdown || "";

    if (!siteContent) {
      console.error("Scrape returned no content:", JSON.stringify(scrapeData).slice(0, 300));
      return json({ success: false, error: "Could not read your website. Check the URL." }, 400);
    }

    console.log("Site content length:", siteContent.length);

    // --- Step 2: AI extracts ICP and builds search queries ---
    const icpText = await aiCall(
      `You are a lead generation expert. Analyze the website content and generate exactly 3 search queries to find potential customers/buyers for this business. 

Return JSON ONLY (no markdown fences):
{
  "company_summary": "one sentence about what this company does",
  "icp": "one sentence describing their ideal customer",
  "search_queries": ["query 1", "query 2", "query 3"]
}

Make queries specific — include job titles, industries, company types that would BUY from this business.`,
      `Website: ${formattedUrl}\n\nContent:\n${siteContent.slice(0, 4000)}`
    );

    console.log("AI ICP response:", icpText.slice(0, 500));

    let icpData: { company_summary: string; icp: string; search_queries: string[] };
    try {
      const cleaned = icpText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      icpData = JSON.parse(cleaned);
    } catch {
      const domain = new URL(formattedUrl).hostname.replace("www.", "");
      icpData = {
        company_summary: `Business at ${domain}`,
        icp: "potential customers",
        search_queries: [
          `${domain} competitors customers`,
          `companies similar to ${domain}`,
          `who buys from ${domain}`,
        ],
      };
    }

    // --- Step 3: Firecrawl search for leads ---
    console.log("Searching with queries:", icpData.search_queries);

    const allResults: any[] = [];
    for (const query of icpData.search_queries.slice(0, 3)) {
      try {
        const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `${query} contact email linkedin`,
            limit: 5,
          }),
        });
        const searchData = await searchRes.json();
        const results = searchData?.data || [];
        allResults.push(...results);
      } catch (e) {
        console.error("Search query failed:", query, e);
      }
    }

    console.log("Total search results:", allResults.length);

    // --- Step 4: AI extracts structured leads ---
    const searchSummary = allResults
      .slice(0, 10)
      .map((r: any) => `URL: ${r.url}\nTitle: ${r.title || ""}\nDesc: ${r.description || ""}\nContent: ${(r.markdown || "").slice(0, 500)}`)
      .join("\n---\n");

    const extractText = await aiCall(
      `You are a lead extraction expert. From the search results, extract up to 5 real people who could be potential customers for the business described.

Return JSON ONLY (no markdown fences):
{
  "leads": [
    {
      "name": "Full Name",
      "title": "Job Title",
      "company": "Company Name",
      "email": "email@example.com or null",
      "phone": "phone number or null",
      "linkedin": "https://linkedin.com/in/username or null",
      "twitter": "https://x.com/username or null"
    }
  ]
}

Rules:
- Only include REAL people with real names
- Prioritize decision-makers (founders, VPs, directors)
- Include as many contact details as possible
- If you can't find 5, return what you have`,
      `Business: ${icpData.company_summary}\nICP: ${icpData.icp}\n\nSearch Results:\n${searchSummary}`
    );

    console.log("Extract response:", extractText.slice(0, 500));

    let leads: any[] = [];
    try {
      const cleaned = extractText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      leads = parsed.leads || [];
    } catch {
      console.error("Failed to parse leads JSON");
      leads = [];
    }

    leads = leads.slice(0, 5);
    console.log(`Returning ${leads.length} leads`);

    return json({ success: true, leads, icp: icpData.icp });
  } catch (error) {
    console.error("Leadgen error:", error);
    return json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      500
    );
  }
});
