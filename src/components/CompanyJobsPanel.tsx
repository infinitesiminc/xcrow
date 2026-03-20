import { useState, useEffect, useMemo } from "react";
import { X, Briefcase, Bot, Play, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { brandfetchFromName } from "@/lib/logo";

const SPECTRUM_GRADIENTS = [
  "from-spectrum-0 via-spectrum-1 to-spectrum-2",
  "from-spectrum-6 via-spectrum-5 to-spectrum-4",
  "from-spectrum-3 via-spectrum-4 to-spectrum-5",
  "from-spectrum-1 via-spectrum-2 to-spectrum-3",
  "from-spectrum-4 via-spectrum-3 to-spectrum-6",
];

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
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("name", companyName)
        .limit(1)
        .maybeSingle();

      if (!company) { setLoading(false); return; }

      const { data: taskJobs } = await supabase
        .from("job_task_clusters")
        .select("job_id, cluster_name, jobs!inner(id, title, department, augmented_percent)")
        .eq("jobs.company_id", company.id)
        .order("sort_order", { ascending: true })
        .limit(50);

      if (!taskJobs?.length) { setLoading(false); return; }

      const jobMap = new Map<string, CompanyJob>();
      for (const row of taskJobs) {
        const j = row.jobs as any;
        if (!j || jobMap.has(j.id)) continue;
        if (jobMap.size >= 6) break;
        jobMap.set(j.id, {
          id: j.id,
          title: j.title,
          department: j.department,
          augmented_percent: j.augmented_percent,
          topTask: row.cluster_name,
        });
      }

      setJobs(Array.from(jobMap.values()));
      setLoading(false);
    })();
  }, [companyName]);

  return (
    <AnimatePresence>
      {companyName && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3 }}
          className="mt-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
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
                <p className="text-[10px] text-muted-foreground font-mono tracking-wide">SIM-READY ROLES</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className="relative rounded-xl overflow-hidden"
                >
                  <div className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${SPECTRUM_GRADIENTS[i % SPECTRUM_GRADIENTS.length]} opacity-40`} />
                  <div className="border border-border/60 bg-card/80 backdrop-blur-sm rounded-xl p-5 h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <Briefcase className="h-4 w-4 text-muted-foreground/20" />
                      <div className="h-2.5 w-16 rounded bg-muted-foreground/10 animate-pulse" />
                    </div>
                    <div className="h-4 w-32 rounded bg-muted-foreground/15 animate-pulse mb-1.5" />
                    <div className="h-3 w-20 rounded bg-muted-foreground/10 animate-pulse mb-4" />
                    <div className="flex items-center justify-between mt-auto">
                      <div className="h-3 w-12 rounded bg-brand-ai/10 animate-pulse" />
                      <div className="flex items-center gap-1 text-[10px] text-primary/30">
                        <Play className="h-3 w-3" />
                        Practice
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No sim-ready roles found for this company yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job, i) => {
                const gradient = SPECTRUM_GRADIENTS[i % SPECTRUM_GRADIENTS.length];
                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                    className="relative rounded-xl overflow-hidden group cursor-pointer"
                    onClick={() => job.topTask && onJobSelect({ role: job.title, company: companyName, task: job.topTask })}
                  >
                    <div className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${gradient} opacity-70 group-hover:opacity-100 transition-opacity`} />
                    <div className="border border-border/60 bg-card/80 backdrop-blur-sm rounded-xl p-5 h-full">
                      <div className="flex items-center gap-2 mb-3">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{companyName}</span>
                      </div>
                      <h3 className="text-sm font-bold mb-1 group-hover:text-primary transition-colors">{job.title}</h3>
                      {job.department && (
                        <p className="text-xs text-muted-foreground mb-3">{job.department}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto">
                        {job.augmented_percent != null && (
                          <div className="flex items-center gap-1.5">
                            <Bot className="h-3.5 w-3.5 text-brand-ai" />
                            <span className="text-xs font-mono text-brand-ai">{job.augmented_percent}%</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                          <Play className="h-3 w-3" />
                          Practice
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
