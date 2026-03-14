import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Grid3X3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { findPrebuiltRole } from "@/data/prebuilt-roles";
import { TaskAnalysis } from "@/types/analysis";
import { getHeatColor } from "@/lib/risk-colors";

const PREVIEW_ROLES = [
  "paralegal", "auditor", "seo specialist", "accountant",
  "content strategist", "social media manager", "qa manager",
  "hr manager", "financial analyst", "supply chain manager",
  "product manager", "software engineer",
];

const CATEGORIES = [
  { id: "content", label: "Content", keywords: ["content", "writing", "copy", "documentation", "report", "drafting", "editorial", "brief", "prd", "spec", "pitch"] },
  { id: "data", label: "Data", keywords: ["data", "analysis", "analytics", "research", "metrics", "modeling", "quantitative", "forecast", "performance", "reporting"] },
  { id: "process", label: "Process", keywords: ["processing", "automation", "pipeline", "provisioning", "patching", "entry", "bookkeeping", "payroll", "invoice", "monitoring", "tracking", "scheduling"] },
  { id: "review", label: "Review", keywords: ["review", "audit", "quality", "testing", "oversight", "control", "verification", "assessment", "evaluation"] },
  { id: "comms", label: "Comms", keywords: ["communication", "stakeholder", "client", "presentation", "negotiation", "relationship", "advisory", "consultation", "community", "customer"] },
  { id: "creative", label: "Creative", keywords: ["creative", "design", "wireframe", "prototype", "visual", "brand", "campaign", "ad"] },
];

function classifyTask(task: TaskAnalysis): string[] {
  const name = task.name.toLowerCase();
  const desc = task.description.toLowerCase();
  const matches: string[] = [];
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((k) => name.includes(k) || desc.includes(k))) {
      matches.push(cat.id);
    }
  }
  return matches.length > 0 ? matches : ["process"];
}

function getDisruptionScore(task: TaskAnalysis): number {
  let score = 0;
  if (task.currentState === "mostly_ai") score += 3;
  else if (task.currentState === "human_ai") score += 2;
  else score += 1;
  if (task.trend === "fully_ai_soon") score += 3;
  else if (task.trend === "increasing_ai") score += 2;
  else score += 1;
  if (task.impactLevel === "high") score += 2;
  else if (task.impactLevel === "medium") score += 1;
  return score;
}

export function HeatmapPreview() {
  const navigate = useNavigate();

  const grid = useMemo(() => {
    const result: { role: string; title: string; cells: (number | null)[] }[] = [];
    for (const key of PREVIEW_ROLES) {
      const role = findPrebuiltRole(key);
      if (!role) continue;
      const catScores: Record<string, number[]> = {};
      CATEGORIES.forEach(c => { catScores[c.id] = []; });
      for (const task of role.tasks) {
        const cats = classifyTask(task);
        const score = getDisruptionScore(task);
        cats.forEach(c => { if (catScores[c]) catScores[c].push(score); });
      }
      result.push({
        role: key,
        title: role.jobTitle,
        cells: CATEGORIES.map(c => {
          const scores = catScores[c.id];
          return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
        }),
      });
    }
    return result;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-10 mb-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            AI Disruption Heatmap
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/heatmap")}
        >
          Explore full heatmap <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      <div
        className="rounded-xl border border-border bg-card overflow-hidden cursor-pointer hover:border-primary/30 transition-colors"
        onClick={() => navigate("/heatmap")}
      >
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Header */}
            <div className="grid" style={{ gridTemplateColumns: `120px repeat(${CATEGORIES.length}, 1fr)` }}>
              <div className="p-2 text-[10px] text-muted-foreground border-b border-r border-border/30 bg-muted/20" />
              {CATEGORIES.map(c => (
                <div key={c.id} className="p-1.5 text-[9px] font-medium text-muted-foreground text-center border-b border-r border-border/30 bg-muted/20 truncate">
                  {c.label}
                </div>
              ))}
            </div>

            {/* Rows */}
            {grid.map((row, ri) => (
              <div key={row.role} className="grid" style={{ gridTemplateColumns: `120px repeat(${CATEGORIES.length}, 1fr)` }}>
                <div className="px-2 py-1 text-[11px] font-medium text-foreground border-b border-r border-border/20 truncate flex items-center">
                  {row.title}
                </div>
                {row.cells.map((score, ci) => (
                  <motion.div
                    key={ci}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: score === null ? 0.25 : 0.8 }}
                    transition={{ delay: 0.4 + ri * 0.02 + ci * 0.01 }}
                    className="border-b border-r border-border/10 h-7"
                    style={{ backgroundColor: getHeatColor(score) }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-center gap-2 py-2.5 bg-muted/20 border-t border-border/30">
          <span className="text-[11px] text-muted-foreground">30 roles × 8 categories</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
    </motion.div>
  );
}
