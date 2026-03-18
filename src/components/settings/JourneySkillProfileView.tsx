/**
 * Unified Skill Taxonomy View
 *
 * Reframed around two core user questions:
 *   1. What are my strengths and weaknesses?
 *   2. How does AI mastery let me do jobs I couldn't before?
 *
 * The "AI Unlocks" tab visualizes barrier dissolution:
 *   - Concentric reach map (human reach → AI-extended reach)
 *   - Pivot stories showing which barriers AI dissolves
 *   - "New edge" indicators for skill evolution
 */
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChevronDown, ChevronRight, Layers, Zap, Brain, Users, Shield,
  BarChart3, Search, Sparkles, Target, ArrowRight, TrendingUp,
  Lock, Unlock, Bot, ArrowUpRight, Compass, Play, CheckCircle2,
  Route, Star, Trophy, Clock,
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
  aiExposure: number;
  /** What AI tools dissolve this barrier */
  aiEnabler?: string;
  /** What human edge replaces this skill when AI handles it */
  humanEdge?: string;
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
  { id: "code-dev", name: "Software Development", category: "technical", aiExposure: 72, keywords: ["code", "development", "engineering", "component", "pipeline", "etl", "ci/cd", "deploy", "refactor", "responsive", "schema", "integration"], aiEnabler: "No-code platforms, Copilot, Cursor", humanEdge: "System thinking & product judgment" },
  { id: "system-design", name: "System Architecture", category: "technical", aiExposure: 35, keywords: ["architecture", "system design", "platform", "infrastructure", "migration", "mesh", "autoscaling", "reliability"], humanEdge: "Trade-off reasoning at scale" },
  { id: "testing-qa", name: "Testing & QA", category: "technical", aiExposure: 78, keywords: ["test", "qa", "regression", "performance testing", "bug", "quality"], aiEnabler: "AI test generation, visual regression AI", humanEdge: "Edge-case intuition" },
  { id: "security", name: "Security & Compliance Tech", category: "technical", aiExposure: 55, keywords: ["security", "threat", "vulnerability", "penetration", "zero trust", "hardening", "cybersecurity"], humanEdge: "Adversarial thinking" },
  { id: "data-engineering", name: "Data Engineering", category: "technical", aiExposure: 68, keywords: ["data pipeline", "warehouse", "etl", "query optimization", "data quality", "schema design", "data model"], aiEnabler: "AI-assisted SQL, auto-schema tools", humanEdge: "Data governance & domain modeling" },
  { id: "ai-ml", name: "AI & Machine Learning", category: "technical", aiExposure: 60, keywords: ["model", "training", "ml", "ai", "machine learning", "feature engineering", "a/b test"], aiEnabler: "AutoML, foundation models", humanEdge: "Problem framing & evaluation design" },
  { id: "devops", name: "DevOps & Infrastructure", category: "technical", aiExposure: 65, keywords: ["devops", "container", "monitoring", "alerting", "incident", "infrastructure as code"], aiEnabler: "AI-ops, auto-remediation", humanEdge: "Incident judgment & reliability culture" },
  // Analytical
  { id: "data-analysis", name: "Data Analysis", category: "analytical", aiExposure: 80, keywords: ["analysis", "analytics", "data", "statistical", "metrics", "dashboard", "tracking", "reporting", "rank"], aiEnabler: "AI analytics, natural language queries", humanEdge: "Asking the right questions" },
  { id: "financial-modeling", name: "Financial Modeling", category: "analytical", aiExposure: 70, keywords: ["financial model", "valuation", "forecast", "budget", "revenue", "variance", "cost"], aiEnabler: "AI forecasting, auto-modeling", humanEdge: "Assumption judgment & scenario framing" },
  { id: "research", name: "Research & Discovery", category: "analytical", aiExposure: 75, keywords: ["research", "audit", "review", "literature", "hypothesis", "prior art", "market research", "keyword"], aiEnabler: "AI literature review, auto-summarization", humanEdge: "Novel hypothesis formation" },
  { id: "process-optimization", name: "Process Optimization", category: "analytical", aiExposure: 60, keywords: ["process", "optimization", "workflow", "automation", "efficiency", "funnel", "pipeline management"], aiEnabler: "Process mining AI, workflow automation", humanEdge: "Change management & adoption" },
  { id: "risk-assessment", name: "Risk Assessment", category: "analytical", aiExposure: 50, keywords: ["risk", "mitigation", "scenario analysis", "loss prevention", "threat model"], humanEdge: "Contextual judgment under uncertainty" },
  // Communication
  { id: "stakeholder-mgmt", name: "Stakeholder Management", category: "communication", aiExposure: 15, keywords: ["stakeholder", "client", "customer", "relationship", "qbr", "onboarding", "correspondence"], humanEdge: "Trust building & political navigation" },
  { id: "writing-docs", name: "Writing & Documentation", category: "communication", aiExposure: 82, keywords: ["documentation", "writing", "paper", "copy", "editorial", "content", "email", "style guide", "knowledge base"], aiEnabler: "LLM writing assistants, auto-docs", humanEdge: "Voice, narrative, and persuasion" },
  { id: "presentation", name: "Presentation & Reporting", category: "communication", aiExposure: 65, keywords: ["presentation", "reporting", "board", "pitch", "status report", "materials"], aiEnabler: "AI slide generation, auto-reporting", humanEdge: "Storytelling & executive presence" },
  { id: "negotiation", name: "Negotiation & Persuasion", category: "communication", aiExposure: 10, keywords: ["negotiation", "deal", "offer", "closing", "persuasion", "licensing"], humanEdge: "Empathy & leverage intuition" },
  // Leadership
  { id: "project-mgmt", name: "Project Management", category: "leadership", aiExposure: 40, keywords: ["project", "sprint", "resource allocation", "planning", "coordination", "launch", "retrospective"], humanEdge: "Team dynamics & priority judgment" },
  { id: "strategy", name: "Strategy & Planning", category: "leadership", aiExposure: 25, keywords: ["strategy", "roadmap", "positioning", "prioritization", "go-to-market", "planning", "vision"], humanEdge: "Vision & competitive intuition" },
  { id: "team-mgmt", name: "Team Management", category: "leadership", aiExposure: 12, keywords: ["team", "coaching", "talent", "performance review", "culture", "hiring", "people", "employee", "interview"], humanEdge: "Empathy & cultural leadership" },
  { id: "vendor-mgmt", name: "Vendor & Supply Chain", category: "leadership", aiExposure: 45, keywords: ["vendor", "supplier", "procurement", "supply chain", "inventory", "logistics", "sourcing"], humanEdge: "Relationship & negotiation leverage" },
  // Creative
  { id: "design-ux", name: "Design & UX", category: "creative", aiExposure: 55, keywords: ["design", "ux", "wireframe", "prototype", "usability", "visual", "accessibility", "interaction", "animation", "token"], aiEnabler: "AI design tools, auto-layout", humanEdge: "Empathy-driven design thinking" },
  { id: "brand-creative", name: "Brand & Creative", category: "creative", aiExposure: 50, keywords: ["brand", "creative", "identity", "campaign", "concept", "ad copy", "influencer", "community"], humanEdge: "Cultural resonance & originality" },
  { id: "content-seo", name: "Content & SEO", category: "creative", aiExposure: 78, keywords: ["seo", "content", "landing page", "blog", "link building", "social media", "channel"], aiEnabler: "AI content generation, SEO automation", humanEdge: "Audience intuition & trend sensing" },
  // Compliance
  { id: "regulatory", name: "Regulatory & Legal", category: "compliance", aiExposure: 45, keywords: ["regulatory", "compliance", "legal", "policy", "filing", "patent", "trademark", "contract", "clause", "redline", "m&a", "litigation", "due diligence"], humanEdge: "Jurisdictional judgment & precedent" },
  { id: "audit-control", name: "Audit & Internal Controls", category: "compliance", aiExposure: 70, keywords: ["audit", "reconciliation", "journal", "month-end", "close", "financial statement", "sla"], aiEnabler: "AI reconciliation, anomaly detection", humanEdge: "Materiality judgment & ethics" },
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

/* ── User performance data ── */
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

/* ── Aggregated skill data ── */
interface AggregatedSkill {
  id: string;
  name: string;
  category: SkillCategory;
  proficiency: number;
  aiExposure: number;
  aiEnabler?: string;
  humanEdge?: string;
  jobCount: number;
  taskCount: number;
  practiced: boolean; // true if derived from real user data
  jobs: { title: string; company: string; taskName: string; score: number }[];
}

interface JobMatch {
  title: string;
  company: string;
  dept: string;
  humanMatch: number;
  aiBoostMatch: number;
  unlocked: boolean;
  matchedSkills: string[];
  gapSkills: { name: string; aiExposure: number; aiEnabler?: string; humanEdge?: string }[];
  aiCoveredGaps: { name: string; aiEnabler: string; humanEdge: string }[];
  newEdges: string[]; // human edges needed to truly excel
}

function buildTaxonomy(practicedRoles: PracticedRoleData[], rand: () => number) {
  const skillMap = new Map<string, AggregatedSkill>();

  for (const ts of TAXONOMY) {
    skillMap.set(ts.id, {
      id: ts.id, name: ts.name, category: ts.category,
      aiExposure: ts.aiExposure, aiEnabler: ts.aiEnabler, humanEdge: ts.humanEdge,
      proficiency: 0, jobCount: 0, taskCount: 0, practiced: false, jobs: [],
    });
  }

  const hasRealData = practicedRoles.length > 0;

  if (hasRealData) {
    // Use real performance data: map each practiced task to taxonomy skills
    for (const pr of practicedRoles) {
      const matchedIds = matchTaskToSkills(pr.task_name);
      // Also try matching the job title for broader skill coverage
      const jobMatchedIds = matchTaskToSkills(pr.job_title);
      const allIds = [...new Set([...matchedIds, ...jobMatchedIds])];

      // Average the 4 pillar scores into a proficiency score (0-100)
      const pillars = [pr.tool_awareness_score, pr.human_value_add_score, pr.adaptive_thinking_score, pr.domain_judgment_score].filter((s): s is number => s != null);
      const avgPillar = pillars.length > 0 ? Math.round(pillars.reduce((a, b) => a + b, 0) / pillars.length) : 50;

      for (const skillId of allIds) {
        const skill = skillMap.get(skillId);
        if (!skill) continue;
        skill.jobs.push({
          title: pr.job_title,
          company: pr.company || "—",
          taskName: pr.task_name,
          score: avgPillar,
        });
        skill.taskCount++;
        skill.practiced = true;
      }
    }

    // For skills with no real data, populate from job templates with zero proficiency
    // so they appear as gaps the user hasn't touched
    for (const job of JOB_TEMPLATES) {
      for (const taskName of job.tasks) {
        const matchedIds = matchTaskToSkills(taskName);
        for (const skillId of matchedIds) {
          const skill = skillMap.get(skillId)!;
          if (!skill.practiced) {
            // Only add job evidence (not proficiency) to show what's available
            skill.jobs.push({ title: job.title, company: job.company, taskName, score: 0 });
            skill.taskCount++;
          }
        }
      }
    }
  } else {
    // Demo mode: use seeded random data
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
    const gaps: JobMatch["gapSkills"] = [];
    const aiCovered: JobMatch["aiCoveredGaps"] = [];
    const newEdges: string[] = [];

    for (const id of allIds) {
      const us = userSkillMap.get(id);
      if (us && us.proficiency >= 50) {
        matched.push(us.name);
      } else {
        const tax = TAXONOMY.find(t => t.id === id);
        if (tax) {
          gaps.push({ name: tax.name, aiExposure: tax.aiExposure, aiEnabler: tax.aiEnabler, humanEdge: tax.humanEdge });
          if (tax.aiExposure >= 60 && tax.aiEnabler) {
            aiCovered.push({ name: tax.name, aiEnabler: tax.aiEnabler, humanEdge: tax.humanEdge || "Strategic oversight" });
            if (tax.humanEdge) newEdges.push(tax.humanEdge);
          }
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
      matchedSkills: matched, gapSkills: gaps,
      aiCoveredGaps: aiCovered, newEdges: [...new Set(newEdges)],
    };
  }).sort((a, b) => {
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

/* ── Reach Map SVG ── */
function ReachMap({ humanOnly, aiUnlocked, total }: { humanOnly: number; aiUnlocked: number; total: number }) {
  const cx = 160, cy = 140;
  const humanPct = humanOnly / total;
  const aiPct = (humanOnly + aiUnlocked) / total;

  const innerR = 50, midR = 85, outerR = 115;

  // Arc path helper
  function arcPath(r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
  }

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const humanAngle = Math.max(20, humanPct * 340);
  const aiAngle = Math.min(340, Math.max(humanAngle + 20, aiPct * 340));

  return (
    <svg viewBox="0 0 320 200" className="w-full max-w-[320px] mx-auto">
      {/* Background arcs */}
      {[innerR, midR, outerR].map(r => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={r === midR ? 28 : 20} opacity={0.15} />
      ))}

      {/* Human reach arc */}
      <motion.path
        d={arcPath(midR, 0, humanAngle)}
        fill="none"
        stroke="hsl(var(--brand-human))"
        strokeWidth={28}
        strokeLinecap="round"
        opacity={0.4}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />

      {/* AI-extended arc */}
      <motion.path
        d={arcPath(midR, humanAngle, aiAngle)}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={28}
        strokeLinecap="round"
        opacity={0.5}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
      />

      {/* Remaining (unreachable) is the background showing through */}

      {/* Center label */}
      <text x={cx} y={cy - 8} textAnchor="middle" className="fill-foreground" fontSize={22} fontWeight={700}>
        {humanOnly + aiUnlocked}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" className="fill-muted-foreground" fontSize={8} fontWeight={500}>
        of {total} roles
      </text>
      <text x={cx} y={cy + 20} textAnchor="middle" className="fill-muted-foreground" fontSize={7}>
        within reach
      </text>

      {/* Legend */}
      <circle cx={50} cy={185} r={4} fill="hsl(var(--brand-human))" opacity={0.6} />
      <text x={58} y={188} className="fill-muted-foreground" fontSize={7}>Human skills ({humanOnly})</text>
      <circle cx={170} cy={185} r={4} fill="hsl(var(--primary))" opacity={0.7} />
      <text x={178} y={188} className="fill-primary" fontSize={7} fontWeight={600}>+AI unlocked ({aiUnlocked})</text>
    </svg>
  );
}

export default function JourneySkillProfileView({ practicedRoles = [], onNavigate }: { practicedRoles?: PracticedRoleData[]; onNavigate: (title: string, company: string | null) => void }) {
  const rand = useMemo(() => seeded(2026), []);
  const skills = useMemo(() => buildTaxonomy(practicedRoles, rand), [practicedRoles, rand]);
  const jobMatches = useMemo(() => computeJobMatches(skills), [skills]);
  const isRealData = practicedRoles.length > 0;

  const [view, setView] = useState<ViewMode>("strengths");
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<number | null>(null);
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
  const humanOnlyCount = useMemo(() => jobMatches.filter(j => j.humanMatch >= 60).length, [jobMatches]);
  const unlockedJobs = useMemo(() => jobMatches.filter(j => j.unlocked), [jobMatches]);

  const filteredMatches = useMemo(() => {
    let list = jobMatches;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(j => j.title.toLowerCase().includes(q) || j.dept.toLowerCase().includes(q));
    }
    return list.slice(0, 25);
  }, [jobMatches, searchQ]);

  const filteredSkills = useMemo(() => {
    if (!searchQ) return null;
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
        {!isRealData && (
          <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-border/40 text-muted-foreground ml-auto">
            Demo data — practice roles to personalize
          </Badge>
        )}
        {isRealData && (
          <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-brand-human/30 text-brand-human ml-auto">
            Based on {practicedRoles.length} sessions
          </Badge>
        )}
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
            {/* Reach Map */}
            <ReachMap
              humanOnly={humanOnlyCount}
              aiUnlocked={unlockedJobs.length}
              total={JOB_TEMPLATES.length}
            />

            {/* Narrative */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">AI dissolves skill barriers.</strong>{" "}
                Just as no-code platforms let non-coders build software, AI tools let you perform tasks that previously required years of specialized training.
                But to thrive — not just access — you need to develop the <strong className="text-primary">human edges</strong> that AI can't replace.
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search roles..."
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted/30 border border-border/40 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* Job cards */}
            <div className="space-y-1.5">
              {filteredMatches.map((job, i) => {
                const boost = job.aiBoostMatch - job.humanMatch;
                const isOpen = expandedJob === i;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="rounded-lg border border-border/40 bg-card overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedJob(isOpen ? null : i)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors text-left"
                    >
                      {/* Match circle */}
                      <div className="relative shrink-0" title={`Skill match: ${job.humanMatch}% human + ${job.aiBoostMatch - job.humanMatch}% AI-assisted = ${job.aiBoostMatch}% total`}>
                        <div className={`w-10 h-10 rounded-full flex flex-col items-center justify-center ${profBg(job.aiBoostMatch)} ${profColor(job.aiBoostMatch)}`}>
                          <span className="text-xs font-bold leading-none">{job.aiBoostMatch}%</span>
                          <span className="text-[7px] opacity-70 leading-none mt-0.5">match</span>
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
                      </div>
                      {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                    </button>

                    {/* Expanded: barrier dissolution + new edge */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border/30"
                        >
                          <div className="p-3 space-y-3">
                            {/* Barriers AI dissolves */}
                            {job.aiCoveredGaps.length > 0 && (
                              <div className="space-y-1.5">
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                                  <Unlock className="h-3 w-3" /> Barriers AI Dissolves
                                </p>
                                {job.aiCoveredGaps.map((gap, gi) => (
                                  <div key={gi} className="flex items-start gap-2 p-2 rounded-md bg-primary/5 border border-primary/10">
                                    <Bot className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-medium text-foreground">{gap.name}</p>
                                      <p className="text-[10px] text-primary/80">{gap.aiEnabler}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* New edges needed to thrive */}
                            {job.newEdges.length > 0 && (
                              <div className="space-y-1.5">
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                                  <ArrowUpRight className="h-3 w-3" /> New Edge Needed to Thrive
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {job.newEdges.map((edge, ei) => (
                                    <Badge key={ei} variant="outline" className="text-[9px] border-brand-human/30 text-brand-human">
                                      {edge}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Remaining human gaps */}
                            {job.gapSkills.filter(g => g.aiExposure < 60).length > 0 && (
                              <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                                  <Lock className="h-3 w-3" /> Still Requires Human Mastery
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {job.gapSkills.filter(g => g.aiExposure < 60).map((g, gi) => (
                                    <Badge key={gi} variant="outline" className="text-[9px] border-brand-ai/30 text-brand-ai">
                                      {g.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Analyze CTA */}
                            <button
                              onClick={() => onNavigate(job.title, job.company)}
                              className="w-full flex items-center justify-center gap-1.5 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors text-xs text-muted-foreground hover:text-foreground"
                            >
                              Analyze this role <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
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
                    {/* AI exposure + what it means */}
                    <div className="flex items-center gap-2 text-[10px]">
                      <Bot className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">AI Exposure</span>
                      <Progress value={skill.aiExposure} className="h-1 flex-1" />
                      <span className="text-muted-foreground font-medium">{skill.aiExposure}%</span>
                    </div>

                    {/* AI enabler & human edge */}
                    {(skill.aiEnabler || skill.humanEdge) && (
                      <div className="grid grid-cols-2 gap-2">
                        {skill.aiEnabler && (
                          <div className="p-2 rounded-md bg-primary/5 border border-primary/10">
                            <p className="text-[8px] uppercase tracking-wider text-primary/60 mb-0.5">AI Covers This Via</p>
                            <p className="text-[10px] text-primary/90">{skill.aiEnabler}</p>
                          </div>
                        )}
                        {skill.humanEdge && (
                          <div className="p-2 rounded-md bg-brand-human/5 border border-brand-human/10">
                            <p className="text-[8px] uppercase tracking-wider text-brand-human/60 mb-0.5">Your New Edge</p>
                            <p className="text-[10px] text-brand-human/90">{skill.humanEdge}</p>
                          </div>
                        )}
                      </div>
                    )}

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
