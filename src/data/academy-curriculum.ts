export interface LessonConfig {
  title: string;
  type: "concept" | "prompt_lab" | "tool_lab" | "challenge";
  xpReward: number;
  content: {
    think: string;
    prompt?: string;
    validate?: string;
  };
}

export interface ModuleConfig {
  id: string;
  title: string;
  description: string;
  phase: "find" | "outreach" | "crm";
  icon: string;
  prerequisite?: string;
  passThreshold: number;
  lessons: LessonConfig[];
}

export const ACADEMY_CURRICULUM: ModuleConfig[] = [
  // ===== FIND PHASE =====
  {
    id: "company-dna",
    title: "Company DNA",
    description: "Extract signals from any website — industry, size, tech stack, hiring patterns.",
    phase: "find",
    icon: "🔬",
    passThreshold: 70,
    lessons: [
      { title: "What Makes a Company 'Ready to Buy'", type: "concept", xpReward: 50, content: { think: "Every company emits buying signals through their website — hiring pages, tech stack, funding news. Learn to read them." } },
      { title: "Reading a Website Like a GTM Pro", type: "concept", xpReward: 50, content: { think: "The homepage tells you what they sell. The careers page tells you what they need. The about page tells you their stage." } },
      { title: "Prompt AI to Analyze a Company", type: "prompt_lab", xpReward: 100, content: { think: "You'll paste a URL and write a prompt to extract company signals.", prompt: "Write a prompt that extracts: industry, company size, product lines, and buying signals from a website.", validate: "AI will grade your prompt on completeness and specificity." } },
      { title: "Judge AI's Company Analysis", type: "prompt_lab", xpReward: 100, content: { think: "AI will analyze a company. Your job: spot what it got right and what it missed.", prompt: "Review the AI output and mark errors or missing signals.", validate: "Scored on how many issues you correctly identified." } },
      { title: "Company DNA Live Lab", type: "challenge", xpReward: 300, content: { think: "Analyze a real company from our database. AI grades your analysis against enriched ground truth.", prompt: "You'll receive a random company. Extract all signals and build a company profile.", validate: "Scored on judgment (40%), speed (20%), override quality (25%), tool efficiency (15%)." } },
    ],
  },
  {
    id: "product-anatomy",
    title: "Product Anatomy",
    description: "Map what a company actually sells — product lines, pricing, target users, competitors.",
    phase: "find",
    icon: "🧬",
    prerequisite: "company-dna",
    passThreshold: 70,
    lessons: [
      { title: "Why Product Lines Matter for GTM", type: "concept", xpReward: 50, content: { think: "A company isn't one buyer — each product line has its own budget holder. Map the products, map the buyers." } },
      { title: "Pricing Models Reveal Buyer Types", type: "concept", xpReward: 50, content: { think: "Consumption-based = IT buyer. Per-seat = department head. Enterprise license = C-suite. Pricing IS the ICP signal." } },
      { title: "Extract Product Lines with AI", type: "prompt_lab", xpReward: 100, content: { think: "Prompt AI to decompose a company's product portfolio.", prompt: "Write a prompt to extract: product names, target user, pricing model, and key competitors for each line.", validate: "Graded on completeness — did you catch all product lines?" } },
      { title: "Map Competitors per Product Line", type: "tool_lab", xpReward: 150, content: { think: "Use AI to identify direct competitors for each product line, not just the company overall.", prompt: "For each product line, identify 2-3 direct competitors and their differentiation.", validate: "Scored on accuracy of competitor mapping." } },
      { title: "Product Anatomy Live Lab", type: "challenge", xpReward: 300, content: { think: "Full product decomposition of a real company. Map every line, its buyer, and its competitor.", prompt: "Build a complete Product Map for the assigned company.", validate: "Scored on judgment (40%), speed (20%), override quality (25%), tool efficiency (15%)." } },
    ],
  },
  {
    id: "pmf-analysis",
    title: "Product-Market Fit",
    description: "Identify which product line solves which pain for which buyer — the PMF matrix.",
    phase: "find",
    icon: "🎯",
    prerequisite: "product-anatomy",
    passThreshold: 70,
    lessons: [
      { title: "Pain → Product → Buyer Chain", type: "concept", xpReward: 50, content: { think: "Great GTM starts with pain, not product. Find the pain first, then map which product solves it and who feels it." } },
      { title: "Budget Source Mapping", type: "concept", xpReward: 50, content: { think: "IT budget vs R&D budget vs Marketing budget — knowing where money comes from tells you who to talk to." } },
      { title: "Build a PMF Matrix", type: "prompt_lab", xpReward: 100, content: { think: "For each product line: what pain does it solve, who feels it, where's the budget?", prompt: "Create a PMF matrix with columns: Product Line, Pain Solved, Who Feels It, Budget Source.", validate: "Scored on accuracy and completeness of the matrix." } },
      { title: "Find the Weakest Competitor", type: "prompt_lab", xpReward: 100, content: { think: "Your entry point is where the incumbent is weakest. AI identifies gaps, you judge which to exploit.", prompt: "Identify the product line where competitors are weakest and explain your entry strategy.", validate: "Scored on strategic reasoning quality." } },
      { title: "PMF Analysis Live Lab", type: "challenge", xpReward: 300, content: { think: "Build a complete PMF matrix for a real company and identify your best entry point.", prompt: "Analyze the assigned company and produce a PMF matrix with entry strategy.", validate: "Scored on judgment (40%), speed (20%), override quality (25%), tool efficiency (15%)." } },
    ],
  },
  {
    id: "market-mapping",
    title: "Market Mapping",
    description: "Build 3-layer ICP trees — Vertical → Segment → Persona — per product line.",
    phase: "find",
    icon: "🗺️",
    prerequisite: "pmf-analysis",
    passThreshold: 70,
    lessons: [
      { title: "Why Niches Beat Broad Markets", type: "concept", xpReward: 50, content: { think: "Selling to 'mid-market SaaS' is 10x harder than selling to 'Series B HR tech companies with 50-200 employees in NYC'." } },
      { title: "The 3-Layer ICP Tree", type: "concept", xpReward: 50, content: { think: "Vertical (industry) → Segment (company type) → Persona (job title). Each layer narrows your target." } },
      { title: "Generate an ICP Tree with AI", type: "prompt_lab", xpReward: 100, content: { think: "Prompt AI to build a 3-layer ICP tree from a company website.", prompt: "Generate a complete ICP tree with at least 3 verticals, 2 segments each, and 2 personas each.", validate: "Scored on tree completeness and niche specificity." } },
      { title: "Prune Bad Branches", type: "prompt_lab", xpReward: 100, content: { think: "AI will generate an ICP tree with some bad branches. Your job: identify and remove the ones that won't convert.", prompt: "Review the ICP tree and explain which branches to cut and why.", validate: "Scored on judgment — did you cut the right branches?" } },
      { title: "Market Mapping Live Lab", type: "challenge", xpReward: 300, content: { think: "Build a product-line-aware ICP tree for a real company.", prompt: "Create a full ICP tree linked to specific product lines.", validate: "Scored on judgment (40%), speed (20%), override quality (25%), tool efficiency (15%)." } },
    ],
  },
  {
    id: "decision-maker-id",
    title: "Decision-Maker ID",
    description: "Distinguish budget holders from influencers and champions using real data.",
    phase: "find",
    icon: "👤",
    prerequisite: "market-mapping",
    passThreshold: 70,
    lessons: [
      { title: "Buyer Roles Framework", type: "concept", xpReward: 50, content: { think: "Decision-maker (signs check), Champion (wants your product), Influencer (shapes opinion), Blocker (says no). Know all four." } },
      { title: "Title Decoding", type: "concept", xpReward: 50, content: { think: "VP ≠ always decision-maker. Director of Ops at a 50-person company IS the decision-maker. Context is everything." } },
      { title: "Find Decision-Makers with Apollo", type: "tool_lab", xpReward: 150, content: { think: "Use Apollo to search for people at a target company. Your job: pick the right titles to search for.", prompt: "Search Apollo for the decision-maker for a specific product line's pain point.", validate: "Scored on whether you found the actual budget holder." } },
      { title: "Judge the Buying Committee", type: "prompt_lab", xpReward: 100, content: { think: "AI will present 5 people at a company. Classify each as decision-maker, champion, influencer, or blocker.", prompt: "Classify each person's buying role and explain your reasoning.", validate: "Scored against known org structure data." } },
      { title: "Decision-Maker Live Lab", type: "challenge", xpReward: 300, content: { think: "For a real company, identify the full buying committee for a specific product line.", prompt: "Find and classify the buying committee using Apollo + AI analysis.", validate: "Scored on judgment (40%), speed (20%), override quality (25%), tool efficiency (15%)." } },
    ],
  },

  // ===== OUTREACH PHASE =====
  {
    id: "pain-mapping",
    title: "Pain Mapping",
    description: "Map public signals to pain points — hiring posts, reviews, news, job listings.",
    phase: "outreach",
    icon: "🩺",
    prerequisite: "decision-maker-id",
    passThreshold: 70,
    lessons: [
      { title: "Pain Signals Are Everywhere", type: "concept", xpReward: 50, content: { think: "A company hiring 5 SDRs = pipeline problem. Bad Glassdoor reviews about tools = tech pain. Job posts ARE pain signals." } },
      { title: "Pain-to-Hook Framework", type: "concept", xpReward: 50, content: { think: "Every pain maps to a hook: 'I noticed you're hiring 5 SDRs — most teams at your stage automate outreach first.'" } },
      { title: "Extract Pain Signals with AI", type: "prompt_lab", xpReward: 100, content: { think: "Prompt AI to find pain signals from a company's public presence.", prompt: "Identify 3 pain signals and map each to a potential hook for outreach.", validate: "Scored on signal quality and hook relevance." } },
      { title: "Match Pain to Value Prop", type: "prompt_lab", xpReward: 100, content: { think: "AI found the pain. Does YOUR product actually solve it? That's the judgment call.", prompt: "For each pain signal, explain whether your solution addresses it and how.", validate: "Scored on solution-problem fit accuracy." } },
      { title: "Pain Mapping Live Lab", type: "challenge", xpReward: 300, content: { think: "Full pain analysis of a real company with hook generation.", prompt: "Analyze a real company, find pain signals, and generate personalized hooks.", validate: "Scored on judgment (40%), speed (20%), override quality (25%), tool efficiency (15%)." } },
    ],
  },
  {
    id: "message-craft",
    title: "Message Craft",
    description: "Write and refine cold outreach that earns replies — AI drafts, you judge and edit.",
    phase: "outreach",
    icon: "✉️",
    prerequisite: "pain-mapping",
    passThreshold: 70,
    lessons: [
      { title: "Anatomy of a Cold Email That Works", type: "concept", xpReward: 50, content: { think: "Hook (pain signal) → Insight (you know something) → CTA (low friction). 3 sentences max." } },
      { title: "Personalization vs. Flattery", type: "concept", xpReward: 50, content: { think: "'Loved your LinkedIn post' = flattery. 'I noticed you're scaling ops without a dedicated RevOps hire' = personalization." } },
      { title: "Draft Outreach with AI", type: "prompt_lab", xpReward: 100, content: { think: "AI will draft a cold email. Your job: improve it. Make it sound like YOU, not a robot.", prompt: "Refine the AI-generated outreach. Edit for authenticity, specificity, and tone.", validate: "Scored on personalization depth and reply-worthiness." } },
      { title: "A/B Test Your Messages", type: "prompt_lab", xpReward: 100, content: { think: "Write two versions. AI scores both. Learn what makes one outperform the other.", prompt: "Write two variants of outreach for the same lead. Explain your hypothesis for each.", validate: "Scored on strategic A/B reasoning." } },
      { title: "Message Craft Live Lab", type: "challenge", xpReward: 300, content: { think: "Write outreach for a real lead from our database. AI scores on the full rubric.", prompt: "Craft personalized outreach for an assigned lead with pain-based hooks.", validate: "Scored on judgment (40%), speed (20%), override quality (25%), tool efficiency (15%)." } },
    ],
  },
  {
    id: "channel-strategy",
    title: "Channel Strategy",
    description: "Choose the right channel — email, LinkedIn, cold call — based on persona and context.",
    phase: "outreach",
    icon: "📡",
    prerequisite: "message-craft",
    passThreshold: 70,
    lessons: [
      { title: "Channel-Persona Fit", type: "concept", xpReward: 50, content: { think: "Engineers respond on Twitter. VPs respond on LinkedIn. CFOs respond to warm intros. Match channel to persona." } },
      { title: "Multi-Touch Sequences", type: "concept", xpReward: 50, content: { think: "Email → LinkedIn view → Email follow-up → LinkedIn message. Sequence matters more than any single touch." } },
      { title: "AI Recommends a Channel", type: "prompt_lab", xpReward: 100, content: { think: "Given a lead profile, AI recommends a channel. Your job: agree or override with better reasoning.", prompt: "Review AI's channel recommendation and accept or override with your rationale.", validate: "Scored on reasoning quality of your channel choice." } },
      { title: "Design a Multi-Touch Sequence", type: "tool_lab", xpReward: 150, content: { think: "Design a 5-touch outreach sequence across multiple channels for a specific persona.", prompt: "Create a sequenced outreach plan with timing, channel, and message theme for each touch.", validate: "Scored on sequence logic and persona fit." } },
      { title: "Channel Strategy Live Lab", type: "challenge", xpReward: 300, content: { think: "Design a full outreach strategy for a real lead — channel, sequence, timing.", prompt: "Build a complete multi-channel outreach plan for the assigned lead.", validate: "Scored on judgment (40%), speed (20%), override quality (25%), tool efficiency (15%)." } },
    ],
  },

  // ===== CRM PHASE =====
  {
    id: "pipeline-design",
    title: "Pipeline Design",
    description: "Build pipeline stages that match your sales cycle — not a generic template.",
    phase: "crm",
    icon: "📊",
    prerequisite: "channel-strategy",
    passThreshold: 70,
    lessons: [
      { title: "Pipeline Stages = Buyer Commitments", type: "concept", xpReward: 50, content: { think: "Each stage represents a commitment the buyer made — not something YOU did. 'Demo booked' ≠ a real stage. 'Agreed to evaluate' = real." } },
      { title: "Exit Criteria per Stage", type: "concept", xpReward: 50, content: { think: "A lead doesn't move forward unless specific criteria are met. No criteria = no pipeline discipline." } },
      { title: "Design Your Pipeline", type: "prompt_lab", xpReward: 100, content: { think: "AI suggests pipeline stages based on your product and market. Customize for your specific sales cycle.", prompt: "Review AI's suggested pipeline and modify stages with your own exit criteria.", validate: "Scored on stage clarity and exit criteria quality." } },
      { title: "Diagnose a Stuck Pipeline", type: "prompt_lab", xpReward: 100, content: { think: "AI shows a pipeline with problems. Identify where deals are getting stuck and why.", prompt: "Analyze the pipeline data and identify bottlenecks with recommended fixes.", validate: "Scored on diagnostic accuracy." } },
      { title: "Pipeline Design Live Lab", type: "challenge", xpReward: 300, content: { think: "Build a custom pipeline for a specific industry vertical using real data.", prompt: "Design a complete pipeline with stages, exit criteria, and velocity targets.", validate: "Scored on judgment (40%), speed (20%), override quality (25%), tool efficiency (15%)." } },
    ],
  },
  {
    id: "lead-scoring",
    title: "Lead Scoring",
    description: "Prioritize leads using AI signals + human override — rank by fit, intent, and timing.",
    phase: "crm",
    icon: "⚡",
    prerequisite: "pipeline-design",
    passThreshold: 70,
    lessons: [
      { title: "Fit vs. Intent vs. Timing", type: "concept", xpReward: 50, content: { think: "Fit = do they match your ICP? Intent = are they actively looking? Timing = is now the right moment? All three must align." } },
      { title: "When to Override AI Scores", type: "concept", xpReward: 50, content: { think: "AI scores on data. You score on relationships. 'I met their CTO at a conference' overrides any algorithm." } },
      { title: "Score a Lead Batch", type: "prompt_lab", xpReward: 100, content: { think: "AI scores 10 leads. Re-rank them based on your judgment and explain your overrides.", prompt: "Review AI-scored leads and re-prioritize with your reasoning.", validate: "Scored on whether your overrides improved the ranking." } },
      { title: "Build a Scoring Model", type: "tool_lab", xpReward: 150, content: { think: "Define weights for fit, intent, and timing signals specific to your market.", prompt: "Create a custom scoring rubric with weighted criteria for your ICP.", validate: "Scored on rubric quality and signal selection." } },
      { title: "Lead Scoring Live Lab", type: "challenge", xpReward: 300, content: { think: "Score and rank real leads from the database. AI evaluates your prioritization.", prompt: "Rank a batch of real leads and justify your top 3 picks.", validate: "Scored on judgment (40%), speed (20%), override quality (25%), tool efficiency (15%)." } },
    ],
  },
  {
    id: "follow-up-cadence",
    title: "Follow-Up Cadence",
    description: "Design timing and persistence strategies — when to push, when to pause, when to walk away.",
    phase: "crm",
    icon: "🔄",
    prerequisite: "lead-scoring",
    passThreshold: 70,
    lessons: [
      { title: "The Science of Follow-Up Timing", type: "concept", xpReward: 50, content: { think: "80% of deals close after 5+ touches. Most reps stop at 2. Persistence ≠ spam — it's strategic patience." } },
      { title: "Reading Engagement Signals", type: "concept", xpReward: 50, content: { think: "Opened 3 times but no reply = interested but not ready. No opens = wrong channel. Replied 'not now' = set a reminder." } },
      { title: "AI Suggests a Cadence", type: "prompt_lab", xpReward: 100, content: { think: "AI designs a follow-up sequence. Your job: adjust timing based on persona behavior.", prompt: "Review and customize the AI-generated follow-up cadence for a specific deal.", validate: "Scored on timing logic and persona awareness." } },
      { title: "The Walk-Away Decision", type: "prompt_lab", xpReward: 100, content: { think: "When do you stop? AI says keep going. Your instinct says move on. Make the call and defend it.", prompt: "For each stalled deal, decide: persist, pause, or walk away. Explain why.", validate: "Scored on strategic reasoning and resource allocation." } },
      { title: "Follow-Up Live Lab", type: "challenge", xpReward: 300, content: { think: "Design a complete follow-up strategy for 5 real deals at different stages.", prompt: "Create personalized follow-up plans for each deal with timing and messaging.", validate: "Scored on judgment (40%), speed (20%), override quality (25%), tool efficiency (15%)." } },
    ],
  },
];
