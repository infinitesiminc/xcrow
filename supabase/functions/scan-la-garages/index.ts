import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CorridorDef {
  label: string;
  latStart: number;
  latEnd: number;
  lngStart: number;
  lngEnd: number;
  step: number;
  city: string;
}

const LA_CORRIDORS: Record<string, CorridorDef> = {
  dtla: {
    label: "Downtown LA",
    latStart: 34.025, latEnd: 34.065,
    lngStart: -118.285, lngEnd: -118.225,
    step: 0.008, city: "Los Angeles",
  },
  hollywood: {
    label: "Hollywood / Koreatown / Mid-Wilshire",
    latStart: 34.055, latEnd: 34.105,
    lngStart: -118.365, lngEnd: -118.285,
    step: 0.008, city: "Los Angeles",
  },
  westside: {
    label: "Westside (Beverly Hills, Century City, Westwood)",
    latStart: 34.035, latEnd: 34.085,
    lngStart: -118.435, lngEnd: -118.365,
    step: 0.008, city: "Los Angeles",
  },
  santa_monica: {
    label: "Santa Monica / Venice / Marina del Rey",
    latStart: 33.975, latEnd: 34.035,
    lngStart: -118.510, lngEnd: -118.435,
    step: 0.008, city: "Los Angeles",
  },
  lax: {
    label: "LAX / El Segundo / Inglewood",
    latStart: 33.925, latEnd: 33.975,
    lngStart: -118.430, lngEnd: -118.350,
    step: 0.008, city: "Los Angeles",
  },
  pasadena: {
    label: "Pasadena / Glendale / Burbank",
    latStart: 34.120, latEnd: 34.200,
    lngStart: -118.310, lngEnd: -118.130,
    step: 0.010, city: "Los Angeles",
  },
  valley: {
    label: "San Fernando Valley (Sherman Oaks, Encino, Van Nuys)",
    latStart: 34.140, latEnd: 34.210,
    lngStart: -118.500, lngEnd: -118.380,
    step: 0.010, city: "Los Angeles",
  },
  south_la: {
    label: "South LA / USC / Exposition Park",
    latStart: 33.980, latEnd: 34.025,
    lngStart: -118.310, lngEnd: -118.240,
    step: 0.008, city: "Los Angeles",
  },
};

function buildZones(corridor: CorridorDef): { lat: number; lng: number; label: string }[] {
  const zones: { lat: number; lng: number; label: string }[] = [];
  let idx = 0;
  for (let lat = corridor.latStart; lat <= corridor.latEnd; lat += corridor.step) {
    for (let lng = corridor.lngStart; lng <= corridor.lngEnd; lng += corridor.step) {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!GOOGLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Google Maps API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify superadmin or service role key
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? "";
    const isServiceRole = token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!isServiceRole) {
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: isAdmin } = await supabase.rpc("is_superadmin", { _user_id: user.id });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json().catch(() => ({}));
    const corridorKey = body.corridor ?? "dtla";
    const zoneIndex = body.zoneIndex ?? 0;
    const batchSize = body.batchSize ?? 3;

    // Support "list" action to return available corridors
    if (body.action === "list") {
      const corridorList = Object.entries(LA_CORRIDORS).map(([key, c]) => ({
        key,
        label: c.label,
        zones: buildZones(c).length,
      }));
      return new Response(JSON.stringify({ corridors: corridorList }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const corridor = LA_CORRIDORS[corridorKey];
    if (!corridor) {
      return new Response(JSON.stringify({ error: `Unknown corridor: ${corridorKey}`, available: Object.keys(LA_CORRIDORS) }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const zones = buildZones(corridor);
    const zoneBatch = zones.slice(zoneIndex, zoneIndex + batchSize);
    if (zoneBatch.length === 0) {
      return new Response(JSON.stringify({ 
        done: true, 
        corridor: corridorKey,
        totalZones: zones.length,
        message: `All ${corridor.label} zones scanned` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalInserted = 0;
    let totalSkipped = 0;
    const scannedZones: string[] = [];

    for (const zone of zoneBatch) {
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
              "X-Goog-Api-Key": GOOGLE_API_KEY,
              "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.photos,places.types,places.priceLevel,places.businessStatus,places.websiteUri,places.nationalPhoneNumber",
            },
            body: JSON.stringify({
              textQuery: query,
              locationBias: {
                circle: {
                  center: { latitude: zone.lat, longitude: zone.lng },
                  radius: 600,
                },
              },
              maxResultCount: 20,
            }),
          });

          if (!resp.ok) {
            console.error(`Places API error for "${query}" at zone ${zone.label}: ${resp.status}`);
            continue;
          }

          const data = await resp.json();
          const places: PlaceResult[] = data.places || [];
          
          for (const p of places) {
            if (!seenIds.has(p.id)) {
              seenIds.add(p.id);
              allPlaces.push(p);
            }
          }
        } catch (err) {
          console.error(`Error scanning "${query}" at zone ${zone.label}:`, err);
        }

        await new Promise(r => setTimeout(r, 200));
      }

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
          scan_zone: `${corridorKey}-${zone.label}`,
          price_level: place.priceLevel ? parseInt(place.priceLevel.replace("PRICE_LEVEL_", "")) || null : null,
          business_status: place.businessStatus || null,
          website: place.websiteUri || null,
          phone: place.nationalPhoneNumber || null,
          total_ratings: place.userRatingCount || null,
        };

        const { error } = await supabase
          .from("discovered_garages")
          .upsert(row, { onConflict: "place_id" });

        if (error) {
          console.error(`Insert error for ${place.id}:`, error.message);
          totalSkipped++;
        } else {
          totalInserted++;
        }
      }

      scannedZones.push(zone.label);
    }

    const nextZoneIndex = zoneIndex + batchSize;
    const hasMore = nextZoneIndex < zones.length;

    return new Response(JSON.stringify({
      done: !hasMore,
      corridor: corridorKey,
      corridorLabel: corridor.label,
      inserted: totalInserted,
      skipped: totalSkipped,
      scannedZones,
      nextZoneIndex: hasMore ? nextZoneIndex : null,
      totalZones: zones.length,
      progress: `${Math.min(nextZoneIndex, zones.length)}/${zones.length} zones`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("scan-la-garages error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
