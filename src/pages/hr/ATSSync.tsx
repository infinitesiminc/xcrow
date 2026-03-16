import { useState, useEffect, useCallback, useRef } from "react";
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
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  RefreshCw, Building2, Briefcase, Search, Globe, ExternalLink,
  Loader2, CheckCircle2, AlertTriangle, ArrowUpDown, MapPin,
  ChevronDown, ChevronUp, Filter, ChevronsUpDown, Check,
} from "lucide-react";

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

const SUPERADMIN_IDS = [
  "7be41055-be68-4cab-b63c-f3b0c483e6eb",
  "bb10735b-051e-4bb5-918e-931a9c79d0fd",
];

/* ── component ── */
export default function ATSSync() {
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [syncing, setSyncing] = useState<"companies" | "jobs" | "full" | null>(null);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [companySearch, setCompanySearch] = useState("");
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const isSuperAdmin = !!user && SUPERADMIN_IDS.includes(user.id);

  /* ── fetch workspace ── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: membership } = await supabase
        .from("workspace_members").select("workspace_id")
        .eq("user_id", user.id).limit(1);
      if (membership?.length) setWorkspaceId(membership[0].workspace_id);
    })();
  }, [user]);

  /* ── fetch companies (workspace-scoped for non-superadmins) ── */
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("companies")
      .select("id, name, industry, logo_url, website, careers_url, detected_ats_platform, employee_range, brand_color, external_id")
      .order("name");
    
    // Non-superadmins only see their workspace's companies
    if (!isSuperAdmin && workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    } else if (!isSuperAdmin && !workspaceId) {
      // No workspace yet — show nothing
      setCompanies([]);
      setLoading(false);
      return;
    }
    
    const { data } = await query;
    setCompanies((data as Company[]) || []);
    setLoading(false);
  }, [isSuperAdmin, workspaceId]);

  useEffect(() => {
    if (!user) return;
    // Wait for workspace lookup before fetching (unless superadmin)
    if (!isSuperAdmin && !workspaceId) return;
    fetchCompanies();
  }, [user, fetchCompanies, isSuperAdmin, workspaceId]);

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

  /* ── sync actions ── */
  const runSync = async (step: "companies" | "jobs" | "full") => {
    setSyncing(step);
    try {
      const body: Record<string, unknown> = { step };
      if (step === "jobs" && selectedCompanyId) {
        body.company_id = selectedCompanyId;
      }

      const { data, error } = await supabase.functions.invoke("sync-company-jobs", { body });
      if (error) throw error;

      toast({
        title: "Sync complete",
        description:
          step === "companies"
            ? `${data.synced} companies synced`
            : step === "jobs"
              ? `${data.synced} jobs synced`
              : `${data.companies} companies, ${data.jobs} jobs synced`,
      });

      // Refresh data
      await fetchCompanies();
      if (selectedCompanyId && step !== "companies") {
        const { data: refreshed } = await supabase
          .from("jobs")
          .select("id, title, department, location, source_url, status, company_id")
          .eq("company_id", selectedCompanyId)
          .order("title");
        setJobs((refreshed as DbJob[]) || []);
      }
    } catch (err: any) {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(null);
    }
  };

  /* ── derived ── */
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const departments = [...new Set(jobs.map((j) => j.department).filter(Boolean))] as string[];

  const filtered = jobs
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ATS Sync</h1>
          <p className="text-sm text-muted-foreground">Import companies &amp; roles from connected applicant tracking systems</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => runSync("companies")}
            disabled={!!syncing}
          >
            {syncing === "companies" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Building2 className="h-4 w-4 mr-1" />}
            Sync Companies
          </Button>
          <Button
            size="sm"
            onClick={() => runSync("full")}
            disabled={!!syncing}
          >
            {syncing === "full" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Full Sync
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Companies</p>
            <p className="text-2xl font-bold text-foreground">{companies.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Selected Roles</p>
            <p className="text-2xl font-bold text-foreground">{jobs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Departments</p>
            <p className="text-2xl font-bold text-foreground">{departments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">ATS Platforms</p>
            <p className="text-2xl font-bold text-foreground">
              {new Set(companies.map((c) => c.detected_ats_platform).filter(Boolean)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Company Selector (searchable dropdown) ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Select Company
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading companies…
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No companies synced yet. Click <strong>Sync Companies</strong> to import from ATS.</p>
            </div>
          ) : (
            <Popover open={companyDropdownOpen} onOpenChange={setCompanyDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={companyDropdownOpen}
                  className="w-full justify-between h-10 text-sm font-normal"
                >
                  {selectedCompany ? (
                    <span className="flex items-center gap-2 truncate">
                      {selectedCompany.logo_url ? (
                        <img src={selectedCompany.logo_url} alt="" className="h-5 w-5 rounded object-contain bg-background shrink-0" />
                      ) : (
                        <div className="h-5 w-5 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                          {selectedCompany.name.charAt(0)}
                        </div>
                      )}
                      {selectedCompany.name}
                      {selectedCompany.detected_ats_platform && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">{selectedCompany.detected_ats_platform}</Badge>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Search {companies.length} companies…</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search companies…"
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      className="pl-8 h-9 text-sm"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {companies
                    .filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()))
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No companies found.</p>
                  ) : (
                    companies
                      .filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()))
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((co) => (
                        <button
                          key={co.id}
                          onClick={() => {
                            setSelectedCompanyId(co.id === selectedCompanyId ? null : co.id);
                            setCompanyDropdownOpen(false);
                            setCompanySearch("");
                          }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors"
                        >
                          <Check className={`h-3.5 w-3.5 shrink-0 ${co.id === selectedCompanyId ? "opacity-100 text-primary" : "opacity-0"}`} />
                          {co.logo_url ? (
                            <img src={co.logo_url} alt="" className="h-6 w-6 rounded object-contain bg-background shrink-0" />
                          ) : (
                            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                              {co.name.charAt(0)}
                            </div>
                          )}
                          <span className="flex-1 truncate text-foreground">{co.name}</span>
                          {co.industry && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">{co.industry}</Badge>}
                          {co.detected_ats_platform && <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{co.detected_ats_platform}</Badge>}
                        </button>
                      ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </CardContent>
      </Card>

      {/* ── Selected Company Details + Jobs ── */}
      {selectedCompany && (
        <>
          {/* Company header bar */}
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
                      {selectedCompany.detected_ats_platform && <Badge variant="outline" className="text-xs">{selectedCompany.detected_ats_platform} ATS</Badge>}
                      {selectedCompany.employee_range && <Badge variant="outline" className="text-xs">👥 {selectedCompany.employee_range}</Badge>}
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
                    onClick={() => runSync("jobs")}
                    disabled={!!syncing}
                  >
                    {syncing === "jobs" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                    Sync Jobs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jobs table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Roles ({filtered.length})
                </CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search roles…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 h-9 w-48 text-sm"
                    />
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
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>{jobs.length === 0 ? "No roles synced yet. Click Sync Jobs." : "No roles match your filters."}</p>
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
                      {filtered.map((job) => (
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
