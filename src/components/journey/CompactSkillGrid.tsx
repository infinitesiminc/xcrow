/**
 * CompactSkillGrid — Territory Map (center panel).
 * Skills shown as territory tiles: Claimed, Frontier, Undiscovered.
 * Contested zones highlighted for target-role + market demand overlap.
 */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Zap, Star, Trophy, TrendingUp, ArrowRight, Flame, MessageCircle } from "lucide-react";
import {
  type SkillXP,
  type SkillCategory,
  CATEGORY_META,
  SKILL_TAXONOMY,
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
  targetSkillNames: Set<string>;
}

const LEVEL_ICONS = [Lock, Zap, Star, Trophy];

const CAT_COLORS: Record<SkillCategory, { active: string; glow: string }> = {
  technical: { active: "hsl(180, 45%, 48%)", glow: "hsl(180, 45%, 48%)" },
  analytical: { active: "hsl(210, 50%, 55%)", glow: "hsl(210, 50%, 55%)" },
  communication: { active: "hsl(45, 60%, 55%)", glow: "hsl(45, 60%, 55%)" },
  leadership: { active: "hsl(270, 45%, 58%)", glow: "hsl(270, 45%, 58%)" },
  creative: { active: "hsl(330, 45%, 55%)", glow: "hsl(330, 45%, 55%)" },
  compliance: { active: "hsl(150, 40%, 48%)", glow: "hsl(150, 40%, 48%)" },
};

type TileState = "claimed" | "frontier" | "undiscovered";

export default function CompactSkillGrid({ skills, skillTasks, targetSkillNames }: CompactSkillGridProps) {
  const navigate = useNavigate();
  const [selectedSkill, setSelectedSkill] = useState<SkillXP | null>(null);

  const hasTargets = targetSkillNames.size > 0;

  // Determine tile state for each skill
  const tileStates = useMemo(() => {
    const states = new Map<string, TileState>();
    const activeIds = new Set(skills.filter(s => s.xp > 0).map(s => s.id));

    for (const skill of skills) {
      if (skill.xp > 0) {
        states.set(skill.id, "claimed");
      } else if (!hasTargets || targetSkillNames.has(skill.name.toLowerCase())) {
        // Frontier: in target role OR no targets set (show all as explorable)
        states.set(skill.id, "frontier");
      } else {
        states.set(skill.id, "undiscovered");
      }
    }
    return states;
  }, [skills, targetSkillNames, hasTargets]);

  // Check if a skill is a "contested zone" (frontier + in target roles)
  const isContested = (skill: SkillXP) =>
    hasTargets && tileStates.get(skill.id) === "frontier" && targetSkillNames.has(skill.name.toLowerCase());

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

  const claimedCount = skills.filter(s => s.xp > 0).length;
  const frontierCount = skills.filter(s => tileStates.get(s.id) === "frontier").length;

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden min-h-0">
        {/* Header */}
        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-white/60">Territory Map</h2>
            <p className="text-[9px] text-white/30 mt-0.5">
              {hasTargets
                ? `${claimedCount} claimed · ${frontierCount} frontiers to explore`
                : `${claimedCount} claimed · Practice to expand territory`
              }
            </p>
          </div>
          <span className="text-[10px] font-mono text-white/30">
            {claimedCount}/{skills.length}
          </span>
        </div>

        {/* Territory Grid */}
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
                  {/* Category header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-xs"
                      style={{ background: `${colors.active}18`, border: `1px solid ${colors.active}30` }}
                    >
                      {meta.emoji}
                    </div>
                    <span className="text-[11px] font-semibold text-white/55 uppercase tracking-wide">{meta.label}</span>
                    <div className="flex-1 h-px" style={{ background: `${colors.active}15` }} />
                    <span className="text-[9px] font-mono text-white/25">{activeCount}/{catSkills.length}</span>
                  </div>

                  {/* Territory tiles */}
                  <div className="relative pl-5">
                    <div className="absolute left-[14px] top-2 bottom-2 w-px" style={{ background: `${colors.active}15` }} />
                    <div className="space-y-2">
                      {catSkills.map((skill, i) => {
                        const state = tileStates.get(skill.id) || "undiscovered";
                        const contested = isContested(skill);
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
                              background: state === "claimed"
                                ? "hsla(240, 10%, 14%, 0.6)"
                                : state === "frontier"
                                  ? "hsla(240, 10%, 11%, 0.5)"
                                  : "hsla(240, 10%, 8%, 0.3)",
                              border: state === "claimed"
                                ? `1px solid ${colors.active}22`
                                : contested
                                  ? "1px solid hsla(330, 50%, 50%, 0.25)"
                                  : state === "frontier"
                                    ? "1px dashed hsla(0,0%,100%,0.08)"
                                    : "1px solid hsla(0,0%,100%,0.03)",
                            }}
                          >
                            {/* Node dot */}
                            <div className="absolute -left-[6px] top-1/2 -translate-y-1/2">
                              <div
                                className="h-2.5 w-2.5 rounded-full"
                                style={{
                                  background: state === "claimed"
                                    ? colors.active
                                    : contested
                                      ? "hsl(330, 50%, 50%)"
                                      : state === "frontier"
                                        ? `${colors.active}40`
                                        : "hsla(0,0%,100%,0.08)",
                                  boxShadow: state === "claimed" ? `0 0 6px ${colors.glow}40` : contested ? "0 0 6px hsla(330, 50%, 50%, 0.3)" : "none",
                                }}
                              />
                              {/* Contested zone pulse */}
                              {contested && (
                                <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "hsla(330, 50%, 50%, 0.2)" }} />
                              )}
                            </div>

                            {/* Skill icon */}
                            <div
                              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                background: state === "claimed" ? `${colors.active}15` : "hsla(0,0%,100%,0.03)",
                                border: `1px solid ${state === "claimed" ? `${colors.active}25` : "hsla(0,0%,100%,0.05)"}`,
                              }}
                            >
                              {state === "undiscovered" ? (
                                <Lock className="h-3 w-3 text-white/10" />
                              ) : contested ? (
                                <Flame className="h-3.5 w-3.5" style={{ color: "hsl(330, 50%, 55%)" }} />
                              ) : (
                                <LevelIcon className="h-3.5 w-3.5" style={{ color: state === "claimed" ? colors.active : "hsla(0,0%,100%,0.2)" }} />
                              )}
                            </div>

                            {/* Skill info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className={`text-[11px] font-medium leading-tight ${
                                  state === "claimed" ? "text-white/75"
                                  : state === "frontier" ? "text-white/45"
                                  : "text-white/20"
                                }`}>
                                  {skill.name}
                                </p>
                                {contested && (
                                  <span className="text-[7px] px-1 py-0.5 rounded font-bold" style={{ background: "hsla(330, 50%, 50%, 0.15)", color: "hsl(330, 50%, 60%)" }}>
                                    HOT
                                  </span>
                                )}
                              </div>
                              {state === "claimed" ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "hsla(0,0%,100%,0.06)" }}>
                                    <div className="h-full rounded-full" style={{ width: `${skill.progress}%`, background: colors.active, opacity: 0.7 }} />
                                  </div>
                                  <span className="text-[8px] font-mono text-white/35 shrink-0">{skill.xp} XP</span>
                                </div>
                              ) : state === "frontier" ? (
                                <p className="text-[9px] text-white/25 mt-0.5">
                                  {contested ? "Target role needs this" : "Available to explore"}
                                </p>
                              ) : (
                                <p className="text-[9px] text-white/12 mt-0.5">Locked</p>
                              )}
                            </div>

                            {/* Level/state badge */}
                            {state === "claimed" && (
                              <span className="text-[8px] font-mono font-bold shrink-0 px-1.5 py-0.5 rounded" style={{ color: colors.active, background: `${colors.active}12` }}>
                                {skill.level.slice(0, 3).toUpperCase()}
                              </span>
                            )}
                            {skill.humanEdge && state === "claimed" && (
                              <div className="h-4 w-4 rounded-full flex items-center justify-center" style={{ background: "hsla(270, 40%, 50%, 0.15)" }}>
                                <Star className="h-2.5 w-2.5" style={{ color: "hsl(270, 45%, 58%)" }} />
                              </div>
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
              state={tileStates.get(selectedSkill.id) || "undiscovered"}
              contested={isContested(selectedSkill)}
              onPractice={() => { setSelectedSkill(null); navigate("/"); }}
              onExploreChat={(skillName: string) => {
                setSelectedSkill(null);
                navigate("/", { state: { chatPrompt: `Show me roles that build my ${skillName} skill` } });
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function SkillDetail({
  skill, tasks, state, contested, onPractice, onExploreChat,
}: {
  skill: SkillXP; tasks: string[]; state: TileState; contested: boolean;
  onPractice: () => void; onExploreChat: (name: string) => void;
}) {
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
            <SheetTitle className="text-base flex items-center gap-2">
              {skill.name}
              {contested && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-destructive/10 text-destructive">
                  CONTESTED
                </span>
              )}
            </SheetTitle>
            <p className="text-xs text-muted-foreground">{CATEGORY_META[skill.category].label}</p>
          </div>
        </div>
      </SheetHeader>

      {state === "claimed" ? (
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
                <span className={`text-[8px] ${i <= skill.levelIndex ? "text-primary font-medium" : "text-muted-foreground/50"}`}>{lvl.name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/40 p-4">
          <p className="text-sm text-muted-foreground">
            {contested
              ? "This skill is needed by your target roles — claim it by practicing related tasks!"
              : state === "frontier"
                ? "This frontier is available to explore. Practice tasks to claim this territory."
                : "This territory is undiscovered. Set target roles or practice related skills to unlock."
            }
          </p>
        </div>
      )}

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

      <div className="space-y-2">
        <Button onClick={onPractice} className="w-full rounded-xl gap-2">
          <ArrowRight className="h-3.5 w-3.5" />
          {state === "claimed" ? "Practice to Level Up" : "Claim this Territory"}
        </Button>
        {state !== "claimed" && (
          <Button variant="outline" onClick={() => onExploreChat(skill.name)} className="w-full rounded-xl gap-2">
            <MessageCircle className="h-3.5 w-3.5" />
            Explore roles for this skill
          </Button>
        )}
      </div>
    </div>
  );
}
