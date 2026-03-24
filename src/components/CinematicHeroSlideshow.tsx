/**
 * CinematicHeroSlideshow — Curated skill hero images that crossfade.
 * Shows a pill overlay with skill number and name.
 */
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const CURATED_SKILLS = [
  { id: "complex-threat-modeling", name: "Complex Threat Modeling" },
  { id: "ai-ethics-governance", name: "AI Ethics & Governance" },
  { id: "prompt-engineering", name: "Prompt Engineering" },
  { id: "strategic-problem-solving", name: "Strategic Problem Solving" },
  { id: "ethical-ai-leadership-governance", name: "Ethical AI Leadership" },
];

const CYCLE_MS = 5000;

export default function CinematicHeroSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedSkills, setLoadedSkills] = useState<typeof CURATED_SKILLS>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    let loaded = 0;
    const verified: (typeof CURATED_SKILLS[0] | null)[] = CURATED_SKILLS.map(() => null);

    CURATED_SKILLS.forEach((skill, i) => {
      const img = new Image();
      const url = `${SUPABASE_URL}/storage/v1/object/public/sim-images/skill-hero-${skill.id}.png`;
      img.onload = () => {
        verified[i] = skill;
        loaded++;
        if (loaded === CURATED_SKILLS.length)
          setLoadedSkills(verified.filter(Boolean) as typeof CURATED_SKILLS);
      };
      img.onerror = () => {
        loaded++;
        if (loaded === CURATED_SKILLS.length)
          setLoadedSkills(verified.filter(Boolean) as typeof CURATED_SKILLS);
      };
      img.src = url;
    });
  }, []);

  useEffect(() => {
    if (loadedSkills.length < 2) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % loadedSkills.length);
    }, CYCLE_MS);
    return () => clearInterval(intervalRef.current);
  }, [loadedSkills.length]);

  if (loadedSkills.length === 0) return null;

  const current = loadedSkills[activeIndex];

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
          <span className="text-[10px] font-mono text-muted-foreground">
            {activeIndex + 1}/{loadedSkills.length}
          </span>
          <span className="w-px h-3 bg-border/50" />
          <span className="text-xs font-medium text-foreground/90">
            {current.name}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
