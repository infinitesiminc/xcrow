/**
 * SkillMatrixPage — Admin view of the full canonical future skills definition matrix.
 * Shows all 183 skills with search, category filter, and inline editing.
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, ArrowUpDown, Download, Brain, Loader2 } from "lucide-react";

interface CanonicalSkill {
  id: string;
  name: string;
  category: string;
  description: string | null;
  icon_emoji: string | null;
  demand_count: number;
  job_count: number;
  avg_relevance: number | null;
}

const CATEGORIES = [
  "All",
  "Technical",
  "Analytical",
  "Strategic",
  "Communication",
  "Leadership",
  "Creative",
  "Ethics & Compliance",
  "Human Edge",
];

const CAT_COLORS: Record<string, string> = {
  Technical: "bg-violet-500/15 text-violet-400",
  Analytical: "bg-sky-500/15 text-sky-400",
  Strategic: "bg-rose-500/15 text-rose-400",
  Communication: "bg-emerald-500/15 text-emerald-400",
  Leadership: "bg-amber-500/15 text-amber-400",
  Creative: "bg-orange-500/15 text-orange-400",
  "Ethics & Compliance": "bg-teal-500/15 text-teal-400",
  "Human Edge": "bg-fuchsia-500/15 text-fuchsia-400",
};

type SortKey = "name" | "category" | "demand_count" | "job_count";

export default function SkillMatrixPage() {
  const [skills, setSkills] = useState<CanonicalSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("demand_count");
  const [sortAsc, setSortAsc] = useState(false);
  const { toast } = useToast();

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("canonical_future_skills")
      .select("id, name, category, description, icon_emoji, demand_count, job_count, avg_relevance")
      .order("demand_count", { ascending: false });
    if (error) {
      toast({ title: "Error loading skills", description: error.message, variant: "destructive" });
    } else {
      setSkills(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchSkills(); }, [fetchSkills]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(p => !p);
    else { setSortKey(key); setSortAsc(false); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = skills.filter(s => {
      if (catFilter !== "All" && s.category !== catFilter) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q) && !(s.description || "").toLowerCase().includes(q)) return false;
      return true;
    });
    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return list;
  }, [skills, search, catFilter, sortKey, sortAsc]);

  // Category stats
  const catStats = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of skills) m[s.category] = (m[s.category] || 0) + 1;
    return m;
  }, [skills]);

  const exportCSV = () => {
    const header = "ID,Name,Category,Description,Emoji,Demand,Jobs,Relevance\n";
    const rows = filtered.map(s =>
      `"${s.id}","${s.name}","${s.category}","${(s.description || '').replace(/"/g, '""')}","${s.icon_emoji || ''}",${s.demand_count},${s.job_count},${s.avg_relevance || 50}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skill_definition_matrix.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const colBtn = (key: SortKey, label: string) => (
    <button
      onClick={() => toggleSort(key)}
      className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
        sortKey === key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      <ArrowUpDown className="h-2.5 w-2.5" />
    </button>
  );

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Skill Definition Matrix
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {skills.length} canonical future skills across 8 domains
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export CSV
        </Button>
      </div>

      {/* XP System Reference */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            XP &amp; Progression System
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Per-Skill Levels */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Skill Levels (per skill)</p>
              <div className="space-y-1">
                {[
                  { emoji: "🏚️", name: "Novice", xp: "0 XP", visual: "Ruins" },
                  { emoji: "🏕️", name: "Apprentice", xp: "150 XP", visual: "Outpost — castle claimed" },
                  { emoji: "🏰", name: "Adept", xp: "500 XP", visual: "Fortress" },
                  { emoji: "⚔️", name: "Master", xp: "1,200 XP", visual: "Citadel" },
                  { emoji: "✨", name: "Grandmaster", xp: "2,500 XP", visual: "Citadel + Glow" },
                ].map(t => (
                  <div key={t.name} className="flex items-center gap-2 text-xs">
                    <span className="w-5 text-center">{t.emoji}</span>
                    <span className="font-medium text-foreground w-24">{t.name}</span>
                    <span className="font-mono text-muted-foreground w-16">{t.xp}</span>
                    <span className="text-muted-foreground/70">{t.visual}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Player Tiers + XP Formula */}
            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Player Tiers (aggregate XP)</p>
                <div className="space-y-1">
                  {[
                    { name: "Recruit", xp: "0" },
                    { name: "Explorer", xp: "500" },
                    { name: "Strategist", xp: "3,000" },
                    { name: "Commander", xp: "10,000" },
                    { name: "Legend", xp: "30,000" },
                  ].map(t => (
                    <div key={t.name} className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-foreground w-24">{t.name}</span>
                      <span className="font-mono text-muted-foreground">{t.xp} XP</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-muted/30 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">XP Formula (per skill per sim)</p>
                <p className="text-xs text-foreground font-mono">Base(40) × score/50 + context(20)</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Range: 24–100 XP · Max 100 per skill per sim</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCatFilter(cat)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              catFilter === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {cat}{cat !== "All" && catStats[cat] ? ` (${catStats[cat]})` : cat === "All" ? ` (${skills.length})` : ""}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search skills, categories, descriptions…"
          className="h-8 pl-8 text-xs bg-muted/30 border-border/50"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-auto max-h-[calc(100vh-320px)]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                  <tr className="border-b border-border/30">
                    <th className="text-left py-2.5 px-3 w-8">#</th>
                    <th className="text-left py-2.5 px-3">{colBtn("name", "Skill")}</th>
                    <th className="text-left py-2.5 px-3">{colBtn("category", "Domain")}</th>
                    <th className="text-left py-2.5 px-3 min-w-[200px]">Definition</th>
                    <th className="text-right py-2.5 px-3">{colBtn("demand_count", "Demand")}</th>
                    <th className="text-right py-2.5 px-3">{colBtn("job_count", "Roles")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((skill, i) => (
                    <tr key={skill.id} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                      <td className="py-2 px-3 text-muted-foreground font-mono">{i + 1}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          {skill.icon_emoji && <span className="text-sm">{skill.icon_emoji}</span>}
                          <span className="font-medium text-foreground">{skill.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-medium ${CAT_COLORS[skill.category] || "bg-muted text-muted-foreground"}`}>
                          {skill.category}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground max-w-[300px]">
                        <span className="line-clamp-2">{skill.description || "—"}</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-muted-foreground">{skill.demand_count}</td>
                      <td className="py-2 px-3 text-right font-mono text-muted-foreground">{skill.job_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground text-xs py-8">
                  No skills match your search
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
