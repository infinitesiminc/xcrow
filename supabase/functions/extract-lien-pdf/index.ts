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
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return jsonResp({ success: false, error: "AI key not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResp({ success: false, error: "Not authenticated" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) return jsonResp({ success: false, error: "Invalid auth" }, 401);

    // Read multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return jsonResp({ success: false, error: "No file uploaded" }, 400);

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const base64 = uint8ToBase64(fileBytes);
    const mimeType = file.type || "application/pdf";

    console.log(`Processing ${file.name}, size: ${fileBytes.length}, type: ${mimeType}`);

    // Use Gemini vision to extract structured lien data
    const prompt = `You are analyzing an IRS Form 668(Y)(c) — Notice of Federal Tax Lien.

Extract ALL lien entries from this document. Each form may have multiple tax period rows.

Return a JSON object with this exact structure:
{
  "taxpayer_name": "string",
  "residence_address": "string or null",
  "residence_city": "string or null", 
  "residence_state": "string or null",
  "residence_zip": "string or null",
  "serial_number": "string or null",
  "lien_unit": "string or null",
  "identifying_number": "string or null (SSN/EIN, may be partially redacted)",
  "entries": [
    {
      "kind_of_tax": "string (e.g. 941, 1040)",
      "tax_period_ending": "string (MM/DD/YYYY)",
      "date_of_assessment": "string (MM/DD/YYYY) or null",
      "last_day_for_refiling": "string (MM/DD/YYYY) or null",
      "unpaid_balance": number
    }
  ]
}

Return ONLY valid JSON, no markdown fences.`;

    const aiResp = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
            ],
          },
        ],
        temperature: 0,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI API error:", aiResp.status, errText);
      return jsonResp({ success: false, error: "AI extraction failed" }, 500);
    }

    const aiData = await aiResp.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    console.log("AI response:", content.substring(0, 500));

    // Clean markdown fences if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response as JSON");
      return jsonResp({ success: false, error: "Could not parse lien data from PDF", raw: content }, 422);
    }

    // Insert lien records
    const entries = parsed.entries || [];
    let inserted = 0;
    const records: any[] = [];

    for (const entry of entries) {
      const record = {
        user_id: user.id,
        taxpayer_name: parsed.taxpayer_name || "Unknown",
        taxpayer_address: parsed.residence_address || null,
        taxpayer_city: parsed.residence_city || null,
        taxpayer_state: parsed.residence_state || null,
        taxpayer_zip: parsed.residence_zip || null,
        serial_number: parsed.serial_number || null,
        lien_unit: parsed.lien_unit || null,
        taxpayer_ssn_or_ein: parsed.identifying_number || null,
        kind_of_tax: entry.kind_of_tax || null,
        tax_period_ending: entry.tax_period_ending || null,
        date_of_assessment: entry.date_of_assessment || null,
        last_day_for_refiling: entry.last_day_for_refiling || null,
        unpaid_balance: entry.unpaid_balance || null,
        county: "Travis",
        state_filed: "Texas",
        place_of_filing: "Travis County, TX",
        status: "active",
      };

      // Skip duplicates by serial_number + tax_period
      if (record.serial_number && record.tax_period_ending) {
        const { data: existing } = await supabase
          .from("federal_tax_liens")
          .select("id")
          .eq("user_id", user.id)
          .eq("serial_number", record.serial_number)
          .eq("tax_period_ending", record.tax_period_ending)
          .limit(1);
        if (existing && existing.length > 0) continue;
      }

      const { error: insertErr } = await supabase.from("federal_tax_liens").insert(record);
      if (!insertErr) {
        inserted++;
        records.push(record);
      } else {
        console.error("Insert error:", insertErr.message);
      }
    }

    return jsonResp({
      success: true,
      taxpayer_name: parsed.taxpayer_name,
      entries_found: entries.length,
      entries_inserted: inserted,
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

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
