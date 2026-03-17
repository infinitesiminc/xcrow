import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, Briefcase, Search, Loader2, ExternalLink } from "lucide-react";

interface Company {
  id: string;
  name: string;
  slug: string | null;
  industry: string | null;
  logo_url: string | null;
  employee_range: string | null;
  website: string | null;
  job_count: number;
  analyzed_count: number;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data: cos } = await supabase
        .from("companies")
        .select("id, name, slug, industry, logo_url, employee_range, website")
        .order("name");

      if (!cos) { setLoading(false); return; }

      // Get job counts per company
      const { data: jobs } = await supabase
        .from("jobs")
        .select("company_id, augmented_percent");

      const jobMap = new Map<string, { total: number; analyzed: number }>();
      (jobs || []).forEach((j: any) => {
        const cid = j.company_id;
        if (!cid) return;
        const entry = jobMap.get(cid) || { total: 0, analyzed: 0 };
        entry.total++;
        if (j.augmented_percent && j.augmented_percent > 0) entry.analyzed++;
        jobMap.set(cid, entry);
      });

      setCompanies(cos.map((c: any) => ({
        ...c,
        job_count: jobMap.get(c.id)?.total || 0,
        analyzed_count: jobMap.get(c.id)?.analyzed || 0,
      })));
      setLoading(false);
    })();
  }, []);

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalJobs = companies.reduce((s, c) => s + c.job_count, 0);
  const totalAnalyzed = companies.reduce((s, c) => s + c.analyzed_count, 0);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {companies.length} companies · {totalJobs} roles · {totalAnalyzed} analyzed
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(c => (
          <Card key={c.id} className="hover:border-primary/40 transition-colors">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                {c.logo_url ? (
                  <img src={c.logo_url} alt="" className="h-8 w-8 rounded object-contain bg-muted" />
                ) : (
                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  {c.industry && (
                    <p className="text-xs text-muted-foreground">{c.industry}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Badge variant="secondary" className="gap-1">
                  <Briefcase className="h-3 w-3" />
                  {c.job_count} roles
                </Badge>
                {c.analyzed_count > 0 && (
                  <Badge variant="outline" className="text-primary border-primary/30">
                    {c.analyzed_count} analyzed
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {c.slug && (
                  <Link
                    to={`/company/${c.slug}`}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" /> Public page
                  </Link>
                )}
                {c.website && (
                  <a
                    href={c.website}
                    target="_blank"
                    rel="noopener"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Website ↗
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          {search ? "No companies match your search." : "No companies yet. Import some from the Import Roles page."}
        </p>
      )}
    </div>
  );
}
