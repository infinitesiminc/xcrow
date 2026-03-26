/**
 * Competitive relationships between tools.
 * Each key is a tool name, value is an array of competing tool names.
 * Relationships are bidirectional — only define one direction, lookup handles both.
 */

const COMPETITIVE_PAIRS: [string, string][] = [
  // Foundation Models — all compete with each other
  ["ChatGPT", "Claude"],
  ["ChatGPT", "Gemini"],
  ["ChatGPT", "Llama"],
  ["ChatGPT", "Mistral"],
  ["ChatGPT", "Cohere"],
  ["Claude", "Gemini"],
  ["Claude", "Llama"],
  ["Claude", "Mistral"],
  ["Claude", "Cohere"],
  ["Gemini", "Llama"],
  ["Gemini", "Mistral"],
  ["Gemini", "Cohere"],

  // Coding Agents
  ["Cursor", "Windsurf"],
  ["Cursor", "GitHub Copilot"],
  ["GitHub Copilot", "Windsurf"],
  ["GitHub Copilot", "Claude Code"],
  ["Cursor", "Claude Code"],
  ["Windsurf", "Claude Code"],

  // Cloud AI Platforms
  ["AWS Bedrock", "Azure AI Foundry"],
  ["AWS Bedrock", "Google Cloud Vertex AI"],
  ["Azure AI Foundry", "Google Cloud Vertex AI"],

  // BI & Visualization
  ["Tableau", "Power BI"],
  ["Tableau", "Looker"],
  ["Power BI", "Looker"],
  ["Tableau", "Qlik"],
  ["Power BI", "Qlik"],

  // CRM & Sales
  ["Salesforce Einstein", "HubSpot AI"],
  ["Salesforce Einstein", "Zoho AI"],
  ["HubSpot AI", "Zoho AI"],

  // Customer Support
  ["Zendesk AI", "Intercom Fin"],
  ["Zendesk AI", "ServiceNow AI Agents"],

  // Productivity Suites
  ["Microsoft 365 Copilot", "Google Workspace AI"],
  ["Notion AI", "Microsoft 365 Copilot"],

  // Design
  ["Figma AI", "Canva AI"],

  // Search
  ["Perplexity", "Google Search AI"],
  ["Elastic AI", "Algolia"],

  // Marketing
  ["Jasper", "Writer"],

  // Data Platforms
  ["Snowflake Cortex", "Databricks"],
  ["Snowflake Cortex", "Google BigQuery"],
  ["Databricks", "Google BigQuery"],

  // HR
  ["Workday AI", "Lattice"],

  // Collaboration
  ["Slack AI", "Microsoft Teams AI"],

  // MLOps
  ["Weights & Biases", "MLflow"],
  ["Weights & Biases", "Neptune"],

  // Video Generation
  ["Runway", "Pika"],
  ["Runway", "Sora"],
  ["Pika", "Sora"],

  // Image Generation
  ["Midjourney", "DALL-E 3"],
  ["Midjourney", "Stable Diffusion"],
  ["DALL-E 3", "Stable Diffusion"],
];

/** Pre-built bidirectional lookup */
const _competitorMap = new Map<string, Set<string>>();
for (const [a, b] of COMPETITIVE_PAIRS) {
  if (!_competitorMap.has(a)) _competitorMap.set(a, new Set());
  if (!_competitorMap.has(b)) _competitorMap.set(b, new Set());
  _competitorMap.get(a)!.add(b);
  _competitorMap.get(b)!.add(a);
}

/** Get all competitors of a tool */
export function getCompetitors(toolName: string): string[] {
  return Array.from(_competitorMap.get(toolName) || []);
}

/** Check if two tools compete */
export function areCompetitors(a: string, b: string): boolean {
  return _competitorMap.get(a)?.has(b) ?? false;
}

/**
 * Company → tools they make.
 * Used to auto-detect "own product" and flag competitors.
 */
export const COMPANY_TOOLS: Record<string, string[]> = {
  "Anthropic": ["Claude", "Claude Code"],
  "OpenAI": ["ChatGPT", "DALL-E 3", "Sora", "Codex", "GPT-5 API", "Whisper"],
  "Google": ["Gemini", "Google Cloud Vertex AI", "Google Workspace AI", "Google BigQuery", "NotebookLM", "Looker", "Google Search AI"],
  "Microsoft": ["Microsoft 365 Copilot", "Azure AI Foundry", "GitHub Copilot", "Power BI", "Microsoft Teams AI"],
  "Meta": ["Llama"],
  "Mistral AI": ["Mistral"],
  "Cohere": ["Cohere"],
  "Salesforce": ["Salesforce Einstein"],
  "HubSpot": ["HubSpot AI"],
  "Databricks": ["Databricks"],
  "Snowflake": ["Snowflake Cortex"],
  "Figma": ["Figma AI"],
  "Canva": ["Canva AI"],
  "Notion": ["Notion AI"],
  "Slack": ["Slack AI"],
  "Tableau": ["Tableau"],
  "ServiceNow": ["ServiceNow AI Agents"],
  "Workday": ["Workday AI"],
  "Zendesk": ["Zendesk AI"],
  "Intercom": ["Intercom Fin"],
  "Elastic": ["Elastic AI"],
  "Runway": ["Runway"],
  "Midjourney": ["Midjourney"],
  "Stability AI": ["Stable Diffusion"],
  "Pika": ["Pika"],
  "Jasper": ["Jasper"],
  "Writer": ["Writer"],
  "SAP": ["SAP Joule"],
  "NVIDIA": ["Nemotron", "NeMo"],
  "Palantir": ["Palantir AIP"],
  "Anyscale": ["Cursor"],
  "Codeium": ["Windsurf"],
  "Weights & Biases": ["Weights & Biases"],
  "Perplexity": ["Perplexity"],
  "Stripe": ["Stripe"],
  "SpaceX": [],
  "Anduril": [],
};

/**
 * Given a company name, returns the tools they make and all competitor tools.
 * Returns { ownTools, conflictedTools } where conflictedTools maps
 * each competitor tool → which own tool it conflicts with.
 */
export function getCompanyConflicts(companyName: string): {
  ownTools: string[];
  conflictedTools: Map<string, string>; // competitor → own tool it conflicts with
} {
  // Fuzzy match company name
  const normalName = companyName.trim().toLowerCase();
  let ownTools: string[] = [];

  for (const [company, tools] of Object.entries(COMPANY_TOOLS)) {
    if (normalName.includes(company.toLowerCase()) || company.toLowerCase().includes(normalName)) {
      ownTools = tools;
      break;
    }
  }

  const conflictedTools = new Map<string, string>();
  for (const ownTool of ownTools) {
    for (const competitor of getCompetitors(ownTool)) {
      if (!ownTools.includes(competitor)) {
        conflictedTools.set(competitor, ownTool);
      }
    }
  }

  return { ownTools, conflictedTools };
}
