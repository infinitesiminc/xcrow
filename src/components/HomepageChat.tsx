import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TypewriterMarkdown from "@/components/TypewriterMarkdown";
import { useToast } from "@/hooks/use-toast";
import InlineRoleCarousel, { type RoleResult } from "@/components/InlineRoleCarousel";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { aggregateSkillXP, type SimRecord } from "@/lib/skill-map";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-chat`;

type ChatItem =
  | { type: "user"; content: string }
  | { type: "assistant"; content: string }
  | { type: "roles"; roles: RoleResult[] };

const SUGGESTIONS = [
  "I'm graduating next year — what skills matter most?",
  "What does a product manager actually do day-to-day?",
  "Show me roles where AI helps the most",
  "I'm studying finance — what should I practice?",
];

export default function HomepageChat({
  onRolesFound,
  onRoleSelect,
  onChatStart,
  hasInteracted,
  selectedJobId,
  inlineCards = true,
  externalPrompt,
  onExternalPromptConsumed,
}: {
  onRolesFound?: (roles: RoleResult[]) => void;
  onRoleSelect: (role: RoleResult) => void;
  onChatStart: () => void;
  hasInteracted: boolean;
  selectedJobId?: string;
  inlineCards?: boolean;
  externalPrompt?: string | null;
  onExternalPromptConsumed?: () => void;
}) {
  const { toast } = useToast();
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [items]);

  const resizeTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  // Handle external prompt injection (e.g. from Human Edges card)
  useEffect(() => {
    if (externalPrompt) {
      sendMessage(externalPrompt);
      onExternalPromptConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPrompt]);

  // Extract only text messages for the API, filtering out raw tool call text
  const TOOL_CALL_RE = /search_roles\s*[\({][^)}\n]+[\)}]/;
  const getApiMessages = (chatItems: ChatItem[]) =>
    chatItems
      .filter((it): it is ChatItem & { type: "user" | "assistant" } => it.type !== "roles")
      .filter((it) => !(it.type === "assistant" && TOOL_CALL_RE.test(it.content.trim())))
      .map((m) => ({ role: m.type, content: m.content }));

  // Build journey context for territory-aware chat
  const { user } = useAuth();
  const journeyContextRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [profileRes, simsRes] = await Promise.all([
        supabase.from("profiles").select("target_roles").eq("id", user.id).single(),
        supabase.from("completed_simulations").select("task_name, job_title, skills_earned").eq("user_id", user.id),
      ]);

      const targetRoles = ((profileRes.data as any)?.target_roles || []) as { job_id: string; title: string; company: string | null }[];
      const sims = (simsRes.data || []) as SimRecord[];
      const skills = aggregateSkillXP(sims);
      const activeSkills = skills.filter(s => s.xp > 0);
      const activeNames = activeSkills.map(s => s.name);

      // Get target role skill names
      let frontierSkills: string[] = [];
      let coveragePct: number | undefined;
      if (targetRoles.length > 0) {
        const jobIds = targetRoles.map(r => r.job_id);
        const { data: clusters } = await supabase.from("job_task_clusters").select("skill_names").in("job_id", jobIds);
        const targetNames = new Set<string>();
        for (const c of (clusters || [])) {
          for (const s of (c.skill_names || [])) targetNames.add(s);
        }
        const activeSet = new Set(activeNames.map(n => n.toLowerCase()));
        frontierSkills = Array.from(targetNames).filter(n => !activeSet.has(n.toLowerCase()));
        const claimed = Array.from(targetNames).filter(n => activeSet.has(n.toLowerCase())).length;
        coveragePct = targetNames.size > 0 ? Math.round((claimed / targetNames.size) * 100) : undefined;
      }

      // Find weakest skill among active
      const weakest = activeSkills.length > 0 ? activeSkills.reduce((a, b) => a.xp < b.xp ? a : b) : null;

      journeyContextRef.current = {
        targetRoles: targetRoles.map(r => ({ title: r.title, company: r.company })),
        activeSkills: activeNames,
        frontierSkills,
        weakestSkill: weakest?.name || null,
        coveragePct,
      };
    })();
  }, [user]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    if (!hasInteracted) onChatStart();

    const userItem: ChatItem = { type: "user", content: text.trim() };
    const allItems = [...items, userItem];
    setItems(allItems);
    setInput("");
    setIsStreaming(true);

    let assistantSoFar = "";

    try {
      const body: any = { messages: getApiMessages(allItems) };
      if (journeyContextRef.current) body.journeyContext = journeyContextRef.current;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast({
          title: "Chat error",
          description: (err as any).error || "Something went wrong",
          variant: "destructive",
        });
        setIsStreaming(false);
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        // Don't display raw tool call text
        if (TOOL_CALL_RE.test(assistantSoFar.trim())) return;
        setItems((prev) => {
          const last = prev[prev.length - 1];
          if (last?.type === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 && m.type === "assistant"
                ? { ...m, content: assistantSoFar }
                : m
            );
          }
          return [...prev, { type: "assistant", content: assistantSoFar }];
        });
      };

      const insertRoles = (roles: RoleResult[]) => {
        onRolesFound?.(roles);
        if (inlineCards) {
          setItems((prev) => [...prev, { type: "roles", roles }]);
        }
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
            if (parsed.type === "role_cards" && parsed.roles) {
              insertRoles(parsed.roles);
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

      if (buf.trim()) {
        for (let raw of buf.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "role_cards" && parsed.roles) {
              insertRoles(parsed.roles);
              continue;
            }
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {}
        }
      }
    } catch (e) {
      console.error("Chat stream error:", e);
      toast({
        title: "Connection error",
        description: "Could not reach the AI. Please try again.",
        variant: "destructive",
      });
    }

    setIsStreaming(false);
  };

  return (
    <div className="w-full flex flex-col h-full">
      {/* Chat items (visible after interaction) */}
      {hasInteracted && items.length > 0 && (
        <div
          ref={scrollRef}
          className="flex-1 flex flex-col gap-4 overflow-y-auto mb-4 px-1 scrollbar-thin"
        >
          <AnimatePresence initial={false}>
            {items.map((item, i) => {
              if (item.type === "roles") {
                return (
                  <div key={`roles-${i}`} className="py-1">
                    <InlineRoleCarousel
                      roles={item.roles}
                      onSelectRole={onRoleSelect}
                      selectedJobId={selectedJobId}
                    />
                  </div>
                );
              }

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${item.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  {item.type === "assistant" ? (
                    <TypewriterMarkdown
                      content={item.content}
                      isStreaming={isStreaming && i === items.length - 1}
                    />
                  ) : (
                    <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
                      <p className="text-sm text-foreground">{item.content}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isStreaming && items[items.length - 1]?.type !== "assistant" && (
            <div className="flex gap-2 items-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Thinking…</span>
            </div>
          )}
        </div>
      )}

      {/* Input card */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden shrink-0">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          placeholder="How can I help with your career?"
          disabled={isStreaming}
          rows={1}
          className="w-full bg-transparent px-4 pt-4 pb-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none min-h-[52px]"
        />
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
            {!hasInteracted &&
              SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors truncate max-w-[200px]"
                >
                  {s}
                </button>
              ))}
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            className="ml-2 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 transition-opacity hover:bg-primary/90 shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
