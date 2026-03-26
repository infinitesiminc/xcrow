/**
 * SkillDetailDrawer — Redesigned to focus on skill mastery:
 * 1. Skill identity (name, category, demand, description)
 * 2. Full 4-tier mastery ladder visualization
 * 3. Start Quest / Boss Battle CTA
 * 4. Skill-specific recent battle log
 * 5. Related skills in same territory
 */

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { type FutureSkill, type FutureSkillCategory, useFutureSkills } from "@/hooks/use-future-skills";
import { Zap, Diamond, Lock, Swords, Clock, ArrowRight, Flame } from "lucide-react";
import { getTerritory } from "@/lib/territory-colors";
import { calculateGrowth, DIMENSION_INFO, type GrowthDimensions } from "@/lib/skill-growth";
import { getSkillRune } from "@/lib/skill-runes";
import { useAuth } from "@/contexts/AuthContext";

/* ── Skill Hero Image — direct from storage ── */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const heroImageCache = new Map<string, string>();

function useSkillHeroImage(skill: FutureSkill | null, open: boolean) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!skill || !open) { setImageUrl(null); return; }
    const url = `${SUPABASE_URL}/storage/v1/object/public/sim-images/skill-hero-${skill.id}.png`;
    if (heroImageCache.has(skill.id)) { setImageUrl(heroImageCache.get(skill.id)!); return; }
    setImageUrl(null);
    setLoading(true);
    const img = new Image();
    img.onload = () => { heroImageCache.set(skill.id, url); setImageUrl(url); setLoading(false); };
    img.onerror = () => { setImageUrl(null); setLoading(false); };
    img.src = url;
  }, [skill?.id, open]);

  return { imageUrl, loading };
}

/* ── Mastery Tiers ── */
const MASTERY_TIERS = [
  { name: "Novice", minXp: 0, color: "hsl(var(--muted-foreground))", icon: "○" },
  { name: "Apprentice", minXp: 150, color: "hsl(142 60% 50%)", icon: "◐" },
  { name: "Adept", minXp: 500, color: "hsl(210 80% 60%)", icon: "◑" },
  { name: "Master", minXp: 1200, color: "hsl(280 70% 60%)", icon: "●" },
  { name: "Grandmaster", minXp: 2500, color: "hsl(45 90% 60%)", icon: "★" },
] as const;

function getCurrentTier(xp: number) {
  for (let i = MASTERY_TIERS.length - 1; i >= 0; i--) {
    if (xp >= MASTERY_TIERS[i].minXp) return i;
  }
  return 0;
}

/* ── Battle log entry ── */
interface BattleEntry {
  id: string;
  taskName: string;
  level: number;
  score: number;
  completedAt: string;
  xpEarned: number;
}

/* ── Component Props ── */
interface SkillDetailDrawerProps {
  skill: FutureSkill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level2Unlocked?: boolean;
  level2Completed?: boolean;
  level1Xp?: number;
  level2Xp?: number;
  level1SimsCompleted?: number;
  onLaunchBoss?: () => void;
  simScores?: {
    avgToolAwareness?: number;
    avgAdaptiveThinking?: number;
    avgHumanValueAdd?: number;
    avgDomainJudgment?: number;
  };
}

export default function SkillDetailDrawer({
  skill,
  open,
  onOpenChange,
  level2Unlocked = false,
  level2Completed = false,
  level1Xp = 0,
  level2Xp = 0,
  level1SimsCompleted = 0,
  onLaunchBoss,
  simScores,
}: SkillDetailDrawerProps) {
  const { user } = useAuth();
  const [battleLog, setBattleLog] = useState<BattleEntry[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const { futureSkills: allSkills } = useFutureSkills();

  // Focus skill event
  useEffect(() => {
    if (!skill || !open) return;
    window.dispatchEvent(
      new CustomEvent("focus_skill", {
        detail: { skillId: skill.id, skillName: skill.name, category: skill.category },
      })
    );
  }, [skill, open]);

  // Load skill-specific battle log
  useEffect(() => {
    if (!skill || !open || !user) { setBattleLog([]); return; }
    setLogLoading(true);
    supabase
      .from("completed_simulations")
      .select("id, task_name, sim_level, tool_awareness_score, human_value_add_score, adaptive_thinking_score, domain_judgment_score, skills_earned, completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!data) { setBattleLog([]); setLogLoading(false); return; }
        // Filter to entries that earned XP for this skill
        const entries: BattleEntry[] = [];
        for (const d of data) {
          const earned = Array.isArray(d.skills_earned) ? (d.skills_earned as any[]) : [];
          const match = earned.find((e: any) => (e.skillId || e.skill_id) === skill.id);
          if (match) {
            entries.push({
              id: d.id,
              taskName: d.task_name,
              level: (d as any).sim_level ?? 1,
              score: Math.round(
                ((d.tool_awareness_score || 0) + (d.human_value_add_score || 0) +
                  (d.adaptive_thinking_score || 0) + (d.domain_judgment_score || 0)) / 4
              ),
              completedAt: d.completed_at,
              xpEarned: match.xp || 0,
            });
          }
          if (entries.length >= 5) break;
        }
        setBattleLog(entries);
        setLogLoading(false);
      });
  }, [skill?.id, open, user]);

  // Related skills in same territory
  const relatedSkills = useMemo(() => {
    if (!skill) return [];
    return allSkills
      .filter(s => s.category === skill.category && s.id !== skill.id)
      .slice(0, 5);
  }, [skill, allSkills]);

  const territory = skill ? getTerritory(skill.category as FutureSkillCategory) : null;
  const { imageUrl: heroImage, loading: heroLoading } = useSkillHeroImage(skill, open);
  const totalXp = level1Xp + level2Xp;
  const currentTierIdx = getCurrentTier(totalXp);
  const demandTier = skill
    ? (skill.demandCount >= 12 ? "🔥 High Demand" : skill.demandCount >= 5 ? "📈 Growing" : "🌱 Emerging")
    : "";

  if (!skill || !territory) return null;

  const growth = calculateGrowth(skill.avgRelevance ?? 50, totalXp, simScores);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[380px] sm:w-[420px] overflow-y-auto p-0"
        style={{
          background: "hsl(var(--surface-stone))",
          borderLeft: "1px solid hsl(var(--filigree) / 0.2)",
        }}
      >
        {/* ── Hero Banner ── */}
        <div className="relative w-full h-36 overflow-hidden shrink-0" style={{ isolation: "isolate" }}>
          {heroImage ? (
            <img
              src={heroImage}
              alt={`${skill.name} illustration`}
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.4) saturate(1.1)" }}
            />
          ) : heroLoading ? (
            <div className="w-full h-full animate-pulse" style={{ background: `linear-gradient(135deg, hsl(var(--surface-stone)), hsl(var(--muted) / 0.3))` }} />
          ) : (
            <div className="w-full h-full" style={{ background: `linear-gradient(135deg, hsl(var(--surface-stone)), hsl(var(--muted) / 0.2))` }} />
          )}

          {/* Three-ring overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-[2]">
            <ThreeRingDisplay growth={growth} />
          </div>

          <div className="absolute inset-x-0 bottom-0 h-12 z-[3]" style={{ background: `linear-gradient(to top, hsl(var(--surface-stone)), transparent)` }} />
        </div>

        {/* ── Header ── */}
        <div className="px-5 pt-2 pb-3" style={{ borderBottom: "1px solid hsl(var(--filigree) / 0.12)" }}>
          <SheetHeader className="pb-0">
            <div className="flex items-center gap-3">
              {/* Rune icon */}
              <div
                className="relative flex items-center justify-center shrink-0"
                style={{
                  width: 44, height: 44,
                  background: level2Unlocked
                    ? "linear-gradient(135deg, hsl(45 40% 15%), hsl(45 30% 20%))"
                    : `linear-gradient(135deg, hsl(var(--surface-stone)), hsl(var(--muted)))`,
                  border: level2Unlocked
                    ? "2px solid hsl(45 60% 50%)"
                    : `2px solid hsl(var(--filigree) / 0.3)`,
                  borderRadius: level2Unlocked ? "4px" : "50%",
                  transform: level2Unlocked ? "rotate(45deg)" : "none",
                }}
              >
                <svg viewBox="-7 -7 14 14" width={22} height={22} style={{ transform: level2Unlocked ? "rotate(-45deg)" : "none" }}>
                  <path d={getSkillRune(skill.id, skill.category)} fill="none" stroke={territory.hsl} strokeWidth={0.9} />
                </svg>
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-base leading-tight" style={{ fontFamily: "'Cinzel', serif" }}>
                  {skill.name}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide"
                    style={{ color: territory.hsl, border: `1px solid ${territory.hsl}` }}
                  >
                    {skill.category}
                  </span>
                  <span className="text-[9px] text-muted-foreground">{demandTier}</span>
                </div>
              </div>
            </div>
            <SheetDescription className="sr-only">Details for {skill.name}</SheetDescription>
          </SheetHeader>

          {skill.description && (
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{skill.description}</p>
          )}
        </div>

        <div className="px-5 py-3 space-y-4">
          {/* ── Full Mastery Ladder ── */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
              Mastery Ladder
            </h3>
            <div className="space-y-0">
              {MASTERY_TIERS.map((tier, i) => {
                const isReached = i <= currentTierIdx;
                const isCurrent = i === currentTierIdx;
                const isNext = i === currentTierIdx + 1;
                const nextTier = MASTERY_TIERS[i + 1];
                const progressInTier = isCurrent && nextTier
                  ? Math.min(100, Math.round(((totalXp - tier.minXp) / (nextTier.minXp - tier.minXp)) * 100))
                  : isCurrent ? 100 : 0;

                return (
                  <div key={tier.name} className="flex items-stretch gap-2.5">
                    {/* Vertical line + node */}
                    <div className="flex flex-col items-center w-5 shrink-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0 flex items-center justify-center text-[7px] font-bold z-10"
                        style={{
                          background: isReached ? tier.color : "hsl(var(--muted) / 0.3)",
                          border: isCurrent ? `2px solid ${tier.color}` : "none",
                          boxShadow: isCurrent ? `0 0 8px ${tier.color}60` : "none",
                        }}
                      >
                        {isReached && <span style={{ color: "hsl(var(--background))" }}>{tier.icon === "★" ? "★" : ""}</span>}
                      </div>
                      {i < MASTERY_TIERS.length - 1 && (
                        <div
                          className="w-0.5 flex-1 min-h-[16px]"
                          style={{
                            background: isReached && i < currentTierIdx
                              ? tier.color
                              : "hsl(var(--muted) / 0.15)",
                          }}
                        />
                      )}
                    </div>

                    {/* Tier info */}
                    <div className={`pb-2 flex-1 min-w-0 ${i < MASTERY_TIERS.length - 1 ? "" : ""}`}>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[11px] font-bold"
                          style={{ color: isReached ? tier.color : "hsl(var(--muted-foreground) / 0.5)", fontFamily: "'Cinzel', serif" }}
                        >
                          {tier.name}
                        </span>
                        <span className="text-[8px] font-mono text-muted-foreground">{tier.minXp}+ XP</span>
                        {isCurrent && (
                          <span className="text-[8px] px-1 py-0.5 rounded font-bold" style={{ background: `${tier.color}20`, color: tier.color }}>
                            CURRENT
                          </span>
                        )}
                      </div>
                      {isCurrent && nextTier && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted) / 0.2)" }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${progressInTier}%`, background: tier.color }} />
                          </div>
                          <span className="text-[8px] font-mono text-muted-foreground">{totalXp}/{nextTier.minXp}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── CTA: Start Quest / Boss Battle ── */}
          <div className="space-y-2">
            {/* L1 + L2 XP summary line */}
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" style={{ color: "hsl(var(--primary))" }} />
                L1: {level1Xp} XP · {level1SimsCompleted} quests
              </span>
              {level2Unlocked && (
                <span className="flex items-center gap-1">
                  <Diamond className="h-3 w-3" style={{ color: "hsl(45 93% 58%)" }} />
                  L2: {level2Xp} XP
                </span>
              )}
            </div>

            {level2Completed ? (
              <div
                className="rounded-lg p-3 flex items-center gap-3"
                style={{
                  background: "linear-gradient(135deg, hsl(45 30% 15%), hsl(45 20% 10%))",
                  border: "1.5px solid hsl(45 70% 50%)",
                }}
              >
                <span className="text-lg">👑</span>
                <div>
                  <p className="text-xs font-bold" style={{ fontFamily: "'Cinzel', serif", color: "hsl(45 93% 58%)" }}>Boss Conquered</p>
                  <p className="text-[10px] text-muted-foreground">Human Edge mastered</p>
                </div>
              </div>
            ) : level2Unlocked && onLaunchBoss ? (
              <motion.button
                onClick={onLaunchBoss}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full rounded-lg p-3 text-left flex items-center gap-3 group"
                style={{
                  background: "linear-gradient(135deg, hsl(45 30% 12%), hsl(280 30% 12%))",
                  border: "1.5px solid hsl(45 60% 50% / 0.5)",
                  boxShadow: "0 0 20px hsl(45 93% 58% / 0.1)",
                }}
              >
                <Swords className="h-5 w-5 shrink-0" style={{ color: "hsl(45 93% 58%)" }} />
                <div className="min-w-0">
                  <p className="text-xs font-bold" style={{ fontFamily: "'Cinzel', serif", color: "hsl(45 93% 58%)" }}>Boss Battle</p>
                  <p className="text-[10px] text-muted-foreground">Strategic oversight audit</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-amber-400 shrink-0 ml-auto group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
            ) : (
              <motion.button
                onClick={() => {
                  onOpenChange(false);
                  // Dispatch launch for L1
                  window.dispatchEvent(new CustomEvent("launch_skill_sim", {
                    detail: { skillId: skill.id, skillName: skill.name, level: 1 },
                  }));
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider relative overflow-hidden group"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
                  color: "hsl(var(--foreground))",
                  boxShadow: "0 4px 16px hsl(var(--primary) / 0.3)",
                  fontFamily: "'Cinzel', serif",
                  border: "1px solid hsl(var(--primary) / 0.4)",
                }}
              >
                <Swords className="h-3.5 w-3.5 inline mr-1.5" />
                Start Quest
              </motion.button>
            )}
          </div>

          <Separator style={{ background: "hsl(var(--filigree) / 0.1)" }} />

          {/* ── Skill Battle Log ── */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5 mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
              <Clock className="h-3 w-3" />
              Recent Quests
            </h3>
            {logLoading ? (
              <div className="space-y-1.5">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full rounded" />)}
              </div>
            ) : battleLog.length === 0 ? (
              <p className="text-[10px] text-muted-foreground italic py-2 text-center">
                No quests completed yet for this skill.
              </p>
            ) : (
              <div className="space-y-1">
                {battleLog.map(entry => (
                  <div key={entry.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md" style={{ background: "hsl(var(--muted) / 0.1)" }}>
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                      style={{
                        background: entry.level === 2 ? "hsl(45 93% 58% / 0.15)" : "hsl(var(--primary) / 0.15)",
                        color: entry.level === 2 ? "hsl(45 93% 58%)" : "hsl(var(--primary))",
                      }}
                    >
                      {entry.level === 2 ? <Diamond className="h-2.5 w-2.5" /> : <Zap className="h-2.5 w-2.5" />}
                    </div>
                    <span className="text-[10px] text-foreground truncate flex-1">{entry.taskName}</span>
                    <span
                      className="text-[9px] font-mono px-1 rounded"
                      style={{
                        background: entry.score >= 80 ? "hsl(142 60% 50% / 0.15)" : entry.score >= 60 ? "hsl(45 90% 60% / 0.15)" : "hsl(0 60% 50% / 0.15)",
                        color: entry.score >= 80 ? "hsl(142 60% 50%)" : entry.score >= 60 ? "hsl(45 90% 60%)" : "hsl(0 60% 50%)",
                      }}
                    >
                      {entry.score}%
                    </span>
                    {entry.xpEarned > 0 && (
                      <span className="text-[8px] font-mono" style={{ color: "hsl(var(--filigree))" }}>+{entry.xpEarned}</span>
                    )}
                    <span className="text-[8px] text-muted-foreground shrink-0">{formatTime(entry.completedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Related Skills ── */}
          {relatedSkills.length > 0 && (
            <>
              <Separator style={{ background: "hsl(var(--filigree) / 0.1)" }} />
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5 mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
                  <Flame className="h-3 w-3" style={{ color: territory.hsl }} />
                  {skill.category} Territory
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {relatedSkills.map(rs => {
                    const t = getTerritory(rs.category as FutureSkillCategory);
                    return (
                      <button
                        key={rs.id}
                        onClick={() => {
                          // Re-open drawer for this skill
                          window.dispatchEvent(new CustomEvent("open_skill_drawer", { detail: { skillId: rs.id } }));
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        style={{ background: "hsl(var(--muted) / 0.12)", border: "1px solid hsl(var(--border) / 0.15)" }}
                      >
                        <svg viewBox="-7 -7 14 14" width={12} height={12} className="shrink-0">
                          <path d={getSkillRune(rs.id, rs.category)} fill="none" stroke={t.hsl} strokeWidth={0.9} />
                        </svg>
                        <span className="truncate max-w-[100px]">{rs.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Three-Ring Growth Display ── */
function ThreeRingDisplay({ growth }: { growth: GrowthDimensions }) {
  const size = 100;
  const center = size / 2;
  const rings = [
    { r: 44, score: growth.foundation.tier === "widely_taught" ? 80 : growth.foundation.tier === "growing" ? 50 : 20, color: "hsl(var(--muted-foreground))", status: growth.foundation.label },
    { r: 35, score: growth.aiMastery.score, color: "hsl(var(--primary))", status: growth.aiMastery.label },
    { r: 26, score: growth.humanEdge.score, color: "hsl(45 93% 58%)", status: growth.humanEdge.label },
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((ring, i) => {
        const circ = 2 * Math.PI * ring.r;
        const filled = (ring.score / 100) * circ;
        return (
          <g key={i}>
            <circle cx={center} cy={center} r={ring.r} fill="none" stroke="white" strokeWidth={2.5} opacity={0.06} />
            <motion.circle
              cx={center} cy={center} r={ring.r}
              fill="none" stroke={ring.color} strokeWidth={2.5} strokeLinecap="round"
              strokeDasharray={`${filled} ${circ - filled}`}
              strokeDashoffset={circ * 0.25}
              initial={{ strokeDasharray: `0 ${circ}` }}
              animate={{ strokeDasharray: `${filled} ${circ - filled}` }}
              transition={{ duration: 1, delay: 0.3 + i * 0.15, ease: "easeOut" }}
              style={{ filter: ring.score >= 40 ? `drop-shadow(0 0 3px ${ring.color})` : "none" }}
            />
          </g>
        );
      })}
      <text x={center} y={center - 2} textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: "16px", fontWeight: 700, fill: "white", fontFamily: "'Cinzel', serif" }}>
        {growth.filledRings}/3
      </text>
      <text x={center} y={center + 10} textAnchor="middle"
        style={{ fontSize: "7px", fill: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        Rings
      </text>
    </svg>
  );
}

/* ── Utils ── */
function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
