import { useState, useEffect } from "react";
import { X, MapPin, Loader2, ArrowRight, Play } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SimulatorModal from "@/components/SimulatorModal";
import type { RoleResult } from "@/components/InlineRoleCarousel";

function hashToHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = str.charCodeAt(i) + ((h << 5) - h);
  }
  return Math.abs(h) % 360;
}

interface RolePreviewPanelProps {
  role: RoleResult;
  onClose: () => void;
}

interface TaskCluster {
  cluster_name: string;
  description: string | null;
  ai_exposure_score: number | null;
  priority: string | null;
  ai_state?: string | null;
  ai_trend?: string | null;
  impact_level?: string | null;
}

type PanelView = "details" | "simulation";

export default function RolePreviewPanel({ role, onClose }: RolePreviewPanelProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskCluster[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<PanelView>("details");
  const [simTask, setSimTask] = useState<TaskCluster | null>(null);

  const hue1 = hashToHue(role.title);
  const hue2 = (hue1 + 60) % 360;

  useEffect(() => {
    // Reset view when role changes
    setView("details");
    setSimTask(null);

    if (!role.jobId) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const [taskRes, jobRes] = await Promise.all([
        supabase
          .from("job_task_clusters")
          .select("cluster_name, description, ai_exposure_score, priority, ai_state, ai_trend, impact_level")
          .eq("job_id", role.jobId)
          .order("sort_order"),
        supabase
          .from("jobs")
          .select("role_summary")
          .eq("id", role.jobId)
          .single(),
      ]);
      setTasks(taskRes.data || []);
      setSummary(jobRes.data?.role_summary || null);
      setLoading(false);
    })();
  }, [role.jobId]);

  const logoUrl =
    role.logo ||
    (role.company
      ? `https://logo.clearbit.com/${role.company.toLowerCase().replace(/\s+/g, "")}.com`
      : "");

  const startSimulation = (task: TaskCluster) => {
    setSimTask(task);
    setView("simulation");
  };

  // Simulation view
  if (view === "simulation" && simTask) {
    return (
      <div className="h-full flex flex-col">
        <SimulatorModal
          open={true}
          onClose={() => {
            setView("details");
            setSimTask(null);
          }}
          taskName={simTask.cluster_name}
          jobTitle={role.title}
          company={role.company || undefined}
          taskState={simTask.ai_state || undefined}
          taskTrend={simTask.ai_trend || undefined}
          taskImpactLevel={simTask.impact_level || undefined}
          inline
          onBackToFeed={() => {
            setView("details");
            setSimTask(null);
          }}
          onNextTask={() => {
            // Find next task
            const currentIdx = tasks.findIndex(t => t.cluster_name === simTask.cluster_name);
            const nextTask = tasks[currentIdx + 1];
            if (nextTask) {
              setSimTask(nextTask);
            } else {
              setView("details");
              setSimTask(null);
            }
          }}
        />
      </div>
    );
  }

  // Details view
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col bg-card overflow-hidden"
    >
      {/* Header */}
      <div
        className="p-4 pb-3 shrink-0"
        style={{
          background: `linear-gradient(135deg, hsl(${hue1} 50% 10%) 0%, hsl(${hue2} 40% 8%) 100%)`,
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {logoUrl && (
              <img
                src={logoUrl}
                alt=""
                className="h-10 w-10 rounded-lg object-contain bg-muted/20 p-0.5 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="min-w-0">
              <h2 className="text-base font-bold text-foreground leading-snug line-clamp-2">
                {role.title}
              </h2>
              {role.company && (
                <p className="text-sm text-muted-foreground truncate">{role.company}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors shrink-0"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {role.location && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {role.location}
            </span>
          )}
          {role.workMode && <span className="capitalize">{role.workMode}</span>}
          {role.seniority && <span className="capitalize">{role.seniority}</span>}
        </div>

        {role.augmented > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${role.augmented}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-primary">{role.augmented}%</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              AI Augmented
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {summary && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  About this role
                </h3>
                <div className="text-sm text-foreground/80 leading-relaxed prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
              </div>
            )}

            {tasks.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Key tasks & AI impact
                </h3>
                <div className="space-y-2">
                  {tasks.slice(0, 8).map((t, i) => (
                    <div
                      key={i}
                      className="group rounded-lg border border-border/50 bg-muted/20 p-2.5 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-foreground leading-snug">
                          {t.cluster_name}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {t.ai_exposure_score != null && (
                            <span className="text-xs font-semibold text-primary">
                              {t.ai_exposure_score}%
                            </span>
                          )}
                          {user && (
                            <button
                              onClick={() => startSimulation(t)}
                              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-2 py-0.5 transition-all"
                            >
                              <Play className="h-2.5 w-2.5" />
                              Practice
                            </button>
                          )}
                        </div>
                      </div>
                      {t.description && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                          {t.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!summary && tasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Detailed analysis coming soon. Tap below for the full breakdown.
              </p>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border shrink-0">
        <button
          onClick={() => {
            const params = new URLSearchParams({
              title: role.title,
              company: role.company || "",
            });
            navigate(`/analysis?${params.toString()}`);
          }}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Full breakdown
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
