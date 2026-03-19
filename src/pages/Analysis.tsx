import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Zap, AlertTriangle,
  Play, CheckCircle2, LogIn,
  Bookmark, BookmarkCheck, ChevronLeft,
  MessageSquare, BarChart3, FileText, Users, Search, Settings, Globe, Shield, Lightbulb, PenTool, Code, TrendingUp, Megaphone, Target, Briefcase, Heart, Layers, GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { JobAnalysisResult, TaskAnalysis } from "@/types/analysis";
import { findPrebuiltRole } from "@/data/prebuilt-roles";
import { analyzeJobWithAI } from "@/lib/ai-analysis";
import { exposureStyle } from "@/lib/exposure-colors";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import SimulatorModal from "@/components/SimulatorModal";

const isWebsite = (value: string) =>
  /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(value.trim());

function hashToHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = str.charCodeAt(i) + ((h << 5) - h);
  }
  return Math.abs(h) % 360;
}

function taskChipStyle(aiScore: number) {
  const s = exposureStyle(aiScore);
  return { badge: s.badge, accent: s.text };
}

const TASK_ICON_MAP: [RegExp, React.ComponentType<any>][] = [
  [/communicat|messag|email|write|copywriting|narrative|story/i, MessageSquare],
  [/analys|analytic|data|report|metric|insight|dashboard/i, BarChart3],
  [/document|compliance|audit|policy|legal|contract|regulat/i, FileText],
  [/team|collaborat|stakeholder|manag|lead|mentor|hire|recruit/i, Users],
  [/research|discover|investigat|explor|survey/i, Search],
  [/engineer|develop|code|software|technical|architect|system/i, Code],
  [/design|creat|ux|ui|visual|brand|content/i, PenTool],
  [/strateg|plan|roadmap|vision|initiative|growth/i, TrendingUp],
  [/market|campaign|advertis|promot|launch|gtm|seo|social/i, Megaphone],
  [/sales|revenue|pipeline|deal|prospect|client|customer/i, Target],
  [/security|risk|protect|threat|vulnerab|fraud/i, Shield],
  [/innovat|ideation|brainstorm|concept/i, Lightbulb],
  [/operat|process|workflow|automat|efficien|optim/i, Settings],
  [/global|international|region|market.*expan|locali/i, Globe],
  [/train|learn|educat|onboard|develop.*program/i, GraduationCap],
  [/finance|budget|cost|invest|forecast|revenue/i, Briefcase],
  [/culture|wellbeing|engagement|diversity|inclusion/i, Heart],
  [/integrat|platform|infrastructure|stack|tool/i, Layers],
];

function getTaskIcon(taskName: string) {
  for (const [pattern, Icon] of TASK_ICON_MAP) {
    if (pattern.test(taskName)) return Icon;
  }
  return Zap;
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
  const focusTaskParam = searchParams.get("task") || "";
  const jdMarker = searchParams.get("jd") || "";
  const jdUrlParam = searchParams.get("jdUrl") || "";
  const jdText = jdMarker === "session" ? (sessionStorage.getItem("jd_text") || "") : jdMarker;
  const hasJd = !!(jdText || jdUrlParam);

  // Pre-resolve prebuilt roles synchronously to avoid any loading flash
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
  const [focusedTask, setFocusedTask] = useState<TaskAnalysis | null>(null);
  const [showAllTasks, setShowAllTasks] = useState(!focusTaskParam);
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

    // If we already resolved a prebuilt role synchronously, just save history
    if (initialResult) {
      saveAnalysisHistory(initialResult);
      return;
    }

    const analyze = async () => {
      setLoading(true); setError(null);

      // 1. Check cached analyses (fast DB lookup)
      if (jobTitle && !hasJd) {
        try {
          const { data: cached } = await supabase
            .from("cached_analyses")
            .select("result")
            .eq("job_title_lower", jobTitle.toLowerCase())
            .eq("company_lower", (company || "").toLowerCase())
            .maybeSingle();
          if (cached?.result) {
            const r = cached.result as unknown as JobAnalysisResult;
            setResult(r); saveAnalysisHistory(r); setLoading(false); return;
          }
        } catch (err) { console.error("Cache lookup failed:", err); }
      }

      // 2. Fall back to AI analysis
      try {
        const aiResult = await analyzeJobWithAI(jobTitle, company, jdText || undefined, jdUrlParam || undefined);
        setResult(aiResult); saveAnalysisHistory(aiResult);
      } catch (err: any) { setError("Unable to analyze this role right now. Please try again."); console.error(err); }
      setLoading(false);
    };
    analyze();
  }, [jobTitle, company, hasJd, navigate, initialResult]);

  const augmentedPercent = result?.summary?.augmentedPercent ?? 0;
  const riskPercent = result?.summary?.automationRiskPercent ?? 0;

  const sortedTasks = useMemo(() => {
    if (!result) return [];
    return [...result.tasks].sort((a, b) => (b.aiExposureScore ?? 50) - (a.aiExposureScore ?? 50));
  }, [result]);

  useEffect(() => {
    if (!focusTaskParam || sortedTasks.length === 0) return;
    const normalized = focusTaskParam.trim().toLowerCase();
    const match =
      sortedTasks.find((t) => t.name.trim().toLowerCase() === normalized) ||
      sortedTasks.find((t) => t.name.toLowerCase().includes(normalized) || normalized.includes(t.name.toLowerCase()));

    if (match) {
      setFocusedTask(match);
      setShowAllTasks(false);
    } else {
      setFocusedTask(null);
      setShowAllTasks(true);
    }
  }, [focusTaskParam, sortedTasks]);

  const pickNextTask = useCallback(() => {
    const uncompleted = sortedTasks.filter(t => !completedTasks.has(t.name));
    if (uncompleted.length > 0) {
      setSimTask(uncompleted[0]);
    } else if (sortedTasks.length > 0) {
      setSimTask(sortedTasks[Math.floor(Math.random() * sortedTasks.length)]);
    }
  }, [sortedTasks, completedTasks]);

  const readiness = useMemo(() => {
    if (!augmentedPercent && !riskPercent) return 0;
    return 100 - Math.round(riskPercent * 0.55 + (100 - augmentedPercent) * 0.25 + 20);
  }, [augmentedPercent, riskPercent]);

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
    <div className="min-h-[100dvh] bg-background overflow-y-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(backPath)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <span className="text-sm font-semibold text-foreground truncate max-w-[200px]">{result.jobTitle}</span>
        <button
          onClick={toggleBookmark}
          disabled={bookmarkLoading}
          className="p-2 rounded-lg hover:bg-muted/30 transition-colors"
        >
          {isBookmarked
            ? <BookmarkCheck className="h-4 w-4 text-primary" />
            : <Bookmark className="h-4 w-4 text-muted-foreground" />
          }
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Compact hero row */}
        <div className="flex items-center gap-4 mb-6">
          <ReadinessRing readiness={readiness} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-display font-bold text-foreground leading-snug">{result.jobTitle}</h1>
            {company && !isWebsite(company) && <p className="text-sm text-muted-foreground">at {company}</p>}
          </div>
          <div className="flex gap-4 shrink-0">
            <StatItem value={`${riskPercent}%`} label="Risk" />
            <StatItem value={`${augmentedPercent}%`} label="Augmented" />
            <StatItem value={`${sortedTasks.length}`} label="Tasks" />
          </div>
        </div>

        {/* Progress */}
        {completedCount > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{completedCount}/{sortedTasks.length} practiced</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(completedCount / sortedTasks.length) * 100}%` }} />
            </div>
          </div>
        )}

        {focusedTask && !showAllTasks && (() => {
          const aiScore = focusedTask.aiExposureScore ?? 50;
          const style = taskChipStyle(aiScore);
          const done = completedTasks.has(focusedTask.name);
          const TaskIcon = getTaskIcon(focusedTask.name);
          const taskHue = hashToHue(focusedTask.name);

          return (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 rounded-2xl border border-border/50 bg-card overflow-hidden">
              <div className="h-1" style={{ background: `linear-gradient(90deg, hsl(${taskHue} 60% 50%), hsl(${(taskHue + 40) % 360} 50% 45%))` }} />
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `hsl(${taskHue} 40% 15%)` }}>
                    <TaskIcon className="h-5 w-5" style={{ color: `hsl(${taskHue} 60% 65%)` }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Focused task</p>
                    <h3 className="text-base font-semibold text-foreground leading-snug">{focusedTask.name}</h3>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${style.badge}`}>{aiScore}%</span>
                </div>

                {focusedTask.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{focusedTask.description}</p>
                )}

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-4 flex-wrap">
                  {focusedTask.currentState && <span className="px-2 py-0.5 rounded-full bg-muted/40">{focusedTask.currentState}</span>}
                  {focusedTask.impactLevel && <span className="px-2 py-0.5 rounded-full bg-muted/40">{focusedTask.impactLevel}</span>}
                  {done && <span className="px-2 py-0.5 rounded-full bg-muted/40">Practiced</span>}
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant={done ? "secondary" : "default"} className="h-8 rounded-full gap-1.5" onClick={() => setSimTask(focusedTask)}>
                    <Play className="h-3.5 w-3.5" /> {done ? "Practice Again" : "Practice Now"}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 rounded-full text-xs" onClick={() => setShowAllTasks(true)}>
                    See full task list <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {(!focusedTask || showAllTasks) && (
          <>
            {/* Task cards */}
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Tasks & AI Impact</h3>
            <div className="space-y-3 pb-8">
              {sortedTasks.map((task, i) => {
                const aiScore = task.aiExposureScore ?? 50;
                const style = taskChipStyle(aiScore);
                const done = completedTasks.has(task.name);
                const TaskIcon = getTaskIcon(task.name);
                const taskHue = hashToHue(task.name);

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-all overflow-hidden"
                  >
                    {/* Accent top strip */}
                    <div className="h-1" style={{ background: `linear-gradient(90deg, hsl(${taskHue} 60% 50%), hsl(${(taskHue + 40) % 360} 50% 45%))` }} />
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `hsl(${taskHue} 40% 15%)` }}>
                          <TaskIcon className="h-4 w-4" style={{ color: `hsl(${taskHue} 60% 65%)` }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-foreground leading-snug">{task.name}</h4>
                            {done && <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />}
                          </div>
                          {task.description && <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{task.description}</p>}
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${style.badge}`}>{aiScore}%</span>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {task.currentState && <span className="px-2 py-0.5 rounded-full bg-muted/40">{task.currentState}</span>}
                          {task.impactLevel && <span className="px-2 py-0.5 rounded-full bg-muted/40">{task.impactLevel}</span>}
                        </div>
                        <Button size="sm" variant={done ? "secondary" : "default"} className="h-7 text-xs rounded-full gap-1"
                          onClick={() => setSimTask(task)}>
                          <Play className="h-3 w-3" />{done ? "Retry" : "Practice"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* Sign-in CTA for anonymous users */}
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

/* ── Shared UI Components ── */

function ReadinessRing({ readiness, size = 64 }: { readiness: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - readiness / 100) }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold text-foreground tabular-nums">{readiness}%</span>
        <span className="text-[8px] text-muted-foreground uppercase tracking-wider">Ready</span>
      </div>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-base font-bold text-foreground tabular-nums">{value}</div>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default Analysis;
