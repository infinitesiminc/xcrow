/**
 * FutureIsland — renders a single island region on the Future Territory Map.
 * Supports click-to-zoom and hover-to-repel neighbor interactions.
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { type FutureSkill, type FutureSkillCategory } from "@/hooks/use-future-skills";
import { type FutureIslandLayout, type FutureNodePosition } from "@/lib/future-territory-layout";

interface FutureIslandProps {
  island: FutureIslandLayout;
  skillLookup: Map<string, FutureSkill>;
  isFocused?: boolean;
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

export default function FutureIsland({ island, skillLookup, isFocused, onIslandClick, onSkillClick }: FutureIslandProps) {
  const { cx, cy, radius, theme, nodes, expandedNodes, category, skillCount } = island;
  const activeNodes = isFocused ? expandedNodes : nodes;
  const visibleCount = activeNodes.length;
  const hiddenCount = isFocused ? 0 : skillCount - visibleCount;

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
        r={(isFocused ? Math.max(220, skillCount * 7) + 20 : radius) + 15}
        fill={`hsl(${theme.baseHue} 25% ${isFocused ? 14 : 10}% / ${isFocused ? 0.7 : 0.5})`}
        stroke={`hsl(${theme.baseHue} ${isFocused ? 50 : 30}% ${isFocused ? 40 : 25}%)`}
        strokeWidth={isFocused ? 2.5 : 1.5}
        strokeDasharray={isFocused ? "none" : "6 4"}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px`, cursor: "pointer" }}
        onClick={() => onIslandClick?.(category, cx, cy)}
      />

      {/* Island label */}
      <text
        x={cx}
        y={cy - radius - 6}
        textAnchor="middle"
        style={{
          fontSize: "14px",
          fontWeight: 800,
          fill: `hsl(${theme.baseHue} 55% 65%)`,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          cursor: "pointer",
          pointerEvents: "none",
        }}
      >
        {theme.emoji} {theme.terrain}
      </text>

      {/* Count badge */}
      <text
        x={cx}
        y={cy - radius + 10}
        textAnchor="middle"
        style={{
          fontSize: "11px",
          fontWeight: 600,
          fill: `hsl(${theme.baseHue} 25% 50%)`,
          pointerEvents: "none",
        }}
      >
        {skillCount} skill{skillCount !== 1 ? "s" : ""}
      </text>

      {/* Skill nodes */}
      {activeNodes.map((node) => {
        const skill = skillLookup.get(node.skillId);
        if (!skill) return null;

        const isHovered = hoveredId === node.skillId;
        const pos = getDisplacedPosition(node, hoveredNode, isHovered);
        const nodeRadius = isFocused && !isHovered ? 14 : 18;
        const intensity = Math.min(1, skill.demandCount / 15);
        const showLabel = !isFocused || isHovered;

        return (
          <Tooltip key={node.skillId}>
            <TooltipTrigger asChild>
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
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
                {/* Glow ring for high-demand */}
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

                {/* Main circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeRadius}
                  fill={`hsl(${theme.baseHue} ${35 + intensity * 25}% ${18 + intensity * 12}%)`}
                  stroke={`hsl(${theme.baseHue} 50% ${40 + intensity * 20}%)`}
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all"
                />

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

                {/* Name label */}
                <text
                  x={node.x}
                  y={node.y + nodeRadius + 12}
                  textAnchor="middle"
                  style={{
                    fontSize: isHovered ? "11px" : "10px",
                    fontWeight: isHovered ? 700 : 600,
                    fill: isHovered
                      ? `hsl(${theme.baseHue} 40% 85%)`
                      : `hsl(${theme.baseHue} 25% 65%)`,
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
              </motion.g>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px]">
              <p className="font-semibold text-xs">{skill.name}</p>
              {skill.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{skill.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>📈 {skill.demandCount} demand</span>
                <span>💼 {skill.jobCount} roles</span>
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
            fill: `hsl(${theme.baseHue} 25% 45%)`,
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
