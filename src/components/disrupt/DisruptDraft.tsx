import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { INDUSTRY_CLUSTERS, type IndustryCluster, type DisruptionIncumbent } from "@/data/disruption-incumbents";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Shield, Swords, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { DisruptRoom, DisruptTeam, DisruptMember } from "./DisruptLobby";

export function DisruptDraft({
  room,
  teams,
  members,
  myTeamId,
  onBattleStart,
}: {
  room: DisruptRoom;
  teams: DisruptTeam[];
  members: DisruptMember[];
  myTeamId: string | null;
  onBattleStart: () => void;
}) {
  const { user } = useAuth();
  const [selectedCluster, setSelectedCluster] = useState<IndustryCluster | null>(null);
  const [draftedIds, setDraftedIds] = useState<Set<number>>(new Set());
  const isHost = user && room.created_by === user.id;
  const myTeam = teams.find(t => t.id === myTeamId);

  // Track which incumbents are already drafted
  useEffect(() => {
    const ids = new Set<number>();
    teams.forEach(t => { if (t.incumbent_id) ids.add(Number(t.incumbent_id)); });
    setDraftedIds(ids);
  }, [teams]);

  async function pickIncumbent(cluster: IndustryCluster, incumbent: DisruptionIncumbent) {
    if (!myTeamId) { toast.error("Join a team first"); return; }
    if (draftedIds.has(incumbent.id)) { toast.error("Already taken by another team"); return; }

    const { error } = await supabase
      .from("disrupt_teams")
      .update({ incumbent_id: incumbent.id, cluster_id: cluster.id })
      .eq("id", myTeamId);

    if (error) { toast.error("Failed to draft incumbent"); return; }
    toast.success(`Drafted ${incumbent.name}!`);
  }

  async function startBattles() {
    if (!isHost) return;
    const activeTeams = teams.filter(t => members.some(m => m.team_id === t.id));
    const undrafted = activeTeams.filter(t => !t.incumbent_id);
    if (undrafted.length > 0) { toast.error(`${undrafted.length} team(s) haven't picked an incumbent`); return; }

    const now = new Date();
    const endsAt = new Date(now.getTime() + room.duration_minutes * 60 * 1000);

    await supabase.from("disrupt_rooms").update({
      status: "battling",
      started_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
    }).eq("id", room.id);
  }

  const activeTeams = teams.filter(t => members.some(m => m.team_id === t.id));

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Draft Header */}
      <div className="text-center mb-6">
        <h1 className="font-cinzel text-3xl font-bold text-foreground mb-2">⚔️ Draft Phase</h1>
        <p className="text-muted-foreground text-sm">Each team picks an incumbent to disrupt. No duplicates!</p>
      </div>

      {/* Team draft status */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {activeTeams.map(team => (
          <Badge
            key={team.id}
            variant={team.incumbent_id ? "default" : "outline"}
            style={team.incumbent_id ? { background: team.color } : { borderColor: team.color, color: team.color }}
            className="text-xs py-1 px-3"
          >
            {team.incumbent_id ? <Check className="w-3 h-3 mr-1" /> : null}
            {team.name}: {team.incumbent_id
              ? INDUSTRY_CLUSTERS.flatMap(c => c.incumbents).find(i => i.id === team.incumbent_id)?.name || "Selected"
              : "Drafting..."}
          </Badge>
        ))}
      </div>

      {myTeam?.incumbent_id ? (
        <div className="text-center mb-8">
          <Card className="inline-block border-2" style={{ borderColor: myTeam.color }}>
            <CardContent className="py-4 px-8">
              <p className="text-sm text-muted-foreground">Your target:</p>
              <p className="font-cinzel text-xl font-bold text-foreground">
                {INDUSTRY_CLUSTERS.flatMap(c => c.incumbents).find(i => i.id === myTeam.incumbent_id)?.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Waiting for all teams to draft...</p>
            </CardContent>
          </Card>
        </div>
      ) : selectedCluster ? (
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => setSelectedCluster(null)} className="mb-3">
            ← Back to clusters
          </Button>
          <h2 className="font-cinzel text-xl font-bold mb-4" style={{ color: `hsl(${selectedCluster.color})` }}>
            {selectedCluster.emoji} {selectedCluster.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedCluster.incumbents.map(inc => {
              const taken = draftedIds.has(inc.id);
              return (
                <Card key={inc.id} className={`transition-all ${taken ? "opacity-40" : "hover:border-primary/50 cursor-pointer"}`}>
                  <CardContent className="pt-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-destructive shrink-0" />
                        <span className="font-cinzel font-bold text-sm text-foreground truncate">{inc.name}</span>
                        {taken && <Badge variant="secondary" className="text-[10px]">Taken</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{inc.vulnerability}</p>
                    </div>
                    {!taken && (
                      <Button size="sm" onClick={() => pickIncumbent(selectedCluster, inc)}>
                        <Swords className="w-3 h-3 mr-1" /> Draft
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {INDUSTRY_CLUSTERS.map(cluster => (
            <motion.div key={cluster.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card
                className="cursor-pointer hover:border-primary/50 transition-all h-full"
                onClick={() => setSelectedCluster(cluster)}
              >
                <CardContent className="pt-4">
                  <span className="text-xl">{cluster.emoji}</span>
                  <p className="font-cinzel text-sm font-bold mt-1" style={{ color: `hsl(${cluster.color})` }}>
                    {cluster.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">{cluster.incumbents.length} targets</p>
                  <div className="flex items-center gap-1 text-[10px] text-primary mt-2">
                    Browse <ChevronRight className="w-3 h-3" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Host start button */}
      {isHost && (
        <div className="text-center mt-8">
          <Button onClick={startBattles} size="lg">
            <Swords className="w-4 h-4 mr-2" /> Start All Battles
          </Button>
        </div>
      )}
    </div>
  );
}
