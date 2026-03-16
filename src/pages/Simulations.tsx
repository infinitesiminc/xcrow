import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, FileText, MessageSquare, GraduationCap,
  Loader2, Trash2, Play, ChevronDown, ChevronUp, Upload,
  Sparkles, Clock, Brain, Search, Briefcase,
  BookOpen, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import SimulatorModal from "@/components/SimulatorModal";

interface CustomSim {
  id: string;
  job_title: string;
  company: string | null;
  task_name: string;
  source_type: string;
  recommended_template: string;
  priority: string | null;
  sim_duration: number | null;
  created_at: string;
}

interface DbJob {
  id: string;
  title: string;
  department: string | null;
  seniority: string | null;
  location: string | null;
  augmented_percent: number | null;
  description: string | null;
  company_id: string | null;
}

interface EnrichedTask {
  id: string;
  cluster_name: string;
  description: string | null;
  outcome: string | null;
  skill_names: string[] | null;
  ai_exposure_score?: number;
  job_impact_score?: number;
  priority?: string;
}

interface CompanyInfo {
  id: string;
  name: string;
}

function exposureBadge(score: number) {
  const cls = score >= 70 ? "bg-destructive/10 text-destructive border-destructive/20" : score >= 40 ? "bg-warning/10 text-warning border-warning/20" : "bg-success/10 text-success border-success/20";
  return <Badge className={`${cls} text-[10px]`}>{score}% AI</Badge>;
}

function priorityBadge(p?: string) {
  if (p === "high") return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-destructive/30 text-destructive">High</Badge>;
  if (p === "medium") return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-warning/30 text-warning">Medium</Badge>;
  return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-success/30 text-success">Low</Badge>;
}

export default function Simulations() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [mainTab, setMainTab] = useState<"library" | "browse">("library");

  /* ── Library state ── */
  const [sims, setSims] = useState<CustomSim[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const [createTab, setCreateTab] = useState<"prompt" | "document">("prompt");
  const [promptText, setPromptText] = useState("");
  const [docText, setDocText] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);

  const [simTask, setSimTask] = useState<{ taskName: string; jobTitle: string; company?: string } | null>(null);

  /* ── Job browser state ── */
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [jobSearch, setJobSearch] = useState("");
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedBrowseJob, setSelectedBrowseJob] = useState<DbJob | null>(null);
  const [browseTasks, setBrowseTasks] = useState<EnrichedTask[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);

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

  useEffect(() => { fetchSims(); }, [fetchSims]);

  /* ── Fetch companies ── */
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("companies").select("id, name").order("name");
      if (data?.length) {
        setCompanies(data);
        setSelectedCompanyId(data[0].id);
      }
    })();
  }, []);

  /* ── Fetch jobs ── */
  useEffect(() => {
    if (!selectedCompanyId) return;
    (async () => {
      setJobsLoading(true);
      setSelectedBrowseJob(null);
      setBrowseTasks([]);
      const { data } = await supabase
        .from("jobs")
        .select("id, title, department, seniority, location, augmented_percent, description, company_id")
        .eq("company_id", selectedCompanyId)
        .order("title");
      setJobs(data || []);
      setJobsLoading(false);
    })();
  }, [selectedCompanyId]);

  /* ── Analyze job tasks ── */
  const analyzeJob = useCallback(async (job: DbJob) => {
    setAnalyzing(true);
    setBrowseTasks([]);
    const companyName = companies.find(c => c.id === job.company_id)?.name || "";
    try {
      const { data, error } = await supabase.functions.invoke("analyze-role-tasks", {
        body: { jobId: job.id, jobTitle: job.title, company: companyName, description: job.description },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const tasks = (data.tasks || []).map((t: any) => ({
        ...t,
        ai_exposure_score: t.ai_exposure_score ?? 50,
        job_impact_score: t.job_impact_score ?? 50,
        priority: t.priority || "medium",
      }));
      setBrowseTasks(tasks);
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    }
    setAnalyzing(false);
  }, [companies, toast]);

  useEffect(() => {
    if (selectedBrowseJob) analyzeJob(selectedBrowseJob);
    else setBrowseTasks([]);
  }, [selectedBrowseJob, analyzeJob]);

  /* ── Save task to library ── */
  const saveTaskToLibrary = async (task: EnrichedTask, job: DbJob) => {
    if (!user) return;
    setSavingTaskId(task.id);
    const companyName = companies.find(c => c.id === job.company_id)?.name || null;
    const { error } = await supabase.from("custom_simulations").insert({
      user_id: user.id,
      job_title: job.title,
      company: companyName,
      task_name: task.cluster_name,
      source_type: "job_browser",
      recommended_template: "deep-dive",
      priority: task.priority || null,
      sim_duration: 15,
    });
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved to library", description: `"${task.cluster_name}" added.` });
      fetchSims();
    }
    setSavingTaskId(null);
  };

  /* ── Filtered jobs ── */
  const filteredJobs = useMemo(() => {
    if (!jobSearch.trim()) return jobs;
    const q = jobSearch.toLowerCase();
    return jobs.filter(j => j.title.toLowerCase().includes(q) || j.department?.toLowerCase().includes(q));
  }, [jobs, jobSearch]);

  const groupedBrowseJobs = useMemo(() => {
    const groups = new Map<string, DbJob[]>();
    filteredJobs.forEach(j => {
      const dept = j.department || "Other";
      if (!groups.has(dept)) groups.set(dept, []);
      groups.get(dept)!.push(j);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredJobs]);

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

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full"><CardContent className="p-8 text-center">
          <Brain className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="text-lg font-bold text-foreground mb-2">Sign in to access your Sim Library</h2>
          <p className="text-sm text-muted-foreground">Create and manage custom AI-readiness simulations.</p>
          <Button className="mt-4" onClick={() => window.location.href = "/auth"}>Sign In</Button>
        </CardContent></Card>
      </div>
    );
  }

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Simulation Library</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {sims.length} saved simulation{sims.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Create
          </Button>
        </div>

        {/* Main tabs */}
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "library" | "browse")} className="mb-6">
          <TabsList>
            <TabsTrigger value="library" className="gap-1.5 text-xs">
              <BookOpen className="w-3.5 h-3.5" /> My Library
            </TabsTrigger>
            <TabsTrigger value="browse" className="gap-1.5 text-xs">
              <Briefcase className="w-3.5 h-3.5" /> Browse Jobs
            </TabsTrigger>
          </TabsList>

          {/* ── Library Tab ── */}
          <TabsContent value="library" className="mt-4">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && sims.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-10 text-center">
                  <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-foreground mb-1">No simulations yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Create a custom sim or browse jobs to save tasks.</p>
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" onClick={() => setCreateOpen(true)} className="gap-1.5">
                      <Plus className="w-4 h-4" /> Create Custom
                    </Button>
                    <Button variant="outline" onClick={() => setMainTab("browse")} className="gap-1.5">
                      <Briefcase className="w-4 h-4" /> Browse Jobs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {!loading && grouped.map(([jobTitle, items]) => {
              const isExpanded = expandedJob === jobTitle || grouped.length === 1;
              return (
                <Card key={jobTitle} className="mb-3">
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
                          {items.map(sim => (
                            <div key={sim.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
                              <div className="p-1.5 rounded-md border bg-brand-human/10 text-brand-human border-brand-human/20">
                                <GraduationCap className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{sim.task_name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">15 min</Badge>
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
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </TabsContent>

          {/* ── Browse Jobs Tab ── */}
          <TabsContent value="browse" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Left: Job list */}
              <div className="lg:col-span-2 space-y-3">
                {companies.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {companies.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCompanyId(c.id)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          selectedCompanyId === c.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/40 text-muted-foreground border-border hover:border-primary/40"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder="Search roles..." value={jobSearch} onChange={e => setJobSearch(e.target.value)} className="pl-9 text-sm h-9" />
                </div>

                {jobsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : jobs.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center text-sm text-muted-foreground">No jobs found for this company.</CardContent>
                  </Card>
                ) : (
                  <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
                    {groupedBrowseJobs.map(([dept, deptJobs]) => (
                      <div key={dept}>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">{dept}</p>
                        <div className="space-y-1">
                          {deptJobs.map(job => (
                            <button
                              key={job.id}
                              onClick={() => setSelectedBrowseJob(job)}
                              className={`w-full text-left p-2.5 rounded-lg border transition-colors text-sm ${
                                selectedBrowseJob?.id === job.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border/50 hover:border-primary/30 bg-card"
                              }`}
                            >
                              <p className="font-medium text-foreground truncate">{job.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {job.augmented_percent != null && (
                                  <span className={`text-[10px] ${job.augmented_percent >= 70 ? "text-destructive" : job.augmented_percent >= 40 ? "text-warning" : "text-success"}`}>
                                    {job.augmented_percent}% AI exposure
                                  </span>
                                )}
                                {job.seniority && <span className="text-[10px] text-muted-foreground">{job.seniority}</span>}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Task panel */}
              <div className="lg:col-span-3">
                {!selectedBrowseJob ? (
                  <Card className="border-dashed h-full min-h-[300px] flex items-center justify-center">
                    <CardContent className="text-center p-8">
                      <Briefcase className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Select a job to see its tasks</p>
                    </CardContent>
                  </Card>
                ) : analyzing ? (
                  <Card className="h-full min-h-[300px] flex items-center justify-center">
                    <CardContent className="text-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Analyzing tasks for {selectedBrowseJob.title}...</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{selectedBrowseJob.title}</h3>
                        <p className="text-xs text-muted-foreground">{browseTasks.length} task{browseTasks.length !== 1 ? "s" : ""} • {selectedCompany?.name}</p>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                      {browseTasks.map(task => {
                        const alreadySaved = sims.some(s => s.task_name === task.cluster_name && s.job_title === selectedBrowseJob.title);
                        const exposure = task.ai_exposure_score ?? 50;
                        return (
                          <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card">
                            <div className="p-1.5 rounded-md border bg-dot-blue/10 text-dot-blue border-dot-blue/20 mt-0.5">
                              <GraduationCap className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{task.cluster_name}</p>
                              {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>}
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {exposureBadge(exposure)}
                                {priorityBadge(task.priority)}
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />15 min</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                size="sm" variant="ghost" className="h-7 w-7 p-0"
                                onClick={() => setSimTask({
                                  taskName: task.cluster_name,
                                  jobTitle: selectedBrowseJob.title,
                                  company: selectedCompany?.name,
                                })}
                                title="Run simulation"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm" variant="ghost"
                                className={`h-7 w-7 p-0 ${alreadySaved ? "text-primary" : ""}`}
                                onClick={() => saveTaskToLibrary(task, selectedBrowseJob)}
                                disabled={alreadySaved || savingTaskId === task.id}
                                title={alreadySaved ? "Already saved" : "Save to library"}
                              >
                                {savingTaskId === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Create Modal ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Custom Simulation</DialogTitle>
            <DialogDescription>Describe a task to practice or upload a document.</DialogDescription>
          </DialogHeader>
          <Tabs value={createTab} onValueChange={v => setCreateTab(v as "prompt" | "document")}>
            <TabsList className="w-full">
              <TabsTrigger value="prompt" className="flex-1 gap-1.5 text-xs"><MessageSquare className="w-3.5 h-3.5" /> Describe It</TabsTrigger>
              <TabsTrigger value="document" className="flex-1 gap-1.5 text-xs"><FileText className="w-3.5 h-3.5" /> Upload Doc</TabsTrigger>
            </TabsList>
            <TabsContent value="prompt" className="mt-3">
              <Textarea placeholder="e.g. Practice reviewing AI-generated financial reports for accuracy..." value={promptText} onChange={e => setPromptText(e.target.value)} rows={5} maxLength={2000} className="text-sm" />
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
        open={!!simTask}
        onClose={() => setSimTask(null)}
        taskName={simTask?.taskName || ""}
        jobTitle={simTask?.jobTitle || ""}
        company={simTask?.company}
      />
    </div>
  );
}
