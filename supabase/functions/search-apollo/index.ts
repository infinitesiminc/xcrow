import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const APOLLO_API_KEY = Deno.env.get("APOLLO_API_KEY");
    if (!APOLLO_API_KEY) throw new Error("APOLLO_API_KEY not configured");

    const body = await req.json();
    const {
      // Search filters
      organization_locations = ["United States"],
      organization_num_employees_ranges,
      q_organization_keyword_tags,
      q_organization_name,
      latest_funding_stage,
      per_page = 25,
      page = 1,
      // Action
      import_results = false,
    } = body;

    // Build Apollo request body
    const apolloBody: Record<string, unknown> = {
      api_key: APOLLO_API_KEY,
      page,
      per_page: Math.min(per_page, 100),
    };

    if (organization_locations?.length) apolloBody.organization_locations = organization_locations;
    if (organization_num_employees_ranges?.length) apolloBody.organization_num_employees_ranges = organization_num_employees_ranges;
    if (q_organization_keyword_tags?.length) apolloBody.q_organization_keyword_tags = q_organization_keyword_tags;
    if (q_organization_name) apolloBody.q_organization_name = q_organization_name;

    console.log("Apollo search:", JSON.stringify(apolloBody));

    const apolloRes = await fetch("https://api.apollo.io/api/v1/mixed_companies/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      body: JSON.stringify(apolloBody),
    });

    if (!apolloRes.ok) {
      const errText = await apolloRes.text();
      console.error("Apollo API error:", apolloRes.status, errText);
      return respond({ error: `Apollo API error: ${apolloRes.status}`, details: errText }, 502);
    }

    const apolloData = await apolloRes.json();
    const organizations = apolloData.organizations || apolloData.accounts || [];
    const pagination = apolloData.pagination || {};

    // Map Apollo fields to our schema
    const mapped = organizations.map((org: any) => ({
      apollo_id: org.id,
      name: org.name || "Unknown",
      website: org.website_url || org.primary_domain || null,
      domain: org.primary_domain || null,
      industry: org.industry || null,
      headquarters: [org.city, org.state, org.country].filter(Boolean).join(", ") || null,
      employee_range: mapEmployeeRange(org.estimated_num_employees),
      description: org.short_description || null,
      logo_url: org.logo_url || null,
      founded_year: org.founded_year || null,
      linkedin_url: org.linkedin_url || null,
      phone: org.phone || null,
      funding_stage: org.latest_funding_stage || null,
      funding_total: org.total_funding ? `$${(org.total_funding / 1e6).toFixed(1)}M` : null,
      annual_revenue: org.annual_revenue_printed || null,
      keywords: org.keywords || [],
      num_employees: org.estimated_num_employees || null,
    }));

    // If not importing, just return search results
    if (!import_results) {
      return respond({
        companies: mapped,
        pagination: {
          page: pagination.page || page,
          per_page: pagination.per_page || per_page,
          total_entries: pagination.total_entries || 0,
          total_pages: Math.ceil((pagination.total_entries || 0) / per_page),
        },
      });
    }

    // Import mode: save to DB
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const startMs = Date.now();
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let flagsRaised = 0;
    const importedCompanies: any[] = [];

    for (const co of mapped) {
      if (!co.name || co.name === "Unknown") { skipped++; continue; }

      // Check for existing by name (case-insensitive)
      const { data: existing } = await sb
        .from("companies")
        .select("id, name, website")
        .ilike("name", co.name)
        .is("workspace_id", null)
        .limit(1)
        .maybeSingle();

      const row = {
        name: co.name,
        website: co.website ? (co.website.startsWith("http") ? co.website : `https://${co.website}`) : null,
        industry: co.industry,
        headquarters: co.headquarters,
        employee_range: co.employee_range,
        description: co.description,
        logo_url: co.logo_url,
        founded_year: co.founded_year,
        funding_stage: co.funding_stage,
        funding_total: co.funding_total,
        external_id: co.apollo_id,
        is_demo: false,
      };

      if (existing) {
        // Update existing record with any new data
        const updates: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row)) {
          if (v != null && k !== "name") updates[k] = v;
        }
        if (Object.keys(updates).length > 0) {
          const { data } = await sb.from("companies").update(updates).eq("id", existing.id).select("id, name").single();
          if (data) importedCompanies.push(data);
          updated++;
        } else {
          skipped++;
        }

        // Flag the merge
        if (existing.website !== row.website && row.website) {
          flagsRaised++;
          await sb.from("import_flags").insert({
            flag_type: "merge_conflict",
            severity: "info",
            company_id: existing.id,
            company_name: co.name,
            details: {
              source: "apollo",
              existing_website: existing.website,
              incoming_website: row.website,
              action_taken: "merged",
            },
            suggested_action: `Apollo data merged into existing "${co.name}". Verify website/data is correct.`,
          });
        }
      } else {
        // Insert new
        const { data, error } = await sb.from("companies").insert(row).select("id, name").single();
        if (error) {
          console.warn("Insert failed for", co.name, error.message);
          skipped++;

          // Flag unique constraint violations
          if (error.code === "23505") {
            flagsRaised++;
            await sb.from("import_flags").insert({
              flag_type: "name_collision",
              severity: "warning",
              company_name: co.name,
              details: { source: "apollo", error: error.message, apollo_id: co.apollo_id },
              suggested_action: `Could not import "${co.name}" from Apollo — name collision.`,
            });
          }
          continue;
        }
        if (data) importedCompanies.push(data);
        created++;
      }
    }

    // Log the import
    await sb.from("import_log").insert({
      source: "apollo",
      action: "search-import",
      result_status: "success",
      items_processed: mapped.length,
      items_created: created,
      items_updated: updated,
      items_skipped: skipped,
      flags_raised: flagsRaised,
      duration_ms: Date.now() - startMs,
      metadata: {
        search_params: apolloBody,
        total_available: pagination.total_entries,
        page,
      },
    });

    return respond({
      success: true,
      imported: importedCompanies,
      stats: { created, updated, skipped, flags_raised: flagsRaised },
      pagination: {
        page: pagination.page || page,
        per_page: pagination.per_page || per_page,
        total_entries: pagination.total_entries || 0,
        total_pages: Math.ceil((pagination.total_entries || 0) / per_page),
      },
    });
  } catch (err: any) {
    console.error("search-apollo error:", err);
    return respond({ error: err.message }, 500);
  }
});

function mapEmployeeRange(count: number | null): string | null {
  if (!count) return null;
  if (count <= 10) return "1-10";
  if (count <= 50) return "11-50";
  if (count <= 200) return "51-200";
  if (count <= 500) return "201-500";
  if (count <= 1000) return "501-1000";
  if (count <= 5000) return "1001-5000";
  if (count <= 10000) return "5001-10000";
  return "10000+";
}
