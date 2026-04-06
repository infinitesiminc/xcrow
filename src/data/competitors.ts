export interface CompetitorData {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  heroHeadline: string;
  heroAccent: string;
  painPoints: { title: string; desc: string }[];
  comparison: { feature: string; xcrow: boolean | string; competitor: boolean | string }[];
  faq: { q: string; a: string }[];
}

export const COMPETITORS: Record<string, CompetitorData> = {
  apollo: {
    slug: "apollo",
    name: "Apollo.io",
    tagline: "Apollo gives you the database. Xcrow gives you the strategy.",
    description:
      "Apollo.io is a massive B2B contact database with 275M+ contacts. But finding the right leads still requires you to manually filter, build lists, and figure out who to target. Xcrow flips that — paste one URL and AI does the research for you.",
    seoTitle: "Xcrow vs Apollo.io — Smarter Outbound Lead Generation",
    seoDescription:
      "Compare Xcrow and Apollo.io for B2B lead generation. See why teams choose Xcrow's AI-powered lead hunting over manual database filtering.",
    heroHeadline: "Stop Filtering.",
    heroAccent: "Start Hunting.",
    painPoints: [
      { title: "Manual list building", desc: "Apollo requires you to know your ICP, set filters, and manually build lists. Xcrow's AI figures out your ideal targets automatically." },
      { title: "No fit scoring", desc: "Apollo shows contacts but doesn't tell you who's the best fit. Xcrow scores every lead with AI-powered reasoning." },
      { title: "No outreach built in", desc: "Apollo's email tools are separate from discovery. Xcrow drafts personalized outreach for each lead instantly." },
      { title: "Overwhelming interface", desc: "275M contacts sounds great until you're drowning in filters. Xcrow gives you 10 perfect leads, not 10,000 random ones." },
    ],
    comparison: [
      { feature: "Zero GTM knowledge needed", xcrow: true, competitor: false },
      { feature: "One URL → full prospect map", xcrow: true, competitor: false },
      { feature: "AI company DNA analysis", xcrow: true, competitor: false },
      { feature: "Per-lead fit scoring", xcrow: true, competitor: false },
      { feature: "Auto-drafted outreach", xcrow: true, competitor: false },
      { feature: "Large contact database", xcrow: "Via Apollo", competitor: true },
      { feature: "Email sequences", xcrow: "Coming soon", competitor: true },
      { feature: "CRM integrations", xcrow: "Coming soon", competitor: true },
    ],
    faq: [
      { q: "Does Xcrow replace Apollo?", a: "Xcrow actually uses Apollo as its data source for verified contacts. The difference is Xcrow adds an AI layer that does the targeting, scoring, and outreach for you — so you get Apollo's data quality without the manual work." },
      { q: "Is Xcrow better for small teams?", a: "Yes. Apollo is powerful but complex. Xcrow is built for founders, freelancers, and small teams who don't have a dedicated sales ops person to manage filters and lists." },
      { q: "Can I still use Apollo alongside Xcrow?", a: "Absolutely. Many users use Xcrow for AI-powered discovery and Apollo for bulk outreach sequences." },
    ],
  },
  clay: {
    slug: "clay",
    name: "Clay",
    tagline: "Clay is the spreadsheet. Xcrow is the answer.",
    description:
      "Clay is a powerful data enrichment and workflow tool loved by sales ops teams. But it requires you to already know who to target and how to build complex automations. Xcrow starts from zero — just paste a URL.",
    seoTitle: "Xcrow vs Clay — AI Lead Hunting Without the Complexity",
    seoDescription:
      "Compare Xcrow and Clay for B2B prospecting. Xcrow delivers scored leads from a single URL — no workflows, no spreadsheets, no GTM expertise.",
    heroHeadline: "No Workflows.",
    heroAccent: "Just Leads.",
    painPoints: [
      { title: "Steep learning curve", desc: "Clay requires understanding of data enrichment, APIs, and workflow building. Xcrow requires one URL." },
      { title: "You need to know your ICP first", desc: "Clay enriches data you already have. Xcrow discovers who you should be targeting in the first place." },
      { title: "Time to first lead", desc: "Building a Clay workflow takes hours. Xcrow delivers scored leads in 60 seconds." },
      { title: "Built for ops, not sellers", desc: "Clay is a sales ops tool. Xcrow is built for anyone who needs leads — founders, freelancers, AEs." },
    ],
    comparison: [
      { feature: "Zero GTM knowledge needed", xcrow: true, competitor: false },
      { feature: "One URL → full prospect map", xcrow: true, competitor: false },
      { feature: "AI company DNA analysis", xcrow: true, competitor: false },
      { feature: "Per-lead fit scoring", xcrow: true, competitor: false },
      { feature: "No-code setup", xcrow: true, competitor: false },
      { feature: "Data enrichment waterfall", xcrow: false, competitor: true },
      { feature: "Custom workflow builder", xcrow: false, competitor: true },
      { feature: "Multi-source data fusion", xcrow: false, competitor: true },
    ],
    faq: [
      { q: "Is Xcrow simpler than Clay?", a: "Dramatically. Clay is a workflow platform for sales ops teams. Xcrow is a single-input tool that anyone can use — paste a URL, get leads. No formulas, no enrichment chains, no API keys." },
      { q: "Who should use Clay vs Xcrow?", a: "Use Clay if you have a dedicated sales ops team and need complex data enrichment workflows. Use Xcrow if you want AI to handle the entire prospecting process from scratch." },
      { q: "Can they work together?", a: "Yes — you can export Xcrow leads and enrich them further in Clay if you need additional data points." },
    ],
  },
  zoominfo: {
    slug: "zoominfo",
    name: "ZoomInfo",
    tagline: "ZoomInfo is enterprise. Xcrow is instant.",
    description:
      "ZoomInfo is the industry standard for enterprise sales intelligence — but it comes with enterprise pricing, long contracts, and a complex interface. Xcrow delivers the same quality leads in seconds, not weeks.",
    seoTitle: "Xcrow vs ZoomInfo — Enterprise Leads Without the Enterprise Price",
    seoDescription:
      "Compare Xcrow and ZoomInfo for B2B lead generation. Get AI-powered prospect discovery without $30K+ contracts or complex setup.",
    heroHeadline: "Enterprise Data.",
    heroAccent: "Startup Speed.",
    painPoints: [
      { title: "$30K+ annual contracts", desc: "ZoomInfo starts at $30K/year with long commitments. Xcrow is free to start with pay-as-you-go pricing." },
      { title: "Weeks to onboard", desc: "ZoomInfo requires sales calls, demos, and onboarding. Xcrow delivers leads in 60 seconds from first visit." },
      { title: "Overkill for most teams", desc: "ZoomInfo is built for enterprise sales orgs with 50+ reps. Xcrow is built for teams of 1-10 who need leads now." },
      { title: "Still requires manual targeting", desc: "Even with ZoomInfo's data, you need to know who to target. Xcrow's AI figures that out automatically." },
    ],
    comparison: [
      { feature: "Zero GTM knowledge needed", xcrow: true, competitor: false },
      { feature: "One URL → full prospect map", xcrow: true, competitor: false },
      { feature: "AI company DNA analysis", xcrow: true, competitor: false },
      { feature: "Free to start", xcrow: true, competitor: false },
      { feature: "60-second time to first lead", xcrow: true, competitor: false },
      { feature: "Intent data", xcrow: false, competitor: true },
      { feature: "Org chart mapping", xcrow: false, competitor: true },
      { feature: "Enterprise compliance (SOC2)", xcrow: false, competitor: true },
    ],
    faq: [
      { q: "Is Xcrow a ZoomInfo replacement?", a: "For small-to-mid teams, yes. You get AI-powered prospecting with verified contact data at a fraction of the cost. Enterprise teams with complex compliance needs may still need ZoomInfo." },
      { q: "How does data quality compare?", a: "Xcrow sources contact data from Apollo's verified database, which rivals ZoomInfo's accuracy for most use cases. The key difference is Xcrow adds AI scoring and targeting on top." },
      { q: "Is there a contract?", a: "No. Xcrow is free to start with no commitments. ZoomInfo typically requires annual contracts starting at $30K+." },
    ],
  },
};

export const COMPETITOR_SLUGS = Object.keys(COMPETITORS);
