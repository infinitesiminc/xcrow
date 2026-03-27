/**
 * 100 Incumbents ripe for AI disruption
 * Organized by 22 industry clusters
 * Source: Disruption thesis — Christensen's Innovator's Dilemma + Agentic AI
 */

export interface DisruptionIncumbent {
  id: number;
  name: string;
  age: string;
  vulnerability: string;
  asymmetricAngle: string;
  beachheadNiche: string;
  disruptorModel: string;
  vector: DisruptionVector;
  existingDisruptor?: string;
}

export type DisruptionVector = "Price" | "Speed" | "Niche" | "Unbundle" | "Channel" | "Regulation";

export interface IndustryCluster {
  id: number;
  name: string;
  emoji: string;
  timingCatalyst: string;
  color: string; // HSL
  incumbents: DisruptionIncumbent[];
}

export const DISRUPTION_VECTORS: { vector: DisruptionVector; description: string; emoji: string }[] = [
  { vector: "Price", description: "10x cheaper via AI automation", emoji: "💰" },
  { vector: "Speed", description: "Instant vs days/weeks", emoji: "⚡" },
  { vector: "Niche", description: "Serve the customer segment they ignore", emoji: "🎯" },
  { vector: "Unbundle", description: "Take one feature and do it 10x better", emoji: "🔓" },
  { vector: "Channel", description: "Reach customers they can't reach", emoji: "📡" },
  { vector: "Regulation", description: "Use new laws they haven't adapted to", emoji: "📜" },
];

export const DISRUPTION_STEPS = [
  { step: 1, title: "Find the Vulnerable Incumbent", description: "Look for 3+ vulnerability signals: low NPS, legacy tech, stagnant pricing, oligopoly", emoji: "🔍" },
  { step: 2, title: "Identify the Asymmetric Angle", description: "What can't they do because of their revenue model, customer base, org structure, or tech stack?", emoji: "⚔️" },
  { step: 3, title: "Validate Before Building", description: "Is the market >$1B? Can you reach customers for <$10 CAC? Is there a timing catalyst?", emoji: "✅" },
  { step: 4, title: "The Beachhead Strategy", description: "Pick the smallest defensible niche. Own it completely. Expand from position of strength.", emoji: "🏰" },
  { step: 5, title: "The Disruption Loop", description: "Monitor → Find complaints → Quantify pain → Build solution → Price below → Land customers", emoji: "🔄" },
  { step: 6, title: "The Incumbent's Dilemma", description: "Model WHY they can't respond: cutting prices kills margins, serving your niche means abandoning premium", emoji: "🛡️" },
];

export const INDUSTRY_CLUSTERS: IndustryCluster[] = [
  {
    id: 1, name: "Legal & Compliance", emoji: "⚖️",
    timingCatalyst: "EU AI Act & Colorado AI Act deadlines (2026)",
    color: "262 83% 58%",
    incumbents: [
      { id: 1, name: "LexisNexis", age: "50+ yrs", vulnerability: "High-margin subscription model makes them fear per-query AI agents", asymmetricAngle: "Unbundle: Sell an agent that only does California AI Act Compliance", beachheadNiche: "Colorado-only AI disclosure auditor for small firms", disruptorModel: "Pay-per-Brief Agent: $10 per Validated Memorandum vs $400/mo", vector: "Unbundle", existingDisruptor: "Harvey AI / Paxton AI" },
      { id: 2, name: "Tabs3", age: "Founded 1979", vulnerability: "Clunky desktop-first legacy UI, low NPS among Gen Z lawyers", asymmetricAngle: "Speed: Automated Passive Time-Tracking via screen/email agent", beachheadNiche: "Mac/Windows background app that auto-generates billing entries", disruptorModel: "Invisible Bookkeeper: 1% of total billed revenue", vector: "Speed", existingDisruptor: "Time by Ping" },
      { id: 3, name: "Thomson Reuters (Westlaw)", age: "Oligopoly", vulnerability: "Forces long-term multi-year contracts with 5% annual escalators", asymmetricAngle: "Price: 10x cheaper via RAG on public court data", beachheadNiche: "Agent that writes Opposition to Motion drafts from free public filings", disruptorModel: "Shadow Auditor: $500/year Compliance Shield", vector: "Price", existingDisruptor: "Luminance" },
    ],
  },
  {
    id: 2, name: "HR & Payroll", emoji: "👔",
    timingCatalyst: "2026 SaaSpocalypse: shift from per-seat to outcome-based pricing",
    color: "217 91% 60%",
    incumbents: [
      { id: 4, name: "ADP", age: "70+ yrs", vulnerability: "Massive tech debt, every feature is a wrapper on 1990s mainframe", asymmetricAngle: "Org Structure: ADP is sales-led and slow, you are product-led and instant", beachheadNiche: "Instant Payroll for 1-person LLCs paying international contractors", disruptorModel: "Zero-Tax-Error Guarantee: flat $2/employee/month + 100% liability", vector: "Speed", existingDisruptor: "Warp" },
      { id: 5, name: "Gusto", age: "10+ yrs", vulnerability: "Support Quicksand — users can't get a human when things break", asymmetricAngle: "Channel: Reach hyper-local Main Street shops Gusto ignores", beachheadNiche: "WhatsApp-based payroll bot: text 'Pay John $800' to run payroll", disruptorModel: "WhatsApp Payroll Bot: $25/mo flat for teams under 5", vector: "Channel", existingDisruptor: "Rippling" },
      { id: 6, name: "Workday", age: "Enterprise-only", vulnerability: "Implementation 6-12 months, $100k+ starting price", asymmetricAngle: "Niche: Workday for the 10-person agency with 2-week setup", beachheadNiche: "AI-agent that scrapes Slack/Email to build employee directory instantly", disruptorModel: "Headless HCM: $5 per Successful Onboarding", vector: "Niche", existingDisruptor: "HiBob / Humaans" },
    ],
  },
  {
    id: 3, name: "Insurance & Corporate Ethics", emoji: "🛡️",
    timingCatalyst: "2026 Healthcare enforcement & Applied Systems antitrust lawsuit",
    color: "152 60% 45%",
    incumbents: [
      { id: 7, name: "Applied Systems", age: "Monopolist (80% share)", vulnerability: "Using sham litigation to kill rivals per 2026 lawsuits", asymmetricAngle: "Regulation: Use 2026 NAIC Uniform Application updates to automate licensing", beachheadNiche: "Auto-Licensing agent for individual P&C brokers in TX/FL", disruptorModel: "Independent Accounting Node: $0.50 per auto-reconciled commission", vector: "Regulation", existingDisruptor: "Cytora" },
      { id: 8, name: "NAVEX (EthicsPoint)", age: "20+ yrs", vulnerability: "Legacy Whistleblower Hotline feels like a 2005 web form", asymmetricAngle: "Unbundle: Mobile-first encrypted chat for anonymous reporting", beachheadNiche: "Anonymous Speak Up bot for restaurant chains", disruptorModel: "Speak-Up Chatbot: Freemium to 50 employees, $99/mo Enterprise", vector: "Unbundle", existingDisruptor: "AllVoices / Whispli" },
    ],
  },
  {
    id: 4, name: "Enterprise Accounting (ERP)", emoji: "📊",
    timingCatalyst: "Rise of Agentic Accounting — agents replace dashboard logins",
    color: "38 92% 50%",
    incumbents: [
      { id: 9, name: "NetSuite", age: "Founded 1998", vulnerability: "Extremely complex UI, requires consultants to implement", asymmetricAngle: "Tech Stack: AI-native agent that sees across all data silos", beachheadNiche: "Anomaly Detector that connects to NetSuite API and flags Ghost Expenses", disruptorModel: "Anomaly Bounty Hunter: 10% of found Ghost Expenses/duplicates", vector: "Unbundle", existingDisruptor: "Vic.ai" },
      { id: 10, name: "Sage Intacct", age: "Mid-market", vulnerability: "Doubled user fees in 2026, pricing hasn't adapted to AI-efficiency era", asymmetricAngle: "Price: Move from Per User to Per Audit pricing", beachheadNiche: "Agent that reconciles Stripe vs Bank statements for SaaS startups", disruptorModel: "Audit-Ready Ledger: $100 per Verified Monthly Close", vector: "Price", existingDisruptor: "Digits / Zeni" },
    ],
  },
  {
    id: 5, name: "Construction & PropTech", emoji: "🏗️",
    timingCatalyst: "2026 Green Building Mandates & skilled trades labor shortage",
    color: "30 70% 50%",
    incumbents: [
      { id: 11, name: "Procore", age: "Founded 2002", vulnerability: "Software for the trailer, not the field. Mobile app is clunky", asymmetricAngle: "Speed/Channel: Workers report progress via Voice/WhatsApp, no app login", beachheadNiche: "Agent that listens to foremen voice notes and auto-updates schedules", disruptorModel: "Headless Field Agent: voice-first construction management", vector: "Channel", existingDisruptor: "Buildots" },
      { id: 12, name: "Autodesk (Revit)", age: "Legacy", vulnerability: "Proprietary formats, high pricing, built for skyscrapers", asymmetricAngle: "Niche: Generative ADU Design for backyard tiny homes", beachheadNiche: "Auto-generate permit-ready plans for California ADUs", disruptorModel: "Per-permit generative design tool", vector: "Niche", existingDisruptor: "TestFit" },
      { id: 13, name: "CoStar", age: "Monopoly", vulnerability: "CRE data monopoly, $1k+/mo, captive feel", asymmetricAngle: "Price/Channel: Crowdsourced agentic data from LinkedIn/social", beachheadNiche: "Shadow LoopNet for Industrial Warehouse subleases in Tier 2 cities", disruptorModel: "Crowdsourced CRE intelligence platform", vector: "Price", existingDisruptor: "Crexi" },
      { id: 14, name: "Yardi / AppFolio", age: "20+ yrs", vulnerability: "Legacy ledger logic, months-long implementation", asymmetricAngle: "Speed: AI handles 100% of Maintenance Ticketing via SMS", beachheadNiche: "SMS bot for Student Housing maintenance triage", disruptorModel: "Autonomous Property Manager", vector: "Speed" },
      { id: 15, name: "DocuSign", age: "Stagnant product", vulnerability: "High per-envelope tax, commodity e-signature", asymmetricAngle: "Niche/Regulation: Self-Executing Lien Waiver with payment escrow", beachheadNiche: "Payment-contingent escrow for General Contractors", disruptorModel: "Payment-linked signature + escrow agent", vector: "Regulation" },
    ],
  },
  {
    id: 6, name: "Healthcare & Pharma Admin", emoji: "🏥",
    timingCatalyst: "2026 Medicare Price Negotiation & Value-Based Care requirements",
    color: "185 95% 50%",
    incumbents: [
      { id: 16, name: "Epic Systems", age: "Walled Garden", vulnerability: "Regulatory capture via hospital lobbying, $Millions implementation", asymmetricAngle: "Unbundle: Agent that extracts signal from Epic noise", beachheadNiche: "AI scribe that only generates Discharge Summaries for Oncology", disruptorModel: "Patient Chart Summarizer overlay", vector: "Unbundle", existingDisruptor: "Ambience Healthcare" },
      { id: 17, name: "IQVIA", age: "Legacy", vulnerability: "Ancient interface, enterprise-only opaque pricing", asymmetricAngle: "Niche: Trials for Digital Health (non-drug clinical trials)", beachheadNiche: "Automated Patient Recruitment agent for Mental Health startups", disruptorModel: "Digital trial platform for therapy apps/wearables", vector: "Niche", existingDisruptor: "Paradigm" },
      { id: 18, name: "Veeva Systems", age: "Monopoly", vulnerability: "Built on old Salesforce architecture", asymmetricAngle: "Speed/Price: Replace Field Rep portal with instant medical-query bot", beachheadNiche: "Compliance-verified chatbot for Rare Disease physicians", disruptorModel: "Medical Affairs Agent", vector: "Speed" },
      { id: 19, name: "Change Healthcare", age: "Legacy", vulnerability: "Massive legacy clearinghouse, recent high-profile hacks decimated trust", asymmetricAngle: "Speed/Tech Stack: Pre-audit claims in milliseconds instead of days", beachheadNiche: "Claims auditor for Telehealth Speech Therapy providers", disruptorModel: "Instant Claims Clearinghouse", vector: "Speed" },
      { id: 20, name: "McKesson", age: "Trillion-dollar", vulnerability: "Pricing hasn't changed, high margin on efficiency fees", asymmetricAngle: "Regulation: Automate 2026 DSCSA pedigree tracking", beachheadNiche: "Automated Pedigree Tracker for independent pharmacies", disruptorModel: "Compliance automation per-transaction", vector: "Regulation" },
    ],
  },
  {
    id: 7, name: "GovTech", emoji: "🏛️",
    timingCatalyst: "2026 Digital Citizen Executive Order & Tyler Technologies breach settlements",
    color: "330 90% 60%",
    incumbents: [
      { id: 21, name: "Tyler Technologies", age: "Legacy", vulnerability: "Class-action lawsuits from wrongful arrests caused by software lag", asymmetricAngle: "Speed: Real-Time Justice Agent fixing lag between court orders and police DBs", beachheadNiche: "SMS alerts for Public Defenders flagging Discrepancy Errors", disruptorModel: "Real-time justice sync layer", vector: "Speed" },
      { id: 22, name: "Accela", age: "20+ yrs", vulnerability: "Permitting takes months, UI is a maze of required fields", asymmetricAngle: "Niche: Solar Permit Fast-Pass using AI + satellite imagery", beachheadNiche: "Agent auditing residential solar applications for one city (Phoenix)", disruptorModel: "AI-powered permit automation", vector: "Niche" },
      { id: 23, name: "CentralSquare", age: "Legacy", vulnerability: "Dispatchers complain about frozen screens during 911 calls", asymmetricAngle: "Channel: Civilian First-Response Bot bypassing dispatch UI", beachheadNiche: "Web-link for 911 callers to live stream emergency to officers", disruptorModel: "Citizen-direct emergency communication", vector: "Channel" },
      { id: 24, name: "Granicus", age: "Founded 1999", vulnerability: "Feature bloat, low NPS for government meeting/website CMS", asymmetricAngle: "Unbundle: AI Meeting Clerk that only transcribes City Council meetings", beachheadNiche: "Searchable video archive for small-town school board meetings", disruptorModel: "Per-meeting AI transcription service", vector: "Unbundle" },
      { id: 25, name: "Black Mountain", age: "Legacy ERP", vulnerability: "Small-town clerks still use keyboard shortcuts from the 90s", asymmetricAngle: "Price: Per-Transaction pricing for municipalities <5k people", beachheadNiche: "Automated Water Bill collector that texts residents", disruptorModel: "Per-transaction municipal utility billing", vector: "Price" },
    ],
  },
  {
    id: 8, name: "Higher Ed Admin", emoji: "🎓",
    timingCatalyst: "2026 Enrollment Cliff — universities desperate to cut admin bloat",
    color: "82 85% 55%",
    incumbents: [
      { id: 26, name: "Ellucian (Banner)", age: "50+ yrs", vulnerability: "Systems only work because legacy employees know workarounds. NPS in teens", asymmetricAngle: "Tech Stack: Headless Registrar — AI layer over Banner", beachheadNiche: "Add/Drop WhatsApp bot for students to change classes", disruptorModel: "Headless university registrar interface", vector: "Speed" },
      { id: 27, name: "Jenzabar", age: "Legacy", vulnerability: "High tech debt, data integrity issues across departments", asymmetricAngle: "Speed: 1-Hour Financial Aid Award using AI to read tax returns", beachheadNiche: "FAFSA-scanning agent for Private Liberal Arts Colleges", disruptorModel: "Instant financial aid processing", vector: "Speed" },
      { id: 28, name: "Anthology", age: "Merged legacy", vulnerability: "Integration Hell between acquired products (Blackboard/Campus Mgmt)", asymmetricAngle: "Niche: Alumni Engagement Agent with personalized career updates", beachheadNiche: "Agent that crawls Alumni LinkedIn to update university database", disruptorModel: "AI-powered alumni engagement", vector: "Niche" },
      { id: 29, name: "Instructure (Canvas)", age: "Market leader", vulnerability: "Getting feature heavy, pricing increasing for up-market", asymmetricAngle: "Unbundle: AI Teaching Assistant that grades essays inside Canvas", beachheadNiche: "Feedback Loop tool for Freshman English courses", disruptorModel: "Per-essay grading agent", vector: "Unbundle" },
      { id: 30, name: "Oracle PeopleSoft", age: "Enterprise", vulnerability: "Institutions terrified to upgrade because it breaks everything", asymmetricAngle: "Zero-Migration Data Fabric: query via Natural Language", beachheadNiche: "Slack bot for Deans to ask remaining department budget", disruptorModel: "Natural language data query layer", vector: "Speed" },
    ],
  },
  {
    id: 9, name: "Energy & Utilities", emoji: "⚡",
    timingCatalyst: "OBBBA 2025 mandating time-of-use pricing by 2027",
    color: "45 100% 50%",
    incumbents: [
      { id: 31, name: "Oracle Utilities", age: "Legacy", vulnerability: "Cannot handle dynamic pricing for 1M+ households without upgrades", asymmetricAngle: "Speed: Virtual Power Plant Orchestrator that balances, not just bills", beachheadNiche: "Agent managing EV charging for one specific neighborhood", disruptorModel: "VPP orchestration per-node", vector: "Speed" },
      { id: 32, name: "Itron / Landis+Gyr", age: "Oligopoly", vulnerability: "Smart hardware, but software is a 2010s data silo", asymmetricAngle: "Channel: Smart-Meter API selling data to homeowners, not just utility", beachheadNiche: "App showing real-time appliance burn cost", disruptorModel: "Consumer energy intelligence", vector: "Channel" },
      { id: 33, name: "GE Vernova", age: "Legacy SCADA", vulnerability: "Highly vulnerable to 2026 cyber-threats", asymmetricAngle: "Regulation: 2026 Interconnection Agent speeding Renewable Energy Queue 10x", beachheadNiche: "Automated Impact Study generator for small solar farm developers", disruptorModel: "Per-study renewable interconnection agent", vector: "Regulation" },
      { id: 34, name: "Siemens (Grid)", age: "Industrial", vulnerability: "Massive tech debt, slow consultant-heavy implementation", asymmetricAngle: "Niche: Microgrid-as-a-Service for Corporate Campuses going off-grid", beachheadNiche: "Storage Optimizer for one hospital backup battery system", disruptorModel: "Microgrid management subscription", vector: "Niche" },
      { id: 35, name: "SAP (Energy)", age: "NPS ~12", vulnerability: "Energy Suite too rigid for decentralized energy", asymmetricAngle: "Price: Performance-Based Billing Engine — pay only on error found", beachheadNiche: "Ghost Usage auditor for commercial office buildings", disruptorModel: "Performance-based billing optimization", vector: "Price" },
    ],
  },
  {
    id: 10, name: "Supply Chain & 3PL", emoji: "🚢",
    timingCatalyst: "2026 Logistics Transparency Act requiring real-time carbon tracking",
    color: "200 80% 50%",
    incumbents: [
      { id: 36, name: "Manhattan Associates", age: "WMS king", vulnerability: "Still relies on scanning barcodes for every movement", asymmetricAngle: "Tech Stack: Computer Vision WMS using existing security cameras", beachheadNiche: "Dock Door Auditor flagging misloaded pallets via camera", disruptorModel: "Vision-based warehouse management", vector: "Speed" },
      { id: 37, name: "Blue Yonder (JDA)", age: "Complex", vulnerability: "Last Agentic update seen as a bolt-on", asymmetricAngle: "Unbundle: Disruption Response Agent for What if a ship is late?", beachheadNiche: "Suez/Panama Canal risk-dashboard for mid-sized retailers", disruptorModel: "Supply chain disruption intelligence", vector: "Unbundle" },
      { id: 38, name: "WiseTech Global", age: "Dominant", vulnerability: "Per-shipment tax eating margins", asymmetricAngle: "Price: Zero-Tax Forwarding via automated paperwork", beachheadNiche: "Automated Customs Broker for US-Mexico cross-border trade", disruptorModel: "Flat monthly subscription freight forwarding", vector: "Price" },
      { id: 39, name: "SAP (S/4HANA)", age: "ERP giant", vulnerability: "Too slow to react to changes", asymmetricAngle: "Speed: Continuous Inventory Scribe listening to warehouse radios", beachheadNiche: "Voice-to-Inventory tool for Cold Storage facilities", disruptorModel: "Voice-first inventory management", vector: "Speed" },
      { id: 40, name: "Descartes", age: "Legacy EDI", vulnerability: "Expensive and slow Electronic Data Interchange", asymmetricAngle: "Tech Stack: EDI Translator turning PDF emails into EDI messages", beachheadNiche: "Email-to-Order agent for small auto-parts distributors", disruptorModel: "AI-powered EDI bridge", vector: "Speed" },
    ],
  },
  {
    id: 11, name: "Retail & Commerce", emoji: "🛒",
    timingCatalyst: "2026 Universal Payment Interoperability laws & POS model collapse",
    color: "330 70% 55%",
    incumbents: [
      { id: 41, name: "NCR Voyix", age: "NPS ~4", vulnerability: "Heavily reliant on legacy hardware, price hikes with no value", asymmetricAngle: "Price/Tech: App-Free POS processing payments via smartphone camera", beachheadNiche: "Pop-up Store terminal for QR payments at farmer's markets", disruptorModel: "Camera-based POS", vector: "Price" },
      { id: 42, name: "Oracle MICROS", age: "Legacy", vulnerability: "$20k+ implementation, Windows XP-style interface, slow support", asymmetricAngle: "Speed: 10-Minute Restaurant Setup scanning PDF menu to build POS", beachheadNiche: "POS for Ghost Kitchens syncing DoorDash and UberEats", disruptorModel: "Instant restaurant POS", vector: "Speed" },
      { id: 43, name: "Salesforce Commerce Cloud", age: "Enterprise", vulnerability: "Extreme pricing complexity, requires army of consultants", asymmetricAngle: "Niche: Headless Shopfront for Creators — TikTok to checkout", beachheadNiche: "Auto-generate Shopify checkout links from YouTube video scripts", disruptorModel: "Creator commerce agent", vector: "Niche" },
      { id: 44, name: "SAP Retail", age: "Legacy", vulnerability: "AI messaging outpaces actual modernization, data trapped in silos", asymmetricAngle: "Unbundle: Real-Time Stock Auditor fixing inventory inaccuracies", beachheadNiche: "Slack bot alerting when SAP says In Stock but shelf is empty", disruptorModel: "Real-time inventory truth layer", vector: "Unbundle" },
      { id: 45, name: "Manhattan Active", age: "Enterprise", vulnerability: "High complexity in omnichannel returns", asymmetricAngle: "Channel: Return-to-Local Agent rerouting returns to nearest buyer", beachheadNiche: "Buy-Back widget for luxury sneaker resellers", disruptorModel: "Peer-to-peer return marketplace", vector: "Channel" },
    ],
  },
  {
    id: 12, name: "Manufacturing & Industrial", emoji: "🏭",
    timingCatalyst: "May 2026 Epicor Classic UI sunset & global on-shoring shift",
    color: "15 80% 50%",
    incumbents: [
      { id: 46, name: "Rockwell Automation", age: "Legacy", vulnerability: "Slow transition from hardware logic to Cloud-Edge software", asymmetricAngle: "Tech Stack: PLC Translator explaining code in plain English to new workers", beachheadNiche: "Troubleshooting Guide bot for injection molding machines", disruptorModel: "Industrial AI assistant", vector: "Speed" },
      { id: 47, name: "Epicor Kinetic", age: "Sunsetting", vulnerability: "Classic UI sunset forcing expensive painful migrations", asymmetricAngle: "Price/Speed: Zero-Migration MES — agent runs Shop Floor terminal", beachheadNiche: "Mobile Work Order viewer for metal fabrication operators", disruptorModel: "Overlay MES without migration", vector: "Price" },
      { id: 48, name: "Dassault Systèmes (Enovia)", age: "Legacy PLM", vulnerability: "Opaque pricing, heavy and slow software", asymmetricAngle: "Unbundle: Bill of Materials Agent auto-updating parts prices globally", beachheadNiche: "BOM optimizer for Drone Startups", disruptorModel: "AI-powered BOM management", vector: "Unbundle" },
      { id: 49, name: "Plex Systems", age: "Vertical MES", vulnerability: "Rigid Workflows that don't adapt to custom manufacturing", asymmetricAngle: "Niche: Micro-Factory OS for 3D Printing and CNC shops <10 employees", beachheadNiche: "Automated Quoting Engine reading CAD files, price in 5 seconds", disruptorModel: "Instant manufacturing quote agent", vector: "Niche" },
      { id: 50, name: "Infor CloudSuite", age: "Generalist", vulnerability: "Tries to be everything, NPS plummeted 2025/2026", asymmetricAngle: "Speed/Channel: Warehouse Voice-Scribe — no typing, voice logging", beachheadNiche: "Hands-Free inventory logger for Cold Storage food workers", disruptorModel: "Voice-first warehouse management", vector: "Channel" },
    ],
  },
  {
    id: 13, name: "Agriculture & Food", emoji: "🌾",
    timingCatalyst: "2026 Right to Repair victories & EU Soil Monitoring laws",
    color: "120 60% 40%",
    incumbents: [
      { id: 51, name: "John Deere Ops Center", age: "Walled garden", vulnerability: "Restricted data access for independent repair shops (Regulatory Capture)", asymmetricAngle: "Regulation: Open-Tractor API using Right-to-Repair laws", beachheadNiche: "Maintenance Predictor for independent wheat farmers in Midwest", disruptorModel: "Open tractor health dashboard", vector: "Regulation" },
      { id: 52, name: "Trimble (Ag)", age: "Legacy", vulnerability: "GPS hardware great, software is afterthought", asymmetricAngle: "Unbundle: Variable-Rate Scriptwriter based on weather data", beachheadNiche: "One-Click Prescription tool for Canola farmers in Manitoba", disruptorModel: "AI precision agriculture prescriptions", vector: "Unbundle" },
      { id: 53, name: "Nutrien Ag Solutions", age: "Monopoly", vulnerability: "Pricing tied to own chemical/seed sales (conflict of interest)", asymmetricAngle: "Niche: Bio-Organic Planner for farmers transitioning away from chemicals", beachheadNiche: "Carbon Credit calculator for regenerative farmers", disruptorModel: "Independent ag planning + carbon credits", vector: "Niche" },
      { id: 54, name: "SAP Food & Beverage", age: "Legacy", vulnerability: "Brittle UI-dependent programs, messy master data", asymmetricAngle: "Speed: Recall Agent identifying contaminated batches in minutes", beachheadNiche: "Recall Readiness auditor for mid-sized dairy producers", disruptorModel: "Real-time food safety intelligence", vector: "Speed" },
      { id: 55, name: "Corteva (Granular)", age: "Acquired", vulnerability: "Stagnant features since acquisition", asymmetricAngle: "Channel: WhatsApp Agronomist — farmers get soil advice via chat", beachheadNiche: "Harvest Window predictor for Wine Vineyards", disruptorModel: "Chat-based agronomic advisory", vector: "Channel" },
    ],
  },
  {
    id: 14, name: "Hospitality & Travel", emoji: "✈️",
    timingCatalyst: "2026 Hotel PMS Report: 49% operators want AI-native automation",
    color: "280 70% 55%",
    incumbents: [
      { id: 56, name: "Oracle Opera", age: "Legacy", vulnerability: "3-12 month implementation, costs up to $500k, 1995-era interface", asymmetricAngle: "Price/Tech: Headless Hotel — agents handle 100% check-ins via mobile", beachheadNiche: "Self-Check-in bot for Boutique Hotels with <20 rooms", disruptorModel: "Zero-front-desk hotel operations", vector: "Price" },
      { id: 57, name: "Amadeus (GDS)", age: "Middleman", vulnerability: "Fees haven't changed, captive travel agent base", asymmetricAngle: "Speed/Price: Direct-Connect Agent bypassing GDS fees via airline APIs", beachheadNiche: "Corporate Travel tool for small law firms auto-booking cheapest direct", disruptorModel: "GDS-free direct booking agent", vector: "Price" },
      { id: 58, name: "Sabre", age: "Legacy", vulnerability: "High Technical Debt risk factors in 2025/2026 reports", asymmetricAngle: "Niche: Travel Agency Copilot turning client emails into itineraries", beachheadNiche: "Draft-to-Sabre tool for luxury travel consultants", disruptorModel: "AI travel planning assistant", vector: "Niche" },
      { id: 59, name: "Cvent", age: "Monopoly", vulnerability: "Over-complicated for small/mid-sized conferences", asymmetricAngle: "Unbundle: Instant Speaker-Matcher finding and booking speakers by topic", beachheadNiche: "Speaker Outreach bot for Tech Meetups", disruptorModel: "AI event speaker marketplace", vector: "Unbundle" },
      { id: 60, name: "Choice Hotels (ChoiceEdge)", age: "Legacy PMS", vulnerability: "Support Quicksand for franchisees", asymmetricAngle: "Speed: Franchise Optimizer auto-adjusting rates based on local events", beachheadNiche: "Dynamic Pricing bot for Choice hotels near Major Stadiums", disruptorModel: "AI-powered franchise revenue optimization", vector: "Speed" },
    ],
  },
  {
    id: 15, name: "Media & AdTech", emoji: "📺",
    timingCatalyst: "2026 MRC whistleblowing on Nielsen & death of third-party cookies",
    color: "350 80% 55%",
    incumbents: [
      { id: 61, name: "Nielsen", age: "Oligopoly", vulnerability: "Double-digit accuracy declines in Big Data demographic panels", asymmetricAngle: "Price/Speed: Synthetic Panels using AI to model audience behavior", beachheadNiche: "Accuracy auditor for Streaming TV ads on niche platforms", disruptorModel: "AI-powered synthetic audience measurement", vector: "Price" },
      { id: 62, name: "Mediaocean", age: "Legacy", vulnerability: "Decades-old tech slowing agile marketing teams", asymmetricAngle: "Speed: Headless Media Buyer executing across TikTok/Meta/Google instantly", beachheadNiche: "Automated Direct-to-Buy agent for local political campaigns", disruptorModel: "API-first programmatic buying", vector: "Speed" },
      { id: 63, name: "Comscore", age: "Legacy", vulnerability: "Hasn't adapted to Privacy-First cookieless web of 2026", asymmetricAngle: "Tech Stack: Zero-Knowledge Measurement via edge-AI, no personal data", beachheadNiche: "Privacy-Safe dashboard for Substack and Newsletter publishers", disruptorModel: "Privacy-native digital measurement", vector: "Speed" },
      { id: 64, name: "Kantar", age: "30+ yrs", vulnerability: "Relies on slow manual survey-based market research", asymmetricAngle: "Speed: Real-Time Sentiment Agent replacing surveys with social listening", beachheadNiche: "Crisis Monitor for CPG brands during PR flubs", disruptorModel: "Real-time AI sentiment intelligence", vector: "Speed" },
      { id: 65, name: "DoubleVerify", age: "High pricing", vulnerability: "Captive market (Ad Agencies), per-impression tax", asymmetricAngle: "Unbundle: Fraud Hunter for Micro-Influencers in the long-tail", beachheadNiche: "Agent flagging Bot Followers on Instagram/LinkedIn for small agencies", disruptorModel: "Micro-influencer verification service", vector: "Unbundle" },
    ],
  },
  {
    id: 16, name: "EdTech & K-12", emoji: "📚",
    timingCatalyst: "2026 AI Assessment Crisis — traditional homework 100% defeatable by LLMs",
    color: "160 70% 45%",
    incumbents: [
      { id: 66, name: "Pearson (MyLab)", age: "100+ yrs", vulnerability: "BBB complaints cite system delays and unfair access denial", asymmetricAngle: "Price/Tech: Open-Source Tutor with no Access Codes required", beachheadNiche: "AI Biology 101 companion for Community College students", disruptorModel: "Open-source AI tutoring", vector: "Price" },
      { id: 67, name: "PowerSchool", age: "Oligopoly K-12", vulnerability: "Tech debt from acquisitions, UX Maze", asymmetricAngle: "Niche: Charter School Registrar for agile compliance", beachheadNiche: "Waitlist Management bot for Specialty Charter Schools", disruptorModel: "Lightweight charter school admin", vector: "Niche" },
      { id: 68, name: "Infinite Campus", age: "SIS leader", vulnerability: "Confusing for novices, lacks modern AI automation", asymmetricAngle: "Speed: Instant Attendance Scribe replacing manual entries with Vision-AI", beachheadNiche: "Late-Slip bot for middle schools handling morning tardiness", disruptorModel: "AI-powered attendance automation", vector: "Speed" },
      { id: 69, name: "Anthology (LMS)", age: "Merged", vulnerability: "Massive merger, implementation takes months, data siloed", asymmetricAngle: "Channel: Career-Path Agent connecting student performance to LinkedIn Jobs", beachheadNiche: "Job-Readiness Scorecard for Trade Schools", disruptorModel: "Student-to-career pipeline agent", vector: "Channel" },
      { id: 70, name: "Frontline Education", age: "Legacy", vulnerability: "Stagnant updates, clunky mobile experiences", asymmetricAngle: "Speed: Sub-Teacher Matcher with Uber-style Instant-Book", beachheadNiche: "SMS-based sub-matching bot for one suburban school district", disruptorModel: "Instant substitute teacher marketplace", vector: "Speed" },
    ],
  },
  {
    id: 17, name: "Non-Profit & NGO", emoji: "🤝",
    timingCatalyst: "2026 Great Retention Crisis — mid-market leaving legacy CRMs",
    color: "270 60% 55%",
    incumbents: [
      { id: 71, name: "Blackbaud (Raiser's Edge)", age: "40+ yrs", vulnerability: "Overwhelmingly complicated backend, price hikes, captive data", asymmetricAngle: "Price/Unbundle: 10-Minute Donor Manager — talk to your data, zero training", beachheadNiche: "Major Gift Prospector scanning local news for donor leads", disruptorModel: "AI donor intelligence", vector: "Price" },
      { id: 72, name: "DonorPerfect", age: "Stagnant", vulnerability: "Captive users due to data migration fears", asymmetricAngle: "Zero-Migration Fabric connecting to API and fixing UI without data move", beachheadNiche: "Mobile Donor Outreach agent for Museum directors", disruptorModel: "Overlay CRM without migration", vector: "Speed" },
      { id: 73, name: "Neon One", age: "Mid-market", vulnerability: "AI features feel bolted-on rather than native", asymmetricAngle: "Speed: Instant Tax-Receipt Bot automating the most hated admin task", beachheadNiche: "Tool for Church/Synagogue treasurers issuing annual reports", disruptorModel: "Automated tax receipt service", vector: "Speed" },
      { id: 74, name: "Bonterra (Salsa Labs)", age: "PE consolidated", vulnerability: "Feature Bloat, declining support quality", asymmetricAngle: "Niche: Legislative Action Agent — 1-click WhatsApp advocacy", beachheadNiche: "Call Your Rep bot for Climate Action non-profits", disruptorModel: "Instant advocacy mobilization", vector: "Niche" },
      { id: 75, name: "Bloomerang", age: "Growing", vulnerability: "Pricing increasing as they move up-market", asymmetricAngle: "Channel: Local Charity Copilot for grassroots <$1M non-profits", beachheadNiche: "Grant-Writing Agent drafting proposals in 5 minutes", disruptorModel: "AI grant writing for small orgs", vector: "Channel" },
    ],
  },
  {
    id: 18, name: "Wealth Management", emoji: "💎",
    timingCatalyst: "Great Wealth Transfer 2025-2026: $84T moving to Gen Z/Millennials",
    color: "45 80% 45%",
    incumbents: [
      { id: 76, name: "Envestnet (Tamarac)", age: "20+ yrs", vulnerability: "Best of the worst — powerful but zero flexibility", asymmetricAngle: "Tech Stack: Agentic Rebalancer with Goal-based AI agents", beachheadNiche: "Tax-Loss Harvesting auditor for Small Independent Advisors (RIAs)", disruptorModel: "AI-powered portfolio rebalancing", vector: "Speed" },
      { id: 77, name: "SS&C Advent", age: "Massive debt", vulnerability: "Pricing hasn't changed, owns the middle office", asymmetricAngle: "Price: Open-Accounting Node charging per-audit not licensing tax", beachheadNiche: "Portfolio Performance auditor for Multi-Family Offices", disruptorModel: "Per-audit accounting service", vector: "Price" },
      { id: 78, name: "SEI Investments", age: "Legacy", vulnerability: "Dominates bank-trust processing, interface feels like 1992", asymmetricAngle: "Niche: Trusts for the Rest of Us — automate small family trust logic", beachheadNiche: "Trust-Distribution agent for middle-class estate executors", disruptorModel: "Democratized trust management", vector: "Niche" },
      { id: 79, name: "Fidelity (Wealthscape)", age: "Oligopoly", vulnerability: "Data Silos between Fidelity and other tools", asymmetricAngle: "Unbundle: Unified Advisory Inbox syncing Fidelity with Salesforce/Slack", beachheadNiche: "Client-Update agent texting clients when trades settle", disruptorModel: "Cross-platform advisory sync", vector: "Unbundle" },
      { id: 80, name: "Morningstar Direct", age: "Monopoly", vulnerability: "Ratings data monopoly, $20k+/year pricing", asymmetricAngle: "Open-Source quantitative data replacing proprietary ratings", beachheadNiche: "ESG Auditor agent for Sustainable Investing startups", disruptorModel: "Open-source investment intelligence", vector: "Price" },
    ],
  },
  {
    id: 19, name: "Deep Science & Pharma R&D", emoji: "🧬",
    timingCatalyst: "2026 Medicine Maker report: 95% scientists can't analyze data independently",
    color: "190 80% 45%",
    incumbents: [
      { id: 81, name: "Benchling / IDBS", age: "10+ yrs", vulnerability: "Transitioned from innovation to passive record-keeping", asymmetricAngle: "Speed: Active Lab Partner flagging experiment duplication proactively", beachheadNiche: "Protocol Checker for CRISPR startups auditing redundancy", disruptorModel: "Proactive lab intelligence", vector: "Speed" },
      { id: 82, name: "Dotmatics", age: "Legacy portfolio", vulnerability: "Integration fatigue across acquired products", asymmetricAngle: "Tech Stack: Headless LIMS — API-first, scientists use Python/R directly", beachheadNiche: "Data-Uploader for early-stage Biotech moving from Excel to cloud", disruptorModel: "Developer-first lab information system", vector: "Speed" },
      { id: 83, name: "Waters (Empower)", age: "Monopoly", vulnerability: "Chromatography data monopoly, rigid tech stack, hard to export", asymmetricAngle: "Unbundle: Empower Signal-Exfiltrator extracting data into modern AI models", beachheadNiche: "Anomaly Detector for Quality Control labs using Empower 3", disruptorModel: "Data liberation + AI analytics", vector: "Unbundle" },
      { id: 84, name: "Thermo Fisher (SampleManager)", age: "Enterprise LIMS", vulnerability: "Multi-year multi-million dollar consultant sinkhole implementation", asymmetricAngle: "Price: Pay-per-Sample disrupting $100k licensing fee", beachheadNiche: "Sample Tracker for Craft Distilleries or small food-testing labs", disruptorModel: "Usage-based laboratory management", vector: "Price" },
      { id: 85, name: "Schrödinger", age: "High-end", vulnerability: "Pricing prohibitive for garage biotech startups", asymmetricAngle: "Open-Source Simulation Agents: 80% of value for 1% of cost", beachheadNiche: "Lead Optimizer bot for Longevity-focused Biohackers", disruptorModel: "Open-source molecular modeling", vector: "Price" },
    ],
  },
  {
    id: 20, name: "Productivity & Office", emoji: "💻",
    timingCatalyst: "2026 Dual-Stack Crisis: 64% companies paying for BOTH Google and Microsoft",
    color: "220 70% 55%",
    incumbents: [
      { id: 86, name: "Microsoft Teams", age: "Feature bloat", vulnerability: "NPS declining due to Notification Hell and slow performance", asymmetricAngle: "Speed: Silent Communicator — only alerts when a decision is needed", beachheadNiche: "Decision Log for Remote Engineering teams syncing Slack/Jira/Teams", disruptorModel: "Decision-focused communication", vector: "Speed" },
      { id: 87, name: "Google Drive", age: "Digital Junkyard", vulnerability: "Easy to add files, impossible to find them without exact name", asymmetricAngle: "Tech Stack: Semantic File-System organizing by intent not folder name", beachheadNiche: "Due Diligence Organizer for VCs cleaning startup data rooms", disruptorModel: "AI-powered semantic file management", vector: "Speed" },
      { id: 88, name: "Slack (Salesforce)", age: "Post-acquisition", vulnerability: "Pricing increased, fun replaced by Enterprise bloat", asymmetricAngle: "Channel: WhatsApp Enterprise Bridge for workers refusing to install Slack", beachheadNiche: "Shift-Swap bot for Starbucks/Retail workers via WhatsApp", disruptorModel: "WhatsApp-native workplace communication", vector: "Channel" },
      { id: 89, name: "Box / Dropbox", age: "Legacy", vulnerability: "Sync & Share is commodity, pricing not adapted to AI storage era", asymmetricAngle: "Unbundle: Governance Agent focusing only on HIPAA/SOC2 compliance", beachheadNiche: "Auto-Redactor for Healthcare admin sharing patient records", disruptorModel: "Compliance-first file governance", vector: "Unbundle" },
      { id: 90, name: "Zoom", age: "Stagnant", vulnerability: "AI Summary is a basic add-on, not core workflow", asymmetricAngle: "Speed: Meeting-Free Agent that attends for you", beachheadNiche: "Daily Standup bot replacing the 9 AM Zoom call with AI-sync", disruptorModel: "Autonomous meeting representative", vector: "Speed" },
    ],
  },
  {
    id: 21, name: "Public Utilities & Smart Cities", emoji: "🏙️",
    timingCatalyst: "2026 Banning Crisis: legacy billing failure paralyzed 11k CA utility customers",
    color: "170 60% 45%",
    incumbents: [
      { id: 91, name: "Tyler Tech (Incode)", age: "1990s legacy", vulnerability: "High tech debt, failed rollouts left cities desperate", asymmetricAngle: "Price: Boutique Utility Billing — charge per active meter not $1M license", beachheadNiche: "Billing dashboard for Rural Water Districts (<2,000 meters)", disruptorModel: "Per-meter utility billing", vector: "Price" },
      { id: 92, name: "Oracle Utilities (CC&B)", age: "Monopoly Tier 1", vulnerability: "5-year implementation cycle", asymmetricAngle: "Speed: Net-Billing Fast-Track sidecar for Solar/NEM 3.0 logic", beachheadNiche: "Solar Credit Auditor for Southern California Edison customers", disruptorModel: "Solar billing overlay agent", vector: "Speed" },
      { id: 93, name: "Badger Meter (Beacon)", age: "Hardware-first", vulnerability: "Beacon software cited as non-intuitive for city clerks", asymmetricAngle: "Channel: Citizen-Transparency Bot — citizens text water usage questions", beachheadNiche: "Leak Alert SMS bot for University Campuses", disruptorModel: "Citizen-facing utility intelligence", vector: "Channel" },
      { id: 94, name: "SAP Public Sector", age: "Extreme complexity", vulnerability: "Requires a PhD to run a payroll report", asymmetricAngle: "Natural Language Controller translating SAP T-Codes to plain English", beachheadNiche: "Budget Tracker for City Council members", disruptorModel: "Natural language government ERP", vector: "Speed" },
      { id: 95, name: "Sensus (Xylem)", age: "Hardware moat", vulnerability: "Walled garden software tied to proprietary hardware", asymmetricAngle: "Tech Stack: Universal Meter Bridge pulling data via radio to open API", beachheadNiche: "Water-Waste monitor for Commercial Property Managers", disruptorModel: "Open-source meter data bridge", vector: "Speed" },
    ],
  },
  {
    id: 22, name: "Global NGO & Social Impact", emoji: "🌍",
    timingCatalyst: "2026 Transparency Mandate for NGOs receiving EU/UN funding",
    color: "140 65% 45%",
    incumbents: [
      { id: 96, name: "Blackbaud (Luminate)", age: "Founded 1981", vulnerability: "Pricing unchanged for years, data silo lock-in", asymmetricAngle: "Niche: Grassroots Advocacy Bot for hyper-local campaigns", beachheadNiche: "Petition-to-Email agent for neighborhood associations", disruptorModel: "Hyper-local advocacy platform", vector: "Niche" },
      { id: 97, name: "Submittable", age: "Grant management", vulnerability: "Increased fees for reviewers in 2026", asymmetricAngle: "Speed: Instant Grant-Screener vetting applications against 100 criteria", beachheadNiche: "Sustainability Grant screener for Local City Green Funds", disruptorModel: "AI grant screening agent", vector: "Speed" },
      { id: 98, name: "Salesforce Non-Profit Cloud", age: "Over-engineered", vulnerability: "Requires $120k Salesforce Admin to manage for 90% of NGOs", asymmetricAngle: "Price: $0-Admin CRM managed via Slack interface", beachheadNiche: "Donor-Thank-You bot for Animal Shelters", disruptorModel: "Zero-admin non-profit CRM", vector: "Price" },
      { id: 99, name: "CyberGrants (Bonterra)", age: "Enterprise-only", vulnerability: "High friction for Employee Giving programs", asymmetricAngle: "Channel: Slack-Giving Agent — employees give to charities in Slack/Teams", beachheadNiche: "Disaster-Relief match-bot for Tech Startups", disruptorModel: "In-workspace charitable giving", vector: "Channel" },
      { id: 100, name: "Foundant", age: "Legacy", vulnerability: "Slow report-building, stagnant features", asymmetricAngle: "Unbundle: Impact-Report Scribe auto-pulling data and writing donor reports", beachheadNiche: "Annual Report generator for Family Foundations", disruptorModel: "AI-powered impact reporting", vector: "Unbundle" },
    ],
  },
];

/** Flatten all incumbents for easy lookup */
export const ALL_INCUMBENTS = INDUSTRY_CLUSTERS.flatMap(c => 
  c.incumbents.map(inc => ({ ...inc, cluster: c }))
);
