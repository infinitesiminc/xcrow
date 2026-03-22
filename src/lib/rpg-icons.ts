/**
 * RPG Icon & Emoji Catalogue
 * Centralized registry so we stop reusing ⚔️ / Swords everywhere.
 * Each context has a unique icon pairing (lucide icon + emoji).
 */
import {
  Swords,
  Shield,
  Flame,
  Crown,
  Scroll,
  Compass,
  Target,
  Crosshair,
  Sparkles,
  Trophy,
  Map,
  Flag,
  Gem,
  Skull,
  Landmark,
  Castle,
  type LucideIcon,
} from "lucide-react";

export interface RpgIcon {
  Icon: LucideIcon;
  emoji: string;
  label: string;
}

/** Contextual icon map — pick by semantic meaning, not aesthetics */
const RPG_ICONS = {
  // --- Combat / Simulation ---
  quest:         { Icon: Scroll,    emoji: "📜", label: "Quest" },
  battle:        { Icon: Swords,    emoji: "⚔️", label: "Battle" },
  engage:        { Icon: Crosshair, emoji: "🎯", label: "Engage" },

  // --- Exploration / Navigation ---
  scout:         { Icon: Compass,   emoji: "🧭", label: "Scout" },
  mission:       { Icon: Flag,      emoji: "🚩", label: "Mission" },
  briefing:      { Icon: Map,       emoji: "🗺️", label: "Briefing" },

  // --- Skills / Progression ---
  skill:         { Icon: Gem,       emoji: "💎", label: "Skill" },
  arsenal:       { Icon: Shield,    emoji: "🛡️", label: "Arsenal" },
  mastery:       { Icon: Crown,     emoji: "👑", label: "Mastery" },

  // --- Categories ---
  tool_awareness:    { Icon: Crosshair, emoji: "🎯", label: "Tool Mastery" },
  human_value_add:   { Icon: Shield,    emoji: "🛡️", label: "Human Edge" },
  adaptive_thinking: { Icon: Flame,     emoji: "🔥", label: "Adaptation" },
  domain_judgment:   { Icon: Crown,     emoji: "👑", label: "Domain Judgment" },

  // --- Results / Rewards ---
  victory:       { Icon: Trophy,    emoji: "🏆", label: "Victory" },
  xp:            { Icon: Sparkles,  emoji: "✨", label: "XP" },
  power:         { Icon: Flame,     emoji: "🔥", label: "Power" },

  // --- Kingdom / Territory ---
  kingdom:       { Icon: Castle,    emoji: "🏰", label: "Kingdom" },
  territory:     { Icon: Landmark,  emoji: "🏛️", label: "Territory" },
  threat:        { Icon: Skull,     emoji: "💀", label: "Threat" },
  ruins:         { Icon: Target,    emoji: "🏚️", label: "Ruins" },

  // --- Generic fallback ---
  default:       { Icon: Sparkles,  emoji: "⚡", label: "Action" },
} as const satisfies Record<string, RpgIcon>;

export type RpgContext = keyof typeof RPG_ICONS;

/** Get an RPG icon set by context key */
export function rpgIcon(context: RpgContext): RpgIcon {
  return RPG_ICONS[context] ?? RPG_ICONS.default;
}

/** Get just the emoji for inline use */
export function rpgEmoji(context: RpgContext): string {
  return (RPG_ICONS[context] ?? RPG_ICONS.default).emoji;
}

/** Get just the Lucide icon component */
export function rpgLucide(context: RpgContext): LucideIcon {
  return (RPG_ICONS[context] ?? RPG_ICONS.default).Icon;
}

/** Category score key → RPG icon (for sim results, queue, etc.) */
export function categoryIcon(category: string): RpgIcon {
  const key = category as RpgContext;
  if (key in RPG_ICONS) return RPG_ICONS[key];
  return RPG_ICONS.default;
}

export default RPG_ICONS;
