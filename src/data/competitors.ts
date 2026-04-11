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
    heroAccent: "Start Generating.",
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
    seoTitle: "Xcrow vs Clay — AI Lead Generation Without the Complexity",
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
  linkedin: {
    slug: "linkedin",
    name: "LinkedIn Sales Navigator",
    tagline: "LinkedIn charges $120/mo for 50 InMails. Xcrow gives you 500 leads with emails for $49.",
    description:
      "LinkedIn Sales Navigator is the go-to tool for social selling — advanced search, InMail credits, and lead recommendations within the LinkedIn ecosystem. But you're locked inside LinkedIn's walled garden: no email addresses, capped InMails, and pricing that scales fast. Xcrow gives you direct email access to decision-makers at a fraction of the cost.",
    seoTitle: "Xcrow vs LinkedIn Sales Navigator — 10× the Leads, 60% Less Cost",
    seoDescription:
      "Compare Xcrow and LinkedIn Sales Navigator. Get 500 leads with direct emails for $49/mo instead of 50 InMails for $120/mo. No LinkedIn subscription needed.",
    heroHeadline: "50 InMails.",
    heroAccent: "Or 500 Leads With Emails.",
    painPoints: [
      { title: "$120/mo for 50 messages", desc: "Sales Navigator Core costs $119.99/mo and gives you just 50 InMail credits. That's $2.40 per message — and most get ignored." },
      { title: "No email addresses — ever", desc: "LinkedIn never gives you direct email addresses. You're stuck inside their platform, sending messages that compete with spam and recruiter noise." },
      { title: "You don't own the data", desc: "Cancel your subscription and your saved leads, notes, and lists disappear. With Xcrow, you get real email addresses you keep forever." },
      { title: "Enterprise pricing scales fast", desc: "Advanced is $179.99/mo. Advanced Plus starts at ~$1,600/seat/year. For a 5-person team, that's $60K+/year on LinkedIn alone." },
    ],
    comparison: [
      { feature: "Direct email addresses", xcrow: true, competitor: false },
      { feature: "500+ leads per month", xcrow: true, competitor: "50 InMails" },
      { feature: "AI-drafted outreach per lead", xcrow: true, competitor: false },
      { feature: "Per-lead fit scoring", xcrow: true, competitor: false },
      { feature: "One URL → full prospect map", xcrow: true, competitor: false },
      { feature: "Free to start", xcrow: true, competitor: false },
      { feature: "InMail messaging", xcrow: false, competitor: true },
      { feature: "LinkedIn network insights", xcrow: false, competitor: true },
    ],
    faq: [
      { q: "Does Xcrow replace LinkedIn Sales Navigator?", a: "For outbound prospecting, yes. Sales Navigator is great for social selling within LinkedIn, but if you need direct email addresses and high-volume outreach, Xcrow delivers 10× more contacts at 60% less cost." },
      { q: "How does pricing compare?", a: "LinkedIn Sales Navigator Core is $119.99/mo for 50 InMails. Xcrow Pro is $49/mo for 500 leads with verified email addresses. You do the math." },
      { q: "Can I use both?", a: "Yes — many users use Xcrow for lead discovery and email outreach, and LinkedIn for relationship warming and social proof. They complement each other." },
      { q: "Do I get LinkedIn profile links?", a: "Yes. Every Xcrow lead includes a verified LinkedIn profile URL alongside their direct email address." },
    ],
  },
};

export const COMPETITOR_SLUGS = Object.keys(COMPETITORS);
