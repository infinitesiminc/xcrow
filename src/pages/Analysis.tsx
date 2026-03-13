import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, TrendingUp, Minus, AlertTriangle, Zap, Bot, ExternalLink,
  Building2, Users, DollarSign, MapPin, Calendar, Tag,
  Wrench, Heart, Sparkles, Save, User, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { JobAnalysisResult, TaskState, TrendDirection, AIImpactLevel, SkillCategory, SkillPriority } from "@/types/analysis";
import { findPrebuiltRole } from "@/data/prebuilt-roles";
import { analyzeJobWithAI } from "@/lib/ai-analysis";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

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

const stateLabels: Record<TaskState, { label: string; className: string; icon: typeof Bot }> = {
  mostly_human: { label: "Human", className: "bg-success/10 text-success border-success/20", icon: User },
  human_ai: { label: "Human+AI", className: "bg-warning/10 text-warning border-warning/20", icon: Users },
  mostly_ai: { label: "AI", className: "bg-primary/10 text-primary border-primary/20", icon: Bot },
};

const trendIcons: Record<TrendDirection, { icon: typeof Minus; className: string }> = {
  stable: { icon: Minus, className: "text-muted-foreground" },
  increasing_ai: { icon: TrendingUp, className: "text-warning" },
  fully_ai_soon: { icon: Bot, className: "text-destructive" },
};

const impactDot: Record<AIImpactLevel, string> = {
  low: "bg-success",
  medium: "bg-warning",
  high: "bg-destructive",
};

const categoryConfig: Record<SkillCategory, { label: string; icon: typeof Wrench }> = {
  ai_tools: { label: "Tools", icon: Wrench },
  human_skills: { label: "Human", icon: Heart },
  new_capabilities: { label: "New", icon: Sparkles },
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
  const isMobile = useIsMobile();
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

  useEffect(() => {
    if (!jobTitle) { navigate("/"); return; }
    const analyze = async () => {
      setLoading(true);
      setError(null);
      const prebuilt = findPrebuiltRole(jobTitle);
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
  }, [jobTitle, company, navigate]);

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
            <h1 className="text-xl font-display font-bold text-foreground">Analyzing {jobTitle}...</h1>
            <p className="mt-1 text-sm text-muted-foreground">Evaluating AI impact on your role</p>
          </motion.div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
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

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header — compact */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4 -ml-2 text-muted-foreground h-7 text-xs">
            <ArrowLeft className="w-3 h-3 mr-1" /> New analysis
          </Button>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-2xl font-display font-bold text-foreground">{result.jobTitle}</h1>
            {result.company && <span className="text-sm text-muted-foreground">at {result.company}</span>}
          </div>
        </motion.div>

        {/* Company Snapshot — inline compact */}
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

        {/* Stats row — condensed */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="flex items-center gap-6 px-4 py-3 rounded-lg border border-border">
            {[
              { label: "AI-augmented", value: result.summary.augmentedPercent, color: "text-primary" },
              { label: "Automation risk", value: result.summary.automationRiskPercent, color: "text-destructive" },
              { label: "New skills needed", value: result.summary.newSkillsPercent, color: "text-warning" },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-2">
                {i > 0 && <div className="w-px h-6 bg-border -ml-3 mr-0" />}
                <span className={`text-lg font-display font-bold ${stat.color}`}>{stat.value}%</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
          {/* Distribution bar */}
          <div className="flex rounded-full overflow-hidden h-1.5 mt-3">
            <div className="bg-success transition-all" style={{ width: `${100 - result.summary.augmentedPercent}%` }} />
            <div className="bg-warning transition-all" style={{ width: `${result.summary.augmentedPercent - result.summary.automationRiskPercent}%` }} />
            <div className="bg-primary transition-all" style={{ width: `${result.summary.automationRiskPercent}%` }} />
          </div>
        </motion.div>

        {/* Two-Column Layout */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            {/* LEFT — Tasks (3/5 width) */}
            <div className="lg:col-span-3">
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Tasks</h2>
              <div className="space-y-2">
                {result.tasks.map((task, i) => {
                  const state = stateLabels[task.currentState];
                  const trend = trendIcons[task.trend];
                  const TrendIcon = trend.icon;
                  const isSelected = selectedTaskIndex === i;
                  const relatedSkills = getRelatedSkills(task.name);

                  return (
                    <div key={i}>
                      <div
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all cursor-pointer group
                          ${isSelected
                            ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                            : "border-border hover:border-primary/30 bg-card"
                          }`}
                        onClick={() => !isMobile && handleTaskClick(i)}
                      >
                        {/* Impact dot */}
                        <div className={`w-2 h-2 rounded-full shrink-0 ${impactDot[task.impactLevel]}`} />

                        {/* Task info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground truncate">{task.name}</span>
                            <TrendIcon className={`h-3 w-3 shrink-0 ${trend.className}`} />
                          </div>
                        </div>

                        {/* State badge */}
                        <Badge variant="outline" className={`gap-1 text-[10px] px-1.5 py-0 shrink-0 ${state.className}`}>
                          {(() => { const StateIcon = state.icon; return <StateIcon className="h-2.5 w-2.5" />; })()}
                          {state.label}
                        </Badge>
                      </div>

                      {/* Mobile: inline skills */}
                      {isMobile && relatedSkills.length > 0 && (
                        <div className="ml-5 mt-1 mb-2 space-y-1">
                          {relatedSkills.map((skill, si) => (
                            <CompactSkill key={si} skill={skill} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT — Skills (2/5 width, desktop only) */}
            {!isMobile && (
              <div className="lg:col-span-2 lg:sticky lg:top-4 lg:self-start">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    {selectedTaskIndex !== null ? "Related Skills" : "Skills"}
                  </h2>
                  {selectedTaskIndex !== null && (
                    <button onClick={() => setSelectedTaskIndex(null)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                      Show all
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {(Object.keys(categoryConfig) as SkillCategory[]).map((cat) => {
                    const skills = groupedSkills[cat];
                    if (!skills?.length) return null;
                    const config = categoryConfig[cat];
                    const CatIcon = config.icon;

                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <CatIcon className="h-3 w-3 text-primary" />
                          <span className="text-xs font-semibold text-foreground">{config.label}</span>
                        </div>
                        <div className="space-y-1.5">
                          {skills.map((skill, si) => (
                            <CompactSkill key={si} skill={skill} showResources />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Save CTA — minimal */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center py-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">Save your analysis and track your learning path</p>
          <Button onClick={handleSave} size="sm" className="gap-1.5">
            <Save className="w-3.5 h-3.5" /> Save My Path
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

/* Expandable skill row — compact by default, click to reveal full details */
const CompactSkill = ({ skill, showResources = false }: { skill: JobAnalysisResult["skills"][number]; showResources?: boolean }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => showResources && setExpanded(!expanded)}
      className={`w-full text-left px-2.5 py-2 rounded-md border transition-all ${
        expanded
          ? "bg-accent/50 border-border"
          : "bg-accent/30 border-border/50 hover:border-border"
      } ${showResources ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-foreground">{skill.name}</span>
        <Badge variant="outline" className={`text-[9px] px-1 py-0 capitalize leading-tight shrink-0 ${priorityStyles[skill.priority]}`}>
          {skill.priority}
        </Badge>
        {showResources && (
          <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
        )}
      </div>

      {/* Collapsed: one-line preview */}
      {!expanded && (
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{skill.description}</p>
      )}

      {/* Expanded: full description + all resources */}
      {expanded && (
        <div className="mt-1.5">
          <p className="text-[11px] text-muted-foreground leading-relaxed">{skill.description}</p>
          {skill.resources && skill.resources.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {skill.resources.map((r, ri) => (
                <a
                  key={ri}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-start gap-1.5 text-[11px] group"
                >
                  <ExternalLink className="h-2.5 w-2.5 mt-0.5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <span className="font-medium text-foreground group-hover:underline">{r.name}</span>
                    <p className="text-muted-foreground leading-snug">{r.summary}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </button>
  );
};

export default Analysis;
