import { useState, useRef, useCallback, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { INDUSTRY_CLUSTERS, DISRUPTION_STEPS, DISRUPTION_VECTORS, type IndustryCluster, type DisruptionIncumbent } from "@/data/disruption-incumbents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Shield, Target, ArrowLeft, Send, Trophy, Zap, Map as MapIcon, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DisruptLobby, type DisruptRoom, type DisruptTeam, type DisruptMember } from "@/components/disrupt/DisruptLobby";
import { DisruptDraft } from "@/components/disrupt/DisruptDraft";
import { DisruptTeamBattle } from "@/components/disrupt/DisruptTeamBattle";
import { DisruptScoreboard } from "@/components/disrupt/DisruptScoreboard";
import { DisruptVentureBuild } from "@/components/disrupt/DisruptVentureBuild";
import { DisruptPitchBattle } from "@/components/disrupt/DisruptPitchBattle";
import { DisruptFinalScoreboard } from "@/components/disrupt/DisruptFinalScoreboard";

type GamePhase = "lobby" | "solo-map" | "solo-cluster" | "solo-battle" | "solo-score" | "solo-venture" | "solo-pitch" | "solo-final" | "team-draft" | "team-battle" | "team-venture" | "team-pitch" | "team-scoreboard";
type ChatMsg = { role: "user" | "assistant"; content: string };

interface ScoreResult {
  overall: number;
  dimensions: { name: string; score: number; feedback: string }[];
  title: string;
  summary: string;
  nextSteps: string[];
}

export default function Disrupt() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<GamePhase>("lobby");

  // Solo state
  const [selectedCluster, setSelectedCluster] = useState<IndustryCluster | null>(null);
  const [selectedIncumbent, setSelectedIncumbent] = useState<DisruptionIncumbent | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Team state
  const [room, setRoom] = useState<DisruptRoom | null>(null);
  const [teams, setTeams] = useState<DisruptTeam[]>([]);
  const [members, setMembers] = useState<DisruptMember[]>([]);
  const [myTeamId, setMyTeamId] = useState<string | null>(null);

  // Realtime subscription for team game
  useEffect(() => {
    if (!room || !["team-draft", "team-battle", "team-venture", "team-pitch", "team-scoreboard"].includes(phase)) return;

    const ch = supabase
      .channel(`game-${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "disrupt_rooms", filter: `id=eq.${room.id}` }, (payload) => {
        if (payload.eventType === "UPDATE") {
          const updated = payload.new as DisruptRoom;
          setRoom(updated);
          if (updated.status === "battling" && phase === "team-draft") setPhase("team-battle");
          if (updated.status === "venture") setPhase("team-venture");
          if (updated.status === "pitching" || updated.status === "voting") setPhase("team-pitch");
          if (updated.status === "completed") setPhase("team-scoreboard");
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "disrupt_teams", filter: `room_id=eq.${room.id}` }, () => {
        fetchTeams(room.id);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "disrupt_team_members" }, () => {
        fetchTeams(room.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [room?.id, phase]);

  async function fetchTeams(roomId: string) {
    const { data: t } = await supabase.from("disrupt_teams").select("*").eq("room_id", roomId);
    if (t) setTeams(t as DisruptTeam[]);
    const teamIds = t?.map(x => x.id) || [];
    if (teamIds.length) {
      const { data: m } = await supabase.from("disrupt_team_members").select("*").in("team_id", teamIds);
      if (m) {
        setMembers(m as DisruptMember[]);
        const mine = m.find(x => x.user_id === user?.id);
        if (mine) setMyTeamId(mine.team_id);
      }
    }
  }

  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  const startBattle = (cluster: IndustryCluster, incumbent: DisruptionIncumbent) => {
    setSelectedCluster(cluster);
    setSelectedIncumbent(incumbent);
    setCurrentStep(1);
    setMessages([]);
    setScore(null);
    setPhase("solo-battle");
    const opening: ChatMsg = {
      role: "assistant",
      content: `⚔️ **Welcome to the Disruption Arena, Challenger.**\n\nI am the CEO of **${incumbent.name}** — a titan of the ${cluster.name} industry. ${incumbent.age}. We've weathered every storm and crushed every competitor.\n\n> *"${incumbent.vulnerability}"*\n\nYou think you can disrupt us? Then prove it.\n\n**🔍 Step 1: Find the Vulnerable Incumbent**\n\nStart by identifying our weaknesses. What vulnerability signals do you see in ${incumbent.name}? What makes us ripe for disruption?\n\n*Show me you understand the target before you attack.*`,
    };
    setMessages([opening]);
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || !selectedIncumbent || !selectedCluster) return;
    const userMsg: ChatMsg = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);
    scrollToBottom();
    let assistantContent = "";
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disruption-battle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ action: "battle", payload: { incumbent: selectedIncumbent, cluster: selectedCluster, messages: updatedMessages, step: currentStep } }),
        },
      );
      if (!resp.ok || !resp.body) {
        if (resp.status === 429) { toast.error("Rate limited. Wait a moment."); return; }
        throw new Error("Battle failed");
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length === updatedMessages.length + 1) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
              scrollToBottom();
            }
          } catch { /* partial */ }
        }
      }
      if (assistantContent.includes("STEP") && assistantContent.includes("CONQUERED")) {
        setCurrentStep(s => Math.min(s + 1, 6));
      }
    } catch { toast.error("Battle failed. Try again."); } finally { setIsStreaming(false); }
  };

  const finishBattle = async () => {
    if (!selectedIncumbent || !selectedCluster || isScoring) return;
    setIsScoring(true);
    try {
      const transcript = messages.map(m => `${m.role === "user" ? "STUDENT" : "CEO"}: ${m.content}`).join("\n\n");
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disruption-battle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ action: "score", payload: { incumbent: selectedIncumbent, cluster: selectedCluster, transcript } }),
        },
      );
      if (!resp.ok) throw new Error("Scoring failed");
      const result = await resp.json();
      setScore(result);
      setPhase("solo-score");
    } catch { toast.error("Could not score."); } finally { setIsScoring(false); }
  };

  const myTeam = teams.find(t => t.id === myTeamId);

  return (
    <>
      <Helmet>
        <title>Disrupt — AI Disruption Battle Simulator | Xcrow</title>
        <meta name="description" content="Learn to build disruptive AI companies by battling incumbent CEOs. Interactive MBA-level strategy game." />
      </Helmet>
      <Navbar />
      <div className="min-h-screen bg-background pt-20 pb-12">
        <AnimatePresence mode="wait">
          {phase === "lobby" && (
            <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DisruptLobby
                onStartSolo={() => setPhase("solo-map")}
                onEnterRoom={(r, t, m, tid) => {
                  setRoom(r);
                  setTeams(t);
                  setMembers(m);
                  setMyTeamId(tid);
                  const statusPhaseMap: Record<string, GamePhase> = {
                    battling: "team-battle", venture: "team-venture",
                    pitching: "team-pitch", voting: "team-pitch", completed: "team-scoreboard",
                  };
                  setPhase(statusPhaseMap[r.status] || "team-draft");
                }}
              />
            </motion.div>
          )}

          {phase === "solo-map" && (
            <motion.div key="solo-map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="max-w-7xl mx-auto px-4">
                <Button variant="ghost" size="sm" onClick={() => setPhase("lobby")} className="mb-4">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
              </div>
              <ClusterMap onSelect={(c) => { setSelectedCluster(c); setPhase("solo-cluster"); }} />
            </motion.div>
          )}

          {phase === "solo-cluster" && selectedCluster && (
            <motion.div key="solo-cluster" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <ClusterDetail cluster={selectedCluster} onBack={() => setPhase("solo-map")} onAttack={(inc) => startBattle(selectedCluster, inc)} />
            </motion.div>
          )}

          {phase === "solo-battle" && selectedIncumbent && selectedCluster && (
            <motion.div key="solo-battle" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <BattleArena
                incumbent={selectedIncumbent} cluster={selectedCluster} step={currentStep}
                messages={messages} input={input} setInput={setInput}
                onSend={sendMessage} onFinish={finishBattle} isStreaming={isStreaming}
                isScoring={isScoring} chatEndRef={chatEndRef}
                onBack={() => setPhase("solo-cluster")}
              />
            </motion.div>
          )}

          {phase === "solo-score" && score && selectedIncumbent && (
            <motion.div key="solo-score" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ScoreScreen score={score} incumbent={selectedIncumbent} onReplay={() => setPhase("solo-map")} />
            </motion.div>
          )}

          {phase === "team-draft" && room && (
            <motion.div key="team-draft" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DisruptDraft
                room={room} teams={teams} members={members} myTeamId={myTeamId}
                onBattleStart={() => setPhase("team-battle")}
              />
            </motion.div>
          )}

          {phase === "team-battle" && room && myTeam && (
            <motion.div key="team-battle" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <DisruptTeamBattle
                room={room} team={myTeam}
                onComplete={() => setPhase("team-venture")}
              />
            </motion.div>
          )}

          {phase === "team-venture" && room && myTeam && (
            <motion.div key="team-venture" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <DisruptVentureBuild
                room={room} team={myTeam}
                onComplete={() => setPhase("team-pitch")}
              />
            </motion.div>
          )}

          {phase === "team-pitch" && room && myTeam && (
            <motion.div key="team-pitch" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <DisruptPitchBattle
                room={room} team={myTeam} teams={teams} members={members}
                onComplete={() => setPhase("team-scoreboard")}
              />
            </motion.div>
          )}

          {phase === "team-scoreboard" && room && (
            <motion.div key="team-scoreboard" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <DisruptFinalScoreboard
                room={room} teams={teams} members={members}
                onBack={() => { setRoom(null); setPhase("lobby"); }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </>
  );
}

/* ── Solo Components (kept inline) ── */

function ClusterMap({ onSelect }: { onSelect: (c: IndustryCluster) => void }) {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Swords className="w-4 h-4" /> Solo Mode
        </div>
        <h1 className="font-cinzel text-4xl md:text-5xl font-bold text-foreground mb-4">
          Choose Your <span className="text-primary">Battlefield</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          100 vulnerable incumbents across 22 industry clusters. Pick your target and battle the CEO.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {DISRUPTION_VECTORS.map(v => (
            <Badge key={v.vector} variant="outline" className="text-xs">{v.emoji} {v.vector}: {v.description}</Badge>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {INDUSTRY_CLUSTERS.map((cluster) => (
          <motion.div key={cluster.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card className="cursor-pointer hover:border-primary/50 transition-all group h-full" onClick={() => onSelect(cluster)} style={{ borderColor: `hsl(${cluster.color} / 0.2)` }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{cluster.emoji}</span>
                  <Badge variant="secondary" className="text-xs">{cluster.incumbents.length} targets</Badge>
                </div>
                <CardTitle className="text-base font-cinzel" style={{ color: `hsl(${cluster.color})` }}>{cluster.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{cluster.timingCatalyst}</p>
                <div className="flex flex-wrap gap-1">
                  {cluster.incumbents.slice(0, 3).map(inc => (<Badge key={inc.id} variant="outline" className="text-[10px]">{inc.name}</Badge>))}
                  {cluster.incumbents.length > 3 && <Badge variant="outline" className="text-[10px]">+{cluster.incumbents.length - 3}</Badge>}
                </div>
                <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Enter Battlefield <ChevronRight className="w-3 h-3" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <div className="mt-16 max-w-4xl mx-auto">
        <h2 className="font-cinzel text-2xl font-bold text-center mb-8 text-foreground">The 6-Step Disruption Framework</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DISRUPTION_STEPS.map((s) => (
            <Card key={s.step} className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{s.emoji}</span>
                  <div>
                    <Badge variant="secondary" className="text-[10px] mb-1">Step {s.step}</Badge>
                    <p className="font-cinzel font-semibold text-sm text-foreground">{s.title}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClusterDetail({ cluster, onBack, onAttack }: { cluster: IndustryCluster; onBack: () => void; onAttack: (inc: DisruptionIncumbent) => void }) {
  return (
    <div className="max-w-5xl mx-auto px-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Map</Button>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{cluster.emoji}</span>
          <h1 className="font-cinzel text-3xl font-bold" style={{ color: `hsl(${cluster.color})` }}>{cluster.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning" />
          <p className="text-sm text-muted-foreground">{cluster.timingCatalyst}</p>
        </div>
      </div>
      <div className="space-y-4">
        {cluster.incumbents.map((inc) => (
          <Card key={inc.id} className="hover:border-primary/40 transition-all">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-destructive" />
                    <h3 className="font-cinzel font-bold text-lg text-foreground">{inc.name}</h3>
                    <Badge variant="outline" className="text-[10px]">{inc.age}</Badge>
                    <Badge className="text-[10px]" style={{ background: `hsl(${cluster.color})` }}>{inc.vector}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground font-medium mb-1">🔍 Vulnerability</p><p className="text-foreground/80 text-xs">{inc.vulnerability}</p></div>
                    <div><p className="text-xs text-muted-foreground font-medium mb-1">⚔️ Asymmetric Angle</p><p className="text-foreground/80 text-xs">{inc.asymmetricAngle}</p></div>
                    <div><p className="text-xs text-muted-foreground font-medium mb-1">🏰 Beachhead Niche</p><p className="text-foreground/80 text-xs">{inc.beachheadNiche}</p></div>
                    <div><p className="text-xs text-muted-foreground font-medium mb-1">💰 Disruptor Model</p><p className="text-foreground/80 text-xs">{inc.disruptorModel}</p></div>
                  </div>
                  {inc.existingDisruptor && <p className="text-xs text-muted-foreground mt-2">⚡ Real disruptor: <span className="text-primary font-medium">{inc.existingDisruptor}</span></p>}
                </div>
                <Button onClick={() => onAttack(inc)} className="shrink-0" style={{ background: `hsl(${cluster.color})` }}>
                  <Swords className="w-4 h-4 mr-1" /> Battle CEO
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BattleArena({
  incumbent, cluster, step, messages, input, setInput, onSend, onFinish, isStreaming, isScoring, chatEndRef, onBack,
}: {
  incumbent: DisruptionIncumbent; cluster: IndustryCluster; step: number; messages: ChatMsg[];
  input: string; setInput: (v: string) => void; onSend: () => void; onFinish: () => void;
  isStreaming: boolean; isScoring: boolean; chatEndRef: React.RefObject<HTMLDivElement>; onBack: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 flex flex-col" style={{ height: "calc(100vh - 8rem)" }}>
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0"><ArrowLeft className="w-4 h-4" /></Button>
          <Shield className="w-5 h-5 text-destructive shrink-0" />
          <div className="min-w-0">
            <h2 className="font-cinzel font-bold text-sm truncate">{incumbent.name}</h2>
            <p className="text-[10px] text-muted-foreground truncate">{cluster.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs shrink-0">Step {step}/6</Badge>
          <Button size="sm" variant="secondary" onClick={onFinish} disabled={isScoring || messages.length < 4}>
            {isScoring ? "Scoring..." : "End Battle"}<Trophy className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
      <div className="mb-3 shrink-0">
        <div className="flex gap-1 mb-1">
          {DISRUPTION_STEPS.map((s) => (
            <div key={s.step} className="flex-1 h-2 rounded-full transition-all" style={{ background: s.step <= step ? `hsl(${cluster.color})` : "hsl(var(--muted))", opacity: s.step === step ? 1 : s.step < step ? 0.6 : 0.2 }} />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">{DISRUPTION_STEPS[step - 1]?.emoji} {DISRUPTION_STEPS[step - 1]?.title}</p>
      </div>
      <ScrollArea className="flex-1 pr-4 mb-3">
        <div className="space-y-4 pb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>blockquote]:border-l-primary/50">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isStreaming && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce [animation-delay:0.1s]" />
                  <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>
      <div className="flex gap-2 shrink-0 pb-2">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Your disruption strategy for Step ${step}...`} className="min-h-[48px] max-h-[120px] resize-none" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }} disabled={isStreaming} />
        <Button onClick={onSend} disabled={isStreaming || !input.trim()} size="icon" className="shrink-0 self-end"><Send className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

function ScoreScreen({ score, incumbent, onReplay }: { score: ScoreResult; incumbent: DisruptionIncumbent; onReplay: () => void }) {
  const getGrade = (s: number) => s >= 90 ? "S" : s >= 80 ? "A" : s >= 70 ? "B" : s >= 60 ? "C" : "D";
  const getColor = (s: number) => s >= 80 ? "text-green-500" : s >= 60 ? "text-yellow-500" : "text-red-500";

  return (
    <div className="max-w-3xl mx-auto px-4 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
        <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
      </motion.div>
      <h1 className="font-cinzel text-3xl font-bold text-foreground mb-2">Battle Complete</h1>
      <p className="text-muted-foreground mb-2">vs. {incumbent.name}</p>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="inline-flex items-center gap-4 bg-card border border-border rounded-2xl p-6 mb-8">
          <div className={`text-6xl font-cinzel font-bold ${getColor(score.overall)}`}>{getGrade(score.overall)}</div>
          <div className="text-left">
            <p className="text-4xl font-bold text-foreground">{score.overall}</p>
            <p className="text-sm text-primary font-medium">{score.title}</p>
          </div>
        </div>
      </motion.div>
      <Card className="mb-6 text-left">
        <CardContent className="pt-6">
          <p className="text-sm text-foreground mb-4">{score.summary}</p>
          <div className="space-y-3">
            {score.dimensions?.map((dim, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-foreground font-medium">{dim.name}</span>
                  <span className={`font-bold ${getColor(dim.score)}`}>{dim.score}</span>
                </div>
                <Progress value={dim.score} className="h-2 mb-1" />
                <p className="text-xs text-muted-foreground">{dim.feedback}</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
      {score.nextSteps && (
        <Card className="mb-8 text-left">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-cinzel">⚔️ Next Steps</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {score.nextSteps.map((step, i) => (<li key={i} className="text-sm text-foreground flex gap-2"><span className="text-primary shrink-0">→</span>{step}</li>))}
            </ul>
          </CardContent>
        </Card>
      )}
      <Button onClick={onReplay} size="lg"><MapIcon className="w-4 h-4 mr-2" /> Back to Battlefield</Button>
    </div>
  );
}
