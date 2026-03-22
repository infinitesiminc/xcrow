/**
 * MyRolesPanel — RPG Kingdoms view with Dark Fantasy styling.
 * Stone-textured cards, Cinzel headings, filigree borders, territory colors.
 * Includes an "Arsenal" tab for browsing/searching saved AI tools.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Swords, Search, ChevronRight, Shield, Flame, Wrench, ExternalLink, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getCastleState, type CastleTier } from "@/lib/castle-levels";
import { motion } from "framer-motion";
import { AI_TOOL_REGISTRY, getSavedTools, removeToolFromList, type AIToolInfo } from "@/lib/ai-tool-registry";
import type { RoleResult } from "@/components/InlineRoleCarousel";

/* ── Types ── */

interface KingdomRole {
  jobId: string;
  title: string;
  company: string | null;
  augmented: number;
  risk: number;
  questsCompleted: number;
  totalQuests: number;
  xp: number;
  skillsEarned: string[];
  lastActivity: string | null;
}

interface MyRolesPanelProps {
  onSelectRole: (role: RoleResult) => void;
  onAskChat: (prompt: string) => void;
  onTabChange?: (tab: "saved" | "practiced") => void;
}

/* ── Fantasy card style ── */
const fantasyCard = {
  background: "hsl(var(--surface-stone))",
  border: "1px solid hsl(var(--filigree) / 0.2)",
  boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 2px 6px hsl(var(--emboss-shadow))",
};

/* ── Castle tier visuals ── */

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

function KingdomCard({
  kingdom,
  isScouted,
  onContinue,
  index,
}: {
  kingdom: KingdomRole;
  isScouted: boolean;
  onContinue: () => void;
  index: number;
}) {
  const navigate = useNavigate();
  const castle = getCastleState(kingdom.xp);
  const questProgress = kingdom.totalQuests > 0
    ? Math.round((kingdom.questsCompleted / kingdom.totalQuests) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="group relative rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: `linear-gradient(135deg, hsl(var(--surface-stone)), ${TIER_GLOW[castle.tier]})`,
        border: `1px solid ${TIER_BORDER[castle.tier]}`,
        boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 2px 6px hsl(var(--emboss-shadow))",
      }}
      onClick={() => navigate(`/role/${encodeURIComponent(kingdom.title)}${kingdom.company ? `?company=${encodeURIComponent(kingdom.company)}` : ""}`)}
    >
      {/* Header: Castle emoji + title */}
      <div className="flex items-start gap-2.5 mb-2">
        <span className="text-xl leading-none mt-0.5">{castle.emoji}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate leading-tight">
            {kingdom.title}
          </h4>
          {kingdom.company && (
            <p className="text-[11px] text-muted-foreground truncate">{kingdom.company}</p>
          )}
        </div>
        <span
          className="text-[9px] font-medium capitalize shrink-0 px-1.5 py-0.5 rounded-md"
          style={{
            background: "hsl(var(--muted) / 0.5)",
            color: "hsl(var(--filigree))",
            fontFamily: "'Cinzel', serif",
          }}
        >
          {castle.label}
        </span>
      </div>

      {/* Threat level */}
      <div className="flex items-center gap-1.5 mb-2">
        <Flame className="h-3 w-3" style={{ color: "hsl(var(--territory-leadership))" }} />
        <span className="text-[11px] text-muted-foreground">AI Threat</span>
        <span className="text-[11px] font-semibold text-foreground ml-auto">{kingdom.augmented}%</span>
      </div>

      {isScouted ? (
        <button
          onClick={(e) => { e.stopPropagation(); onContinue(); }}
          className="w-full mt-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: "hsl(var(--primary) / 0.1)",
            color: "hsl(var(--primary))",
            fontFamily: "'Cinzel', serif",
            letterSpacing: "0.04em",
          }}
        >
          <Shield className="h-3 w-3" />
          Scout Kingdom
          <ChevronRight className="h-3 w-3" />
        </button>
      ) : (
        <>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">
              {kingdom.questsCompleted}/{kingdom.totalQuests || "?"} quests
            </span>
            <span
              className="text-[10px] font-medium"
              style={{ color: "hsl(var(--filigree-glow))" }}
            >
              {kingdom.xp} XP
            </span>
          </div>
          <Progress value={questProgress} className="h-1.5 bg-muted/30" />

          {kingdom.skillsEarned.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {kingdom.skillsEarned.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="text-[9px] px-1.5 py-0.5 rounded-md truncate max-w-[80px]"
                  style={{
                    background: "hsl(var(--muted) / 0.4)",
                    color: "hsl(var(--muted-foreground))",
                    border: "1px solid hsl(var(--border) / 0.3)",
                  }}
                >
                  {skill}
                </span>
              ))}
              {kingdom.skillsEarned.length > 3 && (
                <span className="text-[9px] text-muted-foreground/60">+{kingdom.skillsEarned.length - 3}</span>
              )}
            </div>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); onContinue(); }}
            className="w-full mt-2 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: "hsl(var(--primary) / 0.1)",
              color: "hsl(var(--primary))",
              fontFamily: "'Cinzel', serif",
              letterSpacing: "0.04em",
            }}
          >
            <Swords className="h-3 w-3" />
            Continue Campaign
            <ChevronRight className="h-3 w-3" />
          </button>
        </>
      )}
    </motion.div>
  );
}

/* ── Main Panel ── */

export default function MyRolesPanel({ onSelectRole, onAskChat, onTabChange }: MyRolesPanelProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"saved" | "practiced" | "arsenal">("practiced");
  const [search, setSearch] = useState("");
  const [scoutedKingdoms, setScoutedKingdoms] = useState<KingdomRole[]>([]);
  const [activeKingdoms, setActiveKingdoms] = useState<KingdomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedToolNames, setSavedToolNames] = useState<string[]>(getSavedTools());
  const [arsenalFilter, setArsenalFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    Promise.all([
      supabase
        .from("bookmarked_roles")
        .select("job_title, company, augmented_percent, automation_risk_percent")
        .eq("user_id", user.id)
        .order("bookmarked_at", { ascending: false })
        .limit(20),
      supabase
        .from("completed_simulations")
        .select("job_title, company, task_name, correct_answers, total_questions, skills_earned, completed_at")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(200),
    ]).then(([savedRes, simsRes]) => {
      const scouted: KingdomRole[] = (savedRes.data || []).map((r: any) => ({
        jobId: `scouted-${r.job_title}-${r.company || ""}`,
        title: r.job_title,
        company: r.company,
        augmented: r.augmented_percent || 0,
        risk: r.automation_risk_percent || 0,
        questsCompleted: 0,
        totalQuests: 0,
        xp: 0,
        skillsEarned: [],
        lastActivity: null,
      }));
      setScoutedKingdoms(scouted);

      const roleMap = new Map<string, KingdomRole>();
      for (const sim of simsRes.data || []) {
        const s = sim as any;
        const key = `${s.job_title}||${s.company || ""}`;
        if (!roleMap.has(key)) {
          roleMap.set(key, {
            jobId: `campaign-${key}`,
            title: s.job_title,
            company: s.company,
            augmented: 0,
            risk: 0,
            questsCompleted: 0,
            totalQuests: 8,
            xp: 0,
            skillsEarned: [],
            lastActivity: s.completed_at,
          });
        }
        const kingdom = roleMap.get(key)!;
        kingdom.questsCompleted += 1;
        const accuracy = s.total_questions > 0 ? s.correct_answers / s.total_questions : 0.5;
        kingdom.xp += Math.round(100 * (0.5 + accuracy * 0.5));
        const earned = s.skills_earned as any[];
        if (Array.isArray(earned)) {
          for (const sk of earned) {
            const name = typeof sk === "string" ? sk : sk?.name || sk?.skill_name;
            if (name && !kingdom.skillsEarned.includes(name)) {
              kingdom.skillsEarned.push(name);
            }
          }
        }
      }
      setActiveKingdoms(Array.from(roleMap.values()));
      setLoading(false);
    });
  }, [user]);

  const toRoleResult = (k: KingdomRole): RoleResult => ({
    jobId: k.jobId,
    title: k.title,
    company: k.company,
    logo: null,
    location: null,
    country: null,
    workMode: null,
    seniority: null,
    augmented: k.augmented,
    risk: k.risk,
  });

  const handleContinue = (kingdom: KingdomRole) => {
    onAskChat(
      `I want to continue my campaign for ${kingdom.title}${kingdom.company ? ` at ${kingdom.company}` : ""}. What quest should I take next?`
    );
  };

  const q = search.toLowerCase();
  const kingdoms = tab === "saved" ? scoutedKingdoms : activeKingdoms;
  const filtered = tab === "arsenal" ? [] : kingdoms.filter(
    (k) => !q || k.title.toLowerCase().includes(q) || (k.company || "").toLowerCase().includes(q)
  );

  // Arsenal: all registry tools + saved state, searchable
  const CATEGORY_LABELS: Record<string, string> = {
    llm: "Language Models", coding: "Coding", productivity: "Productivity",
    design: "Design", data: "Data & Analytics", writing: "Writing", search: "Search",
  };
  const allToolsFiltered = AI_TOOL_REGISTRY.filter(t => {
    if (arsenalFilter === "saved" && !savedToolNames.includes(t.name)) return false;
    if (arsenalFilter !== "all" && arsenalFilter !== "saved" && t.category !== arsenalFilter) return false;
    if (q && !t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
    return true;
  });
  // Deduplicate by name (keep first match which is the most specific version)
  const seen = new Set<string>();
  const uniqueTools = allToolsFiltered.filter(t => {
    if (seen.has(t.name)) return false;
    seen.add(t.name);
    return true;
  });

  const handleRemoveTool = (name: string) => {
    const updated = removeToolFromList(name);
    setSavedToolNames(updated);
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      {/* Tabs — stone style */}
      <div
        className="flex items-center gap-1 rounded-lg p-0.5 mb-3 shrink-0"
        style={{ background: "hsl(var(--surface-stone))" }}
      >
        <button
          onClick={() => { setTab("practiced"); onTabChange?.("practiced"); }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all flex-1 justify-center"
          style={{
            fontFamily: "'Cinzel', serif",
            letterSpacing: "0.04em",
            ...(tab === "practiced"
              ? { background: "hsl(var(--background))", color: "hsl(var(--foreground))", boxShadow: "0 1px 3px hsl(var(--emboss-shadow))" }
              : { color: "hsl(var(--muted-foreground))" }),
          }}
        >
          <Swords className="h-3 w-3" />
          Campaigns
        </button>
        <button
          onClick={() => { setTab("saved"); onTabChange?.("saved"); }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all flex-1 justify-center"
          style={{
            fontFamily: "'Cinzel', serif",
            letterSpacing: "0.04em",
            ...(tab === "saved"
              ? { background: "hsl(var(--background))", color: "hsl(var(--foreground))", boxShadow: "0 1px 3px hsl(var(--emboss-shadow))" }
              : { color: "hsl(var(--muted-foreground))" }),
          }}
        >
          <Bookmark className="h-3 w-3" />
          Scouted
        </button>
        <button
          onClick={() => { setTab("arsenal"); setArsenalFilter("all"); }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all flex-1 justify-center"
          style={{
            fontFamily: "'Cinzel', serif",
            letterSpacing: "0.04em",
            ...(tab === "arsenal"
              ? { background: "hsl(var(--background))", color: "hsl(var(--foreground))", boxShadow: "0 1px 3px hsl(var(--emboss-shadow))" }
              : { color: "hsl(var(--muted-foreground))" }),
          }}
        >
          <Wrench className="h-3 w-3" />
          Arsenal
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3 shrink-0">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === "arsenal" ? "Search AI tools…" : "Search kingdoms…"}
          className="h-8 pl-8 text-xs border-border/40"
          style={{ background: "hsl(var(--surface-stone))" }}
        />
      </div>

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
                background: arsenalFilter === f.key
                  ? "hsl(var(--primary) / 0.15)"
                  : "hsl(var(--muted) / 0.3)",
                color: arsenalFilter === f.key
                  ? "hsl(var(--primary))"
                  : "hsl(var(--muted-foreground))",
                border: arsenalFilter === f.key
                  ? "1px solid hsl(var(--primary) / 0.3)"
                  : "1px solid transparent",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {tab === "arsenal" ? (
          /* Arsenal: AI Tool Catalogue */
          uniqueTools.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-3xl mb-3 block">🔧</span>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
                {arsenalFilter === "saved" ? "No saved tools yet" : "No tools found"}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {arsenalFilter === "saved"
                  ? "Save tools during simulations by clicking the bookmark icon."
                  : "Try a different search or filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {uniqueTools.map((tool, i) => {
                const isSaved = savedToolNames.includes(tool.name);
                return (
                  <motion.div
                    key={tool.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    className="rounded-lg p-3 group"
                    style={{
                      background: "hsl(var(--surface-stone))",
                      border: isSaved
                        ? "1px solid hsl(var(--filigree-glow) / 0.3)"
                        : "1px solid hsl(var(--filigree) / 0.12)",
                      boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 1px 4px hsl(var(--emboss-shadow))",
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-base mt-0.5">
                        {tool.category === "llm" ? "🧠" :
                         tool.category === "coding" ? "💻" :
                         tool.category === "productivity" ? "📋" :
                         tool.category === "design" ? "🎨" :
                         tool.category === "data" ? "📊" :
                         tool.category === "writing" ? "✍️" : "🔍"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-semibold text-foreground truncate">{tool.name}</h4>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-md capitalize shrink-0"
                            style={{
                              background: "hsl(var(--muted) / 0.4)",
                              color: "hsl(var(--muted-foreground))",
                            }}
                          >
                            {CATEGORY_LABELS[tool.category] || tool.category}
                          </span>
                          {isSaved && (
                            <Sparkles className="h-3 w-3 shrink-0" style={{ color: "hsl(var(--filigree-glow))" }} />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          {tool.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {tool.url && (
                            <a
                              href={tool.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[10px] font-medium transition-colors hover:opacity-80"
                              style={{ color: "hsl(var(--primary))" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-2.5 w-2.5" />
                              Visit
                            </a>
                          )}
                          {isSaved && (
                            <button
                              onClick={() => handleRemoveTool(tool.name)}
                              className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-destructive transition-colors"
                            >
                              <X className="h-2.5 w-2.5" />
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-3xl mb-3 block">
              {tab === "practiced" ? "⚔️" : "🔭"}
            </span>
            <p
              className="text-sm text-muted-foreground"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {tab === "practiced"
                ? "No active campaigns yet"
                : "No scouted kingdoms yet"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {tab === "practiced"
                ? "Complete a quest to start your first campaign."
                : "Bookmark roles from the chat to scout them."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filtered.map((kingdom, i) => (
              <KingdomCard
                key={kingdom.jobId + i}
                kingdom={kingdom}
                isScouted={tab === "saved"}
                index={i}
                onContinue={() => handleContinue(kingdom)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
