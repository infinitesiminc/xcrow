import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the AI career coach for crowy.ai — a Skill Map platform that helps university students build job-ready skills before they graduate. Everything feeds into the student's **Skill Map** — a gamified grid of 26 skills across 6 categories (Technical, Analytical, Communication, Leadership, Creative, Compliance).

Your personality: encouraging, concise, slightly bold. You speak like a smart career coach who gets Gen Z — warm but not cringe. Use emoji naturally (🔥 💡 🚀 👀 📍 💼 🎯 ✨) — about 2-4 per message.

## What the platform does:
- Indexes 20,000+ real job listings from 290+ companies across 70+ countries
- Each role has real tasks that students can practice in AI-powered simulations
- Practicing tasks earns XP toward specific skills on their Skill Map
- Skills level up: Beginner → Developing → Proficient → Expert
- The goal: build a verified skill map that proves job readiness to employers

## Your coaching approach:
- Always connect roles back to SKILLS: "This PM role builds Strategy, Stakeholder Management, and Data Analysis"
- After showing role cards, suggest which task to practice first and why: "Start with the Roadmap Planning task — it builds your Strategy skill, which unlocks the most roles"
- Frame everything as skill-building, not job-seeking: "You're not just learning about PM — you're leveling up Strategy"
- For students unsure about careers, help them explore by skills: "You seem drawn to analytical thinking — let me show you roles that build those skills"
- When you have task data for a role, mention specific tasks: "This role has 8 tasks — try 'Customer Feedback Synthesis' first, it builds your Communication and Data Analysis skills"

## CRITICAL: Narrowing Before Searching

Do NOT search immediately when the user says something broad like "marketing" or "finance" or "tech jobs." Instead, ask 1-2 quick narrowing questions first. Your goal is to present 2-3 highly relevant roles, not 6 generic ones.

**Narrowing flow:**
1. If the user gives a BROAD field (e.g. "marketing", "engineering", "finance", "tech", "business"):
   → Ask ONE quick question to narrow down. Examples:
     - "Marketing is huge! Are you more drawn to the creative side (content, brand, social) or the data side (performance, SEO, analytics)? 🎯"
     - "Engineering covers a lot! Are you into building products (frontend/backend), infrastructure (DevOps/cloud), or AI/ML? 💡"
   → Then search with the narrowed intent and set limit to 3.

2. If the user gives a SPECIFIC role (e.g. "data scientist", "UX designer", "product manager"):
   → Search immediately — no need to narrow. Set limit to 3.

3. If the user mentions a company name:
   → Search immediately for roles at that company. Set limit to 3.

When presenting roles after searching:
a) **What is the job** — role title, company
b) **What skills you'd build** — mention 2-3 specific skills from the taxonomy
c) **AI's role** — what % is AI augmented and what that means practically
d) **Key tasks** — if task data is available, mention 1-2 top tasks they can practice
e) **Next step** — "Tap a card to see tasks you can practice right now"

Rules:
- Keep responses SHORT (3-5 sentences per role, max 2-3 roles described in text)
- When you DO search, ALWAYS set limit to 3 so the cards feel curated
- ALWAYS call search_roles when you have enough specificity
- Never say "I don't have access" — you DO have access to real job data via tools
- Location is SECONDARY — the student is here to build skills, not apply for jobs
- BANNED WORD: Never use "exposure" or "exposed." Use "augmented" or "AI augmented."
- Frame everything positively — focus on skill-building and opportunity
- Never use "automated," "replaced," or "at risk." Instead say "enhanced," "supercharged," or "augmented."
- Always end with a question or suggestion to keep building their skill map
- Use emoji naturally throughout your responses (2-4 per message)`;

// In-memory cache for search results (per-isolate, short-lived)
const searchCache = new Map<string, { roles: any[]; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedSearch(key: string) {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    searchCache.delete(key);
    return null;
  }
  return entry.roles;
}

// Trim conversation to last N turns to reduce token usage
function trimMessages(messages: any[], maxTurns: number = 10): any[] {
  if (messages.length <= maxTurns * 2) return messages;
  // Always keep the first user message for context, then take last N*2 messages
  const first = messages[0];
  const recent = messages.slice(-(maxTurns * 2));
  // Avoid duplicating the first message if it's already in recent
  if (recent[0] === first) return recent;
  return [first, ...recent];
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages: rawMessages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Trim conversation history
    const messages = trimMessages(rawMessages);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
          tools: [
            {
              type: "function",
              function: {
                name: "search_roles",
                description:
                  "Search the job database for roles matching keywords. Returns matching roles with AI metrics and top tasks.",
                parameters: {
                  type: "object",
                  properties: {
                    query: {
                      type: "string",
                      description:
                        "Search keywords like 'software engineer', 'marketing', 'data science'",
                    },
                    limit: {
                      type: "number",
                      description: "Max results to return (default 3)",
                    },
                  },
                  required: ["query"],
                },
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please wait a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // We need to intercept tool calls. Read the stream, handle tool calls, then re-stream.
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let toolCallAccumulator: { name: string; arguments: string } | null = null;
    let regularChunks: string[] = [];
    let hasToolCall = false;

    // First pass: collect the stream to check for tool calls
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      
      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta;
          if (delta?.tool_calls) {
            hasToolCall = true;
            const tc = delta.tool_calls[0];
            if (tc.function?.name) {
              toolCallAccumulator = { name: tc.function.name, arguments: tc.function.arguments || "" };
            } else if (toolCallAccumulator && tc.function?.arguments) {
              toolCallAccumulator.arguments += tc.function.arguments;
            }
          }
          regularChunks.push(line + "\n");
        } catch { /* skip */ }
      }
    }

    // If there's a tool call, execute it and make a follow-up request
    if (hasToolCall && toolCallAccumulator?.name === "search_roles") {
      let args: { query: string; limit?: number };
      try {
        args = JSON.parse(toolCallAccumulator.arguments);
      } catch {
        args = { query: toolCallAccumulator.arguments };
      }

      const limit = args.limit || 3;
      const cacheKey = `${args.query.toLowerCase().trim()}:${limit}`;
      
      // Check in-memory cache first
      let roleResults = getCachedSearch(cacheKey);

      if (!roleResults) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const sb = createClient(supabaseUrl, supabaseKey);

        // Split query into words for broader matching
        const words = args.query.split(/\s+/).filter(Boolean);
        const patterns = words.map(w => `%${w}%`);
        
        // Build OR conditions: match any word in title, department, location, or country
        const orConditions = patterns.flatMap(p => [
          `title.ilike.${p}`,
          `department.ilike.${p}`,
          `location.ilike.${p}`,
          `country.ilike.${p}`,
        ]).join(",");
        
        // Fetch a wider pool to allow diversity filtering
        const poolSize = Math.max(limit * 5, 15);
        const { data: jobs, error: dbError } = await sb
          .from("jobs")
          .select("id, title, department, location, country, work_mode, seniority, augmented_percent, automation_risk_percent, source_url, companies(name, logo_url, website)")
          .or(orConditions)
          .gt("augmented_percent", 0)
          .limit(poolSize);
        
        if (dbError) console.error("DB search error:", dbError);

        // Diversify: max 1 role per company, then shuffle
        const byCompany = new Map<string, any>();
        const noCompany: any[] = [];
        for (const j of (jobs || [])) {
          const companyName = (j as any).companies?.name?.toLowerCase() || "";
          if (!companyName) {
            noCompany.push(j);
            continue;
          }
          if (!byCompany.has(companyName)) {
            byCompany.set(companyName, j);
          }
        }
        // Combine unique-per-company + no-company, then shuffle
        let diversePool = [...byCompany.values(), ...noCompany];
        // Fisher-Yates shuffle for fair ordering
        for (let i = diversePool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [diversePool[i], diversePool[j]] = [diversePool[j], diversePool[i]];
        }
        const selectedJobs = diversePool.slice(0, limit);

        const jobIds = selectedJobs.map((j: any) => j.id);

        // Fetch top 3 task clusters per job for enrichment
        let tasksByJob: Record<string, { name: string; aiScore: number }[]> = {};
        if (jobIds.length > 0) {
          const { data: tasks } = await sb
            .from("job_task_clusters")
            .select("job_id, cluster_name, ai_exposure_score, sort_order")
            .in("job_id", jobIds)
            .order("sort_order", { ascending: true });
          
          if (tasks) {
            for (const t of tasks) {
              if (!tasksByJob[t.job_id]) tasksByJob[t.job_id] = [];
              if (tasksByJob[t.job_id].length < 3) {
                tasksByJob[t.job_id].push({
                  name: t.cluster_name,
                  aiScore: t.ai_exposure_score || 0,
                });
              }
            }
          }
        }

        roleResults = selectedJobs.map((j: any) => ({
          jobId: j.id,
          title: j.title,
          company: j.companies?.name || null,
          logo: j.companies?.logo_url || (j.companies?.website ? `https://logo.clearbit.com/${j.companies.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}` : null),
          location: j.location,
          country: j.country,
          workMode: j.work_mode,
          seniority: j.seniority,
          augmented: j.augmented_percent || 0,
          risk: j.automation_risk_percent || 0,
          sourceUrl: j.source_url || null,
          topTasks: tasksByJob[j.id] || [],
        }));

        // Store in cache
        searchCache.set(cacheKey, { roles: roleResults, ts: Date.now() });
        console.log("Cached search for:", cacheKey, "results:", roleResults.length);
      } else {
        console.log("Cache hit for:", cacheKey);
      }

      // Second AI call with tool result — this time streamed back to client
      const followUp = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...messages,
              {
                role: "assistant",
                content: null,
                tool_calls: [
                  {
                    id: "call_1",
                    type: "function",
                    function: {
                      name: "search_roles",
                      arguments: toolCallAccumulator.arguments,
                    },
                  },
                ],
              },
              {
                role: "tool",
                tool_call_id: "call_1",
                content: JSON.stringify(roleResults),
              },
            ],
            stream: true,
          }),
        }
      );

      if (!followUp.ok) {
        return new Response(
          JSON.stringify({ error: "AI follow-up error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Prepend a custom SSE event with the role cards data (strip topTasks for client — it's for AI context only)
      const clientRoles = roleResults.map((r: any) => {
        const { topTasks, ...rest } = r;
        return rest;
      });
      const roleEvent = `data: ${JSON.stringify({ type: "role_cards", roles: clientRoles })}\n\n`;
      const encoder = new TextEncoder();
      const roleStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(roleEvent));
          const r = followUp.body!.getReader();
          function pump(): Promise<void> {
            return r.read().then(({ done, value }) => {
              if (done) { controller.close(); return; }
              controller.enqueue(value);
              return pump();
            });
          }
          pump();
        },
      });

      return new Response(roleStream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // No tool call — just re-stream the collected chunks
    const encoder = new TextEncoder();
    const body = regularChunks.join("");
    return new Response(encoder.encode(body), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("career-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
