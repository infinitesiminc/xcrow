import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/* ── Firecrawl: scrape a company website for customer evidence ── */

async function scrapeForCustomers(website: string): Promise<string> {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) {
    console.warn("FIRECRAWL_API_KEY not set — skipping customer scrape");
    return "";
  }

  const baseUrl = website.startsWith("http") ? website : `https://${website}`;

  let targetUrls: string[] = [];
  try {
    const mapRes = await fetch("https://api.firecrawl.dev/v1/map", {
      method: "POST",
      headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url: baseUrl, search: "customers case studies testimonials", limit: 20 }),
    });
    if (mapRes.ok) {
      const mapData = await mapRes.json();
      const allLinks: string[] = mapData.links || [];
      const customerPatterns = /customer|case.?stud|testimonial|success.?stor|partner|who.?use|trust|logo|client/i;
      targetUrls = allLinks.filter((u: string) => customerPatterns.test(u)).slice(0, 3);
    }
  } catch (e) {
    console.warn("Firecrawl map error:", e);
  }

  targetUrls.unshift(baseUrl);
  targetUrls = [...new Set(targetUrls)].slice(0, 4);

  const allContent: string[] = [];
  for (const url of targetUrls) {
    try {
      const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
      });
      if (scrapeRes.ok) {
        const scrapeData = await scrapeRes.json();
        const md = scrapeData.data?.markdown || scrapeData.markdown || "";
        if (md) allContent.push(`--- Source: ${url} ---\n${md.slice(0, 3000)}`);
      }
    } catch (e) {
      console.warn("Scrape error for", url, e);
    }
  }

  return allContent.join("\n\n");
}

/* ── Apollo: search for DMs at specific companies ── */

async function searchApolloAtCompanies(
  titles: string[],
  companyDomains: string[],
  page = 1,
): Promise<any[]> {
  const APOLLO_API_KEY = Deno.env.get("APOLLO_API_KEY");
  if (!APOLLO_API_KEY) {
    console.warn("APOLLO_API_KEY not set — skipping people search");
    return [];
  }

  try {
    const searchBody: Record<string, unknown> = {
      person_titles: titles,
      per_page: 25,
      page,
      person_seniorities: ["director", "vp", "c_suite", "owner", "manager"],
    };

    if (companyDomains.length > 0) {
      searchBody.organization_domains = companyDomains;
    }

    console.log("Apollo search body:", JSON.stringify(searchBody));

    const searchRes = await fetch("https://api.apollo.io/api/v1/mixed_people/api_search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": APOLLO_API_KEY },
      body: JSON.stringify(searchBody),
    });

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error("Apollo search failed:", searchRes.status, errText);
      return [];
    }

    const searchData = await searchRes.json();
    const partialPeople = searchData.people || [];
    console.log("Apollo search returned:", partialPeople.length, "people");
    if (partialPeople.length > 0) {
      const p0 = partialPeople[0];
      console.log("Sample person keys:", Object.keys(p0).join(", "));
      console.log("Sample person data:", JSON.stringify({
        id: p0.id, name: p0.name, first_name: p0.first_name, last_name: p0.last_name,
        linkedin_url: p0.linkedin_url, title: p0.title,
        org: p0.organization?.name || p0.organization_name,
      }));
    }
    if (partialPeople.length === 0) return [];

    // Enrich via individual people/match calls (bulk_match requires special scope)
    const enrichedPeople: any[] = [];
    const toEnrich = partialPeople.slice(0, 10).filter((p: any) => p.id);

    for (const person of toEnrich) {
      try {
        const enrichRes = await fetch(`https://api.apollo.io/api/v1/people/match`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Api-Key": APOLLO_API_KEY },
          body: JSON.stringify({ id: person.id }),
        });
        if (enrichRes.ok) {
          const enrichData = await enrichRes.json();
          if (enrichData.person) {
            enrichedPeople.push(enrichData.person);
          }
        } else {
          console.warn("Apollo match failed for", person.id, "status:", enrichRes.status);
          // If individual match also fails, the API key may lack enrichment scope
          if (enrichRes.status === 400 || enrichRes.status === 403) {
            console.error("Apollo enrichment not available — API key may lack scope");
            break;
          }
        }
      } catch (e) {
        console.warn("Apollo match error:", e);
      }
    }

    console.log("Apollo enriched:", enrichedPeople.length, "of", toEnrich.length);
    if (enrichedPeople.length > 0) {
      console.log("Enriched sample:", JSON.stringify({
        name: enrichedPeople[0].name,
        linkedin_url: enrichedPeople[0].linkedin_url,
        title: enrichedPeople[0].title,
      }));
    }

    // Use enriched people if available, otherwise fallback to partial
    const finalPeople = enrichedPeople.length > 0 ? enrichedPeople : partialPeople;

    const results = finalPeople
      .filter((p: any) => p.linkedin_url && p.linkedin_url.includes("/in/"))
      .map((p: any) => {
        const name = p.name || (p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : (p.first_name || "Unknown"));
        return {
          name,
          title: p.title || "",
          company: p.organization?.name || p.organization_name || "",
          linkedin_url: p.linkedin_url,
          city: p.city || null,
          state: p.state || null,
          email: p.email || null,
          headline: p.headline || "",
          photo_url: p.photo_url || null,
        };
      });

    console.log("Final leads with /in/ URLs:", results.length, "of", finalPeople.length, "total");
    return results;
  } catch (e) {
    console.error("Apollo search error:", e);
    return [];
  }
}

/* ── AI call helper ── */

async function callAI(apiKey: string, system: string, user: string, model = "google/gemini-2.5-flash") {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("RATE_LIMITED");
    if (response.status === 402) throw new Error("CREDITS_EXHAUSTED");
    throw new Error("AI request failed");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function extractJSON(raw: string): any {
  let cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();

  // Find JSON boundaries
  const start = cleaned.search(/[\{\[]/);
  const isArray = start !== -1 && cleaned[start] === '[';
  const end = cleaned.lastIndexOf(isArray ? ']' : '}');

  if (start === -1 || end === -1) {
    throw new Error("No JSON found in AI response. The company may lack sufficient public information.");
  }

  cleaned = cleaned.substring(start, end + 1);

  try {
    return JSON.parse(cleaned);
  } catch {
    cleaned = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, "");
    return JSON.parse(cleaned);
  }
}

/* ── Main handler ── */

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { stepId, company, previousResults } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prev = previousResults || {};

    /* ═══════════════════════════════════════════════════
       STEP 1: Company DNA + Product Lines
       Returns: { company_summary, products: [{ id, name, description, target_user, pricing, competitors }] }
       ═══════════════════════════════════════════════════ */
    if (stepId === "products") {
      const raw = await callAI(LOVABLE_API_KEY,
        `You are a GTM product analyst. Analyze the company and map ALL product lines.

CRITICAL: You MUST always return valid JSON. Never refuse. If you have limited information, infer from the company name and website URL. Make your best educated guess — partial data is fine.

Return ONLY valid JSON (no markdown, no wrapping):
{
  "company_summary": "One sentence: what they do, business model, market position",
  "products": [
    {
      "id": "P1",
      "name": "Product Name",
      "description": "What it does in one sentence",
      "target_user": "Who buys it",
      "pricing_model": "freemium / subscription / usage / enterprise",
      "competitors": ["Competitor A", "Competitor B"]
    }
  ]
}

Be thorough — include every distinct product line or platform module.
If you cannot find specific products, infer the primary service from the company name and domain.

IMPORTANT CONSOLIDATION RULES:
- Tier/plan variants of the SAME product are ONE product (e.g. "Claude" not "Claude Opus + Claude Sonnet + Claude Haiku")
- Pricing tiers (Free, Pro, Enterprise) are NOT separate products — mention them in pricing_model instead
- Model versions (GPT-4, GPT-3.5) or size variants (Small, Medium, Large) are NOT separate products
- Add-ons that only work with a parent product are NOT separate products — mention them in the parent's description
- Ask: "Would a sales team pitch this separately to a different buyer?" — if no, consolidate

Assign sequential IDs: P1, P2, P3...`,
        `Company: ${company.name}
Website: ${company.website}
Description: ${company.description || "Not available — infer from name and URL"}
Industry: ${company.industry || "Unknown — infer from name and URL"}
Employees: ${company.employee_range || "Unknown"}
Funding: ${company.funding_stage || "Unknown"}
HQ: ${company.headquarters || "Unknown"}`
      );

      const parsed = extractJSON(raw);
      return respond({ structured: parsed, content: raw, reasoning: "Product map extracted" });
    }

    /* ═══════════════════════════════════════════════════
       STEP 2: Named Customers + Competitors (Firecrawl)
       Returns: { customers: [{ name, domain, industry, product_id, evidence }], competitors_customers: [...] }
       ═══════════════════════════════════════════════════ */
    if (stepId === "customers") {
      const productsJSON = prev["products"]?.structured;
      const scrapedContent = await scrapeForCustomers(company.website || company.name);

      const raw = await callAI(LOVABLE_API_KEY,
        `You are a GTM researcher extracting named customers AND competitor intelligence.

Given scraped website content and product lines, extract:
1. Named customers — real companies found on the website (case studies, testimonials, logos)
2. Competitor customers — companies known to use the competitors listed in the product map (infer from industry knowledge)

Return ONLY valid JSON:
{
  "customers": [
    {
      "name": "Shopify",
      "domain": "shopify.com",
      "industry": "E-commerce",
      "product_ids": ["P1"],
      "evidence": "Case study: 40% faster checkout",
      "type": "customer"
    }
  ],
  "conquest_targets": [
    {
      "name": "Basecamp",
      "domain": "basecamp.com",
      "industry": "SaaS",
      "uses_competitor": "Competitor Name",
      "product_ids": ["P2"],
      "switch_angle": "Lacks enterprise SSO",
      "type": "conquest"
    }
  ]
}

Rules:
- Only include REAL companies, not generic descriptions
- Infer domain from company name if not explicit
- Map each customer to specific product IDs (P1, P2...)
- For conquest targets, use your knowledge of which companies use the listed competitors
- Include at least 3-5 conquest targets if competitors are known`,
        `Company: ${company.name}
Website: ${company.website}
Industry: ${company.industry}

Product lines:
${JSON.stringify(productsJSON?.products || [], null, 2)}

Scraped website content:
${scrapedContent || "No content could be scraped."}`
      );

      const parsed = extractJSON(raw);
      return respond({ structured: parsed, content: raw, reasoning: "Customer and competitor discovery complete" });
    }

    /* ═══════════════════════════════════════════════════
       STEP 3: ICP Tree + Buyer Mapping
       Returns: { mappings: [{ product_id, vertical, segment, dm_title, champion_title, customer_names }] }
       ═══════════════════════════════════════════════════ */
    if (stepId === "icp-buyers") {
      const productsJSON = prev["products"]?.structured;
      const customersJSON = prev["customers"]?.structured;

      const raw = await callAI(LOVABLE_API_KEY,
        `You are an ICP and buyer mapping specialist.

Build a full ICP tree with buyer roles PER PRODUCT LINE. Ground it in real customer data where available.

Return ONLY valid JSON:
{
  "mappings": [
    {
      "product_id": "P1",
      "product_name": "Product Name",
      "vertical": "SaaS / B2B Tech",
      "segment": "Mid-market PLG companies (50-500 emp)",
      "dm": {
        "title": "VP Marketing",
        "seniority": "vp",
        "why_they_buy": "Needs to prove ROI on content spend",
        "outreach_channel": "LinkedIn + case study"
      },
      "champion": {
        "title": "Marketing Ops Manager",
        "seniority": "manager",
        "why_they_care": "Drowning in manual workflows",
        "outreach_channel": "Email + demo"
      },
      "known_customers": ["Canva", "Trello"]
    }
  ]
}

Rules:
- Each product should have 2-4 vertical mappings
- Each mapping must have both dm and champion
- Reference real customers in known_customers where they fit
- Be specific on titles — not "Senior Leader" but "VP of Engineering"`,
        `Company: ${company.name}
Industry: ${company.industry}

Products:
${JSON.stringify(productsJSON?.products || [], null, 2)}

Named customers:
${JSON.stringify(customersJSON?.customers || [], null, 2)}

Conquest targets:
${JSON.stringify(customersJSON?.conquest_targets || [], null, 2)}`
      );

      const parsed = extractJSON(raw);
      return respond({ structured: parsed, content: raw, reasoning: "ICP tree with buyer roles mapped" });
    }

    /* ═══════════════════════════════════════════════════
       STEP 4: LinkedIn Profiles (Apollo search)
       Returns: { leads: [{ name, title, company, linkedin_url, product_id, vertical, role, type }] }
       ═══════════════════════════════════════════════════ */
    if (stepId === "linkedin-profiles") {
      const generateMore = body.generateMore as { count?: number; productId?: string; vertical?: string | null; existingLeads?: string[] } | undefined;
      const requestedCount = generateMore?.count || 20;
      const existingNames = new Set((generateMore?.existingLeads || []).map((n: string) => n.toLowerCase()));

      const customersJSON = prev["customers"]?.structured;
      const icpJSON = prev["icp-buyers"]?.structured;

      const customers = customersJSON?.customers || [];
      const conquestTargets = customersJSON?.conquest_targets || [];
      const allCompanies = [...customers, ...conquestTargets];

      const customerDomains = customers.map((c: any) => c.domain).filter(Boolean).slice(0, 8);
      const conquestDomains = conquestTargets.map((c: any) => c.domain).filter(Boolean).slice(0, 8);

      // Collect buyer titles from ICP mappings
      const mappings = icpJSON?.mappings || [];
      let filteredMappings = mappings;
      if (generateMore?.vertical) {
        const vFilter = generateMore.vertical.toLowerCase();
        const vertMatches = mappings.filter((m: any) => m.vertical?.toLowerCase().includes(vFilter));
        if (vertMatches.length > 0) filteredMappings = vertMatches;
      }
      const titles = [...new Set(
        filteredMappings.flatMap((m: any) => [m.dm?.title, m.champion?.title]).filter(Boolean)
      )].slice(0, 8) as string[];

      if (titles.length === 0) {
        titles.push("VP Marketing", "VP Sales", "CTO", "VP Engineering", "Head of Product");
      }

      // Use page 2 when generating more to get fresh results
      const apolloPage = generateMore ? 2 : 1;

      // Search customer AND conquest domains separately to ensure both pools have leads
      console.log("Apollo search — customer domains:", customerDomains.length, "conquest domains:", conquestDomains.length, "titles:", titles.length, "page:", apolloPage);
      const [customerPeople, conquestPeople] = await Promise.all([
        customerDomains.length > 0 ? searchApolloAtCompanies(titles, customerDomains, apolloPage) : Promise.resolve([]),
        conquestDomains.length > 0 ? searchApolloAtCompanies(titles, conquestDomains, apolloPage) : Promise.resolve([]),
      ]);
      console.log("Apollo results — customer leads:", customerPeople.length, "conquest leads:", conquestPeople.length);
      let people = [...customerPeople, ...conquestPeople];

      // Filter out existing leads and limit to requested count
      if (existingNames.size > 0) {
        people = people.filter((p: any) => !existingNames.has(p.name?.toLowerCase()));
      }
      people = people.slice(0, requestedCount);

      // Map each person to a product + role using AI — but preserve Apollo's real data
      if (people.length > 0) {
        // Build a compact list for AI to classify (no URLs — AI only assigns product/role)
        const classifyList = people.map((p: any, i: number) =>
          `${i}: ${p.name} — ${p.title} at ${p.company}`
        ).join("\n");

        const raw = await callAI(LOVABLE_API_KEY,
          `Classify each person by index. They work at companies that BUY FROM or COMPETE WITH ${company.name}.

For each person (by index number), assign:
- product_id: which product (P1, P2...) they most relate to
- product_name: the product name
- vertical: which vertical they're in
- role: "dm" or "champion"
- type: "customer" or "conquest"
- competitor_using: if conquest, which competitor; else null

Return ONLY valid JSON array:
[
  { "idx": 0, "product_id": "P1", "product_name": "Product Name", "vertical": "SaaS", "role": "dm", "type": "customer", "competitor_using": null }
]`,
          `Products:
${JSON.stringify((prev["products"]?.structured?.products || []).map((p: any) => ({ id: p.id, name: p.name })), null, 2)}

ICP mappings:
${JSON.stringify(mappings.map((m: any) => ({ product_id: m.product_id, vertical: m.vertical, dm: m.dm?.title, champion: m.champion?.title })), null, 2)}

Companies: ${allCompanies.map((c: any) => `${c.name} (${c.type}${c.uses_competitor ? ", uses " + c.uses_competitor : ""})`).join(", ")}

People to classify:
${classifyList}`
        );

        // Merge AI classifications back onto real Apollo data
        let classifications: any[] = [];
        try { classifications = extractJSON(raw); } catch { /* use defaults */ }

        const leads = people.map((p: any, i: number) => {
          const cls = classifications.find((c: any) => c.idx === i) || {};
          return {
            name: p.name,
            title: p.title,
            company: p.company,
            linkedin_url: p.linkedin_url,
            email: p.email || null,
            photo_url: p.photo_url || null,
            product_id: cls.product_id || "P1",
            product_name: cls.product_name || "",
            vertical: cls.vertical || "Unknown",
            role: cls.role || "dm",
            type: cls.type || "customer",
            competitor_using: cls.competitor_using || null,
          };
        });

        return respond({ structured: { leads }, content: raw, reasoning: `Found ${leads.length} mapped leads with real LinkedIn profiles` });
      }

      return respond({
        structured: { leads: [] },
        content: `No profiles found. Searched ${customerDomains.length} domains for ${titles.join(", ")}.`,
        reasoning: "No Apollo results",
      });
    }

    return respond({ error: "Unknown stepId: " + stepId }, 400);
  } catch (e) {
    console.error("gtm-analyze error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "RATE_LIMITED") return respond({ error: "Rate limited — please try again." }, 429);
    if (msg === "CREDITS_EXHAUSTED") return respond({ error: "Credits exhausted." }, 402);
    return respond({ error: msg }, 500);
  }
});
