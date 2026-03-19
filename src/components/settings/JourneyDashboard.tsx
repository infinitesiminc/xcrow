/**
 * Journey Dashboard — unified Career Reach Map
 *
 * Stats ribbon → Skill-first bullseye with leverage suggestions
 * Click a dot → slide-out panel with best skill to practice + CTA
 */
import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Play, Target, Briefcase, Bookmark, BookOpen, ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CareerReachMap, { type JobMatchDot, type SkillLeverage } from "./CareerReachMap";

/* ─── Types ─── */
export interface PracticedRoleData {
  job_title: string;
  task_name: string;
  company: string | null;
  completed_at: string;
  correct_answers: number;
  total_questions: number;
  tool_awareness_score: number | null;
  human_value_add_score: number | null;
  adaptive_thinking_score: number | null;
  domain_judgment_score: number | null;
}

export interface SavedRoleData {
  job_title: string;
  company: string | null;
  augmented_percent: number | null;
  automation_risk_percent: number | null;
  new_skills_percent: number | null;
}

interface DbJobTemplate {
  title: string;
  company: string;
  dept: string;
  tasks: string[];
}

/* ─── Taxonomy ─── */
type SkillCategory = "technical" | "analytical" | "communication" | "leadership" | "creative" | "compliance";

interface TaxonomySkill {
  id: string; name: string; category: SkillCategory;
  keywords: string[]; aiExposure: number;
  aiEnabler?: string; humanEdge?: string;
}

const TAXONOMY: TaxonomySkill[] = [
  { id: "code-dev", name: "Software Development", category: "technical", aiExposure: 72, keywords: ["code", "development", "engineering", "component", "pipeline", "etl", "ci/cd", "deploy", "refactor", "responsive", "schema", "integration", "frontend", "backend", "api", "sdk", "implementation", "programming", "software", "build", "release", "feature", "module", "library", "framework", "debug", "production environment"], aiEnabler: "No-code platforms, Copilot, Cursor", humanEdge: "System thinking & product judgment" },
  { id: "system-design", name: "System Architecture", category: "technical", aiExposure: 35, keywords: ["architecture", "system design", "platform", "infrastructure", "migration", "mesh", "autoscaling", "reliability", "scalab", "distributed", "microservice", "high availability", "load balancing", "system reliability"], humanEdge: "Trade-off reasoning at scale" },
  { id: "testing-qa", name: "Testing & QA", category: "technical", aiExposure: 78, keywords: ["test", "qa", "regression", "performance testing", "bug", "quality", "validation", "verification", "acceptance criteria", "code review"], aiEnabler: "AI test generation, visual regression AI", humanEdge: "Edge-case intuition" },
  { id: "security", name: "Security & Compliance Tech", category: "technical", aiExposure: 55, keywords: ["security", "threat", "vulnerability", "penetration", "zero trust", "hardening", "cybersecurity", "data protection", "encryption", "access control", "authentication", "authorization"], humanEdge: "Adversarial thinking" },
  { id: "data-engineering", name: "Data Engineering", category: "technical", aiExposure: 68, keywords: ["data pipeline", "warehouse", "etl", "query optimization", "data quality", "schema design", "data model", "data entry", "database", "data infrastructure", "data processing", "data transformation"], aiEnabler: "AI-assisted SQL, auto-schema tools", humanEdge: "Data governance & domain modeling" },
  { id: "ai-ml", name: "AI & Machine Learning", category: "technical", aiExposure: 60, keywords: ["model", "training", "ml", " ai ", "machine learning", "feature engineering", "a/b test", "generative", "prediction", "classification", "neural", "deep learning", "nlp", "computer vision", "simulation"], aiEnabler: "AutoML, foundation models", humanEdge: "Problem framing & evaluation design" },
  { id: "devops", name: "DevOps & Infrastructure", category: "technical", aiExposure: 65, keywords: ["devops", "container", "monitoring", "alerting", "incident", "infrastructure as code", "deployment", "kubernetes", "docker", "cloud", "aws", "gcp", "azure", "terraform", "observability"], aiEnabler: "AI-ops, auto-remediation", humanEdge: "Incident judgment & reliability culture" },
  { id: "data-analysis", name: "Data Analysis", category: "analytical", aiExposure: 80, keywords: ["analysis", "analytics", "data", "statistical", "metrics", "dashboard", "tracking", "reporting", "rank", "insight", "kpi", "visualization", "storytelling", "decision support", "performance monitor", "data-driven", "benchmark"], aiEnabler: "AI analytics, natural language queries", humanEdge: "Asking the right questions" },
  { id: "financial-modeling", name: "Financial Modeling", category: "analytical", aiExposure: 70, keywords: ["financial model", "valuation", "forecast", "budget", "revenue", "variance", "cost", "pricing", "accounting", "gaap", "financial statement", "quote-to-cash", "billing", "invoice", "compensation", "headcount planning", "fp&a", "tax", "treasury"], aiEnabler: "AI forecasting, auto-modeling", humanEdge: "Assumption judgment & scenario framing" },
  { id: "research", name: "Research & Discovery", category: "analytical", aiExposure: 75, keywords: ["research", "audit", "review", "literature", "hypothesis", "prior art", "market research", "keyword", "discovery", "exploration", "investigation", "competitive", "intelligence", "survey", "user research"], aiEnabler: "AI literature review, auto-summarization", humanEdge: "Novel hypothesis formation" },
  { id: "process-optimization", name: "Process Optimization", category: "analytical", aiExposure: 60, keywords: ["process", "optimization", "workflow", "automation", "efficiency", "funnel", "pipeline management", "streamline", "improvement", "operational", "productivity", "logistics", "coordination", "execution"], aiEnabler: "Process mining AI, workflow automation", humanEdge: "Change management & adoption" },
  { id: "risk-assessment", name: "Risk Assessment", category: "analytical", aiExposure: 50, keywords: ["risk", "mitigation", "scenario analysis", "loss prevention", "threat model", "compliance", "safety", "contingency", "crisis", "governance"], humanEdge: "Contextual judgment under uncertainty" },
  { id: "stakeholder-mgmt", name: "Stakeholder Management", category: "communication", aiExposure: 15, keywords: ["stakeholder", "client", "customer", "relationship", "qbr", "onboarding", "correspondence", "cross-functional", "collaboration", "advisory", "consulting", "engagement", "partner", "executive relationship", "enterprise"], humanEdge: "Trust building & political navigation" },
  { id: "writing-docs", name: "Writing & Documentation", category: "communication", aiExposure: 82, keywords: ["documentation", "writing", "paper", "copy", "editorial", "content", "email", "style guide", "knowledge base", "authoring", "technical writing", "communication", "messaging", "translation", "metadata", "specification"], aiEnabler: "LLM writing assistants, auto-docs", humanEdge: "Voice, narrative, and persuasion" },
  { id: "presentation", name: "Presentation & Reporting", category: "communication", aiExposure: 65, keywords: ["presentation", "reporting", "board", "pitch", "status report", "materials", "articulation", "value proposition", "storytelling", "deck", "proposal"], aiEnabler: "AI slide generation, auto-reporting", humanEdge: "Storytelling & executive presence" },
  { id: "negotiation", name: "Negotiation & Persuasion", category: "communication", aiExposure: 10, keywords: ["negotiation", "deal", "offer", "closing", "persuasion", "licensing", "contract negotiation", "enterprise saas", "pricing negotiation"], humanEdge: "Empathy & leverage intuition" },
  { id: "project-mgmt", name: "Project Management", category: "leadership", aiExposure: 40, keywords: ["project", "sprint", "resource allocation", "planning", "coordination", "launch", "retrospective", "milestone", "timeline", "scrum", "agile", "roadmap", "program", "initiative", "implementation plan"], humanEdge: "Team dynamics & priority judgment" },
  { id: "strategy", name: "Strategy & Planning", category: "leadership", aiExposure: 25, keywords: ["strategy", "roadmap", "positioning", "prioritization", "go-to-market", "planning", "vision", "strategic", "market entry", "growth", "expansion", "transformation", "innovation"], humanEdge: "Vision & competitive intuition" },
  { id: "team-mgmt", name: "Team Management", category: "leadership", aiExposure: 12, keywords: ["team", "coaching", "talent", "performance review", "culture", "hiring", "people", "employee", "interview", "mentoring", "leadership", "management", "supervision", "training", "onboard", "staff", "workforce"], humanEdge: "Empathy & cultural leadership" },
  { id: "vendor-mgmt", name: "Vendor & Supply Chain", category: "leadership", aiExposure: 45, keywords: ["vendor", "supplier", "procurement", "supply chain", "inventory", "logistics", "sourcing", "crm", "technology stack", "tool selection", "evaluation"], humanEdge: "Relationship & negotiation leverage" },
  { id: "design-ux", name: "Design & UX", category: "creative", aiExposure: 55, keywords: ["design", "ux", "wireframe", "prototype", "usability", "visual", "accessibility", "interaction", "animation", "token", "ui", "user experience", "creative", "asset", "layout", "figma"], aiEnabler: "AI design tools, auto-layout", humanEdge: "Empathy-driven design thinking" },
  { id: "brand-creative", name: "Brand & Creative", category: "creative", aiExposure: 50, keywords: ["brand", "creative", "identity", "campaign", "concept", "ad copy", "influencer", "community", "storytelling", "generative asset", "visual identity"], humanEdge: "Cultural resonance & originality" },
  { id: "content-seo", name: "Content & SEO", category: "creative", aiExposure: 78, keywords: ["seo", "content", "landing page", "blog", "link building", "social media", "channel", "organic", "content strategy", "editorial", "content generation"], aiEnabler: "AI content generation, SEO automation", humanEdge: "Audience intuition & trend sensing" },
  { id: "regulatory", name: "Regulatory & Legal", category: "compliance", aiExposure: 45, keywords: ["regulatory", "compliance", "legal", "policy", "filing", "patent", "trademark", "contract", "clause", "redline", "m&a", "litigation", "due diligence", "governance", "regulation", "intellectual property", "privacy"], humanEdge: "Jurisdictional judgment & precedent" },
  { id: "audit-control", name: "Audit & Internal Controls", category: "compliance", aiExposure: 70, keywords: ["audit", "reconciliation", "journal", "month-end", "close", "financial statement", "sla", "internal control", "review", "assurance", "attestation"], aiEnabler: "AI reconciliation, anomaly detection", humanEdge: "Materiality judgment & ethics" },
  { id: "sales", name: "Sales & Business Development", category: "communication", aiExposure: 30, keywords: ["sales", "revenue", "prospect", "lead", "pipeline", "quota", "territory", "account", "demo", "pre-sales", "upsell", "cross-sell", "deal cycle", "customer acquisition", "outbound", "inbound"], humanEdge: "Relationship building & deal intuition" },
];

const FALLBACK_TEMPLATES: DbJobTemplate[] = [
  { title: "Software Engineer", company: "Anthropic", dept: "Engineering", tasks: ["Code Review & Refactoring", "Architecture Design", "Testing & QA", "CI/CD Pipeline Management", "Technical Documentation"] },
  { title: "Product Manager", company: "Stripe", dept: "Product", tasks: ["Roadmap Planning", "Stakeholder Alignment", "User Research Synthesis", "Feature Prioritization", "Go-to-Market Strategy"] },
  { title: "Data Scientist", company: "OpenAI", dept: "Data", tasks: ["Model Training & Evaluation", "Feature Engineering", "Statistical Analysis", "Data Pipeline Design", "Experiment Design"] },
  { title: "Financial Analyst", company: "Goldman Sachs", dept: "Finance", tasks: ["Financial Modeling", "Variance Analysis", "Forecasting", "Board Reporting", "Risk Assessment"] },
  { title: "Marketing Manager", company: "HubSpot", dept: "Marketing", tasks: ["Campaign Strategy", "Content Calendar Management", "Performance Analytics", "Brand Positioning", "Channel Optimization"] },
  { title: "UX Designer", company: "Figma", dept: "Design", tasks: ["User Research", "Wireframing & Prototyping", "Usability Testing", "Design System Maintenance", "Interaction Design"] },
  { title: "Compliance Officer", company: "JPMorgan", dept: "Legal", tasks: ["Regulatory Monitoring", "Policy Drafting", "Audit Preparation", "Risk Assessment", "Training Programs"] },
  { title: "Operations Manager", company: "Amazon", dept: "Operations", tasks: ["Process Optimization", "Vendor Management", "Capacity Planning", "Quality Assurance", "Cost Reduction"] },
];

/* ─── Fetch real jobs from DB ─── */
function useDbJobTemplates(): { templates: DbJobTemplate[]; loading: boolean } {
  const [templates, setTemplates] = useState<DbJobTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Fetch task clusters with their parent job+company in one query
        const { data: clusters, error } = await supabase
          .from("job_task_clusters")
          .select("cluster_name, job_id, jobs!inner(id, title, department, company_id, companies(name))")
          .order("job_id")
          .limit(1000);

        if (error || !clusters?.length) {
          if (!cancelled) { setTemplates(FALLBACK_TEMPLATES); setLoading(false); }
          return;
        }

        // Group by job
        const jobMap = new Map<string, DbJobTemplate>();
        for (const c of clusters) {
          const job = (c as any).jobs;
          if (!job) continue;
          const companyName = job.companies?.name || "Unknown";
          const key = `${job.title}|${companyName}`;
          if (!jobMap.has(key)) {
            jobMap.set(key, {
              title: job.title,
              company: companyName,
              dept: job.department || "General",
              tasks: [],
            });
          }
          jobMap.get(key)!.tasks.push(c.cluster_name);
        }

        const result = Array.from(jobMap.values()).slice(0, 150);

        if (!cancelled) {
          setTemplates(result.length > 0 ? result : FALLBACK_TEMPLATES);
          setLoading(false);
        }
      } catch {
        if (!cancelled) { setTemplates(FALLBACK_TEMPLATES); setLoading(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { templates, loading };
}

/* ─── Matching & aggregation ─── */
function matchTaskToSkills(taskName: string): string[] {
  const lower = taskName.toLowerCase();
  return TAXONOMY.filter(s => s.keywords.some(kw => lower.includes(kw))).map(s => s.id);
}

interface AggregatedSkill {
  id: string; name: string; category: SkillCategory;
  proficiency: number; aiExposure: number;
  aiEnabler?: string; humanEdge?: string;
  jobCount: number; taskCount: number; practiced: boolean;
  jobs: { title: string; company: string; taskName: string; score: number }[];
}

function buildTaxonomy(practicedRoles: PracticedRoleData[], templates: DbJobTemplate[]) {
  const skillMap = new Map<string, AggregatedSkill>();
  for (const ts of TAXONOMY) {
    skillMap.set(ts.id, { id: ts.id, name: ts.name, category: ts.category, aiExposure: ts.aiExposure, aiEnabler: ts.aiEnabler, humanEdge: ts.humanEdge, proficiency: 0, jobCount: 0, taskCount: 0, practiced: false, jobs: [] });
  }
  if (practicedRoles.length > 0) {
    for (const pr of practicedRoles) {
      const allIds = [...new Set([...matchTaskToSkills(pr.task_name), ...matchTaskToSkills(pr.job_title)])];
      const pillars = [pr.tool_awareness_score, pr.human_value_add_score, pr.adaptive_thinking_score, pr.domain_judgment_score].filter((s): s is number => s != null);
      const avg = pillars.length > 0 ? Math.round(pillars.reduce((a, b) => a + b, 0) / pillars.length) : 50;
      for (const id of allIds) {
        const skill = skillMap.get(id);
        if (!skill) continue;
        skill.jobs.push({ title: pr.job_title, company: pr.company || "—", taskName: pr.task_name, score: avg });
        skill.taskCount++;
        skill.practiced = true;
      }
    }
    for (const job of templates) {
      for (const t of job.tasks) {
        for (const id of matchTaskToSkills(t)) {
          const skill = skillMap.get(id)!;
          if (!skill.practiced) { skill.jobs.push({ title: job.title, company: job.company, taskName: t, score: 0 }); skill.taskCount++; }
        }
      }
    }
  }
  const result: AggregatedSkill[] = [];
  for (const skill of skillMap.values()) {
    if (skill.taskCount === 0) continue;
    skill.jobCount = new Set(skill.jobs.map(j => j.title)).size;
    // Only average from practiced entries (score > 0) to avoid dilution
    const practicedEntries = skill.jobs.filter(j => j.score > 0);
    skill.proficiency = practicedEntries.length > 0
      ? Math.round(practicedEntries.reduce((s, j) => s + j.score, 0) / practicedEntries.length)
      : 0;
    result.push(skill);
  }
  result.sort((a, b) => b.taskCount - a.taskCount);
  return result;
}

function computeJobMatches(skills: AggregatedSkill[], templates: DbJobTemplate[]): JobMatchDot[] {
  const userSkillMap = new Map(skills.map(s => [s.id, s]));
  return templates.map(job => {
    // Map job tasks → skill IDs, tracking how many tasks map to each skill
    const jobSkillIds = new Set<string>();
    const taskSkillHits = new Map<string, number>(); // track task→skill coverage
    let mappedTasks = 0;
    for (const t of job.tasks) {
      const ids = matchTaskToSkills(t);
      if (ids.length > 0) mappedTasks++;
      for (const id of ids) {
        jobSkillIds.add(id);
        taskSkillHits.set(id, (taskSkillHits.get(id) || 0) + 1);
      }
    }
    const allIds = Array.from(jobSkillIds);
    if (allIds.length === 0) return null; // skip jobs with no skill mapping

    // Task coverage factor: penalize when most tasks don't map to known skills
    const coverageRatio = job.tasks.length > 0 ? mappedTasks / job.tasks.length : 0;
    const coveragePenalty = 0.5 + 0.5 * coverageRatio; // 50-100% multiplier

    const matched: string[] = [], gaps: JobMatchDot["gapSkills"] = [], aiCovered: JobMatchDot["aiCoveredGaps"] = [], newEdges: string[] = [];
    let weightedScore = 0;

    for (const id of allIds) {
      const us = userSkillMap.get(id);
      const tax = TAXONOMY.find(t => t.id === id);
      const weight = taskSkillHits.get(id) || 1; // skills that appear in more tasks weigh more

      if (us && us.practiced && us.proficiency > 0) {
        // Weighted contribution: proficiency/100 instead of binary 1 or 0
        weightedScore += (us.proficiency / 100) * weight;
        if (us.proficiency >= 50) matched.push(us.name);
        else if (tax) {
          gaps.push({ name: tax.name, aiExposure: tax.aiExposure, aiEnabler: tax.aiEnabler, humanEdge: tax.humanEdge });
        }
      } else {
        if (tax) {
          gaps.push({ name: tax.name, aiExposure: tax.aiExposure, aiEnabler: tax.aiEnabler, humanEdge: tax.humanEdge });
          if (tax.aiExposure >= 60 && tax.aiEnabler) {
            aiCovered.push({ name: tax.name, aiEnabler: tax.aiEnabler, humanEdge: tax.humanEdge || "Strategic oversight" });
            if (tax.humanEdge) newEdges.push(tax.humanEdge);
          }
        }
      }
    }

    const totalWeight = allIds.reduce((s, id) => s + (taskSkillHits.get(id) || 1), 0);
    const humanMatch = totalWeight > 0
      ? Math.round((weightedScore / totalWeight) * 100 * coveragePenalty)
      : 0;

    // AI partial credit on gap skills
    const aiPartialCredit = aiCovered.reduce((sum, gap) => {
      const tax = TAXONOMY.find(t => t.name === gap.name);
      const weight = taskSkillHits.get(tax?.id || "") || 1;
      return sum + (tax ? (tax.aiExposure / 100) * weight : 0.6);
    }, 0);

    const aiBoostMatch = totalWeight > 0
      ? Math.max(humanMatch, Math.round(((weightedScore + aiPartialCredit) / totalWeight) * 100 * coveragePenalty))
      : 0;

    return {
      title: job.title, company: job.company, dept: job.dept,
      humanMatch, aiBoostMatch,
      unlocked: humanMatch < 60 && aiBoostMatch >= 60,
      matchedSkills: matched, gapSkills: gaps, aiCoveredGaps: aiCovered,
      newEdges: [...new Set(newEdges)],
    };
  }).filter((j): j is JobMatchDot => j !== null && (j.humanMatch > 0 || j.aiBoostMatch > 0))
    .sort((a, b) => b.aiBoostMatch - a.aiBoostMatch);
}

/* ══════════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════════ */

interface JourneyDashboardProps {
  practicedRoles: PracticedRoleData[];
  savedRoles: SavedRoleData[];
  loading: boolean;
}

export default function JourneyDashboard({ practicedRoles, savedRoles, loading }: JourneyDashboardProps) {
  const navigate = useNavigate();
  const { templates, loading: templatesLoading } = useDbJobTemplates();

  const skills = useMemo(() => buildTaxonomy(practicedRoles, templates), [practicedRoles, templates]);
  const jobMatches = useMemo(() => computeJobMatches(skills, templates), [skills, templates]);

  const uniqueRoles = useMemo(() => new Set(practicedRoles.map(r => r.job_title)).size, [practicedRoles]);
  const uniqueTasks = useMemo(() => new Set(practicedRoles.map(r => r.task_name)).size, [practicedRoles]);

  if (loading || templatesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isEmpty = practicedRoles.length === 0 && savedRoles.length === 0;

  return (
    <div>
      <div className="mb-1">
        <h2 className="text-xl font-bold text-foreground">My Journey</h2>
        <p className="text-sm text-muted-foreground">See which roles you're ready for — and which AI can unlock.</p>
      </div>

      {/* ── Stats Ribbon ── */}
      <div className="grid grid-cols-4 gap-2 mt-4 mb-5">
        {[
          { label: "Simulations", value: practicedRoles.length, icon: Play },
          { label: "Unique Tasks", value: uniqueTasks, icon: Target },
          { label: "Roles Explored", value: uniqueRoles, icon: Briefcase },
          { label: "Roles Saved", value: savedRoles.length, icon: Bookmark },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border/40 bg-card p-2.5 text-center">
            <stat.icon className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Empty State ── */}
      {isEmpty && (
        <div className="text-center py-16">
          <BookOpen className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1 mb-4">Explore roles, practice tasks, and bookmark positions to build your career map</p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Explore Roles <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Minimum-data gate ── */}
      {!isEmpty && (() => {
        const MIN_SIMS = 5;
        const MIN_TASKS = 3;
        const simsOk = practicedRoles.length >= MIN_SIMS;
        const tasksOk = uniqueTasks >= MIN_TASKS;
        const ready = simsOk && tasksOk;

        if (!ready) {
          const simsLeft = Math.max(0, MIN_SIMS - practicedRoles.length);
          const tasksLeft = Math.max(0, MIN_TASKS - uniqueTasks);
          const totalNeeded = MIN_SIMS + MIN_TASKS;
          const totalDone = Math.min(practicedRoles.length, MIN_SIMS) + Math.min(uniqueTasks, MIN_TASKS);
          const pct = Math.round((totalDone / totalNeeded) * 100);

          return (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/40 bg-card p-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Target className="h-5 w-5" />
                <span className="font-semibold text-sm">Unlock Your Career Map</span>
              </div>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Complete a few more simulations to generate statistically reliable career matches.
              </p>

              {/* Progress bar */}
              <div className="max-w-xs mx-auto">
                <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">{pct}% ready</p>
              </div>

              {/* Remaining checklist */}
              <div className="flex justify-center gap-4 text-xs">
                <div className={`flex items-center gap-1.5 ${simsOk ? "text-brand-human" : "text-muted-foreground"}`}>
                  <Play className="h-3 w-3" />
                  {simsOk ? "✓ 5+ simulations" : `${simsLeft} more simulation${simsLeft !== 1 ? "s" : ""}`}
                </div>
                <div className={`flex items-center gap-1.5 ${tasksOk ? "text-brand-human" : "text-muted-foreground"}`}>
                  <Target className="h-3 w-3" />
                  {tasksOk ? "✓ 3+ tasks" : `${tasksLeft} more task${tasksLeft !== 1 ? "s" : ""}`}
                </div>
              </div>

              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                Practice Now <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        }

        return (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <CareerReachMap jobMatches={jobMatches} isEmpty={isEmpty} />
          </motion.div>
        );
      })()}
    </div>
  );
}
