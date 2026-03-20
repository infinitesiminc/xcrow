import { useState, useMemo } from "react";

interface SkillRow {
  skill: string;
  demand: number;
  exposure: number;
  coveragePct: number;
  maxDemand: number;
  category: string;
}

function coverageColor(pct: number): string {
  const hue = Math.round((pct / 100) * 142);
  return `hsl(${hue} 70% 42%)`;
}

const MARGIN = { top: 24, right: 24, bottom: 48, left: 56 };
const WIDTH = 720;
const HEIGHT = 440;
const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = HEIGHT - MARGIN.top - MARGIN.bottom;

export default function SkillBubbleMap({ rows }: { rows: SkillRow[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const maxDemand = useMemo(() => Math.max(...rows.map((r) => r.demand), 1), [rows]);
  const maxRadius = 28;
  const minRadius = 6;

  const bubbles = useMemo(() => {
    const sqrtMax = Math.sqrt(maxDemand);
    return rows.map((r) => {
      const x = MARGIN.left + (r.demand / maxDemand) * INNER_W;
      const y = MARGIN.top + INNER_H - (r.exposure / 100) * INNER_H;
      const radius = minRadius + ((Math.sqrt(r.demand) / sqrtMax) * (maxRadius - minRadius));
      return { ...r, cx: x, cy: y, r: radius };
    });
  }, [rows, maxDemand]);

  const yTicks = [0, 20, 40, 60, 80, 100];
  const xTicks = useMemo(() => {
    const step = Math.ceil(maxDemand / 5);
    return Array.from({ length: 6 }, (_, i) => i * step).filter((v) => v <= maxDemand);
  }, [maxDemand]);

  return (
    <div className="rounded-xl border border-border/60 bg-card/80 p-4 overflow-x-auto">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full max-w-[720px] mx-auto" style={{ minWidth: 480 }}>
        {/* Gridlines */}
        {yTicks.map((t) => {
          const y = MARGIN.top + INNER_H - (t / 100) * INNER_H;
          return (
            <line key={`y-${t}`} x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y} y2={y} stroke="hsl(var(--border))" strokeWidth={0.5} strokeDasharray="4 4" />
          );
        })}
        {xTicks.map((t) => {
          const x = MARGIN.left + (t / maxDemand) * INNER_W;
          return (
            <line key={`x-${t}`} x1={x} x2={x} y1={MARGIN.top} y2={MARGIN.top + INNER_H} stroke="hsl(var(--border))" strokeWidth={0.5} strokeDasharray="4 4" />
          );
        })}

        {/* Axes */}
        <line x1={MARGIN.left} x2={MARGIN.left} y1={MARGIN.top} y2={MARGIN.top + INNER_H} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
        <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={MARGIN.top + INNER_H} y2={MARGIN.top + INNER_H} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />

        {/* Y-axis labels */}
        {yTicks.map((t) => {
          const y = MARGIN.top + INNER_H - (t / 100) * INNER_H;
          return (
            <text key={`yl-${t}`} x={MARGIN.left - 8} y={y + 3} textAnchor="end" className="fill-muted-foreground" fontSize={9} fontFamily="monospace">
              {t}%
            </text>
          );
        })}

        {/* X-axis labels */}
        {xTicks.map((t) => {
          const x = MARGIN.left + (t / maxDemand) * INNER_W;
          return (
            <text key={`xl-${t}`} x={x} y={MARGIN.top + INNER_H + 16} textAnchor="middle" className="fill-muted-foreground" fontSize={9} fontFamily="monospace">
              {t}
            </text>
          );
        })}

        {/* Axis titles */}
        <text x={WIDTH / 2} y={HEIGHT - 4} textAnchor="middle" className="fill-muted-foreground" fontSize={10} fontWeight={600}>
          Market Demand (task count)
        </text>
        <text x={14} y={HEIGHT / 2} textAnchor="middle" className="fill-muted-foreground" fontSize={10} fontWeight={600} transform={`rotate(-90, 14, ${HEIGHT / 2})`}>
          AI Exposure %
        </text>

        {/* Bubbles */}
        {bubbles.map((b) => (
          <g key={b.skill} onMouseEnter={() => setHovered(b.skill)} onMouseLeave={() => setHovered(null)} style={{ cursor: "default" }}>
            <circle
              cx={b.cx}
              cy={b.cy}
              r={b.r}
              fill={coverageColor(b.coveragePct)}
              fillOpacity={hovered === b.skill ? 0.95 : 0.7}
              stroke={hovered === b.skill ? "hsl(var(--foreground))" : "none"}
              strokeWidth={1.5}
            />
            {b.r > 10 && (
              <text x={b.cx} y={b.cy + 3} textAnchor="middle" fontSize={Math.min(b.r * 0.7, 9)} fill="white" fontWeight={600} pointerEvents="none">
                {b.skill.length > 12 ? b.skill.slice(0, 10) + "…" : b.skill}
              </text>
            )}
          </g>
        ))}

        {/* Tooltip */}
        {hovered &&
          (() => {
            const b = bubbles.find((bb) => bb.skill === hovered);
            if (!b) return null;
            const tx = Math.min(b.cx + b.r + 8, WIDTH - 160);
            const ty = Math.max(b.cy - 20, 24);
            return (
              <g pointerEvents="none">
                <rect x={tx} y={ty} width={150} height={64} rx={6} fill="hsl(var(--popover))" stroke="hsl(var(--border))" strokeWidth={1} />
                <text x={tx + 8} y={ty + 16} fontSize={10} fontWeight={700} className="fill-foreground">{b.skill}</text>
                <text x={tx + 8} y={ty + 30} fontSize={9} className="fill-muted-foreground">Coverage: {b.coveragePct}%</text>
                <text x={tx + 8} y={ty + 42} fontSize={9} className="fill-muted-foreground">Demand: {b.demand} · AI: {b.exposure}%</text>
                <text x={tx + 8} y={ty + 54} fontSize={9} className="fill-muted-foreground">{b.category}</text>
              </g>
            );
          })()}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: coverageColor(0) }} />0%
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: coverageColor(50) }} />50%
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: coverageColor(100) }} />100% coverage
        </span>
        <span>Bubble size = demand</span>
      </div>
    </div>
  );
}
