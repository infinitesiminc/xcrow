import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MarketSkill {
  skill_name: string;
  demand_count: number;
  avg_exposure: number;
  avg_impact: number;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fuzzyMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

/** Map a 0–100 value to an HSL color going from deep red → amber → green */
function coverageColor(pct: number): string {
  // 0 = hue 0 (red), 50 = hue 40 (amber), 100 = hue 142 (green)
  const hue = Math.round((pct / 100) * 142);
  return `hsl(${hue} 70% 42%)`;
}

/** Map a 0–100 value to an HSL for AI exposure: low=slate, high=purple */
function exposureColor(pct: number): string {
  const alpha = Math.max(0.08, pct / 100);
  return `hsla(270, 70%, 55%, ${alpha})`;
}

/** Map demand count to opacity for demand cells */
function demandColor(count: number, max: number): string {
  const alpha = Math.max(0.08, Math.min(1, count / max));
  return `hsla(200, 80%, 50%, ${alpha})`;
}

export default function CrossSchoolSkillsGap() {
  const [loading, setLoading] = useState(true);
  const [marketSkills, setMarketSkills] = useState<MarketSkill[]>([]);
  const [schoolCount, setSchoolCount] = useState(0);
  const [schoolSkillSets, setSchoolSkillSets] = useState<Set<string>[]>([]);

  useEffect(() => {
    async function load() {
      const [marketRes, coursesRes, schoolsRes] = await Promise.all([
        supabase.rpc("get_market_skill_demand", { top_n: 50 }),
        supabase
          .from("school_courses")
          .select("school_id, skills_extracted, skill_categories")
          .limit(1000),
        supabase
          .from("school_accounts")
          .select("id")
          .limit(1000),
      ]);

      const market = (marketRes.data || []) as MarketSkill[];
      setMarketSkills(market);

      const courses = coursesRes.data || [];
      const schoolIds = new Set((schoolsRes.data || []).map((s: any) => s.id));

      // Aggregate skills per school
      const perSchool = new Map<string, Set<string>>();
      for (const c of courses as any[]) {
        if (!perSchool.has(c.school_id)) perSchool.set(c.school_id, new Set());
        const set = perSchool.get(c.school_id)!;
        const extracted = c.skills_extracted as string[] | null;
        if (extracted) extracted.forEach((s: string) => set.add(normalize(s)));
        const cats = c.skill_categories as Record<string, unknown> | null;
        if (cats) Object.keys(cats).forEach((k) => set.add(normalize(k)));
      }

      setSchoolCount(perSchool.size);
      setSchoolSkillSets([...perSchool.values()]);
      setLoading(false);
    }
    load();
  }, []);

  const heatmapData = useMemo(() => {
    if (marketSkills.length === 0 || schoolSkillSets.length === 0) return [];

    const totalSchools = schoolSkillSets.length;
    const maxDemand = Math.max(...marketSkills.map((m) => Number(m.demand_count)), 1);

    return marketSkills.map((ms) => {
      const norm = normalize(ms.skill_name);
      let coverCount = 0;
      for (const skillSet of schoolSkillSets) {
        if ([...skillSet].some((ss) => fuzzyMatch(ss, norm))) coverCount++;
      }
      const coveragePct = Math.round((coverCount / totalSchools) * 100);

      return {
        skill: ms.skill_name,
        demand: Number(ms.demand_count),
        exposure: ms.avg_exposure,
        impact: ms.avg_impact,
        coveragePct,
        maxDemand,
      };
    });
  }, [marketSkills, schoolSkillSets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">Building skills heatmap…</span>
      </div>
    );
  }

  if (heatmapData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        No curriculum data available yet. Extract school data first.
      </p>
    );
  }

  // Summary KPIs
  const avgCoverage = Math.round(
    heatmapData.reduce((s, d) => s + d.coveragePct, 0) / heatmapData.length
  );
  const universalGaps = heatmapData.filter((d) => d.coveragePct === 0).length;
  const wellCovered = heatmapData.filter((d) => d.coveragePct >= 50).length;

  return (
    <div className="space-y-5">
      {/* Summary row */}
      <div className="flex flex-wrap gap-4 text-xs">
        <Stat label="Institutions analyzed" value={String(schoolCount)} />
        <Stat label="Skills tracked" value={String(heatmapData.length)} />
        <Stat label="Avg coverage" value={`${avgCoverage}%`} accent={avgCoverage >= 50} />
        <Stat label="Universal gaps" value={String(universalGaps)} warn={universalGaps > 0} />
        <Stat label="Well-covered (≥50%)" value={String(wellCovered)} accent />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: coverageColor(0) }} />
          <span>0% coverage</span>
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: coverageColor(50) }} />
          <span>50%</span>
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: coverageColor(100) }} />
          <span>100%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: exposureColor(20) }} />
          <span>Low AI</span>
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: exposureColor(80) }} />
          <span>High AI</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: demandColor(10, 100) }} />
          <span>Low demand</span>
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: demandColor(100, 100) }} />
          <span>High demand</span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="rounded-xl border border-border/60 bg-card/80 overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_80px_80px_80px] border-b border-border/40 bg-muted/30 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Skill</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-center">Coverage</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-center">AI Exposure</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-center">Demand</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/20 max-h-[520px] overflow-y-auto">
          {heatmapData.map((d) => (
            <div
              key={d.skill}
              className="grid grid-cols-[1fr_80px_80px_80px] items-center px-3 py-1.5 hover:bg-muted/20 transition-colors"
            >
              <span className="text-xs text-foreground truncate pr-2">{d.skill}</span>

              {/* Coverage cell */}
              <div className="flex justify-center">
                <span
                  className="inline-flex items-center justify-center w-14 h-6 rounded text-[10px] font-mono font-bold text-white"
                  style={{ background: coverageColor(d.coveragePct) }}
                >
                  {d.coveragePct}%
                </span>
              </div>

              {/* AI Exposure cell */}
              <div className="flex justify-center">
                <span
                  className="inline-flex items-center justify-center w-14 h-6 rounded text-[10px] font-mono font-semibold"
                  style={{
                    background: exposureColor(d.exposure),
                    color: d.exposure > 50 ? "white" : "hsl(var(--foreground))",
                  }}
                >
                  {d.exposure}%
                </span>
              </div>

              {/* Demand cell */}
              <div className="flex justify-center">
                <span
                  className="inline-flex items-center justify-center w-14 h-6 rounded text-[10px] font-mono font-semibold"
                  style={{
                    background: demandColor(d.demand, d.maxDemand),
                    color: d.demand / d.maxDemand > 0.5 ? "white" : "hsl(var(--foreground))",
                  }}
                >
                  {d.demand}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 bg-muted/30 rounded-lg px-3 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`font-bold font-[Space_Grotesk] ${
          warn ? "text-destructive" : accent ? "text-[hsl(var(--success))]" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
