import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import {
  Send, Loader2, MapPin, Target, Upload, Rocket, ImageIcon,
} from "lucide-react";
import type { GTMTreeData } from "./gtm-types";

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

function buildICPSummary(companyName: string, data: GTMTreeData): string {
  const products = data.products.map(p => p.name).join(", ");
  const verticals = [...new Set(data.mappings.map(m => m.vertical))].join(", ");
  const dmTitles = [...new Set(data.mappings.map(m => m.dm.title))].slice(0, 5).join(", ");
  const customerCount = data.customers.length;
  const conquestCount = data.conquest_targets.length;

  return `I've mapped **${companyName}**'s GTM framework:

**Products:** ${products}
**Target Verticals:** ${verticals}
**Decision-Maker Roles:** ${dmTitles}
**Named Customers:** ${customerCount} found on website
**Conquest Targets:** ${conquestCount} competitor customers identified

Now tell me how to focus the first batch of 5 leads:
- 📍 **Location** — e.g. "New York" or "London, UK"
- 🎯 **Vertical** — focus on a specific vertical above
- 📎 **Upload** a brochure or competitor list (image/PDF)
- Or just describe what you're looking for!`;
}

export default function StrategyChatPanel({ companyName, treeData, onStartLeadGen, isGenerating }: StrategyChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { role: "assistant", content: buildICPSummary(companyName, treeData) },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [extractedContext, setExtractedContext] = useState<{
    location?: string; verticalFocus?: string; competitorTarget?: string; customNotes?: string;
  }>({});
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isThinking) return;
    setInput("");

    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsThinking(true);

    try {
      // Call leadgen-chat with ICP context injected
      const systemContext = `You are helping the user define their lead generation strategy for ${companyName}.

ICP Context:
- Products: ${treeData.products.map(p => `${p.id}: ${p.name}`).join(", ")}
- Verticals: ${[...new Set(treeData.mappings.map(m => m.vertical))].join(", ")}
- DM Titles: ${[...new Set(treeData.mappings.map(m => m.dm.title))].join(", ")}
- Named Customers: ${treeData.customers.map(c => c.name).join(", ")}
- Conquest Targets: ${treeData.conquest_targets.map(c => `${c.name} (uses ${c.uses_competitor})`).join(", ")}

Your job is to understand the user's targeting preferences and extract:
1. Location preference (city/region/country)
2. Vertical focus (which vertical to prioritize)
3. Competitor targeting (specific competitor's customers to go after)
4. Any custom notes

After understanding their preference, summarize what you'll search for and ask them to confirm.
When they confirm, respond with EXACTLY this JSON block at the end of your message:
\`\`\`json
{"action":"generate","location":"...","verticalFocus":"...","competitorTarget":"...","customNotes":"..."}
\`\`\`

Keep responses brief (2-3 sentences + confirmation). Do NOT call any tools.`;

      const chatMessages = [
        { role: "system", content: systemContext },
        ...newMessages.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.content })),
      ];

      const { data, error } = await supabase.functions.invoke("leadgen-chat", {
        body: { messages: chatMessages },
      });

      // Parse SSE response
      let assistantContent = "";
      if (typeof data === "string") {
        const lines = data.split("\n");
        for (const line of lines) {
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
      } else if (error) {
        assistantContent = "Sorry, I had trouble processing that. Could you try again?";
      }

      // Check for action JSON
      const actionMatch = assistantContent.match(/```json\s*(\{[^`]+\})\s*```/);
      if (actionMatch) {
        try {
          const action = JSON.parse(actionMatch[1]);
          if (action.action === "generate") {
            setExtractedContext({
              location: action.location || undefined,
              verticalFocus: action.verticalFocus || undefined,
              competitorTarget: action.competitorTarget || undefined,
              customNotes: action.customNotes || undefined,
            });
            setReadyToGenerate(true);
            // Clean the JSON block from display
            assistantContent = assistantContent.replace(/```json\s*\{[^`]+\}\s*```/, "").trim();
          }
        } catch {}
      }

      setMessages(prev => [...prev, { role: "assistant", content: assistantContent || "I'm ready when you are! Just tell me where to focus." }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection issue — please try again." }]);
    } finally {
      setIsThinking(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // For now, notify user about the file and add context
    const userMsg: ChatMessage = {
      role: "user",
      content: `📎 Uploaded: ${file.name} (${file.type || "document"})`,
    };
    setMessages(prev => [...prev, userMsg, {
      role: "assistant",
      content: `I see you've uploaded **${file.name}**. File analysis is coming soon! For now, please describe the key details from the document — like target verticals, competitor names, or specific customer types you're looking for.`,
    }]);
  }

  function handleQuickAction(action: string) {
    if (action === "location") {
      setInput("Focus leads in ");
    } else if (action === "vertical") {
      const verticals = [...new Set(treeData.mappings.map(m => m.vertical))];
      setInput(`Focus on the ${verticals[0] || ""} vertical`);
    } else if (action === "generate") {
      onStartLeadGen(extractedContext);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-accent/30">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Lead Strategy</span>
        </div>
        {readyToGenerate && (
          <Button
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => onStartLeadGen(extractedContext)}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
            Generate 5 leads
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="h-[280px]">
        <div className="p-3 space-y-3">
          {messages.filter(m => m.role !== "system").map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}>
                <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-1 [&_p:last-child]:mb-0 [&_strong]:text-inherit">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Quick actions */}
      {!readyToGenerate && messages.length <= 2 && (
        <div className="flex gap-1.5 px-3 pb-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => handleQuickAction("location")}>
            <MapPin className="w-3 h-3" /> Add location
          </Button>
          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => handleQuickAction("vertical")}>
            <Target className="w-3 h-3" /> Pick vertical
          </Button>
          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3 h-3" /> Upload file
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-border/50">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileUpload}
        />
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => fileInputRef.current?.click()}>
          <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
        <Input
          placeholder="Type your lead strategy..."
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
