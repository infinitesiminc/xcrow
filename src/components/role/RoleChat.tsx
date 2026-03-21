import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { AnimatePresence, motion } from "framer-motion";

interface RoleChatProps {
  jobTitle: string;
  company?: string;
  timeHorizon: number;
  completedCount: number;
  predictionsSummary?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean; // true while tokens are arriving
}

/** Render streaming text as plain lines with a blinking cursor, full markdown when done */
function AssistantBubble({ content, streaming }: { content: string; streaming?: boolean }) {
  if (streaming) {
    // During streaming: render plain text with line breaks + blinking cursor
    return (
      <span className="whitespace-pre-wrap">
        {content}
        <span className="inline-block w-[5px] h-[14px] bg-primary/70 ml-0.5 align-middle animate-pulse rounded-sm" />
      </span>
    );
  }

  // After streaming: full markdown
  return (
    <div className="prose prose-xs dark:prose-invert max-w-none [&_p]:mb-1 [&_p]:mt-0 [&_ul]:my-1 [&_li]:my-0">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

export function RoleChat({ jobTitle, company, timeHorizon, completedCount, predictionsSummary }: RoleChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
            viewContext: {
              page: "role-deep-dive", jobTitle, company,
              timeHorizon: ["Today", "2-3 Years", "5+ Years"][timeHorizon],
              completedCount, predictionsSummary,
            },
          }),
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/event-stream") && response.body) {
        let assistantText = "";
        // Add empty streaming message
        setMessages(prev => [...prev, { role: "assistant", content: "", streaming: true }]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantText += content;
                const snapshot = assistantText;
                setMessages(prev =>
                  prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: snapshot } : m
                  )
                );
              }
            } catch { /* partial JSON, skip */ }
          }
        }

        // Mark streaming complete
        setMessages(prev =>
          prev.map((m, i) =>
            i === prev.length - 1
              ? { ...m, content: assistantText || "I couldn't generate a response.", streaming: false }
              : m
          )
        );
      } else {
        const data = await response.json();
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: data?.reply || data?.content || "I couldn't generate a response." },
        ]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
    }
    setLoading(false);
  }, [input, loading, messages, jobTitle, company, timeHorizon, completedCount, predictionsSummary]);

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-30 h-10 w-10 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-transform active:scale-95"
      >
        {open ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-16 right-4 z-30 w-80 max-h-[50vh] rounded-xl border border-border bg-card shadow-xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-border/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground truncate">
                Ask about {jobTitle}
              </span>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-[120px]">
              {messages.length === 0 && (
                <p className="text-[11px] text-muted-foreground text-center py-4">
                  What to practice first? How will this role change?
                </p>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[88%] rounded-lg px-2.5 py-1.5 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <AssistantBubble content={msg.content} streaming={msg.streaming} />
                    ) : msg.content}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground">
                    <span className="animate-pulse">Thinking…</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border/30 px-2 py-2 flex gap-1.5">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask…"
                className="flex-1 bg-muted rounded-md px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/50"
              />
              <Button size="icon" onClick={sendMessage} disabled={loading || !input.trim()} className="h-7 w-7 rounded-md shrink-0">
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
