import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { INDUSTRY_CLUSTERS } from "@/data/disruption-incumbents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Presentation, Send, Star, ChevronLeft, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import type { DisruptRoom, DisruptTeam, DisruptMember } from "./DisruptLobby";

type ChatMsg = { role: "user" | "assistant"; content: string };

interface PitchDeck {
  slides: { title: string; bullets: string[]; speakerNotes: string }[];
  startupName: string;
  tagline: string;
}

export function DisruptPitchBattle({
  room, team, teams, members, onComplete,
}: {
  room: DisruptRoom;
  team: DisruptTeam;
  teams: DisruptTeam[];
  members: DisruptMember[];
  onComplete: () => void;
}) {
  const { user } = useAuth();
  const cluster = INDUSTRY_CLUSTERS.find(c => String(c.id) === team.cluster_id);
  const incumbent = cluster?.incumbents.find(i => String(i.id) === team.incumbent_id);

  const [pitchDeck, setPitchDeck] = useState<PitchDeck | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<"deck" | "qa" | "vote">("deck");

  // VC Q&A state
  const [qaMessages, setQaMessages] = useState<ChatMsg[]>([]);
  const [qaInput, setQaInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Voting state
  const [votes, setVotes] = useState<Record<string, { viability: number; clarity: number; defensibility: number }>>({});
  const [hasVoted, setHasVoted] = useState<Set<string>>(new Set());

  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  // Generate pitch deck on mount
  useEffect(() => {
    if (!incumbent || !cluster) return;
    generatePitch();
  }, []);

  const generatePitch = async () => {
    if (!incumbent || !cluster) return;
    setIsGenerating(true);
    try {
      const battleTranscript = Array.isArray(team.battle_transcript)
        ? (team.battle_transcript as any[]).map((m: any) => `${m.role}: ${m.content}`).join("\n").slice(0, 3000)
        : "";

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disruption-battle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            action: "generate-pitch",
            payload: {
              incumbent, cluster,
              battleTranscript,
              ventureCanvas: team.venture_canvas,
            },
          }),
        },
      );

      if (!resp.ok) throw new Error("Failed to generate pitch");
      const data = await resp.json();
      setPitchDeck(data);

      // Save pitch data
      if (team.id !== "solo") {
        await supabase.from("disrupt_teams").update({
          pitch_data: data as any,
          act: 3,
        }).eq("id", team.id);
      }
    } catch {
      toast.error("Pitch generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const sendQA = async () => {
    if (!qaInput.trim() || isStreaming || !incumbent || !cluster) return;

    const userMsg: ChatMsg = { role: "user", content: qaInput.trim() };
    const updated = [...qaMessages, userMsg];
    setQaMessages(updated);
    setQaInput("");
    setIsStreaming(true);
    scrollToBottom();

    let assistantContent = "";

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disruption-battle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            action: "vc-qa",
            payload: { incumbent, cluster, pitchData: pitchDeck, messages: updated },
          }),
        },
      );

      if (!resp.ok || !resp.body) throw new Error("VC Q&A failed");

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
              setQaMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length === updated.length + 1) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
              scrollToBottom();
            }
          } catch { /* partial */ }
        }
      }
    } catch {
      toast.error("VC Q&A failed");
    } finally {
      setIsStreaming(false);
    }
  };

  const submitVote = async (teamId: string) => {
    if (!user || !votes[teamId]) return;
    const v = votes[teamId];
    const { error } = await supabase.from("disrupt_votes").insert({
      room_id: room.id,
      voter_id: user.id,
      team_id: teamId,
      viability: v.viability,
      clarity: v.clarity,
      defensibility: v.defensibility,
    });
    if (error) {
      if (error.code === "23505") toast.info("Already voted for this team");
      else toast.error("Vote failed");
      return;
    }
    setHasVoted(prev => new Set([...prev, teamId]));
    toast.success("Vote submitted!");
  };

  const finishPitch = async () => {
    await supabase.from("disrupt_teams").update({
      pitch_data: pitchDeck as any,
      act: 3,
    }).eq("id", team.id);
    onComplete();
  };

  if (!incumbent || !cluster) return <p className="text-center text-muted-foreground">Loading...</p>;

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Mode Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: team.color }} />
          <Badge variant="outline" className="text-xs">Act 3: Pitch</Badge>
          <span className="font-cinzel font-bold text-sm text-foreground">
            {pitchDeck?.startupName || "Your Startup"}
          </span>
        </div>
        <div className="flex gap-1">
          {(["deck", "qa", "vote"] as const).map(m => (
            <Button
              key={m}
              size="sm"
              variant={mode === m ? "default" : "ghost"}
              onClick={() => setMode(m)}
              className="text-xs"
            >
              {m === "deck" ? "📊 Deck" : m === "qa" ? "💼 VC Q&A" : "⭐ Vote"}
            </Button>
          ))}
        </div>
      </div>

      {/* Deck View */}
      {mode === "deck" && (
        <div className="space-y-4">
          {isGenerating ? (
            <Card className="py-16 text-center">
              <Presentation className="w-12 h-12 mx-auto text-primary animate-pulse mb-4" />
              <p className="text-muted-foreground">AI is generating your pitch deck...</p>
            </Card>
          ) : pitchDeck ? (
            <>
              {pitchDeck.tagline && (
                <p className="text-center text-sm text-muted-foreground italic mb-2">"{pitchDeck.tagline}"</p>
              )}
              <Card className="overflow-hidden" style={{ borderColor: team.color, borderWidth: 2 }}>
                <CardContent className="pt-6 pb-8 min-h-[300px]">
                  <Badge className="mb-4 text-xs" style={{ background: team.color }}>
                    Slide {currentSlide + 1}/{pitchDeck.slides.length}
                  </Badge>
                  <h2 className="font-cinzel text-2xl font-bold text-foreground mb-6">
                    {pitchDeck.slides[currentSlide].title}
                  </h2>
                  <ul className="space-y-3">
                    {pitchDeck.slides[currentSlide].bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-3 text-foreground">
                        <span className="text-primary mt-0.5">▸</span>
                        <span className="text-sm">{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground italic">
                      💡 {pitchDeck.slides[currentSlide].speakerNotes}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <div className="flex items-center justify-between">
                <Button
                  size="sm" variant="outline"
                  onClick={() => setCurrentSlide(s => Math.max(0, s - 1))}
                  disabled={currentSlide === 0}
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </Button>
                <div className="flex gap-1">
                  {pitchDeck.slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? "bg-primary scale-125" : "bg-muted-foreground/30"}`}
                    />
                  ))}
                </div>
                <Button
                  size="sm" variant="outline"
                  onClick={() => setCurrentSlide(s => Math.min(pitchDeck.slides.length - 1, s + 1))}
                  disabled={currentSlide === pitchDeck.slides.length - 1}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* VC Q&A */}
      {mode === "qa" && (
        <div className="flex flex-col" style={{ height: "calc(100vh - 14rem)" }}>
          <ScrollArea className="flex-1 pr-4 mb-3">
            <div className="space-y-4 pb-4">
              {qaMessages.length === 0 && (
                <Card className="py-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    Start the VC Q&A — type your pitch opening or ask the VCs to begin questioning.
                  </p>
                </Card>
              )}
              {qaMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "text-white rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                    style={msg.role === "user" ? { background: team.color } : undefined}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isStreaming && qaMessages[qaMessages.length - 1]?.role === "user" && (
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
            <Textarea
              value={qaInput}
              onChange={e => setQaInput(e.target.value)}
              placeholder="Defend your pitch..."
              className="min-h-[48px] max-h-[120px] resize-none"
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendQA(); } }}
              disabled={isStreaming}
            />
            <Button onClick={sendQA} disabled={isStreaming || !qaInput.trim()} size="icon" className="shrink-0 self-end">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Voting */}
      {mode === "vote" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center mb-4">
            Rate each team's pitch on three dimensions (1-5 stars)
          </p>
          {teams
            .filter(t => t.id !== team.id && members.some(m => m.team_id === t.id))
            .map(t => {
              const teamVote = votes[t.id] || { viability: 3, clarity: 3, defensibility: 3 };
              const voted = hasVoted.has(t.id);
              const inc = INDUSTRY_CLUSTERS.flatMap(c => c.incumbents).find(i => String(i.id) === t.incumbent_id);

              return (
                <Card key={t.id} className={voted ? "opacity-60" : ""}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                      <span className="font-cinzel font-bold text-sm text-foreground">{t.name}</span>
                      <span className="text-xs text-muted-foreground">vs {inc?.name || "?"}</span>
                    </div>
                    {(["viability", "clarity", "defensibility"] as const).map(dim => (
                      <div key={dim} className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-muted-foreground w-24 capitalize">{dim}</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <button
                              key={n}
                              onClick={() => {
                                if (voted) return;
                                setVotes(prev => ({
                                  ...prev,
                                  [t.id]: { ...teamVote, [dim]: n },
                                }));
                              }}
                              disabled={voted}
                            >
                              <Star
                                className={`w-5 h-5 transition-all ${n <= teamVote[dim] ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      onClick={() => submitVote(t.id)}
                      disabled={voted}
                      className="mt-2 text-xs"
                    >
                      {voted ? "Voted ✓" : "Submit Vote"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      {/* Finish */}
      <div className="mt-6 text-center">
        <Button onClick={finishPitch} size="lg">
          Complete Pitch Phase
        </Button>
      </div>
    </div>
  );
}
