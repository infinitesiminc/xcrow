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
    const { step = "companies", offset = 0, batch_size = 10 } = await req.json().catch(() => ({}));
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // STEP 1: Import companies
    if (step === "companies") {
      console.log("Fetching companies...");
      const { companies } = await simApi("list_companies", { limit: 200, offset: 0 });
      let count = 0;
      if (companies?.length) {
        for (const c of companies) {
          const { error } = await sb.from("companies").upsert({
            external_id: c.id,
            name: c.name || c.company_name || "Unknown",
            slug: c.slug || null,
            industry: c.industry || null,
            logo_url: c.logo_url || c.logo || null,
            website: c.website || c.url || null,
            employee_range: c.employee_range || c.employees || null,
            headquarters: c.headquarters || c.hq || null,
            description: c.description || null,
          }, { onConflict: "external_id" });
          if (!error) count++;
        }
      }
      return respond({ success: true, step: "companies", imported: count, next_step: "jobs" });
    }

    // STEP 2: Import jobs
    if (step === "jobs") {
      console.log("Fetching jobs...");
      const { jobs } = await simApi("list_jobs", { status: "active", limit: 500 });
      const { data: dbCompanies } = await sb.from("companies").select("id, external_id");
      const companyMap = new Map((dbCompanies || []).map((c: any) => [c.external_id, c.id]));

      let count = 0;
      if (jobs?.length) {
        for (const j of jobs) {
          const { error } = await sb.from("jobs").upsert({
            external_id: j.id,
            company_id: j.company_id ? companyMap.get(j.company_id) || null : null,
            title: j.title || j.job_title || "Untitled",
            slug: j.slug || null,
            status: j.status || "active",
            seniority: j.seniority || null,
            department: j.department || null,
            description: j.description || null,
            augmented_percent: j.augmented_percent || 0,
            automation_risk_percent: j.automation_risk_percent || 0,
            new_skills_percent: j.new_skills_percent || 0,
          }, { onConflict: "external_id" });
          if (!error) count++;
        }
      }
      return respond({ success: true, step: "jobs", imported: count, next_step: "details", total_jobs: jobs?.length || 0 });
    }

    // STEP 3: Import job details in batches
    if (step === "details") {
      const { data: dbJobs } = await sb.from("jobs").select("id, external_id").range(offset, offset + batch_size - 1);
      if (!dbJobs?.length) {
        return respond({ success: true, step: "details", message: "All job details imported", done: true });
      }

      const results = { clusters: 0, skills: 0, scenarios: 0 };

      for (const job of dbJobs) {
        try {
          const detail = await simApi("job_detail", { job_id: job.external_id });

          // Job task clusters (AI-generated from activation pipeline)
          const clusters = detail.job_task_clusters || detail.task_clusters || [];
          if (clusters.length) {
            for (let idx = 0; idx < clusters.length; idx++) {
              const t = clusters[idx];
              const { error } = await sb.from("job_task_clusters").upsert({
                external_id: t.id || `${job.external_id}-cluster-${idx}`,
                job_id: job.id,
                cluster_name: t.cluster_name || t.name || t.title || "Unnamed cluster",
                description: t.description || null,
                outcome: t.outcome || null,
                skill_names: t.skill_names || t.skills || null,
                sort_order: idx,
              }, { onConflict: "external_id" });
              if (!error) results.clusters++;
            }
          }

          // Skills — try multiple field name patterns
          const skills = detail.skills || detail.job_skills || [];
          if (skills.length) {
            for (const s of skills) {
              const skillName = s.skill_name || s.name || s.title || "Unnamed skill";
              const { error } = await sb.from("job_skills").upsert({
                external_id: s.id || `${job.external_id}-skill-${skillName}`,
                job_id: job.id,
                name: skillName,
                priority: s.priority || null,
                category: s.category || null,
                description: s.description || null,
              }, { onConflict: "external_id" });
              if (!error) results.skills++;
            }
          }

          // Scenarios
          const scenarios = detail.scenarios || [];
          if (scenarios.length) {
            for (const sc of scenarios) {
              const { error } = await sb.from("scenarios").upsert({
                external_id: sc.id || `${job.external_id}-scenario-${sc.slug || sc.title}`,
                job_id: job.id,
                title: sc.title || "Untitled",
                slug: sc.slug || null,
                description: sc.description || null,
                difficulty: sc.difficulty || 3,
              }, { onConflict: "external_id" });
              if (!error) results.scenarios++;
            }
          }
        } catch (err) {
          console.error(`Failed job ${job.external_id}:`, err);
        }
      }

      const nextOffset = offset + batch_size;
      return respond({
        success: true, step: "details", ...results,
        processed: dbJobs.length,
        next_offset: nextOffset,
        done: dbJobs.length < batch_size,
      });
    }

    // DEBUG: Inspect raw API response for a single job
    if (step === "inspect") {
      const { data: dbJobs } = await sb.from("jobs").select("id, external_id").limit(1);
      if (!dbJobs?.length) return respond({ error: "No jobs" }, 400);
      const detail = await simApi("job_detail", { job_id: dbJobs[0].external_id });
      return respond({ success: true, raw_keys: Object.keys(detail), sample: detail });
    }

    return respond({ success: false, error: `Unknown step: ${step}` }, 400);
  } catch (error) {
    console.error("Import error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function respond(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
