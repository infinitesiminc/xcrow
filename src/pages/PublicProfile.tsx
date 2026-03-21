/**
 * PublicProfile — shareable profile page at /u/:username
 * Shows territory map overview, castle tiers, and quest stats.
 */

import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Swords, Trophy, Zap, MapPin, Briefcase, GraduationCap, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getCastleState, CASTLE_TIERS, type CastleTier } from "@/lib/castle-levels";
import { getLevel, levelProgress } from "@/lib/skill-map";
import crowLogo from "@/assets/crowy-logo.png";

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

const TIER_COLORS: Record<CastleTier, string> = {
  ruins: "text-muted-foreground",
  outpost: "text-emerald-400",
  fortress: "text-amber-400",
  citadel: "text-purple-400",
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

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_public_profile" as any, { _username: username });
      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data as unknown as ProfileData);
      }
      setLoading(false);
    })();
  }, [username]);

  // Aggregate skills by skill_id to compute XP per skill
  const skillXpMap = useMemo(() => {
    if (!profile?.skills) return new Map<string, { xp: number; category: string }>();
    const m = new Map<string, { xp: number; category: string }>();
    for (const s of profile.skills) {
      const existing = m.get(s.skill_id);
      m.set(s.skill_id, {
        xp: (existing?.xp ?? 0) + s.xp,
        category: s.category,
      });
    }
    return m;
  }, [profile]);

  // Castle tier distribution
  const tierCounts = useMemo(() => {
    const counts: Record<CastleTier, number> = { ruins: 0, outpost: 0, fortress: 0, citadel: 0 };
    skillXpMap.forEach(({ xp }) => {
      const castle = getCastleState(xp);
      if (castle.unlocked) counts[castle.tier]++;
    });
    return counts;
  }, [skillXpMap]);

  const totalCastles = tierCounts.outpost + tierCounts.fortress + tierCounts.citadel;
  const level = profile ? getLevel(profile.total_xp) : { label: "Apprentice", tier: 1 };
  const lvlProgress = profile ? levelProgress(profile.total_xp) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <img src={crowLogo} alt="xcrow" className="h-16 w-16 opacity-50" />
        <h1 className="text-xl font-bold text-foreground">Adventurer not found</h1>
        <p className="text-muted-foreground text-sm">This profile doesn't exist or hasn't been claimed yet.</p>
        <Link to="/" className="text-primary hover:underline text-sm flex items-center gap-1">
          <ExternalLink className="h-3 w-3" /> Go to xcrow.ai
        </Link>
      </div>
    );
  }

  const displayName = profile.display_name || profile.username;
  const hue = hashToHue(displayName);

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={crowLogo} alt="xcrow" className="h-7 w-7" />
            <span className="text-sm font-bold text-foreground">xcrow.ai</span>
          </Link>
          <Badge variant="outline" className="text-[10px]">Public Profile</Badge>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Profile hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          {/* Avatar */}
          <div
            className="h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold ring-2 ring-primary/30"
            style={{
              background: `linear-gradient(135deg, hsl(${hue} 60% 35%), hsl(${hue + 40} 50% 25%))`,
              color: `hsl(${hue} 80% 85%)`,
            }}
          >
            {displayName.slice(0, 2).toUpperCase()}
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 justify-center">
            {profile.job_title && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Briefcase className="h-3 w-3" /> {profile.job_title}
              </Badge>
            )}
            {profile.company && (
              <Badge variant="secondary" className="text-xs gap-1">
                <MapPin className="h-3 w-3" /> {profile.company}
              </Badge>
            )}
            {profile.school_name && (
              <Badge variant="secondary" className="text-xs gap-1">
                <GraduationCap className="h-3 w-3" /> {profile.school_name}
              </Badge>
            )}
            {profile.career_stage && (
              <Badge variant="outline" className="text-xs capitalize">
                {profile.career_stage}
              </Badge>
            )}
          </div>

          {/* Level bar */}
          <div className="w-full max-w-xs space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Tier {level.tier}</span>
              <span className="font-medium text-primary">{level.label}</span>
            </div>
            <Progress value={lvlProgress} className="h-2" />
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            { icon: Zap, label: "Total XP", value: profile.total_xp.toLocaleString(), color: "text-amber-400" },
            { icon: Swords, label: "Quests", value: profile.total_quests.toString(), color: "text-red-400" },
            { icon: Shield, label: "Castles", value: totalCastles.toString(), color: "text-emerald-400" },
            { icon: Trophy, label: "Avg Power", value: `${profile.avg_score}%`, color: "text-purple-400" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card/60 border-border/40">
              <CardContent className="p-4 flex flex-col items-center gap-1">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-lg font-bold text-foreground">{stat.value}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Castle Tier Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-5">
              <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                🏰 Territory Overview
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(["outpost", "fortress", "citadel", "ruins"] as CastleTier[]).map((tier) => {
                  const tierInfo = CASTLE_TIERS.find(t => t.tier === tier)!;
                  return (
                    <div key={tier} className="flex flex-col items-center gap-2">
                      <img
                        src={TIER_IMAGES[tier]}
                        alt={tierInfo.label}
                        className="h-14 w-14 object-contain"
                        style={{ filter: tierCounts[tier] === 0 ? "grayscale(0.6) opacity(0.4)" : "none" }}
                      />
                      <span className={`text-xl font-bold ${TIER_COLORS[tier]}`}>
                        {tierCounts[tier]}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {tierInfo.emoji} {tierInfo.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Skills */}
        {skillXpMap.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-card/60 border-border/40">
              <CardContent className="p-5">
                <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  ⚔️ Top Skills
                </h2>
                <div className="space-y-3">
                  {Array.from(skillXpMap.entries())
                    .sort((a, b) => b[1].xp - a[1].xp)
                    .slice(0, 8)
                    .map(([skillId, { xp, category }]) => {
                      const castle = getCastleState(xp);
                      return (
                        <div key={skillId} className="flex items-center gap-3">
                          <img
                            src={TIER_IMAGES[castle.tier]}
                            alt={castle.label}
                            className="h-8 w-8 object-contain flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-foreground truncate">
                                {skillId.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">
                                {xp} XP
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Progress value={castle.tierProgress} className="h-1 flex-1" />
                              <Badge variant="outline" className="text-[8px] py-0 h-4">
                                {castle.emoji} {castle.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center py-6"
        >
          <p className="text-xs text-muted-foreground mb-2">Build your own AI-ready territory</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <img src={crowLogo} alt="" className="h-4 w-4" />
            Start your quest on xcrow.ai
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
