/**
 * FutureTerritoryMap — Full-screen RPG-style SVG map for the future skills catalogue.
 * 8 island regions, designed to be readable at default zoom on a full viewport.
 * Supports click-to-zoom on islands.
 */

import { useMemo, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";
import { type FutureSkill, type FutureSkillCategory } from "@/hooks/use-future-skills";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [focusedIsland, setFocusedIsland] = useState<FutureSkillCategory | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);
  const isDragging = useRef(false);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    setTransform(t => ({ ...t, scale: Math.max(0.5, Math.min(3, t.scale * delta)) }));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDragging.current = false;
    dragRef.current = { startX: e.clientX, startY: e.clientY, tx: transform.x, ty: transform.y };
  }, [transform]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDragging.current = true;
    setTransform(t => ({
      ...t,
      x: dragRef.current!.tx + dx,
      y: dragRef.current!.ty + dy,
    }));
  }, []);

  const handlePointerUp = useCallback(() => { dragRef.current = null; }, []);

  // Zoom to island center
  const handleIslandClick = useCallback((category: FutureSkillCategory, cx: number, cy: number) => {
    if (isDragging.current) return; // don't zoom on drag end
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const viewW = rect.width;
    const viewH = rect.height;

    // If already focused on this island, zoom out
    if (focusedIsland === category) {
      setTransform({ x: 0, y: 0, scale: 1 });
      setFocusedIsland(null);
      return;
    }

    // Calculate transform to center island in viewport
    // SVG viewBox maps FUTURE_MAP_WIDTH to container width
    const svgScale = viewW / FUTURE_MAP_WIDTH;
    const zoomLevel = 2.2;

    // Island center in screen pixels (at scale=1, translate=0)
    const islandScreenX = cx * svgScale;
    const islandScreenY = cy * svgScale * (FUTURE_MAP_WIDTH / FUTURE_MAP_HEIGHT) * (viewH / viewW);

    // We want the island center to be at viewport center after zoom
    const targetX = viewW / 2 - islandScreenX * zoomLevel;
    const targetY = viewH / 2 - islandScreenY * zoomLevel;

    setTransform({ x: targetX, y: targetY, scale: zoomLevel });
    setFocusedIsland(category);
  }, [focusedIsland]);

  // Node position lookup
  const nodePositions = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const island of layout) {
      const activeNodes = focusedIsland === island.category ? island.expandedNodes : island.nodes;
      for (const node of activeNodes) {
        m.set(node.skillId, { x: node.x, y: node.y });
      }
    }
    return m;
  }, [layout, focusedIsland]);

  const skillLookup = useMemo(() => new Map(skills.map(s => [s.id, s])), [skills]);

  return (
    <TooltipProvider delayDuration={200}>
      <div
        ref={containerRef}
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
            transformOrigin: "0 0",
            transition: isDragging.current ? "none" : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
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
              isFocused={focusedIsland === island.category}
              onIslandClick={handleIslandClick}
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
            onClick={() => { setTransform({ x: 0, y: 0, scale: 1 }); setFocusedIsland(null); }}
            className="w-8 h-8 rounded-md bg-card/80 border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-xs font-bold backdrop-blur-md transition-colors active:scale-[0.95]"
          >⟲</button>
        </div>

        {/* Back to overview button when zoomed */}
        {focusedIsland && (
          <button
            onClick={() => { setTransform({ x: 0, y: 0, scale: 1 }); setFocusedIsland(null); }}
            className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card/90 backdrop-blur-md border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground shadow-lg transition-all active:scale-[0.97]"
          >
            ← All Islands
          </button>
        )}
      </div>
    </TooltipProvider>
  );
}
