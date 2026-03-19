import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Loader2,
  Globe, ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface SchoolRow {
  id: string;
  name: string;
  state: string | null;
  carnegie_class: string | null;
  enrollment: number | null;
  pipeline_stage: string | null;
  is_hbcu: boolean | null;
  plan_status: string;
  website: string | null;
  domain: string | null;
}

const PAGE_SIZE = 50;

const PIPELINE_BADGE: Record<string, string> = {
  prospect: "bg-muted text-muted-foreground",
  contacted: "bg-[hsl(var(--neon-blue))]/15 text-[hsl(var(--neon-blue))]",
  scraped: "bg-[hsl(var(--neon-cyan))]/15 text-[hsl(var(--neon-cyan))]",
  demo: "bg-[hsl(var(--neon-purple))]/15 text-[hsl(var(--neon-purple))]",
  customer: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
};

type SortKey = "name" | "enrollment" | "state" | "pipeline_stage";

export default function SchoolsDataTable({ initialPipelineFilter }: { initialPipelineFilter?: string }) {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [carnegieFilter, setCarnegieFilter] = useState("all");
  const [pipelineFilter, setPipelineFilter] = useState(initialPipelineFilter || "all");
  const [hbcuFilter, setHbcuFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (initialPipelineFilter) setPipelineFilter(initialPipelineFilter);
  }, [initialPipelineFilter]);

  useEffect(() => {
    async function load() {
      // Fetch in batches to get all 4k+ rows
      let allData: SchoolRow[] = [];
      let from = 0;
      const batchSize = 1000;
      let done = false;
      while (!done) {
        const { data } = await supabase
          .from("school_accounts")
          .select("id,name,state,carnegie_class,enrollment,pipeline_stage,is_hbcu,plan_status,website,domain")
          .range(from, from + batchSize - 1);
        if (data && data.length > 0) {
          allData = allData.concat(data as SchoolRow[]);
          from += batchSize;
          if (data.length < batchSize) done = true;
        } else {
          done = true;
        }
      }
      setSchools(allData);
      setLoading(false);
    }
    load();
  }, []);

  const states = useMemo(() => {
    const s = new Set(schools.map(s => s.state).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [schools]);

  const carnegieClasses = useMemo(() => {
    const s = new Set(schools.map(s => s.carnegie_class).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [schools]);

  const filtered = useMemo(() => {
    let result = schools;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q));
    }
    if (stateFilter !== "all") result = result.filter(s => s.state === stateFilter);
    if (carnegieFilter !== "all") result = result.filter(s => s.carnegie_class === carnegieFilter);
    if (pipelineFilter !== "all") result = result.filter(s => s.pipeline_stage === pipelineFilter);
    if (hbcuFilter !== "all") result = result.filter(s => hbcuFilter === "yes" ? s.is_hbcu : !s.is_hbcu);

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "enrollment") cmp = (a.enrollment || 0) - (b.enrollment || 0);
      else {
        const av = (a[sortKey] || "") as string;
        const bv = (b[sortKey] || "") as string;
        cmp = av.localeCompare(bv);
      }
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [schools, search, stateFilter, carnegieFilter, pipelineFilter, hbcuFilter, sortKey, sortAsc]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [search, stateFilter, carnegieFilter, pipelineFilter, hbcuFilter]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortAsc ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search schools..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={carnegieFilter} onValueChange={setCarnegieFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Carnegie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {carnegieClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Pipeline" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {["prospect", "contacted", "scraped", "demo", "customer"].map(s => (
              <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={hbcuFilter} onValueChange={setHbcuFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="HBCU" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">HBCU Only</SelectItem>
            <SelectItem value="no">Non-HBCU</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">{filtered.length.toLocaleString()} institutions</p>

      {/* Table */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>Name <SortIcon col="name" /></TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("state")}>State <SortIcon col="state" /></TableHead>
              <TableHead>Carnegie</TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("enrollment")}>Enrollment <SortIcon col="enrollment" /></TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("pipeline_stage")}>Pipeline <SortIcon col="pipeline_stage" /></TableHead>
              <TableHead>HBCU</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.map(school => (
              <TableRow key={school.id} className="hover:bg-muted/20">
                <TableCell className="font-medium max-w-[300px] truncate">{school.name}</TableCell>
                <TableCell>{school.state || "—"}</TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">{school.carnegie_class || "—"}</span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {school.enrollment?.toLocaleString() || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${PIPELINE_BADGE[school.pipeline_stage || "prospect"] || ""}`}>
                    {(school.pipeline_stage || "prospect").charAt(0).toUpperCase() + (school.pipeline_stage || "prospect").slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{school.is_hbcu ? <Badge className="bg-[hsl(var(--neon-pink))]/15 text-[hsl(var(--neon-pink))] text-xs">HBCU</Badge> : null}</TableCell>
                <TableCell>
                  {school.website && (
                    <a href={school.website.startsWith("http") ? school.website : `https://${school.website}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </a>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
