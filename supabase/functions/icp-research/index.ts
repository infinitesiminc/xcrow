import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

/* ── Scraping helpers ─────────────────────────────────────────── */

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function scrapePage(url: string): Promise<{ text: string; title: string }> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": BROWSER_UA, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
    });
    if (!res.ok) return { text: "", title: "" };
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";
    const mainMatch =
      html.match(/<main[\s\S]*?<\/main>/i) ||
      html.match(/<article[\s\S]*?<\/article>/i) ||
      html.match(/<body[\s\S]*?<\/body>/i);
    const text = htmlToText(mainMatch ? mainMatch[0] : html);
    return { text: text.slice(0, 8000), title };
  } catch {
    return { text: "", title: "" };
  }
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const re = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    try {
      const resolved = new URL(match[1], baseUrl).href;
      if (new URL(resolved).hostname === new URL(baseUrl).hostname) links.push(resolved);
    } catch { /* skip */ }
  }
  return [...new Set(links)];
}

const ICP_PAGE_PATTERNS = [
  /\/(about|company|who-we-are)/i,
  /\/(solutions?|products?|services?|offerings?|platform)/i,
  /\/(pricing|plans)/i,
  /\/(customers?|case-stud|success-stor|testimonials?|clients?)/i,
  /\/(industries?|verticals?|sectors?|markets?)/i,
  /\/(partners?|integrations?|ecosystem)/i,
  /\/(for-|use-cases?)/i,
];

function scoreUrl(url: string): number {
  let score = 0;
  for (const p of ICP_PAGE_PATTERNS) if (p.test(url)) score += 10;
  if (/\/(blog|news|press|careers|jobs|legal|privacy|terms|cookie|sitemap|feed|wp-)/i.test(url)) score -= 20;
  try {
    if (new URL(url).pathname.split("/").filter(Boolean).length > 3) score -= 5;
  } catch { /* skip */ }
  return score;
}

function pickBestPages(allUrls: string[], max: number): string[] {
  const scored = allUrls
    .map((u) => ({ url: u, score: scoreUrl(u) }))
    .filter((u) => u.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked: string[] = [];
  const seenCats = new Set<string>();
  for (const { url } of scored) {
    try {
      const cat = new URL(url).pathname.split("/").filter(Boolean)[0]?.toLowerCase() || "root";
      if (!seenCats.has(cat)) { seenCats.add(cat); picked.push(url); }
    } catch { /* skip */ }
    if (picked.length >= max) break;
  }
  return picked;
}

/* ── Background research job ──────────────────────────────────── */

async function runResearch(jobId: string, domain: string, companyContext?: string, caseStudyUrls?: string[]) {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    await supabaseAdmin.from("research_jobs").update({
      status: "failed",
      error: "AI not configured",
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);
    return;
  }

  try {
    // Phase 1: Scrape homepage
    await supabaseAdmin.from("research_jobs").update({
      current_phase: "PHASE_01",
      progress: 10,
    }).eq("id", jobId);

    let formattedUrl = domain.trim();
    if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

    console.log("Scraping homepage:", formattedUrl);
    let homeHtml = "";
    let homepageText = "";
    try {
      const homeRes = await fetch(formattedUrl, {
        headers: { "User-Agent": BROWSER_UA, Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
        redirect: "follow",
      });
      if (homeRes.ok) {
        homeHtml = await homeRes.text();
        homepageText = htmlToText(homeHtml).slice(0, 5000);
      } else {
        await homeRes.text();
      }
    } catch (e) {
      console.warn("Homepage fetch failed:", e);
    }

    let homeTitle = homeHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
    const domainName = new URL(formattedUrl).hostname.replace("www.", "");

    // Fallback to Firecrawl if basic scrape returned too little content
    if ((!homepageText || homepageText.length < 200) && FIRECRAWL_API_KEY) {
      console.log("Basic scrape insufficient, falling back to Firecrawl for:", formattedUrl);
      try {
        const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: formattedUrl,
            formats: ["markdown", "html"],
            onlyMainContent: false,
          }),
        });
        const fcData = await fcRes.json();
        const fcMarkdown = fcData?.data?.markdown || "";
        const fcHtml = fcData?.data?.html || "";
        const fcTitle = fcData?.data?.metadata?.title || "";
        if (fcMarkdown && fcMarkdown.length > homepageText.length) {
          homepageText = fcMarkdown.slice(0, 8000);
          console.log(`Firecrawl returned ${fcMarkdown.length} chars of markdown`);
        }
        if (fcHtml && fcHtml.length > homeHtml.length) {
          homeHtml = fcHtml;
        }
        if (fcTitle) homeTitle = fcTitle;
      } catch (e) {
        console.warn("Firecrawl fallback failed:", e);
      }
    }

    if (!homepageText || homepageText.length < 50) {
      homepageText = `Company website: ${domainName}. (Content could not be scraped.)`;
    }

    // Phase 2: Scrape ICP-relevant subpages
    await supabaseAdmin.from("research_jobs").update({
      current_phase: "PHASE_02",
      progress: 30,
    }).eq("id", jobId);

    const allLinks = extractLinks(homeHtml, formattedUrl);
    const bestPages = pickBestPages(allLinks, 5);
    console.log("Scraping subpages:", bestPages);

    const pageResults = await Promise.all(
      bestPages.map(async (pageUrl) => {
        const { text, title } = await scrapePage(pageUrl);
        const path = new URL(pageUrl).pathname;
        return { path, content: text.slice(0, 3000), ok: !!text, title };
      })
    );

    // Phase 3: AI analysis
    await supabaseAdmin.from("research_jobs").update({
      current_phase: "PHASE_03",
      progress: 50,
    }).eq("id", jobId);

    // Deep Research: scrape user-provided customer case study URLs
    let caseStudyBlock = "";
    const validCaseStudies = (caseStudyUrls || [])
      .map((u) => (u || "").trim())
      .filter((u) => /^https?:\/\//i.test(u))
      .slice(0, 10);

    if (validCaseStudies.length > 0) {
      console.log(`Deep Research: scraping ${validCaseStudies.length} case studies`);
      const caseResults = await Promise.all(
        validCaseStudies.map(async (url) => {
          const { text, title } = await scrapePage(url);
          return { url, title, content: text.slice(0, 4000) };
        })
      );
      const successful = caseResults.filter((c) => c.content);
      if (successful.length > 0) {
        caseStudyBlock = successful
          .map(
            (c, i) =>
              `### Case Study ${i + 1}: ${c.title || c.url}\nSource: ${c.url}\n${c.content}`
          )
          .join("\n\n");
        console.log(`Deep Research: ${successful.length}/${validCaseStudies.length} case studies scraped successfully`);
      }
    }

    const combinedContent = [
      `## Homepage (${homeTitle})\n${homepageText}`,
      ...pageResults.filter((p) => p.content).map((p) => `## ${p.path}\n${p.content}`),
    ].join("\n\n---\n\n");

    const pagesScraped = 1 + pageResults.filter((p) => p.content).length;
    console.log(`Combined content from ${pagesScraped} pages (${combinedContent.length} chars)`);

    const hasCaseStudies = caseStudyBlock.length > 0;

    const systemPrompt = `You are a B2B go-to-market research analyst. Analyze scraped website content and produce a precise, actionable ICP report for outbound sales.

Rules:
- Be specific: real company names, real job titles, real revenue figures where possible
- No filler, no hedging — every claim grounded in evidence from the scraped pages
- Focus 60% of depth on ICP & Buyer Personas
- For each persona, include a "Search titles" list of 3-5 exact job titles searchable on LinkedIn/Apollo
- Use competitive intelligence to sharpen ICPs: identify gaps competitors leave, and tailor personas/triggers to exploit those gaps${
      hasCaseStudies
        ? `
- DEEP RESEARCH MODE ACTIVE: The user has provided ${validCaseStudies.length} real customer case studies (proven wins). These are the HIGHEST-SIGNAL inputs.
- CRITICAL: Generate EXACTLY ONE ICP segment per case study (so ${validCaseStudies.length} segments total — no more, no less). Each segment must map 1:1 to a single case study and be named after the customer profile from that study (e.g. "Mid-Market Fintech CFOs (from Acme case study)").
- Extract the actual buyer titles, company sizes, industries, pain points, and triggers MENTIONED in each case study. Quote case-study evidence directly when justifying every persona.`
        : ""
    }`;

    const userPrompt = `Deep analysis of: ${domainName}
${companyContext ? `\nContext: ${companyContext}` : ""}
Pages scraped: ${pagesScraped}${hasCaseStudies ? `\nProven customer case studies provided: ${validCaseStudies.length}` : ""}

Use these EXACT markdown headers:

## Company Overview
What they sell, business model, pricing if discoverable, estimated revenue/headcount.

## Competitive Landscape
For each direct competitor (identify 3-6):
### [Competitor Name]
- **Domain**: competitor's website
- **Positioning**: how they position vs ${domainName}
- **Where ${domainName} wins**: specific advantages
- **Where ${domainName} loses**: specific weaknesses
- **Switching triggers**: what would make their customers switch to ${domainName}

IMPORTANT: Put Competitive Landscape BEFORE ICP Segments so competitor insights can inform persona targeting.

## ICP Segments and Buyer Personas
${hasCaseStudies ? `Produce EXACTLY ${validCaseStudies.length} segments — one per provided case study, in the same order. Each segment derives entirely from its matching case study:` : "For EACH segment (identify 2-4):"}
### [Segment Name]${hasCaseStudies ? " (from Case Study N)" : ""}
- **Company fit**: industry, employee range, revenue range, tech stack signals, geography
- **Primary buyer**: exact title, department, seniority, pain points this product solves
- **Secondary buyer**: same detail
- **Buying triggers**: events that create urgency — INCLUDE competitor-driven triggers (e.g. "frustrated with [Competitor]'s pricing", "outgrowing [Competitor]'s capabilities")${hasCaseStudies ? `\n- **Proof from case study**: cite the exact case study this segment is derived from (e.g. "Case Study 2: Acme Corp signed after outgrowing Competitor X") — REQUIRED` : ""}
- **Competitive angle**: why ${domainName} beats alternatives for THIS specific segment
- **Disqualifiers**: what makes a company NOT a fit
- **Search titles**: list 3-5 exact job titles to search on LinkedIn/Apollo (e.g. "VP of Sales", "Director of Payments", "Head of Revenue Operations")${hasCaseStudies ? " — prioritize titles that appear verbatim in the case study" : ""}

## Prospecting Targets
5-10 specific companies that fit the ICPs above. For each:
- Company name and domain
- Which ICP segment they match
- Why they'd buy (specific rationale)
- Current solution they likely use (competitor name if known)
- Decision-maker title to target
${hasCaseStudies ? `\n--- PROVEN CUSTOMER CASE STUDIES (HIGHEST PRIORITY EVIDENCE) ---\n\n${caseStudyBlock}\n\n` : ""}
--- SCRAPED COMPANY CONTENT ---

${combinedContent.slice(0, hasCaseStudies ? 14000 : 20000)}`;

    const aiRes = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error(`AI error ${aiRes.status}: ${errText}`);
      await supabaseAdmin.from("research_jobs").update({
        status: "failed",
        error: `AI error: ${aiRes.status}`,
        completed_at: new Date().toISOString(),
      }).eq("id", jobId);
      return;
    }

    const aiData = await aiRes.json();
    const reportText = aiData.choices?.[0]?.message?.content || "";

    // Phase 4: Complete
    await supabaseAdmin.from("research_jobs").update({
      status: "complete",
      progress: 100,
      current_phase: "PHASE_04",
      report_text: reportText,
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);

    console.log("Research complete, report length:", reportText.length);
  } catch (err) {
    console.error("Research pipeline error:", err);
    await supabaseAdmin.from("research_jobs").update({
      status: "failed",
      error: String(err),
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);
  }
}

/* ── HTTP handler ─────────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let userId: string | null = null;
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    userId = user?.id ?? null;
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { domain: string; companyContext?: string; caseStudyUrls?: string[] };
  try {
    body = await req.json();
    if (!body.domain) throw new Error("Missing domain");
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request: domain required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: job, error: insertError } = await supabaseAdmin.from("research_jobs").insert({
    user_id: userId,
    domain: body.domain,
    company_context: body.companyContext || null,
    status: "processing",
    progress: 0,
    current_phase: "PHASE_01",
  }).select("id").single();

  if (insertError || !job) {
    return new Response(JSON.stringify({ error: "Failed to create research job" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fire and forget
  (globalThis as any).EdgeRuntime.waitUntil(
    runResearch(job.id, body.domain, body.companyContext, body.caseStudyUrls)
  );

  return new Response(JSON.stringify({ job_id: job.id }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
