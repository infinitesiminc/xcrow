import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, ImageIcon } from "lucide-react";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface StrategyChatProps {
  companyName: string;
  activeCards: Record<string, string | boolean>;
}

export default function StrategyChat({ companyName, activeCards }: StrategyChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessages(prev => [...prev, { role: "user", content: `📎 Uploaded: ${file.name}` }]);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || isThinking) return;
    setInput("");

    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsThinking(true);

    try {
      const systemContext = `You are helping refine lead generation strategy for ${companyName}. Active filters: ${JSON.stringify(activeCards)}. Keep responses to 1-2 sentences. If the user mentions a location, vertical, competitor, or persona, acknowledge it briefly.`;

      const chatMessages = [
        { role: "system", content: systemContext },
        ...newMessages.map(m => ({ role: m.role, content: m.content })),
      ];

      const { data } = await supabase.functions.invoke("leadgen-chat", {
        body: { messages: chatMessages },
      });

      let assistantContent = "";
      if (typeof data === "string") {
        for (const line of data.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) assistantContent += delta;
          } catch {}
        }
      } else if (data?.choices?.[0]?.delta?.content) {
        assistantContent = data.choices[0].delta.content;
      }

      setMessages(prev => [...prev, { role: "assistant", content: assistantContent || "Got it! Adjust your strategy cards and hit Generate." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection issue — please try again." }]);
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      <div className="px-3 py-2 border-b border-border/50">
        <span className="text-xs font-semibold text-foreground">AI Strategy Chat</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2.5 space-y-2">
          {messages.length === 0 && (
            <p className="text-[11px] text-muted-foreground text-center py-4">
              Describe your strategy, upload docs, or ask for suggestions…
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[90%] rounded-lg px-2.5 py-1.5 text-xs ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/80 border border-border"
              }`}>
                <div className="text-foreground [&_p]:mb-0.5 [&_p:last-child]:mb-0 [&_strong]:font-semibold">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-2.5 py-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="flex items-center gap-1.5 px-2 py-2 border-t border-border/50">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleFileUpload} />
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => fileInputRef.current?.click()}>
          <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
        <Input
          placeholder="Ask about strategy…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          className="h-7 text-xs"
          disabled={isThinking}
        />
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleSend} disabled={!input.trim() || isThinking}>
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
