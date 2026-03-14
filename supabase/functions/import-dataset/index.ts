import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SIM_API_URL =
  "https://zwwyomcqvthlgjvphwym.supabase.co/functions/v1/sim-api";
const SIM_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3d3lvbWNxdnRobGdqdnBod3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDI2MDgsImV4cCI6MjA4NjQ3ODYwOH0.bo9-sl3w1hOYY6UTXme8BEgrrw_UubuxwjwemTZMo8c";

async function simApi(action: string, payload: Record<string, any> = {}) {
  const res = await fetch(SIM_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SIM_API_KEY },
    body: JSON.stringify({ action, payload }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`sim-api ${action} failed [${res.status}]: ${text}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const results = { companies: 0, jobs: 0, tasks: 0, skills: 0, scenarios: 0 };

    // 1. Fetch all companies
    console.log("Fetching companies...");
    const { companies } = await simApi("list_companies", { limit: 200, offset: 0 });
    if (!companies?.length) {
      return new Response(
        JSON.stringify({ success: false, error: "No companies returned from API" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    for (const company of companies) {
      const { error } = await sb.from("companies").upsert(
        {
          external_id: company.id,
          name: company.name || company.company_name || "Unknown",
          slug: company.slug || null,
          industry: company.industry || null,
          logo_url: company.logo_url || company.logo || null,
          website: company.website || company.url || null,
          employee_range: company.employee_range || company.employees || null,
          headquarters: company.headquarters || company.hq || null,
          description: company.description || null,
        },
        { onConflict: "external_id" }
      );
      if (!error) results.companies++;
    }
    console.log(`Imported ${results.companies} companies`);

    // 2. Fetch all jobs
    console.log("Fetching jobs...");
    const { jobs } = await simApi("list_jobs", { status: "active", limit: 500 });
    if (!jobs?.length) {
      return new Response(
        JSON.stringify({ success: true, message: "Companies imported but no jobs found", results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build company lookup map (external_id -> internal uuid)
    const { data: dbCompanies } = await sb
      .from("companies")
      .select("id, external_id");
    const companyMap = new Map(
      (dbCompanies || []).map((c: any) => [c.external_id, c.id])
    );

    for (const job of jobs) {
      const companyId = job.company_id ? companyMap.get(job.company_id) : null;
      const { error } = await sb.from("jobs").upsert(
        {
          external_id: job.id,
          company_id: companyId || null,
          title: job.title || job.job_title || "Untitled",
          slug: job.slug || null,
          status: job.status || "active",
          seniority: job.seniority || null,
          department: job.department || null,
          description: job.description || null,
          augmented_percent: job.augmented_percent || 0,
          automation_risk_percent: job.automation_risk_percent || 0,
          new_skills_percent: job.new_skills_percent || 0,
        },
        { onConflict: "external_id" }
      );
      if (!error) results.jobs++;
    }
    console.log(`Imported ${results.jobs} jobs`);

    // 3. Fetch job details (tasks, skills, scenarios) for each job
    const { data: dbJobs } = await sb
      .from("jobs")
      .select("id, external_id");
    const jobMap = new Map(
      (dbJobs || []).map((j: any) => [j.external_id, j.id])
    );

    // Process in batches of 5 to avoid overwhelming the API
    const jobEntries = Array.from(jobMap.entries());
    for (let i = 0; i < jobEntries.length; i += 5) {
      const batch = jobEntries.slice(i, i + 5);
      const detailPromises = batch.map(async ([extId, intId]) => {
        try {
          const detail = await simApi("job_detail", { job_id: extId });

          // Task clusters
          if (detail.task_clusters?.length) {
            for (let idx = 0; idx < detail.task_clusters.length; idx++) {
              const t = detail.task_clusters[idx];
              const { error } = await sb.from("task_clusters").upsert(
                {
                  external_id: t.id || `${extId}-task-${idx}`,
                  job_id: intId,
                  name: t.name || t.title || "Unnamed task",
                  current_state: t.current_state || t.currentState || null,
                  trend: t.trend || null,
                  impact_level: t.impact_level || t.impactLevel || null,
                  description: t.description || null,
                  sort_order: idx,
                },
                { onConflict: "external_id" }
              );
              if (!error) results.tasks++;
            }
          }

          // Skills
          if (detail.skills?.length) {
            for (const s of detail.skills) {
              const { error } = await sb.from("job_skills").upsert(
                {
                  external_id: s.id || `${extId}-skill-${s.name}`,
                  job_id: intId,
                  name: s.name || "Unnamed skill",
                  priority: s.priority || null,
                  category: s.category || null,
                  description: s.description || null,
                },
                { onConflict: "external_id" }
              );
              if (!error) results.skills++;
            }
          }

          // Scenarios
          if (detail.scenarios?.length) {
            for (const sc of detail.scenarios) {
              const { error } = await sb.from("scenarios").upsert(
                {
                  external_id: sc.id || `${extId}-scenario-${sc.slug}`,
                  job_id: intId,
                  title: sc.title || "Untitled scenario",
                  slug: sc.slug || null,
                  description: sc.description || null,
                  difficulty: sc.difficulty || 3,
                },
                { onConflict: "external_id" }
              );
              if (!error) results.scenarios++;
            }
          }
        } catch (err) {
          console.error(`Failed to fetch detail for job ${extId}:`, err);
        }
      });

      await Promise.allSettled(detailPromises);
    }

    console.log("Import complete:", results);
    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Import error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
