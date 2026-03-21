import { isStandardEmoji } from "@/lib/emoji-utils";
import { motion } from "framer-motion";
import {
  Play, AlertTriangle, Sparkles, Clock, X, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskAnalysis } from "@/types/analysis";
import { exposureStyle } from "@/lib/exposure-colors";
import type { FuturePrediction } from "@/components/analysis/FutureTaskPreview";

interface TaskDetailPanelProps {
  task: TaskAnalysis;
  prediction?: FuturePrediction;
  predictionsLoading: boolean;
  isCompleted: boolean;
  onPractice: (task: TaskAnalysis) => void;
  onClose: () => void;
}

export function TaskDetailPanel({
  task, prediction, predictionsLoading, isCompleted, onPractice, onClose,
}: TaskDetailPanelProps) {
  const currentScore = task.aiExposureScore ?? 50;
  const futureScore = prediction?.future_exposure ?? currentScore;
  const currentStyle = exposureStyle(currentScore);
  const futureStyle = exposureStyle(futureScore);
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
          <h3 className="text-sm font-bold text-foreground">⚔️ {task.name}</h3>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{task.description}</p>
          )}
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-muted/50 shrink-0">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Score: Today → Future */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${currentStyle.badge}`}>
          Now {currentScore}%
        </span>
        {prediction && (
          <>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${futureStyle.badge}`}>
              Future {futureScore}%
            </span>
            {delta !== 0 && (
              <span className={`text-[10px] font-medium ${delta > 0 ? "text-destructive" : "text-success"}`}>
                ({delta > 0 ? "+" : ""}{delta})
              </span>
            )}
          </>
        )}
        {!prediction && predictionsLoading && (
          <>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </>
        )}
      </div>

      {/* Future prediction details */}
      {prediction && (
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
              <span className="text-destructive font-medium">🔥 Threat: </span>{prediction.collapse_summary}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-medium">✦ Evolution: </span>{prediction.new_human_role}
            </p>
          </div>
        </div>
      )}

      {/* Skills as sim-launchable cards */}
      {prediction?.future_skills && prediction.future_skills.length > 0 && (
        <div className="mb-4">
          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            🗺️ Skills to Unlock
          </h4>
          <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
            {prediction.future_skills.map(skill => (
              <button
                key={skill.id}
                onClick={() => onPractice(task)}
                className="sim-glow-border relative flex-none w-40 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-accent/[0.04] p-3.5 text-left hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all group"
              >
                <div className="text-2xl mb-2">{isStandardEmoji(skill.icon_emoji) ? skill.icon_emoji : "⚡"}</div>
                <div className="text-[11px] font-semibold text-foreground group-hover:text-primary transition-colors leading-tight mb-1">
                  {skill.name}
                </div>
                <div className="text-[9px] text-muted-foreground leading-snug line-clamp-2 mb-2.5">
                  {skill.description}
                </div>
                <div className="flex items-center gap-1 text-[9px] font-medium text-primary/60 group-hover:text-primary transition-colors">
                  <Play className="h-2.5 w-2.5" />
                  Practice Quest
                </div>
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
          className="sim-glow-btn w-full h-8 text-xs rounded-full gap-1.5"
          onClick={() => onPractice(task)}
        >
          <Play className="h-3 w-3" />
          {isCollapsing ? "🔮 Scout Future Threats" : isCompleted ? "🔄 Retry Quest" : "⚔️ Accept Quest"}
        </Button>
      </div>
    </motion.div>
  );
}
