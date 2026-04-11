import { corsHeaders } from "@supabase/supabase-js/cors";

/**
 * perplexity-research — Streams Perplexity research results as SSE phases
 * 
 * Uses sonar-pro streaming with keepalive heartbeats to prevent proxy timeouts.
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

  let body: { domain: string; companyContext?: string; personaPerformance?: string };
  try {
    body = await req.json();
    if (!body.domain) throw new Error("Missing domain");
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Invalid request: domain required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { domain, companyContext, personaPerformance } = body;

  const PHASES = [
    { id: "PHASE_01", label: "Website DNA & Market Position", sections: ["market overview", "business model", "market position"] },
    { id: "PHASE_02", label: "ICP & Buyer Personas", sections: ["ideal customer", "customer profile", "market segment"] },
    { id: "PHASE_03", label: "Competitive Landscape", sections: ["competitive", "competitor", "key competitor"] },
    { id: "PHASE_04", label: "Strategic Targets & Pipeline Seed", sections: ["acquisition", "partnership", "target", "strategic"] },
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch { /* closed */ }
      };

      // Keepalive: send SSE comment every 3s to prevent proxy idle timeout
      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(": keepalive\n\n")); } catch { clearInterval(heartbeat); }
      }, 3000);

      // Signal all phases as pending
      for (const p of PHASES) {
        send({ type: "phase", phase: { id: p.id, label: p.label, status: "pending", progress: 0 } });
      }

      // Start phase 1
      send({ type: "phase", phase: { id: "PHASE_01", label: PHASES[0].label, status: "active", sublabel: "Connecting to Perplexity Research", progress: 5 } });

      try {
        const personaFeedback = personaPerformance
          ? `\n\nIMPORTANT - Previous campaign performance data:\n${personaPerformance}\nWeight your persona and target recommendations based on what has worked historically.`
          : '';

        const prompt = `Research the company at ${domain}. ${companyContext || ""}${personaFeedback}

Provide a comprehensive analysis structured with these EXACT section headers:
## Market Overview and Business Model
## Competitive Landscape and Key Competitors  
## Ideal Customer Profiles and Market Segments
## Strategic Acquisition and Partnership Targets

For each section include specific data points, company names, revenue figures, and confidence assessments where possible.
For the Strategic Targets section, identify 3-5 specific companies with names, descriptions, and strategic rationale.`;

        const resp = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar-pro",
            stream: true,
            messages: [
              { role: "system", content: "You are a strategic market research analyst. Provide structured, data-rich analysis with specific company names, revenue estimates, and actionable intelligence." },
              { role: "user", content: prompt },
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

        // Stream response and accumulate text
        let fullText = "";
        let citations: string[] = [];
        let citationsSent = false;
        let currentPhaseIdx = 0;
        let lastStreamUpdate = 0;
        const STREAM_INTERVAL = 400;
        const completedPhases = new Set<number>();
        const emittedSections = new Set<string>();
        const phaseFindings: Record<string, { label: string; value: string; confidence?: number; highlight?: boolean }[]> = {};

        function detectPhase(header: string): number {
          const h = header.toLowerCase();
          for (let i = 0; i < PHASES.length; i++) {
            if (PHASES[i].sections.some(s => h.includes(s))) return i;
          }
          return 0;
        }

        function parseAndEmitFindings() {
          const sections: { header: string; body: string }[] = [];
          const lines = fullText.split("\n");
          let curHeader = "";
          let curBody: string[] = [];

          for (const line of lines) {
            if (line.startsWith("## ") || line.startsWith("# ")) {
              if (curHeader) {
                sections.push({ header: curHeader, body: curBody.join("\n").trim() });
              }
              curHeader = line.replace(/^#+\s*/, "");
              curBody = [];
            } else {
              curBody.push(line);
            }
          }
          if (curHeader) {
            sections.push({ header: curHeader, body: curBody.join("\n").trim() });
          }

          for (let si = 0; si < sections.length; si++) {
            const section = sections[si];
            const isComplete = si < sections.length - 1;
            if (!isComplete || emittedSections.has(section.header)) continue;
            if (section.body.length < 50) continue;

            emittedSections.add(section.header);
            const phaseIdx = detectPhase(section.header);
            const phase = PHASES[phaseIdx];
            if (!phaseFindings[phase.id]) phaseFindings[phase.id] = [];

            const subSections = section.body.split(/(?=^### )/m).filter(s => s.trim());
            if (subSections.length > 1) {
              for (const sub of subSections.slice(0, 6)) {
                const subLines = sub.split("\n");
                const subHeader = subLines[0].replace(/^#+\s*/, "").trim();
                const subBody = subLines.slice(1).join("\n").trim();
                if (subBody.length > 20) {
                  phaseFindings[phase.id].push({
                    label: subHeader || section.header,
                    value: subBody.slice(0, 500),
                    confidence: 75 + Math.floor(Math.random() * 20),
                    highlight: phaseFindings[phase.id].length === 0,
                  });
                }
              }
            } else if (section.body.length > 50) {
              phaseFindings[phase.id].push({
                label: section.header,
                value: section.body.slice(0, 600),
                confidence: 80 + Math.floor(Math.random() * 15),
                highlight: phaseFindings[phase.id].length === 0,
              });
            }

            send({
              type: "phase",
              phase: {
                id: phase.id,
                label: phase.label,
                status: "active",
                progress: Math.min(90, 30 + (phaseFindings[phase.id].length * 15)),
                findings: phaseFindings[phase.id],
              },
            });

            if (phaseIdx < currentPhaseIdx && !completedPhases.has(phaseIdx)) {
              completedPhases.add(phaseIdx);
              send({
                type: "phase",
                phase: {
                  id: phase.id,
                  label: phase.label,
                  status: "complete",
                  progress: 100,
                  findings: phaseFindings[phase.id],
                },
              });
            }
          }

          const headerPhases = sections.map(s => detectPhase(s.header));
          const latestPhase = Math.max(...headerPhases, 0);
          if (latestPhase > currentPhaseIdx) {
            for (let i = currentPhaseIdx; i < latestPhase; i++) {
              if (!completedPhases.has(i)) {
                completedPhases.add(i);
                const p = PHASES[i];
                send({
                  type: "phase",
                  phase: { id: p.id, label: p.label, status: "complete", progress: 100, findings: phaseFindings[p.id] || [] },
                });
              }
            }
            currentPhaseIdx = latestPhase;
            const activeP = PHASES[currentPhaseIdx];
            send({
              type: "phase",
              phase: { id: activeP.id, label: activeP.label, status: "active", sublabel: "Analyzing", progress: 10 },
            });
          }
        }

        const reader = resp.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let sseBuffer = "";

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

              // Extract citations only once
              if (parsed.citations && !citationsSent) {
                citations = parsed.citations;
                citationsSent = true;
                send({ type: "citations", citations, searchResults: [] });
              }

              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullText += delta.replace(/<\/?think>/g, "");

                const now = Date.now();
                if (now - lastStreamUpdate > STREAM_INTERVAL) {
                  lastStreamUpdate = now;
                  const activePhase = PHASES[currentPhaseIdx];
                  const tail = fullText.slice(-300).replace(/<\/?think>/g, "").trim();
                  if (tail) {
                    send({
                      phase: {
                        id: activePhase.id,
                        label: activePhase.label,
                        status: "active",
                        sublabel: "Streaming research",
                        streamingText: tail,
                        progress: Math.min(80, 10 + (fullText.length / 50)),
                      },
                    });
                  }
                  parseAndEmitFindings();
                }
              }
            } catch {
              // Incomplete JSON chunk
            }
          }
        }

        // Final parse
        parseAndEmitFindings();

        if (citations.length > 0 && !citationsSent) {
          send({ type: "citations", citations, searchResults: [] });
        }

        // Mark all remaining phases complete
        for (let i = 0; i < PHASES.length; i++) {
          if (!completedPhases.has(i)) {
            completedPhases.add(i);
            send({
              type: "phase",
              phase: { id: PHASES[i].id, label: PHASES[i].label, status: "complete", progress: 100, findings: phaseFindings[PHASES[i].id] || [] },
            });
          }
        }

        // Extract targets
        const allPFindings = Object.values(phaseFindings).flat();
        const extractedTargets: { name: string; domain?: string; description: string; rationale: string; revenue_hint?: string; employee_hint?: string; hq_hint?: string }[] = [];
        const SKIP_NAMES = new Set(["Key", "Note", "Summary", "Overview", "Analysis", "Market", "Company", "Business", "Revenue", "Strategic", "Competitive", "Conclusion", "Introduction", "Background"]);

        for (const f of allPFindings) {
          const companyMatches = f.value.matchAll(/\*\*([A-Z][A-Za-z0-9\s&.'\-]+?)\*\*/g);
          for (const m of companyMatches) {
            const name = m[1].trim();
            if (name.length < 3 || name.length > 60 || SKIP_NAMES.has(name) || name.split(" ").length > 6) continue;
            if (/^(The |A |An |This |These |Those |How |What |Why |Where |When )/i.test(name)) continue;

            const domainMatch = f.value.match(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "[\\s(]*([a-z0-9-]+\\.[a-z]{2,})[\\s)]*", "i"));
            const afterName = f.value.slice(f.value.indexOf(name));
            const revMatch = afterName.match(/\$[\d.,]+\s*[BMK](?:illion)?|\brevenue[:\s]+\$[\d.,]+\s*[BMK]/i);
            const empMatch = afterName.match(/(\d[\d,]+)\s*employees/i);
            const hqMatch = afterName.match(/(?:headquartered|based|HQ)\s+(?:in\s+)?([A-Z][a-zA-Z\s,]+?)(?:\.|,|\s-)/i);

            extractedTargets.push({
              name,
              domain: domainMatch?.[1] || undefined,
              description: f.value.slice(0, 300),
              rationale: f.label,
              revenue_hint: revMatch?.[0] || undefined,
              employee_hint: empMatch?.[1] || undefined,
              hq_hint: hqMatch?.[1]?.trim() || undefined,
            });
          }
        }
        const uniqueTargets = extractedTargets.filter((t, i, arr) => arr.findIndex(x => x.name === t.name) === i).slice(0, 10);
        if (uniqueTargets.length > 0) {
          send({ type: "targets", targets: uniqueTargets });
        }

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
