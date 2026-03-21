import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { TaskAnalysis } from "@/types/analysis";
import { exposureStyle } from "@/lib/exposure-colors";
import type { FuturePrediction } from "@/components/analysis/FutureTaskPreview";

interface TaskCardProps {
  task: TaskAnalysis;
  prediction?: FuturePrediction;
  isCompleted: boolean;
  isSelected: boolean;
  onSelect: (task: TaskAnalysis) => void;
  index: number;
}

export function TaskCard({
  task, prediction, isCompleted, isSelected, onSelect, index,
}: TaskCardProps) {
  const currentScore = task.aiExposureScore ?? 50;
  const futureScore = prediction?.future_exposure ?? currentScore;
  const currentStyle = exposureStyle(currentScore);
  const futureStyle = exposureStyle(futureScore);

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
        <div className="flex items-center gap-1 shrink-0">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${currentStyle.badge}`}>
            {currentScore}%
          </span>
          {prediction && futureScore !== currentScore && (
            <>
              <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${futureStyle.badge}`}>
                {futureScore}%
              </span>
            </>
          )}
        </div>
      </div>
    </motion.button>
  );
}
