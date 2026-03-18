import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { website, careers_url, company_id } = await req.json();
    if (!website && !careers_url) {
      return respond({ error: "website or careers_url is required" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    // Normalise URL
    let url = (website || "").trim();
    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    let markdown = "";
    let pageTitle = "";

    // Step 0: If we have a careers_url, scrape it first to find the real company website
    if (careers_url) {
      let atsUrl = careers_url.trim();
      if (!atsUrl.startsWith("http://") && !atsUrl.startsWith("https://")) {
        atsUrl = `https://${atsUrl}`;
      }
      console.log("Scraping ATS page first:", atsUrl);
      try {
        const atsRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: atsUrl,
            formats: ["links", "markdown"],
            onlyMainContent: false,
          }),
        });
        const atsData = await atsRes.json();
        const links: string[] = atsData?.data?.links || atsData?.links || [];
        const atsMarkdown = atsData?.data?.markdown || atsData?.markdown || "";

        // Find the company website from the ATS page links
        // Look for links that are NOT the ATS platform itself
        const atsHosts = ["greenhouse.io", "ashby.io", "lever.co", "smartrecruiters.com", "myworkdayjobs.com", "workday.com"];
        const candidateLinks = links.filter((l: string) => {
          try {
            const h = new URL(l).hostname.toLowerCase();
            return !atsHosts.some(ah => h.includes(ah)) && !h.includes("linkedin.") && !h.includes("facebook.") && !h.includes("twitter.") && !h.includes("instagram.");
          } catch { return false; }
        });

        if (candidateLinks.length > 0) {
          // Prefer the shortest/most root-like URL as the company website
          const sorted = candidateLinks.sort((a: string, b: string) => a.length - b.length);
          const foundUrl = sorted[0];
          console.log("Found company website from ATS page:", foundUrl);
          url = foundUrl;
        }

        // Use ATS page content as supplementary
        if (atsMarkdown) {
          markdown = atsMarkdown;
          pageTitle = atsData?.data?.metadata?.title || atsData?.metadata?.title || "";
        }
      } catch (e) {
        console.warn("ATS page scrape failed, continuing with provided website:", e);
      }
    }

    // Step 1: Scrape the main website (if we have one and didn't get enough content from ATS page)
    if (url && markdown.length < 500) {
      console.log("Scraping:", url);
      const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          formats: ["markdown"],
          onlyMainContent: true,
        }),
      });

      const scrapeData = await scrapeRes.json();
      const siteMarkdown = scrapeData?.data?.markdown || scrapeData?.markdown || "";
      const siteTitle = scrapeData?.data?.metadata?.title || scrapeData?.metadata?.title || "";
      if (siteMarkdown) markdown = siteMarkdown;
      if (siteTitle) pageTitle = siteTitle;
    }

    if (!markdown && !pageTitle) {
      return respond({ error: "Could not scrape website content" }, 422);
    }

    // Step 2: AI extraction
    console.log("Enriching with AI...");
    const aiRes = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You extract structured company data from website content. Return ONLY valid JSON with these fields:
{
  "name": "Company Name",
  "industry": "e.g. AI/ML, Fintech, Healthcare",
  "headquarters": "City, State or City, Country",
  "employee_range": "e.g. 50-200, 1000-5000, 10000+",
  "description": "1-2 sentence company description",
  "careers_url": "URL to careers page if found, else null",
  "brand_color": "hex color from branding if obvious, else null",
  "company_type": "Public, Private, Non-profit, or Government",
  "funding_stage": "e.g. Seed, Series A, Series B, Series C, Late Stage, IPO, Bootstrapped, or null",
  "funding_total": "e.g. $50M, $1.2B, or null if unknown",
  "founded_year": 2015
}
If a field cannot be determined, use null.`,
          },
          {
            role: "user",
            content: `Website: ${url}\nPage title: ${pageTitle}\n\nContent (truncated):\n${markdown.slice(0, 6000)}`,
          },
        ],
        temperature: 0.1,
      }),
    });

    const aiData = await aiRes.json();
    const raw = aiData?.choices?.[0]?.message?.content || "";
    // Strip markdown fences
    const jsonStr = raw.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
    let company: Record<string, any>;
    try {
      company = JSON.parse(jsonStr);
    } catch {
      console.error("AI response parse failed:", raw);
      return respond({ error: "AI could not extract company data" }, 422);
    }

    // Step 3: Insert into DB
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const row = {
      name: company.name || new URL(url).hostname.replace("www.", ""),
      website: url,
      industry: company.industry || null,
      headquarters: company.headquarters || null,
      employee_range: company.employee_range || null,
      description: company.description || null,
      careers_url: company.careers_url || null,
      brand_color: company.brand_color || null,
      company_type: company.company_type || null,
      funding_stage: company.funding_stage || null,
      funding_total: company.funding_total || null,
      founded_year: company.founded_year || null,
      logo_url: `https://logo.clearbit.com/${new URL(url).hostname}`,
      is_demo: false,
    };

    const { data: inserted, error } = await sb
      .from("companies")
      .insert(row)
      .select("id, name, industry, headquarters, employee_range, description, website, logo_url, careers_url, brand_color, company_type, funding_stage, funding_total, founded_year")
      .single();

    if (error) throw new Error(`Insert failed: ${error.message}`);

    console.log("Company created:", inserted.id);
    return respond({ success: true, company: inserted });
  } catch (err) {
    console.error("enrich-company error:", err);
    return respond({ error: err.message }, 500);
  }
});

function respond(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
