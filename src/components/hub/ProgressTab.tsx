import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Eye, Zap, Compass, ArrowRight, Sparkles, ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface CompletedSim {
  id: string;
  task_name: string;
  job_title: string;
  company: string | null;
  correct_answers: number;
  total_questions: number;
  completed_at: string;
}

interface AnalysisEntry {
  id: string;
  job_title: string;
  company: string | null;
  tasks_count: number;
  augmented_percent: number;
  analyzed_at: string;
}

/* ── Large-scale mock data: 40 jobs, 100+ tasks ── */
const ROLE_TASKS: { role: string; company: string | null; tasks: { name: string; score: number }[] }[] = [
  { role: "Product Manager", company: "Stripe", tasks: [
    { name: "Write product requirements", score: 85 }, { name: "Prioritize feature backlog", score: 72 },
    { name: "Stakeholder presentation", score: 68 }, { name: "Competitive analysis", score: 90 },
  ]},
  { role: "Data Analyst", company: null, tasks: [
    { name: "Analyze user funnel data", score: 95 }, { name: "Create SQL dashboards", score: 88 },
    { name: "A/B test analysis", score: 76 }, { name: "Build data models", score: 82 },
  ]},
  { role: "Software Engineer", company: "Vercel", tasks: [
    { name: "Write API documentation", score: 92 }, { name: "Code review pull requests", score: 85 },
    { name: "Debug production issues", score: 78 }, { name: "Design system architecture", score: 70 },
  ]},
  { role: "Marketing Manager", company: "HubSpot", tasks: [
    { name: "Build campaign brief", score: 65 }, { name: "Channel attribution modeling", score: 58 },
    { name: "Content calendar planning", score: 74 },
  ]},
  { role: "UX Designer", company: "Figma", tasks: [
    { name: "Design user onboarding flow", score: 45 }, { name: "Usability testing", score: 62 },
    { name: "Create design system tokens", score: 71 },
  ]},
  { role: "Content Strategist", company: null, tasks: [
    { name: "SEO content audit", score: 42 }, { name: "Editorial calendar management", score: 55 },
  ]},
  { role: "Financial Analyst", company: "Goldman Sachs", tasks: [
    { name: "Build financial models", score: 88 }, { name: "Variance analysis reporting", score: 79 },
    { name: "Cash flow forecasting", score: 83 },
  ]},
  { role: "HR Manager", company: "Deel", tasks: [
    { name: "Design compensation bands", score: 60 }, { name: "Employee engagement survey", score: 72 },
    { name: "Performance review calibration", score: 55 },
  ]},
  { role: "Sales Engineer", company: "Datadog", tasks: [
    { name: "Technical demo preparation", score: 91 }, { name: "POC scoping", score: 84 },
    { name: "RFP response drafting", score: 76 },
  ]},
  { role: "DevOps Engineer", company: "GitLab", tasks: [
    { name: "CI/CD pipeline setup", score: 87 }, { name: "Infrastructure as code", score: 79 },
  ]},
  { role: "Project Manager", company: "Asana", tasks: [
    { name: "Risk assessment matrix", score: 73 }, { name: "Sprint retrospective facilitation", score: 68 },
    { name: "Resource allocation planning", score: 61 },
  ]},
  { role: "Customer Success Manager", company: "Gainsight", tasks: [
    { name: "Quarterly business reviews", score: 82 }, { name: "Churn risk identification", score: 75 },
  ]},
  { role: "Business Analyst", company: "McKinsey", tasks: [
    { name: "Process mapping", score: 78 }, { name: "Requirements elicitation", score: 85 },
    { name: "Gap analysis documentation", score: 70 },
  ]},
  { role: "Operations Manager", company: "Amazon", tasks: [
    { name: "Supply chain optimization", score: 66 }, { name: "SLA monitoring", score: 72 },
  ]},
  { role: "Compliance Officer", company: "JPMorgan", tasks: [
    { name: "Regulatory change assessment", score: 80 }, { name: "Policy drafting", score: 74 },
  ]},
  { role: "Technical Writer", company: null, tasks: [
    { name: "API reference docs", score: 90 }, { name: "User guide creation", score: 85 },
  ]},
  { role: "Data Engineer", company: "Snowflake", tasks: [
    { name: "ETL pipeline design", score: 83 }, { name: "Data quality checks", score: 77 },
    { name: "Schema migration planning", score: 69 },
  ]},
  { role: "QA Engineer", company: null, tasks: [
    { name: "Test plan creation", score: 76 }, { name: "Regression test automation", score: 68 },
  ]},
  { role: "Growth Manager", company: "Notion", tasks: [
    { name: "Activation funnel optimization", score: 73 }, { name: "Referral program design", score: 60 },
  ]},
  { role: "Brand Strategist", company: "Nike", tasks: [
    { name: "Brand positioning framework", score: 55 }, { name: "Competitive brand audit", score: 62 },
  ]},
  { role: "Security Analyst", company: "CrowdStrike", tasks: [{ name: "Threat modeling", score: 81 }] },
  { role: "Machine Learning Engineer", company: "OpenAI", tasks: [{ name: "Model evaluation pipeline", score: 74 }, { name: "Feature engineering", score: 69 }] },
  { role: "Account Executive", company: "Salesforce", tasks: [{ name: "Discovery call frameworks", score: 78 }, { name: "Proposal creation", score: 70 }] },
  { role: "Product Designer", company: "Linear", tasks: [{ name: "Interaction design specs", score: 82 }] },
  { role: "Recruiter", company: "Greenhouse", tasks: [{ name: "Sourcing strategy", score: 63 }] },
  { role: "Tax Advisor", company: "Deloitte", tasks: [{ name: "Tax provision calculations", score: 71 }] },
  { role: "Legal Ops Manager", company: null, tasks: [{ name: "Contract lifecycle management", score: 67 }] },
  { role: "Copywriter", company: "Jasper", tasks: [{ name: "Ad copy A/B testing", score: 58 }] },
  { role: "Event Manager", company: null, tasks: [{ name: "Event logistics planning", score: 64 }] },
  { role: "Partnerships Manager", company: "Shopify", tasks: [{ name: "Partner program design", score: 72 }] },
  { role: "Solutions Architect", company: "AWS", tasks: [{ name: "Architecture design review", score: 86 }] },
  { role: "Procurement Manager", company: null, tasks: [{ name: "Vendor evaluation matrix", score: 69 }] },
  { role: "Investment Analyst", company: "Blackrock", tasks: [{ name: "Portfolio risk analysis", score: 77 }] },
  { role: "Scrum Master", company: null, tasks: [{ name: "Agile ceremony facilitation", score: 71 }] },
  { role: "Support Engineer", company: "Zendesk", tasks: [{ name: "Escalation workflow design", score: 65 }] },
  { role: "Research Scientist", company: "DeepMind", tasks: [{ name: "Experiment design", score: 88 }] },
  { role: "Social Media Manager", company: null, tasks: [{ name: "Community engagement strategy", score: 56 }] },
  { role: "Chief of Staff", company: null, tasks: [{ name: "Executive briefing preparation", score: 80 }] },
  { role: "Supply Chain Analyst", company: "Flexport", tasks: [{ name: "Demand forecasting", score: 73 }] },
  { role: "Sustainability Manager", company: null, tasks: [{ name: "ESG reporting framework", score: 61 }] },
];

function buildMockData() {
  const analyses: AnalysisEntry[] = [];
  const completions: CompletedSim[] = [];
  let simId = 0;
  const baseDate = new Date("2026-03-17T10:00:00Z");

  for (let r = 0; r < ROLE_TASKS.length; r++) {
    const rt = ROLE_TASKS[r];
    const analysisDate = new Date(baseDate.getTime() - r * 86400000 * 0.7);
    analyses.push({
      id: `ma-${r}`, job_title: rt.role, company: rt.company,
      tasks_count: rt.tasks.length + Math.floor(Math.random() * 5),
      augmented_percent: 40 + Math.floor(Math.random() * 45),
      analyzed_at: analysisDate.toISOString(),
    });

    for (const t of rt.tasks) {
      simId++;
      const completedDate = new Date(analysisDate.getTime() + Math.random() * 3600000 * 4);
      completions.push({
        id: `ms-${simId}`, task_name: t.name, job_title: rt.role, company: rt.company,
        correct_answers: Math.round(t.score / 20), total_questions: 5,
        completed_at: completedDate.toISOString(),
      });
    }
  }
  return { analyses, completions };
}

const MOCK = buildMockData();

/* ── Types ── */
interface Recommendation {
  jobTitle: string;
  company: string | null;
  matchScore: number;
  reason: string;
  tag: "interest" | "skill" | "growth";
}

interface RoleGroup {
  role: string;
  company: string | null;
  avgScore: number;
  taskCount: number;
  sessions: number;
  tasks: { name: string; score: number; sessions: number }[];
}

function generateRecommendations(
  interestMap: { jobTitle: string; practiced: boolean; practiceCount: number }[],
  roleGroups: RoleGroup[],
): Recommendation[] {
  const recs: Recommendation[] = [];
  const strong = roleGroups.filter(g => g.avgScore >= 75).slice(0, 3);
  const weak = roleGroups.filter(g => g.avgScore > 0 && g.avgScore < 55).slice(0, 2);

  const adjacentRoles: Record<string, { title: string; company: string; reason: string }[]> = {
    "product manager": [{ title: "Product Operations Manager", company: "Notion", reason: "Your product skills transfer directly" }],
    "data analyst": [{ title: "Analytics Engineer", company: "dbt Labs", reason: "Strong data fundamentals — this role builds on them" }],
    "software engineer": [{ title: "Platform Engineer", company: "Vercel", reason: "Your code review & architecture skills are a natural fit" }],
    "financial analyst": [{ title: "FP&A Manager", company: "Stripe", reason: "Your modeling & forecasting scores are well above average" }],
    "sales engineer": [{ title: "Solutions Architect", company: "AWS", reason: "Your demo & scoping skills translate perfectly" }],
    "business analyst": [{ title: "Strategy Consultant", company: "Bain", reason: "Strong process & requirements skills map to consulting" }],
    "technical writer": [{ title: "Developer Advocate", company: "Vercel", reason: "Top documentation skills + API knowledge = great fit" }],
    "research scientist": [{ title: "Applied ML Engineer", company: "Anthropic", reason: "Experiment design strength pairs well with production ML" }],
  };

  for (const s of strong) {
    const adj = adjacentRoles[s.role.toLowerCase()];
    if (adj) {
      for (const a of adj) {
        recs.push({ jobTitle: a.title, company: a.company, matchScore: 80 + Math.floor(Math.random() * 12), reason: a.reason, tag: "skill" });
      }
    }
  }

  const viewedOnly = interestMap.filter(i => !i.practiced);
  for (const v of viewedOnly.slice(0, 2)) {
    recs.push({ jobTitle: v.jobTitle, company: null, matchScore: 68 + Math.floor(Math.random() * 10), reason: "You explored this role — try practicing to see how your skills match", tag: "interest" });
  }

  for (const w of weak) {
    recs.push({ jobTitle: w.role, company: null, matchScore: 58 + Math.floor(Math.random() * 10), reason: `Improving your ${w.tasks[0]?.name || "skills"} would unlock stronger opportunities`, tag: "growth" });
  }

  return recs.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
}

const TAG_STYLES: Record<string, string> = {
  skill: "border-success/30 text-success",
  interest: "border-primary/30 text-primary",
  growth: "border-warning/30 text-warning",
};
const TAG_LABELS: Record<string, string> = {
  skill: "Skills match",
  interest: "Based on interest",
  growth: "Growth opportunity",
};

export default function ProgressTab({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const [completions, setCompletions] = useState<CompletedSim[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [showAllInterests, setShowAllInterests] = useState(false);

  useEffect(() => {
    (async () => {
      const [simRes, analysisRes] = await Promise.all([
        supabase.from("completed_simulations")
          .select("id, task_name, job_title, company, correct_answers, total_questions, completed_at")
          .eq("user_id", userId).order("completed_at", { ascending: false }),
        supabase.from("analysis_history")
          .select("id, job_title, company, tasks_count, augmented_percent, analyzed_at")
          .eq("user_id", userId).order("analyzed_at", { ascending: false }),
      ]);

      const realC = (simRes.data as CompletedSim[]) || [];
      const realA = (analysisRes.data as AnalysisEntry[]) || [];
      const useMock = realC.length < 3 && realA.length < 3;
      setCompletions(useMock ? MOCK.completions : realC);
      setAnalyses(useMock ? MOCK.analyses : realA);
      setLoading(false);
    })();
  }, [userId]);

  /* ── Interest Map ── */
  const interestMap = useMemo(() => {
    const map = new Map<string, {
      jobTitle: string; company: string | null;
      viewed: boolean; practiced: boolean; practiceCount: number; lastActivity: string;
    }>();

    for (const a of analyses) {
      const key = a.job_title.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { jobTitle: a.job_title, company: a.company, viewed: true, practiced: false, practiceCount: 0, lastActivity: a.analyzed_at });
      }
    }

    for (const c of completions) {
      const key = c.job_title.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.practiced = true;
        existing.practiceCount += 1;
        if (c.completed_at > existing.lastActivity) existing.lastActivity = c.completed_at;
      } else {
        map.set(key, { jobTitle: c.job_title, company: c.company, viewed: false, practiced: true, practiceCount: 1, lastActivity: c.completed_at });
      }
    }

    return Array.from(map.values()).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }, [analyses, completions]);

  const interestSummary = useMemo(() => {
    const practiced = interestMap.filter(i => i.practiced);
    const viewedOnly = interestMap.filter(i => !i.practiced);
    return { practiced, viewedOnly, total: interestMap.length };
  }, [interestMap]);

  /* ── Skill Map: grouped by role ── */
  const roleGroups = useMemo(() => {
    const map = new Map<string, RoleGroup>();

    for (const c of completions) {
      const key = c.job_title.toLowerCase();
      const score = c.total_questions > 0 ? Math.round((c.correct_answers / c.total_questions) * 100) : 0;

      if (!map.has(key)) {
        map.set(key, { role: c.job_title, company: c.company, avgScore: 0, taskCount: 0, sessions: 0, tasks: [] });
      }

      const group = map.get(key)!;
      group.sessions += 1;

      const existingTask = group.tasks.find(t => t.name === c.task_name);
      if (existingTask) {
        existingTask.score = Math.max(existingTask.score, score); // best score
        existingTask.sessions += 1;
      } else {
        group.tasks.push({ name: c.task_name, score, sessions: 1 });
        group.taskCount += 1;
      }
    }

    // Calculate avg score per group
    for (const g of map.values()) {
      g.avgScore = g.tasks.length > 0 ? Math.round(g.tasks.reduce((s, t) => s + t.score, 0) / g.tasks.length) : 0;
      g.tasks.sort((a, b) => b.score - a.score);
    }

    return Array.from(map.values()).sort((a, b) => b.avgScore - a.avgScore);
  }, [completions]);

  const totalTasks = useMemo(() => roleGroups.reduce((s, g) => s + g.taskCount, 0), [roleGroups]);
  const overallAvg = useMemo(() => {
    if (roleGroups.length === 0) return null;
    return Math.round(roleGroups.reduce((s, g) => s + g.avgScore, 0) / roleGroups.length);
  }, [roleGroups]);

  const recommendations = useMemo(
    () => generateRecommendations(interestMap, roleGroups),
    [interestMap, roleGroups]
  );

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 text-primary animate-spin" /></div>;
  }

  if (interestMap.length === 0 && roleGroups.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Compass className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">Explore roles and practice tasks to build your maps.</p>
          <Button size="sm" onClick={() => navigate("/")}>Explore Roles</Button>
        </CardContent>
      </Card>
    );
  }

  const goToRole = (jobTitle: string, company: string | null) => {
    const params = new URLSearchParams({ title: jobTitle });
    if (company) params.set("company", company);
    navigate(`/analysis?${params.toString()}`);
  };

  const scoreColor = (s: number) => s >= 75 ? "text-success" : s >= 50 ? "text-warning" : "text-destructive";
  const barColor = (s: number) => s >= 75 ? "bg-success" : s >= 50 ? "bg-warning" : "bg-destructive";

  const displayedInterests = showAllInterests ? interestMap : interestMap.slice(0, 12);

  return (
    <div className="space-y-6">
      {/* ── Interest Map: compact pill layout ── */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Eye className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Interest Map</h2>
          <Badge variant="secondary" className="text-[10px]">{interestSummary.total} roles</Badge>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success" /> {interestSummary.practiced.length} practiced
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/30" /> {interestSummary.viewedOnly.length} viewed only
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {displayedInterests.map((item, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.015 }}
              onClick={() => goToRole(item.jobTitle, item.company)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs transition-all hover:shadow-md cursor-pointer border ${
                item.practiced
                  ? "bg-success/10 border-success/20 text-foreground hover:border-success/40"
                  : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              <span className="truncate max-w-[140px]">{item.jobTitle}</span>
              {item.practiced && (
                <span className="text-[9px] text-success font-medium">{item.practiceCount}</span>
              )}
            </motion.button>
          ))}
        </div>

        {interestMap.length > 12 && (
          <button
            onClick={() => setShowAllInterests(!showAllInterests)}
            className="text-[11px] text-primary hover:underline mt-2 flex items-center gap-1"
          >
            {showAllInterests ? "Show less" : `+${interestMap.length - 12} more roles`}
            <ChevronDown className={`h-3 w-3 transition-transform ${showAllInterests ? "rotate-180" : ""}`} />
          </button>
        )}
      </section>

      {/* ── Skill Map: grouped by role, expandable ── */}
      {roleGroups.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-warning" />
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Skill Map</h2>
            <Badge variant="secondary" className="text-[10px]">{totalTasks} tasks · {roleGroups.length} roles</Badge>
            {overallAvg !== null && (
              <Badge variant="outline" className={`text-[10px] ${scoreColor(overallAvg)}`}>Avg {overallAvg}%</Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">Tap a role to see individual task scores.</p>

          <div className="space-y-1.5">
            {roleGroups.map((group, gi) => {
              const isExpanded = expandedRole === group.role;
              return (
                <motion.div
                  key={group.role}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.02 }}
                >
                  <Card className={`transition-colors ${isExpanded ? "border-primary/20" : ""}`}>
                    {/* Role header row */}
                    <button
                      onClick={() => setExpandedRole(isExpanded ? null : group.role)}
                      className="w-full text-left"
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{group.role}</p>
                            <span className="text-[10px] text-muted-foreground shrink-0">{group.taskCount} task{group.taskCount !== 1 ? "s" : ""}</span>
                          </div>
                          {group.company && <p className="text-[10px] text-muted-foreground">{group.company}</p>}
                        </div>

                        {/* Mini bar */}
                        <div className="flex items-center gap-2 w-28 shrink-0">
                          <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${barColor(group.avgScore)}`} style={{ width: `${group.avgScore}%` }} />
                          </div>
                          <span className={`text-xs font-bold w-8 text-right ${scoreColor(group.avgScore)}`}>{group.avgScore}%</span>
                        </div>

                        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                      </CardContent>
                    </button>

                    {/* Expanded task list */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 pt-0 space-y-1 border-t border-border/30">
                            {group.tasks.map((task, ti) => (
                              <div key={ti} className="flex items-center gap-3 py-1.5">
                                <p className="text-[12px] text-foreground flex-1 truncate pl-2">{task.name}</p>
                                <div className="flex items-center gap-2 w-24 shrink-0">
                                  <Progress value={task.score} className="h-1 flex-1" />
                                  <span className={`text-[11px] font-semibold w-7 text-right ${scoreColor(task.score)}`}>{task.score}%</span>
                                </div>
                                <span className="text-[9px] text-muted-foreground w-6 text-right">{task.sessions}×</span>
                              </div>
                            ))}
                            <button
                              onClick={() => goToRole(group.role, group.company)}
                              className="text-[11px] text-primary hover:underline flex items-center gap-1 pt-1 pl-2"
                            >
                              View full analysis <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Job Recommendations ── */}
      {recommendations.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Recommended for You</h2>
            <Badge variant="secondary" className="text-[10px]">{recommendations.length} matches</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">Based on your interests and practice scores.</p>

          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                <Card
                  className="cursor-pointer hover:border-primary/30 transition-all group hover:shadow-md"
                  onClick={() => goToRole(rec.jobTitle, rec.company)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground truncate">{rec.jobTitle}</p>
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 shrink-0 ${TAG_STYLES[rec.tag]}`}>
                            {TAG_LABELS[rec.tag]}
                          </Badge>
                        </div>
                        {rec.company && <p className="text-[11px] text-muted-foreground mb-1">{rec.company}</p>}
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{rec.reason}</p>
                      </div>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="relative w-11 h-11">
                          <svg viewBox="0 0 36 36" className="w-11 h-11 -rotate-90">
                            <circle cx="18" cy="18" r="15" fill="none" className="stroke-muted/20" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15" fill="none"
                              className={rec.matchScore >= 80 ? "stroke-success" : rec.matchScore >= 65 ? "stroke-primary" : "stroke-warning"}
                              strokeWidth="3"
                              strokeDasharray={`${(rec.matchScore / 100) * 94.2} 94.2`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-foreground">{rec.matchScore}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground">match</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
