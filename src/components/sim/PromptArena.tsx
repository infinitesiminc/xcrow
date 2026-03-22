import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, CheckCircle2, XCircle, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import TypewriterMarkdown from "@/components/TypewriterMarkdown";

export interface ArenaRound {
  scenario_context: string;
  prompt_a: { label: string; technique: string; full_prompt: string; tool: string };
  prompt_b: { label: string; technique: string; full_prompt: string; tool: string };
  output_a: string;
  output_b: string;
  better: "a" | "b";
  explanation: string;
  insight: string;
  target_objective_id: string | null;
}

interface PromptArenaProps {
  round: ArenaRound;
  roundNumber: number;
  onJudged: (correct: boolean, objectiveId: string | null) => void;
  loading?: boolean;
}

type ArenaPhase = "scenario" | "streaming" | "judge" | "result";

const PromptArena = ({ round, roundNumber, onJudged, loading }: PromptArenaProps) => {
  const [phase, setPhase] = useState<ArenaPhase>("scenario");
  const [revealedA, setRevealedA] = useState("");
  const [revealedB, setRevealedB] = useState("");
  const [picked, setPicked] = useState<"a" | "b" | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const timerA = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerB = useRef<ReturnType<typeof setInterval> | null>(null);
  const idxA = useRef(0);
  const idxB = useRef(0);

  // Reset on new round
  useEffect(() => {
    setPhase("scenario");
    setRevealedA("");
    setRevealedB("");
    setPicked(null);
    setCorrect(null);
    idxA.current = 0;
    idxB.current = 0;
  }, [round]);

  // Start streaming when phase is streaming
  useEffect(() => {
    if (phase !== "streaming") return;

    const chunkSize = 3;
    const interval = 15;

    timerA.current = setInterval(() => {
      idxA.current = Math.min(idxA.current + chunkSize, round.output_a.length);
      setRevealedA(round.output_a.slice(0, idxA.current));
      if (idxA.current >= round.output_a.length && timerA.current) {
        clearInterval(timerA.current);
      }
    }, interval);

    timerB.current = setInterval(() => {
      idxB.current = Math.min(idxB.current + chunkSize, round.output_b.length);
      setRevealedB(round.output_b.slice(0, idxB.current));
      if (idxB.current >= round.output_b.length && timerB.current) {
        clearInterval(timerB.current);
      }
    }, interval + 5); // Slightly offset for visual variety

    // Auto-transition to judge after both done
    const checkDone = setInterval(() => {
      if (idxA.current >= round.output_a.length && idxB.current >= round.output_b.length) {
        clearInterval(checkDone);
        setTimeout(() => setPhase("judge"), 600);
      }
    }, 100);

    return () => {
      if (timerA.current) clearInterval(timerA.current);
      if (timerB.current) clearInterval(timerB.current);
      clearInterval(checkDone);
    };
  }, [phase, round]);

  const handlePick = (choice: "a" | "b") => {
    setPicked(choice);
    const isCorrect = choice === round.better;
    setCorrect(isCorrect);
    setPhase("result");
  };

  const handleContinue = () => {
    onJudged(correct!, round.target_objective_id);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Round Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 py-2"
      >
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--filigree) / 0.4), transparent)" }} />
        <span
          className="text-sm font-semibold uppercase tracking-[0.15em] px-4 py-1.5 rounded-full"
          style={{
            color: "hsl(var(--filigree-glow))",
            background: "hsl(var(--filigree) / 0.08)",
            border: "1px solid hsl(var(--filigree) / 0.15)",
            fontFamily: "'Cinzel', serif",
          }}
        >
          ⚔️ Prompt Arena · Round {roundNumber}
        </span>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--filigree) / 0.4), transparent)" }} />
      </motion.div>

      {/* Scenario Context */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-4"
        style={{
          background: "hsl(var(--surface-stone))",
          border: "1px solid hsl(var(--filigree) / 0.2)",
          boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))",
        }}
      >
        <div className="flex items-start gap-3">
          <span className="text-lg mt-0.5">📖</span>
          <div>
            <p className="text-sm font-semibold text-foreground/90 mb-1.5" style={{ fontFamily: "'Cinzel', serif" }}>Scenario</p>
            <p className="text-[15px] text-foreground/80 leading-relaxed">{round.scenario_context}</p>
          </div>
        </div>
      </motion.div>

      {/* Two Prompt Cards — always visible */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(["a", "b"] as const).map((side) => {
          const prompt = side === "a" ? round.prompt_a : round.prompt_b;
          const output = side === "a" ? revealedA : revealedB;
          const fullOutput = side === "a" ? round.output_a : round.output_b;
          const isBetter = round.better === side;
          const isPicked = picked === side;
          const showResult = phase === "result";

          return (
            <motion.div
              key={side}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: side === "a" ? 0.1 : 0.2 }}
              className="rounded-xl overflow-hidden flex flex-col"
              style={{
                border: showResult
                  ? isPicked
                    ? correct
                      ? "2px solid hsl(142 71% 45% / 0.6)"
                      : "2px solid hsl(0 84% 60% / 0.5)"
                    : isBetter
                      ? "2px solid hsl(142 71% 45% / 0.4)"
                      : "1px solid hsl(var(--filigree) / 0.15)"
                  : "1px solid hsl(var(--filigree) / 0.2)",
                background: "hsl(var(--surface-stone))",
                boxShadow: showResult && isBetter
                  ? "0 0 20px hsl(142 71% 45% / 0.1)"
                  : "inset 0 1px 0 hsl(var(--emboss-light))",
              }}
            >
              {/* Prompt Header */}
              <div className="px-4 py-3" style={{ borderBottom: "1px solid hsl(var(--filigree) / 0.1)" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--primary))" }}>
                    {side === "a" ? "Prompt A" : "Prompt B"}
                  </span>
                  <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted/50">{prompt.tool}</span>
                </div>
                <p className="text-sm font-medium text-foreground/80">{prompt.label}</p>
                <p className="text-xs text-muted-foreground mt-1">Technique: {prompt.technique}</p>
              </div>

              {/* The Actual Prompt */}
              <div className="px-4 py-3" style={{ background: "hsl(var(--primary) / 0.04)", borderBottom: "1px solid hsl(var(--filigree) / 0.08)" }}>
                <p className="text-[13px] text-foreground/70 italic leading-relaxed">"{prompt.full_prompt}"</p>
              </div>

              {/* AI Output — streamed or full */}
              {(phase === "streaming" || phase === "judge" || phase === "result") && (
                <div className="px-4 py-3 flex-1 min-h-[120px] max-h-[260px] overflow-y-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-3.5 w-3.5" style={{ color: "hsl(var(--filigree-glow))" }} />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AI Output</span>
                  </div>
                  <div className="text-[13px] text-foreground/80 leading-relaxed prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2">
                    {phase === "streaming" ? (
                      <ReactMarkdown>{output || "..."}</ReactMarkdown>
                    ) : (
                      <ReactMarkdown>{fullOutput}</ReactMarkdown>
                    )}
                  </div>
                </div>
              )}

              {/* Result badge */}
              {showResult && (
                <div className={`px-4 py-2.5 flex items-center gap-2 text-sm font-medium ${
                  isBetter ? "text-success bg-success/5" : "text-muted-foreground bg-muted/30"
                }`}>
                  {isBetter ? <CheckCircle2 className="h-4 w-4" /> : null}
                  {isBetter ? "Better approach" : "Less effective"}
                  {isPicked && (
                    <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded" style={{
                      background: correct ? "hsl(142 71% 45% / 0.15)" : "hsl(0 84% 60% / 0.15)",
                      color: correct ? "hsl(142 71% 45%)" : "hsl(0 84% 60%)",
                    }}>
                      Your pick
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Phase: Scenario — start button */}
      {phase === "scenario" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center pt-2">
          <Button
            onClick={() => setPhase("streaming")}
            className="gap-2 rounded-full px-8"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            <Zap className="h-4 w-4" /> Run Both Prompts
          </Button>
        </motion.div>
      )}

      {/* Phase: Streaming — watching indicator */}
      {phase === "streaming" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 py-2"
        >
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full animate-bounce [animation-delay:0ms]" style={{ background: "hsl(var(--primary) / 0.5)" }} />
            <span className="w-2 h-2 rounded-full animate-bounce [animation-delay:150ms]" style={{ background: "hsl(var(--primary) / 0.5)" }} />
            <span className="w-2 h-2 rounded-full animate-bounce [animation-delay:300ms]" style={{ background: "hsl(var(--primary) / 0.5)" }} />
          </div>
          <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Cinzel', serif" }}>AI is generating…</span>
        </motion.div>
      )}

      {/* Phase: Judge — pick which is better */}
      {phase === "judge" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="text-center">
            <p className="text-base font-semibold text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
              🤔 Which prompt produced the better result?
            </p>
            <p className="text-sm text-muted-foreground mt-1.5">Consider quality, relevance, and usefulness of the output</p>
          </div>
          <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => handlePick("a")}
                className="flex-1 max-w-[220px] rounded-xl h-12 text-sm gap-2 hover:border-primary/50 hover:bg-primary/5"
              >
                <span className="font-bold text-primary">A</span> {round.prompt_a.label}
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePick("b")}
                className="flex-1 max-w-[220px] rounded-xl h-12 text-sm gap-2 hover:border-primary/50 hover:bg-primary/5"
              >
                <span className="font-bold text-primary">B</span> {round.prompt_b.label}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Phase: Result — show explanation */}
      {phase === "result" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Correct/Incorrect banner */}
          <div className={`rounded-xl px-4 py-3 flex items-start gap-3 ${
            correct ? "bg-success/5 border border-success/30" : "bg-destructive/5 border border-destructive/30"
          }`}>
            {correct ? (
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`text-sm font-semibold ${correct ? "text-success" : "text-destructive"}`}>
                {correct ? "Excellent judgment! ✨" : "Not quite — here's why:"}
              </p>
              <p className="text-xs text-foreground/80 mt-1 leading-relaxed">{round.explanation}</p>
            </div>
          </div>

          {/* Key Insight */}
          <div
            className="rounded-xl px-4 py-3"
            style={{
              background: "hsl(var(--primary) / 0.05)",
              border: "1px solid hsl(var(--primary) / 0.2)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Key Insight</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">{round.insight}</p>
          </div>

          {/* Continue */}
          <div className="flex justify-center pt-1">
            <Button
              onClick={handleContinue}
              className="gap-2 rounded-full px-8"
              style={{ fontFamily: "'Cinzel', serif" }}
              disabled={loading}
            >
              {loading ? "Loading next…" : "Next Round"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PromptArena;
