import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Briefcase, Search, Loader2, RefreshCw, Download,
  Database, Play, Pause, Brain, ChevronDown, ChevronUp,
  MapPin, CheckCircle2, AlertTriangle, ArrowLeft,
  Globe, Plus, Bug, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

/* ── Types ── */
interface Company {
  id: string;
  name: string;
  industry: string | null;
  logo_url: string | null;
  website: string | null;
  careers_url: string | null;
  detected_ats_platform: string | null;
  employee_range: string | null;
  headquarters: string | null;
  description: string | null;
  company_type: string | null;
  funding_stage: string | null;
  funding_total: string | null;
  founded_year: number | null;
  job_count?: number;
}

interface DbJob {
  id: string;
  title: string;
  department: string | null;
  seniority: string | null;
  location: string | null;
  augmented_percent: number | null;
  automation_risk_percent: number | null;
  new_skills_percent: number | null;
  description: string | null;
  source_url: string | null;
}

interface CompletedSim { task_name: string; job_title: string }

const ATS_PLATFORMS = [
  { id: "greenhouse", label: "Greenhouse" },
  { id: "ashby", label: "Ashby" },
  { id: "lever", label: "Lever" },
  { id: "smartrecruiters", label: "SmartRecruiters" },
  { id: "workday", label: "Workday" },
] as const;

/* ── Logo ── */
function CompanyLogo({ url, name, size = "h-6 w-6" }: { url: string | null; name: string; size?: string }) {
  const [src, setSrc] = useState(url);
  const [tried, setTried] = useState(false);
  useEffect(() => { setSrc(url); setTried(false); }, [url]);
  const cb = `https://logo.clearbit.com/${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
  if (!src && !tried) return <img src={cb} alt="" className={`${size} rounded object-contain bg-background shrink-0`} onError={() => setTried(true)} />;
  if (!src || tried) return <div className={`${size} rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0`}>{name.charAt(0)}</div>;
  return <img src={src} alt="" className={`${size} rounded object-contain bg-background shrink-0`} onError={() => { if (!tried) { setSrc(cb); setTried(true); } else setSrc(null); }} />;
}

/* ══════════════════════════════════════════════════════════════ */
export default function PipelinePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  /* ── Left panel ── */
  const [selectedATS, setSelectedATS] = useState<string>("greenhouse");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [atsCounts, setAtsCounts] = useState<Record<string, number>>({});
  const [companySearch, setCompanySearch] = useState("");
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  /* ── Right panel ── */
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  const [collapsedDepts, setCollapsedDepts] = useState<Set<string>>(new Set());
  const [analyzedJobIds, setAnalyzedJobIds] = useState<Set<string>>(new Set());

  /* ── Queue ── */
  const [queueRunning, setQueueRunning] = useState(false);
  const [queueCurrentJob, setQueueCurrentJob] = useState<string | null>(null);
  const [queueProcessed, setQueueProcessed] = useState(0);
  const [queueMessage, setQueueMessage] = useState<string | null>(null);
  const pauseRef = useRef(false);
  const abortRef = useRef(false);

  /* ── Bulk job sync ── */
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, current: "" });
  const bulkAbortRef = useRef(false);

  /* ── Add Company ── */
  const [addOpen, setAddOpen] = useState(false);
  const [addUrl, setAddUrl] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  /* ── Diagnostics ── */
  const [diagOpen, setDiagOpen] = useState(false);
  const [diagData, setDiagData] = useState<any>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagCompanyName, setDiagCompanyName] = useState("");

  const handleAddCompany = async () => {
    if (!addUrl.trim()) return;
    setAddLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("enrich-company", {
        body: { website: addUrl.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Company added", description: `${data.company.name} enriched and saved.` });
      setAddOpen(false);
      setAddUrl("");
      fetchCompanies();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message || "Could not add company", variant: "destructive" });
    } finally {
      setAddLoading(false);
    }
  };

  /* ── Sims ── */
  const [completedSims, setCompletedSims] = useState<CompletedSim[]>([]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("completed_simulations").select("task_name, job_title").eq("user_id", user.id);
      setCompletedSims(data || []);
    })();
  }, [user]);

  /* ═══════ LEFT LOGIC ═══════ */
  const fetchCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    const { data } = await supabase.from("companies").select("id, name, industry, logo_url, website, careers_url, detected_ats_platform, employee_range, headquarters, description, company_type, funding_stage, funding_total, founded_year").order("name");
    const all = (data as Company[]) || [];
    const counts: Record<string, number> = {};
    all.forEach(c => { const a = c.detected_ats_platform || "unknown"; counts[a] = (counts[a] || 0) + 1; });
    setAtsCounts(counts);

    // Paginate through all jobs to count per company (default limit is 1000)
    const jm = new Map<string, number>();
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data: jobRows } = await supabase.from("jobs").select("company_id").range(from, from + pageSize - 1);
      if (!jobRows || jobRows.length === 0) break;
      jobRows.forEach((j: any) => { if (j.company_id) jm.set(j.company_id, (jm.get(j.company_id) || 0) + 1); });
      if (jobRows.length < pageSize) break;
      from += pageSize;
    }
    setCompanies(all.map(c => ({ ...c, job_count: jm.get(c.id) || 0 })));
    setLoadingCompanies(false);
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const filteredCompanies = useMemo(() => {
    const q = companySearch.trim().toLowerCase();
    // When searching, show across all ATS platforms; otherwise filter by selected ATS
    const af = q ? companies : companies.filter(c => c.detected_ats_platform === selectedATS);
    if (!q) return af;
    return af.filter(c => c.name.toLowerCase().includes(q));
  }, [companies, selectedATS, companySearch]);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const importCompanies = async () => {
    setSyncing("import");
    try {
      const { data, error } = await supabase.functions.invoke("sync-company-jobs", { body: { step: "companies", ats_platform: selectedATS, us_only: true, limit: 200 } });
      if (error) throw error;
      toast({ title: "Import complete", description: `${data.synced} companies imported` });
      await fetchCompanies();
    } catch (err: any) { toast({ title: "Import failed", description: err.message, variant: "destructive" }); }
    finally { setSyncing(null); }
  };

  const bulkSyncAllJobs = async () => {
    const targets = filteredCompanies;
    if (targets.length === 0) return;
    bulkAbortRef.current = false;
    setBulkSyncing(true);
    setBulkProgress({ done: 0, total: targets.length, current: "" });
    let synced = 0;
    for (const co of targets) {
      if (bulkAbortRef.current) break;
      setBulkProgress(p => ({ ...p, current: co.name }));
      try {
        const { data, error } = await supabase.functions.invoke("sync-company-jobs", { body: { step: "jobs", company_id: co.id } });
        if (!error && data?.synced) synced += data.synced;
      } catch {}
      setBulkProgress(p => ({ ...p, done: p.done + 1 }));
    }
    await fetchCompanies();
    setBulkSyncing(false);
    toast({ title: "Bulk sync complete", description: `${synced} total roles synced across ${targets.length} companies` });
  };

  const syncCompanyJobs = async (companyId: string, diagnostic = false) => {
    setSyncing(`jobs-${companyId}`);
    if (diagnostic) {
      setDiagLoading(true);
      setDiagData(null);
      const co = companies.find(c => c.id === companyId);
      setDiagCompanyName(co?.name || companyId);
      setDiagOpen(true);
    }
    try {
      const { data, error } = await supabase.functions.invoke("sync-company-jobs", { body: { step: "jobs", company_id: companyId } });
      if (error) throw error;
      if (diagnostic) {
        setDiagData({ success: true, ...data });
      } else {
        toast({ title: "Sync complete", description: `${data.synced} roles synced` });
      }
      if (companyId === selectedCompanyId) fetchJobs(companyId);
      await fetchCompanies();
    } catch (err: any) {
      if (diagnostic) {
        setDiagData({ success: false, error: err.message });
      } else {
        toast({ title: "Sync failed", description: err.message, variant: "destructive" });
      }
    }
    finally { setSyncing(null); setDiagLoading(false); }
  };

  /* ═══════ RIGHT LOGIC ═══════ */
  const fetchJobs = useCallback(async (cid: string) => {
    setLoadingJobs(true);
    const { data } = await supabase.from("jobs")
      .select("id, title, department, seniority, location, augmented_percent, automation_risk_percent, new_skills_percent, description, source_url")
      .eq("company_id", cid).order("title");
    setJobs((data as DbJob[]) || []);
    setLoadingJobs(false);
  }, []);

  useEffect(() => {
    if (!selectedCompanyId) { setJobs([]); return; }
    fetchJobs(selectedCompanyId);
    setJobSearch(""); setCollapsedDepts(new Set()); setQueueRunning(false); setQueueMessage(null);
  }, [selectedCompanyId, fetchJobs]);

  const refreshAnalyzed = useCallback(async () => {
    if (!selectedCompanyId || jobs.length === 0) return;
    const ids = jobs.map(j => j.id);
    const done = new Set<string>();
    let f = 0;
    while (true) {
      const { data } = await supabase.from("job_task_clusters").select("job_id").in("job_id", ids).range(f, f + 999);
      if (!data || data.length === 0) break;
      data.forEach(d => done.add(d.job_id));
      if (data.length < 1000) break;
      f += 1000;
    }
    setAnalyzedJobIds(done);
  }, [selectedCompanyId, jobs]);

  useEffect(() => { refreshAnalyzed(); }, [refreshAnalyzed]);

  const filteredJobs = useMemo(() => {
    if (!jobSearch.trim()) return jobs;
    const q = jobSearch.toLowerCase();
    return jobs.filter(j => j.title.toLowerCase().includes(q) || j.department?.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q));
  }, [jobs, jobSearch]);

  const departments = useMemo(() => {
    const m = new Map<string, number>();
    jobs.forEach(j => { const d = j.department || "Other"; m.set(d, (m.get(d) || 0) + 1); });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [jobs]);

  const groupedJobs = useMemo(() => {
    const g = new Map<string, DbJob[]>();
    filteredJobs.forEach(j => { const d = j.department || "Other"; if (!g.has(d)) g.set(d, []); g.get(d)!.push(j); });
    g.forEach(l => l.sort((a, b) => { const ar = analyzedJobIds.has(a.id) ? 0 : 1; const br = analyzedJobIds.has(b.id) ? 0 : 1; return ar !== br ? ar - br : a.title.localeCompare(b.title); }));
    return Array.from(g.entries()).sort((a, b) => b[1].filter(j => analyzedJobIds.has(j.id)).length - a[1].filter(j => analyzedJobIds.has(j.id)).length);
  }, [filteredJobs, analyzedJobIds]);

  const pendingCount = useMemo(() => jobs.filter(j => !analyzedJobIds.has(j.id)).length, [jobs, analyzedJobIds]);

  const getJobPct = useCallback((job: DbJob) => {
    const s = completedSims.filter(x => x.job_title === job.title);
    if (!s.length) return 0;
    return Math.min(100, Math.round((new Set(s.map(x => x.task_name)).size / 10) * 100));
  }, [completedSims]);

  /* ── Queue ── */
  const startQueue = useCallback(async () => {
    if (queueRunning || !selectedCompany) return;
    pauseRef.current = false; abortRef.current = false;
    setQueueRunning(true); setQueueMessage(null); setQueueProcessed(0);

    const ids = jobs.map(j => j.id);
    const done = new Set<string>();
    let f = 0;
    while (true) {
      const { data } = await supabase.from("job_task_clusters").select("job_id").in("job_id", ids).range(f, f + 999);
      if (!data || !data.length) break;
      data.forEach(c => done.add(c.job_id));
      if (data.length < 1000) break;
      f += 1000;
    }
    const pending = jobs.filter(j => !done.has(j.id));
    let proc = 0; const fail: string[] = [];

    for (const job of pending) {
      if (abortRef.current) { setQueueMessage("Stopped."); break; }
      if (pauseRef.current) { setQueueMessage(`Paused after ${proc}.`); break; }
      setQueueCurrentJob(job.id);
      try {
        const { data, error } = await supabase.functions.invoke("analyze-role-tasks", {
          body: { jobId: job.id, jobTitle: job.title, company: selectedCompany.name, description: job.description?.slice(0, 3000) || undefined },
        });
        if (error) throw new Error(error.message);
        if (data?.error) {
          if (data.error.includes("429") || data.error.includes("Rate")) {
            setQueueMessage("Rate limited. Waiting 10s…");
            await new Promise(r => setTimeout(r, 10000));
            continue;
          }
          throw new Error(data.error);
        }
        proc++; setQueueProcessed(proc);
        setAnalyzedJobIds(prev => new Set([...prev, job.id]));
        await new Promise(r => setTimeout(r, 1500));
      } catch (err: any) {
        fail.push(job.title);
        setQueueMessage(`${proc} done, ${fail.length} errors`);
        await new Promise(r => setTimeout(r, 3000));
      }
    }
    setQueueCurrentJob(null); setQueueRunning(false);
    if (!pauseRef.current && !abortRef.current) setQueueMessage(null);
    refreshAnalyzed();
  }, [jobs, selectedCompany, queueRunning, refreshAnalyzed]);

  const currentJobTitle = useMemo(() => queueCurrentJob ? jobs.find(j => j.id === queueCurrentJob)?.title || null : null, [queueCurrentJob, jobs]);

  /* ═══════ RENDER ═══════ */
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="px-6 pt-5 pb-3 border-b border-border shrink-0">
        <h1 className="text-xl font-bold text-foreground">Pipeline</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Select ATS → pick company → browse &amp; analyze roles</p>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* ═══════ LEFT: ATS + Companies ═══════ */}
        <div className="w-72 xl:w-80 border-r border-border flex flex-col shrink-0">
          <div className="px-3 pt-3 pb-2 space-y-2 shrink-0">
            <div className="flex flex-wrap gap-1">
              {ATS_PLATFORMS.map(ats => (
                <button
                  key={ats.id}
                  onClick={() => { setSelectedATS(ats.id); setSelectedCompanyId(null); setCompanySearch(""); }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                    selectedATS === ats.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  <Database className="h-2.5 w-2.5" />
                  {ats.label}
                  <span className="text-[9px] opacity-60">({atsCounts[ats.id] || 0})</span>
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={importCompanies} disabled={!!syncing || bulkSyncing} className="flex-1 text-xs h-7 gap-1">
                {syncing === "import" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={bulkSyncing ? () => { bulkAbortRef.current = true; } : bulkSyncAllJobs} disabled={!!syncing} className="flex-1 text-xs h-7 gap-1">
                {bulkSyncing ? <><Loader2 className="h-3 w-3 animate-spin" /> Stop</> : <><RefreshCw className="h-3 w-3" /> Sync All</>}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAddOpen(true)} className="text-xs h-7 gap-1">
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>
            {bulkSyncing && (
              <div className="space-y-1">
                <Progress value={(bulkProgress.done / Math.max(bulkProgress.total, 1)) * 100} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground truncate">
                  {bulkProgress.done}/{bulkProgress.total} — {bulkProgress.current}
                </p>
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input placeholder="Search companies…" value={companySearch} onChange={e => setCompanySearch(e.target.value)} className="pl-7 h-7 text-xs" />
            </div>
          </div>
          <Separator />
          <ScrollArea className="flex-1">
            {loadingCompanies ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Building2 className="h-6 w-6 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">{companySearch ? "No match." : "No companies. Import above."}</p>
              </div>
            ) : (
              <div className="py-1">
                {filteredCompanies.map(c => {
                  const sel = c.id === selectedCompanyId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCompanyId(sel ? null : c.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                        sel ? "bg-primary/8 border-l-2 border-primary" : "hover:bg-muted/50 border-l-2 border-transparent"
                      }`}
                    >
                      <CompanyLogo url={c.logo_url} name={c.name} size="h-7 w-7" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${sel ? "text-primary" : "text-foreground"}`}>
                          {c.name}
                          {(c.job_count || 0) > 0 && <span className="text-muted-foreground font-normal"> · {c.job_count}</span>}
                        </p>
                        {c.industry && <p className="text-[9px] text-muted-foreground truncate mt-0.5">{c.industry}</p>}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={e => { e.stopPropagation(); syncCompanyJobs(c.id); }} disabled={!!syncing} title="Sync jobs">
                          {syncing === `jobs-${c.id}` ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <RefreshCw className="h-2.5 w-2.5 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={e => { e.stopPropagation(); syncCompanyJobs(c.id, true); }} disabled={!!syncing} title="Diagnose sync">
                          <Bug className="h-2.5 w-2.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* ═══════ RIGHT: Roles ═══════ */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedCompanyId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-sm px-4">
                <ArrowLeft className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Select a company to view and analyze its roles</p>
              </div>
            </div>
          ) : (
            <>
              {/* Company header */}
              <div className="px-4 pt-4 pb-3 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                  <CompanyLogo url={selectedCompany?.logo_url || null} name={selectedCompany?.name || ""} size="h-8 w-8" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground truncate">{selectedCompany?.name}</h2>
                      {selectedCompany?.website && (
                        <a href={selectedCompany.website} target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground"><Globe className="h-3.5 w-3.5" /></a>
                      )}
                      {selectedCompany?.careers_url && (
                        <a href={selectedCompany.careers_url} target="_blank" rel="noopener" className="text-xs text-primary hover:underline truncate max-w-[200px]" title={selectedCompany.careers_url}>ATS ↗</a>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-primary"
                        disabled={syncing === "enrich"}
                        onClick={async () => {
                          setSyncing("enrich");
                          try {
                            const { data, error } = await supabase.functions.invoke("enrich-company", {
                              body: {
                                company_id: selectedCompany?.id,
                                website: selectedCompany?.website || undefined,
                                careers_url: selectedCompany?.careers_url || undefined,
                              },
                            });
                            if (error) throw error;
                            if (data?.error) throw new Error(data.error);
                            toast({ title: "Re-enriched", description: `${data.company?.name || "Company"} updated with new data` });
                            fetchCompanies();
                          } catch (err: any) {
                            toast({ title: "Enrich failed", description: err.message, variant: "destructive" });
                          } finally { setSyncing(null); }
                        }}
                      >
                        {syncing === "enrich" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                        Re-enrich
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {selectedCompany?.industry && <span>{selectedCompany.industry}</span>}
                      {selectedCompany?.detected_ats_platform && <><span>·</span><span className="uppercase text-[10px] font-medium">{selectedCompany.detected_ats_platform}</span></>}
                      <span>·</span>
                      <span>{jobs.length} roles</span>
                      <span>·</span>
                      <span className="text-primary">{analyzedJobIds.size} analyzed</span>
                      {selectedCompany?.headquarters && <><span>·</span><span>{selectedCompany.headquarters}</span></>}
                      {selectedCompany?.employee_range && <><span>·</span><span>{selectedCompany.employee_range}</span></>}
                    </div>
                    {selectedCompany?.website && (
                      <a href={selectedCompany.website} target="_blank" rel="noopener" className="text-[10px] text-muted-foreground hover:text-primary truncate block mt-0.5">{selectedCompany.website}</a>
                    )}
                  </div>
                </div>
                {selectedCompany?.description && (
                  <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{selectedCompany.description}</p>
                )}
                {(selectedCompany?.company_type || selectedCompany?.funding_stage || selectedCompany?.funding_total || selectedCompany?.founded_year) && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedCompany.company_type && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{selectedCompany.company_type}</span>
                    )}
                    {selectedCompany.funding_stage && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{selectedCompany.funding_stage}</span>
                    )}
                    {selectedCompany.funding_total && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">Raised {selectedCompany.funding_total}</span>
                    )}
                    {selectedCompany.founded_year && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">Est. {selectedCompany.founded_year}</span>
                    )}
                  </div>
                )}

                {/* Queue bar */}
                {jobs.length > 0 && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs shrink-0">
                      <Brain className="h-3.5 w-3.5 text-primary" />
                      <span className="font-semibold text-foreground">{analyzedJobIds.size}</span>
                      <span className="text-muted-foreground">/ {jobs.length}</span>
                    </div>
                    <Progress value={jobs.length > 0 ? (analyzedJobIds.size / jobs.length) * 100 : 0} className="h-1.5 flex-1" />
                    {queueRunning && currentJobTitle && <span className="text-[10px] text-primary truncate max-w-[140px]">{currentJobTitle}</span>}
                    <div className="flex items-center gap-1 shrink-0">
                      {!queueRunning && pendingCount > 0 && (
                        <Button size="sm" onClick={startQueue} className="gap-1 text-[10px] h-6 px-2">
                          <Play className="h-2.5 w-2.5" />
                          {queueMessage ? "Resume" : "Analyze"} ({pendingCount})
                        </Button>
                      )}
                      {queueRunning && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => { pauseRef.current = true; }} className="text-[10px] h-6 px-2 gap-1"><Pause className="h-2.5 w-2.5" /> Pause</Button>
                          <Button size="sm" variant="ghost" onClick={() => { abortRef.current = true; pauseRef.current = true; }} className="text-[10px] h-6 px-2 text-destructive">Stop</Button>
                        </>
                      )}
                      {!queueRunning && pendingCount === 0 && jobs.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-primary"><CheckCircle2 className="h-3 w-3" /> All analyzed</span>
                      )}
                    </div>
                  </div>
                )}
                {queueMessage && !queueRunning && (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-500 bg-amber-500/5 rounded px-2 py-1 mt-2">
                    <AlertTriangle className="h-2.5 w-2.5 shrink-0" /><span>{queueMessage}</span>
                  </div>
                )}

                {/* Search + dept pills */}
                {jobs.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input placeholder={`Search ${jobs.length} roles…`} value={jobSearch} onChange={e => setJobSearch(e.target.value)} className="pl-7 h-7 text-xs w-48" />
                    </div>
                    {departments.slice(0, 8).map(([dept, count]) => (
                      <button
                        key={dept}
                        onClick={() => setJobSearch(jobSearch === dept ? "" : dept)}
                        className={`rounded-full px-2 py-0.5 text-[9px] font-medium border transition-colors ${
                          jobSearch === dept ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/30"
                        }`}
                      >
                        {dept} ({count})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Role grid */}
              <ScrollArea className="flex-1">
                <div className="p-4">
                  {loadingJobs ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-14 rounded-lg border border-border bg-card animate-pulse" />)}
                    </div>
                  ) : jobs.length === 0 ? (
                    <div className="text-center py-12">
                      <Briefcase className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No roles yet.</p>
                      <Button variant="outline" size="sm" className="mt-2 text-xs gap-1" onClick={() => selectedCompanyId && syncCompanyJobs(selectedCompanyId)} disabled={!!syncing}>
                        <RefreshCw className="h-3 w-3" /> Sync Roles
                      </Button>
                    </div>
                  ) : groupedJobs.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No roles match "{jobSearch}"</p>
                      <Button variant="ghost" size="sm" onClick={() => setJobSearch("")} className="mt-1 text-xs">Clear</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {groupedJobs.map(([dept, deptJobs]) => {
                        const collapsed = collapsedDepts.has(dept);
                        const ready = deptJobs.filter(j => analyzedJobIds.has(j.id)).length;
                        return (
                          <div key={dept}>
                            <button
                              onClick={() => setCollapsedDepts(prev => { const n = new Set(prev); n.has(dept) ? n.delete(dept) : n.add(dept); return n; })}
                              className="w-full flex items-center gap-2 py-1 px-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {collapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                              <Briefcase className="h-3 w-3" />
                              <span>{dept}</span>
                              <span className="text-[10px] font-normal">({deptJobs.length})</span>
                              {ready > 0 && <Badge variant="secondary" className="ml-auto text-[9px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0">{ready} ready</Badge>}
                            </button>
                            <AnimatePresence>
                              {!collapsed && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 pl-1 pt-1">
                                    {deptJobs.slice(0, 30).map(job => {
                                      const isReady = analyzedJobIds.has(job.id);
                                      const isAn = queueCurrentJob === job.id;
                                      const pct = getJobPct(job);
                                      return (
                                        <motion.div key={job.id} whileHover={{ scale: 1.01 }} transition={{ duration: 0.1 }}>
                                          <button
                                            onClick={() => navigate(`/learning-path?jobId=${job.id}`)}
                                            className={`w-full text-left p-2.5 rounded-lg border transition-all duration-200 ${
                                              isAn ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : isReady ? "border-primary/20 bg-card hover:border-primary/30" : "border-border bg-card hover:border-primary/30"
                                            }`}
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-foreground text-xs leading-tight truncate">{job.title}</h3>
                                                {job.location && <span className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5"><MapPin className="h-2 w-2" />{job.location}</span>}
                                              </div>
                                              <div className="flex items-center gap-1 shrink-0">
                                                {pct > 0 && (
                                                  <svg width="18" height="18" className="-rotate-90">
                                                    <circle cx="9" cy="9" r="6.5" fill="none" strokeWidth="1.5" className="stroke-muted/30" />
                                                    <circle cx="9" cy="9" r="6.5" fill="none" strokeWidth="1.5" className="stroke-primary" strokeDasharray={2 * Math.PI * 6.5} strokeDashoffset={2 * Math.PI * 6.5 - (pct / 100) * 2 * Math.PI * 6.5} strokeLinecap="round" />
                                                  </svg>
                                                )}
                                                {isAn ? <Loader2 className="h-3 w-3 animate-spin text-primary" /> : (
                                                  <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3.5 ${isReady ? "bg-primary/10 text-primary border-primary/20" : "bg-muted/50 text-muted-foreground border-border"}`}>
                                                    {isReady ? "Ready" : "—"}
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          </button>
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                  {deptJobs.length > 30 && <p className="text-center text-[10px] text-muted-foreground py-1">+{deptJobs.length - 30} more</p>}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </div>
      {/* Add Company Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Company</DialogTitle>
            <DialogDescription>Enter a website URL — we'll scrape it and auto-fill company details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g. stripe.com"
                value={addUrl}
                onChange={e => setAddUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !addLoading && handleAddCompany()}
                className="pl-9"
                disabled={addLoading}
              />
            </div>
            <Button onClick={handleAddCompany} disabled={addLoading || !addUrl.trim()} className="w-full gap-2">
              {addLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Enriching…</> : <><Plus className="h-4 w-4" /> Add & Enrich</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diagnostic Dialog */}
      <Dialog open={diagOpen} onOpenChange={setDiagOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-4 w-4" /> Sync Diagnostic — {diagCompanyName}
            </DialogTitle>
            <DialogDescription>Raw response from the sync-company-jobs edge function.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {diagLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Calling sim-api…</span>
              </div>
            ) : diagData ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {diagData.success ? (
                    <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Success</Badge>
                  ) : (
                    <Badge variant="destructive">Failed</Badge>
                  )}
                  {diagData.synced != null && <span className="text-sm text-muted-foreground">{diagData.synced} roles synced</span>}
                  {diagData.hasMore && <Badge variant="outline" className="text-xs">hasMore: true</Badge>}
                </div>
                <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-auto max-h-[400px] whitespace-pre-wrap break-all font-mono text-foreground border border-border">
                  {JSON.stringify(diagData, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
