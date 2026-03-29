/**
 * AgentCardImage — Lazy-loads an AI-generated hero image for each agent card.
 * Uses generate-sim-image edge function with deterministic cache keys.
 */
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const imageCache = new Map<string, string | null>();
const pendingRequests = new Map<string, Promise<string | null>>();

function buildPrompt(nicheName: string, verticalName: string): string {
  return `Dark fantasy RPG cinematic banner: An AI agent fortress representing "${nicheName}" in the ${verticalName} realm. Wide 3:1 aspect ratio. Moody atmospheric lighting with volumetric fog. Glowing circuits and magical runes embedded in dark stone architecture. Rich jewel-tone palette with cyan and gold accents. Painterly digital art style. No text, no letters, no words. Ethereal and powerful.`;
}

function cacheKey(nicheName: string): string {
  return `agent-card-${nicheName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}`;
}

async function fetchImage(nicheName: string, verticalName: string): Promise<string | null> {
  const key = cacheKey(nicheName);

  if (imageCache.has(key)) return imageCache.get(key)!;
  if (pendingRequests.has(key)) return pendingRequests.get(key)!;

  const storageUrl = `${SUPABASE_URL}/storage/v1/object/public/sim-images/${key}.png`;

  const promise = (async () => {
    try {
      // Check if already in storage
      const head = await fetch(storageUrl, { method: "HEAD" });
      if (head.ok) {
        imageCache.set(key, storageUrl);
        return storageUrl;
      }

      // Generate via edge function
      const { data, error } = await supabase.functions.invoke("generate-sim-image", {
        body: { prompt: buildPrompt(nicheName, verticalName), cacheKey: key },
      });

      if (error || !data?.url) {
        imageCache.set(key, null);
        return null;
      }

      const url = data.url.startsWith("data:") ? data.url : data.url;
      imageCache.set(key, url);
      return url;
    } catch {
      imageCache.set(key, null);
      return null;
    } finally {
      pendingRequests.delete(key);
    }
  })();

  pendingRequests.set(key, promise);
  return promise;
}

interface AgentCardImageProps {
  nicheName: string;
  verticalName: string;
  className?: string;
}

export default function AgentCardImage({ nicheName, verticalName, className }: AgentCardImageProps) {
  const [src, setSrc] = useState<string | null>(imageCache.get(cacheKey(nicheName)) ?? null);
  const [loaded, setLoaded] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const key = cacheKey(nicheName);

    if (imageCache.has(key)) {
      setSrc(imageCache.get(key)!);
      return;
    }

    fetchImage(nicheName, verticalName).then(url => {
      if (mountedRef.current) setSrc(url);
    });

    return () => { mountedRef.current = false; };
  }, [nicheName, verticalName]);

  if (!src) {
    // Gradient placeholder
    return (
      <div
        className={className}
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--filigree) / 0.12), hsl(var(--primary) / 0.05))",
          minHeight: 56,
        }}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`} style={{ minHeight: 56 }}>
      <img
        src={src}
        alt=""
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        className="w-full h-full object-cover transition-opacity duration-500"
        style={{ opacity: loaded ? 1 : 0 }}
      />
      {/* Gradient overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, transparent 30%, hsl(var(--card) / 0.7) 80%, hsl(var(--card)) 100%)",
        }}
      />
      {!loaded && (
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--filigree) / 0.12))",
          }}
        />
      )}
    </div>
  );
}
