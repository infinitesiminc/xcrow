/**
 * Skill Map — shared taxonomy, XP calculation, and level logic.
 *
 * Every simulation maps to 1-3 skills via keyword matching.
 * XP accumulates per skill; levels unlock at thresholds.
 */

export type SkillCategory = "technical" | "analytical" | "communication" | "leadership" | "creative" | "compliance";

export interface TaxonomySkill {
  id: string;
  name: string;
  category: SkillCategory;
  keywords: string[];
  aiExposure: number;
  humanEdge?: string;
}

export const SKILL_TAXONOMY: TaxonomySkill[] = [
  // ── Technical ──
  { id: "code-dev", name: "Software Dev", category: "technical", aiExposure: 72, keywords: ["code", "development", "engineering", "component", "pipeline", "deploy", "api", "software", "build", "feature", "frontend", "backend", "module"], humanEdge: "System thinking" },
  { id: "system-design", name: "System Architecture", category: "technical", aiExposure: 35, keywords: ["architecture", "system design", "platform", "infrastructure", "migration", "scalab", "distributed", "microservice"], humanEdge: "Trade-off reasoning" },
  { id: "testing-qa", name: "Testing & QA", category: "technical", aiExposure: 78, keywords: ["test", "qa", "regression", "bug", "quality", "validation", "code review"], humanEdge: "Edge-case intuition" },
  { id: "security", name: "Cybersecurity", category: "technical", aiExposure: 55, keywords: ["security", "threat", "vulnerability", "cybersecurity", "encryption", "access control"], humanEdge: "Adversarial thinking" },
  { id: "data-engineering", name: "Data Engineering", category: "technical", aiExposure: 68, keywords: ["data pipeline", "warehouse", "etl", "data quality", "schema", "database", "data model"], humanEdge: "Data governance" },
  { id: "ai-ml", name: "AI & ML", category: "technical", aiExposure: 60, keywords: ["model", "training", "ml", " ai ", "machine learning", "prediction", "deep learning", "nlp", "simulation"], humanEdge: "Problem framing" },
  { id: "devops", name: "DevOps & Cloud", category: "technical", aiExposure: 65, keywords: ["devops", "container", "monitoring", "incident", "deployment", "kubernetes", "cloud", "terraform"], humanEdge: "Incident judgment" },
  { id: "prompt-eng", name: "Prompt Engineering", category: "technical", aiExposure: 85, keywords: ["prompt", "llm", "generative ai", "chatgpt", "copilot", "prompt engineering"], humanEdge: "Intent clarity" },
  // ── Analytical ──
  { id: "data-analysis", name: "Data Analysis", category: "analytical", aiExposure: 80, keywords: ["analysis", "analytics", "data", "metrics", "dashboard", "reporting", "insight", "kpi", "visualization"], humanEdge: "Asking the right questions" },
  { id: "financial-modeling", name: "Financial Modeling", category: "analytical", aiExposure: 70, keywords: ["financial model", "valuation", "forecast", "budget", "revenue", "pricing", "accounting", "tax", "invoice"], humanEdge: "Assumption judgment" },
  { id: "research", name: "Research & Discovery", category: "analytical", aiExposure: 75, keywords: ["research", "audit", "review", "hypothesis", "market research", "competitive", "survey", "user research"], humanEdge: "Novel hypotheses" },
  { id: "process-optimization", name: "Process Optimization", category: "analytical", aiExposure: 60, keywords: ["process", "optimization", "workflow", "automation", "efficiency", "funnel", "streamline", "logistics"], humanEdge: "Change management" },
  { id: "risk-assessment", name: "Risk Assessment", category: "analytical", aiExposure: 50, keywords: ["risk", "mitigation", "scenario analysis", "compliance", "safety", "crisis", "governance"], humanEdge: "Judgment under uncertainty" },
  { id: "critical-thinking", name: "Critical Thinking", category: "analytical", aiExposure: 30, keywords: ["critical thinking", "problem solving", "reasoning", "logic", "evaluation", "decision making"], humanEdge: "Structured reasoning" },
  // ── Communication ──
  { id: "stakeholder-mgmt", name: "Stakeholder Mgmt", category: "communication", aiExposure: 15, keywords: ["stakeholder", "client", "customer", "relationship", "cross-functional", "collaboration", "consulting"], humanEdge: "Trust building" },
  { id: "writing-docs", name: "Writing & Docs", category: "communication", aiExposure: 82, keywords: ["documentation", "writing", "copy", "content", "email", "knowledge base", "communication", "specification"], humanEdge: "Voice & persuasion" },
  { id: "presentation", name: "Presentation", category: "communication", aiExposure: 65, keywords: ["presentation", "reporting", "pitch", "deck", "storytelling", "proposal", "board", "public speaking"], humanEdge: "Executive presence" },
  { id: "negotiation", name: "Negotiation", category: "communication", aiExposure: 10, keywords: ["negotiation", "deal", "closing", "persuasion", "contract negotiation"], humanEdge: "Empathy & leverage" },
  { id: "sales", name: "Sales & Biz Dev", category: "communication", aiExposure: 30, keywords: ["sales", "revenue", "prospect", "lead", "pipeline", "account", "demo", "customer acquisition", "consultative selling"], humanEdge: "Relationship building" },
  // ── Leadership ──
  { id: "project-mgmt", name: "Project Mgmt", category: "leadership", aiExposure: 40, keywords: ["project", "sprint", "planning", "coordination", "launch", "milestone", "agile", "roadmap", "program"], humanEdge: "Priority judgment" },
  { id: "strategy", name: "Strategy & Planning", category: "leadership", aiExposure: 25, keywords: ["strategy", "roadmap", "positioning", "go-to-market", "planning", "vision", "growth", "expansion", "strategic thinking", "strategic planning"], humanEdge: "Competitive intuition" },
  { id: "team-mgmt", name: "Team Leadership", category: "leadership", aiExposure: 12, keywords: ["team", "coaching", "talent", "hiring", "people", "leadership", "management", "mentoring", "training", "mentorship"], humanEdge: "Empathy & culture" },
  { id: "vendor-mgmt", name: "Vendor & Supply Chain", category: "leadership", aiExposure: 45, keywords: ["vendor", "supplier", "procurement", "supply chain", "inventory", "sourcing"], humanEdge: "Relationship leverage" },
  { id: "change-mgmt", name: "Change Management", category: "leadership", aiExposure: 20, keywords: ["change management", "transformation", "adoption", "stakeholder alignment", "organizational change"], humanEdge: "Organizational empathy" },
  // ── Creative ──
  { id: "design-ux", name: "Design & UX", category: "creative", aiExposure: 55, keywords: ["design", "ux", "wireframe", "prototype", "usability", "ui", "user experience", "figma"], humanEdge: "Empathy-driven design" },
  { id: "brand-creative", name: "Brand & Creative", category: "creative", aiExposure: 50, keywords: ["brand", "creative", "identity", "campaign", "concept", "influencer", "community"], humanEdge: "Cultural resonance" },
  { id: "content-seo", name: "Content & SEO", category: "creative", aiExposure: 78, keywords: ["seo", "content", "blog", "social media", "organic", "editorial", "content strategy"], humanEdge: "Audience intuition" },
  { id: "product-sense", name: "Product Sense", category: "creative", aiExposure: 30, keywords: ["product strategy", "product sense", "product knowledge", "feature prioritization", "user needs", "product vision"], humanEdge: "User empathy" },
  // ── Compliance ──
  { id: "regulatory", name: "Regulatory & Legal", category: "compliance", aiExposure: 45, keywords: ["regulatory", "compliance", "legal", "policy", "patent", "contract", "litigation", "governance", "privacy"], humanEdge: "Jurisdictional judgment" },
  { id: "audit-control", name: "Audit & Controls", category: "compliance", aiExposure: 70, keywords: ["audit", "reconciliation", "month-end", "internal control", "assurance", "financial statement"], humanEdge: "Materiality judgment" },
  { id: "emotional-iq", name: "Emotional Intelligence", category: "leadership", aiExposure: 8, keywords: ["emotional intelligence", "empathy", "self-awareness", "conflict resolution", "interpersonal", "active listening"], humanEdge: "Human connection" },
];

export const CATEGORY_META: Record<SkillCategory, { label: string; emoji: string }> = {
  technical: { label: "Technical", emoji: "⚙️" },
  analytical: { label: "Analytical", emoji: "📊" },
  communication: { label: "Communication", emoji: "💬" },
  leadership: { label: "Leadership", emoji: "🎯" },
  creative: { label: "Creative", emoji: "🎨" },
  compliance: { label: "Compliance", emoji: "📋" },
};

// ── XP & Level System ──

export const XP_PER_SIM = 100;

export const LEVELS = [
  { name: "Beginner", threshold: 0 },
  { name: "Developing", threshold: 100 },
  { name: "Proficient", threshold: 300 },
  { name: "Expert", threshold: 600 },
] as const;

export type LevelName = (typeof LEVELS)[number]["name"];

export function getLevel(xp: number): { name: LevelName; index: number } {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].threshold) return { name: LEVELS[i].name, index: i };
  }
  return { name: "Beginner", index: 0 };
}

export function getNextLevel(xp: number): { name: LevelName; threshold: number; xpNeeded: number } | null {
  const current = getLevel(xp);
  if (current.index >= LEVELS.length - 1) return null;
  const next = LEVELS[current.index + 1];
  return { name: next.name, threshold: next.threshold, xpNeeded: next.threshold - xp };
}

export function levelProgress(xp: number): number {
  const current = getLevel(xp);
  if (current.index >= LEVELS.length - 1) return 100;
  const currentThreshold = LEVELS[current.index].threshold;
  const nextThreshold = LEVELS[current.index + 1].threshold;
  return Math.min(100, Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100));
}

// ── Keyword matcher ──

export function matchTaskToSkills(taskName: string, jobTitle?: string, taxonomy?: TaxonomySkill[]): string[] {
  const text = `${taskName} ${jobTitle || ""}`.toLowerCase();
  const source = taxonomy || SKILL_TAXONOMY;
  return source
    .filter(s => s.keywords.some(kw => text.includes(kw)))
    .map(s => s.id);
}

// ── Aggregate XP from completed_simulations ──

export interface SkillXP {
  id: string;
  name: string;
  category: SkillCategory;
  xp: number;
  level: LevelName;
  levelIndex: number;
  progress: number; // 0-100 within current level
  aiExposure: number;
  humanEdge?: string;
  taskCount: number;
  // Aggregated simulation dimension scores
  avgToolAwareness?: number;
  avgAdaptiveThinking?: number;
  avgHumanValueAdd?: number;
  avgDomainJudgment?: number;
}

export interface SimRecord {
  task_name: string;
  job_title: string;
  skills_earned?: { skill_id: string; xp: number }[] | null;
  tool_awareness_score?: number | null;
  human_value_add_score?: number | null;
  adaptive_thinking_score?: number | null;
  domain_judgment_score?: number | null;
}

export function aggregateSkillXP(sims: SimRecord[], taxonomy?: TaxonomySkill[]): SkillXP[] {
  const source = taxonomy || SKILL_TAXONOMY;
  const xpMap = new Map<string, { xp: number; taskCount: number; toolScores: number[]; adaptiveScores: number[]; humanScores: number[]; domainScores: number[] }>();

  const getEntry = (id: string) => {
    if (!xpMap.has(id)) xpMap.set(id, { xp: 0, taskCount: 0, toolScores: [], adaptiveScores: [], humanScores: [], domainScores: [] });
    return xpMap.get(id)!;
  };

  for (const sim of sims) {
    // Prefer explicit skills_earned, fall back to keyword matching
    let skillIds: string[];
    if (sim.skills_earned && Array.isArray(sim.skills_earned) && sim.skills_earned.length > 0) {
      skillIds = sim.skills_earned.map(se => se.skill_id);
      for (const se of sim.skills_earned) {
        const entry = getEntry(se.skill_id);
        entry.xp += se.xp;
        entry.taskCount++;
      }
    } else {
      skillIds = matchTaskToSkills(sim.task_name, sim.job_title, source);
      if (skillIds.length === 0) continue;
      const xpEach = Math.round(XP_PER_SIM / skillIds.length);
      for (const id of skillIds) {
        const entry = getEntry(id);
        entry.xp += xpEach;
        entry.taskCount++;
      }
    }

    // Accumulate dimension scores for all matched skills
    for (const id of skillIds) {
      const entry = getEntry(id);
      if (sim.tool_awareness_score != null) entry.toolScores.push(sim.tool_awareness_score);
      if (sim.adaptive_thinking_score != null) entry.adaptiveScores.push(sim.adaptive_thinking_score);
      if (sim.human_value_add_score != null) entry.humanScores.push(sim.human_value_add_score);
      if (sim.domain_judgment_score != null) entry.domainScores.push(sim.domain_judgment_score);
    }
  }

  const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : undefined;

  return source.map(skill => {
    const entry = xpMap.get(skill.id) || { xp: 0, taskCount: 0, toolScores: [], adaptiveScores: [], humanScores: [], domainScores: [] };
    const lvl = getLevel(entry.xp);
    return {
      id: skill.id,
      name: skill.name,
      category: skill.category,
      xp: entry.xp,
      level: lvl.name,
      levelIndex: lvl.index,
      progress: levelProgress(entry.xp),
      aiExposure: skill.aiExposure,
      humanEdge: skill.humanEdge,
      taskCount: entry.taskCount,
      avgToolAwareness: avg(entry.toolScores),
      avgAdaptiveThinking: avg(entry.adaptiveScores),
      avgHumanValueAdd: avg(entry.humanScores),
      avgDomainJudgment: avg(entry.domainScores),
    };
  });
}
