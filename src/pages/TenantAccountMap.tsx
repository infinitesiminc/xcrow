import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { APIProvider, Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { useTenant } from "@/contexts/TenantContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { MapPin, Filter, ExternalLink, Search, Building2, Grid3X3, Zap, Swords, Plane, Warehouse, Send, Bot, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { parseSSEStream } from "@/lib/sse-parser";
import AccountListView from "@/components/enterprise/AccountListView";
import AccountDetailInline from "@/components/enterprise/AccountDetailInline";
import DataPipelineSection from "@/components/enterprise/DataPipelineSection";
import ICPResearchStream, { type ResearchPhase } from "@/components/enterprise/ICPResearchStream";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import {
  FLASH_LOCATIONS,
  type FlashLocation,
} from "@/data/flash-parking-locations";
import {
  FLASH_ACCOUNTS,
  FLASH_PLATFORM_STATS,
  STAGE_CONFIG,
  type FlashAccount,
  type AccountStage,
  type AccountType,
} from "@/data/flash-prospects";
import { FLASH_AIRPORT_ACCOUNTS } from "@/data/flash-airports";

const STATIC_ALL_ACCOUNTS = [...FLASH_ACCOUNTS, ...FLASH_AIRPORT_ACCOUNTS];

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
        setDbAccounts(null);
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
      setDbAccounts(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  // For Flash, fall back to static data; other tenants show empty
  const fallback = tenantSlug === "flash" ? STATIC_ALL_ACCOUNTS : [];
  return { accounts: dbAccounts ?? fallback, loading, refetch: fetchAccounts };
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "AIzaSyDMSptsCr9hKesJxuvh-sKL1z_gCj371z0";
const MAP_ID = "flash-parking-map";

/* ── Pin components ── */
function AccountIcon({ account, className }: { account: FlashAccount; className?: string }) {
  if (account.accountType === "airport") return <Plane className={className} />;
  if (account.stage === "competitor") return <Swords className={className} />;
  if (account.accountType === "large_venue") return <Building2 className={className} />;
  return <Grid3X3 className={className} />;
}

function AccountPin({ account, tenantLogo }: { account: FlashAccount; tenantLogo: string }) {
  const cfg = STAGE_CONFIG[account.stage];
  const isHQ = account.id === "acct-flash-hq";
  if (isHQ && tenantLogo) {
    return (
      <div className="relative cursor-pointer group">
        <div className="w-11 h-11 rounded-full border-[3px] border-primary shadow-lg transition-all group-hover:scale-125 flex items-center justify-center bg-white">
          <img src={tenantLogo} alt="HQ" className="w-7 h-7 object-contain" />
        </div>
      </div>
    );
  }
  return (
    <div className="relative cursor-pointer group flex flex-col items-center">
      <div className="w-9 h-9 rounded-full border-[3px] border-white shadow-lg transition-all group-hover:scale-125 flex items-center justify-center"
        style={{ backgroundColor: cfg.markerColor }}>
        <AccountIcon account={account} className="w-4 h-4 text-white" />
      </div>
      {account.accountType === "fleet_operator" && (
        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-foreground bg-background/80 px-1 rounded shadow-sm">HQ</span>
      )}
    </div>
  );
}

function DeployedSitePin() {
  return <div className="cursor-pointer"><div className="w-3 h-3 rounded-full bg-gray-400/50 border border-white/60" /></div>;
}

const OPERATOR_COLORS: Record<string, string> = {
  "Joe's Auto Parks": "#e65100", "LAZ Parking": "#1565c0", "SP Plus": "#2e7d32",
  "ParkABM": "#6a1b9a", "ABM": "#6a1b9a", "Perfect Parking": "#00838f",
};
function getOperatorColor(op: string | null): string {
  if (!op) return "#b0bec5";
  return OPERATOR_COLORS[op] ?? "#78909c";
}

function GaragePin({ operator, capacity }: { operator?: string | null; capacity?: number | null }) {
  const color = getOperatorColor(operator);
  const label = operator && operator !== "Unknown" && operator !== "Independent" ? operator : null;
  return (
    <div className="cursor-pointer group flex flex-col items-center">
      <div className="w-4 h-4 rounded-sm border border-white/80 shadow-sm transition-all group-hover:scale-150 flex items-center justify-center"
        style={{ backgroundColor: color }}>
        <Warehouse className="w-2.5 h-2.5 text-white" />
      </div>
      {label && (
        <span className="mt-0.5 text-[7px] font-bold uppercase tracking-wider text-foreground bg-background/80 px-1 rounded shadow-sm whitespace-nowrap max-w-[80px] truncate">
          {label}
        </span>
      )}
    </div>
  );
}

interface DiscoveredGarage {
  id: string; place_id: string; name: string; address: string | null;
  lat: number; lng: number; rating: number | null; reviews_count: number;
  photo_reference: string | null; types: string[]; operator_guess: string | null;
  scan_zone: string | null; website: string | null; phone: string | null;
  capacity: number | null; capacity_source: string | null;
}

interface AccountLeadData {
  leads: { name: string; title?: string; email?: string; linkedin?: string; score?: number; reason?: string }[];
}

/* ── Z-index by priority ── */
const STAGE_Z: Record<string, number> = { whitespace: 1, target: 2, active: 3, competitor: 4 };
function getMarkerZ(account: FlashAccount) {
  if (account.id === "acct-flash-hq") return 100;
  return STAGE_Z[account.stage] ?? 1;
}

/* ── Map content ── */
function MapContent({ accounts, onSelectAccount, showDeployed, deployedLocations, onSelectSite, garages, showGarages, onSelectGarage, tenantLogo }: {
  accounts: FlashAccount[];
  onSelectAccount: (a: FlashAccount) => void;
  showDeployed: boolean; deployedLocations: FlashLocation[];
  onSelectSite: (l: FlashLocation) => void;
  garages: DiscoveredGarage[];
  showGarages: boolean;
  onSelectGarage: (g: DiscoveredGarage) => void;
  tenantLogo: string;
}) {
  return (
    <>
      {showDeployed && deployedLocations.map(loc => (
        <AdvancedMarker key={loc.id} position={{ lat: loc.lat, lng: loc.lng }} zIndex={0} onClick={() => onSelectSite(loc)}>
          <DeployedSitePin />
        </AdvancedMarker>
      ))}
      {showGarages && garages.map(g => (
        <AdvancedMarker key={g.id} position={{ lat: g.lat, lng: g.lng }} zIndex={0} onClick={() => onSelectGarage(g)}>
          <GaragePin operator={g.operator_guess} capacity={g.capacity} />
        </AdvancedMarker>
      ))}
      {accounts.map(acct => (
        <AdvancedMarker key={acct.id} position={{ lat: acct.hqLat, lng: acct.hqLng }} zIndex={getMarkerZ(acct)} onClick={() => onSelectAccount(acct)}>
          <AccountPin account={acct} tenantLogo={tenantLogo} />
        </AdvancedMarker>
      ))}
    </>
  );
}

/* ── Map viewport sync ── */
interface ViewportHint { lat: number; lng: number; zoom: number }

function MapViewportSync({ hint }: { hint: ViewportHint | null }) {
  const map = useMap();
  const prevRef = useRef<string>("");
  useEffect(() => {
    if (!map || !hint) return;
    const key = `${hint.lat},${hint.lng},${hint.zoom}`;
    if (key === prevRef.current) return;
    prevRef.current = key;
    map.panTo({ lat: hint.lat, lng: hint.lng });
    map.setZoom(hint.zoom);
  }, [map, hint]);
  return null;
}

/* ══════════════════════════════════════════════════════════
   Tenant Setup Chat — AI-powered pipeline builder
   ══════════════════════════════════════════════════════════ */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function TenantSetupChat({ tenant, accountCount, onAccountsAdded }: {
  tenant: { slug: string; name: string; contextPrompt: string; accountTypes: { value: string; label: string }[] };
  accountCount: number;
  onAccountsAdded: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-start with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcome: ChatMessage = {
        role: "assistant",
        content: accountCount > 0
          ? `Welcome back to the **${tenant.name}** pipeline. You have **${accountCount} accounts** loaded.\n\nI can help you:\n- 🔍 Research competitors and prospects\n- 👥 Find decision-makers at target accounts\n- 📊 Analyze market opportunities\n\nWhat would you like to do?`
          : `Let's build the **${tenant.name}** account pipeline from scratch.\n\nI'll auto-research your company and industry to seed the pipeline with:\n- 🎯 Target accounts (ISOs, merchants, fintechs)\n- ⚔️ Key competitors\n- 🏢 Strategic partners\n\nTo get started, just say **"set up my pipeline"** or tell me about a specific company to research.`,
      };
      setMessages([welcome]);
    }
  }, []);

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
          // Could auto-add to pipeline in future
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

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
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
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
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

      {/* Input */}
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
/* ── Types for extracted targets ── */
interface ResearchTarget {
  name: string;
  domain?: string;
  description: string;
  rationale: string;
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
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [citations, setCitations] = useState<string[]>([]);
  const [targets, setTargets] = useState<ResearchTarget[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (domain: string, companyContext?: string) => {
    abortRef.current?.abort();
    if (timerRef.current) clearInterval(timerRef.current);
    setPhases(INITIAL);
    setElapsed(0);
    setCitations([]);
    setTargets([]);
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
        body: JSON.stringify({ domain, companyContext }),
        signal: controller.signal,
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No body");

      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        if (controller.signal.aborted) break;
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);

            if (parsed.type === "phase" && parsed.phase) {
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
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") console.error("Research stream error:", e);
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { phases, elapsed, running, citations, targets, start };
}

/* ══════════════════════════════════════════════════════════
   Main page component
   ══════════════════════════════════════════════════════════ */

export default function TenantAccountMap() {
  const isMobile = useIsMobile();
  const { tenant } = useTenant();
  const { accounts: allAccounts, loading: accountsLoading, refetch } = useDBAccounts(tenant.slug);
  const { phases: demoPhases, elapsed: demoElapsed, running: demoRunning, citations: researchCitations, targets: researchTargets, start: startResearch } = useLiveResearchStream();
  const [seedingTarget, setSeedingTarget] = useState<string | null>(null);
  const [seededTargets, setSeededTargets] = useState<Set<string>>(new Set());
  const [researchDomain, setResearchDomain] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showDeployed, setShowDeployed] = useState(false);
  const [accountLeads, setAccountLeads] = useState<Record<string, AccountLeadData>>({});
  const [loadingLeads, setLoadingLeads] = useState<Set<string>>(new Set());
  const [activityLog, setActivityLog] = useState<Record<string, string[]>>({});
  const [showGarages, setShowGarages] = useState(false);
  const [laGarages, setLaGarages] = useState<DiscoveredGarage[]>([]);
  const [showOnlyOperators, setShowOnlyOperators] = useState(true);
  const [viewportHint, setViewportHint] = useState<ViewportHint | null>(null);

  const displayedGarages = useMemo(() =>
    showOnlyOperators ? laGarages.filter(g => g.operator_guess) : laGarages
  , [laGarages, showOnlyOperators]);

  const selectedAccount = useMemo(() => allAccounts.find(a => a.id === selectedAccountId) ?? null, [selectedAccountId, allAccounts]);

  const handleSelectAccount = useCallback((a: FlashAccount) => {
    setSelectedAccountId(a.id);
    if (a.hqLat && a.hqLng) {
      setViewportHint({ lat: a.hqLat, lng: a.hqLng, zoom: 12 });
    }
  }, []);

  const handleBack = useCallback(() => {
    setSelectedAccountId(null);
  }, []);

  const handleSeedTarget = useCallback(async (target: ResearchTarget) => {
    if (seedingTarget || seededTargets.has(target.name)) return;
    setSeedingTarget(target.name);
    try {
      const accountId = `target-${target.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const domain = target.domain || `${target.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`;
      await (supabase.from("flash_accounts") as any).upsert({
        id: accountId,
        name: target.name,
        tenant_slug: tenant.slug,
        account_type: "garage_operator",
        stage: "whitespace",
        website: `https://${domain}`,
        notes: `${target.rationale}: ${target.description}`,
        focus_area: target.rationale,
        hq_city: "",
      }, { onConflict: "id" });
      setSeededTargets(prev => new Set(prev).add(target.name));
      refetch();
      // Auto-select the new account
      setSelectedAccountId(accountId);
    } catch (e) {
      console.error("Seed target failed:", e);
    } finally {
      setSeedingTarget(null);
    }
  }, [seedingTarget, seededTargets, tenant.slug, refetch]);

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

  // ── Non-map layout (chat + list hybrid) ──
  if (!tenant.featureFlags.showMap) {
    const accountPanel = (
      <div className="flex flex-col h-full bg-background">
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
    );

    return (
      <div className="flex h-[calc(100vh-48px)] w-full">
        {/* Research stream panel */}
        <div className="flex-1 border-r border-border flex flex-col min-w-0 overflow-y-auto bg-background">
          <div className="max-w-4xl mx-auto w-full px-8 py-8">
            {!demoRunning && demoPhases.every(p => p.status === "pending") && (
              <div className="flex flex-col items-center justify-center gap-6 py-20">
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
                    onKeyDown={e => { if (e.key === "Enter" && researchDomain.trim()) startResearch(researchDomain.trim(), tenant.contextPrompt); }}
                    placeholder="e.g. cliq.com"
                    className="flex-1 h-11 rounded-md border border-input bg-background px-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <Button
                    onClick={() => startResearch(researchDomain.trim() || "cliq.com", tenant.contextPrompt)}
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
            {(demoRunning || demoPhases.some(p => p.status !== "pending")) && (
              <ICPResearchStream
                targetDomain={researchDomain || "cliq.com"}
                phases={demoPhases}
                elapsedSeconds={demoElapsed}
              />
            )}
            {!demoRunning && demoPhases.every(p => p.status === "complete") && (
              <div className="flex flex-col items-center gap-4 pt-6">
                {researchCitations.length > 0 && (
                  <details className="w-full max-w-2xl">
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={researchDomain}
                    onChange={e => setResearchDomain(e.target.value)}
                    placeholder="Try another domain..."
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm w-48"
                  />
                  <Button onClick={() => startResearch(researchDomain.trim() || "cliq.com", tenant.contextPrompt)} variant="outline" size="sm" className="gap-2">
                    <Zap className="w-3.5 h-3.5" />
                    Run Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account list panel */}
        <div className="w-[420px] shrink-0 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{tenant.name} Pipeline Assistant</span>
          </div>
          <TenantSetupChat
            tenant={tenant}
            accountCount={allAccounts.length}
            onAccountsAdded={refetch}
          />
        </div>
      </div>
    );
  }

  // ── Map-based layout (Flash and other map tenants) ──
  if (!API_KEY) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-8">
        <div className="text-center max-w-md space-y-4">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Google Maps API Key Required</h1>
        </div>
      </div>
    );
  }

  const sidebar = (
    <div className="flex flex-col h-full bg-background">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          {tenant.logo ? (
            <img src={tenant.logo} alt={tenant.name} className="w-8 h-8 object-contain" />
          ) : (
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">{tenant.name.charAt(0)}</div>
          )}
          <div>
            <h2 className="text-lg font-bold leading-tight">{tenant.name} Accounts</h2>
            <p className="text-xs text-muted-foreground">{allAccounts.length} accounts · Pipeline & intelligence</p>
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
      ) : (
        <AccountListView
          accounts={allAccounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={handleSelectAccount}
        />
      )}

      {tenant.featureFlags.showGarageDiscovery && (
        <DataPipelineSection
          accounts={allAccounts}
          showGarages={showGarages}
          onToggleGarages={setShowGarages}
          garages={laGarages}
          onGaragesLoaded={setLaGarages}
        />
      )}
    </div>
  );

  return (
    <div className="flex h-screen w-full">
      {!isMobile && (
        <div className="w-[440px] border-r border-border bg-background shrink-0 flex flex-col overflow-hidden">
          {sidebar}
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        {isMobile && (
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" className="absolute top-3 left-3 z-10 shadow-lg">
                <Filter className="w-4 h-4 mr-1" /> Accounts
                <Badge variant="secondary" className="ml-1.5 text-xs">{allAccounts.length}</Badge>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[440px] p-0">
              <SheetTitle className="sr-only">Account Panel</SheetTitle>
              {sidebar}
            </SheetContent>
          </Sheet>
        )}

        {/* Legend */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-background/90 backdrop-blur border border-border rounded-lg px-4 py-2 flex gap-4 shadow-md text-xs">
          {(Object.keys(tenant.stages) as AccountStage[]).map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tenant.stages[s]?.markerColor || STAGE_CONFIG[s]?.markerColor }} />
              <span>{tenant.stages[s]?.label || STAGE_CONFIG[s]?.label}</span>
            </div>
          ))}
          {showGarages && (
            <div className="flex items-center gap-1.5 border-l border-border pl-4">
              <Warehouse className="w-3 h-3 text-muted-foreground" />
              <span>Garages ({displayedGarages.length})</span>
            </div>
          )}
        </div>

        <APIProvider apiKey={API_KEY}>
          <Map mapId={MAP_ID} defaultCenter={{ lat: tenant.mapCenter.lat, lng: tenant.mapCenter.lng }} defaultZoom={tenant.mapCenter.zoom}
            gestureHandling="greedy" disableDefaultUI={false} style={{ width: "100%", height: "100%" }}>
            <MapContent
              accounts={allAccounts}
              onSelectAccount={handleSelectAccount}
              showDeployed={showDeployed}
              deployedLocations={FLASH_LOCATIONS}
              onSelectSite={() => {}}
              garages={displayedGarages}
              showGarages={showGarages}
              onSelectGarage={() => {}}
              tenantLogo={tenant.logo}
            />
            <MapViewportSync hint={viewportHint} />
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
