import { motion } from "framer-motion";
import { Clock, Zap, Rocket, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const STOPS = [
  { value: 0, label: "Today", icon: Clock, desc: "Level 1 — Current state" },
  { value: 1, label: "2-3 Years", icon: Zap, desc: "Transition period" },
  { value: 2, label: "5+ Years", icon: Rocket, desc: "Level 2 — Full disruption" },
] as const;

interface TimeAxisSliderProps {
  value: number;
  onChange: (v: number) => void;
  l2Locked?: boolean;
}

export function TimeAxisSlider({ value, onChange, l2Locked = false }: TimeAxisSliderProps) {
  const current = STOPS[value];

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Time Horizon
        </span>
        <span className="text-xs font-medium text-primary">{current.desc}</span>
      </div>

      {/* Track */}
      <div className="relative flex items-center justify-between h-10">
        {/* Background line */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-secondary" />
        {/* Active fill */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full bg-primary"
          initial={false}
          animate={{ width: `${(value / 2) * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />

        <TooltipProvider>
          {STOPS.map((stop) => {
            const Icon = stop.icon;
            const isActive = value >= stop.value;
            const isCurrent = value === stop.value;
            const isLocked = l2Locked && stop.value > 0;

            const button = (
              <button
                key={stop.value}
                onClick={() => !isLocked && onChange(stop.value)}
                disabled={isLocked}
                className="relative z-10 flex flex-col items-center gap-1.5 group"
              >
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isLocked
                      ? "bg-muted text-muted-foreground opacity-50"
                      : isCurrent
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : isActive
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-muted-foreground"
                  }`}
                  whileHover={!isLocked ? { scale: 1.1 } : {}}
                  whileTap={!isLocked ? { scale: 0.95 } : {}}
                >
                  {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </motion.div>
                <span
                  className={`text-[10px] font-medium ${
                    isLocked ? "text-muted-foreground/50" : isCurrent ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {stop.label}
                </span>
              </button>
            );

            if (isLocked) {
              return (
                <Tooltip key={stop.value}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Practice a task to unlock Future View
                  </TooltipContent>
                </Tooltip>
              );
            }
            return button;
          })}
        </TooltipProvider>
      </div>
    </div>
  );
}
