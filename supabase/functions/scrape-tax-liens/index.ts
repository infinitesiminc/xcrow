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
          console.log("Scraped content preview:", directScrapeMarkdown.substring(0, 500));
          directScrapeLiens = extractLiensFromMarkdown(directScrapeMarkdown, county);
          console.log("Liens parsed from direct scrape:", directScrapeLiens.length);
        }
      } catch (e) {
        console.log("Direct scrape failed:", e);
      }
    }

    // Step 1: Firecrawl search for actual lien filings with structured data
    const searchQueries = search_query
      ? [search_query]
      : [
          `IRS "notice of federal tax lien" "kind of tax" "unpaid balance" "${county} County" Texas`,
          `"668(Y)" "unpaid balance of assessment" "tax period ending" "${county}" Texas`,
          `site:countyclerk.traviscountytx.gov "federal tax lien"`,
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
      const parsed = extractForm668Fields(md, result.title || "", county);
      for (const p of parsed) {
        liens.push({ ...p, user_id: user.id });
      }
    }

    // Add direct scrape liens
    for (const l of directScrapeLiens) {
      liens.push({ ...l, user_id: user.id });
    }

    console.log("Total liens to insert:", liens.length);
    if (liens.length > 0) {
      console.log("Sample lien:", JSON.stringify(liens[0]));
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
      else console.log("Insert error:", insertError.message);
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

/**
 * Extract Form 668 fields from text. Targets the specific fields on IRS Form 668(Y):
 * - Name of Taxpayer
 * - Kind of Tax (e.g., 941, 1040, 1120)
 * - Tax Period Ending
 * - Unpaid Balance of Assessment
 * - Serial Number
 * - Date of Assessment
 * - Identifying Number (SSN/EIN)
 */
function extractForm668Fields(text: string, title: string, county: string): any[] {
  if (!text && !title) return [];
  const combined = `${title}\n${text}`;

  const isLien = /tax\s*lien|668\s*\(?\s*[YZ]\s*\)?|federal\s*lien|IRS\s*lien|unpaid\s*balance\s*of\s*assessment|notice\s*of\s*federal/i.test(combined);
  if (!isLien) return [];

  // Try to find tabular data with multiple entries (Form 668 lists multiple tax periods)
  const entries = parseTabularLienData(combined, county);
  if (entries.length > 0) return entries;

  // Fallback: single record extraction
  const single = parseSingleLienRecord(combined, county);
  return single ? [single] : [];
}

function parseTabularLienData(text: string, county: string): any[] {
  const liens: any[] = [];

  // Extract taxpayer name (appears once at top of form)
  const nameMatch = text.match(/(?:name\s*of\s*taxpayer|taxpayer\s*name|taxpayer)[:\s]*([A-Z][A-Z\s,.'&\-]+?)(?:\n|$|\|)/i)
    || text.match(/(?:filed against|lien\s*(?:on|against))\s+([A-Z][A-Z\s,.'&\-]+?)(?:\n|$|for)/i);
  const taxpayerName = nameMatch ? nameMatch[1].trim().replace(/\s+/g, ' ') : null;

  // EIN/SSN (appears once)
  const einMatch = text.match(/(?:identifying\s*number|EIN|employer\s*id)[:\s]*(\d{2}-\d{7})/i);
  const ssnMatch = text.match(/(?:identifying\s*number|SSN|social)[:\s]*(\d{3}-\d{2}-\d{4})/i);
  const idNumber = einMatch ? einMatch[1] : ssnMatch ? ssnMatch[1] : text.match(/(\d{2}-\d{7})/)?.[1] || text.match(/(\d{3}-\d{2}-\d{4})/)?.[1] || null;

  // Serial number
  const serialMatch = text.match(/(?:serial\s*(?:number)?|lien\s*#)[:\s]*(\d{6,})/i);

  // Look for rows with: Kind of Tax | Tax Period Ending | Unpaid Balance
  // Pattern: tax type code, date, dollar amount on same line or nearby
  const rowPattern = /\b(941|1040|1120[A-Z]?|940|720|CT-1|2290|709|706|11C)\b[\s|,]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{2}\/\d{4})[\s|,]*\$?\s*([\d,]+\.?\d*)/g;
  let match;
  while ((match = rowPattern.exec(text)) !== null) {
    liens.push({
      taxpayer_name: taxpayerName || "Unknown Taxpayer",
      taxpayer_ssn_or_ein: idNumber,
      serial_number: serialMatch ? serialMatch[1] : null,
      kind_of_tax: match[1],
      tax_period_ending: match[2],
      unpaid_balance: parseFloat(match[3].replace(/,/g, "")),
      county,
      state_filed: "Texas",
      place_of_filing: `${county} County, TX`,
      status: "active",
    });
  }

  // Also try: dollar amount then tax type then date
  if (liens.length === 0) {
    const altPattern = /\$\s*([\d,]+\.?\d*)\s*[\s|]*\b(941|1040|1120[A-Z]?|940|720)\b\s*[\s|]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/g;
    while ((match = altPattern.exec(text)) !== null) {
      liens.push({
        taxpayer_name: taxpayerName || "Unknown Taxpayer",
        taxpayer_ssn_or_ein: idNumber,
        serial_number: serialMatch ? serialMatch[1] : null,
        kind_of_tax: match[2],
        tax_period_ending: match[3],
        unpaid_balance: parseFloat(match[1].replace(/,/g, "")),
        county,
        state_filed: "Texas",
        place_of_filing: `${county} County, TX`,
        status: "active",
      });
    }
  }

  return liens;
}

function parseSingleLienRecord(text: string, county: string): any | null {
  // Taxpayer name
  const nameMatch = text.match(/(?:name\s*of\s*taxpayer|taxpayer\s*name|taxpayer|name)[:\s]*([A-Z][A-Z\s,.'&\-]+(?:LLC|INC|CORP|LTD|LP|CO)?)/i)
    || text.match(/(?:filed against|lien on|against)\s+([A-Z][A-Z\s,.'&\-]+)/i);
  const taxpayerName = nameMatch ? nameMatch[1].trim().replace(/\s+/g, ' ') : null;
  if (!taxpayerName || taxpayerName.length < 2) return null;

  // Serial number
  const serialMatch = text.match(/(?:serial|serial\s*number|#)\s*[:\s]*(\d{6,})/i);

  // Kind of tax
  const taxMatch = text.match(/(?:kind\s*of\s*tax|tax\s*type|type\s*of\s*tax)[:\s]*([\w\d]+)/i)
    || text.match(/\b(941|1040|1120[A-Z]?|940|720)\b/);

  // Tax period ending
  const periodMatch = text.match(/(?:tax\s*period\s*ending|period\s*ending|tax\s*period)[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{2}\/\d{4})/i);

  // Unpaid balance
  const balanceMatch = text.match(/(?:unpaid\s*balance(?:\s*of\s*assessment)?)[:\s]*\$?\s*([\d,]+\.?\d*)/i)
    || text.match(/\$\s*([\d,]+\.?\d*)/);

  // Date of assessment
  const assessMatch = text.match(/(?:date\s*of\s*assessment|assessment\s*date)[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i);

  // Filing date
  const filingMatch = text.match(/(?:filed|filing\s*date|date\s*filed|recorded)[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i);

  // Identifying number
  const einMatch = text.match(/(\d{2}-\d{7})/);
  const ssnMatch = text.match(/(\d{3}-\d{2}-\d{4})/);

  return {
    taxpayer_name: taxpayerName,
    serial_number: serialMatch ? serialMatch[1] : null,
    kind_of_tax: taxMatch ? taxMatch[1] : null,
    tax_period_ending: periodMatch ? periodMatch[1] : null,
    unpaid_balance: balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, "")) : null,
    date_of_assessment: assessMatch ? assessMatch[1] : null,
    filing_date: filingMatch ? filingMatch[1] : null,
    taxpayer_ssn_or_ein: einMatch ? einMatch[1] : ssnMatch ? ssnMatch[1] : null,
    county,
    state_filed: "Texas",
    place_of_filing: `${county} County, TX`,
    status: "active",
  };
}

function extractLiensFromMarkdown(markdown: string, county: string): any[] {
  const liens: any[] = [];
  // Try full document first
  const full = extractForm668Fields(markdown, "", county);
  if (full.length > 0) return full;
  // Fallback: split into sections
  const sections = markdown.split(/(?:\n{2,}|\|{2,}|---+)/);
  for (const section of sections) {
    const parsed = extractForm668Fields(section, "", county);
    liens.push(...parsed);
  }
  return liens;
}
