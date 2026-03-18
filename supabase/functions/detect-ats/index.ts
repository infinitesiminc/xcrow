import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ATS_PATTERNS: { platform: string; patterns: RegExp[] }[] = [
  { platform: "greenhouse", patterns: [/boards\.greenhouse\.io/i, /greenhouse\.io/i] },
  { platform: "ashby", patterns: [/jobs\.ashbyhq\.com/i, /ashbyhq\.com/i] },
  { platform: "lever", patterns: [/jobs\.lever\.co/i, /lever\.co/i] },
  { platform: "smartrecruiters", patterns: [/jobs\.smartrecruiters\.com/i, /smartrecruiters\.com/i] },
  { platform: "workday", patterns: [/myworkdayjobs\.com/i] },
  { platform: "bamboohr", patterns: [/bamboohr\.com\/(?:careers|jobs)/i] },
  { platform: "icims", patterns: [/icims\.com/i] },
  { platform: "workable", patterns: [/apply\.workable\.com/i] },
  { platform: "breezy", patterns: [/breezy\.hr/i] },
  { platform: "rippling", patterns: [/ats\.rippling\.com/i] },
  { platform: "dover", patterns: [/app\.dover\.com/i] },
  { platform: "recruitee", patterns: [/recruitee\.com/i] },
  { platform: "jazz", patterns: [/applytojob\.com/i] },
];

function detectAts(url: string): string | null {
  for (const ats of ATS_PATTERNS) {
    for (const p of ats.patterns) {
      if (p.test(url)) return ats.platform;
    }
  }
  return null;
}

function extractAtsFromHtml(html: string): { platform: string; careersUrl: string } | null {
  const re = /(?:href|src)=["'](https?:\/\/[^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const ats = detectAts(m[1]);
    if (ats) return { platform: ats, careersUrl: m[1] };
  }
  return null;
}

async function fetchSafe(url: string, timeout = 8000): Promise<Response> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeout);
  try {
    return await fetch(url, {
      signal: c.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
    });
  } finally {
    clearTimeout(t);
  }
}

async function findAts(website: string): Promise<{ platform: string | null; careersUrl: string | null }> {
  const site = website.replace(/\/$/, "");

  // Check if website itself is an ATS URL
  let ats = detectAts(site);
  if (ats) return { platform: ats, careersUrl: site };

  // 1. Fetch homepage, scan for ATS links + careers links
  try {
    const res = await fetchSafe(site);
    ats = detectAts(res.url);
    if (ats) return { platform: ats, careersUrl: res.url };

    if (res.ok) {
      const html = await res.text();
      const found = extractAtsFromHtml(html);
      if (found) return found;

      // Find careers-like links
      const cRe = /href=["']([^"']*(?:career|jobs|join|hiring|openings|open-roles|positions)[^"']*)["']/gi;
      let lm;
      const links = new Set<string>();
      while ((lm = cRe.exec(html)) !== null) {
        let link = lm[1];
        if (link.startsWith("/")) link = new URL(link, site).href;
        else if (!link.startsWith("http")) continue;
        links.add(link);
      }

      for (const link of [...links].slice(0, 3)) {
        ats = detectAts(link);
        if (ats) return { platform: ats, careersUrl: link };
        try {
          const r2 = await fetchSafe(link, 6000);
          ats = detectAts(r2.url);
          if (ats) return { platform: ats, careersUrl: r2.url };
          if (r2.ok) {
            const f2 = extractAtsFromHtml(await r2.text());
            if (f2) return f2;
          }
        } catch { /* skip */ }
      }
    }
  } catch { /* skip */ }

  // 2. Try /careers and /jobs directly
  for (const path of ["/careers", "/jobs"]) {
    try {
      const r = await fetchSafe(site + path, 5000);
      ats = detectAts(r.url);
      if (ats) return { platform: ats, careersUrl: r.url };
      if (r.ok) {
        const f = extractAtsFromHtml(await r.text());
        if (f) return f;
      }
    } catch { /* skip */ }
  }

  return { platform: null, careersUrl: null };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const { batchSize = 50, offset = 0 } = await req.json();
    const limit = Math.min(batchSize, 100);

    const { data: companies, error } = await sb
      .from("companies")
      .select("id, name, website")
      .like("external_id", "yc-%")
      .is("detected_ats_platform", null)
      .not("website", "is", null)
      .order("name")
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);
    if (!companies?.length) {
      return respond({ processed: 0, detected: 0, remaining: 0, results: [] });
    }

    const CONC = 10;
    const results: { name: string; platform: string | null; careersUrl: string | null }[] = [];
    let detected = 0;

    for (let i = 0; i < companies.length; i += CONC) {
      const chunk = companies.slice(i, i + CONC);
      const settled = await Promise.allSettled(
        chunk.map(async (c) => {
          const r = await findAts(c.website);
          return { id: c.id, name: c.name, ...r };
        })
      );

      for (const s of settled) {
        if (s.status !== "fulfilled") continue;
        const { id, name, platform, careersUrl } = s.value;
        results.push({ name, platform, careersUrl });
        if (platform) {
          detected++;
          const upd: Record<string, string> = { detected_ats_platform: platform };
          if (careersUrl) upd.careers_url = careersUrl;
          await sb.from("companies").update(upd).eq("id", id);
          console.log(`✓ ${name} → ${platform}`);
        }
      }
    }

    // Check remaining
    const { count } = await sb
      .from("companies")
      .select("id", { count: "exact", head: true })
      .like("external_id", "yc-%")
      .is("detected_ats_platform", null)
      .not("website", "is", null);

    return respond({
      processed: companies.length,
      detected,
      remaining: count || 0,
      results,
    });
  } catch (err) {
    console.error("detect-ats error:", err);
    return respond({ error: err.message }, 500);
  }
});

function respond(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
