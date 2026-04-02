import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get all verticals with company counts
    const { data: verticals, error: vErr } = await sb.rpc("get_niche_library_verticals");

    if (vErr) {
      // Fallback: direct query
      const { data: rawVerticals } = await sb
        .from("company_vertical_map")
        .select("vertical_name, sub_vertical, company_id");

      // Build taxonomy from raw data
      const vertMap = new Map<string, { companies: Set<string>; subVerticals: Map<string, number> }>();

      for (const row of rawVerticals || []) {
        if (!vertMap.has(row.vertical_name)) {
          vertMap.set(row.vertical_name, { companies: new Set(), subVerticals: new Map() });
        }
        const v = vertMap.get(row.vertical_name)!;
        v.companies.add(row.company_id);
        if (row.sub_vertical) {
          v.subVerticals.set(row.sub_vertical, (v.subVerticals.get(row.sub_vertical) || 0) + 1);
        }
      }

      // Get top personas per vertical (job titles from companies in that vertical)
      const verticalResults = [];
      for (const [name, info] of vertMap.entries()) {
        const companyIds = [...info.companies].slice(0, 50);

        // Get top job titles for these companies
        const { data: jobs } = await sb
          .from("jobs")
          .select("title, department, seniority")
          .in("company_id", companyIds)
          .limit(200);

        // Count title frequency
        const titleCounts = new Map<string, number>();
        for (const j of jobs || []) {
          const t = j.title.replace(/\s*(Sr\.?|Jr\.?|Senior|Junior|Lead|Staff|Principal)\s*/gi, "").trim();
          titleCounts.set(t, (titleCounts.get(t) || 0) + 1);
        }

        // Top 5 titles
        const topTitles = [...titleCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([title, count]) => ({ title, count }));

        // Top sub-verticals
        const topSubs = [...info.subVerticals.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, count]) => ({ name, company_count: count }));

        verticalResults.push({
          name,
          company_count: info.companies.size,
          sub_verticals: topSubs,
          top_titles: topTitles,
        });
      }

      verticalResults.sort((a, b) => b.company_count - a.company_count);

      return new Response(JSON.stringify({ verticals: verticalResults }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ verticals }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
