/**
 * SkillProgressPanel — Redesigned left panel showing:
 * 1. Clear mastery structure + per-skill progress
 * 2. Real-time battle log (recent sim completions)
 * 3. Compact, expand-on-demand sections
 */
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { type FutureSkill, type FutureSkillCategory } from "@/hooks/use-future-skills";
import { supabase } from "@/integrations/supabase/client";
import type { SimLaunchRequest } from "@/components/territory/SkillLaunchCard";
import { Input } from "@/components/ui/input";
import {
  Search, Zap, Diamond, Lock, Star, Swords,
  ChevronRight, ChevronDown, ScrollText, Clock,
  Trophy, Flame,
} from "lucide-react";
import { getTerritory, TERRITORY_ORDER } from "@/lib/territory-colors";
import { useAuth } from "@/contexts/AuthContext";
import type { CanonicalSkillGrowth } from "@/pages/MapPage";
import { getSkillRune } from "@/lib/skill-runes";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

/* ── Mastery ladder ── */
const MASTERY_TIERS = [
  { name: "Novice", minXp: 0, color: "hsl(var(--muted-foreground))", icon: "○" },
  { name: "Apprentice", minXp: 150, color: "hsl(142 60% 50%)", icon: "◐" },
  { name: "Adept", minXp: 500, color: "hsl(210 80% 60%)", icon: "◑" },
  { name: "Master", minXp: 1200, color: "hsl(280 70% 60%)", icon: "●" },
  { name: "Grandmaster", minXp: 2500, color: "hsl(45 90% 60%)", icon: "★" },
] as const;

function getTier(xp: number) {
  for (let i = MASTERY_TIERS.length - 1; i >= 0; i--) {
    if (xp >= MASTERY_TIERS[i].minXp) return { ...MASTERY_TIERS[i], index: i };
  }
  return { ...MASTERY_TIERS[0], index: 0 };
}

function getProgressToNext(xp: number) {
  const tier = getTier(xp);
  const nextTier = MASTERY_TIERS[tier.index + 1];
  if (!nextTier) return 100;
  const range = nextTier.minXp - tier.minXp;
  return Math.min(100, Math.round(((xp - tier.minXp) / range) * 100));
}

/** Mini rune icon */
function SkillRune({ skill, size = 16 }: { skill: FutureSkill; size?: number }) {
  const territory = getTerritory(skill.category as FutureSkillCategory);
  return (
    <svg viewBox="-7 -7 14 14" width={size} height={size} className="shrink-0">
      <path
        d={getSkillRune(skill.id, skill.category)}
        fill="none"
        stroke={territory.hsl}
        strokeWidth={0.8}
        transform="scale(0.7)"
      />
    </svg>
  );
}

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

/* ── Component ── */
interface Props {
  skills: FutureSkill[];
  onSkillClick?: (skill: FutureSkill) => void;
  skillGrowthMap?: Map<string, CanonicalSkillGrowth>;
  focusSkillId?: string | null;
  level2SkillIds?: Set<string>;
  onLaunchSim?: (req: SimLaunchRequest) => void;
}

export default function SkillProgressPanel({
  skills, onSkillClick, skillGrowthMap, focusSkillId, level2SkillIds, onLaunchSim,
}: Props) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [expandedSection, setExpandedSection] = useState<"skills" | "log" | null>("skills");
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);
  const [battleLog, setBattleLog] = useState<BattleEntry[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const getSkillXp = useCallback((skillId: string) => {
    const growth = skillGrowthMap?.get(skillId);
    return growth ? growth.level1Xp + growth.level2Xp : 0;
  }, [skillGrowthMap]);

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

  // Focus from map click
  useEffect(() => {
    if (!focusSkillId) return;
    setExpandedSection("skills");
    setExpandedSkillId(focusSkillId);
    requestAnimationFrame(() => {
      const row = rowRefs.current.get(focusSkillId);
      row?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [focusSkillId]);

  // Dispatch focus_skill event
  useEffect(() => {
    if (!expandedSkillId) return;
    const skill = skills.find(s => s.id === expandedSkillId);
    if (skill) {
      window.dispatchEvent(new CustomEvent("focus_skill", {
        detail: { skillId: skill.id, skillName: skill.name, category: skill.category },
      }));
    }
  }, [expandedSkillId, skills]);

  // Group skills by territory
  const grouped = useMemo(() => {
    const q = search.toLowerCase();
    const list = q
      ? skills.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
      : [...skills];

    // Sort by XP desc within each category
    list.sort((a, b) => getSkillXp(b.id) - getSkillXp(a.id));

    const groups = new Map<string, FutureSkill[]>();
    for (const s of list) {
      const arr = groups.get(s.category) || [];
      arr.push(s);
      groups.set(s.category, arr);
    }
    // Order by TERRITORY_ORDER
    return TERRITORY_ORDER
      .filter(cat => groups.has(cat))
      .map(cat => ({ category: cat, skills: groups.get(cat)! }));
  }, [skills, search, getSkillXp]);

  const totalXp = useMemo(() => {
    return skills.reduce((sum, s) => sum + getSkillXp(s.id), 0);
  }, [skills, getSkillXp]);

  const practicedCount = useMemo(() => skills.filter(s => getSkillXp(s.id) > 0).length, [skills, getSkillXp]);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const handleSkillLaunch = useCallback(async (skill: FutureSkill, level: 1 | 2) => {
    // Direct launch — skill name as task, no job context lookup
    if (onLaunchSim) {
      onLaunchSim({ jobTitle: skill.name, taskName: skill.name, skillId: skill.id, level });
    }
  }, [onLaunchSim]);

  const formatTime = (iso: string) => {
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
  };

  const SectionHeader = ({ id, icon: Icon, label, count, isOpen }: { id: "skills" | "log"; icon: any; label: string; count?: number; isOpen: boolean }) => (
    <button
      onClick={() => setExpandedSection(prev => prev === id ? null : id)}
      className="w-full flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest transition-colors hover:bg-muted/20"
      style={{
        fontFamily: "'Cinzel', serif",
        color: isOpen ? "hsl(var(--filigree-glow))" : "hsl(var(--muted-foreground))",
        borderBottom: "1px solid hsl(var(--filigree) / 0.1)",
      }}
    >
      <Icon className="h-3 w-3" />
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && (
        <span className="font-mono text-[9px]" style={{ color: "hsl(var(--filigree))" }}>{count}</span>
      )}
      <ChevronRight className={`h-2.5 w-2.5 transition-transform ${isOpen ? "rotate-90" : ""}`} />
    </button>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Search + Summary — compact single row */}
      <div className="px-2 py-1.5 shrink-0 flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="h-6 pl-7 text-[10px] border-border/50"
            style={{ background: "hsl(var(--surface-stone))" }}
          />
        </div>
        <span className="flex items-center gap-1 text-[9px] text-muted-foreground shrink-0">
          <Trophy className="h-2.5 w-2.5" style={{ color: "hsl(var(--filigree-glow))" }} />
          <span className="font-mono">{totalXp.toLocaleString()}</span>
        </span>
        <span className="flex items-center gap-1 text-[9px] text-muted-foreground shrink-0">
          <Flame className="h-2.5 w-2.5" style={{ color: "hsl(var(--primary))" }} />
          <span className="font-mono">{practicedCount}/{skills.length}</span>
        </span>
        <span className="flex items-center gap-0.5 shrink-0">
          {MASTERY_TIERS.map(t => (
            <span key={t.name} className="w-1.5 h-1.5 rounded-full" style={{ background: t.color }} title={`${t.name} (${t.minXp}+ XP)`} />
          ))}
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        {/* ── Skill Progress Section ── */}
        <SectionHeader id="skills" icon={ScrollText} label="Skill Progress" count={skills.length} isOpen={expandedSection === "skills"} />
        <AnimatePresence>
          {expandedSection === "skills" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {grouped.map(({ category, skills: catSkills }) => {
                const territory = getTerritory(category as FutureSkillCategory);
                const isExpanded = expandedCategories.has(category);
                const catXp = catSkills.reduce((s, sk) => s + getSkillXp(sk.id), 0);
                const catPracticed = catSkills.filter(s => getSkillXp(s.id) > 0).length;

                return (
                  <div key={category}>
                    {/* Territory header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium transition-colors hover:bg-muted/15"
                      style={{ borderBottom: "1px solid hsl(var(--border) / 0.15)" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: territory.hsl }} />
                      <span className="flex-1 text-left truncate" style={{ color: territory.hsl }}>{category}</span>
                      <span className="font-mono text-[9px] text-muted-foreground">{catPracticed}/{catSkills.length}</span>
                      {catXp > 0 && (
                        <span className="font-mono text-[9px]" style={{ color: "hsl(var(--filigree))" }}>{catXp}</span>
                      )}
                      <ChevronRight className={`h-2.5 w-2.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </button>

                    {/* Skill rows */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          {catSkills.map(skill => {
                            const xp = getSkillXp(skill.id);
                            const tier = getTier(xp);
                            const progress = getProgressToNext(xp);
                            const growth = skillGrowthMap?.get(skill.id);
                            const l2Unlocked = level2SkillIds?.has(skill.id) ?? false;
                            const isFocused = expandedSkillId === skill.id;

                            return (
                              <div
                                key={skill.id}
                                ref={el => { if (el) rowRefs.current.set(skill.id, el); }}
                                className="transition-all"
                              >
                                <div
                                  className="flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors hover:bg-muted/10"
                                  style={isFocused ? {
                                    background: "hsl(var(--filigree-glow) / 0.06)",
                                    boxShadow: "inset 2px 0 0 hsl(var(--filigree-glow))",
                                  } : undefined}
                                  onClick={() => {
                                    setExpandedSkillId(prev => prev === skill.id ? null : skill.id);
                                    onSkillClick?.(skill);
                                  }}
                                >
                                  <SkillRune skill={skill} size={14} />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[11px] font-medium text-foreground truncate block">{skill.name}</span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[9px] font-medium" style={{ color: tier.color }}>{tier.name}</span>
                                      <div className="flex-1 h-1 rounded-full overflow-hidden max-w-[60px]" style={{ background: "hsl(var(--muted) / 0.3)" }}>
                                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: tier.color }} />
                                      </div>
                                      <span className="text-[8px] font-mono text-muted-foreground">{xp}</span>
                                    </div>
                                  </div>
                                  {/* Quick launch */}
                                  <div className="shrink-0 flex items-center gap-0.5">
                                    <button
                                      onClick={e => { e.stopPropagation(); handleSkillLaunch(skill, 1); }}
                                      className="p-1 rounded transition-colors hover:bg-primary/20"
                                      title="Level 1 · AI Mastery"
                                    >
                                      <Zap className="h-3 w-3" style={{ color: (growth?.level1Xp ?? 0) > 0 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }} />
                                    </button>
                                    <button
                                      onClick={e => { e.stopPropagation(); if (l2Unlocked) handleSkillLaunch(skill, 2); }}
                                      className="p-1 rounded transition-colors hover:bg-primary/20"
                                      title={l2Unlocked ? "Level 2 · Human Edge" : "Locked"}
                                      style={{ opacity: l2Unlocked ? 1 : 0.4 }}
                                    >
                                      {l2Unlocked ? (
                                        <Diamond className="h-3 w-3" style={{ color: "hsl(45 93% 58%)" }} />
                                      ) : (
                                        <Lock className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Expanded detail */}
                                <AnimatePresence>
                                  {isFocused && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.15 }}
                                      className="px-3 pb-2 overflow-hidden"
                                    >
                                      <div
                                        className="rounded-lg p-2 mt-0.5 space-y-1.5"
                                        style={{ background: "hsl(var(--muted) / 0.08)", border: "1px solid hsl(var(--border) / 0.2)" }}
                                      >
                                        {/* L1 + L2 bars */}
                                        <div className="flex items-center gap-2">
                                          <Zap className="h-3 w-3 shrink-0" style={{ color: "hsl(var(--primary))" }} />
                                          <span className="text-[9px] w-8">L1</span>
                                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted) / 0.3)" }}>
                                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, ((growth?.level1Xp ?? 0) / 500) * 100)}%`, background: "hsl(var(--primary))" }} />
                                          </div>
                                          <span className="text-[8px] font-mono text-muted-foreground w-10 text-right">{growth?.level1Xp ?? 0}/500</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Diamond className="h-3 w-3 shrink-0" style={{ color: l2Unlocked ? "hsl(45 93% 58%)" : "hsl(var(--muted-foreground))" }} />
                                          <span className="text-[9px] w-8">L2</span>
                                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted) / 0.3)" }}>
                                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, ((growth?.level2Xp ?? 0) / 500) * 100)}%`, background: "hsl(45 93% 58%)" }} />
                                          </div>
                                          <span className="text-[8px] font-mono text-muted-foreground w-10 text-right">{growth?.level2Xp ?? 0}/500</span>
                                        </div>
                                        {/* Stats */}
                                        <div className="flex items-center gap-3 text-[9px] text-muted-foreground pt-0.5">
                                          <span>{(growth?.level1Sims ?? 0) + (growth?.level2Sims ?? 0)} quests</span>
                                          {skill.jobCount > 0 && <span>{skill.jobCount} jobs linked</span>}
                                        </div>
                                        {/* Launch button */}
                                        <button
                                          onClick={() => handleSkillLaunch(skill, l2Unlocked ? 2 : 1)}
                                          className="w-full mt-1 px-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all hover:brightness-110"
                                          style={{
                                            background: l2Unlocked
                                              ? "linear-gradient(135deg, hsl(45 93% 58%), hsl(45 93% 48%))"
                                              : "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
                                            color: l2Unlocked ? "hsl(var(--background))" : "hsl(var(--foreground))",
                                            fontFamily: "'Cinzel', serif",
                                          }}
                                        >
                                          <Swords className="h-3 w-3 inline mr-1" />
                                          {l2Unlocked ? "Boss Battle" : "Start Quest"}
                                        </button>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Battle Log Section ── */}
        <SectionHeader id="log" icon={Clock} label="Battle Log" count={battleLog.length} isOpen={expandedSection === "log"} />
        <AnimatePresence>
          {expandedSection === "log" && (
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
                  No quests completed yet. Start your first quest from the map!
                </div>
              ) : (
                <div className="divide-y divide-border/20">
                  {battleLog.map(entry => {
                    const totalXpEarned = entry.skillsEarned.reduce((s, e) => s + (e.xp || 0), 0);
                    return (
                      <div key={entry.id} className="px-3 py-2 hover:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0"
                            style={{
                              background: entry.level === 2
                                ? "hsl(45 93% 58% / 0.15)"
                                : "hsl(var(--primary) / 0.15)",
                              color: entry.level === 2
                                ? "hsl(45 93% 58%)"
                                : "hsl(var(--primary))",
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
                                  background: entry.score >= 80
                                    ? "hsl(142 60% 50% / 0.15)"
                                    : entry.score >= 60
                                    ? "hsl(45 90% 60% / 0.15)"
                                    : "hsl(0 60% 50% / 0.15)",
                                  color: entry.score >= 80
                                    ? "hsl(142 60% 50%)"
                                    : entry.score >= 60
                                    ? "hsl(45 90% 60%)"
                                    : "hsl(0 60% 50%)",
                                }}
                              >
                                {entry.score}%
                              </span>
                              {totalXpEarned > 0 && (
                                <span className="text-[9px] font-mono" style={{ color: "hsl(var(--filigree))" }}>
                                  +{totalXpEarned} XP
                                </span>
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
