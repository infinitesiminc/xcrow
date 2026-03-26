/**
 * GuardianTrial — 3-round A/B "Technique vs Technique" mini-boss challenge.
 * Pass 2/3 to conquer the territory.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Trophy, X, RotateCcw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { TerritoryGuardian } from "@/lib/territory-guardians";

interface TrialRound {
  scenario: string;
  optionA: string;
  optionB: string;
  correct: "A" | "B";
  explanation: string;
}

interface GuardianTrialProps {
  guardian: TerritoryGuardian;
  onClose: () => void;
  onVictory: (guardianId: string, category: string) => void;
}

const cinzel = { fontFamily: "'Cinzel', serif" };

export default function GuardianTrial({ guardian, onClose, onVictory }: GuardianTrialProps) {
  const [rounds, setRounds] = useState<TrialRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [selected, setSelected] = useState<"A" | "B" | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const hue = guardian.hue;

  useEffect(() => {
    loadTrial();
  }, [guardian.id]);

  async function loadTrial() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("guardian-trial", {
        body: {
          guardianId: guardian.id,
          category: guardian.category,
          guardianName: guardian.name,
          guardianTitle: guardian.title,
        },
      });
      if (fnError) throw fnError;
      if (!data?.rounds?.length) throw new Error("No rounds received");
      setRounds(data.rounds);
    } catch (e) {
      console.error("Failed to load trial:", e);
      setError("Failed to generate trial. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(choice: "A" | "B") {
    if (revealed) return;
    setSelected(choice);
    setRevealed(true);
    const round = rounds[currentRound];
    if (choice === round.correct) {
      setScore(s => s + 1);
    }
  }

  function handleNext() {
    if (currentRound + 1 >= rounds.length) {
      setFinished(true);
      const finalScore = score + (selected === rounds[currentRound]?.correct ? 0 : 0); // already counted
      if (finalScore >= 2) {
        onVictory(guardian.id, guardian.category);
      }
      return;
    }
    setCurrentRound(r => r + 1);
    setSelected(null);
    setRevealed(false);
  }

  const passed = score >= 2;
  const round = rounds[currentRound];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: `hsl(${hue} 20% 4% / 0.92)` }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        style={{ background: `hsl(${hue} 20% 12%)` }}
      >
        <X size={16} />
      </button>

      {/* Loading */}
      {loading && (
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 mx-auto rounded-full border-2 border-t-transparent"
            style={{ borderColor: `hsl(${hue} 45% 45%)`, borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: `hsl(${hue} 20% 60%)`, ...cinzel }}>
            {guardian.name} prepares the trial…
          </p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button onClick={loadTrial} variant="outline" className="gap-2">
            <RotateCcw size={14} /> Retry
          </Button>
        </div>
      )}

      {/* Finished */}
      {finished && !loading && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md mx-4 text-center space-y-6"
        >
          <motion.div
            animate={passed ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.6 }}
          >
            <div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl"
              style={{
                background: passed
                  ? `linear-gradient(135deg, hsl(${hue} 50% 30%), hsl(${hue} 60% 45%))`
                  : `hsl(0 30% 20%)`,
                boxShadow: passed ? `0 0 40px hsl(${hue} 60% 40% / 0.5)` : "none",
              }}
            >
              {passed ? <Trophy className="text-white" size={36} /> : "💀"}
            </div>
          </motion.div>

          <h2 className="text-2xl font-bold" style={{ ...cinzel, color: passed ? `hsl(${hue} 45% 72%)` : `hsl(0 40% 65%)` }}>
            {passed ? "Territory Conquered!" : "Trial Failed"}
          </h2>

          <p className="text-sm" style={{ color: `hsl(${hue} 15% 65%)` }}>
            {passed
              ? `${guardian.name} bows. "You have proven your worth. This territory is yours."`
              : `${guardian.name} shakes their head. "Return when you have learned more, adventurer."`
            }
          </p>

          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: `hsl(${hue} 20% 12%)`,
              color: `hsl(${hue} 30% 70%)`,
              border: `1px solid hsl(${hue} 25% 22%)`,
            }}
          >
            Score: {score}/{rounds.length}
          </div>

          <div className="flex gap-3 justify-center">
            {!passed && (
              <Button
                onClick={() => {
                  setFinished(false);
                  setCurrentRound(0);
                  setScore(0);
                  setSelected(null);
                  setRevealed(false);
                  loadTrial();
                }}
                className="gap-2"
                style={{
                  background: `linear-gradient(135deg, hsl(${hue} 45% 30%), hsl(${hue} 55% 40%))`,
                  color: "white",
                }}
              >
                <RotateCcw size={14} /> Try Again
              </Button>
            )}
            <Button onClick={onClose} variant="outline" style={{ borderColor: `hsl(${hue} 25% 25%)`, color: `hsl(${hue} 25% 60%)` }}>
              {passed ? "Return to Map" : "Walk Away"}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Active round */}
      {!loading && !error && !finished && round && (
        <motion.div
          key={currentRound}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          className="max-w-lg mx-4 space-y-5"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <span
              className="text-[10px] uppercase tracking-[0.2em] font-medium"
              style={{ color: `hsl(${hue} 35% 50%)` }}
            >
              {guardian.name}'s Trial — Round {currentRound + 1} of {rounds.length}
            </span>
            <div className="flex justify-center gap-2">
              {rounds.map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-1 rounded-full transition-colors"
                  style={{
                    background: i < currentRound
                      ? `hsl(${hue} 50% 50%)`
                      : i === currentRound
                      ? `hsl(${hue} 45% 40%)`
                      : `hsl(${hue} 15% 20%)`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Scenario */}
          <div
            className="rounded-xl p-5 text-sm leading-relaxed"
            style={{
              background: `hsl(${hue} 18% 10% / 0.8)`,
              border: `1px solid hsl(${hue} 25% 20%)`,
              color: `hsl(${hue} 10% 82%)`,
            }}
          >
            <Swords size={14} className="inline mr-2 opacity-60" style={{ color: `hsl(${hue} 40% 55%)` }} />
            {round.scenario}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {(["A", "B"] as const).map((opt) => {
              const text = opt === "A" ? round.optionA : round.optionB;
              const isCorrect = opt === round.correct;
              const isSelected = selected === opt;

              let borderColor = `hsl(${hue} 20% 22%)`;
              let bg = `hsl(${hue} 15% 9%)`;
              if (revealed && isCorrect) {
                borderColor = `hsl(140 50% 40%)`;
                bg = `hsl(140 30% 12%)`;
              } else if (revealed && isSelected && !isCorrect) {
                borderColor = `hsl(0 50% 40%)`;
                bg = `hsl(0 30% 12%)`;
              } else if (isSelected && !revealed) {
                borderColor = `hsl(${hue} 45% 45%)`;
                bg = `hsl(${hue} 25% 14%)`;
              }

              return (
                <motion.button
                  key={opt}
                  whileHover={!revealed ? { scale: 1.01 } : {}}
                  whileTap={!revealed ? { scale: 0.99 } : {}}
                  onClick={() => handleSelect(opt)}
                  disabled={revealed}
                  className="w-full text-left rounded-xl p-4 transition-all flex gap-3 items-start"
                  style={{ background: bg, border: `2px solid ${borderColor}` }}
                >
                  <span
                    className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5"
                    style={{
                      background: `hsl(${hue} 25% 16%)`,
                      color: `hsl(${hue} 35% 60%)`,
                    }}
                  >
                    {opt}
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: `hsl(${hue} 10% 78%)` }}>
                    {text}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Explanation + Next */}
          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div
                  className="rounded-lg p-4 text-xs leading-relaxed"
                  style={{
                    background: `hsl(${hue} 15% 10% / 0.6)`,
                    borderLeft: `3px solid hsl(${selected === round.correct ? 140 : 0} 45% 45%)`,
                    color: `hsl(${hue} 10% 72%)`,
                  }}
                >
                  {selected === round.correct ? "✅ " : "❌ "}
                  {round.explanation}
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleNext}
                    className="gap-2"
                    style={{
                      background: `linear-gradient(135deg, hsl(${hue} 45% 32%), hsl(${hue} 55% 42%))`,
                      color: "white",
                    }}
                  >
                    {currentRound + 1 >= rounds.length ? "See Results" : "Next Round"}
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
