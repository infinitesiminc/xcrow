import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useChatContext } from "@/contexts/ChatContext";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, RotateCcw, ChevronDown, ChevronUp, CheckCircle2, X, ArrowRight, Target, Circle, CircleCheck, AlertTriangle, TrendingUp, Trophy, Zap, Map, Star, Lock, Unlock, Sparkles, Compass, Swords, Scroll, Flag, Shield, Flame } from "lucide-react";
import { matchTaskToSkills, SKILL_TAXONOMY, getLevel, getNextLevel, type SkillXP } from "@/lib/skill-map";
import { calculateSkillXP } from "@/lib/castle-levels";
import ReactMarkdown from "react-markdown";
import TypewriterMarkdown from "@/components/TypewriterMarkdown";
import XcrowLoader from "@/components/XcrowLoader";
import { useToolMentionComponents } from "@/components/sim/AIToolChip";
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
  /** Intel gathered from War Council pre-battle prep */
  intelContext?: import("@/lib/simulator").IntelContext;
  /** Return to battle chooser within same kingdom */
  onNextBattle?: () => void;
  /** Campaign stats for post-sim debrief */
  campaignStats?: { conquered: number; total: number; sessionXP: number };
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
        <span className="text-xs">🎯</span>
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "hsl(var(--filigree))", fontFamily: "'Cinzel', serif" }}
        >
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
            className="flex items-start gap-2 rounded-lg px-2.5 py-1.5 transition-colors"
            style={{
              background: met ? "hsl(142 71% 45% / 0.08)" : "hsl(var(--filigree) / 0.06)",
              border: `1px solid ${met ? "hsl(142 71% 45% / 0.2)" : "hsl(var(--filigree) / 0.1)"}`,
            }}
          >
            {met ? (
              <CircleCheck className="h-4 w-4 text-success shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--filigree) / 0.3)" }} />
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
  const objectiveCount = session.learningObjectives?.length || config?.objectiveCount || 3;

  return (
    <motion.div
      key="briefing"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-5 py-6 px-2 max-w-2xl mx-auto"
    >
      {/* Hero banner with ornamental frame */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, hsl(${hue1} 55% 14%) 0%, hsl(${hue2} 50% 9%) 50%, hsl(${hue3} 45% 6%) 100%)`,
          border: "1px solid hsl(var(--filigree) / 0.3)",
          boxShadow: "0 0 40px hsl(var(--primary) / 0.08), inset 0 1px 0 hsl(var(--filigree) / 0.15)",
        }}
      >
        {/* Atmospheric glow */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-15 blur-3xl"
          style={{ background: `hsl(${hue1} 70% 50%)` }}
        />
        <div
          className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full opacity-10 blur-3xl"
          style={{ background: `hsl(${hue3} 60% 40%)` }}
        />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(hsl(${hue1} 50% 80%) 1px, transparent 1px), linear-gradient(90deg, hsl(${hue1} 50% 80%) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }} />
        {/* Corner ornaments */}
        <div className="absolute top-2 left-3 text-[10px] opacity-20" style={{ color: "hsl(var(--filigree))" }}>⟐</div>
        <div className="absolute top-2 right-3 text-[10px] opacity-20" style={{ color: "hsl(var(--filigree))" }}>⟐</div>
        <div className="absolute bottom-2 left-3 text-[10px] opacity-20 rotate-180" style={{ color: "hsl(var(--filigree))" }}>⟐</div>
        <div className="absolute bottom-2 right-3 text-[10px] opacity-20 rotate-180" style={{ color: "hsl(var(--filigree))" }}>⟐</div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-8 sm:py-10">
          <motion.span
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", damping: 12 }}
            className="text-3xl mb-3"
          >
            📜
          </motion.span>
          <h3
            className="text-lg sm:text-xl font-bold text-foreground drop-shadow-lg"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {session.scenario.title}
          </h3>
          <p className="text-[11px] text-foreground/50 mt-1.5 max-w-md leading-relaxed">{session.scenario.description}</p>
          {/* Ornamental divider */}
          <div className="flex items-center gap-2 mt-3 opacity-30">
            <div className="h-px w-8" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--filigree)))" }} />
            <span className="text-[8px]" style={{ color: "hsl(var(--filigree))" }}>✦</span>
            <div className="h-px w-8" style={{ background: "linear-gradient(90deg, hsl(var(--filigree)), transparent)" }} />
          </div>
        </div>
      </motion.div>

      {/* Objectives — war scroll style */}
      {session.learningObjectives && session.learningObjectives.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl p-4 relative overflow-hidden"
          style={{
            background: "hsl(var(--surface-stone))",
            border: "1px solid hsl(var(--filigree) / 0.2)",
            boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 2px 8px hsl(var(--emboss-shadow))",
          }}
        >
          {/* Subtle parchment texture */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: "radial-gradient(circle at 50% 50%, hsl(var(--filigree)), transparent 70%)",
          }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">🎯</span>
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "hsl(var(--filigree))", fontFamily: "'Cinzel', serif" }}
              >
                {objectiveCount} Objectives to Conquer
              </span>
            </div>
            <div className="space-y-2.5">
              {session.learningObjectives.map((obj, i) => (
                <motion.div
                  key={obj.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex items-center gap-3 group"
                >
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold shrink-0"
                    style={{
                      background: "hsl(var(--primary) / 0.12)",
                      color: "hsl(var(--primary))",
                      border: "1px solid hsl(var(--primary) / 0.2)",
                      fontFamily: "'Cinzel', serif",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs font-medium text-foreground/90">{obj.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Mission Intel — collapsed by default, expandable */}
      <MissionIntelCollapsible briefing={session.briefing} tips={session.tips} />

      {/* CTA — dramatic battle button */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="flex justify-center pt-2"
      >
        <Button
          onClick={onStart}
          size="lg"
          className="relative gap-2.5 rounded-full px-10 py-3 text-sm font-bold overflow-hidden group"
          style={{
            fontFamily: "'Cinzel', serif",
            boxShadow: "0 0 20px hsl(var(--primary) / 0.25), 0 4px 12px hsl(var(--primary) / 0.15)",
          }}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <Scroll className="h-4 w-4" />
          Begin Quest
        </Button>
      </motion.div>
    </motion.div>
  );
};

/* ── Collapsible Mission Intel ── */
const MissionIntelCollapsible = ({ briefing, tips }: { briefing: string; tips?: any[] }) => {
  const [open, setOpen] = useState(false);
  const hasTips = tips && tips.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--surface-stone))",
        border: "1px solid hsl(var(--filigree) / 0.15)",
        boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">📜</span>
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "hsl(var(--filigree))", fontFamily: "'Cinzel', serif" }}
          >
            Mission Intel {hasTips ? "& Tips" : ""}
          </span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
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
            <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid hsl(var(--filigree) / 0.1)" }}>
              <div className="text-xs text-foreground/80 leading-relaxed pt-3 prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2">
                <ReactMarkdown>{briefing}</ReactMarkdown>
              </div>
              {hasTips && (
                <div className="space-y-1.5">
                  {tips!.map((tip: any, i: number) => {
                    const tipText = typeof tip === "string" ? tip : (tip.content || tip.title || JSON.stringify(tip));
                    return (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs mt-0.5">💡</span>
                        <span className="text-xs text-muted-foreground leading-relaxed">{tipText}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
            <div
              className="rounded-xl px-3 py-2.5 space-y-1.5 text-xs"
              style={{
                background: "hsl(var(--surface-stone))",
                border: "1px solid hsl(var(--filigree) / 0.15)",
                boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))",
              }}
            >
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
const SimulatorModal = ({ open, onClose, taskName, jobTitle, company, taskState, taskTrend, taskImpactLevel, mode = "assess", onCompleted, onNextTask, onBackToFeed, onViewTerritory, inline = false, guestMaxTurns, intelContext, onNextBattle, campaignStats }: SimulatorModalProps) => {
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
  const [objectiveFailCounts, setObjectiveFailCounts] = useState<Record<string, number>>({});
  const [showInactivityNudge, setShowInactivityNudge] = useState(false);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user, isPro } = useAuth();
  const toolMentionComponents = useToolMentionComponents();
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
        // Reset fail count on pass
        setObjectiveFailCounts(prev => ({ ...prev, [objId]: 0 }));
      } else if (result === "FAIL") {
        // Increment consecutive fail count for this objective
        setObjectiveFailCounts(prev => ({ ...prev, [objId]: (prev[objId] || 0) + 1 }));
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
    setObjectiveFailCounts({});
    setShowInactivityNudge(false);
    if (coaching) setCoachingContext(coaching);
    else setCoachingContext(null);
    try {
      const compiled = await compileSession(taskName, jobTitle, company, 3, mode, taskMeta, coaching ?? undefined, intelContext ?? undefined);
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
        currentTargetObjectiveId, objectiveFailCounts
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
    chatTurn(newMsgs, nextRound, nextTurn, jobTitle, mode, taskMeta, session?.learningObjectives, objectiveStatus, scaffoldingTiers, nextTargetId, objectiveFailCounts).then(reply => {
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

    // Compute skill XP earned using score-based formula
    const skillIds = matchTaskToSkills(taskName, jobTitle);
    const overallScore = scores?.overall ?? 50;
    const xpPerSkill = calculateSkillXP(overallScore, true); // treat every sim as new context for now
    const skillsEarnedData = skillIds.map(id => ({ skill_id: id, xp: xpPerSkill }));

    // For display: compute level changes
    const earned = skillIds.map(id => {
      const tax = SKILL_TAXONOMY.find(s => s.id === id);
      return {
        skill_id: id,
        xp: xpPerSkill,
        name: tax?.name || id,
        levelBefore: "Novice",
        levelAfter: "Novice",
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
        toast({ title: "Skills updated! 🎯", description: `+${xpPerSkill} XP in ${earned.map(e => e.name).join(", ")}`, action: <Button variant="link" className="text-xs p-0 h-auto" onClick={() => navigate("/map")}>Skill Map</Button> });
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
    return lower.includes("how would you approach") || lower.includes("how would you handle") || lower.includes("[scaffolding]") || lower.includes("[scaffold_tier:") || lower.includes("[needs_depth]") || lower.includes("[obj_eval:");
  })();

  // Strip tags from message text for display
  const cleanMessageForDisplay = (content: string): string => {
    return content
      .replace(/🤖\s*\*?\*?AI Today:?\*?\*?\s*.+/g, "")
      .replace(/💡\s*\*?\*?Human Edge:?\*?\*?\s*.+/g, "")
      .replace(/\[SCAFFOLDING\]/g, "")
      .replace(/\[OBJECTIVE_MET:[^\]]+\]/g, "")
      .replace(/\[OBJ_EVAL:[^\]]+\]/g, "")
      .replace(/\[SCAFFOLD_TIER:\d\]/g, "")
      .replace(/\[ALL_OBJECTIVES_MET\]/g, "")
      .replace(/\[NEEDS_DEPTH\]/g, "")
      .replace(/\[TARGET_OBJ:[^\]]+\]/g, "")
      // Put A) B) C) D) choices on separate lines for readability
      .replace(/\s*\*?\*?\b([A-D])\)\*?\*?\s/g, "\n\n**$1)** ")
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
        {/* Header — war room banner */}
        <div className="shrink-0 relative">
          {/* Subtle atmospheric gradient behind header */}
          <div className="absolute inset-0 opacity-40" style={{
            background: "linear-gradient(180deg, hsl(var(--primary) / 0.08) 0%, transparent 100%)",
          }} />
          <div
            className="relative flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4"
            style={{ borderBottom: "1px solid hsl(var(--filigree) / 0.25)" }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base">🗡️</span>
                <h2
                  className="text-sm sm:text-base font-semibold text-foreground truncate"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {taskName}
                </h2>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate pl-7">{jobTitle}{company ? ` · ${company}` : ""}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {phase === "chat" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{
                    background: "hsl(var(--surface-stone))",
                    border: "1px solid hsl(var(--filigree) / 0.25)",
                    boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))",
                  }}
                >
                  <Flame className="h-3 w-3" style={{ color: "hsl(var(--filigree-glow))" }} />
                  <span
                    className="text-xs font-bold"
                    style={{ color: "hsl(var(--filigree-glow))", fontFamily: "'Cinzel', serif" }}
                  >
                    Wave {roundCount}/{maxRounds}
                  </span>
                </motion.div>
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
            <div className="px-4 sm:px-6 py-1.5 relative" style={{ background: "hsl(var(--filigree) / 0.04)" }}>
              <div className="relative h-2 rounded-full overflow-hidden" style={{
                background: "hsl(var(--surface-stone))",
                border: "1px solid hsl(var(--filigree) / 0.15)",
              }}>
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))",
                    boxShadow: "0 0 8px hsl(var(--primary) / 0.4)",
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              {/* Ornamental corners on progress */}
              <div className="flex items-center justify-between mt-1 px-0.5">
                <span className="text-[8px] opacity-25" style={{ color: "hsl(var(--filigree))" }}>◆</span>
                <span className="text-[8px] opacity-25" style={{ color: "hsl(var(--filigree))" }}>◆</span>
              </div>
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
                  className="flex flex-col items-center justify-center h-full"
                >
                  <XcrowLoader size="sm" title="Forging your quest…" />
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
                    const topicChangeWords = ["yes", "yeah", "next", "new topic", "move on", "continue", "let's go", "skip"];
                    const userText = safeStr(prevMsg?.content || "").toLowerCase().trim();
                    const prevIsTopicChange = prevMsg?.role === "user" && topicChangeWords.some(w => {
                      // Exact match or starts with the word (e.g. "yes!" or "yeah let's go")
                      return userText === w || userText.startsWith(w + " ") || userText.startsWith(w + "!") || userText.startsWith(w + ",") || userText.startsWith(w + ".");
                    });
                    const hasScenarioMarker = !isUser && (displayContent.includes("📖 Scenario") || displayContent.includes("📖 **Scenario"));
                    const isNewScenario = !isUser && (prevIsTopicChange || hasScenarioMarker) && i > 1;
                    
                    const objectiveMetInMsg = !isUser ? [
                      ...(safeStr(msg.content).match(/\[OBJECTIVE_MET:([^\]]+)\]/g) || []).map(t => {
                        const m = t.match(/\[OBJECTIVE_MET:([^\]]+)\]/);
                        return m ? m[1] : null;
                      }),
                      ...(safeStr(msg.content).match(/\[OBJ_EVAL:([^:]+):PASS\]/g) || []).map(t => {
                        const m = t.match(/\[OBJ_EVAL:([^:]+):PASS\]/);
                        return m ? m[1] : null;
                      }),
                    ].filter(Boolean) : [];

                    // Detect scaffolding tier in message
                    const scaffoldTierInMsg = !isUser ? safeStr(msg.content).match(/\[SCAFFOLD_TIER:(\d)\]/) : null;
                    const tierLabels = ["", "💭 Let's break this down...", "💡 Here's a direction...", "📚 Teaching moment"];

                    return (
                      <>
                        {/* Scenario transition divider — RPG wave break */}
                        {isNewScenario && (
                          <motion.div
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            transition={{ duration: 0.4 }}
                            className="flex items-center gap-3 py-3"
                          >
                            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--filigree) / 0.4), transparent)" }} />
                            <span
                              className="text-[10px] font-bold flex items-center gap-1.5 shrink-0 px-3 py-1 rounded-full"
                              style={{
                                color: "hsl(var(--filigree-glow))",
                                background: "hsl(var(--filigree) / 0.08)",
                                border: "1px solid hsl(var(--filigree) / 0.2)",
                                fontFamily: "'Cinzel', serif",
                              }}
                            >
                              ⚡ New Wave
                            </span>
                            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--filigree) / 0.4), transparent)" }} />
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
                            <div
                              className="max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5"
                              style={{
                                background: "hsl(var(--primary) / 0.12)",
                                border: "1px solid hsl(var(--primary) / 0.25)",
                                boxShadow: "0 2px 8px hsl(var(--primary) / 0.08)",
                              }}
                            >
                              <p className="text-sm text-foreground">{displayContent}</p>
                            </div>
                          ) : (
                            <div
                              className="chat-prose max-w-[92%] rounded-2xl rounded-bl-md px-4 py-3 relative"
                              style={{
                                background: "hsl(var(--surface-stone))",
                                border: "1px solid hsl(var(--filigree) / 0.12)",
                                boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 2px 6px hsl(var(--emboss-shadow))",
                              }}
                            >
                              {/* Subtle parchment accent line */}
                              <div
                                className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full"
                                style={{ background: "hsl(var(--filigree) / 0.15)" }}
                              />
                              {(() => {
                                const isLatestAi = !isUser && i === messages.length - 1 && msg.role === "assistant";
                                // Also check if second-to-last and last is user (user just sent, AI hasn't replied yet — previous AI is "done")
                                const isRecentAi = !isUser && i === messages.length - 2 && messages[messages.length - 1]?.role === "user";
                                const shouldAnimate = isLatestAi && !isRecentAi;
                                if (shouldAnimate) {
                                  return <TypewriterMarkdown content={displayContent} speed={8} components={toolMentionComponents} />;
                                }
                                return <ReactMarkdown components={toolMentionComponents}>{displayContent}</ReactMarkdown>;
                              })()}
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
                    const allObjMet = session?.learningObjectives?.every(o => objectiveStatus[o.id]) ?? false;
                    
                    return (
                      <div className="flex flex-col gap-2 mt-3">
                        {allObjMet && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2 rounded-xl bg-success/10 border border-success/30 px-3 py-2 text-sm text-success font-medium"
                          >
                            <Trophy className="h-4 w-4" />
                            All objectives conquered! 🎉
                          </motion.div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2">
                          {!isLastRound && !isSessionEnd && !allObjMet && (
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
                                const nextTargetId = session?.learningObjectives?.find(o => !objectiveStatus[o.id])?.id;
                                chatTurn(newMsgs, nextRound, nextTurn, jobTitle, mode, taskMeta, session?.learningObjectives, objectiveStatus, scaffoldingTiers, nextTargetId).then(reply => {
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
                            <CheckCircle2 className="h-4 w-4" /> {isLastRound || isSessionEnd || allObjMet ? "📊 Battle Report" : "End Quest"}
                          </Button>
                        </div>
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
                  <div
                    className="rounded-2xl rounded-bl-md px-5 py-3.5"
                    style={{
                      background: "hsl(var(--surface-stone))",
                      border: "1px solid hsl(var(--filigree) / 0.12)",
                      boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full animate-bounce [animation-delay:0ms]" style={{ background: "hsl(var(--filigree) / 0.4)" }} />
                        <span className="w-2 h-2 rounded-full animate-bounce [animation-delay:150ms]" style={{ background: "hsl(var(--filigree) / 0.4)" }} />
                        <span className="w-2 h-2 rounded-full animate-bounce [animation-delay:300ms]" style={{ background: "hsl(var(--filigree) / 0.4)" }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground/50 ml-1" style={{ fontFamily: "'Cinzel', serif" }}>strategizing…</span>
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

                  {/* Intel Payoff */}
                  {intelContext && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="w-full rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-left"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Compass className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Intel Payoff</span>
                      </div>
                      {intelContext.hasFullIntel ? (
                        <div className="space-y-1.5">
                          {intelContext.threats?.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Your recon predicted <span className="text-foreground font-medium">{intelContext.threats.slice(0, 2).join(" & ")}</span> — you faced them and adapted.
                            </p>
                          )}
                          {intelContext.equippedSkills?.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Arsenal skills <span className="text-primary font-medium">{intelContext.equippedSkills.map(s => s.name).join(", ")}</span> were tested in battle.
                            </p>
                          )}
                          <p className="text-xs text-primary font-bold">Intel Advantage: +{Math.round(overallScore * 0.15)} bonus XP</p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          You fought blind. Next time, scan the horizon to gain tactical advantage.
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Weapons Forged (skills earned) */}
                  {earnedSkills.length > 0 && (
                    <div className="w-full">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Weapons Forged</span>
                      </div>
                      <div className="space-y-1.5">
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
                    </div>
                  )}

                  {/* Campaign Status */}
                  {campaignStats && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="w-full rounded-xl border border-border/40 bg-muted/30 p-3.5 text-left"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Flag className="h-3.5 w-3.5 text-foreground" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Campaign Status</span>
                      </div>
                      <div className="flex items-center gap-1 mb-1.5">
                        {Array.from({ length: campaignStats.total }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 flex-1 rounded-full ${i < campaignStats.conquered + 1 ? "bg-success" : "bg-muted/50"}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-foreground font-bold">{campaignStats.conquered + 1}</span>/{campaignStats.total} battles conquered
                        {campaignStats.conquered + 1 < campaignStats.total && " — next target awaits"}
                      </p>
                    </motion.div>
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
                        <RotateCcw className="h-4 w-4" /> 🔄 Retry with Battle Coach
                      </Button>
                    )}
                    {scoreTier === "mid" && onNextTask && (
                      <Button
                        onClick={() => { onClose(); onNextTask(); }}
                        className="gap-2 rounded-xl w-full h-11"
                      >
                        <TrendingUp className="h-4 w-4" /> 🔥 Level Up — Harder Wave
                      </Button>
                    )}
                    {scoreTier === "mid" && !onNextTask && (
                      <Button
                        onClick={() => startCompile()}
                        className="gap-2 rounded-xl w-full h-11"
                      >
                        <TrendingUp className="h-4 w-4" /> 💪 Train Again to Level Up
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

                    {/* Next Battle — return to kingdom chooser */}
                    {onNextBattle && campaignStats && campaignStats.conquered + 1 < campaignStats.total && (
                      <Button
                        variant="outline"
                        onClick={() => { onClose(); onNextBattle(); }}
                        className="gap-2 rounded-xl w-full text-xs"
                      >
                        <Swords className="h-3 w-3" /> ⚔️ Next Battle ({campaignStats.total - campaignStats.conquered - 1} remain)
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

        {/* Input bar — war room command panel */}
        {phase === "chat" && !error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="shrink-0 px-4 sm:px-6 py-3 space-y-3 pb-[env(safe-area-inset-bottom,12px)] relative"
            style={{
              borderTop: "1px solid hsl(var(--filigree) / 0.2)",
              background: "linear-gradient(180deg, hsl(var(--surface-stone)) 0%, hsl(var(--background)) 100%)",
            }}
          >
            {/* Ornamental top accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-30">
              <div className="h-px w-6" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--filigree)))" }} />
              <span className="text-[7px]" style={{ color: "hsl(var(--filigree))" }}>✦</span>
              <div className="h-px w-6" style={{ background: "linear-gradient(90deg, hsl(var(--filigree)), transparent)" }} />
            </div>

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
                    className="text-xs px-3 py-1.5 rounded-full animate-pulse transition-colors"
                    style={{
                      border: "1px solid hsl(var(--primary) / 0.3)",
                      background: "hsl(var(--primary) / 0.08)",
                      color: "hsl(var(--primary))",
                    }}
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
                  className="text-xs px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                  style={{ border: "1px solid hsl(var(--filigree) / 0.2)", background: "hsl(var(--surface-stone))" }}
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
                className="flex-1 resize-none rounded-xl px-3 sm:px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 min-h-[40px] max-h-[100px] transition-all duration-200"
                style={{
                  background: "hsl(var(--surface-stone))",
                  border: "1px solid hsl(var(--filigree) / 0.2)",
                  boxShadow: "inset 0 1px 3px hsl(var(--emboss-shadow))",
                }}
              />
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFinishAttempt}
                  className="text-xs text-muted-foreground hover:text-foreground h-[40px] px-3 rounded-xl"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                   End Quest
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || sending}
                  className="h-[40px] w-[40px] p-0 rounded-xl relative overflow-hidden group"
                  style={{ boxShadow: "0 0 10px hsl(var(--primary) / 0.2)" }}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
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
        <DialogContent
          className="max-w-3xl w-[95vw] h-[90vh] sm:h-[90vh] h-[100dvh] sm:rounded-2xl rounded-none p-0 flex flex-col overflow-hidden gap-0 [&>button]:hidden"
          style={{
            background: "hsl(var(--surface-stone))",
            border: "1px solid hsl(var(--filigree) / 0.25)",
            boxShadow: "0 0 60px hsl(var(--emboss-shadow)), inset 0 1px 0 hsl(var(--emboss-light))",
          }}
        >
          {content}
        </DialogContent>
      </Dialog>
      <UpgradeModal open={showUpgrade} onOpenChange={(v) => { setShowUpgrade(v); if (!v) onClose(); }} type="simulation" used={simGate.used} limit={simGate.limit} />
    </>
  );
};

export default SimulatorModal;
