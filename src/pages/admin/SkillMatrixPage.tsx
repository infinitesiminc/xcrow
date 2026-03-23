/**
 * SkillMatrixPage — Admin reference for the canonical future skills matrix.
 * Includes L1/L2 simulation design specs, 3-ring growth model, and XP system.
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search, ArrowUpDown, Download, Brain, Loader2, Zap, Swords, Shield, Eye, GraduationCap, Target, Sparkles } from "lucide-react";

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

const CATEGORIES = ["All", "Technical", "Analytical", "Strategic", "Communication", "Leadership", "Creative", "Ethics & Compliance", "Human Edge"];

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

const ISLANDS: { category: string; emoji: string; terrain: string }[] = [
  { category: "All", emoji: "🗺️", terrain: "All Islands" },
  { category: "Technical", emoji: "🔮", terrain: "Arcane Forge" },
  { category: "Analytical", emoji: "🏔️", terrain: "Data Highlands" },
  { category: "Strategic", emoji: "⚔️", terrain: "Command Summit" },
  { category: "Communication", emoji: "🌉", terrain: "Bridge Isles" },
  { category: "Leadership", emoji: "👑", terrain: "Crown Heights" },
  { category: "Creative", emoji: "🌈", terrain: "Prism Coast" },
  { category: "Ethics & Compliance", emoji: "🛡️", terrain: "Sentinel Watch" },
  { category: "Human Edge", emoji: "🔥", terrain: "Soul Springs" },
];

type SortKey = "name" | "category";

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
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Skill Definition Matrix
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {skills.length} canonical future skills · 8 domains · 2 simulation levels
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export CSV
        </Button>
      </div>

      {/* Reference Tabs */}
      <Tabs defaultValue="growth" className="w-full">
        <TabsList className="bg-muted/50 h-8">
          <TabsTrigger value="growth" className="text-xs h-6 gap-1"><Target className="h-3 w-3" /> Growth Model</TabsTrigger>
          <TabsTrigger value="l1" className="text-xs h-6 gap-1"><Swords className="h-3 w-3" /> Level 1</TabsTrigger>
          <TabsTrigger value="l2" className="text-xs h-6 gap-1"><Shield className="h-3 w-3" /> Level 2</TabsTrigger>
          <TabsTrigger value="xp" className="text-xs h-6 gap-1"><Zap className="h-3 w-3" /> XP System</TabsTrigger>
        </TabsList>

        {/* 3-Ring Growth Model */}
        <TabsContent value="growth">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">3-Ring Growth Model (per skill node)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    ring: "1 — Foundation",
                    emoji: "🎓",
                    icon: GraduationCap,
                    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
                    source: "Curriculum coverage",
                    desc: "Maps to school course items. Auto-filled when a school's curriculum is scraped. Shows what the institution teaches.",
                  },
                  {
                    ring: "2 — AI Mastery",
                    emoji: "⚡",
                    icon: Swords,
                    color: "text-sky-400 border-sky-500/30 bg-sky-500/5",
                    source: "Level 1 simulations",
                    desc: "Technique vs. Technique (A/B). Tests current tool proficiency — which AI approach wins for a given task. Builds practical fluency.",
                  },
                  {
                    ring: "3 — Human Edge",
                    emoji: "✦",
                    icon: Shield,
                    color: "text-violet-400 border-violet-500/30 bg-violet-500/5",
                    source: "Level 2 simulations",
                    desc: "Guided Audit (Red Team). Tests strategic oversight of future AI outputs. Validates judgment, risk awareness, and domain authority.",
                  },
                ].map(r => (
                  <div key={r.ring} className={`rounded-lg border p-3 ${r.color}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{r.emoji}</span>
                      <span className="text-xs font-bold">{r.ring}</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-1 opacity-70">Source: {r.source}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Level 1: AI Mastery */}
        <TabsContent value="l1">
          <Card className="border-sky-500/20 bg-sky-500/5">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Swords className="h-4 w-4 text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">Level 1 — AI Mastery Simulation</h3>
                <Badge className="bg-sky-500/15 text-sky-400 border-sky-500/30 text-[10px]">Technique vs. Technique</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Format</p>
                    <p className="text-xs text-foreground">A/B comparison — two competing AI approaches to a real task. User picks the superior strategy.</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">What it tests</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                      <li>Tool selection & awareness of current AI capabilities</li>
                      <li>Practical workflow decisions (which approach, when)</li>
                      <li>Understanding of tool strengths and limitations</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Progression</p>
                    <p className="text-xs text-muted-foreground">Multiple rounds per sim · Difficulty scales with skill level · Context-rich scenarios tied to specific job tasks</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">UX Flow</p>
                    <div className="space-y-1">
                      {["Scenario + key insight presented", "Two options (A vs B) with rationale", "User selects → instant verdict", "Explanation of why one wins", "Next round or final score"].map((step, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                          <span className="text-muted-foreground">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/30 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Evaluation Rubric</p>
                    <p className="text-xs text-foreground">4 dimensions: Tool Awareness · Domain Judgment · Adaptive Thinking · Human Value-Add</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Level 2: Human Edge */}
        <TabsContent value="l2">
          <Card className="border-violet-500/20 bg-violet-500/5">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-violet-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400">Level 2 — Human Edge Simulation</h3>
                <Badge className="bg-violet-500/15 text-violet-400 border-violet-500/30 text-[10px]">Guided Audit · Red Team</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Format</p>
                    <p className="text-xs text-foreground">5-step checkpoint audit. User evaluates AI-generated claims as Safe, Risky, or Critical. Sequential escalation.</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">What it tests</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                      <li>Strategic oversight of future AI outputs</li>
                      <li>Risk awareness & judgment under ambiguity</li>
                      <li>Domain authority — can you catch what AI misses?</li>
                      <li>Actionability — what do you do after finding the flaw?</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Scaffolding</p>
                    <p className="text-xs text-muted-foreground">Hints on demand · Expert explanations after each step · Real-world industry case studies as anchors</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">UX Flow</p>
                    <div className="space-y-1">
                      {[
                        "AI claim presented with 'Oracle' scanning effect",
                        "User judges: Safe 🟢 · Risky 🟡 · Critical 🔴",
                        "Diamond rune markers track progress (5 steps)",
                        "Verdict + expert rationale + case study",
                        "Ascension Ceremony → proficiency title awarded",
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                          <span className="text-muted-foreground">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/30 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Sentinel's Sanctum — Result Titles</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {["Grand Sentinel", "Vigilant Watcher", "Apprentice Seer"].map(t => (
                        <Badge key={t} variant="outline" className="text-[10px] border-violet-500/30 text-violet-400">{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/30 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Design Language</p>
                    <p className="text-xs text-muted-foreground">Ethereal indigo/violet palette · Diamond rune progress · Oracle scanning lines · Seal of Judgment buttons · Golden sparkle on correct</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* XP System */}
        <TabsContent value="xp">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                XP &amp; Progression System
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Skill Levels (per skill)</p>
                  <div className="space-y-1">
                    {[
                      { emoji: "🏚️", name: "Novice", xp: "0 XP", visual: "Ruins" },
                      { emoji: "🏕️", name: "Apprentice", xp: "150 XP", visual: "Outpost" },
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
                <div className="space-y-3">
                  <div className="rounded-lg bg-muted/30 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">XP Formula (per skill per sim)</p>
                    <p className="text-xs text-foreground font-mono">Base(40) × score/50 + context(20)</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Range: 24–100 XP · Max 100 per skill per sim</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">XP Sources</p>
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                      <p>⚡ L1 sim completion → AI Mastery ring</p>
                      <p>✦ L2 sim completion → Human Edge ring</p>
                      <p>🎓 Curriculum match → Foundation ring (auto)</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                <p className="text-center text-muted-foreground text-xs py-8">No skills match your search</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
