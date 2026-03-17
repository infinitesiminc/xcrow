import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, RotateCcw, ChevronDown, ChevronUp, CheckCircle2, X, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  compileSession,
  chatTurn,
  scoreSession,
  type SimMessage,
  type SimSession,
  type SimScoreResult,
  type SimMode,
} from "@/lib/simulator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Phase = "loading" | "briefing" | "chat" | "completing" | "done";

const MAX_ROUNDS = 8;

interface SimulatorModalProps {
  open: boolean;
  onClose: () => void;
  taskName: string;
  jobTitle: string;
  company?: string;
  taskState?: string;
  taskTrend?: string;
  taskImpactLevel?: string;
  mode?: SimMode;
  onCompleted?: () => void;
}

/* ── Briefing Screen ── */
const BriefingScreen = ({
  session,
  onStart,
}: {
  session: SimSession;
  onStart: () => void;
}) => (
  <motion.div
    key="briefing"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="flex flex-col gap-8 py-6 px-2 max-w-2xl mx-auto"
  >
    <div className="text-center space-y-3">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="text-5xl"
      >
        🤖
      </motion.div>
      <h3 className="text-xl font-serif font-bold text-foreground">{session.scenario.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">{session.scenario.description}</p>
      <span className="inline-block text-[11px] px-2.5 py-1 rounded-full font-medium bg-primary/10 text-primary">
        💬 8 Scenarios · Coaching format
      </span>
    </div>

    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="rounded-2xl bg-accent/30 border border-border/40 p-6"
    >
      <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">What you need to know</h4>
      <div className="text-[15px] text-foreground/90 leading-[1.7] prose prose-sm dark:prose-invert max-w-none [&>p]:mb-3">
        <ReactMarkdown>{session.briefing}</ReactMarkdown>
      </div>
    </motion.div>

    {session.tips && session.tips.length > 0 && (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="rounded-2xl border border-border/30 p-6"
      >
        <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Tips</h4>
        <ul className="space-y-3">
          {session.tips.map((tip: any, i: number) => {
            const tipText = typeof tip === "string" ? tip : (tip.content || tip.title || JSON.stringify(tip));
            return (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.07 }}
                className="text-[15px] text-foreground/80 leading-relaxed flex items-start gap-3"
              >
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent text-xs font-medium text-muted-foreground shrink-0 mt-0.5">{i + 1}</span>
                {tipText}
              </motion.li>
            );
          })}
        </ul>
      </motion.div>
    )}
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.3 }}
      className="flex justify-center pt-2"
    >
      <Button onClick={onStart} size="lg" className="gap-2 rounded-xl px-8 text-base">
        Practise Task
      </Button>
    </motion.div>
  </motion.div>
);

/* ── Score Display ── */
const ScoreDisplay = ({ scoreResult }: { scoreResult: SimScoreResult }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="w-full space-y-4 mt-4"
  >
    <div className="grid grid-cols-2 gap-3">
      {scoreResult.categories.map((cat, i) => (
        <motion.div
          key={cat.name}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.08 }}
          className="rounded-xl border border-border/30 p-3 text-center"
        >
          <div className={`text-xl font-bold ${
            cat.score >= 70 ? "text-success" : cat.score >= 40 ? "text-warning" : "text-destructive"
          }`}>
            {cat.score}%
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{cat.name}</div>
          <div className="text-[11px] text-muted-foreground/70 mt-1 leading-snug">{cat.feedback}</div>
        </motion.div>
      ))}
    </div>
    <p className="text-sm text-muted-foreground leading-relaxed text-center">{scoreResult.summary}</p>
  </motion.div>
);

/* ── Collapsible Insight Card ── */
const InsightCard = ({ content }: { content: string }) => {
  const [expanded, setExpanded] = useState(true);
  
  const hasInsight = content.includes("🤖") || content.includes("💡");
  if (!hasInsight) return null;

  const aiMatch = content.match(/🤖\s*\*?\*?AI Today:?\*?\*?\s*(.+?)(?=💡|🔄|$)/s);
  const humanMatch = content.match(/💡\s*\*?\*?Human Edge:?\*?\*?\s*(.+?)(?=🔄|$)/s);
  
  if (!aiMatch && !humanMatch) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[85%]"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors mb-1"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        AI Insights
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-accent/20 border border-border/30 px-3 py-2.5 space-y-1.5 text-xs">
              {aiMatch && (
                <div className="flex items-start gap-2">
                  <span className="shrink-0">🤖</span>
                  <span className="text-foreground/70">{aiMatch[1].trim()}</span>
                </div>
              )}
              {humanMatch && (
                <div className="flex items-start gap-2">
                  <span className="shrink-0">💡</span>
                  <span className="text-foreground/70">{humanMatch[1].trim()}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ── Main Modal ── */
const SimulatorModal = ({ open, onClose, taskName, jobTitle, company, taskState, taskTrend, taskImpactLevel, mode = "assess", onCompleted }: SimulatorModalProps) => {
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<SimSession | null>(null);
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [roundCount, setRoundCount] = useState(1);
  const [turnCount, setTurnCount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [scoreResult, setScoreResult] = useState<SimScoreResult | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const taskMeta = { currentState: taskState, trend: taskTrend, impactLevel: taskImpactLevel };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 80);
  }, []);

  const startCompile = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setMessages([]);
    setRoundCount(1);
    setTurnCount(1);
    setScoreResult(null);
    try {
      const compiled = await compileSession(taskName, jobTitle, company, 3, mode, taskMeta);
      setSession(compiled);
      setPhase("briefing");
    } catch (err) {
      console.error("Failed to start simulation:", err);
      setError("Couldn't start the simulation. Please try again.");
      setPhase("chat");
    }
  }, [taskName, jobTitle, company, mode, taskState, taskTrend, taskImpactLevel]);

  useEffect(() => {
    if (open) startCompile();
  }, [open]);

  const beginChat = () => {
    if (!session) return;
    setMessages([{ role: "assistant", content: session.openingMessage }]);
    setPhase("chat");
  };

  const handleSend = async (overrideInput?: string) => {
    const messageText = overrideInput ?? input.trim();
    if (!messageText || sending) return;
    const userMsg: SimMessage = { role: "user", content: messageText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setSending(true);
    // Tentatively advance turn — may revert if scaffolding
    const nextTurn = turnCount + 1;
    setTurnCount(nextTurn);
    scrollToBottom();

    try {
      const reply = await chatTurn(newMessages, roundCount, nextTurn, jobTitle, mode, taskMeta);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      // If the AI responded with scaffolding, revert the turn counter
      // so the next exchange stays at the same micro-turn position
      if (reply.includes("[SCAFFOLDING]")) {
        setTurnCount(turnCount); // revert to previous value
      } else {
        // Check if user said yes to continue — increment round
        const lowerInput = messageText.toLowerCase();
        if (lowerInput === "yes" || lowerInput === "y" || lowerInput === "yeah" || lowerInput === "sure") {
          setRoundCount((c) => c + 1);
        }
      }
      scrollToBottom();
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    }
    setSending(false);
  };

  const handleFinish = async () => {
    setPhase("completing");
    
    let scores: SimScoreResult | null = null;
    if (messages.length > 2) {
      try {
        scores = await scoreSession(messages, session?.scenario || null, mode);
        setScoreResult(scores);
      } catch (err) {
        console.error("Failed to get scores:", err);
      }
    }
    
    if (user) {
      try {
        await supabase.from("completed_simulations").insert({
          user_id: user.id,
          task_name: taskName,
          job_title: jobTitle,
          company: company || null,
          rounds_completed: roundCount,
          correct_answers: scores ? Math.round((scores.overall / 100) * roundCount) : 0,
          total_questions: roundCount,
          experience_level: mode,
          tool_awareness_score: scores?.categories.find(c => c.name === "AI Tool Awareness")?.score ?? null,
          human_value_add_score: scores?.categories.find(c => c.name === "Human Value-Add")?.score ?? null,
          adaptive_thinking_score: scores?.categories.find(c => c.name === "Adaptive Thinking")?.score ?? null,
          domain_judgment_score: scores?.categories.find(c => c.name === "Domain Judgment")?.score ?? null,
        } as any);
        onCompleted?.();
      } catch (err) {
        console.error("Failed to save completion:", err);
      }
    }
    setPhase("done");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Strip insight markers from message text (shown in InsightCard instead)
  const cleanMessageForDisplay = (content: string): string => {
    return content
      .replace(/🤖\s*\*?\*?AI Today:?\*?\*?\s*.+/g, "")
      .replace(/💡\s*\*?\*?Human Edge:?\*?\*?\s*.+/g, "")
      .replace(/\[SCAFFOLDING\]/g, "")
      .trim();
  };

  const progressPercent = Math.min((roundCount / MAX_ROUNDS) * 100, 100);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl w-[95vw] h-[90vh] sm:h-[90vh] h-[100dvh] sm:rounded-2xl rounded-none p-0 flex flex-col overflow-hidden gap-0 border-border/50 [&>button]:hidden">
        {/* Header */}
        <div className="shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border/40">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-sans font-semibold text-foreground truncate">{taskName}</h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">{jobTitle}{company ? ` · ${company}` : ""}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {phase === "chat" && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs px-3 py-1 rounded-full text-primary bg-primary/10"
                >
                  💬 {roundCount}/{MAX_ROUNDS}
                </motion.span>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors duration-200"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          {phase === "chat" && (
            <div className="px-4 sm:px-6 py-1.5 bg-accent/10">
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          )}
        </div>

        {/* Body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 scrollbar-thin">
          <AnimatePresence mode="popLayout">
            {phase === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full gap-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-8 w-8 text-muted-foreground/40" />
                </motion.div>
                <p className="text-sm text-muted-foreground">Preparing your session…</p>
              </motion.div>
            )}

            {phase === "briefing" && session && (
              <BriefingScreen session={session} onStart={beginChat} />
            )}

            {error && phase !== "loading" && phase !== "briefing" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 gap-4 max-w-sm mx-auto text-center"
              >
                <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>
                <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">Close</Button>
              </motion.div>
            )}

            {(phase === "chat" || phase === "done") && !error && (
              <div className="max-w-2xl mx-auto space-y-4">
                {messages.map((msg, i) => {
                  const isUser = msg.role === "user";
                  const displayContent = isUser ? msg.content : cleanMessageForDisplay(msg.content);

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-2"
                    >
                      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 sm:px-5 py-3 text-sm sm:text-[15px] leading-[1.65] ${
                            isUser
                              ? "bg-foreground text-background rounded-br-lg"
                              : "bg-accent/40 text-foreground rounded-bl-lg"
                          }`}
                        >
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>p]:mb-1 [&>ul]:mt-1.5 [&>ul]:mb-0">
                            <ReactMarkdown>{displayContent}</ReactMarkdown>
                          </div>
                        </div>
                      </div>

                      {/* Collapsible insight card */}
                      {!isUser && <InsightCard content={msg.content} />}
                    </motion.div>
                  );
                })}

                {/* Continue / Finish buttons */}
                {phase === "chat" && !sending && (() => {
                  const lastAi = [...messages].reverse().find(m => m.role === "assistant");
                  if (!lastAi) return null;
                  const lower = lastAi.content.toLowerCase();
                  const askContinue = lower.includes("ready for the next") || lower.includes("(yes/no)") || lower.includes("click finish");
                  if (!askContinue) return null;
                  
                  const isLastRound = roundCount >= MAX_ROUNDS;
                  const isSessionEnd = lower.includes("click finish");
                  
                  return (
                    <div className="flex flex-col sm:flex-row gap-2 mt-3">
                      {!isLastRound && !isSessionEnd && (
                        <Button
                          variant="outline"
                          className="flex-1 rounded-xl h-10 text-sm gap-2"
                          onClick={() => {
                            const fakeMsg: SimMessage = { role: "user", content: "yes" };
                            const newMsgs = [...messages, fakeMsg];
                            setMessages(newMsgs);
                            setSending(true);
                            const nextRound = roundCount + 1;
                            setRoundCount(nextRound);
                            const nextTurn = turnCount + 1;
                            setTurnCount(nextTurn);
                            scrollToBottom();
                            chatTurn(newMsgs, nextRound, nextTurn, jobTitle, mode, taskMeta).then(reply => {
                              setMessages(prev => [...prev, { role: "assistant", content: reply }]);
                              scrollToBottom();
                            }).catch(() => {
                              setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
                            }).finally(() => setSending(false));
                          }}
                        >
                          <ArrowRight className="h-4 w-4" /> Next Scenario
                        </Button>
                      )}
                      <Button
                        className="flex-1 rounded-xl h-10 text-sm gap-2"
                        onClick={handleFinish}
                      >
                        <CheckCircle2 className="h-4 w-4" /> {isLastRound || isSessionEnd ? "See Results" : "Finish Early"}
                      </Button>
                    </div>
                  );
                })()}
              </div>
            )}

            {sending && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start max-w-2xl mx-auto"
              >
                <div className="bg-accent/40 rounded-2xl rounded-bl-lg px-5 py-3.5">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </motion.div>
            )}

            {phase === "completing" && (
              <motion.div
                key="completing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 gap-4"
              >
                <Loader2 className="h-6 w-6 text-muted-foreground/40 animate-spin" />
                <p className="text-sm text-muted-foreground">Evaluating your AI readiness…</p>
              </motion.div>
            )}

            {phase === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center py-10 gap-6 max-w-sm mx-auto text-center"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10"
                >
                  <CheckCircle2 className="h-10 w-10 text-success" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-foreground">Session Complete</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {roundCount} round{roundCount !== 1 ? "s" : ""} on "{taskName}"
                  </p>
                  
                  {scoreResult && (
                    <div className="mt-4">
                      <div className="flex items-center justify-center mb-3">
                        <div className="text-center">
                          <div className={`text-3xl font-bold ${
                            scoreResult.overall >= 70 ? "text-success" : scoreResult.overall >= 40 ? "text-warning" : "text-destructive"
                          }`}>
                            {scoreResult.overall}%
                          </div>
                          <div className="text-[11px] text-muted-foreground">AI Readiness Score</div>
                        </div>
                      </div>
                      <ScoreDisplay scoreResult={scoreResult} />
                    </div>
                  )}
                  
                  {!user && (
                    <p className="text-xs text-muted-foreground mt-3">
                      <a href="/auth" className="text-primary hover:underline">Sign in</a> to save your progress
                    </p>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={startCompile} className="gap-2 rounded-xl">
                    <RotateCcw className="h-3.5 w-3.5" /> Try Again
                  </Button>
                  <Button onClick={onClose} className="rounded-xl px-6">Done</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input bar */}
        {phase === "chat" && !error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="shrink-0 border-t border-border/40 bg-background px-4 sm:px-6 py-3 space-y-3 pb-[env(safe-area-inset-bottom,12px)]"
          >
            <div className="flex items-end gap-3 max-w-2xl mx-auto">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your approach…"
                rows={2}
                className="flex-1 resize-none rounded-xl border border-border/40 bg-accent/10 px-3 sm:px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring/30 focus:border-border min-h-[40px] max-h-[100px] transition-all duration-200"
              />
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFinish}
                  className="text-xs text-muted-foreground hover:text-foreground h-[40px] px-3 rounded-xl"
                >
                  Finish
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || sending}
                  className="h-[40px] w-[40px] p-0 rounded-xl"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SimulatorModal;
