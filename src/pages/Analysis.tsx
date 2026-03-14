import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Zap, AlertTriangle, Bot, ExternalLink,
  Building2, Users, MapPin, Calendar,
  ShieldAlert, GraduationCap, Rocket, CheckCircle2, LogIn,
  ListChecks, Route, Target, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { JobAnalysisResult, TaskAnalysis } from "@/types/analysis";
import { findPrebuiltRole } from "@/data/prebuilt-roles";
import { analyzeJobWithAI } from "@/lib/ai-analysis";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchCareerPathways, type EscoMatchResult, type EscoPathway } from "@/lib/esco-api";
import { generateLocalPathways } from "@/lib/local-pathways";

import SimulatorModal from "@/components/SimulatorModal";
import { RiskGauge } from "@/components/analysis/RiskGauge";
import { TaskTable } from "@/components/analysis/TaskTable";
import { CareerPathways } from "@/components/analysis/CareerPathways";
import { ActionPlan } from "@/components/analysis/ActionPlan";
import { RoleContext } from "@/components/analysis/RoleContext";
import { IndustryBenchmarkCard } from "@/components/analysis/IndustryBenchmark";
import { CuratedSkillsBadge } from "@/components/analysis/CuratedSkills";

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

function calcAgentRisk(automationRisk: number, augmented: number, newSkills: number): number {
  return Math.round(automationRisk * 0.55 + (100 - augmented) * 0.25 + newSkills * 0.20);
}

function getVerdict(result: JobAnalysisResult, agentRisk: number): Verdict {
  const { automationRiskPercent, augmentedPercent } = result.summary;
  const fullyAiSoon = result.tasks.filter(t => t.trend === "fully_ai_soon").length;
  const mostlyHuman = result.tasks.filter(t => t.currentState === "mostly_human").length;
  if (agentRisk >= 45 || (automationRiskPercent >= 40 && fullyAiSoon >= 3)) return "pivot";
  if (agentRisk <= 28 && mostlyHuman >= 3 && augmentedPercent >= 55) return "leverage";
  return "upskill";
}

function getVerdictReasoning(verdict: Verdict, result: JobAnalysisResult): string {
  switch (verdict) {
    case "pivot":
      return `With ${result.summary.automationRiskPercent}% automation risk and multiple tasks trending to full AI, consider transitioning to adjacent roles where your skills transfer.`;
    case "leverage":
      return `Your role has strong human-led tasks and high AI augmentation potential. Focus on mastering AI tools to amplify your existing strengths.`;
    case "upskill":
      return `Build new capabilities in AI collaboration and focus on the tasks most at risk. Targeted upskilling will future-proof your position.`;
  }
}

const isWebsite = (value: string) =>
  /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(value.trim());

const Analysis = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
  const [snapshot, setSnapshot] = useState<CompanySnapshot | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [simTask, setSimTask] = useState<TaskAnalysis | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [escoData, setEscoData] = useState<EscoMatchResult | null>(null);
  const [escoLoading, setEscoLoading] = useState(false);
  const [escoError, setEscoError] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const fetchCompletions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("completed_simulations")
      .select("task_name")
      .eq("user_id", user.id);
    if (data) setCompletedTasks(new Set(data.map((d: any) => d.task_name)));
  }, [user]);

  useEffect(() => { fetchCompletions(); }, [fetchCompletions]);

  // Show sticky bar when hero card scrolls out of view
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, result]);

  const saveAnalysisHistory = useCallback(async (analysisResult: JobAnalysisResult) => {
    if (!user) return;
    try {
      let query = supabase.from("analysis_history")
        .select("id")
        .eq("user_id", user.id)
        .eq("job_title", analysisResult.jobTitle);
      if (analysisResult.company) {
        query = query.eq("company", analysisResult.company);
      } else {
        query = query.is("company", null);
      }
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
          user_id: user.id,
          job_title: analysisResult.jobTitle,
          company: analysisResult.company || null,
          tasks_count: analysisResult.tasks.length,
          augmented_percent: analysisResult.summary.augmentedPercent,
          automation_risk_percent: analysisResult.summary.automationRiskPercent,
        });
      }
    } catch (err) {
      console.error("Failed to save analysis history:", err);
    }
  }, [user]);

  useEffect(() => {
    if (!jobTitle && !hasJd) { navigate("/"); return; }
    const analyze = async () => {
      setLoading(true);
      setError(null);
      const prebuilt = jobTitle ? findPrebuiltRole(jobTitle) : null;
      if (prebuilt && !hasJd) {
        await new Promise(r => setTimeout(r, 1200));
        const r = { ...prebuilt, company };
        setResult(r);
        saveAnalysisHistory(r);
        setLoading(false);
        return;
      }
      try {
        const aiResult = await analyzeJobWithAI(jobTitle, company, jdText || undefined, jdUrlParam || undefined);
        setResult(aiResult);
        saveAnalysisHistory(aiResult);
      } catch (err) {
        setError("Unable to analyze this role right now. Please try again.");
        console.error(err);
      }
      setLoading(false);
    };
    analyze();
  }, [jobTitle, company, hasJd, navigate]);

  // Fetch ESCO data with local fallback
  useEffect(() => {
    if (!result?.jobTitle) return;
    setEscoLoading(true);
    setEscoError(false);
    fetchCareerPathways(result.jobTitle)
      .then(setEscoData)
      .catch(() => {
        // Use local fallback from prebuilt roles
        const local = generateLocalPathways(result.jobTitle);
        if (local && local.pathways.length > 0) {
          setEscoData(local);
        } else {
          setEscoError(true);
        }
      })
      .finally(() => setEscoLoading(false));
  }, [result?.jobTitle]);

  useEffect(() => {
    if (!company || !isWebsite(company)) return;
    const fetchSnapshot = async () => {
      setSnapshotLoading(true);
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/scrape-company`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
          body: JSON.stringify({ url: company }),
        });
        const data = await res.json();
        if (data.success) setSnapshot(data);
      } catch (err) {
        console.error("Failed to fetch company snapshot:", err);
      } finally {
        setSnapshotLoading(false);
      }
    };
    fetchSnapshot();
  }, [company]);

  // Computed values
  const agentRisk = useMemo(() => {
    if (!result) return 0;
    return calcAgentRisk(result.summary.automationRiskPercent, result.summary.augmentedPercent, result.summary.newSkillsPercent);
  }, [result]);

  const verdict = useMemo(() => {
    if (!result) return "upskill" as Verdict;
    return getVerdict(result, agentRisk);
  }, [result, agentRisk]);

  const topPathway: EscoPathway | null = escoData?.pathways?.[0] || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-12">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
              <Zap className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <h1 className="text-xl font-sans font-bold text-foreground">Analyzing {jobTitle || "role from JD"}...</h1>
            <p className="mt-1 text-sm text-muted-foreground">Building your personal report card</p>
          </motion.div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

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

  const statCards = [
    { label: "AI Involvement", value: result.summary.augmentedPercent, icon: Bot, dotColor: "bg-dot-blue" },
    { label: "Automation Risk", value: result.summary.automationRiskPercent, icon: ShieldAlert, dotColor: "bg-dot-purple" },
    { label: "New Skills Needed", value: result.summary.newSkillsPercent, icon: GraduationCap, dotColor: "bg-dot-amber" },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      {/* Sticky context bar */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50"
          >
            <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <button onClick={() => navigate("/")} className="p-1 rounded-md hover:bg-accent transition-colors shrink-0">
                  <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <span className="text-sm font-semibold text-foreground truncate">{result.jobTitle}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`w-2 h-2 rounded-full ${getRiskTier(agentRisk).dotClass}`} />
                <span className="text-xs font-bold text-foreground tabular-nums">{agentRisk}%</span>
                <span className="text-[10px] text-muted-foreground">agent risk</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start gap-3 mb-6">
            <button onClick={() => navigate("/")} className="mt-1 p-1.5 rounded-lg hover:bg-accent transition-colors shrink-0">
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground leading-tight">{result.jobTitle}</h1>
              
            </div>
          </div>

          {/* Company snapshot */}
          {snapshot && (
            <div className="flex items-center gap-3 mb-6 px-3 py-2.5 rounded-lg bg-card border border-border/50">
              {snapshot.logo && (
                <img src={snapshot.logo} alt="" className="h-7 w-7 rounded-md object-contain shrink-0 bg-card"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground min-w-0">
                <span className="font-medium text-foreground text-sm">{snapshot.companyName || snapshot.url}</span>
                {snapshot.industry && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{snapshot.industry}</span>}
                {snapshot.employeeRange && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{snapshot.employeeRange}</span>}
                {snapshot.headquarters && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{snapshot.headquarters}</span>}
                {snapshot.founded && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{snapshot.founded}</span>}
                <a href={snapshot.url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </motion.div>

        {/* Section 1: Risk Gauge + Verdict */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <RiskGauge
                risk={agentRisk}
                verdict={verdict}
                reasoning={getVerdictReasoning(verdict, result)}
              />

              {/* Stat pills */}
              <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-border/50">
                {statCards.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.07 }}
                      className="text-center"
                    >
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${stat.dotColor} shrink-0`} />
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-lg font-sans font-bold text-foreground">{stat.value}%</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                      <div className="w-full h-1 rounded-full bg-secondary/60 overflow-hidden mt-1.5 mx-auto max-w-[80px]">
                        <motion.div
                          className="h-full rounded-full bg-foreground/20"
                          initial={{ width: 0 }}
                          animate={{ width: `${stat.value}%` }}
                          transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabbed Sections */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Tabs defaultValue="tasks" className="mb-8">
            <TabsList className="w-full grid grid-cols-4 h-11 mb-4">
              <TabsTrigger value="tasks" className="gap-1.5 text-xs sm:text-sm">
                <ListChecks className="h-3.5 w-3.5" /> Tasks
              </TabsTrigger>
              <TabsTrigger value="pathways" className="gap-1.5 text-xs sm:text-sm">
                <Route className="h-3.5 w-3.5" /> Pathways
              </TabsTrigger>
              <TabsTrigger value="plan" className="gap-1.5 text-xs sm:text-sm">
                <Target className="h-3.5 w-3.5" /> Plan
              </TabsTrigger>
              <TabsTrigger value="context" className="gap-1.5 text-xs sm:text-sm">
                <BarChart3 className="h-3.5 w-3.5" /> Context
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks">
              <TaskTable
                tasks={result.tasks}
                skills={result.skills}
                completedTasks={completedTasks}
                onPractice={(taskName) => {
                  const task = result.tasks.find(t => t.name === taskName);
                  if (task) setSimTask(task);
                }}
              />
            </TabsContent>

            <TabsContent value="pathways">
              <CareerPathways data={escoData} loading={escoLoading} error={escoError} />
            </TabsContent>

            <TabsContent value="plan">
              <ActionPlan
                result={result}
                topPathway={topPathway}
                onPractice={(taskName) => {
                  const task = result.tasks.find(t => t.name === taskName);
                  if (task) setSimTask(task);
                }}
              />
            </TabsContent>

            <TabsContent value="context">
              <div className="space-y-4">
                {result.industryBenchmark && result.industryBenchmark.industry && (
                  <IndustryBenchmarkCard
                    benchmark={result.industryBenchmark}
                    currentRisk={result.summary.automationRiskPercent}
                    currentAugmented={result.summary.augmentedPercent}
                  />
                )}
                {result.curatedSkills && result.curatedSkills.length > 0 && (
                  <CuratedSkillsBadge curatedSkills={result.curatedSkills} />
                )}
                <RoleContext agentRisk={agentRisk} jobTitle={result.jobTitle} />
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Slim CTA */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-primary/20 bg-primary/5 mb-8">
          <div className="flex items-center gap-2.5 min-w-0">
            <Rocket className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm text-muted-foreground truncate">
              {user ? "See all your progress" : "Sign in to track progress"}
            </span>
          </div>
          <Button onClick={() => navigate(user ? "/dashboard" : "/auth")} size="sm" variant="ghost" className="gap-1.5 shrink-0 text-xs">
            {user ? <><CheckCircle2 className="w-3.5 h-3.5" /> Dashboard</> : <><LogIn className="w-3.5 h-3.5" /> Sign In</>}
          </Button>
        </div>

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
        />
      </div>
    </div>
  );
};

export default Analysis;
