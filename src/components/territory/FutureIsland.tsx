/**
 * FutureIsland — renders a single island region on the Future Territory Map.
 * Supports click-to-zoom, hover-to-repel, and diamond-shaped Level 2 nodes.
 */

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { type FutureSkill, type FutureSkillCategory } from "@/hooks/use-future-skills";
import { type FutureIslandLayout, type FutureNodePosition } from "@/lib/future-territory-layout";

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

export default function FutureIsland({ island, skillLookup, level2SkillIds, isFocused, highlightedSkillId, onIslandClick, onSkillClick }: FutureIslandProps) {
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

      {/* Island icon */}
      <text
        x={cx}
        y={cy - radius - 18}
        textAnchor="middle"
        style={{ fontSize: "28px", pointerEvents: "none" }}
      >
        {theme.emoji}
      </text>

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
        y={cy - radius + 10}
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
        const isLevel2 = level2SkillIds?.has(node.skillId) ?? false;
        const diamondSide = nodeRadius * 1.35;

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

                {isLevel2 ? (
                  <>
                    {/* Level 2: Gold diamond glow */}
                    <rect
                      x={node.x - diamondSide / 2 - 3}
                      y={node.y - diamondSide / 2 - 3}
                      width={diamondSide + 6}
                      height={diamondSide + 6}
                      rx={3}
                      fill="none"
                      stroke="hsl(45 93% 58% / 0.4)"
                      strokeWidth={2}
                      transform={`rotate(45 ${node.x} ${node.y})`}
                      filter="url(#future-glow)"
                    />
                    {/* Level 2: Diamond body */}
                    <rect
                      x={node.x - diamondSide / 2}
                      y={node.y - diamondSide / 2}
                      width={diamondSide}
                      height={diamondSide}
                      rx={2}
                      fill={isParchment
                        ? `hsl(45 ${20 + intensity * 15}% ${75 + intensity * 8}%)`
                        : `hsl(45 ${30 + intensity * 20}% ${16 + intensity * 8}%)`}
                      stroke={isParchment
                        ? `hsl(45 55% ${40 + intensity * 10}%)`
                        : `hsl(45 55% ${45 + intensity * 15}%)`}
                      strokeWidth={isHovered ? 3 : 2}
                      transform={`rotate(45 ${node.x} ${node.y})`}
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

                {/* Emoji */}
                {skill.iconEmoji && (
                  <text
                    x={node.x}
                    y={node.y + 1}
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{ fontSize: "14px", pointerEvents: "none" }}
                  >
                    {skill.iconEmoji}
                  </text>
                )}

                {/* Level 2 tiny badge */}
                {isLevel2 && (
                  <g>
                    <rect
                      x={node.x + nodeRadius * 0.4}
                      y={node.y - nodeRadius - 6}
                      width={16}
                      height={10}
                      rx={3}
                      fill="hsl(45 80% 50%)"
                    />
                    <text
                      x={node.x + nodeRadius * 0.4 + 8}
                      y={node.y - nodeRadius - 1}
                      textAnchor="middle"
                      style={{ fontSize: "6px", fontWeight: 800, fill: "hsl(45 20% 10%)", pointerEvents: "none" }}
                    >
                      L2
                    </text>
                  </g>
                )}

                {/* Name label */}
                {showLabel && (
                  <text
                    x={node.x}
                    y={node.y + nodeRadius + 12}
                    textAnchor="middle"
                    style={{
                      fontSize: isHovered ? "11px" : "10px",
                      fontWeight: isHovered ? 700 : 600,
                      fill: isParchment
                        ? (isLevel2
                          ? `hsl(45 ${isHovered ? 60 : 50}% ${isHovered ? 25 : 30}%)`
                          : isHovered
                            ? `hsl(${theme.baseHue} 50% 25%)`
                            : `hsl(${theme.baseHue} 35% 35%)`)
                        : (isLevel2
                          ? `hsl(45 ${isHovered ? 60 : 40}% ${isHovered ? 80 : 65}%)`
                          : isHovered
                            ? `hsl(${theme.baseHue} 40% 85%)`
                            : `hsl(${theme.baseHue} 25% 65%)`),
                      fontFamily: "'Inter', system-ui, sans-serif",
                      pointerEvents: "none",
                      transition: "fill 0.2s, font-size 0.2s",
                    }}
                  >
                    {isHovered
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
                {isLevel2 && <span className="text-amber-400 mr-1">◆</span>}
                {skill.name}
              </p>
              {skill.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{skill.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>📈 {skill.demandCount} demand</span>
                <span>💼 {skill.jobCount} roles</span>
                {isLevel2 && <span className="text-amber-400">◆ Level 2</span>}
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