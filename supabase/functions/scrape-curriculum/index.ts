import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  if (!firecrawlKey) {
    return new Response(
      JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  if (!lovableKey) {
    return new Response(
      JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const sb = createClient(supabaseUrl, serviceKey);

  try {
    const { school_id, catalog_url } = await req.json();
    if (!school_id || !catalog_url) {
      return new Response(
        JSON.stringify({ error: "school_id and catalog_url are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auth check — must be superadmin
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const userSb = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: { user } } = await userSb.auth.getUser(token);
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create curriculum record
    const { data: curriculum, error: insertErr } = await sb
      .from("school_curricula")
      .insert({ school_id, source_url: catalog_url, status: "scraping" })
      .select("id")
      .single();

    if (insertErr) throw new Error(`Failed to create curriculum: ${insertErr.message}`);
    const curriculumId = curriculum.id;

    // Step 1: Map the catalog to find all program URLs
    console.log("Step 1: Mapping catalog URL:", catalog_url);
    const mapRes = await fetch("https://api.firecrawl.dev/v1/map", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: catalog_url,
        search: "program degree bachelor master certificate",
        limit: 500,
        includeSubdomains: false,
      }),
    });

    const mapData = await mapRes.json();
    if (!mapRes.ok) {
      await sb.from("school_curricula").update({
        status: "failed", error_message: `Map failed: ${JSON.stringify(mapData)}`,
      }).eq("id", curriculumId);
      throw new Error(`Firecrawl map failed: ${JSON.stringify(mapData)}`);
    }

    // Filter for program/preview URLs
    const allLinks: string[] = mapData.links || [];
    const programLinks = allLinks.filter((url: string) =>
      url.includes("preview_program") || url.includes("program") || url.includes("poid=")
    ).slice(0, 50); // cap at 50 programs for now

    console.log(`Found ${allLinks.length} total links, ${programLinks.length} program links`);

    await sb.from("school_curricula").update({
      programs_found: programLinks.length,
    }).eq("id", curriculumId);

    if (programLinks.length === 0) {
      await sb.from("school_curricula").update({
        status: "completed", completed_at: new Date().toISOString(),
        error_message: "No program pages found",
      }).eq("id", curriculumId);
      return new Response(
        JSON.stringify({ curriculum_id: curriculumId, programs_found: 0, message: "No program pages found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Scrape program pages in batches
    console.log("Step 2: Scraping program pages...");
    let programsParsed = 0;
    const batchSize = 5;

    for (let i = 0; i < programLinks.length; i += batchSize) {
      const batch = programLinks.slice(i, i + batchSize);
      const scrapePromises = batch.map(async (url: string) => {
        try {
          const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${firecrawlKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url,
              formats: ["markdown"],
              onlyMainContent: true,
              waitFor: 2000,
            }),
          });

          const scrapeData = await scrapeRes.json();
          if (!scrapeRes.ok) {
            console.warn(`Scrape failed for ${url}:`, scrapeData);
            return null;
          }

          const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
          const title = scrapeData.data?.metadata?.title || scrapeData.metadata?.title || "";

          if (!markdown || markdown.length < 100) return null;

          return { url, markdown, title };
        } catch (err) {
          console.warn(`Error scraping ${url}:`, err);
          return null;
        }
      });

      const results = await Promise.all(scrapePromises);
      const validResults = results.filter(Boolean);

      if (validResults.length === 0) continue;

      // Step 3: Use AI to extract skills from each program
      for (const result of validResults) {
        if (!result) continue;
        try {
          const aiRes = await fetch("https://api.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: `You are a curriculum analyst. Extract structured information from university program descriptions.
Return ONLY valid JSON with this schema:
{
  "program_name": "string — full program name",
  "degree_type": "BS|BA|BFA|MS|MA|MBA|PhD|Certificate|Minor|Other",
  "department": "string — school or department name",
  "skills": ["array of specific skills taught, e.g. 'financial modeling', 'data analysis', 'project management'"],
  "skill_categories": {
    "technical": ["skills"],
    "analytical": ["skills"],
    "communication": ["skills"],
    "leadership": ["skills"],
    "creative": ["skills"],
    "compliance": ["skills"]
  }
}
Extract 5-20 concrete, job-relevant skills. Focus on practical capabilities, not course names.`,
                },
                {
                  role: "user",
                  content: `Extract skills from this program page:\n\nTitle: ${result.title}\nURL: ${result.url}\n\n${result.markdown.slice(0, 4000)}`,
                },
              ],
              temperature: 0.1,
            }),
          });

          const aiData = await aiRes.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          
          // Parse JSON from AI response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            console.warn(`No JSON in AI response for ${result.url}`);
            continue;
          }

          const parsed = JSON.parse(jsonMatch[0]);

          await sb.from("school_courses").insert({
            curriculum_id: curriculumId,
            school_id,
            program_name: parsed.program_name || result.title || "Unknown Program",
            degree_type: parsed.degree_type || null,
            department: parsed.department || null,
            source_url: result.url,
            description: result.markdown.slice(0, 2000),
            skills_extracted: parsed.skills || [],
            skill_categories: parsed.skill_categories || {},
          });

          programsParsed++;
          await sb.from("school_curricula").update({
            programs_parsed: programsParsed,
          }).eq("id", curriculumId);
        } catch (aiErr) {
          console.warn(`AI parsing failed for ${result.url}:`, aiErr);
        }
      }

      // Small delay between batches to avoid rate limits
      if (i + batchSize < programLinks.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // Mark complete
    await sb.from("school_curricula").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      programs_parsed: programsParsed,
    }).eq("id", curriculumId);

    console.log(`Done! Parsed ${programsParsed} programs from ${programLinks.length} links`);

    return new Response(
      JSON.stringify({
        curriculum_id: curriculumId,
        programs_found: programLinks.length,
        programs_parsed: programsParsed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("scrape-curriculum error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
