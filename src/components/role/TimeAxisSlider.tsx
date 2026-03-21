import { motion } from "framer-motion";
import { Clock, Rocket } from "lucide-react";

const STOPS = [
  { value: 0, label: "Today", icon: Clock, desc: "Current state" },
  { value: 1, label: "Future", icon: Rocket, desc: "AI-forward projection" },
] as const;

interface TimeAxisSliderProps {
  value: number;
  onChange: (v: number) => void;
}

export function TimeAxisSlider({ value, onChange }: TimeAxisSliderProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border/30 w-fit">
      {STOPS.map((stop) => {
        const Icon = stop.icon;
        const isActive = value === stop.value;
        return (
          <button
            key={stop.value}
            onClick={() => onChange(stop.value)}
            className="relative px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            {isActive && (
              <motion.div
                layoutId="slider-bg"
                className="absolute inset-0 rounded-md bg-primary shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className={`relative z-10 flex items-center gap-1.5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`}>
              <Icon className="h-3 w-3" />
              {stop.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
