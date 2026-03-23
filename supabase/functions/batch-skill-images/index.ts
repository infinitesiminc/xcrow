import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUCKET = "sim-images";

const CATEGORY_TERRAIN: Record<string, string> = {
  Technical: "crystalline forge",
  Analytical: "ancient observatory",
  Creative: "prismatic dreamscape",
  Leadership: "golden throne hall",
  Strategic: "war council chamber",
};

const CATEGORY_ACCENT: Record<string, string> = {
  Technical: "arcane blue",
  Analytical: "emerald green",
  Creative: "prismatic",
  Leadership: "golden",
  Strategic: "crimson and silver",
};

function buildPrompt(name: string, category: string): string {
  const terrain = CATEGORY_TERRAIN[category] || "mystical realm";
  const accent = CATEGORY_ACCENT[category] || "arcane blue";
  return `Dark fantasy RPG skill illustration for "${name}" — ${terrain} domain. Ethereal ${category} energy, glowing runes, arcane atmosphere. Wide banner format, moody lighting, no text, painterly style, indigo and violet tones with ${accent} accents.`;
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

    // Get optional offset/limit from body
    let offset = 0;
    let limit = 20; // process in batches of 20 per invocation to stay within timeout
    try {
      const body = await req.json();
      offset = body.offset ?? 0;
      limit = body.limit ?? 20;
    } catch {}

    // Fetch all canonical skills
    const { data: skills, error: fetchErr } = await supabase
      .from("canonical_future_skills")
      .select("id, name, category")
      .order("name")
      .range(offset, offset + limit - 1);

    if (fetchErr) throw new Error(`Fetch skills: ${fetchErr.message}`);
    if (!skills || skills.length === 0) {
      return new Response(JSON.stringify({ done: true, processed: 0, offset }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let generated = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const skill of skills) {
      const cacheKey = `skill-hero-${skill.id}`;
      const filePath = `${cacheKey}.png`;

      // Check if already exists
      const { data: existing } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      const headResp = await fetch(existing.publicUrl, { method: "HEAD" });
      if (headResp.ok) {
        skipped++;
        continue;
      }

      // Generate
      const prompt = buildPrompt(skill.name, skill.category);
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
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        await supabase.storage.from(BUCKET).upload(filePath, bytes, {
          contentType: "image/png",
          cacheControl: "31536000",
          upsert: true,
        });

        generated++;
        console.log(`✅ Generated ${skill.name} (${generated})`);

        // Delay between generations to avoid rate limits
        await sleep(3000);
      } catch (e) {
        failed++;
        errors.push(`${skill.name}: ${e instanceof Error ? e.message : "unknown"}`);
      }
    }

    return new Response(
      JSON.stringify({
        done: skills.length < limit,
        offset,
        processed: skills.length,
        generated,
        skipped,
        failed,
        nextOffset: offset + limit,
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
