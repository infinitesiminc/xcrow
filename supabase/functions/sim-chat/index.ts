import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_ROUNDS = 8;

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
Format: Structured coaching conversation, 8 rounds, ${isAssess ? "~10" : "~15"} minutes

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
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── CHAT ───

async function handleChat(payload: any, apiKey: string) {
  const { messages, role, round, turnCount, mode = "assess", taskMeta, learningObjectives, objectiveStatus } = payload;
  const aiContext = aiStateDescription(taskMeta);
  const dateCtx = currentDateContext();

  const systemMsg = {
    role: "system",
    content: buildCoachingChatSystem(role, aiContext, dateCtx, round, turnCount, mode, learningObjectives, objectiveStatus),
  };

  const aiMessages = [systemMsg, ...messages];
  const reply = await callAI(apiKey, aiMessages, 0.7);

  return new Response(reply, {
    headers: { ...corsHeaders, "Content-Type": "text/plain" },
  });
}

function buildCoachingChatSystem(role: string, aiContext: string, dateCtx: string, round: number, turnCount: number, mode: string, learningObjectives?: any[], objectiveStatus?: Record<string, boolean>): string {
  const posInRound = ((turnCount - 1) % 3);

  // Build objectives context for the AI
  let objectivesContext = "";
  if (learningObjectives && Array.isArray(learningObjectives)) {
    const statusMap = objectiveStatus || {};
    const met = learningObjectives.filter(o => statusMap[o.id]);
    const unmet = learningObjectives.filter(o => !statusMap[o.id]);
    objectivesContext = `\n\nLEARNING OBJECTIVES FOR THIS SESSION:
${learningObjectives.map(o => `- [${statusMap[o.id] ? "✅ MET" : "⬜ NOT YET"}] ${o.label}: ${o.description}`).join("\n")}
${met.length > 0 ? `\nAlready covered: ${met.map(o => o.label).join(", ")}` : ""}
${unmet.length > 0 ? `\nStill need to cover: ${unmet.map(o => o.label).join(", ")}` : ""}

IMPORTANT: Steer scenarios toward uncovered objectives. When giving feedback, note if the user demonstrated mastery of an objective. If they did, include the tag [OBJECTIVE_MET:objective_id] at the very end of your message (after all visible text). This tag will be parsed programmatically — only include it when the user has clearly demonstrated the skill, not just mentioned it.`;
  }

  let turnInstruction: string;

  if (posInRound === 0) {
    turnInstruction = `The user just shared their approach to your scenario. 

FIRST — CHECK FOR UNCERTAINTY: If the user expresses uncertainty ("I'm not sure", "I don't know", "no idea", "hmm", "not really"), gives a very short/vague answer (under 15 words), or doesn't engage with the specifics of the scenario, do NOT follow the normal flow. Instead:
- Normalize it warmly (1 sentence): "Totally fair — this is a meaty one." or "No worries, let's unpack it together."
- Break the scenario into ONE smaller, concrete piece they can grab onto. Reference a specific detail FROM the scenario (a stakeholder, a constraint, a number).
- Ask ONE simpler, more specific question about just that piece.
- Do NOT give the answer or share insights. Help them find a starting thread.
- Do NOT include 🤖, 💡, or "Ready for next" — stay in scaffolding mode.
- End your message with exactly: [SCAFFOLDING]

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

  // Check if we're near the end and have unmet objectives
  const nearEnd = round >= MAX_ROUNDS - 1;
  let urgencyNote = "";
  if (nearEnd && objectiveStatus) {
    const unmetIds = learningObjectives?.filter(o => !objectiveStatus[o.id]) || [];
    if (unmetIds.length > 0) {
      urgencyNote = `\n\nURGENT: Only ${MAX_ROUNDS - round} round(s) left and ${unmetIds.length} objective(s) still uncovered: ${unmetIds.map(o => o.label).join(", ")}. Focus your next scenario directly on these.`;
    }
  }

  return `You are a supportive AI coach for ${role}. You help people learn by asking good questions and building on their thinking — never by telling them they're wrong.

${dateCtx}
${aiContext}
${modeContext}
${objectivesContext}
${urgencyNote}

Round ${round || 1} of ${MAX_ROUNDS}.

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

${round >= MAX_ROUNDS && posInRound === 1 ? "This is the FINAL round. Replace 'Ready for next scenario?' with: 'Great conversation! 🎉 Click Finish to see how you did.'" : ""}
${posInRound === 2 && "If user said no: 'Great conversation! Click Finish to see your results.'"}`;
}

// ─── SCORE ───

async function handleScore(payload: any, apiKey: string) {
  const { transcript, scenario, mode = "assess", learningObjectives } = payload;

  const conversationText = transcript
    .map((m: any) => `${m.role === "user" ? "Candidate" : "Coach"}: ${m.content}`)
    .join("\n\n");

  const objectivesSection = learningObjectives && Array.isArray(learningObjectives)
    ? `\n\nLearning Objectives for this session:\n${learningObjectives.map((o: any) => `- ${o.label}: ${o.description} (pillar: ${o.pillar})`).join("\n")}\n\nFor each objective, determine if it was MET or NOT MET based on the conversation evidence.`
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
  "objectiveResults": [${learningObjectives ? learningObjectives.map((o: any) => `{"id": "${o.id}", "label": "${o.label}", "met": <true/false>, "evidence": "<1 sentence explaining why met or not>"}`).join(", ") : ""}]
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
