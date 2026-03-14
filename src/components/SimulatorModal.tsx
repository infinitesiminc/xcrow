import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, RotateCcw, Lightbulb, ChevronDown, ChevronUp, CheckCircle2, X, Bot, User, Compass, Briefcase, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  compileSession,
  chatTurn,
  type SimMessage,
  type SimSession,
} from "@/lib/simulator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Phase = "loading" | "experience-select" | "briefing" | "chat" | "completing" | "done";
type ExperienceLevel = "exploring" | "practicing";

interface SimulatorModalProps {
  open: boolean;
  onClose: () => void;
  taskName: string;
  jobTitle: string;
  company?: string;
  taskState?: string;
  taskTrend?: string;
  taskImpactLevel?: string;
  onCompleted?: () => void;
}
const MAX_ROUNDS = 10;

const stateLabel = (s?: string) => {
  if (s === "mostly_human") return "Mostly Human";
  if (s === "human_ai") return "Human + AI";
  if (s === "mostly_ai") return "Mostly AI";
  return null;
};
const trendLabel = (t?: string) => {
  if (t === "stable") return "Stable";
  if (t === "increasing_ai") return "Growing AI";
  if (t === "fully_ai_soon") return "Full AI Soon";
  return null;
};

/* ── Experience Level Selector ── */
const ExperienceSelector = ({
  taskName,
  taskState,
  taskTrend,
  onSelect,
}: {
  taskName: string;
  taskState?: string;
  taskTrend?: string;
  onSelect: (level: ExperienceLevel) => void;
}) => (
  <motion.div
    key="experience"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="flex flex-col gap-8 py-10 px-2 max-w-md mx-auto text-center"
  >
    <div className="space-y-3">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-4xl"
      >
        🎯
      </motion.div>
      <h3 className="text-xl font-serif font-bold text-foreground">{taskName}</h3>
      {(stateLabel(taskState) || trendLabel(taskTrend)) && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          {stateLabel(taskState) && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-dot-blue" />
              {stateLabel(taskState)}
            </span>
          )}
          {stateLabel(taskState) && trendLabel(taskTrend) && <span>→</span>}
          {trendLabel(taskTrend) && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-dot-purple" />
              {trendLabel(taskTrend)}
            </span>
          )}
        </div>
      )}
      <p className="text-sm text-muted-foreground leading-relaxed">
        How familiar are you with this task?
      </p>
    </div>

    <div className="grid grid-cols-1 gap-3">
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => onSelect("exploring")}
        className="flex items-start gap-4 p-5 rounded-2xl border border-border/40 bg-background hover:bg-accent/30 hover:border-border transition-all duration-200 text-left"
      >
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent shrink-0 mt-0.5">
          <Compass className="h-5 w-5 text-muted-foreground" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">I'm exploring</p>
          <p className="text-xs text-muted-foreground mt-0.5">New to this field — teach me the basics and how AI fits in</p>
        </div>
      </motion.button>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={() => onSelect("practicing")}
        className="flex items-start gap-4 p-5 rounded-2xl border border-border/40 bg-background hover:bg-accent/30 hover:border-border transition-all duration-200 text-left"
      >
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent shrink-0 mt-0.5">
          <Briefcase className="h-5 w-5 text-muted-foreground" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">I do this job</p>
          <p className="text-xs text-muted-foreground mt-0.5">I know the role — show me how AI is changing it</p>
        </div>
      </motion.button>
    </div>
  </motion.div>
);

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
        <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Tips for success</h4>
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
        Begin Practice
      </Button>
    </motion.div>
  </motion.div>
);

/* ── Tips Toggle ── */
const TipsToggle = ({ tips }: { tips: string[] }) => {
  const [open, setOpen] = useState(false);
  if (!tips || tips.length === 0) return null;

  return (
    <div className="mb-4 max-w-2xl mx-auto">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
      >
        <Lightbulb className="h-3.5 w-3.5" />
        {open ? "Hide tips" : "Show tips"}
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-4 rounded-xl bg-accent/20 border border-border/30">
              <ul className="space-y-2">
                {tips.map((tip: any, i: number) => {
                  const tipText = typeof tip === "string" ? tip : (tip.content || tip.title || JSON.stringify(tip));
                  return (
                    <li key={i} className="text-sm text-foreground/70 flex items-start gap-2.5 leading-relaxed">
                      <span className="text-muted-foreground font-medium">{i + 1}.</span>
                      {tipText}
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Main Modal ── */
interface AnsweredQuestion {
  options: { letter: string; text: string }[];
  selectedLetter: string;
  correctLetter: string | null;
  messageIndex: number;
}

const SimulatorModal = ({ open, onClose, taskName, jobTitle, company, taskState, taskTrend, taskImpactLevel, onCompleted }: SimulatorModalProps) => {
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<SimSession | null>(null);
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [roundCount, setRoundCount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("exploring");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const taskMeta = { currentState: taskState, trend: taskTrend, impactLevel: taskImpactLevel };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 80);
  }, []);

  const startCompile = useCallback(async (level: ExperienceLevel) => {
    setPhase("loading");
    setError(null);
    setMessages([]);
    setRoundCount(1);
    setAnsweredQuestions([]);
    setExperienceLevel(level);
    try {
      const compiled = await compileSession(taskName, jobTitle, company, 3, level, taskMeta);
      setSession(compiled);
      setPhase("briefing");
    } catch (err) {
      console.error("Failed to start simulation:", err);
      setError("Couldn't start the simulation. The simulator may not have scenarios for this role yet.");
      setPhase("chat");
    }
  }, [taskName, jobTitle, company, taskState, taskTrend, taskImpactLevel]);

  useEffect(() => {
    if (open) {
      setPhase("experience-select");
      setSession(null);
      setMessages([]);
      setError(null);
      setRoundCount(1);
      setAnsweredQuestions([]);
    }
  }, [open]);

  const beginChat = () => {
    if (!session) return;
    setMessages([{ role: "assistant", content: session.openingMessage }]);
    setPhase("chat");
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const userMsg: SimMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setSending(true);
    scrollToBottom();

    try {
      const reply = await chatTurn(newMessages, roundCount, roundCount, jobTitle, experienceLevel, taskMeta);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      const lowerInput = input.trim().toLowerCase();
      if (lowerInput === "yes" || lowerInput === "y" || lowerInput === "yeah" || lowerInput === "sure") {
        setRoundCount((c) => c + 1);
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
    const totalQ = answeredQuestions.length;
    const correctQ = answeredQuestions.filter(q => q.selectedLetter === q.correctLetter).length;
    if (user) {
      try {
        await supabase.from("completed_simulations").insert({
          user_id: user.id,
          task_name: taskName,
          job_title: jobTitle,
          company: company || null,
          rounds_completed: roundCount,
          correct_answers: correctQ,
          total_questions: totalQ,
          experience_level: experienceLevel,
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl w-[95vw] h-[90vh] sm:h-[90vh] h-[100dvh] sm:rounded-2xl rounded-none p-0 flex flex-col overflow-hidden gap-0 border-border/50 [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border/40 shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-sans font-semibold text-foreground truncate">{taskName}</h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">{jobTitle}{company ? ` · ${company}` : ""}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {phase === "chat" && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs text-muted-foreground bg-accent/50 px-3 py-1 rounded-full"
              >
                Round {roundCount}
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

            {phase === "experience-select" && (
              <ExperienceSelector
                taskName={taskName}
                taskState={taskState}
                taskTrend={taskTrend}
                onSelect={startCompile}
              />
            )}

            {phase === "briefing" && session && (
              <BriefingScreen session={session} onStart={beginChat} />
            )}

            {error && phase !== "loading" && phase !== "briefing" && phase !== "experience-select" && (
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
              <div className="max-w-2xl mx-auto space-y-5">
                {phase === "chat" && <TipsToggle tips={session?.tips || []} />}
                {messages.map((msg, i) => {
                  if (msg.role === "user" && /^[A-C]$/.test(msg.content.trim())) return null;

                  const isUser = msg.role === "user";

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 }}
                      className="space-y-3"
                    >
                      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-5 py-4 text-[15px] leading-[1.7] ${
                            isUser
                              ? "bg-foreground text-background rounded-br-lg"
                              : "bg-accent/40 text-foreground rounded-bl-lg"
                          }`}
                        >
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>p]:mb-1 [&>ul]:mt-2 [&>ul]:mb-0">
                            <ReactMarkdown>{
                              !isUser
                                ? msg.content.replace(/^[A-C][).]\s*.+$/gm, "").trim()
                                : msg.content
                            }</ReactMarkdown>
                          </div>
                        </div>
                      </div>

                      {/* Answered MCQ inline */}
                      {!isUser && (() => {
                        const aq = answeredQuestions.find(q => q.messageIndex === i);
                        if (!aq) return null;
                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-col gap-2 max-w-[85%]"
                          >
                            {aq.options.map((opt) => {
                              const isSelected = opt.letter === aq.selectedLetter;
                              const isCorrect = opt.letter === aq.correctLetter;
                              let style = "border-border/40 bg-accent/20 text-muted-foreground/60";
                              if (isCorrect) style = "border-success/40 bg-success/5 text-success";
                              if (isSelected && !isCorrect) style = "border-destructive/30 bg-destructive/5 text-destructive";
                              return (
                                <div key={opt.letter} className={`flex items-center gap-3 px-4 py-3 text-[15px] rounded-xl border ${style} transition-all duration-200`}>
                                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0 ${
                                    isCorrect ? "bg-success/10 text-success" : isSelected ? "bg-destructive/10 text-destructive" : "bg-accent text-muted-foreground"
                                  }`}>
                                    {isCorrect ? "✓" : isSelected ? "✗" : opt.letter}
                                  </span>
                                  <span>{opt.text}</span>
                                </div>
                              );
                            })}
                          </motion.div>
                        );
                      })()}
                    </motion.div>
                  );
                })}

                {/* Unanswered MCQ options — inline in scroll area */}
                {phase === "chat" && !sending && (() => {
                  const lastAi = [...messages].reverse().find(m => m.role === "assistant");
                  if (!lastAi) return null;
                  const lastAiIndex = messages.lastIndexOf(lastAi);
                  const alreadyAnswered = answeredQuestions.some(q => q.messageIndex === lastAiIndex);
                  if (alreadyAnswered) return null;
                  const opts = lastAi.content.match(/^[A-C][).]\s*.+/gm);
                  if (!opts || opts.length < 2) return null;
                  const parsedOpts = opts.slice(0, 3).map(opt => ({
                    letter: opt.charAt(0),
                    text: opt.replace(/^[A-C][).]\s*/, "").trim(),
                  }));
                  return (
                    <div className="flex flex-col gap-2 mt-2">
                      {parsedOpts.map((opt, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="w-full flex items-center gap-3 text-left px-4 py-3.5 text-[15px] rounded-xl border border-border/40 bg-background hover:bg-accent/30 hover:border-border transition-all duration-200"
                          onClick={() => {
                            const questionMsgIndex = lastAiIndex;
                            const fakeMsg: SimMessage = { role: "user", content: opt.letter };
                            const newMsgs = [...messages, fakeMsg];
                            setMessages(newMsgs);
                            setInput("");
                            setSending(true);
                            scrollToBottom();
                            chatTurn(newMsgs, roundCount, roundCount, jobTitle, experienceLevel, taskMeta).then(reply => {
                              let correctLetter: string | null = null;
                              if (reply.includes("✅")) {
                                correctLetter = opt.letter;
                              } else if (reply.includes("❌")) {
                                const patterns = [
                                  /\*\*([A-C])\)?\*\*/,
                                  /correct\s+(?:answer|option)\s+(?:is|was)\s+\**([A-C])/i,
                                  /(?:answer|option)\s+([A-C])\s+(?:is|was)\s+correct/i,
                                  /\b([A-C])\)\s/,
                                  /\b([A-C])\)/,
                                ];
                                for (const pattern of patterns) {
                                  const match = reply.match(pattern);
                                  if (match && match[1] !== opt.letter) {
                                    correctLetter = match[1];
                                    break;
                                  }
                                }
                                if (!correctLetter) {
                                  for (const other of parsedOpts) {
                                    if (other.letter !== opt.letter && reply.includes(other.text.substring(0, 20))) {
                                      correctLetter = other.letter;
                                      break;
                                    }
                                  }
                                }
                              }
                              setAnsweredQuestions(prev => [...prev, {
                                options: parsedOpts,
                                selectedLetter: opt.letter,
                                correctLetter,
                                messageIndex: questionMsgIndex,
                              }]);
                              setMessages(prev => [...prev, { role: "assistant", content: reply }]);
                              scrollToBottom();
                            }).catch(() => {
                              setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Try again." }]);
                            }).finally(() => setSending(false));
                          }}
                        >
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent text-xs font-semibold text-muted-foreground shrink-0">{opt.letter}</span>
                          <span className="text-foreground/80">{opt.text}</span>
                        </motion.button>
                      ))}
                    </div>
                  );
                })()}

                {/* Continue / Finish buttons — inline in scroll area */}
                {phase === "chat" && !sending && (() => {
                  const lastAi = [...messages].reverse().find(m => m.role === "assistant");
                  if (!lastAi) return null;
                  const lower = lastAi.content.toLowerCase();
                  const askContinue = lower.includes("ready for the next scenario") || lower.includes("want to see another example") || lower.includes("want another") || lower.includes("(yes/no)");
                  if (!askContinue) return null;
                  return (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl h-10 sm:h-11 text-sm gap-2"
                        onClick={() => {
                          const fakeMsg: SimMessage = { role: "user", content: "yes" };
                          const newMsgs = [...messages, fakeMsg];
                          setMessages(newMsgs);
                          setInput("");
                          setSending(true);
                          const nextRound = roundCount + 1;
                          setRoundCount(nextRound);
                          scrollToBottom();
                          chatTurn(newMsgs, nextRound, nextRound, jobTitle, experienceLevel, taskMeta).then(reply => {
                            setMessages(prev => [...prev, { role: "assistant", content: reply }]);
                            scrollToBottom();
                          }).catch(() => {
                            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
                          }).finally(() => setSending(false));
                        }}
                      >
                        <ArrowRight className="h-4 w-4" /> Next Scenario
                      </Button>
                      <Button
                        className="flex-1 rounded-xl h-10 sm:h-11 text-sm gap-2"
                        onClick={handleFinish}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Finish Practice
                      </Button>
                    </div>
                  );
                })()}
              </div>
            )}

            {sending && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start max-w-2xl mx-auto"
              >
                <div className="bg-accent/40 rounded-2xl rounded-bl-lg px-5 py-4">
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
                <p className="text-sm text-muted-foreground">Saving your progress…</p>
              </motion.div>
            )}

            {phase === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center py-16 gap-6 max-w-sm mx-auto text-center"
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
                  <h3 className="text-xl font-serif font-bold text-foreground">Practice Complete</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    You completed {roundCount} round{roundCount !== 1 ? "s" : ""} on "{taskName}"
                  </p>
                  {answeredQuestions.length > 0 && (
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">
                          {answeredQuestions.filter(q => q.selectedLetter === q.correctLetter).length}/{answeredQuestions.length}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Correct</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">
                          {answeredQuestions.length > 0
                            ? Math.round((answeredQuestions.filter(q => q.selectedLetter === q.correctLetter).length / answeredQuestions.length) * 100)
                            : 0}%
                        </div>
                        <div className="text-[10px] text-muted-foreground">Score</div>
                      </div>
                    </div>
                  )}
                  {!user && (
                    <p className="text-xs text-muted-foreground mt-3">
                      <a href="/auth" className="text-primary hover:underline">Sign in</a> to save your progress
                    </p>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setPhase("experience-select")} className="gap-2 rounded-xl">
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
            className="shrink-0 border-t border-border/40 bg-background px-4 sm:px-6 py-3 sm:py-4 space-y-3 pb-[env(safe-area-inset-bottom,12px)]"
          >
            <div className="flex items-end gap-3 max-w-2xl mx-auto">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer…"
                rows={1}
                className="flex-1 resize-none rounded-xl border border-border/40 bg-accent/10 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-[15px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring/30 focus:border-border min-h-[40px] sm:min-h-[44px] max-h-[120px] transition-all duration-200"
              />
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFinish}
                  className="text-xs text-muted-foreground hover:text-foreground h-[44px] px-3 rounded-xl"
                >
                  Finish
                </Button>
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="h-[44px] w-[44px] p-0 rounded-xl"
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
