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

    // Auth check
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

    // Step 1: Map the catalog — use broader search terms
    console.log("Step 1: Mapping catalog URL:", catalog_url);
    const mapRes = await fetch("https://api.firecrawl.dev/v1/map", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: catalog_url,
        search: "program degree major minor bachelor master certificate department school",
        limit: 2000,
        includeSubdomains: true,
      }),
    });

    const mapText = await mapRes.text();
    let mapData: any;
    try { mapData = JSON.parse(mapText); } catch {
      await sb.from("school_curricula").update({
        status: "failed", error_message: `Map returned non-JSON: ${mapText.slice(0, 200)}`,
      }).eq("id", curriculumId);
      throw new Error("Firecrawl map returned non-JSON");
    }

    if (!mapRes.ok) {
      await sb.from("school_curricula").update({
        status: "failed", error_message: `Map failed: ${JSON.stringify(mapData).slice(0, 500)}`,
      }).eq("id", curriculumId);
      throw new Error(`Firecrawl map failed`);
    }

    // Filter for program URLs — broader matching for various catalog systems
    const allLinks: string[] = mapData.links || [];
    console.log(`Map returned ${allLinks.length} total links. Sample:`, allLinks.slice(0, 10));

    const programLinks = allLinks.filter((url: string) => {
      const lower = url.toLowerCase();
      // Match common catalog URL patterns
      return (
        lower.includes("preview_program") ||
        lower.includes("poid=") ||
        lower.includes("/program") ||
        lower.includes("/major") ||
        lower.includes("/degree") ||
        lower.includes("/minor") ||
        lower.includes("/certificate") ||
        lower.includes("preview_entity") ||
        lower.includes("catoid=")
      );
    })
    // Exclude non-program pages
    .filter((url: string) => {
      const lower = url.toLowerCase();
      return !lower.includes("preview_course") && !lower.includes("login") && !lower.includes("search");
    })
    // Deduplicate
    .filter((url: string, idx: number, arr: string[]) => arr.indexOf(url) === idx)
    .slice(0, 80);

    console.log(`Filtered to ${programLinks.length} program links. Sample:`, programLinks.slice(0, 5));

    await sb.from("school_curricula").update({
      programs_found: programLinks.length,
    }).eq("id", curriculumId);

    if (programLinks.length === 0) {
      await sb.from("school_curricula").update({
        status: "completed", completed_at: new Date().toISOString(),
        error_message: "No program pages found. Check if the catalog URL uses a supported format.",
      }).eq("id", curriculumId);
      return new Response(
        JSON.stringify({ curriculum_id: curriculumId, programs_found: 0, all_links_sample: allLinks.slice(0, 20) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Scrape + parse in batches
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
              waitFor: 3000,
            }),
          });

          const scrapeText = await scrapeRes.text();
          let scrapeData: any;
          try { scrapeData = JSON.parse(scrapeText); } catch {
            console.warn(`Scrape returned non-JSON for ${url}`);
            return null;
          }
          if (!scrapeRes.ok) {
            console.warn(`Scrape failed for ${url}:`, scrapeData?.error);
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

      // Step 3: AI extraction
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
Return ONLY valid JSON (no markdown fences) with this schema:
{
  "program_name": "string",
  "degree_type": "BS|BA|BFA|MS|MA|MBA|PhD|Certificate|Minor|Other",
  "department": "string",
  "skills": ["array of 5-20 specific, job-relevant skills"],
  "skill_categories": {
    "technical": ["skills"],
    "analytical": ["skills"],
    "communication": ["skills"],
    "leadership": ["skills"],
    "creative": ["skills"],
    "compliance": ["skills"]
  }
}
Focus on practical capabilities, not course names.`,
                },
                {
                  role: "user",
                  content: `Extract skills from this program page:\n\nTitle: ${result.title}\nURL: ${result.url}\n\n${result.markdown.slice(0, 4000)}`,
                },
              ],
              temperature: 0.1,
            }),
          });

          // Safe response parsing
          const aiText = await aiRes.text();
          if (!aiRes.ok) {
            console.warn(`AI API error for ${result.url}: ${aiRes.status} ${aiText.slice(0, 200)}`);
            continue;
          }

          let aiData: any;
          try { aiData = JSON.parse(aiText); } catch {
            console.warn(`AI returned non-JSON for ${result.url}: ${aiText.slice(0, 200)}`);
            continue;
          }

          const content = aiData.choices?.[0]?.message?.content || "";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            console.warn(`No JSON in AI response for ${result.url}:`, content.slice(0, 200));
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

          console.log(`Parsed program ${programsParsed}: ${parsed.program_name || result.title}`);
        } catch (aiErr) {
          console.warn(`AI parsing failed for ${result.url}:`, aiErr);
        }
      }

      if (i + batchSize < programLinks.length) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

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
