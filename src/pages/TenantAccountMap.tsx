import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Building2, Zap, Send, Bot, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { parseSSEStream } from "@/lib/sse-parser";
import AccountListView from "@/components/enterprise/AccountListView";
import AccountDetailInline from "@/components/enterprise/AccountDetailInline";
import ICPResearchStream, { type ResearchPhase } from "@/components/enterprise/ICPResearchStream";
import ResearchProgressCompact from "@/components/enterprise/ResearchProgressCompact";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import {
  STAGE_CONFIG,
  type FlashAccount,
  type AccountStage,
  type AccountType,
} from "@/types/accounts";

/* ── Hook: load accounts from DB with tenant_slug filter ── */
function useDBAccounts(tenantSlug: string): { accounts: FlashAccount[]; loading: boolean; refetch: () => void } {
  const [dbAccounts, setDbAccounts] = useState<FlashAccount[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase.from("flash_accounts") as any)
        .select("*")
        .eq("tenant_slug", tenantSlug)
        .order("name");
      if (error || !data || data.length === 0) {
        setDbAccounts([]);
        setLoading(false);
        return;
      }
      const mapped: FlashAccount[] = data.map((r: any) => ({
        id: r.id,
        name: r.name,
        accountType: r.account_type as AccountType,
        stage: r.stage as AccountStage,
        estimatedSpaces: r.estimated_spaces || "N/A",
        facilityCount: r.facility_count || "N/A",
        focusArea: r.focus_area || "",
        hqCity: r.hq_city || "",
        hqLat: r.hq_lat || 0,
        hqLng: r.hq_lng || 0,
        website: r.website || "",
        differentiator: r.differentiator || "",
        caseStudyUrl: r.case_study_url || undefined,
        currentVendor: r.current_vendor || undefined,
        annualRevenue: r.annual_revenue || undefined,
        employeeCount: r.employee_count || undefined,
        founded: r.founded || undefined,
        priorityScore: r.priority_score || 0,
        notes: r.notes || undefined,
        ownership_type: r.ownership_type,
        contract_model: r.contract_model,
      }));
      setDbAccounts(mapped);
    } catch {
      setDbAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  return { accounts: dbAccounts ?? [], loading, refetch: fetchAccounts };
}

/* ── Types for extracted targets ── */
interface ResearchTarget {
  name: string;
  domain?: string;
  description: string;
  rationale: string;
  revenue_hint?: string;
  employee_hint?: string;
  hq_hint?: string;
  account_type?: string;
}

interface AccountLeadData {
  leads: { name: string; title?: string; email?: string; linkedin?: string; score?: number; reason?: string }[];
}

const liveResearchRequestState = {
  activeKey: null as string | null,
  activeRequestId: 0,
};

function buildResearchRequestKey(domain: string, companyContext?: string) {
  return JSON.stringify({
    domain: domain.trim().toLowerCase(),
    companyContext: companyContext?.trim() ?? "",
  });
}

/* ══════════════════════════════════════════════════════════
   Tenant Setup Chat — AI-powered pipeline builder
   ══════════════════════════════════════════════════════════ */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function TenantSetupChat({ tenant, accountCount, onAccountsAdded, externalMessages, onPillClick }: {
  tenant: { slug: string; name: string; contextPrompt: string; accountTypes: { value: string; label: string }[] };
  accountCount: number;
  onAccountsAdded: () => void;
  externalMessages?: ChatMessage[];
  onPillClick?: (pill: string) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const injectedCountRef = useRef(0);

  useEffect(() => {
    if (messages.length === 0) {
      const welcome: ChatMessage = {
        role: "assistant",
        content: accountCount > 0
          ? `Welcome back to the **${tenant.name}** pipeline. You have **${accountCount} accounts** loaded.\n\nI can help you:\n- 🔍 Research competitors and prospects\n- 👥 Find decision-makers at target accounts\n- 📊 Analyze market opportunities\n\nWhat would you like to do?`
          : `Let's build the **${tenant.name}** account pipeline from scratch.\n\nI'll auto-research your company and industry to seed the pipeline with:\n- 🎯 Target accounts\n- ⚔️ Key competitors\n- 🏢 Strategic partners\n\nTo get started, just say **"set up my pipeline"** or tell me about a specific company to research.`,
      };
      setMessages([welcome]);
    }
  }, []);

  useEffect(() => {
    if (externalMessages && externalMessages.length > injectedCountRef.current) {
      const newMsgs = externalMessages.slice(injectedCountRef.current);
      injectedCountRef.current = externalMessages.length;
      setMessages(prev => [...prev, ...newMsgs]);
    }
  }, [externalMessages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const systemPrompt = `You are the Xcrow Enterprise Pipeline Assistant for ${tenant.name}. ${tenant.contextPrompt}

Your job is to help build and manage the account pipeline. You can:
1. Research companies and suggest them as target accounts
2. Identify competitors in the industry
3. Provide market intelligence and analysis
4. Help prioritize accounts by fit and opportunity size

Account types available: ${tenant.accountTypes.map(t => t.label).join(", ")}.

When suggesting accounts to add, format them clearly with name, type, estimated revenue, and why they're a good target.
Keep responses focused and actionable. Use markdown formatting.`;

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
          website: `${tenant.slug}.com`,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.filter(m => m.role !== "assistant" || messages.indexOf(m) > 0).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
        }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No body");

      await parseSSEStream(reader, {
        onTextDelta: (chunk) => upsertAssistant(chunk),
        onLeads: (leads) => {
          upsertAssistant(`\n\n> 📋 Found ${leads.length} contacts — pipeline integration coming soon.`);
        },
        onDone: () => {},
      });
    } catch (e) {
      console.error("Chat error:", e);
      upsertAssistant("\n\n⚠️ Something went wrong. Please try again.");
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(\[\[[^\]]+\]\])/g);
    const elements: React.ReactNode[] = [];
    let markdownBuf = "";

    const flushMarkdown = () => {
      if (markdownBuf) {
        elements.push(
          <div key={elements.length} className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
            <ReactMarkdown>{markdownBuf}</ReactMarkdown>
          </div>
        );
        markdownBuf = "";
      }
    };

    for (const part of parts) {
      const pillMatch = part.match(/^\[\[(.+)\]\]$/);
      if (pillMatch) {
        flushMarkdown();
        const pillText = pillMatch[1];
        elements.push(
          <button
            key={elements.length}
            onClick={() => onPillClick?.(pillText)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/20 transition-colors cursor-pointer my-1 mr-1.5"
          >
            {pillText}
          </button>
        );
      } else {
        markdownBuf += part;
      }
    }
    flushMarkdown();
    return elements;
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`rounded-lg px-3.5 py-2.5 max-w-[85%] text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-foreground"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="flex flex-col">{renderMessageContent(msg.content)}</div>
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
          ))}
          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
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
      </ScrollArea>

      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${tenant.name}'s market, research a company, or say "set up my pipeline"...`}
            className="min-h-[42px] max-h-[120px] resize-none text-sm"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="shrink-0 h-[42px] w-[42px]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Live Perplexity research stream hook ── */
function useLiveResearchStream() {
  const INITIAL: ResearchPhase[] = [
    { id: "PHASE_01", label: "Website DNA & Market Position", status: "pending" },
    { id: "PHASE_02", label: "ICP & Buyer Personas", status: "pending" },
    { id: "PHASE_03", label: "Competitive Landscape", status: "pending" },
    { id: "PHASE_04", label: "Strategic Targets & Pipeline Seed", status: "pending" },
  ];

  const [phases, setPhases] = useState<ResearchPhase[]>(INITIAL);

  useEffect(() => {
    phasesRef.current = phases;
  }, [phases]);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [citations, setCitations] = useState<string[]>([]);
  const [targets, setTargets] = useState<ResearchTarget[]>([]);
  const phasesRef = useRef<ResearchPhase[]>(INITIAL);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const runningRef = useRef(false);

  const start = useCallback(async (domain: string, companyContext?: string) => {
    const normalizedDomain = domain.trim().toLowerCase();
    const requestKey = buildResearchRequestKey(normalizedDomain, companyContext);

    if (liveResearchRequestState.activeKey === requestKey) return;

    // Prevent duplicate simultaneous calls
    if (runningRef.current) return;

    const requestId = liveResearchRequestState.activeRequestId + 1;
    liveResearchRequestState.activeRequestId = requestId;
    liveResearchRequestState.activeKey = requestKey;
    requestIdRef.current = requestId;
    runningRef.current = true;

    const isCurrentRequest = () =>
      requestIdRef.current === requestId &&
      liveResearchRequestState.activeRequestId === requestId &&
      liveResearchRequestState.activeKey === requestKey;
    
    abortRef.current?.abort();
    if (timerRef.current) clearInterval(timerRef.current);
    setPhases([...INITIAL]);
    setElapsed(0);
    setCitations([]);
    setTargets([]);
    setError(null);
    setRunning(true);
    startRef.current = Date.now();
    timerRef.current = setInterval(() => setElapsed((Date.now() - startRef.current) / 1000), 100);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();

      const resp = await fetch(`${supabaseUrl}/functions/v1/perplexity-research`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? supabaseKey}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({ domain: normalizedDomain, companyContext }),
        signal: controller.signal,
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No body");

      const decoder = new TextDecoder();
      let buf = "";
      let sawDone = false;
      let streamEndedUnexpectedly = false;

      while (true) {
        if (!isCurrentRequest()) {
          controller.abort();
          break;
        }
        if (controller.signal.aborted) break;
        const { done, value } = await reader.read();
        if (done) {
          streamEndedUnexpectedly = !sawDone;
          break;
        }
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          // Skip SSE comments (keepalive heartbeats) and empty lines
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            sawDone = true;
            continue;
          }

          try {
            if (!isCurrentRequest()) continue;
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "phase" && parsed.phase) {
              const p = parsed.phase;
              setPhases(prev => prev.map(ph => ph.id === p.id ? { ...ph, ...p } : ph));
            }
            if (parsed.phase && !parsed.type) {
              const p = parsed.phase;
              setPhases(prev => prev.map(ph => ph.id === p.id ? { ...ph, ...p } : ph));
            }
            if (parsed.type === "citations") {
              setCitations(parsed.citations || []);
            }
            if (parsed.type === "targets" && parsed.targets) {
              setTargets(parsed.targets);
            }
            if (parsed.type === "error") {
              console.error("Research error:", parsed.error);
              setError(parsed.error);
            }
          } catch {
            // Incomplete JSON — put line back and wait for more data
            buf = line + "\n" + buf;
            break;
          }
        }
      }

      if (!controller.signal.aborted && streamEndedUnexpectedly && isCurrentRequest()) {
        const hasMeaningfulProgress = phasesRef.current.some((phase) =>
          phase.status === "complete" || phase.status === "active" || (phase.findings?.length ?? 0) > 0
        );

        if (!hasMeaningfulProgress) {
          throw new Error("Research stream ended early");
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError" && isCurrentRequest()) {
        console.error("Research stream error:", e);
        setError(e.message || "Research failed");
        setPhases(prev => prev.map(ph => ph.status === "active" ? { ...ph, status: "pending" as const } : ph));
      }
    } finally {
      if (isCurrentRequest()) {
        if (timerRef.current) clearInterval(timerRef.current);
        setRunning(false);
        runningRef.current = false;
        liveResearchRequestState.activeKey = null;
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (requestIdRef.current === liveResearchRequestState.activeRequestId) {
        liveResearchRequestState.activeKey = null;
      }
      abortRef.current?.abort();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { phases, elapsed, running, error, citations, targets, start };
}

/* ══════════════════════════════════════════════════════════
   Main page component
   ══════════════════════════════════════════════════════════ */

export default function TenantAccountMap() {
  const isMobile = useIsMobile();
  const { tenant } = useTenant();
  const { accounts: allAccounts, loading: accountsLoading, refetch } = useDBAccounts(tenant.slug);
  const { phases: demoPhases, elapsed: demoElapsed, running: demoRunning, error: researchError, citations: researchCitations, targets: researchTargets, start: startResearch } = useLiveResearchStream();
  const [seedingTarget, setSeedingTarget] = useState<string | null>(null);
  const [seededTargets, setSeededTargets] = useState<Set<string>>(new Set());
  const [researchDomain, setResearchDomain] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [accountLeads, setAccountLeads] = useState<Record<string, AccountLeadData>>({});
  const [loadingLeads, setLoadingLeads] = useState<Set<string>>(new Set());
  const [activityLog, setActivityLog] = useState<Record<string, string[]>>({});
  const [showResearchDetails, setShowResearchDetails] = useState(false);
  const [chatExternalMessages, setChatExternalMessages] = useState<ChatMessage[]>([]);
  const [autoSeeded, setAutoSeeded] = useState(false);

  const selectedAccount = useMemo(() => allAccounts.find(a => a.id === selectedAccountId) ?? null, [selectedAccountId, allAccounts]);

  const handleSelectAccount = useCallback((a: FlashAccount) => {
    setSelectedAccountId(a.id);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedAccountId(null);
  }, []);

  const handleFindContacts = useCallback(async (account: FlashAccount, mode: "solution" | "ma" = "solution") => {
    if (loadingLeads.has(account.id) || accountLeads[account.id]) return;
    setLoadingLeads(prev => new Set(prev).add(account.id));

    const addLog = (msg: string) => {
      setActivityLog(prev => ({ ...prev, [account.id]: [...(prev[account.id] || []), msg] }));
    };

    try {
      const domain = account.website.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      addLog(`Analyzing ${account.name} account profile`);

      const vendorNote = account.currentVendor && account.currentVendor !== "Unknown"
        ? `Current vendor: ${account.currentVendor}. Frame outreach as a competitive displacement opportunity.`
        : "No known incumbent vendor — greenfield opportunity.";
      const stageNote = account.stage === "active"
        ? `This is an EXISTING ${tenant.name} partner — find contacts for upsell/expansion.`
        : account.stage === "competitor"
        ? "This account uses a competitor — find contacts for competitive displacement."
        : account.stage === "target"
        ? "This is a priority target — find the right entry points."
        : "This is a whitespace opportunity — find contacts to open a net-new relationship.";

      const TENANT_CONTEXT = `${tenant.contextPrompt} ${stageNote} ${vendorNote}`;

      let content: string;
      if (mode === "ma") {
        content = `${TENANT_CONTEXT}\n\nAccount: ${account.name} (${domain}) in ${account.hqCity}.\n\nMODE: M&A / Corporate Development contacts. Search domain "${domain}".\n\nTarget titles: CFO, VP Corporate Development, CEO, General Counsel, VP Strategy, Chief Strategy Officer.\n\nReturn top 5 decision-makers with "score", "reason", "title" fields.`;
      } else {
        content = `${TENANT_CONTEXT}\n\nAccount: ${account.name} (${domain}) — ${account.focusArea || account.accountType} in ${account.hqCity}.\n\nSearch domain "${domain}".\n\nTarget titles based on buying persona for ${tenant.name} solutions.\n\nReturn top 5 decision-makers with "score", "reason", "title" fields.`;
      }

      await new Promise(r => setTimeout(r, 800));
      addLog(`Defining buyer persona`);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();

      await new Promise(r => setTimeout(r, 600));
      addLog(`Querying contact database for ${domain}`);

      const resp = await fetch(`${supabaseUrl}/functions/v1/leadgen-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? supabaseKey}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({ website: domain, messages: [{ role: "user", content }], strict_domain: true }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No response body");

      addLog("Matching seniority filters: Director, VP, C-Suite");

      const collectedLeads: any[] = [];
      let gotLeads = false;
      await parseSSEStream(reader, {
        onTextDelta: () => {},
        onLeads: (leads) => {
          if (!gotLeads) { addLog(`Scoring ${leads.length} candidates by fit`); gotLeads = true; }
          collectedLeads.push(...leads);
          const sorted = [...collectedLeads].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5);
          setAccountLeads(prev => ({ ...prev, [account.id]: { leads: sorted } }));
        },
        onDone: () => {
          const sorted = [...collectedLeads].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5);
          setAccountLeads(prev => ({ ...prev, [account.id]: { leads: sorted } }));
          addLog(collectedLeads.length > 0 ? `Found ${Math.min(collectedLeads.length, 5)} decision-makers` : "No matching contacts found");
        },
      });
    } catch (e) {
      console.error("Find contacts failed:", e);
      addLog("Search failed — try again");
    } finally {
      setLoadingLeads(prev => { const n = new Set(prev); n.delete(account.id); return n; });
    }
  }, [loadingLeads, accountLeads, tenant]);

  // Auto-seed targets when research completes
  const researchComplete = !demoRunning && demoPhases.every(p => p.status === "complete");
  useEffect(() => {
    if (!researchComplete || autoSeeded || researchTargets.length === 0) return;
    setAutoSeeded(true);

    const seedAll = async () => {
      for (const target of researchTargets) {
        if (seededTargets.has(target.name)) continue;
        const accountId = `target-${target.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        const domain = target.domain || `${target.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`;
        
        // Determine account type from rationale
        const ratLower = (target.rationale || "").toLowerCase();
        let accountType = tenant.accountTypes[0]?.value || "prospect";
        for (const at of tenant.accountTypes) {
          if (ratLower.includes(at.label.toLowerCase()) || ratLower.includes(at.value.toLowerCase())) {
            accountType = at.value;
            break;
          }
        }
        // Determine stage from rationale keywords
        let stage = "whitespace";
        if (ratLower.includes("competitor") || ratLower.includes("compet")) stage = "competitor";
        else if (ratLower.includes("partner") || ratLower.includes("active")) stage = "active";
        else if (ratLower.includes("target") || ratLower.includes("prospect") || ratLower.includes("acquisition")) stage = "target";

        // Calculate a basic priority score from available data
        let priorityScore = 50;
        if (target.revenue_hint) priorityScore += 15;
        if (target.employee_hint) priorityScore += 10;
        if (stage === "target") priorityScore += 10;
        if (stage === "competitor") priorityScore += 5;

        try {
          await (supabase.from("flash_accounts") as any).upsert({
            id: accountId,
            name: target.name,
            tenant_slug: tenant.slug,
            account_type: accountType,
            stage,
            website: `https://${domain}`,
            notes: `${target.rationale}: ${target.description}`,
            focus_area: target.rationale,
            hq_city: target.hq_hint || "",
            annual_revenue: target.revenue_hint || null,
            employee_count: target.employee_hint || null,
            priority_score: Math.min(priorityScore, 100),
          }, { onConflict: "id" });
          setSeededTargets(prev => new Set(prev).add(target.name));
        } catch (e) {
          console.error("Auto-seed failed for", target.name, e);
        }
      }
      refetch();

      const elapsed = Math.round(demoElapsed);
      const summary: ChatMessage = {
        role: "assistant",
        content: `✅ **Research complete** — analyzed **${researchDomain || tenant.slug + ".com"}** in ${elapsed}s.\n\nFound **${researchTargets.length} strategic targets** across your market. All accounts have been added to the pipeline.\n\n[[Find contacts for all]] [[Show research details]] [[Run another domain]]`,
      };
      setChatExternalMessages(prev => [...prev, summary]);
    };

    seedAll();
  }, [researchComplete, autoSeeded, researchTargets, seededTargets, tenant.slug, refetch, demoElapsed, researchDomain]);

  // Pill click handler
  const handlePillClick = useCallback((pill: string) => {
    if (pill === "Show research details") {
      setShowResearchDetails(true);
    } else if (pill === "Run another domain") {
      setResearchDomain("");
      setAutoSeeded(false);
      setSeededTargets(new Set());
    } else if (pill === "Find contacts for all") {
      const seededAccounts = allAccounts.filter(a => a.id.startsWith("target-"));
      for (const acct of seededAccounts.slice(0, 5)) {
        setTimeout(() => handleFindContacts(acct), 500);
      }
      const ackMsg: ChatMessage = {
        role: "assistant",
        content: `🔍 Starting contact discovery for **${Math.min(seededAccounts.length, 5)} accounts**… This will take a moment.\n\nClick any account in the pipeline to see discovered contacts.`,
      };
      setChatExternalMessages(prev => [...prev, ackMsg]);
    }
  }, [allAccounts, handleFindContacts]);

  // Determine left panel state
  const hasError = !!researchError && !demoRunning;
  const isInitial = !demoRunning && !hasError && demoPhases.every(p => p.status === "pending");
  const isRunning = demoRunning || (!hasError && demoPhases.some(p => p.status !== "pending") && !researchComplete);
  const isComplete = researchComplete && !hasError;

  return (
    <div className="flex h-[calc(100vh-48px)] w-full">
      {/* Left panel — state machine */}
      <div className="flex-1 border-r border-border flex flex-col min-w-0 overflow-y-auto bg-background">
        <div className="max-w-4xl mx-auto w-full px-8 py-8 flex-1 flex flex-col">
          {/* INITIAL: URL input */}
          {isInitial && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="size-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Zap className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-medium text-foreground">ICP Research Pipeline</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Enter a company website to run deep AI research — market position, buyer personas, competitors, and pipeline targets.
                </p>
              </div>
              <div className="flex gap-2 w-full max-w-md">
                <input
                  type="text"
                  value={researchDomain}
                  onChange={e => setResearchDomain(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && researchDomain.trim()) { setAutoSeeded(false); startResearch(researchDomain.trim(), tenant.contextPrompt); } }}
                  placeholder={`e.g. ${tenant.slug}.com`}
                  className="flex-1 h-11 rounded-md border border-input bg-background px-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button
                  onClick={() => { setAutoSeeded(false); startResearch(researchDomain.trim() || `${tenant.slug}.com`, tenant.contextPrompt); }}
                  size="lg"
                  className="gap-2"
                  disabled={demoRunning}
                >
                  <Zap className="w-4 h-4" />
                  Research
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Powered by Perplexity Deep Research — takes ~90-120 seconds</p>
            </div>
          )}

          {/* RUNNING: Full research stream for transparency */}
          {isRunning && (
            <div className="flex-1 overflow-y-auto">
              <ICPResearchStream
                targetDomain={researchDomain || `${tenant.slug}.com`}
                phases={demoPhases}
                elapsedSeconds={demoElapsed}
              />
            </div>
          )}

          {/* ERROR: Research failed */}
          {hasError && !isRunning && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="size-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <Zap className="w-7 h-7 text-destructive" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-medium text-foreground">Research Failed</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  {researchError || "Something went wrong during research. Please try again."}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => { setAutoSeeded(false); startResearch(researchDomain.trim() || `${tenant.slug}.com`, tenant.contextPrompt); }}
                  size="lg"
                  className="gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Retry
                </Button>
              </div>
            </div>
          )}

          {isComplete && (
            <div className="flex flex-col h-full">
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center gap-3">
                  {tenant.logo ? (
                    <img src={tenant.logo} alt={tenant.name} className="w-8 h-8 object-contain rounded" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">{tenant.name.charAt(0)}</div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold leading-tight">{tenant.name} Pipeline</h2>
                    <p className="text-xs text-muted-foreground">
                      {accountsLoading ? "Loading..." : `${allAccounts.length} accounts`}
                    </p>
                  </div>
                </div>
              </div>

              {selectedAccount ? (
                <AccountDetailInline
                  account={selectedAccount}
                  onBack={handleBack}
                  onFindContacts={handleFindContacts}
                  loadingLeads={loadingLeads.has(selectedAccount.id)}
                  activityLog={activityLog[selectedAccount.id] || []}
                  streamedLeads={accountLeads[selectedAccount.id]?.leads || []}
                  onStageChange={() => {}}
                />
              ) : allAccounts.length > 0 ? (
                <AccountListView
                  accounts={allAccounts}
                  selectedAccountId={selectedAccountId}
                  onSelectAccount={handleSelectAccount}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center px-6">
                  <div className="text-center space-y-3">
                    <Building2 className="w-10 h-10 mx-auto text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      No accounts yet. Use the chat to build your pipeline.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right panel — Chat */}
      <div className="w-[420px] shrink-0 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{tenant.name} Pipeline Assistant</span>
        </div>
        <TenantSetupChat
          tenant={tenant}
          accountCount={allAccounts.length}
          onAccountsAdded={refetch}
          externalMessages={chatExternalMessages}
          onPillClick={handlePillClick}
        />
      </div>

      {/* Research details dialog */}
      <Dialog open={showResearchDetails} onOpenChange={setShowResearchDetails}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogTitle>Research Details — {researchDomain || `${tenant.slug}.com`}</DialogTitle>
          <DialogDescription>Full research report from the ICP pipeline</DialogDescription>
          <ICPResearchStream
            targetDomain={researchDomain || `${tenant.slug}.com`}
            phases={demoPhases}
            elapsedSeconds={demoElapsed}
          />
          {researchCitations.length > 0 && (
            <details className="mt-4">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                📚 {researchCitations.length} sources cited
              </summary>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground max-h-40 overflow-y-auto">
                {researchCitations.map((c, i) => (
                  <a key={i} href={c} target="_blank" rel="noopener" className="block truncate hover:text-primary">[{i + 1}] {c}</a>
                ))}
              </div>
            </details>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
