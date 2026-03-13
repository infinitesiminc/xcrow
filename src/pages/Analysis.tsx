import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, TrendingUp, Minus, AlertTriangle, Zap, Bot, ExternalLink,
  Building2, Users, MapPin, Calendar,
  Wrench, Heart, Sparkles, Save, User, ChevronDown,
  ShieldAlert, GraduationCap, Rocket, Play, CheckCircle2, LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { JobAnalysisResult, TaskState, TrendDirection, AIImpactLevel, SkillCategory, SkillPriority } from "@/types/analysis";
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

const stateLabels: Record<TaskState, { label: string; className: string; icon: typeof Bot; bg: string }> = {
  mostly_human: { label: "Human-led", className: "bg-success/10 text-success border-success/20", icon: User, bg: "bg-success/10" },
  human_ai: { label: "Human + AI", className: "bg-warning/10 text-warning border-warning/20", icon: Users, bg: "bg-warning/10" },
  mostly_ai: { label: "AI-driven", className: "bg-primary/10 text-primary border-primary/20", icon: Bot, bg: "bg-primary/10" },
};

const trendConfig: Record<TrendDirection, { icon: typeof Minus; className: string; label: string }> = {
  stable: { icon: Minus, className: "text-muted-foreground bg-muted", label: "Stable" },
  increasing_ai: { icon: TrendingUp, className: "text-warning bg-warning/10", label: "Growing AI" },
  fully_ai_soon: { icon: Bot, className: "text-destructive bg-destructive/10", label: "Full AI soon" },
};

const impactBorder: Record<AIImpactLevel, string> = {
  low: "border-l-success",
  medium: "border-l-warning",
  high: "border-l-destructive",
};

const heroGradients: Record<AIImpactLevel, string> = {
  low: "bg-gradient-to-br from-success/30 via-success/15 to-primary/10",
  medium: "bg-gradient-to-br from-warning/30 via-warning/15 to-accent/20",
  high: "bg-gradient-to-br from-destructive/30 via-destructive/15 to-warning/10",
};

const heroIconColors: Record<AIImpactLevel, string> = {
  low: "text-success",
  medium: "text-warning",
  high: "text-destructive",
};

const heroIcons: Record<AIImpactLevel, typeof Bot> = {
  low: User,
  medium: Users,
  high: Bot,
};

const categoryConfig: Record<SkillCategory, { label: string; icon: typeof Wrench; bg: string; iconColor: string }> = {
  ai_tools: { label: "AI Tools & Platforms", icon: Wrench, bg: "bg-primary/10", iconColor: "text-primary" },
  human_skills: { label: "Human-Edge Skills", icon: Heart, bg: "bg-destructive/10", iconColor: "text-destructive" },
  new_capabilities: { label: "New Capabilities", icon: Sparkles, bg: "bg-warning/10", iconColor: "text-warning" },
};

const priorityStyles: Record<SkillPriority, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

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
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null);
  const [simTask, setSimTask] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
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
  useEffect(() => {
    if (!jobTitle && !hasJd) { navigate("/"); return; }
    const analyze = async () => {
      setLoading(true);
      setError(null);
      const prebuilt = jobTitle ? findPrebuiltRole(jobTitle) : null;
      if (prebuilt && !hasJd) {
        await new Promise((r) => setTimeout(r, 1200));
        setResult({ ...prebuilt, company });
        setLoading(false);
        return;
      }
      try {
        const aiResult = await analyzeJobWithAI(jobTitle, company, jdText || undefined, jdUrlParam || undefined);
        setResult(aiResult);
      } catch (err) {
        setError("Unable to analyze this role right now. Please try again.");
        console.error(err);
      }
      setLoading(false);
    };
    analyze();
  }, [jobTitle, company, hasJd, navigate]);

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

  const handleSave = () => {
    toast({ title: "Coming soon!", description: "Sign up to save your learning path and track progress." });
  };

  const handleTaskClick = (index: number) => {
    setSelectedTaskIndex((prev) => (prev === index ? null : index));
  };

  const getDisplayedSkills = () => {
    if (!result) return [];
    if (selectedTaskIndex === null) return result.skills;
    const selectedTask = result.tasks[selectedTaskIndex];
    if (!selectedTask) return result.skills;
    const related = result.skills.filter(
      (s) => s.relatedTasks?.some((rt) => rt.toLowerCase() === selectedTask.name.toLowerCase())
    );
    return related.length > 0 ? related : result.skills;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-12">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
              <Zap className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <h1 className="text-xl font-display font-bold text-foreground">Analyzing {jobTitle || "role from JD"}...</h1>
            <p className="mt-1 text-sm text-muted-foreground">Evaluating AI impact on your role</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
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
          <h1 className="text-lg font-display font-bold text-foreground mb-1">Analysis Failed</h1>
          <p className="text-sm text-muted-foreground mb-4">{error || "Something went wrong."}</p>
          <Button onClick={() => navigate("/")} variant="outline" size="sm">
            <ArrowLeft className="w-3 h-3 mr-1" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  const displayedSkills = getDisplayedSkills();
  const groupedSkills = displayedSkills.reduce(
    (acc, skill) => {
      acc[skill.category] = acc[skill.category] || [];
      acc[skill.category].push(skill);
      return acc;
    },
    {} as Record<SkillCategory, typeof result.skills>,
  );

  const getRelatedSkills = (taskName: string) =>
    result.skills.filter((s) => s.relatedTasks?.some((rt) => rt.toLowerCase() === taskName.toLowerCase()));

  const statCards = [
    {
      label: `${result.summary.augmentedPercent}% of tasks will involve AI tools`,
      value: result.summary.augmentedPercent,
      icon: Bot,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      barColor: "bg-primary",
    },
    {
      label: `${result.summary.automationRiskPercent}% could be fully automated`,
      value: result.summary.automationRiskPercent,
      icon: ShieldAlert,
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
      barColor: "bg-destructive",
    },
    {
      label: `${result.summary.newSkillsPercent}% require learning new skills`,
      value: result.summary.newSkillsPercent,
      icon: GraduationCap,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      barColor: "bg-warning",
    },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4 -ml-2 text-muted-foreground h-7 text-xs">
            <ArrowLeft className="w-3 h-3 mr-1" /> New analysis
          </Button>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-2xl font-display font-bold text-foreground">{result.jobTitle}</h1>
            {result.company && <span className="text-sm text-muted-foreground">at {result.company}</span>}
          </div>
        </motion.div>

        {/* Company Snapshot */}
        {(snapshotLoading || snapshot) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
            {snapshotLoading ? (
              <Skeleton className="h-16 w-full rounded-lg" />
            ) : snapshot ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-accent/20 border border-border">
                {snapshot.logo && (
                  <img src={snapshot.logo} alt="" className="h-8 w-8 rounded-md object-contain shrink-0 bg-card"
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
            ) : null}
          </motion.div>
        )}

        {/* === Stat Cards === */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statCards.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
                  <Card className="relative overflow-hidden border-border hover:border-primary/20 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${stat.iconBg}`}>
                          <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-snug">{stat.label}</p>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full rounded-full ${stat.barColor} transition-all duration-700`} style={{ width: `${stat.value}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Task Carousel */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-8">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Tasks</h2>
          <div className="task-carousel flex overflow-x-auto gap-4 snap-x snap-mandatory pb-4">
            {result.tasks.map((task, i) => {
              const state = stateLabels[task.currentState];
              const trend = trendConfig[task.trend];
              const TrendIcon = trend.icon;
              const isSelected = selectedTaskIndex === i;
              const heroGradient = heroGradients[task.impactLevel];
              const HeroIcon = heroIcons[task.impactLevel];

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  className="snap-start shrink-0"
                  style={{ width: 280 }}
                >
                  <Card
                    className={`h-full cursor-pointer transition-all hover:shadow-lg overflow-hidden ${
                      isSelected ? "ring-2 ring-primary shadow-lg" : "hover:ring-1 hover:ring-primary/20"
                    }`}
                    onClick={() => handleTaskClick(i)}
                  >
                    {/* Hero gradient header */}
                    <div className={`relative h-32 ${heroGradient} flex items-center justify-center overflow-hidden`}>
                      <HeroIcon className={`h-16 w-16 ${heroIconColors[task.impactLevel]} opacity-40`} strokeWidth={1.5} />
                      <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
                    </div>

                    <CardContent className="p-4">
                      <h3 className="text-sm font-display font-bold text-foreground mb-1 line-clamp-2 leading-snug">{task.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.description}</p>

                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${state.className}`}>
                          {state.label}
                        </Badge>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${trend.className}`}>
                          <TrendIcon className="h-2.5 w-2.5" />
                          {trend.label}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-7 text-xs gap-1.5 text-primary hover:bg-primary/10"
                        onClick={(e) => { e.stopPropagation(); setSimTask(task.name); }}
                      >
                        <Play className="h-3 w-3" /> Practice
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Skills Grid */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {selectedTaskIndex !== null ? `Skills for "${result.tasks[selectedTaskIndex]?.name}"` : "Skills to Learn"}
            </h2>
            {selectedTaskIndex !== null && (
              <button onClick={() => setSelectedTaskIndex(null)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                Show all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Object.keys(categoryConfig) as SkillCategory[]).map((cat) => {
              const skills = groupedSkills[cat];
              if (!skills?.length) return null;
              const config = categoryConfig[cat];
              const CatIcon = config.icon;

              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${config.bg}`}>
                      <CatIcon className={`h-3.5 w-3.5 ${config.iconColor}`} />
                    </div>
                    <span className="text-xs font-bold text-foreground uppercase tracking-wide">{config.label}</span>
                  </div>
                  <div className="space-y-2">
                    {skills.map((skill, si) => (
                      <CompactSkill key={si} skill={skill} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA Banner */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-accent/30 to-primary/5 overflow-hidden">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 shrink-0">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-base font-display font-bold text-foreground mb-0.5">Save your learning path</h3>
                <p className="text-sm text-muted-foreground">Track your progress and get personalized skill recommendations</p>
              </div>
              <Button onClick={handleSave} size="sm" className="gap-1.5 shrink-0">
                <Save className="w-3.5 h-3.5" /> Save My Path
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Simulator Modal */}
        <SimulatorModal
          open={!!simTask}
          onClose={() => setSimTask(null)}
          taskName={simTask || ""}
          jobTitle={result.jobTitle}
          company={result.company}
        />
      </div>
    </div>
  );
};

/* Skill card with expand/collapse */
const CompactSkill = ({ skill }: { skill: JobAnalysisResult["skills"][number] }) => {
  return (
    <Card className="transition-all hover:border-primary/10">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 capitalize shrink-0 ${priorityStyles[skill.priority]}`}>
            {skill.priority}
          </Badge>
          <span className="text-xs font-semibold text-foreground truncate">{skill.name}</span>
        </div>

        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{skill.description}</p>

        {skill.resources && skill.resources.length > 0 && (
          <div className="mt-2.5 space-y-2">
            {skill.resources.map((r, ri) => (
              <a
                key={ri}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 p-2 rounded-md bg-accent/30 border border-border/50 hover:border-primary/20 transition-colors group"
              >
                <ExternalLink className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-foreground group-hover:underline">{r.name}</span>
                  <p className="text-[10px] text-muted-foreground leading-snug">{r.summary}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Analysis;
