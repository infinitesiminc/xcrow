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
    const parts = u.pathname.split("/").filter(Boolean);

    if (platform === "ashby") {
      // jobs.ashbyhq.com/SLUG or jobs.ashbyhq.com/SLUG/embed
      if (u.hostname.includes("ashbyhq.com")) {
        const slug = parts[0] || null;
        return slug && slug !== "embed" ? slug : null;
      }
    }

    if (platform === "greenhouse") {
      // boards.greenhouse.io/SLUG or job-boards.greenhouse.io/SLUG
      if (u.hostname.includes("greenhouse.io")) {
        // Handle embed pattern: /embed/job_board/js?for=SLUG
        if (parts[0] === "embed" && u.searchParams.has("for")) {
          return u.searchParams.get("for");
        }
        // Handle job-boards.greenhouse.io/SLUG and boards.greenhouse.io/SLUG
        const slug = parts[0] || null;
        if (slug && slug !== "embed") return slug;
      }
      // Handle api.greenhouse.io/v1/boards/SLUG pattern
      if (u.hostname === "api.greenhouse.io" && parts[0] === "v1" && parts[1] === "boards") {
        return parts[2] || null;
      }
    }

    if (platform === "lever") {
      // jobs.lever.co/SLUG or jobs.lever.co/SLUG/JOB_ID
      if (u.hostname.includes("lever.co")) {
        const slug = parts[0] || null;
        // Make sure we return the company slug, not a job UUID
        if (slug && !/^[0-9a-f]{8}-/.test(slug)) return slug;
      }
    }
  } catch { /* invalid URL */ }
  return null;
}

/** Derive slug candidates from company name */
function nameToSlugs(companyName: string): string[] {
  const base = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const dashed = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const candidates = [base, dashed];
  // Common suffixes
  for (const suffix of ["inc", "industries", "io", "ai", "hq", "labs", "tech"]) {
    if (!base.endsWith(suffix)) candidates.push(base + suffix);
  }
  // If name has parentheses like "Canopy (was Encarte)", try the first word
  const firstWord = companyName.split(/[\s(–\-]/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (firstWord && firstWord !== base) candidates.push(firstWord);
  return [...new Set(candidates)];
}

/** Probe Ashby API by slug */
async function probeAshbySlug(companyName: string): Promise<string | null> {
  for (const slug of nameToSlugs(companyName)) {
    try {
      const res = await safeFetch(
        `https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=false`,
        { method: "GET", headers: { "Accept": "application/json" } },
        8000
      );
      if (res.ok) {
        const data = JSON.parse(await res.text());
        if (data.jobs && data.jobs.length > 0) return slug;
      } else {
        await res.text();
      }
    } catch { /* continue */ }
  }
  return null;
}

/** Probe Greenhouse API by slug */
async function probeGreenhouseSlug(companyName: string): Promise<string | null> {
  for (const slug of nameToSlugs(companyName)) {
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
        await res.text();
      }
    } catch { /* continue */ }
  }
  return null;
}

/** Probe Lever API by slug */
async function probeLeverSlug(companyName: string): Promise<string | null> {
  for (const slug of nameToSlugs(companyName)) {
    try {
      const res = await safeFetch(
        `https://api.lever.co/v0/postings/${slug}?mode=json&limit=1`,
        { method: "GET", headers: { "Accept": "application/json" } },
        8000
      );
      if (res.ok) {
        const data = JSON.parse(await res.text());
        if (Array.isArray(data) && data.length > 0) return slug;
      } else {
        await res.text();
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
    description: null,
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
  
  // If no slug from URL, probe by company name on the correct platform
  if (!slug && companyName) {
    console.log(`No slug from URL, probing ${platform} by company name: ${companyName}`);
    switch (platform) {
      case "greenhouse": slug = await probeGreenhouseSlug(companyName); break;
      case "ashby": slug = await probeAshbySlug(companyName); break;
      case "lever": slug = await probeLeverSlug(companyName); break;
    }
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
      const startMs = Date.now();
      const apiPayload: Record<string, unknown> = { limit, offset };
      if (ats_platform) apiPayload.ats_platform = ats_platform;

      const data = await simApi("list_companies", apiPayload);
      const companies = data.companies || [];

      const filtered = us_only
        ? companies.filter((c: any) => !isLikelyNonUS(c.headquarters || c.location || c.hq))
        : companies;

      const logId = await logImport(sb, {
        source: "sync-company-jobs",
        action: "companies",
        ats_platform: ats_platform || "all",
        items_processed: filtered.length,
        result_status: "in_progress",
      });

      const rows = [];
      let merged = 0;
      let flagsRaised = 0;

      for (const c of filtered) {
        const extId = c.id;
        const name = c.name;

        const { data: existing } = await sb
          .from("companies")
          .select("id, external_id, name")
          .ilike("name", name)
          .is("workspace_id", null)
          .limit(1)
          .maybeSingle();

        if (existing && existing.external_id !== extId) {
          // Merge into existing — flag if names differ in casing/spelling
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
          merged++;

          if (logId && existing.name !== name) {
            flagsRaised++;
            await raiseFlag(sb, {
              import_log_id: logId,
              flag_type: "name_collision",
              severity: "info",
              company_id: existing.id,
              company_name: name,
              details: { existing_name: existing.name, incoming_name: name, existing_ext_id: existing.external_id, new_ext_id: extId },
              suggested_action: `Merged "${name}" into existing "${existing.name}". Verify they are the same company.`,
            });
          }
          continue;
        }

        rows.push({
          external_id: extId, name,
          website: c.website, industry: c.industry, logo_url: c.logo_url,
          careers_url: c.careers_url,
          detected_ats_platform: c.detected_ats_platform || ats_platform || null,
          brand_color: c.brand_color, description: c.context || c.culture || null,
          employee_range: c.size || null,
          headquarters: c.headquarters || c.location || c.hq || null,
          is_demo: c.is_demo ?? true,
        });
      }

      if (rows.length > 0) {
        const { error } = await sb.from("companies").upsert(rows, { onConflict: "external_id" });
        if (error) throw new Error(`Upsert companies: ${error.message}`);
      }

      if (logId) {
        await updateLog(sb, logId, {
          result_status: "success",
          items_created: rows.length,
          items_updated: merged,
          items_skipped: companies.length - filtered.length,
          flags_raised: flagsRaised,
          duration_ms: Date.now() - startMs,
          metadata: { total_from_api: companies.length, us_filtered: companies.length - filtered.length },
        });
      }

      return respond({
        synced: rows.length, merged,
        total_from_api: companies.length,
        filtered_us: us_only ? companies.length - filtered.length : 0,
        hasMore: companies.length === limit,
        ats_platform: ats_platform || "all",
        import_log_id: logId,
      });
    }

    // ── Step 2: Sync jobs for a single company ──
    if (step === "jobs") {
      const startMs = Date.now();
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

      const logId = await logImport(sb, {
        source: "sync-company-jobs",
        action: "jobs",
        target_company_id: localCompanyId,
        target_company_name: companyRow?.name || company_id,
        ats_platform: companyRow?.detected_ats_platform || null,
        result_status: "in_progress",
      });
      let flagsRaised = 0;

      // Try direct ATS public API first
      let jobs: any[] = [];
      let source = "direct-ats";

      if (companyRow?.detected_ats_platform && companyRow.detected_ats_platform !== "none") {
        jobs = await fetchDirectAtsJobs(
          companyRow.careers_url || "",
          companyRow.detected_ats_platform,
          companyRow.name
        );
      }

      // Flag: ATS platform set but no jobs from direct fetch
      if (jobs.length === 0 && companyRow?.detected_ats_platform && companyRow.detected_ats_platform !== "none") {
        flagsRaised++;
        if (logId) await raiseFlag(sb, {
          import_log_id: logId,
          flag_type: "slug_probe_failed",
          severity: "warn",
          company_id: localCompanyId,
          company_name: companyRow?.name,
          details: { platform: companyRow.detected_ats_platform, careers_url: companyRow.careers_url },
          suggested_action: `Could not find ATS board slug for "${companyRow.name}" on ${companyRow.detected_ats_platform}. Manually set careers_url to the board URL.`,
        });
      }

      // Fallback to sim-api
      if (jobs.length === 0 && externalCompanyId) {
        source = "sim-api";
        try {
          const data = await simApi("list_jobs", { company_id: externalCompanyId, limit, offset });
          jobs = data.jobs || [];
        } catch (e) {
          console.warn("sim-api job fetch failed:", e);
        }
      }

      // Flag: zero jobs from all sources
      if (jobs.length === 0) {
        flagsRaised++;
        if (logId) {
          await raiseFlag(sb, {
            import_log_id: logId,
            flag_type: "zero_jobs",
            severity: "warn",
            company_id: localCompanyId,
            company_name: companyRow?.name,
            details: { tried_sources: [companyRow?.detected_ats_platform, "sim-api"].filter(Boolean) },
            suggested_action: `No jobs found for "${companyRow?.name}". Check if the company has open roles or if the ATS config is correct.`,
          });
          await updateLog(sb, logId, {
            result_status: "partial",
            items_processed: 0,
            flags_raised: flagsRaised,
            duration_ms: Date.now() - startMs,
            metadata: { source, company: companyRow?.name },
          });
        }
        return respond({ company: company_id, synced: 0, source, import_log_id: logId });
      }

      // Resolve local company ID if needed
      if (!localCompanyId && externalCompanyId) {
        const { data: co } = await sb.from("companies").select("id").eq("external_id", externalCompanyId).single();
        localCompanyId = co?.id || null;
      }

      let synced = 0;

      if (source === "direct-ats") {
        const rows = jobs.map(j => ({ ...j, company_id: localCompanyId, difficulty: 3 }));
        const { error } = await sb.from("jobs").upsert(rows, { onConflict: "external_id" });
        if (error) throw new Error(`Upsert direct jobs: ${error.message}`);
        synced = rows.length;
      } else {
        const rows = jobs.map((j: any) => ({
          external_id: j.id, title: j.title, slug: j.slug,
          department: j.department, description: j.description,
          location: j.location, source_url: j.source_url,
          difficulty: j.difficulty, status: j.status || "active",
          company_id: localCompanyId,
        }));
        if (rows.length > 0) {
          const { error } = await sb.from("jobs").upsert(rows, { onConflict: "external_id" });
          if (error) throw new Error(`Upsert jobs: ${error.message}`);
        }
        synced = rows.length;
      }

      if (logId) {
        await updateLog(sb, logId, {
          result_status: "success",
          items_processed: jobs.length,
          items_created: synced,
          flags_raised: flagsRaised,
          duration_ms: Date.now() - startMs,
          metadata: { source, company: companyRow?.name },
        });
      }

      return respond({
        company: company_id,
        synced,
        source,
        hasMore: source === "sim-api" && jobs.length === limit,
        import_log_id: logId,
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
