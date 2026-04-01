import { useState, useRef, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, ExternalLink, Loader2, MessageSquare, Mail, Sparkles, Check, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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

/**
 * Ensure options are always numbered and properly formatted for markdown.
 * Handles: unnumbered bold options, bullet lists, and already-numbered items.
 * Guarantees a blank line before the first numbered item so ReactMarkdown
 * renders an <ol> instead of inline text.
 */
const formatAssistantMessage = (text: string): string => {
  if (!text) return text;

  let result = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

  const lines = result.split("\n");
  // Detect option-like lines: bold or capitalized text followed by em-dash/dash and description
  const optionRe = /^(?:[-*•]\s*)?(?:\d+[.)]\s*)?(\*\*[^*]+\*\*|[A-Z][A-Za-z0-9&/',()+\s]{2,120})\s*(?:—|–|--)\s+.+$/;
  
  const optionIndexes: number[] = [];
  lines.forEach((line, i) => {
    if (optionRe.test(line.trim())) optionIndexes.push(i);
  });

  if (optionIndexes.length >= 2) {
    let n = 1;
    for (const idx of optionIndexes) {
      const cleaned = lines[idx].trim()
        .replace(/^[-*•]\s*/, "")
        .replace(/^\d+[.)]\s*/, "");
      lines[idx] = `${n++}. ${cleaned}`;
    }

    // Ensure blank line before first option so markdown creates <ol>
    const firstIdx = optionIndexes[0];
    if (firstIdx > 0 && lines[firstIdx - 1].trim() !== "") {
      lines.splice(firstIdx, 0, "");
    }
    // Ensure blank line after last option
    const lastIdx = optionIndexes[optionIndexes.length - 1] + (firstIdx > 0 && lines[firstIdx - 1]?.trim() === "" ? 1 : 0);
    if (lastIdx < lines.length - 1 && lines[lastIdx + 1]?.trim() !== "") {
      lines.splice(lastIdx + 1, 0, "");
    }

    result = lines.join("\n");
  }

  return result;
};

const GREETING: ChatItem = {
  type: "assistant",
  content:
    "Hey! 👋 I'm your lead gen assistant. I'll help you find high-quality prospects tailored to your business.\n\n**To get started, what's your company website?**",
};

export default function Leadgen() {
  const { user, profile, openAuthModal } = useAuth();
  const [items, setItems] = useState<ChatItem[]>([GREETING]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [userPhone, setUserPhone] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Email draft state
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [draftLead, setDraftLead] = useState<Lead | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftCtaText, setDraftCtaText] = useState("");
  const [sending, setSending] = useState(false);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [items, scrollToBottom]);

  const handleDraftEmail = async (lead: Lead) => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (!lead.email) {
      toast.error("This lead has no email address.");
      return;
    }
    setDraftLead(lead);
    setDraftModalOpen(true);
    setDraftLoading(true);
    setDraftSubject("");
    setDraftBody("");
    setDraftCtaText("");

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/draft-outreach`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            lead: {
              name: lead.name,
              title: lead.title,
              company: lead.company,
              email: lead.email,
              reason: lead.reason,
              summary: lead.summary,
            },
            senderInfo: {
              name: profile?.displayName || user.email?.split("@")[0],
              company: profile?.company || "",
              website: "",
            },
          }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed to draft");
      setDraftSubject(data.draft.subject || "");
      setDraftBody(data.draft.body || "");
      setDraftCtaText(data.draft.ctaText || "");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate draft");
      setDraftModalOpen(false);
    } finally {
      setDraftLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!draftLead?.email || !draftSubject || !draftBody) return;
    setSending(true);
    try {
      const id = crypto.randomUUID();
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "lead-outreach",
          recipientEmail: draftLead.email,
          idempotencyKey: `outreach-${id}`,
          templateData: {
            recipientName: draftLead.name,
            senderName: profile?.displayName || user?.email?.split("@")[0],
            senderCompany: profile?.company || "",
            emailBody: draftBody,
            ctaText: draftCtaText || undefined,
            ctaUrl: "",
            subject: draftSubject,
          },
        },
      });
      if (error) throw error;
      toast.success(`Email sent to ${draftLead.email}`);
      setDraftModalOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

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
        const normalizedContent = formatAssistantMessage(assistantSoFar);
        setItems((prev) => {
          const last = prev[prev.length - 1];
          if (last?.type === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 && m.type === "assistant" ? { ...m, content: normalizedContent } : m));
          }
          return [...prev, { type: "assistant", content: normalizedContent }];
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
                      <div className="bg-muted/50 border border-border/30 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[80%] text-sm prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 [&_ul]:list-decimal [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
                        <ReactMarkdown>{formatAssistantMessage(item.content)}</ReactMarkdown>
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
                            {l.email && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 mt-2 text-xs"
                                onClick={() => handleDraftEmail(l)}
                              >
                                <Mail className="w-3 h-3" />
                                <Sparkles className="w-3 h-3" />
                                Draft Email
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}

                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => sendToWhatsApp(item.leads)}
                        >
                          <Send className="w-3.5 h-3.5" /> Send to WhatsApp
                        </Button>
                      </div>
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

      {/* Email Draft Modal */}
      <Dialog open={draftModalOpen} onOpenChange={setDraftModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Email to {draftLead?.name}
            </DialogTitle>
          </DialogHeader>

          {draftLoading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">AI is drafting your email...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
                <Input value={draftLead?.email || ""} disabled className="bg-muted/30 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
                <Input
                  value={draftSubject}
                  onChange={(e) => setDraftSubject(e.target.value)}
                  className="text-sm"
                  placeholder="Email subject..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Body</label>
                <Textarea
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  className="text-sm min-h-[140px]"
                  placeholder="Email body..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">CTA Button (optional)</label>
                <Input
                  value={draftCtaText}
                  onChange={(e) => setDraftCtaText(e.target.value)}
                  className="text-sm"
                  placeholder="e.g. Schedule a Call"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setDraftModalOpen(false)} disabled={sending}>
              <X className="w-3.5 h-3.5 mr-1" /> Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSendEmail}
              disabled={draftLoading || sending || !draftSubject || !draftBody}
              className="gap-1.5"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {sending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
