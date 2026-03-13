import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Trophy, RotateCcw, Play, Lightbulb, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  compileSession,
  chatTurn,
  scoreTranscript,
  type SimMessage,
  type SimSession,
  type SimScore,
} from "@/lib/simulator";

type Phase = "loading" | "briefing" | "chat" | "scoring" | "results";

interface SimulatorModalProps {
  open: boolean;
  onClose: () => void;
  taskName: string;
  jobTitle: string;
  company?: string;
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

    {/* Briefing */}
    <Card className="bg-accent/20 border-accent/30">
      <CardContent className="p-4">
        <h4 className="text-xs font-semibold text-foreground mb-2">
          📚 What you need to know
        </h4>
        <div className="text-sm text-foreground/90 leading-relaxed prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2">
          <ReactMarkdown>{session.briefing}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>

    {/* Tips */}
    {session.tips && session.tips.length > 0 && (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold text-foreground mb-2">
            💡 Tips for success
          </h4>
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

    <Button onClick={onStart} className="gap-2 mx-auto">
      🚀 Start Simulation
    </Button>
  </motion.div>
);

/* ── Tips Toggle (during chat) ── */
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
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
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
const SimulatorModal = ({ open, onClose, taskName, jobTitle, company }: SimulatorModalProps) => {
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<SimSession | null>(null);
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [roundCount, setRoundCount] = useState(1);
  const [score, setScore] = useState<SimScore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  }, []);

  const startSession = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setMessages([]);
    setRoundCount(1);
    setScore(null);
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
      // Increment round when user answers yes to continue
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
    if (!session) return;
    setPhase("scoring");
    try {
      const result = await scoreTranscript(messages, session.scenario);
      setScore(result);
      setPhase("results");
    } catch (err) {
      console.error("Scoring error:", err);
      setError("Couldn't score the session.");
      setPhase("results");
    }
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
              <Badge variant="outline" className="text-[10px]">
                Round {roundCount}
              </Badge>
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

            {phase === "chat" && !error && (
              <>
                <TipsToggle tips={session?.tips || []} />
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
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
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

            {phase === "scoring" && (
              <motion.div key="scoring" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Evaluating your performance...</p>
              </motion.div>
            )}

            {phase === "results" && score && (
              <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 py-4">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-3">
                    <Trophy className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{score.overall}/100</h3>
                  <p className="text-sm text-muted-foreground mt-1">Overall Score</p>
                </div>

                <div className="space-y-3">
                  {score.categories?.map((cat, i) => (
                    <Card key={i}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-foreground">{cat.name}</span>
                          <span className="text-xs font-bold text-primary">{cat.score}/100</span>
                        </div>
                        <Progress value={cat.score} className="h-1.5 mb-2" />
                        <p className="text-[11px] text-muted-foreground">{cat.feedback}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {score.summary && (
                  <Card className="bg-accent/30">
                    <CardContent className="p-4">
                      <p className="text-sm text-foreground leading-relaxed">{score.summary}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2 justify-center pt-2">
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
                  {opts.slice(0, 3).map((opt, i) => {
                    const letter = opt.charAt(0);
                    const text = opt.replace(/^[A-D][).]\s*/, "").trim();
                    return (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left h-auto py-2 px-3 text-sm font-normal hover:bg-primary/5 hover:border-primary/30"
                        onClick={() => {
                          const letter = opt.charAt(0);
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

            {/* Continue / end buttons after feedback */}
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
                    className="flex-1"
                    onClick={handleFinish}
                  >
                    <Trophy className="h-3.5 w-3.5 mr-1.5" /> Finish & Score
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
                  <Trophy className="h-3.5 w-3.5" /> Finish
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
