import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Zap, ArrowRight, Layers, Brain,
  GraduationCap, Play, ClipboardCheck, Users, Target,
  Sparkles, Clock, Search, MapPin, Briefcase,
  AlertTriangle, TrendingUp, Shield, Loader2,
  ChevronDown, ChevronUp, Award, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import SimulatorModal from "@/components/SimulatorModal";
import { useToast } from "@/hooks/use-toast";

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
const fadeUp = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

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

export default function SimulationBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();

  /* ── State ── */
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<DbJob | null>(null);
  const [companyName, setCompanyName] = useState("Anthropic");

  // Task analysis
  const [analyzedTasks, setAnalyzedTasks] = useState<EnrichedTask[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Simulator modal
  const [simOpen, setSimOpen] = useState(false);
  const [simTask, setSimTask] = useState("");
  const [simTaskState, setSimTaskState] = useState<string | undefined>();
  const [simTaskTrend, setSimTaskTrend] = useState<string | undefined>();
  const [simTaskImpact, setSimTaskImpact] = useState<string | undefined>();

  // Learning path expanded
  const [expandedPath, setExpandedPath] = useState(true);

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
      const companyId = companies[0].id;
      setCompanyName(companies[0].name);

      const { data } = await supabase
        .from("jobs")
        .select("id, title, department, seniority, location, augmented_percent, automation_risk_percent, new_skills_percent, description")
        .eq("company_id", companyId)
        .order("title");
      setJobs(data || []);
      setLoading(false);
    })();
  }, []);

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

      // If cached from DB (no AI metadata), enrich with defaults
      const tasks = (data.tasks || []).map((t: any) => ({
        ...t,
        ai_state: t.ai_state || "human_ai",
        ai_trend: t.ai_trend || "increasing_ai",
        impact_level: t.impact_level || "medium",
        recommended_template: t.recommended_template || "quick-pulse",
        priority: t.priority || "important",
        sim_duration: t.sim_duration || 3,
      }));
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

  /* ── Learning path stats ── */
  const pathStats = useMemo(() => {
    if (!analyzedTasks.length) return null;
    const critical = analyzedTasks.filter(t => t.priority === "critical").length;
    const important = analyzedTasks.filter(t => t.priority === "important").length;
    const totalMinutes = analyzedTasks.reduce((s, t) => s + (t.sim_duration || 3), 0);
    const highImpact = analyzedTasks.filter(t => t.impact_level === "high").length;
    return { critical, important, totalMinutes, highImpact, total: analyzedTasks.length };
  }, [analyzedTasks]);

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
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Job Browser */}
          <div className={`${selectedJob ? "lg:w-[380px]" : "w-full"} shrink-0 transition-all duration-300`}>
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

            {/* Job list */}
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl border border-border bg-card animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
                {filteredJobs.slice(0, 50).map((job) => (
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
                        <h3 className="font-semibold text-foreground text-sm leading-tight">{job.title}</h3>
                        {riskBadge(job.automation_risk_percent)}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground mt-1">
                        {job.department && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-2.5 w-2.5" />
                            {job.department}
                          </span>
                        )}
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" />
                            {job.location}
                          </span>
                        )}
                      </div>
                    </button>
                  </motion.div>
                ))}
                {filteredJobs.length > 50 && (
                  <p className="text-center text-[10px] text-muted-foreground py-2">
                    Showing 50 of {filteredJobs.length}
                  </p>
                )}
                {filteredJobs.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No roles match "{search}"</p>
                    <Button variant="ghost" size="sm" onClick={() => setSearch("")} className="mt-1 text-xs">Clear</Button>
                  </div>
                )}
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

                {/* Learning Path */}
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

                      return (
                        <motion.div
                          key={task.id || i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <Card className="border-border bg-card hover:border-primary/30 transition-all group">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                {/* Order number */}
                                <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                                  <span className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-foreground">
                                    {i + 1}
                                  </span>
                                  {i < analyzedTasks.length - 1 && (
                                    <div className="w-px h-full bg-border min-h-[20px]" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className="font-semibold text-foreground text-sm leading-tight">{task.cluster_name}</h4>
                                    <div className="flex items-center gap-1.5 shrink-0">
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
                                      variant="outline"
                                      className="h-7 text-[11px] gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
                                      onClick={() => launchSim(task)}
                                    >
                                      <Play className="h-3 w-3" />
                                      Start Simulation
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
                        <h3 className="font-semibold text-foreground text-sm mb-1">Complete Learning Path</h3>
                        <p className="text-xs text-muted-foreground mb-3">
                          Complete all {analyzedTasks.length} simulations to earn your AI-Readiness Certificate for {selectedJob.title}
                        </p>
                        <Button
                          className="gap-1.5"
                          onClick={() => launchSim(analyzedTasks[0])}
                        >
                          Start with Task 1
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
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
