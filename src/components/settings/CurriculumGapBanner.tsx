/**
 * CurriculumGapBanner — Personalized skill gap recommendations
 * based on the student's school curriculum vs market demand.
 * Auto-fetches on mount for students with a school seat.
 * Task pills launch simulations directly.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Zap, ChevronDown, ChevronUp, TrendingUp, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SimulatorModal from "@/components/SimulatorModal";

interface GapTask {
  cluster_name: string;
  job_title: string;
  ai_exposure_score: number;
  impact_level: string;
}

interface GapRecommendation {
  skill_name: string;
  demand_count: number;
  avg_exposure: number;
  tasks: GapTask[];
}

interface GapData {
  school: { name: string; short_name: string | null } | null;
  curriculum_skills_count: number;
  programs_count: number;
  recommendations: GapRecommendation[];
}

export default function CurriculumGapBanner() {
  const [data, setData] = useState<GapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [simTask, setSimTask] = useState<GapTask | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: fnData, error } = await supabase.functions.invoke(
          "recommend-gap-sims",
          { body: {} }
        );
        if (error) throw error;
        if (fnData && fnData.recommendations?.length > 0) {
          setData(fnData);
        }
      } catch (e) {
        console.error("Gap recommendations error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !data || data.recommendations.length === 0) return null;

  const schoolLabel = data.school?.short_name || data.school?.name || "Your School";
  const visibleRecs = expanded ? data.recommendations : data.recommendations.slice(0, 3);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-4 mb-6"
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <GraduationCap className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              Skills {schoolLabel} doesn't teach yet
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Based on {data.programs_count} programs & {data.curriculum_skills_count} curriculum skills vs market demand
            </p>
          </div>
        </div>

        {/* Gap skill list */}
        <div className="space-y-2">
          <AnimatePresence>
            {visibleRecs.map((rec, i) => (
              <motion.div
                key={rec.skill_name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border/40 bg-card/80 p-3"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-amber-500" />
                    <span className="text-xs font-medium text-foreground">{rec.skill_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {rec.demand_count} roles need this
                    </span>
                  </div>
                </div>

                {rec.tasks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {rec.tasks.map((task) => (
                      <button
                        key={task.cluster_name}
                        onClick={() => setSimTask(task)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/8 hover:bg-primary/15 border border-primary/10 text-[11px] font-medium text-primary transition-colors"
                      >
                        <Play className="h-2.5 w-2.5" />
                        {task.cluster_name.length > 35
                          ? task.cluster_name.slice(0, 35) + "…"
                          : task.cluster_name}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {data.recommendations.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mx-auto mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <>Show less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>
                +{data.recommendations.length - 3} more gaps{" "}
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}
      </motion.div>

      {/* Simulation Modal */}
      <SimulatorModal
        open={!!simTask}
        onClose={() => setSimTask(null)}
        taskName={simTask?.cluster_name || ""}
        jobTitle={simTask?.job_title || ""}
        taskImpactLevel={simTask?.impact_level}
      />
    </>
  );
}
