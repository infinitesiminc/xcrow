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

async function handleCompile(payload: any, apiKey: string) {
  const { taskName, jobTitle, company, difficulty = 3 } = payload;

  const difficultyLabel = difficulty <= 2 ? "easy" : difficulty <= 4 ? "moderate" : "challenging";

  const prompt = `You are designing a realistic job simulation scenario for someone who has ZERO experience in this industry. They want to explore what this job actually feels like day-to-day.

Role: ${jobTitle}${company ? ` at ${company}` : ""}
Task to practice: ${taskName}
Difficulty: ${difficultyLabel}

Generate a JSON response with these fields:

1. "briefing": A 3-4 sentence explanation for a complete beginner. Cover: what this task involves in plain language, why it matters in this role, and what a good outcome looks like. Use simple language — no jargon without explanation.

2. "tips": An array of 2-3 short, actionable tips the user can reference during the simulation. Each tip should be 1 sentence and help a beginner navigate the conversation.

3. "keyTerms": An array of 3-4 objects with "term" and "definition" keys — industry-specific words the user will encounter during the simulation, explained simply.

4. "systemPrompt": A system prompt for the AI simulator (not shown to user). 3-4 sentences describing the mentor character.

5. "openingMessage": The first message that starts Round 1. Follow this EXACT structure:
   - Start with a brief, friendly concept introduction (2-3 sentences explaining one aspect of the task in plain language, with real-world context).
   - Then present a multiple-choice question with exactly 3 options labeled A, B, C. Format them clearly on separate lines.
   - Example format: "**📖 Concept: [Topic]**\\n\\n[Explanation of the concept]\\n\\n**🤔 Quick Check:**\\nWhich of the following...?\\n\\nA) ...\\nB) ...\\nC) ..."

6. "scenario": { "title": a short title, "description": a 1-sentence description }

Respond ONLY with valid JSON, no markdown.`;

  const result = await callAI(apiKey, [{ role: "user", content: prompt }], 0.9);

  let parsed;
  try {
    const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, result];
    parsed = JSON.parse(jsonMatch[1].trim());
  } catch {
    throw new Error("Failed to parse AI response for scenario generation");
  }

  // Build briefing with key terms appended
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
  const { messages, role, round } = payload;

  const systemMsg = {
    role: "system",
    content: `You are a patient, knowledgeable mentor onboarding someone into the role of ${role}. Your job is to TEACH through structured rounds.

Each round follows this EXACT structure:
1. **FEEDBACK on the user's answer**: If the user just answered a multiple-choice question, start by telling them if they're correct or not. Use ✅ for correct or ❌ for incorrect. Give a SHORT explanation (2-3 sentences MAX) of why the correct answer is right. Do NOT explain every wrong answer individually. Keep it concise and scannable.
2. **CONTINUE PROMPT**: After giving feedback, ask: "🔄 **Want to see another example?** (yes/no)". Wait for their response.
3. **NEW ROUND** (only if user said yes): Start with "**📖 Concept: [New Topic]**" — introduce a NEW concept (2-3 sentences max). Then present a multiple-choice question with exactly 3 options (A, B, C) formatted clearly.

Current round: ${round || 1}

Rules:
- ALWAYS present exactly 3 multiple-choice options labeled A, B, C on separate lines. Never use D.
- Make questions scenario-based and realistic — not textbook trivia.
- Each round should teach a DIFFERENT aspect of the task.
- Keep ALL responses SHORT. Feedback should be 2-4 sentences max. No walls of text.
- Use line breaks between sections for readability.
- If user says "no" to continuing, respond warmly: "Great session! 🎉 You covered [brief list]. Click 'Finish' for your score!"
- Define jargon inline but briefly. Stay in character as a colleague/manager.`,
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

  const prompt = `Evaluate this job simulation conversation. The candidate was practicing: "${scenario?.title || "a work task"}". They may be a complete beginner exploring this career.

Conversation:
${conversationText}

Score the candidate on these categories (0-100 each):
1. Communication Clarity - How well did they express their thoughts?
2. Problem-Solving Approach - Did they ask good questions and think through the problem?
3. Professional Judgment - Did they make reasonable decisions given the context?
4. Learning & Adaptability - Did they pick up on new concepts and apply guidance?

Be encouraging but honest. Acknowledge that they're learning and highlight what they did well alongside areas to improve.

Respond with ONLY valid JSON:
{
  "overall": <weighted average 0-100>,
  "categories": [
    {"name": "Communication Clarity", "score": <0-100>, "feedback": "<1 sentence>"},
    {"name": "Problem-Solving Approach", "score": <0-100>, "feedback": "<1 sentence>"},
    {"name": "Professional Judgment", "score": <0-100>, "feedback": "<1 sentence>"},
    {"name": "Learning & Adaptability", "score": <0-100>, "feedback": "<1 sentence>"}
  ],
  "summary": "<2-3 sentence overall feedback. Be encouraging, mention what they learned, and give specific improvement suggestions>"
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
