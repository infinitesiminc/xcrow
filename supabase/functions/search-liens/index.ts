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
    const apiKey = Deno.env.get("REALESTATEAPI_KEY");
    if (!apiKey) {
      return jsonResp({ success: false, error: "RealEstateAPI key not configured" }, 500);
    }

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResp({ success: false, error: "Not authenticated" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) return jsonResp({ success: false, error: "Invalid auth" }, 401);

    const { address, zip, county } = await req.json();
    if (!address) return jsonResp({ success: false, error: "Address is required" }, 400);

    console.log("Searching liens for:", address, zip);

    // Call RealEstateAPI Involuntary Liens
    const apiResp = await fetch("https://api.realestateapi.com/v2/Reports/PropertyLiens", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "x-api-key": apiKey,
        "x-user-id": user.id,
      },
      body: JSON.stringify({
        address: address.trim(),
        ...(zip ? { zip: zip.trim() } : {}),
      }),
    });

    if (!apiResp.ok) {
      const errText = await apiResp.text();
      console.error("RealEstateAPI error:", apiResp.status, errText);
      return jsonResp({ success: false, error: `API returned ${apiResp.status}: ${errText.substring(0, 200)}` }, apiResp.status);
    }

    const apiData = await apiResp.json();
    console.log("API response liens count:", apiData.liens?.length || 0);

    const liens = apiData.liens || [];
    let inserted = 0;

    for (const lien of liens) {
      // Extract debtor name (taxpayer)
      const debtors = lien.debtors || [];
      const taxpayerName = debtors.length > 0
        ? debtors.map((d: any) => [d.firstName, d.middleName, d.lastName].filter(Boolean).join(" ") || d.name || "Unknown").join("; ")
        : "Unknown Taxpayer";

      // Extract filing info
      const filings = lien.filings || [];
      const firstFiling = filings[0] || {};

      const record: any = {
        user_id: user.id,
        taxpayer_name: taxpayerName,
        serial_number: lien.irsSerialNumber || null,
        unpaid_balance: lien.amount ? parseFloat(lien.amount) : null,
        filing_date: lien.originFilingDate || firstFiling.filingDate || null,
        release_date: lien.releaseDate || null,
        county: county || lien.filingJurisdictionName || firstFiling.agencyCounty || null,
        state_filed: lien.filingJurisdiction || firstFiling.agencyState || "TX",
        place_of_filing: firstFiling.agencyName || null,
        status: (lien.status || "active").toLowerCase(),
        notes: `Source: RealEstateAPI | Filing #: ${firstFiling.filingNumber || "N/A"} | Type: ${firstFiling.filingType || "N/A"}`,
      };

      // Also try to get address from property data
      if (apiData.property?.address) {
        const addr = apiData.property.address;
        // Parse "123 Main St, City, ST 12345" format
        record.taxpayer_address = addr;
      }

      // Skip duplicates
      if (record.serial_number) {
        const { data: existing } = await supabase
          .from("federal_tax_liens")
          .select("id")
          .eq("user_id", user.id)
          .eq("serial_number", record.serial_number)
          .limit(1);
        if (existing && existing.length > 0) continue;
      }

      const { error: insertErr } = await supabase.from("federal_tax_liens").insert(record);
      if (!insertErr) inserted++;
      else console.error("Insert error:", insertErr.message);
    }

    return jsonResp({
      success: true,
      liens_found: liens.length,
      liens_inserted: inserted,
      property: apiData.property ? {
        address: apiData.property.address,
        fips: apiData.property.fips,
        useCode: apiData.property.useCode,
      } : null,
    });
  } catch (error) {
    console.error("Error:", error);
    return jsonResp({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

function jsonResp(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
