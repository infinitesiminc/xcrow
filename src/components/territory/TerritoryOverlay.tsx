/**
 * TerritoryOverlay — full-screen RPG castle grid overlay.
 * Auto-opens after first simulation, accessible via button.
 * Crowy flies between skills. Castles unlock via XP accumulation.
 */

import { useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  SKILL_TAXONOMY,
  CATEGORY_META,
  type SkillCategory,
  type SkillXP,
} from "@/lib/skill-map";
import { getCastleState } from "@/lib/castle-levels";
import CastleNode from "./CastleNode";

interface TerritoryOverlayProps {
  open: boolean;
  onClose: () => void;
  skills: SkillXP[];
  lastPracticedSkillId?: string | null;
}

const CATEGORY_ORDER: SkillCategory[] = [
  "technical",
  "analytical",
  "communication",
  "leadership",
  "creative",
  "compliance",
];

export default function TerritoryOverlay({
  open,
  onClose,
  skills,
  lastPracticedSkillId,
}: TerritoryOverlayProps) {
  const skillMap = useMemo(() => new Map(skills.map((s) => [s.id, s])), [skills]);

  const totalXP = useMemo(
    () => skills.reduce((sum, s) => sum + s.xp, 0),
    [skills]
  );
  const unlockedCount = useMemo(
    () => skills.filter((s) => s.xp >= 100).length,
    [skills]
  );

  const categorizedSkills = useMemo(() => {
    return CATEGORY_ORDER.map((cat) => ({
      category: cat,
      meta: CATEGORY_META[cat],
      skills: SKILL_TAXONOMY.filter((s) => s.category === cat),
    }));
  }, []);

  const handleNodeClick = useCallback((skillId: string) => {
    // Future: open skill detail / sim launcher
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="territory-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[60] bg-background/98 backdrop-blur-sm flex flex-col"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="flex items-center justify-between px-6 py-4 border-b border-border/30 shrink-0"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  Skill Territory
                </h2>
                <p className="text-xs text-muted-foreground">
                  {unlockedCount} castles claimed • {totalXP.toLocaleString()} total XP
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all active:scale-[0.97] border border-border/40"
            >
              <X className="h-3.5 w-3.5" />
              Close
            </button>
          </motion.div>

          {/* Castle Grid */}
          <TooltipProvider delayDuration={200}>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="max-w-4xl mx-auto space-y-8">
                {categorizedSkills.map((group, gi) => (
                  <motion.div
                    key={group.category}
                    initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                      delay: 0.2 + gi * 0.08,
                      duration: 0.6,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    {/* Category header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm">{group.meta.emoji}</span>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {group.meta.label}
                      </span>
                      <div className="flex-1 h-px bg-border/30" />
                    </div>

                    {/* Skill castles */}
                    <div className="flex flex-wrap gap-4">
                      {group.skills.map((skill, si) => {
                        const sx = skillMap.get(skill.id);
                        const xp = sx?.xp ?? 0;
                        const castle = getCastleState(xp);
                        const isActive = lastPracticedSkillId === skill.id;

                        return (
                          <CastleNode
                            key={skill.id}
                            skillId={skill.id}
                            name={skill.name}
                            category={skill.category}
                            castle={castle}
                            xp={xp}
                            isActive={isActive}
                            onClick={() => handleNodeClick(skill.id)}
                            delay={gi * 6 + si}
                          />
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Bottom legend */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="max-w-4xl mx-auto mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] text-muted-foreground"
              >
                {[
                  { emoji: "🏚️", label: "Ruins (locked)" },
                  { emoji: "🏕️", label: "Outpost (100+ XP)" },
                  { emoji: "🏰", label: "Fortress (300+ XP)" },
                  { emoji: "⚔️", label: "Citadel (600+ XP)" },
                  { emoji: "🐦‍⬛", label: "Crowy (last practiced)" },
                ].map((l) => (
                  <span key={l.label} className="flex items-center gap-1">
                    <span>{l.emoji}</span> {l.label}
                  </span>
                ))}
              </motion.div>
            </div>
          </TooltipProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
