import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useChatContext } from "@/contexts/ChatContext";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, RotateCcw, ChevronDown, ChevronUp, CheckCircle2, X, ArrowRight, Target, Circle, CircleCheck, AlertTriangle, TrendingUp, Trophy, Zap, Map, Star, Lock, Unlock, Sparkles } from "lucide-react";
import { matchTaskToSkills, SKILL_TAXONOMY, XP_PER_SIM, getLevel, getNextLevel, type SkillXP } from "@/lib/skill-map";
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
  generateElevation,
  type SimMessage,
  type SimSession,
  type SimScoreResult,
  type SimMode,
  type LearningObjective,
  type SimConfig,
  type ElevationNarrative,
  type CoachingContext,
} from "@/lib/simulator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUsageGate } from "@/hooks/use-usage-gate";
import UpgradeModal from "@/components/UpgradeModal";

type Phase = "loading" | "briefing" | "chat" | "review" | "completing" | "done" | "guest-limit";

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
  /** Open territory overlay focused on the skill just practiced, with XP gain animation */
  onViewTerritory?: (skillId: string, xpGain: number) => void;
  inline?: boolean;
  /** When set, unauthenticated users are capped at this many user turns before seeing a CTA */
  guestMaxTurns?: number;
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
          Quest Objectives · {metCount}/{objectives.length}
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

/* ── Hash to hue for generative hero ── */
function simHeroHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
}

/* ── Briefing Screen ── */
const BriefingScreen = ({
  session,
  onStart,
}: {
  session: SimSession;
  onStart: () => void;
}) => {
  const config = session.config;
  const hue1 = simHeroHue(session.scenario.title);
  const hue2 = (hue1 + 50) % 360;
  const hue3 = (hue1 + 160) % 360;

  return (
    <motion.div
      key="briefing"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-8 py-6 px-2 max-w-2xl mx-auto"
    >
      {/* Hero image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative rounded-2xl overflow-hidden h-44 sm:h-52"
        style={{
          background: `linear-gradient(135deg, hsl(${hue1} 55% 18%) 0%, hsl(${hue2} 50% 12%) 50%, hsl(${hue3} 45% 8%) 100%)`,
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 blur-2xl"
          style={{ background: `hsl(${hue1} 70% 55%)` }}
        />
        <div
          className="absolute bottom-0 left-10 w-28 h-28 rounded-full opacity-15 blur-xl"
          style={{ background: `hsl(${hue2} 60% 50%)` }}
        />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(hsl(${hue1} 50% 80%) 1px, transparent 1px), linear-gradient(90deg, hsl(${hue1} 50% 80%) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }} />
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4, type: "spring" }}
            className="text-5xl mb-3"
          >
            {(() => {
              const simEmojis = ['🤖','🧠','⚡','🎯','🔬','🚀','💡','🧪','🎓','🏗️','📊','🔮','🛠️','🌐','🧩'];
              const hash = (session.scenario.title || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
              return simEmojis[hash % simEmojis.length];
            })()}
          </motion.div>
          <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground drop-shadow-lg">{session.scenario.title}</h3>
          <p className="text-sm text-foreground/70 leading-relaxed max-w-md mx-auto mt-2">{session.scenario.description}</p>
        </div>
      </motion.div>

      <div className="text-center">
        <span className="inline-block text-[11px] px-2.5 py-1 rounded-full font-medium bg-primary/10 text-primary">
          ⚔️ {config?.objectiveCount || 3} objectives · Quest ends when all are conquered
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
            Quest Objectives
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
        <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Mission Intel</h4>
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
          <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Battle Tips</h4>
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
          ⚔️ Begin Quest
        </Button>
      </motion.div>
    </motion.div>
  );
};

/* ── Score Display (legacy — kept for data persistence, hidden from UI) ── */
const ScoreDisplay = ({ scoreResult: _sr }: { scoreResult: SimScoreResult }) => null;

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
            Quest Objectives: {metCount}/{results.length} conquered
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
          {tooEarly ? "The battle has just begun!" : "Almost victorious!"}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {tooEarly
            ? `You've only cleared ${roundCount} of at least ${minRounds} waves. Keep fighting to conquer more objectives.`
            : `You haven't conquered ${unmet.length === 1 ? "this objective" : `${unmet.length} objectives`} yet. Ready for ${unmet.length === 1 ? "one more wave" : "a few more waves"} to claim ${unmet.length === 1 ? "it" : "them"}?`
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
          Retreat & Score
        </Button>
        <Button onClick={onContinue} className="gap-2 rounded-xl">
          <ArrowRight className="h-4 w-4" /> Fight On
        </Button>
      </div>
    </motion.div>
  );
};

/* ── Main Modal ── */
const SimulatorModal = ({ open, onClose, taskName, jobTitle, company, taskState, taskTrend, taskImpactLevel, mode = "assess", onCompleted, onNextTask, onBackToFeed, onViewTerritory, inline = false, guestMaxTurns }: SimulatorModalProps) => {
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
  const { user, isPro } = useAuth();
  const { toast } = useToast();
  const { setSimActive } = useChatContext();

  // Hide AI Coach when simulation is active
  useEffect(() => {
    if (open) setSimActive(true);
    return () => setSimActive(false);
  }, [open, setSimActive]);
  const navigate = useNavigate();
  const simGate = useUsageGate("simulation");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [coachingContext, setCoachingContext] = useState<CoachingContext | null>(null);

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

  // Parse OBJ_EVAL tags from AI responses (deterministic)
  const parseObjectiveTags = useCallback((reply: string) => {
    // New deterministic format: [OBJ_EVAL:id:PASS] or [OBJ_EVAL:id:FAIL]
    const evalPattern = /\[OBJ_EVAL:([^:]+):(PASS|FAIL)\]/g;
    let match;
    const newStatus = { ...objectiveStatus };
    let changed = false;
    while ((match = evalPattern.exec(reply)) !== null) {
      const objId = match[1];
      const result = match[2];
      if (result === "PASS" && !newStatus[objId]) {
        newStatus[objId] = true;
        changed = true;
      }
    }
    // Also support legacy format for backwards compatibility
    const legacyPattern = /\[OBJECTIVE_MET:([^\]]+)\]/g;
    while ((match = legacyPattern.exec(reply)) !== null) {
      const objId = match[1];
      if (!newStatus[objId]) {
        newStatus[objId] = true;
        changed = true;
      }
    }
    if (changed) {
      setObjectiveStatus(newStatus);
    }
    return newStatus;
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

  const startCompile = useCallback(async (coaching?: CoachingContext | null) => {
    // Usage gate check for free users
    if (user && !isPro) {
      const allowed = await simGate.check();
      if (!allowed) {
        setShowUpgrade(true);
        return;
      }
    }
    setPhase("loading");
    setError(null);
    setMessages([]);
    setRoundCount(1);
    setTurnCount(1);
    setScoreResult(null);
    setObjectiveStatus({});
    setScaffoldingTiers({});
    setShowInactivityNudge(false);
    if (coaching) setCoachingContext(coaching);
    else setCoachingContext(null);
    try {
      const compiled = await compileSession(taskName, jobTitle, company, 3, mode, taskMeta, coaching ?? undefined);
      setSession(compiled);
      setPhase("briefing");
    } catch (err) {
      console.error("Failed to start simulation:", err);
      setError("Couldn't forge the quest. Please try again.");
      setPhase("chat");
    }
  }, [taskName, jobTitle, company, mode, taskState, taskTrend, taskImpactLevel, user, isPro, simGate]);

  const startRetryWithCoaching = useCallback(() => {
    if (!scoreResult) return startCompile();
    const categories = scoreResult.categories || [];
    const weakest = categories.reduce((min, c) => c.score < min.score ? c : min, categories[0]);
    if (!weakest) return startCompile();

    const tips: Record<string, string> = {
      "Tool Awareness": "Focus on identifying which AI tools fit each scenario — think about what AI handles best vs. what needs human judgment.",
      "Adaptive Thinking": "Try to consider multiple approaches before committing. Think about edge cases and how your strategy might need to shift.",
      "Domain Judgment": "Draw on domain-specific knowledge. Consider industry context, stakeholder impact, and real-world constraints.",
      "Human Value Add": "Emphasize what makes your human perspective irreplaceable — relationships, ethics, nuance, and creative problem-solving.",
    };

    const coaching: CoachingContext = {
      weakCategory: weakest.name,
      weakScore: weakest.score,
      tip: tips[weakest.name] || `Focus on improving your ${weakest.name} skills this round.`,
      previousOverall: scoreResult.overall,
    };
    startCompile(coaching);
  }, [scoreResult, startCompile]);

  useEffect(() => {
    if (open) startCompile();
  }, [open]);

  const beginChat = () => {
    if (!session) return;
    setMessages([{ role: "assistant", content: session.openingMessage }]);
    setPhase("chat");
  };

  // Compute current target objective (first unmet)
  const currentTargetObjectiveId = session?.learningObjectives?.find(o => !objectiveStatus[o.id])?.id;

  const handleSend = async (overrideInput?: string) => {
    const messageText = overrideInput ?? input.trim();
    if (!messageText || sending) return;

    // Guest turn limit check: count user messages so far (before this one)
    const userTurnsSoFar = messages.filter(m => m.role === "user").length;
    if (guestMaxTurns && !user && userTurnsSoFar >= guestMaxTurns) {
      setPhase("guest-limit");
      return;
    }

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
        session?.learningObjectives, objectiveStatus, scaffoldingTiers,
        currentTargetObjectiveId
      );
      
      // Parse tags
      const updatedStatus = parseObjectiveTags(reply);
      parseScaffoldTags(reply);
      
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      // Check if all objectives met after this reply
      const nowAllMet = session?.learningObjectives?.every(o => updatedStatus[o.id]) ?? false;
      if (nowAllMet || reply.includes("[ALL_OBJECTIVES_MET]")) {
        // Victory state — AI message will prompt finish
      }

      if (reply.includes("[SCAFFOLDING]") || reply.includes("[SCAFFOLD_TIER:") || reply.includes("[NEEDS_DEPTH]")) {
        // Don't advance turn — AI is asking user to elaborate
        setTurnCount(turnCount);
      } else {
        const lowerInput = messageText.toLowerCase();
        if (lowerInput === "yes" || lowerInput === "y" || lowerInput === "yeah" || lowerInput === "sure") {
          setRoundCount((c) => c + 1);
        }
      }
      scrollToBottom();

      // After reply, check if next turn would hit guest limit — show limit after AI responds
      const newUserTurns = newMessages.filter(m => m.role === "user").length;
      if (guestMaxTurns && !user && newUserTurns >= guestMaxTurns) {
        // Wait a beat so user reads the AI reply, then show limit
        setTimeout(() => setPhase("guest-limit"), 2500);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    }
    setSending(false);
  };

  const handleFinishAttempt = () => {
    // Finish gate: if unmet objectives remain and rounds left, show review
    const unmetCount = session?.learningObjectives?.filter(o => !objectiveStatus[o.id]).length ?? 0;
    if (unmetCount > 0 && roundCount < maxRounds) {
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
    const nextTargetId = session?.learningObjectives?.find(o => !objectiveStatus[o.id])?.id;
    chatTurn(newMsgs, nextRound, nextTurn, jobTitle, mode, taskMeta, session?.learningObjectives, objectiveStatus, scaffoldingTiers, nextTargetId).then(reply => {
      parseObjectiveTags(reply);
      parseScaffoldTags(reply);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      scrollToBottom();
    }).catch(() => {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
    }).finally(() => setSending(false));
  };

  // Compute skills earned for this simulation
  const [earnedSkills, setEarnedSkills] = useState<{ skill_id: string; xp: number; name: string; levelBefore: string; levelAfter: string; leveledUp: boolean }[]>([]);
  const [elevation, setElevation] = useState<ElevationNarrative | null>(null);
  const [elevationLoading, setElevationLoading] = useState(false);

  const handleFinish = async () => {
    setPhase("completing");
    clearInactivityTimer();
    
    let scores: SimScoreResult | null = null;
    if (messages.length > 2) {
      try {
        scores = await scoreSession(messages, session?.scenario || null, mode, session?.learningObjectives, scaffoldingTiers, objectiveStatus);
        setScoreResult(scores);
      } catch (err) {
        console.error("Failed to get scores:", err);
      }
    }

    // Compute skill XP earned
    const skillIds = matchTaskToSkills(taskName, jobTitle);
    const xpEach = skillIds.length > 0 ? Math.round(XP_PER_SIM / skillIds.length) : 0;
    const skillsEarnedData = skillIds.map(id => ({ skill_id: id, xp: xpEach }));

    // For display: compute level changes
    // We'd need existing XP to show level-ups accurately, but we can show what was earned
    const earned = skillIds.map(id => {
      const tax = SKILL_TAXONOMY.find(s => s.id === id);
      return {
        skill_id: id,
        xp: xpEach,
        name: tax?.name || id,
        levelBefore: "Beginner",
        levelAfter: "Beginner",
        leveledUp: false,
      };
    });
    setEarnedSkills(earned);
    
    // Check if elevation unlock is earned (60%+ overall)
    const elevationUnlocked = scores && scores.overall >= 60;

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
          skills_earned: skillsEarnedData,
        } as any);
        onCompleted?.();
        // Increment usage counter for free tier
        await simGate.increment();
        toast({ title: "Skills updated! 🎯", description: `+${xpEach} XP in ${earned.map(e => e.name).join(", ")}`, action: <Button variant="link" className="text-xs p-0 h-auto" onClick={() => navigate("/journey")}>Skill Map</Button> });
      } catch (err) {
        console.error("Failed to save completion:", err);
      }
    }
    setPhase("done");

    // Fire elevation generation async (non-blocking) if unlocked
    if (elevationUnlocked) {
      setElevationLoading(true);
      generateElevation(jobTitle, taskName, company)
        .then(narrative => {
          setElevation(narrative);
          // Persist to DB if user is logged in
          if (user) {
            supabase.from("completed_simulations" as any)
              .update({ elevation_narrative: narrative } as any)
              .eq("user_id", user.id)
              .eq("task_name", taskName)
              .eq("job_title", jobTitle)
              .order("completed_at", { ascending: false })
              .limit(1)
              .then(() => {});
          }
        })
        .catch(err => console.error("Elevation generation failed:", err))
        .finally(() => setElevationLoading(false));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Safely coerce content to string (API may return object)
  const safeStr = (v: unknown): string => (typeof v === "string" ? v : JSON.stringify(v ?? ""));

  const showHelpChip = phase === "chat" && !sending && (() => {
    if (messages.length < 1) return false;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "assistant") return false;
    const lower = safeStr(lastMsg.content).toLowerCase();
    return lower.includes("how would you approach") || lower.includes("how would you handle") || lower.includes("[scaffolding]") || lower.includes("[scaffold_tier:") || lower.includes("[needs_depth]");
  })();

  // Strip tags from message text for display
  const cleanMessageForDisplay = (content: string): string => {
    return content
      .replace(/🤖\s*\*?\*?AI Today:?\*?\*?\s*.+/g, "")
      .replace(/💡\s*\*?\*?Human Edge:?\*?\*?\s*.+/g, "")
      .replace(/\[SCAFFOLDING\]/g, "")
      .replace(/\[OBJECTIVE_MET:[^\]]+\]/g, "")
      .replace(/\[SCAFFOLD_TIER:\d\]/g, "")
      .replace(/\[ALL_OBJECTIVES_MET\]/g, "")
      .replace(/\[NEEDS_DEPTH\]/g, "")
      .trim();
  };

  const progressPercent = Math.min((roundCount / maxRounds) * 100, 100);
  const objectives = session?.learningObjectives || [];
  const metCount = objectives.filter(o => objectiveStatus[o.id]).length;

  // Done screen: always celebratory — progress is the goal
  const objectiveMet = scoreResult?.objectiveResults?.filter(r => r.met).length ?? 0;
  const objectiveTotal = scoreResult?.objectiveResults?.length ?? 0;
  const allDoneObjectivesMet = objectiveTotal > 0 && objectiveMet === objectiveTotal;

  const doneIcon = allDoneObjectivesMet
    ? { icon: Trophy, color: "text-primary", bg: "bg-primary/10" }
    : objectiveMet > 0
    ? { icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" }
    : { icon: Target, color: "text-primary", bg: "bg-primary/10" };

  const doneTitle = allDoneObjectivesMet
    ? "You crushed it! 🎉"
    : objectiveMet > 0
    ? "Great progress! 💪"
    : "You showed up — that's step one 🌱";

  const doneSubtitle = allDoneObjectivesMet
    ? "Every objective nailed. You're building real AI fluency."
    : objectiveMet > 0
    ? `${objectiveMet} of ${objectiveTotal} goals reached. Each attempt makes you sharper.`
    : "Learning starts with trying. Come back and you'll surprise yourself.";

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
              {phase === "chat" && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs px-3 py-1 rounded-full text-primary bg-primary/10"
                >
                  ⚔️ Wave {roundCount}/{maxRounds}
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

        <div className="flex-1 flex min-h-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 scrollbar-thin">
            {/* Coaching banner for retry sessions */}
            {coachingContext && phase === "chat" && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto mb-4 rounded-xl border border-primary/30 bg-primary/5 p-3"
              >
                <div className="flex items-start gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Target className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      🎯 Coaching Focus: <span className="text-primary">{coachingContext.weakCategory}</span>
                      <span className="text-muted-foreground font-normal ml-1.5">(previously {coachingContext.weakScore}%)</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      {coachingContext.tip}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
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
                  <p className="text-sm text-muted-foreground">Forging your quest…</p>
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

              {phase === "chat" && !error && (
                <div className="max-w-2xl mx-auto space-y-4">
                  {messages.map((msg, i) => {
                    const isUser = msg.role === "user";
                    const displayContent = isUser ? safeStr(msg.content) : cleanMessageForDisplay(safeStr(msg.content));

                    // Detect scenario transition: assistant message containing a new scenario marker or following a topic-change user message
                    const prevMsg = i > 0 ? messages[i - 1] : null;
                    const topicChangeWords = ["yes", "y", "yeah", "sure", "next", "new topic", "move on", "continue", "let's go", "skip"];
                    const prevIsTopicChange = prevMsg?.role === "user" && topicChangeWords.some(w => safeStr(prevMsg.content).toLowerCase().trim().includes(w));
                    const hasScenarioMarker = !isUser && (displayContent.includes("📖 Scenario") || displayContent.includes("📖 **Scenario"));
                    const isNewScenario = !isUser && (prevIsTopicChange || hasScenarioMarker) && i > 1;
                    
                    const objectiveMetInMsg = !isUser ? (safeStr(msg.content).match(/\[OBJECTIVE_MET:([^\]]+)\]/g) || []).map(t => {
                      const m = t.match(/\[OBJECTIVE_MET:([^\]]+)\]/);
                      return m ? m[1] : null;
                    }).filter(Boolean) : [];

                    // Detect scaffolding tier in message
                    const scaffoldTierInMsg = !isUser ? msg.content.match(/\[SCAFFOLD_TIER:(\d)\]/) : null;
                    const tierLabels = ["", "💭 Let's break this down...", "💡 Here's a direction...", "📚 Teaching moment"];

                    return (
                      <>
                        {/* Scenario transition divider */}
                        {isNewScenario && (
                          <motion.div
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            transition={{ duration: 0.4 }}
                            className="flex items-center gap-3 py-2"
                          >
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                            <span className="text-[11px] font-medium text-primary/70 flex items-center gap-1.5 shrink-0">
                              <Zap className="h-3 w-3" /> ⚡ New Wave
                            </span>
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                          </motion.div>
                        )}
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

                        {/* Collapsible insight card */}
                        {!isUser && <InsightCard content={msg.content} />}
                      </motion.div>
                      </>
                    );
                  })}

                  {/* Continue / Finish buttons */}
                  {phase === "chat" && !sending && (() => {
                    const lastAi = [...messages].reverse().find(m => m.role === "assistant");
                    if (!lastAi) return null;
                    const lower = safeStr(lastAi.content).toLowerCase();
                    const askContinue = lower.includes("ready for the next") || lower.includes("(yes/no)") || lower.includes("click finish");
                    const allMetSignal = safeStr(lastAi.content).includes("[ALL_OBJECTIVES_MET]");
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
                            <ArrowRight className="h-4 w-4" /> Next Wave
                          </Button>
                        )}
                        <Button
                          className="flex-1 rounded-xl h-10 text-sm gap-2"
                          onClick={handleFinishAttempt}
                          >
                           <CheckCircle2 className="h-4 w-4" /> {isLastRound || isSessionEnd ? "⚔️ Battle Report" : "End Quest"}
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
                  <p className="text-sm text-muted-foreground">Compiling battle report…</p>
                </motion.div>
              )}

              {phase === "guest-limit" && (
                <motion.div
                  key="guest-limit"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="flex flex-col items-center py-10 gap-6 max-w-sm mx-auto text-center"
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10"
                  >
                    <Zap className="h-10 w-10 text-primary" />
                  </motion.div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-display font-bold text-foreground">
                      Nice start! 🔥
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      You just practiced <span className="text-foreground font-medium">"{taskName}"</span> for{" "}
                      <span className="text-foreground font-medium">{jobTitle}</span>.
                      Sign up free to unlock unlimited practice and track your skills.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 pt-2 w-full max-w-xs">
                    <Button
                      onClick={() => { onClose(); navigate("/"); }}
                      className="gap-2 rounded-xl w-full"
                    >
                      Explore More Roles <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { onClose(); navigate("/auth"); }}
                      className="gap-2 rounded-xl w-full"
                    >
                      Sign Up Free
                    </Button>
                  </div>
                </motion.div>
              )}

              {phase === "done" && (() => {
                const overallScore = scoreResult?.overall ?? 0;
                const scoreTier: "low" | "mid" | "high" = overallScore < 60 ? "low" : overallScore <= 85 ? "mid" : "high";

                // Find nearest unclaimed skill for territory nudge
                const currentSkillIds = matchTaskToSkills(taskName, jobTitle);
                const currentSkillName = currentSkillIds.length > 0
                  ? SKILL_TAXONOMY.find(s => s.id === currentSkillIds[0])?.name ?? taskName
                  : taskName;

                // Find a nearby unclaimed skill (different category neighbor)
                const currentCategories = new Set(currentSkillIds.map(id => SKILL_TAXONOMY.find(s => s.id === id)?.category));
                const nearbyUnclaimed = SKILL_TAXONOMY.find(s =>
                  !currentSkillIds.includes(s.id) &&
                  !currentCategories.has(s.category) &&
                  s.aiExposure > 40
                );

                const xpEarned = earnedSkills.reduce((sum, s) => sum + s.xp, 0);

                return (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="flex flex-col items-center py-8 gap-5 max-w-sm mx-auto text-center"
                >
                  {/* Score ring */}
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                    className="relative"
                  >
                    <svg width="96" height="96" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                      <motion.circle
                        cx="48" cy="48" r="42" fill="none"
                        stroke={scoreTier === "high" ? "hsl(142 71% 45%)" : scoreTier === "mid" ? "hsl(var(--primary))" : "hsl(38 92% 50%)"}
                        strokeWidth="4.5"
                        strokeLinecap="round"
                        strokeDasharray={`${overallScore * 2.64} 264`}
                        transform="rotate(-90 48 48)"
                        initial={{ strokeDasharray: "0 264" }}
                        animate={{ strokeDasharray: `${overallScore * 2.64} 264` }}
                        transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span
                        className="text-2xl font-bold text-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        {overallScore}%
                      </motion.span>
                      <span className="text-[10px] text-muted-foreground">power</span>
                    </div>
                  </motion.div>

                  {/* Dynamic encouragement */}
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-display font-bold text-foreground">
                      {scoreTier === "high" ? "Victory! 🏆" : scoreTier === "mid" ? "Valiant effort! 💪" : "First blood! 🌱"}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {scoreTier === "high"
                        ? "You've conquered this quest. Time to expand your territory."
                        : scoreTier === "mid"
                        ? "Your power grows. One more wave could level you up."
                        : "Every commander started here. Retry with a battle coach to raise your power."
                      }
                    </p>
                  </div>

                  {/* Skills earned */}
                  {earnedSkills.length > 0 && (
                    <div className="w-full space-y-1.5">
                      {earnedSkills.map((skill, i) => (
                        <motion.div
                          key={skill.skill_id}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 150 }}
                          className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-2.5"
                        >
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Star className="h-4 w-4 text-primary" />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{skill.name}</p>
                            <p className="text-xs text-primary font-medium">+{skill.xp} XP</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Territory nudge */}
                  {nearbyUnclaimed && scoreTier !== "low" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="w-full rounded-xl border border-border/40 bg-accent/20 p-3 text-left"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-base mt-0.5">🏰</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground">
                            Nearby unclaimed castle: <span className="text-primary">{nearbyUnclaimed.name}</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            One simulation away from claiming it
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Elevation Narrative */}
                  {(() => {
                    const unlocked = overallScore >= 60;

                    if (unlocked && elevation) {
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6, duration: 0.5 }}
                          className="w-full rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/5 to-transparent p-5 text-left"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Unlock className="h-4 w-4 text-primary" />
                            <span className="text-xs font-medium uppercase tracking-widest text-primary">Role Evolution Unlocked</span>
                          </div>
                          <p className="text-base font-display font-bold text-foreground mb-3">
                            {elevation.shift_summary}
                          </p>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="rounded-xl bg-muted/50 p-3">
                              <span className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">Before</span>
                              <p className="text-xs text-foreground/80">{elevation.before}</p>
                            </div>
                            <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
                              <span className="text-[10px] font-mono uppercase text-primary block mb-1">After</span>
                              <p className="text-xs text-foreground/80">{elevation.after}</p>
                            </div>
                          </div>
                          {elevation.emerging_skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {elevation.emerging_skills.map((skill, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                          {elevation.analogy && (
                            <p className="text-[11px] text-muted-foreground italic mt-2">💡 {elevation.analogy}</p>
                          )}
                        </motion.div>
                      );
                    }

                    if (unlocked && elevationLoading) {
                      return (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="w-full rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-center justify-center gap-3"
                        >
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-xs text-primary font-medium">Generating your role evolution insight…</span>
                        </motion.div>
                      );
                    }

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="w-full rounded-2xl border border-border/40 bg-muted/30 p-4 text-center"
                      >
                        <Lock className="h-4 w-4 text-muted-foreground/40 mx-auto mb-1.5" />
                        <p className="text-xs font-medium text-muted-foreground">
                          Score 60%+ to unlock <span className="text-foreground">how this role is evolving</span>
                        </p>
                      </motion.div>
                    );
                  })()}

                  {!user && (
                    <p className="text-xs text-muted-foreground">
                      <a href="/auth" className="text-primary hover:underline">Sign in</a> to save your progress
                    </p>
                  )}

                  {/* ── Adaptive CTAs ── */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex flex-col gap-2.5 pt-1 w-full max-w-xs"
                  >
                    {/* Primary CTA — adapts to score */}
                    {scoreTier === "low" && (
                      <Button
                        onClick={startRetryWithCoaching}
                        className="gap-2 rounded-xl w-full h-11"
                      >
                        <RotateCcw className="h-4 w-4" /> ⚔️ Retry with Battle Coach
                      </Button>
                    )}
                    {scoreTier === "mid" && onNextTask && (
                      <Button
                        onClick={() => { onClose(); onNextTask(); }}
                        className="gap-2 rounded-xl w-full h-11"
                      >
                        <TrendingUp className="h-4 w-4" /> ⚔️ Level Up — Harder Wave
                      </Button>
                    )}
                    {scoreTier === "mid" && !onNextTask && (
                      <Button
                        onClick={() => startCompile()}
                        className="gap-2 rounded-xl w-full h-11"
                      >
                        <TrendingUp className="h-4 w-4" /> ⚔️ Train Again to Level Up
                      </Button>
                    )}
                    {scoreTier === "high" && nearbyUnclaimed && (
                      <Button
                        onClick={() => { onClose(); onBackToFeed?.(); }}
                        className="gap-2 rounded-xl w-full h-11"
                      >
                        <Sparkles className="h-4 w-4" /> 🏰 New Frontier — Conquer {nearbyUnclaimed.name}
                      </Button>
                    )}
                    {scoreTier === "high" && !nearbyUnclaimed && onNextTask && (
                      <Button
                        onClick={() => { onClose(); onNextTask(); }}
                        className="gap-2 rounded-xl w-full h-11"
                      >
                        <ArrowRight className="h-4 w-4" /> Next Quest
                      </Button>
                    )}
                    {scoreTier === "high" && !nearbyUnclaimed && !onNextTask && (
                      <Button
                        onClick={onClose}
                        className="gap-2 rounded-xl w-full h-11"
                      >
                        <ArrowRight className="h-4 w-4" /> Explore Territory
                      </Button>
                    )}

                    {/* Secondary CTA — adapts to score */}
                    {scoreTier === "low" && onNextTask && (
                      <Button
                        variant="secondary"
                        onClick={() => { onClose(); onNextTask(); }}
                        className="gap-2 rounded-xl w-full text-xs"
                      >
                        Try a Different Quest
                      </Button>
                    )}
                    {scoreTier === "mid" && (
                      <Button
                        variant="secondary"
                        onClick={() => startCompile()}
                        className="gap-2 rounded-xl w-full text-xs"
                      >
                        <RotateCcw className="h-3 w-3" /> Same Quest — Raise Power
                      </Button>
                    )}
                    {scoreTier === "high" && (
                      <Button
                        variant="secondary"
                        onClick={() => startCompile()}
                        className="gap-2 rounded-xl w-full text-xs"
                      >
                        Same Skill, New Battleground
                      </Button>
                    )}

                    {/* View Territory — auto-pan to upgraded castle */}
                    {onViewTerritory && currentSkillIds.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          onClose();
                          onViewTerritory(currentSkillIds[0], xpEarned);
                        }}
                        className="gap-2 rounded-xl w-full text-xs"
                      >
                        <Map className="h-3 w-3" /> 🏰 View Territory
                      </Button>
                    )}

                    {/* Always: Back to Xcrow */}
                    <Button
                      variant="ghost"
                      onClick={onClose}
                      className="gap-2 rounded-xl w-full text-xs text-muted-foreground"
                    >
                      🐦‍⬛ Back to Xcrow
                    </Button>
                  </motion.div>
                </motion.div>
                );
              })()}
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
                placeholder="Your move, commander…"
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
                   End Quest
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
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-3xl w-[95vw] h-[90vh] sm:h-[90vh] h-[100dvh] sm:rounded-2xl rounded-none p-0 flex flex-col overflow-hidden gap-0 border-border/50 [&>button]:hidden">
          {content}
        </DialogContent>
      </Dialog>
      <UpgradeModal open={showUpgrade} onOpenChange={(v) => { setShowUpgrade(v); if (!v) onClose(); }} type="simulation" used={simGate.used} limit={simGate.limit} />
    </>
  );
};

export default SimulatorModal;
