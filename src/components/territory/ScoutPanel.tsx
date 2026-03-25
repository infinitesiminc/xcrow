/**
 * ScoutPanel — Act 2: Discover jobs ranked by composite match score.
 * Pure discovery — no simulation launching from this view.
 */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, TrendingUp, MapPin, Building2, Search, Loader2, Shield, Zap, Users, ChevronDown, Star, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { buildUserProfile, matchJobsForUser, type JobCandidate, type UserProfile } from "@/lib/match-engine";

type SortMode = "match" | "skills" | "recent";

export default function ScoutPanel() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<JobCandidate[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("match");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const profile = await buildUserProfile(user.id);
        if (cancelled) return;
        setUserProfile(profile);
        const results = await matchJobsForUser(profile, 100);
        if (cancelled) return;
        setCandidates(results);
      } catch (e) {
        console.error("Scout match error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
        <Compass className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
        <p className="text-sm text-muted-foreground">Sign in to discover roles matched to your proven skills.</p>
      </div>
    );
  }

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
          Complete more quests in the Skill Forge to unlock job matches. Each battle teaches the Scout what you're capable of.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 space-y-2">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-primary" />
          <span className="text-xs font-fantasy font-bold text-foreground tracking-wide">
            Scout — {filtered.length} Matches
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles, companies…"
            className="pl-8 h-8 text-xs bg-background/50"
          />
        </div>

        {/* Sort pills */}
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

      {/* Job list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1.5">
        {filtered.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.5) }}
          >
            <JobCard
              job={job}
              isExpanded={expanded === job.id}
              onToggle={() => setExpanded(expanded === job.id ? null : job.id)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Job Card ── */

function JobCard({
  job,
  isExpanded,
  onToggle,
}: {
  job: JobCandidate;
  isExpanded: boolean;
  onToggle: () => void;
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

        {/* Info */}
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
              <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                {job.department}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5" />
                {job.location.split(",")[0]}
              </span>
            )}
          </div>
        </div>

        {/* Expand chevron */}
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </div>

      {/* Expanded details */}
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
              {/* Score breakdown */}
              <div className="grid grid-cols-3 gap-2">
                <ScoreBar label="Skills" value={job.skillOverlap} icon={Shield} />
                <ScoreBar label="Tasks" value={job.taskFamiliarity} icon={Zap} />
                <ScoreBar label="Dept." value={job.departmentAffinity} icon={Users} />
              </div>

              {/* Matched skills */}
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

              {/* Action */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[11px] h-7 flex-1 font-fantasy"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/analysis?title=${encodeURIComponent(job.title)}${job.company ? `&company=${encodeURIComponent(job.company)}` : ""}`);
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
