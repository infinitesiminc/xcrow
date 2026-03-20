/**
 * TerritoryOverlay — full-screen RPG map with force-directed layout.
 * Skills float freely, connected by relationship lines.
 * No category grouping — clusters emerge organically.
 */

import { useMemo, useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SKILL_TAXONOMY, type SkillXP } from "@/lib/skill-map";
import { getCastleState } from "@/lib/castle-levels";
import { computeForceLayout, LAYOUT_WIDTH, LAYOUT_HEIGHT } from "@/lib/force-layout";
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
  const positions = useMemo(() => computeForceLayout(), []);
  const posMap = useMemo(() => new Map(positions.map(p => [p.id, p])), [positions]);

  const totalXP = useMemo(() => skills.reduce((sum, s) => sum + s.xp, 0), [skills]);
  const unlockedCount = useMemo(() => skills.filter((s) => s.xp >= 100).length, [skills]);

  // Pan & zoom
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    setTransform(t => ({
      ...t,
      scale: Math.max(0.4, Math.min(2.5, t.scale * delta)),
    }));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, tx: transform.x, ty: transform.y };
  }, [transform]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setTransform(t => ({ ...t, x: dragRef.current!.tx + dx, y: dragRef.current!.ty + dy }));
  }, []);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleNodeClick = useCallback((skillId: string) => {
    // Future: open skill detail / sim launcher
  }, []);

  // Build edge visuals
  const edgeLines = useMemo(() => {
    return SKILL_EDGES.map((edge, i) => {
      const from = posMap.get(edge.from);
      const to = posMap.get(edge.to);
      if (!from || !to) return null;

      const fromXP = skillMap.get(edge.from)?.xp ?? 0;
      const toXP = skillMap.get(edge.to)?.xp ?? 0;
      const bothUnlocked = fromXP >= 100 && toXP >= 100;
      const anyUnlocked = fromXP >= 100 || toXP >= 100;

      return {
        key: i,
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
        strength: edge.strength,
        bothUnlocked,
        anyUnlocked,
      };
    }).filter(Boolean);
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

          {/* Map Canvas */}
          <div
            className="flex-1 relative overflow-hidden select-none"
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ cursor: dragRef.current ? "grabbing" : "grab", touchAction: "none" }}
          >
            <TooltipProvider delayDuration={200}>
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                  transformOrigin: "center center",
                  transition: dragRef.current ? "none" : "transform 0.1s ease-out",
                }}
              >
                {/* SVG for edges */}
                <svg
                  viewBox={`0 0 ${LAYOUT_WIDTH} ${LAYOUT_HEIGHT}`}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ width: LAYOUT_WIDTH, height: LAYOUT_HEIGHT }}
                >
                  {edgeLines.map((edge) => {
                    if (!edge) return null;
                    return (
                      <motion.line
                        key={edge.key}
                        x1={edge.x1}
                        y1={edge.y1}
                        x2={edge.x2}
                        y2={edge.y2}
                        stroke={
                          edge.bothUnlocked
                            ? "hsl(var(--primary))"
                            : edge.anyUnlocked
                            ? "hsl(var(--muted-foreground))"
                            : "hsl(var(--border))"
                        }
                        strokeWidth={edge.strength === 3 ? 1.5 : edge.strength === 2 ? 1 : 0.5}
                        opacity={edge.bothUnlocked ? 0.5 : edge.anyUnlocked ? 0.2 : 0.08}
                        strokeDasharray={edge.strength === 1 ? "4 4" : undefined}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                          pathLength: 1,
                          opacity: edge.bothUnlocked ? 0.5 : edge.anyUnlocked ? 0.2 : 0.08,
                        }}
                        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                      />
                    );
                  })}
                </svg>

                {/* Castle nodes positioned absolutely */}
                <div
                  className="relative"
                  style={{ width: LAYOUT_WIDTH, height: LAYOUT_HEIGHT }}
                >
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
                          left: pos.x - 44,
                          top: pos.y - 44,
                          width: 88,
                          height: 88,
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
              </div>
            </TooltipProvider>

            {/* Zoom controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
              <button
                onClick={() => setTransform(t => ({ ...t, scale: Math.min(2.5, t.scale * 1.2) }))}
                className="w-8 h-8 rounded-lg bg-card/90 border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm font-bold backdrop-blur-sm transition-colors active:scale-[0.95]"
              >
                +
              </button>
              <button
                onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.4, t.scale * 0.8) }))}
                className="w-8 h-8 rounded-lg bg-card/90 border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm font-bold backdrop-blur-sm transition-colors active:scale-[0.95]"
              >
                −
              </button>
              <button
                onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
                className="w-8 h-8 rounded-lg bg-card/90 border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-[10px] font-bold backdrop-blur-sm transition-colors active:scale-[0.95]"
              >
                ⟲
              </button>
            </div>
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
