import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, TrendingUp, Minus, AlertTriangle, Zap, Bot, Globe, ExternalLink,
  Building2, Users, DollarSign, MapPin, Calendar, Tag,
  Wrench, Heart, Sparkles, Save, User,
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
  mostly_human: { label: "Mostly Human", className: "bg-success/10 text-success border-success/20", icon: User },
  human_ai: { label: "Human + AI", className: "bg-warning/10 text-warning border-warning/20", icon: Users },
  mostly_ai: { label: "Mostly AI", className: "bg-primary/10 text-primary border-primary/20", icon: Bot },
};

const trendIcons: Record<TrendDirection, { icon: typeof Minus; label: string }> = {
  stable: { icon: Minus, label: "Stable" },
  increasing_ai: { icon: TrendingUp, label: "More AI" },
  fully_ai_soon: { icon: Bot, label: "Fully AI Soon" },
};

const impactColors: Record<AIImpactLevel, string> = {
  low: "text-success",
  medium: "text-warning",
  high: "text-destructive",
};

const categoryConfig: Record<SkillCategory, { label: string; icon: typeof Wrench; description: string }> = {
  ai_tools: { label: "AI Tools to Learn", icon: Wrench, description: "Master these tools to boost your productivity" },
  human_skills: { label: "Human Skills to Strengthen", icon: Heart, description: "Double down on what makes you irreplaceable" },
  new_capabilities: { label: "New Capabilities to Build", icon: Sparkles, description: "Develop these emerging skills to stay ahead" },
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
      if (prebuilt) {
        await new Promise((r) => setTimeout(r, 1200));
        setResult({ ...prebuilt, company });
        setLoading(false);
        return;
      }
      try {
        const aiResult = await analyzeJobWithAI(jobTitle, company);
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

  // Get skills for the right panel
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
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-12">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
              <Zap className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Analyzing {jobTitle}...</h1>
            <p className="mt-2 text-muted-foreground">Evaluating how AI impacts each task in your role</p>
          </motion.div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="mx-auto h-10 w-10 text-warning mb-4" />
          <h1 className="text-xl font-display font-bold text-foreground mb-2">Analysis Failed</h1>
          <p className="text-muted-foreground mb-6">{error || "Something went wrong."}</p>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Try Again
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

  // For mobile: get related skills for inline display
  const getRelatedSkills = (taskName: string) =>
    result.skills.filter((s) => s.relatedTasks?.some((rt) => rt.toLowerCase() === taskName.toLowerCase()));

  // Orphan skills for mobile
  const linkedSkillNames = new Set(
    result.skills
      .filter((s) => s.relatedTasks?.some((rt) => result.tasks.some((t) => t.name.toLowerCase() === rt.toLowerCase())))
      .map((s) => s.name)
  );
  const orphanSkills = result.skills.filter((s) => !linkedSkillNames.has(s.name));

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-6 -ml-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> New analysis
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">{result.jobTitle}</h1>
          {result.company && <p className="mt-1 text-muted-foreground">at {result.company}</p>}
        </motion.div>

        {/* Company Snapshot */}
        {(snapshotLoading || snapshot) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-10">
            {snapshotLoading ? (
              <Skeleton className="h-28 w-full rounded-lg" />
            ) : snapshot ? (
              <Card className="border-border bg-accent/20">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {snapshot.logo && (
                      <img
                        src={snapshot.logo}
                        alt={snapshot.companyName || "Company logo"}
                        className="h-10 w-10 rounded-lg object-contain shrink-0 bg-card"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-display font-semibold text-foreground text-sm truncate">
                          {snapshot.companyName || snapshot.url}
                        </h3>
                        <a href={snapshot.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      {snapshot.tagline && <p className="text-sm text-muted-foreground mb-3">{snapshot.tagline}</p>}
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {snapshot.industry && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="h-3 w-3 shrink-0" /> {snapshot.industry}</span>}
                        {snapshot.companyType && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Tag className="h-3 w-3 shrink-0" /> {snapshot.companyType}</span>}
                        {snapshot.employeeRange && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3 w-3 shrink-0" /> {snapshot.employeeRange} employees</span>}
                        {snapshot.revenueScale && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><DollarSign className="h-3 w-3 shrink-0" /> {snapshot.revenueScale}</span>}
                        {snapshot.headquarters && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" /> {snapshot.headquarters}</span>}
                        {snapshot.founded && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="h-3 w-3 shrink-0" /> Est. {snapshot.founded}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </motion.div>
        )}

        {/* Summary Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Tasks augmented by AI", value: result.summary.augmentedPercent, color: "primary" },
            { label: "At risk of full automation", value: result.summary.automationRiskPercent, color: "destructive" },
            { label: "Requiring new skills", value: result.summary.newSkillsPercent, color: "warning" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border">
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-display font-bold text-${stat.color}`}>{stat.value}%</div>
                <p className="mt-1 text-xs text-muted-foreground leading-tight">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* AI Distribution Bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-10">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-3">Human vs AI Task Distribution</h2>
          <div className="flex rounded-lg overflow-hidden h-3">
            <div className="bg-success transition-all" style={{ width: `${100 - result.summary.augmentedPercent}%` }} />
            <div className="bg-warning transition-all" style={{ width: `${result.summary.augmentedPercent - result.summary.automationRiskPercent}%` }} />
            <div className="bg-primary transition-all" style={{ width: `${result.summary.automationRiskPercent}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> Human-driven</span>
            <span className="flex items-center gap-1.5"><Users className="h-3 w-3" /> AI-augmented</span>
            <span className="flex items-center gap-1.5"><Bot className="h-3 w-3" /> AI-driven</span>
          </div>
        </motion.div>

        {/* Two-Column Layout (desktop) / Single Column (mobile) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* LEFT COLUMN — Tasks */}
            <div>
              <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-4">Task-Level Breakdown</h2>
              <div className="space-y-3">
                {result.tasks.map((task, i) => {
                  const state = stateLabels[task.currentState];
                  const trend = trendIcons[task.trend];
                  const TrendIcon = trend.icon;
                  const isSelected = selectedTaskIndex === i;
                  const relatedSkills = getRelatedSkills(task.name);

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.04 }}
                    >
                      <Card
                        className={`border-border cursor-pointer transition-all hover:border-primary/40 ${isSelected ? "ring-2 ring-primary/30 border-primary/50" : ""}`}
                        onClick={() => !isMobile && handleTaskClick(i)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-medium text-foreground">{task.name}</h3>
                            <Badge variant="outline" className={`gap-1 ${state.className}`}>
                              {(() => { const StateIcon = state.icon; return <StateIcon className="h-3 w-3" />; })()}
                              {state.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <TrendIcon className="h-3 w-3" /> {trend.label}
                            </span>
                            <span className={`text-xs font-medium capitalize ${impactColors[task.impactLevel]}`}>
                              {task.impactLevel} impact
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Mobile: inline skills under each task */}
                      {isMobile && relatedSkills.length > 0 && (
                        <div className="mt-2 ml-3 border-l-2 border-border pl-4 space-y-2">
                          {relatedSkills.map((skill, si) => (
                            <SkillItem key={si} skill={skill} />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Mobile: orphan skills */}
              {isMobile && orphanSkills.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-4">Additional Skills</h2>
                  <div className="space-y-3">
                    {orphanSkills.map((skill, i) => (
                      <Card key={i} className="border-border">
                        <CardContent className="p-4">
                          <SkillItem skill={skill} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN — Skills Panel (desktop only) */}
            {!isMobile && (
              <div className="lg:sticky lg:top-6 lg:self-start">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                    {selectedTaskIndex !== null
                      ? `Skills for: ${result.tasks[selectedTaskIndex]?.name}`
                      : "All Recommended Skills"
                    }
                  </h2>
                  {selectedTaskIndex !== null && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTaskIndex(null)} className="text-xs text-muted-foreground h-auto py-1">
                      Show all
                    </Button>
                  )}
                </div>

                <div className="space-y-6">
                  {(Object.keys(categoryConfig) as SkillCategory[]).map((cat) => {
                    const skills = groupedSkills[cat];
                    if (!skills?.length) return null;
                    const config = categoryConfig[cat];
                    const CatIcon = config.icon;

                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-3">
                          <CatIcon className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
                        </div>
                        <div className="space-y-3">
                          {skills.map((skill, si) => (
                            <Card key={si} className="border-border">
                              <CardContent className="p-3">
                                <SkillItem skill={skill} />
                              </CardContent>
                            </Card>
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

        {/* Save CTA */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-12 text-center pb-8">
          <Card className="border-border bg-accent/30">
            <CardContent className="p-6">
              <h3 className="font-display font-semibold text-foreground mb-2">Save your learning path</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a free account to save your analysis, track progress, and revisit your skills roadmap.
              </p>
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" /> Save My Path
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

/* Extracted reusable skill item */
const SkillItem = ({ skill }: { skill: JobAnalysisResult["skills"][number] }) => {
  const catConf = categoryConfig[skill.category];
  const CatIcon = catConf.icon;

  return (
    <div className="flex items-start gap-2">
      <CatIcon className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{skill.name}</span>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${priorityStyles[skill.priority]}`}>
            {skill.priority}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{skill.description}</p>
        {skill.resources && skill.resources.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {skill.resources.map((resource, ri) => (
              <a
                key={ri}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                title={resource.summary}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-background text-muted-foreground hover:text-foreground border border-border transition-colors"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                {resource.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analysis;
