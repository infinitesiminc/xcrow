import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-chat`;

interface RoleResult {
  jobId: string;
  title: string;
  company: string | null;
  logo: string | null;
  location: string | null;
  country: string | null;
  workMode: string | null;
  seniority: string | null;
  augmented: number;
  risk: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What tech roles are safe from AI?",
  "Show me marketing jobs in London",
  "I'm studying finance — what should I know?",
  "Remote data science roles",
];

export default function HomepageChat({
  onRolesFound,
  onChatStart,
  hasInteracted,
}: {
  onRolesFound: (roles: RoleResult[]) => void;
  onChatStart: () => void;
  hasInteracted: boolean;
}) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    if (!hasInteracted) onChatStart();

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsStreaming(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
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
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length > allMessages.length) {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
            );
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
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
            if (parsed.type === "role_cards" && parsed.roles) {
              onRolesFound(parsed.roles);
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
              onRolesFound(parsed.roles);
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
    <div className="w-full flex flex-col">
      {/* Chat messages (visible after interaction) */}
      {hasInteracted && messages.length > 0 && (
        <div
          ref={scrollRef}
          className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto mb-4 px-1 scrollbar-thin"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" ? (
                  <div className="chat-prose max-w-[92%]">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
                    <p className="text-sm text-foreground">{msg.content}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-2 items-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Thinking…</span>
            </div>
          )}
        </div>
      )}

      {/* Input card */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
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
          {/* Suggestion chips */}
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
