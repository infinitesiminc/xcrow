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
        const searchQuery = `"${garage.name}" parking capacity spaces ${garage.address || "Los Angeles"}`;
        console.log(`Searching capacity for: ${garage.name}`);

        // Use Firecrawl search to find capacity info
        const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: 3,
            scrapeOptions: { formats: ["markdown"] },
          }),
        });

        if (!searchResp.ok) {
          console.error(`Firecrawl search failed for ${garage.name}: ${searchResp.status}`);
          const errText = await searchResp.text();
          console.error(errText);
          skipped++;
          results.push({ name: garage.name, capacity: null, source: null });
          continue;
        }

        const searchData = await searchResp.json();
        const searchResults = searchData.data || [];

        // Extract capacity from search results
        let capacity: number | null = null;
        let source: string | null = null;

        for (const result of searchResults) {
          const text = (result.markdown || result.description || "").toLowerCase();
          
          // Pattern matching for capacity numbers
          const patterns = [
            /(\d{1,5})\s*(?:parking\s+)?(?:spaces?|stalls?|spots?)/i,
            /capacity\s*(?:of|:)?\s*(\d{1,5})/i,
            /(\d{1,5})\s*(?:car|vehicle)\s*(?:capacity|spaces?)/i,
            /(?:spaces?|stalls?|spots?)\s*(?:available|total)?\s*[:=]?\s*(\d{1,5})/i,
            /(\d{2,5})-(?:space|stall|spot)/i,
          ];

          for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
              const num = parseInt(match[1]);
              // Sanity check: parking garages typically have 50-10000 spaces
              if (num >= 20 && num <= 15000) {
                capacity = num;
                source = result.url || "firecrawl-search";
                break;
              }
            }
          }
          if (capacity) break;
        }

        if (capacity) {
          const { error: updateErr } = await supabase
            .from("discovered_garages")
            .update({ capacity, capacity_source: source })
            .eq("id", garage.id);

          if (!updateErr) {
            enriched++;
            console.log(`✓ ${garage.name}: ${capacity} spaces (${source})`);
          } else {
            console.error(`Update failed for ${garage.name}:`, updateErr.message);
          }
        } else {
          skipped++;
          console.log(`✗ ${garage.name}: no capacity found`);
        }

        results.push({ name: garage.name, capacity, source });

        // Rate limit
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
