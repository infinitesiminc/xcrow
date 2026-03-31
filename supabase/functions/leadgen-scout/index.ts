import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { website, phone } = await req.json();
    if (!website || !phone) return json({ success: false, error: "website and phone required" }, 400);

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) return json({ success: false, error: "Firecrawl not configured" }, 500);

    // --- Step 1: Scrape user's website to understand their business ---
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
      console.error("Scrape returned no content:", scrapeData);
      return json({ success: false, error: "Could not read your website. Check the URL." }, 400);
    }

    console.log("Site content length:", siteContent.length);

    // --- Step 2: Use AI to extract ICP and build search queries ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use Lovable AI via gateway
    const aiRes = await fetch(`${supabaseUrl}/functions/v1/ai-gateway`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a lead generation expert. Analyze the website content and generate exactly 3 search queries to find potential customers/buyers for this business. 

Return JSON ONLY (no markdown):
{
  "company_summary": "one sentence about what this company does",
  "icp": "one sentence describing their ideal customer",
  "search_queries": ["query 1", "query 2", "query 3"]
}

Make queries specific — include job titles, industries, company types that would BUY from this business. Example: "VP Marketing SaaS companies hiring" or "ecommerce founders looking for logistics solutions".`,
          },
          {
            role: "user",
            content: `Website: ${formattedUrl}\n\nContent:\n${siteContent.slice(0, 4000)}`,
          },
        ],
      }),
    });

    const aiData = await aiRes.json();
    const aiText = aiData?.choices?.[0]?.message?.content || "";
    console.log("AI ICP response:", aiText.slice(0, 500));

    let icpData: { company_summary: string; icp: string; search_queries: string[] };
    try {
      const cleaned = aiText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      icpData = JSON.parse(cleaned);
    } catch {
      // Fallback queries
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

    // --- Step 3: Search for leads using Firecrawl search ---
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

    // --- Step 4: Use AI to extract structured leads from search results ---
    const searchSummary = allResults
      .slice(0, 10)
      .map((r: any) => `URL: ${r.url}\nTitle: ${r.title || ""}\nDescription: ${r.description || ""}\nContent: ${(r.markdown || "").slice(0, 500)}`)
      .join("\n---\n");

    const extractRes = await fetch(`${supabaseUrl}/functions/v1/ai-gateway`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a lead extraction expert. From the search results, extract up to 5 real people who could be potential customers for the business described.

Return JSON ONLY (no markdown):
{
  "leads": [
    {
      "name": "Full Name",
      "title": "Job Title",
      "company": "Company Name",
      "email": "email@example.com or null",
      "phone": "phone number or null", 
      "linkedin": "linkedin profile URL or null",
      "twitter": "twitter/X profile URL or null"
    }
  ]
}

Rules:
- Only include REAL people with real names (not generic contacts)
- Include as many contact details as you can find
- Prioritize decision-makers (founders, VPs, directors, managers)
- If you can't find 5, return what you have
- LinkedIn URLs should be full URLs like https://linkedin.com/in/username`,
          },
          {
            role: "user",
            content: `Business: ${icpData.company_summary}\nICP: ${icpData.icp}\n\nSearch Results:\n${searchSummary}`,
          },
        ],
      }),
    });

    const extractData = await extractRes.json();
    const extractText = extractData?.choices?.[0]?.message?.content || "";
    console.log("Extract response:", extractText.slice(0, 500));

    let leads: any[] = [];
    try {
      const cleaned = extractText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      leads = parsed.leads || [];
    } catch {
      console.error("Failed to parse leads");
      leads = [];
    }

    // Cap at 5
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
