/**
 * MyRolesPanel — Dynamic Kingdoms view.
 * Kingdoms auto-emerge from user behavior: Scouted → Contested → Conquered.
 * Includes Arsenal tab for AI tools.
 */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ChevronRight, Shield, Flame, Wrench, ExternalLink, X,
  Sparkles, Eye, Swords, Crown, Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getCastleState, type CastleTier } from "@/lib/castle-levels";
import { motion, AnimatePresence } from "framer-motion";
import {
  AI_TOOL_REGISTRY, getSavedTools, removeToolFromList,
  groupToolsByCompany, type AIToolInfo,
} from "@/lib/ai-tool-registry";
import type { RoleResult } from "@/components/InlineRoleCarousel";

/* ── Types ── */

type KingdomTier = "scouted" | "contested" | "conquered";

interface Kingdom {
  key: string;
  title: string;
  company: string | null;
  tier: KingdomTier;
  augmented: number;
  risk: number;
  questsCompleted: number;
  totalQuests: number;
  xp: number;
  skillsEarned: string[];
  lastActivity: string | null;
  population?: number;
}

interface MyRolesPanelProps {
  onSelectRole: (role: RoleResult) => void;
  onAskChat: (prompt: string) => void;
  onTabChange?: (tab: "saved" | "practiced") => void;
}

/* ── Tier config ── */

const TIER_META: Record<KingdomTier, { icon: typeof Eye; label: string; emoji: string; color: string }> = {
  scouted:   { icon: Eye,    label: "Scouted",   emoji: "👁️", color: "hsl(var(--muted-foreground))" },
  contested: { icon: Swords, label: "Contested",  emoji: "⚔️", color: "hsl(var(--territory-communication))" },
  conquered: { icon: Crown,  label: "Conquered",  emoji: "🏰", color: "hsl(var(--filigree-glow))" },
};

const TIER_GLOW: Record<CastleTier, string> = {
  ruins:       "transparent",
  outpost:     "hsl(var(--territory-communication) / 0.15)",
  fortress:    "hsl(var(--territory-analytical) / 0.15)",
  citadel:     "hsl(var(--filigree-glow) / 0.15)",
  grandmaster: "hsl(var(--territory-technical) / 0.2)",
};
const TIER_BORDER: Record<CastleTier, string> = {
  ruins:       "hsl(var(--border) / 0.3)",
  outpost:     "hsl(var(--territory-communication) / 0.25)",
  fortress:    "hsl(var(--territory-analytical) / 0.3)",
  citadel:     "hsl(var(--filigree-glow) / 0.35)",
  grandmaster: "hsl(var(--territory-technical) / 0.4)",
};

/* ── Kingdom Card ── */

function KingdomCard({ kingdom, index }: { kingdom: Kingdom; index: number }) {
  const navigate = useNavigate();
  const castle = getCastleState(kingdom.xp);
  const tierMeta = TIER_META[kingdom.tier];
  const questProgress = kingdom.totalQuests > 0
    ? Math.round((kingdom.questsCompleted / kingdom.totalQuests) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="group relative rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: `linear-gradient(135deg, hsl(var(--surface-stone)), ${TIER_GLOW[castle.tier]})`,
        border: `1px solid ${TIER_BORDER[castle.tier]}`,
        boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 2px 6px hsl(var(--emboss-shadow))",
      }}
      onClick={() => navigate(`/role/${encodeURIComponent(kingdom.title)}${kingdom.company ? `?company=${encodeURIComponent(kingdom.company)}` : ""}`)}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <span className="text-lg leading-none mt-0.5">{castle.emoji}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-[12px] font-semibold text-foreground truncate leading-tight">{kingdom.title}</h4>
          {kingdom.company && <p className="text-[10px] text-muted-foreground truncate">{kingdom.company}</p>}
        </div>
      </div>

      {/* Tier badge + population */}
      <div className="flex items-center gap-1.5 mb-2">
        <span
          className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.06em] px-1.5 py-0.5 rounded-md"
          style={{
            background: `${tierMeta.color}15`,
            color: tierMeta.color,
            fontFamily: "'Cinzel', serif",
          }}
        >
          {tierMeta.emoji} {tierMeta.label}
        </span>
        {kingdom.population != null && kingdom.population > 1 && (
          <span className="ml-auto text-[9px] text-muted-foreground/70 flex items-center gap-0.5">
            <Users className="h-2.5 w-2.5" /> {kingdom.population}
          </span>
        )}
      </div>

      {/* Threat level */}
      {kingdom.augmented > 0 && (
        <div className="flex items-center gap-1.5 mb-2">
          <Flame className="h-3 w-3" style={{ color: "hsl(var(--territory-leadership))" }} />
          <span className="text-[10px] text-muted-foreground">AI Threat</span>
          <span className="text-[10px] font-semibold text-foreground ml-auto">{kingdom.augmented}%</span>
        </div>
      )}

      {/* Progress (contested/conquered only) */}
      {kingdom.tier !== "scouted" && (
        <>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">
              {kingdom.questsCompleted}/{kingdom.totalQuests || "?"} quests
            </span>
            <span className="text-[10px] font-medium" style={{ color: "hsl(var(--filigree-glow))" }}>
              {kingdom.xp} XP
            </span>
          </div>
          <Progress value={questProgress} className="h-1.5 bg-muted/30" />
          {kingdom.skillsEarned.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {kingdom.skillsEarned.slice(0, 3).map(s => (
                <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-md truncate max-w-[80px]"
                  style={{ background: "hsl(var(--muted) / 0.4)", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border) / 0.3)" }}
                >{s}</span>
              ))}
              {kingdom.skillsEarned.length > 3 && (
                <span className="text-[9px] text-muted-foreground/60">+{kingdom.skillsEarned.length - 3}</span>
              )}
            </div>
          )}
        </>
      )}

      {/* CTA */}
      <button
        onClick={e => { e.stopPropagation(); navigate(`/role/${encodeURIComponent(kingdom.title)}${kingdom.company ? `?company=${encodeURIComponent(kingdom.company)}` : ""}`); }}
        className="w-full mt-2 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{
          background: "hsl(var(--primary) / 0.1)",
          color: "hsl(var(--primary))",
          fontFamily: "'Cinzel', serif",
          letterSpacing: "0.04em",
        }}
      >
        {kingdom.tier === "scouted" ? <Shield className="h-3 w-3" /> : <Swords className="h-3 w-3" />}
        {kingdom.tier === "scouted" ? "Scout Kingdom" : kingdom.tier === "conquered" ? "Revisit Kingdom" : "Continue Campaign"}
        <ChevronRight className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

/* ── Main Panel ── */

export default function MyRolesPanel({ onSelectRole, onAskChat, onTabChange }: MyRolesPanelProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"kingdoms" | "arsenal">("kingdoms");
  const [tierFilter, setTierFilter] = useState<"all" | KingdomTier>("all");
  const [search, setSearch] = useState("");
  const [kingdoms, setKingdoms] = useState<Kingdom[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedToolNames, setSavedToolNames] = useState<string[]>(getSavedTools());
  const [arsenalFilter, setArsenalFilter] = useState("all");

  /* ── Fetch & merge kingdoms from behavior ── */
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    Promise.all([
      // Scouted: analysis_history (viewed/analyzed roles)
      supabase
        .from("analysis_history")
        .select("job_title, company, augmented_percent, automation_risk_percent, analyzed_at")
        .eq("user_id", user.id)
        .order("analyzed_at", { ascending: false })
        .limit(50),
      // Bookmarked roles (also scouted)
      supabase
        .from("bookmarked_roles")
        .select("job_title, company, augmented_percent, automation_risk_percent, bookmarked_at")
        .eq("user_id", user.id)
        .limit(30),
      // Contested/Conquered: completed simulations
      supabase
        .from("completed_simulations")
        .select("job_title, company, task_name, correct_answers, total_questions, skills_earned, completed_at")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(200),
      // Population counts (how many users have sims per role title)
      supabase.rpc("get_kingdom_populations"),
    ]).then(([analysisRes, bookmarkRes, simsRes, popRes]) => {
      const roleMap = new Map<string, Kingdom>();
      const popMap = new Map<string, number>();

      // Population counts (may fail if RPC doesn't exist yet — graceful fallback)
      if (popRes.data && Array.isArray(popRes.data)) {
        for (const p of popRes.data as any[]) {
          popMap.set(p.job_title?.toLowerCase(), p.player_count);
        }
      }

      const getKey = (title: string, company: string | null) =>
        `${title.toLowerCase()}||${(company || "").toLowerCase()}`;

      // 1. Seed from completed sims → contested or conquered
      for (const s of (simsRes.data || []) as any[]) {
        const key = getKey(s.job_title, s.company);
        if (!roleMap.has(key)) {
          roleMap.set(key, {
            key,
            title: s.job_title,
            company: s.company,
            tier: "contested",
            augmented: 0,
            risk: 0,
            questsCompleted: 0,
            totalQuests: 8,
            xp: 0,
            skillsEarned: [],
            lastActivity: s.completed_at,
            population: popMap.get(s.job_title?.toLowerCase()),
          });
        }
        const k = roleMap.get(key)!;
        k.questsCompleted += 1;
        const acc = s.total_questions > 0 ? s.correct_answers / s.total_questions : 0.5;
        k.xp += Math.round(100 * (0.5 + acc * 0.5));
        const earned = s.skills_earned as any[];
        if (Array.isArray(earned)) {
          for (const sk of earned) {
            const name = typeof sk === "string" ? sk : sk?.name || sk?.skill_name;
            if (name && !k.skillsEarned.includes(name)) k.skillsEarned.push(name);
          }
        }
      }

      // Mark conquered (all quests done or high XP)
      for (const k of roleMap.values()) {
        if (k.questsCompleted >= k.totalQuests || k.xp >= 800) {
          k.tier = "conquered";
        }
      }

      // 2. Seed from analysis_history → scouted (if not already contested)
      for (const a of (analysisRes.data || []) as any[]) {
        const key = getKey(a.job_title, a.company);
        if (!roleMap.has(key)) {
          roleMap.set(key, {
            key,
            title: a.job_title,
            company: a.company,
            tier: "scouted",
            augmented: a.augmented_percent || 0,
            risk: a.automation_risk_percent || 0,
            questsCompleted: 0,
            totalQuests: 0,
            xp: 0,
            skillsEarned: [],
            lastActivity: a.analyzed_at,
            population: popMap.get(a.job_title?.toLowerCase()),
          });
        } else {
          // Backfill augmented % from analysis data
          const existing = roleMap.get(key)!;
          if (!existing.augmented) existing.augmented = a.augmented_percent || 0;
          if (!existing.risk) existing.risk = a.automation_risk_percent || 0;
        }
      }

      // 3. Seed from bookmarks → scouted (if not already there)
      for (const b of (bookmarkRes.data || []) as any[]) {
        const key = getKey(b.job_title, b.company);
        if (!roleMap.has(key)) {
          roleMap.set(key, {
            key,
            title: b.job_title,
            company: b.company,
            tier: "scouted",
            augmented: b.augmented_percent || 0,
            risk: b.automation_risk_percent || 0,
            questsCompleted: 0,
            totalQuests: 0,
            xp: 0,
            skillsEarned: [],
            lastActivity: b.bookmarked_at,
            population: popMap.get(b.job_title?.toLowerCase()),
          });
        }
      }

      // Sort: conquered first, then contested (by XP desc), then scouted (by recency)
      const sorted = Array.from(roleMap.values()).sort((a, b) => {
        const tierOrder: Record<KingdomTier, number> = { conquered: 0, contested: 1, scouted: 2 };
        if (tierOrder[a.tier] !== tierOrder[b.tier]) return tierOrder[a.tier] - tierOrder[b.tier];
        if (a.xp !== b.xp) return b.xp - a.xp;
        return (b.lastActivity || "").localeCompare(a.lastActivity || "");
      });

      setKingdoms(sorted);
      setLoading(false);
    });
  }, [user]);

  /* ── Filtering ── */
  const q = search.toLowerCase();
  const filteredKingdoms = useMemo(() => {
    return kingdoms.filter(k => {
      if (tierFilter !== "all" && k.tier !== tierFilter) return false;
      if (q && !k.title.toLowerCase().includes(q) && !(k.company || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [kingdoms, tierFilter, q]);

  const tierCounts = useMemo(() => {
    const c = { scouted: 0, contested: 0, conquered: 0 };
    for (const k of kingdoms) c[k.tier]++;
    return c;
  }, [kingdoms]);

  /* ── Arsenal logic ── */
  const allToolsFiltered = AI_TOOL_REGISTRY.filter(t => {
    if (arsenalFilter === "saved" && !savedToolNames.includes(t.name)) return false;
    if (arsenalFilter !== "all" && arsenalFilter !== "saved" && t.category !== arsenalFilter) return false;
    if (q && !t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q) && !t.company.toLowerCase().includes(q)) return false;
    return true;
  });
  const seen = new Set<string>();
  const uniqueTools = allToolsFiltered.filter(t => { if (seen.has(t.name)) return false; seen.add(t.name); return true; });
  const companyGroups = groupToolsByCompany(uniqueTools);
  const handleRemoveTool = (name: string) => setSavedToolNames(removeToolFromList(name));

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg p-0.5 mb-3 shrink-0" style={{ background: "hsl(var(--surface-stone))" }}>
        <button
          onClick={() => setTab("kingdoms")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all flex-1 justify-center"
          style={{
            fontFamily: "'Cinzel', serif", letterSpacing: "0.04em",
            ...(tab === "kingdoms"
              ? { background: "hsl(var(--background))", color: "hsl(var(--foreground))", boxShadow: "0 1px 3px hsl(var(--emboss-shadow))" }
              : { color: "hsl(var(--muted-foreground))" }),
          }}
        >
          <Crown className="h-3 w-3" />
          Kingdoms
        </button>
        <button
          onClick={() => { setTab("arsenal"); setArsenalFilter("all"); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all flex-1 justify-center"
          style={{
            fontFamily: "'Cinzel', serif", letterSpacing: "0.04em",
            ...(tab === "arsenal"
              ? { background: "hsl(var(--background))", color: "hsl(var(--foreground))", boxShadow: "0 1px 3px hsl(var(--emboss-shadow))" }
              : { color: "hsl(var(--muted-foreground))" }),
          }}
        >
          <Wrench className="h-3 w-3" />
          Arsenal
        </button>
      </div>

      {/* Kingdom tier filter pills */}
      {tab === "kingdoms" && (
        <div className="flex gap-1 mb-3 shrink-0">
          {([
            { key: "all" as const, label: "All", count: kingdoms.length },
            { key: "conquered" as const, label: "🏰 Conquered", count: tierCounts.conquered },
            { key: "contested" as const, label: "⚔️ Contested", count: tierCounts.contested },
            { key: "scouted" as const, label: "👁️ Scouted", count: tierCounts.scouted },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setTierFilter(f.key)}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium transition-all"
              style={{
                fontFamily: "'Cinzel', serif",
                background: tierFilter === f.key ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted) / 0.3)",
                color: tierFilter === f.key ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                border: tierFilter === f.key ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid transparent",
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      )}

      {/* Arsenal filter chips */}
      {tab === "arsenal" && (
        <div className="flex flex-wrap gap-1 mb-3 shrink-0">
          {[
            { key: "all", label: "All" },
            { key: "saved", label: `★ Saved (${savedToolNames.length})` },
            { key: "llm", label: "LLMs" },
            { key: "coding", label: "Coding" },
            { key: "productivity", label: "Productivity" },
            { key: "design", label: "Design" },
            { key: "data", label: "Data" },
            { key: "writing", label: "Writing" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setArsenalFilter(f.key)}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium transition-all"
              style={{
                fontFamily: "'Cinzel', serif",
                background: arsenalFilter === f.key ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted) / 0.3)",
                color: arsenalFilter === f.key ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                border: arsenalFilter === f.key ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid transparent",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3 shrink-0">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={tab === "arsenal" ? "Search AI tools…" : "Search kingdoms…"}
          className="h-8 pl-8 text-xs border-border/40"
          style={{ background: "hsl(var(--surface-stone))" }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {tab === "arsenal" ? (
          companyGroups.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-3xl mb-3 block">🔧</span>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
                {arsenalFilter === "saved" ? "No saved tools yet" : "No tools found"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {companyGroups.map(({ company, tools: companyTools }) => (
                <div key={company}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'Cinzel', serif" }}
                    >{company}</span>
                    <div className="flex-1 h-px" style={{ background: "hsl(var(--filigree) / 0.15)" }} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {companyTools.map(tool => {
                      const isSaved = savedToolNames.includes(tool.name);
                      const catEmoji = tool.category === "llm" ? "🧠" : tool.category === "coding" ? "💻" :
                        tool.category === "productivity" ? "📋" : tool.category === "design" ? "🎨" :
                        tool.category === "data" ? "📊" : tool.category === "writing" ? "✍️" : "🔍";
                      return (
                        <div key={tool.name}
                          className="group relative inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium cursor-default transition-all hover:scale-105"
                          style={{
                            background: isSaved ? "hsl(var(--filigree) / 0.12)" : "hsl(var(--surface-stone))",
                            border: isSaved ? "1px solid hsl(var(--filigree-glow) / 0.3)" : "1px solid hsl(var(--filigree) / 0.12)",
                            color: isSaved ? "hsl(var(--filigree-glow))" : "hsl(var(--foreground))",
                          }}
                          title={tool.description}
                        >
                          <span className="text-xs">{catEmoji}</span>
                          <span>{tool.name}</span>
                          {isSaved && <Sparkles className="h-2.5 w-2.5 shrink-0" style={{ color: "hsl(var(--filigree-glow))" }} />}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 px-2 py-1 rounded-md text-[9px] whitespace-nowrap z-10"
                            style={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 12px hsl(var(--emboss-shadow))" }}
                          >
                            {tool.url && (
                              <a href={tool.url} target="_blank" rel="noopener noreferrer"
                                className="hover:opacity-70 transition-opacity" style={{ color: "hsl(var(--primary))" }}
                                onClick={e => e.stopPropagation()}
                              ><ExternalLink className="h-2.5 w-2.5" /></a>
                            )}
                            {isSaved && (
                              <button onClick={() => handleRemoveTool(tool.name)}
                                className="hover:text-destructive transition-colors" style={{ color: "hsl(var(--muted-foreground))" }}
                              ><X className="h-2.5 w-2.5" /></button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredKingdoms.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-3xl mb-3 block">🗺️</span>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
              {tierFilter !== "all" ? `No ${tierFilter} kingdoms` : "No kingdoms discovered yet"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Explore roles via the chat or search to discover your first kingdom.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredKingdoms.map((k, i) => (
              <KingdomCard key={k.key} kingdom={k} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
