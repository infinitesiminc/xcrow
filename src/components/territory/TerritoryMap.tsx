/**
 * TerritoryMap — RPG-style SVG skill map with island regions,
 * connecting paths, fog-of-war, and a Crow avatar.
 * Now supports dynamic skills from DB with rarity glow effects.
 */

import { useMemo, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  SKILL_TAXONOMY,
  type SkillCategory,
  type SkillXP,
  type TaxonomySkill,
} from "@/lib/skill-map";
import { calculateGrowth } from "@/lib/skill-growth";
import {
  buildMapLayout,
  buildConnections,
  MAP_WIDTH,
  MAP_HEIGHT,
  type IslandLayout,
  type PathConnection,
} from "@/lib/territory-layout";
import SkillNode from "./SkillNode";

type TileState = "claimed" | "frontier" | "undiscovered" | "contested" | "demo-lit" | "demo-dim";

export interface SkillRarityInfo {
  id: string;
  rarity: string;
  dropExpiresAt: string | null;
  iconEmoji: string | null;
  description: string | null;
}

interface TerritoryMapProps {
  skills?: SkillXP[];
  targetSkillIds?: Set<string>;
  demoMode?: boolean;
  highlightedSkillIds?: Set<string>;
  onTileClick?: (skillId: string, skillName: string) => void;
  taxonomy?: TaxonomySkill[];
  rarityMap?: Map<string, SkillRarityInfo>;
}

export default function TerritoryMap({
  skills,
  targetSkillIds,
  demoMode = false,
  highlightedSkillIds,
  onTileClick,
  taxonomy,
  rarityMap,
}: TerritoryMapProps) {
  const source = taxonomy || SKILL_TAXONOMY;
  const layout = useMemo(() => buildMapLayout(source), [source]);
  const connections = useMemo(() => buildConnections(layout, source), [layout, source]);

  // Pan & zoom state
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(t => ({
      ...t,
      scale: Math.max(0.5, Math.min(2.5, t.scale * delta)),
    }));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
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

  // Build skill state map
  const skillStates = useMemo(() => {
    const states = new Map<string, { state: TileState; xp: number; level?: string; growth: ReturnType<typeof calculateGrowth> }>();
    const skillMap = new Map(skills?.map(s => [s.id, s]));
    const claimedIds = new Set(skills?.filter(s => s.xp > 0).map(s => s.id) || []);

    for (const skill of SKILL_TAXONOMY) {
      const sx = skillMap.get(skill.id);

      let state: TileState;
      if (demoMode) {
        state = highlightedSkillIds?.has(skill.id) ? "demo-lit" : "demo-dim";
      } else {
        const hasClaimed = claimedIds.has(skill.id);
        const isTarget = targetSkillIds?.has(skill.id) ?? false;

        if (hasClaimed) state = "claimed";
        else if (isTarget) state = "contested";
        else {
          const hasClaimedInCat = skills?.some(s => s.category === skill.category && s.xp > 0);
          state = hasClaimedInCat || !targetSkillIds?.size ? "frontier" : "undiscovered";
        }
      }

      states.set(skill.id, {
        state,
        xp: sx?.xp ?? 0,
        level: sx?.level,
        growth: calculateGrowth(skill.aiExposure, sx?.xp ?? 0, sx ? {
          avgToolAwareness: sx.avgToolAwareness,
          avgAdaptiveThinking: sx.avgAdaptiveThinking,
          avgHumanValueAdd: sx.avgHumanValueAdd,
          avgDomainJudgment: sx.avgDomainJudgment,
        } : undefined),
      });
    }

    return states;
  }, [skills, targetSkillIds, demoMode, highlightedSkillIds]);

  // Build node position lookup
  const nodePositions = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const island of layout) {
      for (const node of island.nodes) {
        m.set(node.skillId, { x: node.x, y: node.y });
      }
    }
    return m;
  }, [layout]);

  const litCount = Array.from(skillStates.values()).filter(
    s => s.state === "claimed" || s.state === "demo-lit"
  ).length;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Skill Territory
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {litCount}/{SKILL_TAXONOMY.length} discovered
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
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            className="w-full h-full"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: "center center",
            }}
          >
            {/* Defs — fog filter, glows */}
            <defs>
              <filter id="fog-blur">
                <feGaussianBlur stdDeviation="8" />
              </filter>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="island-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="white" stopOpacity="0.06" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Connections / Paths */}
            {connections.map((conn, i) => {
              const from = nodePositions.get(conn.from);
              const to = nodePositions.get(conn.to);
              if (!from || !to) return null;

              const fromState = skillStates.get(conn.from)?.state;
              const toState = skillStates.get(conn.to)?.state;
              const bothLit =
                (fromState === "claimed" || fromState === "demo-lit") &&
                (toState === "claimed" || toState === "demo-lit");
              const anyLit =
                fromState === "claimed" || fromState === "demo-lit" ||
                toState === "claimed" || toState === "demo-lit";

              // Curved path for cross-island
              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2 - (conn.crossIsland ? 30 : 0);

              return (
                <motion.path
                  key={`path-${i}`}
                  d={conn.crossIsland
                    ? `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`
                    : `M ${from.x} ${from.y} L ${to.x} ${to.y}`
                  }
                  fill="none"
                  stroke={bothLit ? "hsl(var(--primary))" : anyLit ? "hsl(var(--muted-foreground))" : "hsl(var(--border))"}
                  strokeWidth={bothLit ? 1.5 : 1}
                  strokeDasharray={conn.crossIsland ? "6 4" : undefined}
                  opacity={bothLit ? 0.7 : anyLit ? 0.3 : 0.15}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                />
              );
            })}

            {/* Island regions */}
            {layout.map(island => (
              <g key={island.category}>
                {/* Island background glow */}
                <motion.circle
                  cx={island.cx}
                  cy={island.cy}
                  r={95}
                  fill={`hsl(${island.theme.baseHue} 30% 12% / 0.4)`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: `${island.cx}px ${island.cy}px` }}
                />
                <circle
                  cx={island.cx}
                  cy={island.cy}
                  r={95}
                  fill="url(#island-glow)"
                />

                {/* Island label */}
                <text
                  x={island.cx}
                  y={island.cy - 82}
                  textAnchor="middle"
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    fill: `hsl(${island.theme.baseHue} 50% 60%)`,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {island.theme.emoji} {island.theme.terrain}
                </text>

                {/* Skill nodes */}
                {island.nodes.map(node => {
                  const skill = SKILL_TAXONOMY.find(s => s.id === node.skillId)!;
                  const data = skillStates.get(node.skillId)!;

                  return (
                    <SkillNode
                      key={node.skillId}
                      x={node.x}
                      y={node.y}
                      name={skill.name}
                      skillId={node.skillId}
                      state={data.state}
                      growth={data.growth}
                      xp={data.xp}
                      level={data.level}
                      humanEdge={skill.humanEdge}
                      baseHue={island.theme.baseHue}
                      onClick={() => onTileClick?.(node.skillId, skill.name)}
                    />
                  );
                })}
              </g>
            ))}
          </svg>

          {/* Zoom controls */}
          <div className="absolute bottom-3 right-3 flex flex-col gap-1">
            <button
              onClick={() => setTransform(t => ({ ...t, scale: Math.min(2.5, t.scale * 1.2) }))}
              className="w-7 h-7 rounded-md bg-card/80 border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm font-bold backdrop-blur-sm transition-colors active:scale-[0.95]"
            >
              +
            </button>
            <button
              onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.5, t.scale * 0.8) }))}
              className="w-7 h-7 rounded-md bg-card/80 border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm font-bold backdrop-blur-sm transition-colors active:scale-[0.95]"
            >
              −
            </button>
            <button
              onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
              className="w-7 h-7 rounded-md bg-card/80 border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-[9px] font-bold backdrop-blur-sm transition-colors active:scale-[0.95]"
            >
              ⟲
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 border-t border-border/30 shrink-0">
          {[
            { label: "Claimed", cls: "bg-primary" },
            { label: "Frontier", cls: "border border-muted-foreground/40 border-dashed" },
            { label: "In Demand", cls: "bg-warning" },
            { label: "Fog of War", cls: "bg-muted-foreground/20" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${l.cls}`} />
              <span className="text-[9px] text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
