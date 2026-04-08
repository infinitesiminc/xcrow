import { useState, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parseSSEStream } from "@/lib/sse-parser";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import flashLogo from "@/assets/flash-logo.png";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { MapPin, Filter, ExternalLink, Search, X, Building2, Grid3X3, Zap, Eye, Swords, Plane, Users, Loader2, Linkedin, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  FLASH_LOCATIONS,
  type FlashLocation,
} from "@/data/flash-parking-locations";
import {
  FLASH_ACCOUNTS,
  FLASH_PLATFORM_STATS,
  STAGE_CONFIG,
  type FlashAccount,
  type AccountStage,
  type AccountType,
} from "@/data/flash-prospects";
import { FLASH_AIRPORT_ACCOUNTS } from "@/data/flash-airports";

const ALL_ACCOUNTS = [...FLASH_ACCOUNTS, ...FLASH_AIRPORT_ACCOUNTS];

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "AIzaSyDMSptsCr9hKesJxuvh-sKL1z_gCj371z0";
const MAP_ID = "flash-parking-map";

/* ── Account HQ Pin ── */
const isAirport = (id: string) => id.startsWith("acct-airport-");

function AccountIcon({ account, className }: { account: FlashAccount; className?: string }) {
  if (account.accountType === "airport") return <Plane className={className} />;
  if (account.stage === "competitor") return <Swords className={className} />;
  if (account.accountType === "large_venue") return <Building2 className={className} />;
  return <Grid3X3 className={className} />;
}

function AccountPin({ account }: { account: FlashAccount }) {
  const cfg = STAGE_CONFIG[account.stage];
  const isFlashHQ = account.id === "acct-flash-hq";

  if (isFlashHQ) {
    return (
      <div className="relative cursor-pointer group">
        <div className="w-11 h-11 rounded-full border-[3px] border-primary shadow-lg transition-all group-hover:scale-125 flex items-center justify-center bg-white">
          <img src={flashLogo} alt="Flash HQ" className="w-7 h-7 object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative cursor-pointer group">
      <div
        className="w-9 h-9 rounded-full border-[3px] border-white shadow-lg transition-all group-hover:scale-125 flex items-center justify-center"
        style={{ backgroundColor: cfg.markerColor }}
      >
        <AccountIcon account={account} className="w-4 h-4 text-white" />
      </div>
    </div>
  );
}

/* ── Deployed site pin (subtle) ── */
function DeployedSitePin() {
  return (
    <div className="cursor-pointer">
      <div className="w-3 h-3 rounded-full bg-gray-400/50 border border-white/60" />
    </div>
  );
}

/* ── Full-height Slide-in Detail Panel ── */
interface AccountLeadResult {
  persona?: string;
  leads: any[];
}

function DetailPanel({ account, site, onClose, accountLeads, loadingLeads, onFindContacts }: {
  account: FlashAccount | null; site: FlashLocation | null; onClose: () => void;
  accountLeads: Record<string, AccountLeadResult>; loadingLeads: Set<string>; onFindContacts: (a: FlashAccount) => void;
}) {
  const isOpen = !!(account || site);
  const result = account ? accountLeads[account.id] : undefined;
  const leads = result?.leads;
  const persona = result?.persona;
  const isLoading = account ? loadingLeads.has(account.id) : false;

  return (
    <div className={`absolute top-0 right-0 z-[1000] w-80 h-full transition-transform duration-300 ease-out ${
      isOpen ? "translate-x-0" : "translate-x-full"
    }`}>
      <div className="h-full bg-background/80 backdrop-blur-xl border-l border-border shadow-2xl overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-background border-b border-border">
          <h3 className="font-semibold text-sm truncate pr-2">
            {account?.name || site?.name || "Details"}
          </h3>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center transition-colors shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        {account && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: STAGE_CONFIG[account.stage].markerColor }}>
                <AccountIcon account={account} className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{account.hqCity}</p>
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium text-white mt-1"
                  style={{ backgroundColor: STAGE_CONFIG[account.stage].markerColor }}>
                  {STAGE_CONFIG[account.stage].label}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Est. Spaces</p>
                <p className="font-bold text-xl leading-tight mt-1">{account.estimatedSpaces}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Facilities</p>
                <p className="font-bold text-xl leading-tight mt-1">{account.facilityCount}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Focus Area</p>
                <p className="text-foreground text-sm">{account.focusArea}</p>
              </div>
              {account.currentVendor && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Current Vendor</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
                    <Swords className="w-3.5 h-3.5" />
                    {account.currentVendor}
                  </span>
                </div>
              )}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Differentiator</p>
                <p className="text-muted-foreground text-sm">{account.differentiator}</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2 border-t border-border">
              {account.caseStudyUrl && (
                <a href={account.caseStudyUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium">
                  Case study <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <a href={account.website} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium">
                Website <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* ── Find Contacts ── */}
            {account.id !== "acct-flash-hq" && (
              <div className="border-t border-border pt-3 space-y-2">
                {!leads && !isLoading && (
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={() => onFindContacts(account)}>
                    <Users className="w-3.5 h-3.5" />
                    Find Decision-Makers
                  </Button>
                )}
                {isLoading && (
                  <div className="flex items-center gap-2 justify-center py-3 text-xs text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing persona & searching…
                  </div>
                )}
                {persona && (
                  <div className="bg-primary/5 border border-primary/10 rounded-lg p-2.5">
                    <p className="text-[10px] text-primary/70 uppercase tracking-wider font-semibold mb-1">🎯 AI-Defined Persona</p>
                    <p className="text-[11px] text-foreground/80 leading-relaxed line-clamp-4">{persona}</p>
                  </div>
                )}
                {leads && leads.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Top {leads.length} Ranked Leads
                    </p>
                    {leads.map((lead: any, i: number) => (
                      <div key={i} className="bg-muted/40 rounded-lg p-2.5 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-primary bg-primary/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                                {i + 1}
                              </span>
                              <p className="text-xs font-semibold text-foreground truncate">{lead.name}</p>
                            </div>
                            {lead.title && <p className="text-[11px] text-muted-foreground ml-7">{lead.title}</p>}
                          </div>
                          {lead.score != null && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                              lead.score >= 80 ? "bg-green-500/10 text-green-600" :
                              lead.score >= 60 ? "bg-yellow-500/10 text-yellow-600" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {lead.score}
                            </span>
                          )}
                        </div>
                        {lead.reason && (
                          <p className="text-[10px] text-primary/70 ml-7">💡 {lead.reason}</p>
                        )}
                        <div className="flex items-center gap-3 flex-wrap ml-7">
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                              <Mail className="w-3 h-3" /> {lead.email}
                            </a>
                          )}
                          {lead.linkedin && (
                            <a href={lead.linkedin} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                              <Linkedin className="w-3 h-3" /> LinkedIn
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {leads && leads.length === 0 && !isLoading && (
                  <p className="text-xs text-muted-foreground text-center py-2">No contacts found</p>
                )}
              </div>
            )}
          </div>
        )}
        {site && (
          <div className="p-4 space-y-3">
            <p className="text-[11px] text-muted-foreground">{site.address}</p>
            <div className="space-y-1.5 text-sm">
              <p><span className="font-medium">Operator:</span> {site.operator}</p>
              <p className="text-muted-foreground">{site.scope}</p>
              {site.notes && <p className="text-muted-foreground text-xs">{site.notes}</p>}
            </div>
            {site.sourceUrl && (
              <a href={site.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium">
                Source <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
/* ── Stats Banner ── */
function StatsBanner() {
  const activeCount = ALL_ACCOUNTS.filter((a) => a.stage === "active").length;
  const targetCount = ALL_ACCOUNTS.filter((a) => a.stage === "target").length;
  const whitespaceCount = ALL_ACCOUNTS.filter((a) => a.stage === "whitespace").length;
  const competitorCount = ALL_ACCOUNTS.filter((a) => a.stage === "competitor").length;
  return (
    <div className="px-3 py-2 space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-base font-bold text-foreground">{FLASH_PLATFORM_STATS.totalLocations}</p>
          <p className="text-[9px] text-muted-foreground leading-tight">Locations</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-base font-bold text-foreground">{FLASH_PLATFORM_STATS.networkLocations}</p>
          <p className="text-[9px] text-muted-foreground leading-tight">Network</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-base font-bold text-foreground">{ALL_ACCOUNTS.length}</p>
          <p className="text-[9px] text-muted-foreground leading-tight">Accounts</p>
        </div>
      </div>
      <div className="flex gap-1.5 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_CONFIG.active.markerColor }} />{activeCount} Active</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_CONFIG.target.markerColor }} />{targetCount} Target</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_CONFIG.whitespace.markerColor }} />{whitespaceCount} Whitespace</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_CONFIG.competitor.markerColor }} />{competitorCount} Competitor</span>
      </div>
    </div>
  );
}

/* ── Stage filter toggle ── */
function StageToggle({ stage, active, onClick }: { stage: AccountStage; active: boolean; onClick: () => void }) {
  const cfg = STAGE_CONFIG[stage];
  const count = ALL_ACCOUNTS.filter((a) => a.stage === stage).length;
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
        active ? "border-foreground/20 bg-foreground/5" : "border-transparent bg-muted/30 text-muted-foreground opacity-50"
      }`}>
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.markerColor }} />
      {cfg.label}
      <span className="text-muted-foreground text-[10px]">{count}</span>
    </button>
  );
}

/* ── Account type filter ── */
function TypeToggle({ type, active, onClick }: { type: AccountType; active: boolean; onClick: () => void }) {
  const count = ALL_ACCOUNTS.filter((a) => a.accountType === type).length;
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
       active ? "border-foreground/20 bg-foreground/5" : "border-transparent bg-muted/30 text-muted-foreground opacity-50"
      }`}>
      {type === "airport" ? <Plane className="w-3 h-3" /> : type === "large_venue" ? <Building2 className="w-3 h-3" /> : <Grid3X3 className="w-3 h-3" />}
      {type === "airport" ? "Airport" : type === "large_venue" ? "Large Venue" : "Fleet Operator"}
      <span className="text-muted-foreground text-[10px]">{count}</span>
    </button>
  );
}

/* ── Account Card ── */
function AccountCard({ account, isSelected, onClick }: { account: FlashAccount; isSelected: boolean; onClick: () => void }) {
  const cfg = STAGE_CONFIG[account.stage];
  return (
    <button onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg transition-all border ${
        isSelected ? "bg-primary/5 border-primary/20" : "hover:bg-muted/60 border-transparent"
      }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <AccountIcon account={account} className="w-3 h-3 text-muted-foreground shrink-0" />
            <p className="text-xs font-semibold leading-tight">{account.name}</p>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{account.hqCity}</p>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white shrink-0" style={{ backgroundColor: cfg.markerColor }}>
          {cfg.label}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-1 text-[11px]">
        <span className="text-muted-foreground"><span className="font-medium text-foreground">{account.estimatedSpaces}</span> spaces</span>
        <span className="text-muted-foreground">{account.facilityCount}</span>
      </div>
      {account.currentVendor && (
        <p className="text-[10px] text-destructive mt-0.5">⚔ {account.currentVendor}</p>
      )}
      <p className="text-[10px] text-muted-foreground mt-0.5">{account.differentiator}</p>
    </button>
  );
}

/* ── Z-index by priority ── */
const STAGE_Z: Record<string, number> = { whitespace: 1, target: 2, active: 3, competitor: 4 };

function getMarkerZ(account: FlashAccount) {
  if (account.id === "acct-flash-hq") return 100;
  return STAGE_Z[account.stage] ?? 1;
}

/* ── Map content ── */
function MapContent({ accounts, onSelectAccount, showDeployed, deployedLocations, onSelectSite }: {
  accounts: FlashAccount[];
  onSelectAccount: (a: FlashAccount) => void;
  showDeployed: boolean; deployedLocations: FlashLocation[];
  onSelectSite: (l: FlashLocation) => void;
}) {
  return (
    <>
      {showDeployed && deployedLocations.map((loc) => (
        <AdvancedMarker key={loc.id} position={{ lat: loc.lat, lng: loc.lng }} zIndex={0} onClick={() => onSelectSite(loc)}>
          <DeployedSitePin />
        </AdvancedMarker>
      ))}
      {accounts.map((acct) => (
        <AdvancedMarker key={acct.id} position={{ lat: acct.hqLat, lng: acct.hqLng }} zIndex={getMarkerZ(acct)} onClick={() => onSelectAccount(acct)}>
          <AccountPin account={acct} />
        </AdvancedMarker>
      ))}
    </>
  );
}


/* ── Main page ── */
export default function FlashParkingMap() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<Set<AccountStage>>(new Set(["active", "target", "whitespace", "competitor"]));
  const [typeFilter, setTypeFilter] = useState<Set<AccountType>>(new Set(["large_venue", "fleet_operator", "airport"]));
  const [showDeployed, setShowDeployed] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [accountLeads, setAccountLeads] = useState<Record<string, AccountLeadResult>>({});
  const [loadingLeads, setLoadingLeads] = useState<Set<string>>(new Set());

  const toggleStage = useCallback((s: AccountStage) => {
    setStageFilter((prev) => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });
  }, []);

  const toggleType = useCallback((t: AccountType) => {
    setTypeFilter((prev) => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ALL_ACCOUNTS.filter((a) => {
      if (a.stage === "hq") return true; // always show Flash HQ
      if (!stageFilter.has(a.stage)) return false;
      if (!typeFilter.has(a.accountType)) return false;
      if (q) {
        const hay = `${a.name} ${a.hqCity} ${a.focusArea} ${a.differentiator}`.toLowerCase();
        return q.split(/\s+/).every((w) => hay.includes(w));
      }
      return true;
    });
  }, [stageFilter, typeFilter, searchQuery]);

  const handleSelectAccount = useCallback((a: FlashAccount) => {
    setSelectedAccountId(a.id);
    setSelectedSiteId(null);
  }, []);

  const handleSelectSite = useCallback((l: FlashLocation) => {
    setSelectedSiteId(l.id);
    setSelectedAccountId(null);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedAccountId(null);
    setSelectedSiteId(null);
  }, []);

  const handleFindContacts = useCallback(async (account: FlashAccount) => {
    if (loadingLeads.has(account.id) || accountLeads[account.id]) return;
    setLoadingLeads(prev => new Set(prev).add(account.id));
    try {
      const domain = account.website.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      const vendorContext = account.currentVendor ? ` They currently use ${account.currentVendor} for parking.` : "";
      const typeContext = account.accountType === "airport" ? "airport parking operations" : account.accountType === "large_venue" ? "large venue parking management" : "fleet/parking operations";

      const { data, error } = await supabase.functions.invoke("leadgen-chat", {
        body: {
          website: account.website,
          messages: [{
            role: "user",
            content: `You are prospecting ${account.name} (${domain}), a ${typeContext} company in ${account.hqCity} with ~${account.estimatedSpaces} parking spaces across ${account.facilityCount} facilities.${vendorContext} Focus area: ${account.focusArea}.

First, define the ideal buyer persona for selling Flash parking management software to this account. Consider their industry, size, and current vendor.

Then find the top 5 decision-makers matching that persona. For each lead, assign a fit score 0-100 based on:
- Title/seniority alignment with parking technology purchasing
- Company relevance to Flash's parking solutions
- Decision-making authority

Return leads ranked by score (highest first). Include a "score" field (0-100) and a "reason" field explaining why they're a good prospect.

Use run_lead_search immediately.`
          }]
        },
      });
      if (error) throw error;
      const reader = (data as ReadableStream<Uint8Array>).getReader();
      const collectedLeads: any[] = [];
      let personaText = "";
      await parseSSEStream(reader, {
        onLeads: (leads) => {
          collectedLeads.push(...leads);
          const sorted = [...collectedLeads].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5);
          setAccountLeads(prev => ({ ...prev, [account.id]: { persona: personaText, leads: sorted } }));
        },
        onTextDelta: (chunk) => {
          personaText += chunk;
          setAccountLeads(prev => ({ ...prev, [account.id]: { persona: personaText, leads: [...collectedLeads].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5) } }));
        },
        onDone: () => {
          const sorted = [...collectedLeads].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5);
          setAccountLeads(prev => ({ ...prev, [account.id]: { persona: personaText || undefined, leads: sorted } }));
        }
      });
      if (collectedLeads.length === 0) {
        setAccountLeads(prev => ({ ...prev, [account.id]: { persona: personaText || undefined, leads: [] } }));
      }
    } catch (err) {
      console.error("Find contacts error:", err);
      setAccountLeads(prev => ({ ...prev, [account.id]: { leads: [] } }));
    } finally {
      setLoadingLeads(prev => { const n = new Set(prev); n.delete(account.id); return n; });
    }
  }, [loadingLeads, accountLeads]);

  const selectedAccount = useMemo(() => ALL_ACCOUNTS.find((a) => a.id === selectedAccountId) ?? null, [selectedAccountId]);
  const selectedSite = useMemo(() => FLASH_LOCATIONS.find((l) => l.id === selectedSiteId) ?? null, [selectedSiteId]);

  if (!API_KEY) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh] p-8">
          <div className="text-center max-w-md space-y-4">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-bold">Google Maps API Key Required</h1>
          </div>
        </div>
      </>
    );
  }

  const sidebar = (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <img src={flashLogo} alt="Flash" className="w-8 h-8 object-contain" />
          <div>
            <h2 className="text-lg font-bold leading-tight">Flash Account Map</h2>
            <p className="text-xs text-muted-foreground">Partnership intelligence & pipeline</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search accounts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-8 text-xs bg-muted/40 border-0 focus-visible:ring-1" />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div className="px-3 pb-1">
          <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3 h-3" />
              Filters & Stats
            </span>
            <span className={`transition-transform ${filtersOpen ? "rotate-180" : ""}`}>▾</span>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <StatsBanner />

          {/* Stage filters */}
          <div className="px-3 pb-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Stage</p>
            <div className="flex flex-wrap gap-1">
              {(["active", "target", "whitespace", "competitor"] as AccountStage[]).map((s) => (
                <StageToggle key={s} stage={s} active={stageFilter.has(s)} onClick={() => toggleStage(s)} />
              ))}
            </div>
          </div>

          {/* Type filters */}
          <div className="px-3 pb-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Type</p>
            <div className="flex gap-1">
              {(["large_venue", "fleet_operator", "airport"] as AccountType[]).map((t) => (
                <TypeToggle key={t} type={t} active={typeFilter.has(t)} onClick={() => toggleType(t)} />
              ))}
            </div>
          </div>

        </CollapsibleContent>
      </Collapsible>

      <div className="h-px bg-border mx-3" />

      {/* Account list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No accounts match
            </div>
          )}
          {filtered.map((acct) => (
            <AccountCard key={acct.id} account={acct} isSelected={selectedAccountId === acct.id} onClick={() => handleSelectAccount(acct)} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <>
      <div className="flex h-screen w-full">
        {!isMobile && (
          <div className="w-80 border-r border-border bg-background shrink-0 flex flex-col overflow-hidden">
            {sidebar}
          </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button size="sm" className="absolute top-3 left-3 z-10 shadow-lg">
                  <Filter className="w-4 h-4 mr-1" /> Filters
                  <Badge variant="secondary" className="ml-1.5 text-xs">{filtered.length}</Badge>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetTitle className="sr-only">Account Filters</SheetTitle>
                {sidebar}
              </SheetContent>
            </Sheet>
          )}

          {/* Detail slide-in panel */}
          <DetailPanel account={selectedAccount} site={selectedSite} onClose={handleCloseDetail} accountLeads={accountLeads} loadingLeads={loadingLeads} onFindContacts={handleFindContacts} />

          {/* Legend */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-background/90 backdrop-blur border border-border rounded-lg px-4 py-2 flex gap-4 shadow-md text-xs">
            {(["active", "target", "whitespace", "competitor"] as AccountStage[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STAGE_CONFIG[s].markerColor }} />
                <span>{STAGE_CONFIG[s].label}</span>
              </div>
            ))}
            {showDeployed && (
              <div className="flex items-center gap-1.5 border-l border-border pl-4">
                <span className="w-3 h-3 rounded-full bg-gray-400/50 border border-gray-300" />
                <span>Deployed site</span>
              </div>
            )}
          </div>

          <APIProvider apiKey={API_KEY}>
            <Map mapId={MAP_ID} defaultCenter={{ lat: 39.0, lng: -98.0 }} defaultZoom={4.5}
              gestureHandling="greedy" disableDefaultUI={false} style={{ width: "100%", height: "100%" }}>
              <MapContent
                accounts={filtered}
                onSelectAccount={handleSelectAccount}
                showDeployed={showDeployed}
                deployedLocations={FLASH_LOCATIONS}
                onSelectSite={handleSelectSite}
              />
              
            </Map>
          </APIProvider>
        </div>
      </div>
    </>
  );
}
