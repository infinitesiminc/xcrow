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
import { ArrowUpDown, Search, Bookmark, BookmarkCheck, Zap, Diamond, Lock, ChevronDown, ChevronUp, Swords } from "lucide-react";
import { getTerritory, TERRITORY_ORDER } from "@/lib/territory-colors";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
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
  const [expandedRoles, setExpandedRoles] = useState<{ jobId: string; title: string; company: string | null }[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
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

  // Load roles when expanding a skill
  useEffect(() => {
    if (!expandedSkillId) { setExpandedRoles([]); return; }
    setLoadingRoles(true);
    (async () => {
      const { data } = await supabase
        .from("job_future_skills")
        .select("job_id")
        .eq("canonical_skill_id", expandedSkillId)
        .limit(10);
      const jobIds = [...new Set((data || []).map(d => d.job_id).filter(Boolean))] as string[];
      if (jobIds.length === 0) { setExpandedRoles([]); setLoadingRoles(false); return; }
      const { data: jobs } = await supabase.from("jobs").select("id, title, company_id").in("id", jobIds.slice(0, 5));
      if (!jobs) { setExpandedRoles([]); setLoadingRoles(false); return; }
      const companyIds = [...new Set(jobs.map(j => j.company_id).filter(Boolean))] as string[];
      let cMap = new Map<string, string>();
      if (companyIds.length > 0) {
        const { data: companies } = await supabase.from("companies").select("id, name").in("id", companyIds);
        if (companies) cMap = new Map(companies.map(c => [c.id, c.name]));
      }
      setExpandedRoles(jobs.map(j => ({ jobId: j.id, title: j.title, company: j.company_id ? cMap.get(j.company_id) || null : null })));
      setLoadingRoles(false);
    })();
    // Dispatch focus_skill event for AI coach
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
  const [showChart, setShowChart] = useState(true);

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
    <div className="h-full flex flex-col">
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

      {/* Domain Radar Chart — clickable territories */}
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
          <p className="px-3 text-[9px] text-muted-foreground/60 italic">Click a domain to filter</p>
          <ResponsiveContainer width="100%" height={160}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={domainData} onClick={handleRadarClick}>
              <PolarGrid stroke="hsl(var(--filigree) / 0.15)" />
              <PolarAngleAxis
                dataKey="domain"
                tick={({ x, y, payload }: any) => {
                  const cat = domainData.find(d => d.domain === payload.value)?.fullCategory;
                  const isActive = domainFilter === cat;
                  return (
                    <text
                      x={x} y={y}
                      textAnchor="middle"
                      fontSize={isActive ? 9 : 8}
                      fill={isActive ? "hsl(var(--filigree-glow))" : "hsl(var(--muted-foreground))"}
                      fontWeight={isActive ? 700 : 400}
                      style={{ cursor: "pointer" }}
                    >
                      {payload.value}
                    </text>
                  );
                }}
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
      <div className="flex-1 overflow-y-auto px-3 pb-3" ref={scrollRef}>
        <table className="w-full text-xs">
          <thead
            className="sticky top-0 z-10 backdrop-blur-sm"
            style={{ background: "hsl(var(--surface-stone) / 0.95)" }}
          >
            <tr style={{ borderBottom: "1px solid hsl(var(--filigree) / 0.15)" }}>
              <th className="w-6 py-2" />
              <th className="text-left py-2 pr-2">{colBtn("name", "Skill")}</th>
              <th className="text-right py-2 w-[90px]">{colBtn("xp", "Progress")}</th>
              <th className="w-8 py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(skill => {
              const territory = getTerritory(skill.category as FutureSkillCategory);
              const xp = getSkillXp(skill.id);
              const level = getXpLevel(xp);
              const progressPct = xp >= 2500 ? 100 : Math.min(100, (xp / level.next) * 100);
              const isBookmarked = bookmarks.has(skill.id);
              const isExpanded = expandedSkillId === skill.id;
              const growth = getSkillGrowth(skill.id);
              const l2Unlocked = level2SkillIds?.has(skill.id) ?? false;

              return (
                <tr
                  key={skill.id}
                  ref={el => { if (el) rowRefs.current.set(skill.id, el); }}
                  className="transition-colors"
                  style={{ borderBottom: "1px solid hsl(var(--border) / 0.3)" }}
                >
                  <td colSpan={4} className="p-0">
                    {/* Main row */}
                    <div
                      className={`flex items-center gap-1 px-0 py-1.5 cursor-pointer transition-colors hover:bg-muted/20 ${
                        isExpanded ? "bg-muted/10" : ""
                      }`}
                      onClick={() => {
                        if (isExpanded) { setExpandedSkillId(null); }
                        else {
                          setExpandedSkillId(skill.id);
                          onSkillClick?.(skill);
                        }
                      }}
                    >
                      {/* Bookmark */}
                      <div className="w-6 shrink-0 flex justify-center">
                        <button
                          onClick={(e) => toggleBookmark(skill.id, e)}
                          className="p-0.5 rounded transition-colors hover:bg-white/10"
                        >
                          {isBookmarked ? (
                            <BookmarkCheck className="h-3.5 w-3.5" style={{ color: "hsl(var(--filigree-glow))" }} />
                          ) : (
                            <Bookmark className="h-3.5 w-3.5 text-muted-foreground/40" />
                          )}
                        </button>
                      </div>
                      {/* Name + domain pill */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
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
                      {/* Progress */}
                      <div className="w-[90px] shrink-0 text-right">
                        {xp > 0 ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-medium" style={{ color: level.color, fontFamily: "'Cinzel', serif" }}>
                                {level.name}
                              </span>
                              <span className="text-[9px] font-mono text-muted-foreground">{xp}</span>
                            </div>
                            <div className="w-[70px] h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted) / 0.3)" }}>
                              <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: level.color }} />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/50">—</span>
                        )}
                      </div>
                      {/* Expand chevron */}
                      <div className="w-8 shrink-0 flex justify-center">
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40" />
                        )}
                      </div>
                    </div>

                    {/* Expanded inline detail */}
                    {isExpanded && (
                      <div
                        className="px-3 pb-3 pt-1 space-y-3 animate-in slide-in-from-top-2 duration-200"
                        style={{ background: "hsl(var(--muted) / 0.06)" }}
                      >
                        {skill.description && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{skill.description}</p>
                        )}

                        {/* Battle cards */}
                        <div className="space-y-2">
                          <InlineTrackCard
                            label="Level 1 · AI Mastery"
                            icon={<Zap className="h-3.5 w-3.5" />}
                            xp={growth?.level1Xp ?? 0}
                            maxXp={500}
                            sims={growth?.level1Sims ?? 0}
                            color="hsl(var(--primary))"
                            unlocked
                            onStart={expandedRoles.length > 0 ? () => {
                              const r = expandedRoles[0];
                              navigate(`/role/${encodeURIComponent(r.title)}${r.company ? `?company=${encodeURIComponent(r.company)}` : ""}`);
                            } : undefined}
                          />
                          <InlineTrackCard
                            label="Level 2 · Future Vision"
                            icon={<Diamond className="h-3.5 w-3.5" />}
                            xp={growth?.level2Xp ?? 0}
                            maxXp={500}
                            sims={growth?.level2Sims ?? 0}
                            color="hsl(45 93% 58%)"
                            unlocked={l2Unlocked}
                            unlockText={!l2Unlocked ? `${Math.max(0, 3 - (growth?.level1Sims ?? 0))} more quests` : undefined}
                            onStart={expandedRoles.length > 0 ? () => {
                              const r = expandedRoles[0];
                              navigate(`/role/${encodeURIComponent(r.title)}${r.company ? `?company=${encodeURIComponent(r.company)}&level=2` : "?level=2"}`);
                            } : undefined}
                            startLabel={l2Unlocked ? "⚔️ Level 2" : "⚡ Preview"}
                          />
                        </div>

                        {/* Linked roles (compact) */}
                        {loadingRoles ? (
                          <div className="flex gap-1">
                            {[1,2].map(i => <div key={i} className="h-6 w-24 rounded bg-muted/20 animate-pulse" />)}
                          </div>
                        ) : expandedRoles.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {expandedRoles.map(r => (
                              <button
                                key={r.jobId}
                                onClick={() => navigate(`/role/${encodeURIComponent(r.title)}${r.company ? `?company=${encodeURIComponent(r.company)}` : ""}`)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all hover:brightness-110"
                                style={{
                                  background: "hsl(var(--muted) / 0.2)",
                                  border: "1px solid hsl(var(--filigree) / 0.12)",
                                  color: "hsl(var(--foreground))",
                                }}
                              >
                                <Swords className="h-2.5 w-2.5" style={{ color: territory.hsl }} />
                                <span className="truncate max-w-[120px]">{r.title}</span>
                                {r.company && <span className="text-muted-foreground">· {r.company}</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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

/* ── Inline Track Card (compact battle card for expanded rows) ── */
function InlineTrackCard({
  label, icon, xp, maxXp, sims, color, unlocked, unlockText, onStart, startLabel,
}: {
  label: string; icon: React.ReactNode; xp: number; maxXp: number; sims: number;
  color: string; unlocked: boolean; unlockText?: string; onStart?: () => void; startLabel?: string;
}) {
  const pct = Math.min(100, Math.round((xp / maxXp) * 100));
  return (
    <div
      className="rounded-lg p-3 relative overflow-hidden"
      style={{
        background: unlocked
          ? `linear-gradient(135deg, hsl(var(--muted) / 0.3), hsl(var(--muted) / 0.12))`
          : "hsl(var(--muted) / 0.06)",
        border: unlocked ? `1px solid ${color}33` : "1px solid hsl(var(--filigree) / 0.06)",
        opacity: unlocked ? 1 : 0.65,
      }}
    >
      {unlocked && <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: color }} />}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span style={{ color: unlocked ? color : "hsl(var(--muted-foreground))" }}>
            {unlocked ? icon : <Lock className="h-3.5 w-3.5" />}
          </span>
          <span className="text-[11px] font-bold" style={{ fontFamily: "'Cinzel', serif" }}>{label}</span>
        </div>
        {unlocked && (
          <span className="text-xs font-black tabular-nums" style={{ color, fontFamily: "'Cinzel', serif" }}>
            {xp} XP
          </span>
        )}
      </div>
      {unlocked ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted) / 0.4)" }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
          </div>
          <span className="text-[9px] text-muted-foreground shrink-0">{sims} quests</span>
          {onStart && (
            <button
              onClick={(e) => { e.stopPropagation(); onStart(); }}
              className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all hover:brightness-110"
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                color: "hsl(var(--foreground))",
                fontFamily: "'Cinzel', serif",
                boxShadow: `0 1px 6px ${color}30`,
              }}
            >
              {startLabel || "⚔️ Quest"}
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {unlockText && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Lock className="h-2.5 w-2.5" />
              {unlockText}
            </div>
          )}
          {onStart && (
            <button
              onClick={(e) => { e.stopPropagation(); onStart(); }}
              className="ml-auto px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all hover:brightness-110"
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                color: "hsl(var(--foreground))",
                fontFamily: "'Cinzel', serif",
              }}
            >
              {startLabel || "⚡ Preview"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
