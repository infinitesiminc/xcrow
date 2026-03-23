/**
 * HeaderVibeImages — Decorative skill hero images scattered behind header areas.
 * Uses real canonical skill IDs from database so URLs always exist.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const FALLBACK_IDS = ["complex-threat-modeling", "ai-code-review", "ai-ethics-governance"];

let heroIdCache: string[] | null = null;
let heroIdPromise: Promise<string[]> | null = null;

async function loadHeroIds(): Promise<string[]> {
  if (heroIdCache) return heroIdCache;
  if (heroIdPromise) return heroIdPromise;

  heroIdPromise = (async () => {
    const { data } = await supabase
      .from("canonical_future_skills")
      .select("id")
      .limit(250);

    const ids = (data ?? []).map((row) => row.id).filter(Boolean);
    heroIdCache = ids.length > 0 ? ids : FALLBACK_IDS;
    return heroIdCache;
  })();

  return heroIdPromise;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

interface HeaderVibeImagesProps {
  seed?: number;
  count?: number;
}

export default function HeaderVibeImages({ seed, count = 4 }: HeaderVibeImagesProps) {
  const [heroIds, setHeroIds] = useState<string[]>(heroIdCache ?? FALLBACK_IDS);

  useEffect(() => {
    let active = true;
    loadHeroIds().then((ids) => {
      if (active) setHeroIds(ids);
    });
    return () => {
      active = false;
    };
  }, []);

  const images = useMemo(() => {
    const s = seed ?? Math.floor(Math.random() * 100000);
    const pool = [...heroIds];
    const picked: string[] = [];

    for (let i = 0; i < Math.min(count, pool.length); i++) {
      const idx = Math.floor(seededRandom(s + i * 17) * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }

    return picked.map((id, i) => {
      const r1 = seededRandom(s + i * 23);
      const r2 = seededRandom(s + i * 31);
      const r3 = seededRandom(s + i * 41);
      const r4 = seededRandom(s + i * 53);

      return {
        id,
        url: `${SUPABASE_URL}/storage/v1/object/public/sim-images/skill-hero-${id}.png`,
        rotation: (r1 - 0.5) * 28,
        left: `${8 + r2 * 84}%`,
        top: "50%",
        width: `${100 + r4 * 80}px`,
        opacity: 0.18 + r3 * 0.12,
      };
    });
  }, [seed, count, heroIds]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {images.map((img) => (
        <img
          key={img.id}
          src={img.url}
          alt=""
          loading="eager"
          className="absolute object-cover rounded-md"
          style={{
            left: img.left,
            top: img.top,
            width: img.width,
            height: "100%",
            transform: `translate(-50%, -50%) rotate(${img.rotation}deg)`,
            opacity: img.opacity,
            filter: "saturate(1.05)",
            border: "1px solid hsl(var(--filigree) / 0.35)",
            boxShadow: "0 0 0 1px hsl(var(--background) / 0.25), 0 6px 16px hsl(var(--background) / 0.4)",
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ))}
    </div>
  );
}
