/**
 * Role → Tool recommendations + Workflow stage mappings.
 * Powers the "Your AI Stack for [Role]" personalized view.
 */
import type { GTCTool } from "./gtc-tools-registry";

/** Workflow stages a professional moves through */
export type WorkflowStage =
  | "research"
  | "create"
  | "build"
  | "analyze"
  | "automate"
  | "deploy"
  | "secure"
  | "design";

export const WORKFLOW_STAGES: Record<WorkflowStage, { label: string; icon: string; description: string }> = {
  research:  { label: "Research & Discover", icon: "🔎", description: "Find answers, analyze docs, explore ideas" },
  create:    { label: "Create & Write",      icon: "✍️", description: "Generate content, draft, iterate" },
  build:     { label: "Build & Code",        icon: "🔨", description: "Write code, build apps, ship features" },
  analyze:   { label: "Analyze & Decide",    icon: "📊", description: "Query data, visualize, make decisions" },
  automate:  { label: "Automate & Scale",    icon: "⚡", description: "Create workflows, orchestrate agents" },
  deploy:    { label: "Deploy & Operate",    icon: "🚀", description: "Ship to production, monitor, optimize" },
  secure:    { label: "Secure & Govern",     icon: "🛡️", description: "Protect data, ensure compliance" },
  design:    { label: "Design & Visualize",  icon: "🎨", description: "Create visuals, prototypes, media" },
};

/** Map each tool to its primary workflow stage */
export const TOOL_WORKFLOW_MAP: Record<string, WorkflowStage> = {
  // Research
  "Perplexity": "research",
  "NotebookLM": "research",
  "Gemini": "research",

  // Create
  "ChatGPT": "create",
  "Claude": "create",
  "Cohere": "create",
  "Llama": "create",
  "Mistral": "create",
  "Nemotron": "create",

  // Build
  "Cursor": "build",
  "Claude Code": "build",
  "Codex": "build",
  "GitHub Copilot": "build",
  "Windsurf": "build",
  "Lovable": "build",

  // Analyze
  "Snowflake": "analyze",
  "Databricks": "analyze",
  "BigQuery": "analyze",
  "KUDF": "analyze",
  "KVS": "analyze",

  // Automate
  "Open Claw": "automate",
  "Nemo Claw": "automate",
  "LangChain": "automate",
  "LangGraph": "automate",
  "CrewAI": "automate",
  "AutoGen": "automate",
  "Open Shell": "automate",
  "Salesforce Einstein": "automate",
  "ServiceNow AI Agents": "automate",
  "SAP Joule": "automate",
  "IBM watsonx": "automate",

  // Deploy
  "Azure AI Foundry": "deploy",
  "AWS Bedrock": "deploy",
  "Google Vertex AI": "deploy",
  "Oracle Cloud AI": "deploy",
  "CoreWeave": "deploy",
  "Kubernetes": "deploy",
  "Hugging Face": "deploy",
  "Weights & Biases": "deploy",
  "Dynamo": "deploy",
  "Fireworks AI": "deploy",
  "PyTorch": "deploy",

  // Secure
  "CrowdStrike Falcon": "secure",
  "Confidential Computing": "secure",
  "Palantir AIP": "secure",

  // Design
  "Midjourney": "design",
  "DALL-E": "design",
  "Runway": "design",
  "RTX / DLSS": "design",
  "Figma AI": "design",
  "Canva AI": "design",

  // Infra — map to deploy
  "CUDA": "deploy",
  "Blackwell": "deploy",
  "Vera Rubin": "deploy",
  "Feynman": "deploy",
  "Groq LPU": "deploy",
  "Aerial AI RAN": "deploy",
  "Spectrum X": "deploy",
  "NVLink": "deploy",

  // Simulation
  "Omniverse": "design",
  "Cosmos": "design",
  "Newton": "build",
  "Earth 2": "analyze",
  "DSX": "deploy",

  // Vertical
  "Bionemо": "research",
  "Parabricks": "analyze",
  "cuOpt": "automate",

  // Robotics
  "Isaac Lab": "build",
  "Groot": "build",
  "Alpamo": "deploy",

  // HR & Talent
  "Workday AI": "automate",
  "Eightfold AI": "analyze",
  "HireVue": "analyze",
  "Lattice": "analyze",
  "Deel": "automate",

  // Finance & Ops
  "Workiva": "analyze",
  "Coupa": "automate",
  "Stampli": "automate",
  "Brex AI": "automate",
  "Anaplan": "analyze",

  // Legal & Compliance
  "Harvey AI": "research",
  "Ironclad": "automate",
  "DocuSign IAM": "automate",
  "Relativity": "research",

  // Customer Platforms
  "Zendesk AI": "automate",
  "Intercom Fin": "automate",
  "Freshworks": "automate",
  "Gainsight": "analyze",

  // Marketing & RevOps
  "HubSpot AI": "automate",
  "Gong": "analyze",
  "6sense": "research",
  "Adobe Marketo": "automate",
  "Clari": "analyze",

  // Productivity
  "Microsoft 365 Copilot": "create",
  "Notion AI": "create",
  "Slack AI": "create",
  "Asana AI": "automate",

  // BI & Visualization
  "Tableau": "analyze",
  "Power BI": "analyze",
  "Looker": "analyze",
  "ThoughtSpot": "analyze",
};

/** Role archetypes with recommended tools (ordered by priority) */
export interface RoleRecommendation {
  role: string;
  aliases: string[]; // match user job_title loosely
  description: string;
  coreTools: string[]; // 5-8 tools to learn first
  expandedTools: string[]; // next tier
}

export const ROLE_RECOMMENDATIONS: RoleRecommendation[] = [
  {
    role: "Product Manager",
    aliases: ["product manager", "pm", "product lead", "product owner"],
    description: "Ship better products faster with AI-powered research, prototyping, and analytics.",
    coreTools: ["ChatGPT", "Perplexity", "Figma AI", "NotebookLM", "Lovable", "Canva AI"],
    expandedTools: ["Claude", "Gemini", "Snowflake", "Midjourney", "LangChain"],
  },
  {
    role: "Software Engineer",
    aliases: ["software engineer", "developer", "programmer", "swe", "full stack", "backend", "frontend", "engineer"],
    description: "Write, review, and ship code 10x faster with AI pair programmers and deployment tools.",
    coreTools: ["Cursor", "GitHub Copilot", "Claude Code", "Codex", "Perplexity", "Hugging Face"],
    expandedTools: ["Windsurf", "Lovable", "LangChain", "Kubernetes", "PyTorch", "AWS Bedrock"],
  },
  {
    role: "Data Scientist",
    aliases: ["data scientist", "data analyst", "ml engineer", "machine learning", "analytics"],
    description: "From data exploration to model deployment — accelerate every step of the ML lifecycle.",
    coreTools: ["Databricks", "Snowflake", "PyTorch", "Hugging Face", "ChatGPT", "Weights & Biases"],
    expandedTools: ["BigQuery", "Claude", "Fireworks AI", "Kubernetes", "LangChain", "NotebookLM"],
  },
  {
    role: "Designer",
    aliases: ["designer", "ux", "ui designer", "graphic designer", "creative", "art director"],
    description: "Supercharge your creative workflow with AI generation, prototyping, and visual tools.",
    coreTools: ["Midjourney", "Figma AI", "Canva AI", "DALL-E", "Runway", "ChatGPT"],
    expandedTools: ["Claude", "Lovable", "Perplexity", "NotebookLM"],
  },
  {
    role: "Marketing Manager",
    aliases: ["marketing", "growth", "content", "brand", "digital marketing", "social media"],
    description: "Create campaigns, analyze performance, and generate content at scale.",
    coreTools: ["ChatGPT", "Canva AI", "Midjourney", "Perplexity", "Claude", "DALL-E"],
    expandedTools: ["Runway", "NotebookLM", "Salesforce Einstein", "Figma AI", "Gemini"],
  },
  {
    role: "Operations Manager",
    aliases: ["operations", "ops", "supply chain", "logistics", "program manager"],
    description: "Automate workflows, optimize processes, and make data-driven operational decisions.",
    coreTools: ["ChatGPT", "SAP Joule", "ServiceNow AI Agents", "Perplexity", "NotebookLM", "Snowflake"],
    expandedTools: ["Claude", "Salesforce Einstein", "IBM watsonx", "cuOpt", "Gemini"],
  },
  {
    role: "Cybersecurity Analyst",
    aliases: ["cybersecurity", "security", "infosec", "soc analyst", "security engineer"],
    description: "Detect threats, respond to incidents, and protect infrastructure with AI-powered security.",
    coreTools: ["CrowdStrike Falcon", "ChatGPT", "Perplexity", "Claude", "Palantir AIP", "Confidential Computing"],
    expandedTools: ["NotebookLM", "Gemini", "LangChain", "Kubernetes"],
  },
  {
    role: "Student",
    aliases: ["student", "intern", "graduate", "university", "college", "learning"],
    description: "Build job-ready AI skills with hands-on tools used by top companies.",
    coreTools: ["ChatGPT", "Claude", "Perplexity", "Cursor", "Canva AI", "NotebookLM"],
    expandedTools: ["Gemini", "GitHub Copilot", "Midjourney", "Lovable", "Hugging Face", "LangChain"],
  },
];

/** Find best role recommendation given a job title string */
export function matchRole(jobTitle: string): RoleRecommendation {
  const lower = jobTitle.toLowerCase();
  for (const rec of ROLE_RECOMMENDATIONS) {
    for (const alias of rec.aliases) {
      if (lower.includes(alias)) return rec;
    }
  }
  // Default to Student
  return ROLE_RECOMMENDATIONS[ROLE_RECOMMENDATIONS.length - 1];
}
