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

async function firecrawlScrape(url: string, apiKey: string): Promise<string> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });
    const data = await res.json();
    return data?.data?.markdown || data?.markdown || "";
  } catch (e) {
    console.error("Scrape failed for", url, e);
    return "";
  }
}

async function firecrawlMap(url: string, apiKey: string): Promise<string[]> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/map", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        limit: 100,
        includeSubdomains: false,
      }),
    });
    const data = await res.json();
    return data?.links || [];
  } catch (e) {
    console.error("Map failed for", url, e);
    return [];
  }
}

// Prioritize pages that reveal ICP signals
const ICP_PAGE_PATTERNS = [
  /\/(about|company|who-we-are)/i,
  /\/(solutions?|products?|services?|offerings?|platform)/i,
  /\/(pricing|plans)/i,
  /\/(customers?|case-stud|success-stor|testimonials?|clients?)/i,
  /\/(industries?|verticals?|sectors?|markets?)/i,
  /\/(partners?|integrations?|ecosystem)/i,
  /\/(for-|use-cases?)/i,
];

function scoreUrl(url: string): number {
  let score = 0;
  for (const pattern of ICP_PAGE_PATTERNS) {
    if (pattern.test(url)) score += 10;
  }
  // Penalize deep paths, blog posts, legal pages
  if (/\/(blog|news|press|careers|jobs|legal|privacy|terms|cookie|sitemap|feed|wp-)/i.test(url)) score -= 20;
  // Penalize very deep URLs (4+ segments)
  const segments = new URL(url).pathname.split("/").filter(Boolean);
  if (segments.length > 3) score -= 5;
  return score;
}

function pickBestPages(allUrls: string[], baseUrl: string, max: number): string[] {
  // Always include homepage
  const scored = allUrls
    .filter((u) => {
      try { return new URL(u).hostname === new URL(baseUrl).hostname; } catch { return false; }
    })
    .map((u) => ({ url: u, score: scoreUrl(u) }))
    .filter((u) => u.score > 0)
    .sort((a, b) => b.score - a.score);

  // Dedupe by path pattern (don't scrape /solutions/a and /solutions/b — pick top one per category)
  const picked: string[] = [];
  const seenCategories = new Set<string>();
  for (const { url } of scored) {
    const path = new URL(url).pathname;
    const category = path.split("/").filter(Boolean)[0]?.toLowerCase() || "root";
    if (!seenCategories.has(category)) {
      seenCategories.add(category);
      picked.push(url);
    }
    if (picked.length >= max) break;
  }
  return picked;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { website } = await req.json();
    if (!website) return json({ success: false, error: "website is required" }, 400);

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) return json({ success: false, error: "Firecrawl not configured" }, 500);

    let formattedUrl = website.trim();
    if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

    console.log("=== Deep ICP Discovery for:", formattedUrl, "===");

    // --- Step 1: Map the site to discover all URLs ---
    console.log("Step 1: Mapping site URLs...");
    const [siteUrls, homepageContent] = await Promise.all([
      firecrawlMap(formattedUrl, firecrawlKey),
      firecrawlScrape(formattedUrl, firecrawlKey),
    ]);

    console.log(`Found ${siteUrls.length} URLs on site`);

    if (!homepageContent) {
      return json({ success: false, error: "Could not read your website. Check the URL." }, 400);
    }

    // --- Step 2: Pick the most ICP-relevant pages and scrape them ---
    const bestPages = pickBestPages(siteUrls, formattedUrl, 5);
    console.log("Step 2: Scraping ICP-relevant pages:", bestPages);

    const pageResults = await Promise.all(
      bestPages.map(async (pageUrl) => {
        const content = await firecrawlScrape(pageUrl, firecrawlKey);
        const parsedUrl = new URL(pageUrl);
        const path = parsedUrl.pathname;
        const category = path.split("/").filter(Boolean)[0]?.toLowerCase() || "homepage";
        return { url: pageUrl, path, category, content: content.slice(0, 3000), ok: !!content };
      })
    );

    // --- Step 3: Combine all content ---
    const combinedContent = [
      `## Homepage\n${homepageContent.slice(0, 4000)}`,
      ...pageResults
        .filter((p) => p.content)
        .map((p) => `## ${p.path}\n${p.content}`),
    ].join("\n\n---\n\n");

    const pagesScraped = 1 + pageResults.filter((p) => p.content).length;
    console.log(`Step 3: Combined content from ${pagesScraped} pages (${combinedContent.length} chars)`);

    // --- Step 4: AI builds full 3-layer ICP tree from deep content ---
    const icpText = await aiCall(
      `You are an elite B2B go-to-market strategist. You have been given deep website content from multiple pages (homepage, about, solutions, pricing, customers, industries). Use ALL available signals to build a precise ICP tree.

Analyze:
- What the company sells (products/services/platform)
- Who their existing customers are (case studies, testimonials, logos)
- Which industries they serve (industry pages, verticals)
- Their pricing model (enterprise vs SMB signals)
- Integration partners (ecosystem signals)
- Use cases mentioned

Build a complete ICP tree with exactly 3 layers:

Layer 1 — Industry Verticals: 3-5 distinct industries/sectors that would buy this product/service. Use evidence from the site.
Layer 2 — Company Segments: For each vertical, 2-3 specific company segments (by size, stage, or sub-type).
Layer 3 — Buyer Personas: For each segment, 1-2 specific decision-maker job title clusters who would champion the purchase.

Return JSON ONLY (no markdown fences):
{
  "company_summary": "one sentence about what this company does",
  "icp_summary": "one sentence describing their ideal customer based on evidence",
  "pages_analyzed": ${pagesScraped},
  "verticals": [
    {
      "label": "Industry Vertical Name",
      "description": "Why this vertical needs the product — cite evidence from site",
      "segments": [
        {
          "label": "Company Segment Name",
          "description": "What defines this segment",
          "personas": [
            {
              "label": "Buyer Persona Title Cluster",
              "description": "Why this person would champion the purchase"
            }
          ]
        }
      ]
    }
  ]
}

Rules:
- Be specific: "Mid-Market 3PLs (50-500 employees)" not just "Logistics"
- Use EVIDENCE from the scraped pages — mention customer names, use cases, or industry pages you found
- Verticals should be distinct industries, segments should be company types within that vertical
- Personas should be actual job title clusters (e.g. "VP of Operations / Warehouse Director")
- Focus on WHO BUYS, not who uses`,
      `Website: ${formattedUrl}\nPages scraped: ${pagesScraped}\n\n${combinedContent.slice(0, 12000)}`
    );

    console.log("Step 4: AI ICP response:", icpText.slice(0, 500));

    let icpData: {
      company_summary: string;
      icp_summary: string;
      verticals: Array<{
        label: string;
        description: string;
        segments: Array<{
          label: string;
          description: string;
          personas: Array<{ label: string; description: string }>;
        }>;
      }>;
    };

    try {
      const cleaned = icpText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      icpData = JSON.parse(cleaned);
    } catch {
      const domain = new URL(formattedUrl).hostname.replace("www.", "");
      icpData = {
        company_summary: `Business at ${domain}`,
        icp_summary: "potential customers",
        verticals: [
          {
            label: "Technology Companies",
            description: `Companies that could benefit from ${domain}'s offerings`,
            segments: [
              {
                label: "Mid-Market SaaS",
                description: "Growing SaaS companies with 50-500 employees",
                personas: [
                  { label: "VP of Engineering / CTO", description: "Technical decision-makers" },
                ],
              },
            ],
          },
        ],
      };
    }

    // Flatten into niches array
    const niches: Array<{ label: string; description: string; parent_label: string | null; niche_type: string }> = [];
    for (const v of icpData.verticals) {
      niches.push({ label: v.label, description: v.description, parent_label: null, niche_type: "vertical" });
      for (const s of v.segments || []) {
        niches.push({ label: s.label, description: s.description, parent_label: v.label, niche_type: "segment" });
        for (const p of s.personas || []) {
          niches.push({ label: p.label, description: p.description, parent_label: s.label, niche_type: "persona" });
        }
      }
    }

    console.log(`=== Done: ${niches.length} niches from ${pagesScraped} pages ===`);

    return json({
      success: true,
      company_summary: icpData.company_summary,
      icp_summary: icpData.icp_summary,
      pages_scraped: pagesScraped,
      niches,
    });
  } catch (error) {
    console.error("Leadgen error:", error);
    return json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      500
    );
  }
});
