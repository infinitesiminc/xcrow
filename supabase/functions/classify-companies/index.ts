import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VERTICALS = [
  { id: 1, name: "CRM & Sales", keywords: ["crm", "sales", "lead", "pipeline", "outreach", "prospecting"] },
  { id: 2, name: "Project Management", keywords: ["project management", "task management", "agile", "scrum", "collaboration", "workflow"] },
  { id: 3, name: "Design & Creative Tools", keywords: ["design", "creative", "graphic", "ui/ux", "illustration", "video editing", "photo"] },
  { id: 4, name: "Accounting & Finance", keywords: ["accounting", "bookkeeping", "invoicing", "payroll", "tax", "financial management", "expense"] },
  { id: 5, name: "HR & Recruiting", keywords: ["hr", "human resources", "recruiting", "hiring", "talent", "ats", "staffing", "payroll", "hris"] },
  { id: 6, name: "Customer Support", keywords: ["customer support", "helpdesk", "ticketing", "customer service", "call center", "live chat"] },
  { id: 7, name: "Marketing & Analytics", keywords: ["marketing", "analytics", "seo", "email marketing", "advertising", "social media", "content"] },
  { id: 8, name: "DevTools & Infrastructure", keywords: ["developer tools", "devops", "infrastructure", "cloud", "monitoring", "ci/cd", "api", "deployment"] },
  { id: 9, name: "E-commerce & Payments", keywords: ["e-commerce", "ecommerce", "payments", "checkout", "storefront", "retail", "shopping"] },
  { id: 10, name: "Communication & Collaboration", keywords: ["communication", "messaging", "video conferencing", "collaboration", "chat", "meetings"] },
  { id: 11, name: "Legal Tech", keywords: ["legal", "law", "contract", "compliance", "regulatory", "e-signature"] },
  { id: 12, name: "Education & Learning", keywords: ["education", "learning", "edtech", "e-learning", "lms", "tutoring", "training"] },
  { id: 13, name: "Healthcare & Wellness Tech", keywords: ["healthcare", "health tech", "medical", "telemedicine", "ehr", "wellness", "clinical"] },
  { id: 14, name: "Real Estate & PropTech", keywords: ["real estate", "proptech", "property", "rental", "mortgage", "housing"] },
  { id: 15, name: "Cybersecurity", keywords: ["cybersecurity", "security", "infosec", "endpoint", "firewall", "threat detection", "identity"] },
  { id: 16, name: "Data & BI", keywords: ["data", "business intelligence", "analytics platform", "data warehouse", "etl", "data pipeline", "visualization", "reporting", "bi tool"] },
  { id: 17, name: "Supply Chain & Logistics", keywords: ["supply chain", "logistics", "shipping", "freight", "warehouse management", "inventory", "fulfillment", "fleet"] },
  { id: 18, name: "ERP & Operations", keywords: ["erp", "enterprise resource planning", "operations", "resource planning", "business operations", "back office"] },
  { id: 19, name: "IT Service Management", keywords: ["itsm", "it service", "incident management", "service desk", "it operations", "observability", "apm"] },
  { id: 20, name: "Content & CMS", keywords: ["cms", "content management", "headless cms", "website builder", "digital experience", "web publishing", "content platform"] },
  { id: 21, name: "Procurement & Spend", keywords: ["procurement", "purchasing", "spend management", "vendor management", "sourcing", "expense management", "corporate card"] },
  { id: 22, name: "GRC & Compliance", keywords: ["governance", "risk", "compliance", "grc", "audit", "regulatory", "privacy", "trust", "soc2", "iso"] },
  { id: 23, name: "AI Infrastructure", keywords: ["ai infrastructure", "foundation model", "llm", "large language model", "generative ai", "ai platform", "machine learning", "ml ops", "ai assistant", "multimodal ai", "ai app builder", "ai code editor", "ai agent platform"] },
];

// Non-software industries to exclude
const EXCLUDE_PATTERNS = [
  "biotech", "drug discovery", "therapeutics", "gene therapy", "nanomedicine",
  "agriculture", "farming", "food", "restaurant", "hospitality",
  "aerospace", "defense", "military", "drones", "airplanes", "air taxi",
  "construction", "mining", "oil", "energy", "solar", "battery",
  "automotive", "electric vehicle", "transportation", "logistics",
  "fashion", "apparel", "clothing", "textile",
  "fitness", "gym", "sports",
  "insurance", "banking",
  "manufacturing", "industrial", "hardware", "robotics", "3d print",
  "quantum computing", "semiconductor", "chip",
  "nonprofit", "government", "civic",
  "media production", "publishing", "news", "entertainment", "gaming", "music",
  "crypto", "web3", "blockchain", "defi",
];

function isExcluded(industry: string): boolean {
  const lower = industry.toLowerCase();
  return EXCLUDE_PATTERNS.some((p) => lower.includes(p));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const { action } = await req.json();

    if (action === "classify") {
      // Get all companies not yet classified
      const { data: classified } = await sb
        .from("company_vertical_map")
        .select("company_id");
      const classifiedIds = new Set((classified || []).map((c: any) => c.company_id));

      const { data: companies } = await sb
        .from("companies")
        .select("id, name, industry, description, employee_range, founded_year, funding_stage")
        .not("industry", "is", null)
        .order("name")
        .limit(500);

      if (!companies?.length) {
        return new Response(JSON.stringify({ classified: 0, skipped: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Filter to skip already classified only — let AI decide if it's software
      const softwareCompanies = companies.filter(
        (c: any) => !classifiedIds.has(c.id)
      );

      // Process in batches of 30 using AI
      const BATCH_SIZE = 20;
      const MAX_BATCHES = 3;
      let totalClassified = 0;
      let totalSkipped = 0;
      let batchCount = 0;

      for (let i = 0; i < softwareCompanies.length && batchCount < MAX_BATCHES; i += BATCH_SIZE) {
        batchCount++;
        const batch = softwareCompanies.slice(i, i + BATCH_SIZE);

        const companyList = batch
          .map(
            (c: any, idx: number) =>
              `${idx + 1}. "${c.name}" | industry: ${c.industry || "unknown"} | desc: ${(c.description || "").slice(0, 100)} | employees: ${c.employee_range || "?"} | founded: ${c.founded_year || "?"}`
          )
          .join("\n");

        const prompt = `You are classifying software companies into verticals for a startup disruption tool.

VERTICALS (use exact IDs):
${VERTICALS.map((v) => `${v.id}. ${v.name}`).join("\n")}

COMPANIES TO CLASSIFY:
${companyList}

For each company, output a JSON array. Each element:
{
  "idx": <1-based index>,
  "vertical_id": <1-15 or null if not software>,
  "sub_vertical": "<specific niche within the vertical, e.g. 'Sales Engagement', 'Email Marketing', 'Cloud Monitoring'>",
  "role": "<'incumbent' if established/large player, 'disruptor' if AI-native/startup challenger, 'transitioning' if adapting>"
}

Rules:
- Skip companies that are NOT software/SaaS businesses (set vertical_id to null)
- "incumbent" = companies with 200+ employees or 10+ years old or large funding
- "disruptor" = AI-native, small teams, recent founding, challenging incumbents
- "transitioning" = mid-size companies adding AI capabilities
- Sub-verticals should be specific: "Sales Engagement" not just "Sales"
- Output ONLY the JSON array, no markdown.`;

        const aiResp = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.1,
            }),
          }
        );

        if (!aiResp.ok) {
          console.error("AI call failed:", await aiResp.text());
          continue;
        }

        const aiData = await aiResp.json();
        let content = aiData.choices?.[0]?.message?.content || "";
        // Strip markdown code fences if present
        content = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();

        let results: any[];
        try {
          results = JSON.parse(content);
        } catch {
          console.error("Failed to parse AI response for batch", i);
          continue;
        }

        const inserts: any[] = [];
        for (const r of results) {
          if (!r.vertical_id || r.vertical_id < 1 || r.vertical_id > 23) {
            totalSkipped++;
            continue;
          }
          const company = batch[r.idx - 1];
          if (!company) continue;

          const vertical = VERTICALS.find((v) => v.id === r.vertical_id);
          inserts.push({
            company_id: company.id,
            vertical_id: r.vertical_id,
            vertical_name: vertical?.name || "Unknown",
            sub_vertical: r.sub_vertical || null,
            role: ["incumbent", "disruptor", "transitioning"].includes(r.role)
              ? r.role
              : "transitioning",
          });
        }

        if (inserts.length > 0) {
          const { error } = await sb
            .from("company_vertical_map")
            .upsert(inserts, { onConflict: "company_id,vertical_id" });
          if (error) console.error("Insert error:", error);
          else totalClassified += inserts.length;
        }
      }

      return new Response(
        JSON.stringify({
          classified: totalClassified,
          skipped: totalSkipped,
          total_software: softwareCompanies.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "stats") {
      const { data } = await sb
        .from("company_vertical_map")
        .select("vertical_id, vertical_name, sub_vertical, role, companies(id, name, industry, description, employee_range, logo_url)")
        .order("vertical_id");

      // Group by vertical
      const verticals: Record<number, any> = {};
      for (const row of data || []) {
        const vid = row.vertical_id;
        if (!verticals[vid]) {
          verticals[vid] = {
            id: vid,
            name: row.vertical_name,
            sub_verticals: {},
            counts: { incumbent: 0, disruptor: 0, transitioning: 0, total: 0 },
          };
        }
        const v = verticals[vid];
        v.counts[row.role as string]++;
        v.counts.total++;

        const sv = row.sub_vertical || "General";
        if (!v.sub_verticals[sv]) {
          v.sub_verticals[sv] = [];
        }
        v.sub_verticals[sv].push({
          ...(row as any).companies,
          role: row.role,
        });
      }

      return new Response(JSON.stringify({ verticals: Object.values(verticals) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
