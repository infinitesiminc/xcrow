/**
 * Visualization 5: Skill Proficiency Profile
 * Mock 50 analyzed jobs, all tasks practiced, plotting proficiency across 4 pillars.
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronRight, Trophy, TrendingUp, AlertTriangle, Sparkles } from "lucide-react";

/* ── Seeded RNG ── */
function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

/* ── Mock data types ── */
interface MockTask {
  name: string;
  toolAwareness: number;
  humanValueAdd: number;
  adaptiveThinking: number;
  domainJudgment: number;
  avgScore: number;
}

interface MockJob {
  title: string;
  company: string;
  department: string;
  tasks: MockTask[];
  avgProficiency: number;
  pillars: { tool: number; human: number; adaptive: number; domain: number };
}

/* ── 50 realistic jobs ── */
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

const PILLARS = [
  { key: "tool" as const, label: "Tool Awareness", icon: Sparkles, color: "hsl(var(--primary))" },
  { key: "human" as const, label: "Human Value-Add", icon: Trophy, color: "hsl(var(--chart-2))" },
  { key: "adaptive" as const, label: "Adaptive Thinking", icon: TrendingUp, color: "hsl(var(--chart-3))" },
  { key: "domain" as const, label: "Domain Judgment", icon: AlertTriangle, color: "hsl(var(--chart-4))" },
];

const DEPT_ORDER = ["Engineering", "Product", "Data", "Design", "Marketing", "Finance", "Sales", "Legal", "Operations", "People", "Security", "Customer Success", "Risk", "Strategy", "Research"];

function generateMockJobs(): MockJob[] {
  const rand = seeded(2026);
  return JOB_TEMPLATES.map(tpl => {
    // Archetype-based scoring for variety
    const archetype = Math.floor(rand() * 6);
    const baseByPillar = () => {
      switch (archetype) {
        case 0: return { tool: 75 + rand() * 20, human: 55 + rand() * 20, adaptive: 60 + rand() * 20, domain: 65 + rand() * 15 };
        case 1: return { tool: 50 + rand() * 25, human: 75 + rand() * 20, adaptive: 70 + rand() * 15, domain: 60 + rand() * 20 };
        case 2: return { tool: 60 + rand() * 20, human: 60 + rand() * 20, adaptive: 78 + rand() * 18, domain: 55 + rand() * 20 };
        case 3: return { tool: 55 + rand() * 15, human: 50 + rand() * 20, adaptive: 55 + rand() * 20, domain: 80 + rand() * 15 };
        case 4: return { tool: 70 + rand() * 15, human: 70 + rand() * 15, adaptive: 70 + rand() * 15, domain: 70 + rand() * 15 };
        default: return { tool: 40 + rand() * 25, human: 45 + rand() * 25, adaptive: 42 + rand() * 25, domain: 48 + rand() * 25 };
      }
    };
    const base = baseByPillar();
    const clamp = (v: number) => Math.min(98, Math.max(20, Math.round(v)));

    const tasks: MockTask[] = tpl.tasks.map(taskName => {
      const jitter = () => (rand() - 0.5) * 20;
      const t = clamp(base.tool + jitter());
      const h = clamp(base.human + jitter());
      const a = clamp(base.adaptive + jitter());
      const d = clamp(base.domain + jitter());
      return {
        name: taskName,
        toolAwareness: t,
        humanValueAdd: h,
        adaptiveThinking: a,
        domainJudgment: d,
        avgScore: Math.round((t + h + a + d) / 4),
      };
    });

    const avg = (key: keyof Pick<MockTask, "toolAwareness" | "humanValueAdd" | "adaptiveThinking" | "domainJudgment">) =>
      Math.round(tasks.reduce((s, t) => s + t[key], 0) / tasks.length);

    const pillars = { tool: avg("toolAwareness"), human: avg("humanValueAdd"), adaptive: avg("adaptiveThinking"), domain: avg("domainJudgment") };

    return {
      title: tpl.title,
      company: tpl.company,
      department: tpl.dept,
      tasks,
      avgProficiency: Math.round((pillars.tool + pillars.human + pillars.adaptive + pillars.domain) / 4),
      pillars,
    };
  });
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500/20 border-emerald-500/30";
  if (score >= 60) return "bg-amber-500/20 border-amber-500/30";
  return "bg-red-500/20 border-red-500/30";
}

type SortKey = "proficiency" | "tool" | "human" | "adaptive" | "domain" | "department";

export default function JourneySkillProfileView({ onNavigate }: { onNavigate: (title: string, company: string | null) => void }) {
  const jobs = useMemo(() => generateMockJobs(), []);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<SortKey>("proficiency");
  const [filterDept, setFilterDept] = useState<string | null>(null);

  const departments = useMemo(() => [...new Set(jobs.map(j => j.department))].sort((a, b) => {
    const ai = DEPT_ORDER.indexOf(a), bi = DEPT_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  }), [jobs]);

  const filtered = useMemo(() => {
    let list = filterDept ? jobs.filter(j => j.department === filterDept) : [...jobs];
    switch (sortBy) {
      case "tool": list.sort((a, b) => b.pillars.tool - a.pillars.tool); break;
      case "human": list.sort((a, b) => b.pillars.human - a.pillars.human); break;
      case "adaptive": list.sort((a, b) => b.pillars.adaptive - a.pillars.adaptive); break;
      case "domain": list.sort((a, b) => b.pillars.domain - a.pillars.domain); break;
      case "department": list.sort((a, b) => a.department.localeCompare(b.department)); break;
      default: list.sort((a, b) => b.avgProficiency - a.avgProficiency);
    }
    return list;
  }, [jobs, sortBy, filterDept]);

  // Aggregate stats
  const globalPillars = useMemo(() => ({
    tool: Math.round(jobs.reduce((s, j) => s + j.pillars.tool, 0) / jobs.length),
    human: Math.round(jobs.reduce((s, j) => s + j.pillars.human, 0) / jobs.length),
    adaptive: Math.round(jobs.reduce((s, j) => s + j.pillars.adaptive, 0) / jobs.length),
    domain: Math.round(jobs.reduce((s, j) => s + j.pillars.domain, 0) / jobs.length),
  }), [jobs]);

  const totalTasks = jobs.reduce((s, j) => s + j.tasks.length, 0);
  const avgProf = Math.round(jobs.reduce((s, j) => s + j.avgProficiency, 0) / jobs.length);

  const toggle = (i: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  // Dept summary
  const deptSummary = useMemo(() => {
    const map = new Map<string, { count: number; totalProf: number; pillars: { tool: number; human: number; adaptive: number; domain: number } }>();
    for (const j of jobs) {
      const e = map.get(j.department) || { count: 0, totalProf: 0, pillars: { tool: 0, human: 0, adaptive: 0, domain: 0 } };
      e.count++;
      e.totalProf += j.avgProficiency;
      e.pillars.tool += j.pillars.tool;
      e.pillars.human += j.pillars.human;
      e.pillars.adaptive += j.pillars.adaptive;
      e.pillars.domain += j.pillars.domain;
      map.set(j.department, e);
    }
    return Array.from(map.entries()).map(([dept, e]) => ({
      dept,
      count: e.count,
      avg: Math.round(e.totalProf / e.count),
      pillars: {
        tool: Math.round(e.pillars.tool / e.count),
        human: Math.round(e.pillars.human / e.count),
        adaptive: Math.round(e.pillars.adaptive / e.count),
        domain: Math.round(e.pillars.domain / e.count),
      },
    })).sort((a, b) => b.avg - a.avg);
  }, [jobs]);

  return (
    <div className="space-y-6">
      {/* Global stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: "Jobs", value: jobs.length },
          { label: "Tasks", value: totalTasks },
          { label: "Avg Prof.", value: `${avgProf}%` },
          { label: "Tool", value: `${globalPillars.tool}%` },
          { label: "Human", value: `${globalPillars.human}%` },
          { label: "Adaptive", value: `${globalPillars.adaptive}%` },
        ].map(s => (
          <div key={s.label} className="rounded-lg bg-muted/30 border border-border/40 p-2.5 text-center">
            <p className="text-sm font-bold text-foreground">{s.value}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 4-pillar overview bars */}
      <div className="grid grid-cols-2 gap-3">
        {PILLARS.map(p => {
          const val = globalPillars[p.key];
          const Icon = p.icon;
          return (
            <motion.div
              key={p.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 rounded-lg bg-card border border-border/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">{p.label}</span>
                <span className={`ml-auto text-sm font-bold ${scoreColor(val)}`}>{val}%</span>
              </div>
              <Progress value={val} className="h-2" />
            </motion.div>
          );
        })}
      </div>

      {/* Dept summary strip */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">By Department</h3>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterDept(null)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition-all ${
              filterDept === null ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted/20 border-border/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({jobs.length})
          </button>
          {deptSummary.map(d => (
            <button
              key={d.dept}
              onClick={() => setFilterDept(filterDept === d.dept ? null : d.dept)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition-all ${
                filterDept === d.dept ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted/20 border-border/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {d.dept} ({d.count}) · {d.avg}%
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">Sort:</span>
        {([
          { key: "proficiency", label: "Overall" },
          { key: "tool", label: "Tool" },
          { key: "human", label: "Human" },
          { key: "adaptive", label: "Adaptive" },
          { key: "domain", label: "Domain" },
          { key: "department", label: "Dept" },
        ] as { key: SortKey; label: string }[]).map(s => (
          <button
            key={s.key}
            onClick={() => setSortBy(s.key)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
              sortBy === s.key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Job list */}
      <div className="space-y-1.5">
        {filtered.map((job, i) => {
          const origIdx = jobs.indexOf(job);
          const isOpen = expanded.has(origIdx);
          return (
            <motion.div
              key={origIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.015, 0.5) }}
            >
              <button
                onClick={() => toggle(origIdx)}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-all text-left group"
              >
                {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{job.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{job.company} · {job.department}</p>
                </div>
                {/* Mini pillar bars */}
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  {PILLARS.map(p => (
                    <div key={p.key} className="w-10 flex flex-col items-center gap-0.5">
                      <span className={`text-[8px] font-bold ${scoreColor(job.pillars[p.key])}`}>{job.pillars[p.key]}</span>
                      <div className="w-full h-1 rounded-full bg-muted/40 overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60" style={{ width: `${job.pillars[p.key]}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 ${scoreBg(job.avgProficiency)} ${scoreColor(job.avgProficiency)}`}>
                  {job.avgProficiency}
                </div>
              </button>

              {/* Expanded task detail */}
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="ml-5 mt-1 mb-2 space-y-1"
                >
                  {/* Pillar bars for mobile */}
                  <div className="sm:hidden grid grid-cols-2 gap-1.5 mb-2">
                    {PILLARS.map(p => (
                      <div key={p.key} className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-muted-foreground w-14 truncate">{p.label.split(" ")[0]}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                          <div className="h-full rounded-full bg-primary/60" style={{ width: `${job.pillars[p.key]}%` }} />
                        </div>
                        <span className={`font-bold ${scoreColor(job.pillars[p.key])}`}>{job.pillars[p.key]}</span>
                      </div>
                    ))}
                  </div>

                  {job.tasks.map(task => (
                    <div
                      key={task.name}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/20 border border-border/30 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => onNavigate(job.title, job.company)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-foreground truncate">{task.name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[
                          { v: task.toolAwareness, l: "T" },
                          { v: task.humanValueAdd, l: "H" },
                          { v: task.adaptiveThinking, l: "A" },
                          { v: task.domainJudgment, l: "D" },
                        ].map(s => (
                          <div key={s.l} className="text-center w-7">
                            <p className={`text-[8px] font-bold ${scoreColor(s.v)}`}>{s.v}</p>
                            <p className="text-[7px] text-muted-foreground">{s.l}</p>
                          </div>
                        ))}
                      </div>
                      <Badge variant="outline" className={`text-[9px] shrink-0 ${scoreBg(task.avgScore)} ${scoreColor(task.avgScore)}`}>
                        {task.avgScore}%
                      </Badge>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
