import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fixed: exactly 3 rounds, one per objective
const FIXED_ROUNDS = 3;

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

// ─── COMPILE ───

async function handleCompile(payload: any, apiKey: string) {
  const { taskName, jobTitle, company, difficulty = 3, mode = "assess", taskMeta, coaching, intel, level = 1, futurePrediction } = payload;
  const aiContext = aiStateDescription(taskMeta);
  const toolVersions = await fetchToolVersions();
  const dateCtx = currentDateContext(toolVersions);
  const isAssess = mode === "assess";
  const isLevel2 = level === 2;

  const coachingInstructions = coaching
    ? `\n\nCOACHING MODE — RETRY SESSION:
The learner previously scored ${coaching.previousOverall}% overall. Their weakest area was "${coaching.weakCategory}" at ${coaching.weakScore}%.
Design scenarios that specifically target "${coaching.weakCategory}" improvement.
Coaching tip to weave in: "${coaching.tip}"
IMPORTANT: Do NOT mention the coaching focus area in the "openingMessage". It's shown in a separate UI banner.`
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
2. Design scenarios that specifically test or reference the equipped skills.
3. Reference the disrupting technologies in at least 1 scenario.
4. If intel.hasFullIntel is true, the openingMessage should feel rewarding.
5. If no intel was gathered, do NOT reference any recon data.`
    : "\n\nNO INTEL: The player marched to battle without recon. Open with: \"You enter unfamiliar territory. No scouts. No intel. Trust your instincts, commander.\" Do not reference any specific threats or skills.";

  // Level 2 future context
  const level2Context = isLevel2 && futurePrediction
    ? `\n\nLEVEL 2 — FUTURE SCENARIO MODE:
This is a LEVEL 2 simulation. The task "${taskName}" has been largely AUTOMATED by emerging technology.
COLLAPSE SUMMARY: ${futurePrediction.collapse_summary}
NEW HUMAN ROLE: ${futurePrediction.new_human_role}
DISRUPTING TECHNOLOGIES: ${(futurePrediction.disrupting_tech || []).join(", ")}
FUTURE AI EXPOSURE: ${futurePrediction.future_exposure}%
TIMELINE: ${futurePrediction.timeline}

CRITICAL LEVEL 2 INSTRUCTIONS:
- Do NOT teach current AI tools. Instead, teach the NEW human role that emerges AFTER automation.
- Scenarios should be set in the NEAR FUTURE where ${(futurePrediction.disrupting_tech || []).slice(0, 2).join(" and ")} have automated the routine parts.
- The user's job is now: oversight, validation, strategic direction, catching edge cases AI misses.
- Objectives should focus on: validating AI output quality, strategic oversight decisions, identifying AI blind spots.
- Still use Learn→Apply format with 2 binary choices per round.
- Reference the specific disrupting technologies by name.`
    : "";

  const levelLabel = isLevel2 ? "LEVEL 2 — FUTURE SCENARIO" : "LEVEL 1 — CURRENT TOOLS";
  const levelDescription = isLevel2
    ? "Future-focused: the task is automated, teach the NEW human oversight role"
    : "Current: teach how to use today's AI tools for this task";

  const prompt = `You are designing a LEARNING simulation about ${isLevel2 ? "the future human role after AI automation" : "AI tools"} for a professional task.

${dateCtx}

Role: ${jobTitle}${company ? ` at ${company}` : ""}
Task: ${taskName}
${aiContext}
Mode: ${isAssess ? "ASSESS — broad baseline check across the task" : "UPSKILL — deeper practice on specific sub-skills"}
Level: ${levelLabel} — ${levelDescription}
Format: Structured Learn→Apply coaching conversation, exactly ${FIXED_ROUNDS} rounds, ${isAssess ? "~8" : "~12"} minutes
${coachingInstructions}
${intelInstructions}
${level2Context}

PEDAGOGY: TEACH-THEN-TEST (Learn → Apply)
Every round follows this exact 2-beat loop:
- BEAT 1 (LEARN): You present a scenario, teach the key insight, then offer exactly 2 options.
- BEAT 2 (APPLY): User picks A or B. You confirm/correct briefly, show insight card, then immediately present the NEXT scenario with its lesson and 2 options.

This means the user is NEVER left without guidance. You always teach before testing.

This simulation has EXACTLY ${FIXED_ROUNDS} rounds, one per objective. No more, no less.

Generate a JSON response:

1. "learningObjectives": Array of EXACTLY 3 objects, each with:
   - "id": short snake_case identifier
   - "label": concise human-readable label (3-6 words)
   - "description": 1 sentence explaining what mastery looks like
   - "pillar": one of: "tool_awareness", "human_value_add", "adaptive_thinking", "domain_judgment"
   
   CRITICAL: The 3 objectives must be SPECIFIC to "${taskName}" for a ${jobTitle}. Each should map to a different pillar.
   ${isLevel2 ? 'For Level 2, objectives should focus on: oversight/validation of AI output, strategic decision-making, and identifying AI blind spots.' : ''}

2. "briefing": 2-3 sentences. ${isLevel2 ? "What this task looks like AFTER automation and what the new human role involves." : "What this task involves and what AI tools are changing about it."}

3. "tips": Array of 2 practical tips.

4. "keyTerms": Array of 3 objects with "term" and "definition".

5. "systemPrompt": System prompt for the coaching persona.

6. "openingMessage": The FIRST Learn→Apply beat. Structure EXACTLY:
   - "**📖 Scenario:**" — 2 sentence realistic work scenario ${isLevel2 ? "(set in the near future where AI has automated routine parts)" : ""}
   - "**💡 Key Insight:**" — 1-2 sentences teaching the relevant ${isLevel2 ? "oversight technique or validation approach" : "AI tool/technique"} for THIS scenario. ${isLevel2 ? "Reference the disrupting technology and explain the human's new role." : "Name a SPECIFIC current tool and what it does."}
   - "**🤔 Apply it:**"
   - "**A)** [Strong approach — 10-15 words, verb-led]"
   - "**B)** [Common misconception — 10-15 words, verb-led]"
   - Under 80 words total.

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

  let objectives = parsed.learningObjectives;
  if (!Array.isArray(objectives) || objectives.length < 2) {
    objectives = isLevel2
      ? [
          { id: "validate_ai_output", label: "Validate AI-generated results", description: `Verify automated output quality for ${taskName}`, pillar: "adaptive_thinking" },
          { id: "strategic_oversight", label: "Provide strategic oversight", description: `Make high-level decisions AI cannot handle in ${taskName}`, pillar: "domain_judgment" },
          { id: "catch_ai_blindspots", label: "Identify AI blind spots", description: `Spot edge cases and biases in automated ${taskName}`, pillar: "human_value_add" },
        ]
      : [
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
    level,
    config: {
      minRounds: FIXED_ROUNDS,
      maxRounds: FIXED_ROUNDS,
      objectiveCount: objectives.length,
    },
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── CHAT ───

async function handleChat(payload: any, apiKey: string) {
  const { messages, role, round, turnCount, mode = "assess", taskMeta, learningObjectives, objectiveStatus, targetObjectiveId, objectiveFailCounts } = payload;
  const aiContext = aiStateDescription(taskMeta);
  const toolVersions = await fetchToolVersions();
  const dateCtx = currentDateContext(toolVersions);

  const systemMsg = {
    role: "system",
    content: buildLearnApplySystem(
      role, aiContext, dateCtx, round, turnCount, mode,
      learningObjectives, objectiveStatus, targetObjectiveId,
    ),
  };

  const aiMessages = [systemMsg, ...messages];
  const reply = await callAI(apiKey, aiMessages, 0.7);

  return new Response(reply, {
    headers: { ...corsHeaders, "Content-Type": "text/plain" },
  });
}

function buildLearnApplySystem(
  role: string, aiContext: string, dateCtx: string,
  round: number, turnCount: number, mode: string,
  learningObjectives?: any[], objectiveStatus?: Record<string, boolean>,
  targetObjectiveId?: string,
): string {
  // Build objectives context
  let objectivesContext = "";
  if (learningObjectives && Array.isArray(learningObjectives)) {
    const statusMap = objectiveStatus || {};
    const met = learningObjectives.filter(o => statusMap[o.id]);
    const unmet = learningObjectives.filter(o => !statusMap[o.id]);
    
    const targetObj = targetObjectiveId 
      ? learningObjectives.find(o => o.id === targetObjectiveId) 
      : unmet[0];
    const targetLabel = targetObj ? `"${targetObj.label}" (${targetObj.id})` : "none — all met";
    
    objectivesContext = `\n\nLEARNING OBJECTIVES:
${learningObjectives.map(o => {
  const isTarget = targetObj && o.id === targetObj.id ? " ← CURRENT TARGET" : "";
  return `- [${statusMap[o.id] ? "✅ MET" : "⬜ NOT YET"}] ${o.label} (${o.id})${isTarget}`;
}).join("\n")}
${met.length > 0 ? `\nConquered: ${met.map(o => o.label).join(", ")}` : ""}

CURRENT TARGET: ${targetLabel}

MANDATORY OBJECTIVE EVALUATION:
After evaluating the user's choice, include EXACTLY ONE of these tags:
- [OBJ_EVAL:${targetObj?.id || "unknown"}:PASS] — user's choice shows understanding
- [OBJ_EVAL:${targetObj?.id || "unknown"}:FAIL] — user chose the misconception option

OBJECTIVE COMPLETION: If ALL objectives have been met, also include [ALL_OBJECTIVES_MET].`;
  }

  // Fixed 3-round structure — check completion
  const allMet = learningObjectives?.every(o => objectiveStatus?.[o.id]) ?? false;
  let endNote = "";
  if (allMet) {
    endNote = `\n\nALL OBJECTIVES MET! Replace the next scenario with: "🎉 You've conquered all objectives! Click **Finish** to see your battle report." Include [ALL_OBJECTIVES_MET].`;
  }

  const isLastRound = round >= FIXED_ROUNDS;
  let urgencyNote = "";
  if (isLastRound && !allMet) {
    const unmetIds = learningObjectives?.filter(o => !objectiveStatus?.[o.id]) || [];
    if (unmetIds.length > 0) {
      urgencyNote = `\n\nFINAL ROUND! After evaluating, end with: "🎉 Great battle, Commander! Click **Finish** to see your report." Include [ALL_OBJECTIVES_MET] if all are met.`;
    }
  }

  const targetObj = targetObjectiveId 
    ? learningObjectives?.find(o => o.id === targetObjectiveId) 
    : learningObjectives?.find(o => !objectiveStatus?.[o.id]);

  const modeContext = mode === "assess" 
    ? "Broad baseline — each scenario covers a different facet."
    : "Deeper upskilling — scenarios drill into specific sub-skills.";

  const turnInstruction = `The user just picked A or B (or typed a short response) for your previous scenario.

DO THIS IN ORDER:

1. EVALUATE (2-3 sentences max):
   - If they picked the STRONG option: "✅ Exactly right! [1 sentence explaining WHY this works — reference a specific tool or technique]."
   - If they picked the MISCONCEPTION: "Not quite — [1 sentence explaining the pitfall]. The stronger approach is [brief correct answer]."
   - If they typed something other than A/B: interpret their intent charitably. If it aligns with the strong option, treat as correct. If unclear, briefly teach the correct approach.

2. INSIGHT CARD (always include):
   🤖 [Name ONE specific current AI tool and what it does for this task — 1 sentence]
   💡 [ONE thing only a human can do here — 1 sentence]

${isLastRound ? `3. CLOSING: End with "🎉 Great battle, Commander! Click **Finish** to see your report."` : `3. NEXT SCENARIO (Learn → Apply beat):
   ${targetObj ? `Design this scenario to test: "${targetObj.label}" — ${targetObj.description}` : "Pick the most relevant remaining skill to test."}
   
   "**📖 Scenario:**" — 2 sentence NEW realistic work scenario (different aspect than before)
   "**💡 Key Insight:**" — 1-2 sentences teaching the relevant AI tool/technique. Name a SPECIFIC current tool.
   "**🤔 Apply it:**"
   "**A)** [Strong approach — 10-15 words, verb-led]"
   "**B)** [Common misconception — 10-15 words, verb-led]"`}

TOTAL RESPONSE: under 120 words. The evaluate + insight part should be ~40 words${isLastRound ? "." : ", the new scenario ~80 words."}

Include the [OBJ_EVAL] tag after the evaluate section.`;

  return `You are a supportive AI coach for ${role}. You teach by example and test with simple binary choices.

${dateCtx}
${aiContext}
${modeContext}
${objectivesContext}
${endNote}
${urgencyNote}

Round ${round || 1} of ${FIXED_ROUNDS} (exactly 3 rounds, one per objective).

PEDAGOGY: LEARN → APPLY (Teach-Then-Test)
- You ALWAYS teach before testing. Never quiz without teaching first.
- Every scenario includes a "💡 Key Insight" that teaches the concept BEFORE the A/B choice.
- Exactly 2 options (A and B). One is strong, one is a common misconception.
- Options are SHORT: 10-15 words each, verb-led. No paragraphs.
- The user picks A or B. You evaluate briefly, show insight card, then present NEXT scenario with its lesson.
- NEVER ask open-ended questions. NEVER ask "why?" or "how would you approach this?"
- If a user says "help", "not sure", or seems stuck: just teach the answer warmly and let them pick on the next one.

YOUR PERSONA:
- Warm, encouraging, fast-paced — like a great tutor who keeps momentum
- Always find something good in their choice, even if wrong
- Never say "wrong", "incorrect", or "you should have"
- Use "Actually..." or "Close!" for misconceptions

ABSOLUTE RULES:
- Follow the instruction below EXACTLY
- Stay under 120 words total
- When user says "ready" or "yes" or similar, present the next scenario
- Reference specific, current AI tools by name (use versions from the date context)

YOUR TASK RIGHT NOW:
${turnInstruction}`;
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
