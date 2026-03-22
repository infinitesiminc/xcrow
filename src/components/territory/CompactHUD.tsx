/**
 * CompactHUD — Dark Fantasy RPG status bar.
 * Stone-textured bar with Cinzel typography, filigree borders, and territory-colored stats.
 */

import { useMemo } from "react";
import { Shield, Target, Zap, Crown, Star } from "lucide-react";
import { motion } from "framer-motion";
import type { SkillXP } from "@/lib/skill-map";

const TIERS = [
  { name: "Recruit", minXP: 0, icon: Shield },
  { name: "Explorer", minXP: 500, icon: Shield },
  { name: "Strategist", minXP: 3000, icon: Crown },
  { name: "Commander", minXP: 10000, icon: Crown },
  { name: "Legend", minXP: 30000, icon: Star },
] as const;

const TIER_COLORS = [
  "hsl(var(--muted-foreground))",
  "hsl(var(--territory-analytical))",
  "hsl(var(--territory-technical))",
  "hsl(var(--territory-creative))",
  "hsl(var(--filigree-glow))",
];

function getTierIndex(xp: number) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (xp >= TIERS[i].minXP) return i;
  }
  return 0;
}

interface CompactHUDProps {
  skills: SkillXP[];
  targetSkillIds: Set<string>;
  userName?: string;
}

export default function CompactHUD({ skills, targetSkillIds, userName }: CompactHUDProps) {
  const { totalXP, tierIdx, claimed, total, coveragePct, castlesClaimed } = useMemo(() => {
    const totalXP = skills.reduce((sum, s) => sum + s.xp, 0);
    const tierIdx = getTierIndex(totalXP);
    const claimed = skills.filter((s) => s.xp > 0 && targetSkillIds.has(s.id)).length;
    const total = targetSkillIds.size;
    const coveragePct = total > 0 ? Math.round((claimed / total) * 100) : 0;
    const castlesClaimed = skills.filter(s => s.xp >= 150).length;
    return { totalXP, tierIdx, claimed, total, coveragePct, castlesClaimed };
  }, [skills, targetSkillIds]);

  const tier = TIERS[tierIdx];
  const tierColor = TIER_COLORS[tierIdx];
  const TierIcon = tier.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-5 px-5 py-2"
      style={{
        background: "hsl(var(--surface-stone))",
        borderBottom: "1px solid hsl(var(--filigree) / 0.3)",
        boxShadow: "inset 0 -1px 0 hsl(var(--emboss-light)), 0 2px 8px hsl(var(--emboss-shadow))",
      }}
    >
      {/* Tier badge */}
      <div className="flex items-center gap-1.5">
        <TierIcon className="h-3.5 w-3.5" style={{ color: tierColor }} />
        <span
          className="text-xs tracking-widest uppercase"
          style={{
            color: tierColor,
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            textShadow: `0 0 12px ${tierColor}`,
          }}
        >
          {tier.name}
        </span>
      </div>

      {/* Filigree separator */}
      <div className="w-px h-4 opacity-30" style={{ background: "hsl(var(--filigree))" }} />

      {/* XP */}
      <div className="flex items-center gap-1.5">
        <Zap className="h-3 w-3" style={{ color: "hsl(var(--filigree-glow))" }} />
        <span
          className="text-[11px] font-mono"
          style={{ color: "hsl(var(--filigree-glow))", textShadow: "0 0 6px hsl(var(--filigree-glow) / 0.4)" }}
        >
          {totalXP.toLocaleString()} XP
        </span>
      </div>

      {/* Filigree separator */}
      <div className="w-px h-4 opacity-30" style={{ background: "hsl(var(--filigree))" }} />

      {/* Castles */}
      <div className="flex items-center gap-1">
        <span className="text-[11px]">🏰</span>
        <span className="text-[11px] font-mono text-foreground/70">{castlesClaimed} castles</span>
      </div>

      {/* Territory coverage */}
      {total > 0 && (
        <>
          <div className="w-px h-4 opacity-30" style={{ background: "hsl(var(--filigree))" }} />
          <div className="flex items-center gap-1.5">
            <Target className="h-3 w-3" style={{ color: "hsl(var(--territory-communication))" }} />
            <div className="flex items-center gap-1.5">
              <div
                className="w-16 h-1.5 rounded-full overflow-hidden"
                style={{ background: "hsl(var(--muted))" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "hsl(var(--territory-communication))" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${coveragePct}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {claimed}/{total} territory
              </span>
            </div>
          </div>
        </>
      )}

      {userName && (
        <span
          className="text-[11px] ml-auto truncate max-w-[100px]"
          style={{
            color: "hsl(var(--filigree))",
            fontFamily: "'Cinzel', serif",
            letterSpacing: "0.05em",
          }}
        >
          {userName}
        </span>
      )}
    </motion.div>
  );
}
