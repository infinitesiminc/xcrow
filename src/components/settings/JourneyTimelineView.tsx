/**
 * Visualization 3: Vertical River Timeline
 * Flowing vertical timeline with role cards stacked by recency.
 * Dual progress bars (interest + skill). Recommendations as "suggested next" cards.
 */
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Eye, Shield, Bookmark, Compass, TrendingUp, Sparkles, ChevronRight } from "lucide-react";
import type { InterestGraph, Recommendation } from "@/lib/interest-graph";

const TAG_ICON: Record<Recommendation["tag"], typeof Compass> = {
  adjacent: Compass,
  deepen: TrendingUp,
  stretch: Sparkles,
};

export default function JourneyTimelineView({ graph, onNavigate }: { graph: InterestGraph; onNavigate: (title: string, company: string | null) => void }) {
  const maxScore = Math.max(...graph.nodes.map(n => n.score), 1);

  // Interleave recommendations after the 2nd node
  const insertRecAfter = 2;

  return (
    <div className="space-y-6">
      {/* Stats ribbon */}
      <div className="flex items-center gap-6 text-xs border-b border-border/40 pb-4">
        {[
          { label: "Roles explored", val: graph.stats.rolesExplored },
          { label: "Sessions", val: graph.stats.totalSessions },
          { label: "Engagement", val: graph.stats.totalEngagement },
        ].map(s => (
          <div key={s.label}>
            <p className="text-lg font-bold text-foreground leading-none">{s.val}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
        {graph.stats.strongestCluster && (
          <div className="ml-auto">
            <Badge variant="outline" className="text-[9px]">{graph.stats.strongestCluster}</Badge>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border/50" />

        {graph.nodes.slice(0, 8).map((node, i) => {
          const engPct = Math.round((node.score / maxScore) * 100);
          const tierColor = node.tier === "core" ? "bg-primary" : node.tier === "exploring" ? "bg-warning" : "bg-muted-foreground";

          return (
            <div key={node.role + i}>
              <motion.button
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => onNavigate(node.role, node.company)}
                className="relative w-full text-left mb-3 group"
              >
                {/* Dot */}
                <div className={`absolute -left-6 top-4 w-[9px] h-[9px] rounded-full ${tierColor} border-2 border-background z-10`} />

                <div className="rounded-lg border border-border/40 bg-card p-3 hover:border-primary/40 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{node.role}</p>
                      {node.company && <p className="text-[10px] text-muted-foreground">{node.company}</p>}
                    </div>
                    <Badge variant="outline" className="text-[9px] shrink-0">{node.tier}</Badge>
                  </div>

                  {/* Dual bars */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-muted-foreground w-14">Interest</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary/70"
                          initial={{ width: 0 }}
                          animate={{ width: `${engPct}%` }}
                          transition={{ delay: i * 0.06 + 0.2, duration: 0.5 }}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground w-7 text-right">{engPct}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-muted-foreground w-14">Skill</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-success/70"
                          initial={{ width: 0 }}
                          animate={{ width: `${node.avgProficiency}%` }}
                          transition={{ delay: i * 0.06 + 0.3, duration: 0.5 }}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground w-7 text-right">{node.avgProficiency}%</span>
                    </div>
                  </div>

                  {/* Signal icons */}
                  <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground">
                    {node.signals.views > 0 && <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{node.signals.views}</span>}
                    {node.signals.practices > 0 && <span className="flex items-center gap-0.5"><Shield className="h-3 w-3" />{node.signals.practices}</span>}
                    {node.signals.bookmarks > 0 && <span className="flex items-center gap-0.5"><Bookmark className="h-3 w-3" />{node.signals.bookmarks}</span>}
                    {node.tasks.length > 0 && <span className="ml-auto">{node.tasks.length} task{node.tasks.length > 1 ? "s" : ""}</span>}
                  </div>
                </div>
              </motion.button>

              {/* Insert recommendation cards after insertRecAfter */}
              {i === insertRecAfter && graph.recommendations.length > 0 && (
                <div className="mb-3 ml-0">
                  <div className="absolute -left-6 top-auto w-[9px] h-[9px] rounded-full bg-accent border-2 border-background z-10" style={{ marginTop: 16 }} />
                  <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-2">Suggested Next</p>
                    <div className="space-y-1.5">
                      {graph.recommendations.slice(0, 3).map((rec, ri) => {
                        const Icon = TAG_ICON[rec.tag];
                        return (
                          <button
                            key={rec.jobTitle + ri}
                            onClick={() => onNavigate(rec.jobTitle, rec.company)}
                            className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-primary/10 transition-colors text-left"
                          >
                            <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-xs text-foreground flex-1 truncate">{rec.jobTitle}</span>
                            <Badge variant="outline" className="text-[8px]">{rec.tag}</Badge>
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
