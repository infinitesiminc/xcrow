import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, RotateCcw, ChevronDown, ChevronUp, CheckCircle2, X, ArrowRight, Target, Circle, CircleCheck, AlertTriangle, TrendingUp } from "lucide-react";
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
  type LearningObjective,
  type SimConfig,
} from "@/lib/simulator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Phase = "loading" | "briefing" | "chat" | "review" | "completing" | "done";

// Defaults — overridden by server config
const DEFAULT_MIN_ROUNDS = 3;
const DEFAULT_MAX_ROUNDS = 6;

// Inactivity nudge timer (ms)
const INACTIVITY_NUDGE_MS = 30_000;

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
  onNextTask?: () => void;
  onBackToFeed?: () => void;
  inline?: boolean;
}

/* ── Objective Checklist (sidebar / inline) ── */
const ObjectiveChecklist = ({
  objectives,
  status,
  scaffoldingTiers,
  compact = false,
}: {
  objectives: LearningObjective[];
  status: Record<string, boolean>;
  scaffoldingTiers?: Record<string, number>;
  compact?: boolean;
}) => {
  const metCount = objectives.filter(o => status[o.id]).length;
  const tierLabels = ["", "Nudged", "Hinted", "Guided"];
  
  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <div className="flex items-center gap-2 mb-1">
        <Target className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Learning Goals · {metCount}/{objectives.length}
        </span>
      </div>
      {objectives.map((obj) => {
        const met = status[obj.id];
        const tier = scaffoldingTiers?.[obj.id] || 0;
        return (
          <motion.div
            key={obj.id}
            layout
            className={`flex items-start gap-2 rounded-lg px-2.5 py-1.5 transition-colors ${
              met ? "bg-success/10" : "bg-accent/20"
            }`}
          >
            {met ? (
              <CircleCheck className="h-4 w-4 text-success shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
            )}
            <div>
              <span className={`text-xs font-medium ${met ? "text-success" : "text-foreground/80"}`}>
                {obj.label}
              </span>
              {!compact && (
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{obj.description}</p>
              )}
              {tier > 0 && (
                <span className="text-[10px] text-muted-foreground/60 italic">{tierLabels[tier]}</span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

/* ── Briefing Screen ── */
const BriefingScreen = ({
  session,
  onStart,
}: {
  session: SimSession;
  onStart: () => void;
}) => {
  const config = session.config;
  return (
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
          🎯 {config?.objectiveCount || 3} goals · Ends when you've got them all
        </span>
      </div>

      {/* Learning Objectives */}
      {session.learningObjectives && session.learningObjectives.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.4 }}
          className="rounded-2xl bg-primary/5 border border-primary/20 p-6"
        >
          <h4 className="text-xs font-medium uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
            <Target className="h-3.5 w-3.5" />
            What you'll learn
          </h4>
          <ul className="space-y-3">
            {session.learningObjectives.map((obj, i) => (
              <motion.li
                key={obj.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.08 }}
                className="flex items-start gap-3"
              >
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <span className="text-[15px] font-medium text-foreground">{obj.label}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{obj.description}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

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
                  transition={{ delay: 0.35 + i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <span className="text-primary text-sm mt-0.5">💡</span>
                  <span className="text-sm text-foreground/80 leading-relaxed">{tipText}</span>
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
          Start Learning
        </Button>
      </motion.div>
    </motion.div>
  );
};

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

/* ── Objective Results ── */
const ObjectiveResultsDisplay = ({
  objectives,
  results,
}: {
  objectives: LearningObjective[];
  results?: SimScoreResult["objectiveResults"];
}) => {
  if (!results || results.length === 0) return null;
  
  const metCount = results.filter(r => r.met).length;
  const allMet = metCount === results.length;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="w-full mt-4"
    >
      <div className={`rounded-xl border p-4 ${allMet ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}>
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            Learning Objectives: {metCount}/{results.length} achieved
          </span>
        </div>
        <div className="space-y-2">
          {results.map((r) => (
            <div key={r.id} className="flex items-start gap-2">
              {r.met ? (
                <CircleCheck className="h-4 w-4 text-success shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              )}
              <div>
                <span className={`text-xs font-medium ${r.met ? "text-success" : "text-warning"}`}>
                  {r.label}
                  {r.assisted && <span className="text-muted-foreground/60 ml-1">(assisted)</span>}
                </span>
                <p className="text-[11px] text-muted-foreground">{r.evidence}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

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

/* ── Unmet Objectives Review ── */
const UnmetObjectivesReview = ({
  objectives,
  status,
  onContinue,
  onFinishAnyway,
  roundCount,
  minRounds,
}: {
  objectives: LearningObjective[];
  status: Record<string, boolean>;
  onContinue: () => void;
  onFinishAnyway: () => void;
  roundCount: number;
  minRounds: number;
}) => {
  const unmet = objectives.filter(o => !status[o.id]);
  const tooEarly = roundCount < minRounds;
  
  return (
    <motion.div
      key="review"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col items-center py-10 gap-6 max-w-md mx-auto text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning/10"
      >
        <Target className="h-8 w-8 text-warning" />
      </motion.div>
      <div className="space-y-2">
        <h3 className="text-lg font-serif font-bold text-foreground">
          {tooEarly ? "Just getting started!" : "Almost there!"}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {tooEarly
            ? `You've only completed ${roundCount} of at least ${minRounds} rounds. Finishing now means less practice and a lower score.`
            : `You haven't covered ${unmet.length === 1 ? "this learning goal" : `${unmet.length} learning goals`} yet. Want to do ${unmet.length === 1 ? "one more scenario" : "a few more scenarios"} to cover ${unmet.length === 1 ? "it" : "them"}?`
          }
        </p>
      </div>
      <div className="w-full space-y-2">
        {unmet.map((obj) => (
          <div key={obj.id} className="flex items-start gap-2 text-left rounded-lg bg-warning/5 border border-warning/20 px-3 py-2">
            <Circle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-medium text-foreground">{obj.label}</span>
              <p className="text-[11px] text-muted-foreground">{obj.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onFinishAnyway} className="rounded-xl">
          Finish Anyway
        </Button>
        <Button onClick={onContinue} className="gap-2 rounded-xl">
          <ArrowRight className="h-4 w-4" /> Keep Going
        </Button>
      </div>
    </motion.div>
  );
};

/* ── Main Modal ── */
const SimulatorModal = ({ open, onClose, taskName, jobTitle, company, taskState, taskTrend, taskImpactLevel, mode = "assess", onCompleted, onNextTask, onBackToFeed, inline = false }: SimulatorModalProps) => {
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<SimSession | null>(null);
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [roundCount, setRoundCount] = useState(1);
  const [turnCount, setTurnCount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [scoreResult, setScoreResult] = useState<SimScoreResult | null>(null);
  const [objectiveStatus, setObjectiveStatus] = useState<Record<string, boolean>>({});
  const [showObjectives, setShowObjectives] = useState(false);
  const [scaffoldingTiers, setScaffoldingTiers] = useState<Record<string, number>>({});
  const [showInactivityNudge, setShowInactivityNudge] = useState(false);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const taskMeta = { currentState: taskState, trend: taskTrend, impactLevel: taskImpactLevel };

  // Dynamic round config from server
  const config: SimConfig = session?.config || { minRounds: DEFAULT_MIN_ROUNDS, maxRounds: DEFAULT_MAX_ROUNDS, objectiveCount: 3 };
  const maxRounds = config.maxRounds;
  const minRounds = config.minRounds;

  // Check if all objectives met
  const allObjectivesMet = session?.learningObjectives?.every(o => objectiveStatus[o.id]) ?? false;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 80);
  }, []);

  // ─── Inactivity nudge timer ───
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    setShowInactivityNudge(false);
    inactivityTimer.current = setTimeout(() => {
      setShowInactivityNudge(true);
    }, INACTIVITY_NUDGE_MS);
  }, []);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    setShowInactivityNudge(false);
  }, []);

  // Start/stop inactivity timer based on phase
  useEffect(() => {
    if (phase === "chat" && !sending) {
      resetInactivityTimer();
    } else {
      clearInactivityTimer();
    }
    return clearInactivityTimer;
  }, [phase, sending, messages.length]);

  // Parse objective tags from AI responses
  const parseObjectiveTags = useCallback((reply: string) => {
    const tagPattern = /\[OBJECTIVE_MET:(\w+)\]/g;
    let match;
    const newStatus = { ...objectiveStatus };
    let changed = false;
    while ((match = tagPattern.exec(reply)) !== null) {
      const objId = match[1];
      if (!newStatus[objId]) {
        newStatus[objId] = true;
        changed = true;
      }
    }
    if (changed) {
      setObjectiveStatus(newStatus);
    }
  }, [objectiveStatus]);

  // Parse scaffolding tier tags from AI responses
  const parseScaffoldTags = useCallback((reply: string) => {
    const tierMatch = reply.match(/\[SCAFFOLD_TIER:(\d)\]/);
    if (!tierMatch) return;
    const tier = parseInt(tierMatch[1]);
    
    // Determine which objective is currently being targeted (most recent unmet)
    const unmetObjectives = session?.learningObjectives?.filter(o => !objectiveStatus[o.id]) || [];
    if (unmetObjectives.length > 0) {
      const targetObj = unmetObjectives[0]; // First unmet objective
      setScaffoldingTiers(prev => ({
        ...prev,
        [targetObj.id]: Math.max(prev[targetObj.id] || 0, tier),
      }));
    }
  }, [session, objectiveStatus]);

  const startCompile = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setMessages([]);
    setRoundCount(1);
    setTurnCount(1);
    setScoreResult(null);
    setObjectiveStatus({});
    setScaffoldingTiers({});
    setShowInactivityNudge(false);
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
    resetInactivityTimer();
    const nextTurn = turnCount + 1;
    setTurnCount(nextTurn);
    scrollToBottom();

    try {
      const reply = await chatTurn(
        newMessages, roundCount, nextTurn, jobTitle, mode, taskMeta,
        session?.learningObjectives, objectiveStatus, scaffoldingTiers
      );
      
      // Parse tags
      parseObjectiveTags(reply);
      parseScaffoldTags(reply);
      
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      // Check for all objectives met signal
      if (reply.includes("[ALL_OBJECTIVES_MET]")) {
        // Session can end — the AI message will prompt finish
      }

      if (reply.includes("[SCAFFOLDING]") || reply.includes("[SCAFFOLD_TIER:")) {
        setTurnCount(turnCount);
      } else {
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

  const handleFinishAttempt = () => {
    const objectives = session?.learningObjectives || [];
    const unmet = objectives.filter(o => !objectiveStatus[o.id]);
    const tooEarly = roundCount < minRounds;
    if ((unmet.length > 0 || tooEarly) && roundCount < maxRounds + 3) {
      setPhase("review");
      return;
    }
    handleFinish();
  };

  const handleContinueAfterReview = () => {
    setPhase("chat");
    const fakeMsg: SimMessage = { role: "user", content: "yes" };
    const newMsgs = [...messages, fakeMsg];
    setMessages(newMsgs);
    setSending(true);
    const nextRound = roundCount + 1;
    setRoundCount(nextRound);
    const nextTurn = turnCount + 1;
    setTurnCount(nextTurn);
    scrollToBottom();
    chatTurn(newMsgs, nextRound, nextTurn, jobTitle, mode, taskMeta, session?.learningObjectives, objectiveStatus, scaffoldingTiers).then(reply => {
      parseObjectiveTags(reply);
      parseScaffoldTags(reply);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      scrollToBottom();
    }).catch(() => {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
    }).finally(() => setSending(false));
  };

  const handleFinish = async () => {
    setPhase("completing");
    clearInactivityTimer();
    
    let scores: SimScoreResult | null = null;
    if (messages.length > 2) {
      try {
        scores = await scoreSession(messages, session?.scenario || null, mode, session?.learningObjectives, scaffoldingTiers);
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

  const showHelpChip = phase === "chat" && !sending && (() => {
    if (messages.length < 1) return false;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "assistant") return false;
    const lower = lastMsg.content.toLowerCase();
    return lower.includes("how would you approach") || lower.includes("how would you handle") || lower.includes("[scaffolding]") || lower.includes("[scaffold_tier:");
  })();

  // Strip tags from message text for display
  const cleanMessageForDisplay = (content: string): string => {
    return content
      .replace(/🤖\s*\*?\*?AI Today:?\*?\*?\s*.+/g, "")
      .replace(/💡\s*\*?\*?Human Edge:?\*?\*?\s*.+/g, "")
      .replace(/\[SCAFFOLDING\]/g, "")
      .replace(/\[OBJECTIVE_MET:\w+\]/g, "")
      .replace(/\[SCAFFOLD_TIER:\d\]/g, "")
      .replace(/\[ALL_OBJECTIVES_MET\]/g, "")
      .trim();
  };

  const progressPercent = Math.min((roundCount / maxRounds) * 100, 100);
  const objectives = session?.learningObjectives || [];
  const metCount = objectives.filter(o => objectiveStatus[o.id]).length;

  // Done screen: adaptive icon/title based on score
  const doneIcon = (() => {
    if (!scoreResult) return { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" };
    if (scoreResult.overall >= 70) return { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" };
    if (scoreResult.overall >= 40) return { icon: TrendingUp, color: "text-warning", bg: "bg-warning/10" };
    return { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" };
  })();

  const doneTitle = (() => {
    if (!scoreResult) return "Session Complete";
    if (scoreResult.overall >= 70) return "Great Work!";
    if (scoreResult.overall >= 40) return "Room to Grow";
    return "Keep Practicing";
  })();

  const DoneIconComponent = doneIcon.icon;

  const content = (
    <div className={inline ? "h-full flex flex-col overflow-hidden" : "max-w-3xl w-[95vw] h-[90vh] sm:h-[90vh] h-[100dvh] sm:rounded-2xl rounded-none p-0 flex flex-col overflow-hidden gap-0 border-border/50"}>
        {/* Header */}
        <div className="shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border/40">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-sans font-semibold text-foreground truncate">{taskName}</h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">{jobTitle}{company ? ` · ${company}` : ""}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {phase === "chat" && objectives.length > 0 && (
                <button
                  onClick={() => setShowObjectives(!showObjectives)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full transition-colors ${
                    showObjectives ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  <Target className="h-3 w-3" />
                  {metCount}/{objectives.length}
                  {allObjectivesMet && <span className="ml-0.5">✓</span>}
                </button>
              )}
              {phase === "chat" && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs px-3 py-1 rounded-full text-primary bg-primary/10"
                >
                  💬 {roundCount}/{maxRounds}
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
        <div className="flex-1 flex min-h-0">
          {/* Objectives sidebar */}
          <AnimatePresence>
            {showObjectives && phase === "chat" && objectives.length > 0 && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 220, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-r border-border/40 overflow-hidden shrink-0"
              >
                <div className="p-3 w-[220px]">
                  <ObjectiveChecklist objectives={objectives} status={objectiveStatus} scaffoldingTiers={scaffoldingTiers} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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

              {phase === "review" && session && (
                <UnmetObjectivesReview
                  objectives={objectives}
                  status={objectiveStatus}
                  onContinue={handleContinueAfterReview}
                  onFinishAnyway={handleFinish}
                  roundCount={roundCount}
                  minRounds={minRounds}
                />
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
                    
                    const objectiveMetInMsg = !isUser ? (msg.content.match(/\[OBJECTIVE_MET:(\w+)\]/g) || []).map(t => {
                      const m = t.match(/\[OBJECTIVE_MET:(\w+)\]/);
                      return m ? m[1] : null;
                    }).filter(Boolean) : [];

                    // Detect scaffolding tier in message
                    const scaffoldTierInMsg = !isUser ? msg.content.match(/\[SCAFFOLD_TIER:(\d)\]/) : null;
                    const tierLabels = ["", "💭 Let's break this down...", "💡 Here's a direction...", "📚 Teaching moment"];

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-2"
                      >
                        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                          {isUser ? (
                            <div className="max-w-[80%] bg-primary/10 border border-primary/20 rounded-2xl rounded-br-md px-4 py-2">
                              <p className="text-sm text-foreground">{displayContent}</p>
                            </div>
                          ) : (
                            <div className="chat-prose max-w-[92%]">
                              <ReactMarkdown>{displayContent}</ReactMarkdown>
                            </div>
                          )}
                        </div>

                        {/* Scaffolding tier indicator */}
                        {scaffoldTierInMsg && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/30 border border-border/30 w-fit"
                          >
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {tierLabels[parseInt(scaffoldTierInMsg[1])] || "Scaffolding"}
                            </span>
                          </motion.div>
                        )}

                        {/* Objective met notification */}
                        {objectiveMetInMsg.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20 w-fit"
                          >
                            <CircleCheck className="h-3.5 w-3.5 text-success" />
                            <span className="text-[11px] font-medium text-success">
                              Goal achieved: {objectives.find(o => o.id === objectiveMetInMsg[0])?.label || "Objective met"}
                            </span>
                          </motion.div>
                        )}

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
                    const allMetSignal = lastAi.content.includes("[ALL_OBJECTIVES_MET]");
                    if (!askContinue && !allMetSignal) return null;
                    
                    const isLastRound = roundCount >= maxRounds;
                    const isSessionEnd = lower.includes("click finish") || allMetSignal;
                    
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
                              chatTurn(newMsgs, nextRound, nextTurn, jobTitle, mode, taskMeta, session?.learningObjectives, objectiveStatus, scaffoldingTiers).then(reply => {
                                parseObjectiveTags(reply);
                                parseScaffoldTags(reply);
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
                          onClick={handleFinishAttempt}
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
                  <p className="text-sm text-muted-foreground">Evaluating your progress…</p>
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
                    className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${doneIcon.bg}`}
                  >
                    <DoneIconComponent className={`h-10 w-10 ${doneIcon.color}`} />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-foreground">{doneTitle}</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      {roundCount} round{roundCount !== 1 ? "s" : ""} on "{taskName}"
                    </p>
                    
                    {/* Objective results */}
                    {scoreResult?.objectiveResults && (
                      <ObjectiveResultsDisplay
                        objectives={objectives}
                        results={scoreResult.objectiveResults}
                      />
                    )}
                    
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
                  <div className="flex flex-col gap-3 pt-2 w-full max-w-xs">
                    {/* Primary action row */}
                    {scoreResult && scoreResult.overall < 60 ? (
                      <Button onClick={startCompile} className="gap-2 rounded-xl w-full">
                        <RotateCcw className="h-3.5 w-3.5" /> Try Again
                      </Button>
                    ) : onNextTask ? (
                      <Button onClick={() => { onClose(); onNextTask(); }} className="gap-2 rounded-xl w-full">
                        <ArrowRight className="h-3.5 w-3.5" /> Next Task ⚡
                      </Button>
                    ) : (
                      <Button onClick={onClose} className="rounded-xl w-full">Done</Button>
                    )}
                    
                    {/* Secondary actions */}
                    <div className="flex gap-2">
                      {scoreResult && scoreResult.overall < 60 && onNextTask && (
                        <Button variant="outline" onClick={() => { onClose(); onNextTask(); }} className="gap-2 rounded-xl flex-1 text-xs">
                          Skip → Next Task
                        </Button>
                      )}
                      {scoreResult && scoreResult.overall >= 60 && (
                        <Button variant="outline" onClick={startCompile} className="gap-2 rounded-xl flex-1 text-xs">
                          <RotateCcw className="h-3 w-3" /> Retry
                        </Button>
                      )}
                      {onBackToFeed ? (
                        <Button variant="ghost" onClick={() => { onClose(); onBackToFeed(); }} className="rounded-xl flex-1 text-xs text-muted-foreground">
                          ← Back to Roles
                        </Button>
                      ) : (
                        <Button variant="ghost" onClick={onClose} className="rounded-xl flex-1 text-xs text-muted-foreground">
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input bar */}
        {phase === "chat" && !error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="shrink-0 border-t border-border/40 bg-background px-4 sm:px-6 py-3 space-y-3 pb-[env(safe-area-inset-bottom,12px)]"
          >
            {/* Inactivity nudge */}
            <AnimatePresence>
              {showInactivityNudge && !sending && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="max-w-2xl mx-auto"
                >
                  <button
                    onClick={() => {
                      handleSend("I'm thinking about this — can you help me break it down?");
                      setShowInactivityNudge(false);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors animate-pulse"
                  >
                    🤔 Stuck? Tap here for a nudge
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {showHelpChip && !showInactivityNudge && (
              <div className="flex gap-2 max-w-2xl mx-auto">
                <button
                  onClick={() => handleSend("I'm not sure where to start — can you help me break this down?")}
                  className="text-xs px-3 py-1.5 rounded-full border border-border/40 bg-accent/20 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                >
                  💭 Help me think through this
                </button>
              </div>
            )}
            <div className="flex items-end gap-3 max-w-2xl mx-auto">
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  resetInactivityTimer();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Describe your approach…"
                rows={2}
                className="flex-1 resize-none rounded-xl border border-border/40 bg-accent/10 px-3 sm:px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring/30 focus:border-border min-h-[40px] max-h-[100px] transition-all duration-200"
              />
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFinishAttempt}
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
    </div>
  );

  if (inline) return content;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl w-[95vw] h-[90vh] sm:h-[90vh] h-[100dvh] sm:rounded-2xl rounded-none p-0 flex flex-col overflow-hidden gap-0 border-border/50 [&>button]:hidden">
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default SimulatorModal;
