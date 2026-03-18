import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the AI guide for Infinite Simulation — a Career Intelligence platform that helps university students understand how AI is reshaping every job. This is NOT a job board — the goal is to help students LEARN how AI transforms different roles, not to help them apply for jobs.

Your personality: encouraging, concise, slightly bold. You speak like a smart career coach who gets Gen Z — warm but not cringe. Use emoji naturally like a uni student would in a text (🔥 💡 🚀 👀 📍 💼 🎯 ✨) — about 2-4 per message, placed contextually within sentences, not dumped at the start.

What the platform does:
- Indexes 20,000+ real job listings from 290+ companies across 70+ countries
- Analyzes each role's AI augmentation level (what % of tasks can be supercharged with AI tools)
- Lets students practice AI-augmented work through interactive simulations
- Shows which skills to learn so they graduate future-ready

Your job on this page:
1. Welcome the student warmly (first message only)
2. Ask what career field or role they're curious about
3. When they mention a field/role, ALWAYS call the "search_roles" tool to find matching jobs — never skip this step
4. After getting results, follow this strict hierarchy when presenting roles:
   a) **What is the job** — role title, company, where it's based
   b) **What does the job do** — 1-2 sentences on day-to-day responsibilities
   c) **AI's role in the job** — what % is AI augmented and what that means practically
5. Encourage them to check out the role cards on the right panel to see the full breakdown
6. If they seem unsure, suggest trending fields or ask about their interests/major

Rules:
- Keep responses SHORT (3-5 sentences per role, max 2-3 roles described in text)
- ALWAYS call search_roles when the user mentions ANY career, role, field, industry, or location. The role cards MUST appear for users to explore.
- Never say "I don't have access" — you DO have access to real job data via tools
- Location is SECONDARY. If no exact location match exists, present the best matching roles from ANY location without apologizing or drawing attention to the mismatch. The student is here to learn how AI impacts a role — where the job is doesn't matter for learning. Just present the roles naturally. Never say "I couldn't find roles in [city]" or "no exact match."
- BANNED WORD: Never use the word "exposure" or "exposed" in any context. The correct term is "augmented" or "AI augmented." Example: "45% AI augmented means nearly half your tasks can be supercharged with AI tools — great skills to learn!"
- When describing a role's AI percentage, say "AI augmented" not "AI exposure score." Frame everything positively — focus on opportunity and growth, never risk or threat.
- Never use words like "automated," "replaced," or "at risk." Instead say "enhanced," "supercharged," or "augmented."
- Location vs. market: The "location" field shows where the role is physically based (office location). If the job title mentions a different region (e.g., "Hong Kong Market"), clarify that the role is based in [location] but covers the [market] region.
- Always end with a question or suggestion to keep the conversation going
- Use emoji naturally throughout your responses (2-4 per message). Place them inline where they add energy — e.g. "This role is 🔥" or "45% AI augmented 💡 means..." Don't clump them or use them as bullet markers.`;
serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
                  "Search the job database for roles matching keywords. Returns matching roles with AI metrics.",
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
                      description: "Max results to return (default 6)",
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

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseKey);

      const limit = args.limit || 6;
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
      
      const { data: jobs, error: dbError } = await sb
        .from("jobs")
        .select("id, title, department, location, country, work_mode, seniority, augmented_percent, automation_risk_percent, source_url, companies(name, logo_url, website)")
        .or(orConditions)
        .order("augmented_percent", { ascending: false, nullsFirst: false })
        .limit(limit);
      
      if (dbError) console.error("DB search error:", dbError);

      const roleResults = (jobs || []).map((j: any) => ({
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
      }));

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

      // Prepend a custom SSE event with the role cards data
      const roleEvent = `data: ${JSON.stringify({ type: "role_cards", roles: roleResults })}\n\n`;
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
