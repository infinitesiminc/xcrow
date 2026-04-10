import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, Grid3X3, Plane, Building2, Swords, ArrowUpDown } from "lucide-react";
import type { FlashAccount } from "@/data/flash-prospects";
import { STAGE_CONFIG } from "@/data/flash-prospects";

/** Parse revenue string to numeric for sorting */
export function parseRevenue(rev: string | undefined): number {
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

/** Overall account score combining stage + data completeness */
function accountScore(a: FlashAccount & Record<string, any>): number {
  let score = (a.priorityScore ?? a.priority_score ?? 0) as number;
  if (a.annualRevenue) score += 10;
  if (a.employeeCount) score += 5;
  if (a.currentVendor && a.currentVendor !== "Unknown") score += 5;
  if (a.founded) score += 5;
  if (a.stage === "active") score += 20;
  else if (a.stage === "target") score += 15;
  else if (a.stage === "competitor") score += 10;
  return score;
}

const TYPE_ORDER: Record<string, number> = {
  fleet_operator: 0, airport: 1, large_venue: 2,
};
function typeRank(a: FlashAccount): number {
  return TYPE_ORDER[a.accountType] ?? 3;
}

type SortKey = "name" | "type" | "score";

function AccountIcon({ account, className }: { account: FlashAccount; className?: string }) {
  if (account.accountType === "airport") return <Plane className={className} />;
  if (account.stage === "competitor") return <Swords className={className} />;
  if (account.accountType === "large_venue") return <Building2 className={className} />;
  return <Grid3X3 className={className} />;
}

const TYPE_LABELS: Record<string, string> = {
  fleet_operator: "Operator",
  airport: "Airport",
  large_venue: "Venue",
};

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
        const hay = `${a.name} ${a.hqCity} ${a.currentVendor || ""} ${a.annualRevenue || ""} ${a.focusArea} ${a.accountType}`.toLowerCase();
        return q.split(/\s+/).every(w => hay.includes(w));
      });
    }
    list = [...list].sort((a, b) => {
      let av: number | string, bv: number | string;
      switch (sortKey) {
        case "type": av = typeRank(a); bv = typeRank(b); break;
        case "score": av = accountScore(a); bv = accountScore(b); break;
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
        {(["name", "type", "score"] as SortKey[]).map(key => (
          <button
            key={key}
            onClick={() => handleSort(key)}
            className={`px-1.5 py-0.5 rounded font-medium transition-colors ${sortKey === key ? "bg-primary/10 text-primary" : "hover:text-foreground"}`}
          >
            {key === "name" ? "Name" : key === "type" ? "Type" : "Score"}
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
            const isFlashHQ = acct.id === "acct-flash-hq";
            const isSelected = selectedAccountId === acct.id;
            const score = accountScore(acct);
            const scorePct = Math.min(score, 100);
            const scoreColor = score >= 40 ? "#22c55e" : score >= 25 ? "#eab308" : "#94a3b8";
            const circumference = 2 * Math.PI * 10;
            const dashOffset = circumference - (scorePct / 100) * circumference;
            return (
              <button
                key={acct.id}
                onClick={() => onSelectAccount(acct)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all border ${
                  isSelected ? "bg-primary/5 border-primary/20" : "hover:bg-muted/60 border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* Score ring */}
                  <div className="relative shrink-0 w-7 h-7">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 -rotate-90">
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/30" />
                      <circle cx="12" cy="12" r="10" fill="none" stroke={scoreColor} strokeWidth="2.5"
                        strokeDasharray={circumference} strokeDashoffset={dashOffset}
                        strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold tabular-nums" style={{ color: scoreColor }}>
                      {score}
                    </span>
                  </div>
                  <span className="text-xs font-semibold flex-1 min-w-0 truncate">
                    {isFlashHQ ? "Flash (You)" : acct.name}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 bg-muted text-muted-foreground">
                    {TYPE_LABELS[acct.accountType] || acct.accountType}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium text-white shrink-0" style={{ backgroundColor: cfg.markerColor }}>
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground pl-9">
                  <span>{acct.hqCity}</span>
                  {acct.annualRevenue && <><span className="text-muted-foreground/30">·</span><span>{acct.annualRevenue}</span></>}
                  {acct.estimatedSpaces && acct.estimatedSpaces !== "N/A" && <><span className="text-muted-foreground/30">·</span><span>{acct.estimatedSpaces} spaces</span></>}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
