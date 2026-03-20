import { useState, useEffect, useMemo } from "react";
import { Loader2, ArrowUpDown, ChevronDown, ChevronRight, LayoutGrid, ScatterChart } from "lucide-react";
import SkillBubbleMap from "./SkillBubbleMap";
import { supabase } from "@/integrations/supabase/client";

interface MarketSkill {
  skill_name: string;
  demand_count: number;
  avg_exposure: number;
  avg_impact: number;
}

type SortKey = "coverage" | "demand" | "exposure";
type SortDir = "asc" | "desc";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fuzzyMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

function coverageColor(pct: number): string {
  const hue = Math.round((pct / 100) * 142);
  return `hsl(${hue} 70% 42%)`;
}

function exposureColor(pct: number): string {
  const alpha = Math.max(0.1, pct / 100);
  return `hsla(270, 70%, 55%, ${alpha})`;
}

function demandColor(count: number, max: number): string {
  const alpha = Math.max(0.1, Math.min(1, count / max));
  return `hsla(200, 80%, 50%, ${alpha})`;
}

interface SkillRow {
  skill: string;
  demand: number;
  exposure: number;
  impact: number;
  coveragePct: number;
  maxDemand: number;
  category: string;
}

/** Categorize a skill into a broad group */
function categorize(skill: string): string {
  const s = skill.toLowerCase();
  if (/\b(python|javascript|typescript|sql|java|c\+\+|r\b|programming|coding|software|html|css|react|node|api|git|devops|cloud|aws|azure|docker|kubernetes)\b/.test(s))
    return "Engineering & Development";
  if (/\b(machine learning|deep learning|nlp|neural|computer vision|ai|artificial intelligence|llm|generative|gpt|model training|reinforcement)\b/.test(s))
    return "AI & Machine Learning";
  if (/\b(data analysis|data science|analytics|statistics|tableau|power bi|visualization|bi\b|etl|data engineer|pipeline|warehouse|big data|spark|hadoop)\b/.test(s))
    return "Data & Analytics";
  if (/\b(design|ux|ui|figma|user experience|user interface|wireframe|prototype|accessibility|graphic|visual)\b/.test(s))
    return "Design & UX";
  if (/\b(marketing|seo|content|social media|brand|advertising|growth|copywriting|email marketing|digital marketing)\b/.test(s))
    return "Marketing & Growth";
  if (/\b(project management|agile|scrum|leadership|stakeholder|communication|presentation|teamwork|collaboration|strategy|planning|management|operations)\b/.test(s))
    return "Leadership & Management";
  if (/\b(security|cybersecurity|encryption|compliance|gdpr|risk|audit|privacy|penetration|vulnerability)\b/.test(s))
    return "Security & Compliance";
  if (/\b(sales|crm|negotiation|customer|account management|business development|revenue|pipeline)\b/.test(s))
    return "Sales & Business Dev";
  if (/\b(finance|accounting|budg|forecast|financial|valuation|investment|tax|audit)\b/.test(s))
    return "Finance & Accounting";
  if (/\b(writing|research|critical thinking|problem solving|creativity|innovation|adaptability|emotional intelligence|ethics)\b/.test(s))
    return "Human & Cognitive Skills";
  return "Other Skills";
}

const CATEGORY_ORDER = [
  "AI & Machine Learning",
  "Data & Analytics",
  "Engineering & Development",
  "Design & UX",
  "Marketing & Growth",
  "Leadership & Management",
  "Security & Compliance",
  "Sales & Business Dev",
  "Finance & Accounting",
  "Human & Cognitive Skills",
  "Other Skills",
];

export default function CrossSchoolSkillsGap() {
  const [loading, setLoading] = useState(true);
  const [marketSkills, setMarketSkills] = useState<MarketSkill[]>([]);
  const [schoolCount, setSchoolCount] = useState(0);
  const [schoolSkillSets, setSchoolSkillSets] = useState<Set<string>[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("coverage");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"table" | "bubble">("table");

  useEffect(() => {
    async function load() {
      const [marketRes, coursesRes] = await Promise.all([
        supabase.rpc("get_market_skill_demand", { top_n: 50 }),
        supabase
          .from("school_courses")
          .select("school_id, skills_extracted, skill_categories")
          .limit(1000),
      ]);

      const market = (marketRes.data || []) as MarketSkill[];
      setMarketSkills(market);

      const courses = coursesRes.data || [];
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

  const rows = useMemo(() => {
    if (marketSkills.length === 0 || schoolSkillSets.length === 0) return [];
    const totalSchools = schoolSkillSets.length;
    const maxDemand = Math.max(...marketSkills.map((m) => Number(m.demand_count)), 1);

    return marketSkills.map((ms) => {
      const norm = normalize(ms.skill_name);
      let coverCount = 0;
      for (const skillSet of schoolSkillSets) {
        if ([...skillSet].some((ss) => fuzzyMatch(ss, norm))) coverCount++;
      }
      return {
        skill: ms.skill_name,
        demand: Number(ms.demand_count),
        exposure: ms.avg_exposure,
        impact: ms.avg_impact,
        coveragePct: Math.round((coverCount / totalSchools) * 100),
        maxDemand,
        category: categorize(ms.skill_name),
      } as SkillRow;
    });
  }, [marketSkills, schoolSkillSets]);

  const grouped = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const valA = sortKey === "coverage" ? a.coveragePct : sortKey === "demand" ? a.demand : a.exposure;
      const valB = sortKey === "coverage" ? b.coveragePct : sortKey === "demand" ? b.demand : b.exposure;
      return sortDir === "asc" ? valA - valB : valB - valA;
    });

    const groups = new Map<string, SkillRow[]>();
    for (const cat of CATEGORY_ORDER) groups.set(cat, []);
    for (const row of sorted) {
      const arr = groups.get(row.category);
      if (arr) arr.push(row);
      else groups.set(row.category, [row]);
    }
    // Remove empty categories
    for (const [key, val] of groups) {
      if (val.length === 0) groups.delete(key);
    }
    return groups;
  }, [rows, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleCat(cat: string) {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">Building skills heatmap…</span>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        No curriculum data available yet. Extract school data first.
      </p>
    );
  }

  const avgCoverage = Math.round(rows.reduce((s, d) => s + d.coveragePct, 0) / rows.length);
  const universalGaps = rows.filter((d) => d.coveragePct === 0).length;

  return (
    <div className="space-y-4">
      {/* KPI chips */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <Stat label="Institutions" value={String(schoolCount)} />
        <Stat label="Skills" value={String(rows.length)} />
        <Stat label="Avg coverage" value={`${avgCoverage}%`} accent={avgCoverage >= 50} />
        <Stat label="Zero coverage" value={String(universalGaps)} warn={universalGaps > 0} />
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setView("table")}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${view === "table" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutGrid className="h-3 w-3" /> Table
          </button>
          <button
            onClick={() => setView("bubble")}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${view === "bubble" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:text-foreground"}`}
          >
            <ScatterChart className="h-3 w-3" /> Bubble
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: coverageColor(0) }} />0%
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: coverageColor(50) }} />50%
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: coverageColor(100) }} />100%
          coverage
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: exposureColor(20) }} />low
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: exposureColor(80) }} />high AI
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: demandColor(10, 100) }} />low
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: demandColor(100, 100) }} />high demand
        </span>
      </div>

      {/* Heatmap */}
      <div className="rounded-xl border border-border/60 bg-card/80 overflow-hidden">
        {/* Header with sort buttons */}
        <div className="grid grid-cols-[1fr_72px_72px_72px] bg-muted/40 px-2 py-1.5 border-b border-border/40 sticky top-0 z-10">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground pl-7">Skill</span>
          <SortBtn label="Cov" active={sortKey === "coverage"} dir={sortDir} onClick={() => toggleSort("coverage")} />
          <SortBtn label="AI" active={sortKey === "exposure"} dir={sortDir} onClick={() => toggleSort("exposure")} />
          <SortBtn label="Demand" active={sortKey === "demand"} dir={sortDir} onClick={() => toggleSort("demand")} />
        </div>

        <div className="max-h-[520px] overflow-y-auto">
          {[...grouped.entries()].map(([cat, skills]) => {
            const collapsed = collapsedCats.has(cat);
            const catAvg = Math.round(skills.reduce((s, r) => s + r.coveragePct, 0) / skills.length);
            return (
              <div key={cat}>
                {/* Category header */}
                <button
                  onClick={() => toggleCat(cat)}
                  className="w-full grid grid-cols-[1fr_72px_72px_72px] items-center px-2 py-1.5 bg-muted/20 hover:bg-muted/40 transition-colors border-b border-border/20 text-left"
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                    {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {cat}
                    <span className="text-[10px] font-normal text-muted-foreground ml-1">({skills.length})</span>
                  </span>
                  <span className="text-center">
                    <span
                      className="inline-block w-10 h-5 rounded text-[9px] font-mono font-bold text-white leading-5 text-center"
                      style={{ background: coverageColor(catAvg) }}
                    >
                      {catAvg}%
                    </span>
                  </span>
                  <span />
                  <span />
                </button>

                {/* Skill rows */}
                {!collapsed &&
                  skills.map((d) => (
                    <div
                      key={d.skill}
                      className="grid grid-cols-[1fr_72px_72px_72px] items-center px-2 py-1 hover:bg-muted/10 transition-colors"
                    >
                      <span className="text-[11px] text-foreground truncate pl-5">{d.skill}</span>
                      <Cell bg={coverageColor(d.coveragePct)} label={`${d.coveragePct}%`} light />
                      <Cell
                        bg={exposureColor(d.exposure)}
                        label={`${d.exposure}%`}
                        light={d.exposure > 50}
                      />
                      <Cell
                        bg={demandColor(d.demand, d.maxDemand)}
                        label={String(d.demand)}
                        light={d.demand / d.maxDemand > 0.5}
                      />
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Cell({ bg, label, light }: { bg: string; label: string; light?: boolean }) {
  return (
    <div className="flex justify-center">
      <span
        className={`inline-block w-12 h-5 rounded text-[10px] font-mono font-semibold leading-5 text-center ${
          light ? "text-white" : "text-foreground"
        }`}
        style={{ background: bg }}
      >
        {label}
      </span>
    </div>
  );
}

function SortBtn({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-0.5 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      <ArrowUpDown className={`h-2.5 w-2.5 ${active ? "text-primary" : "text-muted-foreground/50"}`} />
      {active && <span className="text-[8px]">{dir === "asc" ? "↑" : "↓"}</span>}
    </button>
  );
}

function Stat({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 bg-muted/30 rounded-lg px-3 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold font-[Space_Grotesk] ${warn ? "text-destructive" : accent ? "text-[hsl(var(--success))]" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}
