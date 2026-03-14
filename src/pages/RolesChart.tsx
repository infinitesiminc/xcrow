import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { findPrebuiltRole } from "@/data/prebuilt-roles";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  // Weighted: automation risk is primary signal, augmentation level indicates how
  // deeply AI is embedded (higher = more dependent = more replaceable by agents),
  // new skills signals disruption velocity
  return Math.round(automationRisk * 0.55 + augmented * 0.25 + newSkills * 0.20);
}

function getRiskTier(risk: number) {
  if (risk >= 45) return { label: "Critical", color: "hsl(0, 84%, 55%)" };
  if (risk >= 35) return { label: "High", color: "hsl(25, 95%, 53%)" };
  if (risk >= 25) return { label: "Moderate", color: "hsl(45, 93%, 47%)" };
  return { label: "Low", color: "hsl(142, 71%, 45%)" };
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const tier = getRiskTier(d.agentRisk);
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg max-w-[220px]">
      <p className="font-semibold text-sm text-foreground">{d.title}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: tier.color }}>{d.agentRisk}%</p>
      <p className="text-xs text-muted-foreground mt-0.5">{tier.label} Risk</p>
    </div>
  );
};

export default function RolesChart() {
  const navigate = useNavigate();

  const data = useMemo(() => {
    return ALL_ROLES.map((key) => {
      const role = findPrebuiltRole(key);
      if (!role) return null;
      const agentRisk = calcAgentRisk(
        role.summary.automationRiskPercent,
        role.summary.augmentedPercent,
        role.summary.newSkillsPercent,
      );
      return { title: role.jobTitle, agentRisk, key };
    })
      .filter(Boolean)
      .sort((a: any, b: any) => b.agentRisk - a.agentRisk) as {
      title: string; agentRisk: number; key: string;
    }[];
  }, []);

  const avg = Math.round(data.reduce((s, d) => s + d.agentRisk, 0) / data.length);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground font-[Space_Grotesk]">
            Replaced by AI Agent Risk
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            A single composite score measuring how likely each role is to be substantially replaced by autonomous AI agents within 1–3 years. Click any bar to explore the full analysis.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Average across all roles: <span className="font-semibold text-foreground">{avg}%</span>
          </p>
        </div>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">All 30 Roles — Ranked by Agent Risk</CardTitle>
            <CardDescription>
              Composite of automation exposure, AI dependency depth, and skill disruption velocity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full" style={{ height: data.length * 32 + 40 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, bottom: 5, left: 160 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis
                    type="number"
                    domain={[0, 70]}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="title"
                    tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    width={155}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
                  <Bar
                    dataKey="agentRisk"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(d: any) => navigate(`/analysis?title=${encodeURIComponent(d.title)}`)}
                  >
                    {data.map((entry, i) => (
                      <Cell key={i} fill={getRiskTier(entry.agentRisk).color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
