/**
 * FutureTerritoryMap — Full-screen RPG-style SVG map for the future skills catalogue.
 * 8 island regions with minimap, pan clamping, and click-to-zoom.
 */

import { useMemo, useState, useRef, useCallback, useEffect } from "react";
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
import type { CanonicalSkillGrowth } from "@/pages/MapPage";

interface FutureTerritoryMapProps {
  skills: FutureSkill[];
  focusSkillId?: string | null;
  level2SkillIds?: Set<string>;
  skillGrowthMap?: Map<string, CanonicalSkillGrowth>;
  /** Called when user clicks a skill node on the map */
  onSkillSelect?: (skill: FutureSkill) => void;
}

const ISLAND_COLORS: Record<string, string> = {
  "AI & Machine Learning": "hsl(var(--neon-blue))",
  "Data & Analytics": "hsl(var(--neon-cyan))",
  "Cloud & Infrastructure": "hsl(var(--neon-purple))",
  "Security & Privacy": "hsl(var(--neon-pink))",
  "Development & Engineering": "hsl(var(--neon-green))",
  "Business & Strategy": "hsl(var(--accent))",
  "Design & Experience": "hsl(var(--neon-orange))",
  "Communication & Collaboration": "hsl(var(--primary))",
};

export default function FutureTerritoryMap({ skills, focusSkillId, level2SkillIds, skillGrowthMap, onSkillSelect }: FutureTerritoryMapProps) {
  const layout = useMemo(() => buildFutureMapLayout(skills), [skills]);
  const connections = useMemo(() => buildFutureConnections(layout), [layout]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [focusedIsland, setFocusedIsland] = useState<FutureSkillCategory | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<FutureSkill | null>(null);
  const [highlightedSkillId, setHighlightedSkillId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);
  const isDragging = useRef(false);

  const clampTransform = useCallback((x: number, y: number, scale: number) => {
    const container = containerRef.current;
    if (!container) return { x, y };
    const rect = container.getBoundingClientRect();
    const mapW = rect.width * scale;
    const mapH = rect.height * scale;
    const margin = 0.3;
    return {
      x: Math.max(-(mapW - rect.width * margin), Math.min(rect.width * (1 - margin), x)),
      y: Math.max(-(mapH - rect.height * margin), Math.min(rect.height * (1 - margin), y)),
    };
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    setTransform(t => {
      const newScale = Math.max(0.5, Math.min(3, t.scale * delta));
      const c = clampTransform(t.x, t.y, newScale);
      return { ...c, scale: newScale };
    });
  }, [clampTransform]);

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
    const rawX = dragRef.current.tx + dx;
    const rawY = dragRef.current.ty + dy;
    setTransform(t => {
      const c = clampTransform(rawX, rawY, t.scale);
      return { ...t, ...c };
    });
  }, [clampTransform]);

  const handlePointerUp = useCallback(() => { dragRef.current = null; }, []);

  const handleIslandClick = useCallback((category: FutureSkillCategory, cx: number, cy: number) => {
    if (isDragging.current) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    if (focusedIsland === category) {
      setTransform({ x: 0, y: 0, scale: 1 });
      setFocusedIsland(null);
      return;
    }

    const svgScale = rect.width / FUTURE_MAP_WIDTH;
    const zoomLevel = 2.2;
    const islandScreenX = cx * svgScale;
    const islandScreenY = cy * svgScale * (FUTURE_MAP_WIDTH / FUTURE_MAP_HEIGHT) * (rect.height / rect.width);
    const targetX = rect.width / 2 - islandScreenX * zoomLevel;
    const targetY = rect.height / 2 - islandScreenY * zoomLevel;

    setTransform({ x: targetX, y: targetY, scale: zoomLevel });
    setFocusedIsland(category);
  }, [focusedIsland]);

  const handleSkillClick = useCallback((skill: FutureSkill) => {
    if (isDragging.current) return;
    setSelectedSkill(skill);
    setHighlightedSkillId(skill.id);
    setDrawerOpen(true);
  }, []);

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

  // External focus: pan to skill and open drawer
  useEffect(() => {
    if (!focusSkillId) return;
    const skill = skillLookup.get(focusSkillId);
    if (!skill) return;

    // Find which island contains this skill and its position
    for (const island of layout) {
      const allNodes = [...island.nodes, ...island.expandedNodes];
      const node = allNodes.find(n => n.skillId === focusSkillId);
      if (node) {
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const svgScale = rect.width / FUTURE_MAP_WIDTH;
          const zoomLevel = 2.5;
          const targetX = rect.width / 2 - node.x * svgScale * zoomLevel;
          const targetY = rect.height / 2 - node.y * svgScale * (FUTURE_MAP_WIDTH / FUTURE_MAP_HEIGHT) * (rect.height / rect.width) * zoomLevel;
          setTransform({ x: targetX, y: targetY, scale: zoomLevel });
          setFocusedIsland(island.category);
        }
        break;
      }
    }

    setSelectedSkill(skill);
    setHighlightedSkillId(skill.id);
    setDrawerOpen(true);
  }, [focusSkillId, skillLookup, layout]);

  // Minimap
  const MINIMAP_W = 140;
  const MINIMAP_H = MINIMAP_W * (FUTURE_MAP_HEIGHT / FUTURE_MAP_WIDTH);

  const viewportRect = useMemo(() => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0, w: MINIMAP_W, h: MINIMAP_H };
    const rect = container.getBoundingClientRect();
    const svgScale = rect.width / FUTURE_MAP_WIDTH;
    const vx = -transform.x / (svgScale * transform.scale);
    const vy = -transform.y / (svgScale * transform.scale) * (FUTURE_MAP_WIDTH / FUTURE_MAP_HEIGHT) * (rect.width / rect.height);
    const vw = rect.width / (svgScale * transform.scale);
    const vh = rect.height / (svgScale * transform.scale);
    return {
      x: Math.max(0, Math.min(MINIMAP_W - 4, (vx / FUTURE_MAP_WIDTH) * MINIMAP_W)),
      y: Math.max(0, Math.min(MINIMAP_H - 4, (vy / FUTURE_MAP_HEIGHT) * MINIMAP_H)),
      w: Math.min(MINIMAP_W, (vw / FUTURE_MAP_WIDTH) * MINIMAP_W),
      h: Math.min(MINIMAP_H, (vh / FUTURE_MAP_HEIGHT) * MINIMAP_H),
    };
  }, [transform, MINIMAP_H]);

  const handleMinimapClick = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
    setFocusedIsland(null);
  }, []);

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

          {Array.from({ length: 9 }, (_, i) => {
            const x = (FUTURE_MAP_WIDTH / 8) * i;
            return <line key={`gv-${i}`} x1={x} y1={0} x2={x} y2={FUTURE_MAP_HEIGHT} stroke="hsl(var(--border))" strokeWidth={0.3} opacity={0.15} />;
          })}
          {Array.from({ length: 6 }, (_, i) => {
            const y = (FUTURE_MAP_HEIGHT / 5) * i;
            return <line key={`gh-${i}`} x1={0} y1={y} x2={FUTURE_MAP_WIDTH} y2={y} stroke="hsl(var(--border))" strokeWidth={0.3} opacity={0.15} />;
          })}

          {connections.map((conn, i) => {
            const from = nodePositions.get(conn.from);
            const to = nodePositions.get(conn.to);
            if (!from || !to) return null;
            return (
              <motion.path key={`c-${i}`} d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
                fill="none" stroke="hsl(var(--border))" strokeWidth={0.8} opacity={0.25}
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.2 }} />
            );
          })}

          {layout.map(island => (
            <FutureIsland key={island.category} island={island} skillLookup={skillLookup}
              level2SkillIds={level2SkillIds} skillGrowthMap={skillGrowthMap}
              isFocused={focusedIsland === island.category} highlightedSkillId={highlightedSkillId}
              onIslandClick={handleIslandClick} onSkillClick={handleSkillClick} />
          ))}
        </svg>

        {/* Minimap */}
        <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-border/50 bg-card/90 backdrop-blur-md shadow-lg overflow-hidden"
          style={{ width: MINIMAP_W, height: MINIMAP_H }}>
          <svg viewBox={`0 0 ${FUTURE_MAP_WIDTH} ${FUTURE_MAP_HEIGHT}`} className="w-full h-full cursor-pointer"
            preserveAspectRatio="xMidYMid meet" onClick={handleMinimapClick}>
            {layout.map(island => (
              <circle key={island.category} cx={island.cx} cy={island.cy} r={island.radius * 0.6}
                fill={ISLAND_COLORS[island.category] || "hsl(var(--primary))"} opacity={focusedIsland === island.category ? 0.9 : 0.4} />
            ))}
            <rect
              x={(viewportRect.x / MINIMAP_W) * FUTURE_MAP_WIDTH}
              y={(viewportRect.y / MINIMAP_H) * FUTURE_MAP_HEIGHT}
              width={(viewportRect.w / MINIMAP_W) * FUTURE_MAP_WIDTH}
              height={(viewportRect.h / MINIMAP_H) * FUTURE_MAP_HEIGHT}
              fill="none" stroke="hsl(var(--primary))" strokeWidth={8} opacity={0.8} rx={4} />
          </svg>
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
          <button onClick={() => setTransform(t => { const s = Math.min(3, t.scale * 1.25); const c = clampTransform(t.x, t.y, s); return { ...c, scale: s }; })}
            className="w-8 h-8 rounded-md bg-card/80 border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm font-bold backdrop-blur-md transition-colors active:scale-[0.95]">+</button>
          <button onClick={() => setTransform(t => { const s = Math.max(0.5, t.scale * 0.8); const c = clampTransform(t.x, t.y, s); return { ...c, scale: s }; })}
            className="w-8 h-8 rounded-md bg-card/80 border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm font-bold backdrop-blur-md transition-colors active:scale-[0.95]">−</button>
          <button onClick={() => { setTransform({ x: 0, y: 0, scale: 1 }); setFocusedIsland(null); }}
            className="w-8 h-8 rounded-md bg-card/80 border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-xs font-bold backdrop-blur-md transition-colors active:scale-[0.95]">⟲</button>
        </div>

      </div>

      {(() => {
        const sg = selectedSkill && skillGrowthMap?.get(selectedSkill.id);
        return (
          <SkillDetailDrawer
            skill={selectedSkill}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            level2Unlocked={selectedSkill ? (level2SkillIds?.has(selectedSkill.id) ?? false) : false}
            level1Xp={sg?.level1Xp ?? 0}
            level2Xp={sg?.level2Xp ?? 0}
            level1SimsCompleted={sg?.level1Sims ?? 0}
          />
        );
      })()}
    </TooltipProvider>
  );
}
