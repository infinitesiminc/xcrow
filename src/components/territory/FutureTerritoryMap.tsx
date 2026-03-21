/**
 * FutureTerritoryMap — Full-screen RPG-style SVG map for the future skills catalogue.
 * 8 island regions, designed to be readable at default zoom on a full viewport.
 */

import { useMemo, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";
import { type FutureSkill } from "@/hooks/use-future-skills";
import {
  buildFutureMapLayout,
  buildFutureConnections,
  FUTURE_MAP_WIDTH,
  FUTURE_MAP_HEIGHT,
} from "@/lib/future-territory-layout";
import FutureIsland from "./FutureIsland";

interface FutureTerritoryMapProps {
  skills: FutureSkill[];
}

export default function FutureTerritoryMap({ skills }: FutureTerritoryMapProps) {
  const layout = useMemo(() => buildFutureMapLayout(skills), [skills]);
  const connections = useMemo(() => buildFutureConnections(layout), [layout]);

  // Pan & zoom
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    setTransform(t => ({ ...t, scale: Math.max(0.5, Math.min(3, t.scale * delta)) }));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, tx: transform.x, ty: transform.y };
  }, [transform]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setTransform(t => ({
      ...t,
      x: dragRef.current!.tx + (e.clientX - dragRef.current!.startX),
      y: dragRef.current!.ty + (e.clientY - dragRef.current!.startY),
    }));
  }, []);

  const handlePointerUp = useCallback(() => { dragRef.current = null; }, []);

  // Node position lookup
  const nodePositions = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const island of layout) {
      for (const node of island.nodes) {
        m.set(node.skillId, { x: node.x, y: node.y });
      }
    }
    return m;
  }, [layout]);

  const skillLookup = useMemo(() => new Map(skills.map(s => [s.id, s])), [skills]);

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="h-full w-full relative overflow-hidden select-none"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: dragRef.current ? "grabbing" : "grab", touchAction: "none" }}
      >
        <svg
          viewBox={`0 0 ${FUTURE_MAP_WIDTH} ${FUTURE_MAP_HEIGHT}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "center center",
          }}
        >
          <defs>
            <filter id="future-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines for RPG map feel */}
          {Array.from({ length: 9 }, (_, i) => {
            const x = (FUTURE_MAP_WIDTH / 8) * i;
            return (
              <line key={`gv-${i}`} x1={x} y1={0} x2={x} y2={FUTURE_MAP_HEIGHT}
                stroke="hsl(var(--border))" strokeWidth={0.3} opacity={0.15} />
            );
          })}
          {Array.from({ length: 6 }, (_, i) => {
            const y = (FUTURE_MAP_HEIGHT / 5) * i;
            return (
              <line key={`gh-${i}`} x1={0} y1={y} x2={FUTURE_MAP_WIDTH} y2={y}
                stroke="hsl(var(--border))" strokeWidth={0.3} opacity={0.15} />
            );
          })}

          {/* Connections between nodes */}
          {connections.map((conn, i) => {
            const from = nodePositions.get(conn.from);
            const to = nodePositions.get(conn.to);
            if (!from || !to) return null;
            return (
              <motion.path
                key={`c-${i}`}
                d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth={0.8}
                opacity={0.25}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            );
          })}

          {/* Islands */}
          {layout.map(island => (
            <FutureIsland
              key={island.category}
              island={island}
              skillLookup={skillLookup}
            />
          ))}
        </svg>

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
          <button
            onClick={() => setTransform(t => ({ ...t, scale: Math.min(3, t.scale * 1.25) }))}
            className="w-8 h-8 rounded-md bg-card/80 border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm font-bold backdrop-blur-md transition-colors active:scale-[0.95]"
          >+</button>
          <button
            onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.5, t.scale * 0.8) }))}
            className="w-8 h-8 rounded-md bg-card/80 border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm font-bold backdrop-blur-md transition-colors active:scale-[0.95]"
          >−</button>
          <button
            onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
            className="w-8 h-8 rounded-md bg-card/80 border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-xs font-bold backdrop-blur-md transition-colors active:scale-[0.95]"
          >⟲</button>
        </div>
      </div>
    </TooltipProvider>
  );
}
