import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Loader2, Target, AlertTriangle, Zap, Users, Clock, ExternalLink, BarChart3,
  ChevronRight, BookOpen, Lightbulb, RefreshCw, TrendingDown, Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { type DemoFunnelStats, generateMockFromDB } from "@/data/demo-team-progress";


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

interface QueueItem {
  id: string;
  user_id: string;
  job_title: string;
  task_name: string;
  weak_category: string;
  weak_score: number;
  coaching_tip: string | null;
  attempt_number: number;
  max_attempts: number;
  status: string;
}

const THRESHOLD = 60;

const CATEGORY_LABELS: Record<string, string> = {
  tool_awareness_score: "Tool Awareness",
  human_value_add_score: "Human Value-Add",
  adaptive_thinking_score: "Adaptive Thinking",
  domain_judgment_score: "Domain Judgment",
};

const CATEGORY_KEYS = ["tool_awareness_score", "human_value_add_score", "adaptive_thinking_score", "domain_judgment_score"] as const;

interface EscalatedUser {
  userId: string;
  name: string;
  jobTitle: string;
  dept: string;
  count: number;
  weakCategories: { category: string; score: number; task: string }[];
  sims: ProgressRow[];
}

function scoreColor(s: number) {
  if (s >= 70) return "text-emerald-600";
  if (s >= 40) return "text-amber-500";
  return "text-destructive";
}

function scoreBg(s: number) {
  if (s >= 70) return "bg-emerald-500";
  if (s >= 40) return "bg-amber-500";
  return "bg-destructive";
}

/* ─── Employee Detail Sheet ─── */
function EmployeeSheet({ employee, open, onClose, progress }: {
  employee: EscalatedUser | null;
  open: boolean;
  onClose: () => void;
  progress: ProgressRow[];
}) {
  if (!employee) return null;

  const sims = progress.filter(r => r.user_id === employee.userId);

  const pillarAvg = (key: keyof ProgressRow) => {
    const vals = sims.map(s => s[key]).filter((v): v is number => v != null);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };

  const pillars = CATEGORY_KEYS.map(k => ({
    key: k,
    label: CATEGORY_LABELS[k],
    avg: pillarAvg(k),
  }));

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-sm font-bold text-destructive">
              {employee.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">{employee.name}</p>
              <p className="text-xs text-muted-foreground font-normal">{employee.dept} · {employee.jobTitle}</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* AI Readiness Profile */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" /> AI Readiness Profile
            </p>
            <div className="space-y-3">
              {pillars.map(p => (
                <div key={p.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{p.label}</span>
                    <span className={`text-xs font-semibold ${p.avg != null ? scoreColor(p.avg) : "text-muted-foreground"}`}>
                      {p.avg != null ? `${p.avg}%` : "—"}
                    </span>
                  </div>
                  <Progress value={p.avg ?? 0} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>

          {/* Weak areas detail */}
          {employee.weakCategories.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" /> Areas Below {THRESHOLD}%
              </p>
              <div className="space-y-2">
                {employee.weakCategories.map((wc, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-destructive/5 border border-destructive/10">
                    <div className={`w-2 h-2 rounded-full ${scoreBg(wc.score)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">{CATEGORY_LABELS[wc.category] || wc.category}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{wc.task}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">{wc.score}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Simulation history */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Simulation History ({sims.length})
            </p>
            {sims.length === 0 ? (
              <p className="text-xs text-muted-foreground">No simulations completed yet.</p>
            ) : (
              <div className="space-y-2">
                {sims.map((s, i) => {
                  const pct = s.total_questions > 0 ? Math.round((s.correct_answers / s.total_questions) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-md border border-border">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{s.task_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{s.sim_job_title}</p>
                      </div>
                      <Badge variant={pct >= 70 ? "default" : pct >= 40 ? "secondary" : "destructive"} className="text-[10px]">
                        {pct}%
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recommended actions */}
          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" /> Recommended Actions
            </p>
            <div className="space-y-2">
              {employee.weakCategories.length > 0 && (
                <div className="flex items-start gap-2 p-2.5 rounded-md bg-primary/5 border border-primary/10">
                  <RefreshCw className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Auto-Retry Queued</p>
                    <p className="text-[10px] text-muted-foreground">
                      The adaptive engine has queued retries for {employee.weakCategories.length} weak areas. Employee will see these on their dashboard.
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/50 border border-border">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">Learning Path Available</p>
                  <p className="text-[10px] text-muted-foreground">
                    This employee's role has a personalized learning path with targeted simulations for each task area.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Task Detail Sheet ─── */
function TaskSheet({ task, open, onClose, progress }: {
  task: { name: string; count: number } | null;
  open: boolean;
  onClose: () => void;
  progress: ProgressRow[];
}) {
  if (!task) return null;

  const taskSims = progress.filter(r => r.task_name === task.name);
  const failedUsers: { name: string; dept: string; scores: { cat: string; score: number }[] }[] = [];

  const userMap: Record<string, typeof failedUsers[0]> = {};
  taskSims.forEach(r => {
    CATEGORY_KEYS.forEach(cat => {
      const score = r[cat];
      if (score != null && score < THRESHOLD) {
        if (!userMap[r.user_id]) {
          userMap[r.user_id] = { name: r.display_name, dept: r.department || "Other", scores: [] };
        }
        userMap[r.user_id].scores.push({ cat, score });
      }
    });
  });

  const sorted = Object.values(userMap).sort((a, b) => b.scores.length - a.scores.length);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">{task.name}</p>
              <p className="text-xs text-muted-foreground font-normal">{task.count} employees failed below {THRESHOLD}%</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Which pillars fail most */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Failure by Pillar</p>
            {(() => {
              const pillarCounts: Record<string, number> = {};
              Object.values(userMap).forEach(u => u.scores.forEach(s => {
                pillarCounts[s.cat] = (pillarCounts[s.cat] || 0) + 1;
              }));
              return (
                <div className="space-y-2">
                  {Object.entries(pillarCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                    <div key={cat} className="flex items-center gap-2">
                      <span className="text-xs text-foreground flex-1">{CATEGORY_LABELS[cat]}</span>
                      <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">{count} fails</Badge>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Affected employees */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Affected Employees ({sorted.length})</p>
            <div className="space-y-2">
              {sorted.map((u, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-md border border-border">
                  <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center text-[10px] font-bold text-destructive shrink-0">
                    {u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground">{u.dept}</p>
                  </div>
                  <div className="flex gap-1">
                    {u.scores.map((s, j) => (
                      <Badge key={j} variant="outline" className="text-[9px] px-1 border-destructive/20 text-destructive">
                        {CATEGORY_LABELS[s.cat]?.split(" ")[0]} {s.score}%
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" /> How to Resolve
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2.5 rounded-md bg-primary/5 border border-primary/10">
                <RefreshCw className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">Adaptive Retries Active</p>
                  <p className="text-[10px] text-muted-foreground">
                    Employees who scored below {THRESHOLD}% have been automatically queued for retry simulations with targeted coaching tips.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/50 border border-border">
                <Target className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">Task Simulation</p>
                  <p className="text-[10px] text-muted-foreground">
                    This task has a dedicated simulation in the Learning Path. Employees can practice specifically on this area.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Main Component ─── */
export default function ActionCenter() {
  const { user, openAuthModal } = useAuth();
  const { workspaceId: wsId, loading: wsLoading, isSuperAdmin } = useWorkspace();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EscalatedUser | null>(null);
  const [selectedTask, setSelectedTask] = useState<{ name: string; count: number } | null>(null);

  useEffect(() => {
    if (!user || wsLoading) return;
    if (!wsId) { setLoading(false); return; }
    (async () => {
      setLoading(true);

      const [progressRes, queueRes] = await Promise.all([
        supabase.rpc("get_workspace_progress", { p_workspace_id: wsId }),
        supabase.from("simulation_queue").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      ]);

      const dbRows = (progressRes.data as ProgressRow[] || []).filter(r => r.user_id !== user.id);

      if (isSuperAdmin) {
        const mockData = await generateMockFromDB();
        setProgress([...mockData.progress, ...dbRows]);
      } else {
        setProgress(dbRows);
      }
      setQueue((queueRes.data as QueueItem[]) || []);
      setLoading(false);
    })();
  }, [user, wsId, wsLoading, isSuperAdmin]);

  const metrics = useMemo(() => {
    const taskFailCounts: Record<string, number> = {};
    const userFailMap: Record<string, EscalatedUser> = {};
    let totalBelowThreshold = 0;

    progress.forEach(r => {
      CATEGORY_KEYS.forEach(cat => {
        const score = r[cat];
        if (score != null && score < THRESHOLD) {
          totalBelowThreshold++;
          taskFailCounts[r.task_name] = (taskFailCounts[r.task_name] || 0) + 1;
          if (!userFailMap[r.user_id]) {
            userFailMap[r.user_id] = {
              userId: r.user_id, name: r.display_name, jobTitle: r.job_title,
              dept: r.department || "Other", count: 0, weakCategories: [], sims: [],
            };
          }
          userFailMap[r.user_id].count++;
          userFailMap[r.user_id].weakCategories.push({ category: cat, score, task: r.task_name });
        }
      });
      // Collect sims for each user
      if (userFailMap[r.user_id]) {
        const existing = userFailMap[r.user_id].sims;
        if (!existing.find(s => s.task_name === r.task_name && s.completed_at === r.completed_at)) {
          existing.push(r);
        }
      }
    });

    const bottleneckTasks = Object.entries(taskFailCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([task, count]) => ({ task, count }));

    const escalatedUsers = Object.values(userFailMap)
      .filter(u => u.count >= 3).sort((a, b) => b.count - a.count).slice(0, 15);

    const uniqueUsersWithIssues = Object.keys(userFailMap).length;
    const uniqueUsers = new Set(progress.map(r => r.user_id)).size;

    // Not started: users in workspace but no sims
    const notStarted = Math.max(0, uniqueUsers - new Set(progress.filter(r => r.total_questions > 0).map(r => r.user_id)).size);

    return { bottleneckTasks, escalatedUsers, totalBelowThreshold, uniqueUsersWithIssues, uniqueUsers, notStarted };
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
        <Zap className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Sign In Required</h2>
        <p className="text-sm text-muted-foreground mb-4">Sign in to access the Action Center.</p>
        <Button onClick={() => openAuthModal()}>Sign In</Button>
      </div>
    );
  }

  const hasData = progress.length > 0;

  if (!hasData && !isSuperAdmin) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-foreground">Action Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time interventions for your team.</p>
        </div>
        <div className="py-16 text-center space-y-4">
          <Zap className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <h2 className="text-lg font-semibold text-foreground">No intervention data yet</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Your team needs to complete AI readiness simulations first. Bottleneck tasks and at-risk employees will appear here automatically.
          </p>
          <Button onClick={() => navigate("/hr/team-progress")}>
            <BarChart3 className="h-4 w-4 mr-2" />View Team Progress
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Action Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time interventions — click any item to drill down and see resolution options.</p>
      </div>

      {/* Demo disclaimer (superadmin only) */}
      {isSuperAdmin && (
        <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Demo data.</span> Employee names shown are simulated on real roles from your ATS. Live data appears once team members complete simulations.
          </p>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold text-foreground">{metrics.uniqueUsers}</p>
            <p className="text-[11px] text-muted-foreground">Active Employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto text-destructive mb-1" />
            <p className="text-2xl font-bold text-destructive">{metrics.uniqueUsersWithIssues}</p>
            <p className="text-[11px] text-muted-foreground">Need Attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 mx-auto text-warning mb-1" />
            <p className="text-2xl font-bold text-foreground">{metrics.totalBelowThreshold}</p>
            <p className="text-[11px] text-muted-foreground">Failed Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold text-foreground">{queue.length}</p>
            <p className="text-[11px] text-muted-foreground">Pending Retries</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList>
          <TabsTrigger value="tasks">Bottleneck Tasks</TabsTrigger>
          <TabsTrigger value="people">People at Risk</TabsTrigger>
          <TabsTrigger value="queue">Retry Queue</TabsTrigger>
        </TabsList>

        {/* Bottleneck Tasks tab */}
        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-destructive" />
                <p className="text-sm font-semibold text-foreground">Tasks failing most employees</p>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Click a task to see which employees struggle and how the platform resolves it.</p>
              {metrics.bottleneckTasks.length === 0 ? (
                <p className="text-xs text-success py-4">All tasks above {THRESHOLD}% threshold ✓</p>
              ) : (
                <div className="space-y-1">
                  {metrics.bottleneckTasks.map(({ task, count }) => (
                    <button
                      key={task}
                      onClick={() => setSelectedTask({ name: task, count })}
                      className="flex items-center gap-2.5 w-full p-2.5 rounded-md hover:bg-muted/50 transition-colors text-left group"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                      <span className="text-xs text-foreground flex-1 truncate">{task}</span>
                      <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">{count} fails</Badge>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* People at Risk tab */}
        <TabsContent value="people" className="mt-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <p className="text-sm font-semibold text-foreground">Employees with 3+ weak readiness areas</p>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Click an employee to see their readiness profile, weak areas, and what the platform is doing to help.</p>
              {metrics.escalatedUsers.length === 0 ? (
                <p className="text-xs text-success py-4">No employees flagged ✓</p>
              ) : (
                <div className="space-y-1">
                  {metrics.escalatedUsers.map(u => (
                    <button
                      key={u.userId}
                      onClick={() => setSelectedEmployee(u)}
                      className="flex items-center gap-2.5 w-full p-2.5 rounded-md hover:bg-muted/50 transition-colors text-left group"
                    >
                      <div className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center text-[10px] font-bold text-destructive shrink-0">
                        {u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{u.dept} · {u.jobTitle}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">{u.count} areas</Badge>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retry Queue tab */}
        <TabsContent value="queue" className="mt-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Adaptive Retry Queue</p>
                <Badge variant="secondary" className="text-[10px] ml-auto">{queue.length} pending</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Auto-generated by the adaptive engine when employees score below {THRESHOLD}%. Employees see these as "Recommended Retries" on their dashboard.
              </p>
              {queue.length === 0 ? (
                <p className="text-xs text-success py-4">No pending retries ✓</p>
              ) : (
                <div className="space-y-2">
                  {queue.map(q => (
                    <div key={q.id} className="flex items-center gap-2.5 p-2.5 rounded-md border border-border">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{q.task_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {q.job_title} · {CATEGORY_LABELS[q.weak_category] || q.weak_category} ({q.weak_score}%)
                        </p>
                        {q.coaching_tip && (
                          <p className="text-[10px] text-primary/80 mt-1 truncate">💡 {q.coaching_tip}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        Attempt {q.attempt_number}/{q.max_attempts}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sheets */}
      <EmployeeSheet
        employee={selectedEmployee}
        open={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        progress={progress}
      />
      <TaskSheet
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        progress={progress}
      />
    </div>
  );
}
