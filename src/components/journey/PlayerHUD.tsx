/**
 * PlayerHUD — RPG Character Sheet (left panel).
 * Territory coverage, tier badge, stat rings, human edges as trophies.
 */
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck, Lock, ArrowRight, Swords, Star, Crown, Medal, Map,
} from "lucide-react";
import {
  SKILL_TAXONOMY,
  CATEGORY_META,
  type SkillXP,
} from "@/lib/skill-map";
import type { TargetRole } from "@/pages/Journey";

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
  targetRoles: TargetRole[];
  targetSkillNames: Set<string>;
}

export default function PlayerHUD({ skills, uniqueTasks, isEmpty, targetRoles, targetSkillNames }: PlayerHUDProps) {
  const navigate = useNavigate();

  const activeSkills = useMemo(() => skills.filter(s => s.xp > 0), [skills]);
  const totalXP = useMemo(() => activeSkills.reduce((sum, s) => sum + s.xp, 0), [activeSkills]);

  const tier = getTier(totalXP);
  const tierProgress = getTierProgress(totalXP);
  const TierIcon = tier.icon;
  const nextTier = tier.index < TIERS.length - 1 ? TIERS[tier.index + 1] : null;

  // Territory coverage: how many target-role skills are claimed
  const coverage = useMemo(() => {
    if (targetSkillNames.size === 0) return null;
    const claimed = activeSkills.filter(s =>
      targetSkillNames.has(s.name.toLowerCase())
    ).length;
    return { claimed, total: targetSkillNames.size, pct: Math.round((claimed / targetSkillNames.size) * 100) };
  }, [activeSkills, targetSkillNames]);

  // Human edges as trophies
  const discoveredEdges = useMemo(() =>
    activeSkills.filter(s => s.humanEdge).map(s => ({
      label: s.humanEdge!,
      skill: s.name,
      category: s.category,
    })),
    [activeSkills]
  );

  const lockedEdges = useMemo(() => {
    const activeIds = new Set(activeSkills.map(s => s.id));
    return SKILL_TAXONOMY.filter(t => t.humanEdge && !activeIds.has(t.id)).slice(0, 4);
  }, [activeSkills]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tier Badge */}
      <div className="px-4 pt-5 pb-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
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
            {nextTier && <span className="text-[9px] font-mono text-white/30">{nextTier.name} at {nextTier.threshold}</span>}
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
                style={{ background: i <= tier.index ? t.color : "hsla(0,0%,100%,0.06)", opacity: i <= tier.index ? 0.8 : 1 }}
              />
              <span className="text-[7px] font-mono" style={{ color: i <= tier.index ? t.color : "hsla(0,0%,100%,0.2)" }}>
                {t.name.slice(0, 3).toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Territory Coverage (if target roles set) */}
      {coverage && (
        <div className="mx-4 mb-3 rounded-xl px-3 py-2.5" style={{ background: "hsla(180, 30%, 15%, 0.3)", border: "1px solid hsla(180, 40%, 40%, 0.15)" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <Map className="h-3.5 w-3.5" style={{ color: "hsl(180, 45%, 50%)" }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "hsl(180, 45%, 50%)" }}>
              Territory
            </span>
            <span className="ml-auto text-[11px] font-mono font-bold" style={{ color: "hsl(180, 45%, 50%)" }}>
              {coverage.pct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsla(0,0%,100%,0.06)" }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${coverage.pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ background: "linear-gradient(90deg, hsl(180, 45%, 50%), hsl(270, 45%, 55%))" }}
            />
          </div>
          <p className="text-[9px] text-white/35 mt-1.5">
            {coverage.claimed}/{coverage.total} skills claimed for {targetRoles.length} target role{targetRoles.length > 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Target roles list */}
      {targetRoles.length > 0 && (
        <div className="px-4 pb-2 border-b border-white/5">
          <p className="text-[9px] uppercase tracking-[0.12em] text-white/30 mb-1.5 font-medium">Goal Roles</p>
          <div className="space-y-1">
            {targetRoles.map(r => (
              <div key={r.job_id} className="flex items-center gap-2 text-[10px] text-white/50">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: "hsl(270, 45%, 55%)" }} />
                <span className="truncate">{r.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Human Edges as Trophies */}
      <div className="flex-1 overflow-y-auto px-4 pb-3 min-h-0 border-t border-white/5">
        <div className="flex items-center gap-1.5 mb-2.5 mt-3">
          <ShieldCheck className="h-3.5 w-3.5" style={{ color: "hsl(270, 45%, 58%)" }} />
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/45">Edges Collected</span>
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
                <p className="text-[8px] text-white/30 truncate">{CATEGORY_META[edge.category].emoji} {edge.skill}</p>
              </div>
            </motion.div>
          ))}

          {lockedEdges.map((tax) => (
            <div key={tax.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ border: "1px dashed hsla(0,0%,100%,0.06)" }}>
              <Lock className="h-3 w-3 shrink-0 text-white/15" />
              <p className="text-[10px] text-white/20 truncate flex-1">{tax.humanEdge}</p>
            </div>
          ))}
        </div>
      </div>

      {isEmpty && (
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-medium transition-all active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, hsl(180, 40%, 42%), hsl(270, 40%, 50%))", color: "white" }}
          >
            Start Exploring <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
