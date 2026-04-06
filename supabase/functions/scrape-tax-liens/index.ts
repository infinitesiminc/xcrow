import { corsHeaders } from "@supabase/supabase-js/cors";
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

    // Verify user
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

    const { county = "Travis", search_query } = await req.json().catch(() => ({}));

    // Step 1: Use Firecrawl search to find recent federal tax lien filings
    const searchQuery = search_query || `federal tax lien filing ${county} county Texas 2025 2026 site:tccsearch.org OR site:countyclerk.traviscountytx.gov`;

    console.log("Searching for liens with query:", searchQuery);

    const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 10,
        scrapeOptions: { formats: ["markdown"] },
      }),
    });

    const searchData = await searchRes.json();

    if (!searchRes.ok) {
      console.error("Firecrawl search error:", searchData);
      return new Response(
        JSON.stringify({ success: false, error: searchData.error || "Search failed" }),
        { status: searchRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Also try scraping a known public records page
    let scrapedContent = "";
    try {
      const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: "https://www.tccsearch.org/RealEstate/SearchEntry.aspx",
          formats: ["markdown"],
          waitFor: 5000,
        }),
      });
      const scrapeData = await scrapeRes.json();
      if (scrapeData.success && scrapeData.data?.markdown) {
        scrapedContent = scrapeData.data.markdown;
      }
    } catch (e) {
      console.log("Direct scrape failed (expected for Cloudflare sites):", e);
    }

    // Step 3: Parse results into lien records
    const liens: any[] = [];
    const results = searchData.data || [];

    for (const result of results) {
      const md = result.markdown || result.description || "";
      const parsed = parseLienFromText(md, result.title || "", county);
      if (parsed) {
        liens.push({ ...parsed, user_id: user.id });
      }
    }

    // Step 4: If we got raw scraped content, try to extract liens from it too
    if (scrapedContent) {
      const additionalLiens = extractLiensFromMarkdown(scrapedContent, county);
      for (const l of additionalLiens) {
        liens.push({ ...l, user_id: user.id });
      }
    }

    // Step 5: Insert into database (skip duplicates by serial_number)
    let inserted = 0;
    for (const lien of liens) {
      // Check for existing serial number
      if (lien.serial_number) {
        const { data: existing } = await supabase
          .from("federal_tax_liens")
          .select("id")
          .eq("user_id", user.id)
          .eq("serial_number", lien.serial_number)
          .limit(1);
        if (existing && existing.length > 0) continue;
      }

      const { error: insertError } = await supabase
        .from("federal_tax_liens")
        .insert(lien);
      if (!insertError) inserted++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_results: results.length,
        liens_parsed: liens.length,
        liens_inserted: inserted,
        raw_results: results.map((r: any) => ({
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

  // Look for tax lien indicators
  const isLien = /tax\s*lien|668\s*\(?\s*Y\s*\)?|federal\s*lien|IRS\s*lien/i.test(combined);
  if (!isLien) return null;

  // Extract taxpayer name
  const nameMatch = combined.match(/(?:taxpayer|name)[:\s]*([A-Z][A-Z\s,.']+(?:LLC|INC|CORP|LTD|LP|CO)?)/i)
    || combined.match(/(?:filed against|lien on)\s+([A-Z][A-Z\s,.']+)/i);
  const taxpayerName = nameMatch ? nameMatch[1].trim() : title.replace(/federal tax lien/i, "").trim();
  if (!taxpayerName || taxpayerName.length < 2) return null;

  // Extract serial number
  const serialMatch = combined.match(/(?:serial|serial\s*number|#)\s*[:\s]*(\d{6,})/i);

  // Extract amounts
  const amountMatch = combined.match(/\$\s*([\d,]+\.?\d*)/);

  // Extract dates
  const dateMatch = combined.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);

  // Extract SSN/EIN
  const einMatch = combined.match(/(\d{2}-\d{7})/);
  const ssnMatch = combined.match(/(\d{3}-\d{2}-\d{4})/);

  // Extract kind of tax
  const taxMatch = combined.match(/(?:kind of tax|tax type)[:\s]*([\w\d]+)/i)
    || combined.match(/\b(941|1040|1120|940)\b/);

  return {
    taxpayer_name: taxpayerName,
    serial_number: serialMatch ? serialMatch[1] : null,
    unpaid_balance: amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : null,
    filing_date: dateMatch ? dateMatch[1] : null,
    taxpayer_ssn_or_ein: einMatch ? einMatch[1] : ssnMatch ? ssnMatch[1] : null,
    kind_of_tax: taxMatch ? taxMatch[1] : null,
    county: county,
    state_filed: "Texas",
    place_of_filing: `${county} County, TX`,
    status: "active",
  };
}

function extractLiensFromMarkdown(markdown: string, county: string): any[] {
  const liens: any[] = [];
  // Split by potential record boundaries
  const sections = markdown.split(/(?:\n{2,}|\|{2,}|---+)/);

  for (const section of sections) {
    const parsed = parseLienFromText(section, "", county);
    if (parsed) liens.push(parsed);
  }
  return liens;
}
