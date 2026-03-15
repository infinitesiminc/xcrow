import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Zap, ArrowRight, Layers, Brain,
  GraduationCap, Play, ClipboardCheck, Users, Target,
  Sparkles, Clock, Search, MapPin, Briefcase,
  AlertTriangle, TrendingUp, Shield, Loader2,
  ChevronDown, ChevronUp, Award, BookOpen,
  CheckCircle2, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import SimulatorModal from "@/components/SimulatorModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

/* ── Types ── */
interface DbJob {
  id: string;
  title: string;
  department: string | null;
  seniority: string | null;
  location: string | null;
  augmented_percent: number | null;
  automation_risk_percent: number | null;
  new_skills_percent: number | null;
  description: string | null;
}

interface EnrichedTask {
  id: string;
  cluster_name: string;
  description: string | null;
  outcome: string | null;
  skill_names: string[] | null;
  sort_order: number | null;
  ai_state?: string;
  ai_trend?: string;
  impact_level?: string;
  recommended_template?: string;
  priority?: string;
  sim_duration?: number;
}

interface CompletedSim {
  task_name: string;
  correct_answers: number;
  total_questions: number;
  job_title: string;
}

/* ── Templates ── */
const templates = [
  {
    id: "quick-pulse",
    name: "Quick Pulse",
    duration: "~3 min",
    useCase: "Upskilling",
    icon: Zap,
    color: "bg-dot-teal/10 text-dot-teal border-dot-teal/20",
    description: "Rapid-fire MCQs on a single task.",
    stages: ["5 MCQs"],
  },
  {
    id: "deep-dive",
    name: "Deep Dive",
    duration: "~15 min",
    useCase: "L&D Programs",
    icon: GraduationCap,
    color: "bg-dot-blue/10 text-dot-blue border-dot-blue/20",
    description: "Briefing → MCQs → Open Response.",
    stages: ["Briefing", "MCQ ×8", "Open Response"],
  },
  {
    id: "case-challenge",
    name: "Case Challenge",
    duration: "~30 min",
    useCase: "Assessment",
    icon: ClipboardCheck,
    color: "bg-dot-purple/10 text-dot-purple border-dot-purple/20",
    description: "Multi-step deliverable + rubric.",
    stages: ["Scenario Brief", "Deliverable", "Rubric"],
  },
  {
    id: "full-panel",
    name: "Full Panel",
    duration: "~60 min",
    useCase: "Staffing",
    icon: Users,
    color: "bg-dot-amber/10 text-dot-amber border-dot-amber/20",
    description: "Multi-cluster timed assessment.",
    stages: ["Cluster ×3", "Timed", "Composite"],
  },
];

const templateMap = Object.fromEntries(templates.map(t => [t.id, t]));

/* ── Helpers ── */
function stateIcon(state?: string) {
  if (state === "mostly_ai") return <Brain className="h-3.5 w-3.5 text-dot-purple" />;
  if (state === "human_ai") return <TrendingUp className="h-3.5 w-3.5 text-dot-amber" />;
  return <Shield className="h-3.5 w-3.5 text-dot-teal" />;
}

function stateLabel(s?: string) {
  if (s === "mostly_ai") return "Mostly AI";
  if (s === "human_ai") return "Human + AI";
  return "Mostly Human";
}

function priorityBadge(p?: string) {
  if (p === "critical") return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[9px]">Critical</Badge>;
  if (p === "important") return <Badge className="bg-warning/10 text-warning border-warning/20 text-[9px]">Important</Badge>;
  return <Badge className="bg-success/10 text-success border-success/20 text-[9px]">Helpful</Badge>;
}

function riskBadge(pct: number | null) {
  if (pct == null) return null;
  if (pct >= 60) return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">{pct}% risk</Badge>;
  if (pct >= 35) return <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px]">{pct}% risk</Badge>;
  return <Badge className="bg-success/10 text-success border-success/20 text-[10px]">{pct}% risk</Badge>;
}

function scoreBadge(score: number) {
  if (score >= 70) return <Badge className="bg-success/10 text-success border-success/20 text-[9px]">{score}%</Badge>;
  if (score >= 40) return <Badge className="bg-warning/10 text-warning border-warning/20 text-[9px]">{score}%</Badge>;
  return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[9px]">{score}%</Badge>;
}

export default function SimulationBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  /* ── State ── */
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<DbJob | null>(null);
  const [companyName, setCompanyName] = useState("Anthropic");
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Task analysis
  const [analyzedTasks, setAnalyzedTasks] = useState<EnrichedTask[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Progress tracking
  const [completedSims, setCompletedSims] = useState<CompletedSim[]>([]);

  // Bulk analyze
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ analyzed: number; total: number; remaining: number } | null>(null);
  const [bulkErrors, setBulkErrors] = useState(0);
  const [bulkSessionStart, setBulkSessionStart] = useState<number | null>(null);
  const [bulkPaused, setBulkPaused] = useState<string | null>(null); // reason for pause

  // Simulator modal
  const [simOpen, setSimOpen] = useState(false);
  const [simTask, setSimTask] = useState("");
  const [simTaskState, setSimTaskState] = useState<string | undefined>();
  const [simTaskTrend, setSimTaskTrend] = useState<string | undefined>();
  const [simTaskImpact, setSimTaskImpact] = useState<string | undefined>();

  // Learning path expanded
  const [expandedPath, setExpandedPath] = useState(true);
  const [collapsedDepts, setCollapsedDepts] = useState<Set<string>>(new Set());
  const [analyzedJobIds, setAnalyzedJobIds] = useState<Set<string>>(new Set());

  /* ── Fetch Anthropic jobs ── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name")
        .ilike("name", "%anthropic%")
        .limit(1);
      if (!companies?.length) { setLoading(false); return; }
      setCompanyId(companies[0].id);
      setCompanyName(companies[0].name);

      const { data } = await supabase
        .from("jobs")
        .select("id, title, department, seniority, location, augmented_percent, automation_risk_percent, new_skills_percent, description")
        .eq("company_id", companies[0].id)
        .order("title");
      setJobs(data || []);
      setLoading(false);
    })();
  }, []);

  /* ── Fetch which jobs are pre-analyzed ── */
  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const { data } = await supabase
        .from("job_task_clusters")
        .select("job_id")
        .limit(10000);
      if (data) {
        setAnalyzedJobIds(new Set(data.map(d => d.job_id)));
      }
    })();
  }, [companyId, bulkProgress]); // re-fetch after bulk runs

  /* ── Fetch user's completed sims ── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("completed_simulations")
        .select("task_name, correct_answers, total_questions, job_title")
        .eq("user_id", user.id);
      setCompletedSims(data || []);
    })();
  }, [user, simOpen]); // re-fetch when sim modal closes

  /* ── Auto-analyze when job selected ── */
  const analyzeJob = useCallback(async (job: DbJob) => {
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalyzedTasks([]);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-role-tasks", {
        body: {
          jobId: job.id,
          jobTitle: job.title,
          company: companyName,
          description: job.description,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const tasks = (data.tasks || []).map((t: any) => {
        const state = t.ai_state || "human_ai";
        const impact = t.impact_level || "medium";
        const priority = t.priority || "important";
        const skillCount = (t.skill_names || []).length;
        // Deterministic template scoring
        let score = 0;
        score += state === "mostly_human" ? 3 : state === "human_ai" ? 2 : 1;
        score += impact === "high" ? 3 : impact === "medium" ? 2 : 1;
        score += priority === "critical" ? 3 : priority === "important" ? 2 : 1;
        if (skillCount >= 4) score += 2; else if (skillCount >= 3) score += 1;
        const recTemplate = score >= 9 ? "case-challenge" : score >= 6 ? "deep-dive" : "quick-pulse";
        const recDuration = score >= 9 ? 30 : score >= 6 ? 15 : 3;
        return {
          ...t,
          ai_state: state,
          ai_trend: t.ai_trend || "increasing_ai",
          impact_level: impact,
          recommended_template: t.recommended_template || recTemplate,
          priority,
          sim_duration: t.sim_duration || recDuration,
        };
      });
      setAnalyzedTasks(tasks);
    } catch (err: any) {
      console.error("Task analysis failed:", err);
      setAnalysisError(err.message || "Analysis failed");
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    }
    setAnalyzing(false);
  }, [companyName, toast]);

  useEffect(() => {
    if (selectedJob) {
      analyzeJob(selectedJob);
    } else {
      setAnalyzedTasks([]);
      setAnalysisError(null);
    }
  }, [selectedJob, analyzeJob]);

  /* ── Filter jobs ── */
  const filteredJobs = useMemo(() => {
    if (!search.trim()) return jobs;
    const q = search.toLowerCase();
    return jobs.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.department?.toLowerCase().includes(q) ||
      j.location?.toLowerCase().includes(q)
    );
  }, [jobs, search]);

  const departments = useMemo(() => {
    const depts = new Map<string, number>();
    jobs.forEach(j => {
      const d = j.department || "Other";
      depts.set(d, (depts.get(d) || 0) + 1);
    });
    return Array.from(depts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [jobs]);

  /* ── Grouped & sorted jobs ── */
  const groupedJobs = useMemo(() => {
    const groups = new Map<string, DbJob[]>();
    filteredJobs.forEach(j => {
      const dept = j.department || "Other";
      if (!groups.has(dept)) groups.set(dept, []);
      groups.get(dept)!.push(j);
    });
    // Sort each group: ready (analyzed) first, then by title
    groups.forEach((jobList, dept) => {
      jobList.sort((a, b) => {
        const aReady = analyzedJobIds.has(a.id) ? 0 : 1;
        const bReady = analyzedJobIds.has(b.id) ? 0 : 1;
        if (aReady !== bReady) return aReady - bReady;
        return a.title.localeCompare(b.title);
      });
    });
    // Sort departments: most ready roles first
    return Array.from(groups.entries()).sort((a, b) => {
      const aReady = a[1].filter(j => analyzedJobIds.has(j.id)).length;
      const bReady = b[1].filter(j => analyzedJobIds.has(j.id)).length;
      return bReady - aReady;
    });
  }, [filteredJobs, analyzedJobIds]);

  /* ── Job completion ring helper ── */
  const getJobCompletionPercent = useCallback((job: DbJob) => {
    const jobSims = completedSims.filter(s => s.job_title === job.title);
    if (jobSims.length === 0) return 0;
    // Unique tasks completed
    const uniqueTasks = new Set(jobSims.map(s => s.task_name));
    // Assume ~10 tasks per role
    return Math.min(100, Math.round((uniqueTasks.size / 10) * 100));
  }, [completedSims]);

  /* ── Progress helpers ── */
  const getTaskCompletion = useCallback((taskName: string, jobTitle: string) => {
    const matches = completedSims.filter(
      s => s.task_name === taskName && s.job_title === jobTitle
    );
    if (matches.length === 0) return null;
    const best = matches.reduce((best, s) => {
      const score = s.total_questions > 0 ? Math.round((s.correct_answers / s.total_questions) * 100) : 0;
      return score > best ? score : best;
    }, 0);
    return best;
  }, [completedSims]);

  const pathProgress = useMemo(() => {
    if (!analyzedTasks.length || !selectedJob) return null;
    const completed = analyzedTasks.filter(t => getTaskCompletion(t.cluster_name, selectedJob.title) !== null).length;
    const percent = Math.round((completed / analyzedTasks.length) * 100);
    return { completed, total: analyzedTasks.length, percent };
  }, [analyzedTasks, selectedJob, getTaskCompletion]);

  /* ── Learning path stats ── */
  const pathStats = useMemo(() => {
    if (!analyzedTasks.length) return null;
    const critical = analyzedTasks.filter(t => t.priority === "critical").length;
    const important = analyzedTasks.filter(t => t.priority === "important").length;
    const totalMinutes = analyzedTasks.reduce((s, t) => s + (t.sim_duration || 3), 0);
    const highImpact = analyzedTasks.filter(t => t.impact_level === "high").length;
    return { critical, important, totalMinutes, highImpact, total: analyzedTasks.length };
  }, [analyzedTasks]);

  // Priority filter state
  const [priorityMode, setPriorityMode] = useState<"all" | "dept" | "job">("all");
  const [priorityDept, setPriorityDept] = useState<string | null>(null);
  const [priorityJobId, setPriorityJobId] = useState<string | null>(null);

  const unanalyzedByDept = useMemo(() => {
    const map = new Map<string, number>();
    jobs.forEach(j => {
      if (!analyzedJobIds.has(j.id)) {
        const d = j.department || "Other";
        map.set(d, (map.get(d) || 0) + 1);
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [jobs, analyzedJobIds]);

  const unanalyzedJobs = useMemo(() => jobs.filter(j => !analyzedJobIds.has(j.id)), [jobs, analyzedJobIds]);

  /* ── Bulk analyze (single batch per click) ── */
  const runBulkBatch = useCallback(async () => {
    if (!companyId) return;

    // Safeguard: 2-minute session timeout
    const now = Date.now();
    if (bulkSessionStart && now - bulkSessionStart > 2 * 60 * 1000) {
      setBulkPaused("Session timeout (2 min). Click again to continue.");
      setBulkSessionStart(null);
      setBulkErrors(0);
      return;
    }
    if (!bulkSessionStart) setBulkSessionStart(now);

    setBulkRunning(true);
    setBulkPaused(null);

    const body: any = { companyId, batchSize: 5 };
    if (priorityMode === "dept" && priorityDept) body.department = priorityDept;
    if (priorityMode === "job" && priorityJobId) body.jobIds = [priorityJobId];

    try {
      const { data, error } = await supabase.functions.invoke("bulk-analyze-roles", {
        body,
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const total = data.total || 0;
      const alreadyAnalyzed = data.alreadyAnalyzed || 0;
      const justProcessed = data.justProcessed || 0;
      const remaining = data.remaining ?? 0;

      setBulkProgress({
        analyzed: alreadyAnalyzed + justProcessed,
        total,
        remaining,
      });

      // Check for rate limiting
      const rateLimited = data.results?.some((r: any) => r.status === "rate_limited");
      const hasErrors = data.results?.some((r: any) => r.status.startsWith("error") || r.status === "parse_error" || r.status === "insert_error");

      if (rateLimited || hasErrors) {
        const newErrors = bulkErrors + 1;
        setBulkErrors(newErrors);
        // Safeguard: 3 consecutive errors
        if (newErrors >= 3) {
          setBulkPaused("Paused after 3 consecutive issues. Try again later.");
          setBulkSessionStart(null);
          setBulkErrors(0);
          setBulkRunning(false);
          return;
        }
        if (rateLimited) {
          toast({ title: "Rate limited on this batch", description: "Wait a moment, then click again." });
        }
      } else {
        setBulkErrors(0); // Reset on success
      }

      if (remaining === 0 || data.message === "All jobs already analyzed") {
        toast({ title: "All roles analyzed!", description: `${total} roles complete.` });
        setBulkSessionStart(null);
      }
    } catch (err: any) {
      const newErrors = bulkErrors + 1;
      setBulkErrors(newErrors);
      if (newErrors >= 3) {
        setBulkPaused("Paused after 3 consecutive errors. Try again later.");
        setBulkSessionStart(null);
        setBulkErrors(0);
      }
      toast({ title: "Batch error", description: err.message, variant: "destructive" });
    }
    setBulkRunning(false);
  }, [companyId, toast, bulkErrors, bulkSessionStart]);

  /* ── Launch simulation ── */
  const launchSim = (task: EnrichedTask) => {
    setSimTask(task.cluster_name);
    setSimTaskState(task.ai_state);
    setSimTaskTrend(task.ai_trend);
    setSimTaskImpact(task.impact_level);
    setSimOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-10">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="relative mx-auto max-w-5xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground mb-6">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Simulation Blueprint System
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-foreground leading-tight tracking-tight">
              AI-powered learning paths
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Select any {companyName} role to auto-generate a personalized learning path — 
              each task analyzed for AI impact with recommended simulation packages.
            </p>
            {/* Batch Analysis Dashboard */}
            {companyId && (
              <div className="mt-6 mx-auto max-w-lg">
                <Card className="border-border bg-card/60 backdrop-blur">
                  <CardContent className="p-5 space-y-4">
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-primary/10 p-1.5">
                          <Brain className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">Role Analysis Pipeline</h3>
                      </div>
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-border text-muted-foreground">
                        {companyName}
                      </Badge>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg border border-border bg-background/50 p-2.5 text-center">
                        <div className="text-lg font-bold text-foreground">{jobs.length}</div>
                        <div className="text-[10px] text-muted-foreground">Total Roles</div>
                      </div>
                      <div className="rounded-lg border border-border bg-background/50 p-2.5 text-center">
                        <div className="text-lg font-bold text-primary">{analyzedJobIds.size}</div>
                        <div className="text-[10px] text-muted-foreground">Analyzed</div>
                      </div>
                      <div className="rounded-lg border border-border bg-background/50 p-2.5 text-center">
                        <div className="text-lg font-bold text-muted-foreground">{Math.max(0, jobs.length - analyzedJobIds.size)}</div>
                        <div className="text-[10px] text-muted-foreground">Remaining</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {jobs.length > 0 && (
                      <div className="space-y-1.5">
                        <Progress
                          value={jobs.length > 0 ? (analyzedJobIds.size / jobs.length) * 100 : 0}
                          className="h-2"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{Math.round((analyzedJobIds.size / jobs.length) * 100)}% complete</span>
                          <span>~{Math.max(0, jobs.length - analyzedJobIds.size) * 3}s estimated</span>
                        </div>
                      </div>
                    )}

                    {/* Action row */}
                    <div className="flex items-center gap-3">
                      <Button
                        variant={analyzedJobIds.size >= jobs.length ? "outline" : "default"}
                        size="sm"
                        onClick={runBulkBatch}
                        disabled={bulkRunning || analyzedJobIds.size >= jobs.length}
                        className="gap-2 text-xs flex-1"
                      >
                        {bulkRunning ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Analyzing 5 roles…
                          </>
                        ) : analyzedJobIds.size >= jobs.length ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            All roles analyzed
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" />
                            Analyze next batch ({Math.min(5, jobs.length - analyzedJobIds.size)} roles)
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Explanation */}
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Each batch sends 5 roles to AI, generating 8–12 task clusters per role with impact ratings. 
                      Analyzed roles show a <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-primary/10 text-primary border-primary/20 mx-0.5 inline-flex items-center">Ready</Badge> badge and load instantly.
                    </p>

                    {bulkPaused && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/5 rounded-md px-2.5 py-2">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>{bulkPaused}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Job Browser */}
          <div className={`${selectedJob ? "lg:w-[380px]" : "lg:w-[480px]"} shrink-0 transition-all duration-300`}>
            {/* Search */}
            <div className="sticky top-4 space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${jobs.length} roles…`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {departments.map(([dept, count]) => (
                  <button
                    key={dept}
                    onClick={() => setSearch(search === dept ? "" : dept)}
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium border transition-colors ${
                      search === dept
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/30"
                    }`}
                  >
                    {dept} ({count})
                  </button>
                ))}
              </div>
            </div>

            {/* Job list — grouped by department */}
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl border border-border bg-card animate-pulse" />
                ))}
              </div>
            ) : groupedJobs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No roles match "{search}"</p>
                <Button variant="ghost" size="sm" onClick={() => setSearch("")} className="mt-1 text-xs">Clear</Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
                {groupedJobs.map(([dept, deptJobs]) => {
                  const isCollapsed = collapsedDepts.has(dept);
                  const readyCount = deptJobs.filter(j => analyzedJobIds.has(j.id)).length;
                  return (
                    <div key={dept}>
                      {/* Department header */}
                      <button
                        onClick={() => setCollapsedDepts(prev => {
                          const next = new Set(prev);
                          next.has(dept) ? next.delete(dept) : next.add(dept);
                          return next;
                        })}
                        className="w-full flex items-center gap-2 py-1.5 px-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                        <Briefcase className="h-3 w-3" />
                        <span>{dept}</span>
                        <span className="text-[10px] font-normal">({deptJobs.length})</span>
                        {readyCount > 0 && (
                          <Badge variant="secondary" className="ml-auto text-[9px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0">
                            {readyCount} ready
                          </Badge>
                        )}
                      </button>

                      {/* Jobs in this department */}
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-1.5 pl-1">
                              {deptJobs.slice(0, 30).map((job) => {
                                const isReady = analyzedJobIds.has(job.id);
                                const completionPct = getJobCompletionPercent(job);
                                const circumference = 2 * Math.PI * 8;
                                const strokeOffset = circumference - (completionPct / 100) * circumference;

                                return (
                                  <motion.div
                                    key={job.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    whileHover={{ x: 2 }}
                                    transition={{ duration: 0.15 }}
                                  >
                                    <button
                                      onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                                      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                                        selectedJob?.id === job.id
                                          ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20"
                                          : "border-border bg-card hover:border-primary/30"
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <h3 className="font-semibold text-foreground text-sm leading-tight truncate">{job.title}</h3>
                                          <div className="flex items-center gap-2 mt-1">
                                            {job.location && (
                                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                <MapPin className="h-2.5 w-2.5" />
                                                {job.location}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          {/* Completion ring */}
                                          {completionPct > 0 && (
                                            <svg width="22" height="22" className="-rotate-90">
                                              <circle cx="11" cy="11" r="8" fill="none" strokeWidth="2" className="stroke-muted/30" />
                                              <circle
                                                cx="11" cy="11" r="8" fill="none" strokeWidth="2"
                                                className="stroke-primary"
                                                strokeDasharray={circumference}
                                                strokeDashoffset={strokeOffset}
                                                strokeLinecap="round"
                                              />
                                            </svg>
                                          )}
                                          {/* Ready badge */}
                                          <Badge
                                            variant="outline"
                                            className={`text-[9px] px-1.5 py-0 h-4 ${
                                              isReady
                                                ? "bg-primary/10 text-primary border-primary/20"
                                                : "bg-muted/50 text-muted-foreground border-border"
                                            }`}
                                          >
                                            {isReady ? "Ready" : "—"}
                                          </Badge>
                                        </div>
                                      </div>
                                    </button>
                                  </motion.div>
                                );
                              })}
                              {deptJobs.length > 30 && (
                                <p className="text-center text-[10px] text-muted-foreground py-1">
                                  +{deptJobs.length - 30} more
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Learning Path Panel */}
          <AnimatePresence mode="wait">
            {selectedJob && (
              <motion.div
                key={selectedJob.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 min-w-0"
              >
                {/* Job Header */}
                <Card className="border-border bg-card mb-4">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-serif text-xl font-bold text-foreground">{selectedJob.title}</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {companyName}
                          {selectedJob.department && ` · ${selectedJob.department}`}
                          {selectedJob.location && ` · ${selectedJob.location}`}
                        </p>
                      </div>
                      {riskBadge(selectedJob.automation_risk_percent)}
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {[
                        { label: "AI Augmented", value: selectedJob.augmented_percent, color: "bg-dot-blue" },
                        { label: "Automation Risk", value: selectedJob.automation_risk_percent, color: "bg-destructive" },
                        { label: "New Skills", value: selectedJob.new_skills_percent, color: "bg-dot-purple" },
                      ].map((s) => (
                        <div key={s.label} className="text-center">
                          <div className="text-lg font-bold text-foreground">{s.value ?? "—"}%</div>
                          <div className="text-[10px] text-muted-foreground">{s.label}</div>
                          {s.value != null && (
                            <div className="h-1 rounded-full bg-secondary mt-1.5 overflow-hidden">
                              <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.value}%` }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Learning Path Header with Progress */}
                <div className="mb-4">
                  <button
                    onClick={() => setExpandedPath(!expandedPath)}
                    className="flex items-center gap-2 w-full text-left mb-3"
                  >
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground text-sm">Recommended Learning Path</span>
                    {pathStats && (
                      <span className="text-[10px] text-muted-foreground ml-1">
                        {pathStats.total} tasks · ~{pathStats.totalMinutes} min total
                      </span>
                    )}
                    <span className="ml-auto">
                      {expandedPath ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </span>
                  </button>

                  {/* Progress bar */}
                  {expandedPath && pathProgress && user && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-muted-foreground">
                          Your progress: {pathProgress.completed}/{pathProgress.total} completed
                        </span>
                        <span className="text-xs font-semibold text-foreground">{pathProgress.percent}%</span>
                      </div>
                      <Progress value={pathProgress.percent} className="h-2" />
                    </motion.div>
                  )}

                  {/* Stats bar */}
                  {expandedPath && pathStats && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-4 gap-2 mb-4"
                    >
                      {[
                        { label: "Critical", value: pathStats.critical, icon: AlertTriangle, iconColor: "text-destructive" },
                        { label: "Important", value: pathStats.important, icon: Target, iconColor: "text-warning" },
                        { label: "High AI Impact", value: pathStats.highImpact, icon: Brain, iconColor: "text-dot-purple" },
                        { label: "Total Time", value: `${pathStats.totalMinutes}m`, icon: Clock, iconColor: "text-muted-foreground" },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                          <s.icon className={`h-3.5 w-3.5 ${s.iconColor}`} />
                          <div>
                            <div className="text-sm font-bold text-foreground">{s.value}</div>
                            <div className="text-[9px] text-muted-foreground">{s.label}</div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Analysis Loading */}
                {analyzing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 gap-3"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="h-8 w-8 text-primary/40" />
                    </motion.div>
                    <p className="text-sm text-muted-foreground">Analyzing {selectedJob.title} tasks…</p>
                    <p className="text-[10px] text-muted-foreground">Identifying AI impact per task cluster</p>
                  </motion.div>
                )}

                {/* Error */}
                {analysisError && !analyzing && (
                  <Card className="border-destructive/30 bg-destructive/5">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-destructive">{analysisError}</p>
                      <Button variant="outline" size="sm" onClick={() => analyzeJob(selectedJob)} className="mt-2 text-xs">
                        Retry Analysis
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Task Cards */}
                {expandedPath && !analyzing && analyzedTasks.length > 0 && (
                  <div className="space-y-2">
                    {analyzedTasks.map((task, i) => {
                      const recTemplate = templateMap[task.recommended_template || "quick-pulse"] || templates[0];
                      const RecIcon = recTemplate.icon;
                      const taskScore = selectedJob ? getTaskCompletion(task.cluster_name, selectedJob.title) : null;
                      const isCompleted = taskScore !== null;

                      return (
                        <motion.div
                          key={task.id || i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <Card className={`border-border bg-card hover:border-primary/30 transition-all group ${isCompleted ? "border-success/30 bg-success/[0.02]" : ""}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                {/* Order number / check */}
                                <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                                  {isCompleted ? (
                                    <span className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
                                      <CheckCircle2 className="h-4 w-4 text-success" />
                                    </span>
                                  ) : (
                                    <span className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-foreground">
                                      {i + 1}
                                    </span>
                                  )}
                                  {i < analyzedTasks.length - 1 && (
                                    <div className={`w-px h-full min-h-[20px] ${isCompleted ? "bg-success/30" : "bg-border"}`} />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className={`font-semibold text-sm leading-tight ${isCompleted ? "text-success" : "text-foreground"}`}>
                                      {task.cluster_name}
                                    </h4>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {isCompleted && taskScore !== null && scoreBadge(taskScore)}
                                      {priorityBadge(task.priority)}
                                    </div>
                                  </div>

                                  {task.description && (
                                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{task.description}</p>
                                  )}

                                  {/* AI State + Trend */}
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                      {stateIcon(task.ai_state)}
                                      {stateLabel(task.ai_state)}
                                    </span>
                                    {task.ai_trend && task.ai_trend !== "stable" && (
                                      <span className="flex items-center gap-1 text-[10px] text-dot-amber">
                                        <TrendingUp className="h-3 w-3" />
                                        {task.ai_trend === "fully_ai_soon" ? "Full AI Soon" : "Growing AI"}
                                      </span>
                                    )}
                                  </div>

                                  {/* Skills */}
                                  {task.skill_names && task.skill_names.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                      {task.skill_names.map((s) => (
                                        <span key={s} className="rounded-md bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-foreground">{s}</span>
                                      ))}
                                    </div>
                                  )}

                                  {/* Launch button */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                      <RecIcon className="h-3 w-3" />
                                      <span>{recTemplate.name}</span>
                                      <span className="text-border">·</span>
                                      <Clock className="h-3 w-3" />
                                      <span>~{task.sim_duration || 3} min</span>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant={isCompleted ? "ghost" : "outline"}
                                      className="h-7 text-[11px] gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
                                      onClick={() => launchSim(task)}
                                    >
                                      <Play className="h-3 w-3" />
                                      {isCompleted ? "Retry" : "Start Simulation"}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Full path CTA */}
                {!analyzing && analyzedTasks.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6"
                  >
                    <Card className="border-primary/20 bg-primary/[0.02]">
                      <CardContent className="p-5 text-center">
                        <Award className="h-6 w-6 text-primary mx-auto mb-2" />
                        <h3 className="font-semibold text-foreground text-sm mb-1">
                          {pathProgress && pathProgress.percent === 100
                            ? "🎉 Learning Path Complete!"
                            : "Complete Learning Path"
                          }
                        </h3>
                        <p className="text-xs text-muted-foreground mb-3">
                          {pathProgress && pathProgress.percent === 100
                            ? `Congratulations! You've completed all ${analyzedTasks.length} simulations for ${selectedJob.title}.`
                            : `Complete all ${analyzedTasks.length} simulations to earn your AI-Readiness Certificate for ${selectedJob.title}`
                          }
                        </p>
                        {(!pathProgress || pathProgress.percent < 100) && (
                          <Button
                            className="gap-1.5"
                            onClick={() => {
                              // Find first incomplete task
                              const nextTask = analyzedTasks.find(
                                t => getTaskCompletion(t.cluster_name, selectedJob.title) === null
                              ) || analyzedTasks[0];
                              launchSim(nextTask);
                            }}
                          >
                            {pathProgress && pathProgress.completed > 0
                              ? `Continue — Task ${pathProgress.completed + 1}`
                              : "Start with Task 1"
                            }
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Empty state */}
            {!selectedJob && !loading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex items-center justify-center"
              >
                <div className="text-center py-20 max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-foreground mb-2">Select a role to begin</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Choose any {companyName} role to auto-generate a task-level AI impact analysis and recommended learning path with simulation packages.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CTA */}
      <section className="px-4 py-16 bg-accent/30">
        <div className="mx-auto max-w-3xl text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground">
            Your company's roles. Your learning paths.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Upload your org chart and we'll generate personalized simulation packages for every role.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate("/contact")} className="gap-2 text-base px-10">
              Request a Demo <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/analyze")} className="text-base px-8">
              Analyze Any Role
            </Button>
          </div>
        </div>
      </section>

      {/* Simulator Modal */}
      <SimulatorModal
        open={simOpen}
        onClose={() => setSimOpen(false)}
        taskName={simTask}
        jobTitle={selectedJob?.title || ""}
        company={companyName}
        taskState={simTaskState}
        taskTrend={simTaskTrend}
        taskImpactLevel={simTaskImpact}
      />
    </div>
  );
}
