/**
 * TerritoryGrid — visual hex-inspired skill map with 3-ring growth model.
 *
 * Every skill shows 3 growth dimensions:
 *   🎓 Foundation — core knowledge (coverage tier from curricula)
 *   ⚡ AI Mastery  — how AI reshapes this skill
 *   ✦  Human Edge — what AI can't replace
 *
 * Modes:
 *  - demo: all tiles start dim; `highlightedSkillIds` lights them up
 *  - real: reads from SkillXP data with dimension scores
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Flame, Sparkles } from "lucide-react";
import {
  SKILL_TAXONOMY,
  CATEGORY_META,
  type SkillCategory,
  type SkillXP,
  type TaxonomySkill,
} from "@/lib/skill-map";
import { calculateGrowth, DIMENSION_INFO, type GrowthDimensions } from "@/lib/skill-growth";
import GrowthRings from "./GrowthRings";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Category colors using spectrum tokens
const CATEGORY_COLORS: Record<SkillCategory, string> = {
  technical: "hsl(var(--spectrum-0))",
  analytical: "hsl(var(--spectrum-3))",
  communication: "hsl(var(--spectrum-2))",
  leadership: "hsl(var(--spectrum-4))",
  creative: "hsl(var(--spectrum-6))",
  compliance: "hsl(var(--spectrum-1))",
};

const CATEGORY_BG: Record<SkillCategory, string> = {
  technical: "hsl(var(--spectrum-0) / 0.15)",
  analytical: "hsl(var(--spectrum-3) / 0.15)",
  communication: "hsl(var(--spectrum-2) / 0.15)",
  leadership: "hsl(var(--spectrum-4) / 0.15)",
  creative: "hsl(var(--spectrum-6) / 0.15)",
  compliance: "hsl(var(--spectrum-1) / 0.15)",
};

type TileState = "claimed" | "frontier" | "undiscovered" | "contested" | "demo-lit" | "demo-dim";

interface TileData {
  skill: TaxonomySkill;
  state: TileState;
  xp?: number;
  level?: string;
  growth: GrowthDimensions;
}

interface TerritoryGridProps {
  skills?: SkillXP[];
  targetSkillIds?: Set<string>;
  demoMode?: boolean;
  highlightedSkillIds?: Set<string>;
  onTileClick?: (skillId: string, skillName: string) => void;
}

export default function TerritoryGrid({
  skills,
  targetSkillIds,
  demoMode = false,
  highlightedSkillIds,
  onTileClick,
}: TerritoryGridProps) {
  const tiles = useMemo<TileData[]>(() => {
    if (demoMode) {
      return SKILL_TAXONOMY.map((skill) => ({
        skill,
        state: highlightedSkillIds?.has(skill.id) ? "demo-lit" as const : "demo-dim" as const,
        growth: calculateGrowth(skill.aiExposure, 0),
      }));
    }

    const skillMap = new Map(skills?.map((s) => [s.id, s]));
    const claimedIds = new Set(skills?.filter((s) => s.xp > 0).map((s) => s.id) || []);

    return SKILL_TAXONOMY.map((skill) => {
      const sx = skillMap.get(skill.id);
      const hasClaimed = claimedIds.has(skill.id);
      const isTarget = targetSkillIds?.has(skill.id) ?? false;

      let state: TileState;
      if (hasClaimed) {
        state = "claimed";
      } else if (isTarget) {
        state = "contested";
      } else {
        const hasClaimedInCategory = skills?.some(
          (s) => s.category === skill.category && s.xp > 0
        );
        state = hasClaimedInCategory || !targetSkillIds?.size ? "frontier" : "undiscovered";
      }

      return {
        skill,
        state,
        xp: sx?.xp ?? 0,
        level: sx?.level,
        growth: calculateGrowth(skill.aiExposure, sx?.xp ?? 0, sx ? {
          avgToolAwareness: sx.avgToolAwareness,
          avgAdaptiveThinking: sx.avgAdaptiveThinking,
          avgHumanValueAdd: sx.avgHumanValueAdd,
          avgDomainJudgment: sx.avgDomainJudgment,
        } : undefined),
      };
    });
  }, [skills, targetSkillIds, demoMode, highlightedSkillIds]);

  const grouped = useMemo(() => {
    const groups: Record<SkillCategory, TileData[]> = {
      technical: [], analytical: [], communication: [],
      leadership: [], creative: [], compliance: [],
    };
    tiles.forEach((t) => groups[t.skill.category].push(t));
    return groups;
  }, [tiles]);

  const categoryOrder: SkillCategory[] = [
    "technical", "analytical", "communication",
    "leadership", "creative", "compliance",
  ];

  const litCount = tiles.filter(
    (t) => t.state === "claimed" || t.state === "demo-lit"
  ).length;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-full flex flex-col p-4 overflow-y-auto scrollbar-thin">
        {/* Territory stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Skill Territory
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {litCount}/{tiles.length} discovered
          </span>
        </div>

        {/* Category clusters */}
        <div className="flex-1 grid grid-cols-2 gap-3">
          {categoryOrder.map((cat) => (
            <div
              key={cat}
              className="rounded-xl border border-border/50 p-3 space-y-2"
              style={{ background: CATEGORY_BG[cat] }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{CATEGORY_META[cat].emoji}</span>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: CATEGORY_COLORS[cat] }}
                >
                  {CATEGORY_META[cat].label}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <AnimatePresence>
                  {grouped[cat].map((tile) => (
                    <SkillTile
                      key={tile.skill.id}
                      tile={tile}
                      color={CATEGORY_COLORS[cat]}
                      onClick={() =>
                        onTileClick?.(tile.skill.id, tile.skill.name)
                      }
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-3 space-y-2">
          {/* State legend */}
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { label: "Claimed", dot: "bg-primary" },
              { label: "Frontier", dot: "border border-muted-foreground/40 border-dashed" },
              { label: "In Demand", dot: "bg-warning" },
              { label: "Locked", dot: "bg-muted" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${l.dot}`} />
                <span className="text-[10px] text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
          {/* Growth dimension legend */}
          <div className="flex items-center justify-center gap-4 pt-1 border-t border-border/30">
            <span className="text-[9px] text-muted-foreground/70 uppercase tracking-widest">Growth Layers</span>
            {Object.entries(DIMENSION_INFO).map(([key, dim]) => (
              <div key={key} className="flex items-center gap-1">
                <span className="text-[10px]">{dim.emoji}</span>
                <span className="text-[9px] text-muted-foreground">{dim.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function SkillTile({
  tile,
  color,
  onClick,
}: {
  tile: TileData;
  color: string;
  onClick: () => void;
}) {
  const { skill, state, xp, level, growth } = tile;

  const isDim = state === "demo-dim" || state === "undiscovered";
  const isContested = state === "contested";
  const isLit = state === "claimed" || state === "demo-lit";
  const isFrontier = state === "frontier";

  const tooltipContent = (
    <div className="space-y-1.5 max-w-[180px]">
      <div className="font-semibold text-xs">{skill.name}</div>
      {level && <div className="text-[10px] text-muted-foreground">{level}{xp ? ` • ${xp} XP` : ""}</div>}
      <div className="space-y-1 pt-1 border-t border-border/50">
        <div className="flex items-center justify-between text-[10px]">
          <span>{DIMENSION_INFO.foundation.emoji} Foundation</span>
          <span className="text-muted-foreground">{growth.foundation.label}</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span>{DIMENSION_INFO.aiMastery.emoji} AI Mastery</span>
          <span className={growth.aiMastery.score >= 30 ? "text-primary" : "text-muted-foreground"}>
            {growth.aiMastery.label}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span>{DIMENSION_INFO.humanEdge.emoji} Human Edge</span>
          <span className={growth.humanEdge.score >= 30 ? "text-foreground" : "text-muted-foreground"}>
            {growth.humanEdge.label}
          </span>
        </div>
      </div>
      {skill.humanEdge && (
        <div className="text-[9px] text-muted-foreground italic pt-0.5">
          Edge: {skill.humanEdge}
        </div>
      )}
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: isDim ? 0.35 : 1,
            scale: 1,
          }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={onClick}
          disabled={state === "undiscovered"}
          className={`
            relative group flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium
            transition-all duration-200 cursor-pointer
            ${isDim ? "cursor-not-allowed" : "hover:scale-105 active:scale-[0.97]"}
            ${isFrontier ? "border border-dashed border-muted-foreground/30" : ""}
            ${isContested ? "border border-warning/60 shadow-[0_0_8px_hsl(var(--warning)/0.2)]" : ""}
          `}
          style={{
            background: isLit ? `${color}22` : undefined,
            borderColor: isLit ? color : undefined,
            color: isLit ? color : isDim ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
            borderWidth: isLit ? 1 : undefined,
            borderStyle: isLit ? "solid" : undefined,
          }}
        >
          {/* Growth rings indicator */}
          {!isDim && <GrowthRings growth={growth} size={14} />}

          {/* Contested flame */}
          {isContested && (
            <Flame className="absolute -top-1.5 -right-1.5 h-3 w-3 text-warning animate-pulse" />
          )}

          {/* Locked icon */}
          {state === "undiscovered" && (
            <Lock className="inline-block h-2.5 w-2.5 mr-0.5 opacity-50" />
          )}

          <span className="truncate max-w-[72px]">{skill.name}</span>

          {/* XP indicator for claimed tiles */}
          {isLit && xp && xp > 0 && (
            <span className="ml-0.5 opacity-60 font-mono text-[8px]">
              {xp}
            </span>
          )}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="top" className="p-2.5">
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
}
