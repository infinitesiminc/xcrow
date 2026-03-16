import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Loader2, Users, CheckCircle2, TrendingUp, BarChart3, Search, Trophy,
  AlertTriangle, Database, Zap, Play, ChevronRight, RefreshCw, Target,
  ArrowUpRight, ArrowDownRight, Minus, Lightbulb, ChevronDown, ChevronUp,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { type DeptTrendData, type DemoFunnelStats, generateMockFromDB } from "@/data/demo-team-progress";

const SUPERADMIN_IDS = [
  "7be41055-be68-4cab-b63c-f3b0c483e6eb",
  "bb10735b-051e-4bb5-918e-931a9c79d0fd",
];
/* ─── Types ─── */
interface ProgressRow {
  user_id: string;
  display_name: string;
  job_title: string;
  task_name: string;
  sim_job_title: string;
  correct_answers: number;
  total_questions: number;
  completed_at: string;
  department: string | null;
  tool_awareness_score?: number;
  human_value_add_score?: number;
  adaptive_thinking_score?: number;
  domain_judgment_score?: number;
}

interface WorkspaceRow { id: string; name: string; }

interface UserSummary {
  userId: string;
  name: string;
  jobTitle: string;
  department: string;
  simCount: number;
  avgScore: number;
  avgToolAwareness: number;
  avgHumanValueAdd: number;
  avgAdaptiveThinking: number;
  avgDomainJudgment: number;
  sims: ProgressRow[];
}

const THRESHOLD = 60;

/* ─── Helpers ─── */
const readinessColor = (score: number) =>
  score >= 70 ? "text-success" : score >= 50 ? "text-brand-mid" : "text-destructive";

const readinessBg = (score: number) =>
  score >= 70 ? "bg-success/15" : score >= 50 ? "bg-brand-mid/15" : "bg-destructive/15";

const DeltaBadge = ({ delta }: { delta: number }) => {
  if (delta > 0) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-success">
      <ArrowUpRight className="h-3 w-3" />+{delta}%
    </span>
  );
  if (delta < 0) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-destructive">
      <ArrowDownRight className="h-3 w-3" />{delta}%
    </span>
  );
  return <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground"><Minus className="h-3 w-3" />0%</span>;
};

/* ─── 1. Executive Brief ─── */
function ExecutiveBrief({ progress, deptTrends, funnel }: { progress: ProgressRow[]; deptTrends: DeptTrendData[]; funnel: DemoFunnelStats }) {
  const brief = useMemo(() => {
    const uniqueUsers = new Set(progress.map(r => r.user_id)).size;
    const allScores = progress.flatMap(r => [
      r.tool_awareness_score, r.human_value_add_score,
      r.adaptive_thinking_score, r.domain_judgment_score,
    ]).filter((v): v is number => v != null);
    const avgReadiness = allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

    const notStarted = funnel.rolesActivated - funnel.employeesStarted;
    const notActivated = funnel.jobsImported - funnel.rolesActivated;

    // Weakest department
    const weakestDept = [...deptTrends].sort((a, b) => a.avgReadiness - b.avgReadiness)[0];
    // Strongest
    const strongestDept = [...deptTrends].sort((a, b) => b.avgReadiness - a.avgReadiness)[0];
    // Most improved
    const mostImproved = [...deptTrends].sort((a, b) => b.delta - a.delta)[0];

    // Org-wide weakest pillar
    const pillars = [
      { key: "tool_awareness_score" as const, label: "Tool Awareness" },
      { key: "human_value_add_score" as const, label: "Human Value-Add" },
      { key: "adaptive_thinking_score" as const, label: "Adaptive Thinking" },
      { key: "domain_judgment_score" as const, label: "Domain Judgment" },
    ].map(p => {
      const scores = progress.map(r => r[p.key]).filter((v): v is number => v != null);
      return { ...p, avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0 };
    }).sort((a, b) => a.avg - b.avg);

    const belowThreshold = allScores.filter(s => s < THRESHOLD).length;
    const passRate = allScores.length > 0 ? Math.round(((allScores.length - belowThreshold) / allScores.length) * 100) : 100;

    // Build actions
    const actions: { text: string; priority: "high" | "medium" | "low"; metric?: string }[] = [];
    if (notStarted > 0) {
      actions.push({ text: `Nudge ${notStarted} employees with activated roles who haven't started training`, priority: "high", metric: `${notStarted} inactive` });
    }
    if (weakestDept && weakestDept.avgReadiness < 55) {
      actions.push({ text: `Prioritize ${weakestDept.dept} — lowest readiness at ${weakestDept.avgReadiness}%`, priority: "high", metric: `${weakestDept.avgReadiness}%` });
    }
    if (pillars[0].avg < 55) {
      actions.push({ text: `Focus org-wide training on ${pillars[0].label} (${pillars[0].avg}% avg)`, priority: "medium", metric: `${pillars[0].avg}%` });
    }
    if (notActivated > 200) {
      actions.push({ text: `Activate ${notActivated} remaining roles to expand coverage beyond ${funnel.jobsImported > 0 ? Math.round((funnel.rolesActivated / funnel.jobsImported) * 100) : 0}%`, priority: "medium", metric: `${notActivated} pending` });
    }
    if (mostImproved && mostImproved.delta > 5) {
      actions.push({ text: `Recognize ${mostImproved.dept} for strongest improvement (+${mostImproved.delta}% this month)`, priority: "low", metric: `+${mostImproved.delta}%` });
    }

    return {
      avgReadiness, uniqueUsers, passRate, weakestDept, strongestDept,
      mostImproved, orgWeakestPillar: pillars[0], actions: actions.slice(0, 4),
    };
  }, [progress, deptTrends]);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <CardContent className="p-6">
        {/* Summary line */}
        <div className="flex items-start gap-4 mb-5">
          <div className="flex-1">
            <p className="text-sm text-foreground leading-relaxed">
              Your organization's <span className="font-semibold">AI readiness score is {brief.avgReadiness}%</span> across {brief.uniqueUsers} active employees
              with a <span className={`font-semibold ${readinessColor(brief.passRate)}`}>{brief.passRate}% pass rate</span>.
              {brief.weakestDept && (
                <> <span className="font-semibold">{brief.weakestDept.dept}</span> needs the most attention
                at {brief.weakestDept.avgReadiness}% readiness.</>
              )}
              {brief.mostImproved && brief.mostImproved.delta > 3 && (
                <> <span className="font-semibold">{brief.mostImproved.dept}</span> improved
                the most this month (+{brief.mostImproved.delta}%).</>
              )}
            </p>
          </div>
          <div className="text-center shrink-0 px-4 py-2 rounded-xl bg-background border border-border">
            <p className={`text-3xl font-bold ${readinessColor(brief.avgReadiness)}`}>{brief.avgReadiness}%</p>
            <p className="text-[10px] text-muted-foreground">Org Readiness</p>
          </div>
        </div>

        {/* Recommended actions */}
        {brief.actions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-3.5 w-3.5 text-warning" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recommended Actions</p>
            </div>
            <div className="space-y-1.5">
              {brief.actions.map((action, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 px-3 rounded-md bg-background/60">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    action.priority === "high" ? "bg-destructive" : action.priority === "medium" ? "bg-warning" : "bg-success"
                  }`} />
                  <span className="text-sm text-foreground flex-1">{action.text}</span>
                  {action.metric && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">{action.metric}</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── 2. Compact Deployment Funnel ─── */
function DeploymentFunnel({ funnel }: { funnel: DemoFunnelStats }) {
  const steps = [
    { label: "Imported", value: funnel.jobsImported, icon: Database },
    { label: "Analyzed", value: funnel.jobsAnalyzed, icon: BarChart3 },
    { label: "Activated", value: funnel.rolesActivated, icon: Zap },
    { label: "Started", value: funnel.employeesStarted, icon: Play },
  ];

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const convRate = i > 0 ? Math.round((step.value / steps[i - 1].value) * 100) : 100;
        return (
          <div key={step.label} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg bg-accent/30">
              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-bold text-foreground leading-none">{step.value}</p>
                <p className="text-[10px] text-muted-foreground">{step.label}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex flex-col items-center shrink-0">
                <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                <span className="text-[9px] text-muted-foreground">{convRate}%</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── 3. Department Scorecard (Heatmap Table) ─── */
function DeptScorecard({ deptTrends, onSelectDept }: {
  deptTrends: DeptTrendData[];
  onSelectDept: (dept: string) => void;
}) {
  const [sortKey, setSortKey] = useState<"employees" | "avgReadiness" | "completionRate" | "delta">("avgReadiness");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    return [...deptTrends].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortDir === "asc" ? diff : -diff;
    });
  }, [deptTrends, sortKey, sortDir]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: typeof sortKey }) => {
    if (sortKey !== field) return null;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 inline ml-0.5" />
      : <ChevronDown className="h-3 w-3 inline ml-0.5" />;
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Department Scorecard</p>
          <Badge variant="secondary" className="text-[10px]">{deptTrends.length} departments</Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] w-[140px]">Department</TableHead>
                <TableHead className="text-[11px] text-center cursor-pointer" onClick={() => toggleSort("employees")}>
                  Team<SortIcon field="employees" />
                </TableHead>
                <TableHead className="text-[11px] text-center cursor-pointer" onClick={() => toggleSort("completionRate")}>
                  Completion<SortIcon field="completionRate" />
                </TableHead>
                <TableHead className="text-[11px] text-center cursor-pointer" onClick={() => toggleSort("avgReadiness")}>
                  Readiness<SortIcon field="avgReadiness" />
                </TableHead>
                <TableHead className="text-[11px] text-center">Weakest Pillar</TableHead>
                <TableHead className="text-[11px] text-center w-[80px]">4-Week Trend</TableHead>
                <TableHead className="text-[11px] text-center cursor-pointer" onClick={() => toggleSort("delta")}>
                  Δ<SortIcon field="delta" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(dept => (
                <TableRow
                  key={dept.dept}
                  className="cursor-pointer"
                  onClick={() => onSelectDept(dept.dept)}
                >
                  <TableCell className="font-medium text-sm text-foreground py-3">{dept.dept}</TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {dept.started}/{dept.employees}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-xs font-semibold ${readinessColor(dept.completionRate)}`}>
                      {dept.completionRate}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${readinessBg(dept.avgReadiness)} ${readinessColor(dept.avgReadiness)}`}>
                      {dept.avgReadiness}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-[11px] text-muted-foreground">{dept.weakestPillar}</span>
                    <span className={`text-[10px] font-semibold ml-1 ${readinessColor(dept.weakestScore)}`}>
                      {dept.weakestScore}%
                    </span>
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="w-[70px] h-[28px] mx-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dept.trend}>
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke={dept.delta >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <DeltaBadge delta={dept.delta} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── 4. AI Readiness Pillars ─── */
function ReadinessPillars({ progress }: { progress: ProgressRow[] }) {
  const cats = useMemo(() => {
    const pillars = [
      { key: "tool_awareness_score" as const, label: "AI Tool Awareness", icon: "🤖" },
      { key: "human_value_add_score" as const, label: "Human Value-Add", icon: "💡" },
      { key: "adaptive_thinking_score" as const, label: "Adaptive Thinking", icon: "🔄" },
      { key: "domain_judgment_score" as const, label: "Domain Judgment", icon: "🎯" },
    ];
    return pillars.map(p => {
      const scores = progress.map(r => r[p.key]).filter((v): v is number => v != null);
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const belowThreshold = scores.filter(s => s < THRESHOLD).length;
      const passRate = scores.length ? Math.round(((scores.length - belowThreshold) / scores.length) * 100) : 100;
      return { ...p, avg, passRate, count: scores.length };
    });
  }, [progress]);

  if (cats[0].count === 0) return null;

  const weakest = [...cats].sort((a, b) => a.avg - b.avg)[0];
  const strongest = [...cats].sort((a, b) => b.avg - a.avg)[0];

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">AI Readiness by Pillar</p>
          <p className="text-[10px] text-muted-foreground">
            Strongest: <span className="font-semibold text-success">{strongest.label}</span> · 
            Weakest: <span className="font-semibold text-destructive">{weakest.label}</span>
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cats.map(cat => (
            <div key={cat.key} className={`p-3 rounded-lg border ${cat === weakest ? "border-destructive/30 bg-destructive/5" : "border-border bg-accent/20"}`}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm">{cat.icon}</span>
                <span className="text-xs text-muted-foreground">{cat.label}</span>
              </div>
              <p className={`text-2xl font-bold ${readinessColor(cat.avg)}`}>{cat.avg}%</p>
              <div className="flex items-center justify-between mt-1">
                <Progress value={cat.avg} className="flex-1 h-1.5 mr-2" />
                <span className="text-[10px] text-muted-foreground">{cat.passRate}% pass</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── 5. Adaptive Insights (compact) ─── */
function AdaptiveInsights({ progress }: { progress: ProgressRow[] }) {
  const metrics = useMemo(() => {
    const categories = ["tool_awareness_score", "human_value_add_score", "adaptive_thinking_score", "domain_judgment_score"] as const;

    const taskFailCounts: Record<string, number> = {};
    const userFailCounts: Record<string, { name: string; count: number; jobTitle: string; dept: string }> = {};

    progress.forEach(r => {
      categories.forEach(cat => {
        const score = r[cat];
        if (score != null && score < THRESHOLD) {
          taskFailCounts[r.task_name] = (taskFailCounts[r.task_name] || 0) + 1;
          if (!userFailCounts[r.user_id]) {
            userFailCounts[r.user_id] = { name: r.display_name, count: 0, jobTitle: r.job_title, dept: r.department || "Other" };
          }
          userFailCounts[r.user_id].count++;
        }
      });
    });

    const bottleneckTasks = Object.entries(taskFailCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([task, count]) => ({ task, count }));

    const escalatedUsers = Object.values(userFailCounts)
      .filter(u => u.count >= 3).sort((a, b) => b.count - a.count).slice(0, 5);

    return { bottleneckTasks, escalatedUsers };
  }, [progress]);

  if (metrics.bottleneckTasks.length === 0 && metrics.escalatedUsers.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Bottleneck tasks */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-destructive" />
            <p className="text-sm font-semibold text-foreground">Bottleneck Tasks</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Tasks where employees most frequently score below {THRESHOLD}%</p>
          {metrics.bottleneckTasks.length === 0 ? (
            <p className="text-xs text-success">All tasks above threshold ✓</p>
          ) : (
            <div className="space-y-2">
              {metrics.bottleneckTasks.map(({ task, count }) => (
                <div key={task} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                  <span className="text-xs text-foreground flex-1 truncate">{task}</span>
                  <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">{count}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employees needing coaching */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <p className="text-sm font-semibold text-foreground">Employees Needing Coaching</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Employees with 3+ readiness categories below threshold</p>
          {metrics.escalatedUsers.length === 0 ? (
            <p className="text-xs text-success">No employees flagged ✓</p>
          ) : (
            <div className="space-y-2">
              {metrics.escalatedUsers.map(u => (
                <div key={u.name} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center text-[10px] font-bold text-destructive shrink-0">
                    {u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{u.dept} · {u.jobTitle}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">{u.count} areas</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── 6. Individual Leaderboard ─── */
function Leaderboard({ users, onSelect }: { users: UserSummary[]; onSelect: (u: UserSummary) => void }) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [page, setPage] = useState(0);
  const perPage = 25;

  const departments = useMemo(() => {
    const set = new Set(users.map(u => u.department));
    return Array.from(set).sort();
  }, [users]);

  const filtered = useMemo(() => {
    let list = users;
    if (deptFilter !== "All") list = list.filter(u => u.department === deptFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.jobTitle.toLowerCase().includes(q));
    }
    return list;
  }, [users, deptFilter, search]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageUsers = filtered.slice(page * perPage, (page + 1) * perPage);

  useEffect(() => { setPage(0); }, [search, deptFilter]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or role..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground">
          <option value="All">All Depts</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-[2rem_1fr_auto_4rem_4rem] gap-3 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        <span>#</span><span>Name</span><span>Department</span><span className="text-right">Sims</span><span className="text-right">Score</span>
      </div>

      <div className="space-y-1">
        {pageUsers.map((u, i) => {
          const rank = page * perPage + i + 1;
          return (
            <button key={u.userId} onClick={() => onSelect(u)} className="w-full grid grid-cols-[2rem_1fr_auto_4rem_4rem] gap-3 items-center px-3 py-2.5 rounded-lg text-left hover:bg-muted/40 transition-colors">
              <span className={`text-xs font-bold ${rank <= 3 ? "text-brand-mid" : "text-muted-foreground"}`}>
                {rank <= 3 ? <Trophy className="h-3.5 w-3.5 inline" /> : rank}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{u.jobTitle}</p>
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0">{u.department}</Badge>
              <span className="text-xs text-foreground text-right">{u.simCount}</span>
              <span className={`text-xs font-semibold text-right ${readinessColor(u.avgScore)}`}>{u.avgScore}%</span>
            </button>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">{filtered.length} members</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="h-7 text-xs">Prev</Button>
            <span className="text-xs text-muted-foreground self-center px-2">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="h-7 text-xs">Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── User Detail Sheet ─── */
function UserDetailSheet({ user, open, onClose }: { user: UserSummary | null; open: boolean; onClose: () => void }) {
  if (!user) return null;
  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <SheetTitle className="text-base">{user.name}</SheetTitle>
              <p className="text-xs text-muted-foreground">{user.jobTitle} · {user.department}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-3 pb-4 border-b border-border">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{user.simCount}</p>
            <p className="text-[10px] text-muted-foreground">Simulations</p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-bold ${readinessColor(user.avgScore)}`}>{user.avgScore}%</p>
            <p className="text-[10px] text-muted-foreground">Avg Score</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{user.department}</p>
            <p className="text-[10px] text-muted-foreground">Department</p>
          </div>
        </div>

        {user.avgToolAwareness > 0 && (
          <div className="pb-4 border-b border-border space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Readiness Profile</p>
            {[
              { label: "🤖 Tool Awareness", score: user.avgToolAwareness },
              { label: "💡 Human Value-Add", score: user.avgHumanValueAdd },
              { label: "🔄 Adaptive Thinking", score: user.avgAdaptiveThinking },
              { label: "🎯 Domain Judgment", score: user.avgDomainJudgment },
            ].map(cat => (
              <div key={cat.label} className="flex items-center gap-2">
                <span className="text-xs text-foreground w-36">{cat.label}</span>
                <Progress value={cat.score} className="flex-1 h-2" />
                <span className={`text-xs font-semibold w-8 text-right ${readinessColor(cat.score)}`}>{cat.score}%</span>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Simulation History</p>
          {user.sims
            .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
            .map((sim, i) => {
              const pct = sim.total_questions > 0 ? Math.round((sim.correct_answers / sim.total_questions) * 100) : 0;
              const hasCategories = sim.tool_awareness_score != null;
              return (
                <div key={i} className="py-3 border-b border-border/50 last:border-0 space-y-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${pct >= 70 ? "text-success" : "text-brand-mid"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{sim.task_name}</p>
                      <p className="text-[11px] text-muted-foreground">{sim.sim_job_title}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${readinessColor(pct)}`}>{pct}%</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(sim.completed_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {hasCategories && (
                    <div className="ml-7 grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {[
                        { label: "Tool Awareness", score: sim.tool_awareness_score! },
                        { label: "Human Value-Add", score: sim.human_value_add_score! },
                        { label: "Adaptive Thinking", score: sim.adaptive_thinking_score! },
                        { label: "Domain Judgment", score: sim.domain_judgment_score! },
                      ].map(cat => (
                        <div key={cat.label} className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-24 truncate">{cat.label}</span>
                          <Progress value={cat.score} className="flex-1 h-1.5" />
                          <span className={`text-[10px] font-semibold w-7 text-right ${readinessColor(cat.score)}`}>{cat.score}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Main Component ─── */
export default function TeamProgress() {
  const { user, openAuthModal } = useAuth();
  const [workspace, setWorkspace] = useState<WorkspaceRow | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"overview" | "individual">("overview");
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [deptTrends, setDeptTrends] = useState<DeptTrendData[]>([]);
  const [funnel, setFunnel] = useState<DemoFunnelStats>({ jobsImported: 0, jobsAnalyzed: 0, rolesActivated: 0, employeesStarted: 0 });

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data: membership } = await supabase
        .from("workspace_members").select("workspace_id")
        .eq("user_id", user.id).eq("role", "admin");

      if (!membership?.length) { setLoading(false); return; }

      const wsId = membership[0].workspace_id;
      const { data: ws } = await supabase
        .from("company_workspaces").select("id, name").eq("id", wsId).single();
      if (ws) setWorkspace(ws);

      // Fetch real workspace progress
      const { data: rows } = await supabase.rpc("get_workspace_progress", { p_workspace_id: wsId });
      const dbRows = (rows as ProgressRow[] || []).filter(r => r.user_id !== user.id);

      // Generate mock data from real DB jobs/clusters
      const mock = await generateMockFromDB();
      setProgress([...mock.progress, ...dbRows]);
      setDeptTrends(mock.trends);
      setFunnel(mock.funnel);
      setLoading(false);
    })();
  }, [user]);

  const filteredProgress = useMemo(() =>
    selectedDept ? progress.filter(r => r.department === selectedDept) : progress
  , [progress, selectedDept]);

  const userSummaries: UserSummary[] = useMemo(() => {
    const source = selectedDept ? filteredProgress : progress;
    const map: Record<string, UserSummary> = {};
    source.forEach(r => {
      if (!map[r.user_id]) {
        map[r.user_id] = {
          userId: r.user_id, name: r.display_name || "Unknown", jobTitle: r.job_title || "",
          department: r.department || "Other", simCount: 0, avgScore: 0,
          avgToolAwareness: 0, avgHumanValueAdd: 0, avgAdaptiveThinking: 0, avgDomainJudgment: 0,
          sims: [],
        };
      }
      map[r.user_id].sims.push(r);
      map[r.user_id].simCount += 1;
    });

    const avgCat = (sims: ProgressRow[], key: keyof ProgressRow) => {
      const vals = sims.map(s => s[key]).filter((v): v is number => v != null);
      return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    };

    return Object.values(map)
      .map(u => ({
        ...u,
        avgScore: Math.round(u.sims.reduce((a, s) => a + (s.total_questions > 0 ? (s.correct_answers / s.total_questions) * 100 : 0), 0) / u.sims.length),
        avgToolAwareness: avgCat(u.sims, "tool_awareness_score"),
        avgHumanValueAdd: avgCat(u.sims, "human_value_add_score"),
        avgAdaptiveThinking: avgCat(u.sims, "adaptive_thinking_score"),
        avgDomainJudgment: avgCat(u.sims, "domain_judgment_score"),
      }))
      .sort((a, b) => b.simCount - a.simCount || b.avgScore - a.avgScore);
  }, [progress, filteredProgress, selectedDept]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Sign In Required</h2>
        <p className="text-sm text-muted-foreground mb-4">Sign in to view your team's progress.</p>
        <Button onClick={() => openAuthModal()}>Sign In</Button>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-8 text-center">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">No Workspace Found</h2>
        <p className="text-sm text-muted-foreground mb-4">Create a workspace first to start tracking your team's progress.</p>
        <Button onClick={() => window.location.href = "/hr/settings"}>Create Workspace</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">{workspace.name}</h1>
        <p className="text-sm text-muted-foreground">
          AI readiness program overview
          {selectedDept && (
            <> · Filtered: <Badge variant="secondary" className="text-[10px] ml-1">{selectedDept}
              <button onClick={() => setSelectedDept(null)} className="ml-1 hover:text-foreground">×</button>
            </Badge></>
          )}
        </p>
      </div>

      {/* Demo data disclaimer */}
      <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Demo data.</span> Employee names and scores shown here are simulated for demonstration purposes on real roles imported from your ATS. Actual employee results will appear once team members complete their AI readiness simulations.
        </p>
      </div>

      <Tabs defaultValue="executive" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="executive">Executive Brief</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="readiness">Readiness Pillars</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
        </TabsList>

        <TabsContent value="executive" className="space-y-5 mt-4">
          <ExecutiveBrief progress={progress} deptTrends={deptTrends} funnel={funnel} />
          <DeploymentFunnel funnel={funnel} />
          <AdaptiveInsights progress={filteredProgress} />
        </TabsContent>

        <TabsContent value="departments" className="space-y-5 mt-4">
          <DeptScorecard deptTrends={deptTrends} onSelectDept={(d) => {
            setSelectedDept(d);
          }} />
        </TabsContent>

        <TabsContent value="readiness" className="space-y-5 mt-4">
          <ReadinessPillars progress={filteredProgress} />
        </TabsContent>

        <TabsContent value="people" className="space-y-5 mt-4">
          <Leaderboard users={userSummaries} onSelect={setSelectedUser} />
          <UserDetailSheet user={selectedUser} open={!!selectedUser} onClose={() => setSelectedUser(null)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
