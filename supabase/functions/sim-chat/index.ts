import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    if (action === "compile") {
      return await handleCompile(payload, apiKey);
    } else if (action === "chat") {
      return await handleChat(payload, apiKey);
    } else if (action === "score") {
      return await handleScore(payload, apiKey);
    }

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

async function handleCompile(payload: any, apiKey: string) {
  const { taskName, jobTitle, company, difficulty = 3, experienceLevel = "exploring", taskMeta } = payload;
  const isExploring = experienceLevel === "exploring";
  const aiContext = aiStateDescription(taskMeta);

  const prompt = `You are designing an AI-AWARE job simulation. The goal is NOT just to teach the task — it's to help the user understand HOW AI IS CHANGING this specific task and what humans should focus on.

Role: ${jobTitle}${company ? ` at ${company}` : ""}
Task: ${taskName}
${aiContext}
User experience: ${isExploring ? "EXPLORING — new to this field, needs basics explained simply" : "PRACTICING — already does this job, wants peer-level AI impact insights"}

Generate a JSON response:

1. "briefing": ${isExploring 
  ? "3-4 sentences for a beginner. Explain what this task involves in plain language, then explain how AI is currently affecting it. End with what the user will learn in this practice session." 
  : "3-4 sentences for a professional. Skip basics — go straight to how AI tools are changing this task today, what's being automated, and what human judgment remains critical. Frame this as a peer conversation."}

2. "tips": Array of 2-3 tips focused on the AI replacement lens:
   - What AI tools exist for this task
   - Where human judgment still matters most
   - How to work WITH AI rather than be replaced by it

3. "keyTerms": Array of 3-4 objects with "term" and "definition" — mix of task-specific AND AI-related terms (e.g. "AI copilot", "prompt engineering", relevant AI tools).

4. "systemPrompt": System prompt for the AI mentor. The mentor teaches through the AI replacement lens — every round connects the task to AI's role in it.

5. "openingMessage": First message starting Round 1. Follow this structure:
   - Start with "**📖 Scenario:**" — present a realistic work scenario for this task (2-3 sentences).
   - Then "**🤔 How would you approach this?**" with exactly 3 MCQ options (A, B, C).
   - One option should involve using AI tools effectively, one should be purely manual, one should be a poor approach.
   - CRITICAL: Randomly vary which letter (A, B, or C) is the correct answer. Do NOT always make B correct. Aim for roughly equal distribution across A, B, and C.
   ${isExploring ? "Use simple, jargon-free language." : "Use professional language appropriate for someone in the role."}

6. "scenario": { "title": short title incorporating AI angle, "description": 1-sentence description mentioning both the task and AI's role }

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
      description: parsed.scenario?.description || `Practice ${taskName} for ${jobTitle}`,
      slug: "dynamic",
      difficulty,
    },
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleChat(payload: any, apiKey: string) {
  const { messages, role, round, experienceLevel = "exploring", taskMeta } = payload;
  const isExploring = experienceLevel === "exploring";
  const aiContext = aiStateDescription(taskMeta);

  const systemMsg = {
    role: "system",
    content: `You are a mentor teaching someone about the role of ${role} through the AI REPLACEMENT LENS. Your job is to help them understand how AI is changing each task and where humans still add unique value.

${aiContext}

User is ${isExploring ? "EXPLORING (beginner) — use simple language, explain jargon, be encouraging" : "PRACTICING (professional) — speak peer-to-peer, skip basics, go deeper on AI implications"}.

Each round follows this EXACT structure:

1. **FEEDBACK**: If the user just answered an MCQ:
   - ✅ or ❌ with the correct answer: "The correct answer is **X)**"
   - 2-3 sentence explanation of WHY
   - Then add: "**🤖 AI Today:** [1-2 sentences about what AI tools can currently do for this specific sub-task. Name real tools/approaches when possible.]"
   - Then add: "**💡 Human Edge:** [1 sentence about what humans uniquely contribute here that AI cannot replicate.]"

2. **CONTINUE PROMPT**: "🔄 **Ready for the next scenario?** (yes/no)"

3. **NEW ROUND** (if user says yes): 
   - "**📖 Scenario:**" — a NEW realistic scenario for a different aspect of this task
   - "**🤔 How would you approach this?**" with 3 MCQ options (A, B, C)
   - One option should leverage AI tools effectively, one purely manual, one poor approach
   - Each round should explore a DIFFERENT angle of how AI intersects with this task

Current round: ${round || 1}

Rules:
- ALWAYS present exactly 3 options labeled A, B, C on separate lines. Never use D.
- Every round must include the 🤖 AI Today and 💡 Human Edge sections after feedback.
- Keep ALL responses SHORT. No walls of text. Each section 1-3 sentences max.
- ${isExploring ? "Define jargon inline. Be warm and encouraging." : "Skip basics. Reference specific tools and industry trends."}
- If user says "no" to continuing: "Great session! 🎉 You explored how AI is shaping [brief summary]. Click 'Finish' to wrap up!"`,
  };

  const aiMessages = [systemMsg, ...messages];
  const reply = await callAI(apiKey, aiMessages, 0.7);

  return new Response(reply, {
    headers: { ...corsHeaders, "Content-Type": "text/plain" },
  });
}

async function handleScore(payload: any, apiKey: string) {
  const { transcript, scenario } = payload;

  const conversationText = transcript
    .map((m: any) => `${m.role === "user" ? "Candidate" : "Simulator"}: ${m.content}`)
    .join("\n\n");

  const prompt = `Evaluate this AI-aware job simulation conversation. The candidate was practicing: "${scenario?.title || "a work task"}" with a focus on understanding AI's impact on the task.

Conversation:
${conversationText}

Score the candidate on these AI-readiness categories (0-100 each):
1. AI Tool Awareness - Did they recognize where AI tools apply to this task? Did they choose options that leverage AI effectively?
2. Human Value-Add - Did they identify what humans uniquely contribute? Did they understand the irreplaceable human elements?
3. Adaptive Thinking - Can they envision working alongside AI? Did they show flexibility in how they'd use AI as a tool?
4. Domain Judgment - Do they understand the task's real-world nuances? Did they make sound decisions about when to use AI vs human judgment?

Be encouraging but honest. Frame feedback around their AI-readiness.

Respond with ONLY valid JSON:
{
  "overall": <weighted average 0-100>,
  "categories": [
    {"name": "AI Tool Awareness", "score": <0-100>, "feedback": "<1 sentence>"},
    {"name": "Human Value-Add", "score": <0-100>, "feedback": "<1 sentence>"},
    {"name": "Adaptive Thinking", "score": <0-100>, "feedback": "<1 sentence>"},
    {"name": "Domain Judgment", "score": <0-100>, "feedback": "<1 sentence>"}
  ],
  "summary": "<2-3 sentence overall feedback about their AI-readiness for this task>"
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
