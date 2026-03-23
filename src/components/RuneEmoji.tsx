import { cn } from "@/lib/utils";

type RuneSize = "xs" | "sm" | "md" | "lg" | "xl";

interface RuneEmojiProps {
  emoji: string;
  size?: RuneSize;
  /** Optional domain color — pass a CSS variable like "var(--territory-technical)" */
  color?: string;
  className?: string;
  /** Glow intensity: subtle (default), medium, intense */
  glow?: "subtle" | "medium" | "intense";
}

const SIZE_MAP: Record<RuneSize, string> = {
  xs: "w-5 h-5 text-[10px]",
  sm: "w-7 h-7 text-sm",
  md: "w-9 h-9 text-lg",
  lg: "w-12 h-12 text-2xl",
  xl: "w-16 h-16 text-3xl",
};

/**
 * RuneEmoji — wraps a plain emoji in a dark‑fantasy styled container
 * with a subtle inner glow, beveled border, and optional domain color.
 *
 * Usage:
 *   <RuneEmoji emoji="⚙️" />
 *   <RuneEmoji emoji="🎯" size="lg" color="var(--territory-strategic)" glow="intense" />
 */
export default function RuneEmoji({
  emoji,
  size = "md",
  color,
  className,
  glow = "subtle",
}: RuneEmojiProps) {
  const glowClass =
    glow === "intense"
      ? "rune-emoji-intense"
      : glow === "medium"
        ? "rune-emoji-medium"
        : "rune-emoji-subtle";

  return (
    <span
      className={cn(
        "rune-emoji inline-flex items-center justify-center rounded-lg shrink-0 select-none",
        SIZE_MAP[size],
        glowClass,
        className,
      )}
      style={color ? ({ "--rune-color": color } as React.CSSProperties) : undefined}
      role="img"
    >
      {emoji}
    </span>
  );
}
