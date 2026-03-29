import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { vertical_id: filterVerticalId, dry_run } = await req.json().catch(() => ({}));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get all niches with their role counts
    let nicheQuery = supabase
      .from("company_vertical_map")
      .select("vertical_id, vertical_name, sub_vertical, role, company_id, companies(id, name, description, industry)")
      .order("vertical_id");
    if (filterVerticalId) nicheQuery = nicheQuery.eq("vertical_id", filterVerticalId);
    const { data: mapData, error: mapErr } = await nicheQuery;
    if (mapErr) throw mapErr;

    // Aggregate niches
    interface NicheInfo {
      vertical_id: number;
      vertical_name: string;
      sub_vertical: string;
      incumbents: { id: string; name: string }[];
      disruptors: { id: string; name: string }[];
    }
    const niches: Record<string, NicheInfo> = {};
    for (const row of mapData || []) {
      const key = `${row.vertical_id}::${row.sub_vertical || "General"}`;
      if (!niches[key]) {
        niches[key] = {
          vertical_id: row.vertical_id,
          vertical_name: row.vertical_name,
          sub_vertical: row.sub_vertical || "General",
          incumbents: [],
          disruptors: [],
        };
      }
      const company = row.companies as any;
      if (!company) continue;
      const entry = { id: company.id, name: company.name };
      if (row.role === "incumbent" && !niches[key].incumbents.find(c => c.id === company.id)) {
        niches[key].incumbents.push(entry);
      }
      if (row.role === "disruptor" && !niches[key].disruptors.find(c => c.id === company.id)) {
        niches[key].disruptors.push(entry);
      }
    }

    // 2. Find incomplete niches
    const incomplete = Object.values(niches).filter(
      n => n.incumbents.length === 0 || n.disruptors.length === 0
    );
    console.log(`Found ${incomplete.length} incomplete niches out of ${Object.keys(niches).length}`);

    if (incomplete.length === 0) {
      return new Response(JSON.stringify({ message: "All niches complete", enriched: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Get ALL companies as potential pool — prioritize large/known ones
    const { data: allCompanies, error: poolErr } = await supabase
      .from("companies")
      .select("id, name, description, industry, employee_range, estimated_employees, estimated_funding")
      .order("name")
      .limit(3000);
    if (poolErr) console.error("Pool query error:", poolErr);

    const uniquePool = allCompanies || [];
    console.log(`Company pool: ${uniquePool.length} companies`);

    // 4. Process in batches via AI
    const batchSize = 8;
    const results: { vertical_id: number; vertical_name: string; sub_vertical: string; company_id: string; company_name: string; role: string }[] = [];

    // Build compact company registry — split into large (incumbents) and small (disruptors)
    const largeCompanies = uniquePool.filter(c => {
      const emp = c.estimated_employees || c.employee_range || "";
      const funding = c.estimated_funding || "";
      return emp.includes("1000") || emp.includes("5000") || emp.includes("10000") || 
             funding.toLowerCase().includes("public") || funding.toLowerCase().includes("series c") ||
             funding.toLowerCase().includes("series d") || funding.toLowerCase().includes("ipo") ||
             funding.toLowerCase().includes("late");
    });
    const smallCompanies = uniquePool.filter(c => !largeCompanies.includes(c));

    const formatCompany = (c: any) => 
      `${c.name} | ${c.industry || "?"} | ${c.description?.slice(0, 60) || "?"} | ${c.estimated_employees || c.employee_range || "?"}`;

    const incumbentRegistry = largeCompanies.slice(0, 400).map(formatCompany).join("\n");
    const disruptorRegistry = smallCompanies.slice(0, 600).map(formatCompany).join("\n");

    for (let i = 0; i < incomplete.length; i += batchSize) {
      const batch = incomplete.slice(i, i + batchSize);

      const nicheDescriptions = batch.map(n => {
        const missing = [];
        if (n.incumbents.length === 0) missing.push("NEEDS INCUMBENT");
        if (n.disruptors.length === 0) missing.push("NEEDS DISRUPTOR");
        return `Niche: "${n.sub_vertical}" (vertical: ${n.vertical_name})
  Has incumbents: ${n.incumbents.map(c => c.name).join(", ") || "NONE"}
  Has disruptors: ${n.disruptors.map(c => c.name).join(", ") || "NONE"}
  Missing: ${missing.join(", ")}`;
      }).join("\n\n");

      const prompt = `Match companies to these software niches. Each niche needs either an incumbent or disruptor (or both).

RULES:
- INCUMBENT = large established company that operates in this space (even if it's just one product line). Think Salesforce, Oracle, SAP, Microsoft, Google, Adobe, Workday, ServiceNow, etc.
- DISRUPTOR = startup or newer company challenging the status quo
- A company can serve multiple niches — e.g. Salesforce is incumbent in CRM, Sales Enablement, Marketing Automation
- You MUST use company names EXACTLY as they appear in the registries below
- For each niche, provide at least one assignment for the missing role
- Prefer high-confidence matches but any reasonable match is better than none

NICHES:
${nicheDescriptions}

LARGE COMPANIES (potential incumbents):
${incumbentRegistry}

STARTUPS/CHALLENGERS (potential disruptors):
${disruptorRegistry}`;

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a market analyst matching companies to software niches. Return structured matches via the provided tool." },
            { role: "user", content: prompt }
          ],
          tools: [{
            type: "function",
            function: {
              name: "assign_companies",
              description: "Assign companies to niches as incumbents or disruptors",
              parameters: {
                type: "object",
                properties: {
                  assignments: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        sub_vertical: { type: "string", description: "Exact niche name" },
                        company_name: { type: "string", description: "Exact company name from registry" },
                        role: { type: "string", enum: ["incumbent", "disruptor"] },
                        confidence: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["sub_vertical", "company_name", "role", "confidence"],
                      additionalProperties: false,
                    }
                  }
                },
                required: ["assignments"],
                additionalProperties: false,
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "assign_companies" } },
        }),
      });

      if (!aiResp.ok) {
        const errText = await aiResp.text();
        console.error(`AI error batch ${i}: ${aiResp.status}`, errText);
        if (aiResp.status === 429) {
          await new Promise(r => setTimeout(r, 5000));
          i -= batchSize;
          continue;
        }
        continue;
      }

      const aiData = await aiResp.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) continue;

      const parsed = JSON.parse(toolCall.function.arguments);
      for (const assignment of parsed.assignments || []) {
        const niche = batch.find(n => n.sub_vertical === assignment.sub_vertical);
        if (!niche) continue;

        // Find company in pool by exact name
        const company = uniquePool.find(c => c.name === assignment.company_name);
        if (!company) {
          console.log(`Company not found: "${assignment.company_name}"`);
          continue;
        }

        // Skip if this role is already filled
        if (assignment.role === "incumbent" && niche.incumbents.length > 0) continue;
        if (assignment.role === "disruptor" && niche.disruptors.length > 0) continue;

        results.push({
          vertical_id: niche.vertical_id,
          vertical_name: niche.vertical_name,
          sub_vertical: niche.sub_vertical,
          company_id: company.id,
          company_name: company.name,
          role: assignment.role,
        });
      }

      console.log(`Batch ${Math.floor(i / batchSize) + 1}: ${parsed.assignments?.length || 0} assignments`);

      if (i + batchSize < incomplete.length) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    // 5. Insert new mappings (unless dry run)
    let inserted = 0;
    if (!dry_run) {
      for (const r of results) {
        // Check not already mapped
        const { data: existing } = await supabase
          .from("company_vertical_map")
          .select("id")
          .eq("company_id", r.company_id)
          .eq("vertical_id", r.vertical_id)
          .eq("sub_vertical", r.sub_vertical)
          .maybeSingle();

        if (existing) continue;

        const { error: insertErr } = await supabase
          .from("company_vertical_map")
          .insert({
            company_id: r.company_id,
            vertical_id: r.vertical_id,
            vertical_name: r.vertical_name,
            sub_vertical: r.sub_vertical,
            role: r.role,
            confidence: 0.7,
          });

        if (insertErr) {
          console.error(`Insert error for ${r.company_name} → ${r.sub_vertical}:`, insertErr);
        } else {
          inserted++;
        }
      }
    }

    return new Response(JSON.stringify({
      total_incomplete: incomplete.length,
      assignments_found: results.length,
      inserted,
      dry_run: !!dry_run,
      sample: results.slice(0, 20),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
