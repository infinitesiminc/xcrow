import { useMemo } from "react";
import { motion } from "framer-motion";
import { Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskAnalysis } from "@/types/analysis";
import type { JobAnalysisResult } from "@/types/analysis";

interface TaskTableProps {
  tasks: TaskAnalysis[];
  skills: JobAnalysisResult["skills"];
  completedTasks: Set<string>;
  onPractice: (taskName: string) => void;
}

function exposureColor(score: number) {
  if (score >= 70) return "bg-destructive/10 text-destructive border-destructive/20";
  if (score >= 40) return "bg-warning/10 text-warning border-warning/20";
  return "bg-success/10 text-success border-success/20";
}

function priorityBadge(p?: string) {
  if (p === "high") return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[9px]">High</Badge>;
  if (p === "medium") return <Badge className="bg-warning/10 text-warning border-warning/20 text-[9px]">Medium</Badge>;
  return <Badge className="bg-success/10 text-success border-success/20 text-[9px]">Low</Badge>;
}

export function TaskTable({ tasks, skills, completedTasks, onPractice }: TaskTableProps) {
  const sortedTasks = useMemo(() => {
    return tasks
      .map((t, i) => ({ task: t, originalIndex: i }))
      .sort((a, b) => (b.task.aiExposureScore ?? 50) - (a.task.aiExposureScore ?? 50));
  }, [tasks]);

  const summary = useMemo(() => {
    const high = tasks.filter(t => (t.aiExposureScore ?? 50) >= 70).length;
    const moderate = tasks.filter(t => (t.aiExposureScore ?? 50) >= 40 && (t.aiExposureScore ?? 50) < 70).length;
    const low = tasks.filter(t => (t.aiExposureScore ?? 50) < 40).length;
    return { high, moderate, low };
  }, [tasks]);

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-destructive" />
          <span className="font-semibold text-foreground">{summary.high}</span> high exposure
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-warning" />
          <span className="font-semibold text-foreground">{summary.moderate}</span> moderate
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="font-semibold text-foreground">{summary.low}</span> low exposure
        </span>
      </div>

      {/* Scrollable grid of mini cards */}
      <div className="max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sortedTasks.map(({ task, originalIndex }, i) => {
            const score = task.aiExposureScore ?? 50;
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
                  <Badge className={`text-[10px] shrink-0 ${exposureColor(score)}`}>
                    {score}%
                  </Badge>
                  <span className="text-sm font-medium text-foreground leading-tight line-clamp-2 flex-1">
                    {task.name}
                  </span>
                </div>

                {/* Priority badge */}
                <div className="flex items-center gap-2">
                  {priorityBadge(task.priority)}
                </div>

                {/* Upskill button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground hover:bg-accent/30 w-fit mt-auto px-2"
                  onClick={() => onPractice(task.name)}
                >
                  {isCompleted
                    ? <><CheckCircle2 className="h-3 w-3 text-success" /> Upskilled</>
                    : <><Play className="h-3 w-3" /> Upskill</>
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
