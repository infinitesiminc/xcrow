import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batch_size = 50, offset = 0 } = await req.json().catch(() => ({}));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch jobs that need parsing (have location but no city/country)
    const { data: jobs, error: fetchErr } = await sb
      .from("jobs")
      .select("id, location")
      .not("location", "is", null)
      .is("city", null)
      .is("country", null)
      .order("id")
      .range(offset, offset + batch_size - 1);

    if (fetchErr) throw new Error(`Fetch jobs: ${fetchErr.message}`);
    if (!jobs || jobs.length === 0) {
      return respond({ done: true, parsed: 0, message: "No more jobs to parse" });
    }

    // Build a batch of locations for AI to parse
    const locationMap = new Map<string, string[]>();
    for (const j of jobs) {
      const loc = (j.location || "").trim();
      if (!loc) continue;
      if (!locationMap.has(loc)) locationMap.set(loc, []);
      locationMap.get(loc)!.push(j.id);
    }

    const uniqueLocations = Array.from(locationMap.keys());
    console.log(`Parsing ${uniqueLocations.length} unique locations from ${jobs.length} jobs`);

    // Call AI to parse all unique locations at once
    const aiRes = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        tools: [
          {
            type: "function",
            function: {
              name: "parse_locations",
              description: "Parse raw location strings into structured city, country, and work_mode.",
              parameters: {
                type: "object",
                properties: {
                  locations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        raw: { type: "string", description: "The original location string" },
                        city: { type: "string", description: "Primary city name, or null if remote/unclear. For multi-city listings, use the first city." },
                        country: { type: "string", description: "Country name (full name, e.g. 'United States', 'United Kingdom'). Use 'United States' for US states." },
                        work_mode: { type: "string", enum: ["onsite", "remote", "hybrid"], description: "Work arrangement. Default to 'onsite' if not explicitly remote/hybrid." },
                      },
                      required: ["raw", "city", "country", "work_mode"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["locations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "parse_locations" } },
        messages: [
          {
            role: "system",
            content: `You parse job location strings into structured data. Rules:
- "Remote" or "Remote - Country" → work_mode: "remote", city: null, country from context
- "San Francisco, CA" → city: "San Francisco", country: "United States", work_mode: "onsite"
- "New York, NY (HQ)" → city: "New York", country: "United States", work_mode: "onsite"
- Multi-location like "SF | NYC | Seattle" → use first city, work_mode: "onsite"
- "Hybrid - London" → city: "London", country: "United Kingdom", work_mode: "hybrid"
- State abbreviations (CA, NY, WA) → country: "United States"
- If country unclear but city is US-sounding, default to "United States"
- "Bengaluru, in" → city: "Bengaluru", country: "India"`,
          },
          {
            role: "user",
            content: `Parse these location strings:\n${uniqueLocations.map((l, i) => `${i + 1}. "${l}"`).join("\n")}`,
          },
        ],
        temperature: 0,
      }),
    });

    const aiData = await aiRes.json();
    
    // Extract tool call result
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in AI response:", JSON.stringify(aiData));
      return respond({ error: "AI did not return structured data" }, 422);
    }

    let parsed: { locations: Array<{ raw: string; city: string | null; country: string | null; work_mode: string }> };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      console.error("Failed to parse tool call args:", toolCall.function.arguments);
      return respond({ error: "Failed to parse AI response" }, 422);
    }

    // Update jobs in DB
    let updated = 0;
    for (const loc of parsed.locations) {
      const jobIds = locationMap.get(loc.raw);
      if (!jobIds) continue;

      for (const jobId of jobIds) {
        const { error: updateErr } = await sb
          .from("jobs")
          .update({
            city: loc.city || null,
            country: loc.country || null,
            work_mode: loc.work_mode || "onsite",
          })
          .eq("id", jobId);

        if (updateErr) {
          console.warn(`Failed to update job ${jobId}:`, updateErr.message);
        } else {
          updated++;
        }
      }
    }

    console.log(`Updated ${updated} jobs`);
    return respond({
      done: jobs.length < batch_size,
      parsed: updated,
      unique_locations: uniqueLocations.length,
      batch_size,
      offset,
    });
  } catch (err) {
    console.error("parse-locations error:", err);
    return respond({ error: err.message }, 500);
  }
});

function respond(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
