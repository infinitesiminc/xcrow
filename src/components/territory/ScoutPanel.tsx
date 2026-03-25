/**
 * ScoutPanel — Unified Act 2 panel with three sub-tabs:
 *   Matched: Jobs ranked by composite match score
 *   Browse: Search companies & roles freely
 *   My Kingdoms: Tracked role progression
 * 
 * Role clicks open an overlay panel (no sim launching from here).
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass, TrendingUp, MapPin, Building2, Search, Loader2,
  Shield, Zap, Users, ChevronDown, Star, Bookmark, Crown,
  ChevronLeft, ChevronRight, Eye, Swords,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { buildUserProfile, matchJobsForUser, type JobCandidate, type UserProfile } from "@/lib/match-engine";
import { brandfetchFromName } from "@/lib/logo";
import { type KingdomTier, KINGDOM_TIERS as KINGDOM_TIER_DEFS } from "@/lib/progression";
import type { RoleResult } from "@/components/InlineRoleCarousel";

/* ── Types ── */

type SubTab = "matched" | "browse" | "kingdoms";
type SortMode = "match" | "skills";

interface Kingdom {
  key: string;
  title: string;
  company: string | null;
  tier: KingdomTier;
  questsCompleted: number;
  totalQuests: number;
  xp: number;
  lastActivity: string | null;
}

interface BrowseCompany {
  id: string;
  name: string;
  industry: string | null;
  logo_url: string | null;
  job_count: number;
}

interface BrowseJob {
  id: string;
  title: string;
  department: string | null;
  company: string | null;
  company_id: string | null;
}

export interface KingdomContextData {
  tier?: string;
  xp?: number;
  questsCompleted?: number;
  totalQuests?: number;
}

interface Props {
  onOpenRole?: (role: RoleResult, kingdomContext?: KingdomContextData) => void;
}

/* ── Tier Meta ── */

const TIER_META: Record<KingdomTier, { icon: React.ElementType; label: string; color: string }> = {
  scouted: { icon: Eye, label: "SCOUTED", color: "hsl(var(--muted-foreground))" },
  contested: { icon: Swords, label: "CONTESTED", color: "hsl(var(--primary))" },
  fortified: { icon: Shield, label: "FORTIFIED", color: "hsl(142 71% 45%)" },
  conquered: { icon: Crown, label: "CONQUERED", color: "hsl(45 93% 47%)" },
};

export default function ScoutPanel({ onOpenRole }: Props) {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState<SubTab>("matched");

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
        <Compass className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
        <p className="text-sm text-muted-foreground">Sign in to discover roles matched to your proven skills.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab bar */}
      <div
        className="flex items-center gap-0.5 px-2 pt-2 pb-1"
        style={{ borderBottom: "1px solid hsl(var(--filigree) / 0.1)" }}
      >
        {([
          { key: "matched" as SubTab, label: "Matched", icon: TrendingUp },
          { key: "browse" as SubTab, label: "Browse", icon: Search },
          { key: "kingdoms" as SubTab, label: "My Kingdoms", icon: Crown },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all flex-1 justify-center"
            style={{
              fontFamily: "'Cinzel', serif",
              ...(subTab === t.key
                ? { color: "hsl(var(--filigree-glow))", background: "hsl(var(--filigree) / 0.12)", textShadow: "0 0 8px hsl(var(--filigree-glow) / 0.4)" }
                : { color: "hsl(var(--muted-foreground))" }),
            }}
          >
            <t.icon className="h-3 w-3" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 overflow-y-auto">
        {subTab === "matched" && <MatchedSubTab onOpenRole={onOpenRole} />}
        {subTab === "browse" && <BrowseSubTab onOpenRole={onOpenRole} />}
        {subTab === "kingdoms" && <KingdomsSubTab onOpenRole={onOpenRole} />}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   SUB-TAB 1: Matched (ranked by match score)
   ════════════════════════════════════════════ */

function MatchedSubTab({ onOpenRole }: { onOpenRole?: (role: RoleResult) => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<JobCandidate[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("match");
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadMatchedJobs = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const profile = await buildUserProfile(userId);
      const results = await matchJobsForUser(profile, 100);
      setCandidates(results);
    } catch (e) {
      console.error("Scout match error:", e);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setCandidates([]);
      setLoading(false);
      return;
    }
    void loadMatchedJobs(user.id);
  }, [user?.id, loadMatchedJobs]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user?.id) {
        void loadMatchedJobs(session.user.id);
      }
      if (event === "SIGNED_OUT") {
        setCandidates([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadMatchedJobs]);

  const filtered = useMemo(() => {
    let list = candidates;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.department && c.department.toLowerCase().includes(q))
      );
    }
    if (sort === "skills") {
      list = [...list].sort((a, b) => b.skillOverlap - a.skillOverlap);
    }
    return list;
  }, [candidates, search, sort]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-fantasy">Scanning the horizon…</p>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 px-6 text-center gap-3">
        <Compass className="h-10 w-10 text-muted-foreground opacity-40" />
        <p className="text-sm font-medium text-foreground">No matches yet</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Complete more quests in the Skill Forge to unlock job matches.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-2 pb-2 space-y-2">
        <div className="flex items-center gap-2">
          <Compass className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-fantasy font-bold text-foreground tracking-wide">
            {filtered.length} Matches
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles, companies…"
            className="pl-8 h-8 text-xs bg-background/50"
          />
        </div>
        <div className="flex gap-1.5">
          {([
            { key: "match" as SortMode, label: "Best Match", icon: TrendingUp },
            { key: "skills" as SortMode, label: "Skill Overlap", icon: Shield },
          ]).map(s => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all"
              style={{
                ...(sort === s.key
                  ? { color: "hsl(var(--filigree-glow))", background: "hsl(var(--filigree) / 0.12)" }
                  : { color: "hsl(var(--muted-foreground))" }),
              }}
            >
              <s.icon className="h-3 w-3" />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1.5">
        {filtered.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.5) }}
          >
            <MatchedJobCard
              job={job}
              isExpanded={expanded === job.id}
              onToggle={() => setExpanded(expanded === job.id ? null : job.id)}
              onOpenRole={onOpenRole}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   SUB-TAB 2: Browse (companies & free search)
   ════════════════════════════════════════════ */

function BrowseSubTab({ onOpenRole }: { onOpenRole?: (role: RoleResult) => void }) {
  const [companies, setCompanies] = useState<BrowseCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<BrowseCompany | null>(null);
  const [companyJobs, setCompanyJobs] = useState<BrowseJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: stats } = await supabase.rpc("get_company_stats");
      if (!stats) { setLoading(false); return; }
      const companyIds = (stats as any[]).filter(s => s.job_count > 0).map(s => s.company_id);
      if (!companyIds.length) { setLoading(false); return; }

      const PAGE = 500;
      const allCos: any[] = [];
      for (let i = 0; i < companyIds.length; i += PAGE) {
        const batch = companyIds.slice(i, i + PAGE);
        const { data } = await supabase.from("companies").select("id, name, industry, logo_url").in("id", batch);
        if (data) allCos.push(...data);
      }

      const statsMap = new Map((stats as any[]).map(s => [s.company_id, s.job_count]));
      const mapped: BrowseCompany[] = allCos.map(c => ({
        id: c.id,
        name: c.name,
        industry: c.industry,
        logo_url: c.logo_url,
        job_count: Number(statsMap.get(c.id) || 0),
      }));
      mapped.sort((a, b) => b.job_count - a.job_count);
      setCompanies(mapped);
      setLoading(false);
    })();
  }, []);

  const loadCompanyJobs = useCallback(async (company: BrowseCompany) => {
    setSelectedCompany(company);
    setJobsLoading(true);
    const { data } = await supabase
      .from("jobs")
      .select("id, title, department")
      .eq("company_id", company.id)
      .limit(50);
    setCompanyJobs((data || []).map(j => ({
      id: j.id,
      title: j.title,
      department: j.department,
      company: company.name,
      company_id: company.id,
    })));
    setJobsLoading(false);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.toLowerCase();
    return companies.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.industry && c.industry.toLowerCase().includes(q))
    );
  }, [companies, search]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-fantasy">Loading realms…</p>
      </div>
    );
  }

  // Company detail view
  if (selectedCompany) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 pt-2 pb-2 space-y-2">
          <button
            onClick={() => setSelectedCompany(null)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            All Companies
          </button>
          <div className="flex items-center gap-2">
            {selectedCompany.logo_url ? (
              <img src={selectedCompany.logo_url} alt="" className="w-8 h-8 rounded object-contain" />
            ) : (() => {
              const url = brandfetchFromName(selectedCompany.name);
              return url ? <img src={url} alt="" className="w-8 h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> :
                <Building2 className="h-5 w-5 text-muted-foreground" />;
            })()}
            <div>
              <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>{selectedCompany.name}</h3>
              {selectedCompany.industry && <p className="text-[10px] text-muted-foreground">{selectedCompany.industry}</p>}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {jobsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : companyJobs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No roles found</p>
          ) : companyJobs.map(job => (
            <button
              key={job.id}
              className="w-full text-left px-3 py-2.5 rounded-lg transition-all hover:brightness-110"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--filigree) / 0.08)",
              }}
              onClick={() => onOpenRole?.({
                title: job.title,
                company: job.company || null,
                jobId: job.id,
                logo: null, location: null, country: null, workMode: null, seniority: null, augmented: 0, risk: 0,
              })}
            >
              <p className="text-xs font-semibold text-foreground truncate">{job.title}</p>
              {job.department && <p className="text-[10px] text-muted-foreground mt-0.5">{job.department}</p>}
              <div className="flex items-center gap-1 mt-1 text-[10px] text-primary">
                <Eye className="h-2.5 w-2.5" />
                View Role
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-2 pb-2 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies…"
            className="pl-8 h-8 text-xs bg-background/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
        {filtered.map(company => (
          <button
            key={company.id}
            onClick={() => loadCompanyJobs(company)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:brightness-110"
            style={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--filigree) / 0.08)",
            }}
          >
            <div className="shrink-0 w-8 h-8 rounded flex items-center justify-center overflow-hidden">
              {company.logo_url ? (
                <img src={company.logo_url} alt="" className="w-full h-full object-contain" />
              ) : (() => {
                const url = brandfetchFromName(company.name);
                return url ? <img src={url} alt="" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> :
                  <Building2 className="h-4 w-4 text-muted-foreground" />;
              })()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-foreground truncate">{company.name}</p>
              {company.industry && <p className="text-[10px] text-muted-foreground truncate">{company.industry}</p>}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
              <span>{company.job_count}</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   SUB-TAB 3: My Kingdoms (tracked progression)
   ════════════════════════════════════════════ */

function KingdomsSubTab({ onOpenRole }: { onOpenRole?: (role: RoleResult, kingdomContext?: KingdomContextData) => void }) {
  const { user } = useAuth();
  const [kingdoms, setKingdoms] = useState<Kingdom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const [simsRes, bookmarksRes, analysisRes] = await Promise.all([
        supabase
          .from("completed_simulations")
          .select("job_title, company, task_name, correct_answers, total_questions, skills_earned, completed_at")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false }),
        supabase
          .from("bookmarked_roles")
          .select("job_title, company, bookmarked_at")
          .eq("user_id", user.id),
        supabase
          .from("analysis_history")
          .select("job_title, company, analyzed_at")
          .eq("user_id", user.id),
      ]);

      const roleMap = new Map<string, Kingdom>();

      for (const s of simsRes.data || []) {
        const key = `${s.job_title}||${s.company || ""}`.toLowerCase();
        if (!roleMap.has(key)) {
          roleMap.set(key, {
            key,
            title: s.job_title,
            company: s.company,
            tier: "scouted",
            questsCompleted: 0,
            totalQuests: 8,
            xp: 0,
            lastActivity: s.completed_at,
          });
        }
        const k = roleMap.get(key)!;
        k.questsCompleted += 1;
        const acc = s.total_questions > 0 ? s.correct_answers / s.total_questions : 0.5;
        k.xp += Math.round(100 * (0.5 + acc * 0.5));
        if (!k.lastActivity || s.completed_at > k.lastActivity) k.lastActivity = s.completed_at;
      }

      // Add bookmarked roles as scouted
      for (const b of bookmarksRes.data || []) {
        const key = `${b.job_title}||${b.company || ""}`.toLowerCase();
        if (!roleMap.has(key)) {
          roleMap.set(key, {
            key, title: b.job_title, company: b.company,
            tier: "scouted", questsCompleted: 0, totalQuests: 0, xp: 0,
            lastActivity: b.bookmarked_at,
          });
        }
      }

      // Add analysis history as scouted
      for (const a of analysisRes.data || []) {
        const key = `${a.job_title}||${a.company || ""}`.toLowerCase();
        if (!roleMap.has(key)) {
          roleMap.set(key, {
            key, title: a.job_title, company: a.company,
            tier: "scouted", questsCompleted: 0, totalQuests: 0, xp: 0,
            lastActivity: a.analyzed_at,
          });
        }
      }

      // Compute tiers
      for (const k of roleMap.values()) {
        if (k.questsCompleted >= 8) k.tier = "conquered";
        else if (k.questsCompleted >= 5) k.tier = "fortified";
        else if (k.questsCompleted >= 1) k.tier = "contested";
        else k.tier = "scouted";
      }

      const sorted = [...roleMap.values()].sort((a, b) => {
        const tierOrder: Record<KingdomTier, number> = { conquered: 4, fortified: 3, contested: 2, scouted: 1 };
        if (tierOrder[b.tier] !== tierOrder[a.tier]) return tierOrder[b.tier] - tierOrder[a.tier];
        return b.xp - a.xp;
      });

      setKingdoms(sorted);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-fantasy">Loading kingdoms…</p>
      </div>
    );
  }

  if (kingdoms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 px-6 text-center gap-3">
        <Crown className="h-10 w-10 text-muted-foreground opacity-40" />
        <p className="text-sm font-medium text-foreground">No kingdoms yet</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Explore roles in Matched or Browse tabs, then practice quests to build your kingdoms.
        </p>
      </div>
    );
  }

  return (
    <div className="px-2 pt-2 pb-4 space-y-1.5">
      <div className="px-1 pb-1">
        <span className="text-[11px] font-fantasy font-bold text-foreground tracking-wide">
          {kingdoms.length} Kingdoms
        </span>
      </div>
      {kingdoms.map((k, i) => {
        const tierMeta = TIER_META[k.tier];
        const TierIcon = tierMeta.icon;
        const questProgress = k.totalQuests > 0 ? Math.round((k.questsCompleted / k.totalQuests) * 100) : 0;

        return (
          <motion.button
            key={k.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.5) }}
            className="w-full text-left px-3 py-2.5 rounded-xl transition-all hover:brightness-110"
            style={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--filigree) / 0.1)",
              boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))",
            }}
            onClick={() => onOpenRole?.({
              title: k.title,
              company: k.company || null,
              jobId: k.key,
              logo: null, location: null, country: null, workMode: null, seniority: null, augmented: 0, risk: 0,
            }, {
              tier: k.tier,
              xp: k.xp,
              questsCompleted: k.questsCompleted,
              totalQuests: k.totalQuests,
            })}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-foreground truncate">{k.title}</h4>
                  <span className="flex items-center gap-0.5 text-[9px] font-bold shrink-0" style={{ color: tierMeta.color }}>
                    <TierIcon className="h-2.5 w-2.5" />
                    {tierMeta.label}
                  </span>
                </div>
                {k.company && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{k.company}</p>}
                <div className="flex items-center gap-3 mt-1">
                  {k.tier !== "scouted" && (
                    <>
                      <span className="text-[9px] text-muted-foreground">{k.questsCompleted}/{k.totalQuests} quests</span>
                      <span className="text-[9px] font-medium" style={{ color: "hsl(var(--filigree-glow))" }}>{k.xp} XP</span>
                    </>
                  )}
                  {k.lastActivity && (
                    <span className="text-[9px] text-muted-foreground">
                      {formatDistanceToNow(new Date(k.lastActivity), { addSuffix: true })}
                    </span>
                  )}
                </div>
                {k.tier !== "scouted" && k.totalQuests > 0 && (
                  <Progress value={questProgress} className="h-1 bg-muted/30 mt-1.5" />
                )}
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════
   Matched Job Card
   ════════════════════════════════════════════ */

function MatchedJobCard({
  job,
  isExpanded,
  onToggle,
  onOpenRole,
}: {
  job: JobCandidate;
  isExpanded: boolean;
  onToggle: () => void;
  onOpenRole?: (role: RoleResult) => void;
}) {
  const scoreTier = job.matchScore >= 60 ? "high" : job.matchScore >= 30 ? "mid" : "low";
  const tierColor = scoreTier === "high"
    ? "hsl(142 71% 45%)"
    : scoreTier === "mid"
      ? "hsl(var(--primary))"
      : "hsl(38 92% 50%)";

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer transition-all"
      style={{
        background: "hsl(var(--card))",
        border: `1px solid hsl(var(--filigree) / ${isExpanded ? "0.25" : "0.1"})`,
        boxShadow: isExpanded
          ? "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 16px hsl(var(--emboss-shadow))"
          : "inset 0 1px 0 hsl(var(--emboss-light))",
      }}
      onClick={onToggle}
    >
      <div className="px-3 py-2.5 flex items-start gap-3">
        {/* Match score ring */}
        <div className="shrink-0 relative w-11 h-11 flex items-center justify-center">
          <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" fill="none" stroke="hsl(var(--muted) / 0.3)" strokeWidth="3" />
            <circle
              cx="22" cy="22" r="18" fill="none"
              stroke={tierColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${job.matchScore * 1.13} 113`}
              transform="rotate(-90 22 22)"
              style={{ filter: `drop-shadow(0 0 4px ${tierColor})` }}
            />
          </svg>
          <span className="absolute text-[10px] font-bold text-foreground">{job.matchScore}%</span>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate leading-tight">{job.title}</h4>
          {job.company && (
            <div className="flex items-center gap-1 mt-0.5">
              <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-[11px] text-muted-foreground truncate">{job.company}</span>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1">
            {job.department && (
              <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{job.department}</span>
            )}
            {job.location && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5" />
                {job.location.split(",")[0]}
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-3 pb-3 pt-1 space-y-2.5"
              style={{ borderTop: "1px solid hsl(var(--filigree) / 0.1)" }}
            >
              <div className="grid grid-cols-3 gap-2">
                <ScoreBar label="Skills" value={job.skillOverlap} icon={Shield} />
                <ScoreBar label="Tasks" value={job.taskFamiliarity} icon={Zap} />
                <ScoreBar label="Dept." value={job.departmentAffinity} icon={Users} />
              </div>

              {job.matchedSkills.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1 font-medium">Proven Skills Match</p>
                  <div className="flex flex-wrap gap-1">
                    {job.matchedSkills.slice(0, 6).map(sk => (
                      <span
                        key={sk}
                        className="text-[9px] px-1.5 py-0.5 rounded-md font-medium"
                        style={{
                          background: "hsl(var(--primary) / 0.1)",
                          color: "hsl(var(--primary))",
                          border: "1px solid hsl(var(--primary) / 0.2)",
                        }}
                      >
                        {sk.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()).slice(0, 30)}
                      </span>
                    ))}
                    {job.matchedSkills.length > 6 && (
                      <span className="text-[9px] text-muted-foreground">+{job.matchedSkills.length - 6}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[11px] h-7 flex-1 font-fantasy"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenRole?.({
                      title: job.title,
                      company: job.company || null,
                      jobId: job.id,
                      logo: null, location: null, country: null, workMode: null, seniority: null, augmented: 0, risk: 0,
                    });
                  }}
                >
                  <Star className="h-3 w-3 mr-1" />
                  View Kingdom
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[11px] h-7 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Bookmark/save to campaign
                  }}
                >
                  <Bookmark className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Score Bar ── */

function ScoreBar({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1">
        <Icon className="h-2.5 w-2.5 text-muted-foreground" />
        <span className="text-[9px] text-muted-foreground">{label}</span>
        <span className="text-[9px] font-bold text-foreground ml-auto">{value}%</span>
      </div>
      <div className="h-1 rounded-full bg-muted/30 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${value}%`,
            background: value > 60
              ? "hsl(142 71% 45%)"
              : value > 30
                ? "hsl(var(--primary))"
                : "hsl(38 92% 50%)",
          }}
        />
      </div>
    </div>
  );
}
