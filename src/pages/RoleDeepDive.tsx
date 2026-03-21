import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft, Zap, AlertTriangle, Bookmark, BookmarkCheck, LogIn, Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { JobAnalysisResult, TaskAnalysis } from "@/types/analysis";
import { findPrebuiltRole } from "@/data/prebuilt-roles";
import { analyzeJobWithAI } from "@/lib/ai-analysis";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import SimulatorModal from "@/components/SimulatorModal";
import { TimeAxisSlider } from "@/components/role/TimeAxisSlider";
import { OverviewTab } from "@/components/role/OverviewTab";
import { TaskXRayTab } from "@/components/role/TaskXRayTab";
import { FutureViewTab } from "@/components/role/FutureViewTab";
import type { FuturePrediction } from "@/components/analysis/FutureTaskPreview";

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
  const { user, openAuthModal } = useAuth();

  const fetchCompletions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("completed_simulations")
      .select("task_name")
      .eq("user_id", user.id);
    if (data) setCompletedTasks(new Set(data.map((d: any) => d.task_name)));
  }, [user]);

  useEffect(() => { fetchCompletions(); }, [fetchCompletions]);

  // Bookmark
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

  // Fetch analysis
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

  // Batch fetch predictions
  const fetchAllPredictions = useCallback(async () => {
    if (!result) return;
    setPredictionsLoading(true);
    try {
      const taskPayload = result.tasks.map(t => ({
        name: t.name,
        aiExposureScore: t.aiExposureScore,
        jobImpactScore: t.jobImpactScore,
        description: t.description,
      }));
      const { data, error } = await supabase.functions.invoke("batch-predict-future", {
        body: { tasks: taskPayload, jobTitle: result.jobTitle, company: result.company || undefined },
      });
      if (error) throw error;
      if (data?.predictions) setPredictions(data.predictions);
    } catch (err) { console.error("Batch prediction error:", err); }
    setPredictionsLoading(false);
  }, [result]);

  // Auto-fetch predictions when switching to future tabs
  useEffect(() => {
    if (timeHorizon > 0 && Object.keys(predictions).length === 0 && !predictionsLoading && result) {
      fetchAllPredictions();
    }
  }, [timeHorizon, predictions, predictionsLoading, result, fetchAllPredictions]);

  const completedCount = result ? result.tasks.filter(t => completedTasks.has(t.name)).length : 0;

  const pickNextTask = useCallback(() => {
    if (!result) return;
    const sorted = [...result.tasks].sort((a, b) => (b.aiExposureScore ?? 50) - (a.aiExposureScore ?? 50));
    const uncompleted = sorted.filter(t => !completedTasks.has(t.name));
    setSimTask(uncompleted.length > 0 ? uncompleted[0] : sorted[Math.floor(Math.random() * sorted.length)]);
  }, [result, completedTasks]);

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
    <div className="min-h-[100dvh] bg-background overflow-y-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <div className="text-center min-w-0">
          <span className="text-sm font-semibold text-foreground truncate block max-w-[200px]">{result.jobTitle}</span>
          {company && <span className="text-[10px] text-muted-foreground">at {company}</span>}
        </div>
        <button onClick={toggleBookmark} disabled={bookmarkLoading} className="p-2 rounded-lg hover:bg-muted/30 transition-colors">
          {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        {/* Time Axis Slider */}
        <TimeAxisSlider value={timeHorizon} onChange={setTimeHorizon} />

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="xray">Task X-Ray</TabsTrigger>
            <TabsTrigger value="future">Future View</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <OverviewTab
              result={result}
              timeHorizon={timeHorizon}
              predictions={predictions}
              completedCount={completedCount}
            />
          </TabsContent>

          <TabsContent value="xray" className="mt-4">
            <TaskXRayTab
              tasks={result.tasks}
              completedTasks={completedTasks}
              onPractice={setSimTask}
              jobTitle={result.jobTitle}
              company={result.company}
              timeHorizon={timeHorizon}
              predictions={predictions}
            />
          </TabsContent>

          <TabsContent value="future" className="mt-4">
            <FutureViewTab
              tasks={result.tasks}
              predictions={predictions}
              loading={predictionsLoading}
              onPractice={setSimTask}
              onFetchPredictions={fetchAllPredictions}
            />
          </TabsContent>
        </Tabs>

        {/* Sign-in CTA */}
        {!user && (
          <div className="text-center py-6 border-t border-border/30">
            <Button onClick={() => navigate("/auth")} variant="ghost" className="gap-2 rounded-full text-primary">
              <LogIn className="h-4 w-4" /> Sign in to save progress
            </Button>
          </div>
        )}
      </div>

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
