/**
 * MyRolesPanel — RPG Kingdoms view showing role campaigns with castle progression.
 * "Scouted" = bookmarked roles, "Active Campaigns" = practiced roles with quest progress.
 */
import { useState, useEffect } from "react";
import { Bookmark, Swords, Search, ChevronRight, Shield, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getCastleState, type CastleTier } from "@/lib/castle-levels";
import { motion } from "framer-motion";
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

/* ── Castle tier visuals ── */

const TIER_COLORS: Record<CastleTier, { bg: string; border: string; glow: string }> = {
  ruins:       { bg: "from-muted/30 to-muted/10", border: "border-border/30", glow: "" },
  outpost:     { bg: "from-emerald-500/10 to-emerald-900/5", border: "border-emerald-500/20", glow: "shadow-emerald-500/5" },
  fortress:    { bg: "from-blue-500/10 to-indigo-900/5", border: "border-blue-500/25", glow: "shadow-blue-500/10" },
  citadel:     { bg: "from-amber-500/15 to-orange-900/5", border: "border-amber-500/30", glow: "shadow-amber-500/10" },
  grandmaster: { bg: "from-purple-500/15 to-violet-900/5", border: "border-purple-500/30", glow: "shadow-purple-500/15" },
};

function KingdomCard({
  kingdom,
  isScouted,
  onSelect,
  onContinue,
  index,
}: {
  kingdom: KingdomRole;
  isScouted: boolean;
  onSelect: () => void;
  onContinue: () => void;
  index: number;
}) {
  const castle = getCastleState(kingdom.xp);
  const colors = TIER_COLORS[castle.tier];
  const questProgress = kingdom.totalQuests > 0
    ? Math.round((kingdom.questsCompleted / kingdom.totalQuests) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className={`group relative rounded-xl border bg-gradient-to-br p-3 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${colors.bg} ${colors.border} ${colors.glow} shadow-sm`}
      onClick={onSelect}
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
        <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md shrink-0">
          {castle.label}
        </span>
      </div>

      {/* Threat level */}
      <div className="flex items-center gap-1.5 mb-2">
        <Flame className="h-3 w-3 text-orange-400" />
        <span className="text-[11px] text-muted-foreground">AI Threat</span>
        <span className="text-[11px] font-semibold text-foreground ml-auto">{kingdom.augmented}%</span>
      </div>

      {isScouted ? (
        /* Scouted kingdom — show scout CTA */
        <button
          onClick={(e) => { e.stopPropagation(); onContinue(); }}
          className="w-full mt-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
        >
          <Shield className="h-3 w-3" />
          Scout Kingdom
          <ChevronRight className="h-3 w-3" />
        </button>
      ) : (
        /* Active campaign — show quest progress */
        <>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">
              {kingdom.questsCompleted}/{kingdom.totalQuests || "?"} quests
            </span>
            <span className="text-[10px] font-medium text-foreground">{kingdom.xp} XP</span>
          </div>
          <Progress value={questProgress} className="h-1.5 bg-muted/30" />

          {/* Skills earned */}
          {kingdom.skillsEarned.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {kingdom.skillsEarned.slice(0, 3).map((skill) => (
                <span key={skill} className="text-[9px] bg-muted/40 text-muted-foreground px-1.5 py-0.5 rounded-md truncate max-w-[80px]">
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
            className="w-full mt-2 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
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
  const [tab, setTab] = useState<"saved" | "practiced">("practiced");
  const [search, setSearch] = useState("");
  const [scoutedKingdoms, setScoutedKingdoms] = useState<KingdomRole[]>([]);
  const [activeKingdoms, setActiveKingdoms] = useState<KingdomRole[]>([]);
  const [loading, setLoading] = useState(true);

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
      // Build scouted kingdoms from bookmarks
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

      // Build active campaigns from completed sims — group by role
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
            totalQuests: 8, // default estimate
            xp: 0,
            skillsEarned: [],
            lastActivity: s.completed_at,
          });
        }
        const kingdom = roleMap.get(key)!;
        kingdom.questsCompleted += 1;
        // XP: base 100 per sim, bonus for correct answers
        const accuracy = s.total_questions > 0 ? s.correct_answers / s.total_questions : 0.5;
        kingdom.xp += Math.round(100 * (0.5 + accuracy * 0.5));
        // Collect unique skills
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
  const filtered = kingdoms.filter(
    (k) => !q || k.title.toLowerCase().includes(q) || (k.company || "").toLowerCase().includes(q)
  );

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 mb-3 shrink-0">
        <button
          onClick={() => { setTab("practiced"); onTabChange?.("practiced"); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 justify-center ${
            tab === "practiced"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Swords className="h-3 w-3" />
          Campaigns ({activeKingdoms.length})
        </button>
        <button
          onClick={() => { setTab("saved"); onTabChange?.("saved"); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 justify-center ${
            tab === "saved"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bookmark className="h-3 w-3" />
          Scouted ({scoutedKingdoms.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3 shrink-0">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search kingdoms…"
          className="h-8 pl-8 text-xs bg-muted/30 border-border/40"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-3xl mb-3 block">
              {tab === "practiced" ? "⚔️" : "🔭"}
            </span>
            <p className="text-sm text-muted-foreground">
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
                onSelect={() => onSelectRole(toRoleResult(kingdom))}
                onContinue={() => handleContinue(kingdom)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
