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

    // Scrape with markdown + branding (both are valid string formats)
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown", "branding"],
        onlyMainContent: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Firecrawl error:", JSON.stringify(data));
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

    const markdown = data.data?.markdown || data.markdown || "";
    const metadata = data.data?.metadata || data.metadata || {};
    const branding = data.data?.branding || data.branding || null;

    // Use AI to extract structured company info from the scraped content
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY || !markdown) {
      // Fallback: return what we have without structured extraction
      return new Response(JSON.stringify({
        success: true,
        companyName: metadata.title || metadata.ogTitle || null,
        industry: null,
        companyType: null,
        employeeRange: null,
        revenueScale: null,
        founded: null,
        headquarters: null,
        tagline: metadata.description || metadata.ogDescription || null,
        logo: branding?.logo || branding?.images?.logo || null,
        url: formattedUrl,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const truncatedMarkdown = markdown.slice(0, 3000);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "Extract structured company profile data from the provided website content. Infer information from context clues. Return data via the extract_company function.",
          },
          {
            role: "user",
            content: `Website: ${formattedUrl}\nTitle: ${metadata.title || ""}\nDescription: ${metadata.description || ""}\n\nContent:\n${truncatedMarkdown}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_company",
              description: "Extract structured company profile information",
              parameters: {
                type: "object",
                properties: {
                  companyName: { type: "string", description: "Official company name" },
                  industry: { type: "string", description: "Primary industry (e.g. Fintech, SaaS, Healthcare, E-commerce)" },
                  companyType: { type: "string", description: "Type: Public, Private, Startup, Non-profit, etc." },
                  employeeRange: { type: "string", description: "Employee count range: 1-50, 51-200, 201-1000, 1000-5000, 5000+" },
                  revenueScale: { type: "string", description: "Revenue scale: Pre-revenue, <$10M, $10M-$100M, $100M-$1B, $1B+" },
                  founded: { type: "string", description: "Year founded" },
                  headquarters: { type: "string", description: "HQ location (city, country)" },
                  tagline: { type: "string", description: "One-line company description" },
                },
                required: ["companyName", "tagline"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_company" } },
      }),
    });

    let extracted: Record<string, string | null> = {};
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try {
          extracted = JSON.parse(toolCall.function.arguments);
        } catch {
          console.error("Failed to parse AI extraction");
        }
      }
    }

    const snapshot = {
      success: true,
      companyName: extracted.companyName || metadata.title || metadata.ogTitle || null,
      industry: extracted.industry || null,
      companyType: extracted.companyType || null,
      employeeRange: extracted.employeeRange || null,
      revenueScale: extracted.revenueScale || null,
      founded: extracted.founded || null,
      headquarters: extracted.headquarters || null,
      tagline: extracted.tagline || metadata.description || null,
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
