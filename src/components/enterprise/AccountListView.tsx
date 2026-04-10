import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, Grid3X3, Plane, Building2, Swords, ArrowUpDown } from "lucide-react";
import type { FlashAccount, AccountStage } from "@/data/flash-prospects";
import { STAGE_CONFIG } from "@/data/flash-prospects";

/** Parse revenue string to numeric for sorting */
function parseRevenue(rev: string | undefined): number {
  if (!rev) return 0;
  const m = rev.replace(/[^0-9.BMK]/gi, "");
  const num = parseFloat(m);
  if (isNaN(num)) return 0;
  if (/B/i.test(rev)) return num * 1_000_000_000;
  if (/M/i.test(rev)) return num * 1_000_000;
  if (/K/i.test(rev)) return num * 1_000;
  return num;
}

/** Score an operator for M&A attractiveness (0–100) */
export function scoreTarget(a: { currentVendor?: string; annualRevenue?: string; founded?: number; stage: string } & Record<string, any>): number {
  let score = 0;
  const ot = a.ownership_type ?? a.ownershipType;
  const cm = a.contract_model ?? a.contractModel;
  if (ot === "family") score += 30;
  else if (ot === "public") score += 5;
  else if (ot === "pe-backed") score += 15;
  const vendor = a.currentVendor ?? a.current_vendor;
  if (!vendor || vendor === "Unknown" || vendor === "None") score += 20;
  else if (vendor && vendor !== "Flash") score += 10;
  const rev = parseRevenue(a.annualRevenue ?? a.annual_revenue);
  if (rev >= 20_000_000 && rev <= 500_000_000) score += 20;
  else if (rev > 0 && rev < 20_000_000) score += 10;
  if (cm === "managed") score += 15;
  else if (cm === "mixed") score += 10;
  if (a.founded && a.founded < 2000) score += 10;
  else if (a.founded && a.founded < 2010) score += 5;
  if (a.stage === "whitespace") score += 5;
  return Math.min(score, 100);
}

type SortKey = "name" | "score" | "revenue";

function AccountIcon({ account, className }: { account: FlashAccount; className?: string }) {
  if (account.accountType === "airport") return <Plane className={className} />;
  if (account.stage === "competitor") return <Swords className={className} />;
  if (account.accountType === "large_venue") return <Building2 className={className} />;
  return <Grid3X3 className={className} />;
}

interface AccountListViewProps {
  accounts: FlashAccount[];
  selectedAccountId: string | null;
  onSelectAccount: (account: FlashAccount) => void;
}

export default function AccountListView({ accounts, selectedAccountId, onSelectAccount }: AccountListViewProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let list = accounts;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a => {
        const hay = `${a.name} ${a.hqCity} ${a.currentVendor || ""} ${a.annualRevenue || ""} ${a.focusArea}`.toLowerCase();
        return q.split(/\s+/).every(w => hay.includes(w));
      });
    }
    list = [...list].sort((a, b) => {
      let av: number | string, bv: number | string;
      switch (sortKey) {
        case "score": av = scoreTarget(a); bv = scoreTarget(b); break;
        case "revenue": av = parseRevenue(a.annualRevenue); bv = parseRevenue(b.annualRevenue); break;
        default: av = a.name; bv = b.name; break;
      }
      if (typeof av === "string" && typeof bv === "string")
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return list;
  }, [accounts, search, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "name" ? "asc" : "desc"); }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-8 h-8 text-xs bg-muted/40 border-0 focus-visible:ring-1"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sort bar */}
      <div className="px-3 pb-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="font-medium">{filtered.length} accounts</span>
        <span className="ml-auto" />
        {(["name", "score", "revenue"] as SortKey[]).map(key => (
          <button
            key={key}
            onClick={() => handleSort(key)}
            className={`px-1.5 py-0.5 rounded font-medium transition-colors ${sortKey === key ? "bg-primary/10 text-primary" : "hover:text-foreground"}`}
          >
            {key === "name" ? "Name" : key === "score" ? "M&A" : "Rev"}
            {sortKey === key && <ArrowUpDown className="w-2.5 h-2.5 inline ml-0.5" />}
          </button>
        ))}
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2 space-y-0.5">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs">No accounts match</div>
          )}
          {filtered.map(acct => {
            const cfg = STAGE_CONFIG[acct.stage];
            const maScore = scoreTarget(acct);
            const isSelected = selectedAccountId === acct.id;
            return (
              <button
                key={acct.id}
                onClick={() => onSelectAccount(acct)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all border ${
                  isSelected ? "bg-primary/5 border-primary/20" : "hover:bg-muted/60 border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <AccountIcon account={acct} className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-semibold flex-1 min-w-0">
                    {acct.name}{acct.accountType === "fleet_operator" ? " HQ" : ""}
                  </span>
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 shrink-0 ${
                    maScore >= 75 ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
                    maScore >= 55 ? "text-blue-600 bg-blue-50 border-blue-200" :
                    maScore >= 35 ? "text-amber-600 bg-amber-50 border-amber-200" :
                    "text-muted-foreground bg-muted border-border"
                  }`}>{maScore}</Badge>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium text-white shrink-0" style={{ backgroundColor: cfg.markerColor }}>
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground pl-5">
                  <span>{acct.hqCity}</span>
                  {acct.annualRevenue && <><span className="text-muted-foreground/30">·</span><span>{acct.annualRevenue}</span></>}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
