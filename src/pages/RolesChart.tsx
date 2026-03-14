import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine, Label } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

function getVerdict(automationRisk: number, augmented: number) {
  if (automationRisk >= 40) return { label: "Pivot", color: "hsl(0, 84%, 60%)" };
  if (augmented >= 65 && automationRisk < 25) return { label: "Leverage", color: "hsl(142, 71%, 45%)" };
  return { label: "Upskill", color: "hsl(234, 89%, 60%)" };
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const verdict = getVerdict(d.automationRisk, d.augmented);
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg max-w-[240px]">
      <p className="font-semibold text-sm text-foreground">{d.title}</p>
      <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
        <p>Automation Risk: <span className="text-foreground font-medium">{d.automationRisk}%</span></p>
        <p>AI Augmented: <span className="text-foreground font-medium">{d.augmented}%</span></p>
        <p>New Skills Needed: <span className="text-foreground font-medium">{d.newSkills}%</span></p>
        <p className="mt-1">
          Verdict: <span className="font-semibold" style={{ color: verdict.color }}>{verdict.label}</span>
        </p>
      </div>
    </div>
  );
};

export default function RolesChart() {
  const navigate = useNavigate();

  const data = useMemo(() => {
    return ALL_ROLES.map((key) => {
      const role = findPrebuiltRole(key);
      if (!role) return null;
      return {
        title: role.jobTitle,
        automationRisk: role.summary.automationRiskPercent,
        augmented: role.summary.augmentedPercent,
        newSkills: role.summary.newSkillsPercent,
        tasksCount: role.tasks.length,
        key,
      };
    }).filter(Boolean) as {
      title: string; automationRisk: number; augmented: number;
      newSkills: number; tasksCount: number; key: string;
    }[];
  }, []);

  const verdictCounts = useMemo(() => {
    const counts = { Pivot: 0, Upskill: 0, Leverage: 0 };
    data.forEach((d) => {
      const v = getVerdict(d.automationRisk, d.augmented);
      counts[v.label as keyof typeof counts]++;
    });
    return counts;
  }, [data]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground font-[Space_Grotesk]">
            AI Disruption Landscape
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            All 30 roles mapped by automation risk vs AI augmentation level. Bubble size = new skills required. Click any point to view the full analysis.
          </p>
        </div>

        {/* Summary badges */}
        <div className="flex gap-3 mb-8 flex-wrap">
          <Badge className="bg-[hsl(142,71%,45%)]/15 text-[hsl(142,71%,35%)] border-[hsl(142,71%,45%)]/30 px-3 py-1.5 text-sm">
            ● Leverage — {verdictCounts.Leverage} roles
          </Badge>
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1.5 text-sm">
            ● Upskill — {verdictCounts.Upskill} roles
          </Badge>
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 px-3 py-1.5 text-sm">
            ● Pivot — {verdictCounts.Pivot} roles
          </Badge>
        </div>

        {/* Chart */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Risk vs Augmentation Matrix</CardTitle>
            <CardDescription>
              Bottom-right = safest (high augmentation, low risk). Top-left = highest disruption.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[520px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis
                    type="number"
                    dataKey="augmented"
                    domain={[30, 90]}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                  >
                    <Label value="AI Augmentation %" position="bottom" offset={20} style={{ fill: "hsl(var(--muted-foreground))", fontSize: 13 }} />
                  </XAxis>
                  <YAxis
                    type="number"
                    dataKey="automationRisk"
                    domain={[0, 55]}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                  >
                    <Label value="Automation Risk %" angle={-90} position="left" offset={0} style={{ fill: "hsl(var(--muted-foreground))", fontSize: 13 }} />
                  </YAxis>
                  <ZAxis type="number" dataKey="newSkills" range={[200, 800]} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={40} stroke="hsl(0, 84%, 60%)" strokeDasharray="6 4" opacity={0.5} />
                  <ReferenceLine y={25} stroke="hsl(234, 89%, 60%)" strokeDasharray="6 4" opacity={0.3} />
                  <Scatter
                    data={data}
                    cursor="pointer"
                    onClick={(point: any) => {
                      navigate(`/analysis?title=${encodeURIComponent(point.title)}`);
                    }}
                  >
                    {data.map((entry, i) => {
                      const verdict = getVerdict(entry.automationRisk, entry.augmented);
                      return <Cell key={i} fill={verdict.color} fillOpacity={0.75} stroke={verdict.color} strokeWidth={1} />;
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Table view */}
        <Card className="mt-8 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">All Roles Ranked by Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Role</th>
                    <th className="py-2 px-4 font-medium text-right">Automation Risk</th>
                    <th className="py-2 px-4 font-medium text-right">AI Augmented</th>
                    <th className="py-2 px-4 font-medium text-right">New Skills</th>
                    <th className="py-2 px-4 font-medium">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data]
                    .sort((a, b) => b.automationRisk - a.automationRisk)
                    .map((role) => {
                      const verdict = getVerdict(role.automationRisk, role.augmented);
                      return (
                        <tr
                          key={role.key}
                          className="border-b border-border/40 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/analysis?title=${encodeURIComponent(role.title)}`)}
                        >
                          <td className="py-2.5 pr-4 font-medium text-foreground">{role.title}</td>
                          <td className="py-2.5 px-4 text-right tabular-nums">{role.automationRisk}%</td>
                          <td className="py-2.5 px-4 text-right tabular-nums">{role.augmented}%</td>
                          <td className="py-2.5 px-4 text-right tabular-nums">{role.newSkills}%</td>
                          <td className="py-2.5 px-4">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                color: verdict.color,
                                backgroundColor: `${verdict.color}20`,
                              }}
                            >
                              {verdict.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
