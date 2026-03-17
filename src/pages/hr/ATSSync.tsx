import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw, Building2, Briefcase, Search, Globe, ExternalLink,
  Loader2, MapPin, ChevronDown, ChevronUp, ArrowUpDown, Filter,
  Download, Database,
} from "lucide-react";

/** Try stored logo → Clearbit → initial */
function CompanyLogo({ url, name, size = "h-6 w-6" }: { url: string | null; name: string; size?: string }) {
  const [src, setSrc] = useState(url);
  const [fallbackTried, setFallbackTried] = useState(false);

  useEffect(() => { setSrc(url); setFallbackTried(false); }, [url]);

  const website = name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
  const clearbitUrl = `https://logo.clearbit.com/${website}`;

  if (!src && !fallbackTried) {
    return (
      <img
        src={clearbitUrl}
        alt=""
        className={`${size} rounded object-contain bg-background shrink-0`}
        onError={() => setFallbackTried(true)}
      />
    );
  }

  if (!src || fallbackTried) {
    return (
      <div className={`${size} rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0`}>
        {name.charAt(0)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={`${size} rounded object-contain bg-background shrink-0`}
      onError={() => {
        if (!fallbackTried) { setSrc(clearbitUrl); setFallbackTried(true); }
        else setSrc(null);
      }}
    />
  );
}

/* ── constants ── */
const ATS_PLATFORMS = [
  { id: "greenhouse", label: "Greenhouse", color: "hsl(142, 70%, 45%)" },
  { id: "ashby", label: "Ashby", color: "hsl(220, 70%, 55%)" },
  { id: "lever", label: "Lever", color: "hsl(35, 90%, 55%)" },
  { id: "smartrecruiters", label: "SmartRecruiters", color: "hsl(200, 70%, 50%)" },
  { id: "workday", label: "Workday", color: "hsl(270, 60%, 55%)" },
] as const;

/* ── types ── */
interface Company {
  id: string;
  name: string;
  industry: string | null;
  logo_url: string | null;
  website: string | null;
  careers_url: string | null;
  detected_ats_platform: string | null;
  employee_range: string | null;
  brand_color: string | null;
  external_id: string | null;
  headquarters: string | null;
}

interface DbJob {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  source_url: string | null;
  status: string | null;
  company_id: string | null;
}

type SortField = "title" | "department" | "location";
type SortDir = "asc" | "desc";

export default function ATSSync() {
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();

  /* ── state ── */
  const [selectedATS, setSelectedATS] = useState<string>("greenhouse");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allCompanyCounts, setAllCompanyCounts] = useState<Record<string, number>>({});
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, currentName: "" });
  const [search, setSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  /* ── fetch companies grouped by ATS ── */
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("companies")
      .select("id, name, industry, logo_url, website, careers_url, detected_ats_platform, employee_range, brand_color, external_id, headquarters")
      .order("name");
    const all = (data as Company[]) || [];

    // Count per ATS
    const counts: Record<string, number> = {};
    all.forEach((c) => {
      const ats = c.detected_ats_platform || "unknown";
      counts[ats] = (counts[ats] || 0) + 1;
    });
    setAllCompanyCounts(counts);

    // Filter to selected ATS
    setCompanies(all.filter((c) => c.detected_ats_platform === selectedATS));
    setLoading(false);
  }, [selectedATS]);

  useEffect(() => {
    if (!user) return;
    fetchCompanies();
  }, [user, fetchCompanies]);

  /* ── switch ATS → reset selection ── */
  useEffect(() => {
    setSelectedCompanyId(null);
    setJobs([]);
    setSearch("");
    setCompanySearch("");
    setDeptFilter("all");
  }, [selectedATS]);

  /* ── fetch jobs for selected company ── */
  useEffect(() => {
    if (!selectedCompanyId) { setJobs([]); return; }
    (async () => {
      setLoadingJobs(true);
      const { data } = await supabase
        .from("jobs")
        .select("id, title, department, location, source_url, status, company_id")
        .eq("company_id", selectedCompanyId)
        .order("title");
      setJobs((data as DbJob[]) || []);
      setLoadingJobs(false);
    })();
  }, [selectedCompanyId]);

  /* ── import new companies for selected ATS (US-only) ── */
  const importCompanies = async () => {
    setSyncing("import-companies");
    try {
      const { data, error } = await supabase.functions.invoke("sync-company-jobs", {
        body: { step: "companies", ats_platform: selectedATS, us_only: true, limit: 200 },
      });
      if (error) throw error;
      toast({
        title: "Import complete",
        description: `${data.synced} US companies imported (${data.filtered_us} non-US filtered out)`,
      });
      await fetchCompanies();
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(null);
    }
  };

  /* ── sync jobs for a single company ── */
  const syncCompanyJobs = async (companyId: string) => {
    setSyncing(`jobs-${companyId}`);
    try {
      const { data, error } = await supabase.functions.invoke("sync-company-jobs", {
        body: { step: "jobs", company_id: companyId },
      });
      if (error) throw error;
      toast({ title: "Sync complete", description: `${data.synced} roles synced` });
      if (companyId === selectedCompanyId) {
        const { data: refreshed } = await supabase
          .from("jobs")
          .select("id, title, department, location, source_url, status, company_id")
          .eq("company_id", companyId)
          .order("title");
        setJobs((refreshed as DbJob[]) || []);
      }
    } catch (err: any) {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(null);
    }
  };

  /* ── bulk sync all jobs for current ATS ── */
  const bulkSyncJobs = async () => {
    setSyncing("bulk-jobs");
    const total = companies.length;
    setBulkProgress({ current: 0, total, currentName: "" });
    let synced = 0;
    let errors = 0;

    for (let i = 0; i < companies.length; i++) {
      const co = companies[i];
      setBulkProgress({ current: i + 1, total, currentName: co.name });
      try {
        const { error } = await supabase.functions.invoke("sync-company-jobs", {
          body: { step: "jobs", company_id: co.id },
        });
        if (error) errors++;
        else synced++;
      } catch {
        errors++;
      }
    }

    toast({
      title: "Bulk sync complete",
      description: `${synced} companies synced${errors ? `, ${errors} errors` : ""}`,
    });
    setBulkProgress({ current: 0, total: 0, currentName: "" });
    setSyncing(null);
  };

  /* ── derived ── */
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const departments = [...new Set(jobs.map((j) => j.department).filter(Boolean))] as string[];

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  const filteredJobs = jobs
    .filter((j) => {
      if (deptFilter !== "all" && j.department !== deptFilter) return false;
      if (search && !j.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const av = (a[sortField] || "") as string;
      const bv = (b[sortField] || "") as string;
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field
      ? sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      : <ArrowUpDown className="h-3 w-3 opacity-40" />;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground">Sign in to manage ATS integrations.</p>
        <Button onClick={openAuthModal}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Import Roles</h1>
        <p className="text-sm text-muted-foreground mt-1">
          ATS-only pipeline · US-headquartered companies · No webpage scraping
        </p>
      </div>

      {/* ── ATS Platform Tabs ── */}
      <div className="flex flex-wrap gap-2">
        {ATS_PLATFORMS.map((ats) => (
          <button
            key={ats.id}
            onClick={() => setSelectedATS(ats.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              selectedATS === ats.id
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30"
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            {ats.label}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-0.5">
              {allCompanyCounts[ats.id] || 0}
            </Badge>
          </button>
        ))}
      </div>

      {/* ── Actions for selected ATS ── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground capitalize flex items-center gap-2">
                <Database className="h-4 w-4" />
                {ATS_PLATFORMS.find((a) => a.id === selectedATS)?.label}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {companies.length} US companies · Import new or sync existing roles
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={importCompanies}
                disabled={!!syncing}
              >
                {syncing === "import-companies" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
                Import New Companies
              </Button>
              <Button
                size="sm"
                onClick={bulkSyncJobs}
                disabled={!!syncing || companies.length === 0}
              >
                {syncing === "bulk-jobs" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                Sync All Jobs ({companies.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Bulk progress ── */}
      {syncing === "bulk-jobs" && bulkProgress.total > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Syncing: <span className="text-foreground font-medium">{bulkProgress.currentName}</span>
              </span>
              <span className="text-muted-foreground">{bulkProgress.current} / {bulkProgress.total}</span>
            </div>
            <Progress value={(bulkProgress.current / bulkProgress.total) * 100} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* ── Company List ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Companies ({filteredCompanies.length})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search companies…"
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="pl-8 h-9 w-56 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No companies for this ATS yet. Click <strong>Import New Companies</strong>.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>HQ</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((co) => (
                    <TableRow
                      key={co.id}
                      className={`cursor-pointer ${co.id === selectedCompanyId ? "bg-primary/5" : ""}`}
                      onClick={() => setSelectedCompanyId(co.id === selectedCompanyId ? null : co.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          {co.logo_url ? (
                            <img src={co.logo_url} alt="" className="h-6 w-6 rounded object-contain bg-background shrink-0" />
                          ) : (
                            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                              {co.name.charAt(0)}
                            </div>
                          )}
                          <span className="font-medium text-foreground">{co.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{co.industry || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{co.headquarters || "US"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); syncCompanyJobs(co.id); }}
                          disabled={!!syncing}
                          className="h-7 text-xs"
                        >
                          {syncing === `jobs-${co.id}` ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Selected Company Jobs ── */}
      {selectedCompany && (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {selectedCompany.logo_url ? (
                    <img src={selectedCompany.logo_url} alt="" className="h-10 w-10 rounded object-contain bg-background" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center font-bold text-muted-foreground">
                      {selectedCompany.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{selectedCompany.name}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      {selectedCompany.industry && <Badge variant="secondary" className="text-xs">{selectedCompany.industry}</Badge>}
                      <Badge variant="outline" className="text-xs">{selectedATS} ATS</Badge>
                      <span className="text-xs text-muted-foreground">{jobs.length} roles</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedCompany.website && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-3.5 w-3.5 mr-1" /> Website
                      </a>
                    </Button>
                  )}
                  {selectedCompany.careers_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedCompany.careers_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" /> Careers
                      </a>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => syncCompanyJobs(selectedCompany.id)}
                    disabled={!!syncing}
                  >
                    {syncing === `jobs-${selectedCompany.id}` ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                    Sync Jobs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Roles ({filteredJobs.length})
                </CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search roles…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 w-48 text-sm" />
                  </div>
                  {departments.length > 0 && (
                    <Select value={deptFilter} onValueChange={setDeptFilter}>
                      <SelectTrigger className="h-9 w-40 text-sm">
                        <Filter className="h-3.5 w-3.5 mr-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All departments</SelectItem>
                        {departments.sort().map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingJobs ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading roles…
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>{jobs.length === 0 ? "No roles synced. Click Sync Jobs." : "No roles match filters."}</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("title")}>
                          <span className="flex items-center gap-1">Role <SortIcon field="title" /></span>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("department")}>
                          <span className="flex items-center gap-1">Department <SortIcon field="department" /></span>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("location")}>
                          <span className="flex items-center gap-1">Location <SortIcon field="location" /></span>
                        </TableHead>
                        <TableHead className="w-20">Status</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium text-foreground">{job.title}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{job.department || "—"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {job.location ? (
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                            ) : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={job.status === "active" ? "default" : "secondary"} className="text-[10px]">
                              {job.status || "active"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {job.source_url && (
                              <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
