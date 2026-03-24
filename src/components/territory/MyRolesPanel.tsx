/**
 * MyRolesPanel — Unified "Realms" view.
 * Three sub-tabs: Realms (companies → kingdoms), Kingdoms (flat), Arsenal.
 * Realms: Browse companies, drill into one to see your kingdoms + discoverable roles.
 */
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ChevronRight, Shield, Flame, Wrench, ExternalLink, X,
  Sparkles, Eye, Swords, Crown, Users, Castle, Building2,
  ChevronLeft, Bot, Play, Loader2, Briefcase,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getCastleState, type CastleTier } from "@/lib/castle-levels";
import { type KingdomTier, KINGDOM_TIERS as KINGDOM_TIER_DEFS } from "@/lib/progression";
import { motion, AnimatePresence } from "framer-motion";
import {
  AI_TOOL_REGISTRY, getSavedTools, removeToolFromList,
  groupToolsByCompany, type AIToolInfo,
} from "@/lib/ai-tool-registry";
import type { RoleResult } from "@/components/InlineRoleCarousel";
import { brandfetchFromName } from "@/lib/logo";
import type { SimLaunchRequest } from "@/components/territory/SkillLaunchCard";

/* ── Types ── */

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

interface RealmCompany {
  id: string;
  name: string;
  industry: string | null;
  logo_url: string | null;
  job_count: number;
  /** User's kingdoms that belong to this company */
  kingdoms: Kingdom[];
}

interface CompanyJob {
  id: string;
  title: string;
  department: string | null;
  augmented_percent: number | null;
  topTask: string | null;
}

interface JobSkillLink {
  skill_name: string;
  canonical_skill_id: string | null;
  category: string;
  icon_emoji: string | null;
}

interface MyRolesPanelProps {
  onSelectRole: (role: RoleResult) => void;
  onAskChat: (prompt: string) => void;
  onTabChange?: (tab: "saved" | "practiced") => void;
  onLaunchSim?: (req: SimLaunchRequest) => void;
}

/* ── Tier config ── */

const TIER_META: Record<KingdomTier, { icon: typeof Eye; label: string; emoji: string; color: string }> = {
  scouted:   { icon: Eye,    label: "Scouted",   emoji: "👁️", color: "hsl(var(--muted-foreground))" },
  contested: { icon: Swords, label: "Contested",  emoji: "⚔️", color: "hsl(var(--territory-communication))" },
  fortified: { icon: Castle, label: "Fortified",  emoji: "🏰", color: "hsl(var(--territory-analytical))" },
  conquered: { icon: Crown,  label: "Conquered",  emoji: "👑", color: "hsl(var(--filigree-glow))" },
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
  const roleUrl = `/role/${encodeURIComponent(kingdom.title)}${kingdom.company ? `?company=${encodeURIComponent(kingdom.company)}` : ""}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: `linear-gradient(135deg, hsl(var(--surface-stone)), ${TIER_GLOW[castle.tier]})`,
        border: `1px solid ${TIER_BORDER[castle.tier]}`,
        boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 1px 4px hsl(var(--emboss-shadow))",
      }}
      onClick={() => navigate(roleUrl)}
    >
      {/* Castle emoji */}
      <span className="text-base leading-none shrink-0">{castle.emoji}</span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="text-[11px] font-semibold text-foreground truncate leading-tight">{kingdom.title}</h4>
          <span
            className="shrink-0 inline-flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-[0.06em] px-1 py-px rounded"
            style={{ background: `${tierMeta.color}15`, color: tierMeta.color, fontFamily: "'Cinzel', serif" }}
          >
            {tierMeta.emoji} {tierMeta.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {kingdom.company && <span className="text-[9px] text-muted-foreground truncate">{kingdom.company}</span>}
          {kingdom.tier !== "scouted" && (
            <>
              <span className="text-[9px] text-muted-foreground">{kingdom.questsCompleted}/8 quests</span>
              <span className="text-[9px] font-medium" style={{ color: "hsl(var(--filigree-glow))" }}>{kingdom.xp} XP</span>
            </>
          )}
          {kingdom.lastActivity && (
            <span className="text-[9px] text-muted-foreground/60 shrink-0 ml-auto">
              {formatDistanceToNow(new Date(kingdom.lastActivity), { addSuffix: true })}
            </span>
          )}
        </div>
        {kingdom.tier !== "scouted" && (
          <Progress value={questProgress} className="h-1 bg-muted/30 mt-1" />
        )}
      </div>

      {/* CTA arrow */}
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary shrink-0 transition-colors" />
    </motion.div>
  );
}

/* ── Main Panel ── */

export default function MyRolesPanel({ onSelectRole, onAskChat, onTabChange, onLaunchSim }: MyRolesPanelProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"realms" | "kingdoms" | "arsenal">("realms");
  const [tierFilter, setTierFilter] = useState<"all" | KingdomTier>("all");
  const [search, setSearch] = useState("");
  const [kingdoms, setKingdoms] = useState<Kingdom[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedToolNames, setSavedToolNames] = useState<string[]>(getSavedTools());
  const [arsenalFilter, setArsenalFilter] = useState("all");

  // Realms state
  const [realmCompanies, setRealmCompanies] = useState<RealmCompany[]>([]);
  const [realmsLoading, setRealmsLoading] = useState(true);
  const [selectedRealm, setSelectedRealm] = useState<RealmCompany | null>(null);
  const [realmJobs, setRealmJobs] = useState<CompanyJob[]>([]);
  const [realmJobsLoading, setRealmJobsLoading] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [jobSkills, setJobSkills] = useState<Record<string, JobSkillLink[]>>({});
  const [jobSkillsStatus, setJobSkillsStatus] = useState<Record<string, "loading" | "loaded" | "empty" | "error">>({});

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
      supabase.rpc("get_kingdom_populations" as any),
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

      // Derive kingdom tier from skill XP using unified progression
      // For each kingdom, compute how many skills are at each castle tier
      for (const k of roleMap.values()) {
        if (k.tier === "scouted") continue; // scouted stays scouted until overridden
        // Use XP per skill earned — approximate castle tier from accumulated XP
        // Each skill's XP threshold: Outpost=150, Fortress=500, Citadel=1200
        const skillXPs = new Map<string, number>();
        for (const s of (simsRes.data || []) as any[]) {
          if (getKey(s.job_title, s.company) !== k.key) continue;
          const earned = s.skills_earned as any[];
          if (Array.isArray(earned)) {
            for (const sk of earned) {
              const id = typeof sk === "string" ? sk : (sk?.skillId || sk?.skill_id || sk?.name);
              const xp = typeof sk === "object" ? (sk?.xp || 40) : 40;
              if (id) skillXPs.set(id, (skillXPs.get(id) || 0) + xp);
            }
          }
        }

        const castleTiers: CastleTier[] = Array.from(skillXPs.values()).map(xp => getCastleState(xp).tier);
        const atOutpost = castleTiers.filter(t => t !== "ruins").length;
        const atFortress = castleTiers.filter(t => t === "fortress" || t === "citadel" || t === "grandmaster").length;
        const atCitadel = castleTiers.filter(t => t === "citadel" || t === "grandmaster").length;

        if (atCitadel >= castleTiers.length && castleTiers.length > 0) {
          k.tier = "conquered";
        } else if (atFortress >= 3) {
          k.tier = "fortified";
        } else if (atOutpost >= 1) {
          k.tier = "contested";
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

      // Sort by most recent activity
      const sorted = Array.from(roleMap.values()).sort((a, b) => {
        return (b.lastActivity || "").localeCompare(a.lastActivity || "");
      });

      setKingdoms(sorted);
      setLoading(false);
    });
  }, [user]);

  /* ── Fetch realm companies (companies with roles) ── */
  useEffect(() => {
    (async () => {
      setRealmsLoading(true);
      const { data: stats } = await supabase.rpc("get_company_stats");
      if (!stats) { setRealmsLoading(false); return; }
      const withJobs = (stats as any[]).filter(s => s.job_count > 0);
      if (!withJobs.length) { setRealmsLoading(false); setRealmCompanies([]); return; }
      const { data: cos } = await supabase
        .from("companies")
        .select("id, name, industry, logo_url")
        .in("id", withJobs.map(s => s.company_id))
        .order("name");
      if (!cos) { setRealmsLoading(false); return; }
      const statsMap = new Map(withJobs.map(s => [s.company_id, s]));
      setRealmCompanies(cos.map((c: any) => ({
        ...c,
        job_count: statsMap.get(c.id)?.job_count || 0,
        kingdoms: [], // will be enriched below
      })));
      setRealmsLoading(false);
    })();
  }, []);

  /* Enrich realm companies with user's kingdoms */
  const enrichedRealms = useMemo(() => {
    if (!realmCompanies.length) return realmCompanies;
    return realmCompanies.map(rc => ({
      ...rc,
      kingdoms: kingdoms.filter(k => k.company?.toLowerCase() === rc.name.toLowerCase()),
    })).sort((a, b) => {
      // Companies with user kingdoms first, then by job count
      if (a.kingdoms.length !== b.kingdoms.length) return b.kingdoms.length - a.kingdoms.length;
      return b.job_count - a.job_count;
    });
  }, [realmCompanies, kingdoms]);

  /* Load jobs when realm selected */
  useEffect(() => {
    if (!selectedRealm) return;
    setRealmJobsLoading(true);
    setRealmJobs([]);
    (async () => {
      const { data: taskJobs } = await supabase
        .from("job_task_clusters")
        .select("job_id, cluster_name, jobs!inner(id, title, department, augmented_percent)")
        .eq("jobs.company_id", selectedRealm.id)
        .order("sort_order", { ascending: true })
        .limit(50);
      if (!taskJobs?.length) { setRealmJobsLoading(false); return; }
      const jobMap = new Map<string, CompanyJob>();
      for (const row of taskJobs) {
        const j = (row as any).jobs;
        if (!j || jobMap.has(j.id)) continue;
        if (jobMap.size >= 15) break;
        jobMap.set(j.id, { id: j.id, title: j.title, department: j.department, augmented_percent: j.augmented_percent, topTask: row.cluster_name });
      }
      setRealmJobs(Array.from(jobMap.values()));
      setRealmJobsLoading(false);
    })();
  }, [selectedRealm]);

  /* ── Fetch skills for expanded job ── */
  useEffect(() => {
    if (!expandedJobId) return;

    const currentStatus = jobSkillsStatus[expandedJobId];
    if (currentStatus === "loading" || currentStatus === "loaded" || currentStatus === "empty" || currentStatus === "error") {
      return;
    }

    setJobSkillsStatus(prev => ({ ...prev, [expandedJobId]: "loading" }));

    (async () => {
      const { data, error } = await supabase
        .from("job_future_skills")
        .select("skill_name, canonical_skill_id, category, icon_emoji")
        .eq("job_id", expandedJobId)
        .limit(20);

      if (error) {
        console.error("Failed to fetch job skills:", error);
        setJobSkills(prev => ({ ...prev, [expandedJobId]: [] }));
        setJobSkillsStatus(prev => ({ ...prev, [expandedJobId]: "error" }));
        return;
      }

      const seen = new Set<string>();
      const unique = ((data || []) as JobSkillLink[]).filter((s) => {
        const key = s.skill_name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (unique.length > 0) {
        setJobSkills(prev => ({ ...prev, [expandedJobId]: unique }));
        setJobSkillsStatus(prev => ({ ...prev, [expandedJobId]: "loaded" }));
        return;
      }

      // Fallback: derive skill labels from task-cluster skill_names when canonical mapping is missing
      const { data: clusterRows } = await supabase
        .from("job_task_clusters")
        .select("skill_names")
        .eq("job_id", expandedJobId)
        .limit(50);

      const fallbackSet = new Set<string>();
      for (const row of (clusterRows || []) as Array<{ skill_names: string[] | null }>) {
        for (const skill of row.skill_names || []) {
          const trimmed = (skill || "").trim();
          if (trimmed) fallbackSet.add(trimmed);
        }
      }

      const fallbackSkills: JobSkillLink[] = Array.from(fallbackSet).map((skill_name) => ({
        skill_name,
        canonical_skill_id: null,
        category: "Task Cluster",
        icon_emoji: "⚡",
      }));

      if (fallbackSkills.length > 0) {
        setJobSkills(prev => ({ ...prev, [expandedJobId]: fallbackSkills }));
        setJobSkillsStatus(prev => ({ ...prev, [expandedJobId]: "loaded" }));
      } else {
        setJobSkills(prev => ({ ...prev, [expandedJobId]: [] }));
        setJobSkillsStatus(prev => ({ ...prev, [expandedJobId]: "empty" }));
      }
    })();
  }, [expandedJobId, jobSkillsStatus]);


  const q = search.toLowerCase();
  const filteredKingdoms = useMemo(() => {
    return kingdoms.filter(k => {
      if (tierFilter !== "all" && k.tier !== tierFilter) return false;
      if (q && !k.title.toLowerCase().includes(q) && !(k.company || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [kingdoms, tierFilter, q]);

  const tierCounts = useMemo(() => {
    const c = { scouted: 0, contested: 0, fortified: 0, conquered: 0 };
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
        {([
          { key: "realms" as const, icon: Building2, label: "Realms" },
          { key: "kingdoms" as const, icon: Crown, label: "Kingdoms" },
          { key: "arsenal" as const, icon: Wrench, label: "Arsenal" },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); if (t.key === "arsenal") setArsenalFilter("all"); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all flex-1 justify-center"
            style={{
              fontFamily: "'Cinzel', serif", letterSpacing: "0.04em",
              ...(tab === t.key
                ? { background: "hsl(var(--background))", color: "hsl(var(--foreground))", boxShadow: "0 1px 3px hsl(var(--emboss-shadow))" }
                : { color: "hsl(var(--muted-foreground))" }),
            }}
          >
            <t.icon className="h-3 w-3" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Kingdom tier filter pills */}
      {tab === "kingdoms" && (
        <div className="flex gap-1 mb-3 shrink-0">
          {([
            { key: "all" as const, label: "All", count: kingdoms.length },
            { key: "conquered" as const, label: "👑 Conquered", count: tierCounts.conquered },
            { key: "fortified" as const, label: "🏰 Fortified", count: tierCounts.fortified },
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
        {tab !== "realms" && (
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === "arsenal" ? "Search AI tools…" : "Search kingdoms…"}
            className="h-8 pl-8 text-xs border-border/40"
            style={{ background: "hsl(var(--surface-stone))" }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {tab === "realms" ? (
          /* ═══ REALMS TAB ═══ */
          selectedRealm ? (
            /* Realm detail: company's roles + user's kingdoms */
            <div className="space-y-3 p-1">
              <button
                onClick={() => setSelectedRealm(null)}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                <ChevronLeft className="h-3 w-3" /> All Realms
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-muted border border-border/40">
                  {selectedRealm.logo_url ? (
                    <img src={selectedRealm.logo_url} alt="" className="w-8 h-8 object-contain" />
                  ) : (() => {
                    const url = brandfetchFromName(selectedRealm.name);
                    return url ? <img src={url} alt="" className="w-8 h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> :
                      <Building2 className="h-4 w-4 text-muted-foreground" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>{selectedRealm.name}</h3>
                  {selectedRealm.industry && <p className="text-[9px] text-muted-foreground">{selectedRealm.industry}</p>}
                </div>
              </div>

              {/* User's kingdoms in this realm */}
              {selectedRealm.kingdoms.length > 0 && (
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Your Kingdoms</p>
                  <div className="flex flex-col gap-1.5">
                    {selectedRealm.kingdoms.map((k, i) => (
                      <KingdomCard key={k.key} kingdom={k} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Discoverable roles */}
              <div>
                <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                  {selectedRealm.kingdoms.length > 0 ? "Discover More Roles" : "Roles to Conquer"}
                </p>
                {realmJobsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : realmJobs.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-4">No analyzed roles yet.</p>
                ) : (
                  <div className="space-y-1">
                    {realmJobs.map((job, i) => {
                      const isKingdom = selectedRealm.kingdoms.some(k => k.title.toLowerCase() === job.title.toLowerCase());
                      const isExpanded = expandedJobId === job.id;
                      const skills = jobSkills[job.id] || [];
                      const skillsStatus = jobSkillsStatus[job.id] || "loading";
                      return (
                        <motion.div
                          key={job.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.025, duration: 0.2 }}
                          className="rounded-lg overflow-hidden"
                          style={{
                            background: isKingdom ? "hsl(var(--filigree) / 0.06)" : "hsl(var(--surface-stone) / 0.5)",
                            border: isExpanded ? "1px solid hsl(var(--primary) / 0.25)" : isKingdom ? "1px solid hsl(var(--filigree) / 0.15)" : "1px solid hsl(var(--filigree) / 0.06)",
                          }}
                        >
                          <button
                            className="w-full text-left px-2.5 py-2 transition-all group hover:brightness-110"
                            onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-[11px] font-bold text-foreground truncate group-hover:text-primary transition-colors" style={{ fontFamily: "'Cinzel', serif" }}>
                                    {job.title}
                                  </p>
                                  {isKingdom && <Crown className="h-2.5 w-2.5 shrink-0" style={{ color: "hsl(var(--filigree-glow))" }} />}
                                </div>
                                {job.department && <p className="text-[9px] text-muted-foreground truncate">{job.department}</p>}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {job.augmented_percent != null && (
                                  <div className="flex items-center gap-0.5">
                                    <Bot className="h-2.5 w-2.5 text-brand-ai" />
                                    <span className="text-[8px] font-mono text-brand-ai">{job.augmented_percent}%</span>
                                  </div>
                                )}
                                <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                              </div>
                            </div>
                            {job.topTask && <p className="text-[8px] text-muted-foreground mt-0.5 truncate">⚔️ {job.topTask}</p>}
                          </button>

                          {/* Expanded: linked skills with launch */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-2.5 pb-2 pt-1 border-t border-border/20">
                                  {skillsStatus === "loading" ? (
                                    <div className="flex items-center justify-center py-2">
                                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground mr-1.5" />
                                      <span className="text-[9px] text-muted-foreground">Loading skills…</span>
                                    </div>
                                  ) : skillsStatus === "empty" || skillsStatus === "error" ? (
                                    <p className="text-[9px] text-muted-foreground text-center py-2">
                                      No mapped skills yet for this role.
                                    </p>
                                  ) : (
                                    <div className="space-y-1">
                                      <p className="text-[8px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                                        Linked Skills · {skills.length}
                                      </p>
                                      {skills.slice(0, 8).map((sk) => (
                                        <button
                                          key={sk.skill_name}
                                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all hover:brightness-110 group/sk"
                                          style={{
                                            background: "hsl(var(--surface-stone) / 0.6)",
                                            border: "1px solid hsl(var(--border) / 0.2)",
                                          }}
                                          onClick={() => {
                                            if (job.topTask && onLaunchSim) {
                                              onLaunchSim({ jobTitle: job.title, taskName: job.topTask, company: selectedRealm.name, level: 1 });
                                            }
                                          }}
                                        >
                                          <span className="text-xs leading-none shrink-0">{sk.icon_emoji || "⚡"}</span>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-semibold text-foreground truncate">{sk.skill_name}</p>
                                            <p className="text-[8px] text-muted-foreground truncate">{sk.category}</p>
                                          </div>
                                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/sk:opacity-100 transition-opacity">
                                            <Play className="h-2.5 w-2.5 text-primary" />
                                            <span className="text-[8px] font-bold text-primary" style={{ fontFamily: "'Cinzel', serif" }}>Quest</span>
                                          </div>
                                        </button>
                                      ))}
                                      {skills.length > 8 && (
                                        <p className="text-[8px] text-muted-foreground text-center pt-0.5">+{skills.length - 8} more</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Realm company list */
            <div className="space-y-1 p-1">
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search realms..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-transparent border-border/40"
                  style={{ background: "hsl(var(--surface-stone))" }}
                />
              </div>
              {realmsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (() => {
                const rq = search.toLowerCase();
                const filteredRealms = enrichedRealms.filter(r => !rq || r.name.toLowerCase().includes(rq));
                return filteredRealms.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-3xl mb-3 block">🏰</span>
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
                      {search ? "No realms match" : "No realms discovered"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredRealms.map((rc, i) => {
                      const logoUrl = rc.logo_url || brandfetchFromName(rc.name);
                      const hasProgress = rc.kingdoms.length > 0;
                      const bestTier = rc.kingdoms.reduce<KingdomTier | null>((best, k) => {
                        const order: KingdomTier[] = ["scouted", "contested", "fortified", "conquered"];
                        if (!best) return k.tier;
                        return order.indexOf(k.tier) > order.indexOf(best) ? k.tier : best;
                      }, null);
                      return (
                        <motion.button
                          key={rc.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.02, 0.3), duration: 0.2 }}
                          onClick={() => setSelectedRealm(rc)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all hover:brightness-110 group"
                          style={{
                            background: hasProgress ? "hsl(var(--filigree) / 0.06)" : "hsl(var(--surface-stone) / 0.4)",
                            border: hasProgress ? "1px solid hsl(var(--filigree) / 0.12)" : "1px solid hsl(var(--filigree) / 0.06)",
                          }}
                        >
                          <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center bg-muted/50 shrink-0">
                            {logoUrl ? (
                              <img src={logoUrl} alt="" className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[11px] font-bold text-foreground truncate group-hover:text-primary transition-colors" style={{ fontFamily: "'Cinzel', serif" }}>
                                {rc.name}
                              </p>
                              {bestTier && (
                                <span className="text-[8px] shrink-0">{TIER_META[bestTier].emoji}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {rc.industry && <p className="text-[9px] text-muted-foreground truncate">{rc.industry}</p>}
                              {hasProgress && (
                                <span className="text-[8px] font-medium shrink-0" style={{ color: "hsl(var(--filigree-glow))" }}>
                                  {rc.kingdoms.length} kingdom{rc.kingdoms.length !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Briefcase className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[9px] font-mono text-muted-foreground">{rc.job_count}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )
        ) : tab === "arsenal" ? (
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
          <div className="flex flex-col gap-2">
            {filteredKingdoms.map((k, i) => (
              <KingdomCard key={k.key} kingdom={k} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
