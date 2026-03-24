/**
 * Skills — Public Codex page
 * SEO-friendly catalogue of 183 canonical future skills grouped by territory
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchCanonicalFutureSkillsRows } from "@/lib/canonical-future-skills";
import { Search, BookOpen, Sparkles, Filter, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TERRITORIES, getTerritory } from "@/lib/territory-colors";
import TerritoryEmblem from "@/components/TerritoryEmblem";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { FutureSkillCategory } from "@/hooks/use-future-skills";

import xcrowLogo from "@/assets/xcrow-logo.png";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5, delay, ease: "easeOut" as const },
});

interface CanonicalSkill {
  id: string;
  name: string;
  category: string;
  description: string | null;
  icon_emoji: string | null;
  job_count: number;
  demand_count: number;
  avg_relevance: number | null;
}

export default function Skills() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: skills = [], isLoading } = useQuery({
    queryKey: ["canonical-skills-codex"],
    queryFn: async () => {
      const data = await fetchCanonicalFutureSkillsRows();
      return data as CanonicalSkill[];
    },
    staleTime: 5 * 60_000,
    retry: 2,
  });

  const filtered = useMemo(() => {
    let result = skills;
    if (activeCategory) result = result.filter(s => s.category === activeCategory);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
    }
    return result;
  }, [skills, search, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map<string, CanonicalSkill[]>();
    for (const s of filtered) {
      const arr = map.get(s.category) || [];
      arr.push(s);
      map.set(s.category, arr);
    }
    return map;
  }, [filtered]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of skills) {
      map.set(s.category, (map.get(s.category) || 0) + 1);
    }
    return map;
  }, [skills]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* ═══ HERO ═══ */}
        <section className="relative pt-20 pb-16 px-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full blur-[180px] opacity-10"
              style={{ background: "hsl(var(--territory-technical))" }} />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[160px] opacity-8"
              style={{ background: "hsl(var(--territory-creative))" }} />
          </div>

          <motion.div {...fade()} className="text-center max-w-3xl mx-auto relative z-10">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">📖 The Codex</p>
            <h1 className="font-fantasy text-4xl md:text-5xl font-bold mb-4">
              <span style={{ color: "hsl(var(--filigree-glow))" }}>183</span> Skills to Master
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              The complete catalogue of AI-era skills — each one a castle waiting to be built. Explore by territory or search for specifics.
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search skills…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 h-11 text-sm"
                style={{ background: "hsl(var(--surface-stone))", border: "1px solid hsl(var(--filigree) / 0.2)" }}
              />
            </div>
          </motion.div>
        </section>

        {/* ═══ TERRITORY FILTER ═══ */}
        <section className="px-4 pb-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setActiveCategory(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  fontFamily: "'Cinzel', serif",
                  ...(activeCategory === null
                    ? { background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.3)" }
                    : { background: "hsl(var(--surface-stone))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }),
                }}
              >
                <Filter className="h-3 w-3" /> All ({skills.length})
              </button>
              {TERRITORIES.map(t => (
                <button
                  key={t.category}
                  onClick={() => setActiveCategory(activeCategory === t.category ? null : t.category)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    ...(activeCategory === t.category
                      ? { background: `hsl(var(--${t.cssVar}) / 0.15)`, color: t.hsl, border: `1px solid hsl(var(--${t.cssVar}) / 0.3)` }
                      : { background: "hsl(var(--surface-stone))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }),
                  }}
                >
                  <TerritoryEmblem category={t.category} size={14} />
                  {t.terrain} ({categoryCounts.get(t.category) || 0})
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SKILLS GRID ═══ */}
        <section className="px-4 pb-20">
          <div className="max-w-5xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground font-fantasy">No skills found matching your search.</p>
              </div>
            ) : (
              Array.from(grouped.entries()).map(([category, categorySkills]) => {
                const t = getTerritory(category as FutureSkillCategory);
                return (
                  <motion.div key={category} {...fade()} className="mb-12">
                    {/* Category header */}
                    <div className="flex items-center gap-3 mb-4">
                      <TerritoryEmblem category={category as FutureSkillCategory} size={32} />
                      <div>
                        <h2 className="font-fantasy text-xl font-bold" style={{ color: t.hsl }}>{t.terrain}</h2>
                        <p className="text-xs text-muted-foreground">{category} · {categorySkills.length} skills</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categorySkills.map((skill, i) => (
                        <motion.div
                          key={skill.id}
                          initial={{ opacity: 0, y: 12 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                          className="rounded-xl border border-border/50 p-4 group hover:border-border transition-colors"
                          style={{
                            background: "hsl(var(--card))",
                            boxShadow: `inset 0 1px 0 hsl(var(--emboss-light))`,
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-xl shrink-0">{skill.icon_emoji || "⚡"}</span>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-fantasy text-sm font-bold leading-tight mb-1">{skill.name}</h3>
                              {skill.description && (
                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{skill.description}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="py-20 px-4 border-t border-border/50" style={{ background: "hsl(var(--secondary) / 0.3)" }}>
          <motion.div {...fade()} className="text-center max-w-lg mx-auto">
            <Sparkles className="h-8 w-8 mx-auto mb-4" style={{ color: "hsl(var(--filigree-glow))" }} />
            <h2 className="font-fantasy text-2xl md:text-3xl font-bold mb-3">Start Building Your Arsenal</h2>
            <p className="text-muted-foreground mb-6">
              Every skill here is a castle you can claim. Open the World Map and begin your first quest.
            </p>
            <Button size="lg" onClick={() => window.location.href = "/map"} className="text-base px-8"
              style={{ boxShadow: "0 0 20px hsl(var(--filigree-glow) / 0.25)" }}>
              <Sparkles className="h-5 w-5 mr-2" /> Enter the World Map
            </Button>
          </motion.div>
        </section>
      </div>
      <Footer />
    </>
  );
}
