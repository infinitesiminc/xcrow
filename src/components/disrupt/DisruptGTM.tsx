import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Megaphone, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import type { IndustryCluster, DisruptionIncumbent } from "@/data/disruption-incumbents";

type ChatMsg = { role: "user" | "assistant"; content: string };

const GTM_SECTIONS = [
  { id: "channels", label: "Distribution Channels", emoji: "📡", description: "Product Hunt, Reddit, developer communities, or content-led? Where will you reach early adopters?" },
  { id: "pricing", label: "SaaS Pricing Model", emoji: "💰", description: "How will you price to undercut the incumbent? Freemium, usage-based, flat-rate, or outcome-based?" },
  { id: "first-100", label: "First 100 Users", emoji: "🎯", description: "Specific plan to land your first 100 paying users — cold outreach, community, PLG, or partnerships?" },
];

export function DisruptGTM({ incumbent, cluster, onComplete }: {
  incumbent: DisruptionIncumbent;
  cluster: IndustryCluster;
  onComplete: (score: number) => void;
}) {
  const [currentSection, setCurrentSection] = useState(0);
  const [messages, setMessages] = useState<ChatMsg[]>([{
    role: "assistant",
    content: `🚀 **Go-to-Market Strategy Workshop**\n\nYou've built your business model — now let's get to market. I'll challenge your strategy like a seasoned growth advisor.\n\n**📡 Channel Strategy**\n\nHow will you reach customers in the **${incumbent.beachheadNiche}** niche? Consider:\n- Where do they hang out online/offline?\n- What's their buying process?\n- How does ${incumbent.name} currently reach them?\n\nShare your channel strategy and I'll pressure-test it.`,
  }]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
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
            action: "gtm-challenge",
            payload: {
              incumbent, cluster,
              section: GTM_SECTIONS[currentSection].id,
              sectionDescription: GTM_SECTIONS[currentSection].description,
              messages: updatedMessages,
            },
          }),
        },
      );

      if (!resp.ok || !resp.body) throw new Error("GTM challenge failed");
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
      if (assistantContent.includes("SECTION COMPLETE") || assistantContent.includes("✅")) {
        setCompletedSections(prev => new Set([...prev, currentSection]));
        toast.success(`${GTM_SECTIONS[currentSection].label} complete!`);
      }
    } catch { toast.error("GTM challenge failed."); } finally { setIsStreaming(false); }
  };

  const nextSection = () => {
    if (currentSection < GTM_SECTIONS.length - 1) {
      const next = currentSection + 1;
      setCurrentSection(next);
      setMessages([{
        role: "assistant",
        content: `${GTM_SECTIONS[next].emoji} **${GTM_SECTIONS[next].label}**\n\n${GTM_SECTIONS[next].description}\n\nShare your thinking and I'll challenge it.`,
      }]);
    }
  };

  const finishGTM = () => {
    const score = Math.min(100, Math.round((completedSections.size / GTM_SECTIONS.length) * 85 + 15));
    onComplete(score);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 flex gap-4" style={{ height: "calc(100vh - 12rem)" }}>
      <div className="w-52 shrink-0 hidden md:block">
        <Badge variant="outline" className="text-xs mb-3">Act 4: Launch</Badge>
        <h3 className="font-cinzel font-bold text-sm text-foreground mb-1">Go-to-Market</h3>
        <p className="text-[11px] text-muted-foreground mb-4">Design your launch strategy.</p>
        <div className="space-y-2">
          {GTM_SECTIONS.map((s, i) => {
            const isDone = completedSections.has(i);
            const isCurrent = i === currentSection;
            return (
              <button key={s.id} onClick={() => { setCurrentSection(i); if (!isDone) setMessages([{ role: "assistant", content: `${s.emoji} **${s.label}**\n\n${s.description}\n\nShare your thinking.` }]); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${isCurrent ? "bg-primary/10 text-primary border border-primary/20" : isDone ? "text-muted-foreground" : "text-foreground/60 hover:bg-muted"}`}>
                <div className="flex items-center gap-2">
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <span className="text-sm">{s.emoji}</span>}
                  <span className="truncate">{s.label}</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 text-center">
          <p className="text-[11px] text-muted-foreground mb-2">{completedSections.size}/3 sections</p>
          {completedSections.has(currentSection) && currentSection < GTM_SECTIONS.length - 1 && (
            <Button size="sm" variant="outline" onClick={nextSection} className="w-full text-xs mb-2">Next Section</Button>
          )}
          <Button size="sm" onClick={finishGTM} disabled={completedSections.size < 2} className="w-full text-xs">
            Complete GTM Plan
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-3 shrink-0">
          <Megaphone className="w-4 h-4 text-primary" />
          <span className="font-cinzel font-bold text-sm">{GTM_SECTIONS[currentSection].emoji} {GTM_SECTIONS[currentSection].label}</span>
        </div>
        <ScrollArea className="flex-1 pr-4 mb-3">
          <div className="space-y-4 pb-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
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
          <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Your GTM strategy..." className="min-h-[48px] max-h-[120px] resize-none" onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} disabled={isStreaming} />
          <Button onClick={sendMessage} disabled={isStreaming || !input.trim()} size="icon" className="shrink-0 self-end"><Send className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
}
