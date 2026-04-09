import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import {
  Warehouse, MapPin, Users, BarChart3, TrendingUp,
  Building2, Star, Loader2, ParkingCircle, Layers
} from "lucide-react";

interface OperatorRow {
  operator_guess: string;
  locations: number;
  total_spaces: number | null;
  avg_rating: number | null;
  with_capacity: number;
}

interface ZoneRow {
  scan_zone: string;
  garages: number;
  total_spaces: number | null;
  with_capacity: number;
  avg_rating: number | null;
}

interface MarketStats {
  total_garages: number;
  unique_operators: number;
  total_capacity: number;
  garages_with_capacity: number;
  avg_rating: number;
  zones_scanned: number;
}

export default function LAMarketDashboard() {
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [operators, setOperators] = useState<OperatorRow[]>([]);
  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState("Los Angeles");
  const [availableCities, setAvailableCities] = useState<string[]>(["Los Angeles"]);

  // Load available cities
  useEffect(() => {
    (async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const resp = await fetch(`${supabaseUrl}/functions/v1/scan-la-garages`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": supabaseKey },
          body: JSON.stringify({ action: "list" }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.cities?.length) setAvailableCities(data.cities);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedCity]);

  async function loadData() {
    setLoading(true);
    try {
      // Fetch all garages in one query and compute stats client-side
      const { data: garages } = await supabase
        .from("discovered_garages")
        .select("operator_guess, capacity, rating, scan_zone")
        .eq("city", selectedCity)
        .limit(1000);

      if (!garages) return;

      // Market stats
      const opSet = new Set(garages.map(g => g.operator_guess).filter(Boolean));
      const zoneSet = new Set(garages.map(g => g.scan_zone).filter(Boolean));
      const withCap = garages.filter(g => g.capacity != null);
      const ratings = garages.filter(g => g.rating != null);
      setStats({
        total_garages: garages.length,
        unique_operators: opSet.size,
        total_capacity: withCap.reduce((s, g) => s + (g.capacity || 0), 0),
        garages_with_capacity: withCap.length,
        avg_rating: ratings.length ? +(ratings.reduce((s, g) => s + (g.rating || 0), 0) / ratings.length).toFixed(2) : 0,
        zones_scanned: zoneSet.size,
      });

      // Operator breakdown
      const opMap: Record<string, OperatorRow> = {};
      for (const g of garages) {
        const op = g.operator_guess || "Unknown";
        if (!opMap[op]) opMap[op] = { operator_guess: op, locations: 0, total_spaces: 0, avg_rating: null, with_capacity: 0 };
        opMap[op].locations++;
        if (g.capacity != null) {
          opMap[op].total_spaces = (opMap[op].total_spaces || 0) + g.capacity;
          opMap[op].with_capacity++;
        }
      }
      // Compute avg ratings per operator
      for (const op of Object.keys(opMap)) {
        const opGarages = garages.filter(g => (g.operator_guess || "Unknown") === op && g.rating != null);
        if (opGarages.length) {
          opMap[op].avg_rating = +(opGarages.reduce((s, g) => s + (g.rating || 0), 0) / opGarages.length).toFixed(2);
        }
      }
      setOperators(Object.values(opMap).sort((a, b) => b.locations - a.locations));

      // Zone breakdown
      const zoneMap: Record<string, ZoneRow> = {};
      for (const g of garages) {
        const z = g.scan_zone || "Unzoned";
        if (!zoneMap[z]) zoneMap[z] = { scan_zone: z, garages: 0, total_spaces: 0, with_capacity: 0, avg_rating: null };
        zoneMap[z].garages++;
        if (g.capacity != null) {
          zoneMap[z].total_spaces = (zoneMap[z].total_spaces || 0) + g.capacity;
          zoneMap[z].with_capacity++;
        }
      }
      for (const z of Object.keys(zoneMap)) {
        const zGarages = garages.filter(g => (g.scan_zone || "Unzoned") === z && g.rating != null);
        if (zGarages.length) {
          zoneMap[z].avg_rating = +(zGarages.reduce((s, g) => s + (g.rating || 0), 0) / zGarages.length).toFixed(2);
        }
      }
      setZones(Object.values(zoneMap).sort((a, b) => b.garages - a.garages));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const maxLocations = operators[0]?.locations ?? 1;
  const namedOperators = operators.filter(o => o.operator_guess !== "Unknown" && o.operator_guess !== "Independent");
  const unknownCount = operators.find(o => o.operator_guess === "Unknown")?.locations ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            {selectedCity} Parking Market
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive garage-level intelligence
          </p>
        </div>
        <div className="flex items-center gap-2">
          {availableCities.length > 1 && (
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="text-xs bg-muted border border-border rounded px-2 py-1.5 font-medium"
            >
              {availableCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          )}
          <Badge variant="outline" className="text-xs">
            {stats?.zones_scanned} zones scanned
          </Badge>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={<Warehouse className="h-5 w-5" />}
          label="Total Garages"
          value={stats?.total_garages ?? 0}
          sub="Discovered structures"
          color="text-amber-500"
        />
        <KPICard
          icon={<ParkingCircle className="h-5 w-5" />}
          label="Total Capacity"
          value={stats?.total_capacity?.toLocaleString() ?? "0"}
          sub={`${stats?.garages_with_capacity} garages with data`}
          color="text-blue-500"
        />
        <KPICard
          icon={<Users className="h-5 w-5" />}
          label="Named Operators"
          value={namedOperators.length}
          sub={`${unknownCount} unidentified`}
          color="text-emerald-500"
        />
        <KPICard
          icon={<Star className="h-5 w-5" />}
          label="Avg Rating"
          value={stats?.avg_rating ?? "—"}
          sub="Across all garages"
          color="text-yellow-500"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Operator Leaderboard - 3 cols */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Operator Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[420px]">
              <div className="px-4 pb-4 space-y-1">
                {/* Header row */}
                <div className="grid grid-cols-12 text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-2 py-1.5 border-b border-border">
                  <div className="col-span-4">Operator</div>
                  <div className="col-span-2 text-right">Locations</div>
                  <div className="col-span-2 text-right">Capacity</div>
                  <div className="col-span-2 text-right">Rating</div>
                  <div className="col-span-2 text-right">Share</div>
                </div>
                {namedOperators.map((op, i) => {
                  const share = ((op.locations / (stats?.total_garages ?? 1)) * 100);
                  return (
                    <div key={op.operator_guess} className="grid grid-cols-12 items-center px-2 py-2 rounded-md hover:bg-muted/50 transition-colors text-sm">
                      <div className="col-span-4 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                        <span className="font-medium truncate">{op.operator_guess}</span>
                      </div>
                      <div className="col-span-2 text-right font-mono">{op.locations}</div>
                      <div className="col-span-2 text-right font-mono text-muted-foreground">
                        {op.total_spaces ? op.total_spaces.toLocaleString() : "—"}
                      </div>
                      <div className="col-span-2 text-right">
                        {op.avg_rating ? (
                          <span className="flex items-center justify-end gap-0.5">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="font-mono text-xs">{op.avg_rating}</span>
                          </span>
                        ) : "—"}
                      </div>
                      <div className="col-span-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Progress value={share} className="w-12 h-1.5" />
                          <span className="text-[10px] font-mono text-muted-foreground w-8">{share.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Zone Breakdown - 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Zone Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[420px]">
              <div className="px-4 pb-4 space-y-1">
                {zones.slice(0, 20).map((z) => {
                  const barPct = (z.garages / (zones[0]?.garages ?? 1)) * 100;
                  return (
                    <div key={z.scan_zone} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{z.scan_zone}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={barPct} className="flex-1 h-1.5" />
                          <span className="text-[10px] font-mono text-muted-foreground">{z.garages}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {z.total_spaces ? (
                          <span className="text-[10px] font-mono text-muted-foreground">{z.total_spaces.toLocaleString()} spaces</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/50">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Capacity Coverage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Data Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CoverageMetric
              label="Capacity Data"
              covered={stats?.garages_with_capacity ?? 0}
              total={stats?.total_garages ?? 0}
              description="Garages with known space count"
            />
            <CoverageMetric
              label="Operator Identified"
              covered={(stats?.total_garages ?? 0) - unknownCount}
              total={stats?.total_garages ?? 0}
              description="Garages with named operator"
            />
            <CoverageMetric
              label="Rated"
              covered={operators.reduce((s, o) => s + (o.avg_rating ? o.locations : 0), 0)}
              total={stats?.total_garages ?? 0}
              description="Garages with Google rating"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`${color} shrink-0`}>{icon}</div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-[11px] text-muted-foreground truncate">{sub}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CoverageMetric({ label, covered, total, description }: {
  label: string;
  covered: number;
  total: number;
  description: string;
}) {
  const pct = total > 0 ? Math.round((covered / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-mono text-muted-foreground">{covered}/{total}</span>
      </div>
      <Progress value={pct} className="h-2" />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{description}</span>
        <Badge variant={pct > 70 ? "default" : pct > 30 ? "secondary" : "outline"} className="text-[10px]">{pct}%</Badge>
      </div>
    </div>
  );
}
