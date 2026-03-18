import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Briefcase, Search, Loader2, RefreshCw, Download,
  Database, Play, Pause, Brain, ChevronDown, ChevronUp,
  MapPin, CheckCircle2, AlertTriangle, ArrowRight,
  Globe, Plus, Bug, Sparkles, Telescope, Flag,
  X, FileText, Clock, Zap, List, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
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
  priority_score?: number;
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

interface ImportFlag {
  id: string;
  flag_type: string;
  severity: string;
  status: string;
  company_name: string | null;
  suggested_action: string | null;
  created_at: string;
  details: any;
}

interface ImportLog {
  id: string;
  source: string;
  action: string;
  result_status: string;
  items_processed: number;
  items_created: number;
  items_updated: number;
  items_skipped: number;
  flags_raised: number;
  duration_ms: number | null;
  created_at: string;
}

/* ── Priority Scoring ── */
const FUNDING_SCORES: Record<string, number> = {
  "seed": 15, "pre-seed": 12, "series a": 25, "series b": 30, "series c": 25,
  "series d": 20, "series e": 15, "growth": 20, "late stage": 15,
  "ipo": 10, "public": 5, "bootstrapped": 8, "acquired": 5,
};
const EMPLOYEE_SCORES: Record<string, number> = {
  "1-10": 5, "11-50": 15, "51-200": 25, "201-500": 20,
  "501-1000": 15, "1001-5000": 10, "5001-10000": 8, "10000+": 5,
};

function computePriorityScore(company: Company, industryCounts: Map<string, number>, totalCompanies: number): number {
  let score = 0;
  const roles = company.job_count || 0;
  score += Math.min(30, roles * 0.5);
  const funding = (company.funding_stage || "").toLowerCase().trim();
  score += FUNDING_SCORES[funding] || 0;
  const size = (company.employee_range || "").trim();
  score += EMPLOYEE_SCORES[size] || 0;
  const industry = (company.industry || "Other").toLowerCase();
  const industryShare = (industryCounts.get(industry) || 1) / Math.max(totalCompanies, 1);
  if (industryShare < 0.05) score += 25;
  else if (industryShare < 0.10) score += 18;
  else if (industryShare < 0.15) score += 10;
  else if (industryShare < 0.20) score += 5;
  return Math.round(score);
}

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

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  error: "bg-destructive/10 text-destructive border-destructive/20",
};

/* ══════════════════════════════════════════════════════════════ */
export default function PipelinePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("discover");

  /* ── Core data ── */
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [atsCounts, setAtsCounts] = useState<Record<string, number>>({});

  /* ── Flags drawer ── */
  const [flagsOpen, setFlagsOpen] = useState(false);
  const [flags, setFlags] = useState<ImportFlag[]>([]);
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loadingFlags, setLoadingFlags] = useState(false);

  /* ═══════ DISCOVER STATE ═══════ */
  const [apolloKeywords, setApolloKeywords] = useState("");
  const [apolloName, setApolloName] = useState("");
  const [apolloLocation, setApolloLocation] = useState("United States");
  const [apolloSize, setApolloSize] = useState("51,200");
  const [apolloFunding, setApolloFunding] = useState("");
  const [apolloResults, setApolloResults] = useState<any[]>([]);
  const [apolloLoading, setApolloLoading] = useState(false);
  const [apolloImporting, setApolloImporting] = useState(false);
  const [apolloPagination, setApolloPagination] = useState<{ page: number; total_entries: number; total_pages: number }>({ page: 1, total_entries: 0, total_pages: 0 });
  const [apolloSelected, setApolloSelected] = useState<Set<number>>(new Set());
  const [apolloBulkProgress, setApolloBulkProgress] = useState<{ current: number; total: number; imported: number } | null>(null);
  const apolloBulkAbort = useRef(false);

  /* ── Add Company ── */
  const [addOpen, setAddOpen] = useState(false);
  const [addUrl, setAddUrl] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  /* ═══════ SYNC STATE ═══════ */
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncAllRunning, setSyncAllRunning] = useState(false);
  const [syncAllProgress, setSyncAllProgress] = useState({ done: 0, total: 0, current: "", synced: 0 });
  const syncAbortRef = useRef(false);
  const [syncStreamOpen, setSyncStreamOpen] = useState(false);
  const [syncStreamEntries, setSyncStreamEntries] = useState<Array<{
    company: string; logo: string | null; platform: string | null;
    status: "syncing" | "success" | "failed" | "skipped"; jobCount: number;
    source?: string; duration?: number; timestamp: number;
  }>>([]);
  const syncStreamEndRef = useRef<HTMLDivElement>(null);

  /* ═══════ ANALYZE STATE ═══════ */
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  const [collapsedDepts, setCollapsedDepts] = useState<Set<string>>(new Set());
  const [analyzedJobIds, setAnalyzedJobIds] = useState<Set<string>>(new Set());
  const [queueRunning, setQueueRunning] = useState(false);
  const [queueCurrentJob, setQueueCurrentJob] = useState<string | null>(null);
  const [queueProcessed, setQueueProcessed] = useState(0);
  const [queueMessage, setQueueMessage] = useState<string | null>(null);
  const pauseRef = useRef(false);
  const abortRef = useRef(false);

  /* ── Bulk Layer 1 scoring ── */
  const [bulkScoring, setBulkScoring] = useState(false);
  const [bulkScoreResult, setBulkScoreResult] = useState<string | null>(null);

  /* ── Diagnostics ── */
  const [diagOpen, setDiagOpen] = useState(false);
  const [diagData, setDiagData] = useState<any>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagCompanyName, setDiagCompanyName] = useState("");

  /* ═══════ COMPANIES BROWSER STATE ═══════ */
  const [compSearch, setCompSearch] = useState("");
  const [compAtsFilter, setCompAtsFilter] = useState("");
  const [compIndustryFilter, setCompIndustryFilter] = useState("");
  const [compFundingFilter, setCompFundingFilter] = useState("");

  /* ═══════ DATA FETCHING ═══════ */
  const fetchCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    let allCompanies: Company[] = [];
    let compFrom = 0;
    const compPageSize = 1000;
    while (true) {
      const { data: batch } = await supabase.from("companies").select("id, name, industry, logo_url, website, careers_url, detected_ats_platform, employee_range, headquarters, description, company_type, funding_stage, funding_total, founded_year").order("name").range(compFrom, compFrom + compPageSize - 1);
      if (!batch || batch.length === 0) break;
      allCompanies = allCompanies.concat(batch as Company[]);
      if (batch.length < compPageSize) break;
      compFrom += compPageSize;
    }

    const counts: Record<string, number> = {};
    allCompanies.forEach(c => { const a = c.detected_ats_platform || "unknown"; counts[a] = (counts[a] || 0) + 1; });
    setAtsCounts(counts);

    // Get job counts per company — paginate to avoid 1000-row limit
    const jm = new Map<string, number>();
    const companyIds = allCompanies.map(c => c.id);
    for (let i = 0; i < companyIds.length; i += 100) {
      const batch = companyIds.slice(i, i + 100);
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data: jobRows } = await supabase
          .from("jobs")
          .select("company_id")
          .in("company_id", batch)
          .range(from, from + pageSize - 1);
        if (!jobRows || jobRows.length === 0) break;
        jobRows.forEach((j: any) => { if (j.company_id) jm.set(j.company_id, (jm.get(j.company_id) || 0) + 1); });
        if (jobRows.length < pageSize) break;
        from += pageSize;
      }
    }

    const industryCounts = new Map<string, number>();
    allCompanies.forEach(c => {
      const ind = (c.industry || "Other").toLowerCase();
      industryCounts.set(ind, (industryCounts.get(ind) || 0) + 1);
    });

    const scored = allCompanies.map(c => {
      const withJobs = { ...c, job_count: jm.get(c.id) || 0 };
      return { ...withJobs, priority_score: computePriorityScore(withJobs, industryCounts, allCompanies.length) };
    });
    setCompanies(scored);
    setLoadingCompanies(false);
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const fetchFlagsAndLogs = useCallback(async () => {
    setLoadingFlags(true);
    const [{ data: f }, { data: l }] = await Promise.all([
      supabase.from("import_flags").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("import_log").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setFlags((f || []) as ImportFlag[]);
    setLogs((l || []) as ImportLog[]);
    setLoadingFlags(false);
  }, []);

  /* ═══════ COMPUTED STATS ═══════ */
  const stats = useMemo(() => {
    const totalCompanies = companies.length;
    const withATS = companies.filter(c => c.detected_ats_platform && c.detected_ats_platform !== "unknown").length;
    const withJobs = companies.filter(c => (c.job_count || 0) > 0).length;
    const noJobs = companies.filter(c => (c.job_count || 0) === 0 && c.detected_ats_platform && c.detected_ats_platform !== "unknown").length;
    const totalJobs = companies.reduce((sum, c) => sum + (c.job_count || 0), 0);
    const openFlags = flags.filter(f => f.status === "open").length;
    return { totalCompanies, withATS, withJobs, noJobs, totalJobs, openFlags };
  }, [companies, flags]);

  /* ═══════ COMPANIES BROWSER COMPUTED ═══════ */
  const uniqueIndustries = useMemo(() => {
    const set = new Set<string>();
    companies.forEach(c => { if (c.industry) set.add(c.industry); });
    return Array.from(set).sort();
  }, [companies]);

  const uniqueAts = useMemo(() => {
    const set = new Set<string>();
    companies.forEach(c => { if (c.detected_ats_platform && c.detected_ats_platform !== "unknown") set.add(c.detected_ats_platform); });
    return Array.from(set).sort();
  }, [companies]);

  const uniqueFunding = useMemo(() => {
    const set = new Set<string>();
    companies.forEach(c => { if (c.funding_stage) set.add(c.funding_stage); });
    return Array.from(set).sort();
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    let list = companies;
    if (compSearch) {
      const q = compSearch.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.industry?.toLowerCase().includes(q) || c.headquarters?.toLowerCase().includes(q));
    }
    if (compAtsFilter) list = list.filter(c => c.detected_ats_platform === compAtsFilter);
    if (compIndustryFilter) list = list.filter(c => c.industry === compIndustryFilter);
    if (compFundingFilter) list = list.filter(c => c.funding_stage === compFundingFilter);
    return list.sort((a, b) => (b.job_count || 0) - (a.job_count || 0));
  }, [companies, compSearch, compAtsFilter, compIndustryFilter, compFundingFilter]);

  /* ═══════ DISCOVER LOGIC ═══════ */
  const buildApolloBody = (pg = 1): Record<string, unknown> => {
    const body: Record<string, unknown> = { page: pg, per_page: 25, import_results: false };
    if (apolloLocation.trim()) body.organization_locations = [apolloLocation.trim()];
    if (apolloSize) body.organization_num_employees_ranges = [apolloSize];
    if (apolloKeywords.trim()) body.q_organization_keyword_tags = apolloKeywords.split(",").map(s => s.trim()).filter(Boolean);
    if (apolloName.trim()) body.q_organization_name = apolloName.trim();
    if (apolloFunding) body.latest_funding_stage = apolloFunding;
    return body;
  };

  const resolveInvokeErrorMessage = async (error: any, fallback: string) => {
    try {
      const payload = await error?.context?.json?.();
      if (payload?.error && payload?.details) return `${payload.error} ${payload.details}`;
      if (payload?.error) return payload.error;
    } catch {
      // Fall through to generic message handling
    }

    if (typeof error?.message === "string" && !error.message.includes("non-2xx")) {
      return error.message;
    }

    return fallback;
  };

  const handleApolloSearch = async (pg = 1) => {
    setApolloLoading(true);
    setApolloSelected(new Set());
    try {
      const body = buildApolloBody(pg);
      const { data, error } = await supabase.functions.invoke("search-apollo", { body });
      if (error) throw error;
      if (data?.error) {
        const details = data?.details ? ` ${data.details}` : "";
        throw new Error(`${data.error}${details}`.trim());
      }
      setApolloResults(data.companies || []);
      setApolloPagination(data.pagination || { page: pg, total_entries: 0, total_pages: 0 });
    } catch (err: any) {
      const message = await resolveInvokeErrorMessage(err, "Apollo search is unavailable for this API key/plan.");
      toast({ title: "Apollo search failed", description: message, variant: "destructive" });
    } finally {
      setApolloLoading(false);
    }
  };

  const handleApolloImport = async () => {
    setApolloImporting(true);
    try {
      const selectedCompanies = apolloResults.filter((_, i) => apolloSelected.has(i));
      let imported = 0;
      for (const co of selectedCompanies) {
        const website = co.website || co.domain;
        if (!website) continue;
        try {
          await supabase.functions.invoke("enrich-company", { body: { website } });
          imported++;
        } catch { /* skip */ }
      }
      toast({ title: "Import complete", description: `${imported} companies enriched and saved.` });
      fetchCompanies();
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setApolloImporting(false);
    }
  };

  const handleApolloBulkImport = async () => {
    apolloBulkAbort.current = false;
    setApolloImporting(true);
    const maxPages = Math.min(apolloPagination.total_pages, 20);
    setApolloBulkProgress({ current: 0, total: maxPages, imported: 0 });
    let totalImported = 0;
    try {
      for (let pg = 1; pg <= maxPages; pg++) {
        if (apolloBulkAbort.current) break;
        setApolloBulkProgress(prev => prev ? { ...prev, current: pg } : null);
        const body = { ...buildApolloBody(pg), import_results: true };
        const { data, error } = await supabase.functions.invoke("search-apollo", { body });
        if (error) throw error;
        if (data?.error) {
          const details = data?.details ? ` ${data.details}` : "";
          throw new Error(`${data.error}${details}`.trim());
        }
        totalImported += (data.stats?.created || 0) + (data.stats?.updated || 0);
        setApolloBulkProgress(prev => prev ? { ...prev, imported: totalImported } : null);
      }
      toast({ title: "Bulk discovery complete", description: `${totalImported} companies imported.` });
      fetchCompanies();
    } catch (err: any) {
      const message = await resolveInvokeErrorMessage(err, "Apollo bulk import is unavailable for this API key/plan.");
      toast({ title: "Bulk import failed", description: message, variant: "destructive" });
    } finally {
      setApolloImporting(false);
      setApolloBulkProgress(null);
    }
  };

  const handleAddCompany = async () => {
    if (!addUrl.trim()) return;
    setAddLoading(true);
    try {
      const website = addUrl.trim().startsWith("http") ? addUrl.trim() : `https://${addUrl.trim()}`;
      const { data, error } = await supabase.functions.invoke("enrich-company", { body: { website } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Company added", description: data.company?.name || "Enriched successfully" });
      setAddOpen(false);
      setAddUrl("");
      fetchCompanies();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setAddLoading(false);
    }
  };

  /* ═══════ SYNC LOGIC ═══════ */
  // Companies needing sync: have ATS detected but 0 jobs
  const SUPPORTED_ATS = new Set(["ashby", "greenhouse", "lever"]);
  const unsyncedCompanies = useMemo(() =>
    companies.filter(c => c.detected_ats_platform && SUPPORTED_ATS.has(c.detected_ats_platform) && (c.job_count || 0) === 0)
      .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0)),
  [companies]);

  const syncAllNew = async () => {
    const targets = unsyncedCompanies;
    if (targets.length === 0) {
      toast({ title: "Nothing to sync", description: "All companies with detected ATS already have jobs." });
      return;
    }
    syncAbortRef.current = false;
    setSyncAllRunning(true);
    setSyncStreamEntries([]);
    setSyncStreamOpen(true);
    setSyncAllProgress({ done: 0, total: targets.length, current: "", synced: 0 });
    let totalSynced = 0;
    for (const co of targets) {
      if (syncAbortRef.current) break;
      setSyncAllProgress(p => ({ ...p, current: co.name }));
      // Add "syncing" entry
      const entryTs = Date.now();
      setSyncStreamEntries(prev => [...prev, {
        company: co.name, logo: co.logo_url, platform: co.detected_ats_platform,
        status: "syncing", jobCount: 0, timestamp: entryTs,
      }]);
      setTimeout(() => syncStreamEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      const startMs = Date.now();
      try {
        const { data, error } = await supabase.functions.invoke("sync-company-jobs", { body: { step: "jobs", company_id: co.id } });
        const dur = Date.now() - startMs;
        if (!error && data?.synced) {
          totalSynced += data.synced;
          setSyncStreamEntries(prev => prev.map(e => e.timestamp === entryTs ? {
            ...e, status: data.synced > 0 ? "success" : "skipped",
            jobCount: data.synced, source: data.source, duration: dur,
          } : e));
        } else {
          setSyncStreamEntries(prev => prev.map(e => e.timestamp === entryTs ? {
            ...e, status: "skipped", jobCount: 0, source: data?.source, duration: dur,
          } : e));
        }
      } catch {
        setSyncStreamEntries(prev => prev.map(e => e.timestamp === entryTs ? {
          ...e, status: "failed", duration: Date.now() - startMs,
        } : e));
      }
      setSyncAllProgress(p => ({ ...p, done: p.done + 1, synced: totalSynced }));
      setTimeout(() => syncStreamEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
    await fetchCompanies();
    setSyncAllRunning(false);
    toast({ title: "Sync complete", description: `${totalSynced} roles synced across ${targets.length} companies.` });
  };

  const syncSingleCompany = async (companyId: string, diagnostic = false) => {
    setSyncing(`jobs-${companyId}`);
    if (diagnostic) {
      setDiagLoading(true); setDiagData(null);
      const co = companies.find(c => c.id === companyId);
      setDiagCompanyName(co?.name || companyId);
      setDiagOpen(true);
    }
    try {
      const { data, error } = await supabase.functions.invoke("sync-company-jobs", { body: { step: "jobs", company_id: companyId } });
      if (error) throw error;
      if (diagnostic) { setDiagData({ success: true, ...data }); }
      else { toast({ title: "Sync complete", description: `${data.synced} roles synced` }); }
      if (companyId === selectedCompanyId) fetchJobs(companyId);
      await fetchCompanies();
    } catch (err: any) {
      if (diagnostic) { setDiagData({ success: false, error: err.message }); }
      else { toast({ title: "Sync failed", description: err.message, variant: "destructive" }); }
    } finally {
      setSyncing(null); setDiagLoading(false);
    }
  };

  /* ═══════ ANALYZE LOGIC ═══════ */
  const companiesWithJobs = useMemo(() =>
    companies.filter(c => (c.job_count || 0) > 0).sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0)),
  [companies]);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const fetchJobs = useCallback(async (cid: string) => {
    setLoadingJobs(true);
    const { data } = await supabase.from("jobs")
      .select("id, title, department, seniority, location, augmented_percent, automation_risk_percent, new_skills_percent, description, source_url")
      .eq("company_id", cid).order("title");
    setJobs((data as DbJob[]) || []);
    setLoadingJobs(false);
  }, []);

  useEffect(() => {
    if (!selectedCompanyId) { setJobs([]); setAnalyzedJobIds(new Set()); return; }
    setJobs([]);
    setAnalyzedJobIds(new Set());
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
    let proc = 0;
    const fail: string[] = [];

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
      } catch {
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

  /* ═══════ FLAGS ═══════ */
  const resolveFlag = async (flagId: string, note: string) => {
    await supabase.from("import_flags").update({ status: "resolved", resolution_note: note, resolved_at: new Date().toISOString() }).eq("id", flagId);
    setFlags(prev => prev.map(f => f.id === flagId ? { ...f, status: "resolved" } : f));
  };

  /* ═══════ RENDER ═══════ */
  return (
    <div className="flex flex-col h-[calc(100vh-104px)]">
      {/* ── Header with stage summary ── */}
      <div className="px-6 pt-5 pb-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Pipeline</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Discover → Sync → Analyze</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={() => { fetchFlagsAndLogs(); setFlagsOpen(true); }}>
              <Flag className="h-3 w-3" />
              Flags {stats.openFlags > 0 && <Badge variant="destructive" className="h-4 text-[9px] px-1 ml-0.5">{stats.openFlags}</Badge>}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={fetchCompanies} disabled={loadingCompanies}>
              <RefreshCw className={`h-3 w-3 ${loadingCompanies ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Stage cards */}
        <div className="grid grid-cols-4 gap-3">
          <button onClick={() => setActiveTab("discover")} className={`rounded-lg border p-3 text-left transition-all ${activeTab === "discover" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
            <div className="flex items-center gap-2 mb-1">
              <Telescope className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">Discover</span>
            </div>
            <p className="text-lg font-bold text-foreground">{stats.totalCompanies}</p>
            <p className="text-[10px] text-muted-foreground">companies · {Object.keys(atsCounts).filter(k => k !== "unknown").length} ATS platforms</p>
          </button>

          <button onClick={() => setActiveTab("sync")} className={`rounded-lg border p-3 text-left transition-all ${activeTab === "sync" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">Sync</span>
              {stats.noJobs > 0 && <Badge variant="secondary" className="h-4 text-[9px] px-1">{stats.noJobs} pending</Badge>}
            </div>
            <p className="text-lg font-bold text-foreground">{stats.totalJobs.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">roles across {stats.withJobs} companies</p>
          </button>

          <button onClick={() => setActiveTab("analyze")} className={`rounded-lg border p-3 text-left transition-all ${activeTab === "analyze" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">Analyze</span>
            </div>
            <p className="text-lg font-bold text-foreground">{stats.withJobs}</p>
            <p className="text-[10px] text-muted-foreground">companies with roles ready</p>
          </button>

          <button onClick={() => setActiveTab("companies")} className={`rounded-lg border p-3 text-left transition-all ${activeTab === "companies" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
            <div className="flex items-center gap-2 mb-1">
              <List className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">Companies</span>
            </div>
            <p className="text-lg font-bold text-foreground">{stats.totalCompanies.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">browse full library</p>
          </button>
        </div>
      </div>

      {/* ── Tabbed content ── */}
      <div className="flex-1 flex flex-col min-h-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-6 mt-3 w-fit">
          <TabsTrigger value="discover" className="text-xs gap-1"><Telescope className="h-3 w-3" /> Discover</TabsTrigger>
          <TabsTrigger value="sync" className="text-xs gap-1"><RefreshCw className="h-3 w-3" /> Sync</TabsTrigger>
          <TabsTrigger value="analyze" className="text-xs gap-1"><Brain className="h-3 w-3" /> Analyze</TabsTrigger>
          <TabsTrigger value="companies" className="text-xs gap-1"><List className="h-3 w-3" /> Companies</TabsTrigger>
        </TabsList>

        {/* ═══════ TAB: DISCOVER ═══════ */}
        <TabsContent value="discover" className="flex-1 min-h-0 m-0 px-6 py-4">
          <div className="flex gap-6 h-full">
            {/* Apollo filters */}
            <div className="w-80 shrink-0 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Apollo Bulk Discovery</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Keywords (comma-separated)</label>
                  <Input placeholder="e.g. AI, fintech, SaaS" value={apolloKeywords} onChange={e => setApolloKeywords(e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Company Name (optional)</label>
                  <Input placeholder="e.g. Stripe" value={apolloName} onChange={e => setApolloName(e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Location</label>
                  <Input placeholder="e.g. United States" value={apolloLocation} onChange={e => setApolloLocation(e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Employee Range</label>
                  <select value={apolloSize} onChange={e => setApolloSize(e.target.value)} className="w-full h-8 text-xs rounded-md border border-input bg-background px-2">
                    <option value="">Any</option>
                    <option value="1,10">1-10</option>
                    <option value="11,50">11-50</option>
                    <option value="51,200">51-200</option>
                    <option value="201,500">201-500</option>
                    <option value="501,1000">501-1,000</option>
                    <option value="1001,5000">1,001-5,000</option>
                    <option value="5001,10000">5,001-10,000</option>
                    <option value="10001,1000000">10,000+</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Funding Stage</label>
                  <select value={apolloFunding} onChange={e => setApolloFunding(e.target.value)} className="w-full h-8 text-xs rounded-md border border-input bg-background px-2">
                    <option value="">Any</option>
                    <option value="pre_seed">Pre-Seed</option>
                    <option value="seed">Seed</option>
                    <option value="series_a">Series A</option>
                    <option value="series_b">Series B</option>
                    <option value="series_c">Series C</option>
                    <option value="series_d">Series D</option>
                    <option value="series_e">Series E+</option>
                    <option value="growth">Growth</option>
                    <option value="ipo">IPO</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleApolloSearch(1)} disabled={apolloLoading || apolloImporting} size="sm" className="gap-1.5 flex-1">
                  {apolloLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                  Preview
                </Button>
                {apolloPagination.total_entries > 0 && !apolloBulkProgress && (
                  <Button onClick={handleApolloBulkImport} disabled={apolloImporting} size="sm" variant="default" className="gap-1.5 flex-1">
                    <Download className="h-3 w-3" />
                    Import All ({Math.min(apolloPagination.total_entries, 500).toLocaleString()})
                  </Button>
                )}
              </div>

              {apolloBulkProgress && (
                <div className="space-y-1.5 rounded-md border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">Page {apolloBulkProgress.current}/{apolloBulkProgress.total}</span>
                    <span className="text-muted-foreground">{apolloBulkProgress.imported} saved</span>
                  </div>
                  <Progress value={(apolloBulkProgress.current / apolloBulkProgress.total) * 100} className="h-1.5" />
                  <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => { apolloBulkAbort.current = true; }}>
                    <Pause className="h-3 w-3 mr-1" /> Stop
                  </Button>
                </div>
              )}

              <Separator />
              <Button variant="outline" size="sm" onClick={() => setAddOpen(true)} className="w-full text-xs gap-1.5">
                <Plus className="h-3 w-3" /> Add Single Company
              </Button>
            </div>

            {/* Results preview */}
            <div className="flex-1 min-w-0 flex flex-col">
              <ScrollArea className="flex-1">
                {apolloResults.length > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <p className="text-xs text-muted-foreground">
                        {apolloPagination.total_entries.toLocaleString()} results · Page {apolloPagination.page}/{apolloPagination.total_pages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => {
                          if (apolloSelected.size === apolloResults.length) setApolloSelected(new Set());
                          else setApolloSelected(new Set(apolloResults.map((_, i) => i)));
                        }}>
                          {apolloSelected.size === apolloResults.length ? "Deselect all" : "Select all"}
                        </Button>
                        {apolloSelected.size > 0 && (
                          <Button onClick={handleApolloImport} disabled={apolloImporting} size="sm" className="h-6 text-xs gap-1">
                            {apolloImporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                            Import {apolloSelected.size}
                          </Button>
                        )}
                      </div>
                    </div>
                    {apolloResults.map((co, idx) => {
                      const selected = apolloSelected.has(idx);
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            const next = new Set(apolloSelected);
                            selected ? next.delete(idx) : next.add(idx);
                            setApolloSelected(next);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-colors ${
                            selected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50 border border-transparent"
                          }`}
                        >
                          {co.logo_url ? (
                            <img src={co.logo_url} alt="" className="h-7 w-7 rounded object-contain bg-muted shrink-0" />
                          ) : (
                            <div className="h-7 w-7 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">{co.name?.charAt(0)}</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{co.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {[co.industry, co.headquarters, co.employee_range].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-0.5 shrink-0">
                            {co.funding_stage && <Badge variant="outline" className="text-[8px] h-4">{co.funding_stage}</Badge>}
                            {co.funding_total && <span className="text-[9px] text-muted-foreground">{co.funding_total}</span>}
                          </div>
                        </button>
                      );
                    })}
                    <div className="flex items-center justify-center gap-2 pt-3">
                      <Button variant="outline" size="sm" className="h-6 text-xs" disabled={apolloPagination.page <= 1 || apolloLoading} onClick={() => handleApolloSearch(apolloPagination.page - 1)}>Prev</Button>
                      <span className="text-[10px] text-muted-foreground">Page {apolloPagination.page}</span>
                      <Button variant="outline" size="sm" className="h-6 text-xs" disabled={apolloPagination.page >= apolloPagination.total_pages || apolloLoading} onClick={() => handleApolloSearch(apolloPagination.page + 1)}>Next</Button>
                    </div>
                  </div>
                ) : !apolloLoading ? (
                  <div className="flex-1 flex items-center justify-center py-16">
                    <div className="text-center">
                      <Telescope className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Set filters and click Preview to discover companies</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Or use "Import All" to bulk-import across all pages</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        {/* ═══════ TAB: SYNC ═══════ */}
        <TabsContent value="sync" className="flex-1 min-h-0 m-0 px-6 py-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Auto-Sync Jobs</h3>
              <p className="text-xs text-muted-foreground">{unsyncedCompanies.length} companies with detected ATS need job sync</p>
            </div>
            <div className="flex items-center gap-2">
              {!syncAllRunning ? (
                <Button onClick={syncAllNew} disabled={unsyncedCompanies.length === 0} size="sm" className="gap-1.5">
                  <Zap className="h-3 w-3" />
                  Sync All New ({unsyncedCompanies.length})
                </Button>
              ) : (
                <Button onClick={() => { syncAbortRef.current = true; }} variant="outline" size="sm" className="gap-1.5">
                  <Pause className="h-3 w-3" /> Stop
                </Button>
              )}
            </div>
          </div>

          {syncAllRunning && (
            <div className="mb-4 space-y-1.5 rounded-md border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">Syncing {syncAllProgress.current}…</span>
                <span className="text-muted-foreground">{syncAllProgress.done}/{syncAllProgress.total} · {syncAllProgress.synced} roles found</span>
              </div>
              <Progress value={(syncAllProgress.done / Math.max(syncAllProgress.total, 1)) * 100} className="h-1.5" />
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="space-y-1">
              {unsyncedCompanies.length === 0 && !loadingCompanies ? (
                <div className="text-center py-16">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-3 text-primary/40" />
                  <p className="text-sm text-muted-foreground">All companies with detected ATS have been synced</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Import more companies from the Discover tab</p>
                </div>
              ) : (
                unsyncedCompanies.map(co => (
                  <div key={co.id} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 border border-transparent hover:border-border transition-colors">
                    <CompanyLogo url={co.logo_url} name={co.name} size="h-7 w-7" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{co.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {[co.detected_ats_platform?.toUpperCase(), co.industry, co.employee_range].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => syncSingleCompany(co.id)} disabled={!!syncing}>
                        {syncing === `jobs-${co.id}` ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <RefreshCw className="h-2.5 w-2.5" />}
                        Sync
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => syncSingleCompany(co.id, true)} disabled={!!syncing} title="Diagnose">
                        <Bug className="h-2.5 w-2.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))
              )}

              {/* Also show all synced companies below */}
              {companies.filter(c => (c.job_count || 0) > 0).length > 0 && (
                <>
                  <Separator className="my-4" />
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide px-3 mb-2">
                    Synced ({companies.filter(c => (c.job_count || 0) > 0).length} companies · {stats.totalJobs.toLocaleString()} roles)
                  </p>
                  {companies.filter(c => (c.job_count || 0) > 0).sort((a, b) => (b.job_count || 0) - (a.job_count || 0)).map(co => (
                    <div key={co.id} className="flex items-center gap-3 px-3 py-1.5 text-muted-foreground">
                      <CompanyLogo url={co.logo_url} name={co.name} size="h-5 w-5" />
                      <span className="text-[11px] truncate flex-1">{co.name}</span>
                      <span className="text-[10px]">{co.job_count} roles</span>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => syncSingleCompany(co.id)} disabled={!!syncing}>
                        <RefreshCw className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ═══════ TAB: ANALYZE ═══════ */}
        <TabsContent value="analyze" className="m-0 flex" style={{ height: 'calc(100vh - 240px)' }}>
          {/* Company selector sidebar */}
          <div className="w-64 border-r border-border flex flex-col shrink-0">
            <div className="p-3 shrink-0">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Select Company</p>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input placeholder="Search…" className="pl-7 h-7 text-xs" />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="py-1">
                {companiesWithJobs.map(c => {
                  const sel = c.id === selectedCompanyId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCompanyId(sel ? null : c.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                        sel ? "bg-primary/8 border-l-2 border-primary" : "hover:bg-muted/50 border-l-2 border-transparent"
                      }`}
                    >
                      <CompanyLogo url={c.logo_url} name={c.name} size="h-6 w-6" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.job_count} roles</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Job analysis view */}
          <div className="flex-1 flex flex-col min-w-0">
            {!selectedCompanyId ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Brain className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Select a company to analyze its roles</p>
                </div>
              </div>
            ) : (
              <>
                {/* Company header + queue */}
                <div className="px-4 pt-4 pb-3 border-b border-border shrink-0">
                  <div className="flex items-center gap-3">
                    <CompanyLogo url={selectedCompany?.logo_url || null} name={selectedCompany?.name || ""} size="h-8 w-8" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-foreground truncate">{selectedCompany?.name}</h2>
                        {selectedCompany?.website && (
                          <a href={selectedCompany.website} target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground"><Globe className="h-3.5 w-3.5" /></a>
                        )}
                        <Button
                          variant="ghost" size="sm"
                          className="h-5 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-primary"
                          disabled={syncing === "enrich"}
                          onClick={async () => {
                            setSyncing("enrich");
                            try {
                              const { data, error } = await supabase.functions.invoke("enrich-company", {
                                body: { company_id: selectedCompany?.id, website: selectedCompany?.website || undefined, careers_url: selectedCompany?.careers_url || undefined },
                              });
                              if (error) throw error;
                              if (data?.error) throw new Error(data.error);
                              toast({ title: "Re-enriched", description: `${data.company?.name || "Company"} updated` });
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
                        <span>·</span>
                        <span>{jobs.length} roles</span>
                        <span>·</span>
                        <span className="text-primary">{analyzedJobIds.size} analyzed</span>
                        {selectedCompany?.employee_range && <><span>·</span><span>{selectedCompany.employee_range}</span></>}
                      </div>
                    </div>
                  </div>

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
                        {!queueRunning && (
                          <Button
                            size="sm" variant="outline"
                            className="text-[10px] h-6 px-2 gap-1"
                            disabled={bulkScoring}
                            onClick={async () => {
                              setBulkScoring(true);
                              setBulkScoreResult(null);
                              try {
                                const { data, error } = await supabase.functions.invoke("bulk-score-jobs", {
                                  body: { batchSize: 25, companyId: selectedCompanyId },
                                });
                                if (error) throw error;
                                setBulkScoreResult(`Scored ${data?.scored || 0}/${data?.processed || 0} roles`);
                                fetchJobs(selectedCompanyId!);
                              } catch (err: any) {
                                setBulkScoreResult(`Error: ${err.message}`);
                              } finally { setBulkScoring(false); }
                            }}
                          >
                            {bulkScoring ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Zap className="h-2.5 w-2.5" />}
                            Score L1
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  {queueMessage && !queueRunning && (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-500/5 rounded px-2 py-1 mt-2">
                      <AlertTriangle className="h-2.5 w-2.5 shrink-0" /><span>{queueMessage}</span>
                    </div>
                  )}
                  {bulkScoreResult && (
                    <div className="flex items-center gap-1.5 text-[10px] text-primary bg-primary/5 rounded px-2 py-1 mt-2">
                      <Zap className="h-2.5 w-2.5 shrink-0" /><span>{bulkScoreResult}</span>
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
                        <p className="text-sm text-muted-foreground">No roles yet. Sync from the Sync tab.</p>
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
                                        return (
                                          <button
                                            key={job.id}
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
                                              {isAn ? <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" /> : (
                                                <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3.5 shrink-0 ${isReady ? "bg-primary/10 text-primary border-primary/20" : "bg-muted/50 text-muted-foreground border-border"}`}>
                                                  {isReady ? "Ready" : "—"}
                                                </Badge>
                                              )}
                                            </div>
                                          </button>
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
        </TabsContent>

        {/* ═══════ TAB: COMPANIES ═══════ */}
        <TabsContent value="companies" className="flex-1 min-h-0 m-0">
          <div className="flex flex-col px-6 py-4 overflow-hidden" style={{ height: "calc(100vh - 340px)" }}>
            <div className="flex items-center gap-3 mb-4 flex-wrap shrink-0">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search companies…" value={compSearch} onChange={e => setCompSearch(e.target.value)} className="pl-8 h-8 text-xs" />
              </div>
              <select value={compAtsFilter} onChange={e => setCompAtsFilter(e.target.value)} className="h-8 text-xs rounded-md border border-input bg-background px-2">
                <option value="">All ATS</option>
                {uniqueAts.map(a => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
              </select>
              <select value={compIndustryFilter} onChange={e => setCompIndustryFilter(e.target.value)} className="h-8 text-xs rounded-md border border-input bg-background px-2 max-w-[180px]">
                <option value="">All Industries</option>
                {uniqueIndustries.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
              <select value={compFundingFilter} onChange={e => setCompFundingFilter(e.target.value)} className="h-8 text-xs rounded-md border border-input bg-background px-2">
                <option value="">All Funding</option>
                {uniqueFunding.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <span className="text-[10px] text-muted-foreground shrink-0">{filteredCompanies.length} companies</span>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px_80px] gap-2 px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide border-b border-border shrink-0">
              <span>Company</span>
              <span>Industry</span>
              <span>HQ</span>
              <span>ATS</span>
              <span className="text-right">Roles</span>
              <span className="text-right">Funding</span>
            </div>

            {loadingCompanies ? (
              <div className="flex items-center justify-center py-12 flex-1">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 flex-1 text-muted-foreground">
                <Building2 className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No companies match your filters</p>
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-auto">
                <div className="divide-y divide-border/50">
                  {filteredCompanies.slice(0, 200).map(co => (
                    <div key={co.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_80px_80px] gap-2 px-3 py-2 items-center hover:bg-muted/30 transition-colors group">
                      <div className="flex items-center gap-2 min-w-0">
                        <CompanyLogo url={co.logo_url} name={co.name} size="h-6 w-6" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{co.name}</p>
                          {co.employee_range && <p className="text-[10px] text-muted-foreground">{co.employee_range} employees</p>}
                        </div>
                        {co.website && (
                          <a href={co.website} target="_blank" rel="noopener" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </a>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate">{co.industry || "—"}</span>
                      <span className="text-[11px] text-muted-foreground truncate">{co.headquarters || "—"}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {co.detected_ats_platform && co.detected_ats_platform !== "unknown" ? (
                          <Badge variant="outline" className="text-[9px] h-4">{co.detected_ats_platform}</Badge>
                        ) : "—"}
                      </span>
                      <span className="text-[11px] text-right font-medium">
                        {(co.job_count || 0) > 0 ? (
                          <span className="text-primary">{co.job_count}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </span>
                      <span className="text-[11px] text-right text-muted-foreground truncate">{co.funding_stage || "—"}</span>
                    </div>
                  ))}
                  {filteredCompanies.length > 200 && (
                    <div className="text-center py-3 text-[10px] text-muted-foreground">
                      Showing 200 of {filteredCompanies.length} — use filters to narrow down
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      </div>

      {/* ═══════ ADD COMPANY DIALOG ═══════ */}
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

      {/* ═══════ DIAGNOSTIC DIALOG ═══════ */}
      <Dialog open={diagOpen} onOpenChange={setDiagOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-4 w-4" /> Sync Diagnostic — {diagCompanyName}
            </DialogTitle>
            <DialogDescription>Raw response from the sync edge function.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {diagLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : diagData ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {diagData.success ? <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Success</Badge> : <Badge variant="destructive">Failed</Badge>}
                  {diagData.synced != null && <span className="text-sm text-muted-foreground">{diagData.synced} roles synced</span>}
                </div>
                <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-auto max-h-[400px] whitespace-pre-wrap break-all font-mono text-foreground border border-border">
                  {JSON.stringify(diagData, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════ FLAGS & LOGS DRAWER ═══════ */}
      <Sheet open={flagsOpen} onOpenChange={setFlagsOpen}>
        <SheetContent className="w-[450px] sm:max-w-[500px] flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Flag className="h-4 w-4" /> Import Flags & Logs
            </SheetTitle>
            <SheetDescription>{flags.filter(f => f.status === "open").length} open flags · {logs.length} recent imports</SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 mt-4">
            {loadingFlags ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="space-y-6">
                {/* Flags */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Open Flags</p>
                  {flags.filter(f => f.status === "open").length === 0 ? (
                    <p className="text-xs text-muted-foreground">No open flags 🎉</p>
                  ) : (
                    <div className="space-y-1.5">
                      {flags.filter(f => f.status === "open").map(flag => (
                        <div key={flag.id} className={`rounded-md border p-2.5 ${SEVERITY_STYLES[flag.severity] || "border-border"}`}>
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-[9px] h-4">{flag.flag_type}</Badge>
                            <span className="text-[9px] text-muted-foreground">{new Date(flag.created_at).toLocaleDateString()}</span>
                          </div>
                          {flag.company_name && <p className="text-xs font-medium">{flag.company_name}</p>}
                          {flag.suggested_action && <p className="text-[10px] text-muted-foreground mt-0.5">{flag.suggested_action}</p>}
                          <div className="flex gap-1 mt-1.5">
                            <Button variant="outline" size="sm" className="h-5 text-[9px] px-1.5" onClick={() => resolveFlag(flag.id, "Dismissed")}>
                              Dismiss
                            </Button>
                            <Button variant="outline" size="sm" className="h-5 text-[9px] px-1.5" onClick={() => resolveFlag(flag.id, "Resolved")}>
                              Resolve
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Recent logs */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Recent Imports</p>
                  <div className="space-y-1">
                    {logs.map(log => (
                      <div key={log.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/30">
                        {log.result_status === "success" ? (
                          <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium truncate">{log.source} · {log.action}</p>
                          <p className="text-[9px] text-muted-foreground">
                            {log.items_created} created · {log.items_updated} updated · {log.items_skipped} skipped
                            {log.duration_ms && ` · ${(log.duration_ms / 1000).toFixed(1)}s`}
                          </p>
                        </div>
                        <span className="text-[9px] text-muted-foreground shrink-0">{new Date(log.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* ═══════ SYNC ACTIVITY STREAM ═══════ */}
      <Sheet open={syncStreamOpen} onOpenChange={setSyncStreamOpen}>
        <SheetContent className="w-[500px] sm:max-w-[540px] flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Sync Activity Stream
            </SheetTitle>
            <SheetDescription>
              {syncAllRunning
                ? `Syncing ${syncAllProgress.done}/${syncAllProgress.total} companies…`
                : syncStreamEntries.length > 0
                  ? `Complete — ${syncStreamEntries.filter(e => e.status === "success").reduce((s, e) => s + e.jobCount, 0)} roles across ${syncStreamEntries.filter(e => e.status === "success").length} companies`
                  : "Waiting for sync to start…"}
            </SheetDescription>
          </SheetHeader>

          {/* Summary stats */}
          {syncStreamEntries.length > 0 && (
            <div className="flex gap-3 mt-3">
              {[
                { label: "Success", count: syncStreamEntries.filter(e => e.status === "success").length, color: "text-primary" },
                { label: "Skipped", count: syncStreamEntries.filter(e => e.status === "skipped").length, color: "text-muted-foreground" },
                { label: "Failed", count: syncStreamEntries.filter(e => e.status === "failed").length, color: "text-destructive" },
                { label: "Roles", count: syncStreamEntries.filter(e => e.status === "success").reduce((s, e) => s + e.jobCount, 0), color: "text-foreground" },
              ].map(s => (
                <div key={s.label} className="flex-1 rounded-md border border-border bg-muted/30 p-2 text-center">
                  <p className={`text-base font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-[9px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {syncAllRunning && (
            <Progress value={(syncAllProgress.done / Math.max(syncAllProgress.total, 1)) * 100} className="h-1.5 mt-3" />
          )}

          <ScrollArea className="flex-1 mt-3">
            <div className="space-y-0.5 pr-3">
              <AnimatePresence initial={false}>
                {syncStreamEntries.map((entry, idx) => (
                  <motion.div
                    key={entry.timestamp}
                    initial={{ opacity: 0, y: 12, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md border transition-colors ${
                      entry.status === "syncing" ? "border-primary/30 bg-primary/5" :
                      entry.status === "success" ? "border-border bg-muted/20" :
                      entry.status === "failed" ? "border-destructive/30 bg-destructive/5" :
                      "border-transparent bg-transparent"
                    }`}
                  >
                    {/* Status icon */}
                    <div className="shrink-0">
                      {entry.status === "syncing" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : entry.status === "success" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      ) : entry.status === "failed" ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                      )}
                    </div>

                    {/* Company info */}
                    <CompanyLogo url={entry.logo} name={entry.company} size="h-5 w-5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium truncate">{entry.company}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {entry.platform?.toUpperCase() || "—"}
                        {entry.source && entry.source !== entry.platform && ` via ${entry.source}`}
                        {entry.duration != null && ` · ${(entry.duration / 1000).toFixed(1)}s`}
                      </p>
                    </div>

                    {/* Result */}
                    <div className="shrink-0 text-right">
                      {entry.status === "syncing" ? (
                        <span className="text-[10px] text-primary font-medium">syncing…</span>
                      ) : entry.status === "success" ? (
                        <Badge variant="outline" className="text-[9px] h-4 bg-primary/10 text-primary border-primary/20">
                          +{entry.jobCount} roles
                        </Badge>
                      ) : entry.status === "failed" ? (
                        <Badge variant="outline" className="text-[9px] h-4 border-destructive/30 text-destructive">error</Badge>
                      ) : (
                        <span className="text-[9px] text-muted-foreground">0 roles</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={syncStreamEndRef} />
            </div>
          </ScrollArea>

          <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
            {syncAllRunning ? (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { syncAbortRef.current = true; }}>
                <Pause className="h-3 w-3" /> Stop
              </Button>
            ) : (
              <span className="text-[10px] text-muted-foreground">
                {syncStreamEntries.length > 0 ? "Sync finished" : "—"}
              </span>
            )}
            <Button variant="ghost" size="sm" className="text-[10px]" onClick={() => setSyncStreamOpen(false)}>
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
