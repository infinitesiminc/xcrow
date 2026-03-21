import { motion } from "framer-motion";
import { Clock, Zap, Rocket } from "lucide-react";

const STOPS = [
  { value: 0, label: "Today", icon: Clock, desc: "Level 1 — Current state" },
  { value: 1, label: "2-3 Years", icon: Zap, desc: "Transition period" },
  { value: 2, label: "5+ Years", icon: Rocket, desc: "Level 2 — Full disruption" },
] as const;

interface TimeAxisSliderProps {
  value: number;
  onChange: (v: number) => void;
}

export function TimeAxisSlider({ value, onChange }: TimeAxisSliderProps) {
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

        {STOPS.map((stop) => {
          const Icon = stop.icon;
          const isActive = value >= stop.value;
          const isCurrent = value === stop.value;

          return (
            <button
              key={stop.value}
              onClick={() => onChange(stop.value)}
              className="relative z-10 flex flex-col items-center gap-1.5 group"
            >
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : isActive
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="h-3.5 w-3.5" />
              </motion.div>
              <span
                className={`text-[10px] font-medium ${
                  isCurrent ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {stop.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
