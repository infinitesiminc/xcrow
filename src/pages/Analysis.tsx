import { useEffect, useState, useCallback, useMemo, useRef, type WheelEvent as ReactWheelEvent } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  ArrowLeft, Zap, AlertTriangle, Bot,
  Rocket, CheckCircle2, LogIn,
  Bookmark, BookmarkCheck, ChevronUp, Play,
  Trophy, ArrowDown,
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

// AI Augmented % is the single hero metric across every job

const isWebsite = (value: string) =>
  /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(value.trim());

function taskChipStyle(aiScore: number) {
  if (aiScore >= 70) return { border: "border-brand-ai/30", bg: "bg-brand-ai/5", badge: "bg-brand-ai/15 text-brand-ai", accent: "text-brand-ai" };
  if (aiScore >= 40) return { border: "border-brand-mid/30", bg: "bg-brand-mid/5", badge: "bg-brand-mid/15 text-brand-mid", accent: "text-brand-mid" };
  return { border: "border-brand-human/30", bg: "bg-brand-human/5", badge: "bg-brand-human/15 text-brand-human", accent: "text-brand-human" };
}

const SWIPE_THRESHOLD = 50;

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const wheelLockRef = useRef<number | null>(null);
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

  const augmentedPercent = result?.summary?.augmentedPercent ?? 0;

  const sortedTasks = useMemo(() => {
    if (!result) return [];
    return [...result.tasks].sort((a, b) => (b.aiExposureScore ?? 50) - (a.aiExposureScore ?? 50));
  }, [result]);

  const totalCards = sortedTasks.length + 2; // hero + tasks + completion

  const pickNextTask = useCallback(() => {
    const uncompleted = sortedTasks.filter(t => !completedTasks.has(t.name));
    if (uncompleted.length > 0) {
      setSimTask(uncompleted[0]);
    } else if (sortedTasks.length > 0) {
      setSimTask(sortedTasks[Math.floor(Math.random() * sortedTasks.length)]);
    }
  }, [sortedTasks, completedTasks]);

  const goTo = useCallback((idx: number) => {
    setCurrentIndex(Math.max(0, Math.min(idx, totalCards - 1)));
  }, [totalCards]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.y < -SWIPE_THRESHOLD) {
      goTo(currentIndex + 1);
    } else if (info.offset.y > SWIPE_THRESHOLD) {
      goTo(currentIndex - 1);
    }
  }, [currentIndex, goTo]);

  const handleWheel = useCallback((e: ReactWheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaY) < 12) return;
    e.preventDefault();
    if (wheelLockRef.current) return;

    goTo(currentIndex + (e.deltaY > 0 ? 1 : -1));
    wheelLockRef.current = window.setTimeout(() => {
      wheelLockRef.current = null;
    }, 320);
  }, [currentIndex, goTo]);

  useEffect(() => {
    return () => {
      if (wheelLockRef.current) {
        window.clearTimeout(wheelLockRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return;

      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        goTo(currentIndex + 1);
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goTo(currentIndex - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, goTo]);

  if (loading) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
            <Zap className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <h1 className="text-xl font-sans font-bold text-foreground">Analyzing {jobTitle || "role"}...</h1>
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
            <ArrowLeft className="w-3 h-3 mr-1" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  const completedCount = sortedTasks.filter(t => completedTasks.has(t.name)).length;

  return (
    <div className="h-[100dvh] bg-background overflow-hidden relative overscroll-none" onWheel={handleWheel}>
      {/* Progress dots */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5">
        {Array.from({ length: totalCards }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === currentIndex
                ? "w-6 h-2 bg-primary"
                : "w-2 h-2 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate(backPath)}
        className="fixed top-4 left-4 z-50 p-2 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-accent transition-colors"
      >
        <ArrowLeft className="h-4 w-4 text-foreground" />
      </button>

      {/* Bookmark button */}
      <button
        onClick={toggleBookmark}
        disabled={bookmarkLoading}
        className="fixed top-4 right-4 z-50 p-2 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-accent transition-colors"
      >
        {isBookmarked
          ? <BookmarkCheck className="h-4 w-4 text-primary" />
          : <Bookmark className="h-4 w-4 text-muted-foreground" />
        }
      </button>

      {/* Desktop nav controls */}
      <div className="hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 z-50 flex-col gap-2">
        <Button
          size="icon"
          variant="secondary"
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="rounded-full"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={() => goTo(currentIndex + 1)}
          disabled={currentIndex === totalCards - 1}
          className="rounded-full"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      </div>

      <motion.div
        className="h-full w-full"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full w-full"
          >
            {currentIndex === 0 && (
              <HeroCard
                result={result}
                company={company}
                augmented={augmentedPercent}
                completedCount={completedCount}
                totalTasks={sortedTasks.length}
                onNext={() => goTo(1)}
              />
            )}
            {currentIndex > 0 && currentIndex <= sortedTasks.length && (
              <TaskCard
                task={sortedTasks[currentIndex - 1]}
                index={currentIndex - 1}
                total={sortedTasks.length}
                isCompleted={completedTasks.has(sortedTasks[currentIndex - 1].name)}
                onPractice={() => setSimTask(sortedTasks[currentIndex - 1])}
                jobTitle={result.jobTitle}
                company={company}
              />
            )}
            {currentIndex === totalCards - 1 && (
              <CompletionCard
                completedCount={completedCount}
                totalTasks={sortedTasks.length}
                augmented={augmentedPercent}
                isBookmarked={isBookmarked}
                onBookmark={toggleBookmark}
                onBack={() => navigate(backPath)}
                user={user}
                onSignIn={() => navigate("/auth")}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Swipe/wheel hint on hero */}
      {currentIndex === 0 && (
        <motion.div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <span className="text-xs text-muted-foreground">Swipe up</span>
          <span className="hidden md:block text-[10px] text-muted-foreground/80">or use mouse wheel / ↑ ↓</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronUp className="h-4 w-4 text-muted-foreground rotate-180" />
          </motion.div>
        </motion.div>
      )}

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
  );
};

function HeroCard({
  result, company, augmented, completedCount, totalTasks, onNext,
}: {
  result: JobAnalysisResult;
  company: string;
  augmented: number;
  completedCount: number;
  totalTasks: number;
  onNext: () => void;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto">
      <div className="relative mb-6">
        <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
          <circle cx="70" cy="70" r="60" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
          <motion.circle
            cx="70" cy="70" r="60" fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 60}
            initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 60 * (1 - augmented / 100) }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-display font-bold text-foreground tabular-nums">{augmented}%</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">AI-Augmented</span>
        </div>
      </div>

      <h1 className="text-2xl font-display font-bold text-foreground mb-1">{result.jobTitle}</h1>
      {company && !isWebsite(company) && (
        <p className="text-sm text-muted-foreground mb-4">at {company}</p>
      )}

      <p className="text-xs text-muted-foreground mb-6 max-w-xs leading-relaxed">
        {augmented >= 70
          ? `${augmented}% of this role's tasks can be supercharged with AI tools — tons to learn here 🚀`
          : augmented >= 40
          ? `${augmented}% of tasks are enhanced by AI — a great blend of human skill and AI tools 💡`
          : `This role is mostly human-driven — AI plays a supporting role in ${augmented}% of tasks ✨`}
      </p>

      <div className="flex gap-6 mb-8">
        <div className="text-center">
          <div className="text-lg font-bold text-foreground tabular-nums">{totalTasks}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Tasks</div>
        </div>
        {completedCount > 0 && (
          <>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-lg font-bold text-foreground tabular-nums">{completedCount}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Practiced</div>
            </div>
          </>
        )}
      </div>

      {completedCount > 0 && (
        <div className="w-full max-w-xs mb-6">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{completedCount}/{totalTasks} done</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / totalTasks) * 100}%` }}
            />
          </div>
        </div>
      )}

      <Button onClick={onNext} size="lg" className="gap-2 rounded-full px-8">
        <Play className="h-4 w-4" /> Explore Tasks
      </Button>
    </div>
  );
}

function TaskCard({
  task, index, total, isCompleted, onPractice, jobTitle, company,
}: {
  task: TaskAnalysis;
  index: number;
  total: number;
  isCompleted: boolean;
  onPractice: () => void;
  jobTitle: string;
  company: string;
}) {
  const aiScore = task.aiExposureScore ?? 50;
  const style = taskChipStyle(aiScore);

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 max-w-lg mx-auto">
      {/* Role context + task counter */}
      <div className="text-center mb-4">
        <p className="text-sm font-semibold text-foreground">{jobTitle}</p>
        {company && !isWebsite(company) && (
          <p className="text-[11px] text-muted-foreground">at {company}</p>
        )}
      </div>
      <div className="text-xs text-muted-foreground mb-6 uppercase tracking-widest">
        Task {index + 1} of {total}
      </div>

      <div className="relative mb-8">
        <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
          <circle cx="90" cy="90" r="76" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
          <motion.circle
            cx="90" cy="90" r="76" fill="none"
            className={style.accent}
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 76}
            initial={{ strokeDashoffset: 2 * Math.PI * 76 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 76 * (1 - aiScore / 100) }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Bot className={`h-5 w-5 mb-1 ${style.accent}`} />
          <span className="text-4xl font-display font-bold text-foreground tabular-nums">{aiScore}%</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">AI Augmented</span>
        </div>
      </div>

      <h2 className="text-xl font-display font-bold text-foreground text-center mb-3 leading-tight">
        {task.name}
      </h2>

      {task.description && (
        <p className="text-sm text-muted-foreground text-center mb-6 line-clamp-3 max-w-sm">
          {task.description}
        </p>
      )}

      <div className="flex items-center gap-2 mb-8">
        {task.priority === "high" && (
          <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-primary/15 text-primary">
            🚀 Learn First
          </span>
        )}
        {isCompleted && (
          <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-success/15 text-success flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Done
          </span>
        )}
        <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${style.badge}`}>
          🤖 {aiScore >= 70 ? "High AI" : aiScore >= 40 ? "Blended" : "Human-Led"}
        </span>
      </div>

      <Button
        onClick={onPractice}
        size="lg"
        className="gap-2 rounded-full px-8"
        variant={isCompleted ? "secondary" : "default"}
      >
        {isCompleted ? (
          <><CheckCircle2 className="h-4 w-4" /> Practice Again</>
        ) : (
          <><Play className="h-4 w-4" /> Practice This</>
        )}
      </Button>
    </div>
  );
}

function CompletionCard({
  completedCount, totalTasks, augmented, isBookmarked, onBookmark, onBack, user, onSignIn,
}: {
  completedCount: number;
  totalTasks: number;
  augmented: number;
  isBookmarked: boolean;
  onBookmark: () => void;
  onBack: () => void;
  user: any;
  onSignIn: () => void;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
          <Trophy className="h-10 w-10 text-primary" />
        </div>
      </motion.div>

      <h2 className="text-2xl font-display font-bold text-foreground mb-2">
        {completedCount === totalTasks && completedCount > 0 ? "All Tasks Complete!" : "Role Overview Complete"}
      </h2>
      <p className="text-sm text-muted-foreground mb-8">
        {completedCount}/{totalTasks} tasks practiced · {augmented}% AI-augmented
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={onBookmark}
          variant={isBookmarked ? "secondary" : "outline"}
          className="gap-2 rounded-full"
        >
          {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          {isBookmarked ? "Bookmarked" : "Bookmark Role"}
        </Button>

        <Button onClick={onBack} variant="ghost" className="gap-2 rounded-full">
          <ArrowLeft className="h-4 w-4" /> Back to Feed
        </Button>

        {!user && (
          <Button onClick={onSignIn} variant="ghost" className="gap-2 rounded-full text-primary">
            <LogIn className="h-4 w-4" /> Sign in to save progress
          </Button>
        )}
      </div>
    </div>
  );
}

export default Analysis;
