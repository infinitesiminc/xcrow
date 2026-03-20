import { useState, useMemo, useRef, useEffect } from "react";

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

const MARGIN = { top: 20, right: 20, bottom: 44, left: 52 };

interface Bubble {
  skill: string;
  demand: number;
  exposure: number;
  coveragePct: number;
  category: string;
  cx: number;
  cy: number;
  r: number;
}

export default function SkillBubbleMap({ rows }: { rows: SkillRow[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 520 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDims({ w: Math.max(480, width), h: Math.max(400, Math.min(600, width * 0.6)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const WIDTH = dims.w;
  const HEIGHT = dims.h;
  const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
  const INNER_H = HEIGHT - MARGIN.top - MARGIN.bottom;

  const maxDemand = useMemo(() => Math.max(...rows.map((r) => r.demand), 1), [rows]);

  const bubbles = useMemo<Bubble[]>(() => {
    const sqrtMax = Math.sqrt(maxDemand);
    const maxR = Math.min(32, INNER_W / rows.length * 1.2);
    const minR = 5;

    const initial = rows.map((r) => {
      const x = MARGIN.left + (r.demand / maxDemand) * INNER_W;
      const y = MARGIN.top + INNER_H - (r.exposure / 100) * INNER_H;
      const radius = minR + (Math.sqrt(r.demand) / sqrtMax) * (maxR - minR);
      return {
        skill: r.skill,
        demand: r.demand,
        exposure: r.exposure,
        coveragePct: r.coveragePct,
        category: r.category,
        cx: x,
        cy: y,
        r: radius,
      };
    });

    // Simple collision relaxation — push overlapping bubbles apart
    for (let iter = 0; iter < 60; iter++) {
      let moved = false;
      for (let i = 0; i < initial.length; i++) {
        for (let j = i + 1; j < initial.length; j++) {
          const a = initial[i];
          const b = initial[j];
          const dx = b.cx - a.cx;
          const dy = b.cy - a.cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = a.r + b.r + 2;
          if (dist < minDist && dist > 0) {
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;
            a.cx -= nx * overlap * 0.5;
            a.cy -= ny * overlap * 0.5;
            b.cx += nx * overlap * 0.5;
            b.cy += ny * overlap * 0.5;
            moved = true;
          }
        }
      }
      // Clamp to chart bounds
      for (const b of initial) {
        b.cx = Math.max(MARGIN.left + b.r, Math.min(WIDTH - MARGIN.right - b.r, b.cx));
        b.cy = Math.max(MARGIN.top + b.r, Math.min(MARGIN.top + INNER_H - b.r, b.cy));
      }
      if (!moved) break;
    }

    return initial;
  }, [rows, maxDemand, INNER_W, INNER_H, WIDTH]);

  const yTicks = [0, 20, 40, 60, 80, 100];
  const xTicks = useMemo(() => {
    const step = Math.ceil(maxDemand / 5);
    return Array.from({ length: 6 }, (_, i) => i * step).filter((v) => v <= maxDemand);
  }, [maxDemand]);

  const hoveredBubble = hovered ? bubbles.find((b) => b.skill === hovered) : null;

  return (
    <div ref={containerRef} className="rounded-xl border border-border/60 bg-card/80 p-3 w-full">
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ display: "block" }}>
        {/* Gridlines */}
        {yTicks.map((t) => {
          const y = MARGIN.top + INNER_H - (t / 100) * INNER_H;
          return <line key={`y-${t}`} x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y} y2={y} stroke="hsl(var(--border))" strokeWidth={0.5} strokeDasharray="4 4" />;
        })}
        {xTicks.map((t) => {
          const x = MARGIN.left + (t / maxDemand) * INNER_W;
          return <line key={`x-${t}`} x1={x} x2={x} y1={MARGIN.top} y2={MARGIN.top + INNER_H} stroke="hsl(var(--border))" strokeWidth={0.5} strokeDasharray="4 4" />;
        })}

        {/* Axes */}
        <line x1={MARGIN.left} x2={MARGIN.left} y1={MARGIN.top} y2={MARGIN.top + INNER_H} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
        <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={MARGIN.top + INNER_H} y2={MARGIN.top + INNER_H} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />

        {/* Y labels */}
        {yTicks.map((t) => {
          const y = MARGIN.top + INNER_H - (t / 100) * INNER_H;
          return <text key={`yl-${t}`} x={MARGIN.left - 6} y={y + 3} textAnchor="end" className="fill-muted-foreground" fontSize={9} fontFamily="monospace">{t}%</text>;
        })}
        {/* X labels */}
        {xTicks.map((t) => {
          const x = MARGIN.left + (t / maxDemand) * INNER_W;
          return <text key={`xl-${t}`} x={x} y={MARGIN.top + INNER_H + 16} textAnchor="middle" className="fill-muted-foreground" fontSize={9} fontFamily="monospace">{t}</text>;
        })}

        {/* Axis titles */}
        <text x={WIDTH / 2} y={HEIGHT - 2} textAnchor="middle" className="fill-muted-foreground" fontSize={10} fontWeight={600}>Market Demand</text>
        <text x={12} y={HEIGHT / 2} textAnchor="middle" className="fill-muted-foreground" fontSize={10} fontWeight={600} transform={`rotate(-90, 12, ${HEIGHT / 2})`}>AI Exposure %</text>

        {/* Bubbles — non-hovered first, hovered on top */}
        {bubbles.filter((b) => b.skill !== hovered).map((b) => (
          <circle
            key={b.skill}
            cx={b.cx}
            cy={b.cy}
            r={b.r}
            fill={coverageColor(b.coveragePct)}
            fillOpacity={0.65}
            stroke="none"
            onMouseEnter={() => setHovered(b.skill)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "default", transition: "fill-opacity 150ms" }}
          />
        ))}
        {hoveredBubble && (
          <circle
            cx={hoveredBubble.cx}
            cy={hoveredBubble.cy}
            r={hoveredBubble.r + 2}
            fill={coverageColor(hoveredBubble.coveragePct)}
            fillOpacity={0.95}
            stroke="hsl(var(--foreground))"
            strokeWidth={1.5}
            onMouseEnter={() => setHovered(hoveredBubble.skill)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "default" }}
          />
        )}

        {/* Tooltip */}
        {hoveredBubble && (() => {
          const b = hoveredBubble;
          const tw = 158;
          const th = 72;
          let tx = b.cx + b.r + 10;
          let ty = b.cy - th / 2;
          // Flip left if too close to right edge
          if (tx + tw > WIDTH - 8) tx = b.cx - b.r - tw - 10;
          // Clamp vertical
          ty = Math.max(4, Math.min(HEIGHT - th - 4, ty));
          return (
            <g pointerEvents="none">
              <rect x={tx} y={ty} width={tw} height={th} rx={6} fill="hsl(var(--popover))" stroke="hsl(var(--border))" strokeWidth={1} />
              <text x={tx + 8} y={ty + 16} fontSize={10} fontWeight={700} className="fill-foreground">{b.skill}</text>
              <text x={tx + 8} y={ty + 30} fontSize={9} className="fill-muted-foreground">Coverage: {b.coveragePct}%</text>
              <text x={tx + 8} y={ty + 43} fontSize={9} className="fill-muted-foreground">Demand: {b.demand} · AI: {b.exposure}%</text>
              <text x={tx + 8} y={ty + 56} fontSize={9} className="fill-muted-foreground">{b.category}</text>
            </g>
          );
        })()}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
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
