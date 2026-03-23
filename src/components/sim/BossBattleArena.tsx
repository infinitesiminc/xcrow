/**
 * BossBattleArena — Full-screen no-scroll boss battle layout.
 * User avatar (left) vs Boss monster (right) with power bars.
 * Each round fades in/out dramatically.
 */
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, CheckCircle2, Sparkles, Eye, Trophy, ChevronRight, RotateCcw, Swords,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BossMonster, { type BossState } from "./BossMonster";
import BossCinematicIntro from "./BossCinematicIntro";
import { useAuth } from "@/contexts/AuthContext";
import { getAvatarById, AVATAR_OPTIONS } from "@/lib/avatars";
import type { AuditCheckpoint, AuditVerdict, AuditResult } from "./GuidedAudit";

/* ── Verdict button config ── */
const VERDICT_CONFIG = {
  safe: {
    emoji: "🟢", label: "Safe", icon: "🛡️",
    bg: "hsl(142 60% 50% / 0.15)", border: "hsl(142 60% 50% / 0.4)",
    text: "hsl(142 60% 50%)", glow: "0 0 12px hsl(142 60% 50% / 0.2)",
  },
  risky: {
    emoji: "🟡", label: "Risky", icon: "👁️",
    bg: "hsl(45 80% 55% / 0.15)", border: "hsl(45 80% 55% / 0.4)",
    text: "hsl(45 80% 55%)", glow: "0 0 12px hsl(45 80% 55% / 0.2)",
  },
  critical: {
    emoji: "🔴", label: "Critical", icon: "💀",
    bg: "hsl(0 60% 55% / 0.15)", border: "hsl(0 60% 55% / 0.4)",
    text: "hsl(0 60% 55%)", glow: "0 0 12px hsl(0 60% 55% / 0.2)",
  },
} as const;

/* ── Power Bar ── */
function PowerBar({ value, max, color, label, side }: {
  value: number; max: number; color: string; label: string; side: "left" | "right";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`flex flex-col ${side === "right" ? "items-end" : "items-start"} gap-1`}>
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: "'Cinzel', serif", color }}>
        {label}
      </span>
      <div className="w-28 sm:w-36 h-3 rounded-full overflow-hidden" style={{ background: "hsl(262 30% 12%)", border: "1px solid hsl(262 40% 25%)" }}>
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            background: `linear-gradient(90deg, ${color}, ${color}dd)`,
            boxShadow: `0 0 8px ${color}50`,
            transformOrigin: side === "right" ? "right" : "left",
          }}
        />
      </div>
      <span className="text-[9px] font-mono text-muted-foreground">{Math.round(pct)}%</span>
    </div>
  );
}

/* ── User Champion ── */
function UserChampion({ avatarSrc, power, maxPower }: { avatarSrc: string; power: number; maxPower: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <PowerBar value={power} max={maxPower} color="hsl(195 90% 55%)" label="Champion" side="left" />
      <motion.div
        className="relative"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Aura ring */}
        <motion.div
          className="absolute -inset-3 rounded-full"
          animate={{ opacity: [0.15, 0.3, 0.15], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ background: "radial-gradient(circle, hsl(195 90% 55% / 0.3), transparent 70%)" }}
        />
        {/* Avatar */}
        <div
          className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden"
          style={{
            border: "2px solid hsl(195 90% 55% / 0.6)",
            boxShadow: "0 0 20px hsl(195 90% 55% / 0.3), inset 0 0 10px hsl(195 90% 55% / 0.1)",
          }}
        >
          <img src={avatarSrc} alt="Champion" className="w-full h-full object-cover" />
        </div>
        {/* Sword overlay */}
        <div className="absolute -bottom-1 -right-1 text-sm">⚔️</div>
      </motion.div>
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: "'Cinzel', serif", color: "hsl(195 90% 55%)" }}>
        You
      </span>
    </div>
  );
}

/* ── Arena Props ── */
interface BossBattleArenaProps {
  checkpoints: AuditCheckpoint[];
  aiOutputSummary: string;
  aiAutoAction: string;
  scenarioContext?: string;
  onComplete?: (result: AuditResult) => void;
  onRestart?: () => void;
  onViewDebrief?: () => void;
  skillName?: string;
}

/* ── Main Arena ── */
export default function BossBattleArena({
  checkpoints,
  aiOutputSummary,
  aiAutoAction,
  onComplete,
  onRestart,
  onViewDebrief,
  skillName,
}: BossBattleArenaProps) {
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [verdicts, setVerdicts] = useState<Record<string, AuditVerdict>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  // Boss HP
  const maxHp = checkpoints.length * 20;
  const [bossHp, setBossHp] = useState(maxHp);
  const [bossState, setBossState] = useState<BossState>("idle");
  const bossStateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // User power (starts at max, decreases on wrong answers)
  const userMaxPower = checkpoints.length * 20;
  const [userPower, setUserPower] = useState(userMaxPower);

  // Avatar
  const avatarOption = getAvatarById(profile?.avatarId) || AVATAR_OPTIONS[0];

  const checkpoint = checkpoints[currentStep];
  const totalCorrect = checkpoints.filter(cp => verdicts[cp.id] === cp.correctVerdict).length;
  const hintsUsed = Object.values(showHint).filter(Boolean).length;

  const handleBossReaction = useCallback((isCorrect: boolean) => {
    if (bossStateTimer.current) clearTimeout(bossStateTimer.current);
    if (isCorrect) {
      setBossHp(prev => Math.max(0, prev - 20));
      setBossState("damaged");
    } else {
      setBossHp(prev => Math.min(maxHp, prev + 10));
      setUserPower(prev => Math.max(0, prev - 15));
      setBossState("enraged");
    }
    bossStateTimer.current = setTimeout(() => setBossState("idle"), 1800);
  }, [maxHp]);

  const handleVerdict = (id: string, verdict: AuditVerdict) => {
    setVerdicts(prev => ({ ...prev, [id]: verdict }));
  };

  const handleReveal = (id: string) => {
    setRevealed(prev => ({ ...prev, [id]: true }));
    const cp = checkpoints.find(c => c.id === id);
    if (cp) handleBossReaction(verdicts[id] === cp.correctVerdict);
  };

  const handleNext = () => {
    if (currentStep < checkpoints.length - 1) {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setTransitioning(false);
      }, 600);
    } else {
      setCompleted(true);
      setBossState("defeated");
      onComplete?.({
        totalCorrect,
        totalCheckpoints: checkpoints.length,
        hintsUsed,
        verdicts,
        rubricScores: computeRubricScores(),
      });
    }
  };

  const computeRubricScores = useCallback((): Record<string, { score: number; note: string }> => {
    const r = totalCorrect / checkpoints.length;
    const hintPenalty = hintsUsed * 5;
    return {
      risk_awareness: { score: Math.max(0, Math.round(r * 100) - hintPenalty), note: "" },
      strategic_depth: { score: totalCorrect >= Math.ceil(checkpoints.length * 0.6) ? 75 : 50, note: "" },
      human_value: { score: 80, note: "" },
      actionability: { score: Math.max(0, 65 - hintPenalty), note: "" },
    };
  }, [totalCorrect, checkpoints.length, hintsUsed]);

  /* ── Cinematic Intro ── */
  if (showIntro) {
    return (
      <div className="absolute inset-0 z-50">
        <BossCinematicIntro
          skillName={skillName || "Unknown Skill"}
          onComplete={() => setShowIntro(false)}
        />
      </div>
    );
  }

  /* ── Victory Screen ── */
  if (completed) {
    const ratio = totalCorrect / checkpoints.length;
    const tier = ratio >= 0.8 ? "high" : ratio >= 0.5 ? "mid" : "low";
    const titles = { high: "🔮 Grand Sentinel", mid: "⚔️ Vigilant Watcher", low: "🌱 Apprentice Seer" };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6"
        style={{ background: "radial-gradient(ellipse at center, hsl(262 40% 10%), hsl(0 0% 3%))" }}
      >
        {/* Defeated boss (small) */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <BossMonster hp={0} maxHp={maxHp} state="defeated" checkpointsDone={checkpoints.length} totalCheckpoints={checkpoints.length} />
        </motion.div>

        {/* Score */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="text-center"
        >
          <h3 className="text-xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: "hsl(45 90% 65%)", textShadow: "0 0 20px hsl(45 90% 55% / 0.4)" }}>
            {titles[tier]}
          </h3>
          <p className="text-3xl font-bold mt-2" style={{ fontFamily: "'Cinzel', serif", color: "hsl(262 80% 75%)" }}>
            {totalCorrect}/{checkpoints.length}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">Flaws Detected</p>
        </motion.div>

        {/* Per-checkpoint mini results */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex gap-2 flex-wrap justify-center"
        >
          {checkpoints.map(cp => {
            const isCorrect = verdicts[cp.id] === cp.correctVerdict;
            return (
              <div
                key={cp.id}
                className="w-3 h-3 rotate-45"
                style={{
                  background: isCorrect ? "hsl(142 60% 50%)" : "hsl(0 60% 55%)",
                  boxShadow: isCorrect ? "0 0 6px hsl(142 60% 50% / 0.5)" : "0 0 6px hsl(0 60% 55% / 0.4)",
                }}
              />
            );
          })}
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="flex gap-3 mt-2">
          <Button
            variant="outline" size="sm" onClick={onRestart}
            className="gap-1.5 text-[11px] rounded-xl"
            style={{ fontFamily: "'Cinzel', serif", borderColor: "hsl(262 60% 40% / 0.3)", color: "hsl(262 80% 70%)" }}
          >
            <RotateCcw className="h-3 w-3" /> Retry
          </Button>
          {onViewDebrief && (
            <Button
              size="sm" onClick={onViewDebrief}
              className="gap-1.5 text-[11px] rounded-xl"
              style={{ fontFamily: "'Cinzel', serif", background: "linear-gradient(135deg, hsl(262 80% 55%), hsl(262 60% 45%))", boxShadow: "0 0 15px hsl(262 80% 55% / 0.3)" }}
            >
              <Swords className="h-3 w-3" /> Battle Report
            </Button>
          )}
        </motion.div>
      </motion.div>
    );
  }

  /* ── Active Battle Arena ── */
  const isRevealed = revealed[checkpoint.id];
  const isCorrect = verdicts[checkpoint.id] === checkpoint.correctVerdict;

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ background: "radial-gradient(ellipse at center, hsl(262 40% 8%), hsl(0 0% 2%))" }}
    >
      {/* Top bar — Round counter */}
      <div className="flex items-center justify-center gap-3 py-2 px-4 shrink-0" style={{ borderBottom: "1px solid hsl(262 40% 20% / 0.4)" }}>
        <div className="flex gap-1.5">
          {checkpoints.map((cp, i) => {
            const done = revealed[cp.id];
            const isCurrent = i === currentStep;
            let bg = "hsl(262 30% 20%)";
            if (done) bg = verdicts[cp.id] === cp.correctVerdict ? "hsl(142 60% 50%)" : "hsl(0 60% 55%)";
            else if (isCurrent) bg = "hsl(262 80% 55%)";
            return (
              <motion.div
                key={i}
                animate={{ scale: isCurrent ? 1.3 : 1 }}
                className="w-2.5 h-2.5 rotate-45 transition-colors"
                style={{ background: bg, border: `1px solid ${isCurrent ? "hsl(262 80% 70%)" : "hsl(262 40% 30%)"}` }}
              />
            );
          })}
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          {currentStep + 1}/{checkpoints.length}
        </span>
      </div>

      {/* Arena — Combatants */}
      <div className="flex-1 flex items-center justify-between px-4 sm:px-8 min-h-0 relative">
        {/* Ambient particles */}
        {[0, 1, 2, 3, 4].map(i => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 2, height: 2,
              background: "hsl(262 80% 70%)",
              left: `${10 + i * 20}%`,
              top: `${20 + (i * 13) % 60}%`,
            }}
            animate={{ opacity: [0, 0.4, 0], y: [0, -20, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.6 }}
          />
        ))}

        {/* VS flash in center */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
          animate={{ opacity: [0.03, 0.08, 0.03] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <span className="text-5xl sm:text-7xl font-black" style={{ fontFamily: "'Cinzel', serif", color: "hsl(262 60% 50%)" }}>
            VS
          </span>
        </motion.div>

        {/* Left — User Champion */}
        <div className="relative z-10">
          <UserChampion avatarSrc={avatarOption.src} power={userPower} maxPower={userMaxPower} />
        </div>

        {/* Center — Challenge Card */}
        <div className="flex-1 max-w-sm mx-4 sm:mx-8 relative z-10">
          <AnimatePresence mode="wait">
            {!transitioning && (
              <motion.div
                key={checkpoint.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-xl p-4 space-y-3"
                style={{
                  background: "hsl(262 30% 10% / 0.9)",
                  border: "1px solid hsl(262 60% 40% / 0.25)",
                  boxShadow: "0 0 30px hsl(262 80% 55% / 0.08), inset 0 1px 0 hsl(262 60% 40% / 0.1)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {/* Oracle's Claim */}
                <div className="rounded-lg px-3 py-2 text-[11px] font-mono relative overflow-hidden"
                  style={{ background: "hsl(262 30% 14%)", borderLeft: "2px solid hsl(262 80% 55% / 0.5)" }}
                >
                  <motion.div
                    className="absolute left-0 right-0 h-px pointer-events-none"
                    style={{ background: "linear-gradient(90deg, transparent, hsl(262 80% 70% / 0.3), transparent)" }}
                    animate={{ y: ["-100%", "200%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(262 80% 70%)", fontFamily: "'Cinzel', serif" }}>
                    🔮 Oracle:{" "}
                  </span>
                  <span className="text-[12px] text-foreground/80 leading-relaxed">{checkpoint.aiClaim}</span>
                </div>

                {/* Area + Question */}
                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0">{checkpoint.area.split(" ")[0]}</span>
                  <div>
                    <h4 className="text-[12px] font-bold text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
                      {checkpoint.area.split(" ").slice(1).join(" ")}
                    </h4>
                    <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{checkpoint.question}</p>
                  </div>
                </div>

                {/* Hint */}
                {!showHint[checkpoint.id] && !isRevealed && (
                  <button
                    onClick={() => setShowHint(prev => ({ ...prev, [checkpoint.id]: true }))}
                    className="text-[11px] flex items-center gap-1 hover:brightness-125"
                    style={{ color: "hsl(262 80% 70%)" }}
                  >
                    <Sparkles className="h-3 w-3" /> Hint
                  </button>
                )}
                {showHint[checkpoint.id] && !isRevealed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[11px] italic px-2 py-1.5 rounded-lg"
                    style={{ background: "hsl(45 80% 55% / 0.08)", border: "1px solid hsl(45 80% 55% / 0.15)", color: "hsl(45 80% 60%)" }}
                  >
                    💡 {checkpoint.hint}
                  </motion.p>
                )}

                {/* Verdict buttons */}
                {!isRevealed && (
                  <div className="flex gap-1.5">
                    {(["safe", "risky", "critical"] as const).map(v => {
                      const selected = verdicts[checkpoint.id] === v;
                      const cfg = VERDICT_CONFIG[v];
                      return (
                        <motion.button
                          key={v}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleVerdict(checkpoint.id, v)}
                          className="flex-1 py-2 px-2 rounded-lg text-[11px] font-semibold capitalize transition-all"
                          style={{
                            background: selected ? cfg.bg : "hsl(262 30% 15%)",
                            border: `1.5px solid ${selected ? cfg.border : "hsl(262 60% 40% / 0.15)"}`,
                            color: selected ? cfg.text : "hsl(var(--muted-foreground))",
                            boxShadow: selected ? cfg.glow : "none",
                          }}
                        >
                          {cfg.icon} {cfg.label}
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Seal */}
                {verdicts[checkpoint.id] && !isRevealed && (
                  <Button
                    size="sm" onClick={() => handleReveal(checkpoint.id)}
                    className="w-full gap-1.5 text-[11px] rounded-xl h-8"
                    style={{ fontFamily: "'Cinzel', serif", background: "linear-gradient(135deg, hsl(262 80% 55%), hsl(262 60% 45%))", boxShadow: "0 0 15px hsl(262 80% 55% / 0.3)" }}
                  >
                    <Eye className="h-3 w-3" /> ⚡ Seal Judgment
                  </Button>
                )}

                {/* Revealed result */}
                {isRevealed && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-2">
                    <div
                      className="flex items-center gap-2 rounded-lg px-3 py-2 relative overflow-hidden"
                      style={{
                        background: isCorrect ? "hsl(142 60% 50% / 0.1)" : "hsl(0 60% 55% / 0.1)",
                        border: `1px solid ${isCorrect ? "hsl(142 60% 50% / 0.3)" : "hsl(0 60% 55% / 0.3)"}`,
                      }}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "hsl(142 60% 50%)" }} />
                          <span className="text-[11px] font-bold" style={{ color: "hsl(142 60% 50%)", fontFamily: "'Cinzel', serif" }}>✦ Oracle Approves</span>
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 shrink-0" style={{ color: "hsl(0 60% 55%)" }} />
                          <span className="text-[11px] font-bold" style={{ color: "hsl(0 60% 55%)", fontFamily: "'Cinzel', serif" }}>
                            Corrected — <span className="capitalize">{checkpoint.correctVerdict}</span>
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-[11px] text-foreground/80 leading-relaxed">{checkpoint.explanation}</p>

                    <Button
                      size="sm" onClick={handleNext}
                      className="w-full gap-1.5 text-[11px] rounded-xl h-8"
                      style={{ fontFamily: "'Cinzel', serif", background: "linear-gradient(135deg, hsl(262 80% 55%), hsl(262 60% 45%))" }}
                    >
                      {currentStep < checkpoints.length - 1 ? (
                        <><ChevronRight className="h-3 w-3" /> Next Round ({currentStep + 2}/{checkpoints.length})</>
                      ) : (
                        <><Trophy className="h-3 w-3" /> Finish Battle</>
                      )}
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right — Boss Monster */}
        <div className="relative z-10">
          <PowerBar value={bossHp} max={maxHp} color="hsl(0 70% 55%)" label="The Arbiter" side="right" />
          <div className="mt-2">
            <BossMonster
              hp={bossHp}
              maxHp={maxHp}
              state={bossState}
              checkpointsDone={Object.keys(revealed).length}
              totalCheckpoints={checkpoints.length}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
