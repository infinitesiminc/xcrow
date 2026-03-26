/**
 * TerritoryParticles — Canvas 2D particle system that renders territory-themed
 * ambient effects behind the skill map. Each territory category produces a
 * distinct particle style:
 *
 *   Technical   → green code rain (falling characters)
 *   Analytical  → cyan data dots (rising bubbles)
 *   Strategic   → gold sparks (drifting embers)
 *   Communication → emerald ripples (expanding rings)
 *   Leadership  → flame motes (upward embers)
 *   Creative    → rainbow confetti (swirling)
 *   Ethics      → jade shields (pulsing)
 *   Human Edge  → magenta hearts (floating)
 *
 * Performance: runs at ~30fps with requestAnimationFrame, auto-pauses when
 * tab is not visible. Max 120 particles.
 */

import { useRef, useEffect, useCallback } from "react";
import type { FutureSkillCategory } from "@/hooks/use-future-skills";

interface TerritoryParticlesProps {
  /** Currently focused territory (particles intensify for this one) */
  focusedTerritory?: FutureSkillCategory | null;
  /** Whether to render (disable for perf on low-end devices) */
  enabled?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  type: "dot" | "char" | "ember" | "ring";
  char?: string;
  opacity: number;
}

const TERRITORY_PARTICLES: Record<FutureSkillCategory, { hue: number; type: Particle["type"]; chars?: string }> = {
  Technical:             { hue: 262, type: "char", chars: "01{};</>" },
  Analytical:            { hue: 195, type: "dot" },
  Strategic:             { hue: 45,  type: "ember" },
  Communication:         { hue: 152, type: "ring" },
  Leadership:            { hue: 25,  type: "ember" },
  Creative:              { hue: 340, type: "dot" },
  "Ethics & Compliance": { hue: 175, type: "ring" },
  "Human Edge":          { hue: 320, type: "dot" },
};

const MAX_PARTICLES = 100;
const SPAWN_RATE = 0.4; // particles per frame

export default function TerritoryParticles({ focusedTerritory, enabled = true }: TerritoryParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);

  const spawnParticle = useCallback((w: number, h: number): Particle => {
    const categories = Object.keys(TERRITORY_PARTICLES) as FutureSkillCategory[];
    // Bias toward focused territory
    const cat = focusedTerritory && Math.random() < 0.6
      ? focusedTerritory
      : categories[Math.floor(Math.random() * categories.length)];
    const config = TERRITORY_PARTICLES[cat];

    const base: Particle = {
      x: Math.random() * w,
      y: config.type === "char" ? -10 : Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: config.type === "char" ? 0.8 + Math.random() * 0.6
        : config.type === "ember" ? -(0.3 + Math.random() * 0.5)
        : (Math.random() - 0.5) * 0.2,
      life: 0,
      maxLife: 120 + Math.random() * 180,
      size: 2 + Math.random() * 3,
      hue: config.hue + (Math.random() - 0.5) * 20,
      type: config.type,
      opacity: 0.3 + Math.random() * 0.4,
    };

    if (config.type === "char" && config.chars) {
      base.char = config.chars[Math.floor(Math.random() * config.chars.length)];
      base.size = 8 + Math.random() * 4;
    }

    return base;
  }, [focusedTerritory]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width * (window.devicePixelRatio > 1 ? 1.5 : 1);
        canvas.height = rect.height * (window.devicePixelRatio > 1 ? 1.5 : 1);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = () => {
      if (!running) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Spawn
      if (particlesRef.current.length < MAX_PARTICLES && Math.random() < SPAWN_RATE) {
        particlesRef.current.push(spawnParticle(w, h));
      }

      // Update & draw
      particlesRef.current = particlesRef.current.filter(p => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        const progress = p.life / p.maxLife;
        const alpha = progress < 0.1 ? progress * 10 : progress > 0.8 ? (1 - progress) * 5 : 1;
        const finalAlpha = alpha * p.opacity;

        if (p.life > p.maxLife || p.y > h + 20 || p.y < -20) return false;

        ctx.globalAlpha = finalAlpha;

        switch (p.type) {
          case "dot":
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${p.hue}, 70%, 60%)`;
            ctx.fill();
            break;

          case "char":
            ctx.font = `${p.size}px monospace`;
            ctx.fillStyle = `hsl(${p.hue}, 80%, 55%)`;
            ctx.fillText(p.char || "0", p.x, p.y);
            break;

          case "ember":
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1 - progress * 0.5), 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${p.hue}, 90%, ${50 + progress * 20}%)`;
            ctx.fill();
            break;

          case "ring":
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size + progress * 8, 0, Math.PI * 2);
            ctx.strokeStyle = `hsl(${p.hue}, 60%, 55%)`;
            ctx.lineWidth = 1;
            ctx.stroke();
            break;
        }

        return true;
      });

      ctx.globalAlpha = 1;
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [enabled, spawnParticle]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      aria-hidden="true"
    />
  );
}
