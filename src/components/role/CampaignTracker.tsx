import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface CampaignTrackerProps {
  totalBattles: number;
  conqueredNames: Set<string>;
  totalXP: number;
}

export function CampaignTracker({ totalBattles, conqueredNames, totalXP }: CampaignTrackerProps) {
  const conquered = conqueredNames.size;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2"
      style={{
        background: "hsl(var(--surface-stone))",
        borderBottom: "1px solid hsl(var(--filigree) / 0.2)",
        boxShadow: "inset 0 -1px 0 hsl(var(--emboss-light)), 0 1px 4px hsl(var(--emboss-shadow))",
      }}
    >
      {/* Progress nodes */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {Array.from({ length: totalBattles }).map((_, i) => (
          <div key={i} className="flex items-center">
            {i > 0 && (
              <div
                className="w-3 h-px"
                style={{
                  background: i < conquered
                    ? "hsl(var(--success) / 0.6)"
                    : "hsl(var(--filigree) / 0.15)",
                }}
              />
            )}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: i < conquered
                  ? "hsl(var(--success) / 0.15)"
                  : "hsl(var(--surface-stone))",
                border: `1px solid ${
                  i < conquered
                    ? "hsl(var(--success) / 0.4)"
                    : "hsl(var(--filigree) / 0.2)"
                }`,
              }}
            >
              {i < conquered ? (
                <CheckCircle2 className="h-2.5 w-2.5 text-success" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
              )}
            </motion.div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 shrink-0 text-[10px] tabular-nums">
        <span className="text-muted-foreground">
          <span className="font-bold text-foreground">{conquered}</span>/{totalBattles} conquered
        </span>
        {totalXP > 0 && (
          <span className="font-bold" style={{ color: "hsl(var(--filigree-glow))" }}>
            +{totalXP} XP
          </span>
        )}
      </div>
    </div>
  );
}
