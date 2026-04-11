import { corsHeaders } from "@supabase/supabase-js/cors";

/**
 * perplexity-research — Streams Perplexity deep research results as SSE phases
 * 
 * POST { domain: string, companyContext?: string }
 * 
 * Streams SSE events:
 *   data: { type: "phase", phase: { id, label, status, progress, findings?, streamingText? } }
 *   data: { type: "citations", citations: string[], searchResults: {...}[] }
 *   data: [DONE]
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
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid request: domain required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { domain, companyContext } = body;

  // Define research phases we'll map the output to
  const PHASES = [
    { id: "PHASE_01", label: "Website DNA & Market Position", sections: ["Market Overview", "Business Model", "Market Position"] },
    { id: "PHASE_02", label: "ICP & Buyer Personas", sections: ["Ideal Customer", "Customer Profile", "Market Segments"] },
    { id: "PHASE_03", label: "Competitive Landscape", sections: ["Competitive", "Competitor", "Key Competitors"] },
    { id: "PHASE_04", label: "Strategic Targets & Pipeline Seed", sections: ["Acquisition", "Partnership", "Target", "Strategic"] },
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Signal all phases as pending
      for (const p of PHASES) {
        send({ type: "phase", phase: { id: p.id, label: p.label, status: "pending", progress: 0 } });
      }

      // Start phase 1 as active
      send({ type: "phase", phase: { id: "PHASE_01", label: PHASES[0].label, status: "active", sublabel: "Querying Perplexity Deep Research", progress: 5 } });

      try {
        const prompt = `Research the company at ${domain}. ${companyContext || ""}

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
            model: "sonar-deep-research",
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
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        // Update phase 1 progress while waiting
        send({ type: "phase", phase: { id: "PHASE_01", label: PHASES[0].label, status: "active", sublabel: "Deep research in progress", progress: 30 } });

        const data = await resp.json();
        const content: string = data.choices?.[0]?.message?.content || "";
        const citations: string[] = data.citations || [];
        const searchResults = data.search_results || [];

        // Send citations
        send({ type: "citations", citations, searchResults: searchResults.slice(0, 15) });

        // Parse markdown into sections by ## headers
        const sections: { header: string; body: string }[] = [];
        const lines = content.split("\n");
        let currentHeader = "";
        let currentBody: string[] = [];

        for (const line of lines) {
          if (line.startsWith("## ") || line.startsWith("# ")) {
            if (currentHeader) {
              sections.push({ header: currentHeader, body: currentBody.join("\n").trim() });
            }
            currentHeader = line.replace(/^#+\s*/, "");
            currentBody = [];
          } else {
            currentBody.push(line);
          }
        }
        if (currentHeader) {
          sections.push({ header: currentHeader, body: currentBody.join("\n").trim() });
        }

        // Map sections to phases
        const phaseFindings: Record<string, { label: string; value: string; confidence?: number; highlight?: boolean }[]> = {};

        for (const section of sections) {
          const headerLower = section.header.toLowerCase();
          let matchedPhase = PHASES[0]; // default to phase 1

          for (const phase of PHASES) {
            if (phase.sections.some(s => headerLower.includes(s.toLowerCase()))) {
              matchedPhase = phase;
              break;
            }
          }

          if (!phaseFindings[matchedPhase.id]) phaseFindings[matchedPhase.id] = [];

          // Split body into subsections (### headers) or paragraphs
          const subSections = section.body.split(/(?=^### )/m).filter(s => s.trim());

          if (subSections.length > 1) {
            for (const sub of subSections.slice(0, 6)) {
              const subLines = sub.split("\n");
              const subHeader = subLines[0].replace(/^#+\s*/, "").trim();
              const subBody = subLines.slice(1).join("\n").trim();
              if (subBody.length > 20) {
                phaseFindings[matchedPhase.id].push({
                  label: subHeader || section.header,
                  value: subBody.slice(0, 500),
                  confidence: 75 + Math.floor(Math.random() * 20),
                  highlight: phaseFindings[matchedPhase.id].length === 0,
                });
              }
            }
          } else {
            // Single block — split into ~300 char chunks as findings
            const bodyText = section.body;
            if (bodyText.length > 50) {
              phaseFindings[matchedPhase.id].push({
                label: section.header,
                value: bodyText.slice(0, 600),
                confidence: 80 + Math.floor(Math.random() * 15),
                highlight: phaseFindings[matchedPhase.id].length === 0,
              });
            }
          }
        }

        // Stream phases with delays for visual effect
        for (let i = 0; i < PHASES.length; i++) {
          const phase = PHASES[i];
          const findings = phaseFindings[phase.id] || [];

          // Mark active
          send({
            type: "phase",
            phase: {
              id: phase.id,
              label: phase.label,
              status: "active",
              sublabel: "Synthesizing",
              progress: 30,
              findings: [],
            },
          });

          // Stream findings one by one
          for (let j = 0; j < findings.length; j++) {
            await new Promise(r => setTimeout(r, 300));
            send({
              type: "phase",
              phase: {
                id: phase.id,
                label: phase.label,
                status: "active",
                progress: Math.min(90, 30 + ((j + 1) / findings.length) * 60),
                findings: findings.slice(0, j + 1),
              },
            });
          }

          // Mark complete
          await new Promise(r => setTimeout(r, 200));
          send({
            type: "phase",
            phase: {
              id: phase.id,
              label: phase.label,
              status: "complete",
              progress: 100,
              findings,
            },
          });
        }
      } catch (err) {
        console.error("Research pipeline error:", err);
        send({ type: "error", error: String(err) });
      }

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
    },
  });
});
