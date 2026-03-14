import { motion } from "framer-motion";
import { TrendingUp, RefreshCw, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Verdict = "upskill" | "pivot" | "leverage";

interface RiskGaugeProps {
  risk: number;
  verdict: Verdict;
  reasoning: string;
}

const verdictConfig: Record<Verdict, { icon: typeof TrendingUp; label: string; color: string; bg: string }> = {
  upskill: { icon: TrendingUp, label: "Upskill", color: "text-warning", bg: "bg-warning/10" },
  pivot: { icon: RefreshCw, label: "Pivot", color: "text-destructive", bg: "bg-destructive/10" },
  leverage: { icon: Rocket, label: "Leverage", color: "text-success", bg: "bg-success/10" },
};

function getRiskColor(risk: number): string {
  if (risk >= 55) return "hsl(var(--destructive))";
  if (risk >= 35) return "hsl(var(--warning))";
  return "hsl(var(--success))";
}

export function RiskGauge({ risk, verdict, reasoning }: RiskGaugeProps) {
  const config = verdictConfig[verdict];
  const Icon = config.icon;
  const color = getRiskColor(risk);

  // SVG gauge params
  const radius = 70;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degrees
  const fillLength = arcLength * (risk / 100);
  const rotation = 135; // start from bottom-left

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Gauge */}
      <div className="relative shrink-0">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            transform={`rotate(${rotation} 90 90)`}
          />
          <motion.circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
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
            {risk}%
          </motion.span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Agent Risk</span>
        </div>
      </div>

      {/* Verdict */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center sm:text-left"
      >
        <Card className={`border-border/50 ${config.bg}`}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className={`h-5 w-5 ${config.color}`} />
              <span className={`text-lg font-sans font-bold ${config.color}`}>{config.label}</span>
            </div>
            <p className="text-sm text-foreground font-medium mb-1">Our recommendation</p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">{reasoning}</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
