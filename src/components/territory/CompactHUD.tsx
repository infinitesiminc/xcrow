/**
 * CompactHUD — Dark Fantasy RPG status bar.
 * Now uses unified progression: breadth-based Player Rank from castles + kingdoms.
 */

import { useMemo } from "react";
import { Shield, Target, Zap, Crown, Star } from "lucide-react";
import { motion } from "framer-motion";
import type { SkillXP } from "@/lib/skill-map";
import { getCastleState } from "@/lib/castle-levels";
import { getPlayerRank, PLAYER_RANKS, type KingdomTier } from "@/lib/progression";

const RANK_COLORS = [
  "hsl(var(--muted-foreground))",
  "hsl(var(--territory-analytical))",
  "hsl(var(--territory-technical))",
  "hsl(var(--territory-creative))",
  "hsl(var(--filigree-glow))",
];

const RANK_ICONS = [Shield, Shield, Crown, Crown, Star] as const;

interface CompactHUDProps {
  skills: SkillXP[];
  targetSkillIds: Set<string>;
  userName?: string;
  kingdomTiers?: KingdomTier[];
}

export default function CompactHUD({ skills, targetSkillIds, userName, kingdomTiers = [] }: CompactHUDProps) {
  const { rank, rankColor, RankIcon, claimed, total, coveragePct, castlesClaimed } = useMemo(() => {
    const castleTiers = skills.filter(s => s.xp > 0).map(s => getCastleState(s.xp).tier);
    const rank = getPlayerRank(castleTiers, kingdomTiers);
    const rankColor = RANK_COLORS[rank.index];
    const RankIcon = RANK_ICONS[rank.index];
    const claimed = skills.filter((s) => s.xp > 0 && targetSkillIds.has(s.id)).length;
    const total = targetSkillIds.size;
    const coveragePct = total > 0 ? Math.round((claimed / total) * 100) : 0;
    const castlesClaimed = castleTiers.filter(t => t !== "ruins").length;
    return { rank, rankColor, RankIcon, claimed, total, coveragePct, castlesClaimed };
  }, [skills, targetSkillIds, kingdomTiers]);

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
      {/* Rank badge */}
      <div className="flex items-center gap-1.5">
        <RankIcon className="h-3.5 w-3.5" style={{ color: rankColor }} />
        <span
          className="text-xs tracking-widest uppercase"
          style={{
            color: rankColor,
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            textShadow: `0 0 12px ${rankColor}`,
          }}
        >
          {rank.rank}
        </span>
      </div>

      {/* Filigree separator */}
      <div className="w-px h-4 opacity-30" style={{ background: "hsl(var(--filigree))" }} />

      {/* Castles + Kingdoms */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-[11px]">🏰</span>
          <span className="text-[11px] font-mono text-foreground/70">{castlesClaimed}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px]">👑</span>
          <span className="text-[11px] font-mono text-foreground/70">{kingdomTiers.length}</span>
        </div>
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
