import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ArrowRight, Layers, Brain,
  Target, Sparkles, Search, MapPin, Briefcase,
  AlertTriangle, Loader2, Pause, Play,
  ChevronDown, ChevronUp, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
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

interface CompletedSim {
  task_name: string;
  job_title: string;
}

export default function SimulationBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  /* ── State ── */
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [companyName, setCompanyName] = useState("Anthropic");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [collapsedDepts, setCollapsedDepts] = useState<Set<string>>(new Set());
  const [analyzedJobIds, setAnalyzedJobIds] = useState<Set<string>>(new Set());

  /* ── Auto-analyze queue ── */
  const [queueRunning, setQueueRunning] = useState(false);
  const [queueCurrentJob, setQueueCurrentJob] = useState<string | null>(null);
  const [queueProcessed, setQueueProcessed] = useState(0);
  const [queueConsecutiveErrors, setQueueConsecutiveErrors] = useState(0);
  const [queueMessage, setQueueMessage] = useState<string | null>(null);
  const pauseRef = useRef(false);
  const abortRef = useRef(false);

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
  const refreshAnalyzed = useCallback(async () => {
    if (!companyId) return;
    const { data } = await supabase
      .from("job_task_clusters")
      .select("job_id")
      .limit(10000);
    if (data) {
      setAnalyzedJobIds(new Set(data.map(d => d.job_id)));
    }
  }, [companyId]);

  useEffect(() => { refreshAnalyzed(); }, [refreshAnalyzed]);

  /* ── Completed sims ── */
  const [completedSims, setCompletedSims] = useState<CompletedSim[]>([]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("completed_simulations")
        .select("task_name, correct_answers, total_questions, job_title")
        .eq("user_id", user.id);
      setCompletedSims(data || []);
    })();
  }, [user]);

  const getJobCompletionPercent = useCallback((job: DbJob) => {
    const jobSims = completedSims.filter(s => s.job_title === job.title);
    if (jobSims.length === 0) return 0;
    const uniqueTasks = new Set(jobSims.map(s => s.task_name));
    return Math.min(100, Math.round((uniqueTasks.size / 10) * 100));
  }, [completedSims]);

  /* ── Filter & group ── */
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

  const groupedJobs = useMemo(() => {
    const groups = new Map<string, DbJob[]>();
    filteredJobs.forEach(j => {
      const dept = j.department || "Other";
      if (!groups.has(dept)) groups.set(dept, []);
      groups.get(dept)!.push(j);
    });
    groups.forEach((jobList) => {
      jobList.sort((a, b) => {
        const aReady = analyzedJobIds.has(a.id) ? 0 : 1;
        const bReady = analyzedJobIds.has(b.id) ? 0 : 1;
        if (aReady !== bReady) return aReady - bReady;
        return a.title.localeCompare(b.title);
      });
    });
    return Array.from(groups.entries()).sort((a, b) => {
      const aReady = a[1].filter(j => analyzedJobIds.has(j.id)).length;
      const bReady = b[1].filter(j => analyzedJobIds.has(j.id)).length;
      return bReady - aReady;
    });
  }, [filteredJobs, analyzedJobIds]);

  const pendingCount = useMemo(() => jobs.filter(j => !analyzedJobIds.has(j.id)).length, [jobs, analyzedJobIds]);

  /* ── Auto-analyze queue logic ── */
  const startQueue = useCallback(async () => {
    if (queueRunning) return;
    pauseRef.current = false;
    abortRef.current = false;
    setQueueRunning(true);
    setQueueMessage(null);
    setQueueConsecutiveErrors(0);
    setQueueProcessed(0);

    // Get fresh list of pending jobs
    const { data: clusters } = await supabase
      .from("job_task_clusters")
      .select("job_id")
      .limit(10000);
    const alreadyDone = new Set((clusters || []).map(c => c.job_id));
    const pending = jobs.filter(j => !alreadyDone.has(j.id));

    let errors = 0;
    let processed = 0;

    for (const job of pending) {
      // Check pause/abort
      if (abortRef.current) {
        setQueueMessage("Queue stopped.");
        break;
      }
      if (pauseRef.current) {
        setQueueMessage(`Paused after ${processed} roles. Click resume to continue.`);
        break;
      }

      setQueueCurrentJob(job.id);

      try {
        const { data, error } = await supabase.functions.invoke("analyze-role-tasks", {
          body: {
            jobId: job.id,
            jobTitle: job.title,
            company: companyName,
            description: job.description?.slice(0, 3000) || undefined,
          },
        });

        if (error) throw new Error(error.message);
        if (data?.error) {
          // Rate limit → auto-pause with backoff
          if (data.error.includes("Rate limited") || data.error.includes("429")) {
            errors++;
            setQueueMessage(`Rate limited. Waiting 10s before retry… (${errors} issues)`);
            if (errors >= 3) {
              setQueueMessage(`Paused after ${errors} rate limits. Click resume to continue.`);
              pauseRef.current = true;
              break;
            }
            await new Promise(r => setTimeout(r, 10000));
            continue; // retry same job by not incrementing
          }
          throw new Error(data.error);
        }

        // Success
        errors = 0;
        processed++;
        setQueueProcessed(processed);
        setQueueConsecutiveErrors(0);

        // Update local analyzed set immediately
        setAnalyzedJobIds(prev => new Set([...prev, job.id]));

        // Brief delay between jobs
        await new Promise(r => setTimeout(r, 1500));
      } catch (err: any) {
        errors++;
        setQueueConsecutiveErrors(errors);
        console.error(`Queue error for ${job.title}:`, err.message);

        if (errors >= 3) {
          setQueueMessage(`Paused after 3 consecutive errors. Last: ${err.message}`);
          pauseRef.current = true;
          break;
        }
        // Wait and continue to next job
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    setQueueCurrentJob(null);
    setQueueRunning(false);
    if (!pauseRef.current && !abortRef.current) {
      setQueueMessage(null);
      toast({ title: "Queue complete!", description: `${processed} roles analyzed.` });
    }
    refreshAnalyzed();
  }, [jobs, companyName, queueRunning, toast, refreshAnalyzed]);

  const pauseQueue = useCallback(() => {
    pauseRef.current = true;
  }, []);

  const stopQueue = useCallback(() => {
    abortRef.current = true;
    pauseRef.current = true;
  }, []);

  const currentJobTitle = useMemo(() => {
    if (!queueCurrentJob) return null;
    return jobs.find(j => j.id === queueCurrentJob)?.title || null;
  }, [queueCurrentJob, jobs]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-16 pb-4">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="relative mx-auto max-w-5xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground mb-3">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Simulation Blueprint System
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-foreground leading-tight tracking-tight">
              AI-powered learning paths
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Select any {companyName} role to auto-generate a personalized learning path — 
              each task analyzed for AI impact with recommended simulation packages.
            </p>

            {/* Auto-Analyze Queue Dashboard */}
            {companyId && (
              <div className="mt-6 mx-auto max-w-lg">
                <Card className="border-border bg-card/60 backdrop-blur">
                  <CardContent className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-primary/10 p-1.5">
                          <Brain className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">Role Analysis Queue</h3>
                      </div>
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-border text-muted-foreground">
                        {companyName}
                      </Badge>
                    </div>

                    {/* Stats */}
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
                        <div className="text-lg font-bold text-muted-foreground">{pendingCount}</div>
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
                          {queueRunning && currentJobTitle && (
                            <span className="text-primary truncate max-w-[200px]">
                              Analyzing: {currentJobTitle}
                            </span>
                          )}
                          {!queueRunning && (
                            <span>~{pendingCount * 4}s estimated</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Queue controls */}
                    <div className="flex items-center gap-2">
                      {!queueRunning && pendingCount > 0 && (
                        <Button
                          size="sm"
                          onClick={startQueue}
                          className="gap-2 text-xs flex-1"
                        >
                          <Play className="h-3.5 w-3.5" />
                          {queueMessage ? "Resume Queue" : "Start Auto-Analyze"}
                          <Badge variant="secondary" className="ml-1 text-[9px] px-1.5 py-0 h-4 bg-primary-foreground/20 border-0">
                            {pendingCount} roles
                          </Badge>
                        </Button>
                      )}

                      {queueRunning && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={pauseQueue}
                            className="gap-2 text-xs flex-1"
                          >
                            <Pause className="h-3.5 w-3.5" />
                            Pause
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={stopQueue}
                            className="gap-2 text-xs text-destructive hover:text-destructive"
                          >
                            Stop
                          </Button>
                        </>
                      )}

                      {!queueRunning && pendingCount === 0 && (
                        <div className="flex items-center gap-2 text-xs text-primary flex-1 justify-center py-1">
                          <CheckCircle2 className="h-4 w-4" />
                          All roles analyzed
                        </div>
                      )}
                    </div>

                    {/* Live status */}
                    {queueRunning && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/50 rounded-md px-3 py-2">
                        <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />
                        <span>Processing job-by-job… {queueProcessed} done so far. You can browse ready roles below.</span>
                      </div>
                    )}

                    {/* Queue message (pause/error) */}
                    {queueMessage && !queueRunning && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/5 rounded-md px-2.5 py-2">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>{queueMessage}</span>
                      </div>
                    )}

                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Queue processes one role at a time. Pauses automatically on rate limits or errors. 
                      Analyzed roles show a <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-primary/10 text-primary border-primary/20 mx-0.5 inline-flex items-center">Ready</Badge> badge and are immediately browsable.
                    </p>
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
          <div className="lg:w-[480px] shrink-0 transition-all duration-300">
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
                                const isCurrentlyAnalyzing = queueCurrentJob === job.id;
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
                                      onClick={() => navigate(`/learning-path?jobId=${job.id}`)}
                                      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                                        isCurrentlyAnalyzing
                                          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                                          : isReady
                                            ? "border-primary/20 bg-card hover:border-primary/30"
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
                                          {isCurrentlyAnalyzing ? (
                                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20 animate-pulse">
                                              <Loader2 className="h-2.5 w-2.5 animate-spin mr-0.5" />
                                              Analyzing
                                            </Badge>
                                          ) : (
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
                                          )}
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

          {/* Right: Empty state */}
          {!loading && (
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
                  Choose any {companyName} role to open its full learning path — with task-level AI impact analysis, simulation packages, and custom sim creation.
                </p>
              </div>
            </motion.div>
          )}
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
    </div>
  );
}
