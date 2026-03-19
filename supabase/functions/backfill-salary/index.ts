import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 20;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const { offset = 0, dry_run = false } = await req.json().catch(() => ({}));

    // Fetch jobs that have descriptions and no salary yet
    const { data: jobs, error } = await sb
      .from("jobs")
      .select("id, title, description")
      .not("description", "is", null)
      .is("salary_min", null)
      .gt("description", "")
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) throw error;
    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ done: true, message: "No more jobs to process", offset }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { id: string; salary: any }[] = [];
    let updated = 0;
    let skipped = 0;

    // Process each job
    for (const job of jobs) {
      // Truncate description to save tokens
      const desc = (job.description || "").slice(0, 3000);

      const prompt = `Extract salary/compensation information from this job posting. If no salary info is found, return null values.

Job Title: ${job.title}
Job Description:
${desc}

Extract:
- salary_min: minimum salary as integer (no decimals, no currency symbols). Convert hourly to annual if needed (hourly * 2080).
- salary_max: maximum salary as integer
- salary_currency: ISO currency code (default USD)
- salary_period: "annual", "hourly", "monthly", or "daily"

If a single number is given (not a range), use it for both min and max.
If salary is listed as "competitive" or similar vague terms, return nulls.`;

      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: "You extract structured salary data from job postings. Always respond via the tool call." },
              { role: "user", content: prompt },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "extract_salary",
                  description: "Extract salary information from a job posting",
                  parameters: {
                    type: "object",
                    properties: {
                      salary_min: { type: ["integer", "null"], description: "Minimum salary as integer" },
                      salary_max: { type: ["integer", "null"], description: "Maximum salary as integer" },
                      salary_currency: { type: ["string", "null"], description: "ISO currency code" },
                      salary_period: { type: ["string", "null"], enum: ["annual", "hourly", "monthly", "daily", null] },
                    },
                    required: ["salary_min", "salary_max", "salary_currency", "salary_period"],
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "extract_salary" } },
          }),
        });

        if (aiResp.status === 429) {
          // Rate limited - return progress so far
          return new Response(
            JSON.stringify({ 
              rate_limited: true, updated, skipped, 
              next_offset: offset + results.length,
              results 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const aiData = await aiResp.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        
        if (!toolCall) {
          skipped++;
          continue;
        }

        const salary = JSON.parse(toolCall.function.arguments);
        results.push({ id: job.id, salary });

        if (!dry_run && salary.salary_min != null) {
          const { error: updateErr } = await sb
            .from("jobs")
            .update({
              salary_min: salary.salary_min,
              salary_max: salary.salary_max,
              salary_currency: salary.salary_currency || "USD",
              salary_period: salary.salary_period || "annual",
            })
            .eq("id", job.id);

          if (updateErr) {
            console.error(`Failed to update job ${job.id}:`, updateErr);
          } else {
            updated++;
          }
        } else {
          skipped++;
        }

        // Small delay to avoid rate limits
        await new Promise((r) => setTimeout(r, 200));
      } catch (e) {
        console.error(`Error processing job ${job.id}:`, e);
        skipped++;
      }
    }

    return new Response(
      JSON.stringify({
        processed: jobs.length,
        updated,
        skipped,
        next_offset: offset + BATCH_SIZE,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("backfill-salary error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
