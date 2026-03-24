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

/* ─── RPG emblem icon per island — unified badge style with unique inner symbol ─── */
function IslandIcon({ category, cx, cy, hue, isParchment }: {
  category: FutureSkillCategory; cx: number; cy: number; hue: number; isParchment: boolean;
}) {
  const stroke = isParchment ? `hsl(${hue} 50% 35%)` : `hsl(${hue} 70% 65%)`;
  const fill = isParchment ? `hsl(${hue} 30% 25% / 0.4)` : `hsl(${hue} 40% 15% / 0.6)`;
  const accent = isParchment ? `hsl(${hue} 60% 45%)` : `hsl(${hue} 80% 70%)`;
  const glow = isParchment ? "none" : `drop-shadow(0 0 6px hsl(${hue} 80% 55% / 0.5))`;
  const r = 18; // badge radius

  // Shared hexagonal badge frame
  const hex = `M${cx} ${cy - r} L${cx + r * 0.866} ${cy - r * 0.5} L${cx + r * 0.866} ${cy + r * 0.5} L${cx} ${cy + r} L${cx - r * 0.866} ${cy + r * 0.5} L${cx - r * 0.866} ${cy - r * 0.5} Z`;

  // Each category has a unique inner symbol drawn relative to cx, cy
  const innerSymbols: Record<FutureSkillCategory, JSX.Element> = {
    // Arcane Forge — gear/cog
    Technical: (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="none" stroke={accent} strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={2.5} fill={accent} opacity={0.6} />
        {[0, 60, 120, 180, 240, 300].map(a => {
          const rad = (a * Math.PI) / 180;
          return <line key={a} x1={cx + Math.cos(rad) * 5} y1={cy + Math.sin(rad) * 5} x2={cx + Math.cos(rad) * 9} y2={cy + Math.sin(rad) * 9} stroke={accent} strokeWidth={2} strokeLinecap="round" />;
        })}
      </g>
    ),
    // Data Highlands — crystal/gem
    Analytical: (
      <g>
        <path d={`M${cx} ${cy - 10} L${cx + 7} ${cy - 2} L${cx + 4} ${cy + 9} L${cx - 4} ${cy + 9} L${cx - 7} ${cy - 2} Z`} fill="none" stroke={accent} strokeWidth={1.5} strokeLinejoin="round" />
        <line x1={cx - 7} y1={cy - 2} x2={cx + 7} y2={cy - 2} stroke={accent} strokeWidth={1} opacity={0.6} />
        <line x1={cx} y1={cy - 10} x2={cx - 2} y2={cy + 9} stroke={accent} strokeWidth={0.8} opacity={0.4} />
        <line x1={cx} y1={cy - 10} x2={cx + 2} y2={cy + 9} stroke={accent} strokeWidth={0.8} opacity={0.4} />
      </g>
    ),
    // Soul Springs — eye of providence
    "Human Edge": (
      <g>
        <path d={`M${cx - 10} ${cy} Q${cx} ${cy - 9} ${cx + 10} ${cy} Q${cx} ${cy + 9} ${cx - 10} ${cy}`} fill="none" stroke={accent} strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={3.5} fill="none" stroke={accent} strokeWidth={1.2} />
        <circle cx={cx} cy={cy} r={1.5} fill={accent} opacity={0.7} />
      </g>
    ),
    // Command Summit — compass rose
    Strategic: (
      <g>
        <path d={`M${cx} ${cy - 10} L${cx + 3} ${cy} L${cx} ${cy + 10} L${cx - 3} ${cy} Z`} fill={accent} opacity={0.3} stroke={accent} strokeWidth={1} />
        <path d={`M${cx - 10} ${cy} L${cx} ${cy + 3} L${cx + 10} ${cy} L${cx} ${cy - 3} Z`} fill={accent} opacity={0.3} stroke={accent} strokeWidth={1} />
        <circle cx={cx} cy={cy} r={2} fill={accent} opacity={0.6} />
      </g>
    ),
    // Bridge Isles — horn/trumpet
    Communication: (
      <g>
        <path d={`M${cx - 8} ${cy - 2} L${cx + 4} ${cy - 8} L${cx + 4} ${cy + 8} L${cx - 8} ${cy + 2} Z`} fill="none" stroke={accent} strokeWidth={1.5} strokeLinejoin="round" />
        <line x1={cx + 4} y1={cy} x2={cx + 10} y2={cy} stroke={accent} strokeWidth={1.5} strokeLinecap="round" />
        <line x1={cx + 5} y1={cy - 4} x2={cx + 9} y2={cy - 6} stroke={accent} strokeWidth={1} strokeLinecap="round" opacity={0.6} />
        <line x1={cx + 5} y1={cy + 4} x2={cx + 9} y2={cy + 6} stroke={accent} strokeWidth={1} strokeLinecap="round" opacity={0.6} />
      </g>
    ),
    // Prism Coast — wand with star
    Creative: (
      <g>
        <line x1={cx - 6} y1={cy + 9} x2={cx + 4} y2={cy - 5} stroke={accent} strokeWidth={1.8} strokeLinecap="round" />
        <path d={`M${cx + 5} ${cy - 9} L${cx + 6.5} ${cy - 5.5} L${cx + 10} ${cy - 6} L${cx + 7.5} ${cy - 3} L${cx + 9} ${cy} L${cx + 5} ${cy - 2} L${cx + 1} ${cy} L${cx + 2.5} ${cy - 3} L${cx} ${cy - 6} L${cx + 3.5} ${cy - 5.5} Z`} fill={accent} opacity={0.7} />
      </g>
    ),
    // Crown Heights — crown
    Leadership: (
      <g>
        <path d={`M${cx - 9} ${cy + 5} L${cx - 9} ${cy - 3} L${cx - 4} ${cy + 1} L${cx} ${cy - 8} L${cx + 4} ${cy + 1} L${cx + 9} ${cy - 3} L${cx + 9} ${cy + 5} Z`} fill={accent} opacity={0.3} stroke={accent} strokeWidth={1.5} strokeLinejoin="round" />
        <rect x={cx - 9} y={cy + 5} width={18} height={3} rx={1} fill={accent} opacity={0.5} />
      </g>
    ),
    // Sentinel Watch — shield
    "Ethics & Compliance": (
      <g>
        <path d={`M${cx} ${cy - 10} L${cx + 9} ${cy - 5} L${cx + 7} ${cy + 4} Q${cx + 3} ${cy + 10} ${cx} ${cy + 11} Q${cx - 3} ${cy + 10} ${cx - 7} ${cy + 4} L${cx - 9} ${cy - 5} Z`} fill={accent} opacity={0.2} stroke={accent} strokeWidth={1.5} />
        <line x1={cx} y1={cy - 4} x2={cx} y2={cy + 5} stroke={accent} strokeWidth={1.5} strokeLinecap="round" />
        <line x1={cx - 4} y1={cy + 1} x2={cx + 4} y2={cy + 1} stroke={accent} strokeWidth={1.5} strokeLinecap="round" />
      </g>
    ),
  };

  return (
    <g style={{ filter: glow }} pointerEvents="none">
      {/* Hex badge frame */}
      <path d={hex} fill={fill} stroke={stroke} strokeWidth={1.2} />
      {/* Inner ring */}
      <circle cx={cx} cy={cy} r={r * 0.7} fill="none" stroke={stroke} strokeWidth={0.5} opacity={0.3} />
      {/* Category symbol */}
      {innerSymbols[category]}
    </g>
  );
}
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