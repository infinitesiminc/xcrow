/**
 * SkillDetailDrawer — Redesigned with 3-concept layout:
 * 1. Dual-track progress (Level 1 ⚡ / Level 2 ✦)
 * 2. Timeline progression (current → mastery → future)
 * 3. Battle card aesthetic for kingdoms
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { type FutureSkill, type FutureSkillCategory } from "@/hooks/use-future-skills";
import { ArrowRight, Briefcase, Zap, Sparkles, Lock, Diamond } from "lucide-react";
import { getTerritory } from "@/lib/territory-colors";

interface RoleLink {
  jobId: string;
  title: string;
  company: string | null;
  department: string | null;
  augmentedPercent: number | null;
}

interface SkillDetailDrawerProps {
  skill: FutureSkill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Whether this skill has Level 2 unlocked for the user */
  level2Unlocked?: boolean;
  /** Level 1 XP earned */
  level1Xp?: number;
  /** Level 2 XP earned */
  level2Xp?: number;
  /** Number of Level 1 sims completed for this skill */
  level1SimsCompleted?: number;
}

export default function SkillDetailDrawer({
  skill,
  open,
  onOpenChange,
  level2Unlocked = false,
  level1Xp = 0,
  level2Xp = 0,
  level1SimsCompleted = 0,
}: SkillDetailDrawerProps) {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleLink[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!skill || !open) return;

    window.dispatchEvent(
      new CustomEvent("focus_skill", {
        detail: { skillId: skill.id, skillName: skill.name, category: skill.category },
      })
    );

    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("job_future_skills")
        .select("job_id, cluster_name")
        .eq("canonical_skill_id", skill.id)
        .limit(20);

      if (!data || data.length === 0) {
        setRoles([]);
        setLoading(false);
        return;
      }

      const jobIds = [...new Set(data.map((d) => d.job_id).filter(Boolean))] as string[];
      if (jobIds.length === 0) {
        setRoles([]);
        setLoading(false);
        return;
      }

      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, title, company_id, department, augmented_percent")
        .in("id", jobIds.slice(0, 10));

      if (!jobs) {
        setRoles([]);
        setLoading(false);
        return;
      }

      const companyIds = [...new Set(jobs.map((j) => j.company_id).filter(Boolean))] as string[];
      let companyMap = new Map<string, string>();

      if (companyIds.length > 0) {
        const { data: companies } = await supabase
          .from("companies")
          .select("id, name")
          .in("id", companyIds);
        if (companies) {
          companyMap = new Map(companies.map((c) => [c.id, c.name]));
        }
      }

      setRoles(
        jobs.map((j) => ({
          jobId: j.id,
          title: j.title,
          company: j.company_id ? companyMap.get(j.company_id) || null : null,
          department: j.department,
          augmentedPercent: j.augmented_percent,
        }))
      );
      setLoading(false);
    })();
  }, [skill, open]);

  if (!skill) return null;

  const territory = getTerritory(skill.category as FutureSkillCategory);
  const demandTier =
    skill.demandCount >= 12 ? "🔥 High Demand" : skill.demandCount >= 5 ? "📈 Growing" : "🌱 Emerging";

  // Timeline step calculation
  const timelineStep = level2Unlocked
    ? level2Xp > 0
      ? 3 // practicing future
      : 2 // unlocked, not started
    : level1Xp > 0
      ? 1 // practicing current
      : 0; // not started

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[380px] sm:w-[420px] overflow-y-auto p-0"
        style={{
          background: "hsl(var(--surface-stone))",
          borderLeft: "1px solid hsl(var(--filigree) / 0.2)",
        }}
      >
        {/* ── Header with territory gradient ── */}
        <div
          className="px-5 pt-5 pb-4"
          style={{
            background: `linear-gradient(180deg, hsl(var(--surface-stone)) 0%, hsl(var(--surface-stone)) 100%)`,
            borderBottom: "1px solid hsl(var(--filigree) / 0.12)",
          }}
        >
          <SheetHeader className="pb-0">
            <div className="flex items-center gap-3">
              {/* Skill icon with shape indicator */}
              <div
                className="relative flex items-center justify-center shrink-0"
                style={{
                  width: 48,
                  height: 48,
                  background: level2Unlocked
                    ? "linear-gradient(135deg, hsl(45 40% 15%), hsl(45 30% 20%))"
                    : `linear-gradient(135deg, hsl(var(--surface-stone)), hsl(var(--muted)))`,
                  border: level2Unlocked
                    ? "2px solid hsl(45 60% 50%)"
                    : `2px solid hsl(var(--filigree) / 0.3)`,
                  borderRadius: level2Unlocked ? "4px" : "50%",
                  transform: level2Unlocked ? "rotate(45deg)" : "none",
                }}
              >
                <span
                  className="text-xl"
                  style={{ transform: level2Unlocked ? "rotate(-45deg)" : "none" }}
                >
                  {skill.iconEmoji || "⚔️"}
                </span>
              </div>
              <div className="min-w-0">
                <SheetTitle
                  className="text-lg leading-tight"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {skill.name}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      color: territory.hsl,
                      border: `1px solid ${territory.hsl}`,
                      background: "transparent",
                    }}
                  >
                    {skill.category}
                  </span>
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {demandTier}
                  </span>
                </div>
              </div>
            </div>
            <SheetDescription className="sr-only">Details for {skill.name}</SheetDescription>
          </SheetHeader>

          {skill.description && (
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{skill.description}</p>
          )}
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* ── Dual-Track Progress — Stacked Cards ── */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Mastery Tracks
            </h3>

            {/* Level 1 — AI Mastery Track */}
            <TrackCard
              icon={<Zap className="h-4 w-4" />}
              label="Level 1 · Current Tools"
              sublabel="Learn how AI augments this skill today"
              xp={level1Xp}
              maxXp={500}
              color="hsl(var(--primary))"
              unlocked
              simsCount={level1SimsCompleted}
              prominent
            />

            {/* Level 2 — Future Vision Track */}
            <TrackCard
              icon={<Diamond className="h-4 w-4" />}
              label="Level 2 · Future Role"
              sublabel="Practice the evolved human-in-the-loop role"
              xp={level2Xp}
              maxXp={500}
              color="hsl(45 93% 58%)"
              unlocked={level2Unlocked}
              unlockRequirement={!level2Unlocked ? `${Math.max(0, 3 - level1SimsCompleted)} more quests to unlock` : undefined}
              prominent
            />
          </div>

          {/* ── Stats row ── */}
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Demand" value={skill.demandCount} />
            <StatCard label="Roles" value={skill.jobCount} />
            <StatCard label="Relevance" value={`${skill.avgRelevance}%`} />
          </div>

          <Separator style={{ background: "hsl(var(--filigree) / 0.12)" }} />

          {/* ── CONCEPT 3: Battle Card Kingdoms ── */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5 mb-3"
            >
              <Briefcase className="h-3.5 w-3.5" style={{ color: territory.hsl }} />
              Kingdoms that need this skill
            </h3>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : roles.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic py-4 text-center">
                No linked kingdoms yet — explore the map to discover matches.
              </p>
            ) : (
              <div className="space-y-1.5">
                {roles.map((role) => (
                  <button
                    key={role.jobId}
                    onClick={() => {
                      onOpenChange(false);
                      navigate(`/role/${encodeURIComponent(role.title)}${role.company ? `?company=${encodeURIComponent(role.company)}` : ""}`);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg transition-all text-left group hover:brightness-110"
                    style={{
                      background: "hsl(var(--muted) / 0.2)",
                      border: "1px solid hsl(var(--filigree) / 0.12)",
                    }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{role.title}</p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        {role.company && <span className="truncate">{role.company}</span>}
                        {role.department && (
                          <>
                            <span style={{ color: "hsl(var(--filigree) / 0.3)" }}>·</span>
                            <span>{role.department}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Track Card ── */
function TrackCard({
  icon,
  label,
  sublabel,
  xp,
  maxXp,
  color,
  unlocked,
  unlockRequirement,
  simsCount,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  xp: number;
  maxXp: number;
  color: string;
  unlocked: boolean;
  unlockRequirement?: string;
  simsCount?: number;
}) {
  const pct = Math.min(100, Math.round((xp / maxXp) * 100));

  return (
    <div
      className="rounded-lg p-3 relative overflow-hidden"
      style={{
        background: unlocked ? "hsl(var(--muted) / 0.25)" : "hsl(var(--muted) / 0.1)",
        border: `1px solid ${unlocked ? color + "33" : "hsl(var(--filigree) / 0.1)"}`,
        opacity: unlocked ? 1 : 0.65,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span style={{ color: unlocked ? color : "hsl(var(--muted-foreground))" }}>
            {unlocked ? icon : <Lock className="h-3.5 w-3.5" />}
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground">{sublabel}</p>
          </div>
        </div>
        {unlocked && (
          <span className="text-xs font-bold" style={{ color, fontFamily: "'Cinzel', serif" }}>
            {xp} XP
          </span>
        )}
      </div>

      {unlocked ? (
        <div className="flex items-center gap-2">
          <div
            className="flex-1 h-1.5 rounded-full overflow-hidden"
            style={{ background: "hsl(var(--muted) / 0.4)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: color }}
            />
          </div>
          {simsCount !== undefined && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              {simsCount} quests
            </span>
          )}
        </div>
      ) : (
        unlockRequirement && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Lock className="h-2.5 w-2.5" />
            {unlockRequirement}
          </p>
        )
      )}
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="rounded-lg p-2 text-center"
      style={{
        background: "hsl(var(--muted) / 0.2)",
        border: "1px solid hsl(var(--filigree) / 0.1)",
      }}
    >
      <p
        className="text-sm font-bold text-foreground"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {String(value)}
      </p>
      <p
        className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground"
      >
        {label}
      </p>
    </div>
  );
}