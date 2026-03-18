/**
 * Unified Skill Taxonomy View
 *
 * Extracts skills from 50 mock jobs, normalizes into a unified taxonomy,
 * aggregates proficiency, and enables matching to any job.
 */
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChevronDown, ChevronRight, Layers, Zap, Brain, Users, Shield,
  BarChart3, Search, Sparkles, Target, ArrowRight,
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
  keywords: string[]; // keywords to match tasks/skills to this taxonomy entry
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
  { id: "code-dev", name: "Software Development", category: "technical", keywords: ["code", "development", "engineering", "component", "pipeline", "etl", "ci/cd", "deploy", "refactor", "responsive", "schema", "integration"] },
  { id: "system-design", name: "System Architecture", category: "technical", keywords: ["architecture", "system design", "platform", "infrastructure", "migration", "mesh", "autoscaling", "reliability"] },
  { id: "testing-qa", name: "Testing & QA", category: "technical", keywords: ["test", "qa", "regression", "performance testing", "bug", "quality"] },
  { id: "security", name: "Security & Compliance Tech", category: "technical", keywords: ["security", "threat", "vulnerability", "penetration", "zero trust", "hardening", "cybersecurity"] },
  { id: "data-engineering", name: "Data Engineering", category: "technical", keywords: ["data pipeline", "warehouse", "etl", "query optimization", "data quality", "schema design", "data model"] },
  { id: "ai-ml", name: "AI & Machine Learning", category: "technical", keywords: ["model", "training", "ml", "ai", "machine learning", "feature engineering", "a/b test"] },
  { id: "devops", name: "DevOps & Infrastructure", category: "technical", keywords: ["devops", "container", "monitoring", "alerting", "incident", "infrastructure as code"] },
  // Analytical
  { id: "data-analysis", name: "Data Analysis", category: "analytical", keywords: ["analysis", "analytics", "data", "statistical", "metrics", "dashboard", "tracking", "reporting", "rank"] },
  { id: "financial-modeling", name: "Financial Modeling", category: "analytical", keywords: ["financial model", "valuation", "forecast", "budget", "revenue", "variance", "cost"] },
  { id: "research", name: "Research & Discovery", category: "analytical", keywords: ["research", "audit", "review", "literature", "hypothesis", "prior art", "market research", "keyword"] },
  { id: "process-optimization", name: "Process Optimization", category: "analytical", keywords: ["process", "optimization", "workflow", "automation", "efficiency", "funnel", "pipeline management"] },
  { id: "risk-assessment", name: "Risk Assessment", category: "analytical", keywords: ["risk", "mitigation", "scenario analysis", "loss prevention", "threat model"] },
  // Communication
  { id: "stakeholder-mgmt", name: "Stakeholder Management", category: "communication", keywords: ["stakeholder", "client", "customer", "relationship", "qbr", "onboarding", "correspondence"] },
  { id: "writing-docs", name: "Writing & Documentation", category: "communication", keywords: ["documentation", "writing", "paper", "copy", "editorial", "content", "email", "style guide", "knowledge base"] },
  { id: "presentation", name: "Presentation & Reporting", category: "communication", keywords: ["presentation", "reporting", "board", "pitch", "status report", "materials"] },
  { id: "negotiation", name: "Negotiation & Persuasion", category: "communication", keywords: ["negotiation", "deal", "offer", "closing", "persuasion", "licensing"] },
  // Leadership
  { id: "project-mgmt", name: "Project Management", category: "leadership", keywords: ["project", "sprint", "resource allocation", "planning", "coordination", "launch", "retrospective"] },
  { id: "strategy", name: "Strategy & Planning", category: "leadership", keywords: ["strategy", "roadmap", "positioning", "prioritization", "go-to-market", "planning", "vision"] },
  { id: "team-mgmt", name: "Team Management", category: "leadership", keywords: ["team", "coaching", "talent", "performance review", "culture", "hiring", "people", "employee", "interview"] },
  { id: "vendor-mgmt", name: "Vendor & Supply Chain", category: "leadership", keywords: ["vendor", "supplier", "procurement", "supply chain", "inventory", "logistics", "sourcing"] },
  // Creative
  { id: "design-ux", name: "Design & UX", category: "creative", keywords: ["design", "ux", "wireframe", "prototype", "usability", "visual", "accessibility", "interaction", "animation", "token"] },
  { id: "brand-creative", name: "Brand & Creative", category: "creative", keywords: ["brand", "creative", "identity", "campaign", "concept", "ad copy", "influencer", "community"] },
  { id: "content-seo", name: "Content & SEO", category: "creative", keywords: ["seo", "content", "landing page", "blog", "link building", "social media", "channel"] },
  // Compliance
  { id: "regulatory", name: "Regulatory & Legal", category: "compliance", keywords: ["regulatory", "compliance", "legal", "policy", "filing", "patent", "trademark", "contract", "clause", "redline", "m&a", "litigation", "due diligence"] },
  { id: "audit-control", name: "Audit & Internal Controls", category: "compliance", keywords: ["audit", "reconciliation", "journal", "month-end", "close", "financial statement", "sla"] },
];

/* ── Job templates (50 jobs, same as before) ── */
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
  return matched.length > 0 ? matched : [];
}

/* ── Aggregated skill data ── */
interface AggregatedSkill {
  id: string;
  name: string;
  category: SkillCategory;
  proficiency: number; // avg across all contributing tasks
  jobCount: number;    // how many jobs contribute
  taskCount: number;   // total task evidence
  jobs: { title: string; company: string; taskName: string; score: number }[];
}

interface JobMatch {
  title: string;
  company: string;
  dept: string;
  matchPercent: number;
  matchedSkills: string[];
  gapSkills: string[];
}

function buildTaxonomy(rand: () => number) {
  const skillMap = new Map<string, AggregatedSkill>();

  // Initialize all taxonomy skills
  for (const ts of TAXONOMY) {
    skillMap.set(ts.id, {
      id: ts.id, name: ts.name, category: ts.category,
      proficiency: 0, jobCount: 0, taskCount: 0, jobs: [],
    });
  }

  // Process each job's tasks
  for (const job of JOB_TEMPLATES) {
    for (const taskName of job.tasks) {
      const matchedIds = matchTaskToSkills(taskName);
      for (const skillId of matchedIds) {
        const skill = skillMap.get(skillId)!;
        const score = Math.round(45 + rand() * 50); // 45-95 proficiency
        skill.jobs.push({ title: job.title, company: job.company, taskName, score });
        skill.taskCount++;
      }
    }
  }

  // Finalize
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

function computeJobMatches(skills: AggregatedSkill[], rand: () => number): JobMatch[] {
  return JOB_TEMPLATES.map(job => {
    const jobSkillIds = new Set<string>();
    for (const taskName of job.tasks) {
      for (const id of matchTaskToSkills(taskName)) jobSkillIds.add(id);
    }

    const allIds = Array.from(jobSkillIds);
    const userSkillIds = new Set(skills.filter(s => s.proficiency >= 50).map(s => s.id));
    const matched = allIds.filter(id => userSkillIds.has(id));
    const gaps = allIds.filter(id => !userSkillIds.has(id));

    const matchPercent = allIds.length > 0
      ? Math.round((matched.length / allIds.length) * 100)
      : 0;

    return {
      title: job.title,
      company: job.company,
      dept: job.dept,
      matchPercent,
      matchedSkills: matched.map(id => skills.find(s => s.id === id)?.name || id),
      gapSkills: gaps.map(id => TAXONOMY.find(t => t.id === id)?.name || id),
    };
  }).sort((a, b) => b.matchPercent - a.matchPercent);
}

/* ── Helpers ── */
function profColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}
function profBg(score: number): string {
  if (score >= 80) return "bg-emerald-500/20";
  if (score >= 60) return "bg-amber-500/20";
  return "bg-red-500/20";
}

type ViewMode = "skills" | "matching";

export default function JourneySkillProfileView({ onNavigate }: { onNavigate: (title: string, company: string | null) => void }) {
  const rand = useMemo(() => seeded(2026), []);
  const skills = useMemo(() => buildTaxonomy(rand), [rand]);
  const jobMatches = useMemo(() => computeJobMatches(skills, rand), [skills, rand]);

  const [view, setView] = useState<ViewMode>("skills");
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<SkillCategory | null>(null);
  const [searchQ, setSearchQ] = useState("");

  // Category summaries
  const catSummaries = useMemo(() => {
    const map = new Map<SkillCategory, { count: number; totalProf: number; totalTasks: number }>();
    for (const s of skills) {
      const e = map.get(s.category) || { count: 0, totalProf: 0, totalTasks: 0 };
      e.count++; e.totalProf += s.proficiency; e.totalTasks += s.taskCount;
      map.set(s.category, e);
    }
    return Array.from(map.entries()).map(([cat, e]) => ({
      cat, count: e.count, avg: Math.round(e.totalProf / e.count), tasks: e.totalTasks,
    })).sort((a, b) => b.avg - a.avg);
  }, [skills]);

  const filteredSkills = useMemo(() => {
    let list = filterCat ? skills.filter(s => s.category === filterCat) : [...skills];
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.category.includes(q));
    }
    return list;
  }, [skills, filterCat, searchQ]);

  const filteredMatches = useMemo(() => {
    if (!searchQ) return jobMatches.slice(0, 20);
    const q = searchQ.toLowerCase();
    return jobMatches.filter(j => j.title.toLowerCase().includes(q) || j.dept.toLowerCase().includes(q)).slice(0, 20);
  }, [jobMatches, searchQ]);

  const globalAvg = Math.round(skills.reduce((s, sk) => s + sk.proficiency, 0) / skills.length);

  return (
    <div className="space-y-5">
      {/* View toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView("skills")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${view === "skills" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"}`}
        >
          <Layers className="inline h-3 w-3 mr-1" />Skill Taxonomy
        </button>
        <button
          onClick={() => setView("matching")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${view === "matching" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"}`}
        >
          <Target className="inline h-3 w-3 mr-1" />Job Matching
        </button>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        <div className="rounded-lg bg-muted/30 border border-border/40 p-2.5 text-center">
          <p className="text-sm font-bold text-foreground">{skills.length}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Skills</p>
        </div>
        <div className="rounded-lg bg-muted/30 border border-border/40 p-2.5 text-center">
          <p className="text-sm font-bold text-foreground">50</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Jobs</p>
        </div>
        <div className="rounded-lg bg-muted/30 border border-border/40 p-2.5 text-center">
          <p className={`text-sm font-bold ${profColor(globalAvg)}`}>{globalAvg}%</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Avg Prof.</p>
        </div>
        <div className="rounded-lg bg-muted/30 border border-border/40 p-2.5 text-center hidden sm:block">
          <p className="text-sm font-bold text-foreground">{skills.reduce((s, sk) => s + sk.taskCount, 0)}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Evidence</p>
        </div>
      </div>

      {/* Category bars */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {catSummaries.map(({ cat, count, avg }) => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          const active = filterCat === cat;
          return (
            <button
              key={cat}
              onClick={() => setFilterCat(active ? null : cat)}
              className={`p-2.5 rounded-lg border text-left transition-all ${active ? "bg-primary/10 border-primary/40" : "bg-card border-border/40 hover:border-border/60"}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-medium text-foreground">{meta.label}</span>
                <span className="text-[9px] text-muted-foreground ml-auto">{count}</span>
              </div>
              <Progress value={avg} className="h-1.5" />
              <p className={`text-[10px] mt-1 font-semibold ${profColor(avg)}`}>{avg}%</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder={view === "skills" ? "Search skills..." : "Search jobs..."}
          className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted/30 border border-border/40 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
      </div>

      <AnimatePresence mode="wait">
        {view === "skills" ? (
          <motion.div key="skills" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5">
            {filteredSkills.map(skill => {
              const isOpen = expandedSkill === skill.id;
              const meta = CATEGORY_META[skill.category];
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
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border/30 text-muted-foreground shrink-0">
                          {meta.label}
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
          </motion.div>
        ) : (
          <motion.div key="matching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground mb-2">
              Jobs ranked by how well your unified skill profile matches their requirements.
            </p>
            {filteredMatches.map((job, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => onNavigate(job.title, job.company)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card hover:bg-muted/20 transition-colors text-left"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${profBg(job.matchPercent)} ${profColor(job.matchPercent)}`}>
                  {job.matchPercent}%
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{job.title}</p>
                  <p className="text-[10px] text-muted-foreground">{job.company} · {job.dept}</p>
                  {job.gapSkills.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {job.gapSkills.slice(0, 2).map(g => (
                        <Badge key={g} variant="outline" className="text-[8px] px-1 py-0 border-red-500/30 text-red-400">
                          Gap: {g}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
