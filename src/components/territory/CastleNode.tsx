/**
 * CastleNode — isometric castle tile for the territory map.
 * Visual tiers: ruins → outpost → fortress → citadel.
 */

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import type { CastleState } from "@/lib/castle-levels";
import type { SkillCategory } from "@/lib/skill-map";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CATEGORY_HUES: Record<SkillCategory, number> = {
  technical: 262,
  analytical: 200,
  communication: 150,
  leadership: 340,
  creative: 30,
  compliance: 45,
};

interface CastleNodeProps {
  skillId: string;
  name: string;
  category: SkillCategory;
  castle: CastleState;
  xp: number;
  isActive: boolean; // Crowy is here
  onClick: () => void;
  delay?: number;
}

export default function CastleNode({
  skillId,
  name,
  category,
  castle,
  xp,
  isActive,
  onClick,
  delay = 0,
}: CastleNodeProps) {
  const hue = CATEGORY_HUES[category];
  const { tier, unlocked, tierProgress, emoji, label } = castle;

  // Castle visual sizing by tier
  const towerCount = tier === "citadel" ? 4 : tier === "fortress" ? 3 : tier === "outpost" ? 2 : 1;
  const baseSize = tier === "citadel" ? 56 : tier === "fortress" ? 50 : tier === "outpost" ? 44 : 38;

  const bgColor = unlocked
    ? `hsl(${hue} 40% 18%)`
    : `hsl(${hue} 10% 12%)`;
  const borderColor = unlocked
    ? `hsl(${hue} 50% 35%)`
    : `hsl(${hue} 15% 22%)`;
  const glowColor = unlocked
    ? `hsl(${hue} 60% 45%)`
    : "transparent";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: delay * 0.06,
            ease: [0.16, 1, 0.3, 1],
          }}
          onClick={onClick}
          className="relative flex flex-col items-center cursor-pointer group"
          style={{ width: 80 }}
        >
          {/* Crowy indicator */}
          {isActive && (
            <motion.div
              className="absolute -top-5 z-10 text-lg"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              🐦‍⬛
            </motion.div>
          )}

          {/* Castle container */}
          <motion.div
            className="relative rounded-xl flex items-center justify-center transition-shadow duration-300"
            style={{
              width: baseSize,
              height: baseSize,
              background: bgColor,
              border: `1.5px solid ${borderColor}`,
              boxShadow: unlocked
                ? `0 0 16px 2px ${glowColor}40, inset 0 1px 0 ${glowColor}20`
                : "none",
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Lock for ruins */}
            {!unlocked && (
              <Lock className="h-4 w-4 text-muted-foreground/40" />
            )}

            {/* Castle towers */}
            {unlocked && (
              <div className="flex items-end gap-0.5">
                {Array.from({ length: towerCount }).map((_, i) => {
                  const h = 10 + (i % 2 === 0 ? 6 : 3) + (tier === "citadel" ? 4 : 0);
                  return (
                    <div
                      key={i}
                      className="rounded-t-sm"
                      style={{
                        width: 6,
                        height: h,
                        background: `hsl(${hue} 45% ${35 + i * 5}%)`,
                        borderTop: `2px solid hsl(${hue} 50% 50%)`,
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Tier progress ring */}
            {unlocked && castle.xpToNextTier !== null && (
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke={`hsl(${hue} 30% 25%)`}
                  strokeWidth="2"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke={`hsl(${hue} 60% 50%)`}
                  strokeWidth="2.5"
                  strokeDasharray={`${tierProgress * 2.89} 289`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-500"
                />
              </svg>
            )}
          </motion.div>

          {/* Label */}
          <span
            className="mt-1.5 text-center leading-tight font-medium transition-colors"
            style={{
              fontSize: "9px",
              color: unlocked
                ? `hsl(${hue} 50% 70%)`
                : `hsl(var(--muted-foreground))`,
              opacity: unlocked ? 1 : 0.5,
              maxWidth: 76,
            }}
          >
            {name}
          </span>

          {/* XP badge */}
          {xp > 0 && (
            <span
              className="text-[8px] font-mono font-bold mt-0.5"
              style={{ color: `hsl(${hue} 60% 60%)` }}
            >
              {xp} XP
            </span>
          )}
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top" className="p-2.5 max-w-[180px]">
        <div className="space-y-1">
          <div className="font-semibold text-xs">{emoji} {name}</div>
          <div className="text-[10px] text-muted-foreground">
            {label} • {xp} XP
          </div>
          {castle.xpToNextTier !== null && (
            <div className="text-[10px] text-muted-foreground">
              {castle.xpToNextTier} XP to next tier
            </div>
          )}
          {!unlocked && (
            <div className="text-[10px] text-primary">
              Complete a simulation to unlock
            </div>
          )}
          {unlocked && (
            <div className="text-[10px] text-primary">
              Click to view details →
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
