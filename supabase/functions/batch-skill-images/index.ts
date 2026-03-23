import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUCKET = "sim-images";

/* ── Domain-Metaphor Scene Mapping ──
   Each category gets a unique visual WORLD with diverse scene types
   tied to the skill's actual domain rather than generic battle scenes. */

const CATEGORY_WORLD: Record<string, {
  setting: string;
  scenes: string[];
  palette: string;
}> = {
  Technical: {
    setting: "arcane forge citadel",
    scenes: [
      "a master artificer shaping crystalline circuits on an enchanted anvil",
      "floating code-rune matrices spiraling around a glowing nexus core",
      "a vast clockwork laboratory with prismatic energy conduits",
      "spell-forged machinery assembling itself in a tower of blue flame",
      "an underground archive of glowing technical blueprints carved in stone",
    ],
    palette: "deep indigo and electric cyan with silver filigree",
  },
  Analytical: {
    setting: "celestial observatory spire",
    scenes: [
      "star charts and data constellations projected on observatory domes",
      "a scholar reading patterns in swirling emerald data streams",
      "crystal lenses refracting information into prismatic insights",
      "an astrolabe chamber with floating geometric proof structures",
      "a mountain-top library where books orbit like satellites",
    ],
    palette: "emerald green and midnight blue with gold accents",
  },
  Strategic: {
    setting: "war council summit",
    scenes: [
      "a grand strategy table with living holographic terrain maps",
      "chess-like pieces moving on a vast magical campaign board",
      "a throne room where advisors chart courses on enchanted scrolls",
      "a war room with floating tactical overlays and decision trees",
      "commanders surveying a vast kingdom from a crystal balcony",
    ],
    palette: "crimson and burnished gold with obsidian shadows",
  },
  Communication: {
    setting: "bridge isle archipelago",
    scenes: [
      "luminous bridges of light connecting floating island communities",
      "a messenger's guild hall with enchanted speaking stones",
      "a diplomatic amphitheater where words materialize as visible auras",
      "crystal relay towers transmitting signals across misty waters",
      "a translator's sanctum with swirling multilingual glyphs",
    ],
    palette: "warm amber and teal with soft pearl highlights",
  },
  Leadership: {
    setting: "crown heights citadel",
    scenes: [
      "a coronation hall with radiant banners and gathering followers",
      "a mentor guiding apprentices through an enchanted garden maze",
      "a round table council with each seat emanating unique power",
      "a beacon tower casting golden light across a vast domain",
      "a forge-master directing a team building a great monument",
    ],
    palette: "royal gold and deep purple with warm amber light",
  },
  Creative: {
    setting: "prism coast atelier",
    scenes: [
      "an artist's studio where paintings come alive off the canvas",
      "a seaside workshop where ideas crystallize into rainbow structures",
      "a music hall where melodies become visible waves of color",
      "a dreamweaver's loom creating tapestries of living imagination",
      "a garden where creative energy blooms as bioluminescent flowers",
    ],
    palette: "prismatic rainbow over warm coral and ocean blue",
  },
  "Ethics & Compliance": {
    setting: "sentinel watchtower",
    scenes: [
      "an ancient scales of justice floating in a hall of mirrors",
      "a guardian reading from a tome of laws carved in living crystal",
      "a watchtower sentinel scanning horizons with truth-seeing lenses",
      "a shield-wall of protective wards surrounding a sacred archive",
      "a courtroom where evidence glows and testimony leaves light trails",
    ],
    palette: "silver and deep teal with cool blue-white aura",
  },
  "Human Edge": {
    setting: "soul spring sanctuary",
    scenes: [
      "a healer channeling empathic energy through glowing hands",
      "a sanctuary pool reflecting emotional wavelengths as colors",
      "a counselor's grove where trees respond to human connection",
      "an intuition chamber with resonating crystal formations",
      "a gathering circle where shared stories weave into golden threads",
    ],
    palette: "warm rose and violet with soft golden inner glow",
  },
};

function buildPrompt(name: string, category: string, index: number): string {
  const world = CATEGORY_WORLD[category] || CATEGORY_WORLD.Technical;
  const scene = world.scenes[index % world.scenes.length];
  return `Dark fantasy RPG scene: ${scene}, representing the skill "${name}" in the ${world.setting}. Wide cinematic banner format (3:1 aspect ratio). Atmospheric, moody lighting. Rich ${world.palette}. Painterly digital art style. No text, no letters, no words. Ethereal fog and volumetric light. Detailed environment focus.`;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, serviceKey);

    // Accept category filter + skip existing flag
    let category: string | null = null;
    let skipExisting = true;
    let limit = 50;
    try {
      const body = await req.json();
      category = body.category ?? null;
      skipExisting = body.skipExisting ?? true;
      limit = body.limit ?? 50;
    } catch {}

    // Fetch skills for the target category
    let query = supabase
      .from("canonical_future_skills")
      .select("id, name, category")
      .order("demand_count", { ascending: false });

    if (category) query = query.eq("category", category);
    query = query.limit(limit);

    const { data: skills, error: fetchErr } = await query;
    if (fetchErr) throw new Error(`Fetch skills: ${fetchErr.message}`);
    if (!skills || skills.length === 0) {
      return new Response(JSON.stringify({ done: true, processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let generated = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];
    const generatedSkills: string[] = [];

    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i];
      const cacheKey = `skill-hero-${skill.id}`;
      const filePath = `${cacheKey}.png`;

      // Check if already exists
      if (skipExisting) {
        const { data: existing } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
        const headResp = await fetch(existing.publicUrl, { method: "HEAD" });
        if (headResp.ok) {
          skipped++;
          continue;
        }
      }

      // Generate with domain-metaphor prompt
      const prompt = buildPrompt(skill.name, skill.category, i);
      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image-preview",
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
        });

        if (aiResp.status === 429) {
          console.log(`Rate limited at skill ${skill.name}, stopping batch`);
          errors.push(`Rate limited at ${skill.name}`);
          break;
        }

        if (!aiResp.ok) {
          const errText = await aiResp.text();
          console.error(`AI error for ${skill.name}:`, aiResp.status, errText);
          failed++;
          errors.push(`${skill.name}: ${aiResp.status}`);
          await sleep(2000);
          continue;
        }

        const aiData = await aiResp.json();
        const imageB64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageB64) {
          failed++;
          errors.push(`${skill.name}: no image returned`);
          continue;
        }

        const base64Data = imageB64.replace(/^data:image\/\w+;base64,/, "");
        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let j = 0; j < binaryStr.length; j++) {
          bytes[j] = binaryStr.charCodeAt(j);
        }

        await supabase.storage.from(BUCKET).upload(filePath, bytes, {
          contentType: "image/png",
          cacheControl: "31536000",
          upsert: true,
        });

        generated++;
        generatedSkills.push(skill.name);
        console.log(`✅ Generated ${skill.name} (${generated})`);

        // Delay between generations to avoid rate limits
        await sleep(2000);
      } catch (e) {
        failed++;
        errors.push(`${skill.name}: ${e instanceof Error ? e.message : "unknown"}`);
      }
    }

    return new Response(
      JSON.stringify({
        category: category || "all",
        total: skills.length,
        generated,
        skipped,
        failed,
        generatedSkills,
        errors: errors.slice(0, 10),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("batch-skill-images error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
