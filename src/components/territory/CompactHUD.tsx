/**
 * CompactHUD — Dark Fantasy RPG status bar.
 * Now uses unified progression: breadth-based Player Rank from castles + kingdoms.
 * Includes D1–D5 Automation Degree readiness meter.
 */

import { useMemo } from "react";
import { Shield, Target, Crown, Star, Gauge } from "lucide-react";
import { motion } from "framer-motion";
import type { SkillXP } from "@/lib/skill-map";
import { getCastleState } from "@/lib/castle-levels";
import { getPlayerRank, type KingdomTier } from "@/lib/progression";
import { AUTOMATION_DEGREES, type AutomationDegree } from "@/lib/automation-degree";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

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
  /** Average automation degree level (1–5) from completed sims */
  avgDegreeLevel?: number;
}

export default function CompactHUD({ skills, targetSkillIds, userName, kingdomTiers = [], avgDegreeLevel }: CompactHUDProps) {
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

  const currentDegree: AutomationDegree = useMemo(() => {
    const lvl = Math.max(1, Math.min(5, Math.round(avgDegreeLevel || 1)));
    return AUTOMATION_DEGREES[lvl - 1];
  }, [avgDegreeLevel]);

  const degreeProgress = ((avgDegreeLevel || 1) / 5) * 100;

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-4 px-4 py-2"
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
            <Shield className="h-3 w-3" style={{ color: "hsl(var(--muted-foreground))" }} />
            <span className="text-[11px] font-mono text-foreground/70">{castlesClaimed}</span>
          </div>
          <div className="flex items-center gap-1">
            <Crown className="h-3 w-3" style={{ color: "hsl(var(--filigree-glow))" }} />
            <span className="text-[11px] font-mono text-foreground/70">{kingdomTiers.length}</span>
          </div>
        </div>

        {/* D1–D5 Degree Meter */}
        <div className="w-px h-4 opacity-30" style={{ background: "hsl(var(--filigree))" }} />
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-help">
              <Gauge className="h-3 w-3" style={{ color: `hsl(${currentDegree.hue} 70% 55%)` }} />
              <div className="flex items-center gap-1">
                {AUTOMATION_DEGREES.map((d) => {
                  const isActive = d.level <= currentDegree.level;
                  const isCurrent = d.level === currentDegree.level;
                  return (
                    <div
                      key={d.code}
                      className="relative"
                      style={{
                        width: 10,
                        height: 14,
                        borderRadius: 2,
                        background: isActive
                          ? `hsl(${d.hue} 70% ${isCurrent ? 55 : 35}%)`
                          : "hsl(var(--muted))",
                        transition: "background 0.3s",
                        boxShadow: isCurrent ? `0 0 6px hsl(${d.hue} 70% 55% / 0.6)` : "none",
                      }}
                    />
                  );
                })}
              </div>
              <span
                className="text-[10px] font-mono"
                style={{ color: `hsl(${currentDegree.hue} 70% 55%)` }}
              >
                {currentDegree.code}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px]">
            <p className="font-semibold text-xs">{currentDegree.code}: {currentDegree.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{currentDegree.description}</p>
            <div className="mt-1.5 w-full h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${degreeProgress}%`,
                  background: `hsl(${currentDegree.hue} 70% 55%)`,
                }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Your AI readiness level based on quest performance</p>
          </TooltipContent>
        </Tooltip>

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
                  {claimed}/{total}
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
    </TooltipProvider>
  );
}
