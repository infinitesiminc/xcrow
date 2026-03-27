import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, LogIn, Crown, Swords, Copy, Clock, ArrowLeft, Trash2, Play } from "lucide-react";
import { toast } from "sonner";

export interface DisruptRoom {
  id: string;
  room_code: string;
  name: string;
  created_by: string;
  status: string;
  duration_minutes: number;
  max_teams: number;
  max_team_size: number;
  started_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export interface DisruptTeam {
  id: string;
  room_id: string;
  name: string;
  color: string;
  incumbent_id: string | null;
  cluster_id: string | null;
  current_step: number;
  total_score: number;
  step_scores: any;
  battle_transcript: any;
  score_result: any;
  completed_at: string | null;
  venture_canvas: any;
  pitch_data: any;
  act: number;
}

export interface DisruptMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
}

const TEAM_COLORS = [
  "#8B5CF6", "#EF4444", "#3B82F6", "#10B981",
  "#F59E0B", "#EC4899", "#06B6D4", "#F97316",
];

const TEAM_NAME_PRESETS = [
  "Alpha Disruptors", "Blitz Brigade", "Chaos Engineers", "Dark Horses",
  "Edge Runners", "Flank Force", "Guerrilla Squad", "Hackers United",
];

export function DisruptLobby({
  onStartSolo,
  onEnterRoom,
}: {
  onStartSolo: () => void;
  onEnterRoom: (room: DisruptRoom, teams: DisruptTeam[], members: DisruptMember[], myTeamId: string | null) => void;
}) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"menu" | "create" | "join" | "lobby">("menu");
  const [roomName, setRoomName] = useState("Disruption Battle");
  const [duration, setDuration] = useState(30);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Live room state
  const [room, setRoom] = useState<DisruptRoom | null>(null);
  const [teams, setTeams] = useState<DisruptTeam[]>([]);
  const [members, setMembers] = useState<DisruptMember[]>([]);

  const isHost = room && user && room.created_by === user.id;
  const myMembership = members.find(m => m.user_id === user?.id);
  const myTeamId = myMembership?.team_id || null;

  // Subscribe to realtime updates when in lobby
  useEffect(() => {
    if (!room) return;

    const roomChannel = supabase
      .channel(`disrupt-room-${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "disrupt_rooms", filter: `id=eq.${room.id}` }, (payload) => {
        if (payload.eventType === "UPDATE") setRoom(payload.new as DisruptRoom);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "disrupt_teams", filter: `room_id=eq.${room.id}` }, () => {
        fetchTeamsAndMembers(room.id);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "disrupt_team_members" }, () => {
        fetchTeamsAndMembers(room.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(roomChannel); };
  }, [room?.id]);

  // When room status changes to drafting/battling, notify parent
  useEffect(() => {
    if (room && (room.status === "drafting" || room.status === "battling")) {
      onEnterRoom(room, teams, members, myTeamId);
    }
  }, [room?.status]);

  async function fetchTeamsAndMembers(roomId: string) {
    const [tRes, mRes] = await Promise.all([
      supabase.from("disrupt_teams").select("*").eq("room_id", roomId),
      supabase.from("disrupt_team_members").select("*").in(
        "team_id",
        (await supabase.from("disrupt_teams").select("id").eq("room_id", roomId)).data?.map(t => t.id) || []
      ),
    ]);
    if (tRes.data) setTeams(tRes.data as DisruptTeam[]);
    if (mRes.data) setMembers(mRes.data as DisruptMember[]);
  }

  async function createRoom() {
    if (!user) { toast.error("Please sign in first"); return; }
    setLoading(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data, error } = await supabase.from("disrupt_rooms").insert({
      room_code: code,
      name: roomName,
      created_by: user.id,
      duration_minutes: duration,
    }).select().single();

    if (error) { toast.error("Failed to create room"); setLoading(false); return; }
    setRoom(data as DisruptRoom);

    // Create default teams
    const teamInserts = TEAM_NAME_PRESETS.slice(0, 4).map((name, i) => ({
      room_id: data.id,
      name,
      color: TEAM_COLORS[i],
    }));
    await supabase.from("disrupt_teams").insert(teamInserts);
    await fetchTeamsAndMembers(data.id);
    setMode("lobby");
    setLoading(false);
    toast.success(`Room created! Code: ${code}`);
  }

  async function joinRoom() {
    if (!user) { toast.error("Please sign in first"); return; }
    if (!joinCode.trim()) return;
    setLoading(true);

    const { data: roomData, error } = await supabase
      .from("disrupt_rooms")
      .select("*")
      .eq("room_code", joinCode.trim().toUpperCase())
      .single();

    if (error || !roomData) { toast.error("Room not found"); setLoading(false); return; }
    if (roomData.status !== "lobby") { toast.error("This room has already started"); setLoading(false); return; }

    setRoom(roomData as DisruptRoom);
    await fetchTeamsAndMembers(roomData.id);
    setMode("lobby");
    setLoading(false);
  }

  async function joinTeam(teamId: string) {
    if (!user) return;
    // Leave existing team first
    if (myMembership) {
      await supabase.from("disrupt_team_members").delete().eq("id", myMembership.id);
    }
    const { error } = await supabase.from("disrupt_team_members").insert({
      team_id: teamId,
      user_id: user.id,
      role: "member",
    });
    if (error) { toast.error("Failed to join team"); return; }
    if (room) await fetchTeamsAndMembers(room.id);
  }

  async function startGame() {
    if (!room || !isHost) return;
    // Check all teams have members
    const activeTeams = teams.filter(t => members.some(m => m.team_id === t.id));
    if (activeTeams.length < 2) { toast.error("Need at least 2 teams with members"); return; }

    await supabase.from("disrupt_rooms").update({ status: "drafting" }).eq("id", room.id);
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 text-center">
        <Swords className="w-16 h-16 mx-auto text-primary mb-4" />
        <h1 className="font-cinzel text-3xl font-bold text-foreground mb-4">Disruption Arena</h1>
        <p className="text-muted-foreground mb-6">Sign in to create or join a team battle room</p>
        <Button onClick={onStartSolo} size="lg" variant="outline">
          <Swords className="w-4 h-4 mr-2" /> Play Solo Instead
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <AnimatePresence mode="wait">
        {mode === "menu" && (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            <Swords className="w-16 h-16 mx-auto text-primary mb-4" />
            <h1 className="font-cinzel text-3xl font-bold text-foreground mb-2">Disruption Arena</h1>
            <p className="text-muted-foreground mb-8">Battle incumbent CEOs with your team</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:border-primary/50 transition-all" onClick={() => setMode("create")}>
                <CardContent className="pt-6 text-center">
                  <Plus className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="font-cinzel font-bold text-foreground">Create Room</p>
                  <p className="text-xs text-muted-foreground mt-1">Host a class battle</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-primary/50 transition-all" onClick={() => setMode("join")}>
                <CardContent className="pt-6 text-center">
                  <LogIn className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="font-cinzel font-bold text-foreground">Join Room</p>
                  <p className="text-xs text-muted-foreground mt-1">Enter room code</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-primary/50 transition-all" onClick={onStartSolo}>
                <CardContent className="pt-6 text-center">
                  <Swords className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-cinzel font-bold text-foreground">Solo Mode</p>
                  <p className="text-xs text-muted-foreground mt-1">Practice alone</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {mode === "create" && (
          <motion.div key="create" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <Button variant="ghost" size="sm" onClick={() => setMode("menu")} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Card>
              <CardHeader>
                <CardTitle className="font-cinzel">Create Battle Room</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Room Name</label>
                  <input
                    value={roomName}
                    onChange={e => setRoomName(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Duration</label>
                  <div className="flex gap-2 mt-1">
                    {[15, 30, 45, 60].map(d => (
                      <Button key={d} variant={duration === d ? "default" : "outline"} size="sm" onClick={() => setDuration(d)}>
                        {d}m
                      </Button>
                    ))}
                  </div>
                </div>
                <Button onClick={createRoom} disabled={loading} className="w-full">
                  {loading ? "Creating..." : "Create Room"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {mode === "join" && (
          <motion.div key="join" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <Button variant="ghost" size="sm" onClick={() => setMode("menu")} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Card>
              <CardHeader>
                <CardTitle className="font-cinzel">Join Battle Room</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Room Code</label>
                  <input
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character code"
                    maxLength={6}
                    className="w-full mt-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm tracking-widest text-center text-lg font-bold focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <Button onClick={joinRoom} disabled={loading || joinCode.length < 4} className="w-full">
                  {loading ? "Joining..." : "Join Room"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {mode === "lobby" && room && (
          <motion.div key="lobby" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Room Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-cinzel text-2xl font-bold text-foreground">{room.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <button
                    onClick={() => { navigator.clipboard.writeText(room.room_code); toast.success("Code copied!"); }}
                    className="flex items-center gap-1 text-primary font-mono text-lg font-bold hover:underline"
                  >
                    {room.room_code} <Copy className="w-4 h-4" />
                  </button>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" /> {room.duration_minutes}m
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {members.length} players
                  </Badge>
                </div>
              </div>
              {isHost && (
                <Button onClick={startGame} size="lg" className="gap-2">
                  <Play className="w-4 h-4" /> Start Game
                </Button>
              )}
            </div>

            {/* Share code banner */}
            <Card className="mb-6 bg-primary/5 border-primary/20">
              <CardContent className="py-4 text-center">
                <p className="text-sm text-muted-foreground">Share this code with your class:</p>
                <p className="font-mono text-4xl font-bold text-primary tracking-[0.3em] mt-1">{room.room_code}</p>
              </CardContent>
            </Card>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teams.map((team) => {
                const teamMembers = members.filter(m => m.team_id === team.id);
                const isMyTeam = myTeamId === team.id;
                const isFull = teamMembers.length >= room.max_team_size;

                return (
                  <Card
                    key={team.id}
                    className="transition-all"
                    style={{ borderColor: isMyTeam ? team.color : undefined, borderWidth: isMyTeam ? 2 : undefined }}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: team.color }} />
                          <h3 className="font-cinzel font-bold text-foreground text-sm">{team.name}</h3>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {teamMembers.length}/{room.max_team_size}
                        </Badge>
                      </div>

                      <div className="space-y-1 mb-3 min-h-[40px]">
                        {teamMembers.map((m) => (
                          <div key={m.id} className="flex items-center gap-2 text-xs text-foreground/80">
                            <Users className="w-3 h-3" />
                            <span>{m.user_id === user?.id ? "You" : m.user_id.slice(0, 8)}</span>
                            {m.role === "captain" && <Crown className="w-3 h-3 text-yellow-500" />}
                          </div>
                        ))}
                        {teamMembers.length === 0 && (
                          <p className="text-xs text-muted-foreground italic">No members yet</p>
                        )}
                      </div>

                      {isMyTeam ? (
                        <Badge style={{ background: team.color }} className="text-white text-xs">Your Team</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => joinTeam(team.id)}
                          disabled={isFull}
                          className="w-full text-xs"
                        >
                          {isFull ? "Full" : "Join Team"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {!isHost && !myTeamId && (
              <p className="text-center text-sm text-muted-foreground mt-6 animate-pulse">
                ⚔️ Pick a team to join the battle!
              </p>
            )}
            {!isHost && myTeamId && (
              <p className="text-center text-sm text-muted-foreground mt-6 animate-pulse">
                Waiting for the host to start the game...
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
