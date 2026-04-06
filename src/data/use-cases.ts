export interface UseCaseData {
  slug: string;
  industry: string;
  seoTitle: string;
  seoDescription: string;
  heroHeadline: string;
  heroAccent: string;
  heroDesc: string;
  painPoints: string[];
  howXcrowHelps: { title: string; desc: string }[];
  exampleTargets: string[];
  faq: { q: string; a: string }[];
}

export const USE_CASES: Record<string, UseCaseData> = {
  saas: {
    slug: "saas",
    industry: "SaaS Companies",
    seoTitle: "Lead Generation for SaaS — Xcrow",
    seoDescription: "Find decision-makers at companies that need your SaaS product. AI-powered lead hunting for B2B software companies.",
    heroHeadline: "Lead Gen for",
    heroAccent: "SaaS Companies",
    heroDesc: "Paste your SaaS product URL. AI identifies companies that need your solution, finds the right buyers, and drafts outreach — in 60 seconds.",
    painPoints: [
      "Spending hours on LinkedIn Sales Navigator filtering",
      "Cold emailing prospects who aren't a fit for your product",
      "Not knowing which verticals to prioritize",
      "Generic outreach that gets ignored",
    ],
    howXcrowHelps: [
      { title: "AI understands your product", desc: "Xcrow reads your product pages and understands exactly what you sell, who it's for, and what problems it solves." },
      { title: "Finds companies that need you", desc: "AI maps verticals where your product creates the most value — not just companies that match basic firmographics." },
      { title: "Targets the right buyer", desc: "VP of Engineering? Head of Product? Director of Ops? Xcrow finds the decision-maker most likely to buy." },
    ],
    exampleTargets: ["VP of Engineering", "Head of Product", "CTO", "Director of Operations", "Chief Revenue Officer"],
    faq: [
      { q: "How does Xcrow know who buys SaaS?", a: "Xcrow analyzes your product website to understand what you sell, then uses AI to identify verticals and personas that would benefit most. It's like having an AI-powered sales strategist." },
      { q: "Can I target specific company sizes?", a: "Yes — Xcrow's AI prospect map segments by company stage and size, so you can focus on startups, mid-market, or enterprise targets." },
    ],
  },
  agencies: {
    slug: "agencies",
    industry: "Marketing Agencies",
    seoTitle: "Lead Generation for Agencies — Xcrow",
    seoDescription: "Find companies that need your agency's services. AI-powered prospecting for marketing, design, and creative agencies.",
    heroHeadline: "Lead Gen for",
    heroAccent: "Agencies",
    heroDesc: "Paste your agency website. AI finds companies that need your services, identifies the marketing decision-maker, and drafts a personalized pitch.",
    painPoints: [
      "Relying on referrals and inbound for new business",
      "Spending days researching potential clients",
      "Pitching companies that already have agencies",
      "Generic cold outreach that doesn't show expertise",
    ],
    howXcrowHelps: [
      { title: "Understands your services", desc: "Xcrow reads your case studies and service pages to understand exactly what you offer and what makes you different." },
      { title: "Finds companies without agencies", desc: "AI identifies companies in verticals where your services create the most impact, targeting those most likely to need help." },
      { title: "Personalized pitches", desc: "Outreach drafts reference the prospect's specific challenges and how your agency has solved similar problems." },
    ],
    exampleTargets: ["Head of Marketing", "CMO", "VP of Growth", "Director of Brand", "Marketing Manager"],
    faq: [
      { q: "Does this work for niche agencies?", a: "Yes — whether you're a Webflow agency, a B2B content shop, or a performance marketing firm, Xcrow's AI tailors the prospect map to your specific expertise." },
      { q: "Can I prospect for specific industries?", a: "Absolutely. Xcrow's AI builds a targeting tree by vertical, so you can focus on healthcare, fintech, e-commerce, or any niche you serve." },
    ],
  },
  recruiting: {
    slug: "recruiting",
    industry: "Recruiting & Staffing",
    seoTitle: "Lead Generation for Recruiting Firms — Xcrow",
    seoDescription: "Find companies actively hiring. AI-powered prospecting for recruiting firms, staffing agencies, and talent solutions.",
    heroHeadline: "Lead Gen for",
    heroAccent: "Recruiting Firms",
    heroDesc: "Paste any company URL. AI identifies their hiring needs, finds the HR decision-maker, and drafts a pitch for your recruiting services.",
    painPoints: [
      "Cold calling HR departments with no context",
      "Not knowing which companies are actively hiring",
      "Competing on price instead of specialization",
      "Spending too much time on research, not enough on relationships",
    ],
    howXcrowHelps: [
      { title: "Spots hiring signals", desc: "Xcrow analyzes company growth stage, funding, and team size to identify companies likely to need recruiting help." },
      { title: "Finds the right HR contact", desc: "VP of People, Head of Talent, CHRO — Xcrow identifies the decision-maker who actually approves recruiting partnerships." },
      { title: "Specialization-aware outreach", desc: "AI drafts pitches that position your firm's expertise in the specific roles the company needs to fill." },
    ],
    exampleTargets: ["VP of People", "Head of Talent Acquisition", "CHRO", "HR Director", "Hiring Manager"],
    faq: [
      { q: "How does Xcrow know a company is hiring?", a: "Xcrow uses AI company analysis combined with growth signals like funding stage, employee count, and market expansion to predict hiring needs." },
      { q: "Can I focus on specific industries?", a: "Yes — Xcrow's prospect map lets you focus on tech, healthcare, finance, or any vertical where your recruiting firm specializes." },
    ],
  },
  consulting: {
    slug: "consulting",
    industry: "Consulting Firms",
    seoTitle: "Lead Generation for Consultants — Xcrow",
    seoDescription: "Find companies that need your consulting expertise. AI-powered prospecting for management, strategy, and technology consultants.",
    heroHeadline: "Lead Gen for",
    heroAccent: "Consultants",
    heroDesc: "Paste a target company URL. AI analyzes their challenges, finds the executive sponsor, and drafts a tailored consulting pitch.",
    painPoints: [
      "Relying entirely on partner networks for deal flow",
      "Long sales cycles with unclear decision-makers",
      "Proposals that don't address specific pain points",
      "No systematic way to generate new business",
    ],
    howXcrowHelps: [
      { title: "Maps business challenges", desc: "Xcrow's AI reads company positioning to identify where consulting services would create the most impact." },
      { title: "Finds the executive sponsor", desc: "CEO, COO, VP of Strategy — Xcrow targets the person who authorizes consulting engagements." },
      { title: "Context-rich outreach", desc: "AI drafts emails that reference the company's specific challenges, not generic consulting pitches." },
    ],
    exampleTargets: ["CEO", "COO", "VP of Strategy", "Chief Transformation Officer", "Head of Operations"],
    faq: [
      { q: "Does this work for solo consultants?", a: "Yes — Xcrow is especially powerful for independent consultants who don't have a sales team or BD function." },
      { q: "Can I target by company challenge?", a: "Xcrow's AI analysis identifies companies facing growth, efficiency, or transformation challenges that match your expertise." },
    ],
  },
  ecommerce: {
    slug: "ecommerce",
    industry: "E-commerce & DTC",
    seoTitle: "Lead Generation for E-commerce Vendors — Xcrow",
    seoDescription: "Find e-commerce brands that need your tools and services. AI-powered prospecting for Shopify apps, logistics, and DTC vendors.",
    heroHeadline: "Lead Gen for",
    heroAccent: "E-commerce Vendors",
    heroDesc: "Paste your product URL. AI finds e-commerce brands that need your solution and connects you with the decision-maker.",
    painPoints: [
      "Hard to reach DTC brand founders",
      "Not knowing which brands are at the right stage for your product",
      "Generic outreach that blends into inbox noise",
      "Wasting time on brands that are too small or too large",
    ],
    howXcrowHelps: [
      { title: "Understands your e-commerce tool", desc: "Xcrow reads your product pages to understand whether you sell shipping software, analytics tools, or marketing services." },
      { title: "Matches to the right brands", desc: "AI identifies brands at the right growth stage where your product creates maximum ROI." },
      { title: "Reaches the buyer", desc: "Founder, VP of E-commerce, Head of Growth — Xcrow finds who actually makes purchasing decisions." },
    ],
    exampleTargets: ["Founder / CEO", "VP of E-commerce", "Head of Growth", "Director of Marketing", "Head of Operations"],
    faq: [
      { q: "Can I target Shopify brands specifically?", a: "Xcrow's AI analysis can identify e-commerce platforms and tech stacks, helping you focus on Shopify, WooCommerce, or other platform users." },
      { q: "Does this work for B2B e-commerce?", a: "Yes — Xcrow works for any B2B relationship, whether you're selling to DTC brands, marketplaces, or wholesale platforms." },
    ],
  },
};

export const USE_CASE_SLUGS = Object.keys(USE_CASES);
