import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Play, CheckCircle2, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskAnalysis } from "@/types/analysis";
import { exposureStyle } from "@/lib/exposure-colors";
import { FutureTaskPreview } from "@/components/analysis/FutureTaskPreview";
import type { FuturePrediction } from "@/components/analysis/FutureTaskPreview";

interface TaskXRayTabProps {
  tasks: TaskAnalysis[];
  completedTasks: Set<string>;
  onPractice: (task: TaskAnalysis) => void;
  jobTitle: string;
  company?: string;
  timeHorizon: number;
  predictions: Record<string, FuturePrediction>;
}

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

export function TaskXRayTab({
  tasks, completedTasks, onPractice, jobTitle, company, timeHorizon, predictions,
}: TaskXRayTabProps) {
  const t = timeHorizon / 2;

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => (b.aiExposureScore ?? 50) - (a.aiExposureScore ?? 50));
  }, [tasks]);

  return (
    <div className="space-y-3">
      {sortedTasks.map((task, i) => {
        const currentScore = task.aiExposureScore ?? 50;
        const pred = predictions[task.name];
        const futureScore = pred?.future_exposure ?? currentScore;
        const displayScore = lerp(currentScore, futureScore, t);
        const style = exposureStyle(displayScore);
        const done = completedTasks.has(task.name);
        const delta = futureScore - currentScore;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-xl border border-border/50 bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-foreground">{task.name}</h4>
                  {done && <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />}
                </div>
                {task.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${style.badge}`}>
                  {displayScore}%
                </span>
                {timeHorizon > 0 && delta !== 0 && (
                  <span className={`text-[10px] font-medium ${delta > 0 ? "text-destructive" : "text-success"}`}>
                    {delta > 0 ? "+" : ""}{delta}
                  </span>
                )}
              </div>
            </div>

            {/* Future info inline when slider is in future mode */}
            {timeHorizon > 0 && pred && (
              <div className="mt-2 pt-2 border-t border-border/30 space-y-1">
                <div className="flex items-center gap-2 text-[10px]">
                  <Badge className="bg-muted text-muted-foreground border-border/30 text-[9px] gap-1">
                    <Clock className="h-2.5 w-2.5" /> {pred.timeline}
                  </Badge>
                  {pred.disrupting_tech.slice(0, 2).map(tech => (
                    <Badge key={tech} className="bg-accent text-foreground border-border/30 text-[9px]">
                      ⚡ {tech}
                    </Badge>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  <span className="text-destructive font-medium">→ </span>{pred.collapse_summary}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  <span className="text-primary font-medium">New role: </span>{pred.new_human_role}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/30">
              {timeHorizon === 0 && (
                <FutureTaskPreview
                  taskName={task.name}
                  jobTitle={jobTitle}
                  company={company}
                  aiExposureScore={currentScore}
                  jobImpactScore={task.jobImpactScore}
                  description={task.description}
                  onStartSim={() => onPractice(task)}
                />
              )}
              <Button
                size="sm"
                variant={done ? "secondary" : "default"}
                className="h-7 text-xs rounded-full gap-1 ml-auto"
                onClick={() => onPractice(task)}
              >
                <Play className="h-3 w-3" />{done ? "Retry" : "Practice"}
              </Button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
