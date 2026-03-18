import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, FileText, MessageSquare, GraduationCap,
  Loader2, Trash2, Play, ChevronDown, ChevronUp, Upload,
  Sparkles, Brain, Search, Briefcase, BookOpen, Save,
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

interface PracticeTabProps {
  userId: string;
}

export default function PracticeTab({ userId }: PracticeTabProps) {
  const { toast } = useToast();
  const [mainTab, setMainTab] = useState<"library" | "browse">("library");

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

  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [jobSearch, setJobSearch] = useState("");
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedBrowseJob, setSelectedBrowseJob] = useState<DbJob | null>(null);
  const [browseTasks, setBrowseTasks] = useState<EnrichedTask[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);

  const fetchSims = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("custom_simulations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) console.error("Fetch sims error:", error);
    setSims((data as CustomSim[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchSims(); }, [fetchSims]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("companies").select("id, name").order("name");
      if (data?.length) {
        setCompanies(data);
        setSelectedCompanyId(data[0].id);
      }
    })();
  }, []);

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

  const saveTaskToLibrary = async (task: EnrichedTask, job: DbJob) => {
    setSavingTaskId(task.id);
    const companyName = companies.find(c => c.id === job.company_id)?.name || null;
    const { error } = await supabase.from("custom_simulations").insert({
      user_id: userId,
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

  const grouped = useMemo(() => {
    const map: Record<string, CustomSim[]> = {};
    for (const s of sims) {
      const key = s.job_title;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [sims]);

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

  const handleCreate = async () => {
    const input = createTab === "prompt" ? promptText.trim() : docText.trim();
    if (!input) { toast({ title: "Enter something", variant: "destructive" }); return; }
    setCreating(true);
    try {
      const body: any = { userId };
      if (createTab === "prompt") body.prompt = input; else body.documentText = input;
      const { data, error } = await supabase.functions.invoke("compile-custom-sim", { body });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast({ title: "Simulation created!", description: `"${data.simulation.task_name}" saved.` });
      setCreateOpen(false);
      setPromptText(""); setDocText(""); setDocFile(null);
      fetchSims();
    } catch (err: any) {
      toast({ title: "Creation failed", description: err.message, variant: "destructive" });
    }
    setCreating(false);
  };

  const deleteSim = async (id: string) => {
    const { error } = await supabase.from("custom_simulations").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else setSims(prev => prev.filter(s => s.id !== id));
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{sims.length} saved simulation{sims.length !== 1 ? "s" : ""}</p>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Create
        </Button>
      </div>

      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "library" | "browse")}>
        <TabsList>
          <TabsTrigger value="library" className="gap-1.5 text-xs">
            <BookOpen className="w-3.5 h-3.5" /> My Library
          </TabsTrigger>
          <TabsTrigger value="browse" className="gap-1.5 text-xs">
            <Briefcase className="w-3.5 h-3.5" /> Browse Jobs
          </TabsTrigger>
        </TabsList>

        {/* Library */}
        <TabsContent value="library" className="mt-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && sims.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-foreground mb-1">No simulations yet</h3>
                <p className="text-xs text-muted-foreground mb-4">Create a custom sim or browse jobs to save tasks.</p>
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Create
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setMainTab("browse")} className="gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> Browse Jobs
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
                            <div className="p-1.5 rounded-md border bg-primary/10 text-primary border-primary/20">
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

        {/* Browse Jobs */}
        <TabsContent value="browse" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
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
                          : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search roles..."
                  value={jobSearch}
                  onChange={e => setJobSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              {jobsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
                  {groupedBrowseJobs.map(([dept, deptJobs]) => (
                    <div key={dept}>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 px-1">{dept}</p>
                      {deptJobs.map(j => (
                        <button
                          key={j.id}
                          onClick={() => setSelectedBrowseJob(j)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
                            selectedBrowseJob?.id === j.id ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-muted text-foreground"
                          }`}
                        >
                          {j.title}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-3">
              {!selectedBrowseJob ? (
                <Card className="border-dashed"><CardContent className="p-8 text-center text-sm text-muted-foreground">Select a role to see its tasks</CardContent></Card>
              ) : analyzing ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Analyzing tasks…</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground mb-2">{selectedBrowseJob.title}</h3>
                  {browseTasks.map(task => (
                    <Card key={task.id} className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-medium text-foreground">{task.cluster_name}</p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {exposureBadge(task.ai_exposure_score ?? 50)}
                            {priorityBadge(task.priority)}
                          </div>
                        </div>
                        {task.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>}
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setSimTask({ taskName: task.cluster_name, jobTitle: selectedBrowseJob.title, company: selectedCompany?.name })}>
                            <Play className="w-3 h-3" /> Practice
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" disabled={savingTaskId === task.id} onClick={() => saveTaskToLibrary(task, selectedBrowseJob)}>
                            {savingTaskId === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Simulation</DialogTitle>
            <DialogDescription>Describe a scenario or upload a document.</DialogDescription>
          </DialogHeader>
          <Tabs value={createTab} onValueChange={(v) => setCreateTab(v as "prompt" | "document")}>
            <TabsList className="w-full">
              <TabsTrigger value="prompt" className="flex-1 gap-1.5 text-xs"><MessageSquare className="w-3.5 h-3.5" /> Prompt</TabsTrigger>
              <TabsTrigger value="document" className="flex-1 gap-1.5 text-xs"><FileText className="w-3.5 h-3.5" /> Document</TabsTrigger>
            </TabsList>
            <TabsContent value="prompt" className="mt-3">
              <Textarea placeholder='e.g. "Practice writing a marketing brief using AI tools"' value={promptText} onChange={e => setPromptText(e.target.value)} rows={4} />
            </TabsContent>
            <TabsContent value="document" className="mt-3 space-y-3">
              <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/40 transition-colors">
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{docFile ? docFile.name : "Upload PDF, DOCX, TXT, or MD"}</span>
                <input type="file" className="hidden" accept=".pdf,.docx,.txt,.md" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
              </label>
              {parsing && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Parsing…</div>}
              {docText && <Textarea value={docText} onChange={e => setDocText(e.target.value)} rows={4} />}
            </TabsContent>
          </Tabs>
          <Button onClick={handleCreate} disabled={creating} className="w-full mt-2 gap-1.5">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {creating ? "Creating…" : "Generate Simulation"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Sim runner */}
      {simTask && (
        <SimulatorModal
          open={!!simTask}
          onOpenChange={(open) => { if (!open) setSimTask(null); }}
          taskName={simTask.taskName}
          jobTitle={simTask.jobTitle}
          company={simTask.company}
        />
      )}
    </>
  );
}
