import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Castle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import type { IndustryCluster, DisruptionIncumbent } from "@/data/disruption-incumbents";

type ChatMsg = { role: "user" | "assistant"; content: string };

export function DisruptMoatDefense({ incumbent, cluster, onComplete }: {
  incumbent: DisruptionIncumbent;
  cluster: IndustryCluster;
  onComplete: (score: number) => void;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([{
    role: "assistant",
    content: `🏰 **BREAKING NEWS: ${incumbent.name} Fights Back!**\n\nI'm the CEO of ${incumbent.name} and I just saw your startup launch. We've assembled a task force.\n\n> *"We're announcing **${incumbent.name} AI** — our own version of what you're building. We have the customers, the data, and the brand. Your tiny startup is finished."*\n\n**Your mission:** Defend your moat. Explain why ${incumbent.name} literally cannot copy you. Consider:\n\n- 🔄 **Network Effects** — Do you have data/user advantages they can't replicate?\n- 🔒 **Switching Costs** — Are your users locked in?\n- ⚡ **Speed Advantage** — Can you ship 10x faster?\n- 📜 **Regulatory Moat** — Do regulations favor you?\n- 💀 **The Innovator's Dilemma** — Would copying you cannibalize their core business?\n\nDefend your position, founder.`,
  }]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [defenseStrength, setDefenseStrength] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

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
            action: "moat-counterattack",
            payload: { incumbent, cluster, messages: updatedMessages },
          }),
        },
      );

      if (!resp.ok || !resp.body) throw new Error("Moat defense failed");
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

      // Track progress
      if (assistantContent.toLowerCase().includes("strong") || assistantContent.includes("✅") || assistantContent.includes("MOAT PROVEN")) {
        setDefenseStrength(prev => Math.min(prev + 1, 5));
      }

      if (assistantContent.includes("MOAT PROVEN") || assistantContent.includes("DEFENSE COMPLETE")) {
        toast.success("Moat defense complete!");
      }
    } catch { toast.error("Defense failed. Try again."); } finally { setIsStreaming(false); }
  };

  const finishDefense = () => {
    const msgCount = messages.filter(m => m.role === "user").length;
    const score = Math.min(100, Math.round(defenseStrength * 15 + Math.min(msgCount * 5, 25) + 10));
    onComplete(score);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 flex flex-col" style={{ height: "calc(100vh - 12rem)" }}>
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Castle className="w-5 h-5 text-warning" />
          <div>
            <Badge variant="outline" className="text-xs">Act 5: Defend</Badge>
            <h2 className="font-cinzel font-bold text-sm">{incumbent.name} Counter-Attack</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${i < defenseStrength ? "bg-success" : "bg-muted"}`} />
            ))}
          </div>
          <Button size="sm" variant="secondary" onClick={finishDefense} disabled={messages.filter(m => m.role === "user").length < 3}>
            Complete Defense
          </Button>
        </div>
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
            <div className="flex justify-start"><div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3"><div className="flex gap-1"><span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce" /><span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce [animation-delay:0.1s]" /><span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce [animation-delay:0.2s]" /></div></div></div>
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      <div className="flex gap-2 shrink-0 pb-2">
        <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Defend your moat..." className="min-h-[48px] max-h-[120px] resize-none" onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} disabled={isStreaming} />
        <Button onClick={sendMessage} disabled={isStreaming || !input.trim()} size="icon" className="shrink-0 self-end"><Send className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}
