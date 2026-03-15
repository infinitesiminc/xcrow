import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, FileText, MessageSquare, Zap, GraduationCap, ClipboardCheck,
  Users, Loader2, Trash2, Play, ChevronDown, ChevronUp, Upload,
  Sparkles, Clock, AlertTriangle, Brain, Search, Briefcase,
  BookOpen, Save, TrendingUp, Target, BarChart3, Award,
  CheckCircle2, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import SimulatorModal from "@/components/SimulatorModal";

/* ── Template config ── */
const templateMeta: Record<string, { name: string; icon: any; color: string; duration: string }> = {
  "quick-pulse": { name: "Quick Pulse", icon: Zap, color: "bg-dot-teal/10 text-dot-teal border-dot-teal/20", duration: "~3 min" },
  "deep-dive": { name: "Deep Dive", icon: GraduationCap, color: "bg-dot-blue/10 text-dot-blue border-dot-blue/20", duration: "~15 min" },
  "case-challenge": { name: "Case Challenge", icon: ClipboardCheck, color: "bg-dot-purple/10 text-dot-purple border-dot-purple/20", duration: "~30 min" },
  "full-panel": { name: "Full Panel", icon: Users, color: "bg-dot-amber/10 text-dot-amber border-dot-amber/20", duration: "~60 min" },
};

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

interface CompletedSim {
  id: string;
  job_title: string;
  task_name: string;
  company: string | null;
  correct_answers: number;
  total_questions: number;
  rounds_completed: number;
  completed_at: string;
  experience_level: string | null;
}

export default function LearningPath() {
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();

  const [activeSection, setActiveSection] = useState<"overview" | "library" | "results">("overview");

  /* ── Library state ── */
  const [sims, setSims] = useState<CustomSim[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  // Create form
  const [createTab, setCreateTab] = useState<"prompt" | "document">("prompt");
  const [promptText, setPromptText] = useState("");
  const [docText, setDocText] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);

  // Sim runner
  const [simTask, setSimTask] = useState<{ taskName: string; jobTitle: string; company?: string } | null>(null);

  /* ── Results state ── */
  const [completedSims, setCompletedSims] = useState<CompletedSim[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);

  /* ── Fetch custom sims ── */
  const fetchSims = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("custom_simulations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) console.error("Fetch sims error:", error);
    setSims((data as CustomSim[]) || []);
    setLoading(false);
  }, [user]);

  /* ── Fetch completed sims ── */
  const fetchResults = useCallback(async () => {
    if (!user) return;
    setResultsLoading(true);
    const { data, error } = await supabase
      .from("completed_simulations")
      .select("*")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false });
    if (error) console.error("Fetch results error:", error);
    setCompletedSims((data as CompletedSim[]) || []);
    setResultsLoading(false);
  }, [user]);

  useEffect(() => { fetchSims(); fetchResults(); }, [fetchSims, fetchResults]);

  /* ── Skill gap tracker data ── */
  const skillStats = useMemo(() => {
    if (!completedSims.length) return null;
    const byRole = new Map<string, { total: number; correct: number; sessions: number }>();
    completedSims.forEach(s => {
      const entry = byRole.get(s.job_title) || { total: 0, correct: 0, sessions: 0 };
      entry.total += s.total_questions;
      entry.correct += s.correct_answers;
      entry.sessions += 1;
      byRole.set(s.job_title, entry);
    });

    const roles = Array.from(byRole.entries()).map(([role, stats]) => ({
      role,
      avgScore: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      sessions: stats.sessions,
      totalQuestions: stats.total,
    })).sort((a, b) => b.sessions - a.sessions);

    const overallCorrect = completedSims.reduce((s, c) => s + c.correct_answers, 0);
    const overallTotal = completedSims.reduce((s, c) => s + c.total_questions, 0);
    const overallScore = overallTotal > 0 ? Math.round((overallCorrect / overallTotal) * 100) : 0;

    return { roles, overallScore, totalSessions: completedSims.length };
  }, [completedSims]);

  /* ── Group library sims by job title ── */
  const grouped = useMemo(() => {
    const map: Record<string, CustomSim[]> = {};
    for (const s of sims) {
      const key = s.job_title;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [sims]);

  /* ── Handle doc file upload ── */
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
    if (!user) return;
    const input = createTab === "prompt" ? promptText.trim() : docText.trim();
    if (!input) { toast({ title: "Enter something", description: "Provide a prompt or upload a document.", variant: "destructive" }); return; }
    setCreating(true);
    try {
      const body: any = { userId: user.id };
      if (createTab === "prompt") body.prompt = input; else body.documentText = input;
      const { data, error } = await supabase.functions.invoke("compile-custom-sim", { body });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast({ title: "Simulation created!", description: `"${data.simulation.task_name}" saved to your library.` });
      setCreateOpen(false);
      setPromptText(""); setDocText(""); setDocFile(null);
      fetchSims();
    } catch (err: any) {
      toast({ title: "Creation failed", description: err.message, variant: "destructive" });
    }
    setCreating(false);
  };

  /* ── Delete sim ── */
  const deleteSim = async (id: string) => {
    const { error } = await supabase.from("custom_simulations").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else setSims(prev => prev.filter(s => s.id !== id));
  };

  const scoreColor = (score: number) =>
    score >= 70 ? "text-dot-teal" : score >= 40 ? "text-dot-amber" : "text-destructive";

  const scoreBarColor = (score: number) =>
    score >= 70 ? "bg-dot-teal" : score >= 40 ? "bg-dot-amber" : "bg-destructive";

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full"><CardContent className="p-8 text-center">
          <Brain className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="text-lg font-bold text-foreground mb-2">Sign in to access Learning Path</h2>
          <p className="text-sm text-muted-foreground">Track skill gaps, manage custom simulations, and view your progress.</p>
          <Button className="mt-4" onClick={openAuthModal}>Sign In</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Learning Path</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your AI-readiness journey across roles and skills
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5 self-start">
            <Plus className="w-4 h-4" /> Create Custom Sim
          </Button>
        </div>

        {/* Section Nav */}
        <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as any)} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="overview" className="gap-1.5 text-xs">
              <Target className="w-3.5 h-3.5" /> Skill Gaps
            </TabsTrigger>
            <TabsTrigger value="library" className="gap-1.5 text-xs">
              <BookOpen className="w-3.5 h-3.5" /> Custom Sims
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-1.5 text-xs">
              <BarChart3 className="w-3.5 h-3.5" /> All Results
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════ SKILL GAP TRACKER ═══════════════════ */}
          <TabsContent value="overview" className="mt-6">
            {resultsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !skillStats ? (
              <Card className="border-dashed">
                <CardContent className="p-10 text-center">
                  <Target className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-foreground mb-1">No skill data yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete simulations to see your skill gap analysis.
                  </p>
                  <Button variant="outline" onClick={() => setActiveSection("library")} className="gap-1.5">
                    <BookOpen className="w-4 h-4" /> View Custom Sims
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overall Score</p>
                        <Award className={`w-5 h-5 ${scoreColor(skillStats.overallScore)}`} />
                      </div>
                      <p className={`text-3xl font-bold ${scoreColor(skillStats.overallScore)}`}>
                        {skillStats.overallScore}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        across {skillStats.totalSessions} session{skillStats.totalSessions !== 1 ? "s" : ""}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Roles Practiced</p>
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-3xl font-bold text-foreground">{skillStats.roles.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">unique job titles</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Custom Sims</p>
                        <Sparkles className="w-5 h-5 text-dot-purple" />
                      </div>
                      <p className="text-3xl font-bold text-foreground">{sims.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">in your library</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Per-role skill gap breakdown */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Proficiency by Role</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {skillStats.roles.map(r => (
                      <div key={r.role}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{r.role}</p>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                              {r.sessions} session{r.sessions !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                          <span className={`text-sm font-bold ${scoreColor(r.avgScore)}`}>{r.avgScore}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${r.avgScore}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${scoreBarColor(r.avgScore)}`}
                          />
                        </div>
                        {r.avgScore < 70 && (
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <TrendingUp className="w-2.5 h-2.5" />
                            {r.avgScore < 40 ? "Needs significant practice" : "Almost there — keep practicing"}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ═══════════════════ CUSTOM SIMS LIBRARY ═══════════════════ */}
          <TabsContent value="library" className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : sims.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-10 text-center">
                  <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-foreground mb-1">No custom simulations yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a custom sim to practice tasks not covered by template-generated simulations.
                  </p>
                  <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
                    <Plus className="w-4 h-4" /> Create Custom Sim
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {grouped.map(([jobTitle, items]) => {
                  const isExpanded = expandedJob === jobTitle || grouped.length === 1;
                  return (
                    <Card key={jobTitle}>
                      <button onClick={() => setExpandedJob(isExpanded && grouped.length > 1 ? null : jobTitle)} className="w-full flex items-center justify-between p-4 text-left">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{jobTitle}</h3>
                          <p className="text-xs text-muted-foreground">{items.length} simulation{items.length !== 1 ? "s" : ""}</p>
                        </div>
                        {grouped.length > 1 && (isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />)}
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-4 pb-4 space-y-2">
                              {items.map(sim => {
                                const tmpl = templateMeta[sim.recommended_template] || templateMeta["quick-pulse"];
                                const TmplIcon = tmpl.icon;
                                return (
                                  <div key={sim.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
                                    <div className={`p-1.5 rounded-md border ${tmpl.color}`}>
                                      <TmplIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">{sim.task_name}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{tmpl.name}</Badge>
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{tmpl.duration}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                          {sim.source_type === "prompt" ? "✏️ Prompt" : sim.source_type === "job_browser" ? "💼 Job" : "📄 Doc"}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSimTask({ taskName: sim.task_name, jobTitle: sim.job_title, company: sim.company || undefined })}>
                                        <Play className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteSim(sim.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ═══════════════════ ALL RESULTS ═══════════════════ */}
          <TabsContent value="results" className="mt-6">
            {resultsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : completedSims.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-10 text-center">
                  <BarChart3 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-foreground mb-1">No results yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete simulations to see your results here.
                  </p>
                  <Button variant="outline" onClick={() => setActiveSection("library")} className="gap-1.5">
                    <Play className="w-4 h-4" /> Go to Sims
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {completedSims.map(sim => {
                  const score = sim.total_questions > 0 ? Math.round((sim.correct_answers / sim.total_questions) * 100) : 0;
                  return (
                    <Card key={sim.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${score >= 70 ? "bg-dot-teal/10" : score >= 40 ? "bg-dot-amber/10" : "bg-destructive/10"}`}>
                            <CheckCircle2 className={`w-5 h-5 ${scoreColor(score)}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{sim.task_name}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-muted-foreground">{sim.job_title}</span>
                              {sim.company && <span className="text-xs text-muted-foreground">• {sim.company}</span>}
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(sim.completed_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`text-lg font-bold ${scoreColor(score)}`}>{score}%</p>
                            <p className="text-[10px] text-muted-foreground">
                              {sim.correct_answers}/{sim.total_questions}
                            </p>
                          </div>
                          <Button
                            size="sm" variant="ghost" className="h-8 w-8 p-0 flex-shrink-0"
                            onClick={() => setSimTask({ taskName: sim.task_name, jobTitle: sim.job_title, company: sim.company || undefined })}
                            title="Re-run simulation"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Button>
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

      {/* ── Create Modal ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Custom Simulation</DialogTitle>
            <DialogDescription>Add a simulation not covered by template-generated analyses. Describe a task or upload a document.</DialogDescription>
          </DialogHeader>
          <Tabs value={createTab} onValueChange={(v) => setCreateTab(v as "prompt" | "document")}>
            <TabsList className="w-full">
              <TabsTrigger value="prompt" className="flex-1 gap-1.5 text-xs"><MessageSquare className="w-3.5 h-3.5" /> Describe It</TabsTrigger>
              <TabsTrigger value="document" className="flex-1 gap-1.5 text-xs"><FileText className="w-3.5 h-3.5" /> Upload Doc</TabsTrigger>
            </TabsList>
            <TabsContent value="prompt" className="mt-3">
              <Textarea placeholder="e.g. Practice negotiating a SaaS contract renewal..." value={promptText} onChange={e => setPromptText(e.target.value)} rows={5} maxLength={2000} className="text-sm" />
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
                  {parsing && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Parsing document...</div>}
                  {docText && !parsing && <p className="text-xs text-muted-foreground">✓ Extracted {docText.length.toLocaleString()} characters</p>}
                </div>
              )}
            </TabsContent>
          </Tabs>
          <div className="flex items-center gap-2 mt-2 p-2.5 rounded-md bg-muted/30 border border-border/30">
            <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">AI extracts the role, task, and context — then assigns a simulation format based on complexity scoring.</p>
          </div>
          <Button onClick={handleCreate} disabled={creating} className="w-full mt-1 gap-1.5">
            {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Create Simulation</>}
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── Sim Runner ── */}
      {simTask && (
        <SimulatorModal
          open={!!simTask}
          onClose={() => setSimTask(null)}
          taskName={simTask.taskName}
          jobTitle={simTask.jobTitle}
          company={simTask.company}
        />
      )}
    </div>
  );
}
