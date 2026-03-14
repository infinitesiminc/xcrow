import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { findPrebuiltRole } from "@/data/prebuilt-roles";
import { TaskAnalysis } from "@/types/analysis";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const ALL_ROLES = [
  "software engineer", "marketing manager", "accountant", "data scientist",
  "product manager", "hr manager", "financial analyst", "ux designer",
  "project manager", "operations manager", "content strategist",
  "cybersecurity analyst", "supply chain manager", "business analyst",
  "seo specialist", "devops engineer", "social media manager",
  "customer success manager", "qa manager", "investment banker",
  "tax advisor", "risk manager", "brand strategist",
  "compliance officer", "auditor", "paralegal",
  "corporate lawyer", "contract attorney", "ip specialist",
  "legal ops manager",
];

const TASK_CATEGORIES = [
  { id: "content", label: "Content & Writing", keywords: ["content", "writing", "copy", "documentation", "report", "drafting", "editorial", "brief", "prd", "spec", "pitch"] },
  { id: "data", label: "Data & Analysis", keywords: ["data", "analysis", "analytics", "research", "metrics", "modeling", "quantitative", "forecast", "performance", "reporting", "sampling", "testing"] },
  { id: "strategy", label: "Strategy & Planning", keywords: ["strategy", "planning", "roadmap", "prioriti", "design", "architecture", "scoping", "go-to-market", "vision", "development"] },
  { id: "process", label: "Process & Automation", keywords: ["processing", "automation", "pipeline", "provisioning", "patching", "entry", "bookkeeping", "payroll", "invoice", "monitoring", "tracking", "scheduling", "compliance monitor"] },
  { id: "review", label: "Review & Quality", keywords: ["review", "audit", "quality", "testing", "oversight", "control", "verification", "assessment", "evaluation", "judgment"] },
  { id: "comms", label: "Communication & Relationships", keywords: ["communication", "stakeholder", "client", "presentation", "negotiation", "relationship", "advisory", "consultation", "community", "customer"] },
  { id: "research", label: "Research & Investigation", keywords: ["research", "investigation", "due diligence", "competitor", "market", "regulatory", "algorithm", "persona", "user research", "industry"] },
  { id: "creative", label: "Creative & Design", keywords: ["creative", "design", "wireframe", "prototype", "visual", "brand", "campaign", "ad", "email market"] },
];

function classifyTask(task: TaskAnalysis): string[] {
  const name = task.name.toLowerCase();
  const desc = task.description.toLowerCase();
  const matches: string[] = [];
  for (const cat of TASK_CATEGORIES) {
    if (cat.keywords.some((k) => name.includes(k) || desc.includes(k))) {
      matches.push(cat.id);
    }
  }
  return matches.length > 0 ? matches : ["process"]; // default
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
  return score; // max 8
}

function getHeatColor(score: number | null): string {
  if (score === null) return "hsl(var(--muted))";
  if (score >= 7) return "hsl(0, 84%, 55%)";
  if (score >= 6) return "hsl(15, 90%, 55%)";
  if (score >= 5) return "hsl(30, 95%, 53%)";
  if (score >= 4) return "hsl(45, 93%, 50%)";
  if (score >= 3) return "hsl(60, 80%, 50%)";
  return "hsl(142, 71%, 50%)";
}

function getHeatLabel(score: number | null): string {
  if (score === null) return "N/A";
  if (score >= 7) return "Critical";
  if (score >= 5) return "High";
  if (score >= 3) return "Moderate";
  return "Low";
}

interface CellData {
  score: number | null;
  tasks: { name: string; score: number }[];
}

export default function Heatmap() {
  const navigate = useNavigate();
  const [hoveredCell, setHoveredCell] = useState<{ role: string; cat: string } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const { grid, roles, agentRisks } = useMemo(() => {
    const grid: Record<string, Record<string, CellData>> = {};
    const agentRisks: Record<string, number> = {};
    const rolesData: { key: string; title: string }[] = [];

    for (const key of ALL_ROLES) {
      const role = findPrebuiltRole(key);
      if (!role) continue;
      rolesData.push({ key, title: role.jobTitle });
      grid[key] = {};

      // Agent replacement risk (same formula as RolesChart)
      agentRisks[key] = Math.round(
        role.summary.automationRiskPercent * 0.55 +
        role.summary.augmentedPercent * 0.25 +
        role.summary.newSkillsPercent * 0.20,
      );

      for (const cat of TASK_CATEGORIES) {
        grid[key][cat.id] = { score: null, tasks: [] };
      }

      for (const task of role.tasks) {
        const categories = classifyTask(task);
        const score = getDisruptionScore(task);
        for (const catId of categories) {
          if (grid[key][catId]) {
            grid[key][catId].tasks.push({ name: task.name, score });
          }
        }
      }

      // Calculate average score per category
      for (const cat of TASK_CATEGORIES) {
        const cell = grid[key][cat.id];
        if (cell.tasks.length > 0) {
          cell.score = Math.round(cell.tasks.reduce((s, t) => s + t.score, 0) / cell.tasks.length);
        }
      }
    }

    // Sort roles by agent risk (highest first)
    rolesData.sort((a, b) => (agentRisks[b.key] || 0) - (agentRisks[a.key] || 0));

    return { grid, roles: rolesData, agentRisks };
  }, []);

  const hoveredData = hoveredCell ? grid[hoveredCell.role]?.[hoveredCell.cat] : null;
  const hoveredRole = hoveredCell ? roles.find((r) => r.key === hoveredCell.role) : null;
  const hoveredCat = hoveredCell ? TASK_CATEGORIES.find((c) => c.id === hoveredCell.cat) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/roles-chart")} className="mb-6 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Risk Chart
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground font-[Space_Grotesk]">
            AI Disruption Heatmap
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Every role × every task category. Red = AI agents are replacing this work. Green = still safely human. Hover any cell for details.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mb-6 text-xs text-muted-foreground">
          <span>Low risk</span>
          <div className="flex gap-0.5">
            {[
              "hsl(142, 71%, 50%)",
              "hsl(60, 80%, 50%)",
              "hsl(45, 93%, 50%)",
              "hsl(30, 95%, 53%)",
              "hsl(15, 90%, 55%)",
              "hsl(0, 84%, 55%)",
            ].map((c, i) => (
              <div key={i} className="w-6 h-4 rounded-sm" style={{ backgroundColor: c }} />
            ))}
          </div>
          <span>Critical</span>
          <div className="ml-4 flex items-center gap-1">
            <div className="w-6 h-4 rounded-sm bg-muted border border-border/50" />
            <span>No data</span>
          </div>
        </div>

        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Header row */}
                <div className="grid" style={{ gridTemplateColumns: "180px repeat(8, 1fr)" }}>
                  <div className="p-3 text-xs font-medium text-muted-foreground border-b border-r border-border/40 bg-muted/30">
                    Role
                  </div>
                  {TASK_CATEGORIES.map((cat) => (
                    <div
                      key={cat.id}
                      className="p-2 text-[10px] leading-tight font-medium text-muted-foreground border-b border-r border-border/40 bg-muted/30 text-center"
                    >
                      {cat.label}
                    </div>
                  ))}
                </div>

                {/* Data rows */}
                {roles.map((role) => (
                  <div
                    key={role.key}
                    className="grid hover:bg-muted/20 transition-colors"
                    style={{ gridTemplateColumns: "180px repeat(8, 1fr)" }}
                  >
                    <div
                      className="p-2.5 text-xs font-medium text-foreground border-b border-r border-border/30 flex items-center cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/analysis?title=${encodeURIComponent(role.title)}`)}
                    >
                      {role.title}
                    </div>
                    {TASK_CATEGORIES.map((cat) => {
                      const cell = grid[role.key]?.[cat.id];
                      const score = cell?.score ?? null;
                      return (
                        <div
                          key={cat.id}
                          className="border-b border-r border-border/20 relative cursor-default"
                          style={{
                            backgroundColor: getHeatColor(score),
                            opacity: score === null ? 0.3 : 0.85,
                          }}
                          onMouseEnter={(e) => {
                            setHoveredCell({ role: role.key, cat: cat.id });
                            setTooltipPos({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          <div className="h-9 flex items-center justify-center">
                            {score !== null && (
                              <span className="text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                                {score}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tooltip */}
        {hoveredCell && hoveredData && hoveredRole && hoveredCat && (
          <div
            className="fixed z-50 pointer-events-none bg-card border border-border rounded-lg p-3 shadow-xl max-w-[260px]"
            style={{
              left: Math.min(tooltipPos.x + 16, window.innerWidth - 280),
              top: Math.min(tooltipPos.y - 10, window.innerHeight - 200),
            }}
          >
            <p className="font-semibold text-sm text-foreground">{hoveredRole.title}</p>
            <p className="text-xs text-muted-foreground mb-2">{hoveredCat.label}</p>
            {hoveredData.score !== null ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getHeatColor(hoveredData.score) }} />
                  <span className="text-xs font-medium" style={{ color: getHeatColor(hoveredData.score) }}>
                    {getHeatLabel(hoveredData.score)} ({hoveredData.score}/8)
                  </span>
                </div>
                <div className="space-y-1">
                  {hoveredData.tasks.map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-foreground truncate mr-2">{t.name}</span>
                      <span className="font-mono shrink-0" style={{ color: getHeatColor(t.score) }}>{t.score}/8</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No tasks mapped to this category</p>
            )}
          </div>
        )}

        {/* Insights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50 p-4">
            <p className="text-xs text-muted-foreground mb-1">Most Disrupted Category</p>
            <p className="font-semibold text-foreground">Process & Automation</p>
            <p className="text-xs text-muted-foreground mt-1">Autonomous agents excel at repetitive, rule-based workflows</p>
          </Card>
          <Card className="border-border/50 p-4">
            <p className="text-xs text-muted-foreground mb-1">Safest Category</p>
            <p className="font-semibold text-foreground">Communication & Relationships</p>
            <p className="text-xs text-muted-foreground mt-1">Human trust, empathy, and negotiation remain irreplaceable</p>
          </Card>
          <Card className="border-border/50 p-4">
            <p className="text-xs text-muted-foreground mb-1">Fastest Moving</p>
            <p className="font-semibold text-foreground">Content & Writing</p>
            <p className="text-xs text-muted-foreground mt-1">Generative AI is accelerating content disruption across all roles</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
