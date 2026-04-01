const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert lead generation consultant. Your job is to guide the user through building a precise Ideal Customer Profile (ICP) to find the highest-quality leads.

## Your Process (follow these phases IN ORDER):

### Phase 1: Business Understanding
- Ask for their company website URL (if not already provided)
- Once you have it, acknowledge what the business does based on the scraped content provided
- Confirm your understanding is correct

### Phase 2: Buyer Persona  
- Ask who their ideal buyers are: job titles, roles, decision-maker level
- Ask about target company size (startup, SMB, mid-market, enterprise)
- Ask about target industries or verticals

### Phase 3: Targeting
- Ask about target geography (cities, states, countries)
- Ask about any other qualifying criteria (budget, urgency, tech stack, etc.)

### Phase 4: Confirmation
- Summarize the complete ICP in a clear bullet list
- Ask the user to confirm or adjust
- Once confirmed, call the run_lead_search tool

## Rules:
- Ask ONE question at a time (max 2 related sub-questions)
- Keep responses concise and conversational (2-4 sentences max)
- Be encouraging and helpful
- If the user gives vague answers, help them be more specific with examples
- Once you have enough info (at minimum: website + who they sell to + geography), you may propose running the search
- ALWAYS call run_lead_search when the user confirms the ICP — never just describe leads`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "run_lead_search",
      description: "Execute lead search using the confirmed ICP. Call this when the user has confirmed their ideal customer profile.",
      parameters: {
        type: "object",
        properties: {
          website: { type: "string", description: "The user's company website URL" },
          icp_summary: { type: "string", description: "A concise summary of the ideal customer profile" },
          search_queries: {
            type: "array",
            items: { type: "string" },
            description: "3-5 specific search queries to find leads matching this ICP",
          },
        },
        required: ["website", "icp_summary", "search_queries"],
        additionalProperties: false,
      },
    },
  },
];

async function scrapeWebsite(url: string, firecrawlKey: string): Promise<string> {
  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${firecrawlKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: formattedUrl, formats: ["markdown"], onlyMainContent: true }),
  });

  const data = await res.json();
  return data?.data?.markdown || data?.markdown || "";
}

async function executeLeadSearch(
  args: { website: string; icp_summary: string; search_queries: string[] },
  firecrawlKey: string,
  lovableKey: string,
): Promise<any[]> {
  let formattedUrl = args.website.trim();
  if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

  // Search for leads using Firecrawl
  const allResults: any[] = [];
  for (const query of args.search_queries.slice(0, 4)) {
    try {
      const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: `${query} contact email linkedin`, limit: 5 }),
      });
      const searchData = await searchRes.json();
      allResults.push(...(searchData?.data || []));
    } catch (e) {
      console.error("Search failed:", query, e);
    }
  }

  // AI extraction
  const searchSummary = allResults
    .slice(0, 12)
    .map((r: any) => `URL: ${r.url}\nTitle: ${r.title || ""}\nDesc: ${r.description || ""}\nContent: ${(r.markdown || "").slice(0, 500)}`)
    .join("\n---\n");

  const extractRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `Extract up to 5 real leads from search results. Return JSON only (no markdown fences):
{"leads":[{"name":"Full Name","title":"Job Title","company":"Company Name","email":"email or null","phone":"phone or null","linkedin":"url or null","twitter":"url or null","summary":"1-2 sentence summary of who this person is and their background","reason":"1-2 sentence explanation of why they are a strong lead for this ICP"}]}
Only include REAL people. Prioritize decision-makers. Every lead MUST have summary and reason fields.`,
        },
        {
          role: "user",
          content: `ICP: ${args.icp_summary}\n\nSearch Results:\n${searchSummary}`,
        },
      ],
    }),
  });

  const extractData = await extractRes.json();
  const extractText = extractData?.choices?.[0]?.message?.content || "";

  try {
    const cleaned = extractText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return (parsed.leads || []).slice(0, 5);
  } catch {
    console.error("Failed to parse leads");
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

    // Check if user's first message contains a URL — scrape it and inject context
    const enrichedMessages = [...messages];
    const urlRe = /https?:\/\/[^\s]+|[a-z0-9-]+\.[a-z]{2,}/i;
    const firstUserMsg = messages.find((m: any) => m.role === "user");
    if (firstUserMsg && firecrawlKey) {
      const urlMatch = firstUserMsg.content.match(urlRe);
      if (urlMatch) {
        try {
          const siteContent = await scrapeWebsite(urlMatch[0], firecrawlKey);
          if (siteContent) {
            // Add scraped context as a system message before the conversation
            enrichedMessages.unshift({
              role: "system",
              content: `[SCRAPED WEBSITE CONTENT from ${urlMatch[0]}]:\n${siteContent.slice(0, 3000)}\n\n[END SCRAPED CONTENT]`,
            });
          }
        } catch (e) {
          console.error("Scrape failed:", e);
        }
      }
    }

    // Call AI with streaming
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...enrichedMessages],
        tools: TOOLS,
        stream: true,
      }),
    });

    if (!aiRes.ok) {
      const status = aiRes.status;
      const errText = await aiRes.text();
      console.error("AI error:", status, errText);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI call failed: ${status}`);
    }

    // We need to handle tool calls — collect the stream, detect tool calls, execute them
    const reader = aiRes.body!.getReader();
    const decoder = new TextDecoder();

    // First pass: collect stream to detect tool calls
    let fullContent = "";
    let toolCallChunks: any = {};
    let hasToolCall = false;
    const rawChunks: string[] = [];

    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") continue;

        rawChunks.push(line);

        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta;
          if (delta?.content) fullContent += delta.content;
          if (delta?.tool_calls) {
            hasToolCall = true;
            for (const tc of delta.tool_calls) {
              const id = tc.index ?? 0;
              if (!toolCallChunks[id]) toolCallChunks[id] = { name: "", args: "" };
              if (tc.function?.name) toolCallChunks[id].name = tc.function.name;
              if (tc.function?.arguments) toolCallChunks[id].args += tc.function.arguments;
            }
          }
        } catch {}
      }
    }

    // If there's a tool call, execute lead search and return results
    if (hasToolCall && toolCallChunks[0]?.name === "run_lead_search") {
      if (!firecrawlKey) {
        return new Response(JSON.stringify({ error: "Firecrawl not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let args: any;
      try {
        args = JSON.parse(toolCallChunks[0].args);
      } catch {
        return new Response(JSON.stringify({ error: "Failed to parse tool call" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Executing lead search:", JSON.stringify(args).slice(0, 300));

      const leads = await executeLeadSearch(args, firecrawlKey, LOVABLE_API_KEY);

      // Build SSE response with a searching message + lead results
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          // Send a "searching..." text message
          const searchingMsg = { choices: [{ delta: { content: "🔍 Searching for leads matching your ICP...\n\n" } }] };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(searchingMsg)}\n\n`));

          // Send leads as special event
          const leadsEvent = { type: "leads", leads };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(leadsEvent)}\n\n`));

          // Send summary message
          const summaryContent = leads.length > 0
            ? `Found **${leads.length} leads** matching your ICP! 🎉\n\nWant me to:\n- Send these to your WhatsApp?\n- Refine the search criteria?\n- Search for more leads in a different region?`
            : "I couldn't find strong matches this time. Would you like to:\n- Broaden the search criteria?\n- Try different job titles or industries?\n- Search in a different region?";

          const summaryMsg = { choices: [{ delta: { content: summaryContent } }] };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(summaryMsg)}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // No tool call — stream the collected content as SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of rawChunks) {
          controller.enqueue(encoder.encode(chunk + "\n\n"));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("leadgen-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
