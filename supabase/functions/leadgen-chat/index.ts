const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/** Validate LinkedIn profile URL — must be a real /in/ profile link */
function validLinkedIn(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  // Must be a linkedin.com URL with /in/ path
  if (!/^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+/i.test(trimmed)) return null;
  return trimmed;
}

const SYSTEM_PROMPT = `You are a friendly B2B lead generation strategist helping a beginner find their first prospects. Assume the user has ZERO go-to-market experience. Your job is to educate them on what you found and guide them step-by-step to generate leads.

## CRITICAL FORMAT RULE:
- Every response MUST end with clickable options in this exact format: [[Option A|Option B|Option C]]
- The options go on the LAST line of your response, after your text
- 2-4 options per message, short labels (1-5 words each)
- NEVER use numbered lists for options. ONLY use the [[pipe|separated]] format.

## Your Guided Flow:

### Step 1: ICP Briefing (ALWAYS START HERE)
When ICP data is provided via [ICP CONTEXT], present a warm, educational executive briefing unless the user explicitly says they already selected the ICP or tells you to skip discovery:

Start with: "Here's what I found about **[Company]**:"

- **What you sell**: Explain their products in simple terms, as if to someone unfamiliar
- **Who buys this**: Explain the verticals/industries where these products fit and WHY (connect the dots for the user)
- **Who signs the check**: Explain the buyer personas — use plain language like "the person who decides on purchasing tools like yours is typically a..."
- **Geographic insight**: Based on the company's location and service type:
  - For LOCAL/mobile services (notary, plumbing, cleaning): "Since you're based in [HQ], your strongest leads will be nearby. I recommend starting with [City/Region]."
  - For DIGITAL/SaaS products: "Your product works anywhere, so geography is less important. We can target nationally or focus on [tech hub cities]."
  - For REGIONAL businesses: "Based on your location in [HQ], I'd suggest targeting [surrounding metro/state]."
- **Top opportunity**: In 1-2 sentences, explain which vertical + persona combo looks most promising and WHY in plain business terms

End with: "Ready to start finding leads? Pick the market that excites you most:"
Options = top 3-4 verticals from ICP data

### Step 2: Confirm Vertical & Suggest Personas
Acknowledge their choice warmly. Then explain WHO in that vertical typically buys this type of product.
Use plain language: "In [vertical], the person who decides on [product type] is usually a..."
Suggest the most relevant decision-maker titles for THIS specific business + vertical combo.

CRITICAL persona rules:
- A notary service targets Office Managers, Operations Directors, Branch Managers — NOT CTOs or Engineers
- A SaaS product targets VPs of Engineering, CTOs, IT Directors — NOT Office Managers
- Match personas to the ACTUAL buying decision for this product type
- NEVER suggest generic tech roles for non-tech services

Options = 3-4 specific, realistic job titles

### Step 3: Confirm Geography
Based on the ICP briefing's geographic insight, present a smart default:
- For local services: "Since [Company] is based in [HQ], I'd recommend starting with [nearby area]. Sound good?"
  Options = [[Nearby City 1|Nearby City 2|Broader Region|No preference]]
- For digital/SaaS: "Your product works everywhere. Want to focus on a specific region or go broad?"
  Options = [[United States|Major tech hubs|Global|Specific region]]

### Step 4: Confirm & Generate
Present a clear summary of what you're about to search for:
- **Market**: [Vertical]
- **Decision-makers**: [Titles]
- **Location**: [Geography]
- **Company size**: Small-medium businesses (default, unless user specified otherwise)

Then say: "I'll find real decision-makers matching this profile. Ready?"
Options = [[🔍 Generate leads|Adjust criteria]]

### Step 5: After lead generation
Options = [[Find more leads|Try different vertical|Search new region]]

## Rules:
- Be warm, educational, and encouraging — this may be their first time doing outreach
- Explain WHY at each step (don't just ask, teach)
- Ask exactly ONE question per message
- Keep messages concise but informative (3-6 sentences max)
- NEVER skip the [[option]] format — every single response needs it
- ALWAYS start with the ICP briefing when context is provided
- Personas must be contextually relevant to the business type
- ALWAYS call run_lead_search when the user confirms in Step 4
- If the user says they already chose product, vertical, persona, or geography, or says "skip discovery", do NOT brief again — immediately call run_lead_search
- ALWAYS call register_niches with the options you present
- When user asks to "scale" or "find more", call run_lead_search with scale=true
- Use the company's headquarters from ICP context for geographic recommendations

## Action Tools (Targeting Control):
When the user asks to change their targeting selections, update location, generate leads, reset, or draft an email, use these tools:
- "show me healthcare" / "select fintech" / "switch to enterprise" → call update_targeting with auto_generate=false
- "find healthcare leads" / "get leads for fintech" → call update_targeting with auto_generate=true
- "generate leads" / "generate now" → call generate_leads
- "reset" / "start over" / "go back to defaults" → call reset_targeting
- "change location to Austin" → call change_location
- "draft email to John" → call draft_email
- If user asks "what verticals/products do I have?", read the [TARGETING STATE] context and respond informatively`;

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
            description: "5-8 specific, DIVERSE search queries to find leads matching this ICP.",
          },
          target_titles: {
            type: "array",
            items: { type: "string" },
            description: "Target job titles for decision-makers (e.g. 'VP Operations', 'CEO', 'Director of Marketing')",
          },
          target_location: { type: "string", description: "Target geographic location for leads" },
          target_industries: {
            type: "array",
            items: { type: "string" },
            description: "Target industries to search within",
          },
          employee_ranges: {
            type: "array",
            items: { type: "string" },
            description: "Company size ranges (e.g. '1-10', '11-50', '51-200')",
          },
          scale: { type: "boolean", description: "Set to true when the user wants MORE leads." },
        },
        required: ["website", "icp_summary", "search_queries"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "register_niches",
      description: "Register exploration branches/personas as navigable placeholders. Call this WHENEVER you present 2+ options.",
      parameters: {
        type: "object",
        properties: {
          niches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                description: { type: "string" },
              },
              required: ["label", "description"],
            },
          },
        },
        required: ["niches"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_targeting",
      description: "Update the product and persona card selections in the targeting UI. Set auto_generate=true to also trigger lead generation.",
      parameters: {
        type: "object",
        properties: {
          products: { type: "array", items: { type: "string" }, description: "Product names to select" },
          personas: { type: "array", items: { type: "string" }, description: "Persona/vertical names to select" },
          auto_generate: { type: "boolean", description: "If true, automatically generate leads after updating" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_leads",
      description: "Trigger lead generation with the current targeting selections.",
      parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "reset_targeting",
      description: "Reset all targeting selections back to the defaults detected during initial analysis.",
      parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "change_location",
      description: "Update the target geographic location for lead generation.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "New target location" },
        },
        required: ["location"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_email",
      description: "Open the email draft modal for a specific lead by name.",
      parameters: {
        type: "object",
        properties: {
          lead_name: { type: "string", description: "Name of the lead to draft email for" },
        },
        required: ["lead_name"],
        additionalProperties: false,
      },
    },
  },
];

function normalizeResponseText(content: string): string {
  if (!content) return content;
  return content
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/start_call:[\w.-]+:[\w_]+\{[\s\S]*?\}(?:\s*end_call)?/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function enforceNumberedOptions(content: string): string {
  if (!content) return content;
  const lines = content.split("\n");
  const optionLikeLine = /^(?:[-*•]\s*)?(?:\d+[.)]\s*)?(\*\*[^*]+\*\*|[A-Z][A-Za-z0-9&/',()+\s]{2,120})\s*(?:—|–|-|:)\s+.+$/;
  const candidateIndexes = lines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => optionLikeLine.test(line))
    .map(({ index }) => index);
  if (candidateIndexes.length < 2) return content;
  let optionNumber = 1;
  for (const idx of candidateIndexes) {
    const cleaned = lines[idx].trim().replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "");
    const parts = cleaned.match(/^(\*\*[^*]+\*\*|[A-Z][A-Za-z0-9&/',()+\s]{2,120})\s*(?:—|–|-|:)\s+(.+)$/);
    lines[idx] = `${optionNumber}. ${parts ? `${parts[1].trim()} — ${parts[2].trim()}` : cleaned}`;
    optionNumber += 1;
  }
  return lines.join("\n");
}

function formatAssistantResponse(content: string): string {
  return enforceNumberedOptions(normalizeResponseText(content));
}

/** Lightweight HTML-to-text */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** Scrape a page using native fetch */
async function scrapePage(url: string): Promise<string> {
  try {
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;
    const res = await fetch(formattedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadHunterBot/1.0)", Accept: "text/html" },
      redirect: "follow",
    });
    if (!res.ok) return "";
    const html = await res.text();
    const mainMatch = html.match(/<main[\s\S]*?<\/main>/i) ||
                      html.match(/<article[\s\S]*?<\/article>/i) ||
                      html.match(/<body[\s\S]*?<\/body>/i);
    return htmlToText(mainMatch ? mainMatch[0] : html).slice(0, 4000);
  } catch {
    return "";
  }
}

/** Run a single Apollo search attempt and return raw people array */
async function apolloSearchAttempt(
  apolloKey: string,
  body: Record<string, unknown>,
  label: string,
): Promise<any[]> {
  try {
    console.log(`Apollo ${label}:`, JSON.stringify(body).slice(0, 400));
    const res = await fetch("https://api.apollo.io/api/v1/mixed_people/api_search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": apolloKey },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`Apollo ${label} failed:`, res.status, await res.text());
      return [];
    }
    const data = await res.json();
    const people = data?.people || [];
    console.log(`Apollo ${label} returned ${people.length} results`);
    return people;
  } catch (e) {
    console.error(`Apollo ${label} error:`, e);
    return [];
  }
}

/** Enrich people via Apollo people/match for verified LinkedIn/email */
async function enrichApolloResults(
  apolloKey: string,
  people: any[],
): Promise<any[]> {
  const toEnrich = people.slice(0, 10).filter((p: any) => p.id);
  const enrichedPeople: any[] = [];

  for (const person of toEnrich) {
    try {
      const enrichRes = await fetch("https://api.apollo.io/api/v1/people/match", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Api-Key": apolloKey },
        body: JSON.stringify({ id: person.id }),
      });
      if (enrichRes.ok) {
        const enrichData = await enrichRes.json();
        if (enrichData.person) enrichedPeople.push(enrichData.person);
      } else if (enrichRes.status === 400 || enrichRes.status === 403) {
        console.warn("Apollo enrichment not available — API key may lack scope");
        break;
      }
    } catch (e) {
      console.warn("Apollo match error:", e);
    }
  }
  console.log(`Apollo enriched: ${enrichedPeople.length} of ${toEnrich.length}`);
  return enrichedPeople.length > 0 ? enrichedPeople : people;
}

/** Convert raw Apollo people to lead objects, filtering for verified LinkedIn */
function apolloPeopleToLeads(
  people: any[],
  seenNames: Set<string>,
): any[] {
  const leads: any[] = [];
  for (const p of people) {
    const name = p.name || `${p.first_name || ""} ${p.last_name || ""}`.trim();
    if (!name || seenNames.has(name.toLowerCase())) continue;
    const linkedinUrl = validLinkedIn(p.linkedin_url);
    if (!linkedinUrl) continue;
    seenNames.add(name.toLowerCase());
    leads.push({
      name,
      title: p.title || null,
      company: p.organization?.name || p.organization_name || null,
      linkedin: linkedinUrl,
      email: p.email || null,
      website: p.organization?.website_url || null,
      photo_url: p.photo_url || null,
      source: "Apollo People Search",
    });
  }
  return leads;
}

/** Search Apollo People API with progressive broadening — retries with relaxed filters when 0 results */
async function searchApollopeople(
  apolloKey: string,
  args: {
    target_titles?: string[];
    target_location?: string;
    target_industries?: string[];
    employee_ranges?: string[];
    search_queries: string[];
  },
): Promise<any[]> {
  if (!args.target_titles?.length) return [];

  const seenNames = new Set<string>();

  // Build broadening attempts — each removes one filter layer
  const attempts: { body: Record<string, unknown>; label: string }[] = [];

  // Attempt 1: Full filters
  const fullBody: Record<string, unknown> = {
    person_titles: args.target_titles,
    page: 1,
    per_page: 10,
    person_seniorities: ["director", "vp", "c_suite", "owner"],
  };
  if (args.target_location) fullBody.person_locations = [args.target_location];
  if (args.employee_ranges?.length) {
    fullBody.organization_num_employees_ranges = args.employee_ranges.map((r) => {
      const [min, max] = r.split("-").map(Number);
      return max ? `${min},${max}` : `${min},`;
    });
  }
  if (args.target_industries?.length) fullBody.q_organization_keyword_tags = args.target_industries;
  attempts.push({ body: { ...fullBody }, label: "full-filters" });

  // Attempt 2: Drop industry keywords (most restrictive filter)
  if (args.target_industries?.length) {
    const noIndustry = { ...fullBody };
    delete noIndustry.q_organization_keyword_tags;
    attempts.push({ body: noIndustry, label: "no-industry" });
  }

  // Attempt 3: Drop location too
  if (args.target_location) {
    const noLocation = { ...fullBody };
    delete noLocation.q_organization_keyword_tags;
    delete noLocation.person_locations;
    attempts.push({ body: noLocation, label: "no-location" });
  }

  // Attempt 4: Drop seniority filter (broadest)
  if (attempts.length > 1) {
    const broadest: Record<string, unknown> = {
      person_titles: args.target_titles,
      page: 1,
      per_page: 10,
    };
    attempts.push({ body: broadest, label: "titles-only" });
  }

  // Try each attempt, stop when we get results
  for (const attempt of attempts) {
    const people = await apolloSearchAttempt(apolloKey, attempt.body, attempt.label);
    if (people.length > 0) {
      const enriched = await enrichApolloResults(apolloKey, people);
      const leads = apolloPeopleToLeads(enriched, seenNames);
      if (leads.length > 0) {
        console.log(`Progressive broadening succeeded at "${attempt.label}" with ${leads.length} leads`);
        return leads;
      }
      // Had results but none with verified LinkedIn — continue broadening
      console.log(`${attempt.label}: ${people.length} raw but 0 with verified LinkedIn, broadening...`);
    }
  }

  console.log("All broadening attempts exhausted — 0 leads");
  return [];
}

/** Execute the full lead search pipeline: AI + Apollo */
async function executeLeadSearch(
  args: {
    website: string;
    icp_summary: string;
    search_queries: string[];
    target_titles?: string[];
    target_location?: string;
    target_industries?: string[];
    employee_ranges?: string[];
    scale?: boolean;
  },
  lovableKey: string,
  apolloKey: string | null,
): Promise<any[]> {
  const isScale = args.scale === true;
  const extractLimit = isScale ? 15 : 8;

  // 1. Search Apollo for people matching the ICP
  let apolloLeads: any[] = [];
  if (apolloKey) {
    console.log("Searching Apollo for decision-makers...");
    apolloLeads = await searchApollopeople(apolloKey, args);
    console.log(`Apollo returned ${apolloLeads.length} verified people`);
  }

  if (apolloLeads.length === 0) {
    console.log("No Apollo results — returning empty (no AI fallback)");
    return [];
  }

  // 2. Use AI to score and enrich Apollo results with summaries
  const aiRes = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are scoring and enriching leads for relevance. Given an ICP and a list of Apollo results, return the top ${extractLimit} most relevant leads as JSON (no markdown fences):
{"leads":[{"name":"Full Name","title":"Job Title","company":"Company Name","linkedin":"linkedin url or null","email":"email or null","website":"company website or null","photo_url":"photo url or null","source":"Apollo People Search","summary":"1-2 sentence summary of who this person is","reason":"1-2 sentence explanation of why they match the ICP","score":85,"is_decision_maker":true}]}

CRITICAL:
- Rank by ICP fit — closest matches first
- ONLY keep decision-makers with purchasing authority
- Every lead MUST have summary, reason, and score fields
- "score" is 0-100 ICP fit score: 90+ = perfect match, 70-89 = strong, 50-69 = moderate, <50 = weak
- Score based on: title seniority, company relevance to ICP, industry alignment, location match
- Preserve ALL Apollo data exactly (linkedin, email, photo_url) — do NOT modify URLs`,
        },
        {
          role: "user",
          content: `ICP: ${args.icp_summary}\n\nApollo Results:\n${JSON.stringify(apolloLeads.slice(0, 30))}`,
        },
      ],
    }),
  });
  const aiData = await aiRes.json();
  const aiText = aiData?.choices?.[0]?.message?.content || "";
  try {
    const cleaned = aiText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return (parsed.leads || []).slice(0, extractLimit).map((l: any) => ({ ...l, linkedin: validLinkedIn(l.linkedin) }));
  } catch {
    console.error("AI scoring parse failed, returning raw Apollo results");
    return apolloLeads.slice(0, extractLimit).map((l) => ({
      ...l,
      summary: `${l.title || "Professional"} at ${l.company || "Unknown"}`,
      reason: "Matched ICP criteria via Apollo search",
      score: 70,
      is_decision_maker: true,
    }));
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

    // Check if any user message contains a URL — scrape it and inject context
    const enrichedMessages = [...messages];
    const urlRe = /https?:\/\/[^\s]+|[a-z0-9-]+\.[a-z]{2,}/i;
    const firstUserMsg = messages.find((m: any) => m.role === "user");

    if (firstUserMsg) {
      const urlMatch = firstUserMsg.content.match(urlRe);
      if (urlMatch) {
        try {
          const siteContent = await scrapePage(urlMatch[0]);
          if (siteContent) {
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
    const aiRes = await fetch(AI_URL, {
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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI call failed: ${status}`);
    }

    // Collect stream to detect tool calls
    const reader = aiRes.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    const toolCallChunks: Record<number, { name: string; args: string }> = {};
    let hasToolCall = false;
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

    if (hasToolCall) {
      const toolCalls = Object.values(toolCallChunks);
      let nichesToEmit: any[] = [];
      let leadSearchArgs: any = null;
      const actionEvents: any[] = [];

      for (const tc of toolCalls) {
        if (tc.name === "register_niches") {
          try { nichesToEmit = JSON.parse(tc.args).niches || []; } catch {}
        }
        if (tc.name === "run_lead_search") {
          try { leadSearchArgs = JSON.parse(tc.args); } catch {}
        }
        if (tc.name === "update_targeting") {
          try {
            const args = JSON.parse(tc.args);
            actionEvents.push({ type: "action", action: "update_targeting", products: args.products || [], personas: args.personas || [], auto_generate: !!args.auto_generate });
          } catch {}
        }
        if (tc.name === "generate_leads") {
          actionEvents.push({ type: "action", action: "generate_leads" });
        }
        if (tc.name === "reset_targeting") {
          actionEvents.push({ type: "action", action: "reset_targeting" });
        }
        if (tc.name === "change_location") {
          try {
            const args = JSON.parse(tc.args);
            actionEvents.push({ type: "action", action: "change_location", location: args.location });
          } catch {}
        }
        if (tc.name === "draft_email") {
          try {
            const args = JSON.parse(tc.args);
            actionEvents.push({ type: "action", action: "draft_email", lead_name: args.lead_name });
          } catch {}
        }
      }

      // register_niches only — stream text + niches
      if (!leadSearchArgs) {
        let normalizedContent = formatAssistantResponse(fullContent);
        if (!normalizedContent) {
          try {
            const followUpMessages = [
              { role: "system", content: SYSTEM_PROMPT },
              ...enrichedMessages,
              { role: "assistant", content: null, tool_calls: toolCalls.map((tc, i) => ({ id: `call_${i}`, type: "function", function: { name: tc.name, arguments: tc.args } })) },
              ...toolCalls.map((tc, i) => ({ role: "tool", tool_call_id: `call_${i}`, content: JSON.stringify({ success: true }) })),
              { role: "system", content: "REMINDER: You MUST end your response with clickable options in [[Option A|Option B|Option C]] format. Do NOT use numbered lists." },
            ];
            const followUp = await fetch(AI_URL, {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: followUpMessages, tool_choice: "none" }),
            });
            if (followUp.ok) {
              const d = await followUp.json();
              normalizedContent = formatAssistantResponse(d?.choices?.[0]?.message?.content || "");
            }
          } catch {}
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            for (const evt of actionEvents) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`));
            }
            if (nichesToEmit.length > 0) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "niches", niches: nichesToEmit })}\n\n`));
            }
            if (normalizedContent) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: normalizedContent } }] })}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });
        return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
      }

      // Lead search flow
      console.log("Executing lead search:", JSON.stringify(leadSearchArgs).slice(0, 300));
      const apolloKey = Deno.env.get("APOLLO_API_KEY") || null;
      const leads = await executeLeadSearch(leadSearchArgs, LOVABLE_API_KEY, apolloKey);

      const nicheTag = (leadSearchArgs.icp_summary || "General").replace(/[^\w\s,&-]/g, "").trim().slice(0, 80);
      for (const lead of leads) lead.niche_tag = nicheTag;

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          if (nichesToEmit.length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "niches", niches: nichesToEmit })}\n\n`));
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: "🔍 Searching for decision-makers matching your ICP...\n\n" } }] })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "leads", leads })}\n\n`));

          const summaryContent = leads.length > 0
            ? `Found **${leads.length} decision-makers** with LinkedIn profiles matching your ICP! 🎉\n\nWhat would you like to do next?\n\n[[Find more leads|Refine search|Search another region]]`
            : "I couldn't find matching decision-makers this time. Let's try:\n\n[[Broaden criteria|Try different industries|Search another region]]";

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: summaryContent } }] })}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    // No tool call — stream formatted text
    const normalizedContent = formatAssistantResponse(fullContent);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: normalizedContent } }] })}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (error) {
    console.error("leadgen-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
