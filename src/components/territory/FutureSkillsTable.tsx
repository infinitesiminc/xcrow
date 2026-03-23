/**
 * FutureSkillsTable — Unified Skill Forge with:
 * - Clickable radar chart domains to filter by territory
 * - Inline expand with battle cards + quest launch
 * - Bookmark + progress tracking
 */
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { type FutureSkill, type FutureSkillCategory } from "@/hooks/use-future-skills";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, Search, Zap, Diamond, Lock } from "lucide-react";
import { getTerritory, TERRITORY_ORDER } from "@/lib/territory-colors";
import { useAuth } from "@/contexts/AuthContext";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import type { CanonicalSkillGrowth } from "@/pages/MapPage";

type SortKey = "name" | "category" | "xp";
type FilterMode = "all" | "bookmarked" | "practiced";

interface Props {
  skills: FutureSkill[];
  onSkillClick?: (skill: FutureSkill) => void;
  skillGrowthMap?: Map<string, CanonicalSkillGrowth>;
  /** Skill ID to scroll to and highlight (from map click) */
  focusSkillId?: string | null;
  /** Level 2 unlocked skill IDs */
  level2SkillIds?: Set<string>;
}

const BOOKMARK_KEY = "xcrow_skill_bookmarks";
function loadBookmarks(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]")); }
  catch { return new Set(); }
}
function saveBookmarks(ids: Set<string>) {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...ids]));
}

function getXpLevel(xp: number): { name: string; color: string; next: number } {
  if (xp >= 2500) return { name: "Grandmaster", color: "hsl(45 90% 60%)", next: 2500 };
  if (xp >= 1200) return { name: "Master", color: "hsl(280 70% 60%)", next: 2500 };
  if (xp >= 500) return { name: "Adept", color: "hsl(210 80% 60%)", next: 1200 };
  if (xp >= 150) return { name: "Apprentice", color: "hsl(142 60% 50%)", next: 500 };
  return { name: "Novice", color: "hsl(var(--muted-foreground))", next: 150 };
}

export default function FutureSkillsTable({ skills, onSkillClick, skillGrowthMap, focusSkillId, level2SkillIds }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("xp");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<string>>(loadBookmarks);
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

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

  const getSkillGrowth = useCallback((skillId: string) => {
    return skillGrowthMap?.get(skillId) ?? null;
  }, [skillGrowthMap]);

  // Handle focus from map click — scroll to skill + expand it
  useEffect(() => {
    if (!focusSkillId) return;
    // Clear domain filter so the skill is visible
    setDomainFilter(null);
    setFilterMode("all");
    setSearch("");
    setExpandedSkillId(focusSkillId);
    // Scroll after render
    requestAnimationFrame(() => {
      const row = rowRefs.current.get(focusSkillId);
      row?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [focusSkillId]);

  // Dispatch focus_skill event when a skill is selected
  useEffect(() => {
    if (!expandedSkillId) return;
    const skill = skills.find(s => s.id === expandedSkillId);
    if (skill) {
      window.dispatchEvent(new CustomEvent("focus_skill", {
        detail: { skillId: skill.id, skillName: skill.name, category: skill.category },
      }));
    }
  }, [expandedSkillId, skills]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = q
      ? skills.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
      : [...skills];

    if (domainFilter) list = list.filter(s => s.category === domainFilter);
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
  }, [skills, search, sortKey, sortAsc, filterMode, domainFilter, bookmarks, getSkillXp]);

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
        fullCategory: cat,
        xp: domainXp.get(cat) || 0,
        fullMark: maxXp,
      };
    });
  }, [skills, getSkillXp]);

  const totalXp = useMemo(() => domainData.reduce((s, d) => s + d.xp, 0), [domainData]);
  const [chartOpen, setChartOpen] = useState(false);

  // Click handler for radar chart domains
  const handleRadarClick = useCallback((data: any) => {
    if (data?.activePayload?.[0]?.payload?.fullCategory) {
      const cat = data.activePayload[0].payload.fullCategory;
      setDomainFilter(prev => prev === cat ? null : cat);
      setFilterMode("all");
      setSearch("");
    }
  }, []);

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
    <div className="h-full flex flex-col overflow-x-hidden">
      {/* Search + Filters */}
      <div className="px-3 py-2.5 shrink-0 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => { setSearch(e.target.value); setDomainFilter(null); }}
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
        <div className="flex gap-1 flex-wrap">
          {([
            { key: "all" as FilterMode, label: "All", count: skills.length },
            { key: "bookmarked" as FilterMode, label: "⭐ Saved", count: bookmarkedCount },
            { key: "practiced" as FilterMode, label: "⚔️ Practiced", count: practicedCount },
          ]).map(f => (
            <button
              key={f.key}
              onClick={() => { setFilterMode(f.key); setDomainFilter(null); }}
              className="px-2 py-1 rounded-md text-[10px] font-medium transition-all"
              style={{
                fontFamily: "'Cinzel', serif",
                ...(filterMode === f.key && !domainFilter
                  ? { color: "hsl(var(--filigree-glow))", background: "hsl(var(--filigree) / 0.12)" }
                  : { color: "hsl(var(--muted-foreground))" }),
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
          {domainFilter && (
            <button
              onClick={() => setDomainFilter(null)}
              className="px-2 py-1 rounded-md text-[10px] font-medium transition-all"
              style={{
                fontFamily: "'Cinzel', serif",
                color: getTerritory(domainFilter as FutureSkillCategory).hsl,
                background: `${getTerritory(domainFilter as FutureSkillCategory).hsl}18`,
                border: `1px solid ${getTerritory(domainFilter as FutureSkillCategory).hsl}30`,
              }}
            >
              {getTerritory(domainFilter as FutureSkillCategory).emoji} {domainFilter} ✕
            </button>
          )}
        </div>
      </div>

      {/* Mini Territory Power radar — inline thumbnail + popover */}
      {totalXp > 0 && (
        <div className="px-3 mb-2 shrink-0">
          <Popover open={chartOpen} onOpenChange={setChartOpen}>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-2 w-full rounded-lg px-2 py-1.5 transition-all hover:brightness-110"
                style={{
                  background: "hsl(var(--surface-stone) / 0.5)",
                  border: "1px solid hsl(var(--filigree) / 0.1)",
                }}
              >
                {/* Tiny inline radar thumbnail */}
                <div className="w-10 h-10 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={domainData}>
                      <Radar dataKey="xp" stroke="hsl(var(--filigree-glow))" fill="hsl(var(--filigree-glow))" fillOpacity={0.2} strokeWidth={1} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--filigree-glow))" }}>
                    Territory Power
                  </span>
                  <span className="text-[9px] text-muted-foreground">{totalXp.toLocaleString()} XP · click to explore</span>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="right"
              align="start"
              className="w-72 p-0"
              style={{
                background: "hsl(var(--surface-stone))",
                border: "1px solid hsl(var(--filigree) / 0.2)",
              }}
            >
              <div className="px-3 pt-2 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--filigree-glow))" }}>
                  Territory Power
                </span>
                <p className="text-[9px] text-muted-foreground/60 italic">Click a domain to filter</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={domainData} onClick={handleRadarClick}>
                  <PolarGrid stroke="hsl(var(--filigree) / 0.15)" />
                  <PolarAngleAxis
                    dataKey="domain"
                    tick={({ x, y, payload }: any) => {
                      const cat = domainData.find(d => d.domain === payload.value)?.fullCategory;
                      const isActive = domainFilter === cat;
                      return (
                        <text x={x} y={y} textAnchor="middle" fontSize={isActive ? 9 : 8}
                          fill={isActive ? "hsl(var(--filigree-glow))" : "hsl(var(--muted-foreground))"}
                          fontWeight={isActive ? 700 : 400} style={{ cursor: "pointer" }}
                        >
                          {payload.value}
                        </text>
                      );
                    }}
                  />
                  <Radar name="XP" dataKey="xp" stroke="hsl(var(--filigree-glow))" fill="hsl(var(--filigree-glow))" fillOpacity={0.15} strokeWidth={1.5} />
                </RadarChart>
              </ResponsiveContainer>
              {/* Domain XP legend */}
              <div className="px-3 pb-2 grid grid-cols-2 gap-x-2 gap-y-0.5">
                {domainData.filter(d => d.xp > 0).map(d => (
                  <button
                    key={d.fullCategory}
                    onClick={() => { setDomainFilter(prev => prev === d.fullCategory ? null : d.fullCategory); setChartOpen(false); }}
                    className="flex items-center gap-1 text-[9px] text-muted-foreground hover:text-foreground transition-colors truncate"
                  >
                    <span>{d.domain.split(" ")[0]}</span>
                    <span className="font-mono" style={{ color: "hsl(var(--filigree-glow))" }}>{d.xp}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3" ref={scrollRef}>
        <table className="w-full text-xs table-fixed">
          <thead
            className="sticky top-0 z-10 backdrop-blur-sm"
            style={{ background: "hsl(var(--surface-stone) / 0.95)" }}
          >
            <tr style={{ borderBottom: "1px solid hsl(var(--filigree) / 0.15)" }}>
              <th className="text-left py-2 pr-1" style={{ width: "55%" }}>{colBtn("name", "Skill")}</th>
              <th className="text-center py-2" style={{ width: "35%" }}>
                <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground" style={{ fontFamily: "'Cinzel', serif", fontWeight: 600 }}>
                  Launch
                </span>
              </th>
              <th className="py-2" style={{ width: "10%" }} />
            </tr>
          </thead>
          <tbody>
            {filtered.map(skill => {
              const territory = getTerritory(skill.category as FutureSkillCategory);
              const isBookmarked = bookmarks.has(skill.id);
              const growth = getSkillGrowth(skill.id);
              const l2Unlocked = level2SkillIds?.has(skill.id) ?? false;

              return (
                <tr
                  key={skill.id}
                  ref={el => { if (el) rowRefs.current.set(skill.id, el); }}
                  className="transition-colors"
                  style={{ borderBottom: "1px solid hsl(var(--border) / 0.3)" }}
                >
                  <td colSpan={3} className="p-0">
                    {/* Main row */}
                    <div
                      className="flex items-center gap-1 px-1 py-1.5 cursor-pointer transition-colors hover:bg-muted/20"
                      onClick={() => onSkillClick?.(skill)}
                      onContextMenu={(e) => { e.preventDefault(); toggleBookmark(skill.id, e); }}
                    >
                      {/* Name + domain pill */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isBookmarked && <span className="text-[8px]" style={{ color: "hsl(var(--filigree-glow))" }}>⭐</span>}
                          {skill.iconEmoji && <span className="text-sm">{skill.iconEmoji}</span>}
                          <span className="font-medium text-foreground truncate text-xs">{skill.name}</span>
                        </div>
                        <span
                          className="inline-block px-1 py-0 rounded text-[9px] font-medium mt-0.5"
                          style={{ background: `${territory.hsl}12`, color: territory.hsl }}
                        >
                          {skill.category}
                        </span>
                      </div>
                      {/* L1 / L2 quick-launch icons */}
                      <div className="shrink-0 flex items-center justify-center gap-1">
                        {/* Level 1 */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[9px] font-medium transition-all hover:brightness-110"
                              style={{
                                background: (growth?.level1Xp ?? 0) > 0
                                  ? "hsl(var(--primary) / 0.15)"
                                  : "hsl(var(--muted) / 0.15)",
                                border: `1px solid ${(growth?.level1Xp ?? 0) > 0 ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border) / 0.2)"}`,
                                color: (growth?.level1Xp ?? 0) > 0 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                              }}
                              title="Level 1 · AI Mastery"
                            >
                              <Zap className="h-3 w-3" />
                              <span className="font-mono">{growth?.level1Xp ?? 0}</span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent side="top" align="center" className="w-48 p-2.5" style={{ background: "hsl(var(--surface-stone))", border: "1px solid hsl(var(--filigree) / 0.2)" }}>
                            <div className="text-[10px] font-bold mb-1" style={{ fontFamily: "'Cinzel', serif" }}>⚡ Level 1 · AI Mastery</div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted) / 0.4)" }}>
                                <div className="h-full rounded-full" style={{ width: `${Math.min(100, ((growth?.level1Xp ?? 0) / 500) * 100)}%`, background: "hsl(var(--primary))" }} />
                              </div>
                              <span className="text-[9px] font-mono text-muted-foreground">{growth?.level1Xp ?? 0}/500</span>
                            </div>
                            <div className="text-[9px] text-muted-foreground mb-2">{growth?.level1Sims ?? 0} quests completed</div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/role/${encodeURIComponent(skill.name)}?skill=${encodeURIComponent(skill.id)}`);
                              }}
                              className="w-full px-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all hover:brightness-110"
                              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))", color: "hsl(var(--foreground))", fontFamily: "'Cinzel', serif" }}
                            >
                              ⚔️ Start Quest
                            </button>
                          </PopoverContent>
                        </Popover>

                        {/* Level 2 */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[9px] font-medium transition-all hover:brightness-110"
                              style={{
                                background: l2Unlocked
                                  ? (growth?.level2Xp ?? 0) > 0 ? "hsl(45 93% 58% / 0.15)" : "hsl(45 93% 58% / 0.08)"
                                  : "hsl(var(--muted) / 0.08)",
                                border: `1px solid ${l2Unlocked ? "hsl(45 93% 58% / 0.3)" : "hsl(var(--border) / 0.15)"}`,
                                color: l2Unlocked ? "hsl(45 93% 58%)" : "hsl(var(--muted-foreground) / 0.5)",
                                opacity: l2Unlocked ? 1 : 0.6,
                              }}
                              title={l2Unlocked ? "Level 2 · Human Edge" : "Locked — complete more L1 quests"}
                            >
                              {l2Unlocked ? <Diamond className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                              <span className="font-mono">{growth?.level2Xp ?? 0}</span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent side="top" align="center" className="w-48 p-2.5" style={{ background: "hsl(var(--surface-stone))", border: "1px solid hsl(var(--filigree) / 0.2)" }}>
                            <div className="text-[10px] font-bold mb-1" style={{ fontFamily: "'Cinzel', serif" }}>
                              {l2Unlocked ? "✦ Level 2 · Human Edge" : "🔒 Level 2 · Locked"}
                            </div>
                            {l2Unlocked ? (
                              <>
                                <div className="flex items-center gap-2 mb-1.5">
                                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted) / 0.4)" }}>
                                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, ((growth?.level2Xp ?? 0) / 500) * 100)}%`, background: "hsl(45 93% 58%)" }} />
                                  </div>
                                  <span className="text-[9px] font-mono text-muted-foreground">{growth?.level2Xp ?? 0}/500</span>
                                </div>
                                <div className="text-[9px] text-muted-foreground mb-2">{growth?.level2Sims ?? 0} quests completed</div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/role/${encodeURIComponent(skill.name)}?skill=${encodeURIComponent(skill.id)}&level=2`);
                                  }}
                                  className="w-full px-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all hover:brightness-110"
                                  style={{ background: "linear-gradient(135deg, hsl(45 93% 58%), hsl(45 93% 48%))", color: "hsl(var(--background))", fontFamily: "'Cinzel', serif" }}
                                >
                                  ⚔️ Level 2 Quest
                                </button>
                              </>
                            ) : (
                              <div className="text-[9px] text-muted-foreground">
                                Complete {Math.max(0, 3 - (growth?.level1Sims ?? 0))} more L1 quests or score 80%+ to unlock
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground text-xs py-6">
            {domainFilter ? `No skills in ${domainFilter}` : filterMode === "bookmarked" ? "No bookmarked skills yet" : filterMode === "practiced" ? "No practiced skills yet" : `No skills match "${search}"`}
          </p>
        )}
      </div>
    </div>
  );
}
