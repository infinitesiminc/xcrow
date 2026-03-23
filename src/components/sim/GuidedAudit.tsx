/**
 * GuidedAudit — Level 2 "Sentinel's Sanctum" Red Team simulation format.
 * Sequential 5-step checkpoint audit with verdicts, hints, real-world examples, and deep-dive chat.
 * Elevated RPG UI: violet/indigo theme, rune stone progress, AI-generated scene illustrations.
 */
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, CheckCircle2, HelpCircle, Loader2, Send,
  ChevronRight, RotateCcw, Sparkles, Eye, EyeOff, Trophy, Swords,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

/* ── Types ── */
export type AuditVerdict = "safe" | "risky" | "critical" | null;

export interface AuditCheckpoint {
  id: string;
  area: string;
  question: string;
  hint: string;
  aiClaim: string;
  correctVerdict: AuditVerdict;
  explanation: string;
  realWorldExample: string;
  coachTip: string;
}

export interface AuditResult {
  totalCorrect: number;
  totalCheckpoints: number;
  hintsUsed: number;
  verdicts: Record<string, AuditVerdict>;
  rubricScores: Record<string, { score: number; note: string }>;
}

interface GuidedAuditProps {
  checkpoints: AuditCheckpoint[];
  aiOutputSummary: string;
  aiAutoAction: string;
  scenarioContext?: string;
  onComplete?: (result: AuditResult) => void;
  onRestart?: () => void;
  onViewDebrief?: () => void;
}

/* ── Rubric Dimensions ── */
const RUBRIC_DIMENSIONS = [
  { key: "risk_awareness", label: "Risk Awareness", icon: "🛡️" },
  { key: "strategic_depth", label: "Strategic Depth", icon: "🏰" },
  { key: "human_value", label: "Human Value-Add", icon: "⚔️" },
  { key: "actionability", label: "Actionability", icon: "🗡️" },
];

const VERDICT_CONFIG = {
  safe: {
    emoji: "🟢",
    label: "Safe",
    icon: "🛡️",
    bg: "hsl(142 60% 50% / 0.1)",
    border: "hsl(142 60% 50% / 0.35)",
    text: "hsl(142 60% 50%)",
    glow: "0 0 12px hsl(142 60% 50% / 0.15)",
  },
  risky: {
    emoji: "🟡",
    label: "Risky",
    icon: "👁️",
    bg: "hsl(45 80% 55% / 0.1)",
    border: "hsl(45 80% 55% / 0.35)",
    text: "hsl(45 80% 55%)",
    glow: "0 0 12px hsl(45 80% 55% / 0.15)",
  },
  critical: {
    emoji: "🔴",
    label: "Critical",
    icon: "💀",
    bg: "hsl(0 60% 55% / 0.1)",
    border: "hsl(0 60% 55% / 0.35)",
    text: "hsl(0 60% 55%)",
    glow: "0 0 12px hsl(0 60% 55% / 0.15)",
  },
} as const;

/* ── AI Image Hook ── */
function useSimImage(prompt: string, cacheKey: string, enabled: boolean) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !prompt) return;
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("generate-sim-image", {
          body: { prompt, cacheKey },
        });
        if (!cancelled && !error && data?.url) {
          setUrl(data.url);
        }
      } catch {
        // Graceful degradation — no image
      }
    })();

    return () => { cancelled = true; };
  }, [prompt, cacheKey, enabled]);

  return url;
}

/* ── Checkpoint Deep-Dive Chat ── */
function CheckpointChat({ checkpoint }: { checkpoint: AuditCheckpoint }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg = { role: "user" as const, content: text };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setInput("");
    setIsStreaming(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/checkpoint-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMsgs.map(m => ({ role: m.role, content: m.content })),
          checkpoint: {
            area: checkpoint.area,
            question: checkpoint.question,
            explanation: checkpoint.explanation,
            realWorldExample: checkpoint.realWorldExample,
            coachTip: checkpoint.coachTip,
            correctVerdict: checkpoint.correctVerdict,
          },
        }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, couldn't connect. Try again." }]);
    }

    setIsStreaming(false);
  }, [input, isStreaming, messages, checkpoint]);

  if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(262 30% 12%)",
        border: "1px solid hsl(262 60% 40% / 0.2)",
        boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))",
      }}
    >
      <div className="px-3 py-2 flex items-center gap-1.5" style={{ borderBottom: "1px solid hsl(262 60% 40% / 0.15)" }}>
        <HelpCircle className="h-3 w-3" style={{ color: "hsl(262 80% 70%)" }} />
        <span className="text-[10px] font-semibold" style={{ color: "hsl(262 80% 70%)", fontFamily: "'Cinzel', serif" }}>
          📚 Sanctum Library
        </span>
      </div>
      <div ref={scrollRef} className="max-h-[200px] overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && (
          <div className="text-center py-3">
            <p className="text-[10px] text-muted-foreground italic">
              "How would I detect this in my own data?" or "What guardrail prevents this?"
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`text-[11px] leading-relaxed ${msg.role === "user" ? "text-right" : ""}`}>
            <div
              className={`inline-block max-w-[90%] rounded-lg px-3 py-2 text-left`}
              style={
                msg.role === "user"
                  ? { background: "hsl(262 60% 50% / 0.15)", border: "1px solid hsl(262 60% 50% / 0.25)" }
                  : { background: "hsl(262 30% 18%)", border: "1px solid hsl(262 60% 40% / 0.15)", borderLeft: "2px solid hsl(262 80% 60% / 0.3)" }
              }
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-xs dark:prose-invert max-w-none [&_p]:mb-1 [&_p]:mt-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : msg.content}
            </div>
          </div>
        ))}
        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Consulting archives…
          </div>
        )}
      </div>
      <div className="px-2 py-2 flex gap-1.5" style={{ borderTop: "1px solid hsl(262 60% 40% / 0.15)" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Consult the archives…"
          className="flex-1 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-primary/30"
          style={{ background: "hsl(262 30% 15%)", border: "1px solid hsl(262 60% 40% / 0.15)" }}
        />
        <Button size="icon" onClick={sendMessage} disabled={isStreaming || !input.trim()} className="h-7 w-7 rounded-lg shrink-0">
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
}

/* ── Rune Stone Progress ── */
function RuneProgress({ total, current, verdicts, correctVerdicts, revealed }: {
  total: number;
  current: number;
  verdicts: Record<string, AuditVerdict>;
  correctVerdicts: Record<string, AuditVerdict>;
  revealed: Record<string, boolean>;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const cpId = Object.keys(correctVerdicts)[i];
        const isRevealed = revealed[cpId];
        const isCorrect = verdicts[cpId] === correctVerdicts[cpId];
        const isCurrent = i === current;

        let bg = "hsl(262 30% 20%)";
        let border = "hsl(262 40% 30%)";
        let shadow = "none";
        let className = "transition-all duration-500";

        if (isRevealed) {
          bg = isCorrect ? "hsl(142 60% 50%)" : "hsl(0 60% 55%)";
          border = isCorrect ? "hsl(142 60% 60%)" : "hsl(0 60% 60%)";
          shadow = isCorrect ? "0 0 8px hsl(142 60% 50% / 0.5)" : "0 0 8px hsl(0 60% 55% / 0.4)";
        } else if (isCurrent) {
          bg = "hsl(262 80% 55%)";
          border = "hsl(262 80% 65%)";
          className += " animate-rune-pulse";
        }

        return (
          <div key={i} className="flex items-center gap-1">
            <motion.div
              animate={{ scale: isCurrent ? 1.15 : 1 }}
              className={`w-3 h-3 rotate-45 shrink-0 ${className}`}
              style={{ background: bg, border: `1.5px solid ${border}`, boxShadow: shadow }}
            />
            {i < total - 1 && (
              <div className="w-2 h-px" style={{ background: "hsl(262 40% 30%)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Rubric Results ── */
function RubricResults({ scores }: { scores: Record<string, { score: number; note: string }> }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs">📜</span>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: "'Cinzel', serif", color: "hsl(262 80% 70%)" }}>
          Sentinel's Rubric
        </span>
      </div>
      {RUBRIC_DIMENSIONS.map(dim => {
        const s = scores[dim.key] || { score: 0, note: "" };
        const pct = Math.min(100, s.score);
        const color = pct >= 70 ? "hsl(142 60% 50%)" : pct >= 40 ? "hsl(45 80% 55%)" : "hsl(0 60% 55%)";
        return (
          <motion.div
            key={dim.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: RUBRIC_DIMENSIONS.indexOf(dim) * 0.1 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <span className="text-xs">{dim.icon}</span> {dim.label}
              </span>
              <span className="text-[11px] font-mono font-bold" style={{ color }}>{pct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ background: "hsl(262 30% 18%)", border: "1px solid hsl(262 60% 40% / 0.15)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${color}, ${color}dd)`, boxShadow: `0 0 8px ${color}40` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground italic leading-relaxed">{s.note}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ── Sparkle Particles ── */
function SparkleParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute text-xs"
          initial={{ opacity: 0, y: 0, x: `${30 + i * 25}%` }}
          animate={{ opacity: [0, 0.8, 0], y: -20, scale: [1, 0.3] }}
          transition={{ delay: i * 0.15, duration: 1.2, ease: "easeOut" }}
          style={{ left: `${30 + i * 20}%`, bottom: "30%" }}
        >
          ✨
        </motion.div>
      ))}
    </div>
  );
}

/* ── Main Component ── */
export default function GuidedAudit({
  checkpoints,
  aiOutputSummary,
  aiAutoAction,
  onComplete,
  onRestart,
}: GuidedAuditProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [verdicts, setVerdicts] = useState<Record<string, AuditVerdict>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [showChat, setShowChat] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState(false);

  const checkpoint = checkpoints[currentStep];
  const totalCorrect = checkpoints.filter(cp => verdicts[cp.id] === cp.correctVerdict).length;
  const hintsUsed = Object.values(showHint).filter(Boolean).length;

  const correctVerdictMap = useMemo(() => {
    const map: Record<string, AuditVerdict> = {};
    checkpoints.forEach(cp => { map[cp.id] = cp.correctVerdict; });
    return map;
  }, [checkpoints]);

  // AI-generated scene image for current checkpoint
  const scenePrompt = checkpoint
    ? `Dark fantasy oracle vision, ethereal indigo and violet glow, showing ${checkpoint.area.replace(/[^\w\s]/g, "")} concept — minimalist, no text, arcane observatory style, mystical runes, 256x256`
    : "";
  const sceneCacheKey = checkpoint ? `checkpoint-${checkpoint.id.slice(0, 8)}` : "";
  const sceneImageUrl = useSimImage(scenePrompt, sceneCacheKey, !!checkpoint && !completed);

  // AI-generated completion portrait
  const ratio = completed ? totalCorrect / checkpoints.length : 0;
  const completionTier = ratio >= 0.8 ? "high" : ratio >= 0.5 ? "mid" : "low";
  const portraitPrompts: Record<string, string> = {
    high: "Radiant oracle sentinel with golden halo, violet ethereal armor, glowing runes, dark fantasy portrait, indigo background, arcane power, 256x256",
    mid: "Watchful sentinel warrior in violet crystalline armor, vigilant stance, dark fantasy portrait, indigo mist, 256x256",
    low: "Hooded apprentice seer with glowing violet rune staff, humble pose, dark fantasy portrait, misty indigo background, 256x256",
  };
  const completionImageUrl = useSimImage(
    completed ? portraitPrompts[completionTier] : "",
    `completion-${completionTier}`,
    completed,
  );

  const computeRubricScores = useCallback((): Record<string, { score: number; note: string }> => {
    const r = totalCorrect / checkpoints.length;
    const hintPenalty = hintsUsed * 5;
    return {
      risk_awareness: {
        score: Math.max(0, Math.round(r * 100) - hintPenalty),
        note: totalCorrect >= checkpoints.length - 1
          ? "Excellent threat detection — you caught the key failure modes."
          : "Review the checkpoints you missed. Each represents a common AI oversight pattern.",
      },
      strategic_depth: {
        score: totalCorrect >= Math.ceil(checkpoints.length * 0.6) ? 75 : 50,
        note: "Push beyond surface-level: how do these issues compound into systemic risks?",
      },
      human_value: {
        score: 80,
        note: "Every checkpoint represents a judgment call that AI cannot make autonomously.",
      },
      actionability: {
        score: Math.max(0, 65 - hintPenalty),
        note: "For each flaw found, what guardrail would you add to prevent it?",
      },
    };
  }, [totalCorrect, checkpoints.length, hintsUsed]);

  const handleVerdict = (id: string, verdict: AuditVerdict) => {
    setVerdicts(prev => ({ ...prev, [id]: verdict }));
  };

  const handleReveal = (id: string) => {
    setRevealed(prev => ({ ...prev, [id]: true }));
  };

  const handleNext = () => {
    if (currentStep < checkpoints.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setCompleted(true);
      onComplete?.({
        totalCorrect,
        totalCheckpoints: checkpoints.length,
        hintsUsed,
        verdicts,
        rubricScores: computeRubricScores(),
      });
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setVerdicts({});
    setRevealed({});
    setShowHint({});
    setShowChat({});
    setCompleted(false);
    onRestart?.();
  };

  /* ── Completion Screen — Ascension Ceremony ── */
  if (completed) {
    const tier = completionTier;
    const titles = { high: "🔮 Grand Sentinel", mid: "⚔️ Vigilant Watcher", low: "🌱 Apprentice Seer" };
    const subtitles = {
      high: "You identified the critical failure modes. Your oversight is battle-tested.",
      mid: "You caught some flaws but others slipped past. Study the misses — they're the most common in production.",
      low: "Every expert started here. Review the explanations and retry — pattern recognition builds fast.",
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5 py-4 max-w-lg mx-auto"
      >
        {/* Ascension Portrait + Score ring */}
        <div className="text-center relative">
          {/* Radial burst behind score */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0.15 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 mx-auto w-32 h-32 rounded-full"
            style={{ background: "radial-gradient(circle, hsl(262 80% 55%), transparent 70%)", top: "-16px" }}
          />

          {/* Portrait image (if loaded) */}
          {completionImageUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mx-auto mb-3 w-20 h-20 rounded-full overflow-hidden"
              style={{ border: "2px solid hsl(262 80% 55% / 0.5)", boxShadow: "0 0 20px hsl(262 80% 55% / 0.3)" }}
            >
              <img src={completionImageUrl} alt="Sentinel portrait" className="w-full h-full object-cover" />
            </motion.div>
          )}

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="relative inline-block"
          >
            <svg width="100" height="100" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="sentinel-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(262 80% 55%)" />
                  <stop offset="100%" stopColor="hsl(45 85% 55%)" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(262 30% 18%)" strokeWidth="4" />
              <motion.circle
                cx="50" cy="50" r="44" fill="none"
                stroke="url(#sentinel-ring)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${(totalCorrect / checkpoints.length) * 276} 276`}
                transform="rotate(-90 50 50)"
                initial={{ strokeDasharray: "0 276" }}
                animate={{ strokeDasharray: `${(totalCorrect / checkpoints.length) * 276} 276` }}
                transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-xl font-bold text-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {totalCorrect}/{checkpoints.length}
              </motion.span>
              <span className="text-[9px] text-muted-foreground">detected</span>
            </div>
          </motion.div>

          <h3 className="text-base font-bold mt-3" style={{ fontFamily: "'Cinzel', serif", color: "hsl(262 80% 70%)" }}>
            {titles[tier]}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">{subtitles[tier]}</p>
        </div>

        {/* Per-checkpoint results */}
        <div
          className="rounded-xl p-4 space-y-2"
          style={{
            background: "linear-gradient(135deg, hsl(262 30% 12%), hsl(var(--surface-stone)))",
            border: "1px solid hsl(262 60% 40% / 0.2)",
            boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))",
          }}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: "'Cinzel', serif", color: "hsl(262 80% 70%)" }}>
            Checkpoint Review
          </span>
          {checkpoints.map(cp => {
            const isCorrect = verdicts[cp.id] === cp.correctVerdict;
            return (
              <motion.div
                key={cp.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2.5 text-[11px] p-2.5 rounded-lg"
                style={{
                  background: isCorrect ? "hsl(142 60% 50% / 0.05)" : "hsl(0 60% 55% / 0.05)",
                  border: `1px solid ${isCorrect ? "hsl(142 60% 50% / 0.15)" : "hsl(0 60% 55% / 0.15)"}`,
                }}
              >
                {/* Diamond rune icon */}
                <div
                  className="w-2.5 h-2.5 rotate-45 shrink-0 mt-1"
                  style={{
                    background: isCorrect ? "hsl(142 60% 50%)" : "hsl(0 60% 55%)",
                    boxShadow: isCorrect ? "0 0 6px hsl(142 60% 50% / 0.4)" : "0 0 6px hsl(0 60% 55% / 0.3)",
                  }}
                />
                <div className="min-w-0">
                  <span className="font-semibold text-foreground">{cp.area}</span>
                  <span className="text-muted-foreground">
                    {" "}— You: <strong className="capitalize">{verdicts[cp.id]}</strong>
                    {!isCorrect && <>, Answer: <strong className="capitalize">{cp.correctVerdict}</strong></>}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Rubric */}
        <div
          className="rounded-xl p-4"
          style={{
            background: "linear-gradient(135deg, hsl(262 30% 12%), hsl(var(--surface-stone)))",
            border: "1px solid hsl(262 60% 40% / 0.2)",
            boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 2px 8px hsl(var(--emboss-shadow))",
          }}
        >
          <RubricResults scores={computeRubricScores()} />
        </div>

        {/* Actions */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestart}
            className="gap-1.5 text-xs rounded-xl"
            style={{ fontFamily: "'Cinzel', serif", borderColor: "hsl(262 60% 40% / 0.3)", color: "hsl(262 80% 70%)" }}
          >
            <RotateCcw className="h-3 w-3" /> 🔮 Begin New Vigil
          </Button>
        </div>
      </motion.div>
    );
  }

  /* ── Active Audit — Sentinel's Sanctum ── */
  return (
    <div className="space-y-4 max-w-lg mx-auto py-2">
      {/* Sanctum Header Banner */}
      <div
        className="rounded-xl p-3.5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(262 40% 15% / 0.6), hsl(270 30% 10% / 0.8))",
          border: "1px solid hsl(262 60% 40% / 0.25)",
          boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 0 20px hsl(262 80% 55% / 0.08)",
        }}
      >
        {/* Animated glow orb */}
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-15 blur-2xl" style={{ background: "hsl(262 80% 55%)" }} />
        {/* Floating particles */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            animate={{ y: [0, -8, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.7 }}
            style={{
              width: 3, height: 3,
              background: "hsl(262 80% 70%)",
              right: `${20 + i * 25}%`,
              top: `${30 + i * 15}%`,
            }}
          />
        ))}

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(262 60% 50% / 0.15)", border: "1px solid hsl(262 60% 50% / 0.25)" }}
            >
              <Eye className="h-4 w-4" style={{ color: "hsl(262 80% 70%)" }} />
            </div>
            <div>
              <span
                className="text-xs font-bold drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]"
                style={{ fontFamily: "'Cinzel', serif", color: "hsl(262 80% 75%)" }}
              >
                🔮 Sentinel's Sanctum
              </span>
              <p className="text-[10px] text-muted-foreground">
                Evaluate AI claims from the future battlefield
              </p>
            </div>
          </div>
          <RuneProgress
            total={checkpoints.length}
            current={currentStep}
            verdicts={verdicts}
            correctVerdicts={correctVerdictMap}
            revealed={revealed}
          />
        </div>
      </div>

      {/* Oracle's Claim — AI output context */}
      <div
        className="rounded-lg px-3.5 py-2.5 text-[10px] font-mono relative overflow-hidden"
        style={{
          background: "hsl(262 30% 12%)",
          border: "1px solid hsl(262 60% 40% / 0.2)",
          borderLeft: "3px solid hsl(262 80% 55% / 0.5)",
          boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))",
        }}
      >
        {/* Scanning line animation */}
        <motion.div
          className="absolute left-0 right-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, hsl(262 80% 70% / 0.3), transparent)" }}
          animate={{ y: ["-100%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "hsl(262 80% 70%)", fontFamily: "'Cinzel', serif" }}>
          🔮 Oracle's Claim:{" "}
        </span>
        <span className="text-foreground/80">{checkpoint.aiClaim}</span>
      </div>

      {/* Checkpoint card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={checkpoint.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl p-4 space-y-3 relative overflow-hidden sentinel-constellation"
          style={{
            background: "linear-gradient(135deg, hsl(262 30% 12%), hsl(var(--surface-stone)))",
            border: "1px solid hsl(262 60% 40% / 0.2)",
            boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 2px 8px hsl(var(--emboss-shadow))",
          }}
        >
          {/* Scene illustration background (AI-generated) */}
          {sceneImageUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.08 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 bg-cover bg-center pointer-events-none"
              style={{ backgroundImage: `url(${sceneImageUrl})`, filter: "blur(1px)" }}
            />
          )}

          <div className="relative">
            {/* Area header */}
            <div className="flex items-start gap-2.5">
              <motion.span
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="text-xl shrink-0"
              >
                {checkpoint.area.split(" ")[0]}
              </motion.span>
              <div>
                <h4 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
                  {checkpoint.area.split(" ").slice(1).join(" ")}
                </h4>
                <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">{checkpoint.question}</p>
              </div>
            </div>

            {/* Hint toggle */}
            {!showHint[checkpoint.id] && !revealed[checkpoint.id] && (
              <button
                onClick={() => setShowHint(prev => ({ ...prev, [checkpoint.id]: true }))}
                className="text-[10px] mt-2 flex items-center gap-1 transition-colors hover:brightness-125"
                style={{ color: "hsl(262 80% 70%)" }}
              >
                <Sparkles className="h-3 w-3" /> Need a hint?
              </button>
            )}
            {showHint[checkpoint.id] && !revealed[checkpoint.id] && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] px-3 py-2 rounded-lg mt-2 italic"
                style={{
                  background: "hsl(45 80% 55% / 0.08)",
                  border: "1px solid hsl(45 80% 55% / 0.15)",
                  color: "hsl(var(--foreground))",
                }}
              >
                💡 {checkpoint.hint}
              </motion.div>
            )}

            {/* Verdict buttons — Seal of Judgment */}
            {!revealed[checkpoint.id] && (
              <div className="flex gap-2 mt-3">
                {(["safe", "risky", "critical"] as const).map(v => {
                  const selected = verdicts[checkpoint.id] === v;
                  const cfg = VERDICT_CONFIG[v];
                  return (
                    <motion.button
                      key={v}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleVerdict(checkpoint.id, v)}
                      className="flex-1 py-2.5 px-3 rounded-lg text-[11px] font-semibold capitalize transition-all"
                      style={{
                        background: selected ? cfg.bg : "hsl(262 30% 15%)",
                        border: `1.5px solid ${selected ? cfg.border : "hsl(262 60% 40% / 0.15)"}`,
                        color: selected ? cfg.text : "hsl(var(--muted-foreground))",
                        boxShadow: selected ? cfg.glow : "none",
                      }}
                    >
                      {cfg.icon} {cfg.label}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Seal Your Judgment */}
            {verdicts[checkpoint.id] && !revealed[checkpoint.id] && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                <Button
                  size="sm"
                  onClick={() => handleReveal(checkpoint.id)}
                  className="w-full gap-1.5 text-xs rounded-xl h-9"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    background: "linear-gradient(135deg, hsl(262 80% 55%), hsl(262 60% 45%))",
                    boxShadow: "0 0 15px hsl(262 80% 55% / 0.3)",
                  }}
                >
                  <Eye className="h-3 w-3" /> ⚡ Seal Your Judgment
                </Button>
              </motion.div>
            )}

            {/* Revealed result */}
            {revealed[checkpoint.id] && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 mt-3 relative"
              >
                {/* Result banner */}
                <motion.div
                  initial={verdicts[checkpoint.id] === checkpoint.correctVerdict ? { scale: 0.95 } : { x: [-3, 3, -2, 2, 0] }}
                  animate={{ scale: 1, x: 0 }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 relative overflow-hidden"
                  style={{
                    background: verdicts[checkpoint.id] === checkpoint.correctVerdict
                      ? "hsl(142 60% 50% / 0.08)"
                      : "hsl(0 60% 55% / 0.08)",
                    border: `1px solid ${verdicts[checkpoint.id] === checkpoint.correctVerdict
                      ? "hsl(142 60% 50% / 0.25)"
                      : "hsl(0 60% 55% / 0.25)"}`,
                  }}
                >
                  {verdicts[checkpoint.id] === checkpoint.correctVerdict && <SparkleParticles />}
                  {verdicts[checkpoint.id] === checkpoint.correctVerdict ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "hsl(142 60% 50%)" }} />
                      <span className="text-[11px] font-bold" style={{ color: "hsl(142 60% 50%)", fontFamily: "'Cinzel', serif" }}>
                        ✦ Oracle Approves
                      </span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 shrink-0" style={{ color: "hsl(0 60% 55%)" }} />
                      <span className="text-[11px] font-bold" style={{ color: "hsl(0 60% 55%)", fontFamily: "'Cinzel', serif" }}>
                        The Oracle Corrects — <span className="capitalize">{checkpoint.correctVerdict}</span>
                      </span>
                    </>
                  )}
                </motion.div>

                {/* Explanation */}
                <div
                  className="rounded-lg p-3 text-[11px] space-y-2.5"
                  style={{ background: "hsl(262 30% 12%)", border: "1px solid hsl(262 60% 40% / 0.15)" }}
                >
                  <p className="text-foreground leading-relaxed">{checkpoint.explanation}</p>

                  {/* Chronicle Entry (real-world case) */}
                  <div
                    className="rounded-lg p-3"
                    style={{
                      background: "hsl(262 30% 16%)",
                      border: "1px solid hsl(262 60% 40% / 0.12)",
                      boxShadow: "0 0 8px hsl(38 65% 55% / 0.05)",
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "hsl(262 80% 70%)", fontFamily: "'Cinzel', serif" }}>
                        📜 Chronicle Entry
                      </span>
                    </div>
                    <p className="text-[10px] text-foreground/80 leading-relaxed">{checkpoint.realWorldExample}</p>
                  </div>

                  {/* Sentinel's Counsel */}
                  <div className="flex items-start gap-2 text-[10px]">
                    <span className="shrink-0">🧭</span>
                    <p className="font-medium italic" style={{ color: "hsl(262 80% 70%)" }}>
                      {checkpoint.coachTip}
                    </p>
                  </div>
                </div>

                {/* Deep dive chat toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowChat(prev => ({ ...prev, [checkpoint.id]: !prev[checkpoint.id] }))}
                    className="text-[10px] flex items-center gap-1 transition-colors hover:brightness-125"
                    style={{ color: "hsl(262 80% 70%)" }}
                  >
                    <HelpCircle className="h-3 w-3" />
                    {showChat[checkpoint.id] ? "Hide" : "Ask questions about this"}
                  </button>
                </div>

                <AnimatePresence>
                  {showChat[checkpoint.id] && <CheckpointChat checkpoint={checkpoint} />}
                </AnimatePresence>

                {/* Next button */}
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="w-full gap-1.5 text-xs rounded-xl h-9"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    background: "linear-gradient(135deg, hsl(262 80% 55%), hsl(262 60% 45%))",
                  }}
                >
                  {currentStep < checkpoints.length - 1 ? (
                    <>
                      <ChevronRight className="h-3 w-3" />
                      Next Checkpoint ({currentStep + 2}/{checkpoints.length})
                    </>
                  ) : (
                    <>
                      <Trophy className="h-3 w-3" />
                      Complete Audit
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
