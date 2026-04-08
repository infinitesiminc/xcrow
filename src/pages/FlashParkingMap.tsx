import { useState, useMemo, useCallback } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { MapPin, Filter, ExternalLink, Search, X, ChevronDown, ChevronUp, Building2, Grid3X3, Zap, Users, Globe, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  FLASH_LOCATIONS,
  CONFIDENCE_CONFIG,
  ALL_OPERATORS,
  type FlashLocation,
  type ConfidenceLevel,
} from "@/data/flash-parking-locations";
import {
  EXISTING_PARTNERS,
  PROSPECT_OPERATORS,
  FLASH_PLATFORM_STATS,
  type FlashPartner,
} from "@/data/flash-prospects";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "AIzaSyDMSptsCr9hKesJxuvh-sKL1z_gCj371z0";
const MAP_ID = "flash-parking-map";

/* ── Marker pins ── */
function DeployedPin({ color, muted }: { color: string; muted?: boolean }) {
  return (
    <div className="relative cursor-pointer group">
      <div
        className={`w-5 h-5 rounded-full border-2 border-white shadow-lg transition-all group-hover:scale-125 ${muted ? "opacity-40" : ""}`}
        style={{ backgroundColor: muted ? "#9ca3af" : color }}
      />
    </div>
  );
}

function ProspectPin({ accountType }: { accountType: "large_venue" | "fleet_operator" }) {
  return (
    <div className="relative cursor-pointer group">
      <div className="w-8 h-8 bg-blue-600 rotate-45 rounded-sm border-2 border-white shadow-lg transition-all group-hover:scale-125 flex items-center justify-center">
        <div className="-rotate-45">
          {accountType === "large_venue" ? (
            <Building2 className="w-4 h-4 text-white" />
          ) : (
            <Grid3X3 className="w-4 h-4 text-white" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Info Windows ── */
function DeployedInfoWindow({ location, onClose }: { location: FlashLocation; onClose: () => void }) {
  const conf = CONFIDENCE_CONFIG[location.confidence];
  const operatorLocCount = FLASH_LOCATIONS.filter((l) => l.operator === location.operator).length;
  return (
    <InfoWindow position={{ lat: location.lat, lng: location.lng }} onCloseClick={onClose} maxWidth={340}>
      <div className="p-1 space-y-2 text-sm">
        <h3 className="font-semibold text-base leading-tight">{location.name}</h3>
        <p className="text-gray-500 text-xs">{location.address}</p>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: conf.markerColor }} />
          <span className="font-medium" style={{ color: conf.markerColor }}>{conf.label}</span>
        </div>
        <div className="space-y-1">
          <p><span className="font-medium">Operator:</span> {location.operator}</p>
          <p><span className="font-medium">Scope:</span> {location.scope}</p>
          {location.notes && <p className="text-gray-500">{location.notes}</p>}
        </div>
        <div className="border-t pt-2 mt-2">
          <p className="text-xs text-gray-500">
            <span className="font-medium text-gray-700">{operatorLocCount}</span> mapped location{operatorLocCount !== 1 ? "s" : ""} for this operator
          </p>
        </div>
        {location.sourceUrl && (
          <a href={location.sourceUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs">
            View source <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </InfoWindow>
  );
}

function ProspectInfoWindow({ partner, onClose }: { partner: FlashPartner; onClose: () => void }) {
  return (
    <InfoWindow position={{ lat: partner.hqLat, lng: partner.hqLng }} onCloseClick={onClose} maxWidth={360}>
      <div className="p-1 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base leading-tight">{partner.name}</h3>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
            partner.status === "existing_partner" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
          }`}>
            {partner.status === "existing_partner" ? "Partner" : "Prospect"}
          </span>
        </div>
        <p className="text-gray-500 text-xs">{partner.hqCity}</p>
        <div className="grid grid-cols-2 gap-2 py-1">
          <div>
            <p className="text-[10px] text-gray-400 uppercase">Est. Spaces</p>
            <p className="font-semibold text-sm">{partner.estimatedSpaces}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase">Facilities</p>
            <p className="font-semibold text-sm">{partner.facilityCount}</p>
          </div>
        </div>
        <p><span className="font-medium">Focus:</span> {partner.focusArea}</p>
        <p className="text-gray-500 text-xs">{partner.differentiator}</p>
        {partner.caseStudyUrl && (
          <a href={partner.caseStudyUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs">
            Case study <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {partner.website && (
          <a href={partner.website} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs ml-3">
            Website <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </InfoWindow>
  );
}

/* ── Stats Banner ── */
function StatsBanner() {
  const mappedCount = FLASH_LOCATIONS.length;
  return (
    <div className="grid grid-cols-3 gap-1.5 px-3 py-2">
      <div className="bg-muted/50 rounded-lg p-2 text-center">
        <p className="text-lg font-bold text-foreground">{FLASH_PLATFORM_STATS.totalLocations}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">Locations</p>
      </div>
      <div className="bg-muted/50 rounded-lg p-2 text-center">
        <p className="text-lg font-bold text-foreground">{FLASH_PLATFORM_STATS.networkLocations}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">Network</p>
      </div>
      <div className="bg-muted/50 rounded-lg p-2 text-center">
        <p className="text-lg font-bold text-primary">~{mappedCount}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">Mapped</p>
      </div>
    </div>
  );
}

/* ── Confidence toggle button ── */
function ConfidenceToggle({ level, active, onClick }: { level: ConfidenceLevel; active: boolean; onClick: () => void }) {
  const c = CONFIDENCE_CONFIG[level];
  const count = FLASH_LOCATIONS.filter((l) => l.confidence === level).length;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
        active ? "border-foreground/20 bg-foreground/5" : "border-transparent bg-muted/30 text-muted-foreground opacity-50"
      }`}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.markerColor }} />
      {c.label}
      <span className="text-muted-foreground text-[10px]">{count}</span>
    </button>
  );
}

/* ── Partner chip ── */
function PartnerChip({ name, count, active, onClick }: { name: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all whitespace-nowrap ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
      }`}
    >
      {name}
      <span className={`text-[10px] ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{count}</span>
    </button>
  );
}

/* ── Deployed Tab Panel ── */
function DeployedPanel({
  searchQuery, setSearchQuery, confidenceFilter, toggleConfidence,
  operatorFilter, toggleOperator, filtered, onSelectLocation, selectedId,
}: {
  searchQuery: string; setSearchQuery: (q: string) => void;
  confidenceFilter: Set<ConfidenceLevel>; toggleConfidence: (c: ConfidenceLevel) => void;
  operatorFilter: Set<string>; toggleOperator: (o: string) => void;
  filtered: FlashLocation[]; onSelectLocation: (loc: FlashLocation) => void; selectedId: string | null;
}) {
  const [partnersExpanded, setPartnersExpanded] = useState(false);
  const allPartnersActive = operatorFilter.size === ALL_OPERATORS.length;

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-8 text-xs bg-muted/40 border-0 focus-visible:ring-1"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Confidence */}
      <div className="px-3 pb-2 flex gap-1">
        {(Object.keys(CONFIDENCE_CONFIG) as ConfidenceLevel[]).map((level) => (
          <ConfidenceToggle key={level} level={level} active={confidenceFilter.has(level)} onClick={() => toggleConfidence(level)} />
        ))}
      </div>

      {/* Partners collapsible */}
      <div className="px-3 pb-2">
        <button onClick={() => setPartnersExpanded(!partnersExpanded)}
          className="flex items-center justify-between w-full py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Partners {partnersExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {partnersExpanded && (
          <div className="flex flex-wrap gap-1 pt-1">
            <PartnerChip name="All" count={FLASH_LOCATIONS.length} active={allPartnersActive} onClick={() => toggleOperator("__all__")} />
            {ALL_OPERATORS.map((op) => {
              const count = FLASH_LOCATIONS.filter((l) => l.operator === op).length;
              const shortName = op.replace(" / Flash", "").replace(" (acquired by Flash)", "").replace("City of Las Vegas / ", "").replace("City of Oakland / ", "Oakland ").replace("Miami Design District / Reimagined Parking", "Miami Design").replace("City & County of Denver", "Denver (City)").replace("Greater Binghamton Airport", "BGM").replace("Quad Cities Airport Authority", "Quad Cities").replace("105 Airport Parking", "105 LAX").replace("Ball Arena / Flash", "Ball Arena").replace("Bethlehem Parking Authority", "Bethlehem PA").replace("Parkway Corporation", "Parkway Corp").replace("Ticketech (acquired by Flash)", "Ticketech/NYC").replace("ParkMobile / Flash", "ParkMobile").replace("Flash / Mavi.io", "Flash/Mavi").replace("Texas Medical Center / LAZ Parking", "TMC/LAZ").replace("Cohesion / Flash", "Cohesion").replace("ParkIt (acquired by Flash)", "ParkIt").replace("Flash / Waze", "Flash/Waze");
              return <PartnerChip key={op} name={shortName} count={count} active={operatorFilter.has(op)} onClick={() => toggleOperator(op)} />;
            })}
          </div>
        )}
      </div>

      <div className="h-px bg-border mx-3" />

      {/* Location list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No locations match
            </div>
          )}
          {filtered.map((loc) => {
            const c = CONFIDENCE_CONFIG[loc.confidence];
            const isSelected = selectedId === loc.id;
            return (
              <button key={loc.id} onClick={() => onSelectLocation(loc)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-start gap-2 ${
                  isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/60 border border-transparent"
                }`}>
                <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: c.markerColor }} />
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-medium leading-tight ${isSelected ? "text-primary" : ""}`}>{loc.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{loc.address}</p>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

/* ── Prospect Card ── */
function ProspectCard({ partner, isSelected, onClick }: { partner: FlashPartner; isSelected: boolean; onClick: () => void }) {
  const mappedLocations = FLASH_LOCATIONS.filter((l) =>
    l.operator.toLowerCase().includes(partner.name.split(" ")[0].toLowerCase()) ||
    l.operator.toLowerCase().includes(partner.name.split("(")[0].trim().toLowerCase())
  ).length;

  return (
    <button onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all border ${
        isSelected ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" : "hover:bg-muted/60 border-transparent"
      }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {partner.accountType === "large_venue" ? (
              <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            ) : (
              <Grid3X3 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            )}
            <p className="text-xs font-semibold leading-tight truncate">{partner.name}</p>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{partner.hqCity}</p>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
          partner.status === "existing_partner" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
        }`}>
          {partner.status === "existing_partner" ? "Partner" : "Prospect"}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-1.5 text-[11px]">
        <span className="text-muted-foreground"><span className="font-medium text-foreground">{partner.estimatedSpaces}</span> spaces</span>
        <span className="text-muted-foreground"><span className="font-medium text-foreground">{partner.facilityCount}</span></span>
        {mappedLocations > 0 && (
          <span className="text-primary text-[10px]">{mappedLocations} mapped</span>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{partner.differentiator}</p>
    </button>
  );
}

/* ── Prospects Tab Panel ── */
function ProspectsPanel({ prospectSearch, setProspectSearch, onSelectPartner, selectedPartnerId }: {
  prospectSearch: string; setProspectSearch: (q: string) => void;
  onSelectPartner: (p: FlashPartner) => void; selectedPartnerId: string | null;
}) {
  const allEntities = useMemo(() => [...EXISTING_PARTNERS, ...PROSPECT_OPERATORS], []);

  const filtered = useMemo(() => {
    const q = prospectSearch.toLowerCase().trim();
    if (!q) return allEntities;
    return allEntities.filter((p) =>
      `${p.name} ${p.hqCity} ${p.focusArea} ${p.differentiator}`.toLowerCase().includes(q)
    );
  }, [prospectSearch, allEntities]);

  const existingPartners = filtered.filter((p) => p.status === "existing_partner");
  const largeVenueProspects = filtered.filter((p) => p.status === "prospect" && p.accountType === "large_venue");
  const fleetProspects = filtered.filter((p) => p.status === "prospect" && p.accountType === "fleet_operator");

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search operators..."
            value={prospectSearch} onChange={(e) => setProspectSearch(e.target.value)}
            className="pl-8 pr-8 h-8 text-xs bg-muted/40 border-0 focus-visible:ring-1"
          />
          {prospectSearch && (
            <button onClick={() => setProspectSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 pb-4 space-y-3">
          {/* Existing Partners */}
          {existingPartners.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <Users className="w-3 h-3 text-green-600" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Existing Partners ({existingPartners.length})
                </span>
              </div>
              <div className="space-y-0.5">
                {existingPartners.map((p) => (
                  <ProspectCard key={p.id} partner={p} isSelected={selectedPartnerId === p.id} onClick={() => onSelectPartner(p)} />
                ))}
              </div>
            </div>
          )}

          {/* Large Venue Prospects */}
          {largeVenueProspects.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <Building2 className="w-3 h-3 text-blue-600" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Large Venue Accounts ({largeVenueProspects.length})
                </span>
              </div>
              <div className="space-y-0.5">
                {largeVenueProspects.map((p) => (
                  <ProspectCard key={p.id} partner={p} isSelected={selectedPartnerId === p.id} onClick={() => onSelectPartner(p)} />
                ))}
              </div>
            </div>
          )}

          {/* Fleet Operator Prospects */}
          {fleetProspects.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <Grid3X3 className="w-3 h-3 text-blue-600" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Fleet Operators ({fleetProspects.length})
                </span>
              </div>
              <div className="space-y-0.5">
                {fleetProspects.map((p) => (
                  <ProspectCard key={p.id} partner={p} isSelected={selectedPartnerId === p.id} onClick={() => onSelectPartner(p)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

/* ── Map markers ── */
function MapMarkers({ locations, selectedId, onSelect, onClose, muteDeployed, prospects, selectedPartnerId, onSelectPartner, onClosePartner }: {
  locations: FlashLocation[]; selectedId: string | null; onSelect: (loc: FlashLocation) => void; onClose: () => void;
  muteDeployed: boolean; prospects: FlashPartner[]; selectedPartnerId: string | null;
  onSelectPartner: (p: FlashPartner) => void; onClosePartner: () => void;
}) {
  const selectedLoc = locations.find((l) => l.id === selectedId);
  const selectedPartner = prospects.find((p) => p.id === selectedPartnerId);

  return (
    <>
      {/* Deployed pins */}
      {locations.map((loc) => (
        <AdvancedMarker key={loc.id} position={{ lat: loc.lat, lng: loc.lng }} onClick={() => onSelect(loc)}>
          <DeployedPin color={CONFIDENCE_CONFIG[loc.confidence].markerColor} muted={muteDeployed} />
        </AdvancedMarker>
      ))}
      {selectedLoc && <DeployedInfoWindow location={selectedLoc} onClose={onClose} />}

      {/* Prospect pins */}
      {muteDeployed && prospects.map((p) => (
        <AdvancedMarker key={p.id} position={{ lat: p.hqLat, lng: p.hqLng }} onClick={() => onSelectPartner(p)}>
          <ProspectPin accountType={p.accountType} />
        </AdvancedMarker>
      ))}
      {selectedPartner && <ProspectInfoWindow partner={selectedPartner} onClose={onClosePartner} />}
    </>
  );
}

/* ── Pan helper ── */
function PanToLocation({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  if (map && lat != null && lng != null) {
    map.panTo({ lat, lng });
    map.setZoom(14);
  }
  return null;
}

/* ── Main page ── */
export default function FlashParkingMap() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<string>("deployed");
  const [searchQuery, setSearchQuery] = useState("");
  const [prospectSearch, setProspectSearch] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState<Set<ConfidenceLevel>>(new Set(["confirmed", "likely", "possible"]));
  const [operatorFilter, setOperatorFilter] = useState<Set<string>>(new Set(ALL_OPERATORS));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [panTarget, setPanTarget] = useState<{ lat: number; lng: number } | null>(null);

  const toggleConfidence = useCallback((level: ConfidenceLevel) => {
    setConfidenceFilter((prev) => { const n = new Set(prev); n.has(level) ? n.delete(level) : n.add(level); return n; });
  }, []);

  const toggleOperator = useCallback((op: string) => {
    if (op === "__all__") { setOperatorFilter(new Set(ALL_OPERATORS)); return; }
    setOperatorFilter((prev) => { const n = new Set(prev); n.has(op) ? n.delete(op) : n.add(op); return n; });
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return FLASH_LOCATIONS.filter((l) => {
      if (!confidenceFilter.has(l.confidence)) return false;
      if (!operatorFilter.has(l.operator)) return false;
      if (q) {
        const haystack = `${l.name} ${l.address} ${l.operator} ${l.scope} ${l.notes}`.toLowerCase();
        return q.split(/\s+/).every((w) => haystack.includes(w));
      }
      return true;
    });
  }, [confidenceFilter, operatorFilter, searchQuery]);

  const handleSelectLocation = useCallback((loc: FlashLocation) => {
    setSelectedId(loc.id);
    setSelectedPartnerId(null);
    setPanTarget({ lat: loc.lat, lng: loc.lng });
  }, []);

  const handleSelectPartner = useCallback((p: FlashPartner) => {
    setSelectedPartnerId(p.id);
    setSelectedId(null);
    setPanTarget({ lat: p.hqLat, lng: p.hqLng });
  }, []);

  const allProspects = useMemo(() => [...EXISTING_PARTNERS, ...PROSPECT_OPERATORS], []);
  const isProspectTab = activeTab === "prospects";

  if (!API_KEY) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh] p-8">
          <div className="text-center max-w-md space-y-4">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-bold">Google Maps API Key Required</h1>
            <p className="text-muted-foreground">
              Set <code className="bg-muted px-1.5 py-0.5 rounded text-sm">VITE_GOOGLE_MAPS_API_KEY</code> as a build secret.
            </p>
          </div>
        </div>
      </>
    );
  }

  const sidebar = (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold leading-tight">Flash Partnership Intelligence</h2>
            <p className="text-[10px] text-muted-foreground">Account growth & deployment tracker</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsBanner />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <div className="px-3 pb-2">
          <TabsList className="w-full h-8">
            <TabsTrigger value="deployed" className="flex-1 text-xs h-7">
              <MapPin className="w-3 h-3 mr-1" /> Deployed ({filtered.length})
            </TabsTrigger>
            <TabsTrigger value="prospects" className="flex-1 text-xs h-7">
              <TrendingUp className="w-3 h-3 mr-1" /> Prospects ({allProspects.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="deployed" className="flex-1 min-h-0 mt-0">
          <DeployedPanel
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            confidenceFilter={confidenceFilter} toggleConfidence={toggleConfidence}
            operatorFilter={operatorFilter} toggleOperator={toggleOperator}
            filtered={filtered} onSelectLocation={handleSelectLocation} selectedId={selectedId}
          />
        </TabsContent>

        <TabsContent value="prospects" className="flex-1 min-h-0 mt-0">
          <ProspectsPanel
            prospectSearch={prospectSearch} setProspectSearch={setProspectSearch}
            onSelectPartner={handleSelectPartner} selectedPartnerId={selectedPartnerId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="flex h-[calc(100vh-64px)] w-full">
        {!isMobile && (
          <div className="w-80 border-r border-border bg-background shrink-0 flex flex-col overflow-hidden">
            {sidebar}
          </div>
        )}

        <div className="flex-1 relative">
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button size="sm" className="absolute top-3 left-3 z-10 shadow-lg">
                  <Filter className="w-4 h-4 mr-1" /> Filters
                  <Badge variant="secondary" className="ml-1.5 text-xs">{filtered.length}</Badge>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetTitle className="sr-only">Map Filters</SheetTitle>
                {sidebar}
              </SheetContent>
            </Sheet>
          )}

          {/* Legend */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-background/90 backdrop-blur border border-border rounded-lg px-4 py-2 flex gap-4 shadow-md text-xs">
            {!isProspectTab && (Object.keys(CONFIDENCE_CONFIG) as ConfidenceLevel[]).map((level) => {
              const c = CONFIDENCE_CONFIG[level];
              return (
                <div key={level} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.markerColor }} />
                  <span>{c.label}</span>
                </div>
              );
            })}
            {isProspectTab && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-gray-400" />
                  <span>Deployed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-blue-600 rotate-45 rounded-sm" />
                  <span>Prospect HQ</span>
                </div>
              </>
            )}
          </div>

          <APIProvider apiKey={API_KEY}>
            <Map
              mapId={MAP_ID}
              defaultCenter={{ lat: 39.0, lng: -98.0 }}
              defaultZoom={4.5}
              gestureHandling="greedy"
              disableDefaultUI={false}
              style={{ width: "100%", height: "100%" }}
            >
              <MapMarkers
                locations={filtered}
                selectedId={selectedId}
                onSelect={handleSelectLocation}
                onClose={() => setSelectedId(null)}
                muteDeployed={isProspectTab}
                prospects={allProspects}
                selectedPartnerId={selectedPartnerId}
                onSelectPartner={handleSelectPartner}
                onClosePartner={() => setSelectedPartnerId(null)}
              />
              <PanToLocation lat={panTarget?.lat ?? null} lng={panTarget?.lng ?? null} />
            </Map>
          </APIProvider>
        </div>
      </div>
    </>
  );
}
