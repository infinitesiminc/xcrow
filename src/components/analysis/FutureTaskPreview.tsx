/**
 * FutureTaskPreview — Inline Level 2 expansion for a task cluster.
 * Shows how emerging tech will transform the task, new human role,
 * future skills (as ghost drops), and a simulation scenario CTA.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Clock, ArrowRight, Cpu, Sparkles, AlertTriangle, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FuturePrediction {
  collapse_summary: string;
  new_human_role: string;
  disrupting_tech: string[];
  future_exposure: number;
  timeline: string;
  future_skills: {
    id: string;
    name: string;
    category: string;
    description: string;
    icon_emoji: string;
  }[];
  simulation_scenario: {
    title: string;
    context: string;
  };
}

interface FutureTaskPreviewProps {
  taskName: string;
  jobTitle: string;
  company?: string;
  aiExposureScore?: number;
  jobImpactScore?: number;
  description?: string;
  onStartSim?: (scenarioTitle: string, taskName: string, level?: 1 | 2, prediction?: FuturePrediction) => void;
}

export function FutureTaskPreview({
  taskName, jobTitle, company, aiExposureScore, jobImpactScore, description, onStartSim,
}: FutureTaskPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<FuturePrediction | null>(null);

  const fetchPrediction = async () => {
    if (prediction) {
      setIsOpen(!isOpen);
      return;
    }
    setIsOpen(true);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("predict-task-future", {
        body: { taskName, jobTitle, company, aiExposureScore, jobImpactScore, description },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPrediction(data.prediction);
    } catch (e: any) {
      toast.error(e.message || "Failed to predict future");
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const timelineIcon = (t: string) => {
    if (t === "1-2 years") return "🔴";
    if (t === "2-3 years") return "🟡";
    return "🟢";
  };

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-[11px] gap-1 text-primary/70 hover:text-primary hover:bg-primary/5 w-fit px-2"
        onClick={fetchPrediction}
      >
        <Zap className="h-3 w-3" />
        {isOpen ? "Hide Future" : "See Future"}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            {loading ? (
              <div className="py-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Cpu className="h-4 w-4 animate-pulse text-primary" />
                Analyzing emerging tech impact…
              </div>
            ) : prediction ? (
              <div className="mt-2 rounded-lg border border-primary/20 bg-primary/[0.03] p-3 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1">
                    <Zap className="h-2.5 w-2.5" /> Level 2 — Future
                  </Badge>
                  <Badge className="bg-muted text-muted-foreground border-border/30 text-[10px] gap-1">
                    <Clock className="h-2.5 w-2.5" /> {timelineIcon(prediction.timeline)} {prediction.timeline}
                  </Badge>
                  <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
                    {prediction.future_exposure}% AI
                  </Badge>
                </div>

                {/* Collapse + New Role */}
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      <span className="text-destructive font-medium">Collapses:</span> {prediction.collapse_summary}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      <span className="text-primary font-medium">New Human Role:</span> {prediction.new_human_role}
                    </p>
                  </div>
                </div>

                {/* Disrupting Tech */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {prediction.disrupting_tech.map(tech => (
                    <Badge key={tech} className="bg-accent text-foreground border-border/30 text-[9px]">
                      ⚡ {tech}
                    </Badge>
                  ))}
                </div>

                {/* Future Skills (ghost drops) */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Future Skills to Unlock
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {prediction.future_skills.map(skill => (
                      <div
                        key={skill.id}
                        className="flex items-center gap-1.5 rounded-md border border-dashed border-primary/30 bg-primary/[0.03] px-2 py-1"
                      >
                        <span className="text-sm">{skill.icon_emoji}</span>
                        <div>
                          <div className="text-[11px] font-medium text-foreground/80">{skill.name}</div>
                          <div className="text-[9px] text-muted-foreground">{skill.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulation CTA */}
                <div className="rounded-md border border-primary/20 bg-primary/5 p-2.5 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <Play className="h-3 w-3 text-primary" />
                      {prediction.simulation_scenario.title}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                      {prediction.simulation_scenario.context}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="h-7 text-[11px] gap-1 shrink-0 ml-2"
                    onClick={() => onStartSim?.(prediction.simulation_scenario.title, taskName, 2, prediction)}
                  >
                    Try Level 2 <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
