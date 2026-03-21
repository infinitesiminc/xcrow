import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, CheckCircle2, ChevronDown, AlertTriangle, Sparkles,
  Clock, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  onPractice: (task: TaskAnalysis) => void;
  index: number;
}

export function TaskCard({
  task, prediction, timeHorizon, isCompleted, onPractice, index,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);

  const t = timeHorizon / 2;
  const currentScore = task.aiExposureScore ?? 50;
  const futureScore = prediction?.future_exposure ?? currentScore;
  const displayScore = lerp(currentScore, futureScore, t);
  const style = exposureStyle(displayScore);
  const delta = futureScore - currentScore;
  const showL2 = (timeHorizon > 0 && !!prediction) || expanded;
  const isCollapsing = futureScore >= 80;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-xl border border-border/50 bg-card overflow-hidden"
    >
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold text-foreground">{task.name}</h4>
              {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />}
            </div>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <motion.span
              key={displayScore}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${style.badge}`}
            >
              {displayScore}%
            </motion.span>
            {timeHorizon > 0 && delta !== 0 && (
              <span className={`text-[10px] font-medium ${delta > 0 ? "text-destructive" : "text-success"}`}>
                {delta > 0 ? "+" : ""}{delta}
              </span>
            )}
          </div>
        </div>

        {/* L2 inline preview when slider is in future mode */}
        <AnimatePresence>
          {showL2 && prediction && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-border/30 space-y-3">
                {/* Tech + Timeline badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge className="bg-muted text-muted-foreground border-border/30 text-[9px] gap-1">
                    <Clock className="h-2.5 w-2.5" /> {prediction.timeline}
                  </Badge>
                  {prediction.disrupting_tech.slice(0, 3).map(tech => (
                    <Badge key={tech} className="bg-accent text-foreground border-border/30 text-[9px]">
                      ⚡ {tech}
                    </Badge>
                  ))}
                </div>

                {/* Collapse + New Role */}
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      <span className="text-destructive font-medium">Collapses: </span>{prediction.collapse_summary}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      <span className="text-primary font-medium">New Role: </span>{prediction.new_human_role}
                    </p>
                  </div>
                </div>

                {/* Future skills (ghost drops) */}
                {prediction.future_skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {prediction.future_skills.map(skill => (
                      <div
                        key={skill.id}
                        className="flex items-center gap-1.5 rounded-md border border-dashed border-primary/30 bg-primary/[0.03] px-2 py-1"
                      >
                        <span className="text-sm">{skill.icon_emoji}</span>
                        <div>
                          <div className="text-[10px] font-medium text-foreground/80">{skill.name}</div>
                          <div className="text-[8px] text-muted-foreground">{skill.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/30">
          {/* Toggle L2 when slider is at today */}
          {timeHorizon === 0 && prediction && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] gap-1 text-primary/70 hover:text-primary hover:bg-primary/5 px-2"
              onClick={() => setExpanded(!expanded)}
            >
              <Zap className="h-3 w-3" />
              {expanded ? "Hide Future" : "See Future"}
              <ChevronDown className={`h-2.5 w-2.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </Button>
          )}
          <Button
            size="sm"
            variant={isCompleted ? "secondary" : "default"}
            className="h-7 text-xs rounded-full gap-1 ml-auto"
            onClick={() => onPractice(task)}
          >
            <Play className="h-3 w-3" />
            {isCollapsing && timeHorizon > 0 ? "L2 Sim" : isCompleted ? "Retry" : "Practice"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
