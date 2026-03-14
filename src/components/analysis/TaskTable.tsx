import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Play, CheckCircle2, Bot, Users, User, TrendingUp, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskAnalysis, TaskState, TrendDirection, AIImpactLevel } from "@/types/analysis";
import type { JobAnalysisResult } from "@/types/analysis";

interface TaskTableProps {
  tasks: TaskAnalysis[];
  skills: JobAnalysisResult["skills"];
  completedTasks: Set<string>;
  onPractice: (taskName: string) => void;
}

// Colored dots for state — text stays grayscale
const stateLabels: Record<TaskState, { label: string; dot: string }> = {
  mostly_human: { label: "Human-led", dot: "bg-dot-teal" },
  human_ai: { label: "Human + AI", dot: "bg-dot-blue" },
  mostly_ai: { label: "AI-driven", dot: "bg-dot-purple" },
};

const trendConfig: Record<TrendDirection, { icon: typeof Minus; dot: string; label: string }> = {
  stable: { icon: Minus, dot: "bg-muted-foreground/40", label: "Stable" },
  increasing_ai: { icon: TrendingUp, dot: "bg-dot-amber", label: "Growing AI" },
  fully_ai_soon: { icon: Bot, dot: "bg-dot-purple", label: "Full AI soon" },
};

function getDisruptionScore(task: TaskAnalysis): number {
  let score = 0;
  if (task.currentState === "mostly_ai") score += 3;
  else if (task.currentState === "human_ai") score += 2;
  else score += 1;
  if (task.trend === "fully_ai_soon") score += 3;
  else if (task.trend === "increasing_ai") score += 2;
  else score += 1;
  if (task.impactLevel === "high") score += 2;
  else if (task.impactLevel === "medium") score += 1;
  return score;
}

function getHeatBarOpacity(score: number): number {
  return 0.12 + (score / 8) * 0.45;
}

export function TaskTable({ tasks, skills, completedTasks, onPractice }: TaskTableProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const sortedTasks = useMemo(() => {
    return tasks
      .map((t, i) => ({ task: t, originalIndex: i, score: getDisruptionScore(t) }))
      .sort((a, b) => b.score - a.score);
  }, [tasks]);

  const summary = useMemo(() => {
    const fullyAi = tasks.filter(t => t.trend === "fully_ai_soon").length;
    const aiDriven = tasks.filter(t => t.currentState === "mostly_ai").length;
    const human = tasks.filter(t => t.currentState === "mostly_human").length;
    return { fullyAi, aiDriven, human };
  }, [tasks]);

  const getRelatedSkills = (taskName: string) =>
    skills.filter(s => s.relatedTasks?.some(rt => rt.toLowerCase() === taskName.toLowerCase()));

  return (
    <div>
      {/* Summary bar — colored dots, grayscale text */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-dot-purple" />
          <span className="font-semibold text-foreground">{summary.fullyAi}</span> trending to full AI
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-dot-blue" />
          <span className="font-semibold text-foreground">{summary.aiDriven}</span> AI-driven
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-dot-teal" />
          <span className="font-semibold text-foreground">{summary.human}</span> human-led
        </span>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {sortedTasks.map(({ task, originalIndex, score }, i) => {
          const state = stateLabels[task.currentState];
          const trend = trendConfig[task.trend];
          const TrendIcon = trend.icon;
          const isExpanded = expandedIndex === i;
          const relatedSkills = getRelatedSkills(task.name);
          const isCompleted = completedTasks.has(task.name);

          return (
            <motion.div
              key={originalIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : i)}
                className="w-full flex items-center gap-3 p-3 sm:p-4 text-left hover:bg-accent/30 transition-colors"
              >
                {/* Score — plain text */}
                <span className="text-xs font-bold text-muted-foreground tabular-nums shrink-0 w-8 text-center">
                  {score}/8
                </span>

                {/* Heat bar — monochrome */}
                <div className="w-12 h-2 rounded-full bg-secondary shrink-0 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground transition-all"
                    style={{ width: `${(score / 8) * 100}%`, opacity: getHeatBarOpacity(score) }}
                  />
                </div>

                {/* Task name */}
                <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">{task.name}</span>

                {/* Badges — colored dot + grayscale text */}
                <div className="hidden sm:flex items-center gap-3 shrink-0">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className={`w-2 h-2 rounded-full ${state.dot}`} />
                    {state.label}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className={`w-1.5 h-1.5 rounded-full ${trend.dot}`} />
                    <TrendIcon className="h-3 w-3" />
                    {trend.label}
                  </span>
                </div>

                <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
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
                    <div className="px-4 pb-4 pt-1 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{task.description}</p>

                      {/* Mobile badges */}
                      <div className="flex sm:hidden items-center gap-3 mb-3 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className={`w-2 h-2 rounded-full ${state.dot}`} />
                          {state.label}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className={`w-1.5 h-1.5 rounded-full ${trend.dot}`} />
                          <TrendIcon className="h-3 w-3" />
                          {trend.label}
                        </span>
                      </div>

                      {relatedSkills.length > 0 && (
                        <div className="mb-3">
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Related Skills</span>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {relatedSkills.map((s, si) => (
                              <Badge key={si} variant="secondary" className="text-[10px]">{s.name}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/30"
                        onClick={(e) => { e.stopPropagation(); onPractice(task.name); }}
                      >
                        {isCompleted ? <><CheckCircle2 className="h-3 w-3 text-dot-teal" /> Practiced</> : <><Play className="h-3 w-3" /> Practice this task</>}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
