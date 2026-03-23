import { useRef, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, Sparkles, X, Trash2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatContext } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import TypewriterMarkdown from "@/components/TypewriterMarkdown";
import InlineChatRoleCards from "@/components/chat/InlineChatRoleCards";

/** Context-aware suggestion chips — teaches capabilities by example */
function useSuggestionChips(user: any, viewCtx: any, hasJourneyData: boolean) {
  return useMemo(() => {
    if (!user) {
      return [
        "What roles match my interests?",
        "Show me high-growth skills",
      ];
    }

    const panel = viewCtx?.activePanel;
    const selectedRole = viewCtx?.selectedRole;
    const lastSim = viewCtx?.lastSimResult;
    const page = viewCtx?.page;

    // Just finished a sim
    if (lastSim) {
      return [
        "How did I do overall?",
        "What should I practice next?",
      ];
    }

    // Viewing a specific role
    if (panel === "role-preview" && selectedRole) {
      return [
        `Am I ready for ${selectedRole.title}?`,
        "What quests build the most skills here?",
      ];
    }

    // Browsing kingdoms
    if (panel === "roles") {
      return [
        "Which kingdom should I conquer first?",
        "What's my weakest area?",
      ];
    }

    // On map / skill forge
    if (page === "map" || panel === "territory") {
      return hasJourneyData
        ? ["What should I practice next?", "Find roles that match my skills"]
        : ["What roles match my interests?", "Show me high-growth skills"];
    }

    // Default signed-in
    return hasJourneyData
      ? ["What should I practice next?", "How am I progressing?"]
      : ["What roles match my interests?", "Show me high-growth skills"];
  }, [user, viewCtx?.activePanel, viewCtx?.selectedRole?.title, viewCtx?.lastSimResult, viewCtx?.page, hasJourneyData]);
}

export default function UnifiedChatDock() {
  const { items, isStreaming, isOpen, setIsOpen, sendMessage, clearChat, hasInteracted, onRoleSelectRef, simActive, viewContext } = useChatContext();
  const { user } = useAuth();
  const hasJourneyData = items.length > 0 || hasInteracted;
  const suggestions = useSuggestionChips(user, viewContext, hasJourneyData);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  // Auto-scroll

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [items, isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  const handleRoleSelect = (role: any) => {
    setIsOpen(false);
    const slug = encodeURIComponent(role.title);
    const params = new URLSearchParams();
    if (role.company) params.set("company", role.company);
    if (role.jobId) params.set("jobId", role.jobId);
    navigate(`/role/${slug}?${params.toString()}`);
  };

  // Don't render anything when a simulation is active
  if (simActive) return null;

  return (
    <>
      {/* ── Bottom dock bar ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="dock-bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 px-4 py-2.5 rounded-full bg-card/95 backdrop-blur-xl border border-primary/40 animate-coach-glow hover:shadow-[0_0_28px_-4px_hsl(var(--primary)/0.7),0_0_50px_-8px_hsl(var(--primary)/0.35)] transition-all group"
          >
            <div className="relative">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
            <span className="text-sm font-medium text-foreground">AI Coach</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Expanded chat panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed bottom-4 right-4 z-[60] w-[380px] flex flex-col bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl"
            style={{ maxHeight: "min(70vh, 560px)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">AI Career Coach</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  Context-Aware
                </span>
              </div>
              <div className="flex items-center gap-1">
                {items.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Clear conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[120px] scrollbar-thin">
              {items.length === 0 && !hasInteracted && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    I know what you're looking at — ask me anything about the role, skills, or your career path.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {(user ? SIGNED_IN_SUGGESTIONS : GUEST_SUGGESTIONS).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          sendMessage(s);
                          setInput("");
                        }}
                        className="text-[11px] px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {items.map((item, i) => {
                if (item.type === "roles") {
                  return (
                    <div key={`roles-${i}`} className="py-1">
                      <InlineChatRoleCards
                        roles={item.roles}
                        onSelectRole={handleRoleSelect}
                        onViewDetails={handleRoleSelect}
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

              {isStreaming && items[items.length - 1]?.type !== "assistant" && (
                <div className="flex gap-2 items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Thinking…</span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border/30 px-3 py-3 shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask about any role, skill, or career path…"
                  disabled={isStreaming}
                  rows={1}
                  className="flex-1 bg-muted/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none min-h-[40px]"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 transition-all hover:bg-primary/90 active:scale-95 shrink-0"
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
