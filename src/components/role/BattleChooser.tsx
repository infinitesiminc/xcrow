import { motion } from "framer-motion";
import { Swords, CheckCircle2, Crown } from "lucide-react";
import { TaskAnalysis } from "@/types/analysis";
import { ThreatBar } from "./ThreatBar";

interface BattleChooserProps {
  choices: TaskAnalysis[];
  conqueredNames: Set<string>;
  remainingCount: number;
  onChoose: (task: TaskAnalysis) => void;
  isFinalBattle: boolean;
}

export function BattleChooser({ choices, conqueredNames, remainingCount, onChoose, isFinalBattle }: BattleChooserProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-center px-6 py-8"
    >
      {/* Heading */}
      <div className="text-center mb-8">
        {isFinalBattle ? (
          <>
            <Crown className="h-8 w-8 text-warning mx-auto mb-3" />
            <h2 className="text-lg font-display font-bold text-foreground mb-1">Final Battle</h2>
            <p className="text-xs text-muted-foreground">One challenge remains between you and conquest</p>
          </>
        ) : (
          <>
            <Swords className="h-8 w-8 text-primary mx-auto mb-3" />
            <h2 className="text-lg font-display font-bold text-foreground mb-1">Choose Your Next Battle</h2>
            <p className="text-xs text-muted-foreground">
              {remainingCount} battle{remainingCount !== 1 ? "s" : ""} remain in this kingdom
            </p>
          </>
        )}
      </div>

      {/* Battle cards */}
      <div className={`grid gap-4 w-full max-w-2xl ${choices.length > 1 ? "grid-cols-2" : "grid-cols-1 max-w-sm"}`}>
        {choices.map((task, i) => {
          const isConquered = conqueredNames.has(task.name);
          const score = task.aiExposureScore ?? 50;

          return (
            <motion.button
              key={task.name}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.12, type: "spring", damping: 20 }}
              onClick={() => onChoose(task)}
              className={`group relative rounded-xl border p-5 text-left transition-all hover:shadow-lg ${
                isConquered
                  ? "border-success/30 bg-success/[0.04] hover:border-success/50 hover:shadow-success/10"
                  : "border-border/60 bg-card hover:border-primary/50 hover:shadow-primary/10"
              }`}
            >
              {isConquered && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
              )}

              <h3 className="text-sm font-bold text-foreground mb-2 pr-6 group-hover:text-primary transition-colors">
                {task.name}
              </h3>

              {task.description && (
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Threat bar */}
              <div className="mb-3">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">
                  Enemy Strength
                </span>
                <ThreatBar score={score} />
              </div>

              {/* CTA hint */}
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-primary/70 group-hover:text-primary transition-colors">
                <Swords className="h-3 w-3" />
                {isConquered ? "Reconquer" : "Engage"}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Fog indicator */}
      {remainingCount > choices.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-[10px] text-muted-foreground/60 flex items-center gap-2"
        >
          <div className="h-px w-8 bg-border/40" />
          {remainingCount - choices.length} more in the fog
          <div className="h-px w-8 bg-border/40" />
        </motion.div>
      )}
    </motion.div>
  );
}
