import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { getRiskTier } from "@/lib/risk-colors";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { prebuiltRoles } from "@/data/prebuilt-roles";

interface RoleContextProps {
  agentRisk: number;
  jobTitle: string;
}

function calcAgentRisk(automationRisk: number, augmented: number, newSkills: number): number {
  return Math.round(automationRisk * 0.55 + (100 - augmented) * 0.25 + newSkills * 0.20);
}

export function RoleContext({ agentRisk, jobTitle }: RoleContextProps) {
  const navigate = useNavigate();
  const readiness = 100 - agentRisk;

  const { average, percentile } = useMemo(() => {
    const allRisks = Object.values(prebuiltRoles).map(r =>
      calcAgentRisk(r.summary.automationRiskPercent, r.summary.augmentedPercent, r.summary.newSkillsPercent)
    );
    const allReadiness = allRisks.map(r => 100 - r);
    const avg = Math.round(allReadiness.reduce((a, b) => a + b, 0) / allReadiness.length);
    const lower = allReadiness.filter(r => r < readiness).length;
    const pct = Math.round((lower / allReadiness.length) * 100);
    return { average: avg, percentile: pct };
  }, [agentRisk, readiness]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <Card className="border-border/50">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">How you compare</span>
          </div>

          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1">
              <div className="relative h-3 rounded-full bg-secondary overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-muted-foreground/50 z-10"
                  style={{ left: `${average}%` }}
                />
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: readiness >= 70 ? "hsl(var(--success))" : readiness >= 40 ? "hsl(var(--primary))" : "hsl(var(--warning))" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${readiness}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">0%</span>
                <span className="text-[10px] text-muted-foreground">Avg: {average}%</span>
                <span className="text-[10px] text-muted-foreground">100%</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            More AI-ready than <span className="font-bold text-foreground">{percentile}%</span> of analyzed roles.
          </p>

        </CardContent>
      </Card>
    </motion.div>
  );
}
