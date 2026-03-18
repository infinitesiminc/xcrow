/**
 * Visualization 1: Radar Web + Cards
 * Spider chart showing skill dimensions with engagement opacity,
 * recommendation cards below.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Compass, TrendingUp, Sparkles } from "lucide-react";
import type { InterestGraph, RoleNode, Recommendation } from "@/lib/interest-graph";

const DIMENSIONS = ["Tool Awareness", "Human Value", "Adaptive Thinking", "Domain Judgment", "Engagement", "Breadth"] as const;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function RadarChart({ nodes }: { nodes: RoleNode[] }) {
  const cx = 140, cy = 140, maxR = 110;
  const angleStep = 360 / DIMENSIONS.length;

  // Aggregate dimension values from top 5 nodes
  const vals = useMemo(() => {
    const top = nodes.slice(0, 5);
    if (!top.length) return DIMENSIONS.map(() => 0);
    const maxScore = Math.max(...nodes.map(n => n.score), 1);
    // Simulated dimension scores from available data
    const avgProf = top.reduce((s, n) => s + n.avgProficiency, 0) / top.length;
    const engagement = (top.reduce((s, n) => s + n.score, 0) / top.length / maxScore) * 100;
    const breadth = Math.min(100, (nodes.length / 10) * 100);
    return [
      Math.min(100, avgProf * 1.1),      // Tool Awareness
      Math.min(100, avgProf * 0.9),       // Human Value
      Math.min(100, avgProf * 1.05),      // Adaptive Thinking
      Math.min(100, avgProf * 0.95),      // Domain Judgment
      engagement,                          // Engagement
      breadth,                             // Breadth
    ];
  }, [nodes]);

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const points = vals.map((v, i) => {
    const r = (v / 100) * maxR;
    return polarToCartesian(cx, cy, r, i * angleStep);
  });
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg viewBox="0 0 280 280" className="w-full max-w-[280px] mx-auto">
      {/* Grid */}
      {gridLevels.map(level => {
        const gridPoints = DIMENSIONS.map((_, i) => polarToCartesian(cx, cy, maxR * level, i * angleStep));
        const d = gridPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
        return <path key={level} d={d} fill="none" stroke="hsl(var(--border))" strokeWidth={0.5} opacity={0.4} />;
      })}
      {/* Axes */}
      {DIMENSIONS.map((dim, i) => {
        const end = polarToCartesian(cx, cy, maxR + 2, i * angleStep);
        const labelPos = polarToCartesian(cx, cy, maxR + 18, i * angleStep);
        return (
          <g key={dim}>
            <line x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="hsl(var(--border))" strokeWidth={0.5} opacity={0.3} />
            <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" fontSize={7} fontWeight={500}>
              {dim.split(" ").map(w => w[0]).join("")}
            </text>
          </g>
        );
      })}
      {/* Data polygon */}
      <motion.path
        d={pathD}
        fill="hsl(var(--primary) / 0.15)"
        stroke="hsl(var(--primary))"
        strokeWidth={1.5}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={1.5} />
      ))}
    </svg>
  );
}

const TAG_STYLES: Record<Recommendation["tag"], { bg: string; icon: typeof Compass }> = {
  adjacent: { bg: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Compass },
  deepen: { bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: TrendingUp },
  stretch: { bg: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: Sparkles },
};

export default function JourneyRadarView({ graph, onNavigate }: { graph: InterestGraph; onNavigate: (title: string, company: string | null) => void }) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Explored", value: graph.stats.rolesExplored },
          { label: "Practiced", value: graph.stats.rolesPracticed },
          { label: "Sessions", value: graph.stats.totalSessions },
          { label: "Engagement", value: graph.stats.totalEngagement },
        ].map(s => (
          <div key={s.label} className="rounded-lg bg-muted/30 border border-border/40 p-3 text-center">
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Radar */}
      <div className="flex justify-center py-2">
        <RadarChart nodes={graph.nodes} />
      </div>

      {/* Top roles list */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Roles</h3>
        {graph.nodes.slice(0, 6).map((node, i) => (
          <motion.button
            key={node.role}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onNavigate(node.role, node.company)}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-card border border-border/50 hover:border-primary/40 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {Math.round(node.score)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{node.role}</p>
              {node.company && <p className="text-[10px] text-muted-foreground truncate">{node.company}</p>}
            </div>
            <Badge variant="outline" className="text-[9px] shrink-0">
              {node.tier}
            </Badge>
            <div className="w-20 h-1.5 rounded-full bg-muted/40 overflow-hidden">
              <div className="h-full rounded-full bg-primary/60" style={{ width: `${node.avgProficiency}%` }} />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Recommendations */}
      {graph.recommendations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recommendations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {graph.recommendations.map((rec, i) => {
              const style = TAG_STYLES[rec.tag];
              const Icon = style.icon;
              return (
                <motion.button
                  key={rec.jobTitle + i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  onClick={() => onNavigate(rec.jobTitle, rec.company)}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-card hover:border-primary/30 transition-all text-left group"
                >
                  <div className={`p-1.5 rounded-md border ${style.bg} shrink-0`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{rec.jobTitle}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{rec.reason}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
