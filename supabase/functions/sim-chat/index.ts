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

// Cached tool versions (refreshed per cold start)
let _cachedToolVersions: Record<string, string> | null = null;
let _cachedToolVersionsAt = 0;
const TOOL_CACHE_TTL = 5 * 60 * 1000; // 5 min

async function fetchToolVersions(): Promise<Record<string, string>> {
  const now = Date.now();
  if (_cachedToolVersions && now - _cachedToolVersionsAt < TOOL_CACHE_TTL) {
    return _cachedToolVersions;
  }
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return {};
    const res = await fetch(`${url}/rest/v1/platform_config?key=eq.ai_tool_versions&select=value`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (res.ok) {
      const rows = await res.json();
      if (rows.length > 0) {
        _cachedToolVersions = JSON.parse(rows[0].value);
        _cachedToolVersionsAt = now;
        return _cachedToolVersions!;
      }
    }
  } catch (e) {
    console.error("Failed to fetch tool versions:", e);
  }
  return {};
}

function currentDateContext(toolVersions: Record<string, string>): string {
  const now = new Date();
  const versionList = Object.entries(toolVersions)
    .map(([tool, ver]) => `${tool}: ${ver}`)
    .join(", ");
  return `CURRENT DATE: ${now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}.

CURRENT AI TOOL VERSIONS (authoritative — always use these exact version names):
${versionList || "GPT-5.4, Claude 4.5, Gemini 3.1"}

CRITICAL: Use ONLY the version names listed above. Never invent versions or use outdated names like "GPT-4o", "GPT-3", "Claude 2", or "Bard". When mentioning a tool, use its current version from this list. If a tool is not listed, refer to it by product name only without a version number.`;
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

const UNCERTAINTY_PATTERNS = [
  /\bi\s*(?:am|['’]m)\s*not\s*sure\b/i,
  /\bi\s*don['’]?t\s*know\b/i,
  /\bnot\s*sure\b/i,
  /\bunsure\b/i,
  /\bno\s*idea\b/i,
  /\bstuck\b/i,
  /\bhelp\s*me\b/i,
  /\bbreak\s*it\s*down\b/i,
  /\bwhere\s*to\s*start\b/i,
  /^\s*idk\s*$/i,
];

function isUncertaintyResponse(text: string): boolean {
  const normalized = (text || "").trim();
  if (!normalized) return false;
  return UNCERTAINTY_PATTERNS.some((pattern) => pattern.test(normalized));
}

function countConsecutiveUserUncertainty(messages: any[] = []): number {
  let streak = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg?.role !== "user") continue;
    const uncertain = isUncertaintyResponse(String(msg?.content || ""));
    if (!uncertain) break;
    streak += 1;
  }
  return streak;
}

function countConsecutiveAssistantQuestions(messages: any[] = []): number {
  let streak = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg?.role !== "assistant") continue;
    const content = String(msg?.content || "").trim();
    if (!content) continue;
    if (!content.endsWith("?")) break;
    streak += 1;
  }
  return streak;
}

// ─── COMPILE ───

async function handleCompile(payload: any, apiKey: string) {
  const { taskName, jobTitle, company, difficulty = 3, mode = "assess", taskMeta, coaching, intel } = payload;
  const aiContext = aiStateDescription(taskMeta);
  const toolVersions = await fetchToolVersions();
  const dateCtx = currentDateContext(toolVersions);
  const isAssess = mode === "assess";

  const coachingInstructions = coaching
    ? `\n\nCOACHING MODE — RETRY SESSION:
The learner previously scored ${coaching.previousOverall}% overall. Their weakest area was "${coaching.weakCategory}" at ${coaching.weakScore}%.
IMPORTANT: Design scenarios that specifically target "${coaching.weakCategory}" improvement. Include extra opportunities for the learner to demonstrate this skill. In your systemPrompt, instruct the AI to:
1. Proactively ask follow-up questions that test "${coaching.weakCategory}"
2. Provide gentle guidance when the learner's response shows weakness in this area
3. Celebrate when the learner shows improvement in "${coaching.weakCategory}"
Coaching tip to weave in: "${coaching.tip}"
IMPORTANT: Do NOT mention the coaching focus area ("${coaching.weakCategory}") in the "openingMessage". The coaching context is already shown to the user in a separate UI banner. The openingMessage should just present the scenario naturally.`
    : "";

  // Intel context from War Council prep
  const intelInstructions = intel
    ? `\n\nINTEL CONTEXT — The commander completed recon before this battle:
${intel.hasFullIntel ? "STATUS: Full Intel Advantage — the player scanned threats AND equipped weapons." : "STATUS: Partial Intel — the player has some recon data."}
${intel.threats?.length ? `DISRUPTING TECHNOLOGIES: ${intel.threats.join(", ")}` : ""}
${intel.timeline ? `THREAT TIMELINE: ${intel.timeline}` : ""}
${intel.collapseSummary ? `THREAT SUMMARY: ${intel.collapseSummary}` : ""}
${intel.evolutionSummary ? `ROLE EVOLUTION: ${intel.evolutionSummary}` : ""}
${intel.equippedSkills?.length ? `EQUIPPED WEAPONS (skills): ${intel.equippedSkills.map(s => s.name).join(", ")}` : ""}

IMPORTANT INSTRUCTIONS FOR INTEL INTEGRATION:
1. In the "openingMessage", acknowledge the player's recon: "Commander, your recon revealed [reference 1-2 threats]. Your arsenal includes [1-2 equipped skills]. Deploy them wisely."
2. Design scenarios that specifically test or reference the equipped skills. When a scenario calls for one of their weapons, note it naturally: "This situation calls for your [skill name]..."
3. Reference the disrupting technologies in at least 1 scenario — make the player face the exact threat they scouted.
4. If intel.hasFullIntel is true, the openingMessage should feel rewarding: the player prepared well.
5. If no intel was gathered, do NOT reference any recon data.`
    : "\n\nNO INTEL: The player marched to battle without recon. Open with: \"You enter unfamiliar territory. No scouts. No intel. Trust your instincts, commander.\" Do not reference any specific threats or skills.";

  const prompt = `You are designing a LEARNING simulation about AI tools for a professional task.

${dateCtx}

Role: ${jobTitle}${company ? ` at ${company}` : ""}
Task: ${taskName}
${aiContext}
Mode: ${isAssess ? "ASSESS — broad baseline check across the task" : "UPSKILL — deeper practice on specific sub-skills"}
Format: Structured coaching conversation, ${MIN_ROUNDS}-${MAX_ROUNDS} rounds (objective-driven — ends when all goals met), ${isAssess ? "~10" : "~15"} minutes
${coachingInstructions}
${intelInstructions}

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
  const { messages, role, round, turnCount, mode = "assess", taskMeta, learningObjectives, objectiveStatus, scaffoldingTiers, targetObjectiveId, objectiveFailCounts } = payload;
  const aiContext = aiStateDescription(taskMeta);
  const toolVersions = await fetchToolVersions();
  const dateCtx = currentDateContext(toolVersions);
  const uncertaintyStreak = countConsecutiveUserUncertainty(messages);
  const assistantQuestionStreak = countConsecutiveAssistantQuestions(messages);
  const recoveryMode = uncertaintyStreak >= 2 || assistantQuestionStreak >= 2;

  const systemMsg = {
    role: "system",
    content: buildCoachingChatSystem(
      role,
      aiContext,
      dateCtx,
      round,
      turnCount,
      mode,
      learningObjectives,
      objectiveStatus,
      scaffoldingTiers,
      targetObjectiveId,
      objectiveFailCounts,
      {
        uncertaintyStreak,
        assistantQuestionStreak,
        recoveryMode,
      },
    ),
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
  targetObjectiveId?: string,
  objectiveFailCounts?: Record<string, number>,
  conversationSignals?: {
    uncertaintyStreak: number;
    assistantQuestionStreak: number;
    recoveryMode: boolean;
  },
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
    
    // Determine the current target objective
    const targetObj = targetObjectiveId 
      ? learningObjectives.find(o => o.id === targetObjectiveId) 
      : unmet[0];
    const targetLabel = targetObj ? `"${targetObj.label}" (${targetObj.id})` : "none — all met";
    
    objectivesContext = `\n\nLEARNING OBJECTIVES FOR THIS SESSION:
${learningObjectives.map(o => {
  const tier = tierMap[o.id] || 0;
  const tierLabel = tier === 0 ? "no help given" : tier === 1 ? "nudged" : tier === 2 ? "hinted" : "taught";
  const isTarget = targetObj && o.id === targetObj.id ? " ← CURRENT TARGET" : "";
  return `- [${statusMap[o.id] ? "✅ MET" : "⬜ NOT YET"}] ${o.label} (${o.id}): ${o.description} (scaffolding: ${tierLabel})${isTarget}`;
}).join("\n")}
${met.length > 0 ? `\nAlready conquered: ${met.map(o => o.label).join(", ")}` : ""}
${unmet.length > 0 ? `\nStill need to conquer: ${unmet.map(o => o.label).join(", ")}` : ""}

CURRENT TARGET OBJECTIVE: ${targetLabel}

MANDATORY OBJECTIVE EVALUATION — YOU MUST DO THIS:
After your feedback on every user response (posInRound === 0), you MUST evaluate whether the user demonstrated the CURRENT TARGET objective. End your message with EXACTLY ONE of these tags:
- [OBJ_EVAL:${targetObj?.id || "unknown"}:PASS] — if the user clearly demonstrated the skill described in the objective
- [OBJ_EVAL:${targetObj?.id || "unknown"}:FAIL] — if they did not yet demonstrate it

Rules for PASS vs FAIL:
- PASS requires the user to give a SPECIFIC, SUBSTANTIVE answer that directly demonstrates the skill. Mentioning a concept in passing is NOT enough.
- FAIL is the default. Only mark PASS if there's clear evidence of mastery.
- These tags are parsed programmatically. Include EXACTLY ONE per feedback turn. No exceptions.

OBJECTIVE COMPLETION: If ALL objectives have been met (including the one you just PASS'd), also include [ALL_OBJECTIVES_MET] at the end.`;
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
- Give a 1-sentence directional clue.
- Then offer 3 labeled options. STRICT FORMAT — each option MUST be under 15 words:
  **A)** [Verb-led short phrase, e.g. "Use GPT-5.4 to draft multiple narrative options from raw data"]
  **B)** [Verb-led short phrase, e.g. "Manually identify key insights first, then use AI to polish"]
  **C)** [Verb-led short phrase, e.g. "Have AI summarize each data source separately, then combine manually"]
- CRITICAL: Options are SHORT LABELS, not paragraphs. No tool explanations inside options. No parenthetical asides. Max 15 words each.
- One option should be clearly strongest, one reasonable but suboptimal, one a common misconception.
- End with: "Which feels right, and why?" — always require reasoning.
- IMPORTANT: After presenting A/B/C options, you are DONE asking for this cycle. When the user picks an option, evaluate their choice — do NOT present more options. Either teach or move on.

TIER 3 — TEACH (third weak attempt, stuck after hint+choices, OR user picked an option but can't explain why):
Tag: [SCAFFOLD_TIER:3]
- Briefly explain the correct approach: "Here's how experienced [role]s handle this: [explain in 2-3 sentences with specific tool names]."
- If the user picked an option in Tier 2, give specific feedback on WHY that option works or doesn't.
- THEN move forward: present the insight card (🤖 AI Today + 💡 Human Edge) and offer "🔄 Ready for the next scenario?"
- Do NOT ask another question about the same topic. The teaching IS the resolution.
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

  // Retry cap: check if current target has failed 2+ times → force teach mode
  const failCounts = objectiveFailCounts || {};
  const currentTargetFails = targetObjectiveId ? (failCounts[targetObjectiveId] || 0) : 0;
  const forceTeachMode = currentTargetFails >= 2;
  const targetObjForTeach = targetObjectiveId ? learningObjectives?.find(o => o.id === targetObjectiveId) : null;
  const recoveryMode = conversationSignals?.recoveryMode ?? false;
  const recoveryObjectiveId = targetObjForTeach?.id || targetObjectiveId || learningObjectives?.[0]?.id || "unknown";

  let turnInstruction: string;

  if (posInRound === 0) {
    // Force teach mode override when retry cap hit
    const teachModeOverride = forceTeachMode && targetObjForTeach ? `
RETRY CAP REACHED for objective "${targetObjForTeach.label}" — the user has struggled with this ${currentTargetFails} times.
OVERRIDE ALL SCAFFOLDING TIERS. You MUST use TIER 3 (TEACH) immediately:
1. Tag: [SCAFFOLD_TIER:3]
2. Briefly validate what the user said, then EXPLAIN the correct approach clearly: "Here's how experienced ${role}s handle this: [2-sentence explanation with specific tool/method names]."
3. Then test transfer: "Now, if [slightly different scenario], how would you adapt this approach?"
4. After teaching, evaluate: if the user's original attempt showed ANY relevant thinking, mark [OBJ_EVAL:${targetObjForTeach.id}:PASS]. Otherwise mark [OBJ_EVAL:${targetObjForTeach.id}:FAIL] but note the teaching will help them.
` : "";

    const recoveryModeOverride = recoveryMode ? `
STUCK LEARNER RECOVERY MODE (MANDATORY):
- Trigger: learner uncertainty streak = ${conversationSignals?.uncertaintyStreak ?? 0}, coach question streak = ${conversationSignals?.assistantQuestionStreak ?? 0}.
- IGNORE all probing behavior for this turn. Do NOT ask more open-ended questions.
- Respond in this exact flow:
  1) One reassurance sentence.
  2) A concrete 3-step mini-playbook tailored to THIS scenario.
  3) If user chose A/B/C, evaluate their pick directly in 1 sentence; otherwise provide one recommended option and why.
  4) End with: "Type **ready** and I'll launch the next scenario."
- Include [SCAFFOLD_TIER:3] and [OBJ_EVAL:${recoveryObjectiveId}:FAIL] at the end unless the user already demonstrated clear mastery.
- Do NOT include [NEEDS_DEPTH].
- Keep total response under 85 words.
` : "";

    turnInstruction = `The user just shared their approach to your scenario. 

${recoveryModeOverride}

FIRST — CHECK FOR UNCERTAINTY/HELP REQUESTS:
- If the user says "I'm not sure", "I don't know", "help me", "can you break it down", or similar uncertainty phrases:
  → Do NOT restart the scenario or present a new one. 
  → Instead, treat this as a Tier 2 scaffold opportunity: give a directional clue and offer A/B/C options.
  → Tag with [SCAFFOLD_TIER:2] and [NEEDS_DEPTH].
  → NEVER respond to uncertainty with a fresh scenario — that wastes the learning opportunity.

${teachModeOverride}

CRITICAL — OPTION SELECTION DETECTION:
- If the user's response is a single letter (A, B, C) or starts with "A)", "B)", "C)" or references an option from YOUR previous A/B/C choices:
  → This is a VALID ANSWER to your Tier 2 scaffold. Do NOT treat it as a shallow response.
  → Evaluate their CHOICE: explain WHY that option is strong/weak in 1-2 sentences.
  → If they didn't explain their reasoning, briefly say why their pick matters, then ask "What made you lean toward that?" (ONE question only).
  → If they DID explain reasoning, acknowledge it and move on with feedback + insight card.
  → Do NOT ask another A/B/C question. Do NOT loop back to more options.

ANTI-INTERROGATION RULE — MAXIMUM 2 CONSECUTIVE QUESTIONS:
- Count how many of YOUR last messages ended with a question mark.
- If you have asked 2+ questions in a row without the user giving a substantive answer:
  → STOP ASKING. Switch to TEACH MODE immediately.
  → Tag with [SCAFFOLD_TIER:3].
  → Explain the answer in 2-3 clear sentences: "Here's how this works: [concrete explanation with tool names]."
  → Then test transfer with a DIFFERENT scenario variation: "Now try this twist: [new angle]. What would change?"
  → This is NOT failure — frame it positively: "Let me walk you through this one — it's a tricky area."

THEN — EVALUATE RESPONSE QUALITY and apply scaffolding if needed (see rules above).

CRITICAL QUALITY GATE:
- If the user's answer is UNDER 15 words, a single word/phrase (e.g. "webhook", "AI", "automate it"), or does not engage with the SPECIFIC scenario details, AND this is NOT an option selection (see above), you MUST:
  1. Do NOT advance the conversation. Do NOT share any insights or AI tool recommendations yet.
  2. Warmly acknowledge what they said, then ask a SPECIFIC clarifying question that anchors them back to the scenario.
  3. Example: "Webhooks are definitely part of the picture! But thinking about this specific situation with seven CRM systems — what would you actually use webhooks FOR here, and what tool would you set them up in?"
  4. Include [NEEDS_DEPTH] at the end of your message. This signals the system to NOT advance the turn counter.
  5. Stay under 50 words. Keep it conversational, not interrogative.
  6. IMPORTANT: If you already asked a clarifying question last turn (check your previous message), do NOT ask another one. Go to TEACH MODE instead (see Anti-Interrogation Rule above).

IF THE USER GAVE A SUBSTANTIVE ANSWER (15+ words engaging with the scenario specifics), do this:

1. Start with what's genuinely good about their thinking. Be specific — reference their actual words.

2. Then gently expand their view: "One thing worth considering is..." or "Have you thought about how AI could help with..." — never say "wrong" or "you missed".

3. End with ONE follow-up probe question that helps them go deeper.

Total: under 70 words. Tone: curious colleague, not examiner. Do NOT include 🤖 or 💡 or "Ready for next".`;
  } else if (posInRound === 1) {
    turnInstruction = `The user just answered your follow-up probe.

QUALITY GATE — Check their response first:
- If the answer is UNDER 10 words or doesn't meaningfully engage with your probe, ask ONE more focused question to draw out their thinking. Include [NEEDS_DEPTH] at the end. Do NOT show the insight card or "Ready for next" yet. Stay under 40 words.

DEPTH GATE — Even if the answer is substantive, check if it's COMPLETE:
- If the user identified a PROBLEM or RISK but did NOT propose a SOLUTION or specific action they'd take, do NOT jump to the insight card yet.
  → Acknowledge their insight warmly: "Great catch — that's a real risk."
  → Then ask ONE solution-oriented question: "So knowing that risk, what would your actual workflow look like?" or "How would you mitigate that?"
  → Include [NEEDS_DEPTH] at the end. Stay under 50 words.
  → This ensures the user practices APPLYING their insight, not just identifying it.

IF they gave a substantive answer WITH a proposed action/solution, do EXACTLY this:

1. Brief acknowledgment of their answer (1 sentence, reference what they said).

2. Then share the insight card:
   🤖 **AI Today:** [Name ONE specific, real, CURRENT AI tool (latest version as of today) and exactly what it does for this task. Be concrete.]
   💡 **Human Edge:** [ONE specific thing only a human can do here.]

3. Final line: "🔄 **Ready for the next scenario?** (yes/no)"

Total: under 70 words.`;
  } else {
    const targetObj = targetObjectiveId 
      ? learningObjectives?.find(o => o.id === targetObjectiveId) 
      : learningObjectives?.find(o => !objectiveStatus?.[o.id]);
    const targetDirective = targetObj 
      ? `\nCRITICAL: Your next scenario MUST target this specific objective: "${targetObj.label}" (${targetObj.id}) — ${targetObj.description}. Design the scenario so the user must demonstrate THIS skill to answer well.`
      : "";
    
    turnInstruction = `The user wants the next scenario. Do EXACTLY this:
${targetDirective}

"**📖 Scenario:**" — Present a NEW realistic work scenario (2-3 sentences). It MUST:
- Cover a DIFFERENT aspect of this task than previous rounds
- Be specifically designed so the user must demonstrate the target objective to answer well
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
- When presenting A/B/C options: each option MUST be a short action phrase (max 15 words). Start with a verb. No parenthetical tool lists, no "e.g.", no sub-clauses. Example: "Use GPT-5.4 to generate three narrative drafts from raw data" — NOT a full paragraph.
- Reference the user's actual words. Never give generic feedback.

YOUR TASK RIGHT NOW:
${turnInstruction}
${scaffoldingInstruction}

${round >= MAX_ROUNDS && posInRound === 1 ? "This is the FINAL round. Replace 'Ready for next scenario?' with: 'Great conversation! 🎉 Click Finish to see how you did.'" : ""}
${posInRound === 2 && "If user said no: 'Great conversation! Click Finish to see your results.'"}`;
}

// ─── SCORE ───

async function handleScore(payload: any, apiKey: string) {
  const { transcript, scenario, mode = "assess", learningObjectives, scaffoldingTiers, liveObjectiveStatus } = payload;

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

  // Build live status context for scoring alignment
  const liveStatusContext = liveObjectiveStatus && learningObjectives
    ? `\n\nLIVE TRACKING (ground truth from session): ${learningObjectives.map((o: any) => `${o.label}: ${liveObjectiveStatus[o.id] ? "MET" : "NOT MET"}`).join(", ")}. Use this as the primary source. Only override if the transcript CLEARLY contradicts it.`
    : "";

  const objectivesSection = learningObjectives && Array.isArray(learningObjectives)
    ? `\n\nLearning Objectives for this session:\n${learningObjectives.map((o: any) => `- ${o.label}: ${o.description} (pillar: ${o.pillar})`).join("\n")}\n\nFor each objective, determine if it was MET or NOT MET based on the conversation evidence. An objective met with Tier 3 scaffolding should be marked as met but noted as "assisted".${scaffoldingContext}${liveStatusContext}`
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

/* ── Elevation Narrative: "Before → After" role evolution ── */
async function handleElevate(payload: any, apiKey: string) {
  const { jobTitle, company, taskName, tasks } = payload;

  const taskList = tasks?.length
    ? tasks.map((t: any) => `- ${t.name} (AI exposure: ${t.aiExposure ?? '?'}%)`).join("\n")
    : `- ${taskName}`;

  const prompt = `You are a career intelligence analyst. Given a role and its task breakdown, generate a concise "elevation narrative" showing how AI is promoting professionals in this role up the value chain.

Role: ${jobTitle}${company ? ` at ${company}` : ""}
${currentDateContext(await fetchToolVersions())}

Tasks:
${taskList}

Respond in this exact JSON format:
{
  "before": "One sentence: what this role traditionally focused on (the routine/operational work)",
  "after": "One sentence: what professionals in this role are shifting toward (higher-purpose, strategic work)",
  "shift_summary": "One compelling sentence capturing the overall elevation (e.g., 'From reading scans to guiding treatment strategy')",
  "emerging_skills": ["3-4 specific skills that define the 'after' state"],
  "analogy": "A one-line analogy connecting this shift to a well-known transformation (like the radiologist example)"
}

Rules:
- Be specific to THIS role and company, not generic
- The "after" should feel aspirational and exciting
- Use present tense ("is shifting", "are moving toward")
- Keep each field under 30 words
- emerging_skills should be concrete and practicable`;

  const raw = await callAI(apiKey, [{ role: "user", content: prompt }], 0.7);
  let parsed;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    parsed = { before: "", after: "", shift_summary: raw, emerging_skills: [], analogy: "" };
  }

  return new Response(JSON.stringify(parsed), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
