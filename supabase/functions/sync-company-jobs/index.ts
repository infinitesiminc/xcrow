import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SIM_API_URL =
  "https://zwwyomcqvthlgjvphwym.supabase.co/functions/v1/sim-api";
const SIM_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3d3lvbWNxdnRobGdqdnBod3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDI2MDgsImV4cCI6MjA4NjQ3ODYwOH0.bo9-sl3w1hOYY6UTXme8BEgrrw_UubuxwjwemTZMo8c";

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

/* ── Import tracking helpers ── */
async function logImport(sb: any, entry: Record<string, any>): Promise<string | null> {
  const { data, error } = await sb.from("import_log").insert(entry).select("id").single();
  if (error) { console.error("import_log insert failed:", error.message); return null; }
  return data.id;
}

async function raiseFlag(sb: any, flag: Record<string, any>): Promise<void> {
  const { error } = await sb.from("import_flags").insert(flag);
  if (error) console.error("import_flags insert failed:", error.message);
}

async function updateLog(sb: any, logId: string, updates: Record<string, any>): Promise<void> {
  await sb.from("import_log").update(updates).eq("id", logId);
}

async function safeFetch(url: string, opts: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function simApi(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<any> {
  const res = await safeFetch(SIM_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SIM_API_KEY },
    body: JSON.stringify({ action, payload }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`sim-api ${res.status}: ${text}`);
  return JSON.parse(text);
}

/** Check if HQ string looks like a non-US location (exclude known non-US) */
function isLikelyNonUS(hq: string | null | undefined): boolean {
  if (!hq) return false;
  const lower = hq.toLowerCase().trim();
  const nonUSPatterns = [
    /\b(uk|united kingdom|london|england|scotland|wales)\b/,
    /\b(canada|toronto|vancouver|montreal|ontario)\b/,
    /\b(australia|sydney|melbourne|brisbane)\b/,
    /\b(germany|berlin|munich|frankfurt)\b/,
    /\b(france|paris)\b/, /\b(india|bangalore|mumbai|delhi|hyderabad)\b/,
    /\b(japan|tokyo)\b/, /\b(china|beijing|shanghai|shenzhen)\b/,
    /\b(brazil|são paulo|sao paulo)\b/, /\b(israel|tel aviv)\b/,
    /\b(singapore)\b/, /\b(ireland|dublin)\b/, /\b(netherlands|amsterdam)\b/,
    /\b(sweden|stockholm)\b/, /\b(spain|madrid|barcelona)\b/,
    /\b(italy|milan|rome)\b/, /\b(south korea|seoul)\b/,
    /\b(mexico|mexico city)\b/, /\b(switzerland|zurich)\b/,
  ];
  return nonUSPatterns.some((p) => p.test(lower));
}

/* ── Direct ATS public API scrapers ── */

function extractAtsSlug(careersUrl: string, platform: string): string | null {
  if (!careersUrl) return null;
  try {
    const u = new URL(careersUrl);
    if (platform === "ashby" && u.hostname.includes("ashbyhq.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      return parts[0] || null;
    }
    if (platform === "greenhouse" && u.hostname.includes("greenhouse.io")) {
      const parts = u.pathname.split("/").filter(Boolean);
      return parts[0] || null;
    }
    if (platform === "lever" && u.hostname.includes("lever.co")) {
      const parts = u.pathname.split("/").filter(Boolean);
      return parts[0] || null;
    }
  } catch { /* invalid URL */ }
  return null;
}

/** Try common Greenhouse slug patterns derived from company name */
async function probeGreenhouseSlug(companyName: string): Promise<string | null> {
  const candidates = [
    companyName.toLowerCase().replace(/[^a-z0-9]/g, ""),
    companyName.toLowerCase().replace(/\s+/g, ""),
    companyName.toLowerCase().replace(/[^a-z0-9]/g, "") + "industries",
    companyName.toLowerCase().replace(/[^a-z0-9]/g, "") + "inc",
  ];
  for (const slug of candidates) {
    try {
      const res = await safeFetch(
        `https://api.greenhouse.io/v1/boards/${slug}/jobs?content=false`,
        { method: "GET", headers: { "Accept": "application/json" } },
        8000
      );
      if (res.ok) {
        const data = JSON.parse(await res.text());
        if (data.jobs && data.jobs.length > 0) return slug;
      } else {
        await res.text(); // consume body
      }
    } catch { /* continue */ }
  }
  return null;
}

async function fetchAshbyJobs(slug: string): Promise<any[]> {
  const res = await safeFetch(
    `https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=true`,
    { method: "GET", headers: { "Accept": "application/json" } },
    15000
  );
  const text = await res.text();
  if (!res.ok) { console.error("Ashby API error:", res.status, text); return []; }
  const data = JSON.parse(text);
  return (data.jobs || []).map((j: any) => ({
    external_id: `ashby-${slug}-${j.id}`,
    title: j.title,
    department: j.department || j.departmentName || null,
    location: j.location || j.locationName || null,
    description: j.descriptionPlain || j.descriptionHtml?.slice(0, 5000) || null,
    source_url: j.jobUrl || `https://jobs.ashbyhq.com/${slug}/${j.id}`,
    status: j.isListed === false ? "unlisted" : "active",
  }));
}

async function fetchGreenhouseJobs(slug: string): Promise<any[]> {
  // First fetch without content (fast, handles large boards)
  const res = await safeFetch(
    `https://api.greenhouse.io/v1/boards/${slug}/jobs?content=false`,
    { method: "GET", headers: { "Accept": "application/json" } },
    30000
  );
  const text = await res.text();
  if (!res.ok) { console.error("Greenhouse API error:", res.status, text); return []; }
  const data = JSON.parse(text);
  return (data.jobs || []).map((j: any) => ({
    external_id: `gh-${slug}-${j.id}`,
    title: j.title,
    department: j.departments?.[0]?.name || null,
    location: j.location?.name || null,
    description: null, // skip descriptions for speed — can backfill later
    source_url: j.absolute_url || null,
    status: "active",
  }));
}

async function fetchLeverJobs(slug: string): Promise<any[]> {
  const res = await safeFetch(
    `https://api.lever.co/v0/postings/${slug}?mode=json`,
    { method: "GET", headers: { "Accept": "application/json" } },
    15000
  );
  const text = await res.text();
  if (!res.ok) { console.error("Lever API error:", res.status, text); return []; }
  const data = JSON.parse(text);
  return (Array.isArray(data) ? data : []).map((j: any) => ({
    external_id: `lever-${slug}-${j.id}`,
    title: j.text,
    department: j.categories?.department || j.categories?.team || null,
    location: j.categories?.location || null,
    description: j.descriptionPlain?.slice(0, 5000) || null,
    source_url: j.hostedUrl || null,
    status: "active",
  }));
}

async function fetchDirectAtsJobs(careersUrl: string, platform: string, companyName?: string): Promise<any[]> {
  let slug = extractAtsSlug(careersUrl, platform);
  
  // If no slug from URL (e.g. custom careers page), probe by company name
  if (!slug && platform === "greenhouse" && companyName) {
    console.log(`No slug from URL, probing Greenhouse by company name: ${companyName}`);
    slug = await probeGreenhouseSlug(companyName);
  }
  
  if (!slug) {
    console.log(`Could not find slug for ${careersUrl} / ${companyName} on platform ${platform}`);
    return [];
  }
  console.log(`Direct ATS fetch: platform=${platform}, slug=${slug}`);
  switch (platform) {
    case "ashby": return fetchAshbyJobs(slug);
    case "greenhouse": return fetchGreenhouseJobs(slug);
    case "lever": return fetchLeverJobs(slug);
    default: return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { step, company_id, ats_platform, us_only = true, limit = 50, offset = 0 } =
      await req.json();
    const sb = getSupabaseAdmin();

    // ── Step 1: Sync companies (with optional ATS filter + US filter) ──
    if (step === "companies") {
      const apiPayload: Record<string, unknown> = { limit, offset };
      if (ats_platform) apiPayload.ats_platform = ats_platform;

      const data = await simApi("list_companies", apiPayload);
      const companies = data.companies || [];

      const filtered = us_only
        ? companies.filter((c: any) => !isLikelyNonUS(c.headquarters || c.location || c.hq))
        : companies;

      // Dedup: for each company, check if one with the same name already exists
      const rows = [];
      for (const c of filtered) {
        const extId = c.id;
        const name = c.name;

        // Check if company already exists by name (case-insensitive)
        const { data: existing } = await sb
          .from("companies")
          .select("id, external_id")
          .ilike("name", name)
          .is("workspace_id", null)
          .limit(1)
          .maybeSingle();

        if (existing && existing.external_id !== extId) {
          // Merge: update existing record with new external_id and metadata
          await sb.from("companies").update({
            external_id: extId,
            website: c.website || undefined,
            industry: c.industry || undefined,
            logo_url: c.logo_url || undefined,
            careers_url: c.careers_url || undefined,
            detected_ats_platform: c.detected_ats_platform || ats_platform || undefined,
            brand_color: c.brand_color || undefined,
            description: c.context || c.culture || undefined,
            employee_range: c.size || undefined,
            headquarters: c.headquarters || c.location || c.hq || undefined,
          }).eq("id", existing.id);
          continue;
        }

        rows.push({
          external_id: extId,
          name,
          website: c.website,
          industry: c.industry,
          logo_url: c.logo_url,
          careers_url: c.careers_url,
          detected_ats_platform: c.detected_ats_platform || ats_platform || null,
          brand_color: c.brand_color,
          description: c.context || c.culture || null,
          employee_range: c.size || null,
          headquarters: c.headquarters || c.location || c.hq || null,
          is_demo: c.is_demo ?? true,
        });
      }

      if (rows.length > 0) {
        const { error } = await sb
          .from("companies")
          .upsert(rows, { onConflict: "external_id" });
        if (error) throw new Error(`Upsert companies: ${error.message}`);
      }

      return respond({
        synced: rows.length,
        total_from_api: companies.length,
        filtered_us: us_only ? companies.length - filtered.length : 0,
        hasMore: companies.length === limit,
        ats_platform: ats_platform || "all",
      });
    }

    // ── Step 2: Sync jobs for a single company ──
    if (step === "jobs") {
      let externalCompanyId = company_id;
      let localCompanyId: string | null = null;
      let companyRow: any = null;

      if (company_id) {
        const { data: found } = await sb
          .from("companies")
          .select("id, external_id, name, careers_url, detected_ats_platform")
          .or(`id.eq.${company_id},external_id.eq.${company_id}`)
          .limit(1)
          .single();
        if (found) {
          externalCompanyId = found.external_id;
          localCompanyId = found.id;
          companyRow = found;
        }
      }

      // Try direct ATS public API first (most reliable for known platforms)
      let jobs: any[] = [];
      let source = "direct-ats";

      if (companyRow?.detected_ats_platform && companyRow.detected_ats_platform !== "none") {
        console.log(`Trying direct ATS fetch: ${companyRow.detected_ats_platform}`);
        jobs = await fetchDirectAtsJobs(
          companyRow.careers_url || "",
          companyRow.detected_ats_platform,
          companyRow.name
        );
      }

      // Fallback to sim-api if direct ATS returned nothing
      if (jobs.length === 0 && externalCompanyId) {
        source = "sim-api";
        try {
          const data = await simApi("list_jobs", {
            company_id: externalCompanyId,
            limit,
            offset,
          });
          jobs = data.jobs || [];
        } catch (e) {
          console.warn("sim-api job fetch failed:", e);
        }
      }

      // Resolve local company ID if needed
      if (!localCompanyId && externalCompanyId) {
        const { data: co } = await sb.from("companies").select("id").eq("external_id", externalCompanyId).single();
        localCompanyId = co?.id || null;
      }

      // For direct-ats jobs, shape is already correct
      if (source === "direct-ats" && jobs.length > 0) {
        const rows = jobs.map(j => ({
          ...j,
          company_id: localCompanyId,
          difficulty: 3,
        }));
        const { error } = await sb.from("jobs").upsert(rows, { onConflict: "external_id" });
        if (error) throw new Error(`Upsert direct jobs: ${error.message}`);
        return respond({
          company: company_id,
          synced: rows.length,
          source,
        });
      }

      // Standard sim-api path
      const rows = jobs.map((j: any) => ({
        external_id: j.id,
        title: j.title,
        slug: j.slug,
        department: j.department,
        description: j.description,
        location: j.location,
        source_url: j.source_url,
        difficulty: j.difficulty,
        status: j.status || "active",
        company_id: localCompanyId,
      }));

      if (rows.length > 0) {
        const { error } = await sb
          .from("jobs")
          .upsert(rows, { onConflict: "external_id" });
        if (error) throw new Error(`Upsert jobs: ${error.message}`);
      }

      return respond({
        company: company_id,
        synced: rows.length,
        source,
        hasMore: jobs.length === limit,
      });
    }

    return respond({ error: "Unknown step. Use: companies or jobs" }, 400);
  } catch (err) {
    console.error("sync-company-jobs error:", err);
    return respond({ error: err.message }, 500);
  }
});

function respond(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
