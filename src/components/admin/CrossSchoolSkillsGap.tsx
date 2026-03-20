import { useState, useEffect, useMemo } from "react";
import { Loader2, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, GraduationCap, TrendingUp, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface SchoolSkillProfile {
  school_id: string;
  school_name: string;
  short_name: string | null;
  skills: Set<string>;
  coverage: number;
  gapCount: number;
}

interface MarketSkill {
  skill_name: string;
  demand_count: number;
  avg_exposure: number;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fuzzyMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

export default function CrossSchoolSkillsGap() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [marketSkills, setMarketSkills] = useState<MarketSkill[]>([]);
  const [schoolProfiles, setSchoolProfiles] = useState<SchoolSkillProfile[]>([]);
  const [expandedGaps, setExpandedGaps] = useState(false);
  const [expandedCovered, setExpandedCovered] = useState(false);

  useEffect(() => {
    async function load() {
      // Fetch market skills and all school courses in parallel
      const [marketRes, coursesRes, schoolsRes] = await Promise.all([
        supabase.rpc("get_market_skill_demand", { top_n: 100 }),
        supabase
          .from("school_courses")
          .select("school_id, skills_extracted, skill_categories")
          .limit(1000),
        supabase
          .from("school_accounts")
          .select("id, name, short_name")
          .limit(1000),
      ]);

      const market = (marketRes.data || []) as MarketSkill[];
      setMarketSkills(market);

      const courses = coursesRes.data || [];
      const schoolMap = new Map<string, { name: string; short_name: string | null }>();
      for (const s of (schoolsRes.data || []) as any[]) {
        schoolMap.set(s.id, { name: s.name, short_name: s.short_name });
      }

      // Aggregate skills per school
      const schoolSkills = new Map<string, Set<string>>();
      for (const c of courses as any[]) {
        if (!schoolSkills.has(c.school_id)) schoolSkills.set(c.school_id, new Set());
        const set = schoolSkills.get(c.school_id)!;
        const extracted = c.skills_extracted as string[] | null;
        if (extracted) extracted.forEach((s: string) => set.add(normalize(s)));
        const cats = c.skill_categories as Record<string, unknown> | null;
        if (cats) Object.keys(cats).forEach((k) => set.add(normalize(k)));
      }

      // Compute coverage per school
      const profiles: SchoolSkillProfile[] = [];
      for (const [sid, skills] of schoolSkills) {
        const info = schoolMap.get(sid);
        if (!info) continue;
        let covered = 0;
        for (const ms of market) {
          if ([...skills].some((ss) => fuzzyMatch(ss, normalize(ms.skill_name)))) covered++;
        }
        profiles.push({
          school_id: sid,
          school_name: info.name,
          short_name: info.short_name,
          skills,
          coverage: market.length > 0 ? Math.round((covered / market.length) * 100) : 0,
          gapCount: market.length - covered,
        });
      }

      profiles.sort((a, b) => b.coverage - a.coverage);
      setSchoolProfiles(profiles);
      setLoading(false);
    }
    load();
  }, []);

  // Aggregate: for each market skill, how many schools cover it
  const skillCoverage = useMemo(() => {
    if (marketSkills.length === 0 || schoolProfiles.length === 0) return { gaps: [], covered: [] };

    const totalSchools = schoolProfiles.length;
    const results = marketSkills.map((ms) => {
      const norm = normalize(ms.skill_name);
      let coverCount = 0;
      for (const sp of schoolProfiles) {
        if ([...sp.skills].some((ss) => fuzzyMatch(ss, norm))) coverCount++;
      }
      return {
        skill: ms.skill_name,
        demandCount: Number(ms.demand_count),
        avgExposure: ms.avg_exposure,
        schoolsCovering: coverCount,
        coveragePercent: Math.round((coverCount / totalSchools) * 100),
      };
    });

    results.sort((a, b) => a.schoolsCovering - b.schoolsCovering || b.demandCount - a.demandCount);

    const gaps = results.filter((r) => r.coveragePercent < 50);
    const covered = results.filter((r) => r.coveragePercent >= 50).sort((a, b) => b.schoolsCovering - a.schoolsCovering);

    return { gaps, covered };
  }, [marketSkills, schoolProfiles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
        <span className="text-xs text-muted-foreground">Analyzing cross-school skills coverage...</span>
      </div>
    );
  }

  if (schoolProfiles.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">
        No curriculum data available. Extract school data first.
      </p>
    );
  }

  const avgCoverage = schoolProfiles.length > 0
    ? Math.round(schoolProfiles.reduce((s, p) => s + p.coverage, 0) / schoolProfiles.length)
    : 0;

  const PREVIEW_COUNT = 15;
  const visibleGaps = expandedGaps ? skillCoverage.gaps : skillCoverage.gaps.slice(0, PREVIEW_COUNT);
  const visibleCovered = expandedCovered ? skillCoverage.covered : skillCoverage.covered.slice(0, PREVIEW_COUNT);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={<GraduationCap className="h-4 w-4 text-[hsl(var(--neon-purple))]" />} label="Schools Analyzed" value={String(schoolProfiles.length)} />
        <KPI icon={<TrendingUp className="h-4 w-4 text-primary" />} label="Avg Coverage" value={`${avgCoverage}%`} color={avgCoverage >= 50 ? "text-[hsl(var(--success))]" : "text-destructive"} />
        <KPI icon={<AlertTriangle className="h-4 w-4 text-destructive" />} label="Universal Gaps" value={String(skillCoverage.gaps.filter(g => g.schoolsCovering === 0).length)} sub="0% coverage" />
        <KPI icon={<BarChart3 className="h-4 w-4 text-[hsl(var(--neon-cyan))]" />} label="Market Skills Tracked" value={String(marketSkills.length)} />
      </div>

      {/* Gap Skills — under-covered across schools */}
      <Card className="border-destructive/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Industry-Wide Gaps — Under-Covered Skills
          </CardTitle>
          <p className="text-[10px] text-muted-foreground">
            High-demand skills taught by fewer than half of analyzed schools.
          </p>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {visibleGaps.map((g) => (
            <div key={g.skill} className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-muted/30">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-foreground truncate">{g.skill}</span>
                {g.avgExposure >= 60 && (
                  <Badge className="text-[8px] bg-primary/10 text-primary border-primary/20 px-1">
                    🤖 AI {g.avgExposure}%
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] text-muted-foreground">{g.demandCount} tasks</span>
                <span className="text-[10px] font-mono text-destructive w-16 text-right">
                  {g.schoolsCovering}/{schoolProfiles.length} schools
                </span>
                <div className="w-12">
                  <Progress value={g.coveragePercent} className="h-1" />
                </div>
              </div>
            </div>
          ))}
          {skillCoverage.gaps.length > PREVIEW_COUNT && (
            <button
              onClick={() => setExpandedGaps(!expandedGaps)}
              className="flex items-center gap-1 mt-2 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {expandedGaps ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expandedGaps ? "Show less" : `Show all ${skillCoverage.gaps.length} gap skills`}
            </button>
          )}
        </CardContent>
      </Card>

      {/* Well-Covered Skills */}
      <Card className="border-[hsl(var(--success))]/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wide flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
            Well-Covered Skills — Majority of Schools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {visibleCovered.map((s) => (
            <div key={s.skill} className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-muted/30">
              <span className="text-xs text-foreground truncate">{s.skill}</span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] text-muted-foreground">{s.demandCount} tasks</span>
                <span className="text-[10px] font-mono text-[hsl(var(--success))] w-16 text-right">
                  {s.schoolsCovering}/{schoolProfiles.length}
                </span>
                <div className="w-12">
                  <Progress value={s.coveragePercent} className="h-1" />
                </div>
              </div>
            </div>
          ))}
          {skillCoverage.covered.length > PREVIEW_COUNT && (
            <button
              onClick={() => setExpandedCovered(!expandedCovered)}
              className="flex items-center gap-1 mt-2 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {expandedCovered ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expandedCovered ? "Show less" : `Show all ${skillCoverage.covered.length} covered skills`}
            </button>
          )}
        </CardContent>
      </Card>

      {/* Per-School Coverage Ranking */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wide flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-[hsl(var(--neon-purple))]" />
            School Coverage Ranking
          </CardTitle>
          <p className="text-[10px] text-muted-foreground">
            Market skill coverage by institution — click to view details.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {schoolProfiles.map((sp) => (
              <div
                key={sp.school_id}
                onClick={() => navigate(`/admin/schools/${sp.school_id}`)}
                className="flex items-center justify-between gap-3 py-1.5 px-2 rounded hover:bg-muted/30 cursor-pointer group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-[hsl(var(--neon-blue))] group-hover:underline truncate">
                    {sp.short_name || sp.school_name}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-muted-foreground">{sp.gapCount} gaps</span>
                  <span className={`text-xs font-mono font-bold ${sp.coverage >= 50 ? "text-[hsl(var(--success))]" : sp.coverage >= 30 ? "text-primary" : "text-destructive"}`}>
                    {sp.coverage}%
                  </span>
                  <div className="w-20">
                    <Progress value={sp.coverage} className="h-1.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color?: string }) {
  return (
    <Card className="border-border/50 bg-card/80">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
        <p className={`text-xl font-bold font-[Space_Grotesk] ${color || "text-foreground"}`}>{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
