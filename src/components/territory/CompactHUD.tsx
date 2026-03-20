/**
 * CompactHUD — thin top bar showing tier, coverage %, and XP for signed-in users.
 */

import { useMemo } from "react";
import { Shield, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";
import type { SkillXP } from "@/lib/skill-map";

const TIERS = [
  { name: "Scout", minXP: 0, color: "hsl(var(--muted-foreground))" },
  { name: "Explorer", minXP: 200, color: "hsl(var(--spectrum-0))" },
  { name: "Strategist", minXP: 800, color: "hsl(var(--spectrum-3))" },
  { name: "Commander", minXP: 2000, color: "hsl(var(--spectrum-6))" },
] as const;

function getTier(xp: number) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (xp >= TIERS[i].minXP) return TIERS[i];
  }
  return TIERS[0];
}

interface CompactHUDProps {
  skills: SkillXP[];
  targetSkillIds: Set<string>;
  userName?: string;
}

export default function CompactHUD({ skills, targetSkillIds, userName }: CompactHUDProps) {
  const { totalXP, tier, claimed, total, coveragePct } = useMemo(() => {
    const totalXP = skills.reduce((sum, s) => sum + s.xp, 0);
    const tier = getTier(totalXP);
    const claimed = skills.filter(
      (s) => s.xp > 0 && targetSkillIds.has(s.id)
    ).length;
    const total = targetSkillIds.size;
    const coveragePct = total > 0 ? Math.round((claimed / total) * 100) : 0;
    return { totalXP, tier, claimed, total, coveragePct };
  }, [skills, targetSkillIds]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-4 px-5 py-2.5 border-b border-border bg-card/80 backdrop-blur-sm"
    >
      {/* Tier badge */}
      <div className="flex items-center gap-1.5">
        <Shield className="h-3.5 w-3.5" style={{ color: tier.color }} />
        <span
          className="text-xs font-bold tracking-wide"
          style={{ color: tier.color }}
        >
          {tier.name}
        </span>
      </div>

      {/* XP */}
      <div className="flex items-center gap-1 text-muted-foreground">
        <Zap className="h-3 w-3" />
        <span className="text-[11px] font-mono">{totalXP.toLocaleString()} XP</span>
      </div>

      {/* Coverage (only if they have target roles) */}
      {total > 0 && (
        <div className="flex items-center gap-1.5 ml-auto">
          <Target className="h-3 w-3 text-warning" />
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "hsl(var(--warning))" }}
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
      )}

      {userName && (
        <span className="text-[11px] text-muted-foreground ml-auto truncate max-w-[100px]">
          {userName}
        </span>
      )}
    </motion.div>
  );
}
