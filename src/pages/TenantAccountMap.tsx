import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { APIProvider, Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { useTenant } from "@/contexts/TenantContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { MapPin, Filter, ExternalLink, Search, Building2, Grid3X3, Zap, Swords, Plane, Warehouse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { parseSSEStream } from "@/lib/sse-parser";
import AccountListView from "@/components/enterprise/AccountListView";
import AccountDetailInline from "@/components/enterprise/AccountDetailInline";
import DataPipelineSection from "@/components/enterprise/DataPipelineSection";
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

const STATIC_ALL_ACCOUNTS = [...FLASH_ACCOUNTS, ...FLASH_AIRPORT_ACCOUNTS];

/* ── Hook: load accounts from DB with static fallback ── */
function useDBAccounts(): { accounts: FlashAccount[]; loading: boolean } {
  const [dbAccounts, setDbAccounts] = useState<FlashAccount[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await (supabase.from("flash_accounts") as any).select("*").order("name");
        if (error || !data || data.length === 0) {
          setDbAccounts(null);
          setLoading(false);
          return;
        }
        const mapped: FlashAccount[] = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          accountType: r.account_type as AccountType,
          stage: r.stage as AccountStage,
          estimatedSpaces: r.estimated_spaces || "N/A",
          facilityCount: r.facility_count || "N/A",
          focusArea: r.focus_area || "",
          hqCity: r.hq_city || "",
          hqLat: r.hq_lat || 0,
          hqLng: r.hq_lng || 0,
          website: r.website || "",
          differentiator: r.differentiator || "",
          caseStudyUrl: r.case_study_url || undefined,
          currentVendor: r.current_vendor || undefined,
          annualRevenue: r.annual_revenue || undefined,
          employeeCount: r.employee_count || undefined,
          founded: r.founded || undefined,
          priorityScore: r.priority_score || 0,
          notes: r.notes || undefined,
          // pass through DB-only fields for scoring
          ownership_type: r.ownership_type,
          contract_model: r.contract_model,
        }));
        setDbAccounts(mapped);
      } catch {
        setDbAccounts(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { accounts: dbAccounts ?? STATIC_ALL_ACCOUNTS, loading };
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "AIzaSyDMSptsCr9hKesJxuvh-sKL1z_gCj371z0";
const MAP_ID = "flash-parking-map";

/* ── Pin components ── */
function AccountIcon({ account, className }: { account: FlashAccount; className?: string }) {
  if (account.accountType === "airport") return <Plane className={className} />;
  if (account.stage === "competitor") return <Swords className={className} />;
  if (account.accountType === "large_venue") return <Building2 className={className} />;
  return <Grid3X3 className={className} />;
}

function AccountPin({ account, tenantLogo }: { account: FlashAccount; tenantLogo: string }) {
  const cfg = STAGE_CONFIG[account.stage];
  const isHQ = account.id === "acct-flash-hq";
  if (isHQ && tenantLogo) {
    return (
      <div className="relative cursor-pointer group">
        <div className="w-11 h-11 rounded-full border-[3px] border-primary shadow-lg transition-all group-hover:scale-125 flex items-center justify-center bg-white">
          <img src={tenantLogo} alt="HQ" className="w-7 h-7 object-contain" />
        </div>
      </div>
    );
  }
  return (
    <div className="relative cursor-pointer group flex flex-col items-center">
      <div className="w-9 h-9 rounded-full border-[3px] border-white shadow-lg transition-all group-hover:scale-125 flex items-center justify-center"
        style={{ backgroundColor: cfg.markerColor }}>
        <AccountIcon account={account} className="w-4 h-4 text-white" />
      </div>
      {account.accountType === "fleet_operator" && (
        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-foreground bg-background/80 px-1 rounded shadow-sm">HQ</span>
      )}
    </div>
  );
}

function DeployedSitePin() {
  return <div className="cursor-pointer"><div className="w-3 h-3 rounded-full bg-gray-400/50 border border-white/60" /></div>;
}

const OPERATOR_COLORS: Record<string, string> = {
  "Joe's Auto Parks": "#e65100", "LAZ Parking": "#1565c0", "SP Plus": "#2e7d32",
  "ParkABM": "#6a1b9a", "ABM": "#6a1b9a", "Perfect Parking": "#00838f",
};
function getOperatorColor(op: string | null): string {
  if (!op) return "#b0bec5";
  return OPERATOR_COLORS[op] ?? "#78909c";
}

function GaragePin({ operator, capacity }: { operator?: string | null; capacity?: number | null }) {
  const color = getOperatorColor(operator);
  const label = operator && operator !== "Unknown" && operator !== "Independent" ? operator : null;
  return (
    <div className="cursor-pointer group flex flex-col items-center">
      <div className="w-4 h-4 rounded-sm border border-white/80 shadow-sm transition-all group-hover:scale-150 flex items-center justify-center"
        style={{ backgroundColor: color }}>
        <Warehouse className="w-2.5 h-2.5 text-white" />
      </div>
      {label && (
        <span className="mt-0.5 text-[7px] font-bold uppercase tracking-wider text-foreground bg-background/80 px-1 rounded shadow-sm whitespace-nowrap max-w-[80px] truncate">
          {label}
        </span>
      )}
    </div>
  );
}

interface DiscoveredGarage {
  id: string; place_id: string; name: string; address: string | null;
  lat: number; lng: number; rating: number | null; reviews_count: number;
  photo_reference: string | null; types: string[]; operator_guess: string | null;
  scan_zone: string | null; website: string | null; phone: string | null;
  capacity: number | null; capacity_source: string | null;
}

interface AccountLeadData {
  leads: { name: string; title?: string; email?: string; linkedin?: string; score?: number; reason?: string }[];
}

/* ── Z-index by priority ── */
const STAGE_Z: Record<string, number> = { whitespace: 1, target: 2, active: 3, competitor: 4 };
function getMarkerZ(account: FlashAccount) {
  if (account.id === "acct-flash-hq") return 100;
  return STAGE_Z[account.stage] ?? 1;
}

/* ── Map content ── */
function MapContent({ accounts, onSelectAccount, showDeployed, deployedLocations, onSelectSite, garages, showGarages, onSelectGarage }: {
  accounts: FlashAccount[];
  onSelectAccount: (a: FlashAccount) => void;
  showDeployed: boolean; deployedLocations: FlashLocation[];
  onSelectSite: (l: FlashLocation) => void;
  garages: DiscoveredGarage[];
  showGarages: boolean;
  onSelectGarage: (g: DiscoveredGarage) => void;
}) {
  return (
    <>
      {showDeployed && deployedLocations.map(loc => (
        <AdvancedMarker key={loc.id} position={{ lat: loc.lat, lng: loc.lng }} zIndex={0} onClick={() => onSelectSite(loc)}>
          <DeployedSitePin />
        </AdvancedMarker>
      ))}
      {showGarages && garages.map(g => (
        <AdvancedMarker key={g.id} position={{ lat: g.lat, lng: g.lng }} zIndex={0} onClick={() => onSelectGarage(g)}>
          <GaragePin operator={g.operator_guess} capacity={g.capacity} />
        </AdvancedMarker>
      ))}
      {accounts.map(acct => (
        <AdvancedMarker key={acct.id} position={{ lat: acct.hqLat, lng: acct.hqLng }} zIndex={getMarkerZ(acct)} onClick={() => onSelectAccount(acct)}>
          <AccountPin account={acct} />
        </AdvancedMarker>
      ))}
    </>
  );
}

/* ── Map viewport sync ── */
interface ViewportHint { lat: number; lng: number; zoom: number }

function MapViewportSync({ hint }: { hint: ViewportHint | null }) {
  const map = useMap();
  const prevRef = useRef<string>("");
  useEffect(() => {
    if (!map || !hint) return;
    const key = `${hint.lat},${hint.lng},${hint.zoom}`;
    if (key === prevRef.current) return;
    prevRef.current = key;
    map.panTo({ lat: hint.lat, lng: hint.lng });
    map.setZoom(hint.zoom);
  }, [map, hint]);
  return null;
}

/* ── Main page ── */
export default function FlashParkingMap() {
  const isMobile = useIsMobile();
  const { accounts: allAccounts } = useDBAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showDeployed, setShowDeployed] = useState(false);
  const [accountLeads, setAccountLeads] = useState<Record<string, AccountLeadData>>({});
  const [loadingLeads, setLoadingLeads] = useState<Set<string>>(new Set());
  const [activityLog, setActivityLog] = useState<Record<string, string[]>>({});
  const [showGarages, setShowGarages] = useState(false);
  const [laGarages, setLaGarages] = useState<DiscoveredGarage[]>([]);
  const [showOnlyOperators, setShowOnlyOperators] = useState(true);
  const [viewportHint, setViewportHint] = useState<ViewportHint | null>(null);

  const displayedGarages = useMemo(() =>
    showOnlyOperators ? laGarages.filter(g => g.operator_guess) : laGarages
  , [laGarages, showOnlyOperators]);

  const selectedAccount = useMemo(() => allAccounts.find(a => a.id === selectedAccountId) ?? null, [selectedAccountId, allAccounts]);

  const handleSelectAccount = useCallback((a: FlashAccount) => {
    setSelectedAccountId(a.id);
    // Auto-zoom to account HQ
    if (a.hqLat && a.hqLng) {
      setViewportHint({ lat: a.hqLat, lng: a.hqLng, zoom: 12 });
    }
  }, []);

  const handleBack = useCallback(() => {
    setSelectedAccountId(null);
  }, []);

  const handleFindContacts = useCallback(async (account: FlashAccount, mode: "solution" | "ma" = "solution") => {
    if (loadingLeads.has(account.id) || accountLeads[account.id]) return;
    setLoadingLeads(prev => new Set(prev).add(account.id));

    const addLog = (msg: string) => {
      setActivityLog(prev => ({ ...prev, [account.id]: [...(prev[account.id] || []), msg] }));
    };

    try {
      const domain = account.website.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      addLog(`Analyzing ${account.name} account profile`);

      const vendorNote = account.currentVendor && account.currentVendor !== "Unknown"
        ? `Current parking technology vendor: ${account.currentVendor}. Frame the outreach as a competitive displacement opportunity.`
        : "No known incumbent vendor — this is a greenfield opportunity.";
      const stageNote = account.stage === "active"
        ? "This is an EXISTING Flash customer — find contacts for upsell/expansion conversations."
        : account.stage === "competitor"
        ? "This account uses a competitor's platform — find contacts for competitive displacement outreach."
        : account.stage === "target"
        ? "This is a priority target account — find the right entry points for initial outreach."
        : "This is a whitespace opportunity — find contacts to open a net-new relationship.";

      const FLASH_CONTEXT = `You are prospecting on behalf of Flash, a cloud-based parking technology platform (PARCS, EV charging, mobile payments, analytics) powering 16,000+ locations. ${stageNote} ${vendorNote}`;

      let content: string;
      if (mode === "ma") {
        content = `${FLASH_CONTEXT}\n\nAccount: ${account.name} (${domain}) — ${account.accountType === "airport" ? "a commercial airport" : "a parking operator"} in ${account.hqCity} with ${account.estimatedSpaces} spaces across ${account.facilityCount}.\n\nMODE: M&A / Corporate Development contacts. Search domain "${domain}".\n\nTarget titles: CFO, VP Corporate Development, CEO, General Counsel, VP Strategy, Chief Strategy Officer, Board Member.\n\nReturn top 5 decision-makers with "score", "reason", "title" fields.`;
      } else if (account.accountType === "airport") {
        content = `${FLASH_CONTEXT}\n\nAccount: ${account.name} (${domain}) — a commercial airport with ${account.estimatedSpaces} parking spaces across ${account.facilityCount}.\n\nCRITICAL: Search ONLY within the airport authority/corporation — use domain "${domain}".\n\nTarget titles: Director/VP of Parking & Ground Transportation, Chief Commercial/Revenue Officer, Director of Landside Operations, Airport Director/CEO, VP of Facilities.\n\nReturn top 5 decision-makers with "score", "reason", "title" fields.`;
      } else if (account.accountType === "large_venue") {
        content = `${FLASH_CONTEXT}\n\nAccount: ${account.name} (${domain}) — a large venue operator in ${account.hqCity} with ${account.estimatedSpaces} parking spaces across ${account.facilityCount}.\n\nSearch domain "${domain}" first.\n\nTarget titles: VP/Director of Parking Operations, VP of Facilities, COO, VP of Guest Experience, Director of Revenue Operations.\n\nReturn top 5 decision-makers with "score", "reason", "title" fields.`;
      } else {
        content = `${FLASH_CONTEXT}\n\nAccount: ${account.name} (${domain}) — a parking operator in ${account.hqCity} with ${account.estimatedSpaces} spaces across ${account.facilityCount}.\n\nSearch domain "${domain}".\n\nTarget titles: VP/SVP of Operations, COO/CTO, VP of Technology, VP of Revenue, Regional VP.\n\nReturn top 5 decision-makers with "score", "reason", "title" fields.`;
      }

      await new Promise(r => setTimeout(r, 800));
      addLog(`Defining buyer persona`);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();

      await new Promise(r => setTimeout(r, 600));
      addLog(`Querying contact database for ${domain}`);

      const resp = await fetch(`${supabaseUrl}/functions/v1/leadgen-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? supabaseKey}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({ website: "flashparking.com", messages: [{ role: "user", content }], strict_domain: true }),
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
          if (!gotLeads) { addLog(`Scoring ${leads.length} candidates by fit`); gotLeads = true; }
          collectedLeads.push(...leads);
          const sorted = [...collectedLeads].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5);
          setAccountLeads(prev => ({ ...prev, [account.id]: { leads: sorted } }));
        },
        onDone: () => {
          const sorted = [...collectedLeads].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5);
          setAccountLeads(prev => ({ ...prev, [account.id]: { leads: sorted } }));
          addLog(collectedLeads.length > 0 ? `Found ${Math.min(collectedLeads.length, 5)} decision-makers` : "No matching contacts found");
        },
      });
    } catch (e) {
      console.error("Find contacts failed:", e);
      addLog("Search failed — try again");
    } finally {
      setLoadingLeads(prev => { const n = new Set(prev); n.delete(account.id); return n; });
    }
  }, [loadingLeads, accountLeads]);

  if (!API_KEY) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-8">
        <div className="text-center max-w-md space-y-4">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Google Maps API Key Required</h1>
        </div>
      </div>
    );
  }

  const sidebar = (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <img src={flashLogo} alt="Flash" className="w-8 h-8 object-contain" />
          <div>
            <h2 className="text-lg font-bold leading-tight">Flash Accounts</h2>
            <p className="text-xs text-muted-foreground">{allAccounts.length} operators · Pipeline & intelligence</p>
          </div>
        </div>
      </div>

      {/* Main content: list or detail */}
      {selectedAccount ? (
        <AccountDetailInline
          account={selectedAccount}
          onBack={handleBack}
          onFindContacts={handleFindContacts}
          loadingLeads={loadingLeads.has(selectedAccount.id)}
          activityLog={activityLog[selectedAccount.id] || []}
          streamedLeads={accountLeads[selectedAccount.id]?.leads || []}
          onStageChange={() => {}}
        />
      ) : (
        <AccountListView
          accounts={allAccounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={handleSelectAccount}
        />
      )}

      {/* Data Pipeline (bottom, collapsible) */}
      <DataPipelineSection
        accounts={allAccounts}
        showGarages={showGarages}
        onToggleGarages={setShowGarages}
        garages={laGarages}
        onGaragesLoaded={setLaGarages}
      />
    </div>
  );

  return (
    <div className="flex h-screen w-full">
      {!isMobile && (
        <div className="w-[440px] border-r border-border bg-background shrink-0 flex flex-col overflow-hidden">
          {sidebar}
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        {isMobile && (
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" className="absolute top-3 left-3 z-10 shadow-lg">
                <Filter className="w-4 h-4 mr-1" /> Accounts
                <Badge variant="secondary" className="ml-1.5 text-xs">{allAccounts.length}</Badge>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[440px] p-0">
              <SheetTitle className="sr-only">Account Panel</SheetTitle>
              {sidebar}
            </SheetContent>
          </Sheet>
        )}

        {/* Legend */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-background/90 backdrop-blur border border-border rounded-lg px-4 py-2 flex gap-4 shadow-md text-xs">
          {(["active", "target", "whitespace", "competitor"] as AccountStage[]).map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STAGE_CONFIG[s].markerColor }} />
              <span>{STAGE_CONFIG[s].label}</span>
            </div>
          ))}
          {showGarages && (
            <div className="flex items-center gap-1.5 border-l border-border pl-4">
              <Warehouse className="w-3 h-3 text-muted-foreground" />
              <span>Garages ({displayedGarages.length})</span>
            </div>
          )}
        </div>

        <APIProvider apiKey={API_KEY}>
          <Map mapId={MAP_ID} defaultCenter={{ lat: 39.0, lng: -98.0 }} defaultZoom={4.5}
            gestureHandling="greedy" disableDefaultUI={false} style={{ width: "100%", height: "100%" }}>
            <MapContent
              accounts={allAccounts}
              onSelectAccount={handleSelectAccount}
              showDeployed={showDeployed}
              deployedLocations={FLASH_LOCATIONS}
              onSelectSite={() => {}}
              garages={displayedGarages}
              showGarages={showGarages}
              onSelectGarage={() => {}}
            />
            <MapViewportSync hint={viewportHint} />
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
