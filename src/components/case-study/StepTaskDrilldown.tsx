import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Layers, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TaskCluster {
  id: string;
  cluster_name: string;
  ai_exposure_score: number | null;
  job_impact_score: number | null;
  priority: string | null;
  description: string | null;
}

function scoreBadge(score: number | null) {
  if (score === null) return null;
  const color =
    score >= 70 ? "text-dot-purple bg-dot-purple/10" :
    score >= 40 ? "text-dot-amber bg-dot-amber/10" :
    "text-dot-teal bg-dot-teal/10";
  return (
    <span className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded ${color}`}>
      {score}%
    </span>
  );
}

export default function StepTaskDrilldown() {
  const [tasks, setTasks] = useState<TaskCluster[]>([]);
  const [roleTitle, setRoleTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("name", "Anthropic")
        .single();
      if (!company) { setLoading(false); return; }

      // Find a role that has task clusters
      const { data: jobsWithTasks } = await supabase
        .from("job_task_clusters")
        .select("job_id")
        .limit(1);
      
      if (!jobsWithTasks?.length) { setLoading(false); return; }

      const { data: job } = await supabase
        .from("jobs")
        .select("id, title")
        .eq("company_id", company.id)
        .limit(1)
        .single();

      if (!job) { setLoading(false); return; }

      // Get task clusters for first Anthropic job with clusters
      const { data: clusters } = await supabase
        .from("job_task_clusters")
        .select("id, cluster_name, ai_exposure_score, job_impact_score, priority, description")
        .eq("job_id", job.id)
        .order("ai_exposure_score", { ascending: false });

      if (clusters?.length) {
        setRoleTitle(job.title);
        setTasks(clusters);
      } else {
        // Fallback: find any job with clusters
        const { data: anyCluster } = await supabase
          .from("job_task_clusters")
          .select("job_id")
          .not("ai_exposure_score", "is", null)
          .limit(1);
        if (anyCluster?.length) {
          const { data: fallbackJob } = await supabase
            .from("jobs")
            .select("id, title")
            .eq("id", anyCluster[0].job_id)
            .single();
          const { data: fallbackClusters } = await supabase
            .from("job_task_clusters")
            .select("id, cluster_name, ai_exposure_score, job_impact_score, priority, description")
            .eq("job_id", anyCluster[0].job_id)
            .order("ai_exposure_score", { ascending: false });
          setRoleTitle(fallbackJob?.title ?? "Example Role");
          setTasks(fallbackClusters ?? []);
        }
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Clicking into a role reveals its task-level breakdown. Here's{" "}
        <span className="font-semibold text-foreground">{roleTitle}</span> — each task
        is scored for AI exposure and job impact to identify where to focus upskilling.
      </p>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_70px_70px] gap-2 px-4 py-2 bg-muted/30 border-b border-border text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          <span>Task</span>
          <span className="text-center">AI Exp.</span>
          <span className="text-center">Impact</span>
        </div>

        {/* Rows */}
        <div className="max-h-[360px] overflow-y-auto">
          {tasks.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="grid grid-cols-[1fr_70px_70px] gap-2 px-4 py-2.5 border-b border-border/30 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-sm truncate">{t.cluster_name}</span>
                {t.priority === "critical" && (
                  <ArrowUpRight className="h-3 w-3 text-dot-purple shrink-0" />
                )}
              </div>
              <div className="flex justify-center">{scoreBadge(t.ai_exposure_score)}</div>
              <div className="flex justify-center">{scoreBadge(t.job_impact_score)}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
