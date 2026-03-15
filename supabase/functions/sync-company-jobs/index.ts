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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { step, company_name, company_id, limit = 50, offset = 0 } =
      await req.json();
    const sb = getSupabaseAdmin();

    // ── Step 1: Sync companies ──
    if (step === "companies") {
      const data = await simApi("list_companies", { limit, offset });
      const companies = data.companies || [];

      const rows = companies.map((c: any) => ({
        external_id: c.id,
        name: c.name,
        website: c.website,
        industry: c.industry,
        logo_url: c.logo_url,
        careers_url: c.careers_url,
        detected_ats_platform: c.detected_ats_platform,
        brand_color: c.brand_color,
        description: c.context || c.culture || null,
        employee_range: c.size || null,
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
        total: companies.length,
        hasMore: companies.length === limit,
      });
    }

    // ── Step 2: Sync jobs for a company ──
    if (step === "jobs") {
      // Resolve company
      let externalCompanyId = company_id;
      let localCompanyId: string | null = null;

      if (company_name && !company_id) {
        // Find in our DB by name
        const { data: found } = await sb
          .from("companies")
          .select("id, external_id")
          .ilike("name", company_name)
          .limit(1)
          .single();
        if (!found)
          throw new Error(`Company "${company_name}" not found. Sync companies first.`);
        externalCompanyId = found.external_id;
        localCompanyId = found.id;
      } else if (company_id) {
        // Check if this is a local or external ID
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

      // Fetch jobs from sim-api
      const data = await simApi("list_jobs", {
        company_id: externalCompanyId,
        limit,
        offset,
      });
      const jobs = data.jobs || [];

      // Ensure we have a local company_id
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
        company: company_name || company_id,
        synced: rows.length,
        hasMore: jobs.length === limit,
      });
    }

    // ── Step 3: Full sync (companies + all jobs) ──
    if (step === "full") {
      // Sync all companies first
      let allCompanies: any[] = [];
      let page = 0;
      while (true) {
        const data = await simApi("list_companies", {
          limit: 100,
          offset: page * 100,
        });
        const batch = data.companies || [];
        allCompanies = allCompanies.concat(batch);
        if (batch.length < 100) break;
        page++;
      }

      // Upsert companies
      const companyRows = allCompanies.map((c: any) => ({
        external_id: c.id,
        name: c.name,
        website: c.website,
        industry: c.industry,
        logo_url: c.logo_url,
        careers_url: c.careers_url,
        detected_ats_platform: c.detected_ats_platform,
        brand_color: c.brand_color,
        description: c.context || c.culture || null,
        employee_range: c.size || null,
        is_demo: c.is_demo ?? true,
      }));

      if (companyRows.length > 0) {
        const { error } = await sb
          .from("companies")
          .upsert(companyRows, { onConflict: "external_id" });
        if (error) throw new Error(`Upsert companies: ${error.message}`);
      }

      // Now sync jobs for each company
      let totalJobs = 0;
      const errors: string[] = [];

      for (const co of allCompanies) {
        try {
          // Get our local company ID
          const { data: localCo } = await sb
            .from("companies")
            .select("id")
            .eq("external_id", co.id)
            .single();
          if (!localCo) continue;

          const data = await simApi("list_jobs", {
            company_id: co.id,
            limit: 200,
          });
          const jobs = data.jobs || [];

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
            company_id: localCo.id,
          }));

          if (rows.length > 0) {
            const { error } = await sb
              .from("jobs")
              .upsert(rows, { onConflict: "external_id" });
            if (error) errors.push(`${co.name}: ${error.message}`);
            else totalJobs += rows.length;
          }
        } catch (e) {
          errors.push(`${co.name}: ${e.message}`);
        }
      }

      return respond({
        companies: companyRows.length,
        jobs: totalJobs,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    return respond({ error: "Unknown step. Use: companies, jobs, or full" }, 400);
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
