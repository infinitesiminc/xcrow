import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Zap, AlertTriangle, Bot,
  GraduationCap, Rocket, CheckCircle2, LogIn,
  Bookmark, BookmarkCheck, ChevronRight, Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { JobAnalysisResult, TaskAnalysis } from "@/types/analysis";
import { findPrebuiltRole } from "@/data/prebuilt-roles";
import { analyzeJobWithAI } from "@/lib/ai-analysis";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import SimulatorModal from "@/components/SimulatorModal";

interface CompanySnapshot {
  success: boolean;
  companyName: string | null;
  industry: string | null;
  companyType: string | null;
  employeeRange: string | null;
  revenueScale: string | null;
  founded: string | null;
  headquarters: string | null;
  tagline: string | null;
  logo: string | null;
  url: string;
}

type Verdict = "upskill" | "pivot" | "leverage";

function calcReadiness(automationRisk: number, augmented: number, newSkills: number): number {
  return 100 - Math.round(automationRisk * 0.55 + (100 - augmented) * 0.25 + newSkills * 0.20);
}

const isWebsite = (value: string) =>
  /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(value.trim());

/* ── Task chip color helper ─── */
function taskChipStyle(aiScore: number) {
  if (aiScore >= 70) return { border: "border-brand-ai/30", bg: "bg-brand-ai/5", badge: "bg-brand-ai/15 text-brand-ai" };
  if (aiScore >= 40) return { border: "border-brand-mid/30", bg: "bg-brand-mid/5", badge: "bg-brand-mid/15 text-brand-mid" };
  return { border: "border-brand-human/30", bg: "bg-brand-human/5", badge: "bg-brand-human/15 text-brand-human" };
}

const Analysis = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromDashboard = (location.state as any)?.from === "dashboard";
  const fromCompanyDemo = (location.state as any)?.from === "company-dashboard";
  const backPath = fromCompanyDemo ? "/company-dashboard" : fromDashboard ? "/dashboard" : "/";
  const { toast } = useToast();

  const company = searchParams.get("company") || "";
  const jobTitle = searchParams.get("title") || "";
  const jdMarker = searchParams.get("jd") || "";
  const jdUrlParam = searchParams.get("jdUrl") || "";
  const jdText = jdMarker === "session" ? (sessionStorage.getItem("jd_text") || "") : jdMarker;
  const hasJd = !!(jdText || jdUrlParam);

  const [result, setResult] = useState<JobAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simTask, setSimTask] = useState<TaskAnalysis | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
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

  // Bookmark check
  useEffect(() => {
    if (!user || !jobTitle) return;
    const checkBookmark = async () => {
      let query = supabase.from("bookmarked_roles").select("id").eq("user_id", user.id).eq("job_title", jobTitle);
      if (company) { query = query.eq("company", company); } else { query = query.is("company", null); }
      const { data } = await query.maybeSingle();
      setIsBookmarked(!!data);
    };
    checkBookmark();
  }, [user, jobTitle, company]);

  const toggleBookmark = async () => {
    if (!user) { openAuthModal(); return; }
    if (!result) return;
    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        let query = supabase.from("bookmarked_roles").delete().eq("user_id", user.id).eq("job_title", result.jobTitle);
        if (result.company) { query = query.eq("company", result.company); } else { query = query.is("company", null); }
        await query;
        setIsBookmarked(false);
      } else {
        await supabase.from("bookmarked_roles").insert({
          user_id: user.id,
          job_title: result.jobTitle,
          company: result.company || null,
          augmented_percent: result.summary.augmentedPercent,
          automation_risk_percent: result.summary.automationRiskPercent,
          new_skills_percent: result.summary.newSkillsPercent,
        });
        setIsBookmarked(true);
      }
    } catch (err) { console.error("Bookmark error:", err); }
    setBookmarkLoading(false);
  };

  const saveAnalysisHistory = useCallback(async (analysisResult: JobAnalysisResult) => {
    if (!user) return;
    try {
      let query = supabase.from("analysis_history")
        .select("id").eq("user_id", user.id).eq("job_title", analysisResult.jobTitle);
      if (analysisResult.company) { query = query.eq("company", analysisResult.company); } else { query = query.is("company", null); }
      const { data: existing } = await query.maybeSingle();
      if (existing) {
        await supabase.from("analysis_history").update({
          tasks_count: analysisResult.tasks.length,
          augmented_percent: analysisResult.summary.augmentedPercent,
          automation_risk_percent: analysisResult.summary.automationRiskPercent,
          analyzed_at: new Date().toISOString(),
        }).eq("id", existing.id);
      } else {
        await supabase.from("analysis_history").insert({
          user_id: user.id, job_title: analysisResult.jobTitle, company: analysisResult.company || null,
          tasks_count: analysisResult.tasks.length,
          augmented_percent: analysisResult.summary.augmentedPercent,
          automation_risk_percent: analysisResult.summary.automationRiskPercent,
        });
      }
    } catch (err) { console.error("Failed to save analysis history:", err); }
  }, [user]);

  useEffect(() => {
    if (!jobTitle && !hasJd) { navigate("/"); return; }
    const analyze = async () => {
      setLoading(true); setError(null);
      const prebuilt = jobTitle ? findPrebuiltRole(jobTitle) : null;
      if (prebuilt && !hasJd) {
        await new Promise(r => setTimeout(r, 1200));
        const r = { ...prebuilt, company };
        setResult(r); saveAnalysisHistory(r); setLoading(false); return;
      }
      try {
        const aiResult = await analyzeJobWithAI(jobTitle, company, jdText || undefined, jdUrlParam || undefined);
        setResult(aiResult); saveAnalysisHistory(aiResult);
      } catch (err: any) { setError("Unable to analyze this role right now. Please try again."); console.error(err); }
      setLoading(false);
    };
    analyze();
  }, [jobTitle, company, hasJd, navigate]);

  // Readiness score
  const readiness = useMemo(() => {
    if (!result) return 0;
    return calcReadiness(result.summary.automationRiskPercent, result.summary.augmentedPercent, result.summary.newSkillsPercent);
  }, [result]);

  // Sorted tasks by priority/exposure
  const sortedTasks = useMemo(() => {
    if (!result) return [];
    return [...result.tasks].sort((a, b) => (b.aiExposureScore ?? 50) - (a.aiExposureScore ?? 50));
  }, [result]);

  // Pick next uncompleted task
  const pickNextTask = useCallback(() => {
    const uncompleted = sortedTasks.filter(t => !completedTasks.has(t.name));
    if (uncompleted.length > 0) {
      setSimTask(uncompleted[0]);
    } else if (sortedTasks.length > 0) {
      // All done — pick random
      setSimTask(sortedTasks[Math.floor(Math.random() * sortedTasks.length)]);
    }
  }, [sortedTasks, completedTasks]);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-12">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
              <Zap className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <h1 className="text-xl font-sans font-bold text-foreground">Analyzing {jobTitle || "role"}...</h1>
            <p className="mt-1 text-sm text-muted-foreground">Building your task list</p>
          </motion.div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error || !result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertTriangle className="mx-auto h-8 w-8 text-warning mb-3" />
          <h1 className="text-lg font-sans font-bold text-foreground mb-1">Analysis Failed</h1>
          <p className="text-sm text-muted-foreground mb-4">{error || "Something went wrong."}</p>
          <Button onClick={() => navigate("/")} variant="outline" size="sm">
            <ArrowLeft className="w-3 h-3 mr-1" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  const completedCount = sortedTasks.filter(t => completedTasks.has(t.name)).length;

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-2xl mx-auto">
        {/* Compact header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button onClick={() => navigate(backPath)} className="p-1.5 rounded-lg hover:bg-accent transition-colors shrink-0">
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-display font-bold text-foreground truncate">{result.jobTitle}</h1>
                {company && !isWebsite(company) && (
                  <p className="text-xs text-muted-foreground">at {company}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent">
                <span className={`w-2 h-2 rounded-full ${readiness >= 70 ? "bg-success" : readiness >= 40 ? "bg-primary" : "bg-warning"}`} />
                <span className="text-sm font-bold text-foreground tabular-nums">{readiness}%</span>
              </div>
              <Button
                variant={isBookmarked ? "secondary" : "ghost"}
                size="icon"
                onClick={toggleBookmark}
                disabled={bookmarkLoading}
                className="h-8 w-8"
              >
                {isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${sortedTasks.length > 0 ? (completedCount / sortedTasks.length) * 100 : 0}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
              {completedCount}/{sortedTasks.length} done
            </span>
          </div>
        </motion.div>

        {/* Task cards — single-focus, fast-paced */}
        <div className="space-y-3">
          {sortedTasks.map((task, i) => {
            const aiScore = task.aiExposureScore ?? 50;
            const isCompleted = completedTasks.has(task.name);
            const style = taskChipStyle(aiScore);

            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSimTask(task)}
                className={`w-full rounded-xl border p-4 flex items-center gap-4 text-left transition-all active:scale-[0.98] hover:scale-[1.01] ${style.border} ${style.bg} ${isCompleted ? "opacity-60" : ""}`}
              >
                {/* Play/Check icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isCompleted ? "bg-success/15" : "bg-primary/15"
                }`}>
                  {isCompleted
                    ? <CheckCircle2 className="h-5 w-5 text-success" />
                    : <Play className="h-5 w-5 text-primary" />
                  }
                </div>

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-foreground leading-snug line-clamp-1 block">
                    {task.name}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                      🤖 {aiScore}%
                    </span>
                    {task.priority === "high" && (
                      <span className="text-[10px] text-primary font-medium">🚀 Learn First</span>
                    )}
                    {isCompleted && (
                      <span className="text-[10px] text-success font-medium">✓ Done</span>
                    )}
                  </div>
                </div>

                <ArrowLeft className="h-4 w-4 text-muted-foreground/40 rotate-180 shrink-0" />
              </motion.button>
            );
          })}
        </div>

        {/* Sign in prompt */}
        {!user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 mt-6"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Rocket className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm text-muted-foreground">Sign in to save progress</span>
            </div>
            <Button onClick={() => navigate("/auth")} size="sm" variant="ghost" className="gap-1.5 shrink-0 text-xs">
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </Button>
          </motion.div>
        )}

        {/* Simulator Modal */}
        <SimulatorModal
          open={!!simTask}
          onClose={() => setSimTask(null)}
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
    </div>
  );
};

export default Analysis;
