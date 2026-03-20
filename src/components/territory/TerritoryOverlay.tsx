/**
 * TerritoryOverlay — full-screen RPG map with isometric grid layout.
 * Skills placed on a diamond grid, connected by relationship lines.
 * Drag-to-pan + scroll + pinch zoom for natural exploration.
 */

import { useMemo, useCallback, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SKILL_TAXONOMY, type SkillXP } from "@/lib/skill-map";
import { getCastleState } from "@/lib/castle-levels";
import { computeIsometricLayout, getCanvasSize } from "@/lib/isometric-layout";
import { SKILL_EDGES } from "@/lib/skill-relationships";
import CastleNode from "./CastleNode";

interface TerritoryOverlayProps {
  open: boolean;
  onClose: () => void;
  skills: SkillXP[];
  lastPracticedSkillId?: string | null;
}

export default function TerritoryOverlay({
  open,
  onClose,
  skills,
  lastPracticedSkillId,
}: TerritoryOverlayProps) {
  const skillMap = useMemo(() => new Map(skills.map((s) => [s.id, s])), [skills]);
  const positions = useMemo(() => computeIsometricLayout(), []);
  const posMap = useMemo(() => new Map(positions.map(p => [p.id, p])), [positions]);
  const canvasSize = useMemo(() => getCanvasSize(), []);

  const scrollRef = useRef<HTMLDivElement>(null);

  const totalXP = useMemo(() => skills.reduce((sum, s) => sum + s.xp, 0), [skills]);
  const unlockedCount = useMemo(() => skills.filter((s) => s.xp >= 100).length, [skills]);

  // Center scroll on open
  useEffect(() => {
    if (open && scrollRef.current) {
      const el = scrollRef.current;
      const scrollX = (canvasSize.width - el.clientWidth) / 2;
      const scrollY = (canvasSize.height - el.clientHeight) / 3;
      el.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
    }
  }, [open, canvasSize]);

  const handleNodeClick = useCallback((skillId: string) => {
    // Future: open skill detail / sim launcher
  }, []);

  // Build edge line data
  const edgeLines = useMemo(() => {
    return SKILL_EDGES.map((edge, i) => {
      const from = posMap.get(edge.from);
      const to = posMap.get(edge.to);
      if (!from || !to) return null;

      const fromXP = skillMap.get(edge.from)?.xp ?? 0;
      const toXP = skillMap.get(edge.to)?.xp ?? 0;
      const bothUnlocked = fromXP >= 100 && toXP >= 100;
      const anyUnlocked = fromXP >= 100 || toXP >= 100;

      return { key: i, from, to, strength: edge.strength, bothUnlocked, anyUnlocked };
    }).filter(Boolean) as {
      key: number;
      from: { x: number; y: number };
      to: { x: number; y: number };
      strength: number;
      bothUnlocked: boolean;
      anyUnlocked: boolean;
    }[];
  }, [posMap, skillMap]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="territory-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[60] bg-background/98 backdrop-blur-sm flex flex-col"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="flex items-center justify-between px-6 py-4 border-b border-border/30 shrink-0"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  Skill Territory
                </h2>
                <p className="text-xs text-muted-foreground">
                  {unlockedCount} castles claimed • {totalXP.toLocaleString()} total XP
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all active:scale-[0.97] border border-border/40"
            >
              <X className="h-3.5 w-3.5" />
              Close
            </button>
          </motion.div>

          {/* Scrollable Map */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-auto"
            style={{ scrollBehavior: "auto" }}
          >
            <TooltipProvider delayDuration={200}>
              <div
                className="relative"
                style={{
                  width: canvasSize.width,
                  height: canvasSize.height,
                  minWidth: canvasSize.width,
                  minHeight: canvasSize.height,
                }}
              >
                {/* Subtle grid pattern background */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ width: canvasSize.width, height: canvasSize.height }}
                >
                  <defs>
                    <pattern id="iso-grid" width="180" height="110" patternUnits="userSpaceOnUse">
                      <path
                        d="M 90 0 L 180 55 L 90 110 L 0 55 Z"
                        fill="none"
                        stroke="hsl(var(--border))"
                        strokeWidth="0.5"
                        opacity="0.15"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#iso-grid)" />

                  {/* Relationship lines */}
                  {edgeLines.map((edge) => (
                    <line
                      key={edge.key}
                      x1={edge.from.x}
                      y1={edge.from.y}
                      x2={edge.to.x}
                      y2={edge.to.y}
                      stroke={
                        edge.bothUnlocked
                          ? "hsl(var(--primary))"
                          : edge.anyUnlocked
                          ? "hsl(var(--muted-foreground))"
                          : "hsl(var(--border))"
                      }
                      strokeWidth={edge.strength === 3 ? 2 : edge.strength === 2 ? 1.5 : 1}
                      opacity={edge.bothUnlocked ? 0.5 : edge.anyUnlocked ? 0.15 : 0.06}
                      strokeDasharray={edge.strength === 1 ? "6 6" : undefined}
                    />
                  ))}
                </svg>

                {/* Castle nodes */}
                {positions.map((pos, i) => {
                  const skill = SKILL_TAXONOMY.find(s => s.id === pos.id);
                  if (!skill) return null;

                  const sx = skillMap.get(pos.id);
                  const xp = sx?.xp ?? 0;
                  const castle = getCastleState(xp);
                  const isActive = lastPracticedSkillId === pos.id;

                  return (
                    <div
                      key={pos.id}
                      className="absolute"
                      style={{
                        left: pos.x - 50,
                        top: pos.y - 50,
                        width: 100,
                        height: 100,
                        zIndex: Math.round(pos.y),
                      }}
                    >
                      <CastleNode
                        skillId={pos.id}
                        name={skill.name}
                        category={skill.category}
                        castle={castle}
                        xp={xp}
                        isActive={isActive}
                        onClick={() => handleNodeClick(pos.id)}
                        delay={i}
                      />
                    </div>
                  );
                })}
              </div>
            </TooltipProvider>
          </div>

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-6 py-3 border-t border-border/30 shrink-0 text-[10px] text-muted-foreground"
          >
            {[
              { emoji: "🏚️", label: "Ruins (locked)" },
              { emoji: "🏕️", label: "Outpost (100+ XP)" },
              { emoji: "🏰", label: "Fortress (300+ XP)" },
              { emoji: "⚔️", label: "Citadel (600+ XP)" },
              { emoji: "🐦‍⬛", label: "Crowy (last practiced)" },
            ].map((l) => (
              <span key={l.label} className="flex items-center gap-1">
                <span>{l.emoji}</span> {l.label}
              </span>
            ))}
            <span className="opacity-50">• Scroll to explore</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
