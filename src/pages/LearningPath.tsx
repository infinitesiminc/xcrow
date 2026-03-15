import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, FileText, MessageSquare, Zap, GraduationCap, ClipboardCheck,
  Users, Loader2, Trash2, Play, ChevronDown, ChevronUp, Upload,
  Sparkles, Clock, AlertTriangle, Brain, Target, Briefcase,
  BookOpen, TrendingUp, Shield, Award, CheckCircle2, ArrowLeft,
  ArrowRight, RefreshCw, BellRing,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import SimulatorModal from "@/components/SimulatorModal";

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
  company_id: string | null;
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

interface CustomSim {
  id: string;
  job_title: string;
  company: string | null;
  task_name: string;
  source_type: string;
  recommended_template: string;
  ai_state: string | null;
  impact_level: string | null;
  priority: string | null;
  sim_duration: number | null;
  created_at: string;
}

/* ── Templates ── */
const templates = [
  { id: "quick-pulse", name: "Quick Pulse", duration: "~3 min", icon: Zap, color: "bg-dot-teal/10 text-dot-teal border-dot-teal/20" },
  { id: "deep-dive", name: "Deep Dive", duration: "~15 min", icon: GraduationCap, color: "bg-dot-blue/10 text-dot-blue border-dot-blue/20" },
  { id: "case-challenge", name: "Case Challenge", duration: "~30 min", icon: ClipboardCheck, color: "bg-dot-purple/10 text-dot-purple border-dot-purple/20" },
  { id: "full-panel", name: "Full Panel", duration: "~60 min", icon: Users, color: "bg-dot-amber/10 text-dot-amber border-dot-amber/20" },
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
function scoreBadge(score: number) {
  if (score >= 70) return <Badge className="bg-success/10 text-success border-success/20 text-[9px]">{score}%</Badge>;
  if (score >= 40) return <Badge className="bg-warning/10 text-warning border-warning/20 text-[9px]">{score}%</Badge>;
  return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[9px]">{score}%</Badge>;
}
function riskBadge(pct: number | null) {
  if (pct == null) return null;
  const cls = pct >= 60 ? "bg-destructive/10 text-destructive border-destructive/20" : pct >= 35 ? "bg-warning/10 text-warning border-warning/20" : "bg-success/10 text-success border-success/20";
  return <Badge className={`${cls} text-[10px]`}>{pct}% risk</Badge>;
}

export default function LearningPath() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();

  const jobId = searchParams.get("jobId");

  /* ── Job data ── */
  const [job, setJob] = useState<DbJob | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [jobLoading, setJobLoading] = useState(true);

  /* ── Tasks ── */
  const [analyzedTasks, setAnalyzedTasks] = useState<EnrichedTask[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  /* ── Update tracking ── */
  const [updatedTaskNames, setUpdatedTaskNames] = useState<Set<string>>(new Set());
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  /* ── Progress ── */
  const [completedSims, setCompletedSims] = useState<CompletedSim[]>([]);

  /* ── Custom sims for this job ── */
  const [customSims, setCustomSims] = useState<CustomSim[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createTab, setCreateTab] = useState<"prompt" | "document">("prompt");
  const [promptText, setPromptText] = useState("");
  const [docText, setDocText] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);

  /* ── Sim runner ── */
  const [simOpen, setSimOpen] = useState(false);
  const [simTask, setSimTask] = useState("");
  const [simTaskState, setSimTaskState] = useState<string | undefined>();
  const [simTaskTrend, setSimTaskTrend] = useState<string | undefined>();
  const [simTaskImpact, setSimTaskImpact] = useState<string | undefined>();

  /* ── Active tab ── */
  const [activeTab, setActiveTab] = useState<"path" | "custom">("path");

  /* ── Load job + company ── */
  useEffect(() => {
    if (!jobId) { setJobLoading(false); return; }
    (async () => {
      setJobLoading(true);
      const { data: jobData } = await supabase
        .from("jobs")
        .select("id, title, department, seniority, location, augmented_percent, automation_risk_percent, new_skills_percent, description, company_id")
        .eq("id", jobId)
        .single();
      if (jobData) {
        setJob(jobData);
        if (jobData.company_id) {
          const { data: co } = await supabase.from("companies").select("name").eq("id", jobData.company_id).single();
          if (co) setCompanyName(co.name);
        }
      }
      setJobLoading(false);
    })();
  }, [jobId]);

  /* ── Enrich tasks helper ── */
  const enrichTasks = (rawTasks: any[]): EnrichedTask[] => {
    return rawTasks.map((t: any) => {
      const state = t.ai_state || "human_ai";
      const impact = t.impact_level || "medium";
      const priority = t.priority || "important";
      const skillCount = (t.skill_names || []).length;
      let score = 0;
      score += state === "mostly_human" ? 3 : state === "human_ai" ? 2 : 1;
      score += impact === "high" ? 3 : impact === "medium" ? 2 : 1;
      score += priority === "critical" ? 3 : priority === "important" ? 2 : 1;
      if (skillCount >= 4) score += 2; else if (skillCount >= 3) score += 1;
      const recTemplate = score >= 9 ? "case-challenge" : score >= 6 ? "deep-dive" : "quick-pulse";
      const recDuration = score >= 9 ? 30 : score >= 6 ? 15 : 3;
      return { ...t, ai_state: state, ai_trend: t.ai_trend || "increasing_ai", impact_level: impact, recommended_template: t.recommended_template || recTemplate, priority, sim_duration: t.sim_duration || recDuration };
    });
  };

  /* ── Analyze tasks ── */
  const analyzeJob = useCallback(async (j: DbJob, forceRefresh = false) => {
    setAnalyzing(true);
    setAnalysisError(null);

    // Capture previous tasks for diff detection on refresh
    const previousTasks = forceRefresh ? [...analyzedTasks] : [];
    if (!forceRefresh) setAnalyzedTasks([]);

    try {
      // If forcing refresh, delete existing clusters first so the edge function regenerates
      if (forceRefresh) {
        // Call the edge function without cached data by temporarily clearing clusters
        // The edge function checks for existing clusters, so we pass a hint
      }

      const { data, error } = await supabase.functions.invoke("analyze-role-tasks", {
        body: { jobId: j.id, jobTitle: j.title, company: companyName, description: j.description, forceRefresh },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const tasks = enrichTasks(data.tasks || []);
      setAnalyzedTasks(tasks);
      setLastRefreshed(new Date());

      // Detect changed tasks on refresh
      if (forceRefresh && previousTasks.length > 0) {
        const changed = new Set<string>();
        tasks.forEach(newTask => {
          const oldTask = previousTasks.find(t => t.cluster_name === newTask.cluster_name);
          if (!oldTask) {
            changed.add(newTask.cluster_name); // New task
          } else if (oldTask.ai_state !== newTask.ai_state || oldTask.impact_level !== newTask.impact_level || oldTask.priority !== newTask.priority) {
            changed.add(newTask.cluster_name); // Changed
          }
        });
        setUpdatedTaskNames(changed);
        if (changed.size > 0) {
          toast({ title: `${changed.size} task${changed.size > 1 ? "s" : ""} updated`, description: "AI impact assessments have been refreshed." });
        } else {
          toast({ title: "No changes detected", description: "All task assessments remain current." });
        }
      }
    } catch (err: any) {
      setAnalysisError(err.message || "Analysis failed");
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    }
    setAnalyzing(false);
  }, [companyName, toast, analyzedTasks]);

  useEffect(() => {
    if (job) analyzeJob(job);
  }, [job]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Fetch completed sims ── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("completed_simulations")
        .select("task_name, correct_answers, total_questions, job_title")
        .eq("user_id", user.id);
      setCompletedSims(data || []);
    })();
  }, [user, simOpen]);

  /* ── Fetch custom sims for this job ── */
  const fetchCustomSims = useCallback(async () => {
    if (!user || !job) return;
    const { data } = await supabase
      .from("custom_simulations")
      .select("*")
      .eq("user_id", user.id)
      .eq("job_title", job.title)
      .order("created_at", { ascending: false });
    setCustomSims((data as CustomSim[]) || []);
  }, [user, job]);

  useEffect(() => { fetchCustomSims(); }, [fetchCustomSims]);

  /* ── Progress helpers ── */
  const getTaskCompletion = useCallback((taskName: string, jobTitle: string) => {
    const matches = completedSims.filter(s => s.task_name === taskName && s.job_title === jobTitle);
    if (matches.length === 0) return null;
    return matches.reduce((best, s) => {
      const score = s.total_questions > 0 ? Math.round((s.correct_answers / s.total_questions) * 100) : 0;
      return score > best ? score : best;
    }, 0);
  }, [completedSims]);

  const pathProgress = useMemo(() => {
    if (!analyzedTasks.length || !job) return null;
    const completed = analyzedTasks.filter(t => getTaskCompletion(t.cluster_name, job.title) !== null).length;
    return { completed, total: analyzedTasks.length, percent: Math.round((completed / analyzedTasks.length) * 100) };
  }, [analyzedTasks, job, getTaskCompletion]);

  const pathStats = useMemo(() => {
    if (!analyzedTasks.length) return null;
    return {
      critical: analyzedTasks.filter(t => t.priority === "critical").length,
      important: analyzedTasks.filter(t => t.priority === "important").length,
      totalMinutes: analyzedTasks.reduce((s, t) => s + (t.sim_duration || 3), 0),
      highImpact: analyzedTasks.filter(t => t.impact_level === "high").length,
      total: analyzedTasks.length,
    };
  }, [analyzedTasks]);

  /* ── Launch sim ── */
  const launchSim = (task: EnrichedTask | { cluster_name: string; ai_state?: string; ai_trend?: string; impact_level?: string }) => {
    setSimTask(task.cluster_name);
    setSimTaskState(task.ai_state);
    setSimTaskTrend(task.ai_trend);
    setSimTaskImpact(task.impact_level);
    setSimOpen(true);
  };

  /* ── Handle doc upload ── */
  const handleFileUpload = async (file: File) => {
    setDocFile(file);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (["txt", "md"].includes(ext || "")) { setDocText(await file.text()); return; }
    if (["pdf", "docx"].includes(ext || "")) {
      setParsing(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const { data, error } = await supabase.functions.invoke("parse-jd", { body: formData });
        if (error) throw new Error(error.message);
        setDocText(data?.text || data?.content || "");
      } catch (err: any) {
        toast({ title: "Parse failed", description: err.message, variant: "destructive" });
      }
      setParsing(false);
      return;
    }
    toast({ title: "Unsupported file type", description: "Use PDF, DOCX, TXT, or MD files.", variant: "destructive" });
  };

  /* ── Create custom sim ── */
  const handleCreate = async () => {
    if (!user || !job) return;
    const input = createTab === "prompt" ? promptText.trim() : docText.trim();
    if (!input) { toast({ title: "Enter something", variant: "destructive" }); return; }
    setCreating(true);
    try {
      const body: any = { userId: user.id };
      if (createTab === "prompt") body.prompt = `For the role "${job.title}" at ${companyName}: ${input}`; else body.documentText = input;
      const { data, error } = await supabase.functions.invoke("compile-custom-sim", { body });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast({ title: "Simulation created!", description: `"${data.simulation.task_name}" added.` });
      setCreateOpen(false);
      setPromptText(""); setDocText(""); setDocFile(null);
      fetchCustomSims();
    } catch (err: any) {
      toast({ title: "Creation failed", description: err.message, variant: "destructive" });
    }
    setCreating(false);
  };

  const deleteSim = async (id: string) => {
    const { error } = await supabase.from("custom_simulations").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else setCustomSims(prev => prev.filter(s => s.id !== id));
  };

  /* ── No jobId state ── */
  if (!jobId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full"><CardContent className="p-8 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-foreground mb-2">No role selected</h2>
          <p className="text-sm text-muted-foreground mb-4">Select a role from the Simulation Builder to view its learning path.</p>
          <Button onClick={() => navigate("/products/simulation-builder")} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Go to Simulation Builder
          </Button>
        </CardContent></Card>
      </div>
    );
  }

  if (jobLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full"><CardContent className="p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-bold text-foreground mb-2">Role not found</h2>
          <Button onClick={() => navigate("/products/simulation-builder")} variant="outline" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        {/* Back nav */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/products/simulation-builder")} className="gap-1.5 text-xs mb-4 -ml-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Roles
        </Button>

        {/* Job Header */}
        <Card className="border-border bg-card mb-4">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground leading-tight">{job.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {companyName}
                  {job.department && ` · ${job.department}`}
                  {job.location && ` · ${job.location}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {riskBadge(job.automation_risk_percent)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                  onClick={() => job && analyzeJob(job, true)}
                  disabled={analyzing}
                  title="Re-analyze with latest AI data"
                >
                  <RefreshCw className={`h-4 w-4 ${analyzing ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[
                { label: "AI Augmented", value: job.augmented_percent, color: "bg-dot-blue" },
                { label: "Automation Risk", value: job.automation_risk_percent, color: "bg-destructive" },
                { label: "New Skills", value: job.new_skills_percent, color: "bg-dot-purple" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-bold text-foreground">{s.value ?? "—"}%</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  {s.value != null && (
                    <div className="h-1.5 rounded-full bg-secondary mt-2 overflow-hidden">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.value}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Update notification strip ── */}
        {updatedTaskNames.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Card className="border-primary/30 bg-primary/[0.03]">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-1.5 shrink-0">
                    <BellRing className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {updatedTaskNames.size} task{updatedTaskNames.size > 1 ? "s" : ""} updated
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {Array.from(updatedTaskNames).slice(0, 3).join(", ")}
                      {updatedTaskNames.size > 3 && ` +${updatedTaskNames.size - 3} more`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => {
                        const firstUpdated = analyzedTasks.find(t => updatedTaskNames.has(t.cluster_name));
                        if (firstUpdated) launchSim(firstUpdated);
                      }}
                    >
                      <Play className="h-3 w-3" /> Start
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => setUpdatedTaskNames(new Set())}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs: Learning Path | Custom Sims */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="path" className="gap-1.5 text-xs">
                <BookOpen className="w-3.5 h-3.5" /> Learning Path
                {pathStats && <span className="text-[10px] text-muted-foreground ml-1">{pathStats.total} tasks</span>}
              </TabsTrigger>
              <TabsTrigger value="custom" className="gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5" /> Custom Sims
                {customSims.length > 0 && <span className="text-[10px] text-muted-foreground ml-1">{customSims.length}</span>}
              </TabsTrigger>
            </TabsList>
            {activeTab === "custom" && (
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="w-4 h-4" /> Add Custom Sim
              </Button>
            )}
          </div>

          {/* ═══ LEARNING PATH TAB ═══ */}
          <TabsContent value="path">
            {/* Progress bar */}
            {pathProgress && user && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">
                    Progress: {pathProgress.completed}/{pathProgress.total} completed
                  </span>
                  <span className="text-xs font-semibold text-foreground">{pathProgress.percent}%</span>
                </div>
                <Progress value={pathProgress.percent} className="h-2" />
              </motion.div>
            )}

            {/* Stats bar */}
            {pathStats && (
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[
                  { label: "Critical", value: pathStats.critical, icon: AlertTriangle, iconColor: "text-destructive" },
                  { label: "Important", value: pathStats.important, icon: Target, iconColor: "text-warning" },
                  { label: "High AI Impact", value: pathStats.highImpact, icon: Brain, iconColor: "text-dot-purple" },
                  { label: "Total Time", value: `${pathStats.totalMinutes}m`, icon: Clock, iconColor: "text-muted-foreground" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5">
                    <s.icon className={`h-4 w-4 ${s.iconColor}`} />
                    <div>
                      <div className="text-base font-bold text-foreground">{s.value}</div>
                      <div className="text-[9px] text-muted-foreground">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loading */}
            {analyzing && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                <p className="text-sm text-muted-foreground">Analyzing {job.title} tasks…</p>
              </div>
            )}

            {/* Error */}
            {analysisError && !analyzing && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-destructive">{analysisError}</p>
                  <Button variant="outline" size="sm" onClick={() => analyzeJob(job)} className="mt-2 text-xs">Retry</Button>
                </CardContent>
              </Card>
            )}

            {/* Task Cards */}
            {!analyzing && analyzedTasks.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {analyzedTasks.map((task, i) => {
                  const recTemplate = templateMap[task.recommended_template || "quick-pulse"] || templates[0];
                  const RecIcon = recTemplate.icon;
                  const taskScore = getTaskCompletion(task.cluster_name, job.title);
                  const isCompleted = taskScore !== null;
                  const isUpdated = updatedTaskNames.has(task.cluster_name);

                  return (
                    <motion.div
                      key={task.id || i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Card className={`border-border bg-card hover:border-primary/30 transition-all group h-full ${isCompleted ? "border-success/30 bg-success/[0.02]" : ""} ${isUpdated ? "border-primary/30 bg-primary/[0.02] ring-1 ring-primary/10" : ""}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 pt-0.5">
                              {isCompleted ? (
                                <span className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center">
                                  <CheckCircle2 className="h-4 w-4 text-success" />
                                </span>
                              ) : (
                                <span className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-foreground">
                                  {i + 1}
                                </span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1.5">
                                  <h4 className={`font-semibold text-sm leading-tight ${isCompleted ? "text-success" : "text-foreground"}`}>
                                    {task.cluster_name}
                                  </h4>
                                  {isUpdated && (
                                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[8px] px-1 py-0 h-3.5 animate-pulse">
                                      Updated
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isCompleted && taskScore !== null && scoreBadge(taskScore)}
                                  {priorityBadge(task.priority)}
                                </div>
                              </div>

                              {task.description && (
                                <p className="text-xs text-muted-foreground leading-relaxed mb-2">{task.description}</p>
                              )}

                              <div className="flex items-center gap-3 mb-2">
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  {stateIcon(task.ai_state)} {stateLabel(task.ai_state)}
                                </span>
                                {task.ai_trend && task.ai_trend !== "stable" && (
                                  <span className="flex items-center gap-1 text-[10px] text-dot-amber">
                                    <TrendingUp className="h-3 w-3" />
                                    {task.ai_trend === "fully_ai_soon" ? "Full AI Soon" : "Growing AI"}
                                  </span>
                                )}
                              </div>

                              {task.skill_names && task.skill_names.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {task.skill_names.map(s => (
                                    <span key={s} className="rounded-md bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-foreground">{s}</span>
                                  ))}
                                </div>
                              )}

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

            {/* CTA */}
            {!analyzing && analyzedTasks.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6">
                <Card className="border-primary/20 bg-primary/[0.02]">
                  <CardContent className="p-5 text-center">
                    <Award className="h-6 w-6 text-primary mx-auto mb-2" />
                    <h3 className="font-semibold text-foreground text-sm mb-1">
                      {pathProgress?.percent === 100 ? "🎉 Learning Path Complete!" : "Complete Learning Path"}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      {pathProgress?.percent === 100
                        ? `Congratulations! You've completed all ${analyzedTasks.length} simulations for ${job.title}.`
                        : `Complete all ${analyzedTasks.length} simulations to earn your AI-Readiness Certificate for ${job.title}`}
                    </p>
                    {(!pathProgress || pathProgress.percent < 100) && (
                      <Button
                        className="gap-1.5"
                        onClick={() => {
                          const nextTask = analyzedTasks.find(t => getTaskCompletion(t.cluster_name, job.title) === null) || analyzedTasks[0];
                          launchSim(nextTask);
                        }}
                      >
                        {pathProgress && pathProgress.completed > 0 ? `Continue — Task ${pathProgress.completed + 1}` : "Start with Task 1"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* ═══ CUSTOM SIMS TAB ═══ */}
          <TabsContent value="custom">
            {!user ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Brain className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-foreground mb-1">Sign in to add custom sims</h3>
                  <Button className="mt-3" onClick={openAuthModal}>Sign In</Button>
                </CardContent>
              </Card>
            ) : customSims.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-10 text-center">
                  <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-foreground mb-1">No custom simulations for this role</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add simulations for tasks not covered by the AI-generated learning path above.
                  </p>
                  <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
                    <Plus className="w-4 h-4" /> Add Custom Sim
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {customSims.map(sim => {
                  const tmpl = templateMap[sim.recommended_template] || templates[0];
                  const TmplIcon = tmpl.icon;
                  const taskScore = getTaskCompletion(sim.task_name, sim.job_title);
                  return (
                    <Card key={sim.id} className="group hover:border-primary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-md border ${tmpl.color}`}>
                            <TmplIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{sim.task_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{tmpl.name}</Badge>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />{tmpl.duration}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {sim.source_type === "prompt" ? "✏️ Prompt" : "📄 Doc"}
                              </span>
                              {taskScore !== null && scoreBadge(taskScore)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => launchSim({ cluster_name: sim.task_name, ai_state: sim.ai_state || undefined, impact_level: sim.impact_level || undefined })}>
                              <Play className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteSim(sim.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Create Custom Sim Modal ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Custom Simulation</DialogTitle>
            <DialogDescription>
              Add a sim for "{job.title}" that isn't covered by the auto-generated learning path.
            </DialogDescription>
          </DialogHeader>
          <Tabs value={createTab} onValueChange={v => setCreateTab(v as "prompt" | "document")}>
            <TabsList className="w-full">
              <TabsTrigger value="prompt" className="flex-1 gap-1.5 text-xs"><MessageSquare className="w-3.5 h-3.5" /> Describe It</TabsTrigger>
              <TabsTrigger value="document" className="flex-1 gap-1.5 text-xs"><FileText className="w-3.5 h-3.5" /> Upload Doc</TabsTrigger>
            </TabsList>
            <TabsContent value="prompt" className="mt-3">
              <Textarea placeholder={`e.g. Practice reviewing AI-generated research summaries for ${job.title}...`} value={promptText} onChange={e => setPromptText(e.target.value)} rows={5} maxLength={2000} className="text-sm" />
              <p className="text-[10px] text-muted-foreground mt-1 text-right">{promptText.length}/2000</p>
            </TabsContent>
            <TabsContent value="document" className="mt-3">
              {!docFile ? (
                <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-border/60 rounded-lg cursor-pointer hover:border-primary/40 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground/40" />
                  <span className="text-sm text-muted-foreground">Drop PDF, DOCX, TXT, or MD</span>
                  <input type="file" accept=".pdf,.docx,.txt,.md" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                </label>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/40 border border-border/50">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground truncate flex-1">{docFile.name}</span>
                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => { setDocFile(null); setDocText(""); }}>Remove</Button>
                  </div>
                  {parsing && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Parsing...</div>}
                  {docText && !parsing && <p className="text-xs text-muted-foreground">✓ {docText.length.toLocaleString()} chars</p>}
                </div>
              )}
            </TabsContent>
          </Tabs>
          <Button onClick={handleCreate} disabled={creating} className="w-full mt-2 gap-1.5">
            {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Create Simulation</>}
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── Sim Runner ── */}
      <SimulatorModal
        open={simOpen}
        onClose={() => setSimOpen(false)}
        taskName={simTask}
        jobTitle={job.title}
        company={companyName}
        taskState={simTaskState}
        taskTrend={simTaskTrend}
        taskImpactLevel={simTaskImpact}
      />
    </div>
  );
}
