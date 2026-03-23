/**
 * SkillDetailDrawer — Redesigned with 3-concept layout:
 * 1. Dual-track progress (Level 1 ⚡ / Level 2 ✦)
 * 2. Timeline progression (current → mastery → future)
 * 3. Battle card aesthetic for kingdoms
 */

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
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
import { type FutureSkill, type FutureSkillCategory, FUTURE_CATEGORY_META } from "@/hooks/use-future-skills";
import { ArrowRight, Briefcase, Zap, Sparkles, Lock, Diamond, Crown, Swords } from "lucide-react";
import { getTerritory } from "@/lib/territory-colors";

/* ── Skill Hero Image — direct from storage (pre-generated) ── */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const heroImageCache = new Set<string>();

function useSkillHeroImage(skill: FutureSkill | null, open: boolean) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setImageUrl(null);
    if (!skill || !open) return;

    const url = `${SUPABASE_URL}/storage/v1/object/public/sim-images/skill-hero-${skill.id}.png`;

    // If already verified, show instantly
    if (heroImageCache.has(skill.id)) {
      setImageUrl(url);
      return;
    }

    setLoading(true);
    const img = new Image();
    img.onload = () => {
      heroImageCache.add(skill.id);
      setImageUrl(url);
      setLoading(false);
    };
    img.onerror = () => {
      setImageUrl(null);
      setLoading(false);
    };
    img.src = url;
  }, [skill?.id, open]);

  return { imageUrl, loading };
}

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
  /** Whether the L2 boss has been completed */
  level2Completed?: boolean;
  /** Level 1 XP earned */
  level1Xp?: number;
  /** Level 2 XP earned */
  level2Xp?: number;
  /** Number of Level 1 sims completed for this skill */
  level1SimsCompleted?: number;
  /** Launch the L2 boss battle */
  onLaunchBoss?: () => void;
}

export default function SkillDetailDrawer({
  skill,
  open,
  onOpenChange,
  level2Unlocked = false,
  level2Completed = false,
  level1Xp = 0,
  level2Xp = 0,
  level1SimsCompleted = 0,
  onLaunchBoss,
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

  const territory = skill ? getTerritory(skill.category as FutureSkillCategory) : null;
  const { imageUrl: heroImage, loading: heroLoading } = useSkillHeroImage(skill, open);
  const demandTier = skill
    ? (skill.demandCount >= 12 ? "🔥 High Demand" : skill.demandCount >= 5 ? "📈 Growing" : "🌱 Emerging")
    : "";

  if (!skill || !territory) return null;

  // (timeline removed)

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
        {/* ── Hero Image Banner ── */}
        <div className="relative w-full h-32 overflow-hidden shrink-0" style={{ isolation: "isolate" }}>
          {heroImage ? (
            <img
              src={heroImage}
              alt={`${skill.name} illustration`}
              className="w-full h-full object-cover transition-opacity duration-700"
              style={{ filter: "brightness(0.55) saturate(1.1)" }}
            />
          ) : heroLoading ? (
            <div
              className="w-full h-full animate-pulse"
              style={{ background: `linear-gradient(135deg, hsl(var(--surface-stone)), hsl(var(--muted) / 0.3))` }}
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: `linear-gradient(135deg, hsl(var(--surface-stone)), hsl(var(--muted) / 0.2))` }}
            />
          )}
          {/* Gradient fade into content */}
          <div
            className="absolute inset-x-0 bottom-0 h-16"
            style={{ background: `linear-gradient(to top, hsl(var(--surface-stone)), transparent)` }}
          />
        </div>

        {/* ── Header with territory gradient ── */}
        <div
          className="px-5 pt-3 pb-4"
          style={{
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
              onStart={roles.length > 0 ? () => {
                onOpenChange(false);
                const r = roles[0];
                navigate(`/role/${encodeURIComponent(r.title)}${r.company ? `?company=${encodeURIComponent(r.company)}` : ""}`);
              } : undefined}
            />

            {/* Boss Battle / Trophy Section */}
            {level2Completed ? (
              /* Conquered Trophy */
              <div
                className="rounded-xl p-4 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, hsl(45 30% 15%), hsl(45 20% 10%))",
                  border: "2px solid hsl(45 70% 50%)",
                  boxShadow: "0 0 30px hsl(45 93% 58% / 0.15), inset 0 1px 0 hsl(45 80% 60% / 0.2)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ background: "hsl(45 40% 20%)", border: "1px solid hsl(45 60% 50% / 0.4)" }}>
                    👑
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ fontFamily: "'Cinzel', serif", color: "hsl(45 93% 58%)" }}>
                      Boss Conquered
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {level2Xp} XP earned · Human Edge mastered
                    </p>
                  </div>
                </div>
              </div>
            ) : level2Unlocked && onLaunchBoss ? (
              /* Boss Available */
              <motion.button
                onClick={onLaunchBoss}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full rounded-xl p-4 text-left relative overflow-hidden group"
                style={{
                  background: "linear-gradient(135deg, hsl(45 30% 12%), hsl(280 30% 12%))",
                  border: "2px solid hsl(45 60% 50% / 0.5)",
                  boxShadow: "0 0 30px hsl(45 93% 58% / 0.1), 0 4px 20px hsl(var(--emboss-shadow))",
                }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded flex items-center justify-center text-xl shrink-0"
                    style={{
                      background: "hsl(45 40% 18%)",
                      border: "1.5px solid hsl(45 60% 50% / 0.5)",
                      transform: "rotate(45deg)",
                    }}>
                    <span style={{ transform: "rotate(-45deg)" }}>⚔️</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold" style={{ fontFamily: "'Cinzel', serif", color: "hsl(45 93% 58%)" }}>
                      Boss Battle Available
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      One-time challenge · Strategic oversight audit
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </motion.button>
            ) : null}

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

/* ── Track Card — prominent stacked variant ── */
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
  prominent,
  onStart,
  startLabel,
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
  prominent?: boolean;
  onStart?: () => void;
  startLabel?: string;
}) {
  const pct = Math.min(100, Math.round((xp / maxXp) * 100));

  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden"
      style={{
        background: unlocked
          ? `linear-gradient(135deg, hsl(var(--muted) / 0.35), hsl(var(--muted) / 0.15))`
          : "hsl(var(--muted) / 0.08)",
        border: unlocked
          ? `1.5px solid ${color}44`
          : "1.5px solid hsl(var(--filigree) / 0.08)",
        opacity: unlocked ? 1 : 0.7,
        boxShadow: unlocked
          ? `0 0 20px ${color}15, inset 0 1px 0 hsl(var(--emboss-light))`
          : "none",
      }}
    >
      {/* Accent stripe */}
      {unlocked && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ background: color }}
        />
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: unlocked ? `${color}20` : "hsl(var(--muted) / 0.3)",
              border: `1px solid ${unlocked ? color + "40" : "hsl(var(--filigree) / 0.1)"}`,
            }}
          >
            <span style={{ color: unlocked ? color : "hsl(var(--muted-foreground))" }}>
              {unlocked ? icon : <Lock className="h-4 w-4" />}
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
              {label}
            </p>
            <p className="text-[11px] text-muted-foreground">{sublabel}</p>
          </div>
        </div>
        {unlocked && (
          <span
            className="text-base font-black tabular-nums"
            style={{ color, fontFamily: "'Cinzel', serif", textShadow: `0 0 12px ${color}40` }}
          >
            {xp}
          </span>
        )}
      </div>

      {unlocked ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <div
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ background: "hsl(var(--muted) / 0.4)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                  boxShadow: `0 0 8px ${color}60`,
                }}
              />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground shrink-0 tabular-nums">
              {pct}%
            </span>
            {simsCount !== undefined && (
              <span className="text-[10px] text-muted-foreground shrink-0">
                {simsCount} quests
              </span>
            )}
          </div>
          {onStart && (
            <motion.button
              onClick={onStart}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all relative overflow-hidden group"
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}dd, ${color}aa)`,
                color: "hsl(0 0% 100%)",
                boxShadow: `0 4px 20px ${color}50, 0 0 40px ${color}20, inset 0 1px 0 rgba(255,255,255,0.2)`,
                fontFamily: "'Cinzel', serif",
                textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                border: `1px solid ${color}60`,
              }}
            >
              <span className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10">{startLabel || "⚔️ Start Quest"}</span>
            </motion.button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {unlockRequirement && (
            <div
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md mt-1"
              style={{ background: "hsl(var(--muted) / 0.2)" }}
            >
              <Lock className="h-3 w-3 text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground font-medium">
                {unlockRequirement}
              </p>
            </div>
          )}
          {onStart && (
            <button
              onClick={onStart}
              className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110"
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                color: "hsl(var(--foreground))",
                boxShadow: `0 2px 10px ${color}40`,
                fontFamily: "'Cinzel', serif",
              }}
            >
              {startLabel || "⚡ Try Preview"}
            </button>
          )}
        </div>
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