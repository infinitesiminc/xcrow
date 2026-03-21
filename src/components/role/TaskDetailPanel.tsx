import { motion, AnimatePresence } from "framer-motion";
import {
  Play, AlertTriangle, Sparkles, Clock, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskAnalysis } from "@/types/analysis";
import { exposureStyle } from "@/lib/exposure-colors";
import type { FuturePrediction } from "@/components/analysis/FutureTaskPreview";

interface TaskDetailPanelProps {
  task: TaskAnalysis;
  prediction?: FuturePrediction;
  timeHorizon: number;
  isCompleted: boolean;
  onPractice: (task: TaskAnalysis) => void;
  onClose: () => void;
}

export function TaskDetailPanel({
  task, prediction, timeHorizon, isCompleted, onPractice, onClose,
}: TaskDetailPanelProps) {
  const currentScore = task.aiExposureScore ?? 50;
  const futureScore = prediction?.future_exposure ?? currentScore;
  const displayScore = timeHorizon > 0 ? futureScore : currentScore;
  const style = exposureStyle(displayScore);
  const delta = futureScore - currentScore;
  const isCollapsing = futureScore >= 80;

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground">{task.name}</h3>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{task.description}</p>
          )}
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-muted/50 shrink-0">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Score */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${style.badge}`}>
          {displayScore}% AI Exposure
        </span>
        {timeHorizon > 0 && delta !== 0 && (
          <span className={`text-xs font-medium ${delta > 0 ? "text-destructive" : "text-success"}`}>
            {delta > 0 ? "↑" : "↓"} {Math.abs(delta)} from today
          </span>
        )}
      </div>

      {/* Future section */}
      <AnimatePresence>
        {timeHorizon > 0 && prediction && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 mb-4 pb-4 border-b border-border/30">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge className="bg-muted text-muted-foreground border-border/30 text-[9px] gap-1">
                  <Clock className="h-2.5 w-2.5" /> {prediction.timeline}
                </Badge>
                {prediction.disrupting_tech.slice(0, 4).map(tech => (
                  <Badge key={tech} className="bg-accent text-foreground border-border/30 text-[9px]">
                    ⚡ {tech}
                  </Badge>
                ))}
              </div>

              <div className="flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <span className="text-destructive font-medium">Impact: </span>{prediction.collapse_summary}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <span className="text-primary font-medium">New Role: </span>{prediction.new_human_role}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skills as sim-launchable cards */}
      {prediction?.future_skills && prediction.future_skills.length > 0 && (
        <div className="mb-4">
          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {timeHorizon > 0 ? "Future Skills Needed" : "Related Skills"}
          </h4>
          <div className="space-y-1.5">
            {prediction.future_skills.map(skill => (
              <button
                key={skill.id}
                onClick={() => onPractice(task)}
                className="w-full flex items-center gap-2.5 rounded-lg border border-dashed border-primary/30 bg-primary/[0.03] px-3 py-2 text-left hover:bg-primary/[0.06] hover:border-primary/50 transition-colors group"
              >
                <span className="text-base">{skill.icon_emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-foreground/80 group-hover:text-foreground">{skill.name}</div>
                  <div className="text-[9px] text-muted-foreground truncate">{skill.description}</div>
                </div>
                <Play className="h-3 w-3 text-primary/40 group-hover:text-primary shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Practice CTA */}
      <div className="mt-auto pt-3 border-t border-border/30">
        <Button
          size="sm"
          variant={isCompleted ? "secondary" : "default"}
          className="w-full h-8 text-xs rounded-full gap-1.5"
          onClick={() => onPractice(task)}
        >
          <Play className="h-3 w-3" />
          {isCollapsing && timeHorizon > 0 ? "Run Future Simulation" : isCompleted ? "Retry Simulation" : "Practice This Task"}
        </Button>
      </div>
    </motion.div>
  );
}
