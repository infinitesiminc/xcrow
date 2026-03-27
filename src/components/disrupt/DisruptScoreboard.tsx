import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { INDUSTRY_CLUSTERS } from "@/data/disruption-incumbents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Trophy, Crown, Swords, Medal, ArrowLeft } from "lucide-react";
import type { DisruptRoom, DisruptTeam, DisruptMember } from "./DisruptLobby";

export function DisruptScoreboard({
  room,
  teams: initialTeams,
  members,
  onBack,
}: {
  room: DisruptRoom;
  teams: DisruptTeam[];
  members: DisruptMember[];
  onBack: () => void;
}) {
  const [teams, setTeams] = useState(initialTeams);

  // Real-time team score updates
  useEffect(() => {
    const ch = supabase
      .channel(`scoreboard-${room.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "disrupt_teams", filter: `room_id=eq.${room.id}` }, (payload) => {
        setTeams(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } as DisruptTeam : t));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [room.id]);

  const activeTeams = teams
    .filter(t => members.some(m => m.team_id === t.id))
    .sort((a, b) => (b.total_score || 0) - (a.total_score || 0));

  const allDone = activeTeams.every(t => t.completed_at);
  const getIncumbentName = (id: string | null) =>
    id ? INDUSTRY_CLUSTERS.flatMap(c => c.incumbents).find(i => i.id === id)?.name || "Unknown" : "—";

  const getMedal = (idx: number) => {
    if (idx === 0) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (idx === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (idx === 2) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="text-sm text-muted-foreground font-bold">#{idx + 1}</span>;
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="text-center mb-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
          <Trophy className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
        </motion.div>
        <h1 className="font-cinzel text-3xl font-bold text-foreground mb-2">
          {allDone ? "Final Standings" : "Live Scoreboard"}
        </h1>
        <p className="text-muted-foreground text-sm">{room.name}</p>
        {!allDone && (
          <Badge variant="secondary" className="mt-2 animate-pulse">
            {activeTeams.filter(t => t.completed_at).length}/{activeTeams.length} teams finished
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {activeTeams.map((team, idx) => {
          const teamMembers = members.filter(m => m.team_id === team.id);
          const scoreResult = team.score_result as any;

          return (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card
                className="overflow-hidden"
                style={{ borderColor: idx === 0 && allDone ? team.color : undefined, borderWidth: idx === 0 && allDone ? 2 : undefined }}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="shrink-0">{getMedal(idx)}</div>
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ background: team.color }} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-cinzel font-bold text-foreground">{team.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        vs {getIncumbentName(team.incumbent_id)} · {teamMembers.length} members
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {team.completed_at ? (
                        <p className="text-2xl font-bold text-foreground">{team.total_score}</p>
                      ) : (
                        <Badge variant="outline" className="animate-pulse text-xs">
                          Step {team.current_step}/6
                        </Badge>
                      )}
                    </div>
                  </div>

                  {team.completed_at && (
                    <div className="mt-2">
                      <Progress value={team.total_score} className="h-2 mb-2" />
                      {scoreResult?.dimensions && (
                        <div className="grid grid-cols-3 gap-2">
                          {(scoreResult.dimensions as any[]).slice(0, 6).map((dim: any, i: number) => (
                            <div key={i} className="text-center">
                              <p className="text-lg font-bold text-foreground">{dim.score}</p>
                              <p className="text-[10px] text-muted-foreground line-clamp-1">{dim.name}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {scoreResult?.title && (
                        <Badge className="mt-2" style={{ background: team.color }}>
                          {scoreResult.title}
                        </Badge>
                      )}
                    </div>
                  )}

                  {!team.completed_at && (
                    <div className="flex gap-1">
                      {[1,2,3,4,5,6].map(s => (
                        <div
                          key={s}
                          className="flex-1 h-1.5 rounded-full"
                          style={{
                            background: s <= team.current_step ? team.color : "hsl(var(--muted))",
                            opacity: s <= team.current_step ? 0.8 : 0.2,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {allDone && (
        <div className="text-center mt-8">
          <Button onClick={onBack} size="lg">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Arena
          </Button>
        </div>
      )}
    </div>
  );
}
