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

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return respond({ error: "Unauthorized" }, 401);

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) return respond({ error: "Unauthorized" }, 401);

  const APOLLO_API_KEY = Deno.env.get("APOLLO_API_KEY");
  if (!APOLLO_API_KEY) return respond({ error: "APOLLO_API_KEY not configured" }, 500);

  try {
    const { lead_ids } = await req.json();
    if (!Array.isArray(lead_ids) || lead_ids.length === 0 || lead_ids.length > 50) {
      return respond({ error: "Provide 1-50 lead_ids" }, 400);
    }

    // Fetch leads belonging to this user
    const { data: leads, error: fetchErr } = await sb
      .from("saved_leads")
      .select("id, name, title, company, email, linkedin, phone")
      .eq("user_id", user.id)
      .in("id", lead_ids);

    if (fetchErr || !leads) return respond({ error: "Failed to fetch leads" }, 500);

    let enriched = 0;
    let skipped = 0;
    let failed = 0;
    const results: { id: string; status: string; email?: string; linkedin?: string }[] = [];

    for (const lead of leads) {
      // Skip if already has all contact info
      if (lead.email && lead.linkedin && lead.phone) {
        skipped++;
        results.push({ id: lead.id, status: "already_complete" });
        continue;
      }

      // Use Apollo people/match to find this person
      try {
        const matchBody: Record<string, unknown> = {};
        if (lead.name) {
          const parts = lead.name.trim().split(/\s+/);
          matchBody.first_name = parts[0];
          if (parts.length > 1) matchBody.last_name = parts.slice(1).join(" ");
        }
        if (lead.company) matchBody.organization_name = lead.company;
        if (lead.title) matchBody.title = lead.title;

        const matchRes = await fetch("https://api.apollo.io/api/v1/people/match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": APOLLO_API_KEY,
          },
          body: JSON.stringify(matchBody),
        });

        if (!matchRes.ok) {
          console.warn(`Apollo match failed for ${lead.name}: ${matchRes.status}`);
          failed++;
          results.push({ id: lead.id, status: "apollo_error" });
          continue;
        }

        const matchData = await matchRes.json();
        const person = matchData.person;

        if (!person) {
          failed++;
          results.push({ id: lead.id, status: "no_match" });
          continue;
        }

        const updates: Record<string, unknown> = {};
        if (!lead.email && person.email) updates.email = person.email;
        if (!lead.linkedin && person.linkedin_url) updates.linkedin = person.linkedin_url;
        if (!lead.phone && (person.phone_number || person.sanitized_phone)) {
          updates.phone = person.phone_number || person.sanitized_phone;
        }
        // Also backfill title if missing
        if (!lead.title && person.title) updates.title = person.title;

        if (Object.keys(updates).length === 0) {
          skipped++;
          results.push({ id: lead.id, status: "no_new_data" });
          continue;
        }

        updates.updated_at = new Date().toISOString();
        await sb.from("saved_leads").update(updates).eq("id", lead.id);

        enriched++;
        results.push({
          id: lead.id,
          status: "enriched",
          email: updates.email as string | undefined,
          linkedin: updates.linkedin as string | undefined,
        });
      } catch (err) {
        console.error(`Error enriching ${lead.name}:`, err);
        failed++;
        results.push({ id: lead.id, status: "error" });
      }

      // Rate limiting - Apollo recommends ~1 req/sec
      await new Promise((r) => setTimeout(r, 300));
    }

    return respond({ enriched, skipped, failed, results });
  } catch (err: any) {
    console.error("enrich-leads error:", err);
    return respond({ error: err.message }, 500);
  }
});
