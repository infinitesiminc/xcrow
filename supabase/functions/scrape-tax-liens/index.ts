const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid auth token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { county = "Travis", search_query, scrape_url } = await req.json().catch(() => ({}));

    // Step 0: If a direct URL was provided, scrape it with Firecrawl
    let directScrapeLiens: any[] = [];
    let directScrapeMarkdown = "";
    if (scrape_url) {
      console.log("Direct scraping URL:", scrape_url);
      try {
        const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url: scrape_url, formats: ["markdown"], waitFor: 8000 }),
        });
        const scrapeData = await scrapeRes.json();
        console.log("Direct scrape status:", scrapeRes.status, "success:", scrapeData.success);
        if (scrapeData.success && scrapeData.data?.markdown) {
          directScrapeMarkdown = scrapeData.data.markdown;
          console.log("Scraped content length:", directScrapeMarkdown.length);
          directScrapeLiens = extractLiensFromMarkdown(directScrapeMarkdown, county);
          console.log("Liens parsed from direct scrape:", directScrapeLiens.length);
        }
      } catch (e) {
        console.log("Direct scrape failed:", e);
      }
    }

    // Step 1: Broader Firecrawl search queries (no site: restriction)
    const searchQueries = search_query
      ? [search_query]
      : [
          `"federal tax lien" "${county} County" Texas taxpayer filed`,
        ];

    let allResults: any[] = [];
    for (const query of searchQueries) {
      console.log("Searching:", query);
      try {
        const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query, limit: 10, scrapeOptions: { formats: ["markdown"] } }),
        });
        const searchData = await searchRes.json();
        if (searchRes.ok && searchData.data) {
          allResults.push(...searchData.data);
        } else {
          console.log("Search failed:", query, searchData.error);
        }
      } catch (e) {
        console.log("Search error:", query, e);
      }
    }

    // Deduplicate by URL
    const seenUrls = new Set<string>();
    const results = allResults.filter((r: any) => {
      if (!r.url || seenUrls.has(r.url)) return false;
      seenUrls.add(r.url);
      return true;
    });

    // Step 2: Parse search results into lien records
    const liens: any[] = [];
    for (const result of results) {
      const md = result.markdown || result.description || "";
      const parsed = parseLienFromText(md, result.title || "", county);
      if (parsed) {
        liens.push({ ...parsed, user_id: user.id });
      }
    }

    // Add direct scrape liens
    for (const l of directScrapeLiens) {
      liens.push({ ...l, user_id: user.id });
    }

    // Step 3: Insert into database (skip duplicates by serial_number)
    let inserted = 0;
    for (const lien of liens) {
      if (lien.serial_number) {
        const { data: existing } = await supabase
          .from("federal_tax_liens")
          .select("id")
          .eq("user_id", user.id)
          .eq("serial_number", lien.serial_number)
          .limit(1);
        if (existing && existing.length > 0) continue;
      }
      const { error: insertError } = await supabase.from("federal_tax_liens").insert(lien);
      if (!insertError) inserted++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_results: results.length,
        liens_parsed: liens.length,
        liens_inserted: inserted,
        direct_scrape_content_length: directScrapeMarkdown.length || 0,
        raw_results: results.slice(0, 10).map((r: any) => ({
          title: r.title,
          url: r.url,
          description: r.description?.substring(0, 200),
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseLienFromText(text: string, title: string, county: string): any | null {
  if (!text && !title) return null;
  const combined = `${title}\n${text}`;

  const isLien = /tax\s*lien|668\s*\(?\s*Y\s*\)?|federal\s*lien|IRS\s*lien/i.test(combined);
  if (!isLien) return null;

  const nameMatch = combined.match(/(?:taxpayer|name|debtor)[:\s]*([A-Z][A-Z\s,.'&-]+(?:LLC|INC|CORP|LTD|LP|CO)?)/i)
    || combined.match(/(?:filed against|lien on|against)\s+([A-Z][A-Z\s,.'&-]+)/i);
  const taxpayerName = nameMatch ? nameMatch[1].trim() : title.replace(/federal tax lien/i, "").trim();
  if (!taxpayerName || taxpayerName.length < 2) return null;

  const serialMatch = combined.match(/(?:serial|serial\s*number|#)\s*[:\s]*(\d{6,})/i);
  const amountMatch = combined.match(/\$\s*([\d,]+\.?\d*)/);
  const dateMatch = combined.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
  const einMatch = combined.match(/(\d{2}-\d{7})/);
  const ssnMatch = combined.match(/(\d{3}-\d{2}-\d{4})/);
  const taxMatch = combined.match(/(?:kind of tax|tax type)[:\s]*([\w\d]+)/i)
    || combined.match(/\b(941|1040|1120|940)\b/);

  return {
    taxpayer_name: taxpayerName,
    serial_number: serialMatch ? serialMatch[1] : null,
    unpaid_balance: amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : null,
    filing_date: dateMatch ? dateMatch[1] : null,
    taxpayer_ssn_or_ein: einMatch ? einMatch[1] : ssnMatch ? ssnMatch[1] : null,
    kind_of_tax: taxMatch ? taxMatch[1] : null,
    county,
    state_filed: "Texas",
    place_of_filing: `${county} County, TX`,
    status: "active",
  };
}

function extractLiensFromMarkdown(markdown: string, county: string): any[] {
  const liens: any[] = [];
  const sections = markdown.split(/(?:\n{2,}|\|{2,}|---+)/);
  for (const section of sections) {
    const parsed = parseLienFromText(section, "", county);
    if (parsed) liens.push(parsed);
  }
  return liens;
}
