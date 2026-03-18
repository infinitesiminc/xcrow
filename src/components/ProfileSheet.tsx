import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Eye, Zap, Sparkles, ChevronDown, ArrowRight,
  TrendingUp, Target, Activity, Settings, LogOut,
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
} from "@/lib/interest-graph";

interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  displayName: string | null;
  email: string;
  onSignOut: () => void;
}

const TIER_STYLES: Record<string, { bg: string; ring: string; text: string; label: string }> = {
  core: { bg: "bg-success/15", ring: "ring-success/30", text: "text-success", label: "Core" },
  exploring: { bg: "bg-primary/10", ring: "ring-primary/20", text: "text-primary", label: "Exploring" },
  peripheral: { bg: "bg-muted/30", ring: "ring-border/30", text: "text-muted-foreground", label: "Peripheral" },
};

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

export default function ProfileSheet({ open, onClose, userId, displayName, email, onSignOut }: ProfileSheetProps) {
  const navigate = useNavigate();
  const [graph, setGraph] = useState<InterestGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [showAllNodes, setShowAllNodes] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
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

      const result = buildInterestGraph(
        (simRes.data as CompletionSignal[]) || [],
        (analysisRes.data as AnalysisSignal[]) || [],
        (bookmarkRes.data as BookmarkSignal[]) || [],
      );
      setGraph(result);
      setLoading(false);
    })();
  }, [open, userId]);

  const displayedNodes = useMemo(() => {
    if (!graph) return [];
    return showAllNodes ? graph.nodes : graph.nodes.slice(0, 10);
  }, [graph, showAllNodes]);

  const practicedNodes = useMemo(() => {
    if (!graph) return [];
    return graph.nodes.filter(n => n.tasks.length > 0);
  }, [graph]);

  const goToRole = (jobTitle: string, company: string | null) => {
    const params = new URLSearchParams({ title: jobTitle });
    if (company) params.set("company", company);
    navigate(`/analysis?${params.toString()}`);
    onClose();
  };

  const scoreColor = (s: number) => s >= 75 ? "text-success" : s >= 50 ? "text-warning" : "text-destructive";
  const barColor = (s: number) => s >= 75 ? "bg-success" : s >= 50 ? "bg-warning" : "bg-destructive";

  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : email.slice(0, 2).toUpperCase();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center gap-3 p-4 border-b border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{displayName || email}</p>
                <p className="text-[11px] text-muted-foreground truncate">{email}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !graph || graph.nodes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-3">Start exploring roles to build your interest graph.</p>
                  <Button size="sm" onClick={() => { navigate("/"); onClose(); }}>Explore Roles</Button>
                </div>
              ) : (
                <>
                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: graph.stats.rolesExplored, label: "Explored", icon: Eye },
                      { value: graph.stats.rolesPracticed, label: "Practiced", icon: Target },
                      { value: graph.stats.totalSessions, label: "Sessions", icon: Activity },
                      { value: graph.stats.totalEngagement, label: "Score", icon: TrendingUp },
                    ].map((s, i) => (
                      <div key={i} className="text-center">
                        <p className="text-lg font-bold text-foreground">{s.value}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Interest Graph pills */}
                  <section>
                    <h3 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                      Interest Graph
                      {graph.stats.strongestCluster && (
                        <span className="ml-2 normal-case tracking-normal text-foreground font-normal">
                          · strongest: {graph.stats.strongestCluster}
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {displayedNodes.map((node, i) => {
                        const tier = TIER_STYLES[node.tier];
                        return (
                          <button
                            key={node.role}
                            onClick={() => goToRole(node.role, node.company)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-all 
                              border ring-1 ${tier.bg} ${tier.ring} ${tier.text} hover:shadow-sm`}
                          >
                            <span className="truncate max-w-[120px]">{node.role}</span>
                            {node.signals.practices > 0 && (
                              <span className="text-[9px] font-semibold opacity-80">{node.signals.practices}</span>
                            )}
                            {node.signals.bookmarks > 0 && (
                              <span className="text-[9px] opacity-60">★</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {graph.nodes.length > 10 && (
                      <button
                        onClick={() => setShowAllNodes(!showAllNodes)}
                        className="text-[10px] text-primary hover:underline mt-1.5 flex items-center gap-0.5"
                      >
                        {showAllNodes ? "Show less" : `+${graph.nodes.length - 10} more`}
                        <ChevronDown className={`h-2.5 w-2.5 transition-transform ${showAllNodes ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </section>

                  {/* Skill Depth */}
                  {practicedNodes.length > 0 && (
                    <section>
                      <h3 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                        Skill Depth · {practicedNodes.length} roles
                      </h3>
                      <div className="space-y-1">
                        {practicedNodes.map((node) => {
                          const isExpanded = expandedRole === node.role;
                          return (
                            <div key={node.role}>
                              <button
                                onClick={() => setExpandedRole(isExpanded ? null : node.role)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/30 transition-colors"
                              >
                                <p className="text-xs font-medium text-foreground truncate flex-1 text-left">{node.role}</p>
                                <div className="flex items-center gap-1.5 w-20 shrink-0">
                                  <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                                    <div className={`h-full rounded-full ${barColor(node.avgProficiency)}`} style={{ width: `${node.avgProficiency}%` }} />
                                  </div>
                                  <span className={`text-[10px] font-bold w-7 text-right ${scoreColor(node.avgProficiency)}`}>{node.avgProficiency}%</span>
                                </div>
                                <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              </button>
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="pl-4 pb-2 space-y-1">
                                      {node.tasks.map((task, ti) => (
                                        <div key={ti} className="flex items-center gap-2 py-0.5">
                                          <p className="text-[11px] text-muted-foreground flex-1 truncate">{task.name}</p>
                                          <span className={`text-[10px] font-semibold ${scoreColor(task.bestScore)}`}>{Math.round(task.bestScore)}%</span>
                                          <span className="text-[9px] text-muted-foreground">{task.sessions}×</span>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Recommendations */}
                  {graph.recommendations.length > 0 && (
                    <section>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <h3 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                          Recommended · {graph.recommendations.length} matches
                        </h3>
                      </div>
                      <div className="space-y-1.5">
                        {graph.recommendations.slice(0, 4).map((rec, i) => (
                          <button
                            key={i}
                            onClick={() => goToRole(rec.jobTitle, rec.company)}
                            className="w-full text-left flex items-center gap-2 p-2.5 rounded-lg border border-border/40 hover:border-primary/30 hover:bg-muted/20 transition-all"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-medium text-foreground truncate">{rec.jobTitle}</p>
                                <Badge variant="outline" className={`text-[8px] px-1 py-0 shrink-0 ${TAG_STYLES[rec.tag] || ""}`}>
                                  {TAG_LABELS[rec.tag] || rec.tag}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{rec.reason}</p>
                            </div>
                            <span className="text-xs font-bold text-foreground shrink-0">{rec.matchScore}</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>

            {/* Footer actions */}
            <div className="shrink-0 border-t border-border/50 p-3 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start text-xs"
                onClick={() => { navigate("/settings"); onClose(); }}
              >
                <Settings className="mr-1.5 h-3.5 w-3.5" />
                Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-destructive hover:text-destructive"
                onClick={() => { onSignOut(); onClose(); }}
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                Sign out
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
