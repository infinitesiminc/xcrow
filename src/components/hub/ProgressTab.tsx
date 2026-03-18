import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Eye, Zap, Compass, ArrowRight, Sparkles, ChevronDown,
  TrendingUp, Target, BarChart3, Activity,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  buildInterestGraph,
  type CompletionSignal,
  type AnalysisSignal,
  type BookmarkSignal,
  type InterestGraph,
  type RoleNode,
} from "@/lib/interest-graph";

/* ── Styles ── */
const TAG_STYLES: Record<string, string> = {
  adjacent: "border-primary/30 text-primary",
  deepen: "border-warning/40 text-warning",
  stretch: "border-accent/40 text-accent-foreground",
};
const TAG_LABELS: Record<string, string> = {
  adjacent: "Adjacent role",
  deepen: "Deepen skills",
  stretch: "Stretch goal",
};
const TIER_STYLES: Record<string, { bg: string; ring: string; text: string; label: string }> = {
  core: { bg: "bg-success/15", ring: "ring-success/30", text: "text-success", label: "Core" },
  exploring: { bg: "bg-primary/10", ring: "ring-primary/20", text: "text-primary", label: "Exploring" },
  peripheral: { bg: "bg-muted/30", ring: "ring-border/30", text: "text-muted-foreground", label: "Peripheral" },
};

export default function ProgressTab({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const [graph, setGraph] = useState<InterestGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [showAllNodes, setShowAllNodes] = useState(false);
  const [tierFilter, setTierFilter] = useState<"all" | "core" | "exploring" | "peripheral">("all");

  useEffect(() => {
    (async () => {
      const [simRes, analysisRes, bookmarkRes] = await Promise.all([
        supabase.from("completed_simulations")
          .select("task_name, job_title, company, correct_answers, total_questions, completed_at")
          .eq("user_id", userId).order("completed_at", { ascending: false }),
        supabase.from("analysis_history")
          .select("job_title, company, analyzed_at")
          .eq("user_id", userId).order("analyzed_at", { ascending: false }),
        supabase.from("bookmarked_roles")
          .select("job_title, company, augmented_percent, automation_risk_percent, bookmarked_at")
          .eq("user_id", userId).order("bookmarked_at", { ascending: false }),
      ]);

      const completions = (simRes.data as CompletionSignal[]) || [];
      const analyses = (analysisRes.data as AnalysisSignal[]) || [];
      const bookmarks = (bookmarkRes.data as BookmarkSignal[]) || [];

      const result = buildInterestGraph(completions, analyses, bookmarks);
      setGraph(result);
      setLoading(false);
    })();
  }, [userId]);

  const filteredNodes = useMemo(() => {
    if (!graph) return [];
    const nodes = tierFilter === "all" ? graph.nodes : graph.nodes.filter(n => n.tier === tierFilter);
    return showAllNodes ? nodes : nodes.slice(0, 15);
  }, [graph, tierFilter, showAllNodes]);

  const totalFilteredCount = useMemo(() => {
    if (!graph) return 0;
    return tierFilter === "all" ? graph.nodes.length : graph.nodes.filter(n => n.tier === tierFilter).length;
  }, [graph, tierFilter]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 text-primary animate-spin" /></div>;
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Compass className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">Explore roles and practice tasks to build your interest graph.</p>
          <Button size="sm" onClick={() => navigate("/")}>Explore Roles</Button>
        </CardContent>
      </Card>
    );
  }

  const goToRole = (jobTitle: string, company: string | null) => {
    const params = new URLSearchParams({ title: jobTitle });
    if (company) params.set("company", company);
    navigate(`/analysis?${params.toString()}`);
  };

  const scoreColor = (s: number) => s >= 75 ? "text-success" : s >= 50 ? "text-warning" : "text-destructive";
  const barColor = (s: number) => s >= 75 ? "bg-success" : s >= 50 ? "bg-warning" : "bg-destructive";

  const { stats, clusters, recommendations } = graph;
  const tierCounts = {
    core: graph.nodes.filter(n => n.tier === "core").length,
    exploring: graph.nodes.filter(n => n.tier === "exploring").length,
    peripheral: graph.nodes.filter(n => n.tier === "peripheral").length,
  };

  return (
    <div className="space-y-6">

      {/* ── Engagement Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Roles Explored", value: stats.rolesExplored, icon: Eye, color: "text-primary" },
          { label: "Roles Practiced", value: stats.rolesPracticed, icon: Target, color: "text-success" },
          { label: "Total Sessions", value: stats.totalSessions, icon: Activity, color: "text-warning" },
          { label: "Engagement", value: stats.totalEngagement, icon: TrendingUp, color: "text-accent-foreground" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <s.icon className={`h-4 w-4 shrink-0 ${s.color}`} />
                <div>
                  <p className="text-lg font-bold text-foreground leading-none">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Interest Graph: node pills with tier filtering ── */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Interest Graph</h2>
          <Badge variant="secondary" className="text-[10px]">{stats.rolesExplored} roles</Badge>
        </div>

        {stats.strongestCluster && (
          <p className="text-[11px] text-muted-foreground mb-2">
            Strongest cluster: <span className="text-foreground font-medium">{stats.strongestCluster}</span>
          </p>
        )}

        {/* Tier filter chips */}
        <div className="flex items-center gap-1.5 mb-3">
          {(["all", "core", "exploring", "peripheral"] as const).map(tier => {
            const count = tier === "all" ? graph.nodes.length : tierCounts[tier];
            const isActive = tierFilter === tier;
            return (
              <button
                key={tier}
                onClick={() => { setTierFilter(tier); setShowAllNodes(false); }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-all border ${
                  isActive
                    ? "bg-primary/10 border-primary/30 text-primary font-medium"
                    : "bg-muted/20 border-border/40 text-muted-foreground hover:border-primary/20"
                }`}
              >
                {tier === "all" ? "All" : TIER_STYLES[tier].label}
                <span className="text-[9px] opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Node pills — sized by engagement score */}
        <div className="flex flex-wrap gap-1.5">
          {filteredNodes.map((node, i) => {
            const tier = TIER_STYLES[node.tier];
            const maxScore = graph.nodes[0]?.score || 1;
            const relativeSize = 0.85 + (node.score / maxScore) * 0.25; // 0.85x–1.1x
            return (
              <motion.button
                key={node.role}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.012 }}
                onClick={() => goToRole(node.role, node.company)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all 
                  hover:shadow-md cursor-pointer border ring-1 ${tier.bg} ${tier.ring} ${tier.text}`}
                style={{ fontSize: `${relativeSize * 0.75}rem` }}
              >
                <span className="truncate max-w-[160px]">{node.role}</span>
                {node.signals.practices > 0 && (
                  <span className="text-[9px] font-semibold opacity-80">{node.signals.practices}</span>
                )}
                {node.signals.bookmarks > 0 && (
                  <span className="text-[9px] opacity-60">★</span>
                )}
              </motion.button>
            );
          })}
        </div>

        {totalFilteredCount > 15 && !showAllNodes && (
          <button
            onClick={() => setShowAllNodes(true)}
            className="text-[11px] text-primary hover:underline mt-2 flex items-center gap-1"
          >
            +{totalFilteredCount - 15} more roles
            <ChevronDown className="h-3 w-3" />
          </button>
        )}
        {showAllNodes && totalFilteredCount > 15 && (
          <button
            onClick={() => setShowAllNodes(false)}
            className="text-[11px] text-primary hover:underline mt-2 flex items-center gap-1"
          >
            Show less
            <ChevronDown className="h-3 w-3 rotate-180" />
          </button>
        )}
      </section>

      {/* ── Skill Depth: practiced roles with expandable tasks ── */}
      {graph.nodes.some(n => n.tasks.length > 0) && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-warning" />
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Skill Depth</h2>
            {(() => {
              const practiced = graph.nodes.filter(n => n.tasks.length > 0);
              const totalTasks = practiced.reduce((s, n) => s + n.taskCount, 0);
              const avgProf = practiced.length > 0
                ? Math.round(practiced.reduce((s, n) => s + n.avgProficiency, 0) / practiced.length)
                : 0;
              return (
                <>
                  <Badge variant="secondary" className="text-[10px]">{totalTasks} tasks · {practiced.length} roles</Badge>
                  <Badge variant="outline" className={`text-[10px] ${scoreColor(avgProf)}`}>Avg {avgProf}%</Badge>
                </>
              );
            })()}
          </div>

          <div className="space-y-1.5">
            {graph.nodes
              .filter(n => n.tasks.length > 0)
              .map((node, gi) => {
                const isExpanded = expandedRole === node.role;
                const tier = TIER_STYLES[node.tier];
                return (
                  <motion.div
                    key={node.role}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gi * 0.02 }}
                  >
                    <Card className={`transition-colors ${isExpanded ? "border-primary/20" : ""}`}>
                      <button
                        onClick={() => setExpandedRole(isExpanded ? null : node.role)}
                        className="w-full text-left"
                      >
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground truncate">{node.role}</p>
                              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${tier.text} border-current/20`}>
                                {tier.label}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {node.taskCount} task{node.taskCount !== 1 ? "s" : ""} · {node.signals.practices}×
                              </span>
                            </div>
                            {node.company && <p className="text-[10px] text-muted-foreground">{node.company}</p>}
                          </div>

                          <div className="flex items-center gap-2 w-28 shrink-0">
                            <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${barColor(node.avgProficiency)}`}
                                style={{ width: `${node.avgProficiency}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold w-8 text-right ${scoreColor(node.avgProficiency)}`}>
                              {node.avgProficiency}%
                            </span>
                          </div>

                          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                        </CardContent>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 pt-0 space-y-1 border-t border-border/30">
                              {/* Signal breakdown */}
                              <div className="flex items-center gap-3 py-1.5 text-[10px] text-muted-foreground">
                                <span>👁 {node.signals.views} views</span>
                                <span>⚡ {node.signals.practices} practices</span>
                                {node.signals.rePractices > 0 && <span>🔄 {node.signals.rePractices} re-practices</span>}
                                {node.signals.bookmarks > 0 && <span>★ bookmarked</span>}
                                <span className="ml-auto font-medium">Score: {Math.round(node.score)}</span>
                              </div>

                              {node.tasks.map((task, ti) => (
                                <div key={ti} className="flex items-center gap-3 py-1.5">
                                  <p className="text-[12px] text-foreground flex-1 truncate pl-2">{task.name}</p>
                                  <div className="flex items-center gap-2 w-24 shrink-0">
                                    <Progress value={task.bestScore} className="h-1 flex-1" />
                                    <span className={`text-[11px] font-semibold w-7 text-right ${scoreColor(task.bestScore)}`}>
                                      {Math.round(task.bestScore)}%
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-muted-foreground w-6 text-right">{task.sessions}×</span>
                                </div>
                              ))}
                              <button
                                onClick={() => goToRole(node.role, node.company)}
                                className="text-[11px] text-primary hover:underline flex items-center gap-1 pt-1 pl-2"
                              >
                                View full analysis <ArrowRight className="h-3 w-3" />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
          </div>
        </section>
      )}

      {/* ── Recommendations (graph-powered) ── */}
      {recommendations.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Recommended for You</h2>
            <Badge variant="secondary" className="text-[10px]">{recommendations.length} matches</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">Powered by your interest graph — weighted by practice depth, bookmarks, and role clusters.</p>

          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                <Card
                  className="cursor-pointer hover:border-primary/30 transition-all group hover:shadow-md"
                  onClick={() => goToRole(rec.jobTitle, rec.company)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground truncate">{rec.jobTitle}</p>
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 shrink-0 ${TAG_STYLES[rec.tag] || ""}`}>
                            {TAG_LABELS[rec.tag] || rec.tag}
                          </Badge>
                        </div>
                        {rec.company && <p className="text-[11px] text-muted-foreground mb-1">{rec.company}</p>}
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{rec.reason}</p>
                      </div>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="relative w-11 h-11">
                          <svg viewBox="0 0 36 36" className="w-11 h-11 -rotate-90">
                            <circle cx="18" cy="18" r="15" fill="none" className="stroke-muted/20" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15" fill="none"
                              className={rec.matchScore >= 80 ? "stroke-success" : rec.matchScore >= 65 ? "stroke-primary" : "stroke-warning"}
                              strokeWidth="3"
                              strokeDasharray={`${(rec.matchScore / 100) * 94.2} 94.2`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-foreground">{rec.matchScore}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground">match</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
