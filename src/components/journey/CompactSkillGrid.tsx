/**
 * CompactSkillGrid — Skill Tree with branching paths (center panel).
 * Category branches radiate from center, skills are connected nodes.
 */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Zap, Star, Trophy, TrendingUp, ArrowRight } from "lucide-react";
import {
  type SkillXP,
  type SkillCategory,
  CATEGORY_META,
  LEVELS,
  getNextLevel,
} from "@/lib/skill-map";
import { exposureStyle } from "@/lib/exposure-colors";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface CompactSkillGridProps {
  skills: SkillXP[];
  skillTasks: Map<string, string[]>;
}

const LEVEL_ICONS = [Lock, Zap, Star, Trophy];

/* Node colors per category */
const CAT_COLORS: Record<SkillCategory, { active: string; glow: string }> = {
  technical: { active: "hsl(180, 45%, 48%)", glow: "hsl(180, 45%, 48%)" },
  analytical: { active: "hsl(210, 50%, 55%)", glow: "hsl(210, 50%, 55%)" },
  communication: { active: "hsl(45, 60%, 55%)", glow: "hsl(45, 60%, 55%)" },
  leadership: { active: "hsl(270, 45%, 58%)", glow: "hsl(270, 45%, 58%)" },
  creative: { active: "hsl(330, 45%, 55%)", glow: "hsl(330, 45%, 55%)" },
  compliance: { active: "hsl(150, 40%, 48%)", glow: "hsl(150, 40%, 48%)" },
};

export default function CompactSkillGrid({ skills, skillTasks }: CompactSkillGridProps) {
  const navigate = useNavigate();
  const [selectedSkill, setSelectedSkill] = useState<SkillXP | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<SkillCategory, SkillXP[]>();
    for (const s of skills) {
      const arr = map.get(s.category) || [];
      arr.push(s);
      map.set(s.category, arr);
    }
    return map;
  }, [skills]);

  const categories = Object.keys(CATEGORY_META) as SkillCategory[];

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden min-h-0">
        {/* Header */}
        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-white/60">Skill Tree</h2>
            <p className="text-[9px] text-white/30 mt-0.5">Click any node to inspect · Practice to unlock branches</p>
          </div>
          <span className="text-[10px] font-mono text-white/30">
            {skills.filter(s => s.xp > 0).length}/{skills.length}
          </span>
        </div>

        {/* Skill Tree */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <div className="space-y-5">
            {categories.map((cat, catIdx) => {
              const catSkills = grouped.get(cat);
              if (!catSkills || catSkills.length === 0) return null;
              const meta = CATEGORY_META[cat];
              const colors = CAT_COLORS[cat];
              const activeCount = catSkills.filter(s => s.xp > 0).length;

              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIdx * 0.06, duration: 0.4 }}
                >
                  {/* Branch header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-xs"
                      style={{
                        background: `${colors.active}18`,
                        border: `1px solid ${colors.active}30`,
                      }}
                    >
                      {meta.emoji}
                    </div>
                    <span className="text-[11px] font-semibold text-white/55 uppercase tracking-wide">
                      {meta.label}
                    </span>
                    <div className="flex-1 h-px" style={{ background: `${colors.active}15` }} />
                    <span className="text-[9px] font-mono text-white/25">{activeCount}/{catSkills.length}</span>
                  </div>

                  {/* Nodes with connecting line */}
                  <div className="relative pl-5">
                    {/* Vertical connecting line */}
                    <div
                      className="absolute left-[14px] top-2 bottom-2 w-px"
                      style={{ background: `${colors.active}15` }}
                    />

                    <div className="space-y-2">
                      {catSkills.map((skill, i) => {
                        const active = skill.xp > 0;
                        const LevelIcon = LEVEL_ICONS[skill.levelIndex];

                        return (
                          <motion.button
                            key={skill.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: catIdx * 0.06 + i * 0.03 }}
                            onClick={() => setSelectedSkill(skill)}
                            className="w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition-all group relative active:scale-[0.98]"
                            style={{
                              background: active
                                ? "hsla(240, 10%, 14%, 0.6)"
                                : "hsla(240, 10%, 10%, 0.4)",
                              border: active
                                ? `1px solid ${colors.active}22`
                                : "1px solid hsla(0, 0%, 100%, 0.04)",
                            }}
                          >
                            {/* Node dot on the connecting line */}
                            <div className="absolute -left-[6px] top-1/2 -translate-y-1/2">
                              <div
                                className="h-2.5 w-2.5 rounded-full"
                                style={{
                                  background: active ? colors.active : "hsla(0,0%,100%,0.1)",
                                  boxShadow: active ? `0 0 6px ${colors.glow}40` : "none",
                                }}
                              />
                            </div>

                            {/* Skill icon */}
                            <div
                              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                background: active ? `${colors.active}15` : "hsla(0,0%,100%,0.03)",
                                border: `1px solid ${active ? `${colors.active}25` : "hsla(0,0%,100%,0.05)"}`,
                              }}
                            >
                              <LevelIcon
                                className="h-3.5 w-3.5"
                                style={{ color: active ? colors.active : "hsla(0,0%,100%,0.15)" }}
                              />
                            </div>

                            {/* Skill info */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-[11px] font-medium leading-tight ${active ? "text-white/75" : "text-white/30"}`}>
                                {skill.name}
                              </p>
                              {active ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "hsla(0,0%,100%,0.06)" }}>
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${skill.progress}%`,
                                        background: colors.active,
                                        opacity: 0.7,
                                      }}
                                    />
                                  </div>
                                  <span className="text-[8px] font-mono text-white/35 shrink-0">{skill.xp} XP</span>
                                </div>
                              ) : (
                                <p className="text-[9px] text-white/18 mt-0.5">Practice to unlock</p>
                              )}
                            </div>

                            {/* Level badge */}
                            {active && (
                              <span
                                className="text-[8px] font-mono font-bold shrink-0 px-1.5 py-0.5 rounded"
                                style={{ color: colors.active, background: `${colors.active}12` }}
                              >
                                {skill.level.slice(0, 3).toUpperCase()}
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail sheet */}
      <Sheet open={!!selectedSkill} onOpenChange={() => setSelectedSkill(null)}>
        <SheetContent side="right" className="w-[340px] sm:w-[400px]">
          {selectedSkill && (
            <SkillDetail
              skill={selectedSkill}
              tasks={skillTasks?.get(selectedSkill.id) || []}
              onPractice={() => { setSelectedSkill(null); navigate("/"); }}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function SkillDetail({ skill, tasks, onPractice }: { skill: SkillXP; tasks: string[]; onPractice: () => void }) {
  const eStyle = exposureStyle(skill.aiExposure);
  const next = getNextLevel(skill.xp);
  const LevelIcon = LEVEL_ICONS[skill.levelIndex];

  return (
    <div className="space-y-6 pt-2">
      <SheetHeader>
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${eStyle.badge} border`}>
            <LevelIcon className="h-5 w-5" />
          </div>
          <div>
            <SheetTitle className="text-base">{skill.name}</SheetTitle>
            <p className="text-xs text-muted-foreground">{CATEGORY_META[skill.category].label}</p>
          </div>
        </div>
      </SheetHeader>

      <div className="rounded-xl border border-border/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">{skill.level}</span>
          <span className="text-xs text-muted-foreground">{skill.xp} XP</span>
        </div>
        <Progress value={skill.progress} className="h-2" />
        {next && (
          <p className="text-[11px] text-muted-foreground">
            {next.xpNeeded} XP to <span className="font-semibold text-foreground">{next.name}</span>
          </p>
        )}
        <div className="flex items-center gap-1 pt-2">
          {LEVELS.map((lvl, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-2 w-full rounded-full ${i <= skill.levelIndex ? "bg-primary" : "bg-muted/40"}`} />
              <span className={`text-[8px] ${i <= skill.levelIndex ? "text-primary font-medium" : "text-muted-foreground/50"}`}>
                {lvl.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <div className={`w-2.5 h-2.5 rounded-full ${eStyle.dot}`} />
        <span className={eStyle.text}>{skill.aiExposure}% AI Augmented — {eStyle.label}</span>
      </div>
      {skill.humanEdge && (
        <p className="text-xs text-muted-foreground">
          💡 <span className="font-medium text-foreground">Human edge:</span> {skill.humanEdge}
        </p>
      )}

      {tasks.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Built by ({tasks.length} task{tasks.length !== 1 ? "s" : ""})
          </h4>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {tasks.map((t, i) => (
              <div key={i} className="text-xs text-foreground/80 flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-primary/60 shrink-0" />
                <span className="truncate">{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button onClick={onPractice} className="w-full rounded-xl gap-2">
        <ArrowRight className="h-3.5 w-3.5" /> Practice to Level Up
      </Button>
    </div>
  );
}
