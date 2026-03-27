import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Users, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import type { IndustryCluster, DisruptionIncumbent } from "@/data/disruption-incumbents";

type ChatMsg = { role: "user" | "assistant"; content: string };

const PERSONAS = [
  { id: "early-adopter", label: "Early Adopter", emoji: "🚀", description: "Tech-savvy, frustrated with the incumbent, eager for alternatives" },
  { id: "skeptic", label: "The Skeptic", emoji: "🤨", description: "Loyal to current solution, needs convincing the pain is worth switching" },
  { id: "budget-buyer", label: "Budget Buyer", emoji: "💰", description: "Price-sensitive, using cheap workarounds, needs value proof" },
];

export function DisruptCustomerDiscovery({ incumbent, cluster, onComplete }: {
  incumbent: DisruptionIncumbent;
  cluster: IndustryCluster;
  onComplete: (score: number) => void;
}) {
  const [currentPersona, setCurrentPersona] = useState(0);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [completedPersonas, setCompletedPersonas] = useState<Set<number>>(new Set());
  const [insights, setInsights] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  const persona = PERSONAS[currentPersona];

  const startPersona = (idx: number) => {
    setCurrentPersona(idx);
    const p = PERSONAS[idx];
    setMessages([{
      role: "assistant",
      content: `${p.emoji} **${p.label}** has joined the interview.\n\n*"Hi, I heard you're building something in the ${cluster.name} space. I currently use ${incumbent.name} — what do you want to know?"*\n\nConduct your customer discovery interview. Ask about their pain points, current workflow, willingness to pay, and what would make them switch.`,
    }]);
  };

  // Start first persona on mount
  if (messages.length === 0) {
    startPersona(0);
  }

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
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
          body: JSON.stringify({
            action: "customer-discovery",
            payload: {
              incumbent, cluster,
              persona: persona.id,
              personaDescription: persona.description,
              messages: updatedMessages,
            },
          }),
        },
      );

      if (!resp.ok || !resp.body) throw new Error("Interview failed");

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

      // Check for interview completion
      if (assistantContent.includes("INTERVIEW COMPLETE")) {
        setCompletedPersonas(prev => new Set([...prev, currentPersona]));
        const insightMatch = assistantContent.match(/KEY INSIGHT[S]?:(.*)/i);
        if (insightMatch) setInsights(prev => [...prev, insightMatch[1].trim()]);
        toast.success(`${persona.label} interview complete!`);
      }
    } catch {
      toast.error("Interview failed. Try again.");
    } finally {
      setIsStreaming(false);
    }
  };

  const finishDiscovery = () => {
    const score = Math.min(100, Math.round((completedPersonas.size / PERSONAS.length) * 80 + (insights.length * 7)));
    onComplete(score);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 flex gap-4" style={{ height: "calc(100vh - 12rem)" }}>
      {/* Sidebar */}
      <div className="w-52 shrink-0 hidden md:block">
        <Badge variant="outline" className="text-xs mb-3">Act 2: Discover</Badge>
        <h3 className="font-cinzel font-bold text-sm text-foreground mb-1">Customer Discovery</h3>
        <p className="text-[11px] text-muted-foreground mb-4">Interview 3 customer personas to validate your startup idea.</p>

        <div className="space-y-2">
          {PERSONAS.map((p, i) => {
            const isDone = completedPersonas.has(i);
            const isCurrent = i === currentPersona;
            return (
              <button
                key={p.id}
                onClick={() => startPersona(i)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                  isCurrent ? "bg-primary/10 text-primary border border-primary/20" :
                  isDone ? "text-muted-foreground" : "text-foreground/60 hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> :
                    <span className="text-sm">{p.emoji}</span>}
                  <span className="truncate">{p.label}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-muted-foreground mb-2">{completedPersonas.size}/3 interviews</p>
          <Button
            size="sm" onClick={finishDiscovery}
            disabled={completedPersonas.size < 2}
            className="w-full text-xs"
          >
            Complete Discovery
          </Button>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-3 shrink-0">
          <Users className="w-4 h-4 text-primary" />
          <span className="font-cinzel font-bold text-sm">{persona.emoji} {persona.label}</span>
          {completedPersonas.has(currentPersona) && <Badge className="text-[11px] bg-success text-success-foreground">✓ Done</Badge>}
        </div>

        <ScrollArea className="flex-1 pr-4 mb-3">
          <div className="space-y-4 pb-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
                }`}>
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

        <div className="flex gap-2 shrink-0 pb-2">
          <Textarea
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="Ask your customer discovery question..."
            className="min-h-[48px] max-h-[120px] resize-none"
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            disabled={isStreaming}
          />
          <Button onClick={sendMessage} disabled={isStreaming || !input.trim()} size="icon" className="shrink-0 self-end">
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex gap-2 mt-2">
          {PERSONAS.map((p, i) => (
            <Button key={p.id} size="sm" variant={i === currentPersona ? "default" : "outline"} onClick={() => startPersona(i)} className="text-xs flex-1">
              {p.emoji} {completedPersonas.has(i) ? "✓" : p.label}
            </Button>
          ))}
        </div>
        <Button size="sm" onClick={finishDiscovery} disabled={completedPersonas.size < 2} className="md:hidden mt-2 text-xs">
          Complete Discovery ({completedPersonas.size}/3)
        </Button>
      </div>
    </div>
  );
}
