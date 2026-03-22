import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, AlertTriangle, Bookmark, BookmarkCheck, LogIn, Map, Cpu,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { JobAnalysisResult, TaskAnalysis } from "@/types/analysis";
import { findPrebuiltRole } from "@/data/prebuilt-roles";
import { analyzeJobWithAI } from "@/lib/ai-analysis";
import { useAuth } from "@/contexts/AuthContext";
import type { IntelContext } from "@/lib/simulator";
import { supabase } from "@/integrations/supabase/client";
import SimulatorModal from "@/components/SimulatorModal";
import { BattleChooser } from "@/components/role/BattleChooser";
import { WarCouncil } from "@/components/role/WarCouncil";
import { CampaignTracker } from "@/components/role/CampaignTracker";
import { ThreatBar } from "@/components/role/ThreatBar";
import XcrowLoader from "@/components/XcrowLoader";
import { useChatViewContext } from "@/contexts/ChatContext";
import type { FuturePrediction } from "@/components/analysis/FutureTaskPreview";

// ── View context for unified chat ────────────────────────────────
function RoleDeepDiveViewContext({ jobTitle, company, completedCount, predsSummary }: {
  jobTitle: string; company?: string; completedCount: number; predsSummary: string;
}) {
  useChatViewContext({
    page: "role-deep-dive",
    jobTitle,
    company: company || undefined,
    completedCount,
    predictionsSummary: predsSummary,
  }, [jobTitle, company, completedCount, predsSummary]);
  return null;
}

type Phase = "choose" | "prep";

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
  const [predictions, setPredictions] = useState<Record<string, FuturePrediction>>({});
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const { user, openAuthModal } = useAuth();

  // ── State machine ──────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("choose");
  const [chosenTask, setChosenTask] = useState<TaskAnalysis | null>(null);
  const [sessionXP, setSessionXP] = useState(0);
  const [currentIntel, setCurrentIntel] = useState<IntelContext | null>(null);

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
            const r = cached.result as unknown as JobAnalysisResult & { jobId?: string };
            if (r.jobId) setJobId(r.jobId);
            setResult(r); saveHistory(r); setLoading(false);
            if (!r.jobId) resolveJobId(r.jobTitle, company);
            return;
          }
        } catch (err) { console.error(err); }
      }
      try {
        const aiResult = await analyzeJobWithAI(jobTitle, company, jdText || undefined, jdUrlParam || undefined) as JobAnalysisResult & { jobId?: string };
        if (aiResult.jobId) setJobId(aiResult.jobId);
        setResult(aiResult); saveHistory(aiResult);
      } catch (err) { setError("Unable to analyze this role right now."); console.error(err); }
      setLoading(false);
    };
    analyze();
  }, [jobTitle, company, hasJd, navigate, initialResult]);

  const resolveJobId = useCallback(async (title: string, _comp: string) => {
    try {
      const { data } = await supabase.from("jobs").select("id").ilike("title", title).limit(1).maybeSingle();
      if (data) setJobId(data.id);
    } catch {}
  }, []);

  // Auto-fetch predictions
  const fetchAllPredictions = useCallback(async () => {
    if (!result) return;
    setPredictionsLoading(true);
    try {
      const taskPayload = result.tasks.map(t => ({
        name: t.name, aiExposureScore: t.aiExposureScore,
        jobImpactScore: t.jobImpactScore, description: t.description,
      }));
      const { data, error } = await supabase.functions.invoke("batch-predict-future", {
        body: { tasks: taskPayload, jobTitle: result.jobTitle, company: result.company || undefined, jobId: jobId || undefined },
      });
      if (error) throw error;
      if (data?.predictions) setPredictions(data.predictions);
    } catch (err) { console.error("Batch prediction error:", err); }
    setPredictionsLoading(false);
  }, [result, jobId]);

  useEffect(() => {
    if (result && Object.keys(predictions).length === 0 && !predictionsLoading) {
      fetchAllPredictions();
    }
  }, [result, predictions, predictionsLoading, fetchAllPredictions]);

  // ── Battle chooser logic ───────────────────────────────────────
  const sortedTasks = useMemo(() => {
    if (!result) return [];
    return [...result.tasks].sort((a, b) => (b.aiExposureScore ?? 50) - (a.aiExposureScore ?? 50));
  }, [result]);

  // Get the next pair of battles to present
  const battleChoices = useMemo(() => {
    // Show unconquered tasks first, then conquered ones
    const unconquered = sortedTasks.filter(t => !completedTasks.has(t.name));
    const conquered = sortedTasks.filter(t => completedTasks.has(t.name));
    const ordered = [...unconquered, ...conquered];

    if (ordered.length === 0) return [];
    if (ordered.length === 1) return [ordered[0]];
    // Return first 2 unconquered, or if all conquered, first 2 overall
    return ordered.slice(0, 2);
  }, [sortedTasks, completedTasks]);

  const remainingCount = sortedTasks.filter(t => !completedTasks.has(t.name)).length;
  const isFinalBattle = remainingCount === 1 || (remainingCount === 0 && sortedTasks.length === 1);

  const handleChooseBattle = useCallback((task: TaskAnalysis) => {
    setChosenTask(task);
    setPhase("prep");
  }, []);

  const handleSwitchTarget = useCallback(() => {
    setChosenTask(null);
    setPhase("choose");
  }, []);

  const handleXPEarned = useCallback((xp: number) => {
    setSessionXP(prev => prev + xp);
  }, []);

  const pickNextTask = useCallback(() => {
    if (!result) return;
    const uncompleted = sortedTasks.filter(t => !completedTasks.has(t.name));
    setSimTask(uncompleted.length > 0 ? uncompleted[0] : sortedTasks[Math.floor(Math.random() * sortedTasks.length)]);
  }, [result, completedTasks, sortedTasks]);

  // ── Computed stats ─────────────────────────────────────────────
  const currentRisk = result?.summary.automationRiskPercent ?? 0;

  const allTechs = useMemo(() => {
    return Array.from(new Set(Object.values(predictions).flatMap(p => p.disrupting_tech)));
  }, [predictions]);

  const futureStats = useMemo(() => {
    const preds = Object.values(predictions);
    if (preds.length === 0) return null;
    const avgExposure = Math.round(preds.reduce((s, p) => s + p.future_exposure, 0) / preds.length);
    const collapseCount = preds.filter(p => p.future_exposure >= 80).length;
    return { avgExposure, collapseCount };
  }, [predictions]);

  const predsSummary = useMemo(() => {
    if (!futureStats) return undefined;
    return `${futureStats.collapseCount} tasks face collapse risk. Avg future exposure: ${futureStats.avgExposure}%. Key tech: ${allTechs.slice(0, 5).join(", ")}`;
  }, [futureStats, allTechs]);

  const handleClose = useCallback(() => navigate("/"), [navigate]);

  // ── Loading / Error states ─────────────────────────────────────
  if (loading) {
    return (
      <Dialog open onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 gap-0 overflow-hidden rounded-2xl border-border/60 bg-background">
          <div className="h-full flex flex-col items-center justify-center px-4">
            <XcrowLoader
              title={`⚔️ Scouting ${jobTitle || "kingdom"}…`}
              subtitle="Preparing your mission briefing"
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !result) {
    return (
      <Dialog open onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 gap-0 overflow-hidden rounded-2xl border-border/60 bg-background">
          <div className="h-full flex items-center justify-center px-4">
            <div className="text-center max-w-sm">
              <AlertTriangle className="mx-auto h-8 w-8 text-warning mb-3" />
              <h1 className="text-lg font-sans font-bold text-foreground mb-1">Mission Failed</h1>
              <p className="text-sm text-muted-foreground mb-4">{error || "Could not scout this kingdom."}</p>
              <Button onClick={handleClose} variant="outline" size="sm">
                <ChevronLeft className="w-3 h-3 mr-1" /> Return to HQ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 gap-0 overflow-hidden rounded-2xl border-border/60 bg-background">
        <div className="h-full flex flex-col overflow-hidden">
          {/* ── Kingdom Header ── */}
          <div className="shrink-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-4 py-2.5 flex items-center justify-between gap-3">
            <button onClick={handleClose} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>
            <div className="text-center min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">⚔️ Mission Briefing</span>
              <span className="text-sm font-semibold text-foreground truncate block">{result.jobTitle.trim()}</span>
              {company && <span className="text-[10px] text-muted-foreground">Kingdom of {company}</span>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={toggleBookmark} disabled={bookmarkLoading} className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4 text-muted-foreground" />}
              </button>
            </div>
          </div>

          {/* ── Kingdom Threat Overview ── */}
          <div className="shrink-0 px-4 py-2 border-b border-border/50 flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Kingdom Threat</span>
              <ThreatBar score={currentRisk} size="md" />
            </div>
            <div className="flex items-center gap-4 text-[10px] tabular-nums shrink-0">
              <span className="text-muted-foreground">
                <span className="font-bold text-foreground">{result.tasks.length}</span> battles
              </span>
              {completedCount > 0 && (
                <span className="text-success font-bold">{completedCount} conquered</span>
              )}
              {futureStats && futureStats.collapseCount > 0 && (
                <span className="text-destructive font-bold">⚠ {futureStats.collapseCount} endangered</span>
              )}
            </div>
            {predictionsLoading && (
              <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                <Cpu className="h-3 w-3 animate-pulse text-primary" />
                <span className="text-[10px]">Scanning threats…</span>
              </div>
            )}
          </div>

          {/* ── Campaign Progress Tracker ── */}
          <CampaignTracker
            totalBattles={result.tasks.length}
            conqueredNames={completedTasks}
            totalXP={sessionXP}
          />

          {/* ── Main Content: Choose or Prep ── */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              {phase === "choose" && (
                <BattleChooser
                  key="chooser"
                  choices={battleChoices}
                  conqueredNames={completedTasks}
                  remainingCount={remainingCount || sortedTasks.length}
                  onChoose={handleChooseBattle}
                  isFinalBattle={isFinalBattle}
                />
              )}
              {phase === "prep" && chosenTask && (
                <WarCouncil
                  key={`prep-${chosenTask.name}`}
                  task={chosenTask}
                  prediction={predictions[chosenTask.name]}
                  predictionsLoading={predictionsLoading}
                  isCompleted={completedTasks.has(chosenTask.name)}
                  onMarchToBattle={(task, intel) => { setCurrentIntel(intel); setSimTask(task); }}
                  onSwitchTarget={handleSwitchTarget}
                  onXPEarned={handleXPEarned}
                />
              )}
            </AnimatePresence>
          </div>

          {/* ── Bottom bar ── */}
          <div className="shrink-0 px-4 py-2 border-t border-border/50 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] gap-1.5 rounded-full"
              onClick={handleClose}
            >
              <Map className="h-3 w-3" /> 🏰 Back to Territory
            </Button>
            {!user && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] gap-1.5 rounded-full text-primary"
                onClick={() => navigate("/auth")}
              >
                <LogIn className="h-3 w-3" /> Sign in to save progress
              </Button>
            )}
          </div>
        </div>

        {/* View context for unified chat */}
        <RoleDeepDiveViewContext
          jobTitle={result.jobTitle}
          company={result.company}
          completedCount={completedCount}
          predsSummary={predsSummary}
        />

        <SimulatorModal
          open={!!simTask}
          onClose={() => { setSimTask(null); setCurrentIntel(null); fetchCompletions(); setPhase("choose"); setChosenTask(null); }}
          taskName={simTask?.name || ""}
          jobTitle={result.jobTitle}
          company={result.company}
          taskState={simTask?.currentState}
          taskTrend={simTask?.trend}
          taskImpactLevel={simTask?.impactLevel}
          onCompleted={fetchCompletions}
          onNextTask={pickNextTask}
          onBackToFeed={() => navigate("/")}
          intelContext={currentIntel ?? undefined}
          onNextBattle={() => { setSimTask(null); setCurrentIntel(null); setPhase("choose"); setChosenTask(null); fetchCompletions(); }}
          campaignStats={{ conquered: completedCount, total: result.tasks.length, sessionXP }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default RoleDeepDive;
