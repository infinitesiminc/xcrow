import { JobAnalysisResult } from "@/types/analysis";

const prebuiltRoles: Record<string, JobAnalysisResult> = {
  "software engineer": {
    jobTitle: "Software Engineer",
    company: "",
    summary: { augmentedPercent: 72, automationRiskPercent: 15, newSkillsPercent: 65 },
    tasks: [
      { name: "Writing boilerplate code", currentState: "mostly_ai", trend: "fully_ai_soon", impactLevel: "high", description: "AI code generators handle repetitive patterns, scaffolding, and standard implementations." },
      { name: "Code review", currentState: "human_ai", trend: "increasing_ai", impactLevel: "medium", description: "AI flags issues and suggests fixes, but human judgment on architecture and design remains critical." },
      { name: "Debugging & troubleshooting", currentState: "human_ai", trend: "increasing_ai", impactLevel: "medium", description: "AI assists with error diagnosis and log analysis, but complex bugs still need human reasoning." },
      { name: "System architecture design", currentState: "mostly_human", trend: "stable", impactLevel: "low", description: "High-level design decisions require deep domain knowledge and business context." },
      { name: "Writing unit tests", currentState: "human_ai", trend: "fully_ai_soon", impactLevel: "high", description: "AI can generate comprehensive test suites from code, reducing manual test writing." },
      { name: "Documentation", currentState: "human_ai", trend: "increasing_ai", impactLevel: "medium", description: "AI generates docs from code, but humans refine for clarity and context." },
      { name: "Requirements gathering", currentState: "mostly_human", trend: "stable", impactLevel: "low", description: "Understanding stakeholder needs requires human communication and empathy." },
      { name: "Performance optimization", currentState: "human_ai", trend: "increasing_ai", impactLevel: "medium", description: "AI identifies bottlenecks and suggests optimizations, humans validate trade-offs." },
    ],
    skills: [
      { name: "AI-Assisted Development", priority: "high", category: "ai_tools", description: "Master tools like GitHub Copilot, Cursor, and AI code assistants to multiply your productivity." },
      { name: "Prompt Engineering for Code", priority: "high", category: "ai_tools", description: "Learn to craft effective prompts that generate high-quality, production-ready code." },
      { name: "AI/ML Fundamentals", priority: "medium", category: "new_capabilities", description: "Understand machine learning basics to evaluate and integrate AI features into applications." },
      { name: "System Design & Architecture", priority: "high", category: "human_skills", description: "Deepen architectural thinking — the skill AI can't replace. Design scalable, maintainable systems." },
      { name: "Code Review & Quality Judgment", priority: "medium", category: "human_skills", description: "Develop critical evaluation skills to assess AI-generated code for security, performance, and correctness." },
      { name: "AI API Integration", priority: "medium", category: "new_capabilities", description: "Learn to integrate LLMs, vision models, and AI services into production applications." },
    ],
  },
  "marketing manager": {
    jobTitle: "Marketing Manager",
    company: "",
    summary: { augmentedPercent: 68, automationRiskPercent: 25, newSkillsPercent: 70 },
    tasks: [
      { name: "Content creation & copywriting", currentState: "human_ai", trend: "increasing_ai", impactLevel: "high", description: "AI drafts blog posts, emails, and social copy. Humans refine voice, strategy, and brand consistency." },
      { name: "Data analysis & reporting", currentState: "human_ai", trend: "fully_ai_soon", impactLevel: "high", description: "AI automates dashboard creation, trend spotting, and campaign attribution analysis." },
      { name: "Campaign strategy", currentState: "mostly_human", trend: "stable", impactLevel: "low", description: "Strategic decisions about audience, positioning, and channel mix remain human-driven." },
      { name: "Social media management", currentState: "human_ai", trend: "increasing_ai", impactLevel: "medium", description: "AI schedules, generates, and optimizes posts. Humans handle community engagement and crisis response." },
      { name: "Email marketing", currentState: "human_ai", trend: "increasing_ai", impactLevel: "medium", description: "AI personalizes subject lines, send times, and content. Humans set strategy and brand guidelines." },
      { name: "SEO optimization", currentState: "human_ai", trend: "fully_ai_soon", impactLevel: "high", description: "AI handles keyword research, meta optimization, and content suggestions at scale." },
      { name: "Brand strategy & positioning", currentState: "mostly_human", trend: "stable", impactLevel: "low", description: "Deep brand work requires human creativity, market intuition, and cultural understanding." },
    ],
    skills: [
      { name: "AI Content Tools", priority: "high", category: "ai_tools", description: "Master ChatGPT, Jasper, and AI writing tools for rapid content production and iteration." },
      { name: "AI Analytics Platforms", priority: "high", category: "ai_tools", description: "Learn AI-powered analytics tools to extract insights faster and automate reporting." },
      { name: "Data-Driven Decision Making", priority: "medium", category: "new_capabilities", description: "Strengthen ability to interpret AI-generated insights and translate them into strategy." },
      { name: "Creative Direction", priority: "high", category: "human_skills", description: "Focus on big-picture creative thinking that guides AI-generated output toward brand goals." },
      { name: "AI Ethics in Marketing", priority: "medium", category: "new_capabilities", description: "Understand responsible AI use in targeting, personalization, and content generation." },
      { name: "Strategic Storytelling", priority: "medium", category: "human_skills", description: "Develop the human craft of narrative that AI can assist but not originate." },
    ],
  },
  "accountant": {
    jobTitle: "Accountant",
    company: "",
    summary: { augmentedPercent: 60, automationRiskPercent: 35, newSkillsPercent: 55 },
    tasks: [
      { name: "Data entry & bookkeeping", currentState: "mostly_ai", trend: "fully_ai_soon", impactLevel: "high", description: "AI auto-categorizes transactions, reconciles accounts, and processes invoices." },
      { name: "Tax preparation", currentState: "human_ai", trend: "increasing_ai", impactLevel: "high", description: "AI calculates returns and flags deductions, but complex tax planning needs human expertise." },
      { name: "Financial reporting", currentState: "human_ai", trend: "increasing_ai", impactLevel: "medium", description: "AI generates standard reports. Humans interpret results and add narrative context." },
      { name: "Audit procedures", currentState: "human_ai", trend: "increasing_ai", impactLevel: "medium", description: "AI flags anomalies and risk patterns, but audit judgment remains human." },
      { name: "Client advisory", currentState: "mostly_human", trend: "stable", impactLevel: "low", description: "Strategic financial advice requires relationship building and deep business understanding." },
      { name: "Compliance monitoring", currentState: "human_ai", trend: "increasing_ai", impactLevel: "medium", description: "AI tracks regulation changes and flags compliance issues automatically." },
    ],
    skills: [
      { name: "AI Accounting Software", priority: "high", category: "ai_tools", description: "Master tools like Xero AI, QuickBooks AI, and automated reconciliation platforms." },
      { name: "Data Analytics", priority: "high", category: "new_capabilities", description: "Go beyond traditional reporting — learn to analyze large datasets for financial insights." },
      { name: "Advisory & Consulting", priority: "high", category: "human_skills", description: "Shift from compliance to strategic advisory as AI handles routine tasks." },
      { name: "AI-Powered Forecasting", priority: "medium", category: "ai_tools", description: "Use AI tools for cash flow prediction, budget planning, and financial modeling." },
      { name: "Technology Integration", priority: "medium", category: "new_capabilities", description: "Learn to evaluate and implement AI tools within accounting workflows." },
      { name: "Critical Judgment", priority: "medium", category: "human_skills", description: "Strengthen professional skepticism and judgment that AI cannot replicate." },
    ],
  },
};

export function findPrebuiltRole(jobTitle: string): JobAnalysisResult | null {
  const normalized = jobTitle.toLowerCase().trim();
  for (const [key, value] of Object.entries(prebuiltRoles)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  return null;
}
