import { useState, useMemo, useCallback } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { MapPin, Filter, ExternalLink, Search, X, ChevronDown, ChevronUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  FLASH_LOCATIONS,
  CONFIDENCE_CONFIG,
  ALL_OPERATORS,
  type FlashLocation,
  type ConfidenceLevel,
} from "@/data/flash-parking-locations";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "AIzaSyDMSptsCr9hKesJxuvh-sKL1z_gCj371z0";
const MAP_ID = "flash-parking-map";

/* ── Marker pin ── */
function MarkerPin({ color }: { color: string }) {
  return (
    <div className="relative cursor-pointer group">
      <div
        className="w-6 h-6 rounded-full border-2 border-white shadow-lg transition-transform group-hover:scale-125"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

/* ── Info Window ── */
function LocationInfo({ location, onClose }: { location: FlashLocation; onClose: () => void }) {
  const conf = CONFIDENCE_CONFIG[location.confidence];
  return (
    <InfoWindow
      position={{ lat: location.lat, lng: location.lng }}
      onCloseClick={onClose}
      maxWidth={340}
    >
      <div className="p-1 space-y-2 text-sm">
        <h3 className="font-semibold text-base leading-tight">{location.name}</h3>
        <p className="text-muted-foreground text-xs">{location.address}</p>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: conf.markerColor }} />
          <span className="font-medium" style={{ color: conf.markerColor }}>{conf.label}</span>
        </div>
        <div className="space-y-1">
          <p><span className="font-medium">Operator:</span> {location.operator}</p>
          <p><span className="font-medium">Scope:</span> {location.scope}</p>
          {location.notes && <p className="text-muted-foreground">{location.notes}</p>}
        </div>
        {location.sourceUrl && (
          <a href={location.sourceUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
            View source <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </InfoWindow>
  );
}

/* ── Partner chip ── */
function PartnerChip({ name, count, active, onClick }: { name: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
      }`}
    >
      {name}
      <span className={`text-[10px] ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
        {count}
      </span>
    </button>
  );
}

/* ── Confidence toggle button ── */
function ConfidenceToggle({ level, active, onClick }: { level: ConfidenceLevel; active: boolean; onClick: () => void }) {
  const c = CONFIDENCE_CONFIG[level];
  const count = FLASH_LOCATIONS.filter((l) => l.confidence === level).length;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
        active
          ? "border-foreground/20 bg-foreground/5"
          : "border-transparent bg-muted/30 text-muted-foreground opacity-50"
      }`}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.markerColor }} />
      {c.label}
      <span className="text-muted-foreground text-[10px]">{count}</span>
    </button>
  );
}

/* ── Sidebar ── */
function SidebarPanel({
  searchQuery,
  setSearchQuery,
  confidenceFilter,
  toggleConfidence,
  operatorFilter,
  toggleOperator,
  filtered,
  onSelectLocation,
  selectedId,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  confidenceFilter: Set<ConfidenceLevel>;
  toggleConfidence: (c: ConfidenceLevel) => void;
  operatorFilter: Set<string>;
  toggleOperator: (o: string) => void;
  filtered: FlashLocation[];
  onSelectLocation: (loc: FlashLocation) => void;
  selectedId: string | null;
}) {
  const [partnersExpanded, setPartnersExpanded] = useState(true);

  const allPartnersActive = operatorFilter.size === ALL_OPERATORS.length;

  const toggleAll = () => {
    if (allPartnersActive) {
      // deselect all — but that shows nothing, so do nothing
    } else {
      toggleOperator("__all__");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold leading-tight">Flash Parking Deployments</h2>
            <p className="text-[11px] text-muted-foreground">
              {filtered.length} location{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search locations, cities, operators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-8 text-xs bg-muted/40 border-0 focus-visible:ring-1"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Confidence toggles */}
      <div className="px-3 pb-2">
        <div className="flex gap-1.5">
          {(Object.keys(CONFIDENCE_CONFIG) as ConfidenceLevel[]).map((level) => (
            <ConfidenceToggle
              key={level}
              level={level}
              active={confidenceFilter.has(level)}
              onClick={() => toggleConfidence(level)}
            />
          ))}
        </div>
      </div>

      {/* Partners section */}
      <div className="px-3 pb-2">
        <button
          onClick={() => setPartnersExpanded(!partnersExpanded)}
          className="flex items-center justify-between w-full py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
        >
          Partners
          {partnersExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {partnersExpanded && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <PartnerChip
              name="All"
              count={FLASH_LOCATIONS.length}
              active={allPartnersActive}
              onClick={toggleAll}
            />
            {ALL_OPERATORS.map((op) => {
              const count = FLASH_LOCATIONS.filter((l) => l.operator === op).length;
              // Show a shorter label for display
              const shortName = op
                .replace(" / Flash", "")
                .replace(" (acquired by Flash)", "")
                .replace("City of Las Vegas / ", "")
                .replace("City of Oakland / ", "Oakland ")
                .replace("Miami Design District / Reimagined Parking", "Miami Design Dist.")
                .replace("City & County of Denver", "Denver (City)")
                .replace("Greater Binghamton Airport", "BGM Airport")
                .replace("Quad Cities Airport Authority", "Quad Cities (MLI)")
                .replace("105 Airport Parking", "105 LAX")
                .replace("Ball Arena / Flash", "Ball Arena")
                .replace("Bethlehem Parking Authority", "Bethlehem PA")
                .replace("Parkway Corporation", "Parkway Corp")
                .replace("Ticketech (acquired by Flash)", "Ticketech/NYC")
                .replace("ParkMobile / Flash", "ParkMobile")
                .replace("Flash / Mavi.io", "Flash/Mavi");
              return (
                <PartnerChip
                  key={op}
                  name={shortName}
                  count={count}
                  active={operatorFilter.has(op)}
                  onClick={() => toggleOperator(op)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-border mx-3" />

      {/* Location list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No locations match your filters
            </div>
          )}
          {filtered.map((loc) => {
            const c = CONFIDENCE_CONFIG[loc.confidence];
            const isSelected = selectedId === loc.id;
            return (
              <button
                key={loc.id}
                onClick={() => onSelectLocation(loc)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-start gap-2.5 ${
                  isSelected
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/60 border border-transparent"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: c.markerColor }}
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-medium leading-tight ${isSelected ? "text-primary" : ""}`}>
                    {loc.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {loc.address}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

/* ── Map markers ── */
function MapMarkers({ locations, selectedId, onSelect, onClose }: {
  locations: FlashLocation[];
  selectedId: string | null;
  onSelect: (loc: FlashLocation) => void;
  onClose: () => void;
}) {
  const selected = locations.find((l) => l.id === selectedId);
  return (
    <>
      {locations.map((loc) => (
        <AdvancedMarker key={loc.id} position={{ lat: loc.lat, lng: loc.lng }} onClick={() => onSelect(loc)}>
          <MarkerPin color={CONFIDENCE_CONFIG[loc.confidence].markerColor} />
        </AdvancedMarker>
      ))}
      {selected && <LocationInfo location={selected} onClose={onClose} />}
    </>
  );
}

/* ── Pan helper ── */
function PanToLocation({ location }: { location: FlashLocation | null }) {
  const map = useMap();
  if (map && location) {
    map.panTo({ lat: location.lat, lng: location.lng });
    map.setZoom(14);
  }
  return null;
}

/* ── Main page ── */
export default function FlashParkingMap() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState<Set<ConfidenceLevel>>(
    new Set(["confirmed", "likely", "possible"])
  );
  const [operatorFilter, setOperatorFilter] = useState<Set<string>>(new Set(ALL_OPERATORS));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panTarget, setPanTarget] = useState<FlashLocation | null>(null);

  const toggleConfidence = useCallback((level: ConfidenceLevel) => {
    setConfidenceFilter((prev) => {
      const next = new Set(prev);
      next.has(level) ? next.delete(level) : next.add(level);
      return next;
    });
  }, []);

  const toggleOperator = useCallback((op: string) => {
    if (op === "__all__") {
      setOperatorFilter(new Set(ALL_OPERATORS));
      return;
    }
    setOperatorFilter((prev) => {
      const next = new Set(prev);
      next.has(op) ? next.delete(op) : next.add(op);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return FLASH_LOCATIONS.filter((l) => {
      if (!confidenceFilter.has(l.confidence)) return false;
      if (!operatorFilter.has(l.operator)) return false;
      if (q) {
        const haystack = `${l.name} ${l.address} ${l.operator} ${l.scope} ${l.notes}`.toLowerCase();
        return q.split(/\s+/).every((word) => haystack.includes(word));
      }
      return true;
    });
  }, [confidenceFilter, operatorFilter, searchQuery]);

  const handleSelectLocation = useCallback((loc: FlashLocation) => {
    setSelectedId(loc.id);
    setPanTarget(loc);
  }, []);

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
    <SidebarPanel
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      confidenceFilter={confidenceFilter}
      toggleConfidence={toggleConfidence}
      operatorFilter={operatorFilter}
      toggleOperator={toggleOperator}
      filtered={filtered}
      onSelectLocation={handleSelectLocation}
      selectedId={selectedId}
    />
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
                  <Filter className="w-4 h-4 mr-1" />
                  Filters
                  <Badge variant="secondary" className="ml-1.5 text-xs">{filtered.length}</Badge>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetTitle className="sr-only">Map Filters</SheetTitle>
                {sidebar}
              </SheetContent>
            </Sheet>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-background/90 backdrop-blur border border-border rounded-lg px-4 py-2 flex gap-4 shadow-md text-xs">
            {(Object.keys(CONFIDENCE_CONFIG) as ConfidenceLevel[]).map((level) => {
              const c = CONFIDENCE_CONFIG[level];
              return (
                <div key={level} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.markerColor }} />
                  <span>{c.label}</span>
                </div>
              );
            })}
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
              />
              <PanToLocation location={panTarget} />
            </Map>
          </APIProvider>
        </div>
      </div>
    </>
  );
}
