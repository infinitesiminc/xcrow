/**
 * FutureIsland — renders a single island region on the Future Territory Map.
 * Supports click-to-zoom, hover-to-repel, diamond-shaped Level 2 nodes, and GrowthRings.
 */

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { type FutureSkill, type FutureSkillCategory } from "@/hooks/use-future-skills";
import { type FutureIslandLayout, type FutureNodePosition } from "@/lib/future-territory-layout";
import type { CanonicalSkillGrowth } from "@/pages/MapPage";

/* ─── Custom SVG icon per island category ─── */
function IslandIcon({ category, cx, cy, hue, isParchment }: {
  category: FutureSkillCategory; cx: number; cy: number; hue: number; isParchment: boolean;
}) {
  const fill = isParchment ? `hsl(${hue} 55% 35%)` : `hsl(${hue} 70% 65%)`;
  const glow = isParchment ? "none" : `drop-shadow(0 0 4px hsl(${hue} 80% 55% / 0.5))`;
  const s = 14; // half-size

  const icons: Record<FutureSkillCategory, JSX.Element> = {
    // Arcane Forge — anvil with spark
    Technical: (
      <g transform={`translate(${cx - s},${cy - s})`} style={{ filter: glow }}>
        <path d="M6 22 L10 12 L18 12 L22 22 Z" fill={fill} opacity={0.9} />
        <rect x={8} y={8} width={12} height={4} rx={1} fill={fill} />
        <path d="M14 4 L16 0 L18 6" stroke={fill} strokeWidth={1.5} fill="none" />
        <circle cx={17} cy={2} r={1.5} fill={fill} opacity={0.7} />
      </g>
    ),
    // Data Highlands — mountain with chart line
    Analytical: (
      <g transform={`translate(${cx - s},${cy - s})`} style={{ filter: glow }}>
        <path d="M2 24 L14 4 L20 14 L26 8 L26 24 Z" fill={fill} opacity={0.8} />
        <polyline points="4,20 10,14 16,18 22,10" stroke={fill} strokeWidth={1.5} fill="none" opacity={0.9} />
        <circle cx={22} cy={10} r={1.5} fill={fill} />
      </g>
    ),
    // Soul Springs — flame/heart hybrid
    "Human Edge": (
      <g transform={`translate(${cx - s},${cy - s})`} style={{ filter: glow }}>
        <path d="M14 4 Q8 10 8 16 Q8 22 14 26 Q20 22 20 16 Q20 10 14 4 Z" fill={fill} opacity={0.85} />
        <path d="M14 10 Q11 14 12 18 Q13 20 14 20 Q15 20 16 18 Q17 14 14 10 Z" fill={isParchment ? `hsl(${hue} 40% 50%)` : `hsl(${hue} 90% 80%)`} opacity={0.6} />
      </g>
    ),
    // Command Summit — crossed swords
    Strategic: (
      <g transform={`translate(${cx - s},${cy - s})`} style={{ filter: glow }}>
        <line x1={6} y1={22} x2={22} y2={4} stroke={fill} strokeWidth={2} strokeLinecap="round" />
        <line x1={22} y1={22} x2={6} y2={4} stroke={fill} strokeWidth={2} strokeLinecap="round" />
        <line x1={4} y1={6} x2={8} y2={2} stroke={fill} strokeWidth={1.5} strokeLinecap="round" />
        <line x1={20} y1={6} x2={24} y2={2} stroke={fill} strokeWidth={1.5} strokeLinecap="round" />
        <circle cx={14} cy={13} r={2.5} fill={fill} opacity={0.5} />
      </g>
    ),
    // Bridge Isles — speech/signal waves
    Communication: (
      <g transform={`translate(${cx - s},${cy - s})`} style={{ filter: glow }}>
        <path d="M4 24 L4 10 L20 10 L20 20 L10 20 L6 24 Z" fill={fill} opacity={0.8} />
        <line x1={8} y1={14} x2={16} y2={14} stroke={isParchment ? `hsl(${hue} 30% 60%)` : "hsl(0 0% 10%)"} strokeWidth={1.2} />
        <line x1={8} y1={17} x2={14} y2={17} stroke={isParchment ? `hsl(${hue} 30% 60%)` : "hsl(0 0% 10%)"} strokeWidth={1.2} />
        <path d="M22 8 Q26 12 22 16" stroke={fill} strokeWidth={1.2} fill="none" opacity={0.6} />
        <path d="M24 6 Q30 12 24 18" stroke={fill} strokeWidth={1} fill="none" opacity={0.4} />
      </g>
    ),
    // Prism Coast — palette/brush
    Creative: (
      <g transform={`translate(${cx - s},${cy - s})`} style={{ filter: glow }}>
        <ellipse cx={14} cy={16} rx={12} ry={8} fill={fill} opacity={0.8} />
        <circle cx={8} cy={14} r={2} fill={isParchment ? `hsl(${hue} 50% 50%)` : `hsl(${hue} 90% 80%)`} opacity={0.7} />
        <circle cx={14} cy={12} r={1.5} fill={isParchment ? `hsl(${hue + 40} 50% 50%)` : `hsl(${hue + 40} 80% 70%)`} opacity={0.7} />
        <circle cx={20} cy={14} r={1.8} fill={isParchment ? `hsl(${hue - 20} 50% 50%)` : `hsl(${hue - 20} 80% 70%)`} opacity={0.7} />
        <circle cx={18} cy={18} r={3} fill={isParchment ? `hsl(${hue} 20% 70%)` : "hsl(0 0% 12%)"} />
      </g>
    ),
    // Crown Heights — crown
    Leadership: (
      <g transform={`translate(${cx - s},${cy - s})`} style={{ filter: glow }}>
        <path d="M4 22 L4 12 L10 16 L14 6 L18 16 L24 12 L24 22 Z" fill={fill} opacity={0.9} />
        <rect x={4} y={22} width={20} height={3} rx={1} fill={fill} opacity={0.7} />
        <circle cx={14} cy={10} r={1.5} fill={isParchment ? `hsl(${hue} 60% 50%)` : `hsl(${hue} 90% 80%)`} opacity={0.8} />
      </g>
    ),
    // Sentinel Watch — shield with check
    "Ethics & Compliance": (
      <g transform={`translate(${cx - s},${cy - s})`} style={{ filter: glow }}>
        <path d="M14 2 L26 8 L24 18 Q20 26 14 28 Q8 26 4 18 L2 8 Z" fill={fill} opacity={0.85} />
        <polyline points="9,15 13,19 20,10" stroke={isParchment ? `hsl(${hue} 30% 60%)` : "hsl(0 0% 10%)"} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
  };

  return icons[category] || null;
}

function useIsParchment() {
  const [p, setP] = useState(() => document.documentElement.classList.contains("parchment"));
  useEffect(() => {
    const obs = new MutationObserver(() => setP(document.documentElement.classList.contains("parchment")));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return p;
}

interface FutureIslandProps {
  island: FutureIslandLayout;
  skillLookup: Map<string, FutureSkill>;
  level2SkillIds?: Set<string>;
  level2CompletedIds?: Set<string>;
  skillGrowthMap?: Map<string, CanonicalSkillGrowth>;
  isFocused?: boolean;
  highlightedSkillId?: string | null;
  onIslandClick?: (category: FutureSkillCategory, cx: number, cy: number) => void;
  onSkillClick?: (skill: FutureSkill) => void;
}

const REPEL_RADIUS = 70;
const REPEL_STRENGTH = 18;

function getDisplacedPosition(
  node: FutureNodePosition,
  hoveredNode: FutureNodePosition | null,
  isHovered: boolean
): { x: number; y: number } {
  if (!hoveredNode || isHovered) return { x: node.x, y: node.y };
  const dx = node.x - hoveredNode.x;
  const dy = node.y - hoveredNode.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > REPEL_RADIUS || dist < 1) return { x: node.x, y: node.y };
  const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_STRENGTH;
  const nx = dx / dist;
  const ny = dy / dist;
  return { x: node.x + nx * force, y: node.y + ny * force };
}

export default function FutureIsland({ island, skillLookup, level2SkillIds, level2CompletedIds, skillGrowthMap, isFocused, highlightedSkillId, onIslandClick, onSkillClick }: FutureIslandProps) {
  const { cx, cy, radius, theme, nodes, expandedNodes, category, skillCount } = island;
  const activeNodes = isFocused ? expandedNodes : nodes;
  const visibleCount = activeNodes.length;
  const hiddenCount = isFocused ? 0 : skillCount - visibleCount;

  const isParchment = useIsParchment();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const hoveredNode = useMemo(
    () => (hoveredId ? activeNodes.find((n) => n.skillId === hoveredId) ?? null : null),
    [hoveredId, activeNodes]
  );

  return (
    <g>
      {/* Clickable background territory */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={(isFocused ? 165 : radius) + 15}
        fill={isParchment
          ? `hsl(${theme.baseHue} 15% ${isFocused ? 82 : 78}% / ${isFocused ? 0.8 : 0.6})`
          : `hsl(${theme.baseHue} 25% ${isFocused ? 14 : 10}% / ${isFocused ? 0.7 : 0.5})`}
        stroke={isParchment
          ? `hsl(${theme.baseHue} ${isFocused ? 40 : 25}% ${isFocused ? 55 : 45}%)`
          : `hsl(${theme.baseHue} ${isFocused ? 50 : 30}% ${isFocused ? 40 : 25}%)`}
        strokeWidth={isFocused ? 2.5 : 1.5}
        strokeDasharray={isFocused ? "none" : "6 4"}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px`, cursor: "pointer" }}
        onClick={() => onIslandClick?.(category, cx, cy)}
      />

      {/* Island icon — custom SVG per category */}
      <IslandIcon category={category} cx={cx} cy={cy - radius - 12} hue={theme.baseHue} isParchment={isParchment} />

      {/* Island label */}
      <text
        x={cx}
        y={cy - radius + 2}
        textAnchor="middle"
        style={{
          fontSize: "18px",
          fontWeight: 800,
          fill: isParchment ? `hsl(${theme.baseHue} 55% 30%)` : `hsl(${theme.baseHue} 55% 65%)`,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontFamily: "'Cinzel', 'Space Grotesk', serif",
          cursor: "pointer",
          pointerEvents: "none",
        }}
      >
        {theme.terrain}
      </text>

      {/* Count badge */}
      <text
        x={cx}
        y={cy - radius + 18}
        textAnchor="middle"
        style={{
          fontSize: "11px",
          fontWeight: 600,
          fill: isParchment ? `hsl(${theme.baseHue} 30% 35%)` : `hsl(${theme.baseHue} 25% 50%)`,
          pointerEvents: "none",
        }}
      >
        {skillCount} skill{skillCount !== 1 ? "s" : ""}
      </text>

      {/* Skill nodes — render highlighted/hovered node last so it's on top */}
      {[...activeNodes].sort((a, b) => {
        if (a.skillId === highlightedSkillId) return 1;
        if (b.skillId === highlightedSkillId) return -1;
        if (a.skillId === hoveredId) return 1;
        if (b.skillId === hoveredId) return -1;
        return 0;
      }).map((node) => {
        const skill = skillLookup.get(node.skillId);
        if (!skill) return null;

        const isHovered = hoveredId === node.skillId;
        const isHighlighted = highlightedSkillId === node.skillId;
        const isDimmed = !!highlightedSkillId && !isHighlighted && !isHovered;
        const pos = getDisplacedPosition(node, hoveredNode, isHovered);
        const nodeRadius = isFocused && !isHovered && !isHighlighted ? 14 : 18;
        const intensity = Math.min(1, skill.demandCount / 15);
        const showLabel = !isFocused || isHovered || isHighlighted;
        const isBossCompleted = level2CompletedIds?.has(node.skillId) ?? false;

        return (
          <Tooltip key={node.skillId}>
            <TooltipTrigger asChild>
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: isHighlighted ? 1.15 : 1,
                  opacity: isDimmed ? 0.25 : 1,
                  x: pos.x - node.x,
                  y: pos.y - node.y,
                }}
                transition={{
                  scale: { duration: 0.4, delay: 0.1 },
                  opacity: { duration: 0.4, delay: 0.1 },
                  x: { type: "spring", stiffness: 300, damping: 25 },
                  y: { type: "spring", stiffness: 300, damping: 25 },
                }}
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                className="cursor-pointer"
                onPointerEnter={() => setHoveredId(node.skillId)}
                onPointerLeave={() => setHoveredId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSkillClick?.(skill);
                }}
              >
                {/* Spotlight for highlighted skill */}
                {isHighlighted && (
                  <>
                    <motion.circle
                      cx={node.x}
                      cy={node.y}
                      r={nodeRadius + 14}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      opacity={0.8}
                      animate={{ r: [nodeRadius + 12, nodeRadius + 18, nodeRadius + 12], opacity: [0.8, 0.4, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      filter="url(#future-glow)"
                    />
                    <motion.circle
                      cx={node.x}
                      cy={node.y}
                      r={nodeRadius + 8}
                      fill="hsl(var(--primary) / 0.08)"
                      stroke="hsl(var(--primary))"
                      strokeWidth={1.5}
                      opacity={0.6}
                    />
                  </>
                )}

                {isBossCompleted ? (
                  <>
                    {/* Boss Conquered: Evolved gold circle with crown */}
                    <motion.circle
                      cx={node.x}
                      cy={node.y}
                      r={nodeRadius + 6}
                      fill="none"
                      stroke="hsl(45 93% 58% / 0.5)"
                      strokeWidth={2}
                      filter="url(#future-glow)"
                      animate={{ r: [nodeRadius + 5, nodeRadius + 8, nodeRadius + 5], opacity: [0.5, 0.3, 0.5] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={nodeRadius}
                      fill={isParchment
                        ? `hsl(45 35% 78%)`
                        : `hsl(45 40% 18%)`}
                      stroke="hsl(45 70% 55%)"
                      strokeWidth={isHovered ? 3.5 : 2.5}
                      className="transition-all"
                    />
                  </>
                ) : (
                  <>
                    {/* Level 1: Glow ring for high-demand */}
                    {skill.demandCount >= 8 && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={nodeRadius + 5}
                        fill="none"
                        stroke={`hsl(${theme.baseHue} 60% 55%)`}
                        strokeWidth={1.5}
                        opacity={0.5}
                        filter="url(#future-glow)"
                      />
                    )}
                    {/* Level 1: Circle body */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={nodeRadius}
                      fill={isParchment
                        ? `hsl(${theme.baseHue} ${25 + intensity * 15}% ${72 + intensity * 8}%)`
                        : `hsl(${theme.baseHue} ${35 + intensity * 25}% ${18 + intensity * 12}%)`}
                      stroke={isParchment
                        ? `hsl(${theme.baseHue} 40% ${40 + intensity * 15}%)`
                        : `hsl(${theme.baseHue} 50% ${40 + intensity * 20}%)`}
                      strokeWidth={isHovered ? 3 : 2}
                      className="transition-all"
                    />
                  </>
                )}
                {/* Emoji — crown for conquered, sword for boss, normal otherwise */}
                <text
                  x={node.x}
                  y={node.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ fontSize: isBossCompleted ? "16px" : "14px", pointerEvents: "none" }}
                >
                  {isBossCompleted ? "👑" : (skill.iconEmoji || "")}
                </text>

                {/* Growth Rings — 3 arcs around the node */}
                {(() => {
                  const sg = skillGrowthMap?.get(node.skillId);
                  if (!sg || (sg.level1Xp === 0 && sg.level2Xp === 0)) return null;
                  const g = sg.growth;
                  const ringR = nodeRadius + 4;
                  const ringStroke = 2.5;
                  const foundScore = g.foundation.tier === "widely_taught" ? 80 : g.foundation.tier === "growing" ? 50 : 20;
                  const arcs = [
                    { start: 150, end: 270, score: foundScore, color: "hsl(var(--muted-foreground))" },
                    { start: 270, end: 390, score: g.aiMastery.score, color: "hsl(var(--primary))" },
                    { start: 30, end: 150, score: g.humanEdge.score, color: "hsl(45 93% 58%)" },
                  ];
                  const toRad = (d: number) => (d * Math.PI) / 180;
                  return arcs.map((arc, ai) => {
                    const filled = arc.score >= 30;
                    const x1 = node.x + ringR * Math.cos(toRad(arc.start));
                    const y1 = node.y + ringR * Math.sin(toRad(arc.start));
                    const x2 = node.x + ringR * Math.cos(toRad(arc.end));
                    const y2 = node.y + ringR * Math.sin(toRad(arc.end));
                    const large = arc.end - arc.start > 180 ? 1 : 0;
                    return (
                      <path
                        key={`gr-${ai}`}
                        d={`M ${x1} ${y1} A ${ringR} ${ringR} 0 ${large} 1 ${x2} ${y2}`}
                        fill="none"
                        stroke={filled ? arc.color : "hsl(var(--muted-foreground) / 0.15)"}
                        strokeWidth={ringStroke}
                        strokeLinecap="round"
                        opacity={filled ? 0.9 : 0.3}
                        style={{ pointerEvents: "none" }}
                      />
                    );
                  });
                })()}


                {/* Name label */}
                {showLabel && (
                  <text
                    x={node.x}
                    y={node.y + nodeRadius + 12}
                    textAnchor="middle"
                    style={{
                      fontSize: (isHovered || isHighlighted) ? "11px" : "10px",
                      fontWeight: (isHovered || isHighlighted) ? 700 : 600,
                      fill: isParchment
                        ? (isBossCompleted
                          ? `hsl(45 ${isHovered ? 60 : 50}% ${isHovered ? 25 : 30}%)`
                          : isHovered
                            ? `hsl(${theme.baseHue} 50% 25%)`
                            : `hsl(${theme.baseHue} 35% 35%)`)
                        : (isBossCompleted
                          ? `hsl(45 ${isHovered ? 60 : 40}% ${isHovered ? 80 : 65}%)`
                          : isHovered
                            ? `hsl(${theme.baseHue} 40% 85%)`
                            : `hsl(${theme.baseHue} 25% 65%)`),
                      fontFamily: "'Inter', system-ui, sans-serif",
                      pointerEvents: "none",
                      transition: "fill 0.2s, font-size 0.2s",
                    }}
                  >
                    {isHovered || isHighlighted
                      ? skill.name
                      : skill.name.length > 28
                        ? skill.name.slice(0, 26) + "…"
                        : skill.name}
                  </text>
                )}
              </motion.g>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px]">
              <p className="font-semibold text-xs">
                {isBossCompleted && <span className="text-amber-400 mr-1">👑</span>}
                {skill.name}
              </p>
              {skill.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{skill.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>📈 {skill.demandCount} demand</span>
                <span>💼 {skill.jobCount} roles</span>
                {isBossCompleted && <span className="text-amber-400">👑 Conquered</span>}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}

      {/* "More" indicator */}
      {hiddenCount > 0 && (
        <text
          x={cx}
          y={cy + radius + 14}
          textAnchor="middle"
          style={{
            fontSize: "10px",
            fill: isParchment ? `hsl(${theme.baseHue} 30% 35%)` : `hsl(${theme.baseHue} 25% 45%)`,
            fontStyle: "italic",
            pointerEvents: "none",
          }}
        >
          +{hiddenCount} more in Skill Forge
        </text>
      )}
    </g>
  );
}