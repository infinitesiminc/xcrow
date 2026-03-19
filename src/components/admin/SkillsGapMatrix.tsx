import { useState, useEffect, useMemo } from "react";
import { Loader2, TrendingUp, AlertTriangle, CheckCircle2, Zap, BookOpen, Cpu } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  schoolId: string;
  schoolName: string;
}

interface CourseData {
  program_name: string;
  degree_type: string | null;
  skills_extracted: string[] | null;
  tools_taught: string[] | null;
  ai_content_flag: boolean | null;
  industry_sectors: string[] | null;
  skill_categories: Record<string, string[]> | null;
}

interface MarketSkill {
  skill_name: string;
  demand_count: number;
  avg_exposure: number;
  avg_impact: number;
  high_priority_count: number;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fuzzyMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  return false;
}

export default function SkillsGapMatrix({ schoolId, schoolName }: Props) {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [marketSkills, setMarketSkills] = useState<MarketSkill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Fetch school courses AND aggregated market skills in parallel
      const [courseRes, marketRes] = await Promise.all([
        supabase
          .from("school_courses")
          .select("program_name, degree_type, skills_extracted, tools_taught, ai_content_flag, industry_sectors, skill_categories")
          .eq("school_id", schoolId),
        supabase.rpc("get_market_skill_demand", { top_n: 100 }),
      ]);

      setCourses((courseRes.data as CourseData[]) || []);
      setMarketSkills((marketRes.data as MarketSkill[]) || []);
      setLoading(false);
    }
    load();
  }, [schoolId]);

  const analysis = useMemo(() => {
    if (courses.length === 0 || marketSkills.length === 0) return null;

    // Aggregate all school skills (normalized)
    const schoolSkillsSet = new Set<string>();
    const schoolToolsSet = new Set<string>();
    let aiProgramCount = 0;

    courses.forEach((c) => {
      (c.skills_extracted || []).forEach((s) => schoolSkillsSet.add(normalize(s)));
      (c.tools_taught || []).forEach((t) => schoolToolsSet.add(normalize(t)));
      if (c.ai_content_flag) aiProgramCount++;
    });

    // Match each market skill against school skills
    const matched: { skill: string; demand: { count: number; avgExposure: number; avgImpact: number; highPriority: number }; covered: boolean }[] = [];
    
    marketSkills.forEach((ms) => {
      const covered = [...schoolSkillsSet].some((ss) => fuzzyMatch(ss, normalize(ms.skill_name)));
      matched.push({
        skill: ms.skill_name,
        demand: {
          count: Number(ms.demand_count),
          avgExposure: ms.avg_exposure,
          avgImpact: ms.avg_impact,
          highPriority: Number(ms.high_priority_count),
        },
        covered,
      });
    });

    // Gaps = high demand but not covered
    const gaps = matched.filter((m) => !m.covered).sort((a, b) => b.demand.count - a.demand.count);
    const strengths = matched.filter((m) => m.covered).sort((a, b) => b.demand.count - a.demand.count);

    // Coverage score
    const coveragePercent = matched.length > 0 
      ? Math.round((strengths.length / matched.length) * 100) 
      : 0;

    // AI readiness
    const aiReadinessPercent = courses.length > 0
      ? Math.round((aiProgramCount / courses.length) * 100)
      : 0;

    return {
      gaps,
      strengths,
      coveragePercent,
      aiReadinessPercent,
      aiProgramCount,
      totalPrograms: courses.length,
      totalMarketSkills: matched.length,
      schoolSkillCount: schoolSkillsSet.size,
      schoolToolCount: schoolToolsSet.size,
    };
  }, [courses, marketSkills]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
        <span className="text-xs text-muted-foreground">Analyzing skills gap...</span>
      </div>
    );
  }

  if (!analysis) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">
        No data available. Import curriculum first.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          label="Market Coverage"
          value={`${analysis.coveragePercent}%`}
          sub={`${analysis.strengths.length}/${analysis.totalMarketSkills} skills`}
          color={analysis.coveragePercent >= 60 ? "text-success" : analysis.coveragePercent >= 40 ? "text-primary" : "text-destructive"}
        />
        <KPICard
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          label="Skill Gaps"
          value={String(analysis.gaps.length)}
          sub="not taught in any program"
          color="text-destructive"
        />
        <KPICard
          icon={<Cpu className="h-4 w-4 text-primary" />}
          label="AI Readiness"
          value={`${analysis.aiReadinessPercent}%`}
          sub={`${analysis.aiProgramCount}/${analysis.totalPrograms} programs`}
          color={analysis.aiReadinessPercent >= 30 ? "text-success" : "text-destructive"}
        />
        <KPICard
          icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
          label="School Skills"
          value={String(analysis.schoolSkillCount)}
          sub={`${analysis.schoolToolCount} tools identified`}
          color="text-foreground"
        />
      </div>

      {/* Gaps Section */}
      <Card className="border-destructive/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">
              Top Skills Gaps — Not Taught
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-3">
            These high-demand market skills aren't covered by any program.
          </p>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {analysis.gaps.slice(0, 30).map((g) => (
              <div key={g.skill} className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-foreground truncate">{g.skill}</span>
                  {g.demand.avgExposure >= 60 && (
                    <Badge className="text-[8px] bg-primary/10 text-primary border-primary/20 px-1">
                      🤖 AI {g.demand.avgExposure}%
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground">{g.demand.count} tasks</span>
                  <div className="w-16">
                    <Progress value={Math.min(100, (g.demand.count / Math.max(analysis.gaps[0]?.demand.count || 1, 1)) * 100)} className="h-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths Section */}
      <Card className="border-success/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">
              Covered Skills — Market Aligned
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            {analysis.strengths.slice(0, 40).map((s) => (
              <Badge
                key={s.skill}
                variant="outline"
                className="text-[10px] text-success border-success/20"
              >
                <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                {s.skill}
                <span className="ml-1 text-muted-foreground">({s.demand.count})</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
