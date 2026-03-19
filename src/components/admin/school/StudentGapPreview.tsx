/**
 * StudentGapPreview — Admin preview of what students at a school
 * would see in their Journey dashboard's curriculum gap banner.
 * Task pills launch simulations directly for demo purposes.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, GraduationCap, Zap, TrendingUp, Loader2, ChevronDown, ChevronUp, Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface Props {
  schoolId: string;
  schoolName: string;
}

export default function StudentGapPreview({ schoolId, schoolName }: Props) {
  const [data, setData] = useState<GapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [simTask, setSimTask] = useState<GapTask | null>(null);

  async function loadPreview() {
    setLoading(true);
    setError(null);
    try {
      const { data: fnData, error: fnErr } = await supabase.functions.invoke(
        "recommend-gap-sims",
        { body: { school_id: schoolId } }
      );
      if (fnErr) throw fnErr;
      setData(fnData);
      setLoaded(true);
    } catch (e: any) {
      setError(e.message || "Failed to load preview");
    } finally {
      setLoading(false);
    }
  }

  if (!loaded) {
    return (
      <div className="rounded-xl border border-dashed border-border/50 bg-card/50 p-6 text-center">
        <Eye className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-3">
          Preview what students at <strong>{schoolName}</strong> will see in their Skill Map
        </p>
        <Button onClick={loadPreview} disabled={loading} size="sm" variant="outline">
          {loading ? (
            <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Loading…</>
          ) : (
            <><Eye className="h-3.5 w-3.5 mr-1.5" /> Preview Student View</>
          )}
        </Button>
        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      </div>
    );
  }

  if (!data || data.recommendations.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-card p-5 text-center">
        <p className="text-sm text-muted-foreground">
          No curriculum gaps detected — the school's programs cover all high-demand skills, or no curriculum data is available.
        </p>
        <Button onClick={loadPreview} disabled={loading} size="sm" variant="ghost" className="mt-2">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}
        </Button>
      </div>
    );
  }

  const schoolLabel = data.school?.short_name || data.school?.name || schoolName;
  const visibleRecs = expanded ? data.recommendations : data.recommendations.slice(0, 5);

  return (
    <>
      <div className="space-y-3">
        {/* Simulated student banner */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Skills {schoolLabel} doesn't teach yet
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {data.programs_count} programs · {data.curriculum_skills_count} curriculum skills vs market demand
                </p>
              </div>
            </div>
            <Button onClick={loadPreview} disabled={loading} size="sm" variant="ghost" className="h-7 text-xs">
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Refresh"}
            </Button>
          </div>

          <div className="space-y-2 mt-3">
            <AnimatePresence>
              {visibleRecs.map((rec, i) => (
                <motion.div
                  key={rec.skill_name}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-border/40 bg-card/80 p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-amber-500" />
                      <span className="text-xs font-medium text-foreground">{rec.skill_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {rec.demand_count} roles · {rec.avg_exposure}% AI exposure
                      </span>
                    </div>
                  </div>
                  {rec.tasks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {rec.tasks.map((task) => (
                        <motion.button
                          key={task.cluster_name}
                          whileHover={{ scale: 1.03, y: -1 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSimTask(task)}
                          className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[hsl(var(--neon-purple))]/15 to-[hsl(var(--neon-blue))]/10 hover:from-[hsl(var(--neon-purple))]/25 hover:to-[hsl(var(--neon-blue))]/20 border border-[hsl(var(--neon-purple))]/20 hover:border-[hsl(var(--neon-purple))]/40 text-[11px] font-medium text-primary transition-all duration-200 shadow-sm hover:shadow-[0_0_12px_hsl(var(--neon-purple)/0.15)]"
                        >
                          <Play className="h-2.5 w-2.5 text-[hsl(var(--neon-purple))] group-hover:text-[hsl(var(--neon-pink))] transition-colors" />
                          <span className="truncate max-w-[200px]">{task.cluster_name}</span>
                          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[hsl(var(--neon-purple))]/10 text-[9px] text-[hsl(var(--neon-purple))] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                            GO
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {data.recommendations.length > 5 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mx-auto mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? (
                <>Show less <ChevronUp className="h-3 w-3" /></>
              ) : (
                <>+{data.recommendations.length - 5} more <ChevronDown className="h-3 w-3" /></>
              )}
            </button>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground text-center italic">
          ↑ This is what students see in their Skill Map · Click any task to launch a demo simulation
        </p>
      </div>

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
