/**
 * FutureIsland — renders a single island region on the Future Territory Map.
 * Designed for full-screen readability with large nodes and visible labels.
 */

import { motion } from "framer-motion";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { type FutureSkill } from "@/hooks/use-future-skills";
import { type FutureIslandLayout } from "@/lib/future-territory-layout";

interface FutureIslandProps {
  island: FutureIslandLayout;
  skillLookup: Map<string, FutureSkill>;
}

export default function FutureIsland({ island, skillLookup }: FutureIslandProps) {
  const { cx, cy, radius, theme, nodes, category, skillCount } = island;
  const visibleCount = nodes.length;
  const hiddenCount = skillCount - visibleCount;

  return (
    <g>
      {/* Background territory fill */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={radius + 15}
        fill={`hsl(${theme.baseHue} 25% 10% / 0.5)`}
        stroke={`hsl(${theme.baseHue} 30% 25%)`}
        strokeWidth={1.5}
        strokeDasharray="6 4"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />

      {/* Island label — large and readable */}
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
        }}
      >
        {skillCount} skill{skillCount !== 1 ? "s" : ""}
      </text>

      {/* Skill nodes — large enough to read */}
      {nodes.map(node => {
        const skill = skillLookup.get(node.skillId);
        if (!skill) return null;

        const nodeRadius = 18;
        const intensity = Math.min(1, skill.demandCount / 15);

        return (
          <Tooltip key={node.skillId}>
            <TooltipTrigger asChild>
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                className="cursor-pointer"
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
                  strokeWidth={2}
                  className="hover:brightness-125 transition-all"
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

                {/* Name label — always visible */}
                <text
                  x={node.x}
                  y={node.y + nodeRadius + 12}
                  textAnchor="middle"
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    fill: `hsl(${theme.baseHue} 25% 65%)`,
                    fontFamily: "'Inter', system-ui, sans-serif",
                    pointerEvents: "none",
                  }}
                >
                  {skill.name.length > 18 ? skill.name.slice(0, 16) + "…" : skill.name}
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
          }}
        >
          +{hiddenCount} more in Skill Forge
        </text>
      )}
    </g>
  );
}
