import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CorridorRow {
  id: string;
  city: string;
  region_key: string;
  label: string;
  lat_start: number;
  lat_end: number;
  lng_start: number;
  lng_end: number;
  step: number;
  priority: number;
  enabled: boolean;
}

function buildZones(c: CorridorRow): { lat: number; lng: number; label: string }[] {
  const zones: { lat: number; lng: number; label: string }[] = [];
  let idx = 0;
  for (let lat = c.lat_start; lat <= c.lat_end; lat += c.step) {
    for (let lng = c.lng_start; lng <= c.lng_end; lng += c.step) {
      zones.push({
        lat: Math.round(lat * 1e6) / 1e6,
        lng: Math.round(lng * 1e6) / 1e6,
        label: `zone-${idx++}`,
      });
    }
  }
  return zones;
}

interface PlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  photos?: { name: string }[];
  types?: string[];
  priceLevel?: string;
  businessStatus?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
}

async function scanZone(
  zone: { lat: number; lng: number; label: string },
  corridor: CorridorRow,
  apiKey: string,
  supabase: ReturnType<typeof createClient>,
): Promise<{ inserted: number; skipped: number }> {
  console.log(`Scanning ${corridor.label} zone ${zone.label} at ${zone.lat},${zone.lng}`);

  const queries = ["parking garage", "parking structure", "parking lot"];
  const allPlaces: PlaceResult[] = [];
  const seenIds = new Set<string>();

  for (const query of queries) {
    try {
      const resp = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.photos,places.types,places.priceLevel,places.businessStatus,places.websiteUri,places.nationalPhoneNumber",
        },
        body: JSON.stringify({
          textQuery: query,
          locationBias: {
            circle: { center: { latitude: zone.lat, longitude: zone.lng }, radius: 600 },
          },
          maxResultCount: 20,
        }),
      });

      if (!resp.ok) {
        console.error(`Places API error for "${query}" at zone ${zone.label}: ${resp.status}`);
        continue;
      }

      const data = await resp.json();
      for (const p of (data.places || []) as PlaceResult[]) {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          allPlaces.push(p);
        }
      }
    } catch (err) {
      console.error(`Error scanning "${query}" at zone ${zone.label}:`, err);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  let inserted = 0;
  let skipped = 0;

  for (const place of allPlaces) {
    if (!place.location) continue;

    const row = {
      place_id: place.id,
      name: place.displayName?.text || "Unknown",
      address: place.formattedAddress || null,
      lat: place.location.latitude,
      lng: place.location.longitude,
      rating: place.rating || null,
      reviews_count: place.userRatingCount || 0,
      photo_reference: place.photos?.[0]?.name || null,
      types: place.types || [],
      city: corridor.city,
      scan_zone: `${corridor.region_key}-${zone.label}`,
      price_level: place.priceLevel
        ? parseInt(place.priceLevel.replace("PRICE_LEVEL_", "")) || null
        : null,
      business_status: place.businessStatus || null,
      website: place.websiteUri || null,
      phone: place.nationalPhoneNumber || null,
      total_ratings: place.userRatingCount || null,
    };

    const { error } = await supabase.from("discovered_garages").upsert(row, { onConflict: "place_id" });
    if (error) {
      console.error(`Insert error for ${place.id}:`, error.message);
      skipped++;
    } else {
      inserted++;
    }
  }

  return { inserted, skipped };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!GOOGLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Google Maps API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth: check if service_role JWT or superadmin user
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? "";

    let isServiceRole = false;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      isServiceRole = payload.role === "service_role";
    } catch {}

    if (!isServiceRole) {
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: isAdmin } = await supabase.rpc("is_superadmin", { _user_id: user.id });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json().catch(() => ({}));

    // --- LIST action: return corridors from DB ---
    if (body.action === "list") {
      const { data: corridors, error } = await supabase
        .from("scan_corridors")
        .select("*")
        .eq("enabled", true)
        .order("priority", { ascending: true });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const cityFilter = body.city;
      const filtered = cityFilter
        ? (corridors as CorridorRow[]).filter((c) => c.city === cityFilter)
        : (corridors as CorridorRow[]);

      // Get garage counts per corridor scan_zone prefix
      const { data: garageCounts } = await supabase.rpc("get_corridor_garage_counts");
      const countMap = new Map<string, number>();
      for (const row of (garageCounts || []) as { region_key: string; garage_count: number }[]) {
        countMap.set(row.region_key, row.garage_count);
      }

      // Get scan progress per corridor
      const corridorIds = filtered.map((c) => c.id);
      const { data: progressRows } = await supabase
        .from("scan_progress")
        .select("corridor_id, status, last_zone_index, total_zones")
        .in("corridor_id", corridorIds);
      const progressMap = new Map<string, { status: string; last_zone_index: number; total_zones: number }>();
      for (const row of (progressRows || []) as any[]) {
        progressMap.set(row.corridor_id, row);
      }

      const corridorList = filtered.map((c) => {
        const totalZones = buildZones(c).length;
        const garagesFound = countMap.get(c.region_key) || 0;
        const progress = progressMap.get(c.id);
        return {
          key: c.region_key,
          label: c.label,
          city: c.city,
          zones: totalZones,
          id: c.id,
          garagesFound,
          scanStatus: garagesFound > 0 ? (progress?.status || "completed") : "not_started",
        };
      });

      // Group by city
      const cities = [...new Set(filtered.map((c) => c.city))];

      return new Response(JSON.stringify({ corridors: corridorList, cities }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- SCAN action ---
    const corridorKey = body.corridor ?? "dtla";
    const zoneIndex = body.zoneIndex ?? 0;
    const batchSize = body.batchSize ?? 3;

    // Look up corridor from DB
    const { data: corridorRows, error: corridorErr } = await supabase
      .from("scan_corridors")
      .select("*")
      .eq("region_key", corridorKey)
      .eq("enabled", true)
      .limit(1);

    if (corridorErr || !corridorRows?.length) {
      return new Response(
        JSON.stringify({
          error: `Unknown or disabled corridor: ${corridorKey}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const corridor = corridorRows[0] as CorridorRow;
    const zones = buildZones(corridor);
    const zoneBatch = zones.slice(zoneIndex, zoneIndex + batchSize);

    if (zoneBatch.length === 0) {
      // Mark progress as completed
      await supabase
        .from("scan_progress")
        .upsert(
          {
            corridor_id: corridor.id,
            last_zone_index: zones.length,
            total_zones: zones.length,
            status: "completed",
            completed_at: new Date().toISOString(),
          },
          { onConflict: "corridor_id" },
        );

      return new Response(
        JSON.stringify({
          done: true,
          corridor: corridorKey,
          city: corridor.city,
          totalZones: zones.length,
          message: `All ${corridor.label} zones scanned`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let totalInserted = 0;
    let totalSkipped = 0;
    const scannedZones: string[] = [];

    for (const zone of zoneBatch) {
      const result = await scanZone(zone, corridor, GOOGLE_API_KEY, supabase);
      totalInserted += result.inserted;
      totalSkipped += result.skipped;
      scannedZones.push(zone.label);
    }

    const nextZoneIndex = zoneIndex + batchSize;
    const hasMore = nextZoneIndex < zones.length;

    // Update scan progress
    await supabase
      .from("scan_progress")
      .upsert(
        {
          corridor_id: corridor.id,
          last_zone_index: Math.min(nextZoneIndex, zones.length),
          total_zones: zones.length,
          garages_found: totalInserted,
          status: hasMore ? "scanning" : "completed",
          started_at: zoneIndex === 0 ? new Date().toISOString() : undefined,
          completed_at: hasMore ? undefined : new Date().toISOString(),
        },
        { onConflict: "corridor_id" },
      );

    return new Response(
      JSON.stringify({
        done: !hasMore,
        corridor: corridorKey,
        city: corridor.city,
        corridorLabel: corridor.label,
        inserted: totalInserted,
        skipped: totalSkipped,
        scannedZones,
        nextZoneIndex: hasMore ? nextZoneIndex : null,
        totalZones: zones.length,
        progress: `${Math.min(nextZoneIndex, zones.length)}/${zones.length} zones`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("scan-la-garages error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
