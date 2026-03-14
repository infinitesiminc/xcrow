import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, Users, Bot, ShieldAlert, GraduationCap, Search,
  ArrowUpDown, ChevronDown, ChevronUp, BarChart3, TrendingUp,
  AlertTriangle, CheckCircle2, Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface DbJob {
  id: string;
  title: string;
  department: string | null;
  seniority: string | null;
  augmented_percent: number | null;
  automation_risk_percent: number | null;
  new_skills_percent: number | null;
  company_id: string | null;
  description: string | null;
  _analysed: boolean;
  _hasDescription: boolean;
}

type SortField = "title" | "automation_risk_percent" | "augmented_percent" | "new_skills_percent" | "department";
type SortDir = "asc" | "desc";

// Deterministic hash to generate consistent mock scores from a job title
const hashStr = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const mockScores = (title: string) => {
  const h = hashStr(title.toLowerCase());
  const automation_risk_percent = 15 + (h % 65);            // 15-79
  const augmented_percent = 20 + ((h >> 4) % 60);           // 20-79
  const new_skills_percent = 10 + ((h >> 8) % 55);          // 10-64
  return { automation_risk_percent, augmented_percent, new_skills_percent };
};

const AI_TOOLS = ["ChatGPT", "Copilot", "Claude", "Midjourney", "Gemini", "Cursor", "Notion AI", "Jasper", "Perplexity", "Zapier AI"];

const mockToolProficiency = (title: string) => {
  const h = hashStr(title.toLowerCase() + "_tools");
  const count = 1 + (h % 4); // 1-4 tools
  const tools: { name: string; level: "beginner" | "intermediate" | "advanced" }[] = [];
  for (let i = 0; i < count; i++) {
    const idx = (h + i * 7) % AI_TOOLS.length;
    const lvl = ((h >> (i + 2)) % 3);
    tools.push({ name: AI_TOOLS[idx], level: lvl === 0 ? "beginner" : lvl === 1 ? "intermediate" : "advanced" });
  }
  const avgLevel = Math.round(tools.reduce((s, t) => s + (t.level === "beginner" ? 33 : t.level === "intermediate" ? 66 : 100), 0) / tools.length);
  return { tools, avgLevel };
};

const TASKS_PER_JOB = 12;

const mockPracticeProgress = (title: string) => {
  const h = hashStr(title.toLowerCase() + "_practice");
  const practised = h % (TASKS_PER_JOB + 1); // 0-12 tasks practised
  const avgScore = practised > 0 ? 30 + (h >> 3) % 60 : 0; // 30-89% avg score
  return { practised, avgScore };
};

const riskBadge = (risk: number) => {
  if (risk >= 60) return { label: "High Risk", className: "bg-destructive/10 text-destructive border-destructive/20" };
  if (risk >= 35) return { label: "Moderate", className: "bg-warning/10 text-warning border-warning/20" };
  return { label: "Lower Risk", className: "bg-success/10 text-success border-success/20" };
};

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("automation_risk_percent");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    const fetchJobs = async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id, title, department, seniority, augmented_percent, automation_risk_percent, new_skills_percent, company_id, description")
        .order("title");
      if (data) {
        setJobs(data.map((j) => {
          const hasRealScores = !!(j.automation_risk_percent && j.automation_risk_percent > 0);
          const scores = mockScores(j.title);
          return {
            ...j,
            _analysed: hasRealScores,
            _hasDescription: !!j.description,
            automation_risk_percent: j.automation_risk_percent || scores.automation_risk_percent,
            augmented_percent: j.augmented_percent || scores.augmented_percent,
            new_skills_percent: j.new_skills_percent || scores.new_skills_percent,
          };
        }));
      }
      setLoading(false);
    };
    fetchJobs();
  }, []);

  const departments = useMemo(() => {
    const depts = new Set<string>();
    jobs.forEach((j) => j.department && depts.add(j.department));
    return Array.from(depts).sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    let list = jobs;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((j) => j.title.toLowerCase().includes(q) || j.department?.toLowerCase().includes(q));
    }
    if (deptFilter !== "all") {
      list = list.filter((j) => j.department === deptFilter);
    }
    // Primary sort: analysed first, then has description, then rest
    list = [...list].sort((a, b) => {
      const statusA = a._analysed ? 2 : a._hasDescription ? 1 : 0;
      const statusB = b._analysed ? 2 : b._hasDescription ? 1 : 0;
      if (statusA !== statusB) return statusB - statusA;
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return list;
  }, [jobs, search, deptFilter, sortField, sortDir]);

  // Aggregates
  const stats = useMemo(() => {
    if (jobs.length === 0) return null;
    const avgAug = Math.round(jobs.reduce((s, j) => s + (j.augmented_percent ?? 0), 0) / jobs.length);
    const avgRisk = Math.round(jobs.reduce((s, j) => s + (j.automation_risk_percent ?? 0), 0) / jobs.length);
    const avgSkills = Math.round(jobs.reduce((s, j) => s + (j.new_skills_percent ?? 0), 0) / jobs.length);
    const highRisk = jobs.filter((j) => (j.automation_risk_percent ?? 0) >= 60).length;
    const moderate = jobs.filter((j) => {
      const r = j.automation_risk_percent ?? 0;
      return r >= 35 && r < 60;
    }).length;
    const lower = jobs.length - highRisk - moderate;
    return { avgAug, avgRisk, avgSkills, highRisk, moderate, lower };
  }, [jobs]);

  // Department breakdown
  const deptBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; avgRisk: number; avgAug: number }>();
    jobs.forEach((j) => {
      const d = j.department || "Uncategorized";
      const existing = map.get(d) || { count: 0, avgRisk: 0, avgAug: 0 };
      existing.count++;
      existing.avgRisk += j.automation_risk_percent ?? 0;
      existing.avgAug += j.augmented_percent ?? 0;
      map.set(d, existing);
    });
    return Array.from(map.entries())
      .map(([dept, data]) => ({
        dept,
        count: data.count,
        avgRisk: Math.round(data.avgRisk / data.count),
        avgAug: Math.round(data.avgAug / data.count),
      }))
      .sort((a, b) => b.avgRisk - a.avgRisk);
  }, [jobs]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 ml-1 text-primary" />
      : <ChevronDown className="h-3 w-3 ml-1 text-primary" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading workforce data…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-sans font-bold text-foreground">Company Workforce Dashboard</h1>
              <p className="text-sm text-muted-foreground">AI readiness overview across {jobs.length} roles</p>
            </div>
          </div>
        </motion.div>

        {/* Stat Cards */}
        {stats && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Roles</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{jobs.length}</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-destructive/10 shrink-0">
                      <ShieldAlert className="h-4 w-4 text-destructive" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Automation Risk</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats.avgRisk}%</p>
                  <Progress value={stats.avgRisk} className="mt-2 h-1.5" />
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg AI Augmented</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats.avgAug}%</p>
                  <Progress value={stats.avgAug} className="mt-2 h-1.5" />
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-warning/10 shrink-0">
                      <GraduationCap className="h-4 w-4 text-warning" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg New Skills</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats.avgSkills}%</p>
                  <Progress value={stats.avgSkills} className="mt-2 h-1.5" />
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Risk Distribution */}
        {stats && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Risk Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-destructive/5 border border-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{stats.highRisk}</p>
                    <p className="text-xs text-muted-foreground">High Risk (≥60%)</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-warning/5 border border-warning/10">
                    <TrendingUp className="h-5 w-5 text-warning mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{stats.moderate}</p>
                    <p className="text-xs text-muted-foreground">Moderate (35–59%)</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-success/5 border border-success/10">
                    <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{stats.lower}</p>
                    <p className="text-xs text-muted-foreground">Lower Risk (&lt;35%)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}


        {/* Roles Table */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">All Roles</h2>
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search roles…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="h-8 w-auto min-w-[140px] text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-xs text-muted-foreground ml-auto">{filtered.length} roles</span>
          </div>

          <Card className="border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("title")}>
                      <span className="flex items-center text-xs">Role <SortIcon field="title" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("department")}>
                      <span className="flex items-center text-xs">Department <SortIcon field="department" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("automation_risk_percent")}>
                      <span className="flex items-center justify-end text-xs">Risk <SortIcon field="automation_risk_percent" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("augmented_percent")}>
                      <span className="flex items-center justify-end text-xs">AI Augmented <SortIcon field="augmented_percent" /></span>
                    </TableHead>
                     <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("new_skills_percent")}>
                       <span className="flex items-center justify-end text-xs">New Skills <SortIcon field="new_skills_percent" /></span>
                     </TableHead>
                     <TableHead className="text-center">
                       <span className="text-xs">Staff Upskill</span>
                     </TableHead>
                     <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 100).map((job) => {
                    const risk = job.automation_risk_percent ?? 0;
                    const badge = riskBadge(risk);
                    return (
                      <TableRow key={job.id} className="group">
                        <TableCell className="font-medium text-sm text-foreground max-w-[240px]">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{job.title}</span>
                            {job.seniority && (
                              <span className="text-[10px] text-muted-foreground shrink-0">{job.seniority}</span>
                            )}
                          </div>
                          {job._analysed ? (
                            <Badge variant="outline" className="mt-1 text-[9px] bg-primary/10 text-primary border-primary/20">Analysed</Badge>
                          ) : job._hasDescription ? (
                            <Badge variant="outline" className="mt-1 text-[9px] bg-accent/50 text-accent-foreground border-accent/30">Analysis Ready</Badge>
                          ) : (
                            <Badge variant="outline" className="mt-1 text-[9px] bg-muted text-muted-foreground border-border">Title Only</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{job.department || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={`text-[10px] ${badge.className}`}>
                            {risk}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-foreground">{job.augmented_percent ?? 0}%</TableCell>
                         <TableCell className="text-right text-sm text-foreground">{job.new_skills_percent ?? 0}%</TableCell>
                         <TableCell>
                           {(() => {
                             const { practised, avgScore } = mockPracticeProgress(job.title);
                             const pct = Math.round((practised / TASKS_PER_JOB) * 100);
                             const scoreColor = avgScore >= 70 ? "text-success" : avgScore >= 40 ? "text-warning" : "text-destructive";
                             const barColor = avgScore >= 70 ? "bg-success" : avgScore >= 40 ? "bg-warning" : "bg-destructive";
                             return (
                               <div className="min-w-[100px]">
                                 <div className="flex items-center justify-between text-[10px] mb-1">
                                   <span className="text-muted-foreground">{practised}/{TASKS_PER_JOB} tasks</span>
                                   {practised > 0 && <span className={scoreColor}>{avgScore}%</span>}
                                 </div>
                                 <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                                   <div className={`h-full rounded-full ${barColor} transition-all duration-700`} style={{ width: `${pct}%` }} />
                                 </div>
                               </div>
                             );
                           })()}
                         </TableCell>
                         <TableCell>
                           <Button
                             variant="ghost"
                             size="sm"
                             className="h-7 text-xs gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                             onClick={() => {
                               const params = new URLSearchParams({ title: job.title });
                               navigate(`/analysis?${params.toString()}`);
                             }}
                           >
                             <Search className="h-3 w-3" /> Analyze
                           </Button>
                         </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {filtered.length > 100 && (
              <div className="p-3 text-center text-xs text-muted-foreground border-t border-border">
                Showing 100 of {filtered.length} roles. Use search or filters to narrow down.
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
