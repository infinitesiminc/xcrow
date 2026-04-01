const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert lead generation consultant. Your job is to guide the user through building a precise Ideal Customer Profile (ICP) to find the highest-quality leads that convert fast.

## Your Process (follow these phases IN ORDER):

### Phase 1: Business Understanding
- Ask for their company website URL (if not already provided)
- Once you have it, acknowledge what the business does based on the scraped content provided
- Confirm your understanding is correct

### Phase 2: Service Area Detection (do this BEFORE lead type strategy)
Based on the website content and business type, determine whether the business is:
- **Location-restricted**: Service requires physical presence or is limited to a geographic area (e.g., mobile notary, local plumber, real estate agent, in-person consulting, local delivery). Indicators: city/region mentioned on site, "serving [area]", "mobile", physical service delivery.
- **Globally serviceable**: Product or service can be delivered remotely/digitally anywhere (e.g., SaaS, online courses, digital agency, e-commerce, remote consulting).
- **Hybrid**: Has a local base but can serve broader areas (e.g., law firm that does remote consultations, regional wholesaler).

Tell the user what you detected: "Based on your website, it looks like your business is **[location-restricted to X / globally serviceable / hybrid]**." Then confirm with them. This classification drives Phase 4 targeting — location-restricted businesses should focus leads within their service radius, while global businesses can target anywhere.

### Phase 3: Lead Type Strategy (CRITICAL — guide the user here)
Based on their business AND service area, PROACTIVELY recommend the lead types most likely to produce quick deal turnaround. Use your industry knowledge to advise:
- **For location-restricted service businesses** (notary, escrow, title, legal, etc.): Recommend targeting independent/boutique firms in their service area over large corporates — they have less bureaucracy, faster decision-making, and more personalized workflows. Emphasize proximity and local network effects.
- **For globally serviceable businesses** (SaaS, digital products, remote services): Recommend targeting by industry vertical and company size rather than geography. Focus on SMBs and startups over enterprise — shorter sales cycles, fewer stakeholders.
- **For B2B SaaS/tech**: Recommend SMBs and startups over enterprise — shorter sales cycles, fewer stakeholders, faster procurement.
- **For agencies/consultants**: Recommend founder-led companies where the decision-maker IS the contact.
- Present 2-3 lead type options with pros/cons for speed, then ask the user to pick or refine.
- Highlight factors that accelerate turnaround: cash buyers, digital-first companies, companies using modern platforms, responsive communicators.

### Phase 4: Buyer Persona  
- Ask who their ideal buyers are: job titles, roles, decision-maker level
- Ask about target company size (startup, SMB, mid-market, enterprise)
- Ask about target industries or verticals
- Suggest specific job titles and company types based on the lead type strategy chosen

### Phase 5: Targeting
- Ask about target geography (cities, states, countries)
- Ask about any other qualifying criteria (budget, urgency, tech stack, etc.)

### Phase 5: Confirmation
- Summarize the complete ICP in a clear bullet list including the chosen lead type strategy
- Ask the user to confirm or adjust
- Once confirmed, call the run_lead_search tool

## Rules:
- ALWAYS format options as a numbered list using this EXACT pattern — no exceptions:
  "1. **Option Name** — description"
  "2. **Option Name** — description"
  "3. **Option Name** — description"
  Never use bullet points, dashes, or unnumbered bold headers for options. The user must be able to reply with just a number.
- Ask ONE question at a time (max 2 related sub-questions)
- Keep responses concise and conversational (2-4 sentences max)
- Be encouraging and helpful
- ALWAYS proactively advise on which lead types close deals fastest — don't just ask, GUIDE
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

function normalizeResponseText(content: string): string {
  if (!content) return content;
  return content
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
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

async function enrichWithApollo(
  leads: any[],
  apolloKey: string,
): Promise<any[]> {
  const enriched = [];
  for (const lead of leads) {
    // Skip if already has email and phone
    if (lead.email && lead.phone) {
      enriched.push(lead);
      continue;
    }

    try {
      const body: Record<string, string> = {};
      if (lead.linkedin) {
        body.linkedin_url = lead.linkedin;
      } else if (lead.name && lead.company) {
        const parts = lead.name.trim().split(/\s+/);
        body.first_name = parts[0] || "";
        body.last_name = parts.slice(1).join(" ") || "";
        body.organization_name = lead.company;
      } else {
        enriched.push(lead);
        continue;
      }

      const res = await fetch("https://api.apollo.io/api/v1/people/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "X-Api-Key": apolloKey,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const person = data?.person;
        if (person) {
          lead.email = lead.email || person.email || null;
          lead.phone = lead.phone || person.phone_numbers?.[0]?.sanitized_number || person.organization?.phone || null;
          lead.linkedin = lead.linkedin || person.linkedin_url || null;
          lead.title = lead.title || person.title || null;
          lead.company = lead.company || person.organization?.name || null;
        }
      } else {
        console.warn("Apollo match failed:", res.status, await res.text());
      }
    } catch (e) {
      console.error("Apollo enrichment error for", lead.name, e);
    }

    enriched.push(lead);
  }
  return enriched;
}

async function enrichWithHunter(leads: any[], hunterKey: string): Promise<any[]> {
  for (const lead of leads) {
    if (lead.email) continue; // already has email
    if (!lead.name || !lead.company) continue;

    try {
      // Try domain-based email finder
      // First get company domain
      let domain = "";
      if (lead.website) {
        domain = lead.website.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      } else {
        // Use Hunter's domain search to find company domain
        const domainRes = await fetch(
          `https://api.hunter.io/v2/domain-search?company=${encodeURIComponent(lead.company)}&limit=1&api_key=${hunterKey}`
        );
        if (domainRes.ok) {
          const domainData = await domainRes.json();
          domain = domainData?.data?.domain || "";
        }
      }

      if (!domain) continue;

      const parts = lead.name.trim().split(/\s+/);
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";

      const finderRes = await fetch(
        `https://api.hunter.io/v2/email-finder?domain=${encodeURIComponent(domain)}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&api_key=${hunterKey}`
      );

      if (finderRes.ok) {
        const finderData = await finderRes.json();
        const email = finderData?.data?.email;
        const score = finderData?.data?.score || 0;
        if (email && score >= 50) {
          lead.email = email;
          lead.email_confidence = score;
          console.log(`Hunter found email for ${lead.name}: ${email} (score: ${score})`);
        }
        // Also grab phone if available
        if (!lead.phone && finderData?.data?.phone_number) {
          lead.phone = finderData.data.phone_number;
        }
      }
    } catch (e) {
      console.error("Hunter enrichment error for", lead.name, e);
    }
  }
  return leads;
}

async function scrapeTeamPages(website: string, firecrawlKey: string): Promise<string> {
  const teamPaths = ["/about", "/team", "/about-us", "/our-team", "/people", "/leadership"];
  let teamContent = "";
  
  for (const path of teamPaths.slice(0, 3)) {
    try {
      const url = website.replace(/\/$/, "") + path;
      const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
      });
      const data = await res.json();
      const md = data?.data?.markdown || data?.markdown || "";
      if (md.length > 100) {
        teamContent += `\n[TEAM PAGE: ${url}]\n${md.slice(0, 2000)}\n`;
        break; // found a good team page
      }
    } catch {}
  }
  return teamContent;
}

async function searchGoogleMaps(queries: string[], firecrawlKey: string): Promise<any[]> {
  const results: any[] = [];
  for (const query of queries.slice(0, 2)) {
    try {
      const res = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: `${query} site:google.com/maps OR site:yelp.com phone email`, limit: 5 }),
      });
      const data = await res.json();
      results.push(...(data?.data || []));
    } catch {}
  }
  return results;
}

async function executeLeadSearch(
  args: { website: string; icp_summary: string; search_queries: string[] },
  firecrawlKey: string,
  lovableKey: string,
  apolloKey: string | null,
  hunterKey: string | null,
): Promise<any[]> {
  let formattedUrl = args.website.trim();
  if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

  // 1. Scrape target company team pages for real names
  console.log("Scraping team pages...");
  const teamContent = await scrapeTeamPages(formattedUrl, firecrawlKey);

  // 2. Web search for leads
  const allResults: any[] = [];
  for (const query of args.search_queries.slice(0, 4)) {
    try {
      const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: `${query} contact email linkedin`, limit: 5 }),
      });
      const searchData = await searchRes.json();
      allResults.push(...(searchData?.data || []));
    } catch (e) {
      console.error("Search failed:", query, e);
    }
  }

  // 3. Google Maps / local listings search
  console.log("Searching local listings...");
  const mapsQueries = args.search_queries.slice(0, 2).map(q => q + " phone contact");
  const mapsResults = await searchGoogleMaps(mapsQueries, firecrawlKey);

  // 4. AI extraction with all sources combined
  const searchSummary = allResults
    .slice(0, 12)
    .map((r: any) => `URL: ${r.url}\nTitle: ${r.title || ""}\nDesc: ${r.description || ""}\nContent: ${(r.markdown || "").slice(0, 500)}`)
    .join("\n---\n");

  const mapsSummary = mapsResults
    .slice(0, 6)
    .map((r: any) => `URL: ${r.url}\nTitle: ${r.title || ""}\nDesc: ${r.description || ""}\nContent: ${(r.markdown || "").slice(0, 400)}`)
    .join("\n---\n");

  const combinedContext = `## Web Search Results:\n${searchSummary}\n\n## Company Team Page:\n${teamContent}\n\n## Local/Maps Listings:\n${mapsSummary}`;

  const extractRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `Extract up to 5 real leads from the combined search results, team pages, and local listings. Return JSON only (no markdown fences):
{"leads":[{"name":"Full Name","title":"Job Title","company":"Company Name","email":"email or null","phone":"phone or null","linkedin":"url or null","twitter":"url or null","website":"company or personal website or null","source":"where you found this lead (team page, web search, maps listing, etc.)","summary":"1-2 sentence summary of who this person is and their background","reason":"1-2 sentence explanation of why they are a strong lead for this ICP"}]}
Only include REAL people with verifiable details. Prioritize leads where you found phone numbers or emails directly. Every lead MUST have summary and reason fields.`,
        },
        {
          role: "user",
          content: `ICP: ${args.icp_summary}\n\n${combinedContext}`,
        },
      ],
    }),
  });

  const extractData = await extractRes.json();
  const extractText = extractData?.choices?.[0]?.message?.content || "";

  try {
    const cleaned = extractText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    let leads = (parsed.leads || []).slice(0, 5);

    // Cross-check leads against Google Maps listings for verified phone/address
    console.log("Cross-checking", leads.length, "leads against Google Maps...");
    for (const lead of leads) {
      if (lead.phone && lead.email) continue;
      if (!lead.company) continue;
      try {
        const mapsQuery = `${lead.company} ${args.search_queries[0]?.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/)?.[0] || ""} phone address`;
        const res = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query: `"${lead.company}" phone number address site:google.com/maps OR site:yelp.com OR site:bbb.org`, limit: 3 }),
        });
        const data = await res.json();
        const results = data?.data || [];
        
        // Extract phone numbers and addresses from results
        const combined = results.map((r: any) => `${r.title || ""} ${r.description || ""} ${(r.markdown || "").slice(0, 500)}`).join(" ");
        
        // Phone regex: matches US phone formats
        if (!lead.phone) {
          const phoneMatch = combined.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
          if (phoneMatch) {
            lead.phone = phoneMatch[0];
            lead.phone_source = "google_maps";
            console.log(`Maps: found phone for ${lead.company}: ${phoneMatch[0]}`);
          }
        }
        
        // Extract address if present
        if (!lead.address) {
          const addressMatch = combined.match(/\d+\s+[A-Z][a-zA-Z\s]+(?:St|Ave|Blvd|Dr|Rd|Ln|Way|Ct|Pl|Pkwy|Hwy)[.,]?\s*(?:Suite|Ste|#|Unit)?\s*\d*[.,]?\s*[A-Z][a-z]+[.,]?\s*[A-Z]{2}\s*\d{5}/);
          if (addressMatch) {
            lead.address = addressMatch[0];
          }
        }

        // Extract website if not present
        if (!lead.website) {
          const urlMatch = combined.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+\.[a-z]{2,})/i);
          if (urlMatch && !urlMatch[0].includes("google") && !urlMatch[0].includes("yelp") && !urlMatch[0].includes("bbb")) {
            lead.website = urlMatch[0];
          }
        }
      } catch (e) {
        console.error("Maps cross-check failed for", lead.company, e);
      }
    }

    // Enrich with Apollo for verified email/phone
    if (apolloKey && leads.length > 0) {
      console.log("Enriching", leads.length, "leads with Apollo People Match...");
      leads = await enrichWithApollo(leads, apolloKey);
    }

    // Fallback: enrich remaining leads with Hunter.io
    if (hunterKey && leads.length > 0) {
      const needsEmail = leads.filter(l => !l.email).length;
      if (needsEmail > 0) {
        console.log("Enriching", needsEmail, "leads with Hunter.io...");
        leads = await enrichWithHunter(leads, hunterKey);
      }
    }

    // Filter: only return leads with at least email or phone
    const contactable = leads.filter((l: any) => l.email || l.phone);
    const dropped = leads.length - contactable.length;
    if (dropped > 0) {
      console.log(`Filtered out ${dropped} leads without email or phone. Keeping ${contactable.length}.`);
    }

    // If we lost too many, try Hunter domain-search on remaining companies for extra contacts
    if (contactable.length < 3 && hunterKey) {
      const companiesWithoutContacts = leads
        .filter((l: any) => !l.email && !l.phone && l.company)
        .slice(0, 3);
      for (const lead of companiesWithoutContacts) {
        try {
          // Try Hunter domain search for company-level emails
          let domain = lead.website?.replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "";
          if (!domain) {
            const domainRes = await fetch(
              `https://api.hunter.io/v2/domain-search?company=${encodeURIComponent(lead.company)}&limit=3&api_key=${hunterKey}`
            );
            if (domainRes.ok) {
              const dd = await domainRes.json();
              domain = dd?.data?.domain || "";
              // Pick the first person from domain search results
              const emails = dd?.data?.emails || [];
              if (emails.length > 0) {
                const top = emails[0];
                lead.email = top.value;
                lead.email_confidence = top.confidence;
                lead.name = lead.name || `${top.first_name || ""} ${top.last_name || ""}`.trim() || lead.name;
                lead.title = lead.title || top.position || null;
                console.log(`Hunter domain-search fallback: ${lead.email} for ${lead.company}`);
              }
            }
          }
        } catch (e) {
          console.error("Hunter domain fallback error for", lead.company, e);
        }
        if (lead.email || lead.phone) contactable.push(lead);
      }
    }

    if (contactable.length === 0) {
      console.log("No leads with contact info found after all enrichment.");
    }

    return contactable;
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

      const apolloKey = Deno.env.get("APOLLO_API_KEY") || null;
      const hunterKey = Deno.env.get("HUNTER_API_KEY") || null;
      const leads = await executeLeadSearch(args, firecrawlKey, LOVABLE_API_KEY, apolloKey, hunterKey);

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
            ? `Found **${leads.length} leads** with verified contact details matching your ICP! 🎉\n\nEvery lead includes at least an email or phone number.\n\nWhat would you like to do next?\n\n1. **Send to WhatsApp** — Get these leads delivered to your phone instantly\n2. **Refine search** — Adjust criteria for better matches\n3. **Search another region** — Expand to a new geography`
            : "I couldn't find leads with verified contact info this time. Let's try a different approach:\n\n1. **Broaden criteria** — Widen the job titles or company size\n2. **Try different industries** — Target adjacent verticals\n3. **Search another region** — Try a different city or state";

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

    // No tool call — enforce numbered options, then stream as SSE
    const normalizedContent = formatAssistantResponse(fullContent);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const normalizedMsg = { choices: [{ delta: { content: normalizedContent } }] };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(normalizedMsg)}\n\n`));
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
