export interface UseCase {
  slug: string;
  vertical: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  heroHeadline: string;
  heroSub: string;
  painPoints: string[];
  solutions: string[];
  ctaText: string;
  faq: Array<{ q: string; a: string }>;
}

export const useCases: UseCase[] = [
  {
    slug: "logistics-lead-generation",
    vertical: "Supply Chain & Logistics",
    title: "Logistics Lead Generation",
    metaTitle: "AI-Powered Lead Generation for Logistics Companies",
    metaDescription: "Find and convert logistics buyers with AI-powered ICP mapping. Identify 3PLs, cold chain operators, and warehouse decision-makers automatically.",
    heroHeadline: "AI-Powered Lead Generation for Logistics Companies",
    heroSub: "Map your ideal buyers across 3PLs, cold chain, freight forwarding, and warehouse management — then find them automatically.",
    painPoints: [
      "Decision-makers in logistics are spread across operations, procurement, and facility management",
      "Generic prospecting tools don't understand vertical-specific buyer personas",
      "Manual research into logistics sub-segments takes weeks of analyst time",
    ],
    solutions: [
      "Deep-crawl any logistics company website to map their ICP in seconds",
      "Auto-segment into cold chain, last-mile, freight, and warehouse verticals",
      "Identify operations directors, facility managers, and procurement leads automatically",
    ],
    ctaText: "Map Your Logistics ICP",
    faq: [
      { q: "How does it find logistics decision-makers?", a: "Our AI scrapes the target company's website, identifies their market positioning, then maps buyer personas specific to logistics — from VP Operations to Warehouse Managers." },
      { q: "What logistics sub-segments are supported?", a: "We cover 3PLs, cold chain, freight forwarding, last-mile delivery, warehouse management, customs brokerage, and more." },
      { q: "Can I export leads to my CRM?", a: "Yes — export enriched leads as CSV with emails, titles, and company data ready for any CRM import." },
    ],
  },
  {
    slug: "saas-icp-mapping",
    vertical: "SaaS & Cloud",
    title: "SaaS ICP Mapping",
    metaTitle: "AI ICP Mapping for SaaS Companies | Find Your Ideal Customers",
    metaDescription: "Build your SaaS ICP automatically. AI analyzes competitor websites to identify verticals, segments, and buyer personas for B2B SaaS sales.",
    heroHeadline: "Build Your SaaS ICP in 60 Seconds",
    heroSub: "Enter any competitor or prospect URL — get a complete ICP tree with verticals, segments, and buyer personas mapped automatically.",
    painPoints: [
      "SaaS markets are fragmented across dozens of micro-verticals",
      "Defining ICP manually requires expensive consultants and months of iteration",
      "Sales teams waste time prospecting outside their ideal customer profile",
    ],
    solutions: [
      "AI-powered website analysis extracts positioning, pricing signals, and market focus",
      "Automatic 3-layer ICP tree: Industry → Segment → Buyer Persona",
      "One-click lead generation filtered to your exact ICP criteria",
    ],
    ctaText: "Map Your SaaS ICP",
    faq: [
      { q: "How accurate is the AI-generated ICP?", a: "Our deep crawl analyzes up to 5 subpages including pricing, solutions, and customer pages to build a highly targeted ICP map." },
      { q: "Can I refine the generated ICP?", a: "Absolutely — the interactive funnel map lets you add, remove, or restructure any vertical, segment, or persona." },
      { q: "Does it work for vertical SaaS?", a: "Yes — it's especially effective for vertical SaaS where precise industry targeting drives conversion." },
    ],
  },
  {
    slug: "healthcare-sales-prospecting",
    vertical: "Healthcare & Life Sciences",
    title: "Healthcare Sales Prospecting",
    metaTitle: "Healthcare B2B Lead Generation | AI Sales Prospecting",
    metaDescription: "Generate qualified healthcare leads with AI. Map hospital systems, biotech firms, and medtech buyers by specialty, department, and decision authority.",
    heroHeadline: "AI Sales Prospecting for Healthcare & Life Sciences",
    heroSub: "Navigate complex healthcare buying committees. Map decision-makers across hospital networks, biotech, pharma, and medtech.",
    painPoints: [
      "Healthcare buying committees involve 6-10 stakeholders across clinical and administrative roles",
      "Prospecting into hospital systems requires understanding department hierarchies",
      "Compliance and regulatory awareness is needed to position effectively",
    ],
    solutions: [
      "Map healthcare org structures from CMO to department heads automatically",
      "Segment by hospital systems, clinics, biotech, pharma, and medtech",
      "Identify clinical champions, procurement leads, and IT decision-makers",
    ],
    ctaText: "Find Healthcare Buyers",
    faq: [
      { q: "What healthcare sub-segments are covered?", a: "Hospital systems, ambulatory care, biotech, pharmaceutical, medical devices, health IT, clinical research, and telehealth." },
      { q: "Does it identify clinical vs. administrative buyers?", a: "Yes — our persona mapping distinguishes clinical decision-makers (CMO, department heads) from administrative buyers (CFO, procurement)." },
      { q: "Is the data HIPAA-relevant?", a: "We only collect publicly available business contact information — no patient data is involved." },
    ],
  },
  {
    slug: "fintech-lead-generation",
    vertical: "Fintech & Financial Services",
    title: "Fintech Lead Generation",
    metaTitle: "Fintech Lead Generation | AI-Powered B2B Prospecting",
    metaDescription: "Generate fintech and financial services leads with AI. Map banking, insurance, and wealth management buyers automatically.",
    heroHeadline: "Lead Generation for Fintech & Financial Services",
    heroSub: "Target the right buyers across banking, insurance, payments, lending, and wealth management with AI-mapped ICPs.",
    painPoints: [
      "Financial services have strict hierarchies that generic tools can't navigate",
      "Fintech buyers span risk, compliance, operations, and technology departments",
      "Long sales cycles demand precise targeting to avoid wasted pipeline",
    ],
    solutions: [
      "Deep-crawl fintech company sites to map their exact market positioning",
      "Auto-identify compliance officers, CROs, CTOs, and product leaders",
      "Segment by banking, insurance, payments, lending, and regtech",
    ],
    ctaText: "Map Fintech Buyers",
    faq: [
      { q: "What financial verticals are covered?", a: "Banking, insurance, payments, lending, wealth management, regtech, and capital markets." },
      { q: "Can I target by company stage?", a: "Yes — filter by Series A startups through enterprise banks using firmographic data." },
      { q: "Does it work for selling into banks?", a: "Absolutely — our ICP mapping identifies technology, operations, and compliance buyers within banking hierarchies." },
    ],
  },
  {
    slug: "manufacturing-sales-prospecting",
    vertical: "Manufacturing & Industrial",
    title: "Manufacturing Sales Prospecting",
    metaTitle: "Manufacturing Lead Generation | AI B2B Sales Prospecting",
    metaDescription: "Find manufacturing and industrial buyers with AI. Map plant managers, operations directors, and procurement leads across verticals.",
    heroHeadline: "AI Sales Prospecting for Manufacturing & Industrial",
    heroSub: "Reach plant managers, operations directors, and procurement leads across discrete, process, and advanced manufacturing.",
    painPoints: [
      "Manufacturing decision-makers are often offline and hard to reach digitally",
      "Plant-level vs. corporate-level buying authority creates confusion",
      "Highly fragmented sub-industries require precise vertical targeting",
    ],
    solutions: [
      "Map manufacturing companies by sub-industry: automotive, aerospace, food & bev, chemicals",
      "Identify plant managers, VP Operations, and procurement directors",
      "Segment by company size, production type, and geographic footprint",
    ],
    ctaText: "Find Manufacturing Leads",
    faq: [
      { q: "What manufacturing sub-segments are covered?", a: "Automotive, aerospace, food & beverage, chemicals, electronics, metals, plastics, and advanced manufacturing." },
      { q: "Can I target by plant location?", a: "Yes — our enrichment includes headquarters and facility location data for geographic targeting." },
      { q: "Does it find technical buyers?", a: "Yes — we map engineering managers, quality directors, and automation leads alongside traditional procurement roles." },
    ],
  },
  {
    slug: "cybersecurity-lead-generation",
    vertical: "Cybersecurity",
    title: "Cybersecurity Lead Generation",
    metaTitle: "Cybersecurity Lead Generation | Find CISOs & Security Buyers",
    metaDescription: "Generate cybersecurity leads with AI. Identify CISOs, security architects, and compliance officers across enterprise and mid-market companies.",
    heroHeadline: "Find Cybersecurity Buyers with AI",
    heroSub: "Map CISOs, security architects, and compliance officers — segmented by company size, industry, and security maturity.",
    painPoints: [
      "Security buyers are skeptical and hard to engage with generic outreach",
      "The CISO title covers vastly different responsibilities by company size",
      "Security purchasing involves both technical and business stakeholders",
    ],
    solutions: [
      "Identify security-specific personas: CISO, SOC Manager, GRC Lead, Security Engineer",
      "Segment by enterprise vs. mid-market security needs",
      "Map technical evaluators alongside budget decision-makers",
    ],
    ctaText: "Find Security Buyers",
    faq: [
      { q: "What security roles does it identify?", a: "CISO, VP Security, SOC Manager, Security Architect, GRC Lead, Application Security Engineer, and Cloud Security specialists." },
      { q: "Can I filter by compliance framework?", a: "Our ICP mapping identifies companies likely subject to SOC 2, HIPAA, PCI-DSS, and other frameworks based on industry signals." },
      { q: "Does it work for selling security tools?", a: "Yes — specifically designed for security vendors targeting enterprise and mid-market buyers." },
    ],
  },
  {
    slug: "real-estate-lead-generation",
    vertical: "Real Estate & PropTech",
    title: "Real Estate Lead Generation",
    metaTitle: "Real Estate B2B Lead Generation | PropTech Sales Prospecting",
    metaDescription: "Generate real estate and PropTech leads with AI. Find property managers, brokers, and real estate technology buyers automatically.",
    heroHeadline: "Lead Generation for Real Estate & PropTech",
    heroSub: "Target property managers, commercial brokers, and PropTech decision-makers across residential, commercial, and industrial real estate.",
    painPoints: [
      "Real estate is relationship-driven — cold outreach needs precise targeting",
      "Property management, brokerage, and development have completely different buyers",
      "Regional market dynamics make national prospecting ineffective",
    ],
    solutions: [
      "Segment by property type: residential, commercial, industrial, hospitality",
      "Map roles from property managers to development VPs to asset managers",
      "Geographic targeting by market, metro area, and portfolio size",
    ],
    ctaText: "Find Real Estate Leads",
    faq: [
      { q: "What real estate segments are covered?", a: "Residential, commercial, industrial, hospitality, mixed-use, property management, and real estate investment." },
      { q: "Does it cover PropTech buyers?", a: "Yes — we identify technology decision-makers within real estate firms adopting PropTech solutions." },
      { q: "Can I target by portfolio size?", a: "Our firmographic enrichment includes employee count and estimated revenue as proxies for portfolio scale." },
    ],
  },
  {
    slug: "edtech-lead-generation",
    vertical: "EdTech & Education",
    title: "EdTech Lead Generation",
    metaTitle: "EdTech Lead Generation | AI-Powered Education Sales",
    metaDescription: "Find EdTech buyers with AI. Map university administrators, K-12 district leaders, and corporate training decision-makers automatically.",
    heroHeadline: "AI Lead Generation for EdTech & Education",
    heroSub: "Reach university administrators, district superintendents, and corporate L&D leaders with precision ICP mapping.",
    painPoints: [
      "Education buying cycles are long and budget-dependent on fiscal years",
      "K-12, higher ed, and corporate training are completely different markets",
      "Decision authority is distributed across academic, IT, and procurement teams",
    ],
    solutions: [
      "Segment by K-12 districts, universities, community colleges, and corporate L&D",
      "Identify deans, provosts, CIOs, and curriculum directors",
      "Map budget cycles and procurement patterns by institution type",
    ],
    ctaText: "Find EdTech Buyers",
    faq: [
      { q: "What education segments are covered?", a: "K-12 districts, higher education, community colleges, corporate training, and online learning platforms." },
      { q: "Does it identify academic vs. IT buyers?", a: "Yes — our persona layer distinguishes academic leadership (deans, provosts) from IT and procurement decision-makers." },
      { q: "Can I target by institution size?", a: "Yes — filter by student enrollment, faculty count, and institutional budget indicators." },
    ],
  },
];

export function getUseCaseBySlug(slug: string): UseCase | undefined {
  return useCases.find((uc) => uc.slug === slug);
}

export function getAllUseCaseSlugs(): string[] {
  return useCases.map((uc) => uc.slug);
}
