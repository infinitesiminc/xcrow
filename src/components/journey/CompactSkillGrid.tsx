/**
 * CompactSkillGrid — Center panel of Mission Control.
 * Tiny gaming-style tiles for all 26 skills, fitting in viewport.
 */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Zap, Star, Trophy } from "lucide-react";
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
import { TrendingUp, ArrowRight } from "lucide-react";

interface CompactSkillGridProps {
  skills: SkillXP[];
  skillTasks: Map<string, string[]>;
}

const LEVEL_ICONS = [Lock, Zap, Star, Trophy];

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
      <div className="h-full flex flex-col overflow-hidden">
        <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Skill Map</h2>
          <span className="text-[9px] font-mono text-white/30">
            {skills.filter(s => s.xp > 0).length}/{skills.length} active
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          <div className="space-y-3">
            {categories.map(cat => {
              const catSkills = grouped.get(cat);
              if (!catSkills || catSkills.length === 0) return null;
              const meta = CATEGORY_META[cat];

              return (
                <div key={cat}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-xs">{meta.emoji}</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/40">{meta.label}</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1.5">
                    {catSkills.map((skill, i) => {
                      const active = skill.xp > 0;
                      const LevelIcon = LEVEL_ICONS[skill.levelIndex];

                      return (
                        <motion.button
                          key={skill.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.02 }}
                          onClick={() => setSelectedSkill(skill)}
                          className="relative rounded-lg p-2 text-left transition-all group"
                          style={{
                            background: active
                              ? "hsla(240, 10%, 12%, 0.8)"
                              : "hsla(240, 10%, 9%, 0.5)",
                            border: active
                              ? "1px solid hsla(180, 40%, 50%, 0.15)"
                              : "1px solid hsla(0, 0%, 100%, 0.05)",
                            boxShadow: active
                              ? "0 0 8px hsla(180, 40%, 50%, 0.06)"
                              : "none",
                          }}
                        >
                          {/* Neon top accent */}
                          {active && (
                            <div
                              className="absolute top-0 left-2 right-2 h-[2px] rounded-full"
                              style={{
                                background: `linear-gradient(90deg, hsl(180, 40%, 50%), hsl(270, 40%, 55%))`,
                                opacity: 0.4,
                              }}
                            />
                          )}

                          <div className="flex items-center justify-between mb-1">
                            <LevelIcon
                              className="h-3 w-3"
                              style={{
                                color: active ? "hsl(180, 40%, 55%)" : "hsla(0, 0%, 100%, 0.18)",
                              }}
                            />
                            {active && (
                              <span className="text-[7px] font-mono font-bold" style={{ color: "hsl(270, 40%, 60%)" }}>
                                {skill.level.slice(0, 3).toUpperCase()}
                              </span>
                            )}
                          </div>

                          <p className={`text-[9px] font-medium leading-tight truncate ${active ? "text-white/75" : "text-white/30"}`}>
                            {skill.name}
                          </p>

                          {active ? (
                            <div className="mt-1">
                              <div className="h-1 rounded-full overflow-hidden" style={{ background: "hsla(0,0%,100%,0.06)" }}>
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${skill.progress}%`,
                                    background: "linear-gradient(90deg, hsl(180, 40%, 50%), hsl(270, 40%, 55%))",
                                  }}
                                />
                              </div>
                              <p className="text-[7px] font-mono text-white/25 mt-0.5">{skill.xp} XP</p>
                            </div>
                          ) : (
                            <p className="text-[7px] text-white/15 mt-1">locked</p>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
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
