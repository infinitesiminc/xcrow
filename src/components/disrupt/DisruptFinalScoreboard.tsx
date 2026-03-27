import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { INDUSTRY_CLUSTERS } from "@/data/disruption-incumbents";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal, ArrowLeft, Swords, Lightbulb, Presentation } from "lucide-react";
import type { DisruptRoom, DisruptTeam, DisruptMember } from "./DisruptLobby";

export function DisruptFinalScoreboard({
  room, teams: initialTeams, members, onBack,
}: {
  room: DisruptRoom;
  teams: DisruptTeam[];
  members: DisruptMember[];
  onBack: () => void;
}) {
  const [teams, setTeams] = useState(initialTeams);
  const [voteAverages, setVoteAverages] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchVotes();
    const ch = supabase
      .channel(`final-${room.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "disrupt_teams", filter: `room_id=eq.${room.id}` }, (payload) => {
        setTeams(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } as DisruptTeam : t));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "disrupt_votes", filter: `room_id=eq.${room.id}` }, () => {
        fetchVotes();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [room.id]);

  async function fetchVotes() {
    const { data } = await supabase
      .from("disrupt_votes")
      .select("team_id, viability, clarity, defensibility")
      .eq("room_id", room.id);
    if (!data) return;

    const grouped: Record<string, number[]> = {};
    for (const v of data) {
      if (!grouped[v.team_id]) grouped[v.team_id] = [];
      grouped[v.team_id].push(((v.viability + v.clarity + v.defensibility) / 3) * 20); // scale to 0-100
    }
    const avgs: Record<string, number> = {};
    for (const [tid, scores] of Object.entries(grouped)) {
      avgs[tid] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
    setVoteAverages(avgs);
  }

  const activeTeams = teams
    .filter(t => members.some(m => m.team_id === t.id))
    .map(t => {
      const act1 = (t.score_result as any)?.overall || t.total_score || 0;
      const act2 = t.venture_canvas ? calculateVentureScore(t.venture_canvas as any) : 0;
      const act3 = voteAverages[t.id] || 0;
      const final = Math.round(act1 * 0.4 + act2 * 0.3 + act3 * 0.3);
      return { ...t, act1, act2, act3, final };
    })
    .sort((a, b) => b.final - a.final);

  const getMedal = (idx: number) => {
    if (idx === 0) return <Crown className="w-7 h-7 text-yellow-500" />;
    if (idx === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (idx === 2) return <Medal className="w-6 h-6 text-amber-700" />;
    return <span className="text-sm text-muted-foreground font-bold">#{idx + 1}</span>;
  };

  const getIncumbentName = (id: string | null) =>
    id ? INDUSTRY_CLUSTERS.flatMap(c => c.incumbents).find(i => String(i.id) === id)?.name || "?" : "—";

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="text-center mb-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
          <Trophy className="w-14 h-14 mx-auto text-yellow-500 mb-3" />
        </motion.div>
        <h1 className="font-cinzel text-3xl font-bold text-foreground mb-1">Final Standings</h1>
        <p className="text-sm text-muted-foreground">{room.name} — 3-Act Simulation Complete</p>
        <div className="flex justify-center gap-4 mt-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Swords className="w-3 h-3" /> Act 1: 40%</span>
          <span className="flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Act 2: 30%</span>
          <span className="flex items-center gap-1"><Presentation className="w-3 h-3" /> Act 3: 30%</span>
        </div>
      </div>

      <div className="space-y-4">
        {activeTeams.map((team, idx) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.15 }}
          >
            <Card style={{
              borderColor: idx === 0 ? team.color : undefined,
              borderWidth: idx === 0 ? 2 : undefined,
            }}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="shrink-0">{getMedal(idx)}</div>
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ background: team.color }} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-cinzel font-bold text-foreground">{team.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      vs {getIncumbentName(team.incumbent_id)} · {members.filter(m => m.team_id === team.id).length} members
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-foreground shrink-0">{team.final}</p>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <Swords className="w-4 h-4 mx-auto text-destructive mb-1" />
                    <p className="text-lg font-bold text-foreground">{team.act1}</p>
                    <p className="text-[11px] text-muted-foreground">Scout</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <Lightbulb className="w-4 h-4 mx-auto text-primary mb-1" />
                    <p className="text-lg font-bold text-foreground">{team.act2}</p>
                    <p className="text-[11px] text-muted-foreground">Build</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <Presentation className="w-4 h-4 mx-auto text-yellow-500 mb-1" />
                    <p className="text-lg font-bold text-foreground">{team.act3}</p>
                    <p className="text-[11px] text-muted-foreground">Pitch</p>
                  </div>
                </div>

                <Progress value={team.final} className="h-2" />

                {(team.score_result as any)?.title && (
                  <Badge className="mt-2 text-xs" style={{ background: team.color }}>
                    {(team.score_result as any).title}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-8">
        <Button onClick={onBack} size="lg">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Arena
        </Button>
      </div>
    </div>
  );
}

function calculateVentureScore(canvas: any): number {
  let score = 0;
  const keys = ["lean-canvas", "market-sizing", "gtm-playbook", "unit-economics", "moat-defense"];
  for (const key of keys) {
    if (canvas?.[key]) score += 20;
  }
  return score;
}
