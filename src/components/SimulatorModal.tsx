import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, RotateCcw, Play, Lightbulb, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

type Phase = "loading" | "briefing" | "chat" | "completing" | "done";

interface SimulatorModalProps {
  open: boolean;
  onClose: () => void;
  taskName: string;
  jobTitle: string;
  company?: string;
  onCompleted?: () => void;
}
const MAX_ROUNDS = 10;

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
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className="flex flex-col gap-5 py-2"
  >
    <div className="text-center">
      <div className="text-4xl mb-2">🎯</div>
      <h3 className="text-lg font-bold text-foreground">{session.scenario.title}</h3>
      <p className="text-xs text-muted-foreground mt-1">{session.scenario.description}</p>
    </div>

    <Card className="bg-accent/20 border-accent/30">
      <CardContent className="p-4">
        <h4 className="text-xs font-semibold text-foreground mb-2">📚 What you need to know</h4>
        <div className="text-sm text-foreground/90 leading-relaxed prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2">
          <ReactMarkdown>{session.briefing}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>

    {session.tips && session.tips.length > 0 && (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold text-foreground mb-2">💡 Tips for success</h4>
          <ul className="space-y-1.5">
            {session.tips.map((tip, i) => (
              <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                <span className="text-sm">{["✅", "🔍", "💬"][i % 3]}</span>
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    )}

    <Button onClick={onStart} className="gap-2 mx-auto">🚀 Start Simulation</Button>
  </motion.div>
);

/* ── Tips Toggle ── */
const TipsToggle = ({ tips }: { tips: string[] }) => {
  const [open, setOpen] = useState(false);
  if (!tips || tips.length === 0) return null;

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <Lightbulb className="h-3 w-3" />
        {open ? "Hide tips" : "Show tips"}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-1.5 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
              <ul className="space-y-1">
                {tips.map((tip, i) => (
                  <li key={i} className="text-[11px] text-foreground/70 flex items-start gap-1.5">
                    <span className="text-primary font-bold">{i + 1}.</span>
                    {tip}
                  </li>
                ))}
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
  correctLetter: string | null; // parsed from AI feedback
  messageIndex: number; // index of the AI message that had the question
}

const SimulatorModal = ({ open, onClose, taskName, jobTitle, company, onCompleted }: SimulatorModalProps) => {
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<SimSession | null>(null);
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [roundCount, setRoundCount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  }, []);

  const startSession = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setMessages([]);
    setRoundCount(1);
    setAnsweredQuestions([]);
    try {
      const compiled = await compileSession(taskName, jobTitle, company, 3);
      setSession(compiled);
      setPhase("briefing");
    } catch (err) {
      console.error("Failed to start simulation:", err);
      setError("Couldn't start the simulation. The simulator may not have scenarios for this role yet.");
      setPhase("chat");
    }
  }, [taskName, jobTitle, company]);

  useEffect(() => {
    if (open) startSession();
  }, [open, startSession]);

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
      const reply = await chatTurn(newMessages, roundCount, roundCount, jobTitle);
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
    if (user) {
      try {
        await supabase.from("completed_simulations").insert({
          user_id: user.id,
          task_name: taskName,
          job_title: jobTitle,
          company: company || null,
          rounds_completed: roundCount,
        });
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
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 flex flex-col overflow-hidden gap-0 text-base">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground truncate">Practice: {taskName}</h2>
            <p className="text-xs text-muted-foreground truncate">{jobTitle}{company ? ` at ${company}` : ""}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {phase === "chat" && (
              <Badge variant="outline" className="text-[10px]">Round {roundCount}</Badge>
            )}
          </div>
        </div>

        {/* Body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {phase === "loading" && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Preparing your briefing...</p>
              </motion.div>
            )}

            {phase === "briefing" && session && (
              <BriefingScreen session={session} onStart={beginChat} />
            )}

            {error && phase !== "loading" && phase !== "briefing" && (
              <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-warning/30 bg-warning/5">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-warning font-medium mb-3">{error}</p>
                    <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {(phase === "chat" || phase === "done") && !error && (
              <>
                {phase === "chat" && <TipsToggle tips={session?.tips || []} />}
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-secondary-foreground rounded-bl-md"
                      }`}
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">
                        <ReactMarkdown>{
                          msg.role === "assistant"
                            ? msg.content.replace(/^[A-D][).]\s*.+$/gm, "").trim()
                            : msg.content
                        }</ReactMarkdown>
                      </div>
                    </div>
                    {/* Show answered question buttons inline after the AI message */}
                    {msg.role === "assistant" && (() => {
                      const aq = answeredQuestions.find(q => q.messageIndex === i);
                      if (!aq) return null;
                      return (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 flex flex-col gap-1.5 max-w-[80%]">
                          {aq.options.map((opt) => {
                            const isSelected = opt.letter === aq.selectedLetter;
                            const isCorrect = opt.letter === aq.correctLetter;
                            let style = "border-border bg-card text-muted-foreground opacity-60";
                            if (isCorrect) style = "border-success/50 bg-success/10 text-success";
                            if (isSelected && !isCorrect) style = "border-destructive/50 bg-destructive/10 text-destructive";
                            return (
                              <div key={opt.letter} className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border ${style} transition-all`}>
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                                  isCorrect ? "bg-success/20 text-success" : isSelected ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
                                }`}>
                                  {isCorrect ? "✓" : isSelected ? "✗" : opt.letter}
                                </span>
                                <span className="text-sm">{opt.text}</span>
                              </div>
                            );
                          })}
                        </motion.div>
                      );
                    })()}
                  </motion.div>
                ))}
              </>
            )}

            {sending && (
              <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </motion.div>
            )}

            {phase === "completing" && (
              <motion.div key="completing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Saving your progress...</p>
              </motion.div>
            )}

            {phase === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-8 gap-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-foreground">Practice Complete!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You completed {roundCount} round{roundCount !== 1 ? "s" : ""} on "{taskName}"
                  </p>
                  {!user && (
                    <p className="text-xs text-muted-foreground mt-2">
                      <a href="/auth" className="text-primary hover:underline">Sign in</a> to save your progress
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={startSession} className="gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" /> Try Again
                  </Button>
                  <Button size="sm" onClick={onClose}>Done</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input bar */}
        {phase === "chat" && !error && (
          <div className="shrink-0 border-t border-border bg-card px-4 py-3 space-y-2">
            {/* Multiple choice buttons */}
            {(() => {
              const lastAi = [...messages].reverse().find(m => m.role === "assistant");
              if (!lastAi || sending) return null;
              const opts = lastAi.content.match(/^[A-D][).]\s*.+/gm);
              if (!opts || opts.length < 2) return null;
              return (
                <div className="flex flex-col gap-1.5">
                  {opts.slice(0, 4).map((opt, i) => {
                    const letter = opt.charAt(0);
                    const text = opt.replace(/^[A-D][).]\s*/, "").trim();
                    return (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left h-auto py-2 px-3 text-sm font-normal hover:bg-primary/5 hover:border-primary/30"
                        onClick={() => {
                          const fakeMsg: SimMessage = { role: "user", content: letter };
                          const newMsgs = [...messages, fakeMsg];
                          setMessages(newMsgs);
                          setInput("");
                          setSending(true);
                          scrollToBottom();
                          chatTurn(newMsgs, roundCount, roundCount, jobTitle).then(reply => {
                            setMessages(prev => [...prev, { role: "assistant", content: reply }]);
                            scrollToBottom();
                          }).catch(() => {
                            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Try again." }]);
                          }).finally(() => setSending(false));
                        }}
                      >
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold mr-2 shrink-0">{letter}</span>
                        {text}
                      </Button>
                    );
                  })}
                </div>
              );
            })()}

            {/* Continue / end buttons */}
            {(() => {
              const lastAi = [...messages].reverse().find(m => m.role === "assistant");
              if (!lastAi || sending) return null;
              const askContinue = lastAi.content.toLowerCase().includes("want to see another example") || lastAi.content.toLowerCase().includes("want another");
              if (!askContinue) return null;
              return (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 hover:bg-success/5 hover:border-success/30"
                    onClick={() => {
                      const fakeMsg: SimMessage = { role: "user", content: "yes" };
                      const newMsgs = [...messages, fakeMsg];
                      setMessages(newMsgs);
                      setInput("");
                      setSending(true);
                      const nextRound = roundCount + 1;
                      setRoundCount(nextRound);
                      scrollToBottom();
                      chatTurn(newMsgs, nextRound, nextRound, jobTitle).then(reply => {
                        setMessages(prev => [...prev, { role: "assistant", content: reply }]);
                        scrollToBottom();
                      }).catch(() => {
                        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
                      }).finally(() => setSending(false));
                    }}
                  >
                    Yes, show me more
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={handleFinish}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Finish
                  </Button>
                </div>
              );
            })()}

            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer or a message..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[38px] max-h-[120px]"
              />
              <div className="flex gap-1.5 shrink-0">
                <Button variant="outline" size="sm" onClick={handleFinish} className="gap-1 text-xs h-[38px]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Finish
                </Button>
                <Button size="sm" onClick={handleSend} disabled={!input.trim() || sending} className="h-[38px] w-[38px] p-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SimulatorModal;
