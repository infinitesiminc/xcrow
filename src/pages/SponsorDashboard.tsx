/**
 * /sponsor — Employer Sponsorship Dashboard
 * Company-branded portal showing sponsored skill pools, credit usage, and talent signals.
 */
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Building2, Users, Target, BarChart3, Gift, TrendingUp,
  ArrowRight, Coins, Shield, Crown, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const cinzel = { fontFamily: "'Cinzel', serif" };
const stoneCard = {
  background: "hsl(var(--surface-stone))",
  border: "1px solid hsl(var(--filigree) / 0.2)",
  boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))",
};
const fade = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

interface Sponsorship {
  id: string;
  sponsor_name: string;
  total_credits_granted: number;
  credits_remaining: number;
  status: string;
  target_skills: string[] | null;
  target_territories: string[] | null;
  expires_at: string | null;
  created_at: string;
}

interface TalentSignal {
  skill_name: string;
  users_active: number;
  avg_score: number;
  top_tier_count: number;
}

export default function SponsorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("employer_sponsorships")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setSponsorships(data as any);
      setLoading(false);
    })();
  }, [user]);

  const totalCreditsGranted = useMemo(() => sponsorships.reduce((s, sp) => s + sp.total_credits_granted, 0), [sponsorships]);
  const totalCreditsUsed = useMemo(() => sponsorships.reduce((s, sp) => s + (sp.total_credits_granted - sp.credits_remaining), 0), [sponsorships]);
  const utilizationPct = totalCreditsGranted > 0 ? Math.round((totalCreditsUsed / totalCreditsGranted) * 100) : 0;
  const allTargetSkills = useMemo(() => {
    const set = new Set<string>();
    sponsorships.forEach(sp => sp.target_skills?.forEach(s => set.add(s)));
    return Array.from(set);
  }, [sponsorships]);

  // Mock talent signals from target skills
  const talentSignals: TalentSignal[] = useMemo(() =>
    allTargetSkills.slice(0, 8).map(skill => ({
      skill_name: skill,
      users_active: Math.floor(Math.random() * 50) + 5,
      avg_score: Math.floor(Math.random() * 40) + 50,
      top_tier_count: Math.floor(Math.random() * 10),
    })),
    [allTargetSkills]
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Sign in to access your sponsor dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead title="Sponsor Dashboard" description="Manage your employer sponsorship credits and track talent pipeline readiness." path="/sponsor" />

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div variants={fade} initial="hidden" animate="visible" className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.15)", border: "1px solid hsl(var(--primary) / 0.3)" }}>
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={cinzel}>Sponsor Command Center</h1>
              <p className="text-sm text-muted-foreground">Manage credit pools · Track talent readiness</p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <motion.div variants={fade} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Credits", value: totalCreditsGranted.toLocaleString(), icon: Coins, color: "hsl(var(--territory-strategic))" },
                { label: "Credits Used", value: totalCreditsUsed.toLocaleString(), icon: TrendingUp, color: "hsl(var(--territory-analytical))" },
                { label: "Utilization", value: `${utilizationPct}%`, icon: BarChart3, color: "hsl(var(--territory-technical))" },
                { label: "Skill Pools", value: allTargetSkills.length.toString(), icon: Target, color: "hsl(var(--territory-leadership))" },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl p-4" style={stoneCard}>
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ ...cinzel, color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </motion.div>

            {/* Credit Utilization Bar */}
            <motion.div variants={fade} initial="hidden" animate="visible" className="rounded-xl p-5 mb-8" style={stoneCard}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold" style={cinzel}>Credit Utilization</h3>
                <span className="text-xs text-muted-foreground">{totalCreditsUsed} / {totalCreditsGranted} credits used</span>
              </div>
              <Progress value={utilizationPct} className="h-3" />
            </motion.div>

            {/* Sponsorships List */}
            <motion.div variants={fade} initial="hidden" animate="visible" className="mb-10">
              <h2 className="text-lg font-bold mb-4" style={cinzel}>Active Sponsorships</h2>
              {sponsorships.length === 0 ? (
                <div className="rounded-xl p-8 text-center" style={stoneCard}>
                  <Gift className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground mb-4">No sponsorships yet</p>
                  <Button onClick={() => navigate("/contact")} className="gap-2">
                    <Building2 className="h-4 w-4" /> Start Sponsoring <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sponsorships.map(sp => {
                    const usedPct = Math.round(((sp.total_credits_granted - sp.credits_remaining) / sp.total_credits_granted) * 100);
                    return (
                      <div key={sp.id} className="rounded-xl p-4" style={stoneCard}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-primary/10">
                              <Crown className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{sp.sponsor_name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                Created {new Date(sp.created_at).toLocaleDateString()}
                                {sp.expires_at && ` · Expires ${new Date(sp.expires_at).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>
                          <Badge variant={sp.status === "active" ? "default" : "secondary"} className="text-[10px]">
                            {sp.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                          <Progress value={usedPct} className="flex-1 h-2" />
                          <span className="text-xs font-mono text-muted-foreground w-16 text-right">
                            {sp.credits_remaining}/{sp.total_credits_granted}
                          </span>
                        </div>
                        {sp.target_skills && sp.target_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {sp.target_skills.map(skill => (
                              <span key={skill} className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Talent Signal Grid */}
            {talentSignals.length > 0 && (
              <motion.div variants={fade} initial="hidden" animate="visible">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-bold" style={cinzel}>Talent Signals</h2>
                  <span className="text-[10px] text-muted-foreground ml-2">(anonymized)</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {talentSignals.map(signal => (
                    <div key={signal.skill_name} className="rounded-xl p-4" style={stoneCard}>
                      <p className="text-xs font-bold text-foreground mb-2 truncate">{signal.skill_name}</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Active Learners</span>
                          <span className="font-mono text-foreground">{signal.users_active}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Avg Score</span>
                          <span className="font-mono" style={{ color: signal.avg_score >= 70 ? "hsl(var(--territory-analytical))" : "hsl(var(--territory-strategic))" }}>
                            {signal.avg_score}%
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Top Tier</span>
                          <span className="font-mono text-primary">{signal.top_tier_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
