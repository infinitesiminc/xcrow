/**
 * PlayerHUD — RPG Character Sheet (left panel).
 * Tier badge, stat rings, human edges list.
 */
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck, Lock, ArrowRight, Swords, Star, Crown, Medal,
} from "lucide-react";
import {
  SKILL_TAXONOMY,
  CATEGORY_META,
  type SkillXP,
} from "@/lib/skill-map";

/* ── Tier system based on total XP ── */
const TIERS = [
  { name: "Recruit", threshold: 0, icon: Swords, color: "hsl(215, 20%, 55%)" },
  { name: "Specialist", threshold: 500, icon: Medal, color: "hsl(180, 45%, 50%)" },
  { name: "Expert", threshold: 1500, icon: Star, color: "hsl(45, 70%, 55%)" },
  { name: "Leader", threshold: 4000, icon: Crown, color: "hsl(270, 50%, 60%)" },
] as const;

function getTier(xp: number) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (xp >= TIERS[i].threshold) return { ...TIERS[i], index: i };
  }
  return { ...TIERS[0], index: 0 };
}

function getTierProgress(xp: number) {
  const tier = getTier(xp);
  if (tier.index >= TIERS.length - 1) return 100;
  const next = TIERS[tier.index + 1];
  return Math.round(((xp - tier.threshold) / (next.threshold - tier.threshold)) * 100);
}

interface PlayerHUDProps {
  skills: SkillXP[];
  uniqueTasks: number;
  isEmpty: boolean;
}

export default function PlayerHUD({ skills, uniqueTasks, isEmpty }: PlayerHUDProps) {
  const navigate = useNavigate();

  const activeSkills = useMemo(() => skills.filter(s => s.xp > 0), [skills]);
  const totalXP = useMemo(() => activeSkills.reduce((sum, s) => sum + s.xp, 0), [activeSkills]);
  const leveledUp = useMemo(() => activeSkills.filter(s => s.levelIndex >= 1).length, [activeSkills]);

  const tier = getTier(totalXP);
  const tierProgress = getTierProgress(totalXP);
  const TierIcon = tier.icon;
  const nextTier = tier.index < TIERS.length - 1 ? TIERS[tier.index + 1] : null;

  // Human edges
  const discoveredEdges = useMemo(() =>
    activeSkills.filter(s => s.humanEdge).map(s => ({
      label: s.humanEdge!,
      skill: s.name,
      category: s.category,
      levelIndex: s.levelIndex,
    })),
    [activeSkills]
  );

  const lockedEdges = useMemo(() => {
    const activeIds = new Set(activeSkills.map(s => s.id));
    return SKILL_TAXONOMY
      .filter(t => t.humanEdge && !activeIds.has(t.id))
      .slice(0, 4);
  }, [activeSkills]);

  // Stat ring SVG helper
  const ringSize = 44;
  const ringStroke = 3;
  const ringR = (ringSize - ringStroke) / 2;
  const ringCircum = 2 * Math.PI * ringR;

  const stats = [
    { label: "Skills", value: activeSkills.length, max: SKILL_TAXONOMY.length, color: "hsl(180, 45%, 50%)" },
    { label: "Leveled", value: leveledUp, max: Math.max(activeSkills.length, 1), color: "hsl(270, 45%, 58%)" },
    { label: "Tasks", value: uniqueTasks, max: Math.max(uniqueTasks, 10), color: "hsl(330, 45%, 55%)" },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Tier Badge ── */}
      <div className="px-4 pt-5 pb-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${tier.color}, transparent)`,
              border: `1.5px solid ${tier.color}`,
              boxShadow: `0 0 14px ${tier.color}33`,
            }}
          >
            <TierIcon className="h-5 w-5" style={{ color: tier.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium">Rank</p>
            <p className="text-sm font-bold text-white/90">{tier.name}</p>
          </div>
        </motion.div>

        {/* Tier progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-mono text-white/40">{totalXP} XP</span>
            {nextTier && (
              <span className="text-[9px] font-mono text-white/30">{nextTier.name} at {nextTier.threshold}</span>
            )}
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsla(0,0%,100%,0.06)" }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${tierProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ background: `linear-gradient(90deg, ${tier.color}, ${tier.color}88)` }}
            />
          </div>
        </div>

        {/* Tier ladder */}
        <div className="flex items-center gap-1 mt-3">
          {TIERS.map((t, i) => (
            <div key={t.name} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="h-1 w-full rounded-full"
                style={{
                  background: i <= tier.index ? t.color : "hsla(0,0%,100%,0.06)",
                  opacity: i <= tier.index ? 0.8 : 1,
                }}
              />
              <span
                className="text-[7px] font-mono"
                style={{ color: i <= tier.index ? t.color : "hsla(0,0%,100%,0.2)" }}
              >
                {t.name.slice(0, 3).toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stat Rings ── */}
      <div className="flex items-center justify-center gap-4 px-4 py-3 border-t border-white/5">
        {stats.map(stat => {
          const pct = stat.max > 0 ? Math.min(stat.value / stat.max, 1) : 0;
          return (
            <div key={stat.label} className="flex flex-col items-center">
              <svg width={ringSize} height={ringSize} className="-rotate-90">
                <circle cx={ringSize/2} cy={ringSize/2} r={ringR} fill="none"
                  stroke="hsla(0,0%,100%,0.06)" strokeWidth={ringStroke} />
                <motion.circle
                  cx={ringSize/2} cy={ringSize/2} r={ringR} fill="none"
                  stroke={stat.color} strokeWidth={ringStroke}
                  strokeLinecap="round"
                  strokeDasharray={ringCircum}
                  initial={{ strokeDashoffset: ringCircum }}
                  animate={{ strokeDashoffset: ringCircum * (1 - pct) }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </svg>
              <span className="text-[11px] font-bold font-mono text-white/80 -mt-[30px] mb-3">{stat.value}</span>
              <span className="text-[7px] uppercase tracking-wider text-white/35">{stat.label}</span>
            </div>
          );
        })}
      </div>

      {/* ── Human Edges ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-3 min-h-0 border-t border-white/5">
        <div className="flex items-center gap-1.5 mb-2.5 mt-3">
          <ShieldCheck className="h-3.5 w-3.5" style={{ color: "hsl(270, 45%, 58%)" }} />
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/45">Human Edges</span>
          <span className="ml-auto text-[9px] font-mono text-white/25">
            {discoveredEdges.length}/{discoveredEdges.length + lockedEdges.length}
          </span>
        </div>

        <div className="space-y-1.5">
          {discoveredEdges.map((edge, i) => (
            <motion.div
              key={edge.label}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.04 }}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2"
              style={{ background: "hsla(240, 10%, 14%, 0.6)", border: "1px solid hsla(270, 30%, 40%, 0.15)" }}
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(270, 45%, 58%)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-white/70 truncate">{edge.label}</p>
                <p className="text-[8px] text-white/30 truncate">
                  {CATEGORY_META[edge.category].emoji} {edge.skill}
                </p>
              </div>
            </motion.div>
          ))}

          {lockedEdges.map((tax) => (
            <div
              key={tax.id}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2"
              style={{ border: "1px dashed hsla(0,0%,100%,0.06)" }}
            >
              <Lock className="h-3 w-3 shrink-0 text-white/15" />
              <p className="text-[10px] text-white/20 truncate flex-1">{tax.humanEdge}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA if empty */}
      {isEmpty && (
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-medium transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, hsl(180, 40%, 42%), hsl(270, 40%, 50%))",
              color: "white",
            }}
          >
            Start Exploring <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
