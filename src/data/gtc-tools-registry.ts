/**
 * Every tool, platform, and product mentioned in Jensen Huang's GTC 2026 keynote.
 * Grouped by the company that created/maintains it.
 * Source: Full transcript of GTC 2026 keynote, March 2026.
 */

export type ToolCategory =
  | "llm"
  | "coding"
  | "data"
  | "agentic"
  | "robotics"
  | "infrastructure"
  | "simulation"
  | "enterprise"
  | "design"
  | "search"
  | "hardware"
  | "networking"
  | "cloud"
  | "security"
  | "biology"
  | "automotive";

export interface GTCTool {
  name: string;
  company: string;
  category: ToolCategory;
  description: string;
  url?: string;
  /** Emoji icon for quick visual recognition */
  icon: string;
  /** Whether Jensen specifically endorsed/uses it */
  jensenEndorsed?: boolean;
}

export const GTC_TOOLS: GTCTool[] = [
  // ─── NVIDIA ───
  { name: "CUDA", company: "NVIDIA", category: "infrastructure", description: "GPU computing platform — 20 years of accelerated computing, hundreds of millions of installed GPUs.", icon: "⚡", url: "https://developer.nvidia.com/cuda-toolkit" },
  { name: "CUDA X Libraries", company: "NVIDIA", category: "infrastructure", description: "100+ domain-specific acceleration libraries — the 'crown jewels' of NVIDIA.", icon: "📚" },
  { name: "cuDNN", company: "NVIDIA", category: "infrastructure", description: "CUDA Deep Neural Networks library — caused the big bang of modern AI.", icon: "🧠" },
  { name: "KUDF", company: "NVIDIA", category: "data", description: "GPU-accelerated data frames for structured data. Replaces CPU-bound Spark/Pandas with 5x+ speedups.", icon: "📊" },
  { name: "KVS", company: "NVIDIA", category: "data", description: "GPU-accelerated vector stores for unstructured/semantic data — PDFs, video, speech.", icon: "🔍" },
  { name: "RTX / DLSS 5", company: "NVIDIA", category: "design", description: "Neuro rendering — fusion of 3D graphics and generative AI. 'Computer graphics comes to life.'", icon: "🎮", url: "https://www.nvidia.com/rtx/" },
  { name: "GeForce", company: "NVIDIA", category: "hardware", description: "Consumer GPU — 'NVIDIA's greatest marketing campaign.' 25 years of programmable shaders.", icon: "🖥️" },
  { name: "Nemo Claw", company: "NVIDIA", category: "agentic", description: "Enterprise-secure Open Claw reference design with policy guardrails, privacy router, and Open Shell.", icon: "🛡️" },
  { name: "Open Shell", company: "NVIDIA", category: "security", description: "Security layer for Open Claw — policy engine, privacy router for enterprise agentic systems.", icon: "🔒" },
  { name: "Neimotron 3/4", company: "NVIDIA", category: "llm", description: "Open frontier reasoning models for language, vision, RAG, safety, and speech. Neimotron coalition.", icon: "🤖" },
  { name: "Cosmos", company: "NVIDIA", category: "simulation", description: "World foundation models — generates synthetic training data for physical AI.", icon: "🌍" },
  { name: "Groot", company: "NVIDIA", category: "robotics", description: "General-purpose robotics foundation models for reasoning and action generation.", icon: "🦾" },
  { name: "Alpamo", company: "NVIDIA", category: "automotive", description: "Autonomous vehicle AI — first thinking & reasoning self-driving system. 'The ChatGPT moment for self-driving.'", icon: "🚗" },
  { name: "Bioneo", company: "NVIDIA", category: "biology", description: "Open models for biology, chemistry, and molecular design.", icon: "🧬" },
  { name: "Earth 2", company: "NVIDIA", category: "simulation", description: "AI physics models for weather and climate forecasting.", icon: "🌦️" },
  { name: "Isaac Lab", company: "NVIDIA", category: "robotics", description: "Open-source robot training and evaluation in simulation.", icon: "🤸" },
  { name: "Newton", company: "NVIDIA", category: "simulation", description: "GPU-accelerated differentiable physics simulation — used to train Disney's Olaf robot.", icon: "🍎" },
  { name: "Omniverse", company: "NVIDIA", category: "simulation", description: "Digital twin platform — holds virtual replicas from AI factories to entire planets.", icon: "🌐", url: "https://www.nvidia.com/omniverse/" },
  { name: "DSX", company: "NVIDIA", category: "infrastructure", description: "AI factory management platform — digital twin blueprint for max token throughput.", icon: "🏭" },
  { name: "Dynamo", company: "NVIDIA", category: "infrastructure", description: "Inference OS for AI factories — disaggregated inference pipeline, 35x performance increase.", icon: "⚙️" },
  { name: "Aerial / AI RAN", company: "NVIDIA", category: "networking", description: "Platform for reinventing telecom base stations into AI infrastructure.", icon: "📡" },
  { name: "Max Q", company: "NVIDIA", category: "infrastructure", description: "Dynamic power/cooling optimization — leaves no watt squandered in AI factories.", icon: "🔋" },
  { name: "Vera CPU", company: "NVIDIA", category: "hardware", description: "Next-gen CPU designed for AI tool use and data processing workloads.", icon: "💾" },
  { name: "Vera Rubin", company: "NVIDIA", category: "hardware", description: "Next-gen GPU system — 288GB per chip, already up at Microsoft Azure.", icon: "🔥" },
  { name: "Blackwell / GB300", company: "NVIDIA", category: "hardware", description: "Current-gen AI infrastructure — in full production, shipping at scale.", icon: "⬛" },
  { name: "Feynman", company: "NVIDIA", category: "hardware", description: "Future GPU architecture — brand new GPU, LP40 LPU, Rosa CPU, Bluefield 5.", icon: "🔮" },
  { name: "NVLink 72/576", company: "NVIDIA", category: "networking", description: "Scale-up interconnect — copper and optical, connecting GPU racks.", icon: "🔗" },
  { name: "Spectrum 6", company: "NVIDIA", category: "networking", description: "World's first co-packaged optical networking switch.", icon: "💡" },
  { name: "cuOpt", company: "NVIDIA", category: "enterprise", description: "Decision optimization library for logistics and supply chain.", icon: "📦" },
  { name: "cuLitho", company: "NVIDIA", category: "infrastructure", description: "Computational lithography — accelerating chip manufacturing.", icon: "🔬" },
  { name: "Parabricks", company: "NVIDIA", category: "biology", description: "GPU-accelerated genomics analysis.", icon: "🧪" },
  { name: "Warp", company: "NVIDIA", category: "simulation", description: "Differentiable physics framework for simulation.", icon: "🌀" },
  { name: "Confidential Computing", company: "NVIDIA", category: "security", description: "GPU-level encryption — even the cloud operator cannot see your data or models.", icon: "🔐" },

  // ─── OpenAI ───
  { name: "ChatGPT", company: "OpenAI", category: "llm", description: "Conversational AI — started the generative AI era. 'Everybody should be using it every morning.'", icon: "💬", url: "https://chat.openai.com", jensenEndorsed: true },
  { name: "GPT o1 / o3", company: "OpenAI", category: "llm", description: "Reasoning AI — reflects, plans, decomposes problems. 'Made generative AI trustworthy and grounded.'", icon: "🧩" },
  { name: "Codex", company: "OpenAI", category: "coding", description: "AI coding agent — '100% of NVIDIA uses it' alongside Claude Code and Cursor.", icon: "👨‍💻", jensenEndorsed: true },

  // ─── Anthropic ───
  { name: "Claude Code", company: "Anthropic", category: "coding", description: "Agentic coding — reads files, compiles, tests, iterates. 'Revolutionized software engineering.'", icon: "🔨", url: "https://claude.ai", jensenEndorsed: true },

  // ─── Cursor ───
  { name: "Cursor", company: "Anysphere", category: "coding", description: "AI-first code editor — chat with your codebase. Part of NVIDIA's Neimotron coalition.", icon: "✏️", url: "https://cursor.com", jensenEndorsed: true },

  // ─── Open Claw ───
  { name: "Open Claw", company: "Open Source", category: "agentic", description: "Agentic OS — the 'Linux of agents.' Most popular open-source project in history. Spawns sub-agents, uses tools, schedules cron jobs.", icon: "🦀", jensenEndorsed: true },

  // ─── Groq ───
  { name: "Groq LPU (LP30)", company: "Groq", category: "hardware", description: "Deterministic dataflow processor for ultra-low-latency inference. Integrated with Vera Rubin via Dynamo.", icon: "⚡" },

  // ─── LangChain ───
  { name: "LangChain", company: "LangChain", category: "agentic", description: "Agent orchestration framework — 1 billion+ downloads for creating custom agents. Neimotron coalition member.", icon: "🔗", url: "https://langchain.com" },

  // ─── Perplexity ───
  { name: "Perplexity", company: "Perplexity AI", category: "search", description: "AI-powered search with cited answers. 'Everybody use it. It is so good.'", icon: "🔎", url: "https://perplexity.ai", jensenEndorsed: true },

  // ─── Mistral ───
  { name: "Mistral", company: "Mistral AI", category: "llm", description: "Open-source LLM — Neimotron coalition member, one of the 'incredible companies.'", icon: "🌬️", url: "https://mistral.ai" },

  // ─── Black Forest Labs ───
  { name: "Black Forest Labs", company: "Black Forest Labs", category: "design", description: "Image generation models — Neimotron coalition member for next-gen visual AI.", icon: "🎨" },

  // ─── Google ───
  { name: "Google BigQuery", company: "Google", category: "data", description: "Analytics data warehouse — now GPU-accelerated with NVIDIA KUDF.", icon: "📈", url: "https://cloud.google.com/bigquery" },
  { name: "Google Vertex AI", company: "Google", category: "cloud", description: "ML platform — accelerated by NVIDIA for training and inference.", icon: "☁️" },
  { name: "Google Cloud JAX/XLA", company: "Google", category: "infrastructure", description: "ML framework — NVIDIA is 'incredible on both PyTorch and JAX/XLA.'", icon: "🔧" },

  // ─── Amazon ───
  { name: "AWS EMR", company: "Amazon", category: "data", description: "Cloud data processing — accelerated by NVIDIA.", icon: "📊" },
  { name: "AWS SageMaker", company: "Amazon", category: "cloud", description: "ML platform on AWS — NVIDIA deeply integrated.", icon: "☁️" },
  { name: "AWS Bedrock", company: "Amazon", category: "cloud", description: "Foundation model service — NVIDIA accelerated.", icon: "🪨" },

  // ─── Microsoft ───
  { name: "Microsoft Azure AI Foundry", company: "Microsoft", category: "cloud", description: "Azure's AI platform — first NVIDIA A100 supercomputer was installed here.", icon: "☁️" },
  { name: "Bing Search", company: "Microsoft", category: "search", description: "Search engine — accelerated by NVIDIA.", icon: "🔍" },
  { name: "Azure Confidential Computing", company: "Microsoft", category: "security", description: "Protected deployment of OpenAI and Anthropic models across regions.", icon: "🔐" },

  // ─── Meta ───
  { name: "Meta MSL (Llama)", company: "Meta", category: "llm", description: "Open-source models that have 'reached near the frontier' — chosen NVIDIA platform.", icon: "🦙" },

  // ─── Snowflake ───
  { name: "Snowflake", company: "Snowflake", category: "data", description: "Cloud data platform — processing structured data at scale, now GPU-accelerated.", icon: "❄️", url: "https://snowflake.com" },

  // ─── Databricks ───
  { name: "Databricks", company: "Databricks", category: "data", description: "Data + AI platform — part of the structured data ecosystem accelerated by NVIDIA.", icon: "🧱", url: "https://databricks.com" },

  // ─── IBM ───
  { name: "IBM Watson X Data", company: "IBM", category: "data", description: "Enterprise SQL engine — accelerated with NVIDIA KUDF. '60 years after System 360.'", icon: "🏢" },

  // ─── Palantir ───
  { name: "Palantir Ontology", company: "Palantir", category: "enterprise", description: "AI platform for airgapped/sovereign deployments — partnered with NVIDIA and Dell.", icon: "👁️" },

  // ─── Dell ───
  { name: "Dell AI Data Platform", company: "Dell", category: "enterprise", description: "On-prem accelerated data platform integrating KUDF and KVS.", icon: "💻" },

  // ─── Oracle ───
  { name: "Oracle Cloud", company: "Oracle", category: "cloud", description: "AI cloud — 'NVIDIA was their first AI customer.' Hosts OpenAI and Cohere.", icon: "☁️" },

  // ─── CoreWeave ───
  { name: "CoreWeave", company: "CoreWeave", category: "cloud", description: "World's first AI-native cloud — built solely to host GPUs. 'Growing incredibly.'", icon: "🚀" },

  // ─── Salesforce ───
  { name: "Salesforce", company: "Salesforce", category: "enterprise", description: "CRM platform — listed as NVIDIA developer/customer on Google Cloud.", icon: "💼" },

  // ─── Synopsys ───
  { name: "Synopsys EDA", company: "Synopsys", category: "infrastructure", description: "Electronic design automation — all EDA/CAE workflows accelerated by NVIDIA.", icon: "🔌" },

  // ─── PTC ───
  { name: "PTC Windchill PLM", company: "PTC", category: "simulation", description: "Product lifecycle management — manages SIM-ready assets for AI factory digital twins.", icon: "📐" },

  // ─── Dassault ───
  { name: "Dassault 3DEXPERIENCE", company: "Dassault Systèmes", category: "simulation", description: "Model-based systems engineering for AI factory design.", icon: "🏗️" },

  // ─── Siemens ───
  { name: "Siemens Star-CCM+", company: "Siemens", category: "simulation", description: "Computational fluid dynamics — thermal simulation for AI factory design.", icon: "🌡️" },

  // ─── Cadence ───
  { name: "Cadence Reality", company: "Cadence", category: "simulation", description: "Internal thermal simulation for AI factory digital twins.", icon: "🔥" },

  // ─── Jacobs ───
  { name: "Jacobs (Omniverse App)", company: "Jacobs", category: "simulation", description: "Custom Omniverse application for finalizing AI factory design.", icon: "🏢" },

  // ─── Procore ───
  { name: "Procore", company: "Procore", category: "simulation", description: "Virtual commissioning platform — accelerates AI factory construction time.", icon: "🏗️" },

  // ─── Fedra ───
  { name: "Fedra AI Agent", company: "Fedra", category: "agentic", description: "Oversees cooling and electrical systems in AI factories via DSX Max Q.", icon: "❄️" },

  // ─── Emerald ───
  { name: "Emerald AI Agent", company: "Emerald", category: "agentic", description: "Interprets live grid demand/stress signals — dynamically adjusts AI factory power.", icon: "🟢" },

  // ─── Cohere ───
  { name: "Cohere", company: "Cohere", category: "llm", description: "Enterprise LLM platform — hosted on Oracle Cloud and CoreWeave.", icon: "🗣️", url: "https://cohere.com" },

  // ─── Fireworks ───
  { name: "Fireworks AI", company: "Fireworks", category: "infrastructure", description: "Fast inference platform — landed on Oracle Cloud with NVIDIA.", icon: "🎆" },

  // ─── Samsung ───
  { name: "Samsung (Groq LP30 fab)", company: "Samsung", category: "hardware", description: "Manufactures the Groq LP30 chip — 'cranking as hard as they can.'", icon: "🏭" },

  // ─── Skilled AI ───
  { name: "Skilled AI", company: "Skilled AI", category: "robotics", description: "Uses Isaac Lab + Cosmos to generate robot post-training data with reinforcement learning.", icon: "🤖" },

  // ─── Humanoid ───
  { name: "Humanoid", company: "Humanoid", category: "robotics", description: "Uses Isaac Lab to train whole-body control and manipulation policies.", icon: "🦿" },

  // ─── Hexagon Robotics ───
  { name: "Hexagon Robotics", company: "Hexagon", category: "robotics", description: "Uses Isaac Lab for robot training and data generation.", icon: "⬡" },

  // ─── Foxconn ───
  { name: "Foxconn (Groot)", company: "Foxconn", category: "robotics", description: "Fine-tunes Groot models in Isaac Lab for manufacturing.", icon: "🏭" },

  // ─── Parata AI ───
  { name: "Parata AI", company: "Parata AI", category: "robotics", description: "Trains operating room assistant robots in Isaac Lab, multiplied with Cosmos world models.", icon: "🏥" },

  // ─── Disney ───
  { name: "Disney Chamino", company: "Disney", category: "simulation", description: "Physics simulator in Newton + Isaac Lab — trained Olaf to walk in the real world.", icon: "⛄" },

  // ─── BYD / Hyundai / Nissan / Mercedes / Toyota / GM / Uber ───
  { name: "BYD Robotaxi", company: "BYD", category: "automotive", description: "NVIDIA Alpamo robotaxi-ready platform — 18M cars/year combined with partners.", icon: "🚗" },
  { name: "Uber Robotaxi Network", company: "Uber", category: "automotive", description: "Deploying robotaxi-ready vehicles across multiple cities via NVIDIA platform.", icon: "🚕" },

  // ─── ABB / Universal Robotics / KUKA ───
  { name: "ABB Robotics", company: "ABB", category: "robotics", description: "Implementing NVIDIA physical AI models for manufacturing line deployment.", icon: "🦾" },
  { name: "Universal Robots", company: "Universal Robots", category: "robotics", description: "Collaborative robots with NVIDIA physical AI integration.", icon: "🤖" },
  { name: "KUKA", company: "KUKA", category: "robotics", description: "Industrial robotics with NVIDIA simulation and AI models.", icon: "🦾" },

  // ─── Caterpillar ───
  { name: "Caterpillar", company: "Caterpillar", category: "robotics", description: "Heavy machinery — integrating NVIDIA physical AI for autonomous operations.", icon: "🚜" },

  // ─── T-Mobile / Nokia ───
  { name: "T-Mobile AI RAN", company: "T-Mobile", category: "networking", description: "Converting radio towers into AI-powered robotics infrastructure with NVIDIA Aerial.", icon: "📱" },
  { name: "Nokia AI RAN", company: "Nokia", category: "networking", description: "Partnership with NVIDIA to reinvent telecom as AI infrastructure.", icon: "📡" },

  // ─── Snapchat ───
  { name: "Snapchat (BigQuery)", company: "Snap", category: "data", description: "Reduced computing cost by nearly 80% using NVIDIA-accelerated BigQuery.", icon: "👻" },

  // ─── Nestlé ───
  { name: "Nestlé Supply Chain", company: "Nestlé", category: "enterprise", description: "5x faster supply chain data mart refresh at 83% lower cost with accelerated Watson X.", icon: "🍫" },

  // ─── NTT Data ───
  { name: "NTT Data (Dell AI)", company: "NTT Data", category: "enterprise", description: "Massive speedups on Dell AI Data Platform with KUDF and KVS.", icon: "📡" },

  // ─── CrowdStrike ───
  { name: "CrowdStrike", company: "CrowdStrike", category: "security", description: "Cybersecurity — NVIDIA developer/customer on Google Cloud.", icon: "🛡️" },

  // ─── PyTorch ───
  { name: "PyTorch", company: "Meta / Open Source", category: "infrastructure", description: "'We are the only accelerator incredible on both PyTorch and JAX/XLA.'", icon: "🔥", url: "https://pytorch.org" },

  // ─── Andre Karpathy ───
  { name: "Research Agent (Karpathy)", company: "Open Source", category: "agentic", description: "Give an AI agent a task, go to sleep — it runs 100 experiments overnight, keeping what works.", icon: "🧪" },

  // ─── SQL ───
  { name: "SQL", company: "IBM / Standard", category: "data", description: "'One of the most important domain-specific languages of all time' — now used by AI agents, not just humans.", icon: "📝" },

  // ─── Kubernetes ───
  { name: "Kubernetes", company: "Google / CNCF", category: "infrastructure", description: "Container orchestration — Jensen compares Open Claw's impact to Kubernetes and Linux.", icon: "☸️" },
];

/** Get unique company names sorted by tool count */
export function getCompanies(): string[] {
  const map = new Map<string, number>();
  for (const t of GTC_TOOLS) {
    map.set(t.company, (map.get(t.company) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
}

/** Get unique categories */
export function getCategories(): ToolCategory[] {
  const cats = new Set<ToolCategory>();
  for (const t of GTC_TOOLS) cats.add(t.category);
  return [...cats];
}

/** Category labels and colors */
export const CATEGORY_CONFIG: Record<ToolCategory, { label: string; color: string }> = {
  llm: { label: "LLMs", color: "hsl(280, 70%, 60%)" },
  coding: { label: "Coding", color: "hsl(200, 80%, 55%)" },
  data: { label: "Data", color: "hsl(160, 70%, 45%)" },
  agentic: { label: "Agentic", color: "hsl(30, 90%, 55%)" },
  robotics: { label: "Robotics", color: "hsl(0, 70%, 55%)" },
  infrastructure: { label: "Infrastructure", color: "hsl(220, 60%, 50%)" },
  simulation: { label: "Simulation", color: "hsl(180, 60%, 50%)" },
  enterprise: { label: "Enterprise", color: "hsl(50, 70%, 50%)" },
  design: { label: "Design", color: "hsl(310, 60%, 55%)" },
  search: { label: "Search", color: "hsl(120, 50%, 45%)" },
  hardware: { label: "Hardware", color: "hsl(240, 40%, 50%)" },
  networking: { label: "Networking", color: "hsl(190, 60%, 50%)" },
  cloud: { label: "Cloud", color: "hsl(210, 70%, 60%)" },
  security: { label: "Security", color: "hsl(350, 60%, 50%)" },
  biology: { label: "Biology", color: "hsl(140, 60%, 45%)" },
  automotive: { label: "Automotive", color: "hsl(10, 60%, 50%)" },
};
