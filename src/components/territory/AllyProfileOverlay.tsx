/**
 * AllyProfileOverlay — Compact right-side overlay showing a friend's profile.
 * Replaces full-page navigation for viewing ally profiles from the AlliesPanel.
 */
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { X, Swords, Shield, Trophy, Zap, Briefcase, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCastleState, CASTLE_TIERS, type CastleTier } from "@/lib/castle-levels";
import { getLevel, levelProgress } from "@/lib/skill-map";
import { getAvatarById } from "@/lib/avatars";
import type { Friend } from "@/hooks/use-friends";

import castleRuins from "@/assets/castle-ruins.png";
import castleOutpost from "@/assets/castle-outpost.png";
import castleFortress from "@/assets/castle-fortress.png";
import castleCitadel from "@/assets/castle-citadel.png";

const TIER_IMAGES: Record<string, string> = {
  ruins: castleRuins,
  outpost: castleOutpost,
  fortress: castleFortress,
  citadel: castleCitadel,
};

interface ProfileData {
  display_name: string | null;
  username: string;
  career_stage: string | null;
  school_name: string | null;
  company: string | null;
  job_title: string | null;
  total_quests: number;
  unique_tasks: number;
  total_xp: number;
  avg_score: number;
  skills: { skill_id: string; xp: number; category: string }[];
}

function hashToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

interface AllyProfileOverlayProps {
  friend: Friend;
  onClose: () => void;
}

export default function AllyProfileOverlay({ friend, onClose }: AllyProfileOverlayProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!friend.username) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data } = await supabase.rpc("get_public_profile" as any, { _username: friend.username });
      if (data) setProfile(data as unknown as ProfileData);
      setLoading(false);
    })();
  }, [friend.username]);

  const skillXpMap = useMemo(() => {
    if (!profile?.skills) return new Map<string, { xp: number; category: string }>();
    const m = new Map<string, { xp: number; category: string }>();
    for (const s of profile.skills) {
      const existing = m.get(s.skill_id);
      m.set(s.skill_id, { xp: (existing?.xp ?? 0) + s.xp, category: s.category });
    }
    return m;
  }, [profile]);

  const tierCounts = useMemo(() => {
    const counts: Record<CastleTier, number> = { ruins: 0, outpost: 0, fortress: 0, citadel: 0, grandmaster: 0 };
    skillXpMap.forEach(({ xp }) => {
      const castle = getCastleState(xp);
      if (castle.unlocked) counts[castle.tier]++;
    });
    return counts;
  }, [skillXpMap]);

  const totalCastles = tierCounts.outpost + tierCounts.fortress + tierCounts.citadel;
  const levelInfo = profile ? getLevel(profile.total_xp) : { name: "Beginner" as const, index: 0 };
  const lvlProgress = profile ? levelProgress(profile.total_xp) : 0;
  const avatar = friend.avatarId ? getAvatarById(friend.avatarId) : null;
  const displayName = profile?.display_name || friend.displayName;
  const hue = hashToHue(displayName);

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
      className="absolute inset-0 z-30 flex flex-col"
      style={{ background: "hsl(var(--surface-stone))" }}
    >
      {/* Header */}
      <div
        className="px-3 py-2.5 flex items-center justify-between shrink-0"
        style={{ borderBottom: "1px solid hsl(var(--filigree) / 0.15)" }}
      >
        <h3
          className="text-xs font-bold tracking-wider"
          style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--foreground))" }}
        >
          ALLY PROFILE
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md transition-all hover:bg-white/10"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-4">
          {loading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ) : !profile && !friend.username ? (
            <div className="text-center py-8">
              <p className="text-xs text-foreground/75">This ally hasn't set up a public profile yet.</p>
            </div>
          ) : (
            <>
              {/* Avatar + Name */}
              <div className="flex items-center gap-3">
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden ring-2"
                  style={{
                    background: avatar ? "hsl(var(--filigree) / 0.1)" : `linear-gradient(135deg, hsl(${hue} 60% 35%), hsl(${hue + 40} 50% 25%))`,
                    color: avatar ? undefined : `hsl(${hue} 80% 85%)`,
                    ringColor: "hsl(var(--filigree) / 0.2)",
                  }}
                >
                  {avatar
                    ? <img src={avatar.src} alt={avatar.label} className="w-full h-full object-cover" />
                    : displayName.slice(0, 2).toUpperCase()
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate" style={{ fontFamily: "'Cinzel', serif" }}>
                    {displayName}
                  </p>
                  {friend.username && (
                    <p className="text-[11px] text-foreground/70">@{friend.username}</p>
                  )}
                  {profile && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] text-foreground/75">
                        Lvl {levelInfo.index + 1} · {levelInfo.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {profile && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.job_title && (
                    <Badge variant="secondary" className="text-[10px] gap-1 h-5">
                      <Briefcase className="h-2.5 w-2.5" /> {profile.job_title}
                    </Badge>
                  )}
                  {profile.school_name && (
                    <Badge variant="secondary" className="text-[10px] gap-1 h-5">
                      <GraduationCap className="h-2.5 w-2.5" /> {profile.school_name}
                    </Badge>
                  )}
                  {profile.career_stage && (
                    <Badge variant="outline" className="text-[10px] capitalize h-5">
                      {profile.career_stage}
                    </Badge>
                  )}
                </div>
              )}

              {/* Level bar */}
              {profile && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-foreground/70">Level {levelInfo.index + 1}</span>
                    <span className="font-medium" style={{ color: "hsl(var(--filigree-glow))" }}>
                      {profile.total_xp.toLocaleString()} XP
                    </span>
                  </div>
                  <Progress value={lvlProgress} className="h-1.5" />
                </div>
              )}

              {/* Stats row */}
              {profile && (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { icon: Zap, label: "XP", value: profile.total_xp.toLocaleString(), color: "hsl(45 80% 50%)" },
                    { icon: Swords, label: "Quests", value: profile.total_quests.toString(), color: "hsl(0 60% 55%)" },
                    { icon: Shield, label: "Castles", value: totalCastles.toString(), color: "hsl(142 60% 45%)" },
                    { icon: Trophy, label: "Power", value: `${profile.avg_score}%`, color: "hsl(270 60% 55%)" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="flex flex-col items-center gap-0.5 py-2 rounded-lg"
                      style={{ background: "hsl(var(--filigree) / 0.06)" }}
                    >
                      <stat.icon className="h-3.5 w-3.5" style={{ color: stat.color }} />
                      <span className="text-xs font-bold text-foreground">{stat.value}</span>
                      <span className="text-[8px] text-foreground/60 uppercase tracking-wider">{stat.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Castle Tiers */}
              {profile && (
                <div
                  className="rounded-lg p-3"
                  style={{ background: "hsl(var(--filigree) / 0.06)" }}
                >
                  <p className="text-[10px] font-bold text-foreground mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
                    🏰 TERRITORY
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {(["outpost", "fortress", "citadel", "ruins"] as CastleTier[]).map((tier) => {
                      const tierInfo = CASTLE_TIERS.find(t => t.tier === tier)!;
                      return (
                        <div key={tier} className="flex flex-col items-center gap-1">
                          <img
                            src={TIER_IMAGES[tier]}
                            alt={tierInfo.label}
                            className="h-9 w-9 object-contain"
                            style={{ filter: tierCounts[tier] === 0 ? "grayscale(0.6) opacity(0.4)" : "none" }}
                          />
                          <span className="text-xs font-bold text-foreground">{tierCounts[tier]}</span>
                          <span className="text-[8px] text-foreground/60">{tierInfo.emoji} {tierInfo.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Top Skills */}
              {skillXpMap.size > 0 && (
                <div
                  className="rounded-lg p-3"
                  style={{ background: "hsl(var(--filigree) / 0.06)" }}
                >
                  <p className="text-[10px] font-bold text-foreground mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
                    💎 TOP SKILLS
                  </p>
                  <div className="space-y-2">
                    {Array.from(skillXpMap.entries())
                      .sort((a, b) => b[1].xp - a[1].xp)
                      .slice(0, 5)
                      .map(([skillId, { xp }]) => {
                        const castle = getCastleState(xp);
                        return (
                          <div key={skillId} className="flex items-center gap-2">
                            <img
                              src={TIER_IMAGES[castle.tier]}
                              alt={castle.label}
                              className="h-6 w-6 object-contain shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-medium text-foreground truncate">
                                  {skillId.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                                <span className="text-[9px] text-foreground/60 ml-1 shrink-0">{xp} XP</span>
                              </div>
                              <Progress value={castle.tierProgress} className="h-1 mt-0.5" />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
