import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import {
  Send, Loader2, MapPin, Target, Upload, Rocket, ImageIcon,
  Users, Crosshair, Building2, FileText, Check,
} from "lucide-react";
import type { GTMTreeData } from "./gtm-types";

/* ── Strategy Card definitions ── */

interface StrategyCard {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  needsInput: boolean;
  inputPlaceholder?: string;
  inputType?: "text" | "select" | "file";
  options?: string[];
}

function buildCards(data: GTMTreeData): StrategyCard[] {
  const verticals = [...new Set(data.mappings.map(m => m.vertical))];
  const competitors = [...new Set(data.products.flatMap(p => p.competitors))];

  return [
    {
      id: "location",
      icon: <MapPin className="w-4 h-4" />,
      label: "Location",
      description: "Target a city or region",
      needsInput: true,
      inputPlaceholder: "e.g. New York, London UK",
      inputType: "text",
    },
    {
      id: "vertical",
      icon: <Target className="w-4 h-4" />,
      label: "Vertical",
      description: "Focus on an industry",
      needsInput: true,
      inputType: "select",
      options: verticals,
    },
    {
      id: "competitor",
      icon: <Crosshair className="w-4 h-4" />,
      label: "Competitor",
      description: "Target their customers",
      needsInput: true,
      inputType: "select",
      options: competitors.length > 0 ? competitors : undefined,
      inputPlaceholder: "Competitor name",
    },
    {
      id: "lookalike",
      icon: <Building2 className="w-4 h-4" />,
      label: "Lookalike",
      description: "Find similar companies",
      needsInput: true,
      inputPlaceholder: "Company to clone",
      inputType: "text",
    },
    {
      id: "upload",
      icon: <FileText className="w-4 h-4" />,
      label: "Brochure",
      description: "Upload product doc",
      needsInput: true,
      inputType: "file",
    },
    {
      id: "persona",
      icon: <Users className="w-4 h-4" />,
      label: "Persona",
      description: "Describe ideal buyer",
      needsInput: true,
      inputPlaceholder: "e.g. VP Operations at mid-market",
      inputType: "text",
    },
  ];
}

/* ── Chat message type ── */

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface StrategyChatPanelProps {
  companyName: string;
  treeData: GTMTreeData;
  onStartLeadGen: (context: { location?: string; verticalFocus?: string; competitorTarget?: string; customNotes?: string }) => void;
  isGenerating?: boolean;
}

export default function StrategyChatPanel({ companyName, treeData, onStartLeadGen, isGenerating }: StrategyChatPanelProps) {
  const cards = buildCards(treeData);

  const [activeCards, setActiveCards] = useState<Record<string, string | boolean>>({});
  const [cardInputs, setCardInputs] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFileCardRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeCount = Object.keys(activeCards).length;
  const hasAnyStrategy = activeCount > 0;

  function toggleCard(id: string) {
    setActiveCards(prev => {
      const next = { ...prev };
      if (next[id] !== undefined) {
        delete next[id];
      } else {
        const card = cards.find(c => c.id === id);
        if (card?.inputType === "file") {
          pendingFileCardRef.current = true;
          fileInputRef.current?.click();
          return prev;
        }
        next[id] = cardInputs[id] || true;
      }
      return next;
    });
  }

  function updateCardValue(id: string, value: string) {
    setCardInputs(prev => ({ ...prev, [id]: value }));
    setActiveCards(prev => {
      if (prev[id] !== undefined) {
        return { ...prev, [id]: value };
      }
      return prev;
    });
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const label = `📎 ${file.name}`;
    setCardInputs(prev => ({ ...prev, upload: label }));
    setActiveCards(prev => ({ ...prev, upload: label }));
  }

  function buildContext(): { location?: string; verticalFocus?: string; competitorTarget?: string; customNotes?: string } {
    const ctx: any = {};
    if (activeCards.location && typeof activeCards.location === "string") ctx.location = activeCards.location;
    if (activeCards.vertical && typeof activeCards.vertical === "string") ctx.verticalFocus = activeCards.vertical;
    if (activeCards.competitor && typeof activeCards.competitor === "string") ctx.competitorTarget = activeCards.competitor;

    const notes: string[] = [];
    if (activeCards.lookalike && typeof activeCards.lookalike === "string") notes.push(`Lookalike: ${activeCards.lookalike}`);
    if (activeCards.persona && typeof activeCards.persona === "string") notes.push(`Persona: ${activeCards.persona}`);
    if (activeCards.upload && typeof activeCards.upload === "string") notes.push(`Brochure: ${activeCards.upload}`);
    if (notes.length) ctx.customNotes = notes.join("; ");

    return ctx;
  }

  function handleGenerate() {
    onStartLeadGen(buildContext());
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

      const { data, error } = await supabase.functions.invoke("leadgen-chat", {
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

      setMessages(prev => [...prev, { role: "assistant", content: assistantContent || "Got it! Activate your strategy cards and hit Generate." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection issue — please try again." }]);
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-accent/30">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Lead Strategy</span>
          {activeCount > 0 && (
            <span className="text-[10px] text-muted-foreground">{activeCount} active</span>
          )}
        </div>
        <Button
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={handleGenerate}
          disabled={isGenerating || !hasAnyStrategy}
        >
          {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
          Generate 5 leads
        </Button>
      </div>

      {/* Strategy Cards Grid */}
      <div className="p-2.5">
        <p className="text-[11px] text-muted-foreground mb-2 px-0.5">
          Select one or more strategies to focus your first batch:
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {cards.map(card => {
            const isActive = activeCards[card.id] !== undefined;
            return (
              <button
                key={card.id}
                onClick={() => toggleCard(card.id)}
                className={`relative flex flex-col items-center gap-1 rounded-lg border p-2.5 text-center transition-all cursor-pointer ${
                  isActive
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border/60 bg-background hover:border-primary/40 hover:bg-accent/30"
                }`}
              >
                {isActive && (
                  <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-2 h-2 text-primary-foreground" />
                  </div>
                )}
                <div className={`${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {card.icon}
                </div>
                <span className={`text-[11px] font-medium leading-tight ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {card.label}
                </span>
                <span className="text-[9px] text-muted-foreground leading-tight">
                  {card.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active card inputs */}
        {Object.keys(activeCards).length > 0 && (
          <div className="mt-2 space-y-1.5">
            {cards.filter(c => activeCards[c.id] !== undefined && c.needsInput && c.inputType !== "file").map(card => (
              <div key={card.id} className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-muted-foreground w-16 shrink-0">{card.label}</span>
                {card.inputType === "select" && card.options ? (
                  <select
                    className="flex-1 h-7 text-xs rounded-md border border-border bg-background px-2 text-foreground"
                    value={typeof activeCards[card.id] === "string" ? (activeCards[card.id] as string) : ""}
                    onChange={e => updateCardValue(card.id, e.target.value)}
                  >
                    <option value="">Select...</option>
                    {card.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    className="flex-1 h-7 text-xs"
                    placeholder={card.inputPlaceholder}
                    value={cardInputs[card.id] || ""}
                    onChange={e => updateCardValue(card.id, e.target.value)}
                  />
                )}
              </div>
            ))}
            {activeCards.upload && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-muted-foreground w-16 shrink-0">File</span>
                <span className="text-xs text-foreground truncate">{activeCards.upload}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat (collapsed by default, expands when messages exist) */}
      {messages.length > 0 && (
        <ScrollArea className="h-[140px] border-t border-border/50">
          <div className="p-2.5 space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs ${
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
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-2.5 py-2 border-t border-border/50">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleFileUpload} />
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => fileInputRef.current?.click()}>
          <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
        <Input
          placeholder="Or describe your strategy..."
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
