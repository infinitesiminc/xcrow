import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { findPrebuiltRole } from "@/data/prebuilt-roles";
import { ArrowLeft, TrendingUp, RefreshCw, Rocket, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobAnalysisResult } from "@/types/analysis";

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

function calcAgentRisk(automationRisk: number, augmented: number, newSkills: number) {
  return Math.round(automationRisk * 0.55 + augmented * 0.25 + newSkills * 0.20);
}

function getRiskTier(risk: number) {
  if (risk >= 45) return { label: "Critical", color: "hsl(0, 84%, 55%)" };
  if (risk >= 35) return { label: "High", color: "hsl(25, 95%, 53%)" };
  if (risk >= 25) return { label: "Moderate", color: "hsl(45, 93%, 47%)" };
  return { label: "Low", color: "hsl(142, 71%, 45%)" };
}

type Verdict = "upskill" | "pivot" | "leverage";

interface RoleRecommendation {
  verdict: Verdict;
  headline: string;
  reasoning: string;
  actions: string[];
}

function getRecommendation(role: JobAnalysisResult, agentRisk: number): RoleRecommendation {
  const { automationRiskPercent, augmentedPercent } = role.summary;
  const fullyAiSoonTasks = role.tasks.filter((t) => t.trend === "fully_ai_soon").length;
  const mostlyHumanTasks = role.tasks.filter((t) => t.currentState === "mostly_human").length;
  const totalTasks = role.tasks.length;
  const aiToolSkills = role.skills.filter((s) => s.category === "ai_tools");
  const humanSkills = role.skills.filter((s) => s.category === "human_skills");

  // Data-driven verdict logic
  if (agentRisk >= 45 || (automationRiskPercent >= 40 && fullyAiSoonTasks >= 3)) {
    // High risk: most tasks heading to full AI — pivot
    return {
      verdict: "pivot",
      headline: "Consider a Career Pivot",
      reasoning: `${fullyAiSoonTasks} of ${totalTasks} core tasks are trending toward full AI agent automation. With ${automationRiskPercent}% automation risk, the role's value proposition is eroding faster than upskilling can offset.`,
      actions: [
        `Your ${humanSkills.length} human-centric skills (${humanSkills.slice(0, 2).map((s) => s.name).join(", ")}) transfer to adjacent roles with lower agent risk`,
        "Target roles where human judgment, relationships, or creativity are the primary value — not process execution",
        "Build a transition plan within 12–18 months while your domain expertise is still a differentiator",
      ],
    };
  }

  if (agentRisk <= 28 && mostlyHumanTasks >= 3 && augmentedPercent >= 55) {
    // Low risk + high augmentation = leverage opportunity
    return {
      verdict: "leverage",
      headline: "Leverage AI to Scale Your Impact",
      reasoning: `${mostlyHumanTasks} of ${totalTasks} tasks remain primarily human-driven while AI augments ${augmentedPercent}% of your work. This creates a multiplier effect — your domain expertise + AI tools = outsized output.`,
      actions: [
        `Master ${aiToolSkills.slice(0, 2).map((s) => s.name).join(" and ")} to 10x your individual output`,
        "Position yourself as the AI-native expert in your field — train others, build workflows, or consult",
        "Consider starting an AI-augmented practice or productizing your expertise",
      ],
    };
  }

  // Default: upskill
  return {
    verdict: "upskill",
    headline: "Upskill to Stay Ahead",
    reasoning: `${fullyAiSoonTasks} of ${totalTasks} tasks are moving toward AI automation, but ${mostlyHumanTasks} remain firmly human. Proactive upskilling in AI tools keeps you competitive as the role evolves.`,
    actions: [
      `Prioritize learning ${aiToolSkills.slice(0, 2).map((s) => s.name).join(" and ")} — these directly address your most at-risk tasks`,
      `Double down on ${humanSkills.slice(0, 1).map((s) => s.name).join("")} — the tasks AI can't replace in your role`,
      "Aim to become the person who orchestrates AI tools in your team, not the one replaced by them",
    ],
  };
}

const verdictConfig = {
  upskill: { icon: TrendingUp, color: "hsl(234, 89%, 60%)", bg: "bg-primary/10", text: "text-primary", label: "Upskill" },
  pivot: { icon: RefreshCw, color: "hsl(0, 84%, 55%)", bg: "bg-destructive/10", text: "text-destructive", label: "Pivot" },
  leverage: { icon: Rocket, color: "hsl(142, 71%, 45%)", bg: "bg-green-500/10", text: "text-green-600", label: "Leverage" },
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const tier = getRiskTier(d.agentRisk);
  const vc = verdictConfig[d.verdict as Verdict];
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg max-w-[240px]">
      <p className="font-semibold text-sm text-foreground">{d.title}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: tier.color }}>{d.agentRisk}%</p>
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: vc.color, backgroundColor: `${vc.color}20` }}>
          {vc.label}
        </span>
        <span className="text-xs text-muted-foreground">{tier.label} Risk</span>
      </div>
    </div>
  );
};

export default function RolesChart() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);

  const data = useMemo(() => {
    return ALL_ROLES.map((key) => {
      const role = findPrebuiltRole(key);
      if (!role) return null;
      const agentRisk = calcAgentRisk(
        role.summary.automationRiskPercent,
        role.summary.augmentedPercent,
        role.summary.newSkillsPercent,
      );
      const rec = getRecommendation(role, agentRisk);
      return { title: role.jobTitle, agentRisk, key, verdict: rec.verdict, recommendation: rec, role };
    })
      .filter(Boolean)
      .sort((a: any, b: any) => b.agentRisk - a.agentRisk) as {
      title: string; agentRisk: number; key: string; verdict: Verdict;
      recommendation: RoleRecommendation; role: JobAnalysisResult;
    }[];
  }, []);

  const avg = Math.round(data.reduce((s, d) => s + d.agentRisk, 0) / data.length);
  const counts = useMemo(() => {
    const c = { upskill: 0, pivot: 0, leverage: 0 };
    data.forEach((d) => c[d.verdict]++);
    return c;
  }, [data]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground font-[Space_Grotesk]">
            Replaced by AI Agent Risk
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Each role scored by agent replacement risk with a data-driven recommendation: <strong>Upskill</strong> in your role, <strong>Pivot</strong> to a safer career, or <strong>Leverage</strong> AI to build something new.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          <Card className="border-border/50 p-4">
            <p className="text-xs text-muted-foreground">Avg Risk</p>
            <p className="text-2xl font-bold text-foreground">{avg}%</p>
          </Card>
          {(["leverage", "upskill", "pivot"] as Verdict[]).map((v) => {
            const vc = verdictConfig[v];
            const Icon = vc.icon;
            return (
              <Card key={v} className="border-border/50 p-4">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" style={{ color: vc.color }} />
                  <p className="text-xs text-muted-foreground">{vc.label}</p>
                </div>
                <p className="text-2xl font-bold" style={{ color: vc.color }}>{counts[v]}</p>
              </Card>
            );
          })}
        </div>

        {/* Chart */}
        <Card className="border-border/50 mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">All 30 Roles — Ranked by Agent Risk</CardTitle>
            <CardDescription>Click any bar to see the full role analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full" style={{ height: data.length * 32 + 40 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, bottom: 5, left: 160 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis type="number" domain={[0, 70]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="title" tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} tickLine={false} axisLine={false} width={155} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
                  <Bar dataKey="agentRisk" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(d: any) => navigate(`/analysis?title=${encodeURIComponent(d.title)}`)}>
                    {data.map((entry, i) => (
                      <Cell key={i} fill={getRiskTier(entry.agentRisk).color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations table */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Data-Driven Recommendations</CardTitle>
            <CardDescription>Based on task automation trends, skill composition, and agent disruption analysis per role.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.map((d) => {
              const vc = verdictConfig[d.verdict];
              const Icon = vc.icon;
              const isExpanded = expanded === d.key;
              return (
                <div key={d.key} className="border border-border/40 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : d.key)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="text-sm font-semibold text-foreground min-w-[160px]">{d.title}</span>
                    <span className="text-sm font-bold tabular-nums min-w-[40px]" style={{ color: getRiskTier(d.agentRisk).color }}>
                      {d.agentRisk}%
                    </span>
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${vc.bg} ${vc.text}`}>
                      <Icon className="w-3 h-3" /> {vc.label}
                    </span>
                    <span className="text-xs text-muted-foreground flex-1 truncate hidden sm:block">
                      {d.recommendation.headline}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-border/30 bg-muted/20">
                      <p className="text-sm text-foreground font-medium mb-2">{d.recommendation.headline}</p>
                      <p className="text-sm text-muted-foreground mb-3">{d.recommendation.reasoning}</p>
                      <ul className="space-y-2">
                        {d.recommendation.actions.map((action, i) => (
                          <li key={i} className="text-sm text-foreground flex gap-2">
                            <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => navigate(`/analysis?title=${encodeURIComponent(d.title)}`)}
                      >
                        View Full Analysis →
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
