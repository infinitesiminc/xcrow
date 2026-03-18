/**
 * Journey Dashboard — 5-step narrative
 *
 * 1. What I've Done        — activity log
 * 2. How My Skills Develop — skill proficiency & growth
 * 3. Jobs I'm Ready For    — current matches
 * 4. Jobs I Can Fast-Track — AI-unlocked roles
 * 5. How Do I Get There    — learning path
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2, ChevronDown, ChevronRight, Clock, Layers,
  Zap, Brain, Users, Shield, BarChart3, Target, Sparkles,
  TrendingUp, Unlock, Bot, ArrowRight, Route, Trophy,
  Play, Briefcase, BookOpen, ArrowUpRight, Search, Bookmark,
} from "lucide-react";

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

/* ─── Taxonomy (same as before, inlined for self-containment) ─── */
type SkillCategory = "technical" | "analytical" | "communication" | "leadership" | "creative" | "compliance";

interface TaxonomySkill {
  id: string; name: string; category: SkillCategory;
  keywords: string[]; aiExposure: number;
  aiEnabler?: string; humanEdge?: string;
}

const CATEGORY_META: Record<SkillCategory, { label: string; icon: typeof Layers; color: string }> = {
  technical:      { label: "Technical",         icon: Zap,       color: "hsl(var(--chart-1))" },
  analytical:     { label: "Analytical",        icon: BarChart3, color: "hsl(var(--chart-2))" },
  communication:  { label: "Communication",     icon: Users,     color: "hsl(var(--chart-3))" },
  leadership:     { label: "Leadership",        icon: Target,    color: "hsl(var(--chart-4))" },
  creative:       { label: "Creative",          icon: Brain,     color: "hsl(var(--chart-5))" },
  compliance:     { label: "Compliance & Risk",  icon: Shield,    color: "hsl(var(--primary))" },
};

const TAXONOMY: TaxonomySkill[] = [
  { id: "code-dev", name: "Software Development", category: "technical", aiExposure: 72, keywords: ["code", "development", "engineering", "component", "pipeline", "etl", "ci/cd", "deploy", "refactor", "responsive", "schema", "integration"], aiEnabler: "No-code platforms, Copilot, Cursor", humanEdge: "System thinking & product judgment" },
  { id: "system-design", name: "System Architecture", category: "technical", aiExposure: 35, keywords: ["architecture", "system design", "platform", "infrastructure", "migration", "mesh", "autoscaling", "reliability"], humanEdge: "Trade-off reasoning at scale" },
  { id: "testing-qa", name: "Testing & QA", category: "technical", aiExposure: 78, keywords: ["test", "qa", "regression", "performance testing", "bug", "quality"], aiEnabler: "AI test generation, visual regression AI", humanEdge: "Edge-case intuition" },
  { id: "security", name: "Security & Compliance Tech", category: "technical", aiExposure: 55, keywords: ["security", "threat", "vulnerability", "penetration", "zero trust", "hardening", "cybersecurity"], humanEdge: "Adversarial thinking" },
  { id: "data-engineering", name: "Data Engineering", category: "technical", aiExposure: 68, keywords: ["data pipeline", "warehouse", "etl", "query optimization", "data quality", "schema design", "data model"], aiEnabler: "AI-assisted SQL, auto-schema tools", humanEdge: "Data governance & domain modeling" },
  { id: "ai-ml", name: "AI & Machine Learning", category: "technical", aiExposure: 60, keywords: ["model", "training", "ml", "ai", "machine learning", "feature engineering", "a/b test"], aiEnabler: "AutoML, foundation models", humanEdge: "Problem framing & evaluation design" },
  { id: "devops", name: "DevOps & Infrastructure", category: "technical", aiExposure: 65, keywords: ["devops", "container", "monitoring", "alerting", "incident", "infrastructure as code"], aiEnabler: "AI-ops, auto-remediation", humanEdge: "Incident judgment & reliability culture" },
  { id: "data-analysis", name: "Data Analysis", category: "analytical", aiExposure: 80, keywords: ["analysis", "analytics", "data", "statistical", "metrics", "dashboard", "tracking", "reporting", "rank"], aiEnabler: "AI analytics, natural language queries", humanEdge: "Asking the right questions" },
  { id: "financial-modeling", name: "Financial Modeling", category: "analytical", aiExposure: 70, keywords: ["financial model", "valuation", "forecast", "budget", "revenue", "variance", "cost"], aiEnabler: "AI forecasting, auto-modeling", humanEdge: "Assumption judgment & scenario framing" },
  { id: "research", name: "Research & Discovery", category: "analytical", aiExposure: 75, keywords: ["research", "audit", "review", "literature", "hypothesis", "prior art", "market research", "keyword"], aiEnabler: "AI literature review, auto-summarization", humanEdge: "Novel hypothesis formation" },
  { id: "process-optimization", name: "Process Optimization", category: "analytical", aiExposure: 60, keywords: ["process", "optimization", "workflow", "automation", "efficiency", "funnel", "pipeline management"], aiEnabler: "Process mining AI, workflow automation", humanEdge: "Change management & adoption" },
  { id: "risk-assessment", name: "Risk Assessment", category: "analytical", aiExposure: 50, keywords: ["risk", "mitigation", "scenario analysis", "loss prevention", "threat model"], humanEdge: "Contextual judgment under uncertainty" },
  { id: "stakeholder-mgmt", name: "Stakeholder Management", category: "communication", aiExposure: 15, keywords: ["stakeholder", "client", "customer", "relationship", "qbr", "onboarding", "correspondence"], humanEdge: "Trust building & political navigation" },
  { id: "writing-docs", name: "Writing & Documentation", category: "communication", aiExposure: 82, keywords: ["documentation", "writing", "paper", "copy", "editorial", "content", "email", "style guide", "knowledge base"], aiEnabler: "LLM writing assistants, auto-docs", humanEdge: "Voice, narrative, and persuasion" },
  { id: "presentation", name: "Presentation & Reporting", category: "communication", aiExposure: 65, keywords: ["presentation", "reporting", "board", "pitch", "status report", "materials"], aiEnabler: "AI slide generation, auto-reporting", humanEdge: "Storytelling & executive presence" },
  { id: "negotiation", name: "Negotiation & Persuasion", category: "communication", aiExposure: 10, keywords: ["negotiation", "deal", "offer", "closing", "persuasion", "licensing"], humanEdge: "Empathy & leverage intuition" },
  { id: "project-mgmt", name: "Project Management", category: "leadership", aiExposure: 40, keywords: ["project", "sprint", "resource allocation", "planning", "coordination", "launch", "retrospective"], humanEdge: "Team dynamics & priority judgment" },
  { id: "strategy", name: "Strategy & Planning", category: "leadership", aiExposure: 25, keywords: ["strategy", "roadmap", "positioning", "prioritization", "go-to-market", "planning", "vision"], humanEdge: "Vision & competitive intuition" },
  { id: "team-mgmt", name: "Team Management", category: "leadership", aiExposure: 12, keywords: ["team", "coaching", "talent", "performance review", "culture", "hiring", "people", "employee", "interview"], humanEdge: "Empathy & cultural leadership" },
  { id: "vendor-mgmt", name: "Vendor & Supply Chain", category: "leadership", aiExposure: 45, keywords: ["vendor", "supplier", "procurement", "supply chain", "inventory", "logistics", "sourcing"], humanEdge: "Relationship & negotiation leverage" },
  { id: "design-ux", name: "Design & UX", category: "creative", aiExposure: 55, keywords: ["design", "ux", "wireframe", "prototype", "usability", "visual", "accessibility", "interaction", "animation", "token"], aiEnabler: "AI design tools, auto-layout", humanEdge: "Empathy-driven design thinking" },
  { id: "brand-creative", name: "Brand & Creative", category: "creative", aiExposure: 50, keywords: ["brand", "creative", "identity", "campaign", "concept", "ad copy", "influencer", "community"], humanEdge: "Cultural resonance & originality" },
  { id: "content-seo", name: "Content & SEO", category: "creative", aiExposure: 78, keywords: ["seo", "content", "landing page", "blog", "link building", "social media", "channel"], aiEnabler: "AI content generation, SEO automation", humanEdge: "Audience intuition & trend sensing" },
  { id: "regulatory", name: "Regulatory & Legal", category: "compliance", aiExposure: 45, keywords: ["regulatory", "compliance", "legal", "policy", "filing", "patent", "trademark", "contract", "clause", "redline", "m&a", "litigation", "due diligence"], humanEdge: "Jurisdictional judgment & precedent" },
  { id: "audit-control", name: "Audit & Internal Controls", category: "compliance", aiExposure: 70, keywords: ["audit", "reconciliation", "journal", "month-end", "close", "financial statement", "sla"], aiEnabler: "AI reconciliation, anomaly detection", humanEdge: "Materiality judgment & ethics" },
];

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

interface JobMatch {
  title: string; company: string; dept: string;
  humanMatch: number; aiBoostMatch: number; unlocked: boolean;
  matchedSkills: string[];
  gapSkills: { name: string; aiExposure: number; aiEnabler?: string; humanEdge?: string }[];
  aiCoveredGaps: { name: string; aiEnabler: string; humanEdge: string }[];
  newEdges: string[];
}

function buildTaxonomy(practicedRoles: PracticedRoleData[]) {
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
    for (const job of JOB_TEMPLATES) {
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
    skill.proficiency = Math.round(skill.jobs.reduce((s, j) => s + j.score, 0) / skill.jobs.length);
    result.push(skill);
  }
  result.sort((a, b) => b.taskCount - a.taskCount);
  return result;
}

function computeJobMatches(skills: AggregatedSkill[]): JobMatch[] {
  const userSkillMap = new Map(skills.map(s => [s.id, s]));
  return JOB_TEMPLATES.map(job => {
    const jobSkillIds = new Set<string>();
    for (const t of job.tasks) for (const id of matchTaskToSkills(t)) jobSkillIds.add(id);
    const allIds = Array.from(jobSkillIds);
    const matched: string[] = [], gaps: JobMatch["gapSkills"] = [], aiCovered: JobMatch["aiCoveredGaps"] = [], newEdges: string[] = [];
    for (const id of allIds) {
      const us = userSkillMap.get(id);
      if (us && us.proficiency >= 50) { matched.push(us.name); }
      else {
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
    const aiBoostMatch = allIds.length > 0 ? Math.round(((matched.length + aiCovered.length) / allIds.length) * 100) : 0;
    return { title: job.title, company: job.company, dept: job.dept, humanMatch, aiBoostMatch, unlocked: humanMatch < 60 && aiBoostMatch >= 60, matchedSkills: matched, gapSkills: gaps, aiCoveredGaps: aiCovered, newEdges: [...new Set(newEdges)] };
  }).sort((a, b) => b.aiBoostMatch - a.aiBoostMatch);
}

/* ─── Edge path ─── */
interface EdgeStep {
  edge: string; frequency: number; category: SkillCategory;
  relatedSkills: { name: string; aiEnabler: string }[];
  practiceTasks: { jobTitle: string; company: string; taskName: string }[];
  pillar: string; bestScore: number | null; practiced: boolean;
}

const EDGE_PILLAR: Record<string, string> = {
  "System thinking & product judgment": "adaptive_thinking",
  "Trade-off reasoning at scale": "domain_judgment",
  "Edge-case intuition": "adaptive_thinking",
  "Adversarial thinking": "domain_judgment",
  "Data governance & domain modeling": "domain_judgment",
  "Problem framing & evaluation design": "adaptive_thinking",
  "Incident judgment & reliability culture": "domain_judgment",
  "Asking the right questions": "adaptive_thinking",
  "Assumption judgment & scenario framing": "domain_judgment",
  "Novel hypothesis formation": "adaptive_thinking",
  "Change management & adoption": "human_value_add",
  "Contextual judgment under uncertainty": "domain_judgment",
  "Trust building & political navigation": "human_value_add",
  "Voice, narrative, and persuasion": "human_value_add",
  "Storytelling & executive presence": "human_value_add",
  "Empathy & leverage intuition": "human_value_add",
  "Team dynamics & priority judgment": "human_value_add",
  "Vision & competitive intuition": "adaptive_thinking",
  "Empathy & cultural leadership": "human_value_add",
  "Relationship & negotiation leverage": "human_value_add",
  "Empathy-driven design thinking": "human_value_add",
  "Cultural resonance & originality": "adaptive_thinking",
  "Audience intuition & trend sensing": "adaptive_thinking",
  "Jurisdictional judgment & precedent": "domain_judgment",
  "Materiality judgment & ethics": "domain_judgment",
};

function buildEdgePath(jobMatches: JobMatch[], practicedRoles: PracticedRoleData[]): EdgeStep[] {
  const edgeMap = new Map<string, { frequency: number; relatedSkills: Map<string, string>; jobs: Set<string>; tasks: { jobTitle: string; company: string; taskName: string }[]; category: SkillCategory }>();
  for (const job of jobMatches.filter(j => j.unlocked || j.aiBoostMatch >= 60)) {
    for (const gap of job.aiCoveredGaps) {
      if (!gap.humanEdge) continue;
      if (!edgeMap.has(gap.humanEdge)) edgeMap.set(gap.humanEdge, { frequency: 0, relatedSkills: new Map(), jobs: new Set(), tasks: [], category: TAXONOMY.find(t => t.humanEdge === gap.humanEdge)?.category || "leadership" });
      const e = edgeMap.get(gap.humanEdge)!;
      e.frequency++; e.jobs.add(job.title); e.relatedSkills.set(gap.name, gap.aiEnabler);
    }
  }
  for (const [edge, entry] of edgeMap) {
    const skill = TAXONOMY.find(t => t.humanEdge === edge);
    if (!skill) continue;
    for (const job of JOB_TEMPLATES) {
      for (const t of job.tasks) {
        if (matchTaskToSkills(t).includes(skill.id)) entry.tasks.push({ jobTitle: job.title, company: job.company, taskName: t });
      }
    }
  }
  const steps: EdgeStep[] = [];
  for (const [edge, entry] of edgeMap) {
    if (entry.frequency === 0) continue;
    const pillar = EDGE_PILLAR[edge] || "human_value_add";
    const pillarKey = `${pillar}_score` as keyof PracticedRoleData;
    const skill = TAXONOMY.find(t => t.humanEdge === edge);
    let bestScore: number | null = null;
    let practiced = false;
    if (skill) {
      for (const pr of practicedRoles) {
        if ([...matchTaskToSkills(pr.task_name), ...matchTaskToSkills(pr.job_title)].includes(skill.id)) {
          practiced = true;
          const s = pr[pillarKey] as number | null;
          if (s != null && (bestScore === null || s > bestScore)) bestScore = s;
        }
      }
    }
    steps.push({ edge, frequency: entry.frequency, category: entry.category, relatedSkills: Array.from(entry.relatedSkills.entries()).map(([n, a]) => ({ name: n, aiEnabler: a })), practiceTasks: entry.tasks.slice(0, 3), pillar, bestScore, practiced });
  }
  steps.sort((a, b) => { if (a.practiced !== b.practiced) return a.practiced ? 1 : -1; return b.frequency - a.frequency; });
  return steps;
}

/* ─── Helpers ─── */
function profColor(s: number) { return s >= 75 ? "text-brand-human" : s >= 55 ? "text-brand-mid" : "text-brand-ai"; }
function profBg(s: number) { return s >= 75 ? "bg-brand-human/15" : s >= 55 ? "bg-brand-mid/15" : "bg-brand-ai/15"; }
function timeAgo(d: string) { const diff = Date.now() - new Date(d).getTime(); const m = Math.floor(diff / 60000); if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`; }
function avgPillar(r: PracticedRoleData) {
  const s = [r.tool_awareness_score, r.human_value_add_score, r.adaptive_thinking_score, r.domain_judgment_score].filter((v): v is number => v != null);
  return s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : 0;
}

const PILLAR_LABELS: Record<string, string> = { human_value_add: "Human Value-Add", adaptive_thinking: "Adaptive Thinking", domain_judgment: "Domain Judgment", tool_awareness: "Tool Awareness" };

/* ─── Steps ─── */
type Step = "done" | "skills" | "ready" | "fast-track" | "path";

const STEPS: { key: Step; label: string; icon: typeof CheckCircle2; shortLabel: string }[] = [
  { key: "done",       label: "What I've Done",       icon: CheckCircle2, shortLabel: "Done" },
  { key: "skills",     label: "My Skills",            icon: TrendingUp,   shortLabel: "Skills" },
  { key: "ready",      label: "Ready For",            icon: Briefcase,    shortLabel: "Ready" },
  { key: "fast-track", label: "Fast-Track with AI",   icon: Sparkles,     shortLabel: "AI Boost" },
  { key: "path",       label: "How to Get There",     icon: Route,        shortLabel: "Path" },
];

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
  const [step, setStep] = useState<Step>("done");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const skills = useMemo(() => buildTaxonomy(practicedRoles), [practicedRoles]);
  const jobMatches = useMemo(() => computeJobMatches(skills), [skills]);
  const edgePath = useMemo(() => buildEdgePath(jobMatches, practicedRoles), [jobMatches, practicedRoles]);

  const readyJobs = useMemo(() => jobMatches.filter(j => j.humanMatch >= 60).sort((a, b) => b.humanMatch - a.humanMatch), [jobMatches]);
  const fastTrackJobs = useMemo(() => jobMatches.filter(j => j.unlocked).sort((a, b) => b.aiBoostMatch - a.aiBoostMatch), [jobMatches]);

  const { strengths, developing, gaps } = useMemo(() => {
    const s: AggregatedSkill[] = [], d: AggregatedSkill[] = [], g: AggregatedSkill[] = [];
    for (const sk of skills) {
      if (!sk.practiced) continue; // Only show practiced skills
      if (sk.proficiency >= 75) s.push(sk);
      else if (sk.proficiency >= 55) d.push(sk);
      else g.push(sk);
    }
    return { strengths: s.sort((a, b) => b.proficiency - a.proficiency), developing: d, gaps: g.sort((a, b) => a.proficiency - b.proficiency) };
  }, [skills]);

  // Unique roles & tasks practiced
  const uniqueRoles = useMemo(() => new Set(practicedRoles.map(r => r.job_title)).size, [practicedRoles]);
  const uniqueTasks = useMemo(() => new Set(practicedRoles.map(r => r.task_name)).size, [practicedRoles]);

  const goToRole = (title: string, company?: string | null) => {
    const params = new URLSearchParams({ title });
    if (company) params.set("company", company);
    navigate(`/analysis?${params.toString()}`);
  };

  if (loading) {
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
        <p className="text-sm text-muted-foreground">Your career development at a glance.</p>
      </div>

      {/* ── Step Navigation ── */}
      <div className="flex items-center gap-0.5 mt-5 mb-6 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const active = step === s.key;
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => { setStep(s.key); setExpandedIdx(null); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.shortLabel}</span>
              {i < STEPS.length - 1 && !active && (
                <ArrowRight className="h-3 w-3 text-border ml-1 hidden sm:block" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Empty State ── */}
      {isEmpty && (
        <div className="text-center py-16">
          <BookOpen className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1 mb-4">Explore roles, practice tasks, and bookmark positions to build your journey</p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Explore Roles <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {!isEmpty && (
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>

            {/* ═══ STEP 1: What I've Done ═══ */}
            {step === "done" && (
              <div className="space-y-5">
                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "Simulations", value: practicedRoles.length, icon: Play },
                    { label: "Unique Tasks", value: uniqueTasks, icon: Target },
                    { label: "Roles Explored", value: uniqueRoles, icon: Briefcase },
                    { label: "Roles Saved", value: savedRoles.length, icon: Bookmark },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-xl border border-border/40 bg-card p-3 text-center">
                      <stat.icon className="h-4 w-4 text-muted-foreground mx-auto mb-1.5" />
                      <p className="text-xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Recent activity */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Activity</h3>
                  {practicedRoles.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No simulations completed yet. Practice a role to see your activity here.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {practicedRoles.slice(0, 10).map((pr, i) => {
                        const score = avgPillar(pr);
                        return (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => goToRole(pr.job_title, pr.company)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-card hover:bg-muted/20 transition-colors text-left group"
                          >
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${profBg(score)}`}>
                              <span className={`text-xs font-bold ${profColor(score)}`}>{score}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{pr.task_name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{pr.job_title}{pr.company ? ` · ${pr.company}` : ""}</p>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(pr.completed_at)}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Saved roles */}
                {savedRoles.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Saved Roles</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {savedRoles.slice(0, 6).map((sr, i) => (
                        <button
                          key={i}
                          onClick={() => goToRole(sr.job_title, sr.company)}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-card hover:bg-muted/20 transition-colors text-left"
                        >
                          <Bookmark className="h-4 w-4 text-primary shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-foreground truncate">{sr.job_title}</p>
                            {sr.company && <p className="text-[10px] text-muted-foreground">{sr.company}</p>}
                          </div>
                          {sr.augmented_percent != null && (
                            <span className="text-[10px] text-muted-foreground shrink-0">{sr.augmented_percent}% augmented</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ STEP 2: How My Skills Are Developing ═══ */}
            {step === "skills" && (
              <div className="space-y-5">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-brand-human/20 bg-brand-human/5 p-3 text-center">
                    <p className="text-xl font-bold text-brand-human">{strengths.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Strong</p>
                  </div>
                  <div className="rounded-xl border border-brand-mid/20 bg-brand-mid/5 p-3 text-center">
                    <p className="text-xl font-bold text-brand-mid">{developing.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Growing</p>
                  </div>
                  <div className="rounded-xl border border-brand-ai/20 bg-brand-ai/5 p-3 text-center">
                    <p className="text-xl font-bold text-brand-ai">{gaps.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">To Build</p>
                  </div>
                </div>

                {practicedRoles.length === 0 ? (
                  <div className="rounded-xl border border-border/40 bg-muted/10 p-6 text-center">
                    <TrendingUp className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Complete simulations to see your skills develop</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Each simulation measures 4 pillars: Tool Awareness, Human Value-Add, Adaptive Thinking, Domain Judgment</p>
                  </div>
                ) : (
                  <>
                    {/* Pillar overview */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pillar Averages</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {(["tool_awareness", "human_value_add", "adaptive_thinking", "domain_judgment"] as const).map(pillar => {
                          const key = `${pillar}_score` as keyof PracticedRoleData;
                          const scores = practicedRoles.map(r => r[key] as number | null).filter((s): s is number => s != null);
                          const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
                          return (
                            <div key={pillar} className="rounded-xl border border-border/40 bg-card p-3">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-medium text-muted-foreground">{PILLAR_LABELS[pillar]}</p>
                                <span className={`text-sm font-bold ${profColor(avg)}`}>{avg}%</span>
                              </div>
                              <Progress value={avg} className="h-1.5" />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Skills by category */}
                    {[
                      { title: "Strengths", subtitle: "You perform consistently well here", items: strengths, icon: <Trophy className="h-3.5 w-3.5 text-brand-human" /> },
                      { title: "Developing", subtitle: "Building momentum — keep practicing", items: developing, icon: <TrendingUp className="h-3.5 w-3.5 text-brand-mid" /> },
                      { title: "Gaps", subtitle: "Focus areas — or let AI handle them", items: gaps, icon: <Target className="h-3.5 w-3.5 text-brand-ai" /> },
                    ].filter(g => g.items.length > 0).map(group => (
                      <div key={group.title}>
                        <div className="flex items-center gap-2 mb-2">
                          {group.icon}
                          <div>
                            <h3 className="text-xs font-semibold text-foreground">{group.title}</h3>
                            <p className="text-[10px] text-muted-foreground">{group.subtitle}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {group.items.map(sk => (
                            <div key={sk.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/30 bg-card">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{sk.name}</p>
                                <p className="text-[10px] text-muted-foreground">{CATEGORY_META[sk.category].label} · {sk.taskCount} tasks</p>
                              </div>
                              <div className="w-16 hidden sm:block">
                                <Progress value={sk.proficiency} className="h-1.5" />
                              </div>
                              <span className={`text-xs font-bold w-10 text-right ${profColor(sk.proficiency)}`}>{sk.proficiency}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* ═══ STEP 3: Jobs I'm Ready For ═══ */}
            {step === "ready" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-brand-human/20 bg-brand-human/5 p-4">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">{readyJobs.length} roles</strong> where your current skills already match 60%+ of what's needed.
                  </p>
                </div>

                {readyJobs.length === 0 ? (
                  <div className="text-center py-10">
                    <Briefcase className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Complete more simulations to unlock role matches</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {readyJobs.slice(0, 15).map((job, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        onClick={() => goToRole(job.title, job.company)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-card hover:bg-muted/20 transition-colors text-left group"
                      >
                        <div className={`w-10 h-10 rounded-full flex flex-col items-center justify-center shrink-0 ${profBg(job.humanMatch)}`}>
                          <span className={`text-xs font-bold ${profColor(job.humanMatch)}`}>{job.humanMatch}%</span>
                          <span className="text-[7px] text-muted-foreground">match</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{job.title}</p>
                          <p className="text-[10px] text-muted-foreground">{job.company} · {job.dept}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {job.matchedSkills.slice(0, 3).map((s, si) => (
                              <Badge key={si} variant="outline" className="text-[8px] px-1 py-0 border-brand-human/30 text-brand-human">{s}</Badge>
                            ))}
                            {job.matchedSkills.length > 3 && (
                              <span className="text-[8px] text-muted-foreground">+{job.matchedSkills.length - 3}</span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══ STEP 4: Fast-Track with AI ═══ */}
            {step === "fast-track" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">{fastTrackJobs.length} roles</strong> you can't do alone, but <strong className="text-primary">AI bridges the gap</strong>. Your skills + AI tools = qualified.
                  </p>
                </div>

                {fastTrackJobs.length === 0 ? (
                  <div className="text-center py-10">
                    <Sparkles className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Practice more tasks to discover AI-unlocked opportunities</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {fastTrackJobs.slice(0, 15).map((job, i) => {
                      const boost = job.aiBoostMatch - job.humanMatch;
                      const isOpen = expandedIdx === i;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className="rounded-lg border border-border/40 bg-card overflow-hidden"
                        >
                          <button
                            onClick={() => setExpandedIdx(isOpen ? null : i)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors text-left"
                          >
                            <div className={`w-10 h-10 rounded-full flex flex-col items-center justify-center shrink-0 ${profBg(job.aiBoostMatch)}`}>
                              <span className={`text-xs font-bold ${profColor(job.aiBoostMatch)}`}>{job.aiBoostMatch}%</span>
                              <span className="text-[7px] text-muted-foreground">total</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-medium text-foreground truncate">{job.title}</p>
                                <Badge variant="outline" className="text-[8px] px-1 py-0 border-primary/40 text-primary shrink-0">
                                  <Unlock className="h-2 w-2 mr-0.5" />+{boost}% AI
                                </Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground">{job.company} · {job.dept}</p>
                              {/* Boost bar */}
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                                  <div className="h-full rounded-full relative" style={{ width: `${job.aiBoostMatch}%` }}>
                                    <div className="absolute inset-0 rounded-full bg-muted-foreground/30" style={{ width: `${(job.humanMatch / job.aiBoostMatch) * 100}%` }} />
                                    <div className="absolute inset-0 rounded-full bg-primary/50" style={{ left: `${(job.humanMatch / job.aiBoostMatch) * 100}%` }} />
                                  </div>
                                </div>
                              </div>
                            </div>
                            {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                          </button>

                          <AnimatePresence>
                            {isOpen && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border/30">
                                <div className="p-3 space-y-3">
                                  {job.aiCoveredGaps.length > 0 && (
                                    <div className="space-y-1.5">
                                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                                        <Bot className="h-3 w-3" /> AI Bridges These Gaps
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
                                  {job.newEdges.length > 0 && (
                                    <div className="space-y-1.5">
                                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                                        <ArrowUpRight className="h-3 w-3" /> Human Edges to Develop
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {job.newEdges.map((edge, ei) => (
                                          <Badge key={ei} variant="outline" className="text-[9px] border-brand-human/30 text-brand-human">{edge}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => goToRole(job.title, job.company)}
                                    className="w-full flex items-center justify-center gap-1.5 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    Explore this role <ArrowRight className="h-3 w-3" />
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══ STEP 5: How Do I Get There ═══ */}
            {step === "path" && (
              <div className="space-y-5">
                {/* Progress summary */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
                    <p className="text-xl font-bold text-primary">{edgePath.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Skills to Build</p>
                  </div>
                  <div className="rounded-xl border border-brand-mid/20 bg-brand-mid/5 p-3 text-center">
                    <p className="text-xl font-bold text-brand-mid">{edgePath.filter(e => e.practiced).length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">In Progress</p>
                  </div>
                  <div className="rounded-xl border border-brand-human/20 bg-brand-human/5 p-3 text-center">
                    <p className="text-xl font-bold text-brand-human">{edgePath.filter(e => (e.bestScore ?? 0) >= 70).length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Mastered</p>
                  </div>
                </div>

                {/* Explanation */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Your learning path.</strong>{" "}
                    These are uniquely human skills that AI can't replace — ranked by how many fast-track roles need them. Master these to thrive, not just access, AI-unlocked opportunities.
                  </p>
                </div>

                {/* Overall progress */}
                {edgePath.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground font-medium">Overall Progress</p>
                      <p className="text-xs font-bold text-foreground">
                        {Math.round((edgePath.filter(e => (e.bestScore ?? 0) >= 70).length / edgePath.length) * 100)}%
                      </p>
                    </div>
                    <Progress value={(edgePath.filter(e => (e.bestScore ?? 0) >= 70).length / edgePath.length) * 100} className="h-2" />
                  </div>
                )}

                {/* Edge steps */}
                {edgePath.length === 0 ? (
                  <div className="text-center py-10">
                    <Route className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Complete simulations to generate your learning path</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {edgePath.map((es, i) => {
                      const mastered = (es.bestScore ?? 0) >= 70;
                      const isOpen = expandedIdx === i;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={`rounded-lg border overflow-hidden ${mastered ? "border-brand-human/30 bg-brand-human/5" : "border-border/40 bg-card"}`}
                        >
                          <button
                            onClick={() => setExpandedIdx(isOpen ? null : i)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors text-left"
                          >
                            {/* Step indicator */}
                            <div className="shrink-0">
                              {mastered ? (
                                <Trophy className="h-4 w-4 text-brand-human" />
                              ) : es.practiced ? (
                                <TrendingUp className="h-4 w-4 text-brand-mid" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                                  <span className="text-[8px] text-muted-foreground font-bold">{i + 1}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-semibold text-foreground truncate">{es.edge}</p>
                                <Badge variant="outline" className="text-[8px] px-1 py-0 shrink-0 border-border/40 text-muted-foreground">
                                  {es.frequency} roles
                                </Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {PILLAR_LABELS[es.pillar] || es.pillar} · {CATEGORY_META[es.category]?.label}
                              </p>
                              {es.bestScore !== null && (
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <Progress value={es.bestScore} className="h-1.5 flex-1" />
                                  <span className={`text-[10px] font-bold ${profColor(es.bestScore)}`}>{es.bestScore}%</span>
                                </div>
                              )}
                            </div>

                            {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                          </button>

                          <AnimatePresence>
                            {isOpen && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border/30">
                                <div className="p-3 space-y-3">
                                  {es.relatedSkills.length > 0 && (
                                    <div className="space-y-1.5">
                                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                                        <Bot className="h-3 w-3" /> AI Handles the Technical Side
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {es.relatedSkills.map((rs, ri) => (
                                          <Badge key={ri} variant="outline" className="text-[9px] border-primary/30 text-primary">
                                            {rs.name}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {es.practiceTasks.length > 0 && (
                                    <div className="space-y-1.5">
                                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                                        <Play className="h-3 w-3" /> Practice This Edge
                                      </p>
                                      {es.practiceTasks.map((task, ti) => (
                                        <button
                                          key={ti}
                                          onClick={() => goToRole(task.jobTitle, task.company)}
                                          className="w-full flex items-center gap-2 p-2 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors text-left group"
                                        >
                                          <Play className="h-3 w-3 text-primary shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-medium text-foreground truncate">{task.taskName}</p>
                                            <p className="text-[10px] text-muted-foreground">{task.jobTitle} · {task.company}</p>
                                          </div>
                                          <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
