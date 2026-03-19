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
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]*preview_program[^\s)]*)\)/g;
  let match;
  while ((match = linkRegex.exec(markdown)) !== null) {
    const rawName = match[1].replace(/\*$/, "").trim();
    const url = match[2].split("#")[0];
    const degreeMatch = rawName.match(/\(([A-Z][A-Za-z]{1,5})\)\s*$/);
    const degreeType = degreeMatch ? degreeMatch[1] : "Other";
    const name = degreeMatch ? rawName.replace(/\s*\([A-Z][A-Za-z]{1,5}\)\s*$/, "").trim() : rawName;
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

/** AI extraction prompt for deep course-level analysis */
const EXTRACTION_PROMPT = `You are a curriculum analyst. Given a university program page, extract DETAILED course-level data.

Return ONLY valid JSON (no markdown fences) with this schema:
{
  "department": "string — school or college name",
  "description": "string — 1-2 sentence summary of career outcomes",
  "skills": ["array of 8-20 specific, job-relevant skills"],
  "skill_categories": {
    "technical": ["concrete technical skills"],
    "analytical": ["analytical/quantitative skills"],
    "communication": ["communication/writing skills"],
    "leadership": ["management/leadership skills"],
    "creative": ["creative/design skills"],
    "domain_specific": ["field-specific professional competencies"]
  },
  "tools_taught": ["specific software, platforms, languages, frameworks mentioned (e.g. Python, Excel, Tableau, AutoCAD, SPSS, Figma, SQL)"],
  "ai_content_flag": true/false,
  "ai_topics": ["any AI/ML/automation/data science topics if present"],
  "learning_outcomes": [
    {"outcome": "verb-led competency statement", "level": "introductory|intermediate|advanced"}
  ],
  "industry_sectors": ["target industries this program prepares for (e.g. Healthcare, Finance, Technology)"],
  "courses": [
    {
      "code": "course code if visible (e.g. ACCT 410)",
      "name": "course title",
      "description": "1 sentence summary if available",
      "skills": ["2-5 skills this specific course teaches"],
      "tools": ["specific tools/software if mentioned"],
      "is_ai_related": true/false,
      "level": "introductory|intermediate|advanced|capstone"
    }
  ]
}

IMPORTANT:
- Extract EVERY individual course listed on the page
- For tools_taught, only list specific named tools/technologies, not generic terms
- Set ai_content_flag=true if ANY course covers AI, machine learning, automation, or data science
- Learning outcomes should use action verbs (analyze, design, evaluate, implement)
- Industry sectors should map to real job market categories
- Focus on practical, job-relevant capabilities — not academic requirements`;

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
    const { school_id, catalog_url, max_programs, skip } = await req.json();
    if (!school_id || !catalog_url) {
      return new Response(JSON.stringify({ error: "school_id and catalog_url are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const programCap = max_programs || 10;
    const skipCount = skip || 0;

    // Create curriculum record
    const { data: curriculum, error: insertErr } = await sb
      .from("school_curricula")
      .insert({ school_id, source_url: catalog_url, status: "scraping" })
      .select("id")
      .single();

    if (insertErr) throw new Error(`Failed to create curriculum: ${insertErr.message}`);
    const curriculumId = curriculum.id;

    // ─── Step 1: Scrape the listing page ───
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
        status: "failed", error_message: "Listing page returned non-JSON",
      }).eq("id", curriculumId);
      throw new Error("Listing page returned non-JSON");
    }

    if (!listingRes.ok) {
      await sb.from("school_curricula").update({
        status: "failed", error_message: `Listing scrape failed: ${listingData?.error || listingRes.status}`,
      }).eq("id", curriculumId);
      throw new Error("Listing page scrape failed");
    }

    const listingMarkdown = listingData.data?.markdown || listingData.markdown || "";
    const rawLinks: string[] = listingData.data?.links || listingData.links || [];

    let programs = parseProgramLinks(listingMarkdown, catalog_url);

    // Fallback to raw links array
    if (programs.length === 0 && rawLinks.length > 0) {
      const programUrls = rawLinks.filter((url: string) => url.includes("preview_program"));
      programs = programUrls.map((url: string) => {
        const poidMatch = url.match(/poid=(\d+)/);
        return { name: `Program ${poidMatch?.[1] || "Unknown"}`, degreeType: "Other", url: url.split("#")[0] };
      }).filter((p, i, arr) => arr.findIndex((x) => x.url === p.url) === i);
    }

    // Cap programs
    if (programs.length > programCap) {
      console.log(`Capping from ${programs.length} to ${programCap} programs`);
      programs = programs.slice(0, programCap);
    }
    console.log(`Processing ${programs.length} programs`);

    await sb.from("school_curricula").update({ programs_found: programs.length }).eq("id", curriculumId);

    if (programs.length === 0) {
      await sb.from("school_curricula").update({
        status: "completed", completed_at: new Date().toISOString(),
        error_message: "No program links found on listing page.",
      }).eq("id", curriculumId);
      return new Response(JSON.stringify({
        curriculum_id: curriculumId, programs_found: 0, message: "No program links found",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── Step 2: Scrape each program page + deep AI extraction ───
    console.log("Step 2: Deep course-level extraction...");
    let programsParsed = 0;
    const batchSize = 3; // smaller batches for deeper extraction

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
                { role: "system", content: EXTRACTION_PROMPT },
                {
                  role: "user",
                  content: `Program: ${result.name} (${result.degreeType})\nURL: ${result.url}\n\n${result.markdown.slice(0, 8000)}`,
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
            console.warn(`AI non-JSON for ${result.name}`);
            continue;
          }

          const content = aiData.choices?.[0]?.message?.content || "";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            console.warn(`No JSON in AI response for ${result.name}`);
            continue;
          }

          const parsed = JSON.parse(jsonMatch[0]);

          // Insert enriched program record
          const { data: courseRecord } = await sb.from("school_courses").insert({
            curriculum_id: curriculumId,
            school_id,
            program_name: result.name,
            degree_type: result.degreeType,
            department: parsed.department || null,
            source_url: result.url,
            description: parsed.description || result.markdown.slice(0, 500),
            skills_extracted: parsed.skills || [],
            skill_categories: parsed.skill_categories || {},
            tools_taught: parsed.tools_taught || [],
            ai_content_flag: parsed.ai_content_flag || false,
            learning_outcomes: parsed.learning_outcomes || [],
            industry_sectors: parsed.industry_sectors || [],
          }).select("id").single();

          // Insert individual course items
          if (courseRecord && parsed.courses && Array.isArray(parsed.courses)) {
            const courseItems = parsed.courses.map((c: any) => ({
              course_id: courseRecord.id,
              school_id,
              course_code: c.code || null,
              course_name: c.name,
              description: c.description || null,
              skills: c.skills || [],
              tools: c.tools || [],
              is_ai_related: c.is_ai_related || false,
              competency_level: c.level || "introductory",
            }));

            if (courseItems.length > 0) {
              const { error: itemsErr } = await sb.from("school_course_items").insert(courseItems);
              if (itemsErr) console.warn(`Course items insert error for ${result.name}:`, itemsErr.message);
              else console.log(`  → ${courseItems.length} individual courses stored`);
            }
          }

          programsParsed++;
          await sb.from("school_curricula").update({ programs_parsed: programsParsed }).eq("id", curriculumId);
          console.log(`✓ [${programsParsed}/${programs.length}] ${result.name} (${result.degreeType}) — ${parsed.courses?.length || 0} courses, ${parsed.tools_taught?.length || 0} tools, AI: ${parsed.ai_content_flag}`);
        } catch (aiErr) {
          console.warn(`AI parsing failed for ${result.name}:`, aiErr);
        }
      }

      // Rate limit pause
      if (i + batchSize < programs.length) {
        await new Promise((r) => setTimeout(r, 2000));
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
