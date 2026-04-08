import { useState, useMemo, useCallback, useEffect } from "react";
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
import { MapPin, Filter, ExternalLink, Search, X, Building2, Grid3X3, Zap, Eye, Swords, Plane, Users, Loader2, Linkedin, Mail, DollarSign, Calendar, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { parseSSEStream } from "@/lib/sse-parser";
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

  const showHQLabel = account.accountType === "fleet_operator";

  return (
    <div className="relative cursor-pointer group flex flex-col items-center">
      <div
        className="w-9 h-9 rounded-full border-[3px] border-white shadow-lg transition-all group-hover:scale-125 flex items-center justify-center"
        style={{ backgroundColor: cfg.markerColor }}
      >
        <AccountIcon account={account} className="w-4 h-4 text-white" />
      </div>
      {showHQLabel && (
        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-foreground bg-background/80 px-1 rounded shadow-sm">HQ</span>
      )}
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
/* ── Contact lead type ── */
interface AccountLead {
  name: string;
  title?: string;
  email?: string;
  linkedin?: string;
  score?: number;
  reason?: string;
}

interface AccountLeadData {
  leads: AccountLead[];
}

/* ── Place photo & address component ── */
interface PlaceData { photoUrl: string | null; address: string | null }
const placeCache: Record<string, PlaceData> = {};

async function searchPlace(query: string, lat: number, lng: number): Promise<{ photoUrl: string | null; address: string | null }> {
  const resp = await fetch(`https://places.googleapis.com/v1/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "places.photos,places.formattedAddress",
    },
    body: JSON.stringify({
      textQuery: query,
      locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 5000 } },
      maxResultCount: 1,
    }),
  });
  const data = await resp.json();
  const place = data?.places?.[0];
  const photoRef = place?.photos?.[0]?.name;
  const photoUrl = photoRef ? `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=400&key=${API_KEY}` : null;
  const address = place?.formattedAddress ?? null;
  return { photoUrl, address };
}

function PlaceInfo({ name, lat, lng, hqCity, children }: { name: string; lat: number; lng: number; hqCity?: string; children: (data: PlaceData) => React.ReactNode }) {
  const key = `${lat},${lng}`;
  const [data, setData] = useState<PlaceData>(placeCache[key] ?? { photoUrl: null, address: null });
  const [tried, setTried] = useState(key in placeCache);

  useEffect(() => {
    const k = `${lat},${lng}`;
    if (k in placeCache) { setData(placeCache[k]); setTried(true); return; }
    let cancelled = false;

    const cleanName = name
      .replace(/\s*\(HQ\)\s*/gi, "")
      .replace(/\s*\(Flash-owned\)\s*/gi, "")
      .replace(/\s*\(North America\)\s*/gi, "")
      .replace(/\s*\(fka[^)]*\)\s*/gi, "")
      .replace(/\s*HQ\s*$/i, "")
      .trim();

    (async () => {
      try {
        let result = await searchPlace(cleanName, lat, lng);

        if (!result.photoUrl && !cancelled) {
          const r2 = await searchPlace(`${cleanName} parking`, lat, lng);
          result = { photoUrl: r2.photoUrl, address: result.address || r2.address };
        }

        if (!result.photoUrl && !cancelled && hqCity) {
          const r3 = await searchPlace(`${hqCity} parking`, lat, lng);
          result = { photoUrl: r3.photoUrl, address: result.address || r3.address };
        }

        if (!result.photoUrl && !cancelled && hqCity) {
          const r4 = await searchPlace(hqCity, lat, lng);
          result = { photoUrl: r4.photoUrl, address: result.address || r4.address };
        }

        if (!cancelled) {
          placeCache[k] = result;
          setData(result);
        }
      } catch {
        placeCache[`${lat},${lng}`] = { photoUrl: null, address: null };
      }
      if (!cancelled) setTried(true);
    })();
    return () => { cancelled = true; };
  }, [name, lat, lng, hqCity]);

  if (!tried) return <div className="w-full h-32 rounded-lg bg-muted animate-pulse" />;
  return <>{children(data)}</>;
}

function DetailPanel({ account, site, onClose, accountLeads, loadingLeads, activityLog, onFindContacts }: {
  account: FlashAccount | null; site: FlashLocation | null; onClose: () => void;
  accountLeads: Record<string, AccountLeadData>; loadingLeads: Set<string>;
  activityLog: Record<string, string[]>;
  onFindContacts: (account: FlashAccount) => void;
}) {
  const isOpen = !!(account || site);
  return (
    <div className={`absolute top-0 right-0 z-[1000] w-96 h-full transition-transform duration-300 ease-out ${
      isOpen ? "translate-x-0" : "translate-x-full"
    }`}>
      <div className="h-full bg-background/80 backdrop-blur-xl border-l border-border shadow-2xl overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-background border-b border-border">
          {(() => {
            const displayName = account
              ? `${account.name}${account.accountType === "fleet_operator" ? " (HQ)" : ""}`
              : site?.name || "Details";
            const codeMatch = displayName.match(/\(([A-Z]{3})\)/);
            const airportCode = codeMatch ? codeMatch[1] : null;
            return (
              <div className="min-w-0 pr-2">
                <h3 className="font-bold text-base leading-tight">{displayName}</h3>
                {airportCode && (
                  <span className="text-xs font-mono text-muted-foreground">IATA: {airportCode}</span>
                )}
              </div>
            );
          })()}
          <button onClick={onClose}
            className="w-7 h-7 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center transition-colors shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        {account && (
          <PlaceInfo name={account.name} lat={account.hqLat} lng={account.hqLng} hqCity={account.hqCity}>
            {(placeData) => (
          <div className="p-3 space-y-2">
            {/* Location photo */}
            {placeData.photoUrl && (
              <div className="w-full h-32 rounded-lg overflow-hidden">
                <img src={placeData.photoUrl} alt={account.name} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
              </div>
            )}

            {/* Compact header row */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: STAGE_CONFIG[account.stage].markerColor }}>
                <AccountIcon account={account} className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground leading-tight">{account.accountType === "fleet_operator" ? `HQ: ${account.hqCity}` : account.hqCity}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] px-1.5 py-px rounded-full font-medium text-white" style={{ backgroundColor: STAGE_CONFIG[account.stage].markerColor }}>
                    {STAGE_CONFIG[account.stage].label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{account.estimatedSpaces} spaces · {account.facilityCount}</span>
                </div>
              </div>
            </div>

            {/* Address */}
            {placeData.address && (
              <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                <span>{placeData.address}</span>
              </div>
            )}

            {/* Stats grid */}
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

            {/* Inline metadata chips */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
              {account.currentVendor && (
                <span className="inline-flex items-center gap-1 text-destructive font-medium">
                  <Swords className="w-3 h-3" /> {account.currentVendor}
                </span>
              )}
              <span className="text-muted-foreground">{account.focusArea}</span>
            </div>

            {/* Links row */}
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

            {/* Leadgen: Find Decision-Makers */}
            {account.id !== "acct-flash-hq" && (
              <div className="pt-2 border-t border-border space-y-3">
                {!accountLeads[account.id] && !loadingLeads.has(account.id) && (
                  <Button size="sm" variant="outline" className="w-full" onClick={() => onFindContacts(account)}>
                    <Users className="w-4 h-4 mr-1.5" /> Find Decision-Makers
                  </Button>
                )}
                {loadingLeads.has(account.id) && (
                  <div className="space-y-1.5 py-2">
                    {(activityLog[account.id] || []).map((msg, i) => (
                      <div key={i} className={`flex items-start gap-2 text-[11px] ${i === (activityLog[account.id]?.length ?? 1) - 1 ? "text-foreground" : "text-muted-foreground"}`}>
                        {i === (activityLog[account.id]?.length ?? 1) - 1 ? (
                          <Loader2 className="w-3 h-3 animate-spin shrink-0 mt-0.5" />
                        ) : (
                          <span className="w-3 h-3 shrink-0 mt-0.5 text-center text-[9px]">✓</span>
                        )}
                        <span>{msg}</span>
                      </div>
                    ))}
                  </div>
                )}
                {accountLeads[account.id] && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{accountLeads[account.id].leads.length} Decision-Makers</p>
                    {accountLeads[account.id].leads.map((lead, i) => {
                      const initials = lead.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                      return (
                        <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-colors">
                          <div className="relative shrink-0">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                              {initials}
                            </div>
                            {lead.score != null && (
                              <span className={`absolute -bottom-1 -right-1 text-[9px] font-bold px-1 py-px rounded-full border border-background ${
                                lead.score >= 80 ? "bg-green-500 text-white" : lead.score >= 60 ? "bg-yellow-500 text-white" : "bg-muted text-muted-foreground"
                              }`}>{lead.score}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold leading-tight truncate">{lead.name}</p>
                            {lead.title && <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{lead.title}</p>}
                            {lead.reason && <p className="text-[10px] text-muted-foreground/70 mt-1 leading-snug">{lead.reason}</p>}
                            <div className="flex gap-3 mt-1.5">
                              {lead.email && (
                                <a href={`mailto:${lead.email}`} className="text-primary hover:text-primary/80 text-[10px] inline-flex items-center gap-1 font-medium">
                                  <Mail className="w-3 h-3" /> Email
                                </a>
                              )}
                              {lead.linkedin && (
                                <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 text-[10px] inline-flex items-center gap-1 font-medium">
                                  <Linkedin className="w-3 h-3" /> LinkedIn
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
            )}
          </PlaceInfo>
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
/* ── Compact Stats Row ── */
function StatsRow() {
  return (
    <div className="flex items-center gap-2 px-3 py-1">
      <span className="text-[10px] text-muted-foreground"><span className="font-bold text-foreground text-xs">{FLASH_PLATFORM_STATS.totalLocations}</span> loc</span>
      <span className="text-muted-foreground/30">·</span>
      <span className="text-[10px] text-muted-foreground"><span className="font-bold text-foreground text-xs">{FLASH_PLATFORM_STATS.networkLocations}</span> net</span>
      <span className="text-muted-foreground/30">·</span>
      <span className="text-[10px] text-muted-foreground"><span className="font-bold text-foreground text-xs">{ALL_ACCOUNTS.length}</span> accts</span>
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
      {type === "airport" ? "Airport" : type === "large_venue" ? "Large Venue" : "Parking Operator HQ"}
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
            <p className="text-xs font-semibold leading-tight">{account.name}{account.accountType === "fleet_operator" ? " HQ" : ""}</p>
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
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [accountLeads, setAccountLeads] = useState<Record<string, AccountLeadData>>({});
  const [loadingLeads, setLoadingLeads] = useState<Set<string>>(new Set());
  const [activityLog, setActivityLog] = useState<Record<string, string[]>>({});




  const toggleStage = useCallback((s: AccountStage) => {
    setStageFilter((prev) => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });
  }, []);

  const toggleType = useCallback((t: AccountType) => {
    setTypeFilter((prev) => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ALL_ACCOUNTS.filter((a) => {
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
    setLoadingLeads((prev) => new Set(prev).add(account.id));

    const addLog = (msg: string) => {
      setActivityLog((prev) => ({ ...prev, [account.id]: [...(prev[account.id] || []), msg] }));
    };

    try {
      const domain = account.website.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      addLog(`Analyzing ${account.name} account profile`);

      const vendorNote = account.currentVendor && account.currentVendor !== "Unknown"
        ? `Current parking technology vendor: ${account.currentVendor}. Frame the outreach as a competitive displacement opportunity.`
        : "No known incumbent vendor — this is a greenfield opportunity.";
      const stageNote = account.stage === "active"
        ? "This is an EXISTING Flash customer — find contacts for upsell/expansion conversations (EV charging, mobile payments, analytics)."
        : account.stage === "competitor"
        ? "This account uses a competitor's platform — find contacts for competitive displacement outreach."
        : account.stage === "target"
        ? "This is a priority target account — find the right entry points for initial outreach."
        : "This is a whitespace opportunity — find contacts to open a net-new relationship.";

      const FLASH_CONTEXT = `You are prospecting on behalf of Flash, a cloud-based parking technology platform (PARCS, EV charging, mobile payments, analytics) powering 16,000+ locations. ${stageNote} ${vendorNote}`;

      let content: string;
      if (account.accountType === "airport") {
        content = `${FLASH_CONTEXT}\n\nAccount: ${account.name} (${domain}) — a commercial airport with ${account.estimatedSpaces} parking spaces across ${account.facilityCount}.\n\nCRITICAL: Search ONLY within the airport authority/corporation that operates this airport — use domain "${domain}". Do NOT search broadly by city.\n\nFlash sells airports: cloud PARCS to replace legacy gate hardware, real-time occupancy & wayfinding, mobile pre-booking, EV charging infrastructure, and revenue analytics dashboards.\n\nTarget these airport-specific titles (in priority order):\n1. Director/VP of Parking & Ground Transportation\n2. Chief Commercial/Revenue Officer\n3. Director of Landside Operations\n4. Airport Director/CEO (for smaller airports)\n5. VP of Facilities & Infrastructure\n\nReturn the top 5 decision-makers ranked by fit score (0-100). Include "score", "reason" (why they'd buy Flash), and "title" fields. Score higher for: direct parking oversight, revenue responsibility, technology modernization mandate.`;
      } else if (account.accountType === "large_venue") {
        content = `${FLASH_CONTEXT}\n\nAccount: ${account.name} (${domain}) — a large venue operator in ${account.hqCity} with ${account.estimatedSpaces} parking spaces across ${account.facilityCount}. Focus: ${account.focusArea}.\n\nSearch within organization domain "${domain}" first, then broaden to the parent organization if needed.\n\nFlash sells venues: frictionless entry/exit (LPR, touchless), dynamic pricing, event-day surge management, mobile pre-booking, EV charging, and real-time occupancy dashboards.\n\nTarget these venue-specific titles (in priority order):\n1. VP/Director of Parking Operations\n2. VP/Director of Facilities & Operations\n3. Chief Operating Officer\n4. VP of Guest Experience / Fan Experience\n5. Director of Revenue Operations / Commercial Strategy\n\nReturn the top 5 decision-makers ranked by fit score (0-100). Include "score", "reason" (why they'd buy Flash), and "title" fields. Score higher for: parking P&L ownership, technology budget authority, guest experience mandate.`;
      } else {
        content = `${FLASH_CONTEXT}\n\nAccount: ${account.name} (${domain}) — a fleet/multi-site parking operator in ${account.hqCity} with ${account.estimatedSpaces} spaces across ${account.facilityCount}. Focus: ${account.focusArea}.\n\nSearch within organization domain "${domain}".\n\nFlash sells operators: unified cloud PARCS across all locations, real-time revenue dashboards, mobile-first consumer experience, LPR & touchless lanes, EV charging network, and white-label booking.\n\nTarget these operator-specific titles (in priority order):\n1. VP/SVP of Operations\n2. Chief Operating Officer / Chief Technology Officer\n3. VP of Technology / IT Director\n4. VP of Revenue Management / Commercial Strategy\n5. Regional VP / Director of Operations\n\nReturn the top 5 decision-makers ranked by fit score (0-100). Include "score", "reason" (why they'd buy Flash), and "title" fields. Score higher for: multi-site technology decisions, operations P&L ownership, digital transformation initiatives.`;
      }

      await new Promise((r) => setTimeout(r, 800));
      addLog(`Defining buyer persona for ${account.accountType === "airport" ? "airport authority" : account.accountType === "large_venue" ? "venue operator" : "parking operator"}`);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();

      await new Promise((r) => setTimeout(r, 600));
      addLog(`Querying contact database for ${domain}`);

      const resp = await fetch(`${supabaseUrl}/functions/v1/leadgen-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? supabaseKey}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({ website: "flashparking.com", messages: [{ role: "user", content }] }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No response body");

      addLog("Matching seniority filters: Director, VP, C-Suite");

      const collectedLeads: any[] = [];
      let gotLeads = false;
      await parseSSEStream(reader, {
        onTextDelta: () => {},
        onLeads: (leads) => {
          if (!gotLeads) {
            addLog(`Scoring ${leads.length} candidates by fit`);
            gotLeads = true;
          }
          collectedLeads.push(...leads);
          const sorted = [...collectedLeads].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5);
          setAccountLeads((prev) => ({ ...prev, [account.id]: { leads: sorted } }));
        },
        onDone: () => {
          const sorted = [...collectedLeads].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5);
          setAccountLeads((prev) => ({ ...prev, [account.id]: { leads: sorted } }));
        },
      });
    } catch (e) {
      console.error("Find contacts failed:", e);
      addLog("Search failed — try again");
    } finally {
      setLoadingLeads((prev) => { const n = new Set(prev); n.delete(account.id); return n; });
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
          <StatsRow />
          <div className="px-3 pb-1.5">
            <div className="flex flex-wrap gap-1">
              {(["active", "target", "whitespace", "competitor"] as AccountStage[]).map((s) => (
                <StageToggle key={s} stage={s} active={stageFilter.has(s)} onClick={() => toggleStage(s)} />
              ))}
            </div>
          </div>
          <div className="px-3 pb-1.5">
            <div className="flex flex-wrap gap-1">
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
          <DetailPanel account={selectedAccount} site={selectedSite} onClose={handleCloseDetail}
            accountLeads={accountLeads} loadingLeads={loadingLeads} activityLog={activityLog} onFindContacts={handleFindContacts} />

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
