/**
 * HeaderVibeImages — Decorative skill hero images scattered behind header areas.
 * Picks random images from the pre-generated skill hero pool with varied opacity/rotation.
 */
import { useMemo } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Pool of known skill hero image IDs (subset for variety)
const HERO_IDS = [
  "adaptive-workforce-strategy", "ai-powered-code-review", "autonomous-agent-orchestration",
  "boardroom-crisis-navigation", "brand-narrative-engineering", "cognitive-load-design",
  "complex-threat-modeling", "creative-campaign-fusion", "cross-cultural-ai-diplomacy",
  "data-storytelling-mastery", "design-system-evolution", "dynamic-pricing-orchestration",
  "empathetic-feedback-loops", "ethical-ai-governance", "explainable-ai-advocacy",
  "future-workforce-planning", "generative-ux-prototyping", "human-ai-co-creation",
  "inclusive-design-thinking", "intelligent-process-mining", "multi-agent-workflow-design",
  "narrative-data-visualization", "neural-interface-design", "organizational-resilience",
  "predictive-analytics-strategy", "prompt-engineering-mastery", "quantum-ready-architecture",
  "realtime-decision-systems", "responsible-innovation", "scenario-planning-mastery",
  "semantic-search-optimization", "stakeholder-trust-architecture", "strategic-automation-mapping",
  "sustainable-tech-leadership", "synthetic-data-governance", "trust-safety-operations",
];

function seededRandom(seed: number) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

interface HeaderVibeImagesProps {
  /** Seed for deterministic randomness per page load (e.g. hash of job title) */
  seed?: number;
  count?: number;
}

export default function HeaderVibeImages({ seed, count = 3 }: HeaderVibeImagesProps) {
  const images = useMemo(() => {
    const s = seed ?? Math.floor(Math.random() * 100000);
    const picked: typeof HERO_IDS[number][] = [];
    const pool = [...HERO_IDS];
    
    for (let i = 0; i < Math.min(count, pool.length); i++) {
      const idx = Math.floor(seededRandom(s + i * 7) * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }

    return picked.map((id, i) => {
      const r = seededRandom(s + i * 13);
      const r2 = seededRandom(s + i * 19);
      const r3 = seededRandom(s + i * 31);
      return {
        id,
        url: `${SUPABASE_URL}/storage/v1/object/public/sim-images/skill-hero-${id}.png`,
        rotation: (r - 0.5) * 24, // -12 to +12 degrees
        left: `${10 + r2 * 80}%`,
        opacity: 0.12 + r3 * 0.1, // 0.12 to 0.22
        scale: 0.8 + r3 * 0.6,
      };
    });
  }, [seed, count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {images.map((img) => (
        <img
          key={img.id}
          src={img.url}
          alt=""
          loading="lazy"
          className="absolute h-full w-auto object-cover"
          style={{
            left: img.left,
            top: "50%",
            transform: `translate(-50%, -50%) rotate(${img.rotation}deg) scale(${img.scale})`,
            opacity: img.opacity,
            filter: "blur(0.5px) saturate(0.8)",
            mixBlendMode: "screen",
          }}
        />
      ))}
    </div>
  );
}
