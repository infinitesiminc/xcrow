/**
 * SkillNode — individual skill node on the RPG territory map.
 * Visual states: claimed, frontier, undiscovered, contested, demo-lit, demo-dim.
 * Rarity effects: rare (cyan glow), legendary (gold animated glow), common (default).
 */

import { motion } from "framer-motion";
import { Lock, Flame } from "lucide-react";
import GrowthRings from "./GrowthRings";
import type { GrowthDimensions } from "@/lib/skill-growth";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DIMENSION_INFO } from "@/lib/skill-growth";

type TileState = "claimed" | "frontier" | "undiscovered" | "contested" | "demo-lit" | "demo-dim";

interface SkillNodeProps {
  x: number;
  y: number;
  name: string;
  skillId: string;
  state: TileState;
  growth: GrowthDimensions;
  xp?: number;
  level?: string;
  humanEdge?: string;
  baseHue: number;
  onClick: () => void;
  rarity?: string;
  dropExpiresAt?: string | null;
  iconEmoji?: string | null;
}

function getTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

const RARITY_CONFIG: Record<string, { glowColor: string; outerGlow: string; badge: string; label: string }> = {
  legendary: { glowColor: "hsl(45 100% 55%)", outerGlow: "hsl(45 100% 55% / 0.4)", badge: "hsl(45 100% 45%)", label: "✦ Legendary" },
  rare:      { glowColor: "hsl(190 90% 55%)", outerGlow: "hsl(190 90% 55% / 0.3)", badge: "hsl(190 80% 45%)", label: "◆ Rare" },
  common:    { glowColor: "", outerGlow: "", badge: "", label: "" },
};

export default function SkillNode({
  x, y, name, skillId, state, growth, xp, level, humanEdge, baseHue, onClick,
  rarity = "common", dropExpiresAt, iconEmoji,
}: SkillNodeProps) {
  const isDim = state === "demo-dim" || state === "undiscovered";
  const isLit = state === "claimed" || state === "demo-lit";
  const isContested = state === "contested";
  const isFrontier = state === "frontier";
  const isSpecial = rarity === "rare" || rarity === "legendary";
  const rarityConf = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;

  const isExpired = dropExpiresAt ? new Date(dropExpiresAt).getTime() < Date.now() : false;

  const nodeRadius = 22;

  const fillColor = isLit
    ? `hsl(${baseHue} 60% 25%)`
    : isContested
    ? `hsl(38 70% 20%)`
    : isFrontier
    ? `hsl(${baseHue} 20% 15%)`
    : `hsl(${baseHue} 10% 12%)`;

  const strokeColor = isSpecial && !isDim
    ? rarityConf.glowColor
    : isLit
    ? `hsl(${baseHue} 70% 55%)`
    : isContested
    ? `hsl(38 80% 55%)`
    : isFrontier
    ? `hsl(${baseHue} 40% 35%)`
    : `hsl(${baseHue} 15% 25%)`;

  const tooltipContent = (
    <div className="space-y-1.5 max-w-[180px]">
      <div className="font-semibold text-xs flex items-center gap-1">
        {iconEmoji && <span>{iconEmoji}</span>}
        {name}
      </div>
      {isSpecial && (
        <div className="text-[10px] font-bold" style={{ color: rarityConf.glowColor }}>
          {rarityConf.label}
          {dropExpiresAt && !isExpired && (
            <span className="ml-1 opacity-70">⏳ {getTimeLeft(dropExpiresAt)}</span>
          )}
          {isExpired && <span className="ml-1 text-destructive">Expired</span>}
        </div>
      )}
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
      {humanEdge && (
        <div className="text-[9px] text-muted-foreground italic">Edge: {humanEdge}</div>
      )}
      <div className="text-[9px] text-primary">Click to explore →</div>
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: isDim ? 0.35 : 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: Math.random() * 0.3 }}
          onClick={onClick}
          className="cursor-pointer"
          style={{ transformOrigin: `${x}px ${y}px` }}
        >
          {/* Legendary outer pulse ring */}
          {rarity === "legendary" && !isDim && (
            <motion.circle
              cx={x}
              cy={y}
              r={nodeRadius + 10}
              fill="none"
              stroke={rarityConf.outerGlow}
              strokeWidth={2}
              animate={{ r: [nodeRadius + 8, nodeRadius + 14, nodeRadius + 8], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {/* Rare shimmer ring */}
          {rarity === "rare" && !isDim && (
            <motion.circle
              cx={x}
              cy={y}
              r={nodeRadius + 8}
              fill="none"
              stroke={rarityConf.outerGlow}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              animate={{ opacity: [0.2, 0.45, 0.2], strokeDashoffset: [0, 20] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          )}

          {/* Glow for claimed/contested */}
          {(isLit || isContested) && !isSpecial && (
            <motion.circle
              cx={x}
              cy={y}
              r={nodeRadius + 6}
              fill="none"
              stroke={isContested ? "hsl(38 80% 55%)" : `hsl(${baseHue} 70% 55%)`}
              strokeWidth={1}
              opacity={0.3}
              animate={{ opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {/* Main circle */}
          <circle
            cx={x}
            cy={y}
            r={nodeRadius}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={isSpecial && !isDim ? 2.5 : isLit ? 2 : isFrontier ? 1.5 : 1}
            strokeDasharray={isFrontier ? "4 3" : undefined}
          />

          {/* Growth rings overlay */}
          {!isDim && (
            <foreignObject
              x={x - 8}
              y={y - 15}
              width={16}
              height={16}
            >
              <GrowthRings growth={growth} size={16} />
            </foreignObject>
          )}

          {/* Emoji icon for drop skills */}
          {iconEmoji && !isDim && (
            <text
              x={x}
              y={y + 4}
              textAnchor="middle"
              style={{ fontSize: "13px" }}
            >
              {iconEmoji}
            </text>
          )}

          {/* Contested flame */}
          {isContested && (
            <foreignObject x={x + 12} y={y - 18} width={16} height={16}>
              <Flame className="h-4 w-4 text-warning animate-pulse" />
            </foreignObject>
          )}

          {/* Lock icon for undiscovered */}
          {state === "undiscovered" && (
            <foreignObject x={x - 6} y={y - 6} width={12} height={12}>
              <Lock className="h-3 w-3 text-muted-foreground opacity-50" />
            </foreignObject>
          )}

          {/* Expiration countdown badge */}
          {dropExpiresAt && !isExpired && !isDim && (
            <g>
              <rect
                x={x - nodeRadius}
                y={y + nodeRadius + 2}
                width={nodeRadius * 2}
                height={10}
                rx={5}
                fill="hsl(var(--destructive) / 0.8)"
              />
              <text
                x={x}
                y={y + nodeRadius + 9}
                textAnchor="middle"
                style={{ fontSize: "8px", fontWeight: 700, fill: "white" }}
              >
                ⏳ {getTimeLeft(dropExpiresAt)}
              </text>
            </g>
          )}

          {/* Rarity badge */}
          {isSpecial && !isDim && (
            <g>
              <rect
                x={x - 14}
                y={y - nodeRadius - 10}
                width={28}
                height={10}
                rx={5}
                fill={rarityConf.badge}
              />
              <text
                x={x}
                y={y - nodeRadius - 3}
                textAnchor="middle"
                style={{ fontSize: "7px", fontWeight: 800, fill: "white", textTransform: "uppercase" }}
              >
                {rarity}
              </text>
            </g>
          )}

          {/* Label */}
          <text
            x={x}
            y={y + nodeRadius + (dropExpiresAt && !isExpired && !isDim ? 22 : 12)}
            textAnchor="middle"
            className="fill-current text-foreground"
            style={{
              fontSize: "8px",
              fontWeight: 600,
              fill: isDim ? "hsl(var(--muted-foreground))" : isSpecial ? rarityConf.glowColor : isLit ? `hsl(${baseHue} 70% 70%)` : "hsl(var(--foreground))",
              opacity: isDim ? 0.5 : 0.9,
            }}
          >
            {name.length > 14 ? name.slice(0, 12) + "…" : name}
          </text>

          {/* XP badge */}
          {isLit && xp && xp > 0 && (
            <g>
              <rect
                x={x + nodeRadius - 4}
                y={y - nodeRadius - 2}
                width={20}
                height={12}
                rx={6}
                fill="hsl(var(--primary))"
              />
              <text
                x={x + nodeRadius + 6}
                y={y - nodeRadius + 7}
                textAnchor="middle"
                style={{ fontSize: "7px", fontWeight: 700, fill: "white" }}
              >
                {xp}
              </text>
            </g>
          )}
        </motion.g>
      </TooltipTrigger>
      <TooltipContent side="top" className="p-2.5">
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
}
