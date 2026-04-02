import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const APIFY_BASE = "https://api.apify.com/v2";

// Actor IDs from Apify Store
const ACTORS = {
  google_maps: "compass/crawler-google-places",
  twitter: "apidojo/twitter-scraper-v2",
  instagram: "apify/instagram-scraper",
  reddit: "trudax/reddit-scraper-lite",
} as const;

type ActorType = keyof typeof ACTORS;

interface GoogleMapsInput {
  query: string;
  location: string;
  max_results?: number;
}

interface SocialListeningInput {
  keywords: string[];
  platform: "twitter" | "instagram" | "reddit";
  max_results?: number;
}

async function runActorSync(
  actorId: string,
  input: Record<string, unknown>,
  apiKey: string,
  timeoutSecs = 120,
  memoryMbytes = 256,
): Promise<{ ok: true; items: any[] } | { ok: false; error: string }> {
  const url = `${APIFY_BASE}/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${apiKey}&timeout=${timeoutSecs}&memory=${memoryMbytes}`;

  console.log(`Running actor ${actorId}`, JSON.stringify(input).slice(0, 300));

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Apify actor error [${res.status}]:`, errText.slice(0, 500));
    return { ok: false, error: `Apify error ${res.status}: ${errText.slice(0, 200)}` };
  }

  const items = await res.json();
  return { ok: true, items: Array.isArray(items) ? items : [] };
}

function buildGoogleMapsInput(params: GoogleMapsInput) {
  return {
    searchStringsArray: [params.query],
    locationQuery: params.location,
    maxCrawledPlacesPerSearch: params.max_results || 10,
    language: "en",
    includeWebResults: false,
    skipClosedPlaces: true,
    scrapeContacts: true,
    scrapeDirectories: true,
  };
}

function mapGoogleMapsResult(item: any) {
  return {
    name: item.title || item.name || "Unknown",
    address: item.address || item.street || null,
    phone: item.phone || item.phoneUnformatted || null,
    website: item.website || item.url || null,
    email: item.email || null,
    rating: item.totalScore || item.rating || null,
    reviews_count: item.reviewsCount || null,
    category: item.categoryName || item.category || null,
    location: item.city || item.neighborhood || null,
    google_maps_url: item.url || item.placeUrl || null,
    photo_url: item.imageUrl || null,
    source: "google_maps",
  };
}

function buildSocialInput(params: SocialListeningInput) {
  const { platform, keywords, max_results = 20 } = params;

  switch (platform) {
    case "twitter":
      return {
        searchTerms: keywords,
        maxTweets: max_results,
        sort: "Latest",
        tweetLanguage: "en",
      };
    case "reddit":
      return {
        searches: keywords.map((kw) => ({
          term: kw,
          sort: "new",
          time: "week",
        })),
        maxItems: max_results,
        includeComments: false,
      };
    case "instagram":
      return {
        search: keywords[0],
        resultsLimit: max_results,
        searchType: "hashtag",
      };
    default:
      return {};
  }
}

function mapSocialResult(item: any, platform: string) {
  switch (platform) {
    case "twitter":
      return {
        author: item.author?.name || item.user?.name || null,
        handle: item.author?.userName || item.user?.screen_name || null,
        content: item.text || item.full_text || null,
        url: item.url || null,
        engagement: (item.likeCount || 0) + (item.retweetCount || 0) + (item.replyCount || 0),
        created_at: item.createdAt || null,
        platform: "twitter",
      };
    case "reddit":
      return {
        author: item.username || item.author || null,
        handle: null,
        content: item.title || item.body || null,
        url: item.url || null,
        engagement: (item.numberOfUpvotes || item.score || 0) + (item.numberOfComments || 0),
        created_at: item.createdAt || item.postedAt || null,
        platform: "reddit",
        subreddit: item.communityName || item.subreddit || null,
      };
    case "instagram":
      return {
        author: item.ownerUsername || null,
        handle: item.ownerUsername || null,
        content: item.caption || null,
        url: item.url || null,
        engagement: (item.likesCount || 0) + (item.commentsCount || 0),
        created_at: item.timestamp || null,
        platform: "instagram",
      };
    default:
      return item;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Auth guard
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user }, error: authErr } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authErr || !user) return json({ error: "Unauthorized" }, 401);

  try {
    const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY");
    if (!APIFY_API_KEY) return json({ error: "Apify not configured" }, 500);

    const body = await req.json();
    const { type } = body as { type: ActorType };

    if (type === "google_maps") {
      const { query, location, max_results } = body as GoogleMapsInput & { type: string };
      if (!query || !location) return json({ error: "query and location required" }, 400);

      const input = buildGoogleMapsInput({ query, location, max_results });
      const result = await runActorSync(ACTORS.google_maps, input, APIFY_API_KEY, 120, 512);

      if (!result.ok) return json({ success: false, error: result.error }, 502);

      const leads = result.items.slice(0, max_results || 10).map(mapGoogleMapsResult);
      console.log(`Google Maps: ${leads.length} leads for "${query}" in "${location}"`);

      return json({ success: true, leads, total: result.items.length });
    }

    if (type === "social") {
      const { keywords, platform, max_results } = body as SocialListeningInput & { type: string };
      if (!keywords?.length || !platform) return json({ error: "keywords and platform required" }, 400);
      if (!["twitter", "reddit", "instagram"].includes(platform)) {
        return json({ error: "platform must be twitter, reddit, or instagram" }, 400);
      }

      const actorKey = platform as keyof typeof ACTORS;
      const actorId = ACTORS[actorKey];
      const input = buildSocialInput({ keywords, platform, max_results });
      const result = await runActorSync(actorId, input, APIFY_API_KEY, 90, 256);

      if (!result.ok) return json({ success: false, error: result.error }, 502);

      const signals = result.items.slice(0, max_results || 20).map((item) => mapSocialResult(item, platform));
      console.log(`Social (${platform}): ${signals.length} signals for [${keywords.join(", ")}]`);

      return json({ success: true, signals, total: result.items.length });
    }

    return json({ error: `Unknown type: ${type}. Use "google_maps" or "social".` }, 400);
  } catch (err: any) {
    console.error("apify-search error:", err);
    return json({ error: err.message }, 500);
  }
});
