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

  const prompt = `You are designing a realistic job simulation scenario. Create a practice scenario for someone preparing for this role:

Role: ${jobTitle}${company ? ` at ${company}` : ""}
Task to practice: ${taskName}
Difficulty: ${difficultyLabel}

Generate a JSON response with:
1. "systemPrompt": A detailed system prompt for the AI interviewer/simulator that will roleplay as a colleague, manager, or stakeholder presenting a realistic work scenario related to the task. The simulator should ask follow-up questions, provide context when asked, and behave like a real person in a workplace setting. Keep it to 3-4 sentences.
2. "openingMessage": The first message from the simulator that sets up the scenario and asks the candidate to respond. Make it feel like a real workplace conversation. 2-3 sentences max.
3. "scenario": { "title": a short title, "description": a 1-sentence description }

Respond ONLY with valid JSON, no markdown.`;

  const result = await callAI(apiKey, [{ role: "user", content: prompt }], 0.9);

  let parsed;
  try {
    // Try to extract JSON from possible markdown code blocks
    const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, result];
    parsed = JSON.parse(jsonMatch[1].trim());
  } catch {
    throw new Error("Failed to parse AI response for scenario generation");
  }

  return new Response(JSON.stringify({
    sessionId: crypto.randomUUID(),
    systemPrompt: parsed.systemPrompt,
    openingMessage: parsed.openingMessage,
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
  const { messages, role, taskName } = payload;

  const systemMsg = {
    role: "system",
    content: `You are simulating a realistic workplace conversation for someone practicing the role of ${role}. Stay in character as a colleague/manager. Ask probing follow-up questions. Be realistic and professional. Keep responses concise (2-4 sentences). Don't break character or mention this is a simulation.`,
  };

  const aiMessages = [systemMsg, ...messages];
  const reply = await callAI(apiKey, aiMessages, 0.8);

  return new Response(reply, {
    headers: { ...corsHeaders, "Content-Type": "text/plain" },
  });
}

async function handleScore(payload: any, apiKey: string) {
  const { transcript, scenario } = payload;

  const conversationText = transcript
    .map((m: any) => `${m.role === "user" ? "Candidate" : "Simulator"}: ${m.content}`)
    .join("\n\n");

  const prompt = `Evaluate this job simulation conversation. The candidate was practicing: "${scenario?.title || "a work task"}".

Conversation:
${conversationText}

Score the candidate on these categories (0-100 each):
1. Communication Clarity
2. Problem-Solving Approach  
3. Professional Judgment
4. Domain Knowledge

Respond with ONLY valid JSON:
{
  "overall": <weighted average 0-100>,
  "categories": [
    {"name": "Communication Clarity", "score": <0-100>, "feedback": "<1 sentence>"},
    {"name": "Problem-Solving Approach", "score": <0-100>, "feedback": "<1 sentence>"},
    {"name": "Professional Judgment", "score": <0-100>, "feedback": "<1 sentence>"},
    {"name": "Domain Knowledge", "score": <0-100>, "feedback": "<1 sentence>"}
  ],
  "summary": "<2-3 sentence overall feedback with specific improvement suggestions>"
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
