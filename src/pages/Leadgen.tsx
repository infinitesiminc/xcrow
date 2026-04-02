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
import { Send, Bot, User, Loader2, MessageSquare, Mail, Check, X, Users, Globe, Sparkles, ArrowRight, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { LeadgenDashboard } from "@/components/leadgen/LeadgenDashboard";
import { useLeadsCRUD } from "@/components/leadgen/useLeadsCRUD";
import type { Lead } from "@/components/leadgen/LeadCard";


const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leadgen-chat`;
const SCOUT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leadgen-scout`;

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

export default function Leadgen() {
  const { user, profile, openAuthModal } = useAuth();
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [localNiches, setLocalNiches] = useState<Array<{ label: string; description: string | null; parent_label: string | null; niche_type: string }>>([]);
  const [activeNiche, setActiveNiche] = useState<string | null>(null);
  const [isFindingLeads, setIsFindingLeads] = useState(false);
  const [isEnrichingLeads, setIsEnrichingLeads] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeNicheRef = useRef<string | null>(null);
  activeNicheRef.current = activeNiche;

  // Discovery state
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryPhase, setDiscoveryPhase] = useState("");
  const [companySummary, setCompanySummary] = useState("");
  const [icpSummary, setIcpSummary] = useState("");
  const [pagesScraped, setPagesScraped] = useState(0);
  const [hasDiscovered, setHasDiscovered] = useState(false);
  
  const {
    leads: savedLeads, outreach, niches: savedNiches,
    upsertLeads, upsertNiches, updateLeadStatus, logOutreach, exportCSV,
  } = useLeadsCRUD(user?.id);

  // Email draft state
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [draftLead, setDraftLead] = useState<Lead | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftCtaText, setDraftCtaText] = useState("");
  const [sending, setSending] = useState(false);

  // Check if user already has niches from DB
  useEffect(() => {
    if (savedNiches.length > 0) {
      setHasDiscovered(true);
    }
  }, [savedNiches]);

  const sidebarNiches = useMemo(
    () => localNiches.map((n, index) => ({
      id: `local-${index}-${n.label}`,
      label: n.label,
      description: n.description,
      status: "active",
      lead_count: 0,
      created_at: new Date().toISOString(),
      parent_label: n.parent_label,
      niche_type: n.niche_type as any,
    })),
    [localNiches]
  );

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

  useEffect(() => {
    if (user && allLeads.length > 0) upsertLeads(allLeads);
  }, [allLeads, user, upsertLeads]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  useEffect(() => { scrollToBottom(); }, [items, scrollToBottom]);

  // --- Discovery: single URL input ---
  const handleDiscover = async () => {
    const url = websiteUrl.trim();
    if (!url) return;
    setIsDiscovering(true);
    setDiscoveryPhase("Mapping site pages...");

    try {
      setTimeout(() => setDiscoveryPhase("Scraping key pages (about, solutions, customers)..."), 3000);
      setTimeout(() => setDiscoveryPhase("Analyzing business model & customers..."), 7000);
      setTimeout(() => setDiscoveryPhase("Building 3-layer ICP tree..."), 11000);

      const resp = await fetch(SCOUT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ website: url }),
      });

      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.error || "Discovery failed");

      setCompanySummary(data.company_summary || "");
      setIcpSummary(data.icp_summary || "");
      setPagesScraped(data.pages_scraped || 1);

      // Populate niches
      const niches = data.niches as Array<{ label: string; description: string; parent_label: string | null; niche_type: string }>;
      setLocalNiches(niches);

      // Persist to DB if authed
      if (user) {
        upsertNiches(niches.map(n => ({
          label: n.label,
          description: n.description || "",
          parent_label: n.parent_label,
          niche_type: n.niche_type as any,
        })));
      }

      setHasDiscovered(true);
      setChatOpen(false);
      toast.success(`ICP mapped: ${niches.filter(n => n.niche_type === "vertical").length} verticals discovered`);
    } catch (e: any) {
      toast.error(e.message || "Failed to analyze website");
    } finally {
      setIsDiscovering(false);
      setDiscoveryPhase("");
    }
  };

  // --- Chat handlers (kept for follow-up) ---
  const handleDraftEmail = async (lead: Lead) => {
    if (!user) { openAuthModal(); return; }
    if (!lead.email) { toast.error("This lead has no email address."); return; }
    setDraftLead(lead); setDraftModalOpen(true); setDraftLoading(true);
    setDraftSubject(""); setDraftBody(""); setDraftCtaText("");
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/draft-outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          lead: { name: lead.name, title: lead.title, company: lead.company, email: lead.email, reason: lead.reason, summary: lead.summary },
          senderInfo: { name: profile?.displayName || user.email?.split("@")[0], company: profile?.company || "", website: websiteUrl },
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
                const parentEntry = parentLabel ? prev.find((n) => n.label === parentLabel) : null;
                const nicheType = !parentLabel ? "vertical" : parentEntry?.niche_type === "vertical" ? "segment" : "persona";
                for (const niche of parsed.niches as Array<{ label: string; description?: string }>) {
                  if (!seen.has(niche.label)) {
                    seen.add(niche.label);
                    merged.push({ label: niche.label, description: niche.description || null, parent_label: parentLabel, niche_type: nicheType });
                  }
                }
                return merged;
              });
              if (user) {
                const parentEntry = localNiches.find((n) => n.label === activeNicheRef.current);
                const nicheType = !activeNicheRef.current ? "vertical" : parentEntry?.niche_type === "vertical" ? "segment" : "persona";
                upsertNiches((parsed.niches as Array<{ label: string; description?: string }>).map(n => ({ ...n, description: n.description || "", parent_label: activeNicheRef.current, niche_type: nicheType as any })));
              }
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
                const parentEntry = parentLabel ? prev.find((n) => n.label === parentLabel) : null;
                const nicheType = !parentLabel ? "vertical" : parentEntry?.niche_type === "vertical" ? "segment" : "persona";
                for (const niche of parsed.niches as Array<{ label: string; description?: string }>) {
                  if (!seen.has(niche.label)) {
                    seen.add(niche.label);
                    merged.push({ label: niche.label, description: niche.description || null, parent_label: parentLabel, niche_type: nicheType });
                  }
                }
                return merged;
              });
              if (user) {
                const parentEntry = localNiches.find((n) => n.label === activeNicheRef.current);
                const nicheType = !activeNicheRef.current ? "vertical" : parentEntry?.niche_type === "vertical" ? "segment" : "persona";
                upsertNiches((parsed.niches as Array<{ label: string; description?: string }>).map(n => ({ ...n, description: n.description || "", parent_label: activeNicheRef.current, niche_type: nicheType as any })));
              }
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

  // ICP Action Handlers
  const handleFindLeads = (niche: string) => {
    if (!user) { openAuthModal(); return; }
    setIsFindingLeads(true);
    setChatOpen(true);
    sendMessage(`Find leads for the "${niche}" niche. Search for prospects matching this ICP.`).finally(() => setIsFindingLeads(false));
  };

  const handleEnrichLeads = async (niche: string) => {
    if (!user) { openAuthModal(); return; }
    setIsEnrichingLeads(true);
    setChatOpen(true);
    const nicheLeads = savedLeads.filter((l) => l.niche_tag === niche && !l.email);
    if (nicheLeads.length === 0) {
      toast.info("All leads in this niche already have contact details.");
      setIsEnrichingLeads(false); return;
    }
    sendMessage(`Enrich contacts for leads in the "${niche}" niche — find email addresses and phone numbers for the ${nicheLeads.length} leads missing contact info.`).finally(() => setIsEnrichingLeads(false));
  };

  const handleScoreLeads = (niche: string) => {
    if (!user) { openAuthModal(); return; }
    setChatOpen(true);
    sendMessage(`Score and rank the leads in the "${niche}" niche by ICP fit, deal readiness, and potential value.`);
  };

  const handleDraftAllOutreach = (niche: string) => {
    if (!user) { openAuthModal(); return; }
    const nicheLeads = savedLeads.filter((l) => l.niche_tag === niche && l.email && l.status === "new");
    if (nicheLeads.length === 0) { toast.info("No uncontacted leads with emails in this niche."); return; }
    handleDraftEmail(nicheLeads[0]);
  };

  const handleExportNiche = (niche: string) => {
    const nicheLeads = savedLeads.filter((l) => l.niche_tag === niche);
    if (nicheLeads.length === 0) { toast.info("No leads to export in this niche."); return; }
    const headers = ["Name", "Title", "Company", "Email", "Phone", "LinkedIn", "Status", "Source"];
    const rows = nicheLeads.map((l) => [l.name, l.title || "", l.company || "", l.email || "", l.phone || "", l.linkedin || "", l.status, l.source || ""]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `leads-${niche.replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const chatOnlyItems = items.filter(it => it.type !== "leads");
  const filteredPanelLeads = useMemo(() => {
    if (!activeNiche) return allLeads;
    return allLeads.filter((lead) => (lead.niche_tag || "Uncategorized") === activeNiche);
  }, [allLeads, activeNiche]);

  const sidebarSavedNiches = useMemo(() => {
    const seen = new Set<string>();
    const merged: typeof savedNiches = [];
    for (const n of (user ? savedNiches : [])) {
      if (!seen.has(n.label)) { seen.add(n.label); merged.push(n); }
    }
    for (const n of sidebarNiches) {
      if (!seen.has(n.label)) { seen.add(n.label); merged.push(n); }
    }
    return merged;
  }, [user, savedNiches, sidebarNiches]);

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

  const [mobileView, setMobileView] = useState<"chat" | "results">("results");

  const handleSeedFromLibrary = (niches: Array<{ label: string; description: string; parent_label: string | null; niche_type: string }>) => {
    setLocalNiches(niches);
    if (user) {
      upsertNiches(niches.map(n => ({
        label: n.label,
        description: n.description || "",
        parent_label: n.parent_label,
        niche_type: n.niche_type as any,
      })));
    }
    setHasDiscovered(true);
    setBrowseLibrary(false);
    setCompanySummary(niches.find(n => n.niche_type === "vertical")?.label || "Industry ICP");
    setIcpSummary("Seeded from Niche Library");
    toast.success(`ICP seeded: ${niches.filter(n => n.niche_type === "vertical").length} vertical, ${niches.filter(n => n.niche_type === "segment").length} segments, ${niches.filter(n => n.niche_type === "persona").length} personas`);
  };

  // Discovery hero (shown when no niches)
  const discoveryHero = (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full text-center space-y-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Globe className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Discover Your Ideal Customers</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Enter your company website and our AI will analyze your business, map industry verticals, company segments, and buyer personas — building your complete ICP in seconds.
          </p>
        </div>

        <form
          className="flex gap-2 max-w-md mx-auto"
          onSubmit={(e) => { e.preventDefault(); handleDiscover(); }}
        >
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="yourcompany.com"
              className="pl-9 h-11 text-sm bg-card border-border/60"
              disabled={isDiscovering}
            />
          </div>
          <Button type="submit" className="h-11 px-5 gap-2" disabled={!websiteUrl.trim() || isDiscovering}>
            {isDiscovering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isDiscovering ? "Analyzing..." : "Map ICP"}
          </Button>
        </form>

        {isDiscovering && discoveryPhase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 text-sm text-primary"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {discoveryPhase}
          </motion.div>
        )}

        <div className="flex items-center justify-center gap-3 mt-2">
          <div className="w-12 h-px bg-border/40" />
          <span className="text-xs text-muted-foreground/60">or</span>
          <div className="w-12 h-px bg-border/40" />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 mx-auto text-xs"
          onClick={() => setBrowseLibrary(true)}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Browse Niche Library
          <Badge variant="secondary" className="text-[10px] ml-1">19 industries</Badge>
        </Button>

        <p className="text-xs text-muted-foreground/60">
          Works best with B2B companies. We'll scrape your site to understand your offering.
        </p>
      </motion.div>
    </div>
  );

  // Niche stats
  const allNiches = sidebarSavedNiches;
  const verticalCount = allNiches.filter(n => n.niche_type === "vertical").length;
  const segmentCount = allNiches.filter(n => n.niche_type === "segment").length;
  const personaCount = allNiches.filter(n => n.niche_type === "persona").length;
  const totalLeadCount = dashboardLeads.length;

  // Company overview snapshot
  const contextBar = (companySummary || icpSummary) && hasDiscovered ? (
    <div className="border-b border-border/40 bg-gradient-to-r from-card/80 to-card/50 px-5 py-3 shrink-0">
      <div className="flex items-start gap-4">
        {/* Company icon + info */}
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Globe className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground truncate">{companySummary}</h3>
            {websiteUrl && (
              <Badge variant="outline" className="text-xs shrink-0 border-border/40">
                {websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </Badge>
            )}
          </div>
          {icpSummary && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              <span className="font-medium text-foreground/80">Target:</span> {icpSummary}
            </p>
          )}
        </div>

        {/* Stats pills */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-3 bg-muted/40 rounded-lg px-3 py-1.5 border border-border/30">
            {pagesScraped > 0 && (
              <>
                <div className="text-center">
                  <p className="text-sm font-bold text-muted-foreground">{pagesScraped}</p>
                  <p className="text-[10px] text-muted-foreground leading-none">Pages</p>
                </div>
                <div className="w-px h-6 bg-border/40" />
              </>
            )}
            <div className="text-center">
              <p className="text-sm font-bold text-primary">{verticalCount}</p>
              <p className="text-[10px] text-muted-foreground leading-none">Verticals</p>
            </div>
            <div className="w-px h-6 bg-border/40" />
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">{segmentCount}</p>
              <p className="text-[10px] text-muted-foreground leading-none">Segments</p>
            </div>
            <div className="w-px h-6 bg-border/40" />
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">{personaCount}</p>
              <p className="text-[10px] text-muted-foreground leading-none">Personas</p>
            </div>
            <div className="w-px h-6 bg-border/40" />
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">{totalLeadCount}</p>
              <p className="text-[10px] text-muted-foreground leading-none">Leads</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => { setHasDiscovered(false); setLocalNiches([]); setCompanySummary(""); setIcpSummary(""); setPagesScraped(0); }}
          >
            <ArrowRight className="w-3 h-3" />
            Re-analyze
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  const mainContent = (
    <div className="flex flex-col h-full min-h-0">
      {/* Mobile toggle */}
      {hasDiscovered && (
        <div className="md:hidden border-b border-border/40 bg-card/30 px-4 py-2 flex gap-2 shrink-0">
          <Button variant={mobileView === "results" ? "default" : "outline"} size="sm" className="flex-1 text-xs h-8" onClick={() => setMobileView("results")}>
            <Users className="w-3.5 h-3.5 mr-1.5" /> Map & Leads
          </Button>
          <Button variant={mobileView === "chat" ? "default" : "outline"} size="sm" className="flex-1 text-xs h-8" onClick={() => { setMobileView("chat"); setChatOpen(true); }}>
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Chat
          </Button>
        </div>
      )}

      {contextBar}

      {browseLibrary ? (
        <NicheLibrary onSeedNiches={handleSeedFromLibrary} onBack={() => setBrowseLibrary(false)} />
      ) : !hasDiscovered ? discoveryHero : (
        <div className="flex flex-1 min-h-0">
          <div className="flex flex-1 min-w-0">
            <LeadgenDashboard
              leads={dashboardLeads}
              outreach={outreach}
              activeNiche={activeNiche}
              onSelectNiche={setActiveNiche}
              nicheLeads={user ? savedLeads : allLeads}
              savedNiches={sidebarSavedNiches}
              onUpdateStatus={updateLeadStatus}
              onDraftEmail={handleDraftEmail}
              onExportCSV={exportCSV}
              onFindLeads={handleFindLeads}
              onEnrichLeads={handleEnrichLeads}
              onScoreLeads={handleScoreLeads}
              onDraftAll={handleDraftAllOutreach}
              onExportNiche={handleExportNiche}
              isFinding={isFindingLeads}
              isEnriching={isEnrichingLeads}
            />
          </div>
        </div>
      )}

      {/* Floating Chat Dock */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] bg-card border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="border-b border-border/40 bg-card/80 backdrop-blur px-4 py-2.5 flex items-center gap-3 shrink-0">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xs font-semibold text-foreground">Xcrow Scout</h2>
                <p className="text-xs text-muted-foreground">AI-guided lead discovery</p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setChatOpen(false)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 px-3">
              <div className="py-4 space-y-3">
                {chatOnlyItems.length === 0 && (
                  <div className="flex gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                    <div className="bg-muted/50 border border-border/30 rounded-2xl rounded-bl-md px-3 py-2 max-w-[85%] text-xs">
                      Your ICP map is ready! Click <strong>Find Leads</strong> on any niche to start prospecting, or ask me anything about your market.
                    </div>
                  </div>
                )}
                {chatOnlyItems.map((item, i) => (
                  <div key={i}>
                    {item.type === "user" && (
                      <div className="flex justify-end gap-1.5">
                        <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-3 py-2 max-w-[85%] text-xs">{item.content}</div>
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </div>
                    )}
                    {item.type === "assistant" && (
                      <div className="flex gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3 h-3 text-primary" />
                        </div>
                        <div className="bg-muted/50 border border-border/30 rounded-2xl rounded-bl-md px-3 py-2 max-w-[85%] text-xs prose prose-xs dark:prose-invert prose-p:my-0.5 prose-ul:my-0.5 prose-ol:my-0.5 prose-li:my-0 [&_ol]:list-decimal [&_ol]:pl-4">
                          <ReactMarkdown>{formatAssistantMessage(item.content)}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isStreaming && chatOnlyItems[chatOnlyItems.length - 1]?.type !== "assistant" && (
                  <div className="flex gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                    <div className="bg-muted/50 border border-border/30 rounded-2xl rounded-bl-md px-3 py-2.5">
                      <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            <div className="border-t border-border/40 bg-card/80 backdrop-blur px-3 py-2 shrink-0">
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
                <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your market..." className="flex-1 bg-muted/20 border-border/40 h-8 text-xs" />
                <Button type="submit" size="icon" className="h-8 w-8" disabled={!input.trim()}><Send className="w-3.5 h-3.5" /></Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      {hasDiscovered && !chatOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
          onClick={() => setChatOpen(true)}
        >
          <MessageSquare className="w-5 h-5" />
          {isStreaming && <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />}
        </motion.button>
      )}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Xcrow Scout — AI Lead Generation</title>
        <meta name="description" content="Enter your website and instantly map your ideal customer profile with AI-powered lead generation." />
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
