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
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "Firecrawl API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify superadmin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await supabase.rpc("is_superadmin", { _user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batchSize ?? 5;
    const offset = body.offset ?? 0;
    const debug = body.debug ?? false;

    // Get garages with operators but no capacity data
    const { data: garages, error: fetchErr } = await supabase
      .from("discovered_garages")
      .select("id, name, address, lat, lng, operator_guess, website")
      .not("operator_guess", "is", null)
      .is("capacity", null)
      .order("reviews_count", { ascending: false, nullsFirst: false })
      .range(offset, offset + batchSize - 1);

    if (fetchErr) {
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!garages || garages.length === 0) {
      return new Response(JSON.stringify({ done: true, enriched: 0, message: "All garages enriched" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let enriched = 0;
    let skipped = 0;
    const results: any[] = [];

    for (const garage of garages) {
      try {
        const garageName = garage.name.replace(/\s*-\s*\w+$/, ""); // strip operator suffix
        const addr = garage.address || "Los Angeles CA";
        
        // Strategy 1: Search for the garage on parking aggregators
        const searchQuery = `${garageName} parking ${addr} spaces capacity`;
        console.log(`Searching: ${garageName}`);

        const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: 5,
            scrapeOptions: { formats: ["markdown"] },
          }),
        });

        let capacity: number | null = null;
        let source: string | null = null;
        let debugInfo: any = null;

        if (searchResp.ok) {
          const searchData = await searchResp.json();
          const searchResults = searchData.data || [];

          if (debug) {
            debugInfo = searchResults.map((r: any) => ({
              url: r.url,
              title: r.title,
              snippet: (r.markdown || r.description || "").substring(0, 200),
            }));
          }

          for (const result of searchResults) {
            const text = [
              result.markdown || "",
              result.description || "",
              result.title || "",
            ].join(" ");
            
            // Extract all numbers near capacity-related words
            const capacityResult = extractCapacity(text, garageName);
            if (capacityResult) {
              capacity = capacityResult.capacity;
              source = result.url || "firecrawl-search";
              break;
            }
          }
        } else {
          console.error(`Search failed: ${searchResp.status}`);
        }

        if (capacity) {
          const { error: updateErr } = await supabase
            .from("discovered_garages")
            .update({ capacity, capacity_source: source })
            .eq("id", garage.id);

          if (!updateErr) {
            enriched++;
            console.log(`✓ ${garage.name}: ${capacity} spaces (${source})`);
          }
        } else {
          skipped++;
          console.log(`✗ ${garage.name}: no capacity found`);
        }

        results.push({ 
          name: garage.name, 
          capacity, 
          source,
          ...(debug ? { debug: debugInfo } : {}),
        });

        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`Error enriching ${garage.name}:`, err);
        skipped++;
        results.push({ name: garage.name, capacity: null, source: null });
      }
    }

    // Count remaining
    const { count: remaining } = await supabase
      .from("discovered_garages")
      .select("id", { count: "exact", head: true })
      .not("operator_guess", "is", null)
      .is("capacity", null);

    return new Response(JSON.stringify({
      done: (remaining ?? 0) === 0,
      enriched,
      skipped,
      remaining: remaining ?? 0,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("enrich-garage-capacity error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractCapacity(text: string, garageName: string): { capacity: number } | null {
  // Normalize text
  const t = text.toLowerCase().replace(/,/g, "");

  // Very broad patterns - find ANY number near parking-related words
  const patterns = [
    /(\d{2,5})\s*(?:parking\s+)?(?:spaces?|stalls?|spots?|cars?)/gi,
    /(?:capacity|accommodat\w*|hold\w*|park\w*|fit\w*)\s*(?:of|:|-|up\s+to)?\s*(\d{2,5})/gi,
    /(\d{2,5})\s*(?:car|vehicle)\s*(?:capacity|garage|parking|lot)/gi,
    /(?:total|max|full)\s*(?:capacity|spaces?|spots?)\s*(?::|of|=|-)?\s*(\d{2,5})/gi,
    /(\d{2,5})[\s-](?:space|stall|spot|car)\b/gi,
    /(?:garage|structure|lot|facility)\s+(?:\w+\s+){0,3}(\d{2,5})\s*space/gi,
    /(\d{3,5})\s*(?:space|stall|spot)/gi,
  ];

  const candidates: number[] = [];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(t)) !== null) {
      const numStr = match[1] || match[2];
      if (numStr) {
        const num = parseInt(numStr);
        if (num >= 50 && num <= 15000) {
          candidates.push(num);
        }
      }
    }
  }

  if (candidates.length > 0) {
    // Return the most common number, or the first one
    const freq = new Map<number, number>();
    for (const c of candidates) {
      freq.set(c, (freq.get(c) || 0) + 1);
    }
    const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
    return { capacity: sorted[0][0] };
  }

  return null;
}
