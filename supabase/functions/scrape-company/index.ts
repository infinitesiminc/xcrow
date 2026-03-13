import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Scraping company website:", formattedUrl);

    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: [
          "branding",
          {
            type: "json",
            schema: {
              type: "object",
              properties: {
                companyName: { type: "string", description: "Official company name" },
                industry: { type: "string", description: "Primary industry or sector (e.g. Fintech, SaaS, Healthcare)" },
                companyType: { type: "string", description: "Company type (e.g. Public, Private, Startup, Non-profit)" },
                employeeRange: { type: "string", description: "Approximate employee count range (e.g. 1-50, 51-200, 201-1000, 1000-5000, 5000+)" },
                revenueScale: { type: "string", description: "Revenue scale if known (e.g. Pre-revenue, <$10M, $10M-$100M, $100M-$1B, $1B+)" },
                founded: { type: "string", description: "Year founded if available" },
                headquarters: { type: "string", description: "HQ location (city, country)" },
                tagline: { type: "string", description: "Short one-line company description or tagline" },
              },
              required: ["companyName", "industry", "tagline"],
            },
            prompt: "Extract company profile information from this website. Infer industry, scale, and type from context clues if not explicitly stated. Use null for truly unknown fields.",
          },
        ],
        onlyMainContent: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Firecrawl error:", data);
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Firecrawl credits depleted" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: data.error || "Failed to scrape website" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const branding = data.data?.branding || data.branding || null;
    const extracted = data.data?.json || data.json || {};

    const snapshot = {
      success: true,
      companyName: extracted.companyName || null,
      industry: extracted.industry || null,
      companyType: extracted.companyType || null,
      employeeRange: extracted.employeeRange || null,
      revenueScale: extracted.revenueScale || null,
      founded: extracted.founded || null,
      headquarters: extracted.headquarters || null,
      tagline: extracted.tagline || null,
      logo: branding?.logo || branding?.images?.logo || null,
      url: formattedUrl,
    };

    return new Response(JSON.stringify(snapshot), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scrape-company error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
