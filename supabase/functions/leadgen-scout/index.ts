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
    const { website } = await req.json();
    if (!website) return json({ success: false, error: "website is required" }, 400);

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

    // --- Step 2: AI builds full 3-layer ICP tree ---
    const icpText = await aiCall(
      `You are an elite B2B go-to-market strategist. Analyze the website content and build a complete ICP (Ideal Customer Profile) tree with exactly 3 layers:

Layer 1 — Industry Verticals: 3-5 distinct industries/sectors that would buy this product/service.
Layer 2 — Company Segments: For each vertical, 2-3 specific company segments (by size, stage, or sub-type).
Layer 3 — Buyer Personas: For each segment, 1-2 specific decision-maker job title clusters who would champion the purchase.

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
- Be specific: "Mid-Market 3PLs (50-500 employees)" not just "Logistics"
- Verticals should be distinct industries, segments should be company types within that vertical
- Personas should be actual job title clusters (e.g. "VP of Operations / Warehouse Director")
- Focus on WHO BUYS, not who uses`,
      `Website: ${formattedUrl}\n\nContent:\n${siteContent.slice(0, 6000)}`
    );

    console.log("AI ICP response:", icpText.slice(0, 500));

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

    // Flatten into niches array for the frontend
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

    console.log(`Returning ${niches.length} niches across 3 layers`);

    return json({
      success: true,
      company_summary: icpData.company_summary,
      icp_summary: icpData.icp_summary,
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
