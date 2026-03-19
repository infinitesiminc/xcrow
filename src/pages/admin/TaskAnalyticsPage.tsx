import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Brain, TrendingUp, Zap, Users, Target,
  AlertTriangle, Lightbulb, GraduationCap, Shield,
  ArrowUpRight, ArrowDownRight, Minus, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
  ScatterChart, Scatter, ZAxis, Legend,
} from "recharts";

/* ── Types ── */
interface TaskCluster {
  id: string;
  cluster_name: string;
  ai_exposure_score: number | null;
  job_impact_score: number | null;
  ai_state: string | null;
  ai_trend: string | null;
  impact_level: string | null;
  priority: string | null;
  skill_names: string[] | null;
  job_id: string;
}

/* ── Constants ── */
const EXPOSURE_BUCKETS = [
  { label: "0–19", min: 0, max: 19, color: "hsl(var(--brand-human, 150 60% 45%))" },
  { label: "20–39", min: 20, max: 39, color: "hsl(150 40% 50%)" },
  { label: "40–59", min: 40, max: 59, color: "hsl(45 80% 55%)" },
  { label: "60–79", min: 60, max: 79, color: "hsl(25 80% 55%)" },
  { label: "80–100", min: 80, max: 100, color: "hsl(var(--brand-ai, 0 70% 55%))" },
];

const AI_STATE_COLORS: Record<string, string> = {
  mostly_human: "#22c55e",
  human_ai: "#eab308",
  ai_assisted: "#f97316",
  mostly_ai: "#ef4444",
  fully_automated: "#991b1b",
};

const TREND_ICONS: Record<string, typeof ArrowUpRight> = {
  increasing_ai: ArrowUpRight,
  stable: Minus,
  decreasing_ai: ArrowDownRight,
};

/* ── Page ── */
export default function TaskAnalyticsPage() {
  const [tasks, setTasks] = useState<TaskCluster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      let allTasks: TaskCluster[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("job_task_clusters")
          .select("id, cluster_name, ai_exposure_score, job_impact_score, ai_state, ai_trend, impact_level, priority, skill_names, job_id")
          .range(offset, offset + batchSize - 1);

        if (error || !data) { hasMore = false; break; }
        allTasks = [...allTasks, ...(data as TaskCluster[])];
        hasMore = data.length === batchSize;
        offset += batchSize;
      }

      setTasks(allTasks);
      setLoading(false);
    };
    fetchAll();
  }, []);

  /* ── Computed analytics ── */
  const stats = useMemo(() => {
    if (!tasks.length) return null;

    const totalTasks = tasks.length;
    const uniqueJobs = new Set(tasks.map(t => t.job_id)).size;
    const avgExposure = Math.round(tasks.reduce((s, t) => s + (t.ai_exposure_score ?? 50), 0) / totalTasks);
    const avgImpact = Math.round(tasks.reduce((s, t) => s + (t.job_impact_score ?? 50), 0) / totalTasks);

    // Exposure distribution
    const exposureDist = EXPOSURE_BUCKETS.map(b => ({
      ...b,
      count: tasks.filter(t => {
        const s = t.ai_exposure_score ?? 50;
        return s >= b.min && s <= b.max;
      }).length,
    }));

    // AI state distribution
    const stateDist = Object.entries(
      tasks.reduce((acc, t) => {
        const s = t.ai_state || "unknown";
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name: name.replace(/_/g, " "), value, fill: AI_STATE_COLORS[name] || "#888" }))
     .sort((a, b) => b.value - a.value);

    // AI trend distribution
    const trendDist = Object.entries(
      tasks.reduce((acc, t) => {
        const s = t.ai_trend || "unknown";
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }))
     .sort((a, b) => b.value - a.value);

    // Priority distribution
    const priorityDist = Object.entries(
      tasks.reduce((acc, t) => {
        const p = t.priority || "unknown";
        acc[p] = (acc[p] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }))
     .sort((a, b) => b.value - a.value);

    // Impact level distribution
    const impactDist = Object.entries(
      tasks.reduce((acc, t) => {
        const il = t.impact_level || "unknown";
        acc[il] = (acc[il] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }))
     .sort((a, b) => b.value - a.value);

    // Top skills
    const skillCounts: Record<string, number> = {};
    tasks.forEach(t => {
      (t.skill_names || []).forEach(s => { skillCounts[s] = (skillCounts[s] || 0) + 1; });
    });
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([name, count]) => ({ name, count }));

    // Most common task names (top 20)
    const taskNameCounts: Record<string, { count: number; totalExposure: number }> = {};
    tasks.forEach(t => {
      const key = t.cluster_name;
      if (!taskNameCounts[key]) taskNameCounts[key] = { count: 0, totalExposure: 0 };
      taskNameCounts[key].count++;
      taskNameCounts[key].totalExposure += (t.ai_exposure_score ?? 50);
    });
    const topTasks = Object.entries(taskNameCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([name, { count, totalExposure }]) => ({
        name,
        count,
        avgExposure: Math.round(totalExposure / count),
      }));

    // High-risk tasks (exposure >= 70, impact >= 60) — these are learning priorities
    const highRiskHighImpact = tasks.filter(
      t => (t.ai_exposure_score ?? 50) >= 70 && (t.job_impact_score ?? 50) >= 60
    ).length;

    // Human-edge tasks (exposure < 30, impact >= 60) — human advantages
    const humanEdge = tasks.filter(
      t => (t.ai_exposure_score ?? 50) < 30 && (t.job_impact_score ?? 50) >= 60
    ).length;

    // Scatter data for exposure vs impact
    const scatterData = tasks
      .filter((_, i) => i % 3 === 0) // sample every 3rd for perf
      .map(t => ({
        x: t.ai_exposure_score ?? 50,
        y: t.job_impact_score ?? 50,
        name: t.cluster_name,
      }));

    return {
      totalTasks, uniqueJobs, avgExposure, avgImpact,
      exposureDist, stateDist, trendDist, priorityDist, impactDist,
      topSkills, topTasks, highRiskHighImpact, humanEdge, scatterData,
    };
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading task analytics...</span>
      </div>
    );
  }

  if (!stats) return null;

  const insightCards = [
    {
      icon: Brain,
      label: "Total Tasks Analyzed",
      value: stats.totalTasks.toLocaleString(),
      sub: `Across ${stats.uniqueJobs.toLocaleString()} roles`,
      color: "text-primary",
    },
    {
      icon: Zap,
      label: "Avg AI Exposure",
      value: `${stats.avgExposure}%`,
      sub: stats.avgExposure > 55 ? "Above midpoint — AI is transforming most work" : "Below midpoint — many tasks still human-led",
      color: "text-brand-ai",
    },
    {
      icon: Target,
      label: "Avg Job Impact",
      value: `${stats.avgImpact}%`,
      sub: "How critical tasks are to role success",
      color: "text-brand-mid",
    },
    {
      icon: AlertTriangle,
      label: "Urgent Upskill Zone",
      value: stats.highRiskHighImpact.toLocaleString(),
      sub: "High AI exposure + high impact — learning priorities",
      color: "text-destructive",
    },
    {
      icon: Shield,
      label: "Human Edge Tasks",
      value: stats.humanEdge.toLocaleString(),
      sub: "Low AI exposure + high impact — durable advantages",
      color: "text-brand-human",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Task Analytics</h1>
        <p className="text-sm text-muted-foreground">Insights from {stats.totalTasks.toLocaleString()} analyzed tasks to improve the learning journey</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {insightCards.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <c.icon className={`h-4 w-4 mb-2 ${c.color}`} />
                <p className="text-lg font-bold text-foreground tabular-nums">{c.value}</p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{c.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{c.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="distributions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="distributions">Distributions</TabsTrigger>
          <TabsTrigger value="tasks">Top Tasks</TabsTrigger>
          <TabsTrigger value="skills">Skills Map</TabsTrigger>
          <TabsTrigger value="matrix">Impact Matrix</TabsTrigger>
        </TabsList>

        {/* ── Distributions ── */}
        <TabsContent value="distributions" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* AI Exposure Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">AI Exposure Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.exposureDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {stats.exposureDist.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* AI State Pie */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">AI State Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={stats.stateDist} dataKey="value" cx="50%" cy="50%" outerRadius={80} strokeWidth={1} stroke="hsl(var(--background))">
                      {stats.stateDist.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-1">
                  {stats.stateDist.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.fill }} />
                      <span className="capitalize text-foreground">{s.name}</span>
                      <span className="ml-auto text-muted-foreground tabular-nums">{s.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trend distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">AI Trend Direction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.trendDist.map((t, i) => {
                    const pct = Math.round((t.value / stats.totalTasks) * 100);
                    const TrendIcon = TREND_ICONS[t.name.replace(/ /g, "_")] || Minus;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <TrendIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="capitalize text-foreground">{t.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums">{t.value.toLocaleString()} ({pct}%)</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Priority + Impact */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Priority & Impact Levels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Priority</p>
                  <div className="flex gap-2 flex-wrap">
                    {stats.priorityDist.map((p, i) => (
                      <Badge key={i} variant="outline" className="text-xs gap-1">
                        {p.name} <span className="text-muted-foreground tabular-nums">{p.value.toLocaleString()}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Impact Level</p>
                  <div className="flex gap-2 flex-wrap">
                    {stats.impactDist.map((p, i) => (
                      <Badge key={i} variant="outline" className="text-xs gap-1">
                        {p.name} <span className="text-muted-foreground tabular-nums">{p.value.toLocaleString()}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Top Tasks ── */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Most Common Tasks Across All Roles
              </CardTitle>
              <p className="text-xs text-muted-foreground">Tasks that appear most frequently — high-leverage learning content candidates</p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {stats.topTasks.map((t, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                    >
                      <span className="text-xs font-mono text-muted-foreground w-6 text-right shrink-0">#{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground">Appears in {t.count} roles</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold tabular-nums text-foreground">{t.avgExposure}%</p>
                        <p className="text-[9px] text-muted-foreground">avg exposure</p>
                      </div>
                      <ExposureDot score={t.avgExposure} />
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Skills Map ── */}
        <TabsContent value="skills">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                Most Referenced Skills
              </CardTitle>
              <p className="text-xs text-muted-foreground">Skills tagged across all task clusters — curriculum building blocks</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(400, stats.topSkills.length * 28)}>
                <BarChart data={stats.topSkills} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
                    width={160}
                  />
                  <RechartsTooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Impact Matrix ── */}
        <TabsContent value="matrix">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                AI Exposure vs Job Impact Matrix
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Top-right = urgent upskill zone · Bottom-left = safe zone · Top-left = human edge
              </p>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Quadrant labels */}
                <div className="absolute top-2 left-2 text-[9px] text-brand-human font-semibold uppercase tracking-wide z-10">Human Edge</div>
                <div className="absolute top-2 right-2 text-[9px] text-destructive font-semibold uppercase tracking-wide z-10">Urgent Upskill</div>
                <div className="absolute bottom-8 left-2 text-[9px] text-muted-foreground font-semibold uppercase tracking-wide z-10">Low Priority</div>
                <div className="absolute bottom-8 right-2 text-[9px] text-brand-ai font-semibold uppercase tracking-wide z-10">AI Can Handle</div>

                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      type="number" dataKey="x" name="AI Exposure" unit="%"
                      domain={[0, 100]} tick={{ fontSize: 10 }}
                      label={{ value: "AI Exposure →", position: "bottom", fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      type="number" dataKey="y" name="Job Impact" unit="%"
                      domain={[0, 100]} tick={{ fontSize: 10 }}
                      label={{ value: "Job Impact →", angle: -90, position: "left", fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <ZAxis range={[20, 20]} />
                    <RechartsTooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      formatter={(value: any, name: string) => [`${value}%`, name]}
                    />
                    <Scatter data={stats.scatterData} fill="hsl(var(--primary))" opacity={0.35} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actionable Insights */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            Learning Journey Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <Insight
              title="Focus simulations on the Urgent Upskill zone"
              detail={`${stats.highRiskHighImpact.toLocaleString()} tasks have both high AI exposure (≥70%) and high job impact (≥60%). These are where users most need practice adapting to AI.`}
            />
            <Insight
              title="Celebrate Human Edge tasks"
              detail={`${stats.humanEdge.toLocaleString()} tasks are low-AI, high-impact. Frame these as durable career advantages in user messaging.`}
            />
            <Insight
              title={`"${stats.topTasks[0]?.name}" appears in ${stats.topTasks[0]?.count} roles`}
              detail="The most universal tasks should have the highest-quality simulation content since they reach the widest audience."
            />
            <Insight
              title={`Top skill: "${stats.topSkills[0]?.name}" (${stats.topSkills[0]?.count.toLocaleString()} refs)`}
              detail="Consider building dedicated learning modules around the most-referenced skills to maximize content ROI."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Sub-components ── */

function ExposureDot({ score }: { score: number }) {
  const color = score >= 70 ? "bg-destructive" : score >= 40 ? "bg-yellow-500" : "bg-green-500";
  return <div className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />;
}

function Insight({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="p-3 rounded-lg bg-background border border-border/50">
      <p className="font-medium text-foreground text-sm mb-1">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{detail}</p>
    </div>
  );
}
