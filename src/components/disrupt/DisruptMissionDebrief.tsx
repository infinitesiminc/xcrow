import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Trophy, Map as MapIcon, Brain, Star, BarChart3 } from "lucide-react";
import type { IndustryCluster, DisruptionIncumbent } from "@/data/disruption-incumbents";

const FOUNDER_PROFILES = [
  { min: 90, title: "The Visionary Founder", emoji: "🦅", desc: "You see the future before others. Strong in strategy, market sensing, and storytelling." },
  { min: 80, title: "The Strategic Operator", emoji: "⚔️", desc: "Execution is your superpower. Strong on GTM, unit economics, and competitive defense." },
  { min: 70, title: "The Growth Hacker", emoji: "🚀", desc: "You find creative angles. Strong on customer discovery and go-to-market." },
  { min: 60, title: "The Resilient Builder", emoji: "🔨", desc: "You learn fast and iterate. Keep sharpening your disruption instincts." },
  { min: 0, title: "The Apprentice Disruptor", emoji: "🌱", desc: "Every founder starts somewhere. Try another incumbent to build your skills." },
];

const ACT_LABELS = [
  { num: 1, label: "Scout", weight: 0.2, emoji: "🔍" },
  { num: 2, label: "Discover", weight: 0.15, emoji: "🗣️" },
  { num: 3, label: "Architect", weight: 0.2, emoji: "📋" },
  { num: 4, label: "Launch", weight: 0.15, emoji: "🚀" },
  { num: 5, label: "Defend", weight: 0.15, emoji: "🏰" },
  { num: 6, label: "Pitch", weight: 0.15, emoji: "💼" },
];

export function DisruptMissionDebrief({ incumbent, cluster, actScores, onBackToHub }: {
  incumbent: DisruptionIncumbent;
  cluster: IndustryCluster;
  actScores: Record<number, number>;
  onBackToHub: () => void;
}) {
  const { totalScore, founderProfile, valuation } = useMemo(() => {
    let weighted = 0;
    let totalWeight = 0;
    ACT_LABELS.forEach(act => {
      const s = actScores[act.num] || 0;
      weighted += s * act.weight;
      totalWeight += act.weight;
    });
    const total = Math.round(weighted / totalWeight);
    const profile = FOUNDER_PROFILES.find(p => total >= p.min) || FOUNDER_PROFILES[FOUNDER_PROFILES.length - 1];

    // Fun "valuation" based on score
    const baseVal = total >= 90 ? 50 : total >= 80 ? 25 : total >= 70 ? 10 : total >= 60 ? 5 : 1;
    const val = `$${baseVal}M`;

    // Save to localStorage
    const key = "disrupt-progress";
    try {
      const all = JSON.parse(localStorage.getItem(key) || "{}");
      all[String(incumbent.id)] = {
        ...all[String(incumbent.id)],
        totalScore: total,
        founderProfile: profile.title,
        status: "completed",
      };
      localStorage.setItem(key, JSON.stringify(all));
    } catch { /* ok */ }

    return { totalScore: total, founderProfile: profile, valuation: val };
  }, [actScores, incumbent.id]);

  const getColor = (s: number) => s >= 80 ? "text-green-500" : s >= 60 ? "text-yellow-500" : "text-red-500";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
        <div className="text-6xl mb-4">{founderProfile.emoji}</div>
      </motion.div>

      <Badge variant="outline" className="mb-2 text-xs">Mission Complete</Badge>
      <h1 className="font-cinzel text-3xl font-bold text-foreground mb-1">{founderProfile.title}</h1>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{founderProfile.desc}</p>

      {/* Big Score */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="inline-flex items-center gap-6 bg-card border border-border rounded-2xl p-8 mb-8">
          <div>
            <p className={`text-6xl font-cinzel font-bold ${getColor(totalScore)}`}>{totalScore}</p>
            <p className="text-xs text-muted-foreground">Overall Score</p>
          </div>
          <div className="h-16 w-px bg-border" />
          <div>
            <p className="text-3xl font-bold text-primary">{valuation}</p>
            <p className="text-xs text-muted-foreground">Startup Valuation</p>
          </div>
        </div>
      </motion.div>

      {/* Per-Act Scores */}
      <Card className="mb-8 text-left">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-cinzel flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Act-by-Act Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ACT_LABELS.map((act, i) => {
              const s = actScores[act.num] || 0;
              return (
                <motion.div key={act.num} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-foreground font-medium">{act.emoji} Act {act.num}: {act.label}</span>
                    <span className={`font-bold ${getColor(s)}`}>{s || "—"}</span>
                  </div>
                  <Progress value={s} className="h-2" />
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Mission Info */}
      <Card className="mb-8 text-left">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{cluster.emoji}</span>
            <span className="font-cinzel font-bold text-sm text-foreground">{incumbent.name}</span>
            <Badge variant="outline" className="text-[11px]">{cluster.name}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Disruption vector: {incumbent.vector} — {incumbent.vulnerability}</p>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-center">
        <Button onClick={onBackToHub} size="lg">
          <MapIcon className="w-4 h-4 mr-2" /> Back to Mission Hub
        </Button>
      </div>
    </div>
  );
}

