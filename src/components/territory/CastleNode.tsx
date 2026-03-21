/**
 * CastleNode — isometric castle tile using generated castle images.
 * Visual tiers: ruins → outpost → fortress → citadel.
 */

import { motion } from "framer-motion";
import xcrowLogo from "@/assets/xcrow-logo.png";
import { Lock } from "lucide-react";
import type { CastleState } from "@/lib/castle-levels";
import type { SkillCategory } from "@/lib/skill-map";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import castleRuins from "@/assets/castle-ruins.png";
import castleOutpost from "@/assets/castle-outpost.png";
import castleFortress from "@/assets/castle-fortress.png";
import castleCitadel from "@/assets/castle-citadel.png";

const TIER_IMAGES: Record<string, string> = {
  ruins: castleRuins,
  outpost: castleOutpost,
  fortress: castleFortress,
  citadel: castleCitadel,
};

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
  isActive: boolean;
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

  const imgSize = tier === "citadel" ? 72 : tier === "fortress" ? 64 : tier === "outpost" ? 56 : 48;

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
          style={{ width: 88 }}
        >
          {/* Xcrow mascot */}
          {isActive && (
            <motion.div
              className="absolute -top-10 z-10"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <img src={xcrowLogo} alt="Xcrow" className="h-14 w-14 object-contain drop-shadow-[0_0_8px_hsl(270_80%_60%/0.6)]" draggable={false} />
            </motion.div>
          )}

          {/* Castle image */}
          <motion.div
            className="relative flex items-center justify-center"
            style={{ width: imgSize, height: imgSize }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <img
              src={TIER_IMAGES[tier]}
              alt={`${label} castle`}
              className="w-full h-full object-contain drop-shadow-lg"
              style={{
                filter: unlocked ? "none" : "grayscale(0.5) brightness(0.7) opacity(0.8)",
              }}
              draggable={false}
            />

            {/* Lock overlay for ruins */}
            {!unlocked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="h-4 w-4 text-muted-foreground/60" />
              </div>
            )}

            {/* Tier progress ring */}
            {unlocked && castle.xpToNextTier !== null && (
              <svg
                className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)]"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke={`hsl(${hue} 30% 25% / 0.4)`}
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
              maxWidth: 84,
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
