import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, MessageSquare, Mail, Check, X, Users } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { LeadgenDashboard } from "@/components/leadgen/LeadgenDashboard";
import { NicheSidebar } from "@/components/leadgen/NicheSidebar";
import { useLeadsCRUD } from "@/components/leadgen/useLeadsCRUD";
import type { Lead } from "@/components/leadgen/LeadCard";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leadgen-chat`;

type ChatItem =
  | { type: "user"; content: string }
  | { type: "assistant"; content: string }
  | { type: "leads"; leads: Lead[] };

const formatAssistantMessage = (text: string): string => {
  if (!text) return text;
  let result = text.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  const lines = result.split("\n");
  const optionRe = /^(?:[-*•]\s*)?(?:\d+[.)]\s*)?(\*\*[^*]+\*\*|[A-Z][A-Za-z0-9&/',()+\s]{2,120})\s*(?:—|–|--)\s+.+$/;
  const optionIndexes: number[] = [];
  lines.forEach((line, i) => { if (optionRe.test(line.trim())) optionIndexes.push(i); });
  if (optionIndexes.length >= 2) {
    let n = 1;
    for (const idx of optionIndexes) {
      const cleaned = lines[idx].trim().replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "");
      lines[idx] = `${n++}. ${cleaned}`;
    }
    const firstIdx = optionIndexes[0];
    if (firstIdx > 0 && lines[firstIdx - 1].trim() !== "") lines.splice(firstIdx, 0, "");
    const lastIdx = optionIndexes[optionIndexes.length - 1] + (firstIdx > 0 && lines[firstIdx - 1]?.trim() === "" ? 1 : 0);
    if (lastIdx < lines.length - 1 && lines[lastIdx + 1]?.trim() !== "") lines.splice(lastIdx + 1, 0, "");
    result = lines.join("\n");
  }
  return result;
};

const GREETING: ChatItem = {
  type: "assistant",
  content: "Hey! 👋 I'm your lead gen assistant. I'll help you find high-quality prospects tailored to your business.\n\n**To get started, what's your company website?**",
};

export default function Leadgen() {
  const { user, profile, openAuthModal } = useAuth();
  const [items, setItems] = useState<ChatItem[]>([GREETING]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [localNiches, setLocalNiches] = useState<Array<{ label: string; description: string | null; parent_label: string | null }>>([]);
  const [activeNiche, setActiveNiche] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeNicheRef = useRef<string | null>(null);
  activeNicheRef.current = activeNiche;

  // CRM hook
  const {
    leads: savedLeads,
    outreach,
    niches: savedNiches,
    upsertLeads,
    upsertNiches,
    updateLeadStatus,
    logOutreach,
    exportCSV,
  } = useLeadsCRUD(user?.id);

  // Email draft state
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [draftLead, setDraftLead] = useState<Lead | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftCtaText, setDraftCtaText] = useState("");
  const [sending, setSending] = useState(false);

  const sidebarNiches = useMemo(
    () => localNiches.map((n, index) => ({
      id: `local-${index}-${n.label}`,
      label: n.label,
      description: n.description,
      status: "active",
      lead_count: 0,
      created_at: new Date().toISOString(),
      parent_label: n.parent_label,
    })),
    [localNiches]
  );

  // Accumulate all leads from chat (in-memory for non-authed users)
  const allLeads = useMemo(() => {
    const leads: Lead[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      if (item.type === "leads") {
        for (const l of item.leads) {
          const key = `${l.name}|${l.email || ""}|${l.company || ""}`;
          if (!seen.has(key)) { seen.add(key); leads.push(l); }
        }
      }
    }
    return leads;
  }, [items]);

  // Auto-save leads to DB when they arrive (authed users)
  useEffect(() => {
    if (user && allLeads.length > 0) {
      upsertLeads(allLeads);
    }
  }, [allLeads, user, upsertLeads]);


  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [items, scrollToBottom]);

  const handleDraftEmail = async (lead: Lead) => {
    if (!user) { openAuthModal(); return; }
    if (!lead.email) { toast.error("This lead has no email address."); return; }
    setDraftLead(lead);
    setDraftModalOpen(true);
    setDraftLoading(true);
    setDraftSubject(""); setDraftBody(""); setDraftCtaText("");
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/draft-outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          lead: { name: lead.name, title: lead.title, company: lead.company, email: lead.email, reason: lead.reason, summary: lead.summary },
          senderInfo: { name: profile?.displayName || user.email?.split("@")[0], company: profile?.company || "", website: "" },
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed to draft");
      setDraftSubject(data.draft.subject || ""); setDraftBody(data.draft.body || ""); setDraftCtaText(data.draft.ctaText || "");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate draft"); setDraftModalOpen(false);
    } finally { setDraftLoading(false); }
  };

  const handleSendEmail = async () => {
    if (!draftLead?.email || !draftSubject || !draftBody) return;
    setSending(true);
    try {
      const id = crypto.randomUUID();
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "lead-outreach", recipientEmail: draftLead.email, idempotencyKey: `outreach-${id}`,
          templateData: { recipientName: draftLead.name, senderName: profile?.displayName || user?.email?.split("@")[0], senderCompany: profile?.company || "", emailBody: draftBody, ctaText: draftCtaText || undefined, ctaUrl: "", subject: draftSubject },
        },
      });
      if (error) throw error;
      toast.success(`Email sent to ${draftLead.email}`);

      // Log to outreach_log and update lead status
      if (user) {
        const matchedLead = savedLeads.find((l) => l.email === draftLead.email && l.company === draftLead.company);
        if (matchedLead) {
          await logOutreach(matchedLead.id, "email", draftSubject, draftBody);
          if (matchedLead.status === "new") await updateLeadStatus(matchedLead.id, "contacted");
        }
      }

      setDraftModalOpen(false);
    } catch (e: any) { toast.error(e.message || "Failed to send email"); } finally { setSending(false); }
  };

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || isStreaming) return;
    const userItem: ChatItem = { type: "user", content: text };
    const allItems = [...items, userItem];
    setItems(allItems); setInput(""); setIsStreaming(true);
    let assistantSoFar = "";
    try {
      const apiMessages = allItems.filter((it): it is ChatItem & { type: "user" | "assistant" } => it.type !== "leads").map((m) => ({ role: m.type, content: m.content }));
      const resp = await fetch(CHAT_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }, body: JSON.stringify({ messages: apiMessages }) });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        setItems((prev) => [...prev, { type: "assistant", content: (err as any).error || "Something went wrong." }]);
        setIsStreaming(false); return;
      }
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        const normalizedContent = formatAssistantMessage(assistantSoFar);
        setItems((prev) => {
          const last = prev[prev.length - 1];
          if (last?.type === "assistant") return prev.map((m, i) => (i === prev.length - 1 && m.type === "assistant" ? { ...m, content: normalizedContent } : m));
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
            if (parsed.type === "niches" && parsed.niches) {
              setLocalNiches((prev) => {
                const seen = new Set(prev.map((n) => n.label));
                const merged = [...prev];
                const parentLabel = activeNicheRef.current;
                for (const niche of parsed.niches as Array<{ label: string; description?: string }>) {
                  if (!seen.has(niche.label)) {
                    seen.add(niche.label);
                    merged.push({ label: niche.label, description: niche.description || null, parent_label: parentLabel });
                  }
                }
                return merged;
              });
              if (user) upsertNiches(parsed.niches);
              continue;
            }
            if (parsed.type === "leads" && parsed.leads) { setItems((prev) => [...prev, { type: "leads", leads: parsed.leads }]); continue; }
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsert(content);
          } catch { buf = line + "\n" + buf; break; }
        }
      }
      if (buf.trim()) {
        for (let raw of buf.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "niches" && parsed.niches) {
              setLocalNiches((prev) => {
                const seen = new Set(prev.map((n) => n.label));
                const merged = [...prev];
                const parentLabel = activeNicheRef.current;
                for (const niche of parsed.niches as Array<{ label: string; description?: string }>) {
                  if (!seen.has(niche.label)) {
                    seen.add(niche.label);
                    merged.push({ label: niche.label, description: niche.description || null, parent_label: parentLabel });
                  }
                }
                return merged;
              });
              if (user) upsertNiches(parsed.niches);
              continue;
            }
            if (parsed.type === "leads" && parsed.leads) { setItems((prev) => [...prev, { type: "leads", leads: parsed.leads }]); continue; }
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


  // Chat items without leads (leads go to panel)
  const chatOnlyItems = items.filter(it => it.type !== "leads");
  const filteredPanelLeads = useMemo(() => {
    if (!activeNiche) return allLeads;
    return allLeads.filter((lead) => (lead.niche_tag || "Uncategorized") === activeNiche);
  }, [allLeads, activeNiche]);

  const sidebarSavedNiches = user ? savedNiches : sidebarNiches;
  // For non-authed users, convert in-memory leads to SavedLead shape for pipeline
  const dashboardLeads = useMemo(() => {
    if (user) return savedLeads;
    return filteredPanelLeads.map((l, i) => ({
      ...l,
      id: `temp-${i}-${l.name}-${l.company || ""}`,
      status: "new" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      niche_tag: l.niche_tag,
    }));
  }, [user, savedLeads, filteredPanelLeads]);

  // Mobile view toggle
  const [mobileView, setMobileView] = useState<"chat" | "results">("chat");

  // Main layout — two columns: LEFT = chat, RIGHT = niche sidebar + results
  const mainContent = (
    <div className="flex flex-col h-full min-h-0">
      {/* Mobile toggle */}
      <div className="md:hidden border-b border-border/40 bg-card/30 px-4 py-2 flex gap-2 shrink-0">
        <Button variant={mobileView === "chat" ? "default" : "outline"} size="sm" className="flex-1 text-xs h-8" onClick={() => setMobileView("chat")}>
          <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Chat
        </Button>
        <Button variant={mobileView === "results" ? "default" : "outline"} size="sm" className="flex-1 text-xs h-8" onClick={() => setMobileView("results")}>
          <Users className="w-3.5 h-3.5 mr-1.5" /> Results {allLeads.length > 0 && `(${allLeads.length})`}
        </Button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* LEFT COLUMN — Chat */}
        <div className={`flex flex-col min-w-0 w-1/3 shrink-0 ${mobileView !== "chat" ? "hidden md:flex" : "flex"}`}>
          {/* Header */}
          <div className="border-b border-border/40 bg-card/30 px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">Xcrow Scout</h1>
              <p className="text-xs text-muted-foreground">AI-guided lead discovery</p>
            </div>
            {!user && (
              <div className="ml-auto">
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                  Free — 5 Leads
                </Badge>
              </div>
            )}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4">
            <div className="max-w-2xl mx-auto py-6 space-y-4">
              <AnimatePresence initial={false}>
                {chatOnlyItems.map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    {item.type === "user" && (
                      <div className="flex justify-end gap-2">
                        <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%] text-sm">{item.content}</div>
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
                        <div className="bg-muted/50 border border-border/30 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[80%] text-sm prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5">
                          <ReactMarkdown>{formatAssistantMessage(item.content)}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {allLeads.length > 0 && items[items.length - 1]?.type === "leads" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Users className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-primary font-medium">
                    ✨ {allLeads.length} lead{allLeads.length !== 1 ? "s" : ""} found — see results →
                  </div>
                </motion.div>
              )}

              {isStreaming && chatOnlyItems[chatOnlyItems.length - 1]?.type !== "assistant" && (
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
          <div className="border-t border-border/40 bg-card/30 px-4 py-3 shrink-0">
            <form className="max-w-2xl mx-auto flex gap-2" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..." className="flex-1 bg-muted/20 border-border/40" autoFocus />
              <Button type="submit" size="icon" disabled={!input.trim()}><Send className="w-4 h-4" /></Button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN — Niche Sidebar + Results */}
        <div className={`flex flex-1 min-w-0 border-l border-border/40 ${mobileView !== "results" ? "hidden md:flex" : "flex"}`}>
          <NicheSidebar
            leads={user ? savedLeads : allLeads}
            savedNiches={sidebarSavedNiches}
            activeNiche={activeNiche}
            onSelectNiche={setActiveNiche}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
          />
          <LeadgenDashboard
            leads={dashboardLeads}
            outreach={outreach}
            activeNiche={activeNiche}
            onUpdateStatus={updateLeadStatus}
            onDraftEmail={handleDraftEmail}
            onExportCSV={exportCSV}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Xcrow Scout — AI Lead Gen Chat</title>
        <meta name="description" content="Chat with AI to build your ideal customer profile and discover qualified leads instantly." />
      </Helmet>
      <Navbar />
      <div className="flex flex-col h-screen pt-16">
        {mainContent}
      </div>


      {/* Email Draft Modal */}
      <Dialog open={draftModalOpen} onOpenChange={setDraftModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" /> Email to {draftLead?.name}
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
                <Input value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)} className="text-sm" placeholder="Email subject..." />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Body</label>
                <Textarea value={draftBody} onChange={(e) => setDraftBody(e.target.value)} className="text-sm min-h-[140px]" placeholder="Email body..." />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">CTA Button (optional)</label>
                <Input value={draftCtaText} onChange={(e) => setDraftCtaText(e.target.value)} className="text-sm" placeholder="e.g. Schedule a Call" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setDraftModalOpen(false)} disabled={sending}>
              <X className="w-3.5 h-3.5 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSendEmail} disabled={draftLoading || sending || !draftSubject || !draftBody} className="gap-1.5">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {sending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
