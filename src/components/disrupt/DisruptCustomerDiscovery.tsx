import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search, AlertTriangle, Star, ThumbsDown, MessageSquare, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import type { IndustryCluster, DisruptionIncumbent } from "@/data/disruption-incumbents";

type ChatMsg = { role: "user" | "assistant"; content: string };

interface PainPoint {
  title: string;
  severity: "critical" | "high" | "medium";
  evidence: string;
  source: string;
  category: string;
}

function parsePainPoints(content: string): PainPoint[] {
  const regex = /\[PAIN:(critical|high|medium):([^\]]+)\]\s*\[SOURCE:([^\]]+)\]\s*\[CAT:([^\]]+)\]\s*([\s\S]*?)(?=\[PAIN:|$)/g;
  const points: PainPoint[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    points.push({
      severity: match[1] as PainPoint["severity"],
      title: match[2].trim(),
      source: match[3].trim(),
      category: match[4].trim(),
      evidence: match[5].trim().replace(/\n+$/, ""),
    });
  }
  return points;
}

const severityConfig = {
  critical: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle, label: "Critical" },
  high: { color: "bg-warning/10 text-warning border-warning/20", icon: ThumbsDown, label: "High" },
  medium: { color: "bg-muted text-muted-foreground border-border", icon: MessageSquare, label: "Medium" },
};

const sourceIcons: Record<string, string> = {
  "G2": "⭐", "Reddit": "🔴", "Twitter": "🐦", "App Store": "📱",
  "Glassdoor": "🏢", "LinkedIn": "💼", "HackerNews": "🟧", "Trustpilot": "⭐",
};

export function DisruptCustomerDiscovery({ incumbent, cluster, onComplete }: {
  incumbent: DisruptionIncumbent;
  cluster: IndustryCluster;
  onComplete: (score: number) => void;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  // Auto-start research on mount
  useEffect(() => {
    if (hasInitialized) return;
    setHasInitialized(true);
    runInitialResearch();
  }, [hasInitialized]);

  const runInitialResearch = async () => {
    const systemMsg: ChatMsg = {
      role: "user",
      content: `Research the top customer complaints and pain points for ${incumbent.name}. Find real frustrations from G2 reviews, Reddit, Twitter, and other sources.`,
    };
    setMessages([systemMsg]);
    setIsStreaming(true);

    await streamChat([systemMsg]);
  };

  const streamChat = async (chatMessages: ChatMsg[]) => {
    let assistantContent = "";
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disruption-battle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({
            action: "customer-pain-mining",
            payload: { incumbent, cluster, messages: chatMessages },
          }),
        },
      );

      if (!resp.ok || !resp.body) throw new Error("Research failed");

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
                if (last?.role === "assistant" && prev.length === chatMessages.length + 1) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
              scrollToBottom();
            }
          } catch { /* partial */ }
        }
      }

      // Parse pain points from the response
      const newPoints = parsePainPoints(assistantContent);
      if (newPoints.length > 0) {
        setPainPoints(prev => {
          const existing = new Set(prev.map(p => p.title));
          const unique = newPoints.filter(p => !existing.has(p.title));
          return [...prev, ...unique];
        });
      }
    } catch {
      toast.error("Research failed. Try again.");
    } finally {
      setIsStreaming(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: ChatMsg = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);
    scrollToBottom();
    await streamChat(updatedMessages);
  };

  const finishDiscovery = () => {
    const score = Math.min(100, Math.round(painPoints.length * 12 + 16));
    onComplete(score);
  };

  // Strip PAIN markers from displayed content
  const cleanContent = (content: string) => {
    return content
      .replace(/\[PAIN:(critical|high|medium):[^\]]+\]/g, "")
      .replace(/\[SOURCE:[^\]]+\]/g, "")
      .replace(/\[CAT:[^\]]+\]/g, "")
      .trim();
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Left: Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-3 shrink-0">
          <Search className="w-4 h-4 text-primary" />
          <span className="font-cinzel font-bold text-sm">Customer Pain Mining</span>
          <Badge variant="outline" className="text-[10px]">Act 1</Badge>
        </div>

        <ScrollArea className="flex-1 pr-4 mb-3">
          <div className="space-y-4 pb-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
                }`}>
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0">
                    <ReactMarkdown>{cleanContent(msg.content)}</ReactMarkdown>
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

        {/* Quick prompts */}
        {messages.length <= 2 && !isStreaming && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {[
              `What do users hate most about ${incumbent.name}?`,
              "Show me pricing complaints",
              "What are the top feature gaps?",
              "Who's switching away and why?",
            ].map(q => (
              <button key={q} onClick={() => { setInput(q); }} className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-card hover:bg-muted transition-colors text-muted-foreground">
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 shrink-0 pb-2">
          <Textarea
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="Ask about specific pain points, pricing, features..."
            className="min-h-[48px] max-h-[120px] resize-none"
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            disabled={isStreaming}
          />
          <Button onClick={sendMessage} disabled={isStreaming || !input.trim()} size="icon" className="shrink-0 self-end">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Right: Pain Point Cards */}
      <div className="w-72 shrink-0 hidden md:flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-cinzel font-bold text-xs text-foreground">Pain Points Found</h3>
          <Badge variant="outline" className="text-[10px]">{painPoints.length}</Badge>
        </div>

        <ScrollArea className="flex-1 mb-3">
          <div className="space-y-2 pr-2">
            {painPoints.length === 0 && !isStreaming && (
              <p className="text-[11px] text-muted-foreground text-center py-8">Research in progress...</p>
            )}
            {painPoints.map((point, i) => {
              const config = severityConfig[point.severity];
              const Icon = config.icon;
              const sourceIcon = sourceIcons[point.source] || "📋";
              return (
                <Card key={i} className={`border ${config.color} bg-card`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2 mb-1.5">
                      <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium text-xs leading-tight">{point.title}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px]">{sourceIcon}</span>
                          <span className="text-[10px] text-muted-foreground">{point.source}</span>
                          <Badge variant="outline" className="text-[9px] px-1 py-0">{point.category}</Badge>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-1.5 line-clamp-3">{point.evidence}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        <div className="space-y-2 shrink-0">
          <p className="text-[10px] text-muted-foreground text-center">
            {painPoints.length < 3 ? `Find ${3 - painPoints.length} more to continue` : "Ready to complete!"}
          </p>
          <Button
            size="sm" onClick={finishDiscovery}
            disabled={painPoints.length < 3}
            className="w-full text-xs"
          >
            Generate Pain Report ({painPoints.length}/3+)
          </Button>
        </div>
      </div>

      {/* Mobile pain point count */}
      <div className="md:hidden fixed bottom-20 right-4 z-10">
        <Button size="sm" onClick={finishDiscovery} disabled={painPoints.length < 3} className="text-xs shadow-lg">
          🎯 {painPoints.length} Pain Points — {painPoints.length >= 3 ? "Complete" : `Need ${3 - painPoints.length} more`}
        </Button>
      </div>
    </div>
  );
}
