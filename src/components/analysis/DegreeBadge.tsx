import { motion } from "framer-motion";
import { getAutomationDegree, degreeBgClass, type AutomationDegree } from "@/lib/automation-degree";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DegreeBadgeProps {
  automationRisk: number;
  augmented: number;
  /** "inline" = small pill, "hero" = larger badge with description */
  variant?: "inline" | "hero";
}

export function DegreeBadge({ automationRisk, augmented, variant = "inline" }: DegreeBadgeProps) {
  const degree = getAutomationDegree(automationRisk, augmented);

  if (variant === "inline") {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full cursor-default ${degreeBgClass(degree)}`}>
              {degree.emoji} {degree.code}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px]">
            <p className="font-semibold text-xs">{degree.code}: {degree.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{degree.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Hero variant
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl border border-border/50 bg-card p-4"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{degree.emoji}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${degreeBgClass(degree)}`}>
              {degree.code}
            </span>
            <span className="text-sm font-semibold text-foreground">{degree.label}</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{degree.description}</p>
      <DegreeScale activeLevel={degree.level} />
    </motion.div>
  );
}

function DegreeScale({ activeLevel }: { activeLevel: number }) {
  return (
    <div className="flex items-center gap-1 mt-3">
      {[1, 2, 3, 4, 5].map((lvl) => (
        <div
          key={lvl}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            lvl <= activeLevel ? "bg-primary" : "bg-secondary"
          }`}
        />
      ))}
      <span className="text-[9px] text-muted-foreground ml-1.5 shrink-0">D{activeLevel}/D5</span>
    </div>
  );
}
