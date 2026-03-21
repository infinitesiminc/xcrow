import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, Play, Cpu, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskAnalysis } from "@/types/analysis";
import { exposureStyle } from "@/lib/exposure-colors";
import type { FuturePrediction } from "@/components/analysis/FutureTaskPreview";

interface FutureViewTabProps {
  tasks: TaskAnalysis[];
  predictions: Record<string, FuturePrediction>;
  loading: boolean;
  onPractice: (task: TaskAnalysis) => void;
  onFetchPredictions: () => void;
}

export function FutureViewTab({ tasks, predictions, loading, onPractice, onFetchPredictions }: FutureViewTabProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const hasPredictions = Object.keys(predictions).length > 0;

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
        <Cpu className="h-6 w-6 animate-pulse text-primary" />
        <p className="text-sm">Analyzing emerging tech impact on all tasks…</p>
        <p className="text-[10px]">This may take 15-30 seconds</p>
      </div>
    );
  }

  if (!hasPredictions) {
    return (
      <div className="py-12 flex flex-col items-center gap-4">
        <div className="text-center">
          <h3 className="text-sm font-semibold text-foreground mb-1">Future View — Level 2</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            See how AI agents, OpenClaw, and other emerging technologies will transform each task in this role.
          </p>
        </div>
        <Button onClick={onFetchPredictions} className="rounded-full gap-2">
          <Sparkles className="h-4 w-4" /> Generate Future Predictions
        </Button>
      </div>
    );
  }

  const sorted = [...tasks].sort((a, b) => {
    const pa = predictions[a.name];
    const pb = predictions[b.name];
    return (pb?.future_exposure ?? 0) - (pa?.future_exposure ?? 0);
  });

  return (
    <div className="space-y-1">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_80px_80px_70px] gap-2 px-3 py-2 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
        <span>Task</span>
        <span className="text-center">Today</span>
        <span className="text-center">Future</span>
        <span className="text-right">Action</span>
      </div>

      {sorted.map((task) => {
        const pred = predictions[task.name];
        const currentScore = task.aiExposureScore ?? 50;
        const futureScore = pred?.future_exposure ?? currentScore;
        const isExpanded = expanded === task.name;
        const delta = futureScore - currentScore;
        const currentStyle = exposureStyle(currentScore);
        const futureStyle = exposureStyle(futureScore);
        const isCollapsing = futureScore >= 80;

        return (
          <div key={task.name} className="border-b border-border/20 last:border-0">
            {/* Row */}
            <button
              onClick={() => setExpanded(isExpanded ? null : task.name)}
              className="w-full grid grid-cols-[1fr_80px_80px_70px] gap-2 items-center px-3 py-3 hover:bg-muted/20 transition-colors text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ChevronDown className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`} />
                <span className="text-sm font-medium text-foreground truncate">{task.name}</span>
              </div>
              <div className="text-center">
                <Badge className={`text-[10px] ${currentStyle.badge}`}>
                  🤖 {currentScore}%
                </Badge>
              </div>
              <div className="text-center flex items-center justify-center gap-1">
                <Badge className={`text-[10px] ${futureStyle.badge}`}>
                  {isCollapsing ? "⚡" : "🟢"} {futureScore}%
                </Badge>
              </div>
              <div className="text-right">
                {delta > 0 && (
                  <span className={`text-[10px] font-semibold ${isCollapsing ? "text-destructive" : "text-warning"}`}>
                    +{delta}%
                  </span>
                )}
              </div>
            </button>

            {/* Expanded details */}
            <AnimatePresence>
              {isExpanded && pred && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-1 space-y-3 ml-5">
                    {/* Collapse + New Role */}
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          <span className="text-destructive font-medium">Collapses: </span>{pred.collapse_summary}
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          <span className="text-primary font-medium">New Role: </span>{pred.new_human_role}
                        </p>
                      </div>
                    </div>

                    {/* Tech + Timeline */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge className="bg-muted text-muted-foreground border-border/30 text-[9px]">
                        {pred.timeline}
                      </Badge>
                      {pred.disrupting_tech.map(tech => (
                        <Badge key={tech} className="bg-accent text-foreground border-border/30 text-[9px]">
                          ⚡ {tech}
                        </Badge>
                      ))}
                    </div>

                    {/* Future skills (ghost drops) */}
                    <div className="flex flex-wrap gap-2">
                      {pred.future_skills.map(skill => (
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

                    {/* Sim CTA */}
                    <Button
                      size="sm"
                      className="h-7 text-[11px] rounded-full gap-1"
                      onClick={() => onPractice(task)}
                    >
                      <Play className="h-3 w-3" /> Try Level 2 Sim
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
