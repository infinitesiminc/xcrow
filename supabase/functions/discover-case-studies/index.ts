import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

// Patterns that suggest a link points to an individual case study / customer story / use case
const CHILD_PATTERNS = [
  /\/(customers?|case-stud(y|ies)|success-stor(y|ies)|stories|use-cases?|clients?|testimonials?|wins?)\/[^/?#]+\/?$/i,
];

// Patterns that suggest a link is a hub (skip these as children)
const HUB_PATTERNS = [
  /\/(customers?|case-stud(y|ies)|success-stor(y|ies)|stories|use-cases?|clients?|testimonials?)\/?(?:\?.*)?$/i,
];

// Junk we never want
const JUNK_PATTERNS = [
  /\/(blog|news|press|careers|jobs|legal|privacy|terms|cookie|sitemap|feed|wp-|category|tag|page|search|login|signup|signin|contact|pricing|docs|api)/i,
  /\.(pdf|jpg|jpeg|png|gif|svg|webp|mp4|zip)(\?|$)/i,
];

function looksLikeChildCaseStudy(url: string, baseUrl: string): boolean {
  try {
    const u = new URL(url);
    const base = new URL(baseUrl);
    if (u.hostname !== base.hostname) return false;
    if (HUB_PATTERNS.some((p) => p.test(u.pathname))) return false;
    if (JUNK_PATTERNS.some((p) => p.test(u.pathname))) return false;
    if (CHILD_PATTERNS.some((p) => p.test(u.pathname))) return true;
    // Heuristic: if pathname starts with same first segment as base AND has additional segment(s)
    const baseFirst = base.pathname.split("/").filter(Boolean)[0];
    const childSegs = u.pathname.split("/").filter(Boolean);
    if (baseFirst && childSegs[0]?.toLowerCase() === baseFirst.toLowerCase() && childSegs.length >= 2) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function extractAnchors(html: string, baseUrl: string): { url: string; text: string }[] {
  const out: { url: string; text: string }[] = [];
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const resolved = new URL(m[1], baseUrl).href.split("#")[0];
      const text = m[2]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120);
      out.push({ url: resolved, text });
    } catch {
      /* skip */
    }
  }
  return out;
}

async function fetchHtml(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": BROWSER_UA, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

async function fetchHtmlWithFirecrawlFallback(url: string): Promise<string> {
  let html = await fetchHtml(url);
  if (html && html.length > 1500) return html;
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) return html;
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["html"], onlyMainContent: false }),
    });
    const data = await res.json();
    const fcHtml = data?.data?.html || "";
    if (fcHtml && fcHtml.length > html.length) return fcHtml;
  } catch (e) {
    console.warn("Firecrawl fallback failed:", e);
  }
  return html;
}

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

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let inputUrl = (body.url || "").trim();
  if (!inputUrl) {
    return new Response(JSON.stringify({ error: "url required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!/^https?:\/\//i.test(inputUrl)) inputUrl = `https://${inputUrl}`;

  let baseUrl: URL;
  try {
    baseUrl = new URL(inputUrl);
  } catch {
    return new Response(JSON.stringify({ error: "invalid url" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const html = await fetchHtmlWithFirecrawlFallback(inputUrl);
  if (!html) {
    return new Response(
      JSON.stringify({ error: "Could not fetch page", children: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const anchors = extractAnchors(html, inputUrl);

  // Dedupe + filter
  const seen = new Set<string>();
  const children: { url: string; text: string }[] = [];
  for (const a of anchors) {
    if (seen.has(a.url)) continue;
    if (a.url.split("#")[0].split("?")[0] === inputUrl.split("#")[0].split("?")[0]) continue;
    if (!looksLikeChildCaseStudy(a.url, inputUrl)) continue;
    seen.add(a.url);
    children.push({ url: a.url, text: a.text });
    if (children.length >= 30) break;
  }

  const isHub = children.length >= 2;

  return new Response(
    JSON.stringify({
      isHub,
      sourceUrl: inputUrl,
      children: children.slice(0, 20),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
