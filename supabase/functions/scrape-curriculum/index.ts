import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProgramEntry {
  name: string;
  degreeType: string;
  url: string;
}

/** Parse program entries from the listing page markdown/HTML */
function parseProgramLinks(markdown: string, baseUrl: string): ProgramEntry[] {
  const programs: ProgramEntry[] = [];
  // Match links like [Accounting (BS)](https://catalogue.usc.edu/preview_program.php?catoid=21&poid=29561...)
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]*preview_program[^\s)]*)\)/g;
  let match;
  while ((match = linkRegex.exec(markdown)) !== null) {
    const rawName = match[1].replace(/\*$/, "").trim(); // remove trailing asterisk
    const url = match[2].split("#")[0]; // remove fragment

    // Extract degree type from parentheses: "Accounting (BS)" → BS
    const degreeMatch = rawName.match(/\(([A-Z][A-Za-z]{1,5})\)\s*$/);
    const degreeType = degreeMatch ? degreeMatch[1] : "Other";
    const name = degreeMatch ? rawName.replace(/\s*\([A-Z][A-Za-z]{1,5}\)\s*$/, "").trim() : rawName;

    // Deduplicate by URL
    if (!programs.some((p) => p.url === url)) {
      programs.push({ name, degreeType, url });
    }
  }
  return programs;
}

/** Safe fetch wrapper with timeout */
async function safeFetch(url: string, options: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  if (!firecrawlKey) {
    return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!lovableKey) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(supabaseUrl, serviceKey);

  try {
    const { school_id, catalog_url } = await req.json();
    if (!school_id || !catalog_url) {
      return new Response(JSON.stringify({ error: "school_id and catalog_url are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create curriculum record
    const { data: curriculum, error: insertErr } = await sb
      .from("school_curricula")
      .insert({ school_id, source_url: catalog_url, status: "scraping" })
      .select("id")
      .single();

    if (insertErr) throw new Error(`Failed to create curriculum: ${insertErr.message}`);
    const curriculumId = curriculum.id;

    // ─── Step 1: Scrape the listing page to discover all programs ───
    console.log("Step 1: Scraping listing page:", catalog_url);

    const listingRes = await safeFetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: catalog_url,
        formats: ["markdown", "links"],
        onlyMainContent: false,
        waitFor: 5000,
      }),
    });

    const listingText = await listingRes.text();
    let listingData: any;
    try { listingData = JSON.parse(listingText); } catch {
      await sb.from("school_curricula").update({
        status: "failed", error_message: `Listing page returned non-JSON`,
      }).eq("id", curriculumId);
      throw new Error("Listing page returned non-JSON");
    }

    if (!listingRes.ok) {
      await sb.from("school_curricula").update({
        status: "failed", error_message: `Listing scrape failed: ${listingData?.error || listingRes.status}`,
      }).eq("id", curriculumId);
      throw new Error("Listing page scrape failed");
    }

    // Try parsing from markdown first, then fall back to links array
    const listingMarkdown = listingData.data?.markdown || listingData.markdown || "";
    const rawLinks: string[] = listingData.data?.links || listingData.links || [];
    
    console.log(`Scrape returned markdown length: ${listingMarkdown.length}, raw links: ${rawLinks.length}`);
    
    let programs = parseProgramLinks(listingMarkdown, catalog_url);
    
    // If markdown parsing found nothing, build from raw links array
    if (programs.length === 0 && rawLinks.length > 0) {
      console.log("Markdown parsing found 0 programs, falling back to raw links array");
      const programUrls = rawLinks.filter((url: string) =>
        url.includes("preview_program")
      );
      programs = programUrls.map((url: string) => {
        // Try to extract name from URL params or use generic name
        const poidMatch = url.match(/poid=(\d+)/);
        return {
          name: `Program ${poidMatch?.[1] || "Unknown"}`,
          degreeType: "Other",
          url: url.split("#")[0],
        };
      }).filter((p, i, arr) => arr.findIndex((x) => x.url === p.url) === i);
    }

    // Cap to first 10 programs for testing
    if (programs.length > 10) {
      console.log(`Capping from ${programs.length} to 10 programs`);
      programs = programs.slice(0, 10);
    }
    console.log(`Processing ${programs.length} programs`);
    console.log("Sample programs:", programs.slice(0, 5).map((p) => `${p.name} (${p.degreeType})`));

    await sb.from("school_curricula").update({ programs_found: programs.length }).eq("id", curriculumId);

    if (programs.length === 0) {
      await sb.from("school_curricula").update({
        status: "completed",
        completed_at: new Date().toISOString(),
        error_message: "No program links found on listing page. Try a more specific programs listing URL.",
      }).eq("id", curriculumId);
      return new Response(JSON.stringify({
        curriculum_id: curriculumId,
        programs_found: 0,
        message: "No program links found",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── Step 2: Scrape each program page + AI skill extraction ───
    console.log("Step 2: Scraping program pages for skill extraction...");
    let programsParsed = 0;
    const batchSize = 5;

    for (let i = 0; i < programs.length; i += batchSize) {
      const batch = programs.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (program) => {
          try {
            const scrapeRes = await safeFetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${firecrawlKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: program.url,
                formats: ["markdown"],
                onlyMainContent: true,
                waitFor: 3000,
              }),
            });

            const scrapeText = await scrapeRes.text();
            let scrapeData: any;
            try { scrapeData = JSON.parse(scrapeText); } catch { return null; }
            if (!scrapeRes.ok) return null;

            const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
            if (!markdown || markdown.length < 80) return null;

            return { ...program, markdown };
          } catch (err) {
            console.warn(`Scrape error for ${program.name}:`, err);
            return null;
          }
        })
      );

      // AI extraction for each successful scrape
      for (const result of batchResults) {
        if (!result) continue;

        try {
          const aiRes = await safeFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                  content: `You are a curriculum analyst. Given a university program overview, extract the key professional skills and competencies this program develops.

Return ONLY valid JSON (no markdown fences) with this schema:
{
  "department": "string — school or college name",
  "description": "string — 1-2 sentence summary of what this program prepares students for",
  "skills": ["array of 5-15 specific, job-relevant skills this program teaches"],
  "skill_categories": {
    "technical": ["concrete technical skills"],
    "analytical": ["analytical/quantitative skills"],
    "communication": ["communication/writing skills"],
    "leadership": ["management/leadership skills"],
    "creative": ["creative/design skills"],
    "domain_specific": ["field-specific professional competencies"]
  }
}

Focus on practical, job-relevant capabilities — not course codes or academic requirements.`,
                },
                {
                  role: "user",
                  content: `Program: ${result.name} (${result.degreeType})\nURL: ${result.url}\n\n${result.markdown.slice(0, 5000)}`,
                },
              ],
              temperature: 0.1,
            }),
          });

          const aiText = await aiRes.text();
          if (!aiRes.ok) {
            console.warn(`AI error for ${result.name}: ${aiRes.status} ${aiText.slice(0, 200)}`);
            continue;
          }

          let aiData: any;
          try { aiData = JSON.parse(aiText); } catch {
            console.warn(`AI non-JSON for ${result.name}: ${aiText.slice(0, 200)}`);
            continue;
          }

          const content = aiData.choices?.[0]?.message?.content || "";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            console.warn(`No JSON in AI response for ${result.name}`);
            continue;
          }

          const parsed = JSON.parse(jsonMatch[0]);

          await sb.from("school_courses").insert({
            curriculum_id: curriculumId,
            school_id,
            program_name: result.name,
            degree_type: result.degreeType,
            department: parsed.department || null,
            source_url: result.url,
            description: parsed.description || result.markdown.slice(0, 500),
            skills_extracted: parsed.skills || [],
            skill_categories: parsed.skill_categories || {},
          });

          programsParsed++;
          await sb.from("school_curricula").update({ programs_parsed: programsParsed }).eq("id", curriculumId);
          console.log(`✓ [${programsParsed}/${programs.length}] ${result.name} (${result.degreeType})`);
        } catch (aiErr) {
          console.warn(`AI parsing failed for ${result.name}:`, aiErr);
        }
      }

      // Rate limit pause between batches
      if (i + batchSize < programs.length) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    // ─── Done ───
    await sb.from("school_curricula").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      programs_parsed: programsParsed,
    }).eq("id", curriculumId);

    console.log(`Done! Parsed ${programsParsed}/${programs.length} programs`);

    return new Response(JSON.stringify({
      curriculum_id: curriculumId,
      programs_found: programs.length,
      programs_parsed: programsParsed,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("scrape-curriculum error:", err);
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
