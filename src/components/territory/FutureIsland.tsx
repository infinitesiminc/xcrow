/**
 * FutureIsland — renders a single island region on the Future Territory Map.
 * Extracted from FutureTerritoryMap for clarity.
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
      {/* Background glow — proportional to island size */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={radius + 20}
        fill={`hsl(${theme.baseHue} 30% 12% / 0.35)`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      <circle cx={cx} cy={cy} r={radius + 20} fill="url(#future-island-glow)" />

      {/* Island label */}
      <text
        x={cx}
        y={cy - radius - 8}
        textAnchor="middle"
        style={{
          fontSize: "11px",
          fontWeight: 700,
          fill: `hsl(${theme.baseHue} 50% 60%)`,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {theme.emoji} {theme.terrain}
      </text>
      {/* Count badge */}
      <text
        x={cx}
        y={cy - radius + 5}
        textAnchor="middle"
        style={{
          fontSize: "9px",
          fontWeight: 600,
          fill: `hsl(${theme.baseHue} 30% 50%)`,
        }}
      >
        {skillCount} skill{skillCount !== 1 ? "s" : ""}
      </text>

      {/* Skill nodes */}
      {nodes.map(node => {
        const skill = skillLookup.get(node.skillId);
        if (!skill) return null;

        const r = skill.demandCount >= 10 ? 13 : skill.demandCount >= 5 ? 10 : 7;
        const intensity = Math.min(1, skill.demandCount / 15);

        return (
          <Tooltip key={node.skillId}>
            <TooltipTrigger asChild>
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              >
                {/* Glow ring for high-demand */}
                {skill.demandCount >= 8 && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r + 4}
                    fill="none"
                    stroke={`hsl(${theme.baseHue} 60% 55%)`}
                    strokeWidth={1}
                    opacity={0.4}
                    filter="url(#future-glow)"
                  />
                )}
                {/* Main circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  fill={`hsl(${theme.baseHue} ${40 + intensity * 20}% ${25 + intensity * 15}%)`}
                  stroke={`hsl(${theme.baseHue} 50% ${45 + intensity * 15}%)`}
                  strokeWidth={1.5}
                  className="cursor-pointer hover:brightness-125 transition-all"
                />
                {/* Emoji */}
                {skill.iconEmoji && (
                  <text
                    x={node.x}
                    y={node.y + 1}
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{ fontSize: `${r * 0.85}px` }}
                  >
                    {skill.iconEmoji}
                  </text>
                )}
                {/* Name label — only for larger nodes */}
                {r >= 10 && (
                  <text
                    x={node.x}
                    y={node.y + r + 9}
                    textAnchor="middle"
                    style={{
                      fontSize: "7px",
                      fontWeight: 600,
                      fill: `hsl(${theme.baseHue} 30% 65%)`,
                    }}
                  >
                    {skill.name.length > 16 ? skill.name.slice(0, 14) + "…" : skill.name}
                  </text>
                )}
              </motion.g>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px]">
              <p className="font-semibold text-xs">{skill.name}</p>
              {skill.description && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{skill.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                <span>📈 {skill.demandCount} demand</span>
                <span>💼 {skill.jobCount} roles</span>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}

      {/* "More" indicator for overflow */}
      {hiddenCount > 0 && (
        <text
          x={cx}
          y={cy + radius + 16}
          textAnchor="middle"
          style={{
            fontSize: "8px",
            fill: `hsl(${theme.baseHue} 30% 50%)`,
            fontStyle: "italic",
          }}
        >
          +{hiddenCount} more in table view
        </text>
      )}
    </g>
  );
}
