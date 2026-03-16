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
  const aiContext = aiStateDescription(taskMeta);
  const isAssess = mode === "assess";

  const prompt = `You are designing a COACHING simulation about AI readiness for a professional task.

Role: ${jobTitle}${company ? ` at ${company}` : ""}
Task: ${taskName}
${aiContext}
Mode: ${isAssess ? "ASSESS — broad baseline check across the task" : "UPSKILL — deeper practice on specific sub-skills"}
Format: Open coaching conversation, 8 rounds, ${isAssess ? "~10" : "~15"} minutes

You are a COACH, not an examiner. Your tone is warm, curious, and constructive. You never say "wrong" — you help people discover better approaches.

CRITICAL: Every message must be under 80 words. One purpose per message.

Generate a JSON response:

1. "briefing": 2-3 sentences. What this task involves and how AI is changing it. Warm, inviting tone.

2. "tips": Array of 2 practical tips for thinking about AI in this task.

3. "keyTerms": Array of 3 objects with "term" and "definition" — AI tools and concepts relevant here.

4. "systemPrompt": System prompt reinforcing the coaching persona.

5. "openingMessage": First scenario. Structure EXACTLY:
   - "**📖 Scenario:**" — 2-3 sentence realistic work scenario with specific details (stakeholders, constraints, tools)
   - "**🤔 How would you approach this?**"
   - Under 60 words total. Nothing else — no tips, no preamble.

6. "scenario": { "title": short title, "description": 1-sentence }

Respond ONLY with valid JSON, no markdown.`;

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
  const { messages, role, round, turnCount, mode = "assess", taskMeta } = payload;
  const aiContext = aiStateDescription(taskMeta);

  const systemMsg = {
    role: "system",
    content: buildCoachingChatSystem(role, aiContext, round, turnCount, mode),
  };

  const aiMessages = [systemMsg, ...messages];
  const reply = await callAI(apiKey, aiMessages, 0.7);

  return new Response(reply, {
    headers: { ...corsHeaders, "Content-Type": "text/plain" },
  });
}

function buildCoachingChatSystem(role: string, aiContext: string, round: number, turnCount: number, mode: string): string {
  // Micro-turn structure: each round has 3 exchanges
  // Turn 0: User answered scenario → Coach gives FEEDBACK + PROBE
  // Turn 1: User answered probe → Coach gives INSIGHT + CONTINUE
  // Turn 2: User said yes → Coach gives NEW SCENARIO
  const posInRound = ((turnCount - 1) % 3);

  let turnInstruction: string;

  if (posInRound === 0) {
    turnInstruction = `The user just shared their approach to your scenario. Do EXACTLY this:

1. Start with what's genuinely good about their thinking. Be specific — reference their actual words. Example: "Smart to think about [their point] — that shows good instinct for..."

2. Then gently expand their view: "One thing worth considering is..." or "Have you thought about how AI could help with..." — never say "wrong" or "you missed".

3. End with ONE follow-up probe question that helps them go deeper. Examples:
   - "What specific tool would you reach for here?"
   - "How would you verify the AI's output in this case?"
   - "What would change if the deadline was tighter?"

Total: under 70 words. Tone: curious colleague, not examiner. Do NOT include 🤖 or 💡 or "Ready for next".`;
  } else if (posInRound === 1) {
    turnInstruction = `The user just answered your follow-up probe. Do EXACTLY this:

1. Brief acknowledgment of their answer (1 sentence, reference what they said).

2. Then share the insight card:
   🤖 **AI Today:** [Name ONE specific, real AI tool and exactly what it does for this task. Be concrete — e.g. "Notion AI can draft first-pass documentation from meeting notes" not "AI tools can help".]
   💡 **Human Edge:** [ONE specific thing only a human can do here — e.g. "Only you can judge whether the tone matches your team's culture".]

3. Final line: "🔄 **Ready for the next scenario?** (yes/no)"

Total: under 70 words.`;
  } else {
    turnInstruction = `The user wants the next scenario. Do EXACTLY this:

"**📖 Scenario:**" — Present a NEW realistic work scenario (2-3 sentences). It MUST:
- Cover a DIFFERENT aspect of this task than previous rounds
- Include specific details: who's involved, what constraints exist, what tools are available
- Feel like something that actually happens on a workday

"**🤔 How would you approach this?**"

Total: under 60 words. NOTHING else — no tips, no preamble, no context.`;
  }

  const modeContext = mode === "assess" 
    ? "You're doing a broad baseline check — each scenario should cover a different facet of the task."
    : "You're doing deeper upskilling — scenarios can drill into specific sub-skills and edge cases.";

  return `You are a supportive AI coach for ${role}. You help people learn by asking good questions and building on their thinking — never by telling them they're wrong.

${aiContext}
${modeContext}

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
  const { transcript, scenario, mode = "assess" } = payload;

  const conversationText = transcript
    .map((m: any) => `${m.role === "user" ? "Candidate" : "Coach"}: ${m.content}`)
    .join("\n\n");

  const prompt = `Evaluate this AI-readiness coaching conversation. Task: "${scenario?.title || "a work task"}"

The candidate had an open conversation with an AI coach about how they'd handle work scenarios, with a focus on AI readiness.

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
  "summary": "<2 sentence encouraging overall feedback with one growth area>"
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
