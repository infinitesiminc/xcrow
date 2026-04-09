import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Downtown LA grid: ~34.03-34.06 lat, ~-118.28 to -118.23 lng
// We tile it into small zones for comprehensive coverage
const DTLA_ZONES = (() => {
  const zones: { lat: number; lng: number; label: string }[] = [];
  const latStart = 34.025;
  const latEnd = 34.065;
  const lngStart = -118.285;
  const lngEnd = -118.225;
  const step = 0.008; // ~0.5 miles per zone
  let idx = 0;
  for (let lat = latStart; lat <= latEnd; lat += step) {
    for (let lng = lngStart; lng <= lngEnd; lng += step) {
      zones.push({ lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6, label: `dtla-${idx++}` });
    }
  }
  return zones;
})();

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

    // Verify superadmin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
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

    const body = await req.json().catch(() => ({}));
    const zoneIndex = body.zoneIndex ?? 0;
    const batchSize = body.batchSize ?? 3; // scan N zones at a time

    const zoneBatch = DTLA_ZONES.slice(zoneIndex, zoneIndex + batchSize);
    if (zoneBatch.length === 0) {
      return new Response(JSON.stringify({ 
        done: true, 
        totalZones: DTLA_ZONES.length,
        message: "All zones scanned" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalInserted = 0;
    let totalSkipped = 0;
    const scannedZones: string[] = [];

    for (const zone of zoneBatch) {
      console.log(`Scanning zone ${zone.label} at ${zone.lat},${zone.lng}`);
      
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

        // Rate limit: small delay between queries
        await new Promise(r => setTimeout(r, 200));
      }

      // Insert into DB
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
          city: "Los Angeles",
          scan_zone: zone.label,
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
    const hasMore = nextZoneIndex < DTLA_ZONES.length;

    return new Response(JSON.stringify({
      done: !hasMore,
      inserted: totalInserted,
      skipped: totalSkipped,
      scannedZones,
      nextZoneIndex: hasMore ? nextZoneIndex : null,
      totalZones: DTLA_ZONES.length,
      progress: `${Math.min(nextZoneIndex, DTLA_ZONES.length)}/${DTLA_ZONES.length} zones`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("scan-la-garages error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
