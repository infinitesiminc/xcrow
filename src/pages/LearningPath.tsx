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
  ai_exposure_score?: number;
  job_impact_score?: number;
  priority?: string;
}

interface CompletedSim {
  task_name: string;
  correct_answers: number;
  total_questions: number;
  job_title: string;
  rounds_completed: number;
  completed_at: string;
  tool_awareness_score: number | null;
  human_value_add_score: number | null;
  adaptive_thinking_score: number | null;
  domain_judgment_score: number | null;
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

/* ── Helpers ── */
function priorityBadge(p?: string) {
  if (p === "high") return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[11px]">High</Badge>;
  if (p === "medium") return <Badge className="bg-warning/10 text-warning border-warning/20 text-[11px]">Medium</Badge>;
  return <Badge className="bg-success/10 text-success border-success/20 text-[11px]">Low</Badge>;
}
function scoreBadge(score: number) {
  if (score >= 70) return <Badge className="bg-success/10 text-success border-success/20 text-[11px]">{score}%</Badge>;
  if (score >= 40) return <Badge className="bg-warning/10 text-warning border-warning/20 text-[11px]">{score}%</Badge>;
  return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[11px]">{score}%</Badge>;
}
function exposureBadge(score: number) {
  const cls = score >= 70 ? "bg-destructive/10 text-destructive border-destructive/20" : score >= 40 ? "bg-warning/10 text-warning border-warning/20" : "bg-success/10 text-success border-success/20";
  return <Badge className={`${cls} text-[11px]`}>{score}% AI</Badge>;
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

  /* ── Active tab ── */
  const [activeTab, setActiveTab] = useState<"path" | "custom">("path");

  /* ── Hover interaction between chart and task cards ── */
  const [hoveredTaskIndex, setHoveredTaskIndex] = useState<number | null>(null);

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
    return rawTasks.map((t: any) => ({
      ...t,
      ai_exposure_score: t.ai_exposure_score ?? 50,
      job_impact_score: t.job_impact_score ?? 50,
      priority: t.priority || "medium",
    }));
  };

  /* ── Snapshot helpers for automatic update detection ── */
  const snapshotKey = jobId ? `lp_snapshot_${jobId}` : null;

  const getStoredSnapshot = useCallback((): Record<string, { ai_exposure_score: number; priority: string }> | null => {
    if (!snapshotKey) return null;
    try {
      const raw = localStorage.getItem(snapshotKey);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, [snapshotKey]);

  const saveSnapshot = useCallback((tasks: EnrichedTask[]) => {
    if (!snapshotKey) return;
    const snap: Record<string, { ai_exposure_score: number; priority: string }> = {};
    tasks.forEach(t => {
      snap[t.cluster_name] = { ai_exposure_score: t.ai_exposure_score ?? 50, priority: t.priority || "medium" };
    });
    localStorage.setItem(snapshotKey, JSON.stringify(snap));
  }, [snapshotKey]);

  /* ── Analyze tasks ── */
  const analyzeJob = useCallback(async (j: DbJob, forceRefresh = false) => {
    setAnalyzing(true);
    setAnalysisError(null);
    if (!forceRefresh) setAnalyzedTasks([]);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-role-tasks", {
        body: { jobId: j.id, jobTitle: j.title, company: companyName, description: j.description, forceRefresh },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const tasks = enrichTasks(data.tasks || []);
      setAnalyzedTasks(tasks);
      setLastRefreshed(new Date());

      // Auto-detect changes against stored snapshot
      const previousSnap = getStoredSnapshot();
      if (previousSnap && Object.keys(previousSnap).length > 0) {
        const changed = new Set<string>();
        tasks.forEach(newTask => {
          const old = previousSnap[newTask.cluster_name];
          if (!old) {
            changed.add(newTask.cluster_name);
          } else if (
            old.ai_exposure_score !== (newTask.ai_exposure_score ?? 50) ||
            old.priority !== (newTask.priority || "medium")
          ) {
            changed.add(newTask.cluster_name);
          }
        });
        Object.keys(previousSnap).forEach(name => {
          if (!tasks.find(t => t.cluster_name === name)) changed.add(name);
        });
        setUpdatedTaskNames(changed);
        if (changed.size > 0) {
          toast({ title: `${changed.size} task${changed.size > 1 ? "s" : ""} updated`, description: "AI impact assessments have changed since your last visit." });
        }
      }

      saveSnapshot(tasks);
    } catch (err: any) {
      setAnalysisError(err.message || "Analysis failed");
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    }
    setAnalyzing(false);
  }, [companyName, toast, getStoredSnapshot, saveSnapshot]);

  useEffect(() => {
    if (job) analyzeJob(job);
  }, [job]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Fetch completed sims ── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("completed_simulations")
        .select("task_name, correct_answers, total_questions, job_title, rounds_completed, completed_at, tool_awareness_score, human_value_add_score, adaptive_thinking_score, domain_judgment_score")
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
    const avgExposure = Math.round(analyzedTasks.reduce((s, t) => s + (t.ai_exposure_score ?? 50), 0) / analyzedTasks.length);
    return {
      high: analyzedTasks.filter(t => t.priority === "high").length,
      medium: analyzedTasks.filter(t => t.priority === "medium").length,
      avgExposure,
      total: analyzedTasks.length,
    };
  }, [analyzedTasks]);

  /* ── Launch sim ── */
  const launchSim = (task: EnrichedTask | { cluster_name: string }) => {
    setSimTask(task.cluster_name);
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

  // Chart helper
  const getQuadrantColor = (exposure: number, impact: number) => {
    if (exposure >= 50 && impact >= 50) return { fill: "hsl(var(--destructive))", bg: "bg-destructive" };
    if (exposure < 50 && impact >= 50) return { fill: "hsl(var(--success))", bg: "bg-success" };
    if (exposure >= 50 && impact < 50) return { fill: "hsl(var(--warning))", bg: "bg-warning" };
    return { fill: "hsl(var(--muted-foreground))", bg: "bg-muted-foreground" };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
        {/* Back nav */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/products/simulation-builder")} className="gap-1.5 text-xs mb-4 -ml-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Roles
        </Button>

        {/* Job Header — full width */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground leading-tight">{job.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {companyName}
                {job.department && ` · ${job.department}`}
                {job.location && ` · ${job.location}`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary shrink-0"
              onClick={() => job && analyzeJob(job, true)}
              disabled={analyzing}
              title="Re-analyze with latest AI data"
            >
              <RefreshCw className={`h-4 w-4 ${analyzing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* ── Update notification strip ── */}
        {updatedTaskNames.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
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
                  </div>
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={() => { const t = analyzedTasks.find(t => updatedTaskNames.has(t.cluster_name)); if (t) launchSim(t); }}>
                    <Play className="h-3 w-3" /> Start
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => setUpdatedTaskNames(new Set())}>Dismiss</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="path" className="gap-1.5 text-xs">
                <BookOpen className="w-3.5 h-3.5" /> Learning Path
                {pathStats && <span className="text-[11px] text-muted-foreground ml-1">{pathStats.total} tasks</span>}
              </TabsTrigger>
              <TabsTrigger value="custom" className="gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5" /> Custom Sims
                {customSims.length > 0 && <span className="text-[11px] text-muted-foreground ml-1">{customSims.length}</span>}
              </TabsTrigger>
            </TabsList>
            {activeTab === "custom" && (
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="w-4 h-4" /> Add Custom Sim
              </Button>
            )}
          </div>

          {/* ═══ LEARNING PATH TAB — Two Column ═══ */}
          <TabsContent value="path">
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

            {/* Two-column: Chart (sticky) | Tasks (scrollable) */}
            {!analyzing && analyzedTasks.length > 0 && (
              <div className="flex flex-col md:flex-row gap-6">
                {/* LEFT: Sticky chart panel */}
                <div className="md:w-[340px] shrink-0">
                  <div className="md:sticky md:top-6 space-y-4">
                    {/* AI Exposure Score */}
                    <Card className="border-border bg-card">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="text-3xl font-bold text-foreground">{job.augmented_percent ?? "—"}%</div>
                            <div className="text-xs text-muted-foreground">AI Exposure</div>
                          </div>
                          {job.augmented_percent != null && (
                            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                              <div
                                className={`h-full rounded-full ${job.augmented_percent >= 70 ? "bg-destructive" : job.augmented_percent >= 40 ? "bg-warning" : "bg-success"}`}
                                style={{ width: `${job.augmented_percent}%` }}
                              />
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground/60 mt-1">How much of the important work is AI-exposed</p>
                      </CardContent>
                    </Card>

                    {/* Radar Chart — AI Exposure per task */}
                    {analyzedTasks.length >= 3 && (() => {
                      const tasks = analyzedTasks.slice(0, 12);
                      const cx = 170, cy = 140, r = 110;
                      const n = tasks.length;
                      const angleStep = (2 * Math.PI) / n;
                      const startAngle = -Math.PI / 2;

                      const rings = [25, 50, 75, 100];
                      const getPoint = (i: number, val: number) => {
                        const angle = startAngle + i * angleStep;
                        const dist = (val / 100) * r;
                        return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
                      };

                      const polygonPoints = tasks.map((t, i) => {
                        const p = getPoint(i, t.ai_exposure_score ?? 50);
                        return `${p.x},${p.y}`;
                      }).join(" ");

                      return (
                        <Card className="border-border bg-card">
                          <CardContent className="p-4">
                            <svg viewBox="0 0 340 280" className="w-full" onMouseLeave={() => setHoveredTaskIndex(null)}>
                              {/* Grid rings */}
                              {rings.map(pct => (
                                <circle key={pct} cx={cx} cy={cy} r={(pct / 100) * r} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.4} />
                              ))}
                              {/* Ring labels */}
                              {rings.map(pct => (
                                <text key={`lbl-${pct}`} x={cx + 2} y={cy - (pct / 100) * r + 3} className="text-[7px]" fill="hsl(var(--muted-foreground))" opacity={0.4}>{pct}</text>
                              ))}
                              {/* Spokes */}
                              {tasks.map((_, i) => {
                                const p = getPoint(i, 100);
                                return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="hsl(var(--border))" strokeWidth="0.3" opacity={0.3} />;
                              })}
                              {/* Filled polygon */}
                              <polygon points={polygonPoints} fill="hsl(var(--primary) / 0.12)" stroke="hsl(var(--primary))" strokeWidth="1.5" />
                              {/* Data dots + labels */}
                              {tasks.map((t, i) => {
                                const exposure = t.ai_exposure_score ?? 50;
                                const p = getPoint(i, exposure);
                                const labelP = getPoint(i, 115);
                                const isHovered = hoveredTaskIndex === i;
                                const isAnyHovered = hoveredTaskIndex !== null;
                                const dotColor = exposure >= 70 ? "hsl(var(--destructive))" : exposure >= 40 ? "hsl(var(--warning))" : "hsl(var(--success))";
                                return (
                                  <g
                                    key={i}
                                    onMouseEnter={() => setHoveredTaskIndex(i)}
                                    className="cursor-pointer"
                                    opacity={isAnyHovered && !isHovered ? 0.3 : 1}
                                    style={{ transition: "opacity 0.15s" }}
                                  >
                                    {isHovered && <circle cx={p.x} cy={p.y} r="12" fill={dotColor} opacity={0.12} />}
                                    <circle cx={p.x} cy={p.y} r={isHovered ? "5" : "3.5"} fill={dotColor} style={{ transition: "r 0.15s" }} />
                                    <text x={labelP.x} y={labelP.y} textAnchor="middle" dominantBaseline="central" className={`${isHovered ? "text-[9px] font-bold" : "text-[8px] font-medium"}`} fill="hsl(var(--foreground))">
                                      {i + 1}
                                    </text>
                                    {isHovered && (
                                      <>
                                        <rect x={p.x - 65} y={p.y - 22} width="130" height="16" rx="3" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="0.5" />
                                        <text x={p.x} y={p.y - 13} textAnchor="middle" className="text-[7px]" fill="hsl(var(--foreground))">
                                          {t.cluster_name.length > 24 ? t.cluster_name.slice(0, 24) + "…" : t.cluster_name} ({exposure}%)
                                        </text>
                                      </>
                                    )}
                                  </g>
                                );
                              })}
                            </svg>
                            <p className="text-[11px] text-muted-foreground text-center -mt-1">AI Exposure by Task</p>
                          </CardContent>
                        </Card>
                      );
                    })()}

                    {/* Progress */}
                    {pathProgress && user && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {pathProgress.completed}/{pathProgress.total}
                        </span>
                        <Progress value={pathProgress.percent} className="h-1.5 flex-1" />
                        <span className="text-xs font-semibold text-foreground">{pathProgress.percent}%</span>
                      </div>
                    )}
                    {pathStats && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>~{pathStats.total * 15}m total</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: Task list */}
                <div className="flex-1 min-w-0 space-y-3">
                  {analyzedTasks.map((task, i) => {
                    const taskScore = getTaskCompletion(task.cluster_name, job.title);
                    const isCompleted = taskScore !== null;
                    const isUpdated = updatedTaskNames.has(task.cluster_name);
                    const exposure = task.ai_exposure_score ?? 50;
                    const isHovered = hoveredTaskIndex === i;

                    const aiMeta = exposure >= 70
                      ? { icon: AlertTriangle, color: "text-destructive", summary: "AI can handle most of this today — focus on oversight and quality judgment." }
                      : exposure >= 50
                      ? { icon: Zap, color: "text-warning", summary: "AI is increasingly capable here — learn to collaborate with AI tools effectively." }
                      : exposure >= 30
                      ? { icon: Brain, color: "text-dot-purple", summary: "AI assists with parts of this task — your expertise remains the differentiator." }
                      : { icon: Shield, color: "text-success", summary: "This task relies heavily on human judgment — AI plays a minimal role." };
                    const AiIcon = aiMeta.icon;

                    return (
                      <motion.div
                        key={task.id || i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onMouseEnter={() => setHoveredTaskIndex(i)}
                        onMouseLeave={() => setHoveredTaskIndex(null)}
                      >
                        <Card className={`border-border bg-card transition-all group ${isCompleted ? "border-success/30 bg-success/[0.02]" : ""} ${isUpdated ? "border-primary/30 bg-primary/[0.02] ring-1 ring-primary/10" : ""} ${isHovered ? "border-primary/40 shadow-sm" : "hover:border-primary/20"}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="shrink-0 pt-0.5">
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isCompleted ? "bg-success/15 text-success ring-1 ring-success/30" : isHovered ? "bg-primary text-primary-foreground" : "bg-accent text-foreground"}`}>
                                  {i + 1}
                                </span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h4 className={`font-semibold text-sm leading-snug ${isCompleted ? "text-success" : "text-foreground"}`}>
                                    {task.cluster_name}
                                  </h4>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {isCompleted && taskScore !== null && scoreBadge(taskScore)}
                                    {isUpdated && (
                                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[11px] px-1.5 py-0 h-4 animate-pulse">Updated</Badge>
                                    )}
                                  </div>
                                </div>

                                {task.description && (
                                  <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">{task.description}</p>
                                )}

                                <p className="text-[11px] text-muted-foreground/80 italic mb-2 flex items-start gap-1.5">
                                  <AiIcon className={`h-3 w-3 shrink-0 mt-0.5 ${aiMeta.color}`} />
                                  {aiMeta.summary}
                                </p>

                                {task.skill_names && task.skill_names.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {task.skill_names.map(s => (
                                      <span key={s} className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-foreground">{s}</span>
                                    ))}
                                  </div>
                                )}

                                {/* Completed round data */}
                                {isCompleted && (() => {
                                  const rounds = completedSims.filter(s => s.task_name === task.cluster_name && s.job_title === job.title);
                                  const best = rounds.reduce((b, s) => {
                                    const score = s.total_questions > 0 ? Math.round((s.correct_answers / s.total_questions) * 100) : 0;
                                    return score > (b.total_questions > 0 ? Math.round((b.correct_answers / b.total_questions) * 100) : 0) ? s : b;
                                  }, rounds[0]);
                                  const pillars = [
                                    { label: "Tool", val: best.tool_awareness_score },
                                    { label: "Human", val: best.human_value_add_score },
                                    { label: "Adapt", val: best.adaptive_thinking_score },
                                    { label: "Domain", val: best.domain_judgment_score },
                                  ].filter(p => p.val !== null);
                                  return (
                                    <div className="rounded-md bg-muted/50 px-2.5 py-2 mb-2 space-y-1">
                                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                        <span>{rounds.length} round{rounds.length > 1 ? "s" : ""}</span>
                                        <span>Best: {best.correct_answers}/{best.total_questions}</span>
                                      </div>
                                      {pillars.length > 0 && (
                                        <div className="flex gap-2">
                                          {pillars.map(p => (
                                            <div key={p.label} className="flex items-center gap-1 text-[11px]">
                                              <span className="text-muted-foreground">{p.label}</span>
                                              <span className={`font-semibold ${p.val! >= 70 ? "text-success" : p.val! >= 40 ? "text-warning" : "text-destructive"}`}>{p.val}%</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <GraduationCap className="h-3 w-3" />
                                    <span>15 min</span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={isCompleted ? "outline" : "default"}
                                    className="h-9 px-4 text-xs gap-1.5"
                                    onClick={() => launchSim(task)}
                                  >
                                    <Play className="h-3.5 w-3.5" />
                                    {isCompleted ? "Retry" : "Practise Task"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}

                  {/* CTA */}
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
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
                          <Button className="gap-1.5" onClick={() => { const t = analyzedTasks.find(t => getTaskCompletion(t.cluster_name, job.title) === null) || analyzedTasks[0]; launchSim(t); }}>
                            {pathProgress && pathProgress.completed > 0 ? `Continue — Task ${pathProgress.completed + 1}` : "Start with Task 1"}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>
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
                  const taskScore = getTaskCompletion(sim.task_name, sim.job_title);
                  return (
                    <Card key={sim.id} className="group hover:border-primary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md border bg-dot-blue/10 text-dot-blue border-dot-blue/20">
                            <GraduationCap className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{sim.task_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[11px] px-1.5 py-0">15 min</Badge>
                              <span className="text-[11px] text-muted-foreground">
                                {sim.source_type === "prompt" ? "✏️ Prompt" : "📄 Doc"}
                              </span>
                              {taskScore !== null && scoreBadge(taskScore)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => launchSim({ cluster_name: sim.task_name })}>
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
        mode="upskill"
      />
    </div>
  );
}
