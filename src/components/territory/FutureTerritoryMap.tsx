/**
 * FutureTerritoryMap — RPG-style SVG map for the canonical future skills catalogue.
 * 8 island regions representing the future skill taxonomy with proportional sizing.
 */

import { useMemo, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
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
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(t => ({ ...t, scale: Math.max(0.3, Math.min(2.5, t.scale * delta)) }));
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
  const totalNodes = layout.reduce((sum, island) => sum + island.nodes.length, 0);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Future Skills Territory
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {totalNodes} skills · 8 domains
          </span>
        </div>

        {/* SVG Map */}
        <div
          className="flex-1 relative overflow-hidden select-none"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ cursor: dragRef.current ? "grabbing" : "grab", touchAction: "none" }}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${FUTURE_MAP_WIDTH} ${FUTURE_MAP_HEIGHT}`}
            className="w-full h-full"
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
              <radialGradient id="future-island-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="white" stopOpacity="0.06" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Connections */}
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
                  strokeWidth={0.6}
                  opacity={0.2}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, delay: 0.3 }}
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
          <div className="absolute bottom-3 right-3 flex flex-col gap-1">
            <button
              onClick={() => setTransform(t => ({ ...t, scale: Math.min(2.5, t.scale * 1.2) }))}
              className="w-7 h-7 rounded-md bg-card/80 border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm font-bold backdrop-blur-sm transition-colors active:scale-[0.95]"
            >+</button>
            <button
              onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.3, t.scale * 0.8) }))}
              className="w-7 h-7 rounded-md bg-card/80 border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm font-bold backdrop-blur-sm transition-colors active:scale-[0.95]"
            >−</button>
            <button
              onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
              className="w-7 h-7 rounded-md bg-card/80 border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-[9px] font-bold backdrop-blur-sm transition-colors active:scale-[0.95]"
            >⟲</button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 border-t border-border/30 shrink-0">
          {[
            { label: "High Demand", cls: "bg-primary" },
            { label: "Emerging", cls: "border border-muted-foreground/40 border-dashed" },
            { label: "8 Domains", cls: "bg-muted-foreground/30" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${l.cls}`} />
              <span className="text-[11px] text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
