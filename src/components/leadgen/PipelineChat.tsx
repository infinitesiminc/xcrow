import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Bot, User, Loader2, Send, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { parseSSEStream } from "@/lib/sse-parser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { useResearchStream, parseReportText, type ParsedReport, type ParsedPersona } from "@/components/leadgen/ResearchSection";

/* ── Types ── */
type Stage =
  | "awaiting-domain"
  | "awaiting-deep-research"
  | "researching"
  | "awaiting-persona-confirm"
  | "finding-leads"
  | "ready";

interface TitleCompanyPair {
  title: string;
  company: string;
  selected: boolean;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  pills?: string[];
  /** When set, render an interactive (Company × Title) pair grid */
  pairs?: TitleCompanyPair[];
}

export interface PersonaPrefill {
  personaTitle: string;
  titles: string[];
  painPoints: string[];
  buyingTriggers: string[];
}

export interface PipelineChatContext {
  workspaceKey: string;
  leadCount: number;
  /** Provided when a workspace is restored (already has report) */
  initialReport?: ParsedReport | null;
}

export interface PipelineChatActions {
  /** Lead rows discovered from a search — append to the right-side leads table */
  onLeadsFound: (leads: any[]) => void;
  /** Called once domain is confirmed so parent can update workspace key */
  onDomainConfirmed?: (domain: string) => void;
  /** Called whenever research completes so parent can persist report */
  onResearchComplete?: (report: ParsedReport, domain: string) => void;
}

interface PipelineChatProps {
  context: PipelineChatContext;
  actions: PipelineChatActions;
  /** External persona prefill (from old "Find Leads" buttons elsewhere — optional) */
  pendingPersona?: PersonaPrefill | null;
  onPersonaConsumed?: () => void;
}

/* ── Persistence (localStorage per workspace) ── */
const chatKey = (ws: string) => `xcrow:chat:${ws || "default"}`;
const stageKey = (ws: string) => `xcrow:stage:${ws || "default"}`;

function loadChat(ws: string): { messages: ChatMessage[]; stage: Stage } | null {
  try {
    const raw = localStorage.getItem(chatKey(ws));
    const stageRaw = localStorage.getItem(stageKey(ws));
    if (!raw) return null;
    return { messages: JSON.parse(raw), stage: (stageRaw as Stage) || "ready" };
  } catch {
    return null;
  }
}

function saveChat(ws: string, messages: ChatMessage[], stage: Stage) {
  try {
    localStorage.setItem(chatKey(ws), JSON.stringify(messages));
    localStorage.setItem(stageKey(ws), stage);
  } catch { /* quota or disabled */ }
}

/* ── Helpers ── */
function normalizeDomain(input: string): string {
  return input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

function isValidDomain(input: string): boolean {
  const d = normalizeDomain(input);
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d);
}

/** Build flat (company, title) pairs from a parsed report */
function buildPairsFromReport(report: ParsedReport): TitleCompanyPair[] {
  const titles: string[] = [];
  for (const p of report.personas) {
    for (const t of p.titles) {
      if (!titles.includes(t)) titles.push(t);
    }
    if (p.titles.length === 0 && p.title) {
      if (!titles.includes(p.title)) titles.push(p.title);
    }
  }
  const companies = report.prospectDomains.slice(0, 6);
  if (companies.length === 0) companies.push("(any company)");
  const pairs: TitleCompanyPair[] = [];
  for (const company of companies) {
    for (const title of titles.slice(0, 3)) {
      pairs.push({ company, title, selected: true });
    }
  }
  return pairs.slice(0, 12);
}

/* ── Main Component ── */
export function PipelineChat({ context, actions, pendingPersona, onPersonaConsumed }: PipelineChatProps) {
  const research = useResearchStream();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stage, setStage] = useState<Stage>("awaiting-domain");
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingDomain, setPendingDomain] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initRef = useRef(false);

  /* Initialize / restore on workspace change */
  useEffect(() => {
    initRef.current = false;
    const restored = loadChat(context.workspaceKey);
    if (restored && restored.messages.length > 0) {
      setMessages(restored.messages);
      setStage(restored.stage);
    } else if (context.initialReport && context.workspaceKey !== "default") {
      // Workspace exists with a report but no chat history yet — replay summary
      const r = context.initialReport;
      const pairs = buildPairsFromReport(r);
      setMessages([
        { role: "assistant", content: `Welcome back to **${context.workspaceKey}**. Research is loaded — ${r.personas.length} personas, ${r.prospectDomains.length} target companies. Pick the (company × title) combos you want me to source leads for, then hit **Find leads for selected**.`, pairs },
      ]);
      setStage("awaiting-persona-confirm");
    } else {
      setMessages([
        { role: "assistant", content: "Hi — drop the company URL you want to research and I'll map their ICP, find target accounts, and source decision-maker leads. e.g. `chalk.ai`" },
      ]);
      setStage("awaiting-domain");
    }
    initRef.current = true;
  }, [context.workspaceKey]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Persist on every change */
  useEffect(() => {
    if (!initRef.current) return;
    saveChat(context.workspaceKey, messages, stage);
  }, [messages, stage, context.workspaceKey]);

  /* Auto-scroll */
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  /* Watch research completion → propose pairs */
  useEffect(() => {
    if (stage === "researching" && research.isComplete && research.report) {
      const r = research.report;
      const pairs = buildPairsFromReport(r);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `Research complete ✅ — **${r.personas.length} personas** identified across **${r.prospectDomains.length} target companies**. Here are the most relevant (company × decision-maker) combos. Toggle any off, then hit **Find leads for selected**.`,
          pairs,
        },
      ]);
      setStage("awaiting-persona-confirm");
      actions.onResearchComplete?.(r, pendingDomain || context.workspaceKey);
    }
    if (stage === "researching" && research.error) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ Research failed: ${research.error}. Try another URL.` }]);
      setStage("awaiting-domain");
    }
  }, [research.isComplete, research.error, research.report, stage]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Handle external persona prefill (from legacy "Find Leads" buttons) */
  const prefillRef = useRef<string | null>(null);
  useEffect(() => {
    if (!pendingPersona || isStreaming) return;
    if (prefillRef.current === pendingPersona.personaTitle) return;
    prefillRef.current = pendingPersona.personaTitle;
    runLeadSearch([{
      title: pendingPersona.titles[0] || pendingPersona.personaTitle,
      company: "",
      selected: true,
    }]);
    onPersonaConsumed?.();
  }, [pendingPersona?.personaTitle]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── User submits domain ─── */
  const handleDomainSubmit = useCallback((raw: string) => {
    if (!isValidDomain(raw)) {
      setMessages(prev => [...prev, { role: "assistant", content: "That doesn't look like a valid domain. Try something like `chalk.ai` or `https://stripe.com`." }]);
      return;
    }
    const domain = normalizeDomain(raw);
    setPendingDomain(domain);
    setMessages(prev => [
      ...prev,
      { role: "user", content: raw },
      {
        role: "assistant",
        content: `Got it — **${domain}**. Want me to ground the analysis in real customer wins? Paste 1-5 case-study or use-case URLs (one per line), or reply **skip** to go straight to research.`,
      },
    ]);
    setStage("awaiting-deep-research");
  }, []);

  /* ─── User submits deep-research URLs (or skip) ─── */
  const handleDeepResearchSubmit = useCallback((raw: string) => {
    const trimmed = raw.trim();
    const skip = /^skip$/i.test(trimmed) || trimmed === "";
    let urls: string[] = [];
    if (!skip) {
      urls = trimmed.split(/\s+/).filter(u => /^https?:\/\//.test(u)).slice(0, 5);
    }
    setMessages(prev => [
      ...prev,
      { role: "user", content: raw || "skip" },
      {
        role: "assistant",
        content: skip || urls.length === 0
          ? `Starting research on **${pendingDomain}**… this takes ~60-90 seconds. I'll surface findings the moment they're ready.`
          : `Grounding research on **${pendingDomain}** with ${urls.length} case-study URL${urls.length > 1 ? "s" : ""}… ~90 seconds.`,
      },
    ]);
    setStage("researching");
    actions.onDomainConfirmed?.(pendingDomain);
    research.start(pendingDomain, undefined, urls);
  }, [pendingDomain, research, actions]);

  /* ─── Toggle a pair ─── */
  const togglePair = useCallback((msgIdx: number, pairIdx: number) => {
    setMessages(prev => prev.map((m, i) => {
      if (i !== msgIdx || !m.pairs) return m;
      const pairs = m.pairs.map((p, pi) => pi === pairIdx ? { ...p, selected: !p.selected } : p);
      return { ...m, pairs };
    }));
  }, []);

  /* ─── Run lead search for confirmed pairs ─── */
  const runLeadSearch = useCallback(async (pairs: TitleCompanyPair[]) => {
    const selected = pairs.filter(p => p.selected);
    if (selected.length === 0) {
      setMessages(prev => [...prev, { role: "assistant", content: "Select at least one (company × title) pair to search." }]);
      return;
    }
    setStage("finding-leads");
    setMessages(prev => [...prev, { role: "assistant", content: `🔎 Sourcing leads for ${selected.length} target${selected.length > 1 ? "s" : ""}…` }]);

    let totalFound = 0;
    for (const pair of selected) {
      const queryText = `Find 5 ${pair.title} at ${pair.company || "relevant companies"}.`;
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const { data: { session } } = await supabase.auth.getSession();
        const resp = await fetch(`${supabaseUrl}/functions/v1/leadgen-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token ?? supabaseKey}`,
            "apikey": supabaseKey,
          },
          body: JSON.stringify({
            website: context.workspaceKey !== "default" ? context.workspaceKey : pendingDomain,
            context: { workspaceKey: context.workspaceKey, researchStatus: "complete", icpContext: "" },
            messages: [{ role: "user", content: queryText }],
          }),
        });
        if (!resp.ok) continue;
        const reader = resp.body?.getReader();
        if (!reader) continue;
        let count = 0;
        await parseSSEStream(reader, {
          onTextDelta: () => {},
          onLeads: (leads) => { count += leads.length; actions.onLeadsFound(leads); },
          onDone: () => {},
        });
        totalFound += count;
      } catch (e) {
        console.error("Lead search error:", e);
      }
    }

    setMessages(prev => [...prev, {
      role: "assistant",
      content: totalFound > 0
        ? `✅ Added **${totalFound} leads** to your pipeline. Open the table on the right to review, draft outreach, or find lookalikes.`
        : `Hm, no leads came back for those targets. Try broadening titles or pick different companies.`,
    }]);
    setStage("ready");
  }, [actions, context.workspaceKey, pendingDomain]);

  /* ─── Free-form chat (after ready) ─── */
  const sendFreeChat = useCallback(async (text: string) => {
    if (!text || isStreaming) return;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setIsStreaming(true);
    let buf = "";
    const upsert = (chunk: string) => {
      buf += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: buf } : m);
        }
        return [...prev, { role: "assistant", content: buf }];
      });
    };
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${supabaseUrl}/functions/v1/leadgen-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? supabaseKey}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({
          website: context.workspaceKey !== "default" ? context.workspaceKey : "",
          context: { workspaceKey: context.workspaceKey, researchStatus: "complete", leadCount: context.leadCount },
          messages: [...messages.slice(-10).map(m => ({ role: m.role, content: m.content })), { role: "user", content: text }],
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No body");
      await parseSSEStream(reader, {
        onTextDelta: upsert,
        onLeads: (leads) => actions.onLeadsFound(leads),
        onDone: () => {},
      });
    } catch {
      upsert("\n\n⚠️ Something went wrong.");
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }, [isStreaming, messages, context, actions]);

  /* ─── Submit handler — routes by stage ─── */
  const handleSubmit = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    if (stage === "awaiting-domain") {
      setInput("");
      handleDomainSubmit(text);
    } else if (stage === "awaiting-deep-research") {
      setInput("");
      handleDeepResearchSubmit(text);
    } else if (stage === "ready") {
      sendFreeChat(text);
    }
  }, [input, stage, handleDomainSubmit, handleDeepResearchSubmit, sendFreeChat]);

  /* ─── Placeholder per stage ─── */
  const placeholder = useMemo(() => {
    switch (stage) {
      case "awaiting-domain": return "Enter a company URL, e.g. chalk.ai";
      case "awaiting-deep-research": return "Paste case-study URLs or type 'skip'";
      case "researching": return "Research in progress…";
      case "awaiting-persona-confirm": return "Pick combos above, then Find leads";
      case "finding-leads": return "Sourcing leads…";
      case "ready": return "Ask anything — find more leads, draft outreach, etc.";
    }
  }, [stage]);

  const inputDisabled = stage === "researching" || stage === "finding-leads" || stage === "awaiting-persona-confirm" || isStreaming;

  /* ─── Render ─── */
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 shrink-0">
        <Bot className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Co-pilot</span>
        {context.workspaceKey !== "default" && (
          <span className="text-[10px] text-muted-foreground font-mono ml-auto truncate max-w-[200px]">
            {context.workspaceKey}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3" style={{ overscrollBehavior: "contain" }}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((msg, i) => (
            <div key={i}>
              <div className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={`rounded-lg px-3.5 py-2.5 max-w-[85%] text-sm ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none [&>p]:my-1 [&>p]:text-secondary-foreground [&_strong]:text-secondary-foreground">
                      <ReactMarkdown>{msg.content.replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/g, "").trim()}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* (Company × Title) pair pills */}
              {msg.role === "assistant" && msg.pairs && msg.pairs.length > 0 && (
                <div className="ml-9 mt-3 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {msg.pairs.map((p, pi) => (
                      <button
                        key={`${p.company}-${p.title}-${pi}`}
                        onClick={() => stage === "awaiting-persona-confirm" && togglePair(i, pi)}
                        disabled={stage !== "awaiting-persona-confirm"}
                        className={cn(
                          "text-[11px] px-3 py-1.5 rounded-full border transition-all",
                          p.selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40",
                          stage !== "awaiting-persona-confirm" && "opacity-70 cursor-default",
                        )}
                      >
                        <span className="font-medium">{p.title}</span>
                        {p.company && <span className="opacity-70"> · {p.company}</span>}
                      </button>
                    ))}
                  </div>
                  {stage === "awaiting-persona-confirm" && i === messages.length - 1 && (
                    <Button
                      size="sm"
                      onClick={() => runLeadSearch(msg.pairs!)}
                      className="h-8 text-xs gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Find leads for selected ({msg.pairs.filter(p => p.selected).length})
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Research progress indicator */}
          {stage === "researching" && (
            <div className="ml-9 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{Math.floor(research.elapsed)}s elapsed · {research.phases.find(p => p.status === "active")?.label || "Initializing…"}</span>
            </div>
          )}

          {(isStreaming || stage === "finding-leads") && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted/60 rounded-lg px-3.5 py-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      <div className="border-t border-border p-3 shrink-0">
        <div className="flex gap-2 max-w-3xl mx-auto w-full">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={placeholder}
            disabled={inputDisabled}
            className="min-h-[42px] max-h-[120px] resize-none text-sm"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!input.trim() || inputDisabled}
            className="shrink-0 h-[42px] w-[42px]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
