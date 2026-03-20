import { useState, useMemo, useRef, useEffect } from "react";

interface SkillRow {
  skill: string;
  demand: number;
  exposure: number;
  coveragePct: number;
  maxDemand: number;
  category: string;
}

/** Neon coverage color — cyan (low) → magenta (mid) → hot pink (high gap) */
function neonColor(pct: number): { fill: string; glow: string } {
  // Coverage: 0% = hot pink (gap), 100% = cyan (covered)
  const hue = Math.round((pct / 100) * 160 + 300) % 360;
  return {
    fill: `hsl(${hue} 90% 55%)`,
    glow: `hsl(${hue} 100% 60%)`,
  };
}

const MARGIN = { top: 20, right: 20, bottom: 48, left: 52 };

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
    const maxR = Math.min(32, (INNER_W / rows.length) * 1.2);
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
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl border border-white/[0.08] p-4 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(240 10% 6%) 0%, hsl(260 12% 10%) 50%, hsl(240 10% 6%) 100%)",
      }}
    >
      {/* Ambient glow orbs */}
      <div
        className="pointer-events-none absolute -top-20 -left-20 w-60 h-60 rounded-full opacity-20 blur-3xl"
        style={{ background: "hsl(270 80% 60%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-16 -right-16 w-48 h-48 rounded-full opacity-15 blur-3xl"
        style={{ background: "hsl(180 90% 50%)" }}
      />

      {/* Neon top border */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{
          background: "linear-gradient(90deg, hsl(180 90% 60%), hsl(270 80% 65%), hsl(330 90% 60%))",
        }}
      />

      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full relative z-10"
        style={{ display: "block" }}
      >
        <defs>
          {/* Glow filters for each bubble */}
          {bubbles.map((b) => {
            const { glow } = neonColor(b.coveragePct);
            return (
              <filter key={`glow-${b.skill}`} id={`glow-${b.skill.replace(/\s+/g, "-")}`} x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={glow} floodOpacity="0.6" />
              </filter>
            );
          })}
          {/* Hovered glow — stronger */}
          {hoveredBubble && (() => {
            const { glow } = neonColor(hoveredBubble.coveragePct);
            return (
              <filter id="glow-hover" x="-80%" y="-80%" width="260%" height="260%">
                <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={glow} floodOpacity="0.9" />
              </filter>
            );
          })()}
        </defs>

        {/* Gridlines — subtle */}
        {yTicks.map((t) => {
          const y = MARGIN.top + INNER_H - (t / 100) * INNER_H;
          return (
            <line key={`y-${t}`} x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y} y2={y} stroke="hsla(240, 10%, 40%, 0.15)" strokeWidth={0.5} strokeDasharray="3 6" />
          );
        })}
        {xTicks.map((t) => {
          const x = MARGIN.left + (t / maxDemand) * INNER_W;
          return (
            <line key={`x-${t}`} x1={x} x2={x} y1={MARGIN.top} y2={MARGIN.top + INNER_H} stroke="hsla(240, 10%, 40%, 0.15)" strokeWidth={0.5} strokeDasharray="3 6" />
          );
        })}

        {/* Axes — faint */}
        <line x1={MARGIN.left} x2={MARGIN.left} y1={MARGIN.top} y2={MARGIN.top + INNER_H} stroke="hsla(240, 10%, 50%, 0.3)" strokeWidth={1} />
        <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={MARGIN.top + INNER_H} y2={MARGIN.top + INNER_H} stroke="hsla(240, 10%, 50%, 0.3)" strokeWidth={1} />

        {/* Y labels */}
        {yTicks.map((t) => {
          const y = MARGIN.top + INNER_H - (t / 100) * INNER_H;
          return (
            <text key={`yl-${t}`} x={MARGIN.left - 6} y={y + 3} textAnchor="end" fill="hsla(220, 10%, 55%, 0.7)" fontSize={9} fontFamily="monospace">
              {t}%
            </text>
          );
        })}
        {/* X labels */}
        {xTicks.map((t) => {
          const x = MARGIN.left + (t / maxDemand) * INNER_W;
          return (
            <text key={`xl-${t}`} x={x} y={MARGIN.top + INNER_H + 16} textAnchor="middle" fill="hsla(220, 10%, 55%, 0.7)" fontSize={9} fontFamily="monospace">
              {t}
            </text>
          );
        })}

        {/* Axis titles */}
        <text x={WIDTH / 2} y={HEIGHT - 2} textAnchor="middle" fill="hsla(220, 10%, 65%, 0.8)" fontSize={10} fontWeight={600} letterSpacing="0.05em">
          MARKET DEMAND
        </text>
        <text x={12} y={HEIGHT / 2} textAnchor="middle" fill="hsla(220, 10%, 65%, 0.8)" fontSize={10} fontWeight={600} letterSpacing="0.05em" transform={`rotate(-90, 12, ${HEIGHT / 2})`}>
          AI EXPOSURE
        </text>

        {/* Bubbles */}
        {bubbles
          .filter((b) => b.skill !== hovered)
          .map((b) => {
            const { fill } = neonColor(b.coveragePct);
            const filterId = `glow-${b.skill.replace(/\s+/g, "-")}`;
            return (
              <circle
                key={b.skill}
                cx={b.cx}
                cy={b.cy}
                r={b.r}
                fill={fill}
                fillOpacity={0.55}
                stroke={fill}
                strokeWidth={1}
                strokeOpacity={0.4}
                filter={`url(#${filterId})`}
                onMouseEnter={() => setHovered(b.skill)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "default", transition: "fill-opacity 150ms, r 150ms" }}
              />
            );
          })}

        {/* Hovered bubble — amplified glow */}
        {hoveredBubble && (() => {
          const { fill } = neonColor(hoveredBubble.coveragePct);
          return (
            <circle
              cx={hoveredBubble.cx}
              cy={hoveredBubble.cy}
              r={hoveredBubble.r + 3}
              fill={fill}
              fillOpacity={0.9}
              stroke="white"
              strokeWidth={1.5}
              strokeOpacity={0.6}
              filter="url(#glow-hover)"
              onMouseEnter={() => setHovered(hoveredBubble.skill)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "default" }}
            />
          );
        })()}

        {/* Tooltip — dark glass card */}
        {hoveredBubble &&
          (() => {
            const b = hoveredBubble;
            const tw = 170;
            const th = 80;
            let tx = b.cx + b.r + 12;
            let ty = b.cy - th / 2;
            if (tx + tw > WIDTH - 8) tx = b.cx - b.r - tw - 12;
            ty = Math.max(4, Math.min(HEIGHT - th - 4, ty));
            const { fill: accentColor } = neonColor(b.coveragePct);
            return (
              <g pointerEvents="none">
                {/* Card bg */}
                <rect x={tx} y={ty} width={tw} height={th} rx={8} fill="hsla(240, 12%, 8%, 0.92)" stroke="hsla(240, 10%, 30%, 0.4)" strokeWidth={1} />
                {/* Neon accent line */}
                <rect x={tx} y={ty} width={tw} height={3} rx={8} fill={accentColor} fillOpacity={0.8} />
                {/* Skill name */}
                <text x={tx + 10} y={ty + 22} fontSize={11} fontWeight={700} fill="hsla(220, 10%, 90%, 1)" fontFamily="Space Grotesk, sans-serif">
                  {b.skill.length > 20 ? b.skill.slice(0, 18) + "…" : b.skill}
                </text>
                {/* Coverage badge */}
                <text x={tx + 10} y={ty + 38} fontSize={9} fill={accentColor} fontWeight={600} fontFamily="monospace">
                  {b.coveragePct}% coverage
                </text>
                {/* Stats */}
                <text x={tx + 10} y={ty + 54} fontSize={9} fill="hsla(220, 10%, 55%, 0.8)" fontFamily="monospace">
                  Demand: {b.demand} · AI: {b.exposure}%
                </text>
                {/* Category */}
                <text x={tx + 10} y={ty + 68} fontSize={8} fill="hsla(220, 10%, 45%, 0.6)" fontFamily="monospace" letterSpacing="0.08em" style={{ textTransform: "uppercase" }}>
                  {b.category}
                </text>
              </g>
            );
          })()}
      </svg>

      {/* Legend — neon chips */}
      <div className="relative z-10 flex items-center justify-center gap-5 mt-3 text-[10px]">
        <span className="flex items-center gap-1.5" style={{ color: "hsl(330 90% 60%)" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: "hsl(330 90% 60%)", boxShadow: "0 0 6px hsl(330 90% 60%)" }} />
          0% covered
        </span>
        <span className="flex items-center gap-1.5" style={{ color: "hsl(270 80% 65%)" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: "hsl(270 80% 65%)", boxShadow: "0 0 6px hsl(270 80% 65%)" }} />
          50%
        </span>
        <span className="flex items-center gap-1.5" style={{ color: "hsl(180 90% 55%)" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: "hsl(180 90% 55%)", boxShadow: "0 0 6px hsl(180 90% 55%)" }} />
          100% covered
        </span>
        <span className="text-white/30 ml-2">⬤ size = demand</span>
      </div>
    </div>
  );
}
