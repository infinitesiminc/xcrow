import { motion } from "framer-motion";

const THREAT_TIERS = [
  { max: 25, label: "Weak", segments: 1, color: "hsl(var(--success))" },
  { max: 50, label: "Moderate", segments: 2, color: "hsl(var(--warning))" },
  { max: 75, label: "Formidable", segments: 3, color: "hsl(var(--spectrum-5))" },
  { max: 100, label: "Overwhelming", segments: 4, color: "hsl(var(--destructive))" },
] as const;

export type ThreatTier = (typeof THREAT_TIERS)[number];

export function getThreatTier(score: number): ThreatTier {
  return THREAT_TIERS.find(t => score <= t.max) || THREAT_TIERS[3];
}

interface ThreatBarProps {
  score: number;
  size?: "sm" | "md";
  showLabel?: boolean;
  animate?: boolean;
}

export function ThreatBar({ score, size = "sm", showLabel = true, animate = true }: ThreatBarProps) {
  const tier = getThreatTier(score);
  const totalSegments = 4;
  const h = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5 flex-1">
        {Array.from({ length: totalSegments }).map((_, i) => (
          <motion.div
            key={i}
            className={`${h} flex-1 rounded-full`}
            style={{
              transformOrigin: "left",
              background: i < tier.segments ? tier.color : "hsl(var(--filigree) / 0.12)",
              boxShadow: i < tier.segments ? `0 0 6px ${tier.color}` : undefined,
            }}
            initial={animate ? { scaleX: 0 } : false}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
          />
        ))}
      </div>
      {showLabel && (
        <span
          className="text-[10px] font-semibold shrink-0 uppercase tracking-wide"
          style={{ color: tier.color, fontFamily: "'Cinzel', serif" }}
        >
          {tier.label}
        </span>
      )}
    </div>
  );
}
