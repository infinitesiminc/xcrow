import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import {
  Warehouse, MapPin, Users, Star, Loader2,
  ParkingCircle, ChevronRight, Search, ArrowUpDown,
  Globe, Map as MapIcon, Building2
} from "lucide-react";

interface GarageRow {
  operator_guess: string | null;
  capacity: number | null;
  rating: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lat: number;
  lng: number;
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

export interface GeoContext {
  country: string | null;
  state: string | null;
  city: string | null;
}

interface MarketPanelProps {
  geo: GeoContext;
  onGeoChange: (geo: GeoContext) => void;
}

export default function MarketPanel({ geo, onGeoChange }: MarketPanelProps) {
  const { country, state, city } = geo;
  const level = city ? "city" : state ? "state" : country ? "country" : "country";

  const [garages, setGarages] = useState<GarageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("locations");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("discovered_garages")
          .select("operator_guess, capacity, rating, city, state, country, lat, lng")
          .limit(5000);
        if (city) query = query.eq("city", city);
        else if (state) query = query.eq("state", state);
        else if (country) query = query.eq("country", country);
        const { data } = await query;
        setGarages((data as GarageRow[]) ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [country, state, city]);

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
    let groupField: "country" | "state" | "city";
    if (city) return [];
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

  function navigateTo(params: GeoContext) {
    onGeoChange(params);
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

  const title = city || state || country || "All Markets";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground flex-wrap">
        <button onClick={() => navigateTo({ country: null, state: null, city: null })} className="hover:text-foreground transition-colors font-medium">
          All Markets
        </button>
        {country && (
          <>
            <ChevronRight className="h-2.5 w-2.5" />
            <button onClick={() => navigateTo({ country, state: null, city: null })} className="hover:text-foreground transition-colors font-medium">
              {country}
            </button>
          </>
        )}
        {state && (
          <>
            <ChevronRight className="h-2.5 w-2.5" />
            <button onClick={() => navigateTo({ country, state, city: null })} className="hover:text-foreground transition-colors font-medium">
              {state}
            </button>
          </>
        )}
        {city && (
          <>
            <ChevronRight className="h-2.5 w-2.5" />
            <span className="text-foreground font-medium">{city}</span>
          </>
        )}
      </div>

      {/* Title */}
      <div className="flex items-center gap-2">
        {!country ? <Globe className="h-4 w-4 text-primary" />
          : !state ? <MapIcon className="h-4 w-4 text-primary" />
          : !city ? <Building2 className="h-4 w-4 text-primary" />
          : <MapPin className="h-4 w-4 text-primary" />}
        <h2 className="text-base font-bold text-foreground">{title}</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2">
        <KPICard icon={<Warehouse className="h-4 w-4" />} label="Garages" value={totalGarages} color="text-amber-500" />
        <KPICard icon={<ParkingCircle className="h-4 w-4" />} label="Capacity" value={totalCapacity.toLocaleString()} color="text-blue-500" />
        <KPICard icon={<Users className="h-4 w-4" />} label="Operators" value={uniqueOps} color="text-emerald-500" />
        <KPICard icon={<Star className="h-4 w-4" />} label="Avg Rating" value={avgRating ?? "—"} color="text-yellow-500" />
      </div>

      {/* Geo sub-groups */}
      {geoGroups.length > 0 && (
        <div>
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            {!country ? <Globe className="h-3 w-3 text-primary" /> : !state ? <MapIcon className="h-3 w-3 text-primary" /> : <Building2 className="h-3 w-3 text-primary" />}
            {!country ? "Countries" : !state ? "States" : "Cities"}
          </h3>
          <div className="space-y-1">
            {geoGroups.map(g => (
              <button
                key={g.key}
                onClick={() => handleGeoClick(g.key)}
                className="flex items-center justify-between w-full p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="min-w-0">
                  <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{g.key}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{g.garages} garages</span>
                    <span className="text-[10px] text-muted-foreground">{g.operators} ops</span>
                    {g.capacity > 0 && <span className="text-[10px] text-muted-foreground">{g.capacity.toLocaleString()} spaces</span>}
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Operator Table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="h-3 w-3 text-primary" />
            Operators
            <Badge variant="secondary" className="text-[9px]">{filteredOps.length}</Badge>
          </h3>
          <div className="relative w-32">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-7 h-7 text-[11px]"
            />
          </div>
        </div>

        <ScrollArea className="h-[320px]">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-border">
                {([
                  ["name", "Operator"],
                  ["locations", "Locs"],
                  ["capacity", "Cap"],
                  ["avgRating", "★"],
                  ...(level !== "city" ? [["cities", "Cities"]] : []),
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className={`text-left py-1.5 px-2 text-[9px] uppercase tracking-wider font-medium cursor-pointer select-none hover:text-foreground transition-colors ${
                      key === "name" ? "text-muted-foreground" : "text-muted-foreground text-right"
                    } ${sortKey === key ? "text-foreground" : ""}`}
                  >
                    <span className="inline-flex items-center gap-0.5">
                      {label}
                      {sortKey === key && <ArrowUpDown className="h-2.5 w-2.5" />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOps.map((op, i) => {
                const share = totalGarages > 0 ? (op.locations / totalGarages) * 100 : 0;
                return (
                  <tr key={op.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-1.5 px-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-muted-foreground w-4">{i + 1}</span>
                        <span className="font-medium truncate max-w-[120px]">{op.name}</span>
                        <div className="flex items-center gap-0.5 ml-auto">
                          <Progress value={share} className="w-8 h-1" />
                          <span className="text-[9px] font-mono text-muted-foreground">{share.toFixed(0)}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono">{op.locations}</td>
                    <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">
                      {op.capacity ? op.capacity.toLocaleString() : "—"}
                    </td>
                    <td className="py-1.5 px-2 text-right">
                      {op.avgRating ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
                          <span className="font-mono">{op.avgRating}</span>
                        </span>
                      ) : "—"}
                    </td>
                    {level !== "city" && (
                      <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">{op.cities}</td>
                    )}
                  </tr>
                );
              })}
              {filteredOps.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground text-[11px]">
                    {search ? "No operators match" : "No data"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      </div>
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
    <div className="bg-muted/30 border border-border rounded-lg p-2.5">
      <div className="flex items-center gap-2">
        <div className={`${color} shrink-0`}>{icon}</div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}
