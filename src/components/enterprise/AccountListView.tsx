import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, ArrowUpDown, ExternalLink } from "lucide-react";
import type { FlashAccount } from "@/types/accounts";
import { STAGE_CONFIG, type AccountStage } from "@/types/accounts";

/* ── Scoring ── */
export function accountScore(a: FlashAccount & Record<string, any>): number {
  let score = (a.priorityScore ?? a.priority_score ?? 0) as number;
  if (a.annualRevenue) score += 10;
  if (a.employeeCount) score += 5;
  if (a.currentVendor && a.currentVendor !== "Unknown") score += 5;
  if (a.founded) score += 5;
  if (a.stage === "active") score += 20;
  else if (a.stage === "target") score += 15;
  else if (a.stage === "competitor") score += 10;
  return Math.min(score, 100);
}

type SortKey = "name" | "type" | "score";

/* ── Score Ring ── */
function ScoreRing({ score }: { score: number }) {
  const pct = Math.min(score, 100);
  const color = score >= 60 ? "hsl(142,71%,45%)" : score >= 35 ? "hsl(45,93%,47%)" : "hsl(var(--muted-foreground))";
  const circumference = 2 * Math.PI * 12;
  const dashOffset = circumference - (pct / 100) * circumference;
  return (
    <div className="relative shrink-0 size-9">
      <svg viewBox="0 0 28 28" className="size-9 -rotate-90">
        <circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/20" />
        <circle
          cx="14" cy="14" r="12" fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

/* ── Spine Node ── */
function SpineNode({ stage }: { stage: AccountStage }) {
  const cfg = STAGE_CONFIG[stage];
  return (
    <div
      className="size-3 rounded-full z-10 shrink-0"
      style={{
        backgroundColor: cfg.markerColor,
        boxShadow: `0 0 8px ${cfg.markerColor}60`,
      }}
    />
  );
}

/* ── Stage Badge ── */
function StageBadge({ stage }: { stage: AccountStage }) {
  const cfg = STAGE_CONFIG[stage];
  const isCompetitor = stage === "competitor";
  return (
    <span
      className="text-[9px] px-2 py-0.5 rounded-full font-medium tracking-wide uppercase shrink-0"
      style={{
        backgroundColor: isCompetitor ? `${cfg.markerColor}20` : `${cfg.markerColor}15`,
        color: cfg.markerColor,
        border: `1px solid ${cfg.markerColor}30`,
      }}
    >
      {cfg.label}
    </span>
  );
}

/* ── Account Row ── */
function AccountRow({ account, isSelected, onClick }: { account: FlashAccount; isSelected: boolean; onClick: () => void }) {
  const score = accountScore(account);

  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
      className={`w-full text-left group relative transition-all duration-300 ${
        isSelected
          ? "bg-card/70 border border-[hsl(270,80%,60%,0.3)] shadow-[inset_0_0_30px_hsl(270,80%,60%,0.04),0_0_15px_hsl(270,80%,60%,0.04)]"
          : "bg-transparent border border-transparent hover:bg-card/40 hover:border-border/30"
      } rounded-xl px-4 py-3`}
    >
      <div className="flex items-center gap-3">
        <ScoreRing score={score} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">{account.name}</span>
            {account.website && (
              <ExternalLink className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
            {account.hqCity && <span className="truncate">{account.hqCity}</span>}
            {account.annualRevenue && (
              <>
                <span className="text-muted-foreground/20">·</span>
                <span>{account.annualRevenue}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-muted/40 text-muted-foreground border border-border/30">
            prospect
          </span>
          <StageBadge stage={account.stage} />
        </div>
      </div>
    </motion.button>
  );
}

/* ── Main Component ── */
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
        case "type": av = a.stage; bv = b.stage; break;
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
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-8 h-9 text-sm bg-muted/20 border-border/30 focus-visible:ring-1 focus-visible:ring-[hsl(270,80%,60%,0.4)] font-mono"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sort bar */}
      <div className="px-4 pb-2 flex items-center gap-3 text-xs text-muted-foreground font-mono">
        <span className="font-medium">{filtered.length} accounts</span>
        <span className="ml-auto" />
        {(["name", "type", "score"] as SortKey[]).map(key => (
          <button
            key={key}
            onClick={() => handleSort(key)}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
              sortKey === key
                ? "bg-[hsl(270,80%,60%,0.1)] text-[hsl(270,80%,60%)] border border-[hsl(270,80%,60%,0.2)]"
                : "hover:text-foreground"
            }`}
          >
            {key === "name" ? "Name" : key === "type" ? "Type" : "Score"}
            {sortKey === key && <ArrowUpDown className="w-2.5 h-2.5 inline ml-0.5" />}
          </button>
        ))}
      </div>

      {/* Account list with spine */}
      <ScrollArea className="flex-1">
        <div className="relative pl-8 pr-4 pb-4">
          {/* Vertical spine */}
          {filtered.length > 0 && (
            <div className="absolute left-[18px] top-2 bottom-4 w-px bg-gradient-to-b from-primary via-[hsl(270,80%,60%,0.4)] to-muted-foreground/10 shadow-[0_0_6px_hsl(var(--primary)/0.2)]" />
          )}

          <div className="flex flex-col gap-1">
            <AnimatePresence>
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xs font-mono pl-4">
                  No accounts match your search
                </div>
              ) : (
                filtered.map(acct => (
                  <div key={acct.id} className="relative flex items-center">
                    {/* Spine node */}
                    <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex items-center justify-center w-8">
                      <SpineNode stage={acct.stage} />
                    </div>
                    <div className="flex-1">
                      <AccountRow
                        account={acct}
                        isSelected={selectedAccountId === acct.id}
                        onClick={() => onSelectAccount(acct)}
                      />
                    </div>
                  </div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
