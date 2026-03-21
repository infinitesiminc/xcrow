import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { aggregateSkillXP, type SimRecord } from "@/lib/skill-map";
import { type RoleResult } from "@/components/InlineRoleCarousel";

// ── Types ──────────────────────────────────────────────────────
export interface ViewContext {
  page: string;
  activePanel?: string;
  selectedRole?: { title: string; company: string | null; jobId: string } | null;
  jobTitle?: string;
  company?: string;
  timeHorizon?: string;
  completedCount?: number;
  predictionsSummary?: string;
  selectedTab?: string;
  lastSimResult?: { taskName: string; jobTitle: string; scores: Record<string, number> } | null;
}

export type ChatItem =
  | { type: "user"; content: string }
  | { type: "assistant"; content: string }
  | { type: "roles"; roles: RoleResult[] };

interface ChatContextValue {
  items: ChatItem[];
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  setViewContext: (ctx: Partial<ViewContext>) => void;
  viewContext: ViewContext;
  // Callbacks for pages to subscribe to role events
  onRolesFoundRef: React.MutableRefObject<((roles: RoleResult[]) => void) | null>;
  onRoleSelectRef: React.MutableRefObject<((role: RoleResult) => void) | null>;
  hasInteracted: boolean;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used inside ChatProvider");
  return ctx;
}

/** Hook for pages to register view context based on current route */
export function useChatViewContext(ctx: Partial<ViewContext>, deps: any[] = []) {
  const chat = useContext(ChatContext);
  useEffect(() => {
    chat?.setViewContext(ctx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ── Provider ──────────────────────────────────────────────────
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-chat`;
const TOOL_CALL_RE = /search_roles\s*[\({][^)}\n]+[\)}]/;

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  const [items, setItems] = useState<ChatItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [viewCtx, setViewCtx] = useState<ViewContext>({ page: "home" });
  const [loaded, setLoaded] = useState(false);

  const onRolesFoundRef = useRef<((roles: RoleResult[]) => void) | null>(null);
  const onRoleSelectRef = useRef<((role: RoleResult) => void) | null>(null);
  const journeyContextRef = useRef<any>(null);

  // Auto-detect page from route
  useEffect(() => {
    const path = location.pathname;
    let page = "home";
    if (path.startsWith("/role/")) page = "role-deep-dive";
    else if (path.startsWith("/analysis")) page = "analysis";
    else if (path.startsWith("/journey")) page = "journey";
    else if (path.startsWith("/company/")) page = "company";
    setViewCtx(prev => ({ ...prev, page }));
  }, [location.pathname]);

  const setViewContext = useCallback((ctx: Partial<ViewContext>) => {
    setViewCtx(prev => ({ ...prev, ...ctx }));
  }, []);

  // Load persisted chat on mount
  useEffect(() => {
    if (!user || loaded) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("chat_messages")
        .select("role, content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(50);
      if (data && data.length > 0) {
        const restored: ChatItem[] = data.map(m => ({
          type: m.role as "user" | "assistant",
          content: m.content,
        }));
        setItems(restored);
        setHasInteracted(true);
      }
      setLoaded(true);
    })();
  }, [user, loaded]);

  // Build journey context for signed-in users
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
      const practicedTasks = [...new Set(sims.map(s => s.task_name))];

      let frontierSkills: string[] = [];
      let coveragePct: number | undefined;
      if (targetRoles.length > 0) {
        const jobIds = targetRoles.map(r => r.job_id);
        const { data: clusters } = await supabase.from("job_task_clusters").select("skill_names").in("job_id", jobIds);
        const targetNames = new Set<string>();
        for (const c of (clusters || [])) {
          for (const s of (c.skill_names || [])) targetNames.add(s);
        }
        const activeSet = new Set(activeSkills.map(s => s.name.toLowerCase()));
        frontierSkills = Array.from(targetNames).filter(n => !activeSet.has(n.toLowerCase()));
        const claimed = Array.from(targetNames).filter(n => activeSet.has(n.toLowerCase())).length;
        coveragePct = targetNames.size > 0 ? Math.round((claimed / targetNames.size) * 100) : undefined;
      }
      const weakest = activeSkills.length > 0 ? activeSkills.reduce((a, b) => a.xp < b.xp ? a : b) : null;

      journeyContextRef.current = {
        userId: user.id,
        targetRoles: targetRoles.map(r => ({ title: r.title, company: r.company, job_id: r.job_id })),
        skillLevels: activeSkills.map(s => ({ name: s.name, level: s.level, xp: s.xp })),
        frontierSkills,
        weakestSkill: weakest?.name || null,
        coveragePct,
        practicedTasks: practicedTasks.slice(0, 30),
      };
    })();
  }, [user]);

  const getApiMessages = (chatItems: ChatItem[]) =>
    chatItems
      .filter((it): it is ChatItem & { type: "user" | "assistant" } => it.type !== "roles")
      .filter((it) => !(it.type === "assistant" && TOOL_CALL_RE.test(it.content.trim())))
      .map((m) => ({ role: m.type, content: m.content }));

  const persistMessage = useCallback(async (role: "user" | "assistant", content: string) => {
    if (!user) return;
    await supabase.from("chat_messages" as any).insert({
      user_id: user.id,
      role,
      content,
      view_context: viewCtx as any,
    });
  }, [user, viewCtx]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    if (!hasInteracted) setHasInteracted(true);

    const userItem: ChatItem = { type: "user", content: trimmed };
    const allItems = [...items, userItem];
    setItems(allItems);
    setIsStreaming(true);

    // Persist user message
    persistMessage("user", trimmed);

    let assistantSoFar = "";

    try {
      const body: any = { messages: getApiMessages(allItems) };
      if (journeyContextRef.current) body.journeyContext = journeyContextRef.current;
      body.viewContext = viewCtx;

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
        setItems(prev => [...prev, { type: "assistant", content: (err as any).error || "Something went wrong." }]);
        setIsStreaming(false);
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
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
        onRolesFoundRef.current?.(roles);
        setItems((prev) => [...prev, { type: "roles", roles }]);
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

      // Flush remaining buffer
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

      // Persist assistant message
      if (assistantSoFar && !TOOL_CALL_RE.test(assistantSoFar.trim())) {
        persistMessage("assistant", assistantSoFar);
      }
    } catch (e) {
      console.error("Chat stream error:", e);
      setItems(prev => [...prev, { type: "assistant", content: "Sorry, connection error. Please try again." }]);
    }

    setIsStreaming(false);
  }, [items, isStreaming, hasInteracted, viewCtx, persistMessage]);

  const clearChat = useCallback(async () => {
    setItems([]);
    setHasInteracted(false);
    if (user) {
      await supabase.from("chat_messages").delete().eq("user_id", user.id);
    }
  }, [user]);

  return (
    <ChatContext.Provider
      value={{
        items,
        isStreaming,
        isOpen,
        setIsOpen,
        sendMessage,
        clearChat,
        setViewContext,
        viewContext: viewCtx,
        onRolesFoundRef,
        onRoleSelectRef,
        hasInteracted,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
