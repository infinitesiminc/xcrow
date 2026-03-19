import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, Globe, Users, BookOpen, Loader2, TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

const PIPELINE_ORDER = ["prospect", "contacted", "scraped", "demo", "customer"];
const PIPELINE_COLORS: Record<string, string> = {
  prospect: "hsl(var(--muted-foreground))",
  contacted: "hsl(var(--neon-blue))",
  scraped: "hsl(var(--neon-cyan))",
  demo: "hsl(var(--neon-purple))",
  customer: "hsl(var(--success))",
};

const CARNEGIE_COLORS = [
  "hsl(var(--neon-purple))",
  "hsl(var(--neon-blue))",
  "hsl(var(--neon-cyan))",
  "hsl(var(--neon-pink))",
  "hsl(var(--neon-lime))",
  "hsl(var(--warning))",
  "hsl(var(--muted-foreground))",
];

export default function SchoolAnalyticsDashboard({ onFilterPipeline }: { onFilterPipeline?: (stage: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.rpc("get_school_dashboard_stats");
      setStatsData(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const parsed = useMemo(() => {
    if (statsData.length === 0) return null;
    const first = statsData[0];
    const kpis = {
      total: Number(first.total_schools),
      customers: Number(first.total_customers),
      hbcus: Number(first.total_hbcus),
      scraped: Number(first.total_scraped),
      totalEnrollment: Number(first.total_enrollment),
    };

    // Deduplicate pipeline, carnegie, states from cross-join rows
    const pipelineMap = new Map<string, number>();
    const carnegieMap = new Map<string, number>();
    const stateMap = new Map<string, number>();

    statsData.forEach((row: any) => {
      if (row.pipeline_stage && !pipelineMap.has(row.pipeline_stage)) {
        pipelineMap.set(row.pipeline_stage, Number(row.pipeline_count));
      }
      if (row.carnegie_class && !carnegieMap.has(row.carnegie_class)) {
        carnegieMap.set(row.carnegie_class, Number(row.carnegie_count));
      }
      if (row.state && !stateMap.has(row.state)) {
        stateMap.set(row.state, Number(row.state_count));
      }
    });

    const pipelineData = PIPELINE_ORDER.map(stage => ({
      stage,
      count: pipelineMap.get(stage) || 0,
    }));

    const carnegieData = [...carnegieMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    const stateData = [...stateMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([state, count]) => ({ state, count }));

    return { kpis, pipelineData, carnegieData, stateData };
  }, [statsData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!parsed) return null;

  const { kpis, pipelineData, carnegieData, stateData } = parsed;
  const kpiCards = [
    { label: "Total Institutions", value: kpis.total.toLocaleString(), icon: GraduationCap, color: "text-[hsl(var(--neon-purple))]" },
    { label: "Scraped", value: kpis.scraped.toLocaleString(), icon: BookOpen, color: "text-[hsl(var(--neon-cyan))]" },
    { label: "Customers", value: kpis.customers.toLocaleString(), icon: Users, color: "text-[hsl(var(--success))]" },
    { label: "HBCUs", value: kpis.hbcus.toLocaleString(), icon: Globe, color: "text-[hsl(var(--neon-pink))]" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border/50 bg-card/80">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="text-2xl font-bold font-[Space_Grotesk] tracking-tight">{kpi.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pipeline Funnel */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Pipeline Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis
                  dataKey="stage"
                  type="category"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  width={80}
                  tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)}
                />
                <RechartsTooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Bar
                  dataKey="count"
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                  onClick={(d: any) => onFilterPipeline?.(d.stage)}
                >
                  {pipelineData.map((entry) => (
                    <Cell key={entry.stage} fill={PIPELINE_COLORS[entry.stage] || "hsl(var(--muted))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Two-column charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Carnegie Distribution */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Institution Types (Carnegie)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={carnegieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {carnegieData.map((_, i) => (
                      <Cell key={i} fill={CARNEGIE_COLORS[i % CARNEGIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top States */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top States</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateData} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="state" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} angle={-45} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(var(--neon-blue))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scrape Coverage */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Scrape Coverage & Enrollment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Scraped</span>
              <span className="font-medium">{kpis.scraped} / {kpis.total}</span>
            </div>
            <Progress value={(kpis.scraped / Math.max(kpis.total, 1)) * 100} className="h-2" />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Enrollment</p>
              <p className="text-lg font-bold font-[Space_Grotesk]">{kpis.totalEnrollment.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Avg Enrollment</p>
              <p className="text-lg font-bold font-[Space_Grotesk]">{kpis.total ? Math.round(kpis.totalEnrollment / kpis.total).toLocaleString() : 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
