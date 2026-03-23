/**
 * CodexPanel — Collection of Intel Drops earned from simulations.
 * Shows elevation narratives as collectible scroll cards grouped by role.
 */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scroll, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface IntelDrop {
  id: string;
  job_title: string;
  task_name: string;
  company: string | null;
  completed_at: string;
  elevation: {
    shift_summary: string;
    before: string;
    after: string;
    emerging_skills: string[];
    analogy: string;
  };
}

export default function CodexPanel() {
  const { user } = useAuth();
  const [drops, setDrops] = useState<IntelDrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("completed_simulations")
      .select("id, job_title, task_name, company, completed_at, elevation_narrative")
      .eq("user_id", user.id)
      .not("elevation_narrative", "is", null)
      .order("completed_at", { ascending: false })
      .then(({ data }) => {
        const parsed: IntelDrop[] = [];
        for (const row of data || []) {
          const elev = row.elevation_narrative as any;
          if (elev?.shift_summary) {
            parsed.push({
              id: row.id,
              job_title: row.job_title,
              task_name: row.task_name,
              company: row.company,
              completed_at: row.completed_at,
              elevation: {
                shift_summary: elev.shift_summary || "",
                before: elev.before || "",
                after: elev.after || "",
                emerging_skills: elev.emerging_skills || [],
                analogy: elev.analogy || "",
              },
            });
          }
        }
        setDrops(parsed);
        setLoading(false);
      });
  }, [user]);

  const grouped = useMemo(() => {
    const map = new Map<string, IntelDrop[]>();
    for (const d of drops) {
      const key = d.job_title;
      const arr = map.get(key) || [];
      arr.push(d);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [drops]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-2">
          <Scroll className="h-5 w-5 text-primary/40 mx-auto animate-pulse" />
          <p className="text-xs text-muted-foreground">Loading Codex…</p>
        </div>
      </div>
    );
  }

  if (drops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "hsl(var(--primary) / 0.08)", border: "1px solid hsl(var(--primary) / 0.15)" }}
        >
          <Scroll className="h-6 w-6 text-primary/50" />
        </div>
        <h3 className="text-sm font-display font-bold text-foreground mb-1" style={{ fontFamily: "'Cinzel', serif" }}>
          The Codex Awaits
        </h3>
        <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
          Complete battles to discover rare Intel Drops — insights into how roles are evolving with AI. Each drop is a surprise.
        </p>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Scroll className="h-3.5 w-3.5 text-primary" />
          <span
            className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Intel Archive
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {drops.length} {drops.length === 1 ? "drop" : "drops"} collected
        </span>
      </div>

      {/* Grouped by role */}
      {grouped.map(([roleTitle, rolDrops]) => (
        <div key={roleTitle} className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0"
              style={{ background: `hsl(${(roleTitle.length * 47) % 360}, 50%, 40%)` }}
            >
              {roleTitle[0]?.toUpperCase()}
            </div>
            <span className="text-[11px] font-medium text-foreground/80 truncate">{roleTitle}</span>
            <span className="text-[9px] text-muted-foreground shrink-0">{rolDrops.length}×</span>
          </div>

          {rolDrops.map((drop, i) => {
            const isExpanded = expandedId === drop.id;
            return (
              <motion.div
                key={drop.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl overflow-hidden cursor-pointer"
                style={{
                  background: "hsl(var(--primary) / 0.04)",
                  border: "1px solid hsl(var(--primary) / 0.12)",
                }}
                onClick={() => setExpandedId(isExpanded ? null : drop.id)}
              >
                {/* Collapsed: summary row */}
                <div className="flex items-start gap-2.5 px-3 py-2.5">
                  <span className="text-base mt-0.5 shrink-0">📜</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-foreground/85 leading-snug">
                      {drop.elevation.shift_summary}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 truncate">
                      {drop.task_name}{drop.company ? ` · ${drop.company}` : ""}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
                  )}
                </div>

                {/* Expanded: full insight */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-2.5">
                        {/* Before / After */}
                        {(drop.elevation.before || drop.elevation.after) && (
                          <div className="grid grid-cols-2 gap-2">
                            {drop.elevation.before && (
                              <div
                                className="rounded-lg p-2.5"
                                style={{ background: "hsl(var(--muted) / 0.5)" }}
                              >
                                <span className="text-[9px] font-mono uppercase text-muted-foreground block mb-1">Before</span>
                                <p className="text-[11px] text-foreground/70 leading-relaxed">{drop.elevation.before}</p>
                              </div>
                            )}
                            {drop.elevation.after && (
                              <div
                                className="rounded-lg p-2.5"
                                style={{
                                  background: "hsl(var(--primary) / 0.06)",
                                  border: "1px solid hsl(var(--primary) / 0.12)",
                                }}
                              >
                                <span className="text-[9px] font-mono uppercase text-primary block mb-1">After</span>
                                <p className="text-[11px] text-foreground/70 leading-relaxed">{drop.elevation.after}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Emerging skills */}
                        {drop.elevation.emerging_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {drop.elevation.emerging_skills.map((skill, si) => (
                              <span
                                key={si}
                                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                style={{
                                  background: "hsl(var(--primary) / 0.1)",
                                  color: "hsl(var(--primary))",
                                }}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Analogy */}
                        {drop.elevation.analogy && (
                          <p className="text-[10px] text-muted-foreground italic flex items-start gap-1.5">
                            <Sparkles className="h-3 w-3 text-primary/40 shrink-0 mt-0.5" />
                            {drop.elevation.analogy}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
