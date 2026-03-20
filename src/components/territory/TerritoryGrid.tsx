/**
 * TerritoryGrid — visual hex-inspired skill map.
 *
 * Modes:
 *  - demo: all tiles start dim; `highlightedSkillIds` lights them up as chat discovers roles
 *  - real: reads from actual SkillXP data to show claimed/frontier/undiscovered
 */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Flame, Sparkles } from "lucide-react";
import {
  SKILL_TAXONOMY,
  CATEGORY_META,
  type SkillCategory,
  type SkillXP,
  type TaxonomySkill,
} from "@/lib/skill-map";

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
}

interface TerritoryGridProps {
  // Real mode
  skills?: SkillXP[];
  targetSkillIds?: Set<string>;
  // Demo mode
  demoMode?: boolean;
  highlightedSkillIds?: Set<string>;
  // Interaction
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
        state = "contested"; // target role needs it but unclaimed
      } else {
        // Check if adjacent to any claimed skill in same category
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
      };
    });
  }, [skills, targetSkillIds, demoMode, highlightedSkillIds]);

  // Group by category for layout
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
      <div className="mt-3 flex flex-wrap gap-3 justify-center">
        {[
          { state: "claimed", label: "Claimed", dot: "bg-primary" },
          { state: "frontier", label: "Frontier", dot: "border border-muted-foreground/40 border-dashed" },
          { state: "contested", label: "In Demand", dot: "bg-warning" },
          { state: "undiscovered", label: "Locked", dot: "bg-muted" },
        ].map((l) => (
          <div key={l.state} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${l.dot}`} />
            <span className="text-[10px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
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
  const { skill, state, xp, level } = tile;

  const isDim = state === "demo-dim" || state === "undiscovered";
  const isContested = state === "contested";
  const isLit = state === "claimed" || state === "demo-lit";
  const isFrontier = state === "frontier";

  return (
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
        relative group px-2 py-1.5 rounded-lg text-[10px] font-medium
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
      title={`${skill.name}${level ? ` • ${level}` : ""}${xp ? ` • ${xp} XP` : ""}`}
    >
      {/* Contested flame */}
      {isContested && (
        <Flame className="absolute -top-1.5 -right-1.5 h-3 w-3 text-warning animate-pulse" />
      )}

      {/* Locked icon */}
      {state === "undiscovered" && (
        <Lock className="inline-block h-2.5 w-2.5 mr-0.5 opacity-50" />
      )}

      <span className="truncate max-w-[80px]">{skill.name}</span>

      {/* XP indicator for claimed tiles */}
      {isLit && xp && xp > 0 && (
        <span className="ml-1 opacity-60 font-mono text-[8px]">
          {xp}
        </span>
      )}

      {/* Human edge sparkle */}
      {isLit && skill.humanEdge && (
        <span className="absolute -bottom-0.5 -right-0.5 text-[7px]">✦</span>
      )}
    </motion.button>
  );
}
