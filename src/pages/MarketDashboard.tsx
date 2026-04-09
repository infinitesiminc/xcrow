import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import {
  Warehouse, MapPin, Users, Star, Loader2,
  ParkingCircle, ChevronRight, Search, ArrowUpDown,
  Globe, Map as MapIcon, Building2
} from "lucide-react";

/* ─── types ─── */
interface GarageRow {
  operator_guess: string | null;
  capacity: number | null;
  rating: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

interface OperatorStats {
  name: string;
  locations: number;
  capacity: number;
  avgRating: number | null;
  cities: number;
}

interface GeoGroup {
  key: string;
  garages: number;
  operators: number;
  capacity: number;
  avgRating: number | null;
}

type SortKey = "name" | "locations" | "capacity" | "avgRating" | "cities";
type SortDir = "asc" | "desc";

type Level = "country" | "state" | "city";

/* ─── main component ─── */
export default function MarketDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const country = searchParams.get("country") || null;
  const state = searchParams.get("state") || null;
  const city = searchParams.get("city") || null;

  const level: Level = city ? "city" : state ? "state" : country ? "country" : "country";

  const [garages, setGarages] = useState<GarageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("locations");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    loadGarages();
  }, [country, state, city]);

  async function loadGarages() {
    setLoading(true);
    try {
      let query = supabase
        .from("discovered_garages")
        .select("operator_guess, capacity, rating, city, state, country")
        .limit(5000);

      if (city) query = query.eq("city", city);
      else if (state) query = query.eq("state", state);
      else if (country) query = query.eq("country", country);

      const { data } = await query;
      setGarages((data as GarageRow[]) ?? []);
    } finally {
      setLoading(false);
    }
  }

  /* ─── compute stats ─── */
  const operators = useMemo(() => {
    const map: Record<string, { locs: number; cap: number; ratings: number[]; citySet: Set<string> }> = {};
    for (const g of garages) {
      const op = g.operator_guess || "Unknown";
      if (!map[op]) map[op] = { locs: 0, cap: 0, ratings: [], citySet: new Set() };
      map[op].locs++;
      if (g.capacity) map[op].cap += g.capacity;
      if (g.rating) map[op].ratings.push(g.rating);
      if (g.city) map[op].citySet.add(g.city);
    }
    return Object.entries(map)
      .filter(([name]) => name !== "Unknown" && name !== "Independent")
      .map(([name, d]): OperatorStats => ({
        name,
        locations: d.locs,
        capacity: d.cap,
        avgRating: d.ratings.length ? +(d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(1) : null,
        cities: d.citySet.size,
      }));
  }, [garages]);

  const filteredOps = useMemo(() => {
    let list = operators;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o => o.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === "string" && typeof bv === "string")
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return list;
  }, [operators, search, sortKey, sortDir]);

  const geoGroups = useMemo((): GeoGroup[] => {
    // Determine the child grouping key
    let groupField: "country" | "state" | "city";
    if (city) return []; // at city level, no sub-groups
    else if (state) groupField = "city";
    else if (country) groupField = "state";
    else groupField = "country";

    const map: Record<string, { garages: number; opSet: Set<string>; cap: number; ratings: number[] }> = {};
    for (const g of garages) {
      const key = g[groupField] || "Unknown";
      if (!map[key]) map[key] = { garages: 0, opSet: new Set(), cap: 0, ratings: [] };
      map[key].garages++;
      if (g.operator_guess) map[key].opSet.add(g.operator_guess);
      if (g.capacity) map[key].cap += g.capacity;
      if (g.rating) map[key].ratings.push(g.rating);
    }

    return Object.entries(map)
      .map(([key, d]): GeoGroup => ({
        key,
        garages: d.garages,
        operators: d.opSet.size,
        capacity: d.cap,
        avgRating: d.ratings.length ? +(d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(1) : null,
      }))
      .sort((a, b) => b.garages - a.garages);
  }, [garages, country, state, city]);

  const totalGarages = garages.length;
  const totalCapacity = garages.reduce((s, g) => s + (g.capacity || 0), 0);
  const uniqueOps = new Set(garages.map(g => g.operator_guess).filter(Boolean)).size;
  const ratings = garages.filter(g => g.rating != null);
  const avgRating = ratings.length ? +(ratings.reduce((s, g) => s + (g.rating || 0), 0) / ratings.length).toFixed(1) : null;

  /* ─── breadcrumb nav ─── */
  function navigateTo(params: Record<string, string | null>) {
    const p = new URLSearchParams();
    if (params.country) p.set("country", params.country);
    if (params.state) p.set("state", params.state);
    if (params.city) p.set("city", params.city);
    setSearchParams(p);
    setSearch("");
  }

  function handleGeoClick(key: string) {
    if (!country) navigateTo({ country: key, state: null, city: null });
    else if (!state) navigateTo({ country, state: key, city: null });
    else if (!city) navigateTo({ country, state, city: key });
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function viewOnMap(cityName?: string) {
    navigate(`/admin/flash?city=${encodeURIComponent(cityName || city || "")}`);
  }

  const levelIcon = !country ? <Globe className="h-5 w-5 text-primary" />
    : !state ? <MapIcon className="h-5 w-5 text-primary" />
    : !city ? <Building2 className="h-5 w-5 text-primary" />
    : <MapPin className="h-5 w-5 text-primary" />;

  const title = city || state || country || "All Markets";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
        <button onClick={() => navigateTo({ country: null, state: null, city: null })} className="hover:text-foreground transition-colors font-medium">
          All Markets
        </button>
        {country && (
          <>
            <ChevronRight className="h-3 w-3" />
            <button onClick={() => navigateTo({ country, state: null, city: null })} className="hover:text-foreground transition-colors font-medium">
              {country}
            </button>
          </>
        )}
        {state && (
          <>
            <ChevronRight className="h-3 w-3" />
            <button onClick={() => navigateTo({ country, state, city: null })} className="hover:text-foreground transition-colors font-medium">
              {state}
            </button>
          </>
        )}
        {city && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{city}</span>
          </>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {levelIcon}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {city ? "City-level market intelligence" : state ? "State-level overview" : country ? "Country-level overview" : "Global parking intelligence"}
            </p>
          </div>
        </div>
        {city && (
          <Button size="sm" variant="outline" onClick={() => viewOnMap()}>
            <MapPin className="h-3.5 w-3.5 mr-1.5" /> View on Map
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={<Warehouse className="h-5 w-5" />} label="Total Garages" value={totalGarages} color="text-amber-500" />
        <KPICard icon={<ParkingCircle className="h-5 w-5" />} label="Total Capacity" value={totalCapacity.toLocaleString()} color="text-blue-500" />
        <KPICard icon={<Users className="h-5 w-5" />} label="Operators" value={uniqueOps} color="text-emerald-500" />
        <KPICard icon={<Star className="h-5 w-5" />} label="Avg Rating" value={avgRating ?? "—"} color="text-yellow-500" />
      </div>

      {/* Geo sub-groups (if not at city level) */}
      {geoGroups.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              {!country ? <Globe className="h-4 w-4 text-primary" /> : !state ? <MapIcon className="h-4 w-4 text-primary" /> : <Building2 className="h-4 w-4 text-primary" />}
              {!country ? "Countries" : !state ? "States" : "Cities"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {geoGroups.map(g => (
                <button
                  key={g.key}
                  onClick={() => handleGeoClick(g.key)}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left group"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{g.key}</span>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">{g.garages} garages</span>
                      <span className="text-[11px] text-muted-foreground">{g.operators} ops</span>
                      {g.capacity > 0 && <span className="text-[11px] text-muted-foreground">{g.capacity.toLocaleString()} spaces</span>}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary shrink-0" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operator Table */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Operator Leaderboard
              <Badge variant="secondary" className="text-[10px]">{filteredOps.length}</Badge>
            </h3>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search operators…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          <ScrollArea className="h-[420px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {([
                    ["name", "Operator"],
                    ["locations", "Locations"],
                    ["capacity", "Capacity"],
                    ["avgRating", "Rating"],
                    ...(level !== "city" ? [["cities", "Cities"]] : []),
                  ] as [SortKey, string][]).map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className={`text-left py-2 px-3 text-[10px] uppercase tracking-wider font-medium cursor-pointer select-none hover:text-foreground transition-colors ${
                        key === "name" ? "text-muted-foreground" : "text-muted-foreground text-right"
                      } ${sortKey === key ? "text-foreground" : ""}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        {sortKey === key && <ArrowUpDown className="h-3 w-3" />}
                      </span>
                    </th>
                  ))}
                  {city && <th className="w-20" />}
                </tr>
              </thead>
              <tbody>
                {filteredOps.map((op, i) => {
                  const share = totalGarages > 0 ? (op.locations / totalGarages) * 100 : 0;
                  return (
                    <tr key={op.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-5">{i + 1}</span>
                          <span className="font-medium truncate max-w-[200px]">{op.name}</span>
                          <div className="flex items-center gap-1 ml-auto">
                            <Progress value={share} className="w-10 h-1.5" />
                            <span className="text-[10px] font-mono text-muted-foreground">{share.toFixed(0)}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono">{op.locations}</td>
                      <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                        {op.capacity ? op.capacity.toLocaleString() : "—"}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {op.avgRating ? (
                          <span className="inline-flex items-center gap-0.5">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="font-mono text-xs">{op.avgRating}</span>
                          </span>
                        ) : "—"}
                      </td>
                      {level !== "city" && (
                        <td className="py-2 px-3 text-right font-mono text-muted-foreground">{op.cities}</td>
                      )}
                      {city && (
                        <td className="py-2 px-3 text-right">
                          <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => viewOnMap(city)}>
                            <MapPin className="h-3 w-3 mr-1" /> Map
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filteredOps.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                      {search ? "No operators match your search" : "No operator data available"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`${color} shrink-0`}>{icon}</div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
