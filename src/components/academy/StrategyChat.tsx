import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, ImageIcon } from "lucide-react";
import type { GTMTreeData } from "./gtm-types";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  pills?: string[];
}

interface StrategyChatProps {
  companyName: string;
  activeCards: Record<string, string | boolean>;
  treeData?: GTMTreeData | null;
}

/** Parse [[Option A|Option B|Option C]] from end of AI response */
function parsePills(text: string): { cleanText: string; pills: string[] } {
  const match = text.match(/\[\[([^\]]+)\]\]\s*$/);
  if (!match) return { cleanText: text, pills: [] };
  const pills = match[1].split("|").map(s => s.trim()).filter(Boolean);
  const cleanText = text.slice(0, match.index).trim();
  return { cleanText, pills };
}

export default function StrategyChat({ companyName, activeCards, treeData }: StrategyChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keep ref in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  /* ── Build ICP context string from treeData ── */
  const icpContext = useMemo(() => {
    if (!treeData) return "";
    const verticals = [...new Set(treeData.mappings.map(m => m.vertical))].filter(Boolean);
    const personas = [...new Set(treeData.mappings.map(m => m.dm.title))].filter(Boolean);
    const products = treeData.products.map(p => p.name);
    const customers = treeData.customers.map(c => c.name).slice(0, 5);
    return `[ICP CONTEXT for ${companyName}]
Company: ${companyName} — ${treeData.company_summary}
Products: ${products.join(", ")}
Verticals: ${verticals.join(", ")}
Decision-maker personas: ${personas.join(", ")}
Named customers: ${customers.join(", ") || "None identified"}
[END ICP CONTEXT]`;
  }, [treeData, companyName]);

  /* ── Auto-send opening message when treeData is available ── */
  useEffect(() => {
    if (treeData && !hasAutoStarted && messages.length === 0) {
      setHasAutoStarted(true);
      handleSendMessage("Help me find the best leads for this company.", true);
    }
  }, [treeData, hasAutoStarted]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessages(prev => [...prev, { role: "user", content: `📎 Uploaded: ${file.name}` }]);
  }

  const handleSendMessage = useCallback(async (text: string, isAutoStart = false) => {
    if (!text.trim() || isThinking) return;

    // Build the new messages array for display
    const currentMessages = messagesRef.current;
    const updatedMessages = isAutoStart ? [...currentMessages] : [...currentMessages, { role: "user" as const, content: text.trim() }];
    setMessages(updatedMessages);
    setIsThinking(true);

    try {
      const chatMessages: { role: string; content: string }[] = [];
      
      if (icpContext) {
        chatMessages.push({ role: "system", content: icpContext });
      }

      for (const m of updatedMessages) {
        chatMessages.push({ role: m.role, content: m.content });
      }
      if (isAutoStart) {
        chatMessages.push({ role: "user", content: text.trim() });
      }

      const { data } = await supabase.functions.invoke("leadgen-chat", {
        body: { messages: chatMessages },
      });

      let assistantContent = "";
      let nichesFromStream: string[] = [];
      
      // Normalize data to string for SSE parsing
      let raw = "";
      if (typeof data === "string") {
        raw = data;
      } else if (data instanceof Blob) {
        raw = await data.text();
      } else if (data && typeof data === "object") {
        // Already parsed JSON — check for direct content
        const directContent = data?.choices?.[0]?.delta?.content;
        if (directContent) {
          assistantContent = directContent;
        } else {
          raw = JSON.stringify(data);
        }
      }

      if (raw && !assistantContent) {
        for (const line of raw.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "niches" && parsed.niches) {
              nichesFromStream = parsed.niches.map((n: any) => n.label || n);
            }
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) assistantContent += delta;
          } catch {}
        }
      }

      let { cleanText, pills } = parsePills(assistantContent);

      // Use stream niches as pills if AI didn't include [[pills]]
      if (pills.length === 0 && nichesFromStream.length > 0) {
        pills = nichesFromStream.slice(0, 4);
      }
      // Fallback to verticals only on opening message
      if (pills.length === 0 && treeData && updatedMessages.length === 0) {
        const verticals = [...new Set(treeData.mappings.map(m => m.vertical))].filter(Boolean);
        if (verticals.length > 0) pills = verticals.slice(0, 4);
      }

      if (!cleanText) {
        cleanText = "Let me analyze your company and prepare a strategy…";
      }
      
      setMessages(prev => [...prev, { role: "assistant", content: cleanText, pills }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection issue — please try again." }]);
    } finally {
      setIsThinking(false);
    }
  }, [icpContext, treeData, companyName]);

  function handlePillClick(pill: string) {
    handleSendMessage(pill);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await handleSendMessage(text);
  }

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      <div className="px-3 py-2 border-b border-border/50">
        <span className="text-xs font-semibold text-foreground">AI Strategy Chat</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2.5 space-y-2">
          {messages.length === 0 && !isThinking && (
            <p className="text-[11px] text-muted-foreground text-center py-4">
              Analyzing your company to suggest the best lead strategy…
            </p>
          )}

          {messages.map((msg, i) => (
            <div key={i}>
              <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] rounded-lg px-2.5 py-1.5 text-xs ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/80 border border-border"
                }`}>
                  <div className={`[&_p]:mb-0.5 [&_p:last-child]:mb-0 [&_strong]:font-semibold ${
                    msg.role === "user" ? "text-primary-foreground" : "text-foreground"
                  }`}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
              {/* Render pills below assistant messages */}
              {msg.role === "assistant" && msg.pills && msg.pills.length > 0 && !isThinking && i === messages.length - 1 && (
                <div className="flex flex-wrap gap-1 mt-1.5 ml-1">
                  {msg.pills.map(pill => (
                    <button
                      key={pill}
                      onClick={() => handlePillClick(pill)}
                      className="text-[10px] px-2.5 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              )}
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
          placeholder="Or type anything…"
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
