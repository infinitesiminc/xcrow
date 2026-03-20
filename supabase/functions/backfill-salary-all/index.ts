import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Return immediately — work happens in the background
  const ctrl = new AbortController();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);

  // Kick off background processing
  (async () => {
    try {
      // Get companies that have analyzed jobs with descriptions
      const { data: companies } = await sb
        .from("jobs")
        .select("company_id, companies!inner(id, name)")
        .not("company_id", "is", null)
        .not("description", "is", null)
        .gt("automation_risk_percent", 0)
        .is("salary_min", null);

      // Deduplicate companies
      const companyMap = new Map<string, string>();
      for (const j of companies || []) {
        const c = j.companies as any;
        if (c?.id && !companyMap.has(c.id)) {
          companyMap.set(c.id, c.name);
        }
      }

      console.log(`Found ${companyMap.size} companies with unprocessed salary data`);

      for (const [companyId, companyName] of companyMap) {
        console.log(`\n--- Processing: ${companyName} ---`);

        // Step 1: Try 3 US-based jobs first (probe)
        const { data: probeJobs } = await sb
          .from("jobs")
          .select("id, title, description")
          .eq("company_id", companyId)
          .not("description", "is", null)
          .is("salary_min", null)
          .gt("automation_risk_percent", 0)
          .limit(3);

        if (!probeJobs || probeJobs.length === 0) {
          console.log(`  No unprocessed jobs, skipping`);
          continue;
        }

        let foundSalary = false;

        // Process probe batch
        for (const job of probeJobs) {
          const result = await extractSalary(job, lovableKey);
          if (result && result.salary_min) {
            foundSalary = true;
            await saveSalary(sb, job.id, result);
            console.log(`  ✅ ${job.title}: ${result.salary_currency || "USD"} ${result.salary_min}-${result.salary_max} (${result.salary_period})`);
          } else {
            console.log(`  ⏭ ${job.title}: no salary found`);
          }
          await delay(300);
        }

        if (!foundSalary) {
          console.log(`  ❌ No salary in probe — skipping remaining jobs for ${companyName}`);
          continue;
        }

        // Step 2: Salary found! Process all remaining jobs for this company
        console.log(`  💰 Salary found — processing remaining jobs for ${companyName}...`);
        let offset = 0;
        const batchSize = 5;
        let totalUpdated = 0;

        while (true) {
          const { data: batch } = await sb
            .from("jobs")
            .select("id, title, description")
            .eq("company_id", companyId)
            .not("description", "is", null)
            .is("salary_min", null)
            .order("imported_at", { ascending: false })
            .range(offset, offset + batchSize - 1);

          if (!batch || batch.length === 0) break;

          for (const job of batch) {
            const result = await extractSalary(job, lovableKey);
            if (result && result.salary_min) {
              await saveSalary(sb, job.id, result);
              totalUpdated++;
              console.log(`  ✅ ${job.title}: ${result.salary_currency || "USD"} ${result.salary_min}-${result.salary_max}`);
            }
            await delay(300);
          }

          offset += batchSize;
        }

        console.log(`  📊 ${companyName}: ${totalUpdated} jobs updated with salary data`);
      }

      console.log("\n=== Backfill complete ===");
    } catch (e) {
      console.error("Background backfill error:", e);
    }
  })();

  return new Response(
    JSON.stringify({ status: "started", message: "Smart salary backfill running in background. Check function logs for progress." }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

interface SalaryResult {
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_period: string | null;
  equity_text: string | null;
}

async function extractSalary(job: { id: string; title: string; description: string }, lovableKey: string): Promise<SalaryResult | null> {
  const desc = (job.description || "").slice(0, 8000);
  if (desc.length < 100) return null;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You extract structured salary data from job postings. Always respond via the tool call." },
          {
            role: "user",
            content: `Extract salary/compensation from this job posting. Return null for fields not found.

Job Title: ${job.title}
Description:
${desc}

Extract salary_min, salary_max (integers), salary_currency (ISO code), salary_period (annual or hourly — keep original), equity_text (if equity/RSUs/stock mentioned).
If salary is "competitive" or vague, return nulls.`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_salary",
            description: "Extract salary and equity info",
            parameters: {
              type: "object",
              properties: {
                salary_min: { type: ["integer", "null"] },
                salary_max: { type: ["integer", "null"] },
                salary_currency: { type: ["string", "null"] },
                salary_period: { type: ["string", "null"], enum: ["annual", "hourly", null] },
                equity_text: { type: ["string", "null"] },
              },
              required: ["salary_min", "salary_max", "salary_currency", "salary_period", "equity_text"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_salary" } },
      }),
    });

    if (resp.status === 429) {
      console.log("  ⚠️ Rate limited, waiting 5s...");
      await delay(5000);
      return null;
    }

    if (!resp.ok) {
      await resp.text();
      return null;
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return null;

    return JSON.parse(toolCall.function.arguments);
  } catch (e) {
    console.error(`  Error extracting salary for ${job.title}:`, e);
    return null;
  }
}

async function saveSalary(sb: any, jobId: string, salary: SalaryResult) {
  await sb.from("jobs").update({
    salary_min: salary.salary_min,
    salary_max: salary.salary_max,
    salary_currency: salary.salary_currency || "USD",
    salary_period: salary.salary_period || "annual",
    ...(salary.equity_text ? { equity_text: salary.equity_text } : {}),
  }).eq("id", jobId);
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
