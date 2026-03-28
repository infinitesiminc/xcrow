import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth guard - superadmin only
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return respond({ error: "Unauthorized" }, 401);
  }
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: claimsData, error: claimsError } = await sb.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (claimsError || !claimsData?.claims) {
    return respond({ error: "Unauthorized" }, 401);
  }
  const { data: isAdmin } = await sb.rpc("is_superadmin", { _user_id: claimsData.claims.sub });
  if (!isAdmin) {
    return respond({ error: "Forbidden" }, 403);
  }

  try {
    const { company_id, batch_size = 10 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    // Fetch companies to enrich
    let query = sb
      .from("companies")
      .select("id, name, website, description, employee_range, funding_stage, funding_total, estimated_arr")
      .is("enriched_at", null)
      .not("website", "is", null)
      .order("imported_at", { ascending: false })
      .limit(batch_size);

    if (company_id) {
      query = sb
        .from("companies")
        .select("id, name, website, description, employee_range, funding_stage, funding_total, estimated_arr")
        .eq("id", company_id)
        .limit(1);
    }

    const { data: companies, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;
    if (!companies?.length) return respond({ success: true, processed: 0, message: "No companies to enrich" });

    const results: any[] = [];

    for (const company of companies) {
      try {
        let websiteContent = "";
        const url = company.website?.trim();

        if (url) {
          const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
          console.log(`Scraping ${company.name}: ${normalizedUrl}`);

          try {
            const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: normalizedUrl,
                formats: ["markdown"],
                onlyMainContent: true,
              }),
            });
            const scrapeData = await scrapeRes.json();
            websiteContent = scrapeData?.data?.markdown || scrapeData?.markdown || "";
          } catch (e) {
            console.warn(`Scrape failed for ${company.name}:`, e);
          }
        }

        // AI estimation
        const aiRes = await fetch(AI_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `You estimate company metrics from available data. You MUST return valid JSON only with these fields:
{
  "estimated_arr": "e.g. $5M, $50M, $500M, $2B, or null if truly unknown",
  "estimated_employees": "e.g. 10-50, 50-200, 200-1000, 1000-5000, 5000+, or null",
  "estimated_funding": "e.g. $10M Seed, $50M Series B, $500M+ Late Stage, Bootstrapped, Public, or null",
  "confidence": "high, medium, or low"
}

Estimation rules:
- Use website content, company description, and any existing data to triangulate
- For ARR: Look for pricing pages, customer counts, team size signals. Enterprise SaaS with 50+ employees likely $5M+ ARR. Public companies use known revenue.
- For employees: Team pages, LinkedIn signals in content, office locations
- For funding: Press releases, investor mentions, growth stage signals
- If existing data is already good, confirm it with confidence "high"
- Be conservative with estimates. Use null if truly no signal.`,
              },
              {
                role: "user",
                content: [
                  `Company: ${company.name}`,
                  company.description ? `Description: ${company.description}` : "",
                  company.employee_range ? `Known employee range: ${company.employee_range}` : "",
                  company.funding_stage ? `Known funding stage: ${company.funding_stage}` : "",
                  company.funding_total ? `Known funding total: ${company.funding_total}` : "",
                  websiteContent ? `\nWebsite content (truncated):\n${websiteContent.slice(0, 4000)}` : "",
                ].filter(Boolean).join("\n"),
              },
            ],
            temperature: 0.1,
          }),
        });

        if (!aiRes.ok) {
          const errText = await aiRes.text();
          console.error(`AI error for ${company.name}: ${aiRes.status} ${errText}`);
          if (aiRes.status === 429) {
            // Rate limited - stop batch
            return respond({ success: true, processed: results.length, results, stopped: "rate_limited" });
          }
          continue;
        }

        const aiData = await aiRes.json();
        const raw = aiData?.choices?.[0]?.message?.content || "";
        const jsonStr = raw.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();

        let metrics: any;
        try {
          metrics = JSON.parse(jsonStr);
        } catch {
          console.error(`Parse failed for ${company.name}:`, raw);
          continue;
        }

        // Update company
        const updateData: any = {
          enriched_at: new Date().toISOString(),
          enrichment_confidence: metrics.confidence || "low",
        };
        if (metrics.estimated_arr) updateData.estimated_arr = metrics.estimated_arr;
        if (metrics.estimated_employees) updateData.estimated_employees = metrics.estimated_employees;
        if (metrics.estimated_funding) updateData.estimated_funding = metrics.estimated_funding;
        // Also backfill standard columns if empty
        if (!company.employee_range && metrics.estimated_employees) {
          updateData.employee_range = metrics.estimated_employees;
        }
        if (!company.funding_stage && metrics.estimated_funding) {
          updateData.funding_stage = metrics.estimated_funding;
        }

        const { error: updateErr } = await sb
          .from("companies")
          .update(updateData)
          .eq("id", company.id);

        if (updateErr) {
          console.error(`Update failed for ${company.name}:`, updateErr);
          continue;
        }

        results.push({ id: company.id, name: company.name, ...metrics });
        console.log(`✓ ${company.name}: ARR=${metrics.estimated_arr}, Employees=${metrics.estimated_employees}, Funding=${metrics.estimated_funding}`);

        // Small delay between companies to avoid rate limits
        if (companies.length > 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (companyErr) {
        console.error(`Error processing ${company.name}:`, companyErr);
      }
    }

    return respond({ success: true, processed: results.length, results });
  } catch (err) {
    console.error("estimate-company-metrics error:", err);
    return respond({ error: (err as Error).message }, 500);
  }
});

function respond(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
