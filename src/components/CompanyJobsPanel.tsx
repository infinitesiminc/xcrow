import { useState, useEffect, useMemo } from "react";
import { X, Briefcase, Bot, Play, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { brandfetchFromName } from "@/lib/logo";
import { Button } from "@/components/ui/button";

interface CompanyJob {
  id: string;
  title: string;
  department: string | null;
  augmented_percent: number | null;
  topTask: string | null;
}

interface Props {
  companyName: string | null;
  onClose: () => void;
  onJobSelect: (job: { role: string; company: string; task: string }) => void;
}

export default function CompanyJobsPanel({ companyName, onClose, onJobSelect }: Props) {
  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const logoUrl = useMemo(() => companyName ? brandfetchFromName(companyName) : null, [companyName]);

  useEffect(() => {
    if (!companyName) return;
    setLoading(true);
    setJobs([]);
    setLogoFailed(false);

    (async () => {
      // 1. Find company
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("name", companyName)
        .limit(1)
        .maybeSingle();

      if (!company) {
        setLoading(false);
        return;
      }

      // 2. Fetch jobs
      const { data: jobRows } = await supabase
        .from("jobs")
        .select("id, title, department, augmented_percent")
        .eq("company_id", company.id)
        .order("augmented_percent", { ascending: false, nullsFirst: false })
        .limit(5);

      if (!jobRows?.length) {
        setLoading(false);
        return;
      }

      // 3. Fetch top task for each job
      const jobIds = jobRows.map((j) => j.id);
      const { data: tasks } = await supabase
        .from("job_task_clusters")
        .select("job_id, cluster_name")
        .in("job_id", jobIds)
        .order("sort_order", { ascending: true })
        .limit(20);

      const taskMap = new Map<string, string>();
      tasks?.forEach((t) => {
        if (!taskMap.has(t.job_id)) taskMap.set(t.job_id, t.cluster_name);
      });

      setJobs(
        jobRows.map((j) => ({
          id: j.id,
          title: j.title,
          department: j.department,
          augmented_percent: j.augmented_percent,
          topTask: taskMap.get(j.id) ?? null,
        }))
      );
      setLoading(false);
    })();
  }, [companyName]);

  return (
    <AnimatePresence>
      {companyName && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.25 }}
          className="relative mt-6 max-w-2xl mx-auto rounded-xl border border-border/60 bg-card/95 backdrop-blur-md shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-muted border border-border/40">
                {logoUrl && !logoFailed ? (
                  <img src={logoUrl} alt={companyName} className="w-8 h-8 object-contain" onError={() => setLogoFailed(true)} />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">{companyName.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{companyName}</h3>
                <p className="text-[10px] text-muted-foreground font-mono tracking-wide">OPEN ROLES</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-3">
            {loading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading roles…</span>
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No roles found for this company yet.</p>
            ) : (
              <div className="divide-y divide-border/30">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between py-3 group"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate">{job.title}</span>
                      </div>
                      <div className="flex items-center gap-3 ml-5.5">
                        {job.department && (
                          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{job.department}</span>
                        )}
                        {job.augmented_percent != null && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-brand-ai">
                            <Bot className="h-3 w-3" />
                            {job.augmented_percent}% AI
                          </span>
                        )}
                      </div>
                    </div>
                    {job.topTask && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => onJobSelect({ role: job.title, company: companyName, task: job.topTask! })}
                      >
                        <Play className="h-3 w-3" />
                        Practice
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
