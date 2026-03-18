/**
 * Visualization 4: Tile Grid + Heatmap
 * Compact grid of role tiles color-coded by proficiency (green→red heatmap).
 * Tile size reflects engagement level. Recommendations as dashed-border tiles.
 * Filter chips for tier/cluster at top.
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Eye, Shield, Bookmark } from "lucide-react";
import type { InterestGraph, Recommendation } from "@/lib/interest-graph";

function profToColor(prof: number, hasPractice: boolean): string {
  if (!hasPractice) return "hsl(var(--muted))";
  if (prof >= 80) return "hsl(var(--brand-human))";
  if (prof >= 60) return "hsl(142 70% 45%)";
  if (prof >= 40) return "hsl(var(--brand-mid))";
  if (prof >= 20) return "hsl(25 80% 50%)";
  return "hsl(var(--brand-ai))";
}

function tierColor(tier: "core" | "exploring" | "peripheral"): string {
  if (tier === "core") return "hsl(var(--brand-human))";
  if (tier === "exploring") return "hsl(var(--brand-mid))";
  return "hsl(var(--muted))";
}

type TierFilter = "all" | "core" | "exploring" | "peripheral";

export default function JourneyHeatmapView({ graph, onNavigate }: { graph: InterestGraph; onNavigate: (title: string, company: string | null) => void }) {
  const [filter, setFilter] = useState<TierFilter>("all");

  const filteredNodes = useMemo(() => {
    if (filter === "all") return graph.nodes;
    return graph.nodes.filter(n => n.tier === filter);
  }, [graph.nodes, filter]);

  const maxScore = Math.max(...graph.nodes.map(n => n.score), 1);

  const filters: { key: TierFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: graph.nodes.length },
    { key: "core", label: "Core", count: graph.nodes.filter(n => n.tier === "core").length },
    { key: "exploring", label: "Exploring", count: graph.nodes.filter(n => n.tier === "exploring").length },
    { key: "peripheral", label: "Peripheral", count: graph.nodes.filter(n => n.tier === "peripheral").length },
  ];

  return (
    <div className="space-y-5">
      {/* Stats + filter */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span><strong className="text-foreground">{graph.stats.rolesExplored}</strong> roles</span>
          <span><strong className="text-foreground">{graph.stats.totalSessions}</strong> sessions</span>
        </div>
        <div className="flex gap-1">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                filter === f.key
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted/40"
              }`}
            >
              {f.label} <span className="opacity-60">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color scale legend */}
      <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
        <span>Proficiency:</span>
        <div className="flex gap-0.5">
          {[0, 20, 40, 60, 80].map(v => (
            <div key={v} className="w-4 h-2 rounded-sm" style={{ backgroundColor: profToColor(v + 10) }} />
          ))}
        </div>
        <span>Low → High</span>
        <span className="ml-2">Size = Engagement</span>
      </div>

      {/* Heatmap grid */}
      <div className="flex flex-wrap gap-2">
        {filteredNodes.map((node, i) => {
          const engNorm = node.score / maxScore;
          const tileSize = 72 + engNorm * 56; // 72px to 128px
          const hasPractice = node.signals.practices > 0;
          const color = hasPractice ? profToColor(node.avgProficiency, true) : tierColor(node.tier);

          return (
            <motion.button
              key={node.role + i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onNavigate(node.role, node.company)}
              className="rounded-lg border border-border/40 overflow-hidden hover:border-primary/50 transition-all relative group"
              style={{ width: tileSize, height: tileSize }}
            >
              {/* Color indicator */}
              <div className="absolute inset-0 opacity-15" style={{ backgroundColor: color }} />
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: color }} />

              <div className="relative p-2 h-full flex flex-col justify-between">
                <div>
                  <p className="text-[9px] font-semibold text-foreground leading-tight line-clamp-2">{node.role}</p>
                  {node.company && <p className="text-[7px] text-muted-foreground truncate mt-0.5">{node.company}</p>}
                </div>
                <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground">
                  {node.signals.views > 0 && <span className="flex items-center gap-0.5"><Eye className="h-2 w-2" />{node.signals.views}</span>}
                  {node.signals.practices > 0 && <span className="flex items-center gap-0.5"><Shield className="h-2 w-2" />{node.signals.practices}</span>}
                  {node.signals.bookmarks > 0 && <Bookmark className="h-2 w-2" />}
                </div>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                <p className="text-[10px] font-bold text-foreground">{node.avgProficiency}%</p>
                <p className="text-[8px] text-muted-foreground">proficiency</p>
                <p className="text-[8px] text-primary mt-1">{Math.round(engNorm * 100)}% engaged</p>
              </div>
            </motion.button>
          );
        })}

        {/* Ghost recommendation tiles */}
        {graph.recommendations.slice(0, 3).map((rec, i) => (
          <motion.button
            key={`rec-${rec.jobTitle}-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.05 }}
            onClick={() => onNavigate(rec.jobTitle, rec.company)}
            className="rounded-lg border border-dashed border-primary/30 overflow-hidden hover:border-primary/60 transition-all relative"
            style={{ width: 80, height: 80 }}
          >
            <div className="p-2 h-full flex flex-col items-center justify-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-primary/50" />
              <p className="text-[8px] font-medium text-foreground text-center leading-tight line-clamp-2">{rec.jobTitle}</p>
              <Badge variant="outline" className="text-[7px] px-1 py-0">{rec.tag}</Badge>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Recommendations detail */}
      {graph.recommendations.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/30">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Why these suggestions?</h3>
          {graph.recommendations.slice(0, 4).map((rec, i) => (
            <button
              key={rec.jobTitle + i}
              onClick={() => onNavigate(rec.jobTitle, rec.company)}
              className="w-full flex items-start gap-2 p-2 rounded-md hover:bg-muted/30 transition-colors text-left"
            >
              <Badge variant="outline" className="text-[8px] mt-0.5 shrink-0">{rec.tag}</Badge>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">{rec.jobTitle}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-1">{rec.reason}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
