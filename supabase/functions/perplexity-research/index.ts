const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * perplexity-research — ICP deep research via Perplexity sonar-deep-research
 *
 * Lightweight SSE relay: streams raw text from Perplexity with keepalive
 * heartbeats. All heavy parsing happens client-side to avoid CPU timeouts.
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  if (!PERPLEXITY_API_KEY) {
    return new Response(JSON.stringify({ error: "PERPLEXITY_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { domain: string; companyContext?: string };
  try {
    body = await req.json();
    if (!body.domain) throw new Error("Missing domain");
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Invalid request: domain required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { domain, companyContext } = body;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch { /* closed */ }
      };

      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(": keepalive\n\n")); } catch { clearInterval(heartbeat); }
      }, 3000);

      // Signal phases
      const PHASES = [
        { id: "PHASE_01", label: "Company DNA & Value Proposition" },
        { id: "PHASE_02", label: "ICP & Buyer Personas" },
        { id: "PHASE_03", label: "Competitive Landscape" },
        { id: "PHASE_04", label: "Prospecting Targets" },
      ];
      for (const p of PHASES) {
        send({ type: "phase", phase: { id: p.id, label: p.label, status: "pending", progress: 0 } });
      }
      send({ type: "phase", phase: { id: "PHASE_01", label: PHASES[0].label, status: "active", sublabel: "Deep research in progress — this takes 30-90 seconds", progress: 5 } });

      try {
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
          send({ type: "error", error: `Perplexity API error: ${resp.status}` });
          clearInterval(heartbeat);
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        const chunks: string[] = [];
        let totalLen = 0;
        const reader = resp.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let sseBuffer = "";
        let lastEmit = 0;
        let lastPhaseCheck = 0;

        // Phase detection keywords
        const phaseKeywords: [string, number][] = [
          ["## company overview", 0],
          ["## icp segments", 1],
          ["## buyer persona", 1],
          ["## competitive landscape", 2],
          ["## prospecting targets", 3],
        ];
        let currentPhase = 0;
        const completedPhases = new Set<number>();
        // Track last N chars for phase detection instead of full text
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

                // Keep a sliding window for phase detection (last 200 chars)
                recentText += clean;
                if (recentText.length > 400) recentText = recentText.slice(-200);

                const now = Date.now();

                // Throttled phase check (every 2s to save CPU)
                if (now - lastPhaseCheck > 2000) {
                  lastPhaseCheck = now;
                  const lower = recentText.toLowerCase();
                  for (const [key, phIdx] of phaseKeywords) {
                    if (phIdx > currentPhase && lower.includes(key)) {
                      for (let i = currentPhase; i < phIdx; i++) {
                        if (!completedPhases.has(i)) {
                          completedPhases.add(i);
                          send({ type: "phase", phase: { id: PHASES[i].id, label: PHASES[i].label, status: "complete", progress: 100 } });
                        }
                      }
                      currentPhase = phIdx;
                      send({ type: "phase", phase: { id: PHASES[currentPhase].id, label: PHASES[currentPhase].label, status: "active", sublabel: "Analyzing", progress: 10 } });
                    }
                  }
                }

                // Throttled streaming text update (every 1.5s)
                if (now - lastEmit > 1500) {
                  lastEmit = now;
                  const tail = recentText.slice(-300).trim();
                  if (tail) {
                    send({
                      type: "phase",
                      phase: {
                        id: PHASES[currentPhase].id,
                        label: PHASES[currentPhase].label,
                        status: "active",
                        sublabel: "Deep research streaming",
                        streamingText: tail,
                        progress: Math.min(85, 10 + Math.floor(totalLen / 100)),
                      },
                    });
                  }
                }
              }
            } catch {
              // Incomplete JSON chunk — ignore
            }
          }
        }

        // Complete all remaining phases
        for (let i = 0; i < PHASES.length; i++) {
          if (!completedPhases.has(i)) {
            send({ type: "phase", phase: { id: PHASES[i].id, label: PHASES[i].label, status: "complete", progress: 100 } });
          }
        }

        // Send the full report — client does all parsing
        send({ type: "full_report", text: chunks.join("") });

      } catch (err) {
        console.error("Research pipeline error:", err);
        send({ type: "error", error: String(err) });
      }

      clearInterval(heartbeat);
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
});
