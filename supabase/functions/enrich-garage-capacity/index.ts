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
    const results: { name: string; capacity: number | null; source: string | null }[] = [];

    for (const garage of garages) {
      try {
        // Try multiple search strategies
        const searchQueries = [
          `"${garage.name}" site:parkme.com OR site:bestparking.com OR site:spothero.com capacity spaces`,
          `"${garage.name}" parking "${garage.address || "Los Angeles"}" total spaces capacity stalls`,
          `"${garage.name}" parking garage spaces levels floors Los Angeles`,
        ];

        let capacity: number | null = null;
        let source: string | null = null;

        for (const searchQuery of searchQueries) {
          if (capacity) break;
          console.log(`Searching: ${searchQuery.substring(0, 80)}...`);

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

          if (!searchResp.ok) {
            console.error(`Firecrawl search failed: ${searchResp.status}`);
            await new Promise(r => setTimeout(r, 300));
            continue;
          }

          const searchData = await searchResp.json();
          const searchResults = searchData.data || [];

          for (const result of searchResults) {
            const text = (result.markdown || result.description || result.title || "").toLowerCase();
            
            // Extended patterns for capacity extraction
            const patterns = [
              /(\d{1,5})\s*(?:parking\s+)?(?:spaces?|stalls?|spots?|cars?)\s*(?:available|total)?/i,
              /capacity\s*(?:of|:|\-)?\s*(\d{1,5})/i,
              /(\d{1,5})\s*(?:car|vehicle)\s*(?:capacity|garage|parking)/i,
              /(?:total|max|maximum)\s*(?:capacity|spaces?|spots?|stalls?)\s*(?::|of|=|-)?\s*(\d{1,5})/i,
              /(\d{2,5})[\s-](?:space|stall|spot|car)\s/i,
              /(?:accommodat|hold|park|fit)(?:e?s?|ing)\s+(?:up\s+to\s+)?(\d{1,5})\s*(?:vehicle|car|space)/i,
              /(\d{1,5})\s*(?:level|floor|stor(?:y|ies)).*?(\d{1,5})\s*space/i,
              /garage.*?(\d{2,5})\s*space/i,
              /space.*?(\d{2,5})/i,
              /(\d{2,5}).*?(?:spaces?|stalls?|spots?)/i,
            ];

            for (const pattern of patterns) {
              const match = text.match(pattern);
              if (match) {
                // Take the last captured group (some patterns have multiple groups)
                const num = parseInt(match[match.length > 2 ? 2 : 1] || match[1]);
                if (num >= 20 && num <= 15000) {
                  capacity = num;
                  source = result.url || "firecrawl-search";
                  break;
                }
              }
            }
            if (capacity) break;
          }

          await new Promise(r => setTimeout(r, 400));
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

        results.push({ name: garage.name, capacity, source });
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
