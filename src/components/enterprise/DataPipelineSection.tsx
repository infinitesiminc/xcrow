import { useMemo, useState, useCallback, useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import {
  Database, ChevronDown, Warehouse, Loader2, RefreshCw, Zap, BarChart3,
} from "lucide-react";
import type { FlashAccount } from "@/data/flash-prospects";

interface DiscoveredGarage {
  id: string;
  place_id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  rating: number | null;
  reviews_count: number;
  photo_reference: string | null;
  types: string[];
  operator_guess: string | null;
  scan_zone: string | null;
  website: string | null;
  phone: string | null;
  capacity: number | null;
  capacity_source: string | null;
}

interface DataPipelineSectionProps {
  accounts: FlashAccount[];
  showGarages: boolean;
  onToggleGarages: (v: boolean) => void;
  garages: DiscoveredGarage[];
  onGaragesLoaded: (garages: DiscoveredGarage[]) => void;
}

const OPERATOR_COLORS: Record<string, string> = {
  "Joe's Auto Parks": "#e65100",
  "LAZ Parking": "#1565c0",
  "SP Plus": "#2e7d32",
  "ParkABM": "#6a1b9a",
  "ABM": "#6a1b9a",
  "Perfect Parking": "#00838f",
};
const DEFAULT_OPERATOR_COLOR = "#78909c";
function getOperatorColor(op: string | null): string {
  if (!op) return "#b0bec5";
  return OPERATOR_COLORS[op] ?? DEFAULT_OPERATOR_COLOR;
}

export default function DataPipelineSection({ accounts, showGarages, onToggleGarages, garages, onGaragesLoaded }: DataPipelineSectionProps) {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState("");
  const [enriching, setEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState("");
  const [selectedCity, setSelectedCity] = useState("Los Angeles");
  const [scanCorridor, setScanCorridor] = useState("dtla");
  const [corridorOptions, setCorridorOptions] = useState<{ key: string; label: string; city: string; zones: number; garagesFound?: number; scanStatus?: string }[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>(["Los Angeles"]);
  const [showOnlyOperators, setShowOnlyOperators] = useState(true);

  // Coverage stats
  const coverage = useMemo(() => {
    const total = accounts.length || 1;
    const coords = accounts.filter(a => a.hqLat && a.hqLng).length;
    const revenue = accounts.filter(a => a.annualRevenue).length;
    const vendor = accounts.filter(a => a.currentVendor && a.currentVendor !== "Unknown").length;
    return [
      { label: "Coordinates", value: coords, total, pct: Math.round(coords / total * 100) },
      { label: "Revenue", value: revenue, total, pct: Math.round(revenue / total * 100) },
      { label: "Vendor", value: vendor, total, pct: Math.round(vendor / total * 100) },
    ];
  }, [accounts]);

  // Load corridors
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const resp = await fetch(`${supabaseUrl}/functions/v1/scan-la-garages`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": supabaseKey, "Authorization": `Bearer ${session?.access_token ?? supabaseKey}` },
          body: JSON.stringify({ action: "list" }),
        });
        if (resp.ok) {
          const data = await resp.json();
          setCorridorOptions(data.corridors || []);
          setAvailableCities(data.cities || ["Los Angeles"]);
          if (data.corridors?.length) setScanCorridor(data.corridors[0].key);
        }
      } catch {}
    })();
  }, []);

  const cityCorridors = useMemo(() => corridorOptions.filter(c => c.city === selectedCity), [corridorOptions, selectedCity]);

  // Load garages when toggled on
  useEffect(() => {
    if (!showGarages) return;
    (async () => {
      const { data } = await supabase.from("discovered_garages").select("*").eq("city", selectedCity).limit(1000);
      if (data) onGaragesLoaded(data as unknown as DiscoveredGarage[]);
    })();
  }, [showGarages, selectedCity]);

  const handleScan = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    const corridorLabel = cityCorridors.find(c => c.key === scanCorridor)?.label ?? scanCorridor;
    setScanProgress(`Starting ${corridorLabel} scan...`);
    let zoneIndex = 0;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      while (true) {
        const resp = await fetch(`${supabaseUrl}/functions/v1/scan-la-garages`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token ?? supabaseKey}`, "apikey": supabaseKey },
          body: JSON.stringify({ corridor: scanCorridor, zoneIndex, batchSize: 3 }),
        });
        const result = await resp.json();
        if (!resp.ok) { setScanProgress(`Error: ${result.error}`); break; }
        setScanProgress(`${corridorLabel}: ${result.progress} — ${result.inserted} new`);
        if (result.done) { setScanProgress(`Done! ${corridorLabel} scan complete.`); break; }
        zoneIndex = result.nextZoneIndex;
      }
      const { data } = await supabase.from("discovered_garages").select("*").eq("city", selectedCity).limit(1000);
      if (data) onGaragesLoaded(data as unknown as DiscoveredGarage[]);
    } catch (e: any) {
      setScanProgress(`Error: ${e.message}`);
    } finally {
      setScanning(false);
    }
  }, [scanning, scanCorridor, cityCorridors, selectedCity]);

  const handleEnrich = useCallback(async () => {
    if (enriching) return;
    setEnriching(true);
    setEnrichProgress("Starting capacity enrichment...");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      let totalEnriched = 0;
      while (true) {
        const resp = await fetch(`${supabaseUrl}/functions/v1/enrich-garage-capacity`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token ?? supabaseKey}`, "apikey": supabaseKey },
          body: JSON.stringify({ batchSize: 2 }),
        });
        const result = await resp.json();
        if (!resp.ok) { setEnrichProgress(`Error: ${result.error}`); break; }
        totalEnriched += result.enriched;
        setEnrichProgress(`${totalEnriched} enriched, ${result.remaining} remaining`);
        if (result.done) { setEnrichProgress(`Done! ${totalEnriched} garages enriched.`); break; }
      }
      const { data } = await supabase.from("discovered_garages").select("*").eq("city", selectedCity).limit(1000);
      if (data) onGaragesLoaded(data as unknown as DiscoveredGarage[]);
    } catch (e: any) {
      setEnrichProgress(`Error: ${e.message}`);
    } finally {
      setEnriching(false);
    }
  }, [enriching, selectedCity]);

  const operatorStats = useMemo(() => {
    const opGarages = garages.filter(g => g.operator_guess);
    const map: Record<string, number> = {};
    for (const g of opGarages) map[g.operator_guess!] = (map[g.operator_guess!] || 0) + 1;
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [garages]);

  return (
    <div className="border-t border-border">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 hover:bg-muted/50 transition-colors">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <Database className="w-3.5 h-3.5" /> Data Pipeline
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3">
            {/* Coverage bars */}
            <div className="space-y-1.5">
              {coverage.map(c => (
                <div key={c.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-20">{c.label}</span>
                  <Progress value={c.pct} className="flex-1 h-1.5" />
                  <span className="text-[10px] font-mono text-muted-foreground w-14 text-right">{c.value}/{c.total}</span>
                </div>
              ))}
            </div>

            {/* Garage discovery */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[11px] font-medium cursor-pointer">
                  <Switch checked={showGarages} onCheckedChange={onToggleGarages} className="scale-75" />
                  <Warehouse className="w-3.5 h-3.5 text-muted-foreground" />
                  Garage Discovery
                  {showGarages && garages.length > 0 && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0">{garages.length}</Badge>
                  )}
                </label>
                {showGarages && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={handleScan} disabled={scanning}>
                      {scanning ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                      {scanning ? "..." : "Scan"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={handleEnrich} disabled={enriching}>
                      {enriching ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                      {enriching ? "..." : "Capacity"}
                    </Button>
                  </div>
                )}
              </div>
              {showGarages && (
                <div className="space-y-1">
                  {availableCities.length > 1 && (
                    <select value={selectedCity} onChange={e => {
                      setSelectedCity(e.target.value);
                      const first = corridorOptions.find(c => c.city === e.target.value);
                      if (first) setScanCorridor(first.key);
                    }} className="w-full text-[10px] bg-muted border border-border rounded px-2 py-1">
                      {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                  <select value={scanCorridor} onChange={e => setScanCorridor(e.target.value)}
                    className="w-full text-[10px] bg-muted border border-border rounded px-2 py-1" disabled={scanning}>
                    {cityCorridors.map(c => (
                      <option key={c.key} value={c.key}>
                        {c.scanStatus === "not_started" ? "○" : "✓"} {c.label} ({c.zones} zones{c.garagesFound ? ` · ${c.garagesFound} found` : ""})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {scanProgress && showGarages && <p className="text-[10px] text-muted-foreground">{scanProgress}</p>}
              {enrichProgress && showGarages && <p className="text-[10px] text-muted-foreground">{enrichProgress}</p>}
              {showGarages && operatorStats.length > 0 && (
                <div className="space-y-0.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" /> Operators
                    </span>
                    <button onClick={() => setShowOnlyOperators(p => !p)}
                      className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${showOnlyOperators ? "bg-amber-500/20 text-amber-700" : "bg-muted/60 text-muted-foreground"}`}>
                      {showOnlyOperators ? "Named only" : "Show all"}
                    </button>
                  </div>
                  {operatorStats.map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between text-[11px] px-1.5 py-0.5">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: getOperatorColor(name) }} />
                        {name}
                      </span>
                      <span className="text-[10px] font-bold bg-muted/80 px-1.5 py-0.5 rounded">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
