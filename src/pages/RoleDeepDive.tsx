import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Zap, AlertTriangle, Bookmark, BookmarkCheck, LogIn, Map, Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { JobAnalysisResult, TaskAnalysis } from "@/types/analysis";
import { findPrebuiltRole } from "@/data/prebuilt-roles";
import { analyzeJobWithAI } from "@/lib/ai-analysis";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import SimulatorModal from "@/components/SimulatorModal";
import { TimeAxisSlider } from "@/components/role/TimeAxisSlider";
import { TaskCard } from "@/components/role/TaskCard";
import { TaskDetailPanel } from "@/components/role/TaskDetailPanel";
import { RoleChat } from "@/components/role/RoleChat";
import type { FuturePrediction } from "@/components/analysis/FutureTaskPreview";

// ── Helpers ──────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function ReadinessRing({ readiness, size = 80 }: { readiness: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="hsl(var(--primary))" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - readiness / 100) }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-foreground tabular-nums">{readiness}%</span>
        <span className="text-[7px] text-muted-foreground uppercase tracking-wider">Ready</span>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
const RoleDeepDive = () => {
  const { jobTitle: paramTitle } = useParams<{ jobTitle: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const company = searchParams.get("company") || "";
  const jdMarker = searchParams.get("jd") || "";
  const jdUrlParam = searchParams.get("jdUrl") || "";
  const jobTitle = decodeURIComponent(paramTitle || "");
  const jdText = jdMarker === "session" ? (sessionStorage.getItem("jd_text") || "") : jdMarker;
  const hasJd = !!(jdText || jdUrlParam);

  const initialResult = useMemo(() => {
    if (jobTitle && !hasJd) {
      const prebuilt = findPrebuiltRole(jobTitle);
      if (prebuilt) return { ...prebuilt, company };
    }
    return null;
  }, [jobTitle, company, hasJd]);

  const [result, setResult] = useState<JobAnalysisResult | null>(initialResult);
  const [loading, setLoading] = useState(!initialResult);
  const [error, setError] = useState<string | null>(null);
  const [simTask, setSimTask] = useState<TaskAnalysis | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [timeHorizon, setTimeHorizon] = useState(0);
  const [predictions, setPredictions] = useState<Record<string, FuturePrediction>>({});
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskAnalysis | null>(null);
  const { user, openAuthModal } = useAuth();

  const completedCount = result ? result.tasks.filter(t => completedTasks.has(t.name)).length : 0;

  // ── Data fetching ──────────────────────────────────────────────
  const fetchCompletions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("completed_simulations")
      .select("task_name")
      .eq("user_id", user.id);
    if (data) setCompletedTasks(new Set(data.map((d: any) => d.task_name)));
  }, [user]);

  useEffect(() => { fetchCompletions(); }, [fetchCompletions]);

  useEffect(() => {
    if (!user || !jobTitle) return;
    const check = async () => {
      let query = supabase.from("bookmarked_roles").select("id").eq("user_id", user.id).eq("job_title", jobTitle);
      if (company) query = query.eq("company", company); else query = query.is("company", null);
      const { data } = await query.maybeSingle();
      setIsBookmarked(!!data);
    };
    check();
  }, [user, jobTitle, company]);

  const toggleBookmark = async () => {
    if (!user) { openAuthModal(); return; }
    if (!result) return;
    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        let q = supabase.from("bookmarked_roles").delete().eq("user_id", user.id).eq("job_title", result.jobTitle);
        if (result.company) q = q.eq("company", result.company); else q = q.is("company", null);
        await q;
        setIsBookmarked(false);
      } else {
        await supabase.from("bookmarked_roles").insert({
          user_id: user.id, job_title: result.jobTitle, company: result.company || null,
          augmented_percent: result.summary.augmentedPercent,
          automation_risk_percent: result.summary.automationRiskPercent,
          new_skills_percent: result.summary.newSkillsPercent,
        });
        setIsBookmarked(true);
      }
    } catch (err) { console.error(err); }
    setBookmarkLoading(false);
  };

  const saveHistory = useCallback(async (r: JobAnalysisResult) => {
    if (!user) return;
    try {
      let q = supabase.from("analysis_history").select("id").eq("user_id", user.id).eq("job_title", r.jobTitle);
      if (r.company) q = q.eq("company", r.company); else q = q.is("company", null);
      const { data: existing } = await q.maybeSingle();
      if (existing) {
        await supabase.from("analysis_history").update({
          tasks_count: r.tasks.length, augmented_percent: r.summary.augmentedPercent,
          automation_risk_percent: r.summary.automationRiskPercent, analyzed_at: new Date().toISOString(),
        }).eq("id", existing.id);
      } else {
        await supabase.from("analysis_history").insert({
          user_id: user.id, job_title: r.jobTitle, company: r.company || null,
          tasks_count: r.tasks.length, augmented_percent: r.summary.augmentedPercent,
          automation_risk_percent: r.summary.automationRiskPercent,
        });
      }
    } catch (err) { console.error(err); }
  }, [user]);

  useEffect(() => {
    if (!jobTitle && !hasJd) { navigate("/"); return; }
    if (initialResult) { saveHistory(initialResult); return; }
    const analyze = async () => {
      setLoading(true); setError(null);
      if (jobTitle && !hasJd) {
        try {
          const { data: cached } = await supabase.from("cached_analyses").select("result")
            .eq("job_title_lower", jobTitle.toLowerCase())
            .eq("company_lower", (company || "").toLowerCase()).maybeSingle();
          if (cached?.result) {
            const r = cached.result as unknown as JobAnalysisResult;
            setResult(r); saveHistory(r); setLoading(false); return;
          }
        } catch (err) { console.error(err); }
      }
      try {
        const aiResult = await analyzeJobWithAI(jobTitle, company, jdText || undefined, jdUrlParam || undefined);
        setResult(aiResult); saveHistory(aiResult);
      } catch (err) { setError("Unable to analyze this role right now."); console.error(err); }
      setLoading(false);
    };
    analyze();
  }, [jobTitle, company, hasJd, navigate, initialResult]);

  const fetchAllPredictions = useCallback(async () => {
    if (!result) return;
    setPredictionsLoading(true);
    try {
      const taskPayload = result.tasks.map(t => ({
        name: t.name, aiExposureScore: t.aiExposureScore,
        jobImpactScore: t.jobImpactScore, description: t.description,
      }));
      const { data, error } = await supabase.functions.invoke("batch-predict-future", {
        body: { tasks: taskPayload, jobTitle: result.jobTitle, company: result.company || undefined },
      });
      if (error) throw error;
      if (data?.predictions) setPredictions(data.predictions);
    } catch (err) { console.error("Batch prediction error:", err); }
    setPredictionsLoading(false);
  }, [result]);

  useEffect(() => {
    if (timeHorizon > 0 && Object.keys(predictions).length === 0 && !predictionsLoading && result) {
      fetchAllPredictions();
    }
  }, [timeHorizon, predictions, predictionsLoading, result, fetchAllPredictions]);

  // Auto-select first task
  useEffect(() => {
    if (result && !selectedTask) {
      const sorted = [...result.tasks].sort((a, b) => (b.aiExposureScore ?? 50) - (a.aiExposureScore ?? 50));
      if (sorted.length > 0) setSelectedTask(sorted[0]);
    }
  }, [result, selectedTask]);

  const pickNextTask = useCallback(() => {
    if (!result) return;
    const sorted = [...result.tasks].sort((a, b) => (b.aiExposureScore ?? 50) - (a.aiExposureScore ?? 50));
    const uncompleted = sorted.filter(t => !completedTasks.has(t.name));
    setSimTask(uncompleted.length > 0 ? uncompleted[0] : sorted[Math.floor(Math.random() * sorted.length)]);
  }, [result, completedTasks]);

  // ── Computed stats ─────────────────────────────────────────────
  const futureStats = useMemo(() => {
    const preds = Object.values(predictions);
    if (preds.length === 0) return { avgExposure: result?.summary.automationRiskPercent ?? 0, collapseCount: 0 };
    const avgExposure = Math.round(preds.reduce((s, p) => s + p.future_exposure, 0) / preds.length);
    const collapseCount = preds.filter(p => p.future_exposure >= 80).length;
    return { avgExposure, collapseCount };
  }, [predictions, result]);

  const t = timeHorizon;
  const currentRisk = result?.summary.automationRiskPercent ?? 0;
  const currentAug = result?.summary.augmentedPercent ?? 0;
  const displayRisk = lerp(currentRisk, futureStats.avgExposure, t);
  const displayAug = lerp(currentAug, Math.min(100, currentAug + 15), t);
  const readiness = Math.max(0, 100 - Math.round(displayRisk * 0.55 + (100 - displayAug) * 0.25 + 20));

  const sortedTasks = useMemo(() => {
    if (!result) return [];
    return [...result.tasks].sort((a, b) => (b.aiExposureScore ?? 50) - (a.aiExposureScore ?? 50));
  }, [result]);

  const allTechs = useMemo(() => {
    return Array.from(new Set(Object.values(predictions).flatMap(p => p.disrupting_tech)));
  }, [predictions]);

  const predsSummary = useMemo(() => {
    if (Object.keys(predictions).length === 0) return undefined;
    return `${futureStats.collapseCount} tasks face collapse risk. Avg future exposure: ${futureStats.avgExposure}%. Key tech: ${allTechs.slice(0, 5).join(", ")}`;
  }, [predictions, futureStats, allTechs]);

  // ── Loading / Error states ─────────────────────────────────────
  if (loading) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
            <Zap className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <h1 className="text-xl font-sans font-bold text-foreground">Analyzing {jobTitle || "role"}…</h1>
          <p className="mt-2 text-sm text-muted-foreground">Building your task map</p>
          <div className="mt-8 space-y-3 w-full max-w-sm">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        </motion.div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="h-[100dvh] bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertTriangle className="mx-auto h-8 w-8 text-warning mb-3" />
          <h1 className="text-lg font-sans font-bold text-foreground mb-1">Analysis Failed</h1>
          <p className="text-sm text-muted-foreground mb-4">{error || "Something went wrong."}</p>
          <Button onClick={() => navigate("/")} variant="outline" size="sm">
            <ChevronLeft className="w-3 h-3 mr-1" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Sticky header */}
      <div className="shrink-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-4 py-2.5 flex items-center justify-between gap-3">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="text-center min-w-0 flex-1">
          <span className="text-sm font-semibold text-foreground truncate block">{result.jobTitle}</span>
          {company && <span className="text-[10px] text-muted-foreground">at {company}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <TimeAxisSlider value={timeHorizon} onChange={setTimeHorizon} />
          <button onClick={toggleBookmark} disabled={bookmarkLoading} className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
            {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {/* 2-column body */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — Task list */}
        <div className="w-80 shrink-0 border-r border-border flex flex-col overflow-hidden">
          {/* Stats strip */}
          <div className="shrink-0 p-3 border-b border-border/50 flex items-center gap-3">
            <ReadinessRing readiness={readiness} size={56} />
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="text-center">
                <div className="text-sm font-bold text-foreground tabular-nums">{displayRisk}%</div>
                <div className="text-[8px] text-muted-foreground uppercase">AI Exposure</div>
                {timeHorizon > 0 && displayRisk - currentRisk !== 0 && (
                  <div className={`text-[9px] font-medium ${displayRisk > currentRisk ? "text-destructive" : "text-success"}`}>
                    {displayRisk > currentRisk ? "+" : ""}{displayRisk - currentRisk}
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-foreground tabular-nums">{result.tasks.length}</div>
                <div className="text-[8px] text-muted-foreground uppercase">Tasks</div>
                {completedCount > 0 && (
                  <div className="text-[9px] text-success font-medium">{completedCount} done</div>
                )}
              </div>
            </div>
          </div>

          {/* Predictions loading */}
          {predictionsLoading && (
            <div className="shrink-0 py-2 flex items-center justify-center gap-1.5 text-muted-foreground border-b border-border/30">
              <Cpu className="h-3 w-3 animate-pulse text-primary" />
              <span className="text-[10px]">Analyzing future…</span>
            </div>
          )}

          {/* Task list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sortedTasks.map((task, i) => (
              <TaskCard
                key={task.name}
                task={task}
                prediction={predictions[task.name]}
                timeHorizon={timeHorizon}
                isCompleted={completedTasks.has(task.name)}
                isSelected={selectedTask?.name === task.name}
                onSelect={setSelectedTask}
                index={i}
              />
            ))}
          </div>

          {/* Bottom actions */}
          <div className="shrink-0 p-2 border-t border-border/50 space-y-1.5">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-[10px] gap-1.5 rounded-full"
              onClick={() => navigate("/journey")}
            >
              <Map className="h-3 w-3" /> Skill Territory
            </Button>
            {!user && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-[10px] gap-1.5 rounded-full text-primary"
                onClick={() => navigate("/auth")}
              >
                <LogIn className="h-3 w-3" /> Sign in to save
              </Button>
            )}
          </div>
        </div>

        {/* RIGHT — Task detail */}
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            {selectedTask ? (
              <TaskDetailPanel
                key={selectedTask.name}
                task={selectedTask}
                prediction={predictions[selectedTask.name]}
                timeHorizon={timeHorizon}
                isCompleted={completedTasks.has(selectedTask.name)}
                onPractice={setSimTask}
                onClose={() => setSelectedTask(null)}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex items-center justify-center text-sm text-muted-foreground"
              >
                Select a task to explore
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Chat FAB */}
      <RoleChat
        jobTitle={result.jobTitle}
        company={result.company}
        timeHorizon={timeHorizon}
        completedCount={completedCount}
        predictionsSummary={predsSummary}
      />

      <SimulatorModal
        open={!!simTask}
        onClose={() => { setSimTask(null); fetchCompletions(); }}
        taskName={simTask?.name || ""}
        jobTitle={result.jobTitle}
        company={result.company}
        taskState={simTask?.currentState}
        taskTrend={simTask?.trend}
        taskImpactLevel={simTask?.impactLevel}
        onCompleted={fetchCompletions}
        onNextTask={pickNextTask}
        onBackToFeed={() => navigate("/")}
      />
    </div>
  );
};

export default RoleDeepDive;
