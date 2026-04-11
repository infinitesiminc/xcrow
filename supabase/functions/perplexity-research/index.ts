import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * perplexity-research — Background job pattern
 *
 * 1. Creates a research_jobs row
 * 2. Returns job_id immediately
 * 3. Runs Perplexity in background via EdgeRuntime.waitUntil()
 * 4. Client polls the research_jobs table for results
 */

async function runResearch(jobId: string, domain: string, companyContext?: string) {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  if (!PERPLEXITY_API_KEY) {
    await supabaseAdmin.from("research_jobs").update({ status: "failed", error: "PERPLEXITY_API_KEY not configured", completed_at: new Date().toISOString() }).eq("id", jobId);
    return;
  }

  const updateProgress = async (phase: string, progress: number) => {
    await supabaseAdmin.from("research_jobs").update({ current_phase: phase, progress }).eq("id", jobId);
  };

  try {
    await updateProgress("PHASE_01", 5);

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

    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-deep-research",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`Perplexity error ${resp.status}: ${errText}`);
      await supabaseAdmin.from("research_jobs").update({ status: "failed", error: `Perplexity API error: ${resp.status}`, completed_at: new Date().toISOString() }).eq("id", jobId);
      return;
    }

    const reader = resp.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    const chunks: string[] = [];
    let sseBuffer = "";
    let totalLen = 0;
    let lastProgressUpdate = 0;

    // Phase detection via sliding window
    const phaseHeaders: [string, string][] = [
      ["## company overview", "PHASE_01"],
      ["## icp segments", "PHASE_02"],
      ["## buyer persona", "PHASE_02"],
      ["## competitive landscape", "PHASE_03"],
      ["## prospecting targets", "PHASE_04"],
    ];
    let currentPhase = "PHASE_01";
    let recentText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = sseBuffer.indexOf("\n")) !== -1) {
        let line = sseBuffer.slice(0, idx);
        sseBuffer = sseBuffer.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            const clean = delta.replace(/<\/?think>/g, "");
            chunks.push(clean);
            totalLen += clean.length;

            recentText += clean;
            if (recentText.length > 400) recentText = recentText.slice(-200);

            // Throttled phase + progress update (every 5s to minimize DB writes)
            const now = Date.now();
            if (now - lastProgressUpdate > 5000) {
              lastProgressUpdate = now;
              const lower = recentText.toLowerCase();
              for (const [key, phaseId] of phaseHeaders) {
                if (lower.includes(key)) currentPhase = phaseId;
              }
              const progress = Math.min(90, 5 + Math.floor(totalLen / 80));
              await updateProgress(currentPhase, progress);
            }
          }
        } catch {
          // incomplete JSON chunk
        }
      }
    }

    // Done — save full report
    await supabaseAdmin.from("research_jobs").update({
      status: "complete",
      progress: 100,
      current_phase: "PHASE_04",
      report_text: chunks.join(""),
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

  // Extract user from JWT
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

  // Create job row
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

  // Fire and forget — background processing
  (globalThis as any).EdgeRuntime.waitUntil(
    runResearch(job.id, body.domain, body.companyContext)
  );

  return new Response(JSON.stringify({ job_id: job.id }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
