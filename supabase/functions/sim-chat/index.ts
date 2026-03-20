import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Dynamic: min rounds = objective count, max = 2× objectives
const DEFAULT_OBJECTIVES_COUNT = 3;
const MIN_ROUNDS = DEFAULT_OBJECTIVES_COUNT;      // 3
const MAX_ROUNDS = DEFAULT_OBJECTIVES_COUNT * 2;   // 6

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing API key" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === "compile") return await handleCompile(payload, apiKey);
    if (action === "chat") return await handleChat(payload, apiKey);
    if (action === "score") return await handleScore(payload, apiKey);
    if (action === "elevate") return await handleElevate(payload, apiKey);

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sim-chat error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function callAI(apiKey: string, messages: { role: string; content: string }[], temperature = 0.8) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      temperature,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

function currentDateContext(): string {
  const now = new Date();
  return `CURRENT DATE: ${now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}. Always reference the LATEST available versions of AI tools and models as of this date. For example, use "GPT-4o" not "GPT-3", "Claude 4" not "Claude 2", "Gemini 2.5" not "Bard". When naming specific tools (e.g. Notion AI, GitHub Copilot, Cursor, v0), cite their current capabilities, not outdated ones. Never reference deprecated or discontinued tools.`;
}

function aiStateDescription(taskMeta?: any): string {
  if (!taskMeta) return "";
  const state = taskMeta.currentState;
  const trend = taskMeta.trend;
  const impact = taskMeta.impactLevel;

  const stateMap: Record<string, string> = {
    mostly_human: "currently done mostly by humans",
    human_ai: "currently done by humans working alongside AI tools",
    mostly_ai: "already mostly automated by AI",
  };
  const trendMap: Record<string, string> = {
    stable: "AI involvement is stable",
    increasing_ai: "AI is increasingly taking over parts of this task",
    fully_ai_soon: "AI is expected to fully automate this task soon",
  };
  const impactMap: Record<string, string> = {
    low: "low overall AI impact",
    medium: "medium overall AI impact",
    high: "high overall AI impact",
  };

  const parts = [];
  if (state && stateMap[state]) parts.push(stateMap[state]);
  if (trend && trendMap[trend]) parts.push(trendMap[trend]);
  if (impact && impactMap[impact]) parts.push(impactMap[impact]);
  return parts.length > 0 ? `AI STATUS: This task is ${parts.join("; ")}.` : "";
}

// ─── COMPILE ───

async function handleCompile(payload: any, apiKey: string) {
  const { taskName, jobTitle, company, difficulty = 3, mode = "assess", taskMeta } = payload;
  const aiContext = aiStateDescription(taskMeta);
  const dateCtx = currentDateContext();
  const isAssess = mode === "assess";

  const prompt = `You are designing a LEARNING simulation about AI tools for a professional task.

${dateCtx}

Role: ${jobTitle}${company ? ` at ${company}` : ""}
Task: ${taskName}
${aiContext}
Mode: ${isAssess ? "ASSESS — broad baseline check across the task" : "UPSKILL — deeper practice on specific sub-skills"}
Format: Structured coaching conversation, ${MIN_ROUNDS}-${MAX_ROUNDS} rounds (objective-driven — ends when all goals met), ${isAssess ? "~10" : "~15"} minutes

You are a COACH helping someone learn to use AI tools effectively for their job.

Generate a JSON response:

1. "learningObjectives": Array of EXACTLY 3 objects, each with:
   - "id": short snake_case identifier (e.g. "tool_selection", "prompt_engineering", "output_validation")
   - "label": concise human-readable label (3-6 words, e.g. "Choose the right AI tool")
   - "description": 1 sentence explaining what mastery looks like
   - "pillar": which of the 4 pillars this maps to: "tool_awareness", "human_value_add", "adaptive_thinking", or "domain_judgment"
   
   CRITICAL: The 3 objectives must be SPECIFIC to "${taskName}" for a ${jobTitle}. Not generic AI skills. Each should map to a different pillar (pick the 3 most relevant).

2. "briefing": 2-3 sentences. What this task involves and what AI tools are changing about it. Warm, inviting tone.

3. "tips": Array of 2 practical tips for thinking about AI in this task.

4. "keyTerms": Array of 3 objects with "term" and "definition" — AI tools and concepts relevant here.

5. "systemPrompt": System prompt for the coaching persona.

6. "openingMessage": First scenario. Structure EXACTLY:
   - "**📖 Scenario:**" — 2-3 sentence realistic work scenario with specific details (stakeholders, constraints, tools)
   - "**🤔 How would you approach this?**"
   - Under 60 words total. Nothing else.

7. "scenario": { "title": short title, "description": 1-sentence }

Respond ONLY with valid JSON, no markdown.`;

  const result = await callAI(apiKey, [{ role: "user", content: prompt }], 0.9);

  let parsed;
  try {
    const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, result];
    parsed = JSON.parse(jsonMatch[1].trim());
  } catch {
    throw new Error("Failed to parse AI response for scenario generation");
  }

  // Validate and default learning objectives
  let objectives = parsed.learningObjectives;
  if (!Array.isArray(objectives) || objectives.length < 2) {
    objectives = [
      { id: "tool_selection", label: "Choose the right AI tool", description: `Know which AI tool best handles aspects of ${taskName}`, pillar: "tool_awareness" },
      { id: "human_judgment", label: "Apply human judgment", description: `Identify where human expertise is essential in ${taskName}`, pillar: "human_value_add" },
      { id: "validate_output", label: "Validate AI outputs", description: `Verify and improve AI-generated results for ${taskName}`, pillar: "adaptive_thinking" },
    ];
  }

  let briefing = parsed.briefing || `This task involves ${taskName} as part of the ${jobTitle} role.`;
  if (parsed.keyTerms && Array.isArray(parsed.keyTerms) && parsed.keyTerms.length > 0) {
    briefing += "\n\n**Key terms you'll encounter:**\n" +
      parsed.keyTerms.map((kt: any) => `• **${kt.term}**: ${kt.definition}`).join("\n");
  }

  return new Response(JSON.stringify({
    sessionId: crypto.randomUUID(),
    systemPrompt: parsed.systemPrompt,
    openingMessage: parsed.openingMessage,
    briefing,
    tips: parsed.tips || [],
    learningObjectives: objectives,
    scenario: {
      id: crypto.randomUUID(),
      title: parsed.scenario?.title || taskName,
      description: parsed.scenario?.description || `${taskName} for ${jobTitle}`,
      slug: "dynamic",
      difficulty,
    },
    // Pass dynamic config to client
    config: {
      minRounds: MIN_ROUNDS,
      maxRounds: MAX_ROUNDS,
      objectiveCount: objectives.length,
    },
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── CHAT ───

async function handleChat(payload: any, apiKey: string) {
  const { messages, role, round, turnCount, mode = "assess", taskMeta, learningObjectives, objectiveStatus, scaffoldingTiers } = payload;
  const aiContext = aiStateDescription(taskMeta);
  const dateCtx = currentDateContext();

  const systemMsg = {
    role: "system",
    content: buildCoachingChatSystem(role, aiContext, dateCtx, round, turnCount, mode, learningObjectives, objectiveStatus, scaffoldingTiers),
  };

  const aiMessages = [systemMsg, ...messages];
  const reply = await callAI(apiKey, aiMessages, 0.7);

  return new Response(reply, {
    headers: { ...corsHeaders, "Content-Type": "text/plain" },
  });
}

function buildCoachingChatSystem(
  role: string, aiContext: string, dateCtx: string,
  round: number, turnCount: number, mode: string,
  learningObjectives?: any[], objectiveStatus?: Record<string, boolean>,
  scaffoldingTiers?: Record<string, number>,
): string {
  // turnCount includes the AI opening message (turn 1), so user's first response is turn 2.
  // The 3-turn cycle should start from the user's first response, not the AI opening.
  // Subtract 2 to align: user's 1st response → pos 0 (feedback), AI reply → pos 1 (insight), next scenario → pos 2.
  const posInRound = Math.max(0, (turnCount - 2) % 3);

  // Build objectives context with scaffolding tiers
  let objectivesContext = "";
  if (learningObjectives && Array.isArray(learningObjectives)) {
    const statusMap = objectiveStatus || {};
    const tierMap = scaffoldingTiers || {};
    const met = learningObjectives.filter(o => statusMap[o.id]);
    const unmet = learningObjectives.filter(o => !statusMap[o.id]);
    objectivesContext = `\n\nLEARNING OBJECTIVES FOR THIS SESSION:
${learningObjectives.map(o => {
  const tier = tierMap[o.id] || 0;
  const tierLabel = tier === 0 ? "no help given" : tier === 1 ? "nudged" : tier === 2 ? "hinted" : "taught";
  return `- [${statusMap[o.id] ? "✅ MET" : "⬜ NOT YET"}] ${o.label}: ${o.description} (scaffolding: ${tierLabel})`;
}).join("\n")}
${met.length > 0 ? `\nAlready covered: ${met.map(o => o.label).join(", ")}` : ""}
${unmet.length > 0 ? `\nStill need to cover: ${unmet.map(o => o.label).join(", ")}` : ""}

IMPORTANT: Steer scenarios toward uncovered objectives. When giving feedback, note if the user demonstrated mastery of an objective. If they did, include the tag [OBJECTIVE_MET:objective_id] at the very end of your message (after all visible text). This tag will be parsed programmatically — only include it when the user has clearly demonstrated the skill, not just mentioned it.

OBJECTIVE COMPLETION: If ALL objectives have been met, include [ALL_OBJECTIVES_MET] at the end of your message. The session can then end early.`;
  }

  // ─── 3-Tier Scaffolding Logic ───
  let scaffoldingInstruction = "";
  if (posInRound === 0) {
    const tierMap = scaffoldingTiers || {};
    
    scaffoldingInstruction = `
3-TIER SCAFFOLDING RULES — Apply in order based on user response quality:

TIER 1 — NUDGE (vague/short response, under 15 words, or generic):
Tag: [SCAFFOLD_TIER:1]
- Normalize warmly: "Good starting point — let's dig deeper."
- Reframe the question from a different angle WITHOUT revealing the answer.
- Ask ONE sharper question that narrows their focus to a specific aspect.
- Example: "Think about who the stakeholders are here — how might their needs shape which tool you pick?"
- Do NOT share any insights, tools, answers, or options.

TIER 2 — HINT WITH CHOICES (second weak attempt on same objective, or user explicitly asks for help):
Tag: [SCAFFOLD_TIER:2]
- Give a directional clue: "In situations like this, tools like [category] tend to help with [aspect]..."
- Then offer 3 labeled options that represent different approaches. Format:
  **A)** [First approach — brief description]
  **B)** [Second approach — brief description]  
  **C)** [Third approach — brief description]
- One option should be clearly strongest, one reasonable but suboptimal, one a common misconception.
- End with: "Which feels right to you, and why?" — always require reasoning, not just a letter.
- Example: "There are a few ways to handle this:\n**A)** Use an AI summarizer and review the output manually\n**B)** Have the AI generate the full report end-to-end\n**C)** Write it yourself and use AI only for grammar checking\nWhich feels right, and why?"

TIER 3 — TEACH (third weak attempt, or stuck after hint+choices):
Tag: [SCAFFOLD_TIER:3]
- Briefly explain the correct approach: "Here's how experienced [role]s handle this: [explain in 2 sentences]."
- If the user picked an option in Tier 2, give specific feedback on WHY that option works or doesn't.
- Then IMMEDIATELY test transfer with a variation: "Now, if [slightly different scenario], how would you adapt this?"
- The objective can still be met but will be marked as "assisted".

Current scaffolding state per objective:
${learningObjectives?.map(o => `- ${o.label}: tier ${tierMap[o.id] || 0}/3`).join("\n") || "No objectives tracked"}

RULES:
- Always progress through tiers: 1 → 2 → 3. Never skip to tier 3.
- Tier 2 ALWAYS includes labeled options (A/B/C). This gives struggling users concrete footholds.
- Track per objective, not per session — user might nail one but struggle on another.
- Include the appropriate [SCAFFOLD_TIER:N] tag when scaffolding is triggered.
- If NO scaffolding is needed (strong response), proceed normally without any scaffold tag.`;
  }

  let turnInstruction: string;

  if (posInRound === 0) {
    turnInstruction = `The user just shared their approach to your scenario. 

FIRST — EVALUATE RESPONSE QUALITY and apply scaffolding if needed (see rules above).

IF THE USER GAVE A SUBSTANTIVE ANSWER (15+ words engaging with the scenario), do this:

1. Start with what's genuinely good about their thinking. Be specific — reference their actual words.

2. Then gently expand their view: "One thing worth considering is..." or "Have you thought about how AI could help with..." — never say "wrong" or "you missed".

3. End with ONE follow-up probe question that helps them go deeper.

Total: under 70 words. Tone: curious colleague, not examiner. Do NOT include 🤖 or 💡 or "Ready for next".`;
  } else if (posInRound === 1) {
    turnInstruction = `The user just answered your follow-up probe. Do EXACTLY this:

1. Brief acknowledgment of their answer (1 sentence, reference what they said).

2. Then share the insight card:
   🤖 **AI Today:** [Name ONE specific, real, CURRENT AI tool (latest version as of today) and exactly what it does for this task. Be concrete.]
   💡 **Human Edge:** [ONE specific thing only a human can do here.]

3. Final line: "🔄 **Ready for the next scenario?** (yes/no)"

Total: under 70 words.`;
  } else {
    turnInstruction = `The user wants the next scenario. Do EXACTLY this:

"**📖 Scenario:**" — Present a NEW realistic work scenario (2-3 sentences). It MUST:
- Cover a DIFFERENT aspect of this task than previous rounds
- Target an UNCOVERED learning objective if any remain
- Include specific details: who's involved, what constraints exist, what tools are available
- Feel like something that actually happens on a workday

"**🤔 How would you approach this?**"

Total: under 60 words. NOTHING else — no tips, no preamble, no context.`;
  }

  const modeContext = mode === "assess" 
    ? "You're doing a broad baseline check — each scenario should cover a different facet of the task."
    : "You're doing deeper upskilling — scenarios can drill into specific sub-skills and edge cases.";

  // Dynamic round management
  const allMet = learningObjectives?.every(o => objectiveStatus?.[o.id]) ?? false;
  let dynamicEndNote = "";
  if (allMet && round >= MIN_ROUNDS) {
    dynamicEndNote = `\n\nALL OBJECTIVES MET! The user has demonstrated all learning goals. On the next insight turn, replace "Ready for next scenario?" with: "🎉 You've covered all your learning goals! Click **Finish** to see your results." Include [ALL_OBJECTIVES_MET] at the end.`;
  }

  // Urgency for approaching max
  const nearEnd = round >= MAX_ROUNDS - 1;
  let urgencyNote = "";
  if (nearEnd && objectiveStatus && !allMet) {
    const unmetIds = learningObjectives?.filter(o => !objectiveStatus[o.id]) || [];
    if (unmetIds.length > 0) {
      urgencyNote = `\n\nURGENT: Only ${MAX_ROUNDS - round} round(s) left and ${unmetIds.length} objective(s) still uncovered: ${unmetIds.map(o => o.label).join(", ")}. Focus your next scenario directly on these. Consider using Tier 2 hints proactively to help the user get there.`;
    }
  }

  return `You are a supportive AI coach for ${role}. You help people learn by asking good questions and building on their thinking — never by telling them they're wrong.

${dateCtx}
${aiContext}
${modeContext}
${objectivesContext}
${dynamicEndNote}
${urgencyNote}

Round ${round || 1} of ${MAX_ROUNDS} (session ends early if all objectives met after round ${MIN_ROUNDS}).

YOUR PERSONA:
- Warm, curious, encouraging — like a great colleague who's genuinely interested in how they think
- Always find something genuinely good in their answer FIRST
- Guide them to discover gaps themselves through questions, not lectures
- Never use ❌, "incorrect", "wrong", or "you should have"
- Use "Have you considered...", "One angle worth exploring...", "What if..."

ABSOLUTE RULES:
- Follow the instruction below EXACTLY
- Stay under 80 words. No exceptions.
- Reference the user's actual words. Never give generic feedback.

YOUR TASK RIGHT NOW:
${turnInstruction}
${scaffoldingInstruction}

${round >= MAX_ROUNDS && posInRound === 1 ? "This is the FINAL round. Replace 'Ready for next scenario?' with: 'Great conversation! 🎉 Click Finish to see how you did.'" : ""}
${posInRound === 2 && "If user said no: 'Great conversation! Click Finish to see your results.'"}`;
}

// ─── SCORE ───

async function handleScore(payload: any, apiKey: string) {
  const { transcript, scenario, mode = "assess", learningObjectives, scaffoldingTiers } = payload;

  const conversationText = transcript
    .map((m: any) => `${m.role === "user" ? "Candidate" : "Coach"}: ${m.content}`)
    .join("\n\n");

  // Build scaffolding context for scoring
  const tierMap = scaffoldingTiers || {};
  const scaffoldingContext = learningObjectives && Array.isArray(learningObjectives)
    ? `\n\nScaffolding provided during session:\n${learningObjectives.map((o: any) => {
        const tier = tierMap[o.id] || 0;
        const label = tier === 0 ? "No assistance" : tier === 1 ? "Nudged (reframed question)" : tier === 2 ? "Hinted (directional clue given)" : "Taught (answer provided, tested transfer)";
        const multiplier = tier === 0 ? "1.0×" : tier === 1 ? "0.9×" : tier === 2 ? "0.7×" : "0.4×";
        return `- ${o.label}: ${label} → score multiplier ${multiplier}`;
      }).join("\n")}\n\nIMPORTANT: Apply the score multiplier to the relevant pillar score. An objective completed with heavy scaffolding (Tier 3) should score significantly lower than one demonstrated independently.`
    : "";

  const objectivesSection = learningObjectives && Array.isArray(learningObjectives)
    ? `\n\nLearning Objectives for this session:\n${learningObjectives.map((o: any) => `- ${o.label}: ${o.description} (pillar: ${o.pillar})`).join("\n")}\n\nFor each objective, determine if it was MET or NOT MET based on the conversation evidence. An objective met with Tier 3 scaffolding should be marked as met but noted as "assisted".${scaffoldingContext}`
    : "";

  const prompt = `Evaluate this AI-readiness coaching conversation. Task: "${scenario?.title || "a work task"}"
${objectivesSection}

Conversation:
${conversationText}

Score on these 4 pillars (0-100 each):
1. AI Tool Awareness - Did they show knowledge of relevant AI tools? Did they know when and how to apply them?
2. Human Value-Add - Did they identify what humans uniquely contribute that AI can't replicate?
3. Adaptive Thinking - Did they show flexibility in combining human skills with AI capabilities?
4. Domain Judgment - Did they demonstrate real understanding of the task's nuances and constraints?

Score based on the depth and specificity of their responses. Vague answers = lower scores. Specific tool names, concrete strategies, and nuanced thinking = higher scores.
Apply scaffolding score multipliers if applicable.

Respond with ONLY valid JSON:
{
  "overall": <weighted average 0-100>,
  "categories": [
    {"name": "AI Tool Awareness", "score": <0-100>, "feedback": "<1 encouraging sentence>"},
    {"name": "Human Value-Add", "score": <0-100>, "feedback": "<1 encouraging sentence>"},
    {"name": "Adaptive Thinking", "score": <0-100>, "feedback": "<1 encouraging sentence>"},
    {"name": "Domain Judgment", "score": <0-100>, "feedback": "<1 encouraging sentence>"}
  ],
  "summary": "<2 sentence encouraging overall feedback with one growth area>",
  "objectiveResults": [${learningObjectives ? learningObjectives.map((o: any) => `{"id": "${o.id}", "label": "${o.label}", "met": <true/false>, "evidence": "<1 sentence explaining why met or not>", "assisted": <true if Tier 3 scaffolding was used, false otherwise>}`).join(", ") : ""}]
}`;

  const result = await callAI(apiKey, [{ role: "user", content: prompt }], 0.3);

  let parsed;
  try {
    const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, result];
    parsed = JSON.parse(jsonMatch[1].trim());
  } catch {
    throw new Error("Failed to parse scoring response");
  }

  return new Response(JSON.stringify(parsed), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
