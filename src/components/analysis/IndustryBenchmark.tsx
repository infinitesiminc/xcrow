import { motion } from "framer-motion";
import { Building2, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { IndustryBenchmark as IndustryBenchmarkType } from "@/types/analysis";

interface Props {
  benchmark: IndustryBenchmarkType;
  currentRisk: number;
  currentAugmented: number;
}

export function IndustryBenchmarkCard({ benchmark, currentRisk, currentAugmented }: Props) {
  const riskDiff = currentRisk - benchmark.avgAutomationRisk;
  const augDiff = currentAugmented - benchmark.avgAugmented;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
      <Card className="border-border/50">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">
              Industry Benchmark
            </span>
            <span className="ml-auto text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
              {benchmark.industry}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Automation Risk</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-sans font-bold text-foreground">{currentRisk}%</span>
                <span className={`text-xs font-semibold ${riskDiff !== 0 ? "text-foreground/60" : "text-muted-foreground"}`}>
                  {riskDiff > 0 ? "+" : ""}{riskDiff}% vs avg
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">AI Augmentation</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-sans font-bold text-foreground">{currentAugmented}%</span>
                <span className={`text-xs font-semibold ${augDiff !== 0 ? "text-foreground/60" : "text-muted-foreground"}`}>
                  {augDiff > 0 ? "+" : ""}{augDiff}% vs avg
                </span>
              </div>
            </div>
          </div>

          {benchmark.rolesInSameIndustry.length > 0 && (
            <div className="border-t border-border/50 pt-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                <Users className="inline h-3 w-3 mr-1" />
                Similar roles in {benchmark.industry}
              </p>
              <div className="space-y-1.5">
                {benchmark.rolesInSameIndustry.map((role, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate mr-2">{role.title}</span>
                    <span className="font-semibold text-foreground shrink-0">{role.automationRisk}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {benchmark.totalRoles > 0 && benchmark.avgAutomationRisk === 0 && (
            <p className="text-[10px] text-muted-foreground mt-2">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {benchmark.totalRoles} roles tracked in this industry — benchmarks build as more are analyzed.
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
