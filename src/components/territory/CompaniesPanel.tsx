/**
 * CompaniesPanel — Browse companies and launch sims from their roles.
 * Lives inside the map sidebar as a tab.
 */
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Building2, Search, Briefcase, Bot, Play, Loader2, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { brandfetchFromName } from "@/lib/logo";
import type { SimLaunchRequest } from "@/components/territory/SkillLaunchCard";

interface Company {
  id: string;
  name: string;
  industry: string | null;
  logo_url: string | null;
  job_count: number;
}

interface CompanyJob {
  id: string;
  title: string;
  department: string | null;
  augmented_percent: number | null;
  topTask: string | null;
}

interface Props {
  onLaunchSim?: (req: SimLaunchRequest) => void;
}

export default function CompaniesPanel({ onLaunchSim }: Props) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  // Load companies with job counts
  useEffect(() => {
    (async () => {
      const { data: stats } = await supabase.rpc("get_company_stats");
      if (!stats) { setLoading(false); return; }

      const companyIds = (stats as any[]).filter(s => s.job_count > 0).map(s => s.company_id);
      if (!companyIds.length) { setLoading(false); return; }

      const { data: cos } = await supabase
        .from("companies")
        .select("id, name, industry, logo_url")
        .in("id", companyIds)
        .order("name");

      if (!cos) { setLoading(false); return; }

      const statsMap = new Map((stats as any[]).map(s => [s.company_id, s]));
      setCompanies(cos.map((c: any) => ({
        ...c,
        job_count: statsMap.get(c.id)?.job_count || 0,
      })));
      setLoading(false);
    })();
  }, []);

  // Load jobs when company selected
  useEffect(() => {
    if (!selected) return;
    setJobsLoading(true);
    setJobs([]);
    (async () => {
      const { data: taskJobs } = await supabase
        .from("job_task_clusters")
        .select("job_id, cluster_name, jobs!inner(id, title, department, augmented_percent)")
        .eq("jobs.company_id", selected.id)
        .order("sort_order", { ascending: true })
        .limit(50);

      if (!taskJobs?.length) { setJobsLoading(false); return; }

      const jobMap = new Map<string, CompanyJob>();
      for (const row of taskJobs) {
        const j = (row as any).jobs;
        if (!j || jobMap.has(j.id)) continue;
        if (jobMap.size >= 12) break;
        jobMap.set(j.id, {
          id: j.id,
          title: j.title,
          department: j.department,
          augmented_percent: j.augmented_percent,
          topTask: row.cluster_name,
        });
      }
      setJobs(Array.from(jobMap.values()));
      setJobsLoading(false);
    })();
  }, [selected]);

  const filtered = useMemo(() => {
    if (!search) return companies;
    const q = search.toLowerCase();
    return companies.filter(c => c.name.toLowerCase().includes(q));
  }, [companies, search]);

  // Detail view for a selected company
  if (selected) {
    const logoUrl = brandfetchFromName(selected.name);
    return (
      <div className="p-3 space-y-3">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <ChevronLeft className="h-3 w-3" /> All Companies
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-muted border border-border/40">
            {logoUrl ? (
              <img src={logoUrl} alt={selected.name} className="w-8 h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <Building2 className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>{selected.name}</h3>
            {selected.industry && <p className="text-[10px] text-muted-foreground">{selected.industry}</p>}
          </div>
        </div>

        <p className="text-[10px] font-mono text-muted-foreground tracking-wide uppercase">
          {selected.job_count} sim-ready roles
        </p>

        {jobsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : jobs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No analyzed roles yet.</p>
        ) : (
          <div className="space-y-1.5">
            {jobs.map((job, i) => (
              <motion.button
                key={job.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-all group hover:brightness-110"
                style={{
                  background: "hsl(var(--surface-stone) / 0.6)",
                  border: "1px solid hsl(var(--filigree) / 0.1)",
                }}
                onClick={() => {
                  if (job.topTask && onLaunchSim) {
                    onLaunchSim({
                      jobTitle: job.title,
                      taskName: job.topTask,
                      company: selected.name,
                      level: 1,
                    });
                  }
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-foreground truncate group-hover:text-primary transition-colors" style={{ fontFamily: "'Cinzel', serif" }}>
                      {job.title}
                    </p>
                    {job.department && (
                      <p className="text-[9px] text-muted-foreground truncate">{job.department}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {job.augmented_percent != null && (
                      <div className="flex items-center gap-1">
                        <Bot className="h-3 w-3 text-brand-ai" />
                        <span className="text-[9px] font-mono text-brand-ai">{job.augmented_percent}%</span>
                      </div>
                    )}
                    <div className="flex items-center gap-0.5 text-[9px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-2.5 w-2.5" />
                    </div>
                  </div>
                </div>
                {job.topTask && (
                  <p className="text-[9px] text-muted-foreground mt-1 truncate">⚔️ {job.topTask}</p>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Company list view
  return (
    <div className="p-3 space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs bg-transparent border-border/40"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          {search ? "No companies match." : "No companies with roles yet."}
        </p>
      ) : (
        <div className="space-y-1">
          {filtered.map((c, i) => {
            const logoUrl = brandfetchFromName(c.name);
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3), duration: 0.2 }}
                onClick={() => setSelected(c)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all hover:brightness-110 group"
                style={{
                  background: "hsl(var(--surface-stone) / 0.4)",
                  border: "1px solid hsl(var(--filigree) / 0.06)",
                }}
              >
                <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center bg-muted/50 shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-foreground truncate group-hover:text-primary transition-colors" style={{ fontFamily: "'Cinzel', serif" }}>
                    {c.name}
                  </p>
                  {c.industry && (
                    <p className="text-[9px] text-muted-foreground truncate">{c.industry}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Briefcase className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[9px] font-mono text-muted-foreground">{c.job_count}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
