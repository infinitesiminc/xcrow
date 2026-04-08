import { useState, useMemo, useCallback } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { MapPin, Filter, ExternalLink, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  FLASH_LOCATIONS,
  CONFIDENCE_CONFIG,
  ALL_OPERATORS,
  type FlashLocation,
  type ConfidenceLevel,
} from "@/data/flash-parking-locations";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

const MAP_ID = "flash-parking-map";

/* ── Marker pin (SVG) ── */
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

/* ── Info Window content ── */
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
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: conf.markerColor }}
          />
          <span className="font-medium" style={{ color: conf.markerColor }}>
            {conf.label}
          </span>
        </div>

        <div className="space-y-1">
          <p><span className="font-medium">Operator:</span> {location.operator}</p>
          <p><span className="font-medium">Scope:</span> {location.scope}</p>
          {location.notes && <p className="text-muted-foreground">{location.notes}</p>}
        </div>

        {location.sourceUrl && (
          <a
            href={location.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
          >
            View source <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </InfoWindow>
  );
}

/* ── Sidebar Filters ── */
function SidebarContent({
  confidenceFilter,
  toggleConfidence,
  operatorFilter,
  toggleOperator,
  filtered,
  onSelectLocation,
  selectedId,
}: {
  confidenceFilter: Set<ConfidenceLevel>;
  toggleConfidence: (c: ConfidenceLevel) => void;
  operatorFilter: Set<string>;
  toggleOperator: (o: string) => void;
  filtered: FlashLocation[];
  onSelectLocation: (loc: FlashLocation) => void;
  selectedId: string | null;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Flash Parking Map
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {filtered.length} of {FLASH_LOCATIONS.length} locations shown
        </p>
      </div>

      {/* Confidence filters */}
      <div className="p-4 border-b border-border space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" /> Confidence Level
        </h3>
        {(Object.keys(CONFIDENCE_CONFIG) as ConfidenceLevel[]).map((level) => {
          const c = CONFIDENCE_CONFIG[level];
          return (
            <label key={level} className="flex items-center gap-2 cursor-pointer text-sm">
              <Checkbox
                checked={confidenceFilter.has(level)}
                onCheckedChange={() => toggleConfidence(level)}
              />
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.markerColor }} />
              <span>{c.label}</span>
              <span className="text-muted-foreground text-xs ml-auto">
                {FLASH_LOCATIONS.filter((l) => l.confidence === level).length}
              </span>
            </label>
          );
        })}
      </div>

      {/* Operator filters */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold mb-2">Operator / Partner</h3>
        <ScrollArea className="max-h-36">
          <div className="space-y-2">
            {ALL_OPERATORS.map((op) => (
              <label key={op} className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={operatorFilter.has(op)}
                  onCheckedChange={() => toggleOperator(op)}
                />
                <span className="truncate">{op}</span>
                <span className="text-muted-foreground text-xs ml-auto">
                  {FLASH_LOCATIONS.filter((l) => l.operator === op).length}
                </span>
              </label>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Location list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filtered.map((loc) => {
            const c = CONFIDENCE_CONFIG[loc.confidence];
            return (
              <button
                key={loc.id}
                onClick={() => onSelectLocation(loc)}
                className={`w-full text-left p-2.5 rounded-md text-sm transition-colors hover:bg-accent/50 flex items-start gap-2 ${
                  selectedId === loc.id ? "bg-accent" : ""
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                  style={{ backgroundColor: c.markerColor }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{loc.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{loc.operator}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

/* ── Map markers (needs useMap inside APIProvider) ── */
function MapMarkers({
  locations,
  selectedId,
  onSelect,
  onClose,
}: {
  locations: FlashLocation[];
  selectedId: string | null;
  onSelect: (loc: FlashLocation) => void;
  onClose: () => void;
}) {
  const selected = locations.find((l) => l.id === selectedId);

  return (
    <>
      {locations.map((loc) => (
        <AdvancedMarker
          key={loc.id}
          position={{ lat: loc.lat, lng: loc.lng }}
          onClick={() => onSelect(loc)}
        >
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
    setOperatorFilter((prev) => {
      const next = new Set(prev);
      next.has(op) ? next.delete(op) : next.add(op);
      return next;
    });
  }, []);

  const filtered = useMemo(
    () =>
      FLASH_LOCATIONS.filter(
        (l) => confidenceFilter.has(l.confidence) && operatorFilter.has(l.operator)
      ),
    [confidenceFilter, operatorFilter]
  );

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
              To view the Flash Parking deployment map, a Google Maps API key needs to be configured.
              Set <code className="bg-muted px-1.5 py-0.5 rounded text-sm">VITE_GOOGLE_MAPS_API_KEY</code> as
              a build secret in your workspace settings.
            </p>
          </div>
        </div>
      </>
    );
  }

  const sidebar = (
    <SidebarContent
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
        {/* Desktop sidebar */}
        {!isMobile && (
          <div className="w-80 border-r border-border bg-background shrink-0 flex flex-col overflow-hidden">
            {sidebar}
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative">
          {/* Mobile filter trigger */}
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="sm"
                  className="absolute top-3 left-3 z-10 shadow-lg"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Filters
                  <Badge variant="secondary" className="ml-1.5 text-xs">
                    {filtered.length}
                  </Badge>
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
