/**
 * Journey Dashboard — unified Career Reach Map
 *
 * Stats ribbon → Scatter chart (Human Match % vs AI Boost %)
 * Click a dot → slide-out panel with gap analysis + CTA
 */
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Play, Target, Briefcase, Bookmark, BookOpen, ArrowRight,
} from "lucide-react";
import CareerReachMap, { type JobMatchDot } from "./CareerReachMap";

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

/* ─── Taxonomy ─── */
type SkillCategory = "technical" | "analytical" | "communication" | "leadership" | "creative" | "compliance";

interface TaxonomySkill {
  id: string; name: string; category: SkillCategory;
  keywords: string[]; aiExposure: number;
  aiEnabler?: string; humanEdge?: string;
}

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

function computeJobMatches(skills: AggregatedSkill[]): JobMatchDot[] {
  const userSkillMap = new Map(skills.map(s => [s.id, s]));
  return JOB_TEMPLATES.map(job => {
    const jobSkillIds = new Set<string>();
    for (const t of job.tasks) for (const id of matchTaskToSkills(t)) jobSkillIds.add(id);
    const allIds = Array.from(jobSkillIds);
    const matched: string[] = [], gaps: JobMatchDot["gapSkills"] = [], aiCovered: JobMatchDot["aiCoveredGaps"] = [], newEdges: string[] = [];
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
    // Partial credit: AI covers gaps proportionally to aiExposure (e.g. 80% exposure = 0.8 credit, not 1.0)
    const aiPartialCredit = aiCovered.reduce((sum, gap) => {
      const tax = TAXONOMY.find(t => t.name === gap.name);
      return sum + (tax ? tax.aiExposure / 100 : 0.6);
    }, 0);
    const aiBoostMatch = allIds.length > 0 ? Math.min(95, Math.round(((matched.length + aiPartialCredit) / allIds.length) * 100)) : 0;
    return { title: job.title, company: job.company, dept: job.dept, humanMatch, aiBoostMatch, unlocked: humanMatch < 60 && aiBoostMatch >= 60, matchedSkills: matched, gapSkills: gaps, aiCoveredGaps: aiCovered, newEdges: [...new Set(newEdges)] };
  }).sort((a, b) => b.aiBoostMatch - a.aiBoostMatch);
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

  const skills = useMemo(() => buildTaxonomy(practicedRoles), [practicedRoles]);
  const jobMatches = useMemo(() => computeJobMatches(skills), [skills]);

  const uniqueRoles = useMemo(() => new Set(practicedRoles.map(r => r.job_title)).size, [practicedRoles]);
  const uniqueTasks = useMemo(() => new Set(practicedRoles.map(r => r.task_name)).size, [practicedRoles]);

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
