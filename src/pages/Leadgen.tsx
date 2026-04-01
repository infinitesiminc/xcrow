import { useState, useRef, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, ExternalLink, Loader2, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leadgen-chat`;

interface Lead {
  name: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  phone_source?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
  address?: string;
  source?: string;
  email_confidence?: number;
  summary?: string;
  reason?: string;
}

type ChatItem =
  | { type: "user"; content: string }
  | { type: "assistant"; content: string }
  | { type: "leads"; leads: Lead[] };

const GREETING: ChatItem = {
  type: "assistant",
  content:
    "Hey! 👋 I'm your lead gen assistant. I'll help you find high-quality prospects tailored to your business.\n\n**To get started, what's your company website?**",
};

export default function Leadgen() {
  const [items, setItems] = useState<ChatItem[]>([GREETING]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [userPhone, setUserPhone] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [items, scrollToBottom]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userItem: ChatItem = { type: "user", content: text };
    const allItems = [...items, userItem];
    setItems(allItems);
    setInput("");
    setIsStreaming(true);

    let assistantSoFar = "";

    try {
      const apiMessages = allItems
        .filter((it): it is ChatItem & { type: "user" | "assistant" } => it.type !== "leads")
        .map((m) => ({ role: m.type, content: m.content }));

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        setItems((prev) => [
          ...prev,
          { type: "assistant", content: (err as any).error || "Something went wrong. Please try again." },
        ]);
        setIsStreaming(false);
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setItems((prev) => {
          const last = prev[prev.length - 1];
          if (last?.type === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 && m.type === "assistant" ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { type: "assistant", content: assistantSoFar }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, newlineIdx);
          buf = buf.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "leads" && parsed.leads) {
              setItems((prev) => [...prev, { type: "leads", leads: parsed.leads }]);
              continue;
            }
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsert(content);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }

      // Flush
      if (buf.trim()) {
        for (let raw of buf.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "leads" && parsed.leads) {
              setItems((prev) => [...prev, { type: "leads", leads: parsed.leads }]);
              continue;
            }
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {}
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      setItems((prev) => [...prev, { type: "assistant", content: "Connection error. Please try again." }]);
    }

    setIsStreaming(false);
  };

  const sendToWhatsApp = (leads: Lead[]) => {
    const phone = userPhone.replace(/[^0-9]/g, "");
    if (!phone || phone.length < 10) {
      // Ask for phone via prompt
      const num = window.prompt("Enter your WhatsApp number (with country code, e.g. 16261234567):");
      if (!num) return;
      setUserPhone(num);
      openWA(leads, num.replace(/[^0-9]/g, ""));
      return;
    }
    openWA(leads, phone);
  };

  const openWA = (leads: Lead[], phone: string) => {
    let msg = `🎯 *Xcrow Scout — Your Leads*\n\n`;
    leads.forEach((l, i) => {
      msg += `*${i + 1}. ${l.name}*`;
      if (l.title) msg += ` — ${l.title}`;
      if (l.company) msg += ` @ ${l.company}`;
      msg += "\n";
      if (l.email) msg += `📧 ${l.email}\n`;
      if (l.phone) msg += `📱 ${l.phone}\n`;
      if (l.linkedin) msg += `🔗 ${l.linkedin}\n`;
      if (l.twitter) msg += `🐦 ${l.twitter}\n`;
      msg += "\n";
    });
    msg += "_Powered by Xcrow Scout_";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <>
      <Helmet>
        <title>Xcrow Scout — AI Lead Gen Chat</title>
        <meta name="description" content="Chat with AI to build your ideal customer profile and discover qualified leads instantly." />
      </Helmet>
      <Navbar />
      <div className="flex flex-col h-screen pt-16">
        {/* Header */}
        <div className="border-b border-border/40 bg-card/30 px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Xcrow Scout</h1>
            <p className="text-xs text-muted-foreground">AI-guided lead discovery</p>
          </div>
          <Badge variant="outline" className="ml-auto text-[10px] border-primary/30 text-primary">
            Free — 5 Leads
          </Badge>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4">
          <div className="max-w-2xl mx-auto py-6 space-y-4">
            <AnimatePresence initial={false}>
              {items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.type === "user" && (
                    <div className="flex justify-end gap-2">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%] text-sm">
                        {item.content}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  {item.type === "assistant" && (
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="bg-muted/50 border border-border/30 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[80%] text-sm prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                        <ReactMarkdown>{item.content}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {item.type === "leads" && (
                    <div className="ml-9 space-y-2">
                      {item.leads.map((l, j) => (
                        <Card key={j} className="bg-card/60 border-primary/20">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-foreground text-sm">{l.name}</p>
                                {(l.title || l.company) && (
                                  <p className="text-xs text-muted-foreground">
                                    {l.title}
                                    {l.title && l.company ? " @ " : ""}
                                    {l.company}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                {l.linkedin && (
                                  <a href={l.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                            {l.summary && (
                              <p className="text-xs text-muted-foreground mt-1.5 italic">{l.summary}</p>
                            )}
                            {l.reason && (
                              <p className="text-xs text-primary/80 mt-1 font-medium">💡 {l.reason}</p>
                            )}
                            {l.source && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-muted-foreground/30 text-muted-foreground">
                                {l.source}
                              </Badge>
                            )}
                            <div className="flex gap-3 mt-1.5 flex-wrap">
                              {l.email && <span className="text-xs text-muted-foreground">📧 {l.email}</span>}
                              {l.phone && (
                                <span className="text-xs text-muted-foreground">
                                  📱 {l.phone}
                                  {l.phone_source === "google_maps" && <span className="text-[9px] ml-1 text-primary/60">(Maps ✓)</span>}
                                </span>
                              )}
                              {l.email && (
                                <span className="text-xs text-muted-foreground">
                                  📧 {l.email}
                                  {l.email_confidence && <span className="text-[9px] ml-1 text-primary/60">({l.email_confidence}%)</span>}
                                </span>
                              )}
                              {l.address && <span className="text-xs text-muted-foreground">📍 {l.address}</span>}
                              {l.website && (
                                <a href={l.website.startsWith("http") ? l.website : `https://${l.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary">
                                  🌐 {l.website.replace(/^https?:\/\//, "").slice(0, 30)}
                                </a>
                              )}
                              {l.twitter && (
                                <a href={l.twitter} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary">
                                  🐦 Twitter
                                </a>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 mt-2"
                        onClick={() => sendToWhatsApp(item.leads)}
                      >
                        <Send className="w-3.5 h-3.5" /> Send to WhatsApp
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isStreaming && items[items.length - 1]?.type !== "assistant" && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-muted/50 border border-border/30 rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border/40 bg-card/30 px-4 py-3">
          <form
            className="max-w-2xl mx-auto flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-muted/20 border-border/40"
              autoFocus
            />
            <Button type="submit" size="icon" disabled={!input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
            No signup required · Powered by AI
          </p>
        </div>
      </div>
    </>
  );
}
