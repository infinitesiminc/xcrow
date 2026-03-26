/**
 * PipelinePreview — Visual flow preview of the agent pipeline.
 */
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Zap } from "lucide-react";
import { TOOL_OPTIONS, type PipelineStep } from "./PipelineStepCard";

interface PipelinePreviewProps {
  steps: PipelineStep[];
  title: string;
  running: boolean;
  activeStep: number;
}

export default function PipelinePreview({ steps, title, running, activeStep }: PipelinePreviewProps) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/30 p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-3 flex items-center gap-1.5">
        <Zap className="h-3 w-3 text-primary" />
        Pipeline Preview {running && <span className="text-primary animate-pulse">— Running...</span>}
      </div>

      {steps.length === 0 && (
        <p className="text-xs text-muted-foreground/60 text-center py-4">Add steps to see the flow</p>
      )}

      <div className="flex flex-col items-center gap-0">
        <AnimatePresence mode="popLayout">
          {steps.map((step, i) => {
            const tool = TOOL_OPTIONS.find(t => t.value === step.tool) || TOOL_OPTIONS[0];
            const isActive = running && i === activeStep;
            const isDone = running && i < activeStep;

            return (
              <motion.div
                key={step.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center w-full"
              >
                {/* Node */}
                <div
                  className={`
                    w-full max-w-[200px] rounded-lg px-3 py-2 text-center border transition-all duration-300
                    ${isActive
                      ? "border-primary bg-primary/10 shadow-[0_0_16px_hsl(var(--primary)/0.3)] scale-105"
                      : isDone
                        ? "border-primary/30 bg-primary/5 opacity-60"
                        : "border-border/40 bg-background/50"
                    }
                  `}
                >
                  <div className="text-sm mb-0.5">{tool.icon}</div>
                  <div className="text-[10px] font-medium truncate">
                    {step.description || tool.label}
                  </div>
                  {isDone && <div className="text-[9px] text-primary mt-0.5">✓ Done</div>}
                  {isActive && (
                    <motion.div
                      className="text-[9px] text-primary mt-0.5"
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                    >
                      Processing...
                    </motion.div>
                  )}
                </div>

                {/* Arrow connector */}
                {i < steps.length - 1 && (
                  <div className="py-1">
                    <ArrowDown className={`h-3.5 w-3.5 ${isDone ? "text-primary/40" : "text-muted-foreground/30"}`} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {title && (
        <div className="mt-3 pt-2 border-t border-border/30 text-center">
          <span className="text-[9px] text-muted-foreground">Pipeline: </span>
          <span className="text-[10px] font-medium text-foreground">{title}</span>
        </div>
      )}
    </div>
  );
}
