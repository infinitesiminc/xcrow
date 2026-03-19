/**
 * SkillMapGrid — gamified skill grid organized by category.
 * Each skill tile shows level, XP progress, and spectrum color.
 */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowRight, Lock, Star, Trophy, TrendingUp } from "lucide-react";
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

interface SkillMapGridProps {
  skills: SkillXP[];
  /** Optional: tasks that built each skill (skill_id → task names) */
  skillTasks?: Map<string, string[]>;
}

const LEVEL_ICONS = [Lock, Zap, Star, Trophy];
const LEVEL_COLORS = ["text-muted-foreground/40", "text-spectrum-1", "text-spectrum-3", "text-spectrum-5"];

export default function SkillMapGrid({ skills, skillTasks }: SkillMapGridProps) {
  const navigate = useNavigate();
  const [selectedSkill, setSelectedSkill] = useState<SkillXP | null>(null);

  // Group skills by category
  const grouped = useMemo(() => {
    const map = new Map<SkillCategory, SkillXP[]>();
    for (const s of skills) {
      const arr = map.get(s.category) || [];
      arr.push(s);
      map.set(s.category, arr);
    }
    // Sort each category: practiced first, then by XP desc
    for (const [, arr] of map) {
      arr.sort((a, b) => (b.xp > 0 ? 1 : 0) - (a.xp > 0 ? 1 : 0) || b.xp - a.xp);
    }
    return map;
  }, [skills]);

  const categories = Object.keys(CATEGORY_META) as SkillCategory[];

  return (
    <>
      <div className="space-y-6">
        {categories.map(cat => {
          const catSkills = grouped.get(cat);
          if (!catSkills || catSkills.length === 0) return null;
          const meta = CATEGORY_META[cat];
          const practiced = catSkills.filter(s => s.xp > 0).length;

          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{meta.emoji}</span>
                <h3 className="text-sm font-semibold text-foreground">{meta.label}</h3>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {practiced}/{catSkills.length} active
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {catSkills.map((skill, i) => {
                  const active = skill.xp > 0;
                  const eStyle = exposureStyle(skill.aiExposure);
                  const LevelIcon = LEVEL_ICONS[skill.levelIndex];
                  const levelColor = LEVEL_COLORS[skill.levelIndex];

                  return (
                    <motion.button
                      key={skill.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedSkill(skill)}
                      className={`rounded-xl border p-3 text-left transition-all group ${
                        active
                          ? "border-primary/20 bg-primary/5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/10"
                          : "border-border/30 bg-card/50 opacity-60 hover:opacity-80"
                      }`}
                    >
                      {/* Top row: icon + level */}
                      <div className="flex items-center justify-between mb-2">
                        <LevelIcon className={`h-4 w-4 ${active ? levelColor : "text-muted-foreground/30"}`} />
                        {active && (
                          <span className="text-[9px] font-semibold text-primary">{skill.level}</span>
                        )}
                      </div>

                      {/* Skill name */}
                      <p className="text-xs font-semibold text-foreground leading-snug mb-1 truncate">
                        {skill.name}
                      </p>

                      {/* XP progress bar */}
                      {active ? (
                        <div className="space-y-1">
                          <Progress value={skill.progress} className="h-1.5" />
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-muted-foreground">{skill.xp} XP</span>
                            {getNextLevel(skill.xp) && (
                              <span className="text-[8px] text-muted-foreground/60">
                                {getNextLevel(skill.xp)!.xpNeeded} to {getNextLevel(skill.xp)!.name}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[9px] text-muted-foreground/50">Practice to unlock</p>
                      )}

                      {/* AI exposure badge */}
                      <div className="mt-2 flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${eStyle.dot}`} />
                        <span className={`text-[8px] ${eStyle.text}`}>{eStyle.label}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Skill detail sheet */}
      <Sheet open={!!selectedSkill} onOpenChange={() => setSelectedSkill(null)}>
        <SheetContent side="right" className="w-[340px] sm:w-[400px]">
          {selectedSkill && (
            <SkillDetailPanel
              skill={selectedSkill}
              tasks={skillTasks?.get(selectedSkill.id) || []}
              onPractice={() => {
                setSelectedSkill(null);
                navigate("/");
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function SkillDetailPanel({ skill, tasks, onPractice }: { skill: SkillXP; tasks: string[]; onPractice: () => void }) {
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

      {/* Level & XP */}
      <div className="rounded-xl border border-border/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">{skill.level}</span>
          <span className="text-xs text-muted-foreground">{skill.xp} XP</span>
        </div>
        <Progress value={skill.progress} className="h-2" />
        {next && (
          <p className="text-[11px] text-muted-foreground">
            {next.xpNeeded} XP to reach <span className="font-semibold text-foreground">{next.name}</span>
          </p>
        )}
        {!next && skill.xp > 0 && (
          <p className="text-[11px] text-primary font-medium">Max level reached! 🏆</p>
        )}

        {/* Level roadmap */}
        <div className="flex items-center gap-1 pt-2">
          {LEVELS.map((lvl, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`h-2 w-full rounded-full transition-colors ${
                  i <= skill.levelIndex ? "bg-primary" : "bg-muted/40"
                }`}
              />
              <span className={`text-[8px] ${i <= skill.levelIndex ? "text-primary font-medium" : "text-muted-foreground/50"}`}>
                {lvl.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI exposure */}
      <div className="flex items-center gap-2 text-xs">
        <div className={`w-2.5 h-2.5 rounded-full ${eStyle.dot}`} />
        <span className={eStyle.text}>{skill.aiExposure}% AI Augmented — {eStyle.label}</span>
      </div>
      {skill.humanEdge && (
        <p className="text-xs text-muted-foreground">
          💡 <span className="font-medium text-foreground">Human edge:</span> {skill.humanEdge}
        </p>
      )}

      {/* Tasks that built this skill */}
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

      {/* CTA */}
      <Button onClick={onPractice} className="w-full rounded-xl gap-2">
        <ArrowRight className="h-3.5 w-3.5" /> Practice to Level Up
      </Button>
    </div>
  );
}
