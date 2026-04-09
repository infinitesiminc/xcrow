import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

const FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.photos,places.types,places.priceLevel,places.businessStatus,places.websiteUri,places.nationalPhoneNumber";

// Search a single area for an operator
async function searchArea(
  operatorName: string,
  lat: number,
  lng: number,
  radius: number,
  apiKey: string,
): Promise<PlaceResult[]> {
  const queries = [
    `${operatorName} parking`,
    `${operatorName}`,
  ];
  const allPlaces: PlaceResult[] = [];
  const seenIds = new Set<string>();

  for (const query of queries) {
    try {
      const resp = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify({
          textQuery: query,
          locationBias: {
            circle: { center: { latitude: lat, longitude: lng }, radius },
          },
          maxResultCount: 20,
        }),
      });

      if (!resp.ok) {
        console.error(`Places API error for "${query}": ${resp.status}`);
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
      console.error(`Error searching "${query}":`, err);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  return allPlaces;
}

// LA metro area search grid - covers greater LA in large overlapping circles
const LA_SEARCH_POINTS = [
  { lat: 34.0522, lng: -118.2437, label: "Downtown LA" },
  { lat: 34.0928, lng: -118.3287, label: "Hollywood" },
  { lat: 34.0736, lng: -118.4004, label: "Beverly Hills" },
  { lat: 34.0195, lng: -118.4912, label: "Santa Monica" },
  { lat: 33.9425, lng: -118.4081, label: "LAX area" },
  { lat: 34.1478, lng: -118.1445, label: "Pasadena" },
  { lat: 34.1866, lng: -118.3816, label: "Burbank/Glendale" },
  { lat: 34.1723, lng: -118.5363, label: "Sherman Oaks" },
  { lat: 34.0259, lng: -118.2840, label: "USC/South LA" },
  { lat: 34.0407, lng: -118.4676, label: "Century City/Westwood" },
  { lat: 33.9850, lng: -118.4695, label: "Marina del Rey" },
  { lat: 34.0625, lng: -118.3081, label: "Koreatown" },
  { lat: 33.7701, lng: -118.1937, label: "Long Beach" },
  { lat: 34.0555, lng: -118.2508, label: "Arts District" },
];

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

    // Auth check
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
    const operatorName: string = body.operator;
    const city: string = body.city || "Los Angeles";
    const radius: number = body.radius || 8000; // 8km per search point
    const areaIndex: number = body.areaIndex ?? 0;
    const batchSize: number = body.batchSize ?? 3;

    if (!operatorName) {
      return new Response(JSON.stringify({ error: "operator name is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const areas = LA_SEARCH_POINTS.slice(areaIndex, areaIndex + batchSize);
    if (areas.length === 0) {
      return new Response(JSON.stringify({
        done: true,
        operator: operatorName,
        totalAreas: LA_SEARCH_POINTS.length,
        message: `All areas searched for ${operatorName}`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalInserted = 0;
    let totalSkipped = 0;
    const scannedAreas: string[] = [];
    const allFound: string[] = [];

    for (const area of areas) {
      console.log(`Searching for "${operatorName}" in ${area.label}`);
      const places = await searchArea(operatorName, area.lat, area.lng, radius, GOOGLE_API_KEY);
      scannedAreas.push(area.label);

      for (const place of places) {
        if (!place.location) continue;

        // Check if this is actually the operator we're looking for
        const name = place.displayName?.text || "";
        const website = place.websiteUri || "";
        const nameMatch = name.toLowerCase().includes(operatorName.toLowerCase().split(" ")[0]);
        const websiteMatch = website.toLowerCase().includes(operatorName.toLowerCase().replace(/\s+/g, "").substring(0, 6));

        if (!nameMatch && !websiteMatch) continue;

        const row = {
          place_id: place.id,
          name: name || "Unknown",
          address: place.formattedAddress || null,
          lat: place.location.latitude,
          lng: place.location.longitude,
          rating: place.rating || null,
          reviews_count: place.userRatingCount || 0,
          photo_reference: place.photos?.[0]?.name || null,
          types: place.types || [],
          city,
          scan_zone: `operator-${operatorName.toLowerCase().replace(/\s+/g, "-")}`,
          operator_guess: operatorName,
          price_level: place.priceLevel
            ? parseInt(place.priceLevel.replace("PRICE_LEVEL_", "")) || null
            : null,
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
          allFound.push(`${name} (${area.label})`);
        }
      }
    }

    // Try to link to flash_accounts
    await supabase.rpc("link_garages_to_accounts");

    const nextAreaIndex = areaIndex + batchSize;
    const hasMore = nextAreaIndex < LA_SEARCH_POINTS.length;

    return new Response(JSON.stringify({
      done: !hasMore,
      operator: operatorName,
      inserted: totalInserted,
      skipped: totalSkipped,
      scannedAreas,
      found: allFound,
      nextAreaIndex: hasMore ? nextAreaIndex : null,
      totalAreas: LA_SEARCH_POINTS.length,
      progress: `${Math.min(nextAreaIndex, LA_SEARCH_POINTS.length)}/${LA_SEARCH_POINTS.length} areas`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("discover-operator error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
