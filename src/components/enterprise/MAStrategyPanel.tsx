import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Target, Building2, DollarSign, Users, TrendingUp,
  Crown, Shield, Zap, Globe, ChevronRight, ExternalLink,
  Loader2, ArrowUpDown,
} from "lucide-react";

/* ─── types ─── */
interface AccountRow {
  id: string;
  name: string;
  hq_city: string | null;
  annual_revenue: string | null;
  employee_count: string | null;
  facility_count: string | null;
  estimated_spaces: string | null;
  current_vendor: string | null;
  ownership_type: string | null;
  contract_model: string | null;
  stage: string;
  founded: number | null;
  website: string | null;
  differentiator: string | null;
  focus_area: string | null;
}

type SortKey = "name" | "revenue" | "locations" | "score";
type SortDir = "asc" | "desc";

/** Parse revenue string to numeric for sorting (e.g. "$50M" → 50_000_000) */
function parseRevenue(rev: string | null): number {
  if (!rev) return 0;
  const m = rev.replace(/[^0-9.BMK]/gi, "");
  const num = parseFloat(m);
  if (isNaN(num)) return 0;
  if (/B/i.test(rev)) return num * 1_000_000_000;
  if (/M/i.test(rev)) return num * 1_000_000;
  if (/K/i.test(rev)) return num * 1_000;
  return num;
}

function parseLocations(f: string | null): number {
  if (!f) return 0;
  const n = parseInt(f.replace(/[^0-9]/g, ""));
  return isNaN(n) ? 0 : n;
}

/** Score an operator for acquisition attractiveness (0–100) */
function scoreTarget(a: AccountRow): number {
  let score = 0;
  // Family-owned = most acquirable
  if (a.ownership_type === "family") score += 30;
  else if (a.ownership_type === "public") score += 5;
  else if (a.ownership_type === "pe-backed") score += 15;
  // No current vendor = tech gap
  if (!a.current_vendor || a.current_vendor === "Unknown" || a.current_vendor === "None") score += 20;
  else if (a.current_vendor && a.current_vendor !== "Flash") score += 10; // displacement opportunity
  // Revenue sweet spot ($20M–$500M)
  const rev = parseRevenue(a.annual_revenue);
  if (rev >= 20_000_000 && rev <= 500_000_000) score += 20;
  else if (rev > 0 && rev < 20_000_000) score += 10;
  // Managed model = easier integration
  if (a.contract_model === "managed") score += 15;
  else if (a.contract_model === "mixed") score += 10;
  // Age (older = more likely to sell)
  if (a.founded && a.founded < 2000) score += 10;
  else if (a.founded && a.founded < 2010) score += 5;
  // Whitespace/target stage preferred
  if (a.stage === "whitespace") score += 5;
  return Math.min(score, 100);
}

function scoreTier(score: number): { label: string; color: string } {
  if (score >= 75) return { label: "Prime", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  if (score >= 55) return { label: "Strong", color: "text-blue-600 bg-blue-50 border-blue-200" };
  if (score >= 35) return { label: "Moderate", color: "text-amber-600 bg-amber-50 border-amber-200" };
  return { label: "Low", color: "text-muted-foreground bg-muted border-border" };
}

const OWNERSHIP_LABELS: Record<string, { icon: React.ReactNode; label: string }> = {
  family: { icon: <Crown className="w-3 h-3" />, label: "Family" },
  "pe-backed": { icon: <Shield className="w-3 h-3" />, label: "PE-Backed" },
  "vc-backed": { icon: <Zap className="w-3 h-3" />, label: "VC-Backed" },
  public: { icon: <Globe className="w-3 h-3" />, label: "Public" },
  "corporate-subsidiary": { icon: <Building2 className="w-3 h-3" />, label: "Corporate" },
};

export default function MAStrategyPanel() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [ownershipFilter, setOwnershipFilter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await (supabase.from("flash_accounts") as any)
        .select("id,name,hq_city,annual_revenue,employee_count,facility_count,estimated_spaces,current_vendor,ownership_type,contract_model,stage,founded,website,differentiator,focus_area")
        .eq("account_type", "fleet_operator")
        .order("name");
      setAccounts(data ?? []);
      setLoading(false);
    })();
  }, []);

  const scored = useMemo(() => {
    return accounts.map(a => ({ ...a, maScore: scoreTarget(a) }));
  }, [accounts]);

  const filtered = useMemo(() => {
    let list = scored;
    if (ownershipFilter) list = list.filter(a => a.ownership_type === ownershipFilter);
    list.sort((a, b) => {
      let av: number | string, bv: number | string;
      switch (sortKey) {
        case "name": av = a.name; bv = b.name; break;
        case "revenue": av = parseRevenue(a.annual_revenue); bv = parseRevenue(b.annual_revenue); break;
        case "locations": av = parseLocations(a.facility_count); bv = parseLocations(b.facility_count); break;
        case "score": default: av = a.maScore; bv = b.maScore; break;
      }
      if (typeof av === "string" && typeof bv === "string")
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return list;
  }, [scored, ownershipFilter, sortKey, sortDir]);

  /* ─── KPI summaries ─── */
  const primeTargets = scored.filter(a => a.maScore >= 75).length;
  const familyOwned = scored.filter(a => a.ownership_type === "family").length;
  const noVendor = scored.filter(a => !a.current_vendor || a.current_vendor === "Unknown" || a.current_vendor === "None").length;
  const totalRev = scored.reduce((s, a) => s + parseRevenue(a.annual_revenue), 0);

  const ownershipGroups = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of scored) {
      const key = a.ownership_type || "unknown";
      map[key] = (map[key] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [scored]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">M&A Acquisition Strategy</h2>
        <Badge variant="secondary" className="text-[10px]">Board View</Badge>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-2">
        <MiniKPI icon={<Target className="w-3.5 h-3.5 text-emerald-500" />} label="Prime Targets" value={primeTargets} />
        <MiniKPI icon={<Crown className="w-3.5 h-3.5 text-amber-500" />} label="Family-Owned" value={familyOwned} />
        <MiniKPI icon={<Zap className="w-3.5 h-3.5 text-blue-500" />} label="No Vendor (Tech Gap)" value={noVendor} />
        <MiniKPI icon={<DollarSign className="w-3.5 h-3.5 text-emerald-500" />} label="Total Rev Pool" value={`$${(totalRev / 1e9).toFixed(1)}B`} />
      </div>

      {/* Ownership Filter Chips */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setOwnershipFilter(null)}
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
            !ownershipFilter ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-accent"
          }`}
        >
          All ({scored.length})
        </button>
        {ownershipGroups.map(([key, count]) => {
          const info = OWNERSHIP_LABELS[key];
          return (
            <button
              key={key}
              onClick={() => setOwnershipFilter(ownershipFilter === key ? null : key)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors inline-flex items-center gap-1 ${
                ownershipFilter === key ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              {info?.icon} {info?.label || key} ({count})
            </button>
          );
        })}
      </div>

      {/* Target Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-420px)]">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border">
                  {([
                    ["score", "Score"],
                    ["name", "Operator"],
                    ["revenue", "Revenue"],
                    ["locations", "Locations"],
                  ] as [SortKey, string][]).map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className={`py-2 px-2 text-left font-medium uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors text-muted-foreground ${
                        sortKey === key ? "text-foreground" : ""
                      }`}
                    >
                      <span className="inline-flex items-center gap-0.5">
                        {label}
                        {sortKey === key && <ArrowUpDown className="h-2.5 w-2.5" />}
                      </span>
                    </th>
                  ))}
                  <th className="py-2 px-2 text-left font-medium uppercase tracking-wider text-muted-foreground">Type</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const tier = scoreTier(a.maScore);
                  const isExpanded = expanded === a.id;
                  return (
                    <tr key={a.id} className="group">
                      <td colSpan={5} className="p-0">
                        <button
                          onClick={() => setExpanded(isExpanded ? null : a.id)}
                          className="w-full text-left hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center">
                            <div className="py-1.5 px-2 w-[60px]">
                              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 font-semibold border ${tier.color}`}>
                                {a.maScore}
                              </Badge>
                            </div>
                            <div className="py-1.5 px-2 flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-foreground truncate">{a.name}</span>
                                <ChevronRight className={`w-3 h-3 text-muted-foreground/50 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                              </div>
                              <span className="text-[10px] text-muted-foreground">{a.hq_city || "—"}</span>
                            </div>
                            <div className="py-1.5 px-2 w-[70px] text-right font-mono text-muted-foreground">
                              {a.annual_revenue || "—"}
                            </div>
                            <div className="py-1.5 px-2 w-[60px] text-right font-mono text-muted-foreground">
                              {a.facility_count || "—"}
                            </div>
                            <div className="py-1.5 px-2 w-[80px]">
                              {a.ownership_type && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                  {OWNERSHIP_LABELS[a.ownership_type]?.icon}
                                  {OWNERSHIP_LABELS[a.ownership_type]?.label || a.ownership_type}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 bg-muted/20 border-t border-border/50">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                              <div>
                                <span className="text-muted-foreground">Contract Model:</span>{" "}
                                <span className="font-medium text-foreground capitalize">{a.contract_model || "—"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Current Vendor:</span>{" "}
                                <span className="font-medium text-foreground">{a.current_vendor || "None"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Employees:</span>{" "}
                                <span className="font-medium text-foreground">{a.employee_count || "—"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Founded:</span>{" "}
                                <span className="font-medium text-foreground">{a.founded || "—"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Spaces:</span>{" "}
                                <span className="font-medium text-foreground">{a.estimated_spaces || "—"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Stage:</span>{" "}
                                <Badge variant="outline" className="text-[9px] px-1 py-0 capitalize">{a.stage}</Badge>
                              </div>
                            </div>
                            {a.differentiator && (
                              <div className="mt-2 p-2 rounded bg-primary/5 border border-primary/10">
                                <p className="text-[10px] text-muted-foreground"><strong className="text-foreground">Flash Play:</strong> {a.differentiator}</p>
                              </div>
                            )}
                            {a.focus_area && (
                              <p className="mt-1 text-[10px] text-muted-foreground"><strong>Focus:</strong> {a.focus_area}</p>
                            )}
                            {a.website && (
                              <a href={a.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-[10px] text-primary hover:underline">
                                <ExternalLink className="w-3 h-3" /> {a.website.replace(/^https?:\/\//, "")}
                              </a>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Strategy Insight Footer */}
      <Card>
        <CardContent className="p-3">
          <h4 className="text-[11px] font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-primary" /> Executive Summary
          </h4>
          <div className="space-y-1.5 text-[10px] text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">{primeTargets} prime acquisition targets</strong> identified across {scored.length} operators.
              The sweet spot: <strong className="text-foreground">{scored.filter(a => a.ownership_type === "family" && a.contract_model === "managed").length} family-owned managed operators</strong> —
              most likely to sell and easiest to integrate Flash technology post-acquisition.
            </p>
            <p>
              <strong className="text-foreground">{noVendor} operators</strong> have no known PARCS vendor, representing immediate technology integration opportunities worth
              an estimated <strong className="text-foreground">${(scored.filter(a => !a.current_vendor || a.current_vendor === "Unknown" || a.current_vendor === "None").reduce((s, a) => s + parseRevenue(a.annual_revenue), 0) / 1e9).toFixed(1)}B</strong> in combined revenue.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MiniKPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-2.5 flex items-center gap-2">
        {icon}
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-base font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
