import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * perplexity-research — Background job pattern (non-streaming)
 *
 * 1. Creates a research_jobs row, returns job_id immediately
 * 2. Calls Perplexity NON-streaming (single response) in background
 * 3. Writes result to DB — client polls for completion
 *
 * Non-streaming eliminates CPU time issues: Perplexity does all work,
 * we just await the response (I/O wait, not CPU).
 */

async function runResearch(jobId: string, domain: string, companyContext?: string) {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  if (!PERPLEXITY_API_KEY) {
    await supabaseAdmin.from("research_jobs").update({
      status: "failed",
      error: "PERPLEXITY_API_KEY not configured",
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);
    return;
  }

  try {
    // Mark as actively processing
    await supabaseAdmin.from("research_jobs").update({
      current_phase: "PHASE_01",
      progress: 10,
    }).eq("id", jobId);

    const systemPrompt = `You are a B2B go-to-market research analyst. Analyze a company's website and produce a precise, actionable ICP report for outbound sales.

Rules:
- Be specific: real company names, real job titles, real revenue figures
- No filler, no hedging — every claim grounded in evidence
- Focus 60% of depth on ICP & Buyer Personas`;

    const userPrompt = `Deep research on: ${domain}
${companyContext ? `\nContext: ${companyContext}` : ""}

Use these EXACT markdown headers:

## Company Overview
What they sell, business model, pricing if discoverable, estimated revenue/headcount.

## ICP Segments and Buyer Personas
For EACH segment (identify 2-4):
### [Segment Name]
- **Company fit**: industry, employee range, revenue range, tech stack signals, geography
- **Primary buyer**: exact title, department, seniority, pain points this product solves
- **Secondary buyer**: same detail
- **Buying triggers**: events that create urgency
- **Disqualifiers**: what makes a company NOT a fit

## Competitive Landscape
Direct competitors (name, domain, differentiation). Where does ${domain} win vs lose?

## Prospecting Targets
5-10 specific companies that fit the ICPs above. For each:
- Company name and domain
- Which ICP segment they match
- Why they'd buy (specific rationale)
- Decision-maker title to target`;

    // NON-streaming call — Perplexity does all work, we just wait
    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-deep-research",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`Perplexity error ${resp.status}: ${errText}`);
      await supabaseAdmin.from("research_jobs").update({
        status: "failed",
        error: `Perplexity API error: ${resp.status}`,
        completed_at: new Date().toISOString(),
      }).eq("id", jobId);
      return;
    }

    const data = await resp.json();
    const reportText = data.choices?.[0]?.message?.content || "";

    await supabaseAdmin.from("research_jobs").update({
      status: "complete",
      progress: 100,
      current_phase: "PHASE_04",
      report_text: reportText,
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);

  } catch (err) {
    console.error("Research pipeline error:", err);
    await supabaseAdmin.from("research_jobs").update({
      status: "failed",
      error: String(err),
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let userId: string | null = null;
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    userId = user?.id ?? null;
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { domain: string; companyContext?: string };
  try {
    body = await req.json();
    if (!body.domain) throw new Error("Missing domain");
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request: domain required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: job, error: insertError } = await supabaseAdmin.from("research_jobs").insert({
    user_id: userId,
    domain: body.domain,
    company_context: body.companyContext || null,
    status: "processing",
    progress: 0,
    current_phase: "PHASE_01",
  }).select("id").single();

  if (insertError || !job) {
    return new Response(JSON.stringify({ error: "Failed to create research job" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fire and forget — non-streaming Perplexity call in background
  (globalThis as any).EdgeRuntime.waitUntil(
    runResearch(job.id, body.domain, body.companyContext)
  );

  return new Response(JSON.stringify({ job_id: job.id }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
