import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft, ExternalLink, Users, Mail, Linkedin, Loader2,
  DollarSign, Calendar, UserCheck, Swords, Warehouse, Clock, FileText,
  ChevronDown, MapPin, TrendingUp, Target, Briefcase,
} from "lucide-react";
import { useFlashAccountData, type AccountContact } from "./useFlashAccountData";
import { scoreTarget, accountScore } from "./AccountListView";
import type { FlashAccount, AccountStage } from "@/data/flash-prospects";
import { STAGE_CONFIG } from "@/data/flash-prospects";

interface AccountDetailInlineProps {
  account: FlashAccount;
  onBack: () => void;
  onFindContacts: (account: FlashAccount, mode: "solution" | "ma") => void;
  loadingLeads: boolean;
  activityLog: string[];
  streamedLeads: { name: string; title?: string; email?: string; linkedin?: string; score?: number; reason?: string }[];
  onStageChange?: (accountId: string, stage: AccountStage) => void;
}

export default function AccountDetailInline({
  account, onBack, onFindContacts, loadingLeads, activityLog, streamedLeads, onStageChange,
}: AccountDetailInlineProps) {
  const { contacts, activities, linkedGarages, loading, fetchAll, saveContacts, logActivity, updateStage } = useFlashAccountData(account.id);
  const [stageOpen, setStageOpen] = useState(false);

  useEffect(() => { fetchAll(); }, [account.id, fetchAll]);

  useEffect(() => {
    if (streamedLeads.length > 0 && !loadingLeads) {
      saveContacts(account.id, streamedLeads);
      logActivity(account.id, "contacts_found", `Found ${streamedLeads.length} decision-makers`);
    }
  }, [streamedLeads, loadingLeads, account.id, saveContacts, logActivity]);

  const displayContacts = contacts.length > 0 ? contacts : streamedLeads.map((l, i) => ({
    id: `temp-${i}`, account_id: account.id, name: l.name, title: l.title || null,
    email: l.email || null, phone: null, linkedin: l.linkedin || null,
    score: l.score ?? null, reason: l.reason || null, outreach_status: "new", created_at: new Date().toISOString(),
  }));

  const handleStageChange = async (newStage: AccountStage) => {
    await updateStage(account.id, newStage);
    onStageChange?.(account.id, newStage);
    setStageOpen(false);
    fetchAll();
  };

  const cfg = STAGE_CONFIG[account.stage];

  return (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-3">
        {/* Back button */}
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to accounts
        </button>

        {/* Header */}
        <div>
        <h3 className="font-bold text-sm leading-tight">
            {account.id === "acct-flash-hq" ? "Flash (You)" : `${account.name}${account.accountType === "fleet_operator" ? " (HQ)" : ""}`}
          </h3>
          <p className="text-[11px] text-muted-foreground">{account.hqCity}</p>
        </div>

        {/* Stage */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setStageOpen(!stageOpen)}
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
              style={{ backgroundColor: cfg.markerColor }}
            >
              {cfg.label}
              <ChevronDown className="w-3 h-3" />
            </button>
            {stageOpen && (
              <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 py-1 min-w-[120px]">
                {(["whitespace", "target", "active", "competitor"] as AccountStage[]).map(s => (
                  <button key={s} onClick={() => handleStageChange(s)}
                    className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-muted flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_CONFIG[s].markerColor }} />
                    {STAGE_CONFIG[s].label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">{account.estimatedSpaces} spaces · {account.facilityCount}</span>
        </div>

        {/* Account Score Overview */}
        {account.id !== "acct-flash-hq" && (
          <AccountScoreOverview account={account} />
        )}

        {/* Key metrics */}
        {(account.annualRevenue || account.employeeCount || account.founded) && (
          <div className="grid grid-cols-3 gap-1.5">
            {account.annualRevenue && (
              <div className="bg-muted/50 rounded-md px-2 py-1.5 text-center">
                <DollarSign className="w-3 h-3 mx-auto text-muted-foreground mb-0.5" />
                <p className="text-[10px] font-semibold">{account.annualRevenue}</p>
                <p className="text-[8px] text-muted-foreground">Revenue</p>
              </div>
            )}
            {account.employeeCount && (
              <div className="bg-muted/50 rounded-md px-2 py-1.5 text-center">
                <UserCheck className="w-3 h-3 mx-auto text-muted-foreground mb-0.5" />
                <p className="text-[10px] font-semibold">{account.employeeCount}</p>
                <p className="text-[8px] text-muted-foreground">Employees</p>
              </div>
            )}
            {account.founded && (
              <div className="bg-muted/50 rounded-md px-2 py-1.5 text-center">
                <Calendar className="w-3 h-3 mx-auto text-muted-foreground mb-0.5" />
                <p className="text-[10px] font-semibold">{account.founded}</p>
                <p className="text-[8px] text-muted-foreground">Founded</p>
              </div>
            )}
          </div>
        )}

        {/* Vendor & links */}
        <div className="space-y-1">
          {account.currentVendor && (
            <span className="inline-flex items-center gap-1 text-[11px] text-destructive font-medium">
              <Swords className="w-3 h-3" /> {account.currentVendor}
            </span>
          )}
          <div className="flex items-center gap-3 text-[11px]">
            <a href={account.website} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium">
              Website <ExternalLink className="w-3 h-3" />
            </a>
            {account.caseStudyUrl && (
              <a href={account.caseStudyUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium">
                Case study <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          {account.differentiator && (
            <p className="text-[10px] text-muted-foreground">{account.differentiator}</p>
          )}
        </div>

        {/* M&A Strategy */}
        {account.id !== "acct-flash-hq" && (
          <MAStrategySection account={account} />
        )}

        {/* Contacts section */}
        <div className="border-t border-border pt-3 space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Contacts
            {displayContacts.length > 0 && <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5">{displayContacts.length}</Badge>}
          </h4>
          {!displayContacts.length && !loadingLeads && (
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1" onClick={() => onFindContacts(account, "solution")}>
                <Target className="w-3 h-3 mr-1" /> Solution Buyers
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1" onClick={() => onFindContacts(account, "ma")}>
                <Briefcase className="w-3 h-3 mr-1" /> M&A Contacts
              </Button>
            </div>
          )}

          {loadingLeads && (
            <div className="space-y-1.5 py-1">
              {activityLog.map((msg, i) => (
                <div key={i} className={`flex items-start gap-2 text-[11px] ${i === activityLog.length - 1 ? "text-foreground" : "text-muted-foreground"}`}>
                  {i === activityLog.length - 1
                    ? <Loader2 className="w-3 h-3 animate-spin shrink-0 mt-0.5" />
                    : <span className="w-3 h-3 shrink-0 mt-0.5 text-center text-[9px]">✓</span>}
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          )}

          {displayContacts.length > 0 && !loadingLeads && (
            <div className="space-y-1.5">
              {displayContacts.map(contact => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          )}
        </div>

        {/* Linked locations */}
        {linkedGarages.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-t border-border pt-3">
              <span className="flex items-center gap-1.5">
                <Warehouse className="w-3.5 h-3.5" /> Locations
                <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5">{linkedGarages.length}</Badge>
              </span>
              <ChevronDown className="w-3 h-3" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-1">
              {linkedGarages.map(g => (
                <div key={g.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                  <Warehouse className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium leading-tight">{g.name}</p>
                    {g.address && <p className="text-[10px] text-muted-foreground">{g.address}</p>}
                    <div className="flex items-center gap-2 mt-0.5">
                      {g.capacity && <span className="text-[9px] text-muted-foreground">🅿️ {g.capacity.toLocaleString()}</span>}
                      {g.rating && <span className="text-[9px] text-muted-foreground">⭐ {g.rating}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Activity */}
        {activities.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-t border-border pt-3">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Activity
                <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5">{activities.length}</Badge>
              </span>
              <ChevronDown className="w-3 h-3" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-1">
              {activities.map(a => (
                <div key={a.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/30">
                  <ActivityIcon type={a.activity_type} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] leading-tight">{a.description}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {new Date(a.created_at).toLocaleDateString()} {new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </ScrollArea>
  );
}

function ContactCard({ contact }: { contact: AccountContact | { id: string; name: string; title: string | null; email: string | null; linkedin: string | null; score: number | null; reason: string | null; outreach_status: string } }) {
  const initials = contact.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-colors">
      <div className="relative shrink-0">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{initials}</div>
        {contact.score != null && (
          <span className={`absolute -bottom-1 -right-1 text-[9px] font-bold px-1 py-px rounded-full border border-background ${
            contact.score >= 80 ? "bg-green-500 text-white" : contact.score >= 60 ? "bg-yellow-500 text-white" : "bg-muted text-muted-foreground"
          }`}>{contact.score}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold leading-tight">{contact.name}</p>
        {contact.title && <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{contact.title}</p>}
        {contact.reason && <p className="text-[10px] text-muted-foreground/70 mt-1 leading-snug">{contact.reason}</p>}
        <div className="flex gap-3 mt-1.5">
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="text-primary hover:text-primary/80 text-[10px] inline-flex items-center gap-1 font-medium">
              <Mail className="w-3 h-3" /> Email
            </a>
          )}
          {contact.linkedin && (
            <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 text-[10px] inline-flex items-center gap-1 font-medium">
              <Linkedin className="w-3 h-3" /> LinkedIn
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case "contacts_found": return <Users className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />;
    case "stage_change": return <FileText className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />;
    default: return <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />;
  }
}

function MAStrategySection({ account }: { account: FlashAccount }) {
  const maScore = scoreTarget(account as any);
  const ot = (account as any).ownership_type ?? (account as any).ownershipType ?? "Unknown";
  const cm = (account as any).contract_model ?? (account as any).contractModel ?? "Unknown";
  const vendor = account.currentVendor ?? (account as any).current_vendor;

  const signals: { label: string; value: string; positive: boolean }[] = [];
  if (ot && ot !== "Unknown") signals.push({ label: "Ownership", value: ot, positive: ot === "family" || ot === "pe-backed" });
  if (cm && cm !== "Unknown") signals.push({ label: "Model", value: cm, positive: cm === "managed" });
  if (vendor && vendor !== "Unknown" && vendor !== "None") {
    signals.push({ label: "Incumbent", value: vendor, positive: vendor !== "Flash" });
  } else {
    signals.push({ label: "Incumbent", value: "None (greenfield)", positive: true });
  }
  if (account.founded) signals.push({ label: "Founded", value: String(account.founded), positive: account.founded < 2000 });

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-t border-border pt-3">
        <span className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" /> M&A Strategy
          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${
            maScore >= 75 ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
            maScore >= 55 ? "text-blue-600 bg-blue-50 border-blue-200" :
            maScore >= 35 ? "text-amber-600 bg-amber-50 border-amber-200" :
            "text-muted-foreground bg-muted border-border"
          }`}>{maScore}/100</Badge>
        </span>
        <ChevronDown className="w-3 h-3" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        <div className="grid grid-cols-2 gap-1.5">
          {signals.map(s => (
            <div key={s.label} className="bg-muted/40 rounded-md px-2 py-1.5">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <p className={`text-[11px] font-medium capitalize ${s.positive ? "text-emerald-600" : "text-foreground"}`}>{s.value}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {maScore >= 75 ? "Strong acquisition candidate — favorable ownership, contract model, and market positioning for Flash platform integration." :
           maScore >= 55 ? "Moderate acquisition potential — some favorable signals but may require deeper due diligence on valuation and integration complexity." :
           maScore >= 35 ? "Lower priority for M&A — consider partnership or technology licensing as an alternative entry strategy." :
           "Not a primary acquisition target — focus on competitive displacement or partnership opportunities."}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}

function AccountScoreOverview({ account }: { account: FlashAccount }) {
  const score = accountScore(account as any);
  const factors: { label: string; points: number }[] = [];

  const base = (account as any).priorityScore ?? (account as any).priority_score ?? 0;
  if (base > 0) factors.push({ label: "Base priority", points: Math.min(base, 100) });
  if (account.stage === "active") factors.push({ label: "Active customer", points: 20 });
  else if (account.stage === "target") factors.push({ label: "Target account", points: 15 });
  else if (account.stage === "competitor") factors.push({ label: "Competitor intel", points: 10 });
  if (account.annualRevenue) factors.push({ label: "Revenue data", points: 10 });
  if (account.employeeCount) factors.push({ label: "Employee data", points: 5 });
  if (account.currentVendor && account.currentVendor !== "Unknown") factors.push({ label: "Vendor intel", points: 5 });
  if (account.founded) factors.push({ label: "Founded year", points: 5 });

  const color = score >= 60 ? "text-emerald-600" : score >= 35 ? "text-amber-600" : "text-muted-foreground";

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-2">
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 shrink-0">
          <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-muted" />
            <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
              strokeDasharray={`${score * 0.9742} 97.42`}
              strokeLinecap="round"
              className={score >= 60 ? "stroke-emerald-500" : score >= 35 ? "stroke-amber-500" : "stroke-muted-foreground"}
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-[11px] font-bold ${color}`}>{score}</span>
        </div>
        <div>
          <p className="text-[11px] font-semibold">Account Score</p>
          <p className="text-[9px] text-muted-foreground">
            {score >= 60 ? "High-priority lead generation target" : score >= 35 ? "Moderate opportunity — worth exploring" : "Low data signals — enrich before pursuing"}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {factors.map(f => (
          <span key={f.label} className="inline-flex items-center gap-0.5 text-[9px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground">
            {f.label} <span className="font-semibold text-foreground">+{f.points}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
