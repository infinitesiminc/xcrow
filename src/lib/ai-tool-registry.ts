/**
 * Registry of AI tools mentioned in simulations.
 * Each entry has a display name, regex pattern, and short description.
 */

export interface AIToolInfo {
  name: string;
  pattern: RegExp;
  description: string;
  category: "llm" | "coding" | "productivity" | "design" | "data" | "writing" | "search";
  url?: string;
}

export const AI_TOOL_REGISTRY: AIToolInfo[] = [
  // LLMs
  { name: "ChatGPT", pattern: /\bChatGPT\b/gi, description: "OpenAI's conversational AI assistant (GPT-5.4). Generates text, answers questions, writes code, and helps brainstorm ideas.", category: "llm", url: "https://chat.openai.com" },
  { name: "GPT-5.4", pattern: /\bGPT[-:\s]*5\.4\b/gi, description: "OpenAI's latest flagship model. Best-in-class reasoning, multimodal capabilities, and long context.", category: "llm" },
  { name: "GPT-5", pattern: /\bGPT[-:\s]*5\b/gi, description: "OpenAI's advanced reasoning model family. Excels at complex analysis, long documents, and nuanced tasks.", category: "llm" },
  { name: "GPT-4o", pattern: /\bGPT[-:\s]*4o\b/gi, description: "OpenAI's previous-gen multimodal model. Superseded by GPT-5.4 but still widely referenced.", category: "llm" },
  { name: "Claude 4.5", pattern: /\bClaude\s*4\.5\b/gi, description: "Anthropic's latest AI model. Known for careful reasoning, long context windows, and nuanced writing.", category: "llm", url: "https://claude.ai" },
  { name: "Claude 4", pattern: /\bClaude\s*4\b/gi, description: "Anthropic's previous flagship AI model. Excellent analysis, writing, and coding.", category: "llm", url: "https://claude.ai" },
  { name: "Claude", pattern: /\bClaude\b/gi, description: "Anthropic's AI assistant family. Excels at analysis, writing, coding, and careful reasoning with large documents.", category: "llm", url: "https://claude.ai" },
  { name: "Gemini 3.1", pattern: /\bGemini\s*3\.1\b/gi, description: "Google's latest multimodal AI. Handles text, images, code, and reasoning with massive context windows.", category: "llm" },
  { name: "Gemini 2.5", pattern: /\bGemini\s*2\.5\b/gi, description: "Google's previous-gen AI model. Strong multimodal capabilities for text, images, and code.", category: "llm" },
  { name: "Gemini", pattern: /\bGemini\b/gi, description: "Google's AI model family. Multimodal capabilities for text, images, and code generation.", category: "llm" },
  { name: "Llama 4", pattern: /\bLlama\s*4\b/gi, description: "Meta's latest open-source language model. Free to use and customize for various AI applications.", category: "llm" },
  { name: "Llama", pattern: /\bLlama\s*\d?\b/gi, description: "Meta's open-source language model family. Free to use and customize.", category: "llm" },
  { name: "Perplexity", pattern: /\bPerplexity\b/gi, description: "AI-powered search engine (Pro 3) that provides cited, sourced answers to complex questions.", category: "search", url: "https://perplexity.ai" },

  // Coding
  { name: "GitHub Copilot", pattern: /\bGitHub\s*Copilot\b/gi, description: "AI pair programmer (Copilot X) that suggests code completions, writes functions, and explains code inside your editor.", category: "coding", url: "https://github.com/features/copilot" },
  { name: "Cursor", pattern: /\bCursor\b/gi, description: "AI-first code editor (2.0). Chat with your codebase, generate code, and refactor with natural language.", category: "coding", url: "https://cursor.com" },
  { name: "v0", pattern: /\bv0\b/gi, description: "Vercel's AI tool that generates React UI components from text prompts and screenshots.", category: "coding", url: "https://v0.dev" },
  { name: "Replit AI", pattern: /\bReplit\s*AI\b/gi, description: "AI coding assistant built into Replit. Generates, explains, and debugs code in the browser.", category: "coding" },

  // Productivity
  { name: "Notion AI", pattern: /\bNotion\s*AI\b/gi, description: "AI writing and summarization built into Notion. Drafts docs, summarizes pages, and extracts action items.", category: "productivity", url: "https://notion.so" },
  { name: "Microsoft Copilot", pattern: /\bMicrosoft\s*Copilot\b/gi, description: "AI assistant embedded in Microsoft 365. Drafts emails, creates presentations, and analyzes spreadsheets.", category: "productivity" },
  { name: "Google Workspace AI", pattern: /\bGoogle\s*Workspace\s*AI\b/gi, description: "AI features across Google Docs, Sheets, and Slides for writing, analyzing data, and creating content.", category: "productivity" },

  // Design
  { name: "Midjourney", pattern: /\bMidjourney\b/gi, description: "AI image generator (v7) known for stunning, artistic visuals. Creates images from text descriptions.", category: "design", url: "https://midjourney.com" },
  { name: "DALL-E", pattern: /\bDALL[·\-]?E\s*\d?\b/gi, description: "OpenAI's image generation model (DALL-E 4). Creates and edits images from natural language descriptions.", category: "design" },
  { name: "Figma AI", pattern: /\bFigma\s*AI\b/gi, description: "AI-powered design features in Figma. Auto-generates layouts, suggests designs, and creates prototypes.", category: "design" },
  { name: "Canva AI", pattern: /\bCanva\s*AI\b/gi, description: "AI tools inside Canva for generating images, writing copy, and auto-designing presentations.", category: "design" },

  // Data
  { name: "Tableau", pattern: /\bTableau\b/gi, description: "Data visualization platform with AI-powered analytics. Creates interactive dashboards from complex datasets.", category: "data", url: "https://tableau.com" },
  { name: "Power BI", pattern: /\bPower\s*BI\b/gi, description: "Microsoft's business analytics tool. AI-assisted data modeling, visualization, and natural language queries.", category: "data" },

  // Writing
  { name: "Grammarly", pattern: /\bGrammarly\b/gi, description: "AI writing assistant for grammar, clarity, tone, and style. Works across apps and browsers.", category: "writing", url: "https://grammarly.com" },
  { name: "Jasper", pattern: /\bJasper\b/gi, description: "AI content platform for marketing teams. Generates brand-consistent copy, ads, and social posts.", category: "writing", url: "https://jasper.ai" },
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

// ─── Saved tools (localStorage) ───

const SAVED_TOOLS_KEY = "xcrow_saved_ai_tools";

export function getSavedTools(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_TOOLS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveToolToList(toolName: string): string[] {
  const current = getSavedTools();
  if (!current.includes(toolName)) {
    current.push(toolName);
    localStorage.setItem(SAVED_TOOLS_KEY, JSON.stringify(current));
  }
  return current;
}

export function removeToolFromList(toolName: string): string[] {
  const current = getSavedTools().filter(t => t !== toolName);
  localStorage.setItem(SAVED_TOOLS_KEY, JSON.stringify(current));
  return current;
}

export function isToolSaved(toolName: string): boolean {
  return getSavedTools().includes(toolName);
}
