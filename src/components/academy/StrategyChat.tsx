import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, ImageIcon, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import type { GTMTreeData } from "./gtm-types";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface StrategyChatProps {
  companyName: string;
  activeCards: Record<string, string | boolean>;
  treeData?: GTMTreeData | null;
}

interface ChipGroup {
  id: string;
  label: string;
  icon: string;
  chips: string[];
}

export default function StrategyChat({ companyName, activeCards, treeData }: StrategyChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [chipsCollapsed, setChipsCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── derive chip groups from treeData ── */
  const chipGroups = useMemo<ChipGroup[]>(() => {
    const groups: ChipGroup[] = [];

    // Locations — common defaults
    groups.push({
      id: "location",
      label: "Locations",
      icon: "📍",
      chips: ["New York", "San Francisco", "London", "Chicago", "Austin", "Toronto"],
    });

    // Verticals from mappings
    if (treeData?.mappings?.length) {
      const verticals = [...new Set(treeData.mappings.map(m => m.vertical))].filter(Boolean);
      if (verticals.length > 0) {
        groups.push({ id: "vertical", label: "Verticals", icon: "🎯", chips: verticals });
      }
    }

    // Personas from mappings (DM titles only)
    if (treeData?.mappings?.length) {
      const personas = [...new Set(treeData.mappings.map(m => m.dm.title))].filter(Boolean);
      if (personas.length > 0) {
        groups.push({ id: "persona", label: "Personas", icon: "👤", chips: personas });
      }
    }

    // Strategies — static
    groups.push({
      id: "strategy",
      label: "Strategies",
      icon: "⚡",
      chips: ["Competitor's customers", "Lookalike discovery", "Upload brochure"],
    });

    return groups;
  }, [treeData]);

  /* ── toggle chip ── */
  function toggleChip(groupId: string, chip: string) {
    if (chip === "Upload brochure") {
      fileInputRef.current?.click();
      return;
    }
    setSelected(prev => {
      const current = prev[groupId] || [];
      const has = current.includes(chip);
      return {
        ...prev,
        [groupId]: has ? current.filter(c => c !== chip) : [...current, chip],
      };
    });
  }

  /* ── build prompt from selections ── */
  function buildPromptFromSelections(): string {
    const parts: string[] = ["Find 5 decision makers"];
    const verticals = selected.vertical || [];
    const locations = selected.location || [];
    const personas = selected.persona || [];
    const strategies = selected.strategy || [];

    if (verticals.length > 0) parts.push(`in the ${verticals.join(", ")} vertical${verticals.length > 1 ? "s" : ""}`);
    if (personas.length > 0) parts.push(`at the ${personas.join(", ")} level`);
    if (locations.length > 0) parts.push(`in ${locations.join(", ")}`);
    if (strategies.includes("Competitor's customers")) parts.push("targeting competitor customers");
    if (strategies.includes("Lookalike discovery")) parts.push("using lookalike company discovery");

    return parts.join(" ");
  }

  const hasSelections = Object.values(selected).some(arr => arr.length > 0);

  /* ── generate from chips ── */
  function handleGenerate() {
    const prompt = buildPromptFromSelections();
    setInput("");
    setChipsCollapsed(true);
    handleSendMessage(prompt);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessages(prev => [...prev, { role: "user", content: `📎 Uploaded: ${file.name}` }]);
  }

  async function handleSendMessage(text: string) {
    if (!text.trim() || isThinking) return;
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsThinking(true);

    try {
      const systemContext = `You are helping refine lead generation strategy for ${companyName}. Active filters: ${JSON.stringify(activeCards)}. Keep responses to 1-2 sentences. If the user mentions a location, vertical, competitor, or persona, acknowledge it briefly.`;

      const chatMessages = [
        { role: "system", content: systemContext },
        ...newMessages.map(m => ({ role: m.role, content: m.content })),
      ];

      const { data } = await supabase.functions.invoke("leadgen-chat", {
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

      setMessages(prev => [...prev, { role: "assistant", content: assistantContent || "Got it! Adjust your strategy cards and hit Generate." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection issue — please try again." }]);
    } finally {
      setIsThinking(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await handleSendMessage(text);
  }

  const showChips = messages.length === 0 || !chipsCollapsed;

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">AI Strategy Chat</span>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => setChipsCollapsed(!chipsCollapsed)}
          >
            {chipsCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2.5 space-y-2">
          {/* Quick-action chips */}
          {showChips && (
            <div className="space-y-2.5 pb-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1">
                Select to generate leads
              </p>
              {chipGroups.map(group => (
                <div key={group.id} className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 px-1">
                    <span>{group.icon}</span> {group.label}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {group.chips.map(chip => {
                      const isSelected = (selected[group.id] || []).includes(chip);
                      return (
                        <button
                          key={chip}
                          onClick={() => toggleChip(group.id, chip)}
                          className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/50 text-foreground border-border hover:border-primary/40 hover:bg-muted"
                          }`}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {hasSelections && (
                <Button
                  size="sm"
                  className="w-full h-7 text-xs gap-1.5 mt-1"
                  onClick={handleGenerate}
                >
                  <Sparkles className="w-3 h-3" />
                  Generate 5 leads
                </Button>
              )}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[90%] rounded-lg px-2.5 py-1.5 text-xs ${
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

      <div className="flex items-center gap-1.5 px-2 py-2 border-t border-border/50">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleFileUpload} />
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => fileInputRef.current?.click()}>
          <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
        <Input
          placeholder="Ask about strategy…"
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
