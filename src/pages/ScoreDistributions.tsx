import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart3, ArrowLeft, Loader2, Layers, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface JobRow {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  augmented_percent: number | null;
}

interface TaskRow {
  cluster_name: string;
  ai_exposure_score: number | null;
  job_id: string;
}

const BUCKETS = [
  { label: "0–20%", min: 0, max: 20 },
  { label: "21–40%", min: 21, max: 40 },
  { label: "41–60%", min: 41, max: 60 },
  { label: "61–80%", min: 61, max: 80 },
  { label: "81–100%", min: 81, max: 100 },
];

function bucketize(values: number[]) {
  return BUCKETS.map(b => ({
    ...b,
    count: values.filter(v => v >= b.min && v <= b.max).length,
  }));
}

function BarChartVisual({ data, maxCount, label }: { data: ReturnType<typeof bucketize>; maxCount: number; label: string }) {
  const barColors = [
    "bg-success",
    "bg-success/70",
    "bg-warning",
    "bg-warning/80",
    "bg-destructive",
  ];

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">{label}</p>
      <div className="space-y-2">
        {data.map((bucket, i) => {
          const pct = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;
          return (
            <motion.div
              key={bucket.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3"
            >
              <span className="text-xs text-muted-foreground w-16 text-right tabular-nums shrink-0">{bucket.label}</span>
              <div className="flex-1 h-7 rounded bg-secondary/50 overflow-hidden relative">
                <motion.div
                  className={`h-full rounded ${barColors[i]}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
                />
              </div>
              <span className="text-xs font-bold text-foreground w-8 tabular-nums">{bucket.count}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function ScoreDistributions() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Only fetch jobs that actually have task clusters (truly analyzed)
      // Fetch ALL task clusters (default limit is 1000, we need more)
      let allTaskRows: TaskRow[] = [];
      let from = 0;
      const PAGE_SIZE = 1000;
      while (true) {
        const { data: batch } = await supabase
          .from("job_task_clusters")
          .select("job_id, cluster_name, ai_exposure_score")
          .range(from, from + PAGE_SIZE - 1);
        if (!batch || batch.length === 0) break;
        allTaskRows = allTaskRows.concat(batch as TaskRow[]);
        if (batch.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      const taskRows = allTaskRows;
      const analyzedIds = [...new Set(taskRows.map(t => t.job_id))] as string[];

      let analyzedJobs: JobRow[] = [];
      if (analyzedIds.length > 0) {
        const { data } = await supabase
          .from("jobs")
          .select("id, title, department, augmented_percent")
          .in("id", analyzedIds);
        analyzedJobs = data || [];
      }

      setJobs(analyzedJobs);
      setTasks(taskRows as TaskRow[]);
      setLoading(false);
    })();
  }, []);

  // Per-job task variance map
  const jobVariance = useMemo(() => {
    const map = new Map<string, { min: number; max: number; spread: number; count: number }>();
    const grouped = new Map<string, number[]>();
    tasks.forEach(t => {
      if (!grouped.has(t.job_id)) grouped.set(t.job_id, []);
      grouped.get(t.job_id)!.push(t.ai_exposure_score ?? 50);
    });
    grouped.forEach((scores, jobId) => {
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      map.set(jobId, { min, max, spread: max - min, count: scores.length });
    });
    return map;
  }, [tasks]);

  const jobScores = useMemo(() => jobs.map(j => j.augmented_percent ?? 0), [jobs]);
  const taskScores = useMemo(() => tasks.map(t => t.ai_exposure_score ?? 50), [tasks]);

  const jobBuckets = useMemo(() => bucketize(jobScores), [jobScores]);
  const taskBuckets = useMemo(() => bucketize(taskScores), [taskScores]);

  const jobMax = Math.max(...jobBuckets.map(b => b.count), 1);
  const taskMax = Math.max(...taskBuckets.map(b => b.count), 1);

  // Department breakdown
  const departments = useMemo(() => {
    const map = new Map<string, number[]>();
    jobs.forEach(j => {
      const dept = j.department || "Other";
      if (!map.has(dept)) map.set(dept, []);
      map.get(dept)!.push(j.augmented_percent ?? 0);
    });
    return Array.from(map.entries())
      .map(([name, scores]) => ({
        name,
        count: scores.length,
        avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [jobs]);

  const avgJob = useMemo(() => jobScores.length ? Math.round(jobScores.reduce((a, b) => a + b, 0) / jobScores.length) : 0, [jobScores]);
  const avgTask = useMemo(() => taskScores.length ? Math.round(taskScores.reduce((a, b) => a + b, 0) / taskScores.length) : 0, [taskScores]);

  const sortedJobs = useMemo(() => [...jobs].sort((a, b) => (b.augmented_percent ?? 0) - (a.augmented_percent ?? 0)), [jobs]);
  const sortedScores = useMemo(() => [...jobScores].sort((a, b) => a - b), [jobScores]);
  const medianJob = useMemo(() => sortedScores.length ? sortedScores[Math.floor(sortedScores.length / 2)] : 0, [sortedScores]);
  const minJob = useMemo(() => sortedScores.length ? sortedScores[0] : 0, [sortedScores]);
  const maxJob = useMemo(() => sortedScores.length ? sortedScores[sortedScores.length - 1] : 0, [sortedScores]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        <Button variant="ghost" size="sm" onClick={() => navigate("/products/simulation-builder")} className="gap-1.5 text-xs mb-4 -ml-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Roles
        </Button>

        <div className="mb-8">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">AI Exposure Distributions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Score distributions across {jobs.length} analyzed jobs and {tasks.length} task clusters
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Jobs Analyzed", value: jobs.length, icon: Briefcase },
            { label: "Task Clusters", value: tasks.length, icon: Layers },
            { label: "Avg Job Exposure", value: `${avgJob}%`, icon: BarChart3 },
            { label: "Avg Task Exposure", value: `${avgTask}%`, icon: BarChart3 },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border">
                <CardContent className="p-4">
                  <s.icon className="h-4 w-4 text-muted-foreground mb-1" />
                  <div className="text-2xl font-bold text-foreground">{s.value}</div>
                  <div className="text-[11px] text-muted-foreground">{s.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all" className="gap-1.5 text-xs">
              <BarChart3 className="w-3.5 h-3.5" /> All Jobs
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-1.5 text-xs">
              <Briefcase className="w-3.5 h-3.5" /> Distribution
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1.5 text-xs">
              <Layers className="w-3.5 h-3.5" /> Task-Level
            </TabsTrigger>
            <TabsTrigger value="departments" className="gap-1.5 text-xs">
              By Department
            </TabsTrigger>
          </TabsList>

          {/* ═══ ALL JOBS RANKED ═══ */}
          <TabsContent value="all">
            <Card className="border-border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    All {sortedJobs.length} Jobs — Sorted by AI Exposure
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-success inline-block" /> 0-39%</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-warning inline-block" /> 40-69%</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-destructive inline-block" /> 70-100%</span>
                    <span className="border-l border-border pl-3">±spread</span>
                  </div>
                </div>
                <div className="space-y-[1px]">
                  {sortedJobs.map((j, i) => {
                    const score = j.augmented_percent ?? 0;
                    const barColor = score >= 70 ? "bg-destructive" : score >= 40 ? "bg-warning" : "bg-success";
                    const isHovered = hoveredJobId === j.id;
                    const variance = jobVariance.get(j.id);
                    const lowVariance = variance && variance.spread < 10;
                    return (
                      <motion.div
                        key={j.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i * 0.008, 0.5) }}
                        className="flex items-center gap-2 group cursor-pointer"
                        onMouseEnter={() => setHoveredJobId(j.id)}
                        onMouseLeave={() => setHoveredJobId(null)}
                        onClick={() => navigate(`/learning-path?jobId=${j.id}`)}
                      >
                        <span className={`text-[10px] w-[180px] truncate shrink-0 transition-colors ${isHovered ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                          {j.title.replace(/^\s+/, "")}
                        </span>
                        <div className="flex-1 h-2 rounded-sm bg-secondary/30 overflow-hidden relative">
                          <motion.div
                            className={`h-full rounded-sm ${barColor} ${isHovered ? "opacity-100" : "opacity-80"}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 0.4, delay: Math.min(i * 0.008, 0.5) }}
                          />
                          {isHovered && (
                            <span className="absolute inset-0 flex items-center justify-end pr-1.5 text-[9px] font-bold text-foreground">
                              {score}%
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] tabular-nums w-8 text-right shrink-0 ${isHovered ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                          {score}%
                        </span>
                        <span className={`text-[9px] tabular-nums w-12 text-right shrink-0 ${lowVariance ? "text-destructive font-bold" : "text-muted-foreground/60"}`} title={variance ? `Tasks: ${variance.min}%–${variance.max}% (${variance.count} tasks)` : ""}>
                          ±{variance?.spread ?? 0}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
                {/* Average line label */}
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Average AI Exposure: <span className="font-bold text-foreground">{avgJob}%</span></span>
                  <span>Median: <span className="font-bold text-foreground">{medianJob}%</span></span>
                  <span>Range: <span className="font-bold text-foreground">{minJob}%–{maxJob}%</span></span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border">
                <CardContent className="p-6">
                  <BarChartVisual data={jobBuckets} maxCount={jobMax} label="AI Exposure Distribution — Jobs" />
                  <p className="text-[11px] text-muted-foreground mt-4">
                    Average: <span className="font-bold text-foreground">{avgJob}%</span> across {jobs.length} jobs
                  </p>
                </CardContent>
              </Card>

              {/* Top/bottom jobs */}
              <div className="space-y-4">
                <Card className="border-border">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Highest AI Exposure</p>
                    <div className="space-y-1.5">
                      {sortedJobs.slice(0, 5).map(j => (
                        <div key={j.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate text-foreground">{j.title.replace(/^\s+/, "")}</span>
                          <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[11px] shrink-0">{j.augmented_percent}%</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Lowest AI Exposure</p>
                    <div className="space-y-1.5">
                      {[...sortedJobs].reverse().slice(0, 5).map(j => (
                        <div key={j.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate text-foreground">{j.title.replace(/^\s+/, "")}</span>
                          <Badge className="bg-success/10 text-success border-success/20 text-[11px] shrink-0">{j.augmented_percent}%</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border">
                <CardContent className="p-6">
                  <BarChartVisual data={taskBuckets} maxCount={taskMax} label="AI Exposure Distribution — Tasks" />
                  <p className="text-[11px] text-muted-foreground mt-4">
                    Average: <span className="font-bold text-foreground">{avgTask}%</span> across {tasks.length} tasks
                  </p>
                </CardContent>
              </Card>

              {/* Top tasks */}
              <Card className="border-border">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Highest AI Exposure Tasks</p>
                  <div className="space-y-1.5">
                    {[...tasks].sort((a, b) => (b.ai_exposure_score ?? 50) - (a.ai_exposure_score ?? 50)).slice(0, 10).map((t, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-foreground">{t.cluster_name}</span>
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[11px] shrink-0">{t.ai_exposure_score}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="departments">
            <div className="space-y-3">
              {departments.map((dept, i) => {
                const barColor = dept.avg >= 60 ? "bg-destructive" : dept.avg >= 40 ? "bg-warning" : "bg-success";
                return (
                  <motion.div key={dept.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm font-medium text-foreground">{dept.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">{dept.count} jobs</span>
                          </div>
                          <span className="text-sm font-bold text-foreground">{dept.avg}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${barColor}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${dept.avg}%` }}
                            transition={{ duration: 0.6, delay: 0.1 + i * 0.03 }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
