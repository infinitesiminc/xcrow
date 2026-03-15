import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, FileText, MessageSquare, Zap, GraduationCap, ClipboardCheck,
  Users, Loader2, Trash2, Play, ChevronDown, ChevronUp, Upload,
  Sparkles, Clock, AlertTriangle, Brain,
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

export default function Simulations() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [sims, setSims] = useState<CustomSim[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  // Create form state
  const [createTab, setCreateTab] = useState<"prompt" | "document">("prompt");
  const [promptText, setPromptText] = useState("");
  const [docText, setDocText] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);

  // Sim runner
  const [simTask, setSimTask] = useState<{ taskName: string; jobTitle: string; company?: string } | null>(null);

  /* ── Fetch sims ── */
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

  /* ── Group by job title ── */
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

    if (["txt", "md"].includes(ext || "")) {
      const text = await file.text();
      setDocText(text);
      return;
    }

    // For PDF/DOCX, use parse-jd edge function
    if (["pdf", "docx"].includes(ext || "")) {
      setParsing(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const { data, error } = await supabase.functions.invoke("parse-jd", {
          body: formData,
        });
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
    if (!input) {
      toast({ title: "Enter something", description: "Provide a prompt or upload a document.", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const body: any = { userId: user.id };
      if (createTab === "prompt") body.prompt = input;
      else body.documentText = input;

      const { data, error } = await supabase.functions.invoke("compile-custom-sim", { body });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast({ title: "Simulation created!", description: `"${data.simulation.task_name}" saved to your library.` });
      setCreateOpen(false);
      setPromptText("");
      setDocText("");
      setDocFile(null);
      fetchSims();
    } catch (err: any) {
      toast({ title: "Creation failed", description: err.message, variant: "destructive" });
    }
    setCreating(false);
  };

  /* ── Delete sim ── */
  const deleteSim = async (id: string) => {
    const { error } = await supabase.from("custom_simulations").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      setSims(prev => prev.filter(s => s.id !== id));
    }
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Simulation Library</h1>
            <p className="text-sm text-muted-foreground mt-1">{sims.length} custom simulation{sims.length !== 1 ? "s" : ""}</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Create
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!loading && sims.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center">
              <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground mb-1">No simulations yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first custom simulation from a prompt or document.
              </p>
              <Button variant="outline" onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="w-4 h-4" /> Create Simulation
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Grouped list */}
        {!loading && grouped.map(([jobTitle, items]) => {
          const isExpanded = expandedJob === jobTitle || grouped.length === 1;
          return (
            <Card key={jobTitle} className="mb-3">
              <button
                onClick={() => setExpandedJob(isExpanded && grouped.length > 1 ? null : jobTitle)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{jobTitle}</h3>
                  <p className="text-xs text-muted-foreground">{items.length} simulation{items.length !== 1 ? "s" : ""}</p>
                </div>
                {grouped.length > 1 && (isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />)}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
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
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {tmpl.name}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />{tmpl.duration}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {sim.source_type === "prompt" ? "✏️ Prompt" : "📄 Doc"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => setSimTask({ taskName: sim.task_name, jobTitle: sim.job_title, company: sim.company || undefined })}
                              >
                                <Play className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={() => deleteSim(sim.id)}
                              >
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

      {/* ── Create Modal ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Custom Simulation</DialogTitle>
            <DialogDescription>
              Describe a task to practice, or upload a job description / case study.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={createTab} onValueChange={(v) => setCreateTab(v as "prompt" | "document")}>
            <TabsList className="w-full">
              <TabsTrigger value="prompt" className="flex-1 gap-1.5 text-xs">
                <MessageSquare className="w-3.5 h-3.5" /> Describe It
              </TabsTrigger>
              <TabsTrigger value="document" className="flex-1 gap-1.5 text-xs">
                <FileText className="w-3.5 h-3.5" /> Upload Doc
              </TabsTrigger>
            </TabsList>

            <TabsContent value="prompt" className="mt-3">
              <Textarea
                placeholder="e.g. Practice negotiating a SaaS contract renewal with a difficult client who wants a 40% discount..."
                value={promptText}
                onChange={e => setPromptText(e.target.value)}
                rows={5}
                maxLength={2000}
                className="text-sm"
              />
              <p className="text-[10px] text-muted-foreground mt-1 text-right">{promptText.length}/2000</p>
            </TabsContent>

            <TabsContent value="document" className="mt-3">
              {!docFile ? (
                <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-border/60 rounded-lg cursor-pointer hover:border-primary/40 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground/40" />
                  <span className="text-sm text-muted-foreground">Drop PDF, DOCX, TXT, or MD</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f);
                    }}
                  />
                </label>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/40 border border-border/50">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground truncate flex-1">{docFile.name}</span>
                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => { setDocFile(null); setDocText(""); }}>
                      Remove
                    </Button>
                  </div>
                  {parsing && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" /> Parsing document...
                    </div>
                  )}
                  {docText && !parsing && (
                    <p className="text-xs text-muted-foreground">
                      ✓ Extracted {docText.length.toLocaleString()} characters
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-2 mt-2 p-2.5 rounded-md bg-muted/30 border border-border/30">
            <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              AI extracts the role, task, and context — then assigns a simulation format (Quick Pulse, Deep Dive, or Case Challenge) based on complexity scoring.
            </p>
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
