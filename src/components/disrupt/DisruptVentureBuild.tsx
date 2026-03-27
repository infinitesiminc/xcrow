import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { INDUSTRY_CLUSTERS, type IndustryCluster, type DisruptionIncumbent } from "@/data/disruption-incumbents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, Send, CheckCircle2, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import type { DisruptRoom, DisruptTeam } from "./DisruptLobby";

type ChatMsg = { role: "user" | "assistant"; content: string };

const CANVASES = [
  { id: "lean-canvas", label: "Lean Canvas", emoji: "📋", description: "Problem, Solution, Metrics, Unfair Advantage" },
  { id: "market-sizing", label: "Market Sizing", emoji: "📊", description: "TAM / SAM / SOM estimation" },
  { id: "gtm-playbook", label: "GTM Playbook", emoji: "🚀", description: "Go-to-Market strategy" },
  { id: "unit-economics", label: "Unit Economics", emoji: "💰", description: "CAC, LTV, burn rate" },
  { id: "moat-defense", label: "Moat Defense", emoji: "🏰", description: "Why the incumbent can't respond" },
] as const;

export function DisruptVentureBuild({
  room, team, onComplete,
}: {
  room: DisruptRoom;
  team: DisruptTeam;
  onComplete: () => void;
}) {
  const cluster = INDUSTRY_CLUSTERS.find(c => String(c.id) === team.cluster_id);
  const incumbent = cluster?.incumbents.find(i => String(i.id) === team.incumbent_id);

  const [currentCanvas, setCurrentCanvas] = useState(0);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [completedCanvases, setCompletedCanvases] = useState<Record<string, any>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  const canvasId = CANVASES[currentCanvas].id;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  // Opening message for each canvas
  useEffect(() => {
    const canvas = CANVASES[currentCanvas];
    const opening: ChatMsg = {
      role: "assistant",
      content: `${canvas.emoji} **${canvas.label}**\n\n${canvas.description}\n\nLet's work through this together. I'll guide you — share your initial thinking and I'll help refine it.`,
    };
    setMessages([opening]);
  }, [currentCanvas]);

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
            action: "venture",
            payload: {
              incumbent, cluster,
              canvas: canvasId,
              canvasData: completedCanvases,
              messages: updatedMessages,
            },
          }),
        },
      );

      if (!resp.ok || !resp.body) throw new Error("Venture advisor failed");

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

      // Check if canvas is complete
      if (assistantContent.includes("CANVAS COMPLETE")) {
        // Try to extract JSON from the response
        const jsonMatch = assistantContent.match(/```json\n?([\s\S]*?)```/);
        const canvasResult = jsonMatch ? JSON.parse(jsonMatch[1]) : { summary: assistantContent };
        const updated = { ...completedCanvases, [canvasId]: canvasResult };
        setCompletedCanvases(updated);

        // Save to database
        await supabase.from("disrupt_teams").update({
          venture_canvas: updated as any,
      act: 3,
    }).eq("id", team.id);

        toast.success(`${CANVASES[currentCanvas].label} complete!`);
      }
    } catch (err) {
      toast.error("Advisor communication failed");
    } finally {
      setIsStreaming(false);
    }
  };

  const nextCanvas = () => {
    if (currentCanvas < CANVASES.length - 1) {
      setCurrentCanvas(currentCanvas + 1);
    }
  };

  const finishVenture = async () => {
    await supabase.from("disrupt_teams").update({
      venture_canvas: completedCanvases as any,
      act: 2,
    }).eq("id", team.id);
    onComplete();
  };

  if (!incumbent || !cluster) return <p className="text-center text-muted-foreground">Loading...</p>;

  const completedCount = Object.keys(completedCanvases).length;
  const allDone = completedCount >= CANVASES.length;

  return (
    <div className="max-w-5xl mx-auto px-4 flex gap-4" style={{ height: "calc(100vh - 8rem)" }}>
      {/* Sidebar */}
      <div className="w-56 shrink-0 hidden md:block">
        <div className="mb-4">
          <Badge variant="outline" className="text-xs mb-2">Act 2: Build</Badge>
          <h3 className="font-cinzel font-bold text-foreground text-sm">Venture Architecture</h3>
          <p className="text-[10px] text-muted-foreground mt-1">
            Disrupting {incumbent.name}
          </p>
        </div>

        <div className="space-y-1">
          {CANVASES.map((c, i) => {
            const isDone = !!completedCanvases[c.id];
            const isCurrent = i === currentCanvas;
            return (
              <button
                key={c.id}
                onClick={() => setCurrentCanvas(i)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                  isCurrent ? "bg-primary/10 text-primary border border-primary/20" :
                  isDone ? "text-muted-foreground" : "text-foreground/60 hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> :
                    <span className="text-sm">{c.emoji}</span>}
                  <span className="truncate">{c.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 text-center">
          <p className="text-[10px] text-muted-foreground mb-2">{completedCount}/5 canvases</p>
          <Button
            size="sm"
            onClick={finishVenture}
            disabled={completedCount < 3}
            className="w-full text-xs"
          >
            {allDone ? "Submit Venture" : `Submit (${completedCount}/5)`}
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: team.color }} />
            <Lightbulb className="w-4 h-4 text-primary shrink-0" />
            <span className="font-cinzel font-bold text-sm truncate">
              {CANVASES[currentCanvas].emoji} {CANVASES[currentCanvas].label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {completedCanvases[canvasId] && currentCanvas < CANVASES.length - 1 && (
              <Button size="sm" variant="outline" onClick={nextCanvas} className="text-xs">
                Next <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
            {/* Mobile submit */}
            <Button
              size="sm"
              onClick={finishVenture}
              disabled={completedCount < 3}
              className="md:hidden text-xs"
            >
              Submit ({completedCount}/5)
            </Button>
          </div>
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
            placeholder={`Your thinking on ${CANVASES[currentCanvas].label}...`}
            className="min-h-[48px] max-h-[120px] resize-none"
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            disabled={isStreaming}
          />
          <Button onClick={sendMessage} disabled={isStreaming || !input.trim()} size="icon" className="shrink-0 self-end">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
