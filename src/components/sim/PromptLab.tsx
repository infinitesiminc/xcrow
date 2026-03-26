/**
 * PromptLab — Sandbox simulation where users write prompts
 * and get AI evaluation on a 4-dimension rubric.
 *
 * Difficulty levels: guided → semi-open → open
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, RotateCcw, ChevronRight, Sparkles, Target,
  Lightbulb, PenTool, CheckCircle2, ArrowRight, Trophy, History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Difficulty = "guided" | "semi-open" | "open";

interface Scenario {
  title: string;
  context: string;
  task: string;
  hint: string;
  ideal_techniques: string[];
}

interface Evaluation {
  score_clarity: number;
  score_specificity: number;
  score_technique: number;
  score_output_quality: number;
  feedback: string;
  improved_prompt: string;
}

export interface PromptLabResult {
  totalScore: number;
  clarity: number;
  specificity: number;
  technique: number;
  outputQuality: number;
  feedback: string;
}

interface PromptLabProps {
  open: boolean;
  onClose: () => void;
  skillId: string;
  skillName: string;
  skillCategory: string;
  /** Best previous total score for this skill, to determine starting difficulty */
  bestPrevScore?: number;
  /** When true, renders without its own modal wrapper (embedded in SimulatorModal) */
  embedded?: boolean;
  /** Called when user completes a prompt evaluation in embedded mode */
  onComplete?: (result: PromptLabResult) => void;
}

const DIFFICULTY_META: Record<Difficulty, { label: string; emoji: string; desc: string }> = {
  guided: { label: "Guided", emoji: "🟢", desc: "Hints provided — learn the basics" },
  "semi-open": { label: "Semi-Open", emoji: "🟡", desc: "No hints — choose your technique" },
  open: { label: "Open", emoji: "🔴", desc: "Real-world challenge — full autonomy" },
};

function getDifficulty(bestScore?: number): Difficulty {
  if (!bestScore || bestScore < 60) return "guided";
  if (bestScore < 80) return "semi-open";
  return "open";
}

type Phase = "loading" | "scenario" | "writing" | "evaluating" | "result";

export default function PromptLab({
  open, onClose, skillId, skillName, skillCategory, bestPrevScore, embedded, onComplete,
}: PromptLabProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("loading");
  const [difficulty, setDifficulty] = useState<Difficulty>(() => getDifficulty(bestPrevScore));
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [showImproved, setShowImproved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Generate scenario on open
  const generateScenario = useCallback(async () => {
    if (!user) return;
    setPhase("loading");
    setUserPrompt("");
    setEvaluation(null);
    setShowImproved(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("prompt-lab", {
        body: {
          action: "generate-scenario",
          skillName,
          skillCategory,
          difficulty,
        },
      });

      if (res.error) throw new Error(res.error.message);
      setScenario(res.data);
      setPhase("scenario");
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed to generate scenario", description: err.message, variant: "destructive" });
      onClose();
    }
  }, [user, skillName, skillCategory, difficulty]);

  useEffect(() => {
    if (open && user) generateScenario();
  }, [open, user, difficulty]);

  // Evaluate user prompt
  const submitPrompt = async () => {
    if (!user || !scenario || !userPrompt.trim()) return;
    setPhase("evaluating");

    try {
      const res = await supabase.functions.invoke("prompt-lab", {
        body: {
          action: "evaluate-prompt",
          skillId,
          skillName,
          difficulty,
          scenarioPrompt: `${scenario.context}\n\n${scenario.task}`,
          userPrompt: userPrompt.trim(),
          idealTechniques: scenario.ideal_techniques,
        },
      });

      if (res.error) throw new Error(res.error.message);
      const evalData = res.data as Evaluation;
      setEvaluation(evalData);
      setPhase("result");

      // Fire embedded completion callback
      if (onComplete && evalData) {
        onComplete({
          totalScore: evalData.score_clarity + evalData.score_specificity + evalData.score_technique + evalData.score_output_quality,
          clarity: evalData.score_clarity,
          specificity: evalData.score_specificity,
          technique: evalData.score_technique,
          outputQuality: evalData.score_output_quality,
          feedback: evalData.feedback,
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: "Evaluation failed", description: err.message, variant: "destructive" });
      setPhase("writing");
    }
  };

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("prompt_attempts")
      .select("*")
      .eq("user_id", user.id)
      .eq("skill_id", skillId)
      .order("created_at", { ascending: false })
      .limit(10);
    setHistory(data || []);
  }, [user, skillId]);

  useEffect(() => {
    if (showHistory) fetchHistory();
  }, [showHistory, fetchHistory]);

  if (!open) return null;

  const totalScore = evaluation
    ? evaluation.score_clarity + evaluation.score_specificity + evaluation.score_technique + evaluation.score_output_quality
    : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PenTool className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">Prompt Lab</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                {DIFFICULTY_META[difficulty].emoji} {DIFFICULTY_META[difficulty].label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <History className="h-4 w-4 text-muted-foreground" />
              </button>
              <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
          </div>

          <div className="p-5">
            {/* History panel */}
            {showHistory && (
              <HistoryPanel history={history} onClose={() => setShowHistory(false)} />
            )}

            {!showHistory && (
              <>
                {/* Loading */}
                {phase === "loading" && (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Crafting your scenario…</p>
                  </div>
                )}

                {/* Scenario briefing */}
                {(phase === "scenario" || phase === "writing") && scenario && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-foreground mb-1">{scenario.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{scenario.context}</p>
                    </div>

                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">Your Task</span>
                      </div>
                      <p className="text-sm text-foreground">{scenario.task}</p>
                    </div>

                    {scenario.hint && difficulty === "guided" && (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Hint</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{scenario.hint}</p>
                      </div>
                    )}

                    {scenario.ideal_techniques.length > 0 && difficulty !== "open" && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {scenario.ideal_techniques.map((t) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Prompt input */}
                    <div className="space-y-3">
                      <Textarea
                        value={userPrompt}
                        onChange={(e) => { setUserPrompt(e.target.value); if (phase === "scenario") setPhase("writing"); }}
                        placeholder="Write your prompt here…"
                        className="min-h-[120px] text-sm resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          {userPrompt.length} chars
                        </span>
                        <Button
                          size="sm"
                          className="gap-1.5 rounded-full"
                          disabled={userPrompt.trim().length < 10}
                          onClick={submitPrompt}
                        >
                          <Send className="h-3.5 w-3.5" /> Submit
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Evaluating */}
                {phase === "evaluating" && (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                    <p className="text-sm text-muted-foreground">Evaluating your prompt…</p>
                  </div>
                )}

                {/* Result */}
                {phase === "result" && evaluation && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    {/* Score ring */}
                    <div className="flex items-center gap-4">
                      <ScoreRing score={totalScore} />
                      <div>
                        <p className="text-lg font-bold text-foreground">
                          {totalScore >= 80 ? "🏆 Excellent!" : totalScore >= 60 ? "⚡ Good work!" : totalScore >= 40 ? "📈 Getting there" : "🌱 Keep practicing"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {totalScore}/100 — {DIFFICULTY_META[difficulty].label} difficulty
                        </p>
                      </div>
                    </div>

                    {/* 4 rubric bars */}
                    <div className="space-y-2">
                      <RubricBar label="Clarity" score={evaluation.score_clarity} />
                      <RubricBar label="Specificity" score={evaluation.score_specificity} />
                      <RubricBar label="Technique" score={evaluation.score_technique} />
                      <RubricBar label="Output Quality" score={evaluation.score_output_quality} />
                    </div>

                    {/* Feedback */}
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
                      <p className="text-xs font-semibold text-foreground mb-1">Feedback</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{evaluation.feedback}</p>
                    </div>

                    {/* Show improved prompt */}
                    <button
                      onClick={() => setShowImproved(!showImproved)}
                      className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                    >
                      <ChevronRight className={`h-3 w-3 transition-transform ${showImproved ? "rotate-90" : ""}`} />
                      {showImproved ? "Hide" : "Show"} improved prompt
                    </button>

                    {showImproved && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="rounded-xl border border-primary/20 bg-primary/5 p-3"
                      >
                        <p className="text-xs font-semibold text-primary mb-1">✨ Improved Version</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {evaluation.improved_prompt}
                        </p>
                      </motion.div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={generateScenario}>
                        <RotateCcw className="h-3.5 w-3.5" /> New Scenario
                      </Button>
                      {totalScore >= 60 && difficulty !== "open" && (
                        <Button
                          size="sm"
                          className="gap-1.5 rounded-full"
                          onClick={() => {
                            setDifficulty(difficulty === "guided" ? "semi-open" : "open");
                          }}
                        >
                          <ArrowRight className="h-3.5 w-3.5" /> Level Up
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="rounded-full ml-auto" onClick={onClose}>
                        Done
                      </Button>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Sub-components ── */

function ScoreRing({ score }: { score: number }) {
  const size = 64;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const color = score >= 80 ? "hsl(var(--success))" : score >= 60 ? "hsl(var(--primary))" : score >= 40 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-foreground tabular-nums">{score}</span>
      </div>
    </div>
  );
}

function RubricBar({ label, score }: { label: string; score: number }) {
  const pct = (score / 25) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className="text-[11px] font-semibold text-foreground tabular-nums w-8 text-right">{score}/25</span>
    </div>
  );
}

function HistoryPanel({ history, onClose }: { history: any[]; onClose: () => void }) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No attempts yet</p>
        <Button size="sm" variant="ghost" className="mt-3" onClick={onClose}>
          Back to Lab
        </Button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-foreground">Past Attempts</h3>
        <button onClick={onClose} className="text-xs text-primary font-semibold hover:underline">
          Back to Lab
        </button>
      </div>

      {/* Improvement trend */}
      {history.length >= 2 && (
        <div className="rounded-xl border border-border/50 bg-muted/30 p-3 mb-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Trend</p>
          <div className="flex items-center gap-2">
            {history.slice(0, 5).reverse().map((a, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full rounded-sm bg-primary"
                  style={{ height: `${Math.max(4, (a.total_score / 100) * 40)}px` }}
                />
                <span className="text-[9px] text-muted-foreground mt-0.5">{a.total_score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.map((attempt) => (
        <div key={attempt.id} className="rounded-xl border border-border/50 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">
              {new Date(attempt.created_at).toLocaleDateString()} · {attempt.difficulty}
            </span>
            <span className="text-xs font-bold text-foreground">{attempt.total_score}/100</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{attempt.user_prompt}</p>
          <div className="flex gap-2 mt-2">
            <MiniBar label="C" score={attempt.score_clarity} />
            <MiniBar label="S" score={attempt.score_specificity} />
            <MiniBar label="T" score={attempt.score_technique} />
            <MiniBar label="Q" score={attempt.score_output_quality} />
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function MiniBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] text-muted-foreground">{label}</span>
      <div className="w-8 h-1 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full bg-primary" style={{ width: `${(score / 25) * 100}%` }} />
      </div>
    </div>
  );
}
