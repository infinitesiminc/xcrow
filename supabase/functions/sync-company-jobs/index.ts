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

async function simApi(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(SIM_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SIM_API_KEY },
      body: JSON.stringify({ action, payload }),
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`sim-api ${res.status}: ${text}`);
    return JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }
}

/** Check if HQ string looks like a US location */
function isUSHeadquarters(hq: string | null | undefined): boolean {
  if (!hq) return false;
  const lower = hq.toLowerCase().trim();
  // Match US state abbreviations, "united states", "usa", common US cities
  const usPatterns = [
    /\bus[a]?\b/, /\bunited states\b/, /\bamerica\b/,
    /\b(ca|ny|tx|wa|ma|il|co|fl|ga|pa|va|nj|nc|oh|az|or|mn|md|ct|ut|tn|mo|wi|in|mi|sc|al|la|ky|ok|nv|ia|ar|ms|ks|ne|nm|hi|id|wv|nh|me|ri|mt|de|sd|nd|ak|vt|wy|dc)\b/,
    /san francisco|new york|los angeles|seattle|austin|boston|chicago|denver|atlanta|miami|portland|dallas|houston|raleigh|washington/,
  ];
  return usPatterns.some((p) => p.test(lower));
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

      // Filter US-only if requested
      const filtered = us_only
        ? companies.filter((c: any) => isUSHeadquarters(c.headquarters || c.location || c.hq))
        : companies;

      const rows = filtered.map((c: any) => ({
        external_id: c.id,
        name: c.name,
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
      }));

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

      if (company_id) {
        const { data: found } = await sb
          .from("companies")
          .select("id, external_id")
          .or(`id.eq.${company_id},external_id.eq.${company_id}`)
          .limit(1)
          .single();
        if (found) {
          externalCompanyId = found.external_id;
          localCompanyId = found.id;
        }
      }

      if (!externalCompanyId) throw new Error("No company ID resolved");

      const data = await simApi("list_jobs", {
        company_id: externalCompanyId,
        limit,
        offset,
      });
      const jobs = data.jobs || [];

      if (!localCompanyId) {
        const { data: co } = await sb
          .from("companies")
          .select("id")
          .eq("external_id", externalCompanyId)
          .single();
        localCompanyId = co?.id || null;
      }

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
