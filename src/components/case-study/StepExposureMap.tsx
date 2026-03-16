import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface TaskRow {
  ai_exposure_score: number | null;
  job_id: string;
}

interface JobMap {
  [jobId: string]: { title: string; department: string | null };
}

const BUCKETS = [
  { label: "0–20%", min: 0, max: 20 },
  { label: "21–40%", min: 21, max: 40 },
  { label: "41–60%", min: 41, max: 60 },
  { label: "61–80%", min: 61, max: 80 },
  { label: "81–100%", min: 81, max: 100 },
];

interface RoleScore {
  title: string;
  department: string | null;
  avgExposure: number;
}

export default function StepExposureMap() {
  const [roles, setRoles] = useState<RoleScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("name", "Anthropic")
        .single();
      if (!company) { setLoading(false); return; }

      // Get all analyzed Anthropic jobs (those with task clusters)
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, title, department")
        .eq("company_id", company.id)
        .limit(500);

      if (!jobs?.length) { setLoading(false); return; }

      const jobMap: JobMap = {};
      jobs.forEach((j) => { jobMap[j.id] = { title: j.title, department: j.department }; });
      const jobIds = jobs.map((j) => j.id);

      // Fetch task clusters for these jobs
      const { data: clusters } = await supabase
        .from("job_task_clusters")
        .select("job_id, ai_exposure_score")
        .in("job_id", jobIds);

      if (!clusters?.length) { setLoading(false); return; }

      // Average ai_exposure_score per job
      const scoreMap: Record<string, number[]> = {};
      clusters.forEach((c) => {
        if (c.ai_exposure_score != null) {
          (scoreMap[c.job_id] ??= []).push(c.ai_exposure_score);
        }
      });

      const result: RoleScore[] = Object.entries(scoreMap)
        .map(([jobId, scores]) => ({
          title: jobMap[jobId]?.title ?? "Unknown",
          department: jobMap[jobId]?.department ?? null,
          avgExposure: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        }))
        .sort((a, b) => b.avgExposure - a.avgExposure);

      setRoles(result);
      setLoading(false);
    })();
  }, []);

  const bucketCounts = useMemo(() => {
    return BUCKETS.map((b) => ({
      ...b,
      count: roles.filter((r) => r.avgExposure >= b.min && r.avgExposure <= b.max).length,
    }));
  }, [roles]);

  const maxCount = Math.max(...bucketCounts.map((b) => b.count), 1);
  const avgRisk = roles.length
    ? Math.round(roles.reduce((s, r) => s + r.avgExposure, 0) / roles.length)
    : 0;

  const BAR_COLORS = [
    "bg-brand-human",
    "bg-brand-human/70",
    "bg-brand-mid/70",
    "bg-brand-ai/70",
    "bg-brand-ai",
  ];

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
        After analysis, each role's tasks are scored for AI exposure. Here's how Anthropic's{" "}
        <span className="font-semibold text-foreground">{roles.length} analyzed roles</span>{" "}
        distribute across exposure bands — the org-wide average is{" "}
        <span className="font-semibold text-foreground">{avgRisk}%</span>.
      </p>

      {/* Bar chart */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          AI Exposure Distribution
        </h4>
        <div className="space-y-2">
          {bucketCounts.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex items-center gap-3"
              style={{ transformOrigin: "left" }}
            >
              <span className="text-xs text-muted-foreground w-16 text-right font-mono">
                {b.label}
              </span>
              <div className="flex-1 h-6 bg-muted/30 rounded-md overflow-hidden">
                <div
                  className={`h-full rounded-md ${BAR_COLORS[i]} transition-all`}
                  style={{ width: `${(b.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium w-8">{b.count}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Top exposed roles */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
          Most Exposed Roles
        </h4>
        <div className="space-y-1.5">
          {roles.slice(0, 8).map((r, i) => (
            <motion.div
              key={`${r.title}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className="truncate">{r.title}</span>
                {r.department && (
                  <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5 shrink-0">
                    {r.department}
                  </span>
                )}
              </div>
              <span className={`text-xs font-mono ml-2 font-semibold ${
                r.avgExposure >= 60 ? "text-brand-ai" :
                r.avgExposure >= 35 ? "text-brand-mid" :
                "text-brand-human"
              }`}>
                {r.avgExposure}%
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
