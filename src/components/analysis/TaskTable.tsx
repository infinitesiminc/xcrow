import { useMemo } from "react";
import { motion } from "framer-motion";
import { Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskAnalysis } from "@/types/analysis";
import type { JobAnalysisResult } from "@/types/analysis";
import { exposureStyle } from "@/lib/exposure-colors";

interface TaskTableProps {
  tasks: TaskAnalysis[];
  skills: JobAnalysisResult["skills"];
  completedTasks: Set<string>;
  onPractice: (taskName: string) => void;
}

function exposureColor(score: number) {
  const s = exposureStyle(score);
  return s.badge;
}

function impactColor(score: number) {
  if (score >= 70) return "bg-primary/10 text-primary border-primary/20";
  if (score >= 40) return "bg-accent text-muted-foreground border-border/30";
  return "bg-muted/50 text-muted-foreground border-border/20";
}

function insightLabel(aiExposure: number, jobImpact: number): { label: string; color: string } | null {
  if (aiExposure >= 60 && jobImpact >= 60) return { label: "🚀 Learn This First", color: "bg-primary/10 text-primary border-primary/20" };
  if (aiExposure >= 60 && jobImpact < 40) return { label: "🤖 AI Handles This", color: "bg-accent text-muted-foreground border-border/30" };
  if (aiExposure < 40 && jobImpact >= 60) return { label: "💪 Your Superpower", color: "bg-success/10 text-success border-success/20" };
  return null;
}

function priorityBadge(p?: string) {
  if (p === "high") return <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">High</Badge>;
  if (p === "medium") return <Badge className="bg-brand-mid/10 text-brand-mid border-brand-mid/20 text-[9px]">Medium</Badge>;
  return <Badge className="bg-muted/50 text-muted-foreground border-border/20 text-[9px]">Low</Badge>;
}

export function TaskTable({ tasks, skills, completedTasks, onPractice }: TaskTableProps) {
  const sortedTasks = useMemo(() => {
    return tasks
      .map((t, i) => ({ task: t, originalIndex: i }))
      .sort((a, b) => (b.task.aiExposureScore ?? 50) - (a.task.aiExposureScore ?? 50));
  }, [tasks]);

  const summary = useMemo(() => {
    const urgent = tasks.filter(t => (t.aiExposureScore ?? 50) >= 60 && (t.jobImpactScore ?? 50) >= 60).length;
    const humanEdge = tasks.filter(t => (t.aiExposureScore ?? 50) < 40 && (t.jobImpactScore ?? 50) >= 60).length;
    const letAi = tasks.filter(t => (t.aiExposureScore ?? 50) >= 60 && (t.jobImpactScore ?? 50) < 40).length;
    return { urgent, humanEdge, letAi };
  }, [tasks]);

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        {summary.urgent > 0 && (
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="text-sm">🚀</span>
            <span className="font-semibold text-foreground">{summary.urgent}</span> learn first
          </span>
        )}
        {summary.humanEdge > 0 && (
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="text-sm">💪</span>
            <span className="font-semibold text-foreground">{summary.humanEdge}</span> your superpower
          </span>
        )}
        {summary.letAi > 0 && (
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="text-sm">🤖</span>
            <span className="font-semibold text-foreground">{summary.letAi}</span> AI handles
          </span>
        )}
      </div>

      {/* Scrollable grid of mini cards */}
      <div className="max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {sortedTasks.map(({ task, originalIndex }, i) => {
            const aiScore = task.aiExposureScore ?? 50;
            const impactScore = task.jobImpactScore ?? 50;
            const isCompleted = completedTasks.has(task.name);
            const insight = insightLabel(aiScore, impactScore);

            return (
              <motion.div
                key={originalIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2.5"
              >
                {/* Task name */}
                <span className="text-base font-medium text-foreground leading-snug line-clamp-2">
                  {task.name}
                </span>

                {/* Dual scores row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge className={`text-[10px] shrink-0 ${exposureColor(aiScore)}`} title="AI Tool Potential — how much AI tools can help with this task">
                    🤖 {aiScore}%
                  </Badge>
                  <Badge className={`text-[10px] shrink-0 ${impactColor(impactScore)}`} title="Job Impact — how critical this task is to role success">
                    ⭐ {impactScore}%
                  </Badge>
                  {priorityBadge(task.priority)}
                </div>

                {/* 2x2 insight label */}
                {insight && (
                  <Badge className={`text-[9px] w-fit ${insight.color}`}>
                    {insight.label}
                  </Badge>
                )}

                {/* Upskill button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground hover:bg-accent/30 w-fit mt-auto px-2"
                  onClick={() => onPractice(task.name)}
                >
                  {isCompleted
                    ? <><CheckCircle2 className="h-3 w-3 text-success" /> Learned</>
                    : <><Play className="h-3 w-3" /> Learn This</>
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
