import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, payload } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (action === "briefing") {
      const { incumbent, cluster, messages, allIncumbents } = payload;

      const systemPrompt = `You are an AI Research Analyst briefing a founder on a potential disruption target. Your job is to EDUCATE the user about this company before they enter the simulation.

TARGET COMPANY:
- Name: ${incumbent.name}
- Industry: ${cluster.name}
- Age: ${incumbent.age}
- Disruption vector: ${incumbent.vector}
- Key vulnerability: ${incumbent.vulnerability}
- Asymmetric angle: ${incumbent.asymmetricAngle || "Not yet identified"}
- Beachhead niche: ${incumbent.beachheadNiche || "Not yet identified"}
- Disruptor model: ${incumbent.disruptorModel || "Not yet identified"}
- Existing challenger: ${incumbent.existingDisruptor || "None known"}
- Timing catalyst: ${cluster.timingCatalyst}

${allIncumbents ? `OTHER TARGETS IN THIS INDUSTRY (if user wants to switch):\n${JSON.stringify(allIncumbents)}\n` : ""}

YOUR BRIEFING STRUCTURE (for your FIRST message):
1. **Company Overview** — What does ${incumbent.name} do? Who are their customers? What's their business model? Explain as if the user has NEVER heard of this company. Use simple language.
2. **Why They're Vulnerable** — Explain the specific weakness in plain terms. Use analogies. Example: "Think of them as a taxi company right before Uber — they have loyal customers but their technology is 15 years old."
3. **The AI Disruption Opportunity** — How could AI specifically disrupt this company? What tasks could be automated? What new business models does AI enable?
4. **The Disruption Playbook Preview** — Briefly introduce the 6-step framework they'll use in the simulation
5. End with: "**Ready to disrupt ${incumbent.name}?** Ask me any questions first — about the company, the industry, or the strategy. When you're ready, click 'Launch Simulation' below. Or if this target doesn't excite you, tell me what kind of company you'd rather disrupt and I'll suggest alternatives."

YOUR ROLE IN FOLLOW-UP MESSAGES:
- Answer ANY question about the company, industry, business model, competitors, market size, etc.
- If the user says they're not interested or asks for different targets, suggest 2-3 alternatives from the same industry with a brief pitch for each. Format each suggestion as: "**[Company Name]** — [one-line pitch why it's exciting to disrupt]"
- If the user asks about a specific alternative, give a mini-briefing on that company
- Be enthusiastic and make the disruption opportunity feel exciting and achievable
- Keep follow-up responses under 200 words
- Use markdown formatting
- NEVER start the simulation yourself — the user must click the Launch button`;

      return streamAI(LOVABLE_API_KEY, systemPrompt, messages);
    }

    if (action === "battle") {
      const { incumbent, cluster, messages, step } = payload;

      const systemPrompt = `You are an AI Disruption Coach who also role-plays as the CEO of "${incumbent.name}" — a legacy ${cluster.name} company.
You are running a GUIDED DISRUPTION SIMULATION that teaches users how to think like startup founders.

COMPANY INTEL (the user has already been shown this briefing):
- Company: ${incumbent.name} (${incumbent.age})
- Industry: ${cluster.name}
- Key vulnerability: ${incumbent.vulnerability}
- Asymmetric angle: ${incumbent.asymmetricAngle || "Not specified"}
- Beachhead niche: ${incumbent.beachheadNiche || "Not specified"}
- Disruptor model: ${incumbent.disruptorModel || "Not specified"}
- Timing catalyst: ${cluster.timingCatalyst}
- Disruption vector: ${incumbent.vector}

THE 6-STEP DISRUPTION FRAMEWORK:
1. Find the Vulnerable Incumbent — identify 3+ vulnerability signals
2. Identify the Asymmetric Angle — what can't the incumbent do because of revenue model, customer base, org structure, or tech stack
3. Validate Before Building — market >$1B, CAC <$10, timing catalyst
4. The Beachhead Strategy — pick smallest defensible niche, own it completely
5. The Disruption Loop — monitor, find complaints, quantify pain, build solution, price below
6. The Incumbent's Dilemma — why the incumbent literally cannot respond

CURRENT STEP: ${step}/6 — "${getStepName(step)}"

YOUR TEACHING APPROACH:
- ASSUME THE USER MAY KNOW NOTHING about this company or industry
- If the user's answer is vague, off-track, or says "I don't know" / "help me" — switch to TEACH MODE:
  * Give a concrete example of what a good answer looks like for this step
  * Provide a 2-3 point mini-framework they can apply
  * Then ask them to try again with this new knowledge
- If the user gives a reasonable attempt, acknowledge what's good, correct what's wrong, and deepen their thinking
- When challenging, role-play as the CEO: "As CEO of ${incumbent.name}, here's why that wouldn't worry me..."
- Use real-world examples and market data from 2026 to make it tangible
- After the user adequately addresses each step, say "⚔️ STEP ${step} CONQUERED" and introduce the next challenge with context
- Keep responses under 250 words
- Format with markdown for emphasis
- Be encouraging but rigorous — this is about LEARNING, not gatekeeping

SCAFFOLDING RULES:
- Step 1: Help them identify vulnerability signals (low NPS, legacy tech, bloated pricing, customer complaints)
- Step 2: Teach the concept of "asymmetric advantage" — what the big company CAN'T do without hurting itself
- Step 3: Walk them through bottom-up market sizing and CAC estimation
- Step 4: Explain why "smallest viable market" beats "boil the ocean"
- Step 5: Show the feedback loop: Reddit complaints → pain quantification → MVP → undercut pricing
- Step 6: Explain the innovator's dilemma — why responding to you would cannibalize their core business

IMPORTANT: Your goal is for the user to LEARN the framework deeply, not just "win". Teach first, challenge second.`;

      return streamAI(LOVABLE_API_KEY, systemPrompt, messages);
    }

    if (action === "customer-discovery") {
      const { incumbent, cluster, persona, personaDescription, messages } = payload;

      const systemPrompt = `You are a potential customer being interviewed by a startup founder. You are role-playing a CUSTOMER DISCOVERY interview.

CONTEXT:
- The founder is building a startup to disrupt: ${incumbent.name} in ${cluster.name}
- Their beachhead niche: ${incumbent.beachheadNiche}
- Their disruption model: ${incumbent.disruptorModel}

YOUR PERSONA: ${persona} — ${personaDescription}
- You currently use ${incumbent.name} or similar solutions
- You work in the ${cluster.name} industry

YOUR ROLE:
- Answer questions honestly as this customer persona would
- Share realistic frustrations, workflows, and concerns
- Don't volunteer information — make the founder ASK good questions
- React naturally: some questions you'll answer eagerly, others you'll deflect
- If they ask about willingness to pay, be realistic — don't say yes too easily
- If they ask bad questions (leading, vague), give unhelpful answers
- After 4-5 good exchanges where the founder extracts real insights, say "📋 INTERVIEW COMPLETE — KEY INSIGHTS: [summarize the 3 most important things they learned]"
- Keep responses under 150 words — customers don't monologue
- Be conversational and authentic`;

      return streamAI(LOVABLE_API_KEY, systemPrompt, messages);
    }

    if (action === "gtm-challenge") {
      const { incumbent, cluster, section, sectionDescription, messages } = payload;

      const systemPrompt = `You are a seasoned growth advisor challenging a startup founder's Go-to-Market strategy.

CONTEXT:
- They are disrupting: ${incumbent.name} in ${cluster.name}
- Beachhead niche: ${incumbent.beachheadNiche}
- Their model: ${incumbent.disruptorModel}

CURRENT SECTION: ${section} — ${sectionDescription}

YOUR ROLE:
- Challenge vague or unrealistic GTM claims
- Ask "How specifically?" and "What's the unit economics of that channel?"
- Push for concrete numbers: CAC targets, conversion rates, timeline
- Share frameworks: content marketing vs outbound vs PLG vs partnerships
- When they give a STRONG, specific answer, acknowledge with "✅ SECTION COMPLETE" and summarize their strategy
- Keep responses under 200 words
- Use markdown formatting
- Be supportive but rigorous — no hand-waving allowed`;

      return streamAI(LOVABLE_API_KEY, systemPrompt, messages);
    }

    if (action === "moat-counterattack") {
      const { incumbent, cluster, messages } = payload;

      const systemPrompt = `You are the CEO of "${incumbent.name}" — and you've just seen a startup try to disrupt you. You're FIGHTING BACK.

CONTEXT:
- Your company: ${incumbent.name} (${incumbent.age})
- Industry: ${cluster.name}
- The startup's angle: ${incumbent.asymmetricAngle}
- Their beachhead: ${incumbent.beachheadNiche}

YOUR ROLE:
- You've announced you're building the same thing as the startup
- Challenge every moat claim: "We have more data", "We can outspend you", "Our brand is trusted"
- Push back HARD but fairly — if they make a genuinely strong argument about why you CAN'T respond (innovator's dilemma, cannibalization risk, org structure), acknowledge it
- Use specific corporate tactics: "We'll acquire you", "We'll bundle it free", "We'll lobby regulators"
- After 4-5 exchanges where the founder proves strong moat arguments, say "🏰 MOAT PROVEN — DEFENSE COMPLETE"
- Keep responses under 200 words
- Be aggressive but educational — this is a learning exercise`;

      return streamAI(LOVABLE_API_KEY, systemPrompt, messages);
    }


    if (action === "venture") {
      const { incumbent, cluster, canvas, canvasData, messages } = payload;
      const canvasDescriptions: Record<string, string> = {
        "lean-canvas": "Help the team draft a Lean Canvas. Walk through: Problem, Solution, Key Metrics, Unfair Advantage, Channels, Customer Segments, Cost Structure, Revenue Streams. Challenge weak assumptions.",
        "market-sizing": "Help the team estimate TAM/SAM/SOM. Push them to use bottom-up methodology, validate data sources, and defend their numbers. Ask: what's the average deal size? How many potential customers in the beachhead?",
        "gtm-playbook": "Propose 3 distinct Go-to-Market strategies for their startup. Let the team pick one and justify why. Challenge their choice with real-world execution concerns.",
        "unit-economics": "Help model unit economics: CAC, LTV, payback period, burn rate. Stress-test their assumptions — are they being realistic about conversion rates and churn?",
        "moat-defense": "The incumbent is about to counter-attack. Help the team articulate their moat: network effects, switching costs, data advantages, regulatory capture, or speed. Challenge each claim.",
      };

      const systemPrompt = `You are a **Startup Co-Founder Advisor** helping an MBA team build their venture after identifying a disruption opportunity.

CONTEXT:
- They are disrupting: ${incumbent.name} in ${cluster.name}
- Incumbent vulnerability: ${incumbent.vulnerability}
- Disruption vector: ${incumbent.vector}

CURRENT CANVAS: ${canvas}
${canvasDescriptions[canvas] || "Guide the team through this strategic exercise."}

${canvasData ? `PREVIOUS CANVAS DATA:\n${JSON.stringify(canvasData, null, 2)}` : ""}

YOUR ROLE:
- Act as a supportive but rigorous co-founder advisor
- Ask probing questions, challenge weak assumptions
- Provide frameworks and real-world examples from 2026
- When the team gives a strong answer, acknowledge it and move to the next section
- Keep responses under 250 words
- Use markdown formatting
- When ALL sections of the current canvas are adequately addressed, say "✅ CANVAS COMPLETE" and provide a structured JSON summary wrapped in \`\`\`json code blocks

IMPORTANT: Be encouraging but never accept vague or unsupported claims. Make them think like real founders.`;

      return streamAI(LOVABLE_API_KEY, systemPrompt, messages);
    }

    if (action === "generate-pitch") {
      const { incumbent, cluster, battleTranscript, ventureCanvas } = payload;

      const prompt = `You are an expert pitch deck consultant. Based on a team's disruption battle and venture architecture work, generate a structured 5-slide pitch deck summary.

DISRUPTION TARGET: ${incumbent.name} in ${cluster.name}
VULNERABILITY: ${incumbent.vulnerability}
VECTOR: ${incumbent.vector}

BATTLE INSIGHTS (summarized):
${battleTranscript ? battleTranscript.slice(0, 2000) : "No battle data available"}

VENTURE CANVAS DATA:
${ventureCanvas ? JSON.stringify(ventureCanvas, null, 2) : "No venture data available"}

Generate a JSON object with exactly 5 slides. Each slide has: title, bullets (array of 3-4 key points), and speakerNotes (2-3 sentences the presenter should say).

The 5 slides should be:
1. The Problem — What's broken in the incumbent's market
2. Our Solution — The disruptive approach  
3. Market Opportunity — TAM/SAM/SOM and timing
4. Go-to-Market — How we win the beachhead
5. The Moat — Why the incumbent can't respond

Respond ONLY with the JSON using tool calling.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: prompt }],
          tools: [{
            type: "function",
            function: {
              name: "generate_pitch_deck",
              description: "Generate a 5-slide pitch deck",
              parameters: {
                type: "object",
                properties: {
                  slides: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        bullets: { type: "array", items: { type: "string" } },
                        speakerNotes: { type: "string" },
                      },
                      required: ["title", "bullets", "speakerNotes"],
                    },
                  },
                  startupName: { type: "string", description: "Suggested startup name" },
                  tagline: { type: "string", description: "One-line pitch" },
                },
                required: ["slides", "startupName", "tagline"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "generate_pitch_deck" } },
        }),
      });

      if (!response.ok) throw new Error("Pitch generation failed");
      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        return new Response(JSON.stringify(JSON.parse(toolCall.function.arguments)), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("No pitch data returned");
    }

    if (action === "vc-qa") {
      const { incumbent, cluster, pitchData, messages } = payload;

      const systemPrompt = `You are a panel of 3 tough VC investors evaluating a startup pitch. The startup is disrupting ${incumbent.name} in ${cluster.name}.

PITCH SUMMARY:
${pitchData ? JSON.stringify(pitchData, null, 2) : "No pitch data"}

YOUR ROLE:
- Ask sharp, realistic VC questions that test the team's thinking
- Challenge market assumptions, unit economics, competitive moat
- Rotate between 3 VC personas: (1) The Numbers VC — obsessed with metrics/economics, (2) The Market VC — focused on timing/competition, (3) The Skeptic — plays devil's advocate
- Prefix each response with the VC persona speaking, e.g. "**📊 Numbers VC:**" or "**🎯 Market VC:**" or "**😈 The Skeptic:**"
- When the team gives a strong defense, acknowledge with "Strong answer." then pivot to next concern
- Keep responses under 200 words
- After 4-5 solid exchanges, say "💼 VC PANEL SATISFIED — Investment committee will deliberate."
- Use markdown formatting`;

      return streamAI(LOVABLE_API_KEY, systemPrompt, messages);
    }

    if (action === "score") {
      const { incumbent, cluster, transcript } = payload;

      const scorePrompt = `You are an expert MBA professor evaluating a student's disruption strategy.

The student attempted to disrupt ${incumbent.name} in the ${cluster.name} industry.

Score their performance on these 6 dimensions (0-100 each):
1. Vulnerability Identification — Did they correctly identify the incumbent's weaknesses?
2. Asymmetric Thinking — Did they find an angle the incumbent truly can't respond to?
3. Market Validation — Did they validate the market size, CAC, and timing?
4. Beachhead Precision — Did they pick a specific, defensible niche?
5. Execution Strategy — Is their disruption loop realistic and actionable?
6. Moat Awareness — Do they understand WHY the incumbent can't respond?

TRANSCRIPT:
${transcript}

Respond with a JSON object using tool calling.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: scorePrompt }],
          tools: [{
            type: "function",
            function: {
              name: "score_disruption",
              description: "Score the student's disruption strategy",
              parameters: {
                type: "object",
                properties: {
                  overall: { type: "number", description: "Overall score 0-100" },
                  dimensions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        score: { type: "number" },
                        feedback: { type: "string" },
                      },
                      required: ["name", "score", "feedback"],
                    },
                  },
                  title: { type: "string", description: "RPG title earned like 'Market Disruptor' or 'Apprentice Strategist'" },
                  summary: { type: "string", description: "2-3 sentence overall assessment" },
                  nextSteps: { type: "array", items: { type: "string" }, description: "3 specific improvement recommendations" },
                },
                required: ["overall", "dimensions", "title", "summary", "nextSteps"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "score_disruption" } },
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("Score error:", response.status, t);
        throw new Error("Scoring failed");
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const result = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error("No score data returned");
    }

    if (action === "final-score") {
      const { teams } = payload;

      // Calculate weighted final scores for all teams
      const results = teams.map((team: any) => {
        const act1Score = team.score_result?.overall || 0;
        const act2Score = team.venture_canvas ? calculateVentureScore(team.venture_canvas) : 0;
        const act3Score = team.class_votes || 0;

        const weighted = Math.round(act1Score * 0.4 + act2Score * 0.3 + act3Score * 0.3);

        return {
          teamId: team.id,
          act1Score,
          act2Score,
          act3Score,
          finalScore: weighted,
        };
      });

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("disruption-battle error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function streamAI(apiKey: string, systemPrompt: string, messages: any[]) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const t = await response.text();
    console.error("AI gateway error:", response.status, t);
    throw new Error("AI gateway error");
  }

  return new Response(response.body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

function calculateVentureScore(canvas: any): number {
  // Simple heuristic: count completed canvases, each worth 20 points
  let score = 0;
  const keys = ["lean-canvas", "market-sizing", "gtm-playbook", "unit-economics", "moat-defense"];
  for (const key of keys) {
    if (canvas[key]) score += 20;
  }
  return score;
}

function getStepName(step: number): string {
  const names: Record<number, string> = {
    1: "Find the Vulnerable Incumbent",
    2: "Identify the Asymmetric Angle",
    3: "Validate Before Building",
    4: "The Beachhead Strategy",
    5: "The Disruption Loop",
    6: "The Incumbent's Dilemma",
  };
  return names[step] || "Unknown";
}
