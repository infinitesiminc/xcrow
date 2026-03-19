import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Building2, Search, List, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface Company {
  id: string;
  name: string;
  slug: string | null;
  industry: string | null;
  logo_url: string | null;
  website: string | null;
  detected_ats_platform: string | null;
  employee_range: string | null;
  headquarters: string | null;
  imported_at: string;
  job_count?: number;
  analyzed_count?: number;
}

function CompanyLogo({ url, name }: { url: string | null; name: string }) {
  const [src, setSrc] = useState(url);
  const [tried, setTried] = useState(false);
  useEffect(() => { setSrc(url); setTried(false); }, [url]);
  const cb = `https://logo.clearbit.com/${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
  if (!src && !tried) return <img src={cb} alt="" className="h-6 w-6 rounded object-contain bg-background shrink-0" onError={() => setTried(true)} />;
  if (!src || tried) return <div className="h-6 w-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">{name.charAt(0)}</div>;
  return <img src={src} alt="" className="h-6 w-6 rounded object-contain bg-background shrink-0" onError={() => { if (!tried) { setSrc(cb); setTried(true); } else setSrc(null); }} />;
}

export default function CompaniesAdminPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [atsFilter, setAtsFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    let all: Company[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data } = await supabase.from("companies")
        .select("id, name, slug, industry, logo_url, website, detected_ats_platform, employee_range, headquarters, imported_at")
        .order("imported_at", { ascending: false })
        .range(from, from + pageSize - 1);
      if (!data || data.length === 0) break;
      all = all.concat(data as Company[]);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    const { data: stats } = await supabase.rpc("get_company_stats");
    const jm = new Map<string, number>();
    const am = new Map<string, number>();
    if (stats) (stats as any[]).forEach((r: any) => {
      jm.set(r.company_id, Number(r.job_count));
      am.set(r.company_id, Number(r.analyzed_count));
    });
    setCompanies(all.map(c => ({ ...c, job_count: jm.get(c.id) || 0, analyzed_count: am.get(c.id) || 0 })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const uniqueIndustries = useMemo(() => {
    const s = new Set<string>();
    companies.forEach(c => { if (c.industry) s.add(c.industry); });
    return Array.from(s).sort();
  }, [companies]);

  const uniqueAts = useMemo(() => {
    const s = new Set<string>();
    companies.forEach(c => { if (c.detected_ats_platform && c.detected_ats_platform !== "unknown") s.add(c.detected_ats_platform); });
    return Array.from(s).sort();
  }, [companies]);

  const filtered = useMemo(() => {
    let list = companies;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.industry?.toLowerCase().includes(q));
    }
    if (atsFilter) list = list.filter(c => c.detected_ats_platform === atsFilter);
    if (industryFilter) list = list.filter(c => c.industry === industryFilter);
    return list;
  }, [companies, search, atsFilter, industryFilter]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" /> Companies
          <Badge variant="secondary" className="text-xs">{companies.length}</Badge>
        </h2>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search companies…" value={search} onChange={e => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
        </div>
        <Select value={industryFilter} onValueChange={v => setIndustryFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Industry" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {uniqueIndustries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={atsFilter} onValueChange={v => setAtsFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="ATS" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ATS</SelectItem>
            {uniqueAts.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Loading…</div>
      ) : (
        <ScrollArea className="h-[calc(100vh-240px)]">
          <div className="space-y-1">
            {filtered.map(c => (
              <div key={c.id}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => c.slug && navigate(`/company/${c.slug}`)}
              >
                <CompanyLogo url={c.logo_url} name={c.name} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{c.name}</span>
                  <span className="text-[10px] text-muted-foreground">{c.industry || "—"} · {c.employee_range || "—"}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">{c.job_count || 0} roles</Badge>
                <Badge variant="outline" className="text-[10px]">{c.analyzed_count || 0} analyzed</Badge>
                {c.website && (
                  <a href={c.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </a>
                )}
              </div>
            ))}
            {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No companies match your filters.</p>}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
