import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await supabase.rpc("is_superadmin", { _user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const batchSize: number = body.batchSize ?? 50;
    const offset: number = body.offset ?? 0;

    // Get known operators from flash_accounts
    const { data: accounts } = await supabase
      .from("flash_accounts")
      .select("id, name");

    const operatorNames = (accounts || []).map((a) => a.name);

    // Also get existing operator_guess values for additional matching
    const { data: existingOps } = await supabase
      .from("discovered_garages")
      .select("operator_guess")
      .not("operator_guess", "is", null);

    const uniqueOps = [...new Set((existingOps || []).map((r) => r.operator_guess).filter(Boolean))];
    const allKnownOperators = [...new Set([...operatorNames, ...uniqueOps])];

    // Get unattributed garages
    const { data: garages, error: fetchErr } = await supabase
      .from("discovered_garages")
      .select("id, name, website, address, scan_zone")
      .is("operator_guess", null)
      .order("reviews_count", { ascending: false, nullsFirst: false })
      .range(offset, offset + batchSize - 1);

    if (fetchErr) {
      throw new Error(`Fetch error: ${fetchErr.message}`);
    }

    if (!garages || garages.length === 0) {
      return new Response(JSON.stringify({
        done: true,
        classified: 0,
        remaining: 0,
        message: "No more unattributed garages to classify",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the prompt for the LLM
    const garageList = garages.map((g, i) => 
      `${i + 1}. "${g.name}" | website: ${g.website || "none"} | address: ${g.address || "none"}`
    ).join("\n");

    const operatorList = allKnownOperators.join(", ");

    const prompt = `You are a parking industry expert. For each garage below, determine which parking operator runs it.

Known operators: ${operatorList}

Rules:
- Match by name similarity (e.g. "Joe's Auto Parks" in garage name → "Joe's Auto Parks")
- Match by website domain (e.g. joesautoparks.com → "Joe's Auto Parks", standardparking.com → "SP Plus")  
- "Standard Parking" = "SP Plus" (rebranded)
- "Republic Parking" or "Impark" = "Reimagined Parking (Impark/Republic)" → use "Impark" as operator_guess
- "REEF" in name → "Reef Parking" (but NOT "coral reef", "reef point", etc.)
- If it's clearly a public/city/municipal garage, use "City/Public"
- If it's a venue's own parking (stadium, museum, hospital, etc.), use "Venue-Operated"
- If it's a university parking structure, use "University"
- If you cannot determine the operator with reasonable confidence, respond with "unknown"
- Do NOT guess — only match when confident

Garages:
${garageList}

Respond with ONLY a JSON array of objects, one per garage, in order:
[{"index": 1, "operator": "Joe's Auto Parks"}, {"index": 2, "operator": "unknown"}, ...]`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      throw new Error(`AI API error ${aiResp.status}: ${errText}`);
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse the JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response as JSON array");
    }

    const classifications: { index: number; operator: string }[] = JSON.parse(jsonMatch[0]);

    let classified = 0;
    let skipped = 0;
    const results: { name: string; operator: string }[] = [];

    for (const cls of classifications) {
      const garage = garages[cls.index - 1];
      if (!garage) continue;

      if (cls.operator === "unknown" || !cls.operator) {
        skipped++;
        continue;
      }

      const { error: updateErr } = await supabase
        .from("discovered_garages")
        .update({ operator_guess: cls.operator })
        .eq("id", garage.id);

      if (!updateErr) {
        classified++;
        results.push({ name: garage.name, operator: cls.operator });
      }
    }

    // Link newly classified garages to accounts
    await supabase.rpc("link_garages_to_accounts");

    // Count remaining
    const { count: remaining } = await supabase
      .from("discovered_garages")
      .select("id", { count: "exact", head: true })
      .is("operator_guess", null);

    return new Response(JSON.stringify({
      done: (remaining || 0) === 0,
      classified,
      skipped,
      remaining: remaining || 0,
      nextOffset: offset + batchSize,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("classify-garages error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
