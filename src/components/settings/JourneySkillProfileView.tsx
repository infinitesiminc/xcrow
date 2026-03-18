/**
 * Unified Skill Taxonomy View
 *
 * Reframed around two core user questions:
 *   1. What are my strengths and weaknesses?
 *   2. How does AI mastery let me do jobs I couldn't before?
 */
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChevronDown, ChevronRight, Layers, Zap, Brain, Users, Shield,
  BarChart3, Search, Sparkles, Target, ArrowRight, TrendingUp,
  Lock, Unlock, Bot,
} from "lucide-react";

/* ── Seeded RNG ── */
function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

/* ── Unified Skill Taxonomy ── */
interface TaxonomySkill {
  id: string;
  name: string;
  category: SkillCategory;
  keywords: string[];
  /** 0-100: how much AI can augment this skill (higher = more AI-automatable) */
  aiExposure: number;
}

type SkillCategory =
  | "technical"
  | "analytical"
  | "communication"
  | "leadership"
  | "creative"
  | "compliance";

const CATEGORY_META: Record<SkillCategory, { label: string; icon: typeof Layers; color: string }> = {
  technical: { label: "Technical", icon: Zap, color: "hsl(var(--chart-1))" },
  analytical: { label: "Analytical", icon: BarChart3, color: "hsl(var(--chart-2))" },
  communication: { label: "Communication", icon: Users, color: "hsl(var(--chart-3))" },
  leadership: { label: "Leadership", icon: Target, color: "hsl(var(--chart-4))" },
  creative: { label: "Creative", icon: Brain, color: "hsl(var(--chart-5))" },
  compliance: { label: "Compliance & Risk", icon: Shield, color: "hsl(var(--primary))" },
};

const TAXONOMY: TaxonomySkill[] = [
  // Technical
  { id: "code-dev", name: "Software Development", category: "technical", aiExposure: 72, keywords: ["code", "development", "engineering", "component", "pipeline", "etl", "ci/cd", "deploy", "refactor", "responsive", "schema", "integration"] },
  { id: "system-design", name: "System Architecture", category: "technical", aiExposure: 35, keywords: ["architecture", "system design", "platform", "infrastructure", "migration", "mesh", "autoscaling", "reliability"] },
  { id: "testing-qa", name: "Testing & QA", category: "technical", aiExposure: 78, keywords: ["test", "qa", "regression", "performance testing", "bug", "quality"] },
  { id: "security", name: "Security & Compliance Tech", category: "technical", aiExposure: 55, keywords: ["security", "threat", "vulnerability", "penetration", "zero trust", "hardening", "cybersecurity"] },
  { id: "data-engineering", name: "Data Engineering", category: "technical", aiExposure: 68, keywords: ["data pipeline", "warehouse", "etl", "query optimization", "data quality", "schema design", "data model"] },
  { id: "ai-ml", name: "AI & Machine Learning", category: "technical", aiExposure: 60, keywords: ["model", "training", "ml", "ai", "machine learning", "feature engineering", "a/b test"] },
  { id: "devops", name: "DevOps & Infrastructure", category: "technical", aiExposure: 65, keywords: ["devops", "container", "monitoring", "alerting", "incident", "infrastructure as code"] },
  // Analytical
  { id: "data-analysis", name: "Data Analysis", category: "analytical", aiExposure: 80, keywords: ["analysis", "analytics", "data", "statistical", "metrics", "dashboard", "tracking", "reporting", "rank"] },
  { id: "financial-modeling", name: "Financial Modeling", category: "analytical", aiExposure: 70, keywords: ["financial model", "valuation", "forecast", "budget", "revenue", "variance", "cost"] },
  { id: "research", name: "Research & Discovery", category: "analytical", aiExposure: 75, keywords: ["research", "audit", "review", "literature", "hypothesis", "prior art", "market research", "keyword"] },
  { id: "process-optimization", name: "Process Optimization", category: "analytical", aiExposure: 60, keywords: ["process", "optimization", "workflow", "automation", "efficiency", "funnel", "pipeline management"] },
  { id: "risk-assessment", name: "Risk Assessment", category: "analytical", aiExposure: 50, keywords: ["risk", "mitigation", "scenario analysis", "loss prevention", "threat model"] },
  // Communication
  { id: "stakeholder-mgmt", name: "Stakeholder Management", category: "communication", aiExposure: 15, keywords: ["stakeholder", "client", "customer", "relationship", "qbr", "onboarding", "correspondence"] },
  { id: "writing-docs", name: "Writing & Documentation", category: "communication", aiExposure: 82, keywords: ["documentation", "writing", "paper", "copy", "editorial", "content", "email", "style guide", "knowledge base"] },
  { id: "presentation", name: "Presentation & Reporting", category: "communication", aiExposure: 65, keywords: ["presentation", "reporting", "board", "pitch", "status report", "materials"] },
  { id: "negotiation", name: "Negotiation & Persuasion", category: "communication", aiExposure: 10, keywords: ["negotiation", "deal", "offer", "closing", "persuasion", "licensing"] },
  // Leadership
  { id: "project-mgmt", name: "Project Management", category: "leadership", aiExposure: 40, keywords: ["project", "sprint", "resource allocation", "planning", "coordination", "launch", "retrospective"] },
  { id: "strategy", name: "Strategy & Planning", category: "leadership", aiExposure: 25, keywords: ["strategy", "roadmap", "positioning", "prioritization", "go-to-market", "planning", "vision"] },
  { id: "team-mgmt", name: "Team Management", category: "leadership", aiExposure: 12, keywords: ["team", "coaching", "talent", "performance review", "culture", "hiring", "people", "employee", "interview"] },
  { id: "vendor-mgmt", name: "Vendor & Supply Chain", category: "leadership", aiExposure: 45, keywords: ["vendor", "supplier", "procurement", "supply chain", "inventory", "logistics", "sourcing"] },
  // Creative
  { id: "design-ux", name: "Design & UX", category: "creative", aiExposure: 55, keywords: ["design", "ux", "wireframe", "prototype", "usability", "visual", "accessibility", "interaction", "animation", "token"] },
  { id: "brand-creative", name: "Brand & Creative", category: "creative", aiExposure: 50, keywords: ["brand", "creative", "identity", "campaign", "concept", "ad copy", "influencer", "community"] },
  { id: "content-seo", name: "Content & SEO", category: "creative", aiExposure: 78, keywords: ["seo", "content", "landing page", "blog", "link building", "social media", "channel"] },
  // Compliance
  { id: "regulatory", name: "Regulatory & Legal", category: "compliance", aiExposure: 45, keywords: ["regulatory", "compliance", "legal", "policy", "filing", "patent", "trademark", "contract", "clause", "redline", "m&a", "litigation", "due diligence"] },
  { id: "audit-control", name: "Audit & Internal Controls", category: "compliance", aiExposure: 70, keywords: ["audit", "reconciliation", "journal", "month-end", "close", "financial statement", "sla"] },
];

/* ── Job templates (50 jobs) ── */
const JOB_TEMPLATES: { title: string; company: string; dept: string; tasks: string[] }[] = [
  { title: "Software Engineer", company: "Anthropic", dept: "Engineering", tasks: ["Code Review & Refactoring", "Architecture Design", "Testing & QA", "CI/CD Pipeline Management", "Technical Documentation"] },
  { title: "Product Manager", company: "Stripe", dept: "Product", tasks: ["Roadmap Planning", "Stakeholder Alignment", "User Research Synthesis", "Feature Prioritization", "Go-to-Market Strategy"] },
  { title: "Data Scientist", company: "OpenAI", dept: "Data", tasks: ["Model Training & Evaluation", "Feature Engineering", "Statistical Analysis", "Data Pipeline Design", "Experiment Design"] },
  { title: "UX Designer", company: "Figma", dept: "Design", tasks: ["User Research", "Wireframing & Prototyping", "Usability Testing", "Design System Maintenance", "Interaction Design"] },
  { title: "Marketing Manager", company: "HubSpot", dept: "Marketing", tasks: ["Campaign Strategy", "Content Calendar Management", "Performance Analytics", "Brand Positioning", "Channel Optimization"] },
  { title: "Financial Analyst", company: "Goldman Sachs", dept: "Finance", tasks: ["Financial Modeling", "Variance Analysis", "Forecasting", "Board Reporting", "Risk Assessment"] },
  { title: "DevOps Engineer", company: "HashiCorp", dept: "Engineering", tasks: ["Infrastructure as Code", "Monitoring & Alerting", "Incident Response", "Container Orchestration", "Security Hardening"] },
  { title: "HR Manager", company: "Workday", dept: "People", tasks: ["Talent Acquisition", "Performance Reviews", "Culture Programs", "Compensation Planning", "Employee Relations"] },
  { title: "Sales Engineer", company: "Salesforce", dept: "Sales", tasks: ["Technical Demos", "Solution Architecture", "Proof of Concept", "RFP Responses", "Customer Onboarding"] },
  { title: "Compliance Officer", company: "JPMorgan", dept: "Legal", tasks: ["Regulatory Monitoring", "Policy Drafting", "Audit Preparation", "Risk Assessment", "Training Programs"] },
  { title: "Operations Manager", company: "Amazon", dept: "Operations", tasks: ["Process Optimization", "Vendor Management", "Capacity Planning", "Quality Assurance", "Cost Reduction"] },
  { title: "Content Strategist", company: "Notion", dept: "Marketing", tasks: ["Editorial Planning", "SEO Strategy", "Content Audit", "Audience Research", "Style Guide Management"] },
  { title: "Cybersecurity Analyst", company: "CrowdStrike", dept: "Security", tasks: ["Threat Detection", "Vulnerability Assessment", "Incident Response", "Security Monitoring", "Penetration Testing"] },
  { title: "Account Executive", company: "Gong", dept: "Sales", tasks: ["Pipeline Management", "Discovery Calls", "Negotiation", "Account Planning", "Deal Closing"] },
  { title: "Machine Learning Engineer", company: "DeepMind", dept: "Engineering", tasks: ["Model Deployment", "Training Pipeline", "Feature Store Management", "A/B Testing", "Model Monitoring"] },
  { title: "Business Analyst", company: "McKinsey", dept: "Strategy", tasks: ["Requirements Gathering", "Process Mapping", "Data Analysis", "Stakeholder Interviews", "Solution Design"] },
  { title: "Customer Success Manager", company: "Gainsight", dept: "Customer Success", tasks: ["Onboarding Programs", "Health Scoring", "Expansion Planning", "Churn Prevention", "QBR Preparation"] },
  { title: "Supply Chain Manager", company: "Flexport", dept: "Operations", tasks: ["Demand Forecasting", "Inventory Optimization", "Logistics Coordination", "Supplier Evaluation", "Cost Analysis"] },
  { title: "Brand Strategist", company: "Nike", dept: "Marketing", tasks: ["Brand Audit", "Positioning Strategy", "Visual Identity", "Campaign Concept", "Market Research"] },
  { title: "Corporate Lawyer", company: "Latham & Watkins", dept: "Legal", tasks: ["Contract Drafting", "Due Diligence", "Regulatory Compliance", "M&A Advisory", "Litigation Support"] },
  { title: "Project Manager", company: "Asana", dept: "Operations", tasks: ["Sprint Planning", "Resource Allocation", "Risk Management", "Status Reporting", "Retrospectives"] },
  { title: "Investment Analyst", company: "Blackstone", dept: "Finance", tasks: ["Deal Sourcing", "Financial Modeling", "Due Diligence", "Portfolio Monitoring", "Market Research"] },
  { title: "QA Engineer", company: "Datadog", dept: "Engineering", tasks: ["Test Automation", "Regression Testing", "Performance Testing", "Bug Triage", "Test Strategy"] },
  { title: "Recruiter", company: "LinkedIn", dept: "People", tasks: ["Sourcing Candidates", "Interview Coordination", "Offer Negotiation", "Employer Branding", "Pipeline Analytics"] },
  { title: "SEO Specialist", company: "Semrush", dept: "Marketing", tasks: ["Keyword Research", "Technical SEO Audit", "Link Building Strategy", "Content Optimization", "Rank Tracking"] },
  { title: "Risk Manager", company: "Zurich Insurance", dept: "Risk", tasks: ["Risk Identification", "Mitigation Planning", "Regulatory Reporting", "Scenario Analysis", "Loss Prevention"] },
  { title: "Solutions Architect", company: "AWS", dept: "Engineering", tasks: ["System Design", "Migration Planning", "Cost Optimization", "Technical Workshops", "Reference Architecture"] },
  { title: "Tax Advisor", company: "EY", dept: "Finance", tasks: ["Tax Planning", "Compliance Filing", "Transfer Pricing", "Tax Provision", "Client Advisory"] },
  { title: "Social Media Manager", company: "Buffer", dept: "Marketing", tasks: ["Content Creation", "Community Management", "Analytics Reporting", "Influencer Outreach", "Crisis Communication"] },
  { title: "Paralegal", company: "Baker McKenzie", dept: "Legal", tasks: ["Document Review", "Legal Research", "Filing Management", "Case Preparation", "Client Correspondence"] },
  { title: "Data Engineer", company: "Snowflake", dept: "Data", tasks: ["ETL Pipeline Design", "Data Warehouse Modeling", "Query Optimization", "Schema Design", "Data Quality Monitoring"] },
  { title: "Product Designer", company: "Canva", dept: "Design", tasks: ["Visual Design", "Design System Components", "User Flow Mapping", "Accessibility Audit", "Design Review"] },
  { title: "Accountant", company: "Deloitte", dept: "Finance", tasks: ["Month-End Close", "Reconciliation", "Journal Entries", "Financial Statements", "Audit Support"] },
  { title: "Growth Manager", company: "Amplitude", dept: "Marketing", tasks: ["Experiment Design", "Funnel Optimization", "Retention Analysis", "Referral Programs", "Pricing Strategy"] },
  { title: "Legal Ops Manager", company: "Ironclad", dept: "Legal", tasks: ["Contract Lifecycle Management", "Legal Tech Stack", "Process Automation", "Budget Management", "Vendor Assessment"] },
  { title: "Platform Engineer", company: "Vercel", dept: "Engineering", tasks: ["Platform Architecture", "Developer Experience", "Service Mesh Config", "Autoscaling Policies", "Reliability Engineering"] },
  { title: "FP&A Manager", company: "Stripe", dept: "Finance", tasks: ["Budget Modeling", "Rolling Forecasts", "Revenue Analysis", "Headcount Planning", "Board Materials"] },
  { title: "Research Scientist", company: "Google DeepMind", dept: "Research", tasks: ["Literature Review", "Hypothesis Formation", "Experiment Execution", "Paper Writing", "Peer Review"] },
  { title: "Procurement Manager", company: "Coupa", dept: "Operations", tasks: ["Supplier Negotiation", "Contract Management", "Spend Analysis", "RFP Management", "Compliance Monitoring"] },
  { title: "People Operations", company: "Rippling", dept: "People", tasks: ["HRIS Management", "Benefits Administration", "Onboarding Workflows", "Policy Documentation", "Compliance Tracking"] },
  { title: "Analytics Engineer", company: "dbt Labs", dept: "Data", tasks: ["Data Modeling", "Metrics Layer Design", "Dashboard Development", "Data Testing", "Documentation"] },
  { title: "IP Specialist", company: "WIPO", dept: "Legal", tasks: ["Patent Filing", "Trademark Search", "IP Portfolio Review", "Licensing Negotiation", "Prior Art Analysis"] },
  { title: "Support Engineer", company: "Zendesk", dept: "Customer Success", tasks: ["Ticket Triage", "Root Cause Analysis", "Knowledge Base Updates", "Escalation Management", "Customer Communication"] },
  { title: "UI Engineer", company: "Linear", dept: "Engineering", tasks: ["Component Development", "Responsive Layouts", "Animation Design", "Performance Tuning", "Design Token Integration"] },
  { title: "Copywriter", company: "Jasper", dept: "Marketing", tasks: ["Ad Copy", "Landing Page Copy", "Email Sequences", "Brand Voice Guidelines", "A/B Test Variants"] },
  { title: "Investment Banker", company: "Morgan Stanley", dept: "Finance", tasks: ["Pitch Book Creation", "Valuation Analysis", "Transaction Execution", "Client Relationship", "Market Analysis"] },
  { title: "Security Engineer", company: "Palo Alto Networks", dept: "Security", tasks: ["Security Architecture", "Threat Modeling", "Compliance Automation", "Zero Trust Implementation", "Security Testing"] },
  { title: "Customer Support Lead", company: "Intercom", dept: "Customer Success", tasks: ["Team Coaching", "SLA Management", "Workflow Automation", "Quality Scoring", "Feedback Loops"] },
  { title: "Contract Attorney", company: "Wilson Sonsini", dept: "Legal", tasks: ["Contract Review", "Redlining", "Clause Library Maintenance", "Risk Flagging", "Negotiation Support"] },
  { title: "Product Operations Manager", company: "Airtable", dept: "Product", tasks: ["Launch Coordination", "Feature Adoption Tracking", "Cross-functional Sync", "Data Analysis", "Process Design"] },
];

/* ── Match tasks to taxonomy skills ── */
function matchTaskToSkills(taskName: string): string[] {
  const lower = taskName.toLowerCase();
  const matched: string[] = [];
  for (const skill of TAXONOMY) {
    if (skill.keywords.some(kw => lower.includes(kw))) {
      matched.push(skill.id);
    }
  }
  return matched;
}

/* ── Aggregated skill data ── */
interface AggregatedSkill {
  id: string;
  name: string;
  category: SkillCategory;
  proficiency: number;
  aiExposure: number;
  jobCount: number;
  taskCount: number;
  jobs: { title: string; company: string; taskName: string; score: number }[];
}

interface JobMatch {
  title: string;
  company: string;
  dept: string;
  humanMatch: number;     // % match from human skills only
  aiBoostMatch: number;   // % match when AI covers gaps in high-exposure skills
  unlocked: boolean;      // true if humanMatch < 60 but aiBoostMatch >= 60
  matchedSkills: string[];
  gapSkills: { name: string; aiExposure: number }[];
  aiCoveredGaps: string[];
}

function buildTaxonomy(rand: () => number) {
  const skillMap = new Map<string, AggregatedSkill>();

  for (const ts of TAXONOMY) {
    skillMap.set(ts.id, {
      id: ts.id, name: ts.name, category: ts.category,
      aiExposure: ts.aiExposure,
      proficiency: 0, jobCount: 0, taskCount: 0, jobs: [],
    });
  }

  for (const job of JOB_TEMPLATES) {
    for (const taskName of job.tasks) {
      const matchedIds = matchTaskToSkills(taskName);
      for (const skillId of matchedIds) {
        const skill = skillMap.get(skillId)!;
        const score = Math.round(45 + rand() * 50);
        skill.jobs.push({ title: job.title, company: job.company, taskName, score });
        skill.taskCount++;
      }
    }
  }

  const result: AggregatedSkill[] = [];
  for (const skill of skillMap.values()) {
    if (skill.taskCount === 0) continue;
    const uniqueJobs = new Set(skill.jobs.map(j => j.title));
    skill.jobCount = uniqueJobs.size;
    skill.proficiency = Math.round(
      skill.jobs.reduce((s, j) => s + j.score, 0) / skill.jobs.length
    );
    result.push(skill);
  }

  result.sort((a, b) => b.taskCount - a.taskCount);
  return result;
}

function computeJobMatches(skills: AggregatedSkill[]): JobMatch[] {
  const userSkillMap = new Map(skills.map(s => [s.id, s]));

  return JOB_TEMPLATES.map(job => {
    const jobSkillIds = new Set<string>();
    for (const taskName of job.tasks) {
      for (const id of matchTaskToSkills(taskName)) jobSkillIds.add(id);
    }

    const allIds = Array.from(jobSkillIds);
    const matched: string[] = [];
    const gaps: { name: string; aiExposure: number }[] = [];
    const aiCovered: string[] = [];

    for (const id of allIds) {
      const us = userSkillMap.get(id);
      if (us && us.proficiency >= 50) {
        matched.push(us.name);
      } else {
        const tax = TAXONOMY.find(t => t.id === id);
        if (tax) {
          gaps.push({ name: tax.name, aiExposure: tax.aiExposure });
          // AI can cover this gap if exposure >= 60
          if (tax.aiExposure >= 60) aiCovered.push(tax.name);
        }
      }
    }

    const humanMatch = allIds.length > 0 ? Math.round((matched.length / allIds.length) * 100) : 0;
    const aiBoostMatch = allIds.length > 0
      ? Math.round(((matched.length + aiCovered.length) / allIds.length) * 100)
      : 0;
    const unlocked = humanMatch < 60 && aiBoostMatch >= 60;

    return {
      title: job.title, company: job.company, dept: job.dept,
      humanMatch, aiBoostMatch, unlocked,
      matchedSkills: matched,
      gapSkills: gaps,
      aiCoveredGaps: aiCovered,
    };
  }).sort((a, b) => {
    // Show unlocked jobs first, then by aiBoostMatch
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    return b.aiBoostMatch - a.aiBoostMatch;
  });
}

/* ── Helpers ── */
function profColor(score: number): string {
  if (score >= 75) return "text-brand-human";
  if (score >= 55) return "text-brand-mid";
  return "text-brand-ai";
}
function profBg(score: number): string {
  if (score >= 75) return "bg-brand-human/15";
  if (score >= 55) return "bg-brand-mid/15";
  return "bg-brand-ai/15";
}
function aiTag(exposure: number): { label: string; className: string } {
  if (exposure >= 70) return { label: "AI Handles", className: "border-brand-ai/40 text-brand-ai" };
  if (exposure >= 45) return { label: "AI Assists", className: "border-brand-mid/40 text-brand-mid" };
  return { label: "Human Core", className: "border-brand-human/40 text-brand-human" };
}

type ViewMode = "strengths" | "ai-unlocks";

export default function JourneySkillProfileView({ onNavigate }: { onNavigate: (title: string, company: string | null) => void }) {
  const rand = useMemo(() => seeded(2026), []);
  const skills = useMemo(() => buildTaxonomy(rand), [rand]);
  const jobMatches = useMemo(() => computeJobMatches(skills), [skills]);

  const [view, setView] = useState<ViewMode>("strengths");
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");

  // Split into strengths / developing / gaps
  const { strengths, developing, gaps } = useMemo(() => {
    const s: AggregatedSkill[] = [], d: AggregatedSkill[] = [], g: AggregatedSkill[] = [];
    for (const skill of skills) {
      if (skill.proficiency >= 75) s.push(skill);
      else if (skill.proficiency >= 55) d.push(skill);
      else g.push(skill);
    }
    s.sort((a, b) => b.proficiency - a.proficiency);
    g.sort((a, b) => a.proficiency - b.proficiency);
    return { strengths: s, developing: d, gaps: g };
  }, [skills]);

  // AI unlock stats
  const unlockedJobs = useMemo(() => jobMatches.filter(j => j.unlocked), [jobMatches]);
  const aiReachableJobs = useMemo(() => jobMatches.filter(j => j.aiBoostMatch >= 60), [jobMatches]);

  const filteredMatches = useMemo(() => {
    let list = jobMatches;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(j => j.title.toLowerCase().includes(q) || j.dept.toLowerCase().includes(q));
    }
    return list.slice(0, 25);
  }, [jobMatches, searchQ]);

  const filteredSkills = useMemo(() => {
    if (!searchQ) return null; // show grouped view
    const q = searchQ.toLowerCase();
    return skills.filter(s => s.name.toLowerCase().includes(q) || s.category.includes(q));
  }, [skills, searchQ]);

  return (
    <div className="space-y-5">
      {/* Two-question toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setView("strengths"); setSearchQ(""); }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${view === "strengths" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"}`}
        >
          <Target className="inline h-3 w-3 mr-1" />Strengths & Gaps
        </button>
        <button
          onClick={() => { setView("ai-unlocks"); setSearchQ(""); }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${view === "ai-unlocks" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"}`}
        >
          <Sparkles className="inline h-3 w-3 mr-1" />AI Unlocks
        </button>
      </div>

      <AnimatePresence mode="wait">
        {view === "strengths" ? (
          <motion.div key="strengths" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-brand-human/10 border border-brand-human/20 p-3 text-center">
                <p className="text-lg font-bold text-brand-human">{strengths.length}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Strengths</p>
              </div>
              <div className="rounded-lg bg-brand-mid/10 border border-brand-mid/20 p-3 text-center">
                <p className="text-lg font-bold text-brand-mid">{developing.length}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Developing</p>
              </div>
              <div className="rounded-lg bg-brand-ai/10 border border-brand-ai/20 p-3 text-center">
                <p className="text-lg font-bold text-brand-ai">{gaps.length}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Gaps</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search skills..."
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted/30 border border-border/40 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>

            {filteredSkills ? (
              <SkillList skills={filteredSkills} expandedSkill={expandedSkill} setExpandedSkill={setExpandedSkill} onNavigate={onNavigate} />
            ) : (
              <>
                {/* Strengths */}
                {strengths.length > 0 && (
                  <SkillSection
                    title="Your Strengths"
                    subtitle="Skills where you consistently perform well across multiple roles"
                    icon={<TrendingUp className="h-3.5 w-3.5 text-brand-human" />}
                    skills={strengths}
                    expandedSkill={expandedSkill}
                    setExpandedSkill={setExpandedSkill}
                    onNavigate={onNavigate}
                  />
                )}

                {/* Developing */}
                {developing.length > 0 && (
                  <SkillSection
                    title="Developing"
                    subtitle="Solid foundation — a few more practice rounds to master"
                    icon={<Layers className="h-3.5 w-3.5 text-brand-mid" />}
                    skills={developing}
                    expandedSkill={expandedSkill}
                    setExpandedSkill={setExpandedSkill}
                    onNavigate={onNavigate}
                  />
                )}

                {/* Gaps */}
                {gaps.length > 0 && (
                  <SkillSection
                    title="Skill Gaps"
                    subtitle="Areas to focus on — or let AI cover for you"
                    icon={<Target className="h-3.5 w-3.5 text-brand-ai" />}
                    skills={gaps}
                    expandedSkill={expandedSkill}
                    setExpandedSkill={setExpandedSkill}
                    onNavigate={onNavigate}
                  />
                )}
              </>
            )}
          </motion.div>
        ) : (
          <motion.div key="ai-unlocks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            {/* AI unlock summary */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">AI Expands Your Reach</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                With your current skills you qualify for <strong className="text-foreground">{jobMatches.filter(j => j.humanMatch >= 60).length}</strong> of {JOB_TEMPLATES.length} roles.
                AI mastery unlocks <strong className="text-primary">{unlockedJobs.length} additional roles</strong> you couldn't reach before — covering skill gaps in areas like data analysis, writing, and testing.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-muted/30 border border-border/40 p-2.5 text-center">
                  <p className="text-sm font-bold text-muted-foreground">{jobMatches.filter(j => j.humanMatch >= 60).length}</p>
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Human Only</p>
                </div>
                <div className="rounded-lg bg-primary/10 border border-primary/30 p-2.5 text-center">
                  <p className="text-sm font-bold text-primary">+{unlockedJobs.length}</p>
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wider">AI Unlocked</p>
                </div>
                <div className="rounded-lg bg-brand-human/10 border border-brand-human/30 p-2.5 text-center">
                  <p className="text-sm font-bold text-brand-human">{aiReachableJobs.length}</p>
                  <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Total Reach</p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search jobs..."
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted/30 border border-border/40 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* Job list */}
            <div className="space-y-1.5">
              {filteredMatches.map((job, i) => {
                const boost = job.aiBoostMatch - job.humanMatch;
                return (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => onNavigate(job.title, job.company)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card hover:bg-muted/20 transition-colors text-left"
                  >
                    {/* Match circle */}
                    <div className="relative shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${profBg(job.aiBoostMatch)} ${profColor(job.aiBoostMatch)}`}>
                        {job.aiBoostMatch}%
                      </div>
                      {job.unlocked && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <Unlock className="h-2.5 w-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium text-foreground truncate">{job.title}</p>
                        {job.unlocked && (
                          <Badge variant="outline" className="text-[8px] px-1 py-0 border-primary/40 text-primary shrink-0">
                            AI Unlocked
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{job.company} · {job.dept}</p>

                      {/* Boost bar */}
                      {boost > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                            <div className="h-full rounded-full relative" style={{ width: `${job.aiBoostMatch}%` }}>
                              <div className="absolute inset-0 rounded-full bg-muted-foreground/30" style={{ width: `${(job.humanMatch / job.aiBoostMatch) * 100}%` }} />
                              <div className="absolute inset-0 rounded-full bg-primary/50" style={{ left: `${(job.humanMatch / job.aiBoostMatch) * 100}%` }} />
                            </div>
                          </div>
                          <span className="text-[9px] text-primary font-medium whitespace-nowrap">+{boost}% AI</span>
                        </div>
                      )}

                      {/* Gap skills AI covers */}
                      {job.aiCoveredGaps.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {job.aiCoveredGaps.slice(0, 2).map(g => (
                            <Badge key={g} variant="outline" className="text-[8px] px-1 py-0 border-primary/30 text-primary/80">
                              <Bot className="h-2 w-2 mr-0.5" />{g}
                            </Badge>
                          ))}
                          {job.gapSkills.filter(g => g.aiExposure < 60).length > 0 && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 border-brand-ai/30 text-brand-ai">
                              <Lock className="h-2 w-2 mr-0.5" />{job.gapSkills.filter(g => g.aiExposure < 60).length} human gaps
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Shared sub-components ── */

function SkillSection({
  title, subtitle, icon, skills, expandedSkill, setExpandedSkill, onNavigate,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  skills: AggregatedSkill[];
  expandedSkill: string | null;
  setExpandedSkill: (id: string | null) => void;
  onNavigate: (title: string, company: string | null) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <h3 className="text-xs font-semibold text-foreground">{title}</h3>
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <SkillList skills={skills} expandedSkill={expandedSkill} setExpandedSkill={setExpandedSkill} onNavigate={onNavigate} />
    </div>
  );
}

function SkillList({
  skills, expandedSkill, setExpandedSkill, onNavigate,
}: {
  skills: AggregatedSkill[];
  expandedSkill: string | null;
  setExpandedSkill: (id: string | null) => void;
  onNavigate: (title: string, company: string | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      {skills.map(skill => {
        const isOpen = expandedSkill === skill.id;
        const meta = CATEGORY_META[skill.category];
        const ai = aiTag(skill.aiExposure);
        return (
          <motion.div key={skill.id} layout className="rounded-lg border border-border/40 bg-card overflow-hidden">
            <button
              onClick={() => setExpandedSkill(isOpen ? null : skill.id)}
              className="w-full flex items-center gap-2.5 p-3 text-left hover:bg-muted/20 transition-colors"
            >
              {isOpen ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground truncate">{skill.name}</span>
                  <Badge variant="outline" className={`text-[8px] px-1.5 py-0 shrink-0 ${ai.className}`}>
                    {ai.label}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {skill.jobCount} jobs · {skill.taskCount} tasks
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-16 hidden sm:block">
                  <Progress value={skill.proficiency} className="h-1.5" />
                </div>
                <span className={`text-xs font-bold w-10 text-right ${profColor(skill.proficiency)}`}>
                  {skill.proficiency}%
                </span>
              </div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border/30"
                >
                  <div className="p-3 space-y-2">
                    {/* AI exposure bar */}
                    <div className="flex items-center gap-2 text-[10px]">
                      <Bot className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">AI Exposure</span>
                      <Progress value={skill.aiExposure} className="h-1 flex-1" />
                      <span className="text-muted-foreground font-medium">{skill.aiExposure}%</span>
                    </div>

                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Job Evidence</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {skill.jobs.slice(0, 15).map((j, i) => (
                        <button
                          key={i}
                          onClick={() => onNavigate(j.title, j.company)}
                          className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-muted/30 transition-colors text-left"
                        >
                          <span className="text-[10px] text-foreground/80 flex-1 truncate">{j.title}</span>
                          <span className="text-[9px] text-muted-foreground truncate max-w-[80px]">{j.taskName}</span>
                          <span className={`text-[10px] font-semibold ${profColor(j.score)}`}>{j.score}%</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
