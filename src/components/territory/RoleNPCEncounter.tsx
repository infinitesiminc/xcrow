/**
 * RoleNPCEncounter — Cinematic encounter with conversational AI chat.
 * Split-panel layout: full-height NPC portrait (left) + chat (right).
 * The role character speaks in first person about how AI is changing their work.
 */
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Shield, TrendingUp, BookOpen, Swords, Award, ChevronRight, Sparkles, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HeroScene from "@/components/territory/HeroScene";
import { getTerritoryHeroImage } from "@/lib/territory-hero-images";
import { type RoleNPC, THREAT_COLORS, TERRITORY_HUES } from "@/lib/role-npcs";
import { ROLE_NPC_AVATARS } from "@/lib/role-npc-avatars";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";

interface RoleNPCEncounterProps {
  role: RoleNPC;
  avatarSrc?: string;
  onClose: () => void;
  onCollectSkills?: (skillIds: string[]) => void;
  onExploreRole?: (role: RoleNPC) => void;
}

interface FutureSkillInfo {
  id: string;
  name: string;
  category: string;
  icon_emoji: string | null;
}

type ChatMsg = { role: "user" | "assistant"; content: string };

const cinzel = { fontFamily: "'Cinzel', serif" };

/** Smooth typewriter that reveals text character-by-character using CSS */
function StreamingText({ text, isComplete }: { text: string; isComplete: boolean }) {
  const [displayed, setDisplayed] = useState("");
  const targetRef = useRef(text);
  const rafRef = useRef<number>(0);
  const indexRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    targetRef.current = text;
  }, [text]);

  useEffect(() => {
    if (isComplete) {
      setDisplayed(targetRef.current);
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const tick = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const elapsed = time - lastTimeRef.current;
      
      if (elapsed >= 12) {
        lastTimeRef.current = time;
        const target = targetRef.current;
        if (indexRef.current < target.length) {
          const charsToAdd = Math.min(2, target.length - indexRef.current);
          indexRef.current += charsToAdd;
          setDisplayed(target.slice(0, indexRef.current));
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isComplete]);

  useEffect(() => {
    if (text.length < displayed.length) {
      indexRef.current = 0;
      lastTimeRef.current = 0;
      setDisplayed("");
    }
  }, [text]);

  if (isComplete) {
    return (
      <div className="prose prose-sm prose-invert max-w-none [&>p]:mb-2.5 [&>p:last-child]:mb-0 [&>ul]:mt-1 [&>ul]:mb-2 [&>ol]:mt-1 [&>ol]:mb-2 text-inherit leading-relaxed">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    );
  }

  return (
    <span className="whitespace-pre-wrap">
      {displayed}
      <motion.span
        className="inline-block w-[2px] h-[1em] ml-0.5 align-text-bottom"
        style={{ background: "currentColor" }}
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
    </span>
  );
}

const QUICK_QUESTIONS = [
  "What does your day look like?",
  "What scares you most about AI?",
  "What skills should I learn?",
  "How has your job changed?",
];

export default function RoleNPCEncounter({ role, avatarSrc: avatarSrcProp, onClose, onCollectSkills, onExploreRole }: RoleNPCEncounterProps) {
  const { user } = useAuth();
  const hue = TERRITORY_HUES[role.territory] ?? 220;
  const heroImage = getTerritoryHeroImage(role.territory);
  const colors = THREAT_COLORS[role.threatTier];
  const [futureSkills, setFutureSkills] = useState<FutureSkillInfo[]>([]);
  const [collected, setCollected] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const avatarSrc = avatarSrcProp || (role.territory ? ROLE_NPC_AVATARS[role.territory] : null);

  // Fetch future skills
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("job_future_skills")
        .select("canonical_skill_id, canonical_future_skills!inner(id, name, category, icon_emoji)")
        .eq("job_id", role.jobId)
        .not("canonical_skill_id", "is", null)
        .limit(8);
      if (data) {
        const unique = new Map<string, FutureSkillInfo>();
        for (const row of data as any[]) {
          const s = row.canonical_future_skills;
          if (s && !unique.has(s.id)) unique.set(s.id, s);
        }
        setFutureSkills(Array.from(unique.values()));
      }
    })();
  }, [role.jobId]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Send initial greeting as first assistant message
  useEffect(() => {
    setChatMessages([{ role: "assistant", content: role.greeting }]);
  }, [role.greeting]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: ChatMsg = { role: "user", content: text.trim() };
    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setInputValue("");
    setIsStreaming(true);

    let assistantSoFar = "";
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/role-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: newHistory,
            jobId: role.jobId,
            roleContext: { threatTier: role.threatTier, territory: role.territory },
          }),
        }
      );

      if (!resp.ok || !resp.body) {
        throw new Error("Stream failed");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setChatMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > newHistory.length) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error("Role chat error:", e);
      setChatMessages(prev => [...prev, { role: "assistant", content: "I seem to have lost my train of thought... Ask me again?" }]);
    } finally {
      setIsStreaming(false);
    }
  }, [chatMessages, isStreaming, role]);

  const [collecting, setCollecting] = useState(false);

  const handleCollect = () => {
    setCollecting(true);
    setTimeout(() => {
      const ids = futureSkills.map(s => s.id);
      onCollectSkills?.(ids);
      setCollected(true);
      setCollecting(false);
    }, futureSkills.length * 150 + 600);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <HeroScene
          imageUrl={heroImage}
          intensity="full"
          camera="ken-burns"
          overlay="letterbox"
          hue={hue}
          className="absolute inset-0"
        />
        <div className="absolute inset-0 z-[3]" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-[4] w-full max-w-4xl mx-4 flex"
          style={{ height: "min(80vh, 640px)" }}
        >
          <div
            className="rounded-2xl border-2 overflow-hidden backdrop-blur-xl flex w-full"
            style={{
              background: `linear-gradient(135deg, hsl(${hue} 30% 6% / 0.95), hsl(${hue} 20% 10% / 0.95))`,
              borderColor: `hsl(${colors.bg})`,
              boxShadow: `0 0 80px hsl(${colors.glow} / 0.3), inset 0 1px 0 hsl(${hue} 35% 28% / 0.3)`,
            }}
          >
            {/* ═══ LEFT: Full-height NPC portrait ═══ */}
            <div
              className="relative w-[280px] shrink-0 overflow-hidden hidden md:block"
              style={{
                background: `linear-gradient(180deg, hsl(${hue} 25% 8%), hsl(${hue} 20% 4%))`,
              }}
            >
              {/* Portrait image */}
              {avatarSrc ? (
                <motion.img
                  src={avatarSrc}
                  alt={role.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  style={{
                    maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
                  }}
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    background: `radial-gradient(ellipse at center, hsl(${hue} 40% 15%), hsl(${hue} 20% 5%))`,
                    ...cinzel,
                    fontSize: 72,
                    color: `hsl(${hue} 40% 25%)`,
                  }}
                >
                  {role.title.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("")}
                </div>
              )}

              {/* Bottom gradient overlay for text */}
              <div
                className="absolute inset-x-0 bottom-0 h-48"
                style={{
                  background: `linear-gradient(to top, hsl(${hue} 25% 6%), transparent)`,
                }}
              />

              {/* Character info overlay */}
              <div className="absolute inset-x-0 bottom-0 p-4 z-[1]">
                {/* Threat badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[8px] uppercase tracking-[0.15em] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: `hsl(${colors.bg} / 0.2)`,
                      color: `hsl(${colors.bg})`,
                      border: `1px solid hsl(${colors.bg} / 0.4)`,
                    }}
                  >
                    {colors.label}
                  </span>
                  <span className="text-[9px]" style={{ color: `hsl(${hue} 15% 50%)` }}>
                    AI Risk {role.automationRisk}%
                  </span>
                </div>

                {/* Title */}
                <h2
                  className="text-sm font-black tracking-wide leading-tight mb-1"
                  style={{ ...cinzel, color: `hsl(${hue} 45% 80%)` }}
                >
                  {role.title}
                </h2>
                {role.company && (
                  <p className="text-[10px]" style={{ color: `hsl(${hue} 15% 50%)` }}>
                    {role.company} · {role.department}
                  </p>
                )}

                {/* Threat gauge */}
                <div className="mt-3">
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: `hsl(${hue} 15% 15%)` }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${role.automationRisk}%` }}
                      transition={{ duration: 1.2, delay: 0.3 }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, hsl(142 70% 45%), hsl(45 90% 50%), hsl(0 70% 50%))` }}
                    />
                  </div>
                </div>

                {/* Skills count badge */}
                {futureSkills.length > 0 && (
                  <div className="mt-3 flex items-center gap-1.5">
                    <Award size={11} style={{ color: `hsl(${colors.bg})` }} />
                    <span className="text-[9px] font-semibold" style={{ color: `hsl(${colors.bg})` }}>
                      {collected ? `${futureSkills.length} skills collected` : `${futureSkills.length} skills to discover`}
                    </span>
                  </div>
                )}
              </div>

              {/* Subtle animated glow at portrait edge */}
              <motion.div
                className="absolute right-0 inset-y-0 w-[2px]"
                style={{ background: `hsl(${colors.bg})` }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>

            {/* ═══ RIGHT: Chat panel ═══ */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Mobile header (only shown on small screens) */}
              <div className="md:hidden relative px-4 pt-3 pb-2 flex items-center gap-3 flex-shrink-0">
                {avatarSrc ? (
                  <div
                    className="w-10 h-10 rounded-full overflow-hidden shrink-0"
                    style={{
                      border: `2px solid hsl(${colors.bg})`,
                      boxShadow: `0 0 12px hsl(${colors.glow} / 0.3)`,
                    }}
                  >
                    <img src={avatarSrc} alt={role.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: `hsl(${hue} 30% 12%)`,
                      color: `hsl(${hue} 40% 60%)`,
                      border: `2px solid hsl(${colors.bg})`,
                    }}
                  >
                    {role.title.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("")}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: `hsl(${colors.bg} / 0.15)`,
                        color: `hsl(${colors.bg})`,
                      }}
                    >
                      {colors.label}
                    </span>
                  </div>
                  <h2 className="text-xs font-bold truncate" style={{ ...cinzel, color: `hsl(${hue} 45% 78%)` }}>
                    {role.title}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `hsl(${hue} 20% 14%)`, color: `hsl(${hue} 15% 55%)` }}
                >
                  <X size={12} />
                </button>
              </div>

              {/* Desktop close button */}
              <div className="hidden md:flex justify-end px-3 pt-3 pb-1 flex-shrink-0">
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:brightness-125"
                  style={{ background: `hsl(${hue} 20% 14%)`, color: `hsl(${hue} 15% 55%)` }}
                >
                  <X size={12} />
                </button>
              </div>

              {/* Chat Area */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-2 space-y-3 min-h-0"
              >
                {chatMessages.map((msg, i) => {
                  const isLastAssistant = msg.role === "assistant" && i === chatMessages.length - 1;
                  const isCurrentlyStreaming = isLastAssistant && isStreaming;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className="rounded-xl px-3.5 py-2.5 text-sm leading-relaxed"
                        style={
                          msg.role === "assistant"
                            ? {
                                background: `hsl(${hue} 18% 10% / 0.7)`,
                                borderLeft: `2px solid hsl(${colors.bg} / 0.5)`,
                                color: `hsl(${hue} 12% 82%)`,
                                maxWidth: "92%",
                              }
                            : {
                                background: `hsl(${hue} 30% 20% / 0.6)`,
                                color: `hsl(${hue} 15% 88%)`,
                                marginLeft: "auto",
                                maxWidth: "85%",
                              }
                        }
                      >
                        {msg.role === "assistant" ? (
                          <StreamingText text={msg.content} isComplete={!isCurrentlyStreaming} />
                        ) : (
                          <span>{msg.content}</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {isStreaming && chatMessages[chatMessages.length - 1]?.role !== "assistant" && (
                  <div className="flex gap-2">
                    <div
                      className="rounded-xl px-3.5 py-2.5"
                      style={{ background: `hsl(${hue} 18% 10% / 0.7)`, borderLeft: `2px solid hsl(${colors.bg} / 0.5)` }}
                    >
                      <div className="flex gap-1">
                        {[0, 1, 2].map(j => (
                          <motion.div
                            key={j}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: `hsl(${colors.bg})` }}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: j * 0.15 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Questions */}
              {chatMessages.length <= 2 && (
                <div className="px-4 pb-2 flex gap-1.5 flex-wrap flex-shrink-0">
                  {QUICK_QUESTIONS.map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      disabled={isStreaming}
                      className="text-[10px] px-2.5 py-1.5 rounded-full transition-all hover:scale-[1.02]"
                      style={{
                        background: `hsl(${hue} 20% 12%)`,
                        border: `1px solid hsl(${hue} 25% 22%)`,
                        color: `hsl(${hue} 20% 65%)`,
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Skill Collection — appears after a few exchanges */}
              <AnimatePresence>
                {chatMessages.length >= 3 && futureSkills.length > 0 && !collected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden flex-shrink-0"
                  >
                    <div
                      className="mx-4 mb-2 rounded-xl px-3 py-2.5 relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, hsl(${colors.bg} / 0.08), hsl(${colors.bg} / 0.15))`,
                        border: `1px solid hsl(${colors.bg} / 0.25)`,
                      }}
                    >
                      {collecting && (
                        <motion.div
                          className="absolute inset-0 z-0"
                          initial={{ x: "-100%" }}
                          animate={{ x: "200%" }}
                          transition={{ duration: 0.8, ease: "easeInOut" }}
                          style={{
                            background: `linear-gradient(90deg, transparent, hsl(${colors.bg} / 0.2), transparent)`,
                            width: "50%",
                          }}
                        />
                      )}
                      <div className="flex items-center justify-between gap-2 mb-1.5 relative z-[1]">
                        <div className="flex items-center gap-1.5">
                          <motion.div animate={collecting ? { rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.5 }}>
                            <Award size={12} style={{ color: `hsl(${colors.bg})` }} />
                          </motion.div>
                          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: `hsl(${colors.bg})` }}>
                            {collecting ? "Collecting..." : "Skills Discovered"}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="h-6 gap-1 text-[9px] font-bold px-2"
                          disabled={collecting}
                          style={{
                            background: `linear-gradient(135deg, hsl(${colors.bg} / 0.8), hsl(${colors.bg}))`,
                            color: "white",
                            boxShadow: `0 0 12px hsl(${colors.glow} / 0.3)`,
                          }}
                          onClick={handleCollect}
                        >
                          <Sparkles size={9} /> Collect ({futureSkills.length})
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 relative z-[1]">
                        {futureSkills.slice(0, 6).map((skill, i) => (
                          <motion.span
                            key={skill.id}
                            className="text-[8px] px-1.5 py-0.5 rounded-full"
                            animate={collecting ? {
                              scale: [1, 1.15, 0],
                              opacity: [1, 1, 0],
                              y: [0, -4, -20],
                            } : {}}
                            transition={collecting ? {
                              duration: 0.5,
                              delay: i * 0.12,
                              ease: [0.16, 1, 0.3, 1],
                            } : {}}
                            style={{
                              background: `hsl(${hue} 18% 12%)`,
                              border: `1px solid hsl(${colors.bg} / 0.2)`,
                              color: `hsl(${hue} 15% 70%)`,
                            }}
                          >
                            {skill.icon_emoji || "🎯"} {skill.name}
                          </motion.span>
                        ))}
                        {futureSkills.length > 6 && !collecting && (
                          <span className="text-[8px] px-1.5 py-0.5" style={{ color: `hsl(${hue} 15% 50%)` }}>
                            +{futureSkills.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Collected celebration */}
              <AnimatePresence>
                {collected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden flex-shrink-0"
                  >
                    <div
                      className="mx-4 mb-2 rounded-xl px-3 py-2 relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, hsl(${colors.bg} / 0.1), hsl(${colors.bg} / 0.2))`,
                        border: `1px solid hsl(${colors.bg} / 0.4)`,
                        boxShadow: `0 0 20px hsl(${colors.glow} / 0.15)`,
                      }}
                    >
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 rounded-full"
                          style={{ background: `hsl(${colors.bg})`, left: "50%", top: "50%" }}
                          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                          animate={{
                            x: Math.cos((i * Math.PI * 2) / 8) * 50,
                            y: Math.sin((i * Math.PI * 2) / 8) * 25,
                            opacity: 0,
                            scale: 0,
                          }}
                          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                        />
                      ))}
                      <div className="flex items-center justify-center gap-2 relative z-[1]">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                        >
                          <Sparkles size={14} style={{ color: `hsl(${colors.bg})` }} />
                        </motion.div>
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.25 }}
                          className="text-xs font-bold"
                          style={{ color: `hsl(${colors.bg})` }}
                        >
                          {futureSkills.length} skills collected!
                        </motion.span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input */}
              <div className="px-4 pb-3 pt-2 flex-shrink-0">
                <form
                  onSubmit={e => { e.preventDefault(); sendMessage(inputValue); }}
                  className="flex gap-2"
                >
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder={`Ask the ${role.title} anything...`}
                    disabled={isStreaming}
                    className="flex-1 text-sm border-none"
                    style={{
                      background: `hsl(${hue} 18% 10%)`,
                      color: `hsl(${hue} 15% 85%)`,
                    }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isStreaming || !inputValue.trim()}
                    className="flex-shrink-0"
                    style={{
                      background: `hsl(${colors.bg})`,
                      color: "white",
                    }}
                  >
                    <Send size={14} />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
