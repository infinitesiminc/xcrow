import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, Globe, Users, BookOpen, Loader2, TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

interface SchoolRow {
  id: string;
  name: string;
  state: string | null;
  carnegie_class: string | null;
  institution_type: string | null;
  enrollment: number | null;
  pipeline_stage: string | null;
  is_hbcu: boolean | null;
  plan_status: string;
  used_seats: number;
  total_seats: number;
}

interface ScrapeRow {
  school_id: string;
  status: string;
}

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
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [scrapes, setScrapes] = useState<ScrapeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [schoolRes, scrapeRes] = await Promise.all([
        supabase.from("school_accounts").select("id,name,state,carnegie_class,institution_type,enrollment,pipeline_stage,is_hbcu,plan_status,used_seats,total_seats"),
        supabase.from("school_curricula").select("school_id,status"),
      ]);

      // Paginate school_accounts to get all 4k+ rows
      let allSchools: SchoolRow[] = [];
      if (schoolRes.data) {
        allSchools = schoolRes.data as SchoolRow[];
        if (allSchools.length === 1000) {
          let from = 1000;
          const batchSize = 1000;
          let done = false;
          while (!done) {
            const { data } = await supabase
              .from("school_accounts")
              .select("id,name,state,carnegie_class,institution_type,enrollment,pipeline_stage,is_hbcu,plan_status,used_seats,total_seats")
              .range(from, from + batchSize - 1);
            if (data && data.length > 0) {
              allSchools = allSchools.concat(data as SchoolRow[]);
              from += batchSize;
              if (data.length < batchSize) done = true;
            } else {
              done = true;
            }
          }
        }
      }
      setSchools(allSchools);
      if (scrapeRes.data) setScrapes(scrapeRes.data as ScrapeRow[]);
      setLoading(false);
    }
    load();
  }, []);

  const stats = useMemo(() => {
    const scrapedSchoolIds = new Set(scrapes.filter(s => s.status === "completed").map(s => s.school_id));
    const customers = schools.filter(s => s.pipeline_stage === "customer" || (s.plan_status === "active" && s.used_seats > 0));
    const hbcus = schools.filter(s => s.is_hbcu);
    return {
      total: schools.length,
      scraped: scrapedSchoolIds.size,
      customers: customers.length,
      hbcus: hbcus.length,
    };
  }, [schools, scrapes]);

  const pipelineData = useMemo(() => {
    const counts: Record<string, number> = {};
    PIPELINE_ORDER.forEach(s => counts[s] = 0);
    schools.forEach(s => {
      const stage = s.pipeline_stage || "prospect";
      counts[stage] = (counts[stage] || 0) + 1;
    });
    return PIPELINE_ORDER.map(stage => ({ stage, count: counts[stage] || 0 }));
  }, [schools]);

  const carnegieData = useMemo(() => {
    const counts: Record<string, number> = {};
    schools.forEach(s => {
      const cls = s.carnegie_class || "Unknown";
      counts[cls] = (counts[cls] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name, value]) => ({ name, value }));
  }, [schools]);

  const stateData = useMemo(() => {
    const counts: Record<string, number> = {};
    schools.forEach(s => {
      if (s.state) counts[s.state] = (counts[s.state] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([state, count]) => ({ state, count }));
  }, [schools]);

  const totalEnrollment = useMemo(() =>
    schools.reduce((sum, s) => sum + (s.enrollment || 0), 0),
  [schools]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const kpis = [
    { label: "Total Institutions", value: stats.total.toLocaleString(), icon: GraduationCap, color: "text-[hsl(var(--neon-purple))]" },
    { label: "Scraped", value: stats.scraped.toLocaleString(), icon: BookOpen, color: "text-[hsl(var(--neon-cyan))]" },
    { label: "Customers", value: stats.customers.toLocaleString(), icon: Users, color: "text-[hsl(var(--success))]" },
    { label: "HBCUs", value: stats.hbcus.toLocaleString(), icon: Globe, color: "text-[hsl(var(--neon-pink))]" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
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
              <span className="font-medium">{stats.scraped} / {stats.total}</span>
            </div>
            <Progress value={(stats.scraped / Math.max(stats.total, 1)) * 100} className="h-2" />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Enrollment</p>
              <p className="text-lg font-bold font-[Space_Grotesk]">{totalEnrollment.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Avg Enrollment</p>
              <p className="text-lg font-bold font-[Space_Grotesk]">{stats.total ? Math.round(totalEnrollment / stats.total).toLocaleString() : 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
