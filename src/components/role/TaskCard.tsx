import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { TaskAnalysis } from "@/types/analysis";
import { exposureStyle } from "@/lib/exposure-colors";
import type { FuturePrediction } from "@/components/analysis/FutureTaskPreview";

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

interface TaskCardProps {
  task: TaskAnalysis;
  prediction?: FuturePrediction;
  timeHorizon: number;
  isCompleted: boolean;
  isSelected: boolean;
  onSelect: (task: TaskAnalysis) => void;
  index: number;
}

export function TaskCard({
  task, prediction, timeHorizon, isCompleted, isSelected, onSelect, index,
}: TaskCardProps) {
  const t = timeHorizon;
  const currentScore = task.aiExposureScore ?? 50;
  const futureScore = prediction?.future_exposure ?? currentScore;
  const displayScore = lerp(currentScore, futureScore, t);
  const style = exposureStyle(displayScore);
  const delta = futureScore - currentScore;

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={() => onSelect(task)}
      className={`w-full text-left rounded-lg border p-3 transition-colors ${
        isSelected
          ? "border-primary bg-primary/[0.04]"
          : "border-border/50 bg-card hover:border-border hover:bg-muted/30"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 flex items-center gap-2">
          {isCompleted && <CheckCircle2 className="h-3 w-3 text-success shrink-0" />}
          <span className="text-xs font-medium text-foreground truncate">{task.name}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {timeHorizon > 0 && delta !== 0 && (
            <span className={`text-[9px] font-medium ${delta > 0 ? "text-destructive" : "text-success"}`}>
              {delta > 0 ? "+" : ""}{delta}
            </span>
          )}
          <motion.span
            key={displayScore}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.badge}`}
          >
            {displayScore}%
          </motion.span>
        </div>
      </div>
    </motion.button>
  );
}
