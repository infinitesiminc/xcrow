/**
 * Visualization 2: Bubble Galaxy Map
 * Each role is a circle — size = engagement, color = proficiency.
 * Recommendations appear as faded ghost bubbles.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import type { InterestGraph, RoleNode, Recommendation } from "@/lib/interest-graph";

function hashColor(prof: number): string {
  if (prof >= 75) return "hsl(var(--success))";
  if (prof >= 50) return "hsl(var(--warning))";
  if (prof > 0) return "hsl(var(--primary))";
  return "hsl(var(--muted-foreground))";
}

interface BubbleItem {
  label: string;
  company: string | null;
  size: number; // px radius
  color: string;
  opacity: number;
  x: number;
  y: number;
  isGhost: boolean;
  tier?: string;
  tag?: Recommendation["tag"];
}

export default function JourneyBubbleView({ graph, onNavigate }: { graph: InterestGraph; onNavigate: (title: string, company: string | null) => void }) {
  const bubbles = useMemo<BubbleItem[]>(() => {
    const maxScore = Math.max(...graph.nodes.map(n => n.score), 1);
    const items: BubbleItem[] = [];

    // Real nodes
    graph.nodes.slice(0, 12).forEach((node, i) => {
      const normalized = node.score / maxScore;
      const size = 20 + normalized * 40;
      const angle = (i / Math.min(graph.nodes.length, 12)) * Math.PI * 2;
      const radius = 80 + (1 - normalized) * 60;
      items.push({
        label: node.role,
        company: node.company,
        size,
        color: hashColor(node.avgProficiency),
        opacity: 0.6 + normalized * 0.4,
        x: 200 + Math.cos(angle) * radius,
        y: 180 + Math.sin(angle) * radius,
        isGhost: false,
        tier: node.tier,
      });
    });

    // Ghost recommendations
    graph.recommendations.slice(0, 4).forEach((rec, i) => {
      const angle = ((i + graph.nodes.length) / (graph.nodes.length + 4)) * Math.PI * 2;
      items.push({
        label: rec.jobTitle,
        company: rec.company,
        size: 18,
        color: "hsl(var(--muted-foreground))",
        opacity: 0.25,
        x: 200 + Math.cos(angle) * 150,
        y: 180 + Math.sin(angle) * 150,
        isGhost: true,
        tag: rec.tag,
      });
    });

    return items;
  }, [graph]);

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span><strong className="text-foreground">{graph.stats.rolesExplored}</strong> explored</span>
        <span><strong className="text-foreground">{graph.stats.rolesPracticed}</strong> practiced</span>
        <span><strong className="text-foreground">{graph.stats.totalSessions}</strong> sessions</span>
        {graph.stats.strongestCluster && (
          <Badge variant="outline" className="text-[9px] ml-auto">Strongest: {graph.stats.strongestCluster}</Badge>
        )}
      </div>

      {/* Bubble map */}
      <div className="relative w-full aspect-square max-w-[400px] mx-auto">
        <svg viewBox="0 0 400 360" className="w-full h-full">
          {/* Connection lines for clusters */}
          {graph.nodes.slice(0, 8).map((node, i) => {
            const b = bubbles[i];
            if (!b) return null;
            return node.clusterIds.map(cid => {
              const sibling = graph.nodes.findIndex((n, j) => j !== i && n.clusterIds.includes(cid));
              if (sibling < 0 || sibling >= bubbles.length) return null;
              const sb = bubbles[sibling];
              return (
                <line
                  key={`${i}-${sibling}-${cid}`}
                  x1={b.x} y1={b.y} x2={sb.x} y2={sb.y}
                  stroke="hsl(var(--border))"
                  strokeWidth={0.5}
                  opacity={0.3}
                />
              );
            });
          })}

          {bubbles.map((b, i) => (
            <motion.g
              key={b.label + i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: b.opacity, scale: 1 }}
              transition={{ delay: i * 0.04, duration: 0.4, type: "spring" }}
              style={{ cursor: "pointer" }}
              onClick={() => onNavigate(b.label, b.company)}
            >
              <circle
                cx={b.x} cy={b.y} r={b.size}
                fill={b.color}
                opacity={b.isGhost ? 0.15 : 0.3}
                stroke={b.isGhost ? "hsl(var(--muted-foreground))" : b.color}
                strokeWidth={b.isGhost ? 1 : 0}
                strokeDasharray={b.isGhost ? "3 2" : "none"}
              />
              <text
                x={b.x} y={b.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={b.size > 30 ? 8 : 6}
                fontWeight={600}
                className={b.isGhost ? "fill-muted-foreground" : "fill-foreground"}
              >
                {b.label.length > 14 ? b.label.slice(0, 12) + "…" : b.label}
              </text>
              {b.isGhost && (
                <text x={b.x} y={b.y + 10} textAnchor="middle" fontSize={5} className="fill-muted-foreground" opacity={0.5}>
                  {b.tag}
                </text>
              )}
            </motion.g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> High skill</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> Mid skill</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Low skill</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full border border-dashed border-muted-foreground" /> <Sparkles className="h-2.5 w-2.5" /> Suggested</span>
      </div>
    </div>
  );
}
