import { useState, useEffect, useRef, useCallback } from "react";
import { Bot, User, Loader2, Send, Navigation, Users, Download, Search, Mail, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { parseSSEStream } from "@/lib/sse-parser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import type { SavedLead } from "@/components/leadgen/useLeadsCRUD";
import type { ParsedPersona } from "@/components/leadgen/ResearchSection";

/* ── Types ── */
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  pills?: string[];
  actionCard?: ActionCard;
}

interface ActionCard {
  type: "navigate" | "find_leads" | "draft_email" | "export" | "start_research" | "enrich";
  label: string;
  description: string;
  params?: Record<string, string>;
}

export interface PipelineChatContext {
  workspaceKey: string;
  activeSection: string;
  researchStatus: "not_started" | "running" | "complete";
  personaCount: number;
  personaNames: string[];
  leadCount: number;
  leadsWithoutEmail: number;
  /** ICP context injected from research report */
  icpContext?: string;
}

export interface PipelineChatActions {
  onNavigate: (section: string) => void;
  onFindLeads: (personaTitle: string) => void;
  onDraftEmail: (leadName: string) => void;
  onExportCSV: () => void;
  onStartResearch: (domain: string) => void;
  onLeadsFound: (leads: any[]) => void;
}

/** Pending persona prefill to auto-trigger chat */
export interface PersonaPrefill {
  personaTitle: string;
  titles: string[];
  painPoints: string[];
  buyingTriggers: string[];
}

interface PipelineChatProps {
  context: PipelineChatContext;
  actions: PipelineChatActions;
  /** When set, auto-sends a persona-specific discovery message */
  pendingPersona?: PersonaPrefill | null;
  onPersonaConsumed?: () => void;
}

/* ── Helpers ── */
function parsePills(text: string): { cleanText: string; pills: string[] } {
  const match = text.match(/\[\[([^\]]+)\]\]\s*$/);
  if (!match) return { cleanText: text, pills: [] };
  const pills = match[1].split("|").map(s => s.trim()).filter(Boolean);
  return { cleanText: text.slice(0, match.index).trim(), pills };
}

type ChipConfig = { label: string; icon: typeof Search };

function getContextChips(ctx: PipelineChatContext): ChipConfig[] {
  const { researchStatus, leadCount, personaCount } = ctx;
  const chips: ChipConfig[] = [];

  if (researchStatus === "complete") {
    chips.push({ label: "Summarize findings", icon: Search });
    if (personaCount > 0) {
      chips.push({ label: "Find leads for all personas", icon: Users });
    }
    if (leadCount > 0) {
      chips.push({ label: "Export leads", icon: Download });
    }
  } else if (researchStatus === "not_started") {
    chips.push({ label: "What does this tool do?", icon: Search });
  }

  return chips;
}

function getGreeting(ctx: PipelineChatContext): string {
  const { researchStatus, leadCount, personaCount, workspaceKey } = ctx;
  const domain = workspaceKey !== "default" ? workspaceKey : "";

  if (researchStatus === "complete") {
    const parts = [`Research for **${domain}** is complete.`];
    if (personaCount > 0) parts.push(`${personaCount} personas identified.`);
    if (leadCount > 0) parts.push(`${leadCount} leads in pipeline.`);
    parts.push("I can find leads, draft outreach, or help you explore your ICP.");
    return parts.join(" ");
  }
  if (researchStatus === "running") {
    return `⏳ Research is running for **${domain}**… I'll unlock once the analysis is complete.`;
  }
  return `Enter a company URL and run research first — I'll be ready to help once the analysis is complete.`;
}

/* ── Action Card Component ── */
function ActionCardUI({ card, onExecute, onCancel }: {
  card: ActionCard;
  onExecute: () => void;
  onCancel: () => void;
}) {
  const iconMap: Record<string, typeof Search> = {
    navigate: Navigation,
    find_leads: Users,
    draft_email: Mail,
    export: Download,
    start_research: Play,
    enrich: Search,
  };
  const Icon = iconMap[card.type] || Search;

  return (
    <div className="ml-9 mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3 max-w-[85%]">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">{card.label}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{card.description}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="default" className="h-7 text-xs" onClick={onExecute}>
          Do it
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onCancel}>
          Skip
        </Button>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export function PipelineChat({ context, actions, pendingPersona, onPersonaConsumed }: PipelineChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevContextRef = useRef<string>("");

  // Reset greeting when context changes meaningfully
  useEffect(() => {
    const key = `${context.activeSection}-${context.researchStatus}-${context.leadCount}-${context.personaCount}`;
    if (prevContextRef.current !== key) {
      prevContextRef.current = key;
      if (messages.length <= 1) {
        setMessages([{ role: "assistant", content: getGreeting(context) }]);
      }
    }
  }, [context.activeSection, context.researchStatus, context.leadCount, context.personaCount]);

  // Initialize on mount
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: "assistant", content: getGreeting(context) }]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle persona prefill: auto-send a discovery message when triggered from persona card
  const pendingPersonaRef = useRef<string | null>(null);
  useEffect(() => {
    if (!pendingPersona || isStreaming) return;
    // Prevent re-triggering for the same persona
    if (pendingPersonaRef.current === pendingPersona.personaTitle) return;
    pendingPersonaRef.current = pendingPersona.personaTitle;

    const prefillMsg = `I want to find leads for the "${pendingPersona.personaTitle}" segment. Help me refine the search criteria before we start.`;
    
    // Reset messages and send the prefill
    setMessages([{ role: "assistant", content: getGreeting(context) }]);
    setTimeout(() => {
      sendMessage(prefillMsg);
      onPersonaConsumed?.();
    }, 300);
  }, [pendingPersona?.personaTitle]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = useCallback((card: ActionCard) => {
    switch (card.type) {
      case "navigate":
        if (card.params?.section) actions.onNavigate(card.params.section);
        break;
      case "find_leads":
        if (card.params?.persona) actions.onFindLeads(card.params.persona);
        break;
      case "draft_email":
        if (card.params?.lead) actions.onDraftEmail(card.params.lead);
        break;
      case "export":
        actions.onExportCSV();
        break;
      case "start_research":
        if (card.params?.domain) actions.onStartResearch(card.params.domain);
        break;
    }
  }, [actions]);

  const sendMessage = useCallback(async (text: string) => {
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
          context: {
            workspaceKey: context.workspaceKey,
            activeSection: context.activeSection,
            researchStatus: context.researchStatus,
            personaCount: context.personaCount,
            personaNames: context.personaNames,
            leadCount: context.leadCount,
            leadsWithoutEmail: context.leadsWithoutEmail,
            icpContext: context.icpContext || undefined,
          },
          messages: [
            ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
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

      // Parse pills from final message
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          const { cleanText, pills } = parsePills(last.content);
          if (pills.length > 0) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: cleanText, pills } : m);
          }
        }
        return prev;
      });
    } catch {
      upsert("\n\n⚠️ Something went wrong.");
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }, [isStreaming, messages, context]);

  const handleSend = () => { if (context.researchStatus === "complete") sendMessage(input.trim()); };
  const contextChips = getContextChips(context);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 shrink-0">
        <Bot className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Co-pilot</span>
        {context.workspaceKey !== "default" && (
          <span className="text-[10px] text-muted-foreground font-mono ml-auto truncate max-w-[120px]">
            {context.workspaceKey}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3" style={{ overscrollBehavior: "contain" }}>
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i}>
              <div className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={`rounded-lg px-3.5 py-2.5 max-w-[85%] text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
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

              {/* Pills */}
              {msg.role === "assistant" && msg.pills && msg.pills.length > 0 && !isStreaming && i === messages.length - 1 && (
                <div className="flex flex-wrap gap-1.5 mt-2 ml-9">
                  {msg.pills.map(pill => (
                    <button
                      key={pill}
                      onClick={() => sendMessage(pill)}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              )}

              {/* Action Card */}
              {msg.actionCard && i === messages.length - 1 && (
                <ActionCardUI
                  card={msg.actionCard}
                  onExecute={() => handleAction(msg.actionCard!)}
                  onCancel={() => {
                    setMessages(prev => prev.map((m, idx) =>
                      idx === i ? { ...m, actionCard: undefined } : m
                    ));
                  }}
                />
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
      </div>

      {/* Context chips */}
      {!isStreaming && contextChips.length > 0 && messages.length <= 2 && (
        <div className="px-4 py-2 border-t border-border flex flex-wrap gap-1.5 shrink-0">
          {contextChips.map(chip => (
            <button
              key={chip.label}
              onClick={() => sendMessage(chip.label)}
              className="text-[11px] px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-1"
            >
              <chip.icon className="w-3 h-3" />
              {chip.label}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-border p-3 shrink-0">
        {context.researchStatus !== "complete" ? (
          <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
            <Loader2 className={cn("w-3.5 h-3.5", context.researchStatus === "running" && "animate-spin")} />
            <span>{context.researchStatus === "running" ? "Waiting for research to complete…" : "Run research to unlock the co-pilot"}</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything..."
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
        )}
      </div>
    </div>
  );
}
