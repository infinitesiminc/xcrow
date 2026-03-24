/**
 * CinematicHeroSlideshow — 5 skill hero images that crossfade behind the homepage hero.
 * Uses real canonical skill IDs from storage with a slow Ken Burns + crossfade effect.
 */
import { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const CURATED_IDS = [
  "complex-threat-modeling",
  "ai-ethics-governance",
  "strategic-narrative-design",
  "predictive-analytics",
  "human-ai-collaboration",
];

const CYCLE_MS = 5000; // 5 seconds per image

export default function CinematicHeroSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedUrls, setLoadedUrls] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Build URLs and preload
  useEffect(() => {
    const urls = CURATED_IDS.map(
      (id) => `${SUPABASE_URL}/storage/v1/object/public/sim-images/skill-hero-${id}.png`
    );

    // Preload all images
    let loaded = 0;
    const verified: string[] = [];
    urls.forEach((url, i) => {
      const img = new Image();
      img.onload = () => {
        verified[i] = url;
        loaded++;
        if (loaded === urls.length) setLoadedUrls([...verified]);
      };
      img.onerror = () => {
        verified[i] = ""; // skip broken
        loaded++;
        if (loaded === urls.length) setLoadedUrls([...verified].filter(Boolean));
      };
      img.src = url;
    });
  }, []);

  // Cycle through images
  useEffect(() => {
    if (loadedUrls.length < 2) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % loadedUrls.length);
    }, CYCLE_MS);
    return () => clearInterval(intervalRef.current);
  }, [loadedUrls.length]);

  if (loadedUrls.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={activeIndex}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        >
          <motion.img
            src={loadedUrls[activeIndex]}
            alt=""
            className="w-full h-full object-cover"
            initial={{ scale: 1.05 }}
            animate={{ scale: 1.15 }}
            transition={{ duration: CYCLE_MS / 1000 + 2, ease: "linear" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark overlay for text legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, hsl(var(--background) / 0.7) 0%, hsl(var(--background) / 0.85) 50%, hsl(var(--background)) 100%)",
        }}
      />
    </div>
  );
}
