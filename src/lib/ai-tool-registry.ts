/**
 * Registry of AI tools mentioned in simulations.
 * Each entry has a display name, regex pattern, company, and short description.
 * Versions are fetched dynamically from platform_config — not hardcoded here.
 */

export interface AIToolInfo {
  name: string;
  pattern: RegExp;
  description: string;
  category: "llm" | "coding" | "productivity" | "design" | "data" | "writing" | "search";
  company: string;
  url?: string;
}

export const AI_TOOL_REGISTRY: AIToolInfo[] = [
  // LLMs — OpenAI
  { name: "ChatGPT", pattern: /\bChatGPT\b/gi, description: "Conversational AI assistant for text, code, and brainstorming.", category: "llm", company: "OpenAI", url: "https://chat.openai.com" },
  { name: "GPT-5.4", pattern: /\bGPT[-:\s]*5\.4\b/gi, description: "Flagship reasoning model with multimodal capabilities.", category: "llm", company: "OpenAI" },
  { name: "GPT-5", pattern: /\bGPT[-:\s]*5\b/gi, description: "Advanced reasoning model for complex analysis and long documents.", category: "llm", company: "OpenAI" },
  { name: "GPT-4o", pattern: /\bGPT[-:\s]*4o\b/gi, description: "Previous-gen multimodal model, superseded by GPT-5.4.", category: "llm", company: "OpenAI" },
  { name: "DALL-E", pattern: /\bDALL[·\-]?E\s*\d?\b/gi, description: "Image generation from natural language descriptions.", category: "design", company: "OpenAI" },

  // LLMs — Anthropic
  { name: "Claude 4.5", pattern: /\bClaude\s*4\.5\b/gi, description: "Latest model with careful reasoning and long context.", category: "llm", company: "Anthropic", url: "https://claude.ai" },
  { name: "Claude 4", pattern: /\bClaude\s*4\b/gi, description: "Previous flagship for analysis, writing, and coding.", category: "llm", company: "Anthropic", url: "https://claude.ai" },
  { name: "Claude", pattern: /\bClaude\b/gi, description: "AI assistant family excelling at analysis and reasoning.", category: "llm", company: "Anthropic", url: "https://claude.ai" },

  // LLMs — Google
  { name: "Gemini 3.1", pattern: /\bGemini\s*3\.1\b/gi, description: "Latest multimodal AI with massive context windows.", category: "llm", company: "Google" },
  { name: "Gemini 2.5", pattern: /\bGemini\s*2\.5\b/gi, description: "Previous-gen multimodal model for text, images, and code.", category: "llm", company: "Google" },
  { name: "Gemini", pattern: /\bGemini\b/gi, description: "Multimodal AI model family for text, images, and code.", category: "llm", company: "Google" },
  { name: "Google Workspace AI", pattern: /\bGoogle\s*Workspace\s*AI\b/gi, description: "AI across Docs, Sheets, and Slides.", category: "productivity", company: "Google" },

  // LLMs — Meta
  { name: "Llama 4", pattern: /\bLlama\s*4\b/gi, description: "Open-source language model, free to use and customize.", category: "llm", company: "Meta" },
  { name: "Llama", pattern: /\bLlama\s*\d?\b/gi, description: "Open-source language model family.", category: "llm", company: "Meta" },

  // Search
  { name: "Perplexity", pattern: /\bPerplexity\b/gi, description: "AI-powered search engine with cited, sourced answers.", category: "search", company: "Perplexity AI", url: "https://perplexity.ai" },

  // Coding
  { name: "GitHub Copilot", pattern: /\bGitHub\s*Copilot\b/gi, description: "AI pair programmer for code suggestions and generation.", category: "coding", company: "GitHub", url: "https://github.com/features/copilot" },
  { name: "Cursor", pattern: /\bCursor\b/gi, description: "AI-first code editor — chat with your codebase.", category: "coding", company: "Anysphere", url: "https://cursor.com" },
  { name: "v0", pattern: /\bv0\b/gi, description: "Generates React UI components from text prompts.", category: "coding", company: "Vercel", url: "https://v0.dev" },
  { name: "Replit AI", pattern: /\bReplit\s*AI\b/gi, description: "AI coding assistant in the browser.", category: "coding", company: "Replit" },

  // Productivity
  { name: "Notion AI", pattern: /\bNotion\s*AI\b/gi, description: "AI writing, summarization, and action items in Notion.", category: "productivity", company: "Notion", url: "https://notion.so" },
  { name: "Microsoft Copilot", pattern: /\bMicrosoft\s*Copilot\b/gi, description: "AI in Microsoft 365 for emails, docs, and spreadsheets.", category: "productivity", company: "Microsoft" },

  // Design
  { name: "Midjourney", pattern: /\bMidjourney\b/gi, description: "AI image generator for stunning artistic visuals.", category: "design", company: "Midjourney", url: "https://midjourney.com" },
  { name: "Figma AI", pattern: /\bFigma\s*AI\b/gi, description: "AI-powered layout generation and design suggestions.", category: "design", company: "Figma" },
  { name: "Canva AI", pattern: /\bCanva\s*AI\b/gi, description: "AI tools for images, copy, and presentations.", category: "design", company: "Canva" },

  // Data
  { name: "Tableau", pattern: /\bTableau\b/gi, description: "AI-powered data visualization and analytics dashboards.", category: "data", company: "Salesforce", url: "https://tableau.com" },
  { name: "Power BI", pattern: /\bPower\s*BI\b/gi, description: "Business analytics with AI-assisted data modeling.", category: "data", company: "Microsoft" },

  // Writing
  { name: "Grammarly", pattern: /\bGrammarly\b/gi, description: "AI writing assistant for grammar, clarity, and tone.", category: "writing", company: "Grammarly", url: "https://grammarly.com" },
  { name: "Jasper", pattern: /\bJasper\b/gi, description: "AI content platform for brand-consistent marketing copy.", category: "writing", company: "Jasper AI", url: "https://jasper.ai" },
];

// Build a single regex that matches any tool name (longest match first)
const sortedTools = [...AI_TOOL_REGISTRY].sort((a, b) => b.name.length - a.name.length);

/**
 * Find all AI tool mentions in a string.
 * Returns array of { tool, start, end } sorted by position.
 */
export function findToolMentions(text: string): { tool: AIToolInfo; start: number; end: number }[] {
  const mentions: { tool: AIToolInfo; start: number; end: number }[] = [];
  const used = new Set<number>(); // track character positions already matched

  for (const tool of sortedTools) {
    const regex = new RegExp(tool.pattern.source, tool.pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      // Skip if overlapping with existing match
      let overlaps = false;
      for (let i = start; i < end; i++) {
        if (used.has(i)) { overlaps = true; break; }
      }
      if (!overlaps) {
        mentions.push({ tool, start, end });
        for (let i = start; i < end; i++) used.add(i);
      }
    }
  }

  return mentions.sort((a, b) => a.start - b.start);
}

// ── Saved/bookmarked tools (localStorage) ──

const SAVED_KEY = "xcrow_saved_tools";

export function getSavedTools(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addToolToList(name: string): string[] {
  const list = getSavedTools();
  if (!list.includes(name)) list.push(name);
  localStorage.setItem(SAVED_KEY, JSON.stringify(list));
  return list;
}

export function removeToolFromList(name: string): string[] {
  const list = getSavedTools().filter(n => n !== name);
  localStorage.setItem(SAVED_KEY, JSON.stringify(list));
  return list;
}

/** Group tools by company for arsenal display */
export function groupToolsByCompany(tools: AIToolInfo[]): { company: string; tools: AIToolInfo[] }[] {
  const map = new Map<string, AIToolInfo[]>();
  for (const tool of tools) {
    const existing = map.get(tool.company) || [];
    existing.push(tool);
    map.set(tool.company, existing);
  }
  // Sort companies by tool count descending
  return Array.from(map.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([company, tools]) => ({ company, tools }));
}
