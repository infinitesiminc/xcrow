import { motion } from "framer-motion";
import { TrendingUp, Rocket, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Verdict = "upskill" | "pivot" | "leverage";

interface RiskGaugeProps {
  risk: number;
  verdict: Verdict;
  reasoning: string;
}

const verdictConfig: Record<Verdict, { icon: typeof TrendingUp; label: string; dotColor: string }> = {
  upskill: { icon: TrendingUp, label: "Fast Track", dotColor: "bg-primary" },
  pivot: { icon: Rocket, label: "Career Shift", dotColor: "bg-brand-mid" },
  leverage: { icon: Zap, label: "Power Up", dotColor: "bg-success" },
};

function getGaugeColor(readiness: number): string {
  if (readiness >= 70) return "hsl(var(--success))";
  if (readiness >= 40) return "hsl(var(--primary))";
  return "hsl(var(--warning))";
}

export function RiskGauge({ risk, verdict, reasoning }: RiskGaugeProps) {
  const config = verdictConfig[verdict];
  const Icon = config.icon;
  // Invert: high "risk" number → show as readiness score
  const readiness = 100 - risk;
  const color = getGaugeColor(readiness);

  const radius = 70;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const fillLength = arcLength * (readiness / 100);
  const rotation = 135;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Gauge */}
      <div className="relative shrink-0">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle
            cx="90" cy="90" r={radius} fill="none"
            stroke="hsl(var(--secondary))" strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            transform={`rotate(${rotation} 90 90)`}
          />
          <motion.circle
            cx="90" cy="90" r={radius} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={arcLength - fillLength}
            transform={`rotate(${rotation} 90 90)`}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset: arcLength - fillLength }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-sans font-bold text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {readiness}%
          </motion.span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">AI Readiness</span>
        </div>
      </div>

      {/* Verdict */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center sm:text-left"
      >
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${config.dotColor} shrink-0`} />
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-sans font-bold text-foreground">{config.label}</span>
            </div>
            <p className="text-sm text-foreground/80 font-medium mb-1">Your learning plan</p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">{reasoning}</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
