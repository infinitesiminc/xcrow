/**
 * GrowthRings — 3 tiny arc indicators showing Foundation / AI Mastery / Human Edge
 * progress for a skill tile.
 */

import { type GrowthDimensions } from "@/lib/skill-growth";

interface GrowthRingsProps {
  growth: GrowthDimensions;
  size?: number;
  className?: string;
}

export default function GrowthRings({ growth, size = 16, className = "" }: GrowthRingsProps) {
  const r = size / 2 - 1;
  const center = size / 2;
  const strokeWidth = 2;

  // 3 arcs: Foundation (bottom-left), AI (top), Human Edge (bottom-right)
  const arcAngles = [
    { start: 150, end: 270 }, // Foundation — left arc
    { start: 270, end: 390 }, // AI Mastery — top arc
    { start: 30, end: 150 },  // Human Edge — right arc
  ];

  const scores = [
    growth.foundation.tier === "widely_taught" ? 80 : growth.foundation.tier === "growing" ? 50 : 20,
    growth.aiMastery.score,
    growth.humanEdge.score,
  ];

  // Colors: foundation = muted, AI = primary, human = warm accent
  const colors = [
    "hsl(var(--muted-foreground))",
    "hsl(var(--primary))",
    "hsl(var(--spectrum-6, 45 93% 58%))",
  ];

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  return (
    <svg width={size} height={size} className={`shrink-0 ${className}`} viewBox={`0 0 ${size} ${size}`}>
      {arcAngles.map((arc, i) => {
        const isFilled = scores[i] >= 30;
        const startRad = toRad(arc.start);
        const endRad = toRad(arc.end);
        const x1 = center + r * Math.cos(startRad);
        const y1 = center + r * Math.sin(startRad);
        const x2 = center + r * Math.cos(endRad);
        const y2 = center + r * Math.sin(endRad);
        const largeArc = arc.end - arc.start > 180 ? 1 : 0;

        return (
          <path
            key={i}
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
            fill="none"
            stroke={isFilled ? colors[i] : "hsl(var(--muted-foreground) / 0.2)"}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={isFilled ? 1 : 0.4}
          />
        );
      })}
    </svg>
  );
}
