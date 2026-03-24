/**
 * TerritoryEmblem — Reusable hex-badge SVG emblem for each skill territory.
 * Extracted from FutureIsland.tsx for use across marketing pages and UI.
 */
import type { FutureSkillCategory } from "@/hooks/use-future-skills";

interface Props {
  category: FutureSkillCategory;
  size?: number;
  className?: string;
}

export default function TerritoryEmblem({ category, size = 44, className }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.4;
  const s = size / 36; // scale factor relative to original 36px design

  const stroke = `hsl(var(--${cssVar(category)}) / 0.7)`;
  const fill = `hsl(var(--${cssVar(category)}) / 0.12)`;
  const accent = `hsl(var(--${cssVar(category)}))`;
  const glow = `drop-shadow(0 0 6px hsl(var(--${cssVar(category)}) / 0.4))`;

  const hex = `M${cx} ${cy - r} L${cx + r * 0.866} ${cy - r * 0.5} L${cx + r * 0.866} ${cy + r * 0.5} L${cx} ${cy + r} L${cx - r * 0.866} ${cy + r * 0.5} L${cx - r * 0.866} ${cy - r * 0.5} Z`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} style={{ filter: glow }}>
      <path d={hex} fill={fill} stroke={stroke} strokeWidth={1.2} />
      <circle cx={cx} cy={cy} r={r * 0.7} fill="none" stroke={stroke} strokeWidth={0.5} opacity={0.3} />
      {renderInner(category, cx, cy, s, accent)}
    </svg>
  );
}

function cssVar(cat: FutureSkillCategory): string {
  const map: Record<FutureSkillCategory, string> = {
    Technical: "territory-technical",
    Analytical: "territory-analytical",
    Strategic: "territory-strategic",
    Communication: "territory-communication",
    Leadership: "territory-leadership",
    Creative: "territory-creative",
    "Ethics & Compliance": "territory-ethics",
    "Human Edge": "territory-humanedge",
  };
  return map[cat] || "primary";
}

function renderInner(category: FutureSkillCategory, cx: number, cy: number, s: number, accent: string) {
  switch (category) {
    case "Technical":
      return (
        <g>
          <circle cx={cx} cy={cy} r={6 * s} fill="none" stroke={accent} strokeWidth={1.5 * s} />
          <circle cx={cx} cy={cy} r={2.5 * s} fill={accent} opacity={0.6} />
          {[0, 60, 120, 180, 240, 300].map(a => {
            const rad = (a * Math.PI) / 180;
            return <line key={a} x1={cx + Math.cos(rad) * 5 * s} y1={cy + Math.sin(rad) * 5 * s} x2={cx + Math.cos(rad) * 9 * s} y2={cy + Math.sin(rad) * 9 * s} stroke={accent} strokeWidth={2 * s} strokeLinecap="round" />;
          })}
        </g>
      );
    case "Analytical":
      return (
        <g>
          <path d={`M${cx} ${cy - 10 * s} L${cx + 7 * s} ${cy - 2 * s} L${cx + 4 * s} ${cy + 9 * s} L${cx - 4 * s} ${cy + 9 * s} L${cx - 7 * s} ${cy - 2 * s} Z`} fill="none" stroke={accent} strokeWidth={1.5 * s} strokeLinejoin="round" />
          <line x1={cx - 7 * s} y1={cy - 2 * s} x2={cx + 7 * s} y2={cy - 2 * s} stroke={accent} strokeWidth={1 * s} opacity={0.6} />
          <line x1={cx} y1={cy - 10 * s} x2={cx - 2 * s} y2={cy + 9 * s} stroke={accent} strokeWidth={0.8 * s} opacity={0.4} />
          <line x1={cx} y1={cy - 10 * s} x2={cx + 2 * s} y2={cy + 9 * s} stroke={accent} strokeWidth={0.8 * s} opacity={0.4} />
        </g>
      );
    case "Strategic":
      return (
        <g>
          <path d={`M${cx} ${cy - 10 * s} L${cx + 3 * s} ${cy} L${cx} ${cy + 10 * s} L${cx - 3 * s} ${cy} Z`} fill={accent} opacity={0.3} stroke={accent} strokeWidth={1 * s} />
          <path d={`M${cx - 10 * s} ${cy} L${cx} ${cy + 3 * s} L${cx + 10 * s} ${cy} L${cx} ${cy - 3 * s} Z`} fill={accent} opacity={0.3} stroke={accent} strokeWidth={1 * s} />
          <circle cx={cx} cy={cy} r={2 * s} fill={accent} opacity={0.6} />
        </g>
      );
    case "Communication":
      return (
        <g>
          <path d={`M${cx - 8 * s} ${cy - 2 * s} L${cx + 4 * s} ${cy - 8 * s} L${cx + 4 * s} ${cy + 8 * s} L${cx - 8 * s} ${cy + 2 * s} Z`} fill="none" stroke={accent} strokeWidth={1.5 * s} strokeLinejoin="round" />
          <line x1={cx + 4 * s} y1={cy} x2={cx + 10 * s} y2={cy} stroke={accent} strokeWidth={1.5 * s} strokeLinecap="round" />
          <line x1={cx + 5 * s} y1={cy - 4 * s} x2={cx + 9 * s} y2={cy - 6 * s} stroke={accent} strokeWidth={1 * s} strokeLinecap="round" opacity={0.6} />
          <line x1={cx + 5 * s} y1={cy + 4 * s} x2={cx + 9 * s} y2={cy + 6 * s} stroke={accent} strokeWidth={1 * s} strokeLinecap="round" opacity={0.6} />
        </g>
      );
    case "Leadership":
      return (
        <g>
          <path d={`M${cx - 9 * s} ${cy + 5 * s} L${cx - 9 * s} ${cy - 3 * s} L${cx - 4 * s} ${cy + 1 * s} L${cx} ${cy - 8 * s} L${cx + 4 * s} ${cy + 1 * s} L${cx + 9 * s} ${cy - 3 * s} L${cx + 9 * s} ${cy + 5 * s} Z`} fill={accent} opacity={0.3} stroke={accent} strokeWidth={1.5 * s} strokeLinejoin="round" />
          <rect x={cx - 9 * s} y={cy + 5 * s} width={18 * s} height={3 * s} rx={1 * s} fill={accent} opacity={0.5} />
        </g>
      );
    case "Creative":
      return (
        <g>
          <line x1={cx - 6 * s} y1={cy + 9 * s} x2={cx + 4 * s} y2={cy - 5 * s} stroke={accent} strokeWidth={1.8 * s} strokeLinecap="round" />
          <path d={`M${cx + 5 * s} ${cy - 9 * s} L${cx + 6.5 * s} ${cy - 5.5 * s} L${cx + 10 * s} ${cy - 6 * s} L${cx + 7.5 * s} ${cy - 3 * s} L${cx + 9 * s} ${cy} L${cx + 5 * s} ${cy - 2 * s} L${cx + 1 * s} ${cy} L${cx + 2.5 * s} ${cy - 3 * s} L${cx} ${cy - 6 * s} L${cx + 3.5 * s} ${cy - 5.5 * s} Z`} fill={accent} opacity={0.7} />
        </g>
      );
    case "Ethics & Compliance":
      return (
        <g>
          <path d={`M${cx} ${cy - 10 * s} L${cx + 9 * s} ${cy - 5 * s} L${cx + 7 * s} ${cy + 4 * s} Q${cx + 3 * s} ${cy + 10 * s} ${cx} ${cy + 11 * s} Q${cx - 3 * s} ${cy + 10 * s} ${cx - 7 * s} ${cy + 4 * s} L${cx - 9 * s} ${cy - 5 * s} Z`} fill={accent} opacity={0.2} stroke={accent} strokeWidth={1.5 * s} />
          <line x1={cx} y1={cy - 4 * s} x2={cx} y2={cy + 5 * s} stroke={accent} strokeWidth={1.5 * s} strokeLinecap="round" />
          <line x1={cx - 4 * s} y1={cy + 1 * s} x2={cx + 4 * s} y2={cy + 1 * s} stroke={accent} strokeWidth={1.5 * s} strokeLinecap="round" />
        </g>
      );
    case "Human Edge":
      return (
        <g>
          <path d={`M${cx - 10 * s} ${cy} Q${cx} ${cy - 9 * s} ${cx + 10 * s} ${cy} Q${cx} ${cy + 9 * s} ${cx - 10 * s} ${cy}`} fill="none" stroke={accent} strokeWidth={1.5 * s} />
          <circle cx={cx} cy={cy} r={3.5 * s} fill="none" stroke={accent} strokeWidth={1.2 * s} />
          <circle cx={cx} cy={cy} r={1.5 * s} fill={accent} opacity={0.7} />
        </g>
      );
    default:
      return null;
  }
}
