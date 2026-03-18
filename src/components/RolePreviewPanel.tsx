import { useState, useEffect, useMemo, useCallback } from "react";
import { X, MapPin, Loader2, Play, Maximize2, ChevronLeft, CheckCircle2, Bot, Trophy, Bookmark, BookmarkCheck, GraduationCap, MessageSquare, BarChart3, FileText, Users, Search, Settings, Globe, Shield, Lightbulb, PenTool, Code, TrendingUp, Megaphone, Target, Briefcase, Heart, Layers, Zap, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SimulatorModal from "@/components/SimulatorModal";
import { Button } from "@/components/ui/button";
import type { RoleResult } from "@/components/InlineRoleCarousel";

function hashToHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = str.charCodeAt(i) + ((h << 5) - h);
  }
  return Math.abs(h) % 360;
}

function taskChipStyle(aiScore: number) {
  if (aiScore >= 70) return { badge: "bg-primary/15 text-primary", accent: "text-primary" };
  if (aiScore >= 40) return { badge: "bg-amber-500/15 text-amber-400", accent: "text-amber-400" };
  return { badge: "bg-emerald-500/15 text-emerald-400", accent: "text-emerald-400" };
}

interface RolePreviewPanelProps {
  role: RoleResult;
  onClose: () => void;
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

interface TaskCluster {
  cluster_name: string;
  description: string | null;
  ai_exposure_score: number | null;
  priority: string | null;
  ai_state?: string | null;
  ai_trend?: string | null;
  impact_level?: string | null;
}

type PanelView = "details" | "breakdown" | "simulation" | "enlarged";

export default function RolePreviewPanel({ role, onClose }: RolePreviewPanelProps) {
  const { user, openAuthModal } = useAuth();
  const [tasks, setTasks] = useState<TaskCluster[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(role.sourceUrl || null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<PanelView>("details");
  const [simTask, setSimTask] = useState<TaskCluster | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [isBookmarked, setIsBookmarked] = useState(false);
  

  const hue1 = hashToHue(role.title);
  const hue2 = (hue1 + 60) % 360;

  useEffect(() => {
    setView("details");
    setSimTask(null);
    if (!role.jobId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const [taskRes, jobRes] = await Promise.all([
        supabase.from("job_task_clusters")
          .select("cluster_name, description, ai_exposure_score, priority, ai_state, ai_trend, impact_level")
          .eq("job_id", role.jobId).order("sort_order"),
        supabase.from("jobs").select("role_summary, source_url").eq("id", role.jobId).single(),
      ]);
      setTasks(taskRes.data || []);
      setSummary(jobRes.data?.role_summary || null);
      setSourceUrl(role.sourceUrl || jobRes.data?.source_url || null);
      setLoading(false);
    })();
  }, [role.jobId]);

  // Fetch completed simulations
  const fetchCompletions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("completed_simulations").select("task_name").eq("user_id", user.id);
    if (data) setCompletedTasks(new Set(data.map((d: any) => d.task_name)));
  }, [user]);

  useEffect(() => { fetchCompletions(); }, [fetchCompletions]);

  // Bookmark state
  useEffect(() => {
    if (!user || !role.title) return;
    (async () => {
      let q = supabase.from("bookmarked_roles").select("id").eq("user_id", user.id).eq("job_title", role.title);
      if (role.company) q = q.eq("company", role.company); else q = q.is("company", null);
      const { data } = await q.maybeSingle();
      setIsBookmarked(!!data);
    })();
  }, [user, role.title, role.company]);

  const toggleBookmark = async () => {
    if (!user) { openAuthModal(); return; }
    if (isBookmarked) {
      let q = supabase.from("bookmarked_roles").delete().eq("user_id", user.id).eq("job_title", role.title);
      if (role.company) q = q.eq("company", role.company); else q = q.is("company", null);
      await q;
      setIsBookmarked(false);
    } else {
      await supabase.from("bookmarked_roles").insert({
        user_id: user.id, job_title: role.title, company: role.company || null,
        augmented_percent: role.augmented, automation_risk_percent: role.risk,
      });
      setIsBookmarked(true);
    }
  };

  const readiness = useMemo(() => {
    if (!role.augmented && !role.risk) return 0;
    return 100 - Math.round((role.risk || 0) * 0.55 + (100 - (role.augmented || 0)) * 0.25 + 20);
  }, [role]);

  const logoUrl = role.logo || (role.company ? `https://logo.clearbit.com/${role.company.toLowerCase().replace(/\s+/g, "")}.com` : "");

  const startSimulation = (task: TaskCluster) => {
    setSimTask(task);
    setView("simulation");
  };

  const pickNextTask = useCallback(() => {
    if (!simTask) return;
    const idx = tasks.findIndex(t => t.cluster_name === simTask.cluster_name);
    const next = tasks[idx + 1];
    if (next) setSimTask(next);
    else { setView("breakdown"); setSimTask(null); }
  }, [tasks, simTask]);

  const closeSimulation = () => {
    setView("enlarged");
    setSimTask(null);
    fetchCompletions();
  };

  // Simulation overlay — always full-screen with one-click kill
  const simulationOverlay = view === "simulation" && simTask && (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Simulation content — no extra header, SimulatorModal has its own */}
      <div className="flex-1 overflow-hidden">
        <SimulatorModal
          open={true}
          onClose={closeSimulation}
          taskName={simTask.cluster_name}
          jobTitle={role.title}
          company={role.company || undefined}
          taskState={simTask.ai_state || undefined}
          taskTrend={simTask.ai_trend || undefined}
          taskImpactLevel={simTask.impact_level || undefined}
          inline
          onBackToFeed={closeSimulation}
          onNextTask={pickNextTask}
          onCompleted={fetchCompletions}
        />
      </div>
    </div>
  );

  // Enlarged overlay (full-screen portal)
  const completedCount = tasks.filter(t => completedTasks.has(t.cluster_name)).length;
  const enlargedOverlay = (
    <div className="fixed inset-0 z-[100] bg-background overflow-y-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to chat
        </button>
        <span className="text-sm font-semibold text-foreground truncate max-w-[200px]">{role.title}</span>
        <button onClick={toggleBookmark} className="p-2 rounded-lg hover:bg-muted/30 transition-colors">
          {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Compact hero row */}
        <div className="flex items-center gap-4 mb-6">
          <ReadinessRing readiness={readiness} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-display font-bold text-foreground leading-snug">{role.title}</h1>
            {role.company && <p className="text-sm text-muted-foreground">at {role.company}</p>}
          </div>
          <div className="flex gap-4 shrink-0">
            <StatItem value={`${role.risk || 0}%`} label="Risk" />
            <StatItem value={`${role.augmented}%`} label="Augmented" />
            <StatItem value={`${tasks.length}`} label="Tasks" />
          </div>
        </div>

        {/* Progress */}
        {completedCount > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{completedCount}/{tasks.length} practiced</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(completedCount / tasks.length) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Task cards */}
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Tasks & AI Impact</h3>
        <div className="space-y-3">
          {tasks.map((t, i) => {
            const score = t.ai_exposure_score ?? 0;
            const style = taskChipStyle(score);
            const done = completedTasks.has(t.cluster_name);
            const TaskIcon = getTaskIcon(t.cluster_name);
            const taskHue = hashToHue(t.cluster_name);
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
                        <h4 className="text-sm font-semibold text-foreground leading-snug">{t.cluster_name}</h4>
                        {done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                      </div>
                      {t.description && <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{t.description}</p>}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${style.badge}`}>{score}%</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {t.ai_state && <span className="px-2 py-0.5 rounded-full bg-muted/40">{t.ai_state}</span>}
                      {t.impact_level && <span className="px-2 py-0.5 rounded-full bg-muted/40">{t.impact_level}</span>}
                    </div>
                    <Button size="sm" variant={done ? "secondary" : "default"} className="h-7 text-xs rounded-full gap-1"
                      onClick={() => startSimulation(t)}>
                      <Play className="h-3 w-3" />{done ? "Retry" : "Practice"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Enlarged overlay (full-screen)
  if (view === "enlarged" || view === "simulation") {
    return <>{view === "enlarged" && enlargedOverlay}{simulationOverlay}</>;
  }

  // Breakdown view (inline in panel)
  if (view === "breakdown") {
    const completedCount = tasks.filter(t => completedTasks.has(t.cluster_name)).length;
    return (
      <>{simulationOverlay}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col bg-card overflow-hidden">
          {/* Header bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
            <button onClick={() => setView("details")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-3.5 w-3.5" /> Overview
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => setView("enlarged")} className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors" title="Enlarge">
                <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Readiness hero (compact) */}
          <div className="flex items-center gap-4 px-4 py-3 border-b border-border/50 shrink-0">
            <ReadinessRing readiness={readiness} size={56} />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-foreground truncate">{role.title}</h3>
              {role.company && <p className="text-xs text-muted-foreground truncate">{role.company}</p>}
              <div className="flex gap-3 mt-1">
                <span className="text-[10px] text-muted-foreground"><strong className="text-foreground">{role.risk || 0}%</strong> Risk</span>
                <span className="text-[10px] text-muted-foreground"><strong className="text-foreground">{role.augmented}%</strong> Augmented</span>
                <span className="text-[10px] text-muted-foreground"><strong className="text-foreground">{tasks.length}</strong> Tasks</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          {completedCount > 0 && (
            <div className="px-4 py-2 border-b border-border/50 shrink-0">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{completedCount}/{tasks.length} done</span>
              </div>
              <div className="h-1 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(completedCount / tasks.length) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Task list */}
          <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
            <div className="space-y-2">
              {tasks.map((t, i) => {
                const score = t.ai_exposure_score ?? 0;
                const style = taskChipStyle(score);
                const done = completedTasks.has(t.cluster_name);
                return (
                  <div key={i} className="group rounded-lg border border-border/50 bg-muted/20 p-2.5 hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> : (() => { const TaskIcon = getTaskIcon(t.cluster_name); return <TaskIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />; })()}
                        <span className="text-sm font-medium text-foreground leading-snug">{t.cluster_name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>{score}%</span>
                        <button
                          onClick={() => startSimulation(t)}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-2 py-0.5 transition-all"
                        >
                          <Play className="h-2.5 w-2.5" />
                          {done ? "Retry" : "Practice"}
                        </button>
                      </div>
                    </div>
                    {t.description && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{t.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border shrink-0 flex gap-2">
            <button onClick={toggleBookmark} className="h-9 px-3 rounded-xl border border-border flex items-center gap-1.5 text-xs hover:bg-muted/30 transition-colors">
              {isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" /> : <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />}
              {isBookmarked ? "Saved" : "Save"}
            </button>
            <button
              onClick={() => setView("enlarged")}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Maximize2 className="h-3.5 w-3.5" /> Enlarge View
            </button>
          </div>
        </motion.div>
        {simulationOverlay}
      </>
    );
  }

  // Details view (initial overview)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="h-full flex flex-col bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3 shrink-0" style={{ background: `linear-gradient(135deg, hsl(${hue1} 50% 10%) 0%, hsl(${hue2} 40% 8%) 100%)` }}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {logoUrl && (
              <img src={logoUrl} alt="" className="h-10 w-10 rounded-lg object-contain bg-muted/20 p-0.5 shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
            <div className="min-w-0">
              <h2 className="text-base font-bold text-foreground leading-snug line-clamp-2">{role.title}</h2>
              {role.company && <p className="text-sm text-muted-foreground truncate">{role.company}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors shrink-0">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {role.location && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{role.location}</span>}
          {role.workMode && <span className="capitalize">{role.workMode}</span>}
          {role.seniority && <span className="capitalize">{role.seniority}</span>}
          {sourceUrl && (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-primary hover:underline">
              <ExternalLink className="h-3 w-3" />Original posting
            </a>
          )}
        </div>
        {role.augmented > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${role.augmented}%` }} />
            </div>
            <span className="text-xs font-semibold text-primary">{role.augmented}%</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">AI Augmented</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {summary && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">About this role</h3>
                <div className="text-sm text-foreground/80 leading-relaxed prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
              </div>
            )}
            {tasks.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key tasks & AI impact</h3>
                <div className="space-y-2">
                  {tasks.slice(0, 8).map((t, i) => (
                    <div key={i} className="group rounded-lg border border-border/50 bg-muted/20 p-2.5 hover:border-primary/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {(() => { const TaskIcon = getTaskIcon(t.cluster_name); return <TaskIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />; })()}
                          <span className="text-sm font-medium text-foreground leading-snug">{t.cluster_name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {t.ai_exposure_score != null && <span className="text-xs font-semibold text-primary">{t.ai_exposure_score}%</span>}
                          {user && (
                            <button onClick={() => startSimulation(t)}
                              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-2 py-0.5 transition-all">
                              <Play className="h-2.5 w-2.5" />Practice
                            </button>
                          )}
                        </div>
                      </div>
                      {t.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{t.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!summary && tasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Detailed analysis coming soon.</p>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border shrink-0">
        <button
          onClick={() => setView("enlarged")}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <GraduationCap className="h-4 w-4" /> Start Learning
        </button>
      </div>
    </motion.div>
  );
}

// Small reusable components
function ReadinessRing({ readiness, size }: { readiness: number; size: number }) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="4" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - readiness / 100) }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold text-foreground tabular-nums" style={{ fontSize: size * 0.22 }}>{readiness}%</span>
        <span className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: Math.max(7, size * 0.08) }}>Ready</span>
      </div>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-foreground tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}
