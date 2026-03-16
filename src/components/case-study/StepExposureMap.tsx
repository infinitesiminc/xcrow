import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface JobRow {
  id: string;
  title: string;
  department: string | null;
  automation_risk_percent: number | null;
}

const BUCKETS = [
  { label: "0–20%", min: 0, max: 20 },
  { label: "21–40%", min: 21, max: 40 },
  { label: "41–60%", min: 41, max: 60 },
  { label: "61–80%", min: 61, max: 80 },
  { label: "81–100%", min: 81, max: 100 },
];

export default function StepExposureMap() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("name", "Anthropic")
        .single();
      if (!company) { setLoading(false); return; }
      const { data } = await supabase
        .from("jobs")
        .select("id, title, department, automation_risk_percent")
        .eq("company_id", company.id)
        .not("automation_risk_percent", "is", null)
        .order("automation_risk_percent", { ascending: false })
        .limit(500);
      setJobs(data ?? []);
      setLoading(false);
    })();
  }, []);

  const analyzed = jobs.filter((j) => (j.automation_risk_percent ?? 0) > 0);
  const bucketCounts = useMemo(() => {
    return BUCKETS.map((b) => ({
      ...b,
      count: analyzed.filter(
        (j) => (j.automation_risk_percent ?? 0) >= b.min && (j.automation_risk_percent ?? 0) <= b.max
      ).length,
    }));
  }, [analyzed]);

  const maxCount = Math.max(...bucketCounts.map((b) => b.count), 1);
  const avgRisk = analyzed.length
    ? Math.round(analyzed.reduce((s, j) => s + (j.automation_risk_percent ?? 0), 0) / analyzed.length)
    : 0;

  const BAR_COLORS = [
    "bg-dot-teal",
    "bg-dot-teal/70",
    "bg-dot-amber/70",
    "bg-dot-amber",
    "bg-dot-purple",
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
        After analysis, each role receives an AI exposure score. Here's how Anthropic's{" "}
        <span className="font-semibold text-foreground">{analyzed.length} analyzed roles</span>{" "}
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
          {analyzed.slice(0, 6).map((j, i) => (
            <motion.div
              key={j.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="flex items-center justify-between text-sm"
            >
              <span className="truncate flex-1">{j.title}</span>
              <span className="text-xs font-mono ml-2 text-dot-purple font-semibold">
                {j.automation_risk_percent}%
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
