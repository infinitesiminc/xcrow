/**
 * AllyChat — Slide-in DM drawer for chatting with a specific ally.
 * Dark fantasy RPG themed, fits within the 420px sidebar.
 */
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useFriendMessages } from "@/hooks/use-friend-messages";
import { getAvatarById } from "@/lib/avatars";
import type { Friend } from "@/hooks/use-friends";

interface AllyChatProps {
  friend: Friend;
  onBack: () => void;
}

export default function AllyChat({ friend, onBack }: AllyChatProps) {
  const { user } = useAuth();
  const { messages, loading, sending, friendIsTyping, sendMessage, broadcastTyping } = useFriendMessages(friend.friendId);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    const text = draft;
    setDraft("");
    await sendMessage(text);
  };

  const avatar = friend.avatarId ? getAvatarById(friend.avatarId) : null;

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute inset-0 z-20 flex flex-col"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Header */}
      <div
        className="px-3 py-2.5 flex items-center gap-2.5 shrink-0"
        style={{
          borderBottom: "1px solid hsl(var(--filigree) / 0.15)",
          background: "hsl(var(--surface-stone) / 0.5)",
        }}
      >
        <button
          onClick={onBack}
          className="p-1 rounded-md hover:bg-white/5 transition-colors"
          style={{ color: "hsl(var(--filigree-glow))" }}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="relative shrink-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs overflow-hidden"
            style={{ background: "hsl(var(--filigree) / 0.1)" }}
          >
            {avatar ? (
              <img src={avatar.src} alt={avatar.label} className="w-full h-full object-cover" />
            ) : (
              friend.displayName[0]?.toUpperCase() || "?"
            )}
          </div>
          <div
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
            style={{
              borderColor: "hsl(var(--background))",
              background: friend.isOnline ? "hsl(142 70% 50%)" : "hsl(var(--muted-foreground) / 0.3)",
            }}
          />
        </div>
        <div className="min-w-0">
          <p
            className="text-xs font-bold truncate"
            style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--foreground))" }}
          >
            {friend.displayName}
          </p>
          <p className="text-[9px] text-muted-foreground">
            {friend.isOnline ? (friend.currentActivity || "Online") : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef as any}>
        <div className="px-3 py-3 space-y-2 min-h-full flex flex-col justify-end">
          {loading ? (
            <div className="text-center text-xs text-muted-foreground py-8" style={{ fontFamily: "'Cinzel', serif" }}>
              Loading scrolls...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
                ⚔️ Begin your alliance conversation
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                Send a message to {friend.displayName}
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMine = msg.senderId === user?.id;
              const showTime = i === 0 || (
                new Date(msg.createdAt).getTime() - new Date(messages[i - 1].createdAt).getTime() > 300_000
              );
              return (
                <div key={msg.id}>
                  {showTime && (
                    <p className="text-center text-[9px] text-muted-foreground/50 my-2">
                      {formatTime(msg.createdAt)}
                    </p>
                  )}
                  <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[80%] px-3 py-1.5 rounded-xl text-xs leading-relaxed"
                      style={
                        isMine
                          ? {
                              background: "hsl(var(--filigree) / 0.15)",
                              color: "hsl(var(--foreground))",
                              borderBottomRightRadius: 4,
                            }
                          : {
                              background: "hsl(var(--surface-stone) / 0.6)",
                              color: "hsl(var(--foreground))",
                              borderBottomLeftRadius: 4,
                            }
                      }
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div
        className="px-3 py-2.5 shrink-0 flex gap-2 items-center"
        style={{ borderTop: "1px solid hsl(var(--filigree) / 0.15)" }}
      >
        <Input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Send a raven..."
          className="flex-1 h-8 text-xs bg-transparent border-muted/30"
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || sending}
          className="p-1.5 rounded-md transition-all disabled:opacity-30"
          style={{ color: "hsl(var(--filigree-glow))" }}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
