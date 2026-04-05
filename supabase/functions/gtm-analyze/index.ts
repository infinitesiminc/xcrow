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
): Promise<any[]> {
  const APOLLO_API_KEY = Deno.env.get("APOLLO_API_KEY");
  if (!APOLLO_API_KEY) {
    console.warn("APOLLO_API_KEY not set — skipping people search");
    return [];
  }

  try {
    const searchBody: Record<string, unknown> = {
      person_titles: titles,
      per_page: 10,
      page: 1,
      person_seniorities: ["director", "vp", "c_suite", "owner"],
    };

    if (companyDomains.length > 0) {
      searchBody.q_organization_domains = companyDomains.join("\n");
    }

    const searchRes = await fetch("https://api.apollo.io/api/v1/mixed_people/api_search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": APOLLO_API_KEY },
      body: JSON.stringify(searchBody),
    });

    if (!searchRes.ok) {
      console.error("Apollo search failed:", searchRes.status);
      return [];
    }

    const searchData = await searchRes.json();
    const partialPeople = searchData.people || [];
    if (partialPeople.length === 0) return [];

    const details = partialPeople.slice(0, 10).map((p: any) => ({ id: p.id })).filter((d: any) => d.id);
    let enrichedPeople = partialPeople;

    if (details.length > 0) {
      try {
        const enrichRes = await fetch("https://api.apollo.io/api/v1/people/bulk_match", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Api-Key": APOLLO_API_KEY },
          body: JSON.stringify({ details, reveal_personal_emails: false }),
        });
        if (enrichRes.ok) {
          const enrichData = await enrichRes.json();
          if (enrichData.people?.length) enrichedPeople = enrichData.people;
        }
      } catch (e) {
        console.warn("Apollo bulk_match error:", e);
      }
    }

    return enrichedPeople.map((p: any) => {
      const name = p.name || (p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : (p.first_name || "Unknown"));
      const orgName = p.organization?.name || p.organization_name || "";
      const linkedinUrl = p.linkedin_url || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(name + " " + orgName)}`;
      return {
        name,
        title: p.title || "",
        company: orgName,
        linkedin_url: linkedinUrl,
        city: p.city || null,
        state: p.state || null,
        email: p.email || null,
        headline: p.headline || "",
        photo_url: p.photo_url || null,
      };
    });
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
  const cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

/* ── Main handler ── */

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { stepId, company, previousResults } = await req.json();
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

Be thorough — include every distinct product, add-on, or platform module. Assign sequential IDs: P1, P2, P3...`,
        `Company: ${company.name}
Website: ${company.website}
Description: ${company.description}
Industry: ${company.industry}
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
      const customersJSON = prev["customers"]?.structured;
      const icpJSON = prev["icp-buyers"]?.structured;

      // Collect customer domains for Apollo search
      const allCompanies = [
        ...(customersJSON?.customers || []),
        ...(customersJSON?.conquest_targets || []),
      ];
      const customerDomains = allCompanies
        .map((c: any) => c.domain)
        .filter(Boolean)
        .slice(0, 15);

      // Collect buyer titles from ICP mappings
      const mappings = icpJSON?.mappings || [];
      const titles = [...new Set(
        mappings.flatMap((m: any) => [m.dm?.title, m.champion?.title]).filter(Boolean)
      )].slice(0, 8) as string[];

      if (titles.length === 0) {
        titles.push("VP Marketing", "VP Sales", "CTO", "VP Engineering", "Head of Product");
      }

      console.log("Apollo search — domains:", customerDomains.length, "titles:", titles.length);
      const people = await searchApolloAtCompanies(titles, customerDomains);

      // Map each person to a product + role using AI
      if (people.length > 0) {
        const peopleList = people.map((p: any, i: number) =>
          `${i + 1}. ${p.name} — ${p.title} at ${p.company} (${p.city || ""})\n   LinkedIn: ${p.linkedin_url}\n   Email: ${p.email || "N/A"}`
        ).join("\n");

        const raw = await callAI(LOVABLE_API_KEY,
          `You are mapping real people to the GTM tree. Each person works at a company that BUYS FROM or COMPETES WITH ${company.name}.

Map each person to:
- Which product (P1, P2...) they relate to
- Which vertical they're in
- Whether they're a Decision Maker or Champion
- Whether they're at a customer or conquest target

Return ONLY valid JSON:
{
  "leads": [
    {
      "name": "Jane Smith",
      "title": "VP Marketing",
      "company": "Canva",
      "linkedin_url": "https://linkedin.com/in/...",
      "email": "jane@canva.com",
      "photo_url": null,
      "product_id": "P1",
      "product_name": "Marketing Hub",
      "vertical": "SaaS / B2B Tech",
      "role": "dm",
      "type": "customer",
      "competitor_using": null
    }
  ]
}

role must be "dm" or "champion".
type must be "customer" or "conquest".
If conquest, set competitor_using to the competitor name.
Do NOT invent people — only map the real data provided.`,
          `${company.name}'s products:
${JSON.stringify((prev["products"]?.structured?.products || []).map((p: any) => ({ id: p.id, name: p.name })), null, 2)}

ICP mappings:
${JSON.stringify(mappings.map((m: any) => ({ product_id: m.product_id, vertical: m.vertical, dm: m.dm?.title, champion: m.champion?.title, customers: m.known_customers })), null, 2)}

Customer companies: ${allCompanies.map((c: any) => `${c.name} (${c.type}${c.uses_competitor ? ", uses " + c.uses_competitor : ""})`).join(", ")}

Real people found:
${peopleList}`
        );

        try {
          const parsed = extractJSON(raw);
          return respond({ structured: parsed, content: raw, reasoning: `Found ${parsed.leads?.length || 0} mapped leads` });
        } catch {
          return respond({ structured: { leads: people.map((p: any) => ({ ...p, product_id: "P1", vertical: "Unknown", role: "dm", type: "customer" })) }, content: raw, reasoning: "Partial mapping" });
        }
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
