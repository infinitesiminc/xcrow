/**
 * CinematicHeroSlideshow — Curated skill hero images that crossfade.
 * Shows a pill overlay with skill number and name from the database.
 */
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const CURATED_IDS = [
  "complex-threat-modeling",
  "ai-ethics-governance",
  "prompt-engineering",
  "strategic-problem-solving",
  "ethical-ai-leadership-governance",
];

const CYCLE_MS = 5000;

interface SkillSlide {
  id: string;
  name: string;
  skillNumber: number;
}

export default function CinematicHeroSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slides, setSlides] = useState<SkillSlide[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    // Fetch skill metadata from DB
    supabase
      .from("canonical_future_skills")
      .select("id, name, skill_number")
      .in("id", CURATED_IDS)
      .then(({ data }) => {
        if (!data || data.length === 0) return;

        // Order by the CURATED_IDS array order
        const ordered = CURATED_IDS
          .map((cid) => data.find((d) => d.id === cid))
          .filter(Boolean)
          .map((d) => ({
            id: d!.id,
            name: d!.name,
            skillNumber: d!.skill_number ?? 0,
          }));

        // Preload images, keep only those that load
        let loaded = 0;
        const verified: (SkillSlide | null)[] = ordered.map(() => null);
        ordered.forEach((skill, i) => {
          const img = new Image();
          img.onload = () => {
            verified[i] = skill;
            loaded++;
            if (loaded === ordered.length)
              setSlides(verified.filter(Boolean) as SkillSlide[]);
          };
          img.onerror = () => {
            loaded++;
            if (loaded === ordered.length)
              setSlides(verified.filter(Boolean) as SkillSlide[]);
          };
          img.src = `${SUPABASE_URL}/storage/v1/object/public/sim-images/skill-hero-${skill.id}.png`;
        });
      });
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, CYCLE_MS);
    return () => clearInterval(intervalRef.current);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const current = slides[activeIndex];

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
            src={`${SUPABASE_URL}/storage/v1/object/public/sim-images/skill-hero-${current.id}.png`}
            alt={current.name}
            className="w-full h-full object-cover"
            initial={{ scale: 1.05 }}
            animate={{ scale: 1.15 }}
            transition={{ duration: CYCLE_MS / 1000 + 2, ease: "linear" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, hsl(var(--background) / 0.5) 100%)",
        }}
      />

      {/* Skill pill */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/40"
          style={{
            background: "hsl(var(--background) / 0.7)",
            backdropFilter: "blur(12px)",
          }}
        >
          <span
            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md"
            style={{
              background: "hsl(var(--primary) / 0.15)",
              color: "hsl(var(--primary))",
            }}
          >
            #{current.skillNumber}
          </span>
          <span className="text-xs font-medium text-foreground/90">
            {current.name}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
