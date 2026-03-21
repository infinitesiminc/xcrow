import { motion } from "framer-motion";
import { useMemo } from "react";
import { JobAnalysisResult } from "@/types/analysis";
import type { FuturePrediction } from "@/components/analysis/FutureTaskPreview";

interface OverviewTabProps {
  result: JobAnalysisResult;
  timeHorizon: number;
  predictions: Record<string, FuturePrediction>;
  completedCount: number;
}

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

export function OverviewTab({ result, timeHorizon, predictions, completedCount }: OverviewTabProps) {
  const currentRisk = result.summary.automationRiskPercent;
  const currentAug = result.summary.augmentedPercent;
  const taskCount = result.tasks.length;

  // Compute future averages
  const futureStats = useMemo(() => {
    const preds = Object.values(predictions);
    if (preds.length === 0) return { avgExposure: currentRisk, collapseCount: 0 };
    const avgExposure = Math.round(preds.reduce((s, p) => s + p.future_exposure, 0) / preds.length);
    const collapseCount = preds.filter(p => p.future_exposure >= 80).length;
    return { avgExposure, collapseCount };
  }, [predictions, currentRisk]);

  const t = timeHorizon / 2; // 0, 0.5, 1
  const displayRisk = lerp(currentRisk, futureStats.avgExposure, t);
  const displayAug = lerp(currentAug, Math.min(100, currentAug + 15), t);
  const readiness = 100 - Math.round(displayRisk * 0.55 + (100 - displayAug) * 0.25 + 20);

  return (
    <div className="space-y-6">
      {/* Hero stats */}
      <div className="flex items-center gap-6">
        <ReadinessRing readiness={readiness} size={96} />
        <div className="flex-1 grid grid-cols-3 gap-4">
          <StatCard label="AI Exposure" value={`${displayRisk}%`} trend={timeHorizon > 0 ? displayRisk - currentRisk : 0} />
          <StatCard label="Augmented" value={`${displayAug}%`} trend={timeHorizon > 0 ? displayAug - currentAug : 0} />
          <StatCard label="Tasks" value={`${taskCount}`} sub={completedCount > 0 ? `${completedCount} practiced` : undefined} />
        </div>
      </div>

      {/* Role summary */}
      {result.summary && (
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            {timeHorizon === 0 ? "Role Overview" : timeHorizon === 1 ? "Near-Future Outlook" : "Long-Term Forecast"}
          </h3>
          {timeHorizon === 0 ? (
            <p className="text-xs text-muted-foreground leading-relaxed">
              This role has {taskCount} key task areas. {currentRisk}% of tasks have significant AI tool exposure, 
              while {currentAug}% benefit from human-AI collaboration. 
              {completedCount > 0 ? ` You've practiced ${completedCount} task areas so far.` : " Start practicing to build readiness."}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {futureStats.collapseCount > 0
                ? `${futureStats.collapseCount} of ${taskCount} tasks face significant collapse risk from emerging AI. `
                : "Most tasks will evolve rather than collapse. "}
              Average AI exposure is projected to reach {futureStats.avgExposure}%, 
              up from {currentRisk}% today. New human roles will emerge around oversight, judgment, and creative direction.
            </p>
          )}
        </div>
      )}

      {/* Future predictions summary when in future mode */}
      {timeHorizon > 0 && Object.keys(predictions).length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            ⚡ Disrupting Technologies
          </h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(Object.values(predictions).flatMap(p => p.disrupting_tech))).map(tech => (
              <span key={tech} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReadinessRing({ readiness, size = 96 }: { readiness: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="hsl(var(--primary))" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - readiness / 100) }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-foreground tabular-nums">{readiness}%</span>
        <span className="text-[8px] text-muted-foreground uppercase tracking-wider">Ready</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, sub }: { label: string; value: string; trend?: number; sub?: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-card p-3 text-center">
      <div className="text-lg font-bold text-foreground tabular-nums">{value}</div>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</div>
      {trend !== undefined && trend !== 0 && (
        <div className={`text-[10px] font-medium mt-0.5 ${trend > 0 ? "text-destructive" : "text-success"}`}>
          {trend > 0 ? "+" : ""}{trend}%
        </div>
      )}
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
