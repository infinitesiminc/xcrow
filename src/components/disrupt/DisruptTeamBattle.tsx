import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { INDUSTRY_CLUSTERS, DISRUPTION_STEPS, type IndustryCluster, type DisruptionIncumbent } from "@/data/disruption-incumbents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Send, Trophy, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import type { DisruptRoom, DisruptTeam } from "./DisruptLobby";

type ChatMsg = { role: "user" | "assistant"; content: string };

export function DisruptTeamBattle({
  room,
  team,
  onComplete,
}: {
  room: DisruptRoom;
  team: DisruptTeam;
  onComplete: () => void;
}) {
  const cluster = INDUSTRY_CLUSTERS.find(c => String(c.id) === team.cluster_id);
  const incumbent = cluster?.incumbents.find(i => String(i.id) === team.incumbent_id);

  const [currentStep, setCurrentStep] = useState(team.current_step || 1);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  // Timer
  useEffect(() => {
    if (!room.ends_at) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, new Date(room.ends_at!).getTime() - Date.now());
      setTimeLeft(Math.ceil(remaining / 1000));
      if (remaining <= 0) { clearInterval(interval); finishBattle(); }
    }, 1000);
    return () => clearInterval(interval);
  }, [room.ends_at]);

  // Opening message
  useEffect(() => {
    if (!incumbent || !cluster || messages.length > 0) return;
    const opening: ChatMsg = {
      role: "assistant",
      content: `⚔️ **Team Battle Begins!**\n\nI am the CEO of **${incumbent.name}** — a titan of ${cluster.name}.\n\n> *"${incumbent.vulnerability}"*\n\n**🔍 Step 1: Find the Vulnerable Incumbent**\n\nIdentify our weaknesses. What vulnerability signals do you see? Work with your team and send your combined strategy.`,
    };
    setMessages([opening]);
  }, [incumbent, cluster]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || !incumbent || !cluster) return;

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
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            action: "battle",
            payload: { incumbent, cluster, messages: updatedMessages, step: currentStep },
          }),
        },
      );

      if (!resp.ok || !resp.body) throw new Error("Battle failed");

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
        const nextStep = Math.min(currentStep + 1, 6);
        setCurrentStep(nextStep);
        // Save progress
        await supabase.from("disrupt_teams").update({ current_step: nextStep }).eq("id", team.id);
      }
    } catch (err) {
      toast.error("Battle communication failed");
    } finally {
      setIsStreaming(false);
    }
  };

  const finishBattle = async () => {
    if (!incumbent || !cluster || isScoring) return;
    setIsScoring(true);

    try {
      const transcript = messages.map(m => `${m.role === "user" ? "TEAM" : "CEO"}: ${m.content}`).join("\n\n");
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disruption-battle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            action: "score",
            payload: { incumbent, cluster, transcript },
          }),
        },
      );

      if (!resp.ok) throw new Error("Scoring failed");
      const result = await resp.json();

      await supabase.from("disrupt_teams").update({
        total_score: result.overall || 0,
        score_result: result,
        battle_transcript: messages,
        completed_at: new Date().toISOString(),
      }).eq("id", team.id);

      onComplete();
    } catch (err) {
      toast.error("Scoring failed");
    } finally {
      setIsScoring(false);
    }
  };

  if (!incumbent || !cluster) return <p className="text-center text-muted-foreground">Loading battle...</p>;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="max-w-4xl mx-auto px-4 flex flex-col" style={{ height: "calc(100vh - 8rem)" }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: team.color }} />
          <Shield className="w-5 h-5 text-destructive shrink-0" />
          <div className="min-w-0">
            <h2 className="font-cinzel font-bold text-sm truncate">{team.name} vs {incumbent.name}</h2>
            <p className="text-[10px] text-muted-foreground truncate">{cluster.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {timeLeft !== null && (
            <Badge variant={timeLeft < 120 ? "destructive" : "outline"} className="text-xs font-mono shrink-0">
              <Clock className="w-3 h-3 mr-1" /> {formatTime(timeLeft)}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs shrink-0">Step {currentStep}/6</Badge>
          <Button size="sm" variant="secondary" onClick={finishBattle} disabled={isScoring || messages.length < 4}>
            {isScoring ? "Scoring..." : "Submit"}
            <Trophy className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>

      {/* Step progress */}
      <div className="mb-3 shrink-0">
        <div className="flex gap-1 mb-1">
          {DISRUPTION_STEPS.map(s => (
            <div
              key={s.step}
              className="flex-1 h-2 rounded-full transition-all"
              style={{
                background: s.step <= currentStep ? team.color : "hsl(var(--muted))",
                opacity: s.step === currentStep ? 1 : s.step < currentStep ? 0.6 : 0.2,
              }}
            />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {DISRUPTION_STEPS[currentStep - 1]?.emoji} {DISRUPTION_STEPS[currentStep - 1]?.title}
        </p>
      </div>

      {/* Chat */}
      <ScrollArea className="flex-1 pr-4 mb-3">
        <div className="space-y-4 pb-4">
          {messages.map((msg, i) => (
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

      {/* Input */}
      <div className="flex gap-2 shrink-0 pb-2">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Team strategy for Step ${currentStep}...`}
          className="min-h-[48px] max-h-[120px] resize-none"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          disabled={isStreaming}
        />
        <Button onClick={sendMessage} disabled={isStreaming || !input.trim()} size="icon" className="shrink-0 self-end">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
