import { useMemo } from "react";
import { motion } from "framer-motion";
import { Play, CheckCircle2, Bot, TrendingUp, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskAnalysis, TaskState, TrendDirection } from "@/types/analysis";
import type { JobAnalysisResult } from "@/types/analysis";

interface TaskTableProps {
  tasks: TaskAnalysis[];
  skills: JobAnalysisResult["skills"];
  completedTasks: Set<string>;
  onPractice: (taskName: string) => void;
}

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

export function TaskTable({ tasks, skills, completedTasks, onPractice }: TaskTableProps) {
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

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center gap-4 mb-3 flex-wrap">
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

      {/* Scrollable grid of mini cards */}
      <div className="max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sortedTasks.map(({ task, originalIndex, score }, i) => {
            const state = stateLabels[task.currentState];
            const trend = trendConfig[task.trend];
            const TrendIcon = trend.icon;
            const isCompleted = completedTasks.has(task.name);

            return (
              <motion.div
                key={originalIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="rounded-lg border border-border bg-card p-3 flex flex-col gap-2"
              >
                {/* Top row: score + name */}
                <div className="flex items-start gap-2 min-w-0">
                  <span className="text-[10px] font-bold text-muted-foreground tabular-nums shrink-0 mt-0.5 bg-secondary rounded px-1.5 py-0.5">
                    {score}/8
                  </span>
                  <span className="text-sm font-medium text-foreground leading-tight line-clamp-2 flex-1">
                    {task.name}
                  </span>
                </div>

                {/* State + trend badges */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className={`w-1.5 h-1.5 rounded-full ${state.dot}`} />
                    {state.label}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className={`w-1.5 h-1.5 rounded-full ${trend.dot}`} />
                    <TrendIcon className="h-2.5 w-2.5" />
                    {trend.label}
                  </span>
                </div>

                {/* Practice button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground hover:bg-accent/30 w-fit mt-auto px-2"
                  onClick={() => onPractice(task.name)}
                >
                  {isCompleted
                    ? <><CheckCircle2 className="h-3 w-3 text-dot-teal" /> Practiced</>
                    : <><Play className="h-3 w-3" /> Practice</>
                  }
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
