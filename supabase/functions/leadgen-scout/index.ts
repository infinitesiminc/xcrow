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

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/** Lightweight HTML-to-text: strip tags, collapse whitespace */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Scrape a page using native fetch — no Firecrawl needed */
async function scrapePage(url: string): Promise<{ text: string; title: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LeadHunterBot/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) return { text: "", title: "" };
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";
    // Extract main content (try <main>, <article>, or <body>)
    const mainMatch = html.match(/<main[\s\S]*?<\/main>/i) ||
                      html.match(/<article[\s\S]*?<\/article>/i) ||
                      html.match(/<body[\s\S]*?<\/body>/i);
    const text = htmlToText(mainMatch ? mainMatch[0] : html);
    return { text: text.slice(0, 8000), title };
  } catch (e) {
    console.error("Scrape failed for", url, e);
    return { text: "", title: "" };
  }
}

/** Discover internal links from HTML */
function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const re = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    try {
      const resolved = new URL(match[1], baseUrl).href;
      if (new URL(resolved).hostname === new URL(baseUrl).hostname) {
        links.push(resolved);
      }
    } catch {}
  }
  return [...new Set(links)];
}

// ICP-relevant page patterns
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
  if (/\/(blog|news|press|careers|jobs|legal|privacy|terms|cookie|sitemap|feed|wp-)/i.test(url)) score -= 20;
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    if (segments.length > 3) score -= 5;
  } catch {}
  return score;
}

function pickBestPages(allUrls: string[], max: number): string[] {
  const scored = allUrls
    .map((u) => ({ url: u, score: scoreUrl(u) }))
    .filter((u) => u.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked: string[] = [];
  const seenCategories = new Set<string>();
  for (const { url } of scored) {
    try {
      const category = new URL(url).pathname.split("/").filter(Boolean)[0]?.toLowerCase() || "root";
      if (!seenCategories.has(category)) {
        seenCategories.add(category);
        picked.push(url);
      }
    } catch {}
    if (picked.length >= max) break;
  }
  return picked;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { website } = await req.json();
    if (!website) return json({ success: false, error: "website is required" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ success: false, error: "AI not configured" }, 500);

    let formattedUrl = website.trim();
    if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

    console.log("=== ICP Discovery for:", formattedUrl, "===");

    // --- Step 1: Scrape homepage and discover internal links ---
    console.log("Step 1: Scraping homepage...");
    const homeRes = await fetch(formattedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadHunterBot/1.0)", Accept: "text/html" },
      redirect: "follow",
    });
    if (!homeRes.ok) {
      return json({ success: false, error: "Could not read your website. Check the URL." }, 400);
    }
    const homeHtml = await homeRes.text();
    const homepageText = htmlToText(homeHtml).slice(0, 5000);
    const homeTitle = homeHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";

    if (!homepageText || homepageText.length < 50) {
      return json({ success: false, error: "Website returned insufficient content." }, 400);
    }

    // --- Step 2: Find and scrape ICP-relevant subpages ---
    const allLinks = extractLinks(homeHtml, formattedUrl);
    const bestPages = pickBestPages(allLinks, 4);
    console.log("Step 2: Scraping subpages:", bestPages);

    const pageResults = await Promise.all(
      bestPages.map(async (pageUrl) => {
        const { text, title } = await scrapePage(pageUrl);
        const path = new URL(pageUrl).pathname;
        const category = path.split("/").filter(Boolean)[0]?.toLowerCase() || "homepage";
        return { url: pageUrl, path, category, content: text.slice(0, 3000), ok: !!text };
      })
    );

    // --- Step 3: Combine all content ---
    const combinedContent = [
      `## Homepage (${homeTitle})\n${homepageText}`,
      ...pageResults.filter((p) => p.content).map((p) => `## ${p.path}\n${p.content}`),
    ].join("\n\n---\n\n");

    const pagesScraped = 1 + pageResults.filter((p) => p.content).length;
    console.log(`Step 3: Combined content from ${pagesScraped} pages (${combinedContent.length} chars)`);

    // --- Step 4: AI builds 3-layer ICP tree ---
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
            content: `You are an elite B2B go-to-market strategist. Analyze deep website content to build a precise ICP tree.

Analyze:
- What the company sells (products/services/platform)
- Who their existing customers are (case studies, testimonials, logos)
- Which industries they serve
- Their pricing model (enterprise vs SMB signals)
- Integration partners
- Use cases mentioned

Build a complete ICP tree with exactly 3 layers:

Layer 1 — Industry Verticals: 3-5 distinct industries that would buy this product/service.
Layer 2 — Company Segments: For each vertical, 2-3 specific company segments.
Layer 3 — Buyer Personas: For each segment, 1-2 decision-maker job title clusters.

Return JSON ONLY (no markdown fences):
{
  "company_summary": "one sentence about what this company does",
  "icp_summary": "one sentence describing their ideal customer",
  "verticals": [
    {
      "label": "Industry Vertical Name",
      "description": "Why this vertical needs the product",
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
- Be specific: "Mid-Market 3PLs (50-200 employees)" not just "Logistics"
- Use EVIDENCE from the scraped pages
- Personas should be decision-maker job title clusters
- Focus on WHO BUYS, not who uses`,
          },
          {
            role: "user",
            content: `Website: ${formattedUrl}\nPages scraped: ${pagesScraped}\n\n${combinedContent.slice(0, 12000)}`,
          },
        ],
      }),
    });

    const aiData = await aiRes.json();
    const icpText = aiData?.choices?.[0]?.message?.content || "";
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

    const pagesAnalyzed = [
      { url: formattedUrl, path: "/", category: "homepage" },
      ...pageResults.filter((p) => p.ok).map((p) => ({ url: p.url, path: p.path, category: p.category })),
    ];

    return json({
      success: true,
      company_summary: icpData.company_summary,
      icp_summary: icpData.icp_summary,
      pages_scraped: pagesScraped,
      pages_analyzed: pagesAnalyzed,
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
