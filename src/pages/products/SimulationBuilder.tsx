import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import {
  Zap, ArrowRight, Layers, Brain, Settings2, Sparkles,
  GraduationCap, Timer, BarChart3, Building2, SlidersHorizontal,
  Play, ClipboardCheck, Users, Target, Puzzle, Compass,
  FileBarChart, BookOpen, ShieldCheck, CheckCircle2, FileText,
  MessageSquare, Award, Crosshair, Radio, Clock,
  Search, ChevronRight, MapPin, Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
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
}

interface TaskCluster {
  id: string;
  cluster_name: string;
  description: string | null;
  outcome: string | null;
  skill_names: string[] | null;
  sort_order: number | null;
}

/* ── Templates (Layer 1) ── */
const templates = [
  {
    id: "quick-pulse",
    name: "Quick Pulse",
    duration: "~3 min",
    format: "5 MCQs",
    useCase: "Upskilling",
    icon: Zap,
    color: "bg-dot-teal/10 text-dot-teal border-dot-teal/20",
    description: "Rapid-fire scenario MCQs testing AI-readiness on a single task. Perfect for daily microlearning.",
    stages: ["5 MCQs"],
  },
  {
    id: "deep-dive",
    name: "Deep Dive",
    duration: "~15 min",
    format: "Briefing → MCQs → Open Response → Score",
    useCase: "L&D Programs",
    icon: GraduationCap,
    color: "bg-dot-blue/10 text-dot-blue border-dot-blue/20",
    description: "Structured learning with context briefing, scenarios, and open-ended analysis.",
    stages: ["Briefing", "MCQ ×8", "Open Response"],
  },
  {
    id: "case-challenge",
    name: "Case Challenge",
    duration: "~30 min",
    format: "Scenario Brief → Multi-step Deliverable → Rubric",
    useCase: "Assessment",
    icon: ClipboardCheck,
    color: "bg-dot-purple/10 text-dot-purple border-dot-purple/20",
    description: "Real-world case study scored against an AI-calibrated rubric. Built for hiring decisions.",
    stages: ["Scenario Brief", "Multi-step Deliverable", "Rubric Score"],
  },
  {
    id: "full-panel",
    name: "Full Panel",
    duration: "~60 min",
    format: "Multiple Task Clusters → Timed Stages → Composite",
    useCase: "Staffing",
    icon: Users,
    color: "bg-dot-amber/10 text-dot-amber border-dot-amber/20",
    description: "Multi-stage assessment spanning multiple task clusters. Gold standard for workforce planning.",
    stages: ["Task Cluster ×3", "Timed Stages", "Composite Score"],
  },
];

const fadeUp = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };
const fadeUpDelay = (d: number) => ({ ...fadeUp, transition: { delay: d } });

/* ── Risk badge helper ── */
function riskBadge(pct: number | null) {
  if (pct == null) return null;
  if (pct >= 60) return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">{pct}% risk</Badge>;
  if (pct >= 35) return <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px]">{pct}% risk</Badge>;
  return <Badge className="bg-success/10 text-success border-success/20 text-[10px]">{pct}% risk</Badge>;
}

export default function SimulationBuilder() {
  const navigate = useNavigate();

  /* ── State ── */
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<DbJob | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [taskClusters, setTaskClusters] = useState<TaskCluster[]>([]);
  const [loadingClusters, setLoadingClusters] = useState(false);
  const [companyName, setCompanyName] = useState("Anthropic");

  // Simulator modal state
  const [simOpen, setSimOpen] = useState(false);
  const [simTask, setSimTask] = useState("");

  /* ── Fetch Anthropic jobs ── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      // Find Anthropic company
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

  /* ── Fetch task clusters when job selected ── */
  useEffect(() => {
    if (!selectedJob) { setTaskClusters([]); return; }
    (async () => {
      setLoadingClusters(true);
      const { data } = await supabase
        .from("job_task_clusters")
        .select("id, cluster_name, description, outcome, skill_names, sort_order")
        .eq("job_id", selectedJob.id)
        .order("sort_order");
      setTaskClusters(data || []);
      setLoadingClusters(false);
    })();
  }, [selectedJob]);

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

  /* ── Departments for quick filters ── */
  const departments = useMemo(() => {
    const depts = new Map<string, number>();
    jobs.forEach(j => {
      const d = j.department || "Other";
      depts.set(d, (depts.get(d) || 0) + 1);
    });
    return Array.from(depts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [jobs]);

  /* ── Launch simulation ── */
  const launchSim = (taskName: string) => {
    setSimTask(taskName);
    setSimOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="relative mx-auto max-w-5xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground mb-6">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Simulation Blueprint System
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-foreground leading-tight tracking-tight">
              Pre-built simulation templates
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Pick a role from {companyName}'s {jobs.length > 0 ? `${jobs.length} open positions` : "job board"}, choose a template, 
              and launch an AI-calibrated simulation in seconds.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Template Selection */}
      <section className="px-4 pb-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {templates.map((t) => (
              <motion.button
                key={t.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTemplate(t)}
                className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                  selectedTemplate.id === t.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-8 w-8 rounded-lg border flex items-center justify-center ${t.color}`}>
                    <t.icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{t.name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{t.duration}</span>
                  <span className="text-border">·</span>
                  <span>{t.useCase}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Job Browser */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${jobs.length} ${companyName} roles…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {departments.map(([dept, count]) => (
                <button
                  key={dept}
                  onClick={() => setSearch(dept)}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium border transition-colors ${
                    search === dept
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/30"
                  }`}
                >
                  {dept} <span className="opacity-60">({count})</span>
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 rounded-xl border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredJobs.slice(0, 30).map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className={`cursor-pointer h-full transition-all duration-200 ${
                      selectedJob?.id === job.id
                        ? "border-primary ring-1 ring-primary/20 bg-primary/[0.02]"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                    onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-foreground text-sm leading-tight">{job.title}</h3>
                        {riskBadge(job.automation_risk_percent)}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        {job.department && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {job.department}
                          </span>
                        )}
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </span>
                        )}
                      </div>
                      {selectedJob?.id === job.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 pt-3 border-t border-border"
                        >
                          {job.augmented_percent != null && (
                            <div className="flex items-center gap-2 mb-2 text-xs">
                              <span className="text-muted-foreground w-24">AI Augmented</span>
                              <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                                <div className="h-full rounded-full bg-dot-blue" style={{ width: `${job.augmented_percent}%` }} />
                              </div>
                              <span className="font-semibold text-foreground w-8 text-right">{job.augmented_percent}%</span>
                            </div>
                          )}
                          {loadingClusters ? (
                            <div className="text-xs text-muted-foreground py-2">Loading tasks…</div>
                          ) : taskClusters.length > 0 ? (
                            <div className="space-y-1.5 mt-2">
                              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Task Clusters</span>
                              {taskClusters.map((tc) => (
                                <button
                                  key={tc.id}
                                  onClick={(e) => { e.stopPropagation(); launchSim(tc.cluster_name); }}
                                  className="w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left hover:border-primary/40 hover:bg-primary/[0.02] transition-all group"
                                >
                                  <div className="min-w-0">
                                    <span className="text-xs font-medium text-foreground block truncate">{tc.cluster_name}</span>
                                    {tc.description && (
                                      <span className="text-[10px] text-muted-foreground block truncate">{tc.description}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Play className="h-3 w-3" />
                                    <span className="text-[10px] font-medium">{selectedTemplate.name}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full mt-1 gap-1.5 text-xs"
                              onClick={(e) => { e.stopPropagation(); launchSim(job.title); }}
                            >
                              <Play className="h-3 w-3" />
                              Launch {selectedTemplate.name}
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && filteredJobs.length > 30 && (
            <p className="text-center text-xs text-muted-foreground mt-4">
              Showing 30 of {filteredJobs.length} roles. Refine your search to see more.
            </p>
          )}

          {!loading && filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No roles found matching "{search}"</p>
              <Button variant="ghost" size="sm" onClick={() => setSearch("")} className="mt-2">
                Clear search
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* How Templates Work */}
      <section className="px-4 py-16 bg-accent/30">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">How It Works</span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground mt-2">
              Four templates. Every use case.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Each template is a battle-tested simulation structure — from 3-minute pulse checks to 60-minute staffing panels.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-4">
            {templates.map((t, i) => (
              <motion.div key={t.name} {...fadeUpDelay(i * 0.08)}>
                <Card className="h-full border-border bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-9 w-9 rounded-lg border flex items-center justify-center ${t.color}`}>
                          <t.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-base">{t.name}</h3>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.useCase}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs font-medium">{t.duration}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{t.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {t.stages.map((s) => (
                          <span key={s} className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground">{s}</span>
                        ))}
                      </div>
                      <span className="text-xs text-primary font-medium">{t.format}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring Framework */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-[10px] uppercase tracking-wider">Scoring Framework</Badge>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground mb-3">Four axes of AI readiness.</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every simulation produces a measurable profile — not a pass/fail.
            </p>
          </motion.div>
          <motion.div {...fadeUpDelay(0.1)}>
            <Card className="border-border bg-card">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-foreground">AI Readiness Scorecard</span>
                  <Badge className="ml-auto text-[10px] bg-primary/10 text-primary border-primary/20">Example Output</Badge>
                </div>
                <div className="space-y-4">
                  {[
                    { name: "AI Tool Awareness", score: 82, desc: "Can you identify when and how to use AI tools effectively?" },
                    { name: "Human Value-Add", score: 91, desc: "Do you focus on the judgment, creativity, and empathy AI can't replicate?" },
                    { name: "Adaptive Thinking", score: 74, desc: "Can you pivot your approach when AI changes the rules?" },
                    { name: "Domain Judgment", score: 88, desc: "Do you apply deep expertise to validate and direct AI outputs?" },
                  ].map((axis, i) => (
                    <motion.div key={axis.name} {...fadeUpDelay(0.15 + i * 0.06)}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{axis.name}</span>
                        <span className="text-sm font-bold text-primary">{axis.score}/100</span>
                      </div>
                      <Progress value={axis.score} className="h-2.5 mb-1" />
                      <p className="text-[11px] text-muted-foreground">{axis.desc}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">Overall AI Readiness</span>
                    <span className="text-2xl font-bold text-foreground ml-3">84<span className="text-sm text-muted-foreground font-normal">/100</span></span>
                  </div>
                  <Badge className="bg-dot-teal/10 text-dot-teal border-dot-teal/20">Strong Readiness</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground">
            Build simulations that adapt to your world.
          </h2>
          <p className="mt-3 text-muted-foreground">
            See the Simulation Blueprint System in action with a personalized demo.
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
      />
    </div>
  );
}
