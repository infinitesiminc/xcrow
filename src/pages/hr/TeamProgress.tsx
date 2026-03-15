import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, Users, CheckCircle2, TrendingUp, BarChart3, Search, Trophy, AlertTriangle, X, Database, Zap, Play, ChevronRight, RefreshCw, Target } from "lucide-react";
import { generateDemoProgress, FUNNEL_STATS } from "@/data/demo-team-progress";

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

const DEMO_PROGRESS = generateDemoProgress();

/* ─── Deployment Funnel ─── */
function DeploymentFunnel() {
  const steps = [
    { label: "Jobs Imported", value: FUNNEL_STATS.jobsImported, icon: Database, color: "bg-primary/10 text-primary" },
    { label: "Jobs Analyzed", value: FUNNEL_STATS.jobsAnalyzed, icon: BarChart3, color: "bg-accent/50 text-foreground" },
    { label: "Roles Activated", value: FUNNEL_STATS.rolesActivated, icon: Zap, color: "bg-warning/10 text-warning" },
    { label: "Employees Started", value: FUNNEL_STATS.employeesStarted, icon: Play, color: "bg-success/10 text-success" },
  ];

  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Deployment Funnel</p>
        <div className="flex items-center gap-1">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const pct = Math.round((step.value / FUNNEL_STATS.jobsImported) * 100);
            return (
              <div key={step.label} className="flex items-center gap-1 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-7 h-7 rounded-md ${step.color} flex items-center justify-center shrink-0`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-foreground leading-tight">{step.value}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{step.label}</p>
                    </div>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground mt-0.5 text-right">{pct}%</p>
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mx-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Stat Card ─── */
function StatCard({ icon: Icon, value, label, color }: {
  icon: React.ElementType; value: string | number; label: string; color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Dept Tabs (scrollable) ─── */
function DeptTabs({ departments, selected, onSelect }: {
  departments: string[]; selected: string; onSelect: (d: string) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
      <button
        onClick={() => onSelect("All")}
        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
          selected === "All"
            ? "bg-foreground text-background"
            : "bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        All Departments
      </button>
      {departments.map(d => (
        <button
          key={d}
          onClick={() => onSelect(d)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
            selected === d
              ? "bg-foreground text-background"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          {d}
        </button>
      ))}
    </div>
  );
}

/* ─── Aggregate: Dept Role Breakdown ─── */
function DeptRoleBreakdown({ progress, selectedDept }: { progress: ProgressRow[]; selectedDept: string }) {
  const filtered = selectedDept === "All" ? progress : progress.filter(r => r.department === selectedDept);

  const roleStats = useMemo(() => {
    const map: Record<string, { count: number; totalScore: number }> = {};
    filtered.forEach(r => {
      const role = r.sim_job_title;
      if (!map[role]) map[role] = { count: 0, totalScore: 0 };
      map[role].count += 1;
      map[role].totalScore += r.total_questions > 0 ? (r.correct_answers / r.total_questions) * 100 : 0;
    });
    return Object.entries(map)
      .map(([role, d]) => ({ role, count: d.count, avg: Math.round(d.totalScore / d.count) }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  const maxCount = roleStats[0]?.count || 1;

  if (roleStats.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No simulation data for this department.</p>;
  }

  return (
    <div className="space-y-2">
      {roleStats.map(({ role, count, avg }) => (
        <div key={role} className="flex items-center gap-3">
          <span className="text-sm text-foreground w-[45%] truncate">{role}</span>
          <Progress value={(count / maxCount) * 100} className="flex-1 h-2" />
          <Badge variant="secondary" className="text-[11px] shrink-0">{count}</Badge>
          <span className={`text-xs font-semibold w-10 text-right ${avg >= 70 ? "text-success" : "text-dot-amber"}`}>{avg}%</span>
        </div>
      ))}
    </div>
  );
}

/* ─── AI Readiness Category Breakdown ─── */
function CategoryBreakdown({ progress, selectedDept }: { progress: ProgressRow[]; selectedDept: string }) {
  const filtered = selectedDept === "All" ? progress : progress.filter(r => r.department === selectedDept);
  
  const categoryAvgs = useMemo(() => {
    const cats = [
      { key: "tool_awareness_score" as const, label: "AI Tool Awareness", icon: "🤖" },
      { key: "human_value_add_score" as const, label: "Human Value-Add", icon: "💡" },
      { key: "adaptive_thinking_score" as const, label: "Adaptive Thinking", icon: "🔄" },
      { key: "domain_judgment_score" as const, label: "Domain Judgment", icon: "🎯" },
    ];

    return cats.map(cat => {
      const scores = filtered
        .map(r => r[cat.key])
        .filter((s): s is number => s != null);
      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const low = scores.length > 0 ? Math.min(...scores) : 0;
      const high = scores.length > 0 ? Math.max(...scores) : 0;
      return { ...cat, avg, low, high, count: scores.length };
    });
  }, [filtered]);

  if (categoryAvgs[0].count === 0) return null;

  const weakest = [...categoryAvgs].sort((a, b) => a.avg - b.avg)[0];
  const strongest = [...categoryAvgs].sort((a, b) => b.avg - a.avg)[0];

  return (
    <div className="space-y-4">
      {/* Insight callout */}
      <div className="bg-accent/50 rounded-lg px-4 py-3 text-xs text-foreground">
        <span className="font-semibold">Insight: </span>
        Your team's strongest area is <span className="font-semibold">{strongest.label}</span> ({strongest.avg}%) 
        and needs the most development in <span className="font-semibold">{weakest.label}</span> ({weakest.avg}%).
      </div>

      {/* Category bars */}
      <div className="space-y-3">
        {categoryAvgs.map(cat => (
          <div key={cat.key} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground flex items-center gap-1.5">
                <span>{cat.icon}</span>
                {cat.label}
              </span>
              <span className={`text-sm font-bold ${cat.avg >= 70 ? "text-success" : cat.avg >= 50 ? "text-dot-amber" : "text-destructive"}`}>
                {cat.avg}%
              </span>
            </div>
            <Progress value={cat.avg} className="h-2.5" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Low: {cat.low}%</span>
              <span>High: {cat.high}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Adaptive Simulation Metrics ─── */
function AdaptiveMetrics({ progress }: { progress: ProgressRow[] }) {
  const THRESHOLD = 60;

  const metrics = useMemo(() => {
    const categories = ["tool_awareness_score", "human_value_add_score", "adaptive_thinking_score", "domain_judgment_score"] as const;
    const catLabels: Record<string, string> = {
      tool_awareness_score: "AI Tool Awareness",
      human_value_add_score: "Human Value-Add",
      adaptive_thinking_score: "Adaptive Thinking",
      domain_judgment_score: "Domain Judgment",
    };

    let totalChecks = 0;
    let belowThreshold = 0;
    const taskFailCounts: Record<string, number> = {};
    const catFailCounts: Record<string, number> = {};
    const userFailCounts: Record<string, { name: string; count: number; jobTitle: string }> = {};

    progress.forEach(r => {
      categories.forEach(cat => {
        const score = r[cat];
        if (score != null) {
          totalChecks++;
          if (score < THRESHOLD) {
            belowThreshold++;
            const taskKey = r.task_name;
            taskFailCounts[taskKey] = (taskFailCounts[taskKey] || 0) + 1;
            catFailCounts[cat] = (catFailCounts[cat] || 0) + 1;
            if (!userFailCounts[r.user_id]) {
              userFailCounts[r.user_id] = { name: r.display_name, count: 0, jobTitle: r.job_title };
            }
            userFailCounts[r.user_id].count++;
          }
        }
      });
    });

    const passRate = totalChecks > 0 ? Math.round(((totalChecks - belowThreshold) / totalChecks) * 100) : 100;

    const bottleneckTasks = Object.entries(taskFailCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([task, count]) => ({ task, count }));

    const weakestCategory = Object.entries(catFailCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => ({ cat: catLabels[cat] || cat, count }))[0];

    const escalatedUsers = Object.values(userFailCounts)
      .filter(u => u.count >= 3)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { passRate, belowThreshold, totalChecks, bottleneckTasks, weakestCategory, escalatedUsers };
  }, [progress]);

  return (
    <Card className="border-warning/20">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="h-4 w-4 text-warning" />
          <p className="text-sm font-semibold text-foreground">Adaptive Simulation Insights</p>
          <Badge variant="secondary" className="text-[10px] ml-auto">{THRESHOLD}% threshold</Badge>
        </div>

        {/* Pass rate + counts */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-accent/30">
            <p className={`text-2xl font-bold ${metrics.passRate >= 70 ? "text-success" : metrics.passRate >= 50 ? "text-dot-amber" : "text-destructive"}`}>
              {metrics.passRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Overall Pass Rate</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-accent/30">
            <p className="text-2xl font-bold text-destructive">{metrics.belowThreshold}</p>
            <p className="text-[10px] text-muted-foreground">Below Threshold</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-accent/30">
            <p className="text-2xl font-bold text-foreground">{metrics.escalatedUsers.length}</p>
            <p className="text-[10px] text-muted-foreground">Need Attention</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bottleneck tasks */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Target className="h-3 w-3" /> Bottleneck Tasks
            </p>
            {metrics.bottleneckTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground">All tasks above threshold ✓</p>
            ) : (
              <div className="space-y-1.5">
                {metrics.bottleneckTasks.map(({ task, count }) => (
                  <div key={task} className="flex items-center gap-2">
                    <span className="text-xs text-foreground flex-1 truncate">{task}</span>
                    <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">{count} fails</Badge>
                  </div>
                ))}
              </div>
            )}
            {metrics.weakestCategory && (
              <div className="mt-3 bg-destructive/5 rounded-md px-3 py-2">
                <p className="text-[11px] text-foreground">
                  <span className="font-semibold">Weakest area:</span> {metrics.weakestCategory.cat} ({metrics.weakestCategory.count} failures)
                </p>
              </div>
            )}
          </div>

          {/* Employees needing attention */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" /> Employees Needing Coaching
            </p>
            {metrics.escalatedUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No employees with 3+ category failures ✓</p>
            ) : (
              <div className="space-y-1.5">
                {metrics.escalatedUsers.map(u => (
                  <div key={u.name} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center text-[10px] font-bold text-destructive shrink-0">
                      {u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.jobTitle}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">{u.count} areas</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Individual: Leaderboard ─── */
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

  // Reset page when filter changes
  useEffect(() => { setPage(0); }, [search, deptFilter]);

  return (
    <div className="space-y-4">
      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="All">All Depts</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[2rem_1fr_auto_4rem_4rem] gap-3 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        <span>#</span>
        <span>Name</span>
        <span>Department</span>
        <span className="text-right">Sims</span>
        <span className="text-right">Score</span>
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {pageUsers.map((u, i) => {
          const rank = page * perPage + i + 1;
          return (
            <button
              key={u.userId}
              onClick={() => onSelect(u)}
              className="w-full grid grid-cols-[2rem_1fr_auto_4rem_4rem] gap-3 items-center px-3 py-2.5 rounded-lg text-left hover:bg-muted/40 transition-colors"
            >
              <span className={`text-xs font-bold ${rank <= 3 ? "text-dot-amber" : "text-muted-foreground"}`}>
                {rank <= 3 ? <Trophy className="h-3.5 w-3.5 inline" /> : rank}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{u.jobTitle}</p>
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0">{u.department}</Badge>
              <span className="text-xs text-foreground text-right">{u.simCount}</span>
              <span className={`text-xs font-semibold text-right ${u.avgScore >= 70 ? "text-success" : "text-dot-amber"}`}>
                {u.avgScore}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">{filtered.length} members</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="h-7 text-xs">
              Prev
            </Button>
            <span className="text-xs text-muted-foreground self-center px-2">
              {page + 1} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="h-7 text-xs">
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Detail Sheet ─── */
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
              <p className="text-xs text-muted-foreground">{user.jobTitle}</p>
            </div>
          </div>
        </SheetHeader>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 pb-4 border-b border-border">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{user.simCount}</p>
            <p className="text-[10px] text-muted-foreground">Simulations</p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-bold ${user.avgScore >= 70 ? "text-success" : "text-dot-amber"}`}>{user.avgScore}%</p>
            <p className="text-[10px] text-muted-foreground">Avg Score</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{user.department}</p>
            <p className="text-[10px] text-muted-foreground">Department</p>
          </div>
        </div>

        {/* AI Readiness per category */}
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
                <span className={`text-xs font-semibold w-8 text-right ${cat.score >= 70 ? "text-success" : cat.score >= 50 ? "text-dot-amber" : "text-destructive"}`}>
                  {cat.score}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Sim history */}
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
                    <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${pct >= 70 ? "text-success" : "text-dot-amber"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{sim.task_name}</p>
                      <p className="text-[11px] text-muted-foreground">{sim.sim_job_title}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${pct >= 70 ? "text-success" : "text-dot-amber"}`}>{pct}%</p>
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
                          <span className={`text-[10px] font-semibold w-7 text-right ${cat.score >= 70 ? "text-success" : cat.score >= 50 ? "text-dot-amber" : "text-destructive"}`}>
                            {cat.score}
                          </span>
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
  const [viewMode, setViewMode] = useState<"aggregate" | "individual">("aggregate");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data: membership } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .eq("role", "admin");

      if (!membership?.length) { setLoading(false); return; }

      const wsId = membership[0].workspace_id;
      const { data: ws } = await supabase
        .from("company_workspaces")
        .select("id, name")
        .eq("id", wsId)
        .single();
      if (ws) setWorkspace(ws);

      const { data: rows } = await supabase.rpc("get_workspace_progress", { p_workspace_id: wsId });
      // Exclude the logged-in admin from the employee list
      const dbRows = (rows as ProgressRow[] || []).filter(r => r.user_id !== user.id);
      setProgress([...DEMO_PROGRESS, ...dbRows]);
      setLoading(false);
    })();
  }, [user]);

  // Compute department list sorted by count
  const departments = useMemo(() => {
    const map: Record<string, number> = {};
    progress.forEach(r => {
      const d = r.department || "Other";
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([d]) => d);
  }, [progress]);

  // Filtered progress for current dept tab
  const filteredProgress = useMemo(() =>
    selectedDept === "All" ? progress : progress.filter(r => r.department === selectedDept)
  , [progress, selectedDept]);

  // Stats for current view
  const stats = useMemo(() => {
    const p = filteredProgress;
    const uniqueUsers = new Set(p.map(r => r.user_id)).size;
    const totalSims = p.length;
    const avgScore = totalSims > 0
      ? Math.round(p.reduce((acc, r) => acc + (r.total_questions > 0 ? (r.correct_answers / r.total_questions) * 100 : 0), 0) / totalSims)
      : 0;

    // Find lowest-scoring department (only for "All" tab)
    let lowestDept = { name: "–", avg: 0 };
    if (selectedDept === "All" && departments.length > 0) {
      const deptAvgs = departments.map(d => {
        const dRows = progress.filter(r => r.department === d);
        const avg = dRows.length > 0
          ? Math.round(dRows.reduce((a, r) => a + (r.total_questions > 0 ? (r.correct_answers / r.total_questions) * 100 : 0), 0) / dRows.length)
          : 0;
        return { name: d, avg };
      });
      lowestDept = deptAvgs.sort((a, b) => a.avg - b.avg)[0];
    }

    return { uniqueUsers, totalSims, avgScore, lowestDept };
  }, [filteredProgress, selectedDept, departments, progress]);

  // User summaries for leaderboard (sorted by sim count desc)
  const userSummaries: UserSummary[] = useMemo(() => {
    const map: Record<string, UserSummary> = {};
    progress.forEach(r => {
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
  }, [progress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{workspace.name}</h1>
          <p className="text-sm text-muted-foreground">Team simulation progress & results</p>
        </div>
        <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("aggregate")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === "aggregate" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Aggregate
          </button>
          <button
            onClick={() => setViewMode("individual")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === "individual" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Individual
          </button>
        </div>
      </div>

      {/* Deployment Funnel — always visible */}
      <DeploymentFunnel />

      {viewMode === "aggregate" ? (
        <>
          {/* Department tabs */}
          <DeptTabs departments={departments} selected={selectedDept} onSelect={setSelectedDept} />

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Users} value={stats.uniqueUsers} label="Members" color="bg-primary/10 text-primary" />
            <StatCard icon={CheckCircle2} value={stats.totalSims} label="Simulations" color="bg-success/10 text-success" />
            <StatCard icon={TrendingUp} value={`${stats.avgScore}%`} label="Avg. Score" color="bg-dot-amber/10 text-dot-amber" />
            {selectedDept === "All" && (
              <StatCard icon={AlertTriangle} value={stats.lowestDept.name} label={`Lowest: ${stats.lowestDept.avg}%`} color="bg-destructive/10 text-destructive" />
            )}
          </div>

          {/* AI Readiness + Role breakdown side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-foreground mb-4">AI Readiness Breakdown</p>
                <CategoryBreakdown progress={progress} selectedDept={selectedDept} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-foreground mb-4">
                  {selectedDept === "All" ? "Roles Across All Departments" : `Roles in ${selectedDept}`}
                </p>
                <DeptRoleBreakdown progress={progress} selectedDept={selectedDept} />
              </CardContent>
            </Card>
          </div>

          {/* Adaptive Simulation Metrics */}
          <AdaptiveMetrics progress={filteredProgress} />
        </>
      ) : (
        <>
          <Leaderboard users={userSummaries} onSelect={setSelectedUser} />
          <UserDetailSheet user={selectedUser} open={!!selectedUser} onClose={() => setSelectedUser(null)} />
        </>
      )}
    </div>
  );
}
