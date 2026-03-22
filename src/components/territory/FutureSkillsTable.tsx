/**
 * FutureSkillsTable — Skill Forge catalog with progress tracking + bookmarks.
 * Includes a domain radar chart, XP progress bars, and bookmark quick-launch.
 */
import { useState, useMemo, useCallback } from "react";
import { type FutureSkill, type FutureSkillCategory } from "@/hooks/use-future-skills";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, Search, Bookmark, BookmarkCheck } from "lucide-react";
import { getTerritory, TERRITORY_ORDER } from "@/lib/territory-colors";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import type { CanonicalSkillGrowth } from "@/pages/MapPage";

type SortKey = "name" | "category" | "xp";
type FilterMode = "all" | "bookmarked" | "practiced";

interface Props {
  skills: FutureSkill[];
  onSkillClick?: (skill: FutureSkill) => void;
  skillGrowthMap?: Map<string, CanonicalSkillGrowth>;
}

// Bookmark persistence via localStorage
const BOOKMARK_KEY = "xcrow_skill_bookmarks";
function loadBookmarks(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]"));
  } catch { return new Set(); }
}
function saveBookmarks(ids: Set<string>) {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...ids]));
}

// XP level thresholds matching castle system
function getXpLevel(xp: number): { name: string; color: string; next: number } {
  if (xp >= 2500) return { name: "Grandmaster", color: "hsl(45 90% 60%)", next: 2500 };
  if (xp >= 1200) return { name: "Master", color: "hsl(280 70% 60%)", next: 2500 };
  if (xp >= 500) return { name: "Adept", color: "hsl(210 80% 60%)", next: 1200 };
  if (xp >= 150) return { name: "Apprentice", color: "hsl(142 60% 50%)", next: 500 };
  return { name: "Novice", color: "hsl(var(--muted-foreground))", next: 150 };
}

export default function FutureSkillsTable({ skills, onSkillClick, skillGrowthMap }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("xp");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [bookmarks, setBookmarks] = useState<Set<string>>(loadBookmarks);

  const toggleBookmark = useCallback((skillId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(skillId)) next.delete(skillId);
      else next.add(skillId);
      saveBookmarks(next);
      return next;
    });
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(prev => !prev);
    else { setSortKey(key); setSortAsc(false); }
  };

  const getSkillXp = useCallback((skillId: string) => {
    const growth = skillGrowthMap?.get(skillId);
    return growth ? growth.level1Xp + growth.level2Xp : 0;
  }, [skillGrowthMap]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = q
      ? skills.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
      : [...skills];

    if (filterMode === "bookmarked") list = list.filter(s => bookmarks.has(s.id));
    else if (filterMode === "practiced") list = list.filter(s => getSkillXp(s.id) > 0);

    list.sort((a, b) => {
      if (sortKey === "xp") {
        const diff = getSkillXp(a.id) - getSkillXp(b.id);
        return sortAsc ? diff : -diff;
      }
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      return 0;
    });

    return list;
  }, [skills, search, sortKey, sortAsc, filterMode, bookmarks, getSkillXp]);

  const bookmarkedCount = useMemo(() => skills.filter(s => bookmarks.has(s.id)).length, [skills, bookmarks]);
  const practicedCount = useMemo(() => skills.filter(s => getSkillXp(s.id) > 0).length, [skills, getSkillXp]);

  // Domain XP aggregation for radar chart
  const domainData = useMemo(() => {
    const domainXp = new Map<string, number>();
    for (const skill of skills) {
      const xp = getSkillXp(skill.id);
      domainXp.set(skill.category, (domainXp.get(skill.category) || 0) + xp);
    }
    const maxXp = Math.max(...Array.from(domainXp.values()), 1);
    return TERRITORY_ORDER.map(cat => {
      const t = getTerritory(cat);
      return {
        domain: t.emoji + " " + (cat === "Ethics & Compliance" ? "Ethics" : cat === "Human Edge" ? "Human" : cat),
        xp: domainXp.get(cat) || 0,
        fullMark: maxXp,
      };
    });
  }, [skills, getSkillXp]);

  const totalXp = useMemo(() => domainData.reduce((s, d) => s + d.xp, 0), [domainData]);
  const [showChart, setShowChart] = useState(true);

  const colBtn = (key: SortKey, label: string) => (
    <button
      onClick={() => toggleSort(key)}
      className={`flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] transition-colors ${
        sortKey === key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
      style={{ fontFamily: "'Cinzel', serif", fontWeight: 600 }}
    >
      {label}
      <ArrowUpDown className="h-2.5 w-2.5" />
    </button>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Search + Filters */}
      <div className="px-3 py-2.5 shrink-0 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search skills…"
              className="h-8 pl-8 text-xs border-border/50"
              style={{ background: "hsl(var(--surface-stone))" }}
            />
          </div>
          <span className="text-[10px] font-mono whitespace-nowrap" style={{ color: "hsl(var(--filigree))" }}>
            {filtered.length}
          </span>
        </div>
        {/* Filter pills */}
        <div className="flex gap-1">
          {([
            { key: "all" as FilterMode, label: "All", count: skills.length },
            { key: "bookmarked" as FilterMode, label: "⭐ Saved", count: bookmarkedCount },
            { key: "practiced" as FilterMode, label: "⚔️ Practiced", count: practicedCount },
          ]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilterMode(f.key)}
              className="px-2 py-1 rounded-md text-[10px] font-medium transition-all"
              style={{
                fontFamily: "'Cinzel', serif",
                ...(filterMode === f.key
                  ? { color: "hsl(var(--filigree-glow))", background: "hsl(var(--filigree) / 0.12)" }
                  : { color: "hsl(var(--muted-foreground))" }),
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* Domain Radar Chart */}
      {showChart && totalXp > 0 && (
        <div
          className="mx-3 mb-2 rounded-lg shrink-0 relative"
          style={{
            background: "hsl(var(--surface-stone) / 0.5)",
            border: "1px solid hsl(var(--filigree) / 0.1)",
          }}
        >
          <div className="flex items-center justify-between px-3 pt-2">
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--filigree-glow))" }}
            >
              Territory Power
            </span>
            <button
              onClick={() => setShowChart(false)}
              className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Hide
            </button>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={domainData}>
              <PolarGrid stroke="hsl(var(--filigree) / 0.15)" />
              <PolarAngleAxis
                dataKey="domain"
                tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
              />
              <Radar
                name="XP"
                dataKey="xp"
                stroke="hsl(var(--filigree-glow))"
                fill="hsl(var(--filigree-glow))"
                fillOpacity={0.15}
                strokeWidth={1.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!showChart && totalXp > 0 && (
        <div className="px-3 mb-1 shrink-0">
          <button
            onClick={() => setShowChart(true)}
            className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Show Territory Power ▾
          </button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <table className="w-full text-xs">
          <thead
            className="sticky top-0 z-10 backdrop-blur-sm"
            style={{ background: "hsl(var(--surface-stone) / 0.95)" }}
          >
            <tr style={{ borderBottom: "1px solid hsl(var(--filigree) / 0.15)" }}>
              <th className="w-6 py-2" />
              <th className="text-left py-2 pr-2">{colBtn("name", "Skill")}</th>
              <th className="text-left py-2 pr-2">{colBtn("category", "Domain")}</th>
              <th className="text-right py-2 w-[100px]">{colBtn("xp", "Progress")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(skill => {
              const territory = getTerritory(skill.category as FutureSkillCategory);
              const xp = getSkillXp(skill.id);
              const level = getXpLevel(xp);
              const progressPct = xp >= 2500 ? 100 : Math.min(100, (xp / level.next) * 100);
              const isBookmarked = bookmarks.has(skill.id);

              return (
                <tr
                  key={skill.id}
                  onClick={() => onSkillClick?.(skill)}
                  className={`transition-colors hover:bg-muted/20 ${onSkillClick ? "cursor-pointer" : ""}`}
                  style={{ borderBottom: "1px solid hsl(var(--border) / 0.3)" }}
                >
                  {/* Bookmark */}
                  <td className="py-1.5 pr-1">
                    <button
                      onClick={(e) => toggleBookmark(skill.id, e)}
                      className="p-0.5 rounded transition-colors hover:bg-white/10"
                      title={isBookmarked ? "Remove bookmark" : "Bookmark skill"}
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="h-3.5 w-3.5" style={{ color: "hsl(var(--filigree-glow))" }} />
                      ) : (
                        <Bookmark className="h-3.5 w-3.5 text-muted-foreground/40" />
                      )}
                    </button>
                  </td>
                  {/* Skill name */}
                  <td className="py-1.5 pr-2">
                    <div className="flex items-center gap-1.5">
                      {skill.iconEmoji && <span className="text-sm">{skill.iconEmoji}</span>}
                      <span className="font-medium text-foreground truncate max-w-[140px]">{skill.name}</span>
                    </div>
                  </td>
                  {/* Domain */}
                  <td className="py-1.5 pr-2">
                    <span
                      className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-medium"
                      style={{
                        background: `${territory.hsl}15`,
                        color: territory.hsl,
                        border: `1px solid ${territory.hsl}25`,
                      }}
                    >
                      {skill.category}
                    </span>
                  </td>
                  {/* Progress */}
                  <td className="py-1.5">
                    {xp > 0 ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-medium" style={{ color: level.color, fontFamily: "'Cinzel', serif" }}>
                            {level.name}
                          </span>
                          <span className="text-[9px] font-mono text-muted-foreground">{xp} XP</span>
                        </div>
                        <div
                          className="w-[80px] h-1.5 rounded-full overflow-hidden"
                          style={{ background: "hsl(var(--muted) / 0.3)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${progressPct}%`, background: level.color }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50 text-right block">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground text-xs py-6">
            {filterMode === "bookmarked" ? "No bookmarked skills yet" : filterMode === "practiced" ? "No practiced skills yet" : `No skills match "${search}"`}
          </p>
        )}
      </div>
    </div>
  );
}
