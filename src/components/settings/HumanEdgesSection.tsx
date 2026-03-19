/**
 * HumanEdgesSection — personalized breakdown of the user's human edges
 * on the Journey page, derived from their practiced skills.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  SKILL_TAXONOMY,
  CATEGORY_META,
  type SkillXP,
  type SkillCategory,
} from "@/lib/skill-map";

interface HumanEdgesSectionProps {
  skills: SkillXP[];
}

interface EdgeItem {
  skillName: string;
  humanEdge: string;
  category: SkillCategory;
  aiExposure: number;
  xp: number;
  levelIndex: number;
}

export default function HumanEdgesSection({ skills }: HumanEdgesSectionProps) {
  const navigate = useNavigate();

  const edges: EdgeItem[] = useMemo(() => {
    // Get all skills that have been practiced and have a human edge
    const active = skills.filter(s => s.xp > 0);
    return active
      .map(s => {
        const tax = SKILL_TAXONOMY.find(t => t.id === s.id);
        if (!tax?.humanEdge) return null;
        return {
          skillName: tax.name,
          humanEdge: tax.humanEdge,
          category: tax.category,
          aiExposure: tax.aiExposure,
          xp: s.xp,
          levelIndex: s.levelIndex,
        };
      })
      .filter(Boolean) as EdgeItem[];
  }, [skills]);

  // Also show undiscovered edges (skills not yet practiced)
  const undiscovered = useMemo(() => {
    const activeIds = new Set(skills.filter(s => s.xp > 0).map(s => s.id));
    return SKILL_TAXONOMY
      .filter(t => t.humanEdge && !activeIds.has(t.id))
      .sort((a, b) => b.aiExposure - a.aiExposure) // Show high-AI-exposure edges first (most valuable)
      .slice(0, 4);
  }, [skills]);

  if (edges.length === 0 && undiscovered.length === 0) return null;

  const levelLabels = ["Beginner", "Developing", "Proficient", "Expert"];

  return (
    <div className="mt-8">
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Your Human Edges</h3>
          <p className="text-xs text-muted-foreground">
            Skills that make you irreplaceable as AI takes over routine tasks
          </p>
        </div>
      </div>

      {/* Discovered edges */}
      {edges.length > 0 && (
        <div className="space-y-2 mb-5">
          {edges.map((edge, i) => {
            const catMeta = CATEGORY_META[edge.category];
            return (
              <motion.div
                key={edge.skillName}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-xl border border-border/40 bg-card px-4 py-3"
              >
                <div className="shrink-0">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{edge.humanEdge}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {levelLabels[edge.levelIndex]}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {catMeta.emoji} {edge.skillName} · {edge.aiExposure}% of tasks AI-assisted → your edge matters more
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Undiscovered edges */}
      {undiscovered.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Edges to unlock
          </p>
          <div className="grid grid-cols-2 gap-2">
            {undiscovered.map((tax) => {
              const catMeta = CATEGORY_META[tax.category];
              return (
                <button
                  key={tax.id}
                  onClick={() => navigate("/")}
                  className="text-left rounded-xl border border-dashed border-border/50 bg-muted/10 p-3 hover:border-primary/30 hover:bg-muted/20 transition-colors group"
                >
                  <p className="text-xs font-medium text-foreground/70 group-hover:text-foreground">
                    {tax.humanEdge}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {catMeta.emoji} {tax.name}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-primary/60 group-hover:text-primary">
                    Practice to unlock <ArrowRight className="h-2.5 w-2.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
