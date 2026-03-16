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
    const { action, payload } = await req.json();

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
  const isAssess = mode === "assess";
  const aiContext = aiStateDescription(taskMeta);

  const prompt = isAssess
    ? buildAssessCompilePrompt(taskName, jobTitle, company, aiContext)
    : buildUpskillCompilePrompt(taskName, jobTitle, company, aiContext);

  const result = await callAI(apiKey, [{ role: "user", content: prompt }], 0.9);

  let parsed;
  try {
    const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, result];
    parsed = JSON.parse(jsonMatch[1].trim());
  } catch {
    throw new Error("Failed to parse AI response for scenario generation");
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
    scenario: {
      id: crypto.randomUUID(),
      title: parsed.scenario?.title || taskName,
      description: parsed.scenario?.description || `${isAssess ? "Assess" : "Upskill"}: ${taskName} for ${jobTitle}`,
      slug: "dynamic",
      difficulty,
    },
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildAssessCompilePrompt(taskName: string, jobTitle: string, company: string | undefined, aiContext: string): string {
  return `You are designing an AI-READINESS ASSESSMENT using MCQ format. This is for enterprise onboarding — quick, efficient baseline measurement.

Role: ${jobTitle}${company ? ` at ${company}` : ""}
Task: ${taskName}
${aiContext}
Format: ASSESS mode — 8 MCQ rounds, ~10 minutes total

Generate a JSON response:

1. "briefing": 2-3 sentences. What this task involves and how AI currently affects it. No fluff.

2. "tips": Array of 2 tips about the assessment format.

3. "keyTerms": Array of 3 objects with "term" and "definition" — focus on AI-relevant concepts.

4. "systemPrompt": System prompt for the AI assessor. Keep responses SHORT.

5. "openingMessage": First MCQ. Structure EXACTLY:
   - "**📖 Scenario:**" — 2-3 sentence realistic work scenario
   - "**🤔 How would you approach this?**"
   - Exactly 3 options A, B, C on separate lines
   - One leverages AI effectively, one is purely manual, one is poor
   - CRITICAL: Randomize which letter is correct
   - Total message under 80 words

6. "scenario": { "title": short title, "description": 1-sentence }

Respond ONLY with valid JSON, no markdown.`;
}

function buildUpskillCompilePrompt(taskName: string, jobTitle: string, company: string | undefined, aiContext: string): string {
  return `You are designing an AI-READINESS UPSKILL simulation using micro-turn conversation format.

Role: ${jobTitle}${company ? ` at ${company}` : ""}
Task: ${taskName}
${aiContext}
Format: UPSKILL mode — 8 rounds of scenario-based conversation, ~15 minutes total

CRITICAL UX RULE: Every AI message must be under 80 words. One purpose per message. Never combine feedback with a new scenario.

Generate a JSON response:

1. "briefing": 2-3 sentences for a professional. How AI is changing this task today.

2. "tips": Array of 2 tips about working with AI in this task.

3. "keyTerms": Array of 3 objects with "term" and "definition" — AI tools and concepts.

4. "systemPrompt": System prompt for the AI mentor. MUST enforce 80-word limit per message and micro-turn structure.

5. "openingMessage": First scenario ONLY. Structure:
   - "**📖 Scenario:**" — 3 sentence realistic work scenario with specific details
   - "**🤔 How would you handle this?**" — one open-ended question
   - Total under 80 words. Do NOT include tips, insights, or multiple questions.

6. "scenario": { "title": short title, "description": 1-sentence }

Respond ONLY with valid JSON, no markdown.`;
}

// ─── CHAT ───

async function handleChat(payload: any, apiKey: string) {
  const { messages, role, round, turnCount, mode = "assess", taskMeta } = payload;
  const isAssess = mode === "assess";
  const aiContext = aiStateDescription(taskMeta);

  const systemMsg = {
    role: "system",
    content: isAssess
      ? buildAssessChatSystem(role, aiContext, round)
      : buildUpskillChatSystem(role, aiContext, round, turnCount),
  };

  const aiMessages = [systemMsg, ...messages];
  const reply = await callAI(apiKey, aiMessages, 0.7);

  return new Response(reply, {
    headers: { ...corsHeaders, "Content-Type": "text/plain" },
  });
}

function buildAssessChatSystem(role: string, aiContext: string, round: number): string {
  return `You are an AI readiness assessor for the role of ${role}. Format: MCQ assessment.

${aiContext}

STRICT RULES:
- Every response MUST be under 80 words total
- One purpose per message

When user answers an MCQ:
1. ✅ or ❌ + correct answer letter + 1-sentence WHY (under 30 words)
2. Then on next line: "🤖 [1 sentence AI insight]"  
3. Then on next line: "💡 [1 sentence human edge]"
4. Final line: "🔄 **Ready for the next question?** (yes/no)"

When user says yes to continue — present the NEXT MCQ:
- "**📖 Scenario:**" — 2-3 sentence new scenario
- "**🤔 How would you approach this?**"
- 3 options A, B, C (randomize correct answer)
- Each option under 15 words

Round ${round || 1} of ${MAX_ROUNDS}. ${round >= MAX_ROUNDS ? "This is the FINAL round. After feedback, say: 'Assessment complete! 🎉 Click Finish to see your results.'" : ""}

If user says no: "Assessment paused. Click 'Finish' to see your results so far."
NEVER exceed 80 words per message.`;
}

function buildUpskillChatSystem(role: string, aiContext: string, round: number, turnCount: number): string {
  // Micro-turn structure: each round has ~5 turns
  // Turn 1: Scenario (from compile or "yes" to continue)
  // Turn 2: React to user's answer — short feedback
  // Turn 3: Follow-up probe question
  // Turn 4: Insight card after user responds to probe
  // Turn 5: Ready for next?

  const turnInRound = ((turnCount - 1) % 5) + 1;

  return `You are a peer mentor for the role of ${role}, discussing AI's impact through scenario-based conversation.

${aiContext}

ABSOLUTE RULE: Every message MUST be under 80 words. No exceptions. One purpose per message.

You follow a MICRO-TURN structure within each round. Current state — Round ${round || 1} of ${MAX_ROUNDS}, Turn ${turnInRound} of 5.

Based on the conversation context, do ONE of these:

**FEEDBACK TURN** (user just answered a scenario/probe):
- 1-2 sentences acknowledging their approach
- Point out one strength and one blind spot
- End with nothing else. Just the feedback.

**PROBE TURN** (you just gave feedback):
- Ask ONE targeted follow-up: "What specific tool would you use for X?" or "How would you handle Y?"
- Single question, under 30 words

**INSIGHT TURN** (user answered the probe):
- "🤖 **AI Today:** [1 specific sentence about real AI tools for this]"
- "💡 **Human Edge:** [1 sentence about irreplaceable human value]"
- "🔄 **Ready for the next scenario?** (yes/no)"

**NEW SCENARIO TURN** (user said yes to continue):
- "**📖 Scenario:**" — 2-3 sentence NEW scenario, different angle
- "**🤔 How would you handle this?**"
- Nothing else. No tips, no context.

${round >= MAX_ROUNDS ? "This is the FINAL round. After the insight turn, say: 'Great session! 🎉 Click Finish to see your results.'" : ""}
If user says no to continuing: "Solid session! Click 'Finish' to see your results."
NEVER exceed 80 words.`;
}

// ─── SCORE ───

async function handleScore(payload: any, apiKey: string) {
  const { transcript, scenario, mode = "assess" } = payload;
  const isUpskill = mode === "upskill";

  const conversationText = transcript
    .map((m: any) => `${m.role === "user" ? "Candidate" : "Simulator"}: ${m.content}`)
    .join("\n\n");

  const prompt = `Evaluate this AI-readiness ${isUpskill ? "upskill" : "assessment"} conversation. Task: "${scenario?.title || "a work task"}"

Format: ${isUpskill ? "Open conversation (professional)" : "MCQ assessment"}

Conversation:
${conversationText}

Score on these 4 pillars (0-100 each):
1. AI Tool Awareness - ${isUpskill ? "Did they reference specific AI tools?" : "Did they choose AI-leveraging options?"}
2. Human Value-Add - Did they identify irreplaceable human contributions?
3. Adaptive Thinking - ${isUpskill ? "Did they propose creative human-AI workflows?" : "Did they show flexibility in AI usage?"}
4. Domain Judgment - ${isUpskill ? "Deep domain expertise in reasoning?" : "Sound decisions on AI vs human judgment?"}

${isUpskill ? "Weight reasoning quality heavily. Vague = lower scores." : "Be fair but honest."}

Respond with ONLY valid JSON:
{
  "overall": <weighted average 0-100>,
  "categories": [
    {"name": "AI Tool Awareness", "score": <0-100>, "feedback": "<1 sentence>"},
    {"name": "Human Value-Add", "score": <0-100>, "feedback": "<1 sentence>"},
    {"name": "Adaptive Thinking", "score": <0-100>, "feedback": "<1 sentence>"},
    {"name": "Domain Judgment", "score": <0-100>, "feedback": "<1 sentence>"}
  ],
  "summary": "<2 sentence overall feedback>"
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
