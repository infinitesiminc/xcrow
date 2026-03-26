/**
 * QuestJournal — Replaces SkillProgressPanel (Forge tab).
 * Three sections:
 *   1. Mission Log — current phase, objectives, progress
 *   2. Intel Collected — scouted skills grouped by territory with NPC source
 *   3. Battle Record — conquered skills with scores + XP
 */
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { type FutureSkill, type FutureSkillCategory } from "@/hooks/use-future-skills";
import { supabase } from "@/integrations/supabase/client";
import type { SimLaunchRequest } from "@/components/territory/SkillLaunchCard";
import {
  Search, Swords, Crown, Compass, ChevronRight, Clock,
  Zap, Diamond, Lock, Trophy, Flame, ScrollText, MapPin,
  CheckCircle2, Circle, Beaker,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { getTerritory, TERRITORY_ORDER } from "@/lib/territory-colors";
import { useAuth } from "@/contexts/AuthContext";
import type { CanonicalSkillGrowth } from "@/pages/MapPage";
import { getSkillRune } from "@/lib/skill-runes";
import { motion, AnimatePresence } from "framer-motion";
import { ROLE_NPC_AVATARS } from "@/lib/role-npc-avatars";
import type { MissionPhase, ScoutedSkill } from "@/hooks/use-scout-mission";

const cinzel = { fontFamily: "'Cinzel', serif" };

const PHASE_META: Record<MissionPhase, { label: string; icon: typeof Eye; color: string; objectives: string[] }> = {
  scout: {
    label: "Scout",
    icon: Eye,
    color: "hsl(var(--primary))",
    objectives: [
      "Talk to role NPCs across territories",
      "Discover 3+ skills to unlock battles",
      "Visit all 8 territories",
    ],
  },
  battle: {
    label: "Battle",
    icon: Swords,
    color: "hsl(45 90% 55%)",
    objectives: [
      "Practice scouted skills in simulations",
      "Conquer 5+ skills to begin territory conquest",
      "Earn XP to level up your castles",
    ],
  },
  conquer: {
    label: "Conquer",
    icon: Crown,
    color: "hsl(280 60% 60%)",
    objectives: [
      "Defeat Territory Guardians",
      "Master all 8 territories",
      "Reach Legend rank",
    ],
  },
};

/* ── Battle Log types ── */
interface BattleEntry {
  id: string;
  taskName: string;
  jobTitle: string;
  level: number;
  score: number;
  completedAt: string;
  skillsEarned: { skillId?: string; skill_id?: string; xp: number }[];
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Mini rune icon */
function SkillRune({ skillId, category, size = 14 }: { skillId: string; category: string; size?: number }) {
  const territory = getTerritory(category as FutureSkillCategory);
  return (
    <svg viewBox="-7 -7 14 14" width={size} height={size} className="shrink-0">
      <path
        d={getSkillRune(skillId, category)}
        fill="none"
        stroke={territory.hsl}
        strokeWidth={0.8}
        transform="scale(0.7)"
      />
    </svg>
  );
}

/* ── Component ── */
interface Props {
  skills: FutureSkill[];
  onSkillClick?: (skill: FutureSkill) => void;
  skillGrowthMap?: Map<string, CanonicalSkillGrowth>;
  focusSkillId?: string | null;
  level2SkillIds?: Set<string>;
  onLaunchSim?: (req: SimLaunchRequest) => void;
  /** Scout mission state */
  missionPhase: MissionPhase;
  missionProgress: number;
  scoutedSkills: ScoutedSkill[];
  territoriesScouted: Set<string>;
  skillsConquered: number;
}

export default function QuestJournal({
  skills, onSkillClick, skillGrowthMap, focusSkillId, level2SkillIds, onLaunchSim,
  missionPhase, missionProgress, scoutedSkills, territoriesScouted, skillsConquered,
}: Props) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [expandedSection, setExpandedSection] = useState<"mission" | "intel" | "battles">("mission");
  const [battleLog, setBattleLog] = useState<BattleEntry[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const scoutedIds = useMemo(() => new Set(scoutedSkills.map(s => s.id)), [scoutedSkills]);

  // Load battle log
  useEffect(() => {
    if (!user) return;
    setLogLoading(true);
    supabase
      .from("completed_simulations")
      .select("id, task_name, job_title, sim_level, tool_awareness_score, human_value_add_score, adaptive_thinking_score, domain_judgment_score, skills_earned, completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data) {
          setBattleLog(data.map(d => ({
            id: d.id,
            taskName: d.task_name,
            jobTitle: d.job_title,
            level: (d as any).sim_level ?? 1,
            score: Math.round(
              ((d.tool_awareness_score || 0) + (d.human_value_add_score || 0) +
               (d.adaptive_thinking_score || 0) + (d.domain_judgment_score || 0)) / 4
            ),
            completedAt: d.completed_at,
            skillsEarned: Array.isArray(d.skills_earned) ? (d.skills_earned as any[]) : [],
          })));
        }
        setLogLoading(false);
      });
  }, [user]);

  // Group scouted skills by territory
  const intelByTerritory = useMemo(() => {
    const map = new Map<string, ScoutedSkill[]>();
    for (const s of scoutedSkills) {
      const arr = map.get(s.category) || [];
      arr.push(s);
      map.set(s.category, arr);
    }
    return TERRITORY_ORDER
      .map(cat => ({ category: cat, skills: map.get(cat) || [], isScouted: territoriesScouted.has(cat) }));
  }, [scoutedSkills, territoriesScouted]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const handleSkillLaunch = useCallback((skill: FutureSkill) => {
    if (onLaunchSim) {
      onLaunchSim({ jobTitle: skill.name, taskName: skill.name, skillId: skill.id, level: 1 });
    }
  }, [onLaunchSim]);

  const phaseMeta = PHASE_META[missionPhase];
  const PhaseIcon = phaseMeta.icon;

  const SectionHeader = ({ id, icon: Icon, label, badge, isOpen }: { id: "mission" | "intel" | "battles"; icon: any; label: string; badge?: string; isOpen: boolean }) => (
    <button
      onClick={() => setExpandedSection(prev => prev === id ? "mission" : id)}
      className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors hover:bg-muted/20"
      style={{
        ...cinzel,
        color: isOpen ? "hsl(var(--filigree-glow))" : "hsl(var(--muted-foreground))",
        borderBottom: "1px solid hsl(var(--filigree) / 0.1)",
      }}
    >
      <Icon className="h-3 w-3" />
      <span className="flex-1 text-left">{label}</span>
      {badge && <span className="font-mono text-[9px]" style={{ color: "hsl(var(--filigree))" }}>{badge}</span>}
      <ChevronRight className={`h-2.5 w-2.5 transition-transform ${isOpen ? "rotate-90" : ""}`} />
    </button>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header — Mission summary */}
      <div className="px-3 py-2 shrink-0 flex items-center gap-3" style={{ borderBottom: "1px solid hsl(var(--filigree) / 0.12)" }}>
        <div className="flex items-center gap-1.5">
          <Compass className="h-3.5 w-3.5" style={{ color: phaseMeta.color }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ ...cinzel, color: phaseMeta.color }}>
            {phaseMeta.label} Phase
          </span>
        </div>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted) / 0.3)" }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${missionProgress}%` }}
            transition={{ duration: 0.6 }}
            style={{ background: phaseMeta.color }}
          />
        </div>
        <span className="text-[10px] font-mono font-bold" style={{ color: phaseMeta.color }}>{missionProgress}%</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* ═══ Mission Log ═══ */}
        <SectionHeader id="mission" icon={ScrollText} label="Mission Log" isOpen={expandedSection === "mission"} />
        <AnimatePresence>
          {expandedSection === "mission" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 py-2 space-y-2">
                {/* Phase objectives */}
                {phaseMeta.objectives.map((obj, i) => {
                  const isDone = missionPhase === "scout"
                    ? (i === 0 ? scoutedSkills.length > 0 : i === 1 ? scoutedSkills.length >= 3 : territoriesScouted.size >= 8)
                    : missionPhase === "battle"
                    ? (i === 0 ? battleLog.length > 0 : i === 1 ? skillsConquered >= 5 : false)
                    : (i === 0 ? skillsConquered > 0 : false);

                  return (
                    <div key={i} className="flex items-start gap-2">
                      {isDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-success" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "hsl(var(--muted-foreground) / 0.3)" }} />
                      )}
                      <span className={`text-[11px] ${isDone ? "text-success line-through" : "text-foreground"}`}>
                        {obj}
                      </span>
                    </div>
                  );
                })}

                {/* Quick stats */}
                <div
                  className="flex items-center gap-4 pt-2 mt-1 text-[9px]"
                  style={{ borderTop: "1px solid hsl(var(--border) / 0.15)" }}
                >
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    <span className="font-bold text-foreground">{territoriesScouted.size}</span>/8 territories
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="font-bold text-foreground">{scoutedSkills.length}</span> scouted
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Trophy className="h-3 w-3" />
                    <span className="font-bold text-foreground">{skillsConquered}</span> conquered
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ Intel Collected ═══ */}
        <SectionHeader id="intel" icon={Eye} label="Intel Collected" badge={`${scoutedSkills.length} skills`} isOpen={expandedSection === "intel"} />
        <AnimatePresence>
          {expandedSection === "intel" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {intelByTerritory.map(({ category, skills: catScouted, isScouted }) => {
                const territory = getTerritory(category as FutureSkillCategory);
                const isExpanded = expandedCategories.has(category);
                const totalInCategory = skills.filter(s => s.category === category).length;
                const avatarSrc = ROLE_NPC_AVATARS[category];

                return (
                  <div key={category}>
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-medium transition-colors hover:bg-muted/15"
                      style={{ borderBottom: "1px solid hsl(var(--border) / 0.15)" }}
                    >
                      {/* NPC avatar or locked icon */}
                      {isScouted && avatarSrc ? (
                        <img src={avatarSrc} alt={category} className="w-4 h-4 rounded-full object-cover shrink-0" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />
                      )}
                      <span
                        className="flex-1 text-left truncate"
                        style={{ color: isScouted ? territory.hsl : "hsl(var(--muted-foreground) / 0.4)" }}
                      >
                        {category}
                      </span>
                      <span className="font-mono text-[9px] text-muted-foreground">
                        {catScouted.length}/{totalInCategory}
                      </span>
                      {isScouted && (
                        <ChevronRight className={`h-2.5 w-2.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      )}
                    </button>

                    {/* Scouted skill rows */}
                    <AnimatePresence>
                      {isExpanded && isScouted && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          {catScouted.length === 0 ? (
                            <div className="px-3 py-2 text-[10px] text-muted-foreground/50 italic">
                              Territory scouted but no skills collected yet. Talk to more NPCs here.
                            </div>
                          ) : (
                            catScouted.map(scouted => {
                              const skill = skills.find(s => s.id === scouted.id);
                              const growth = skillGrowthMap?.get(scouted.id);
                              const xp = growth ? growth.level1Xp + growth.level2Xp : 0;
                              const isConquered = xp > 0;

                              return (
                                <div
                                  key={scouted.id}
                                  className="flex items-center gap-1.5 px-2 py-1 cursor-pointer transition-colors hover:bg-muted/10"
                                  onClick={() => skill && onSkillClick?.(skill)}
                                >
                                  <SkillRune skillId={scouted.id} category={scouted.category} />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[11px] font-medium text-foreground truncate block">{scouted.name}</span>
                                    <span className="text-[8px] text-muted-foreground/60">
                                      {new Date(scouted.scoutedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    </span>
                                  </div>
                                  {isConquered ? (
                                    <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                                  ) : (
                                    <button
                                      onClick={e => { e.stopPropagation(); if (skill) handleSkillLaunch(skill); }}
                                      className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-colors hover:bg-primary/20"
                                      style={{ color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.3)" }}
                                    >
                                      Battle
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}

                          {/* Unscouted skills teaser */}
                          {totalInCategory - catScouted.length > 0 && (
                            <div className="px-3 py-1 text-[9px] text-muted-foreground/40 italic flex items-center gap-1">
                              <Lock className="h-2.5 w-2.5" />
                              {totalInCategory - catScouted.length} more hidden in the fog
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Unscouted territory message */}
                    {!isScouted && (
                      <div className="px-3 py-1.5 text-[9px] text-muted-foreground/30 italic">
                        No intel — seek a role character in {territory.terrain || category}
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ Battle Record ═══ */}
        <SectionHeader id="battles" icon={Swords} label="Battle Record" badge={`${battleLog.length}`} isOpen={expandedSection === "battles"} />
        <AnimatePresence>
          {expandedSection === "battles" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {logLoading ? (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">Loading…</div>
              ) : battleLog.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                  {scoutedSkills.length === 0
                    ? "Scout skills from NPCs to unlock your first battle."
                    : "Ready to fight! Launch a battle from the Intel tab."}
                </div>
              ) : (
                <div className="divide-y divide-border/20">
                  {battleLog.map(entry => {
                    const totalXpEarned = entry.skillsEarned.reduce((s, e) => s + (e.xp || 0), 0);
                    return (
                      <div key={entry.id} className="px-2 py-1.5 hover:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                            style={{
                              background: entry.level === 2 ? "hsl(45 93% 58% / 0.15)" : "hsl(var(--primary) / 0.15)",
                              color: entry.level === 2 ? "hsl(45 93% 58%)" : "hsl(var(--primary))",
                            }}
                          >
                            {entry.level === 2 ? <Diamond className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-medium text-foreground truncate block">{entry.taskName}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className="text-[9px] font-mono px-1 rounded"
                                style={{
                                  background: entry.score >= 80 ? "hsl(142 60% 50% / 0.15)" : entry.score >= 60 ? "hsl(45 90% 60% / 0.15)" : "hsl(0 60% 50% / 0.15)",
                                  color: entry.score >= 80 ? "hsl(142 60% 50%)" : entry.score >= 60 ? "hsl(45 90% 60%)" : "hsl(0 60% 50%)",
                                }}
                              >
                                {entry.score}%
                              </span>
                              {totalXpEarned > 0 && (
                                <span className="text-[9px] font-mono" style={{ color: "hsl(var(--filigree))" }}>+{totalXpEarned} XP</span>
                              )}
                            </div>
                          </div>
                          <span className="text-[9px] text-muted-foreground shrink-0">{formatTime(entry.completedAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
