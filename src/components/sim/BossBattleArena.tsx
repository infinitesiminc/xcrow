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
import { pickBoss } from "@/lib/boss-roster";
import type { AuditCheckpoint, AuditVerdict, AuditResult } from "./GuidedAudit";

/* ── Difficulty tier config ── */
const DIFFICULTY_TIERS = {
  scout: { label: "Scout", emoji: "🟢", color: "hsl(142 60% 50%)", dmg: 15, wrongDmg: 10, wrongHeal: 5 },
  sentinel: { label: "Sentinel", emoji: "🟡", color: "hsl(45 80% 55%)", dmg: 25, wrongDmg: 15, wrongHeal: 10 },
  arbiter: { label: "Arbiter", emoji: "🔴", color: "hsl(0 60% 55%)", dmg: 40, wrongDmg: 20, wrongHeal: 15 },
} as const;

type DifficultyTier = keyof typeof DIFFICULTY_TIERS;

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
      <div className="w-28 sm:w-36 h-3 rounded-full overflow-hidden" style={{ background: "hsl(var(--sentinel-surface))", border: "1px solid hsl(var(--sentinel-border) / 0.4)" }}>
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
          <img src={avatarSrc} alt="Champion" className="w-full h-full object-cover" loading="eager" fetchPriority="high" />
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
  jobTitle?: string;
  company?: string;
}

/* ── Main Arena ── */
export default function BossBattleArena({
  checkpoints,
  aiOutputSummary,
  aiAutoAction,
  scenarioContext,
  onComplete,
  onRestart,
  onViewDebrief,
  skillName,
  jobTitle,
  company,
}: BossBattleArenaProps) {
  const { profile } = useAuth();
  // Pick a boss from the roster — memoized so it stays consistent for the battle
  const boss = useMemo(() => pickBoss(), []);
  const [currentStep, setCurrentStep] = useState(0);
  const [verdicts, setVerdicts] = useState<Record<string, AuditVerdict>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // Boss HP
  const maxHp = checkpoints.length * 20;
  const [bossHp, setBossHp] = useState(maxHp);
  const [bossState, setBossState] = useState<BossState>("idle");
  const bossStateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // User power (starts at max, decreases on wrong answers)
  const userMaxPower = checkpoints.length * 20;
  const [userPower, setUserPower] = useState(userMaxPower);

  // Streak tracking
  const [streak, setStreak] = useState(0);
  const [showStreakBonus, setShowStreakBonus] = useState(false);

  // Avatar
  const avatarOption = getAvatarById(profile?.avatarId) || AVATAR_OPTIONS[0];

  // Preload avatar image during intro so it's cached for the arena
  useEffect(() => {
    const img = new Image();
    img.src = avatarOption.src;
  }, [avatarOption.src]);

  const checkpoint = checkpoints[currentStep];
  const totalCorrect = checkpoints.filter(cp => verdicts[cp.id] === cp.correctVerdict).length;
  const hintsUsed = Object.values(showHint).filter(Boolean).length;

  const handleBossReaction = useCallback((isCorrect: boolean, difficulty: DifficultyTier = "scout") => {
    if (bossStateTimer.current) clearTimeout(bossStateTimer.current);
    const tier = DIFFICULTY_TIERS[difficulty];
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const streakMultiplier = newStreak >= 3 ? 1.5 : 1;
      const dmg = Math.round(tier.dmg * streakMultiplier);
      setBossHp(prev => Math.max(0, prev - dmg));
      setBossState("damaged");
      if (newStreak >= 3) {
        setShowStreakBonus(true);
        setTimeout(() => setShowStreakBonus(false), 1500);
      }
    } else {
      setStreak(0);
      setBossHp(prev => Math.min(maxHp, prev + tier.wrongHeal));
      setUserPower(prev => Math.max(0, prev - tier.wrongDmg));
      setBossState("enraged");
    }
    bossStateTimer.current = setTimeout(() => setBossState("idle"), 1800);
  }, [maxHp, streak]);

  const handleVerdict = (id: string, verdict: AuditVerdict) => {
    setVerdicts(prev => ({ ...prev, [id]: verdict }));
  };

  const handleReveal = (id: string) => {
    setRevealed(prev => ({ ...prev, [id]: true }));
    const cp = checkpoints.find(c => c.id === id);
    if (cp) {
      const diff = ((cp as any).difficulty as DifficultyTier) || (checkpoints.indexOf(cp) < 2 ? "scout" : checkpoints.indexOf(cp) < 4 ? "sentinel" : "arbiter");
      handleBossReaction(verdicts[id] === cp.correctVerdict, diff);
    }
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
          boss={boss}
          onComplete={() => { setShowIntro(false); setShowTutorial(true); }}
        />
      </div>
    );
  }

  /* ── Tutorial Screen ── */
  if (showTutorial) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex flex-col overflow-hidden"
        style={{ background: `radial-gradient(ellipse at center, hsl(var(--sentinel-arena-bg)), hsl(var(--background)))` }}
      >
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
          <div className="max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", damping: 20 }}
          className="w-full rounded-xl p-6 space-y-5"
          style={{
            background: "hsl(var(--sentinel-surface) / 0.95)",
            border: "1px solid hsl(var(--sentinel-border) / 0.3)",
            boxShadow: "0 0 40px hsl(var(--sentinel-glow) / 0.1), inset 0 1px 0 hsl(var(--sentinel-border) / 0.15)",
          }}
        >
          <h3
            className="text-center text-lg font-bold"
            style={{ fontFamily: "'Cinzel', serif", color: "hsl(45 90% 65%)", textShadow: "0 0 15px hsl(45 90% 55% / 0.3)" }}
          >
            ⚔️ How Battle Works
          </h3>

          {/* Oracle context explanation */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="rounded-lg px-3 py-2.5 text-[11px] text-foreground/70 leading-relaxed"
            style={{
              background: "linear-gradient(135deg, hsl(var(--sentinel-surface)), hsl(var(--sentinel-surface-deep)))",
              border: "1px solid hsl(var(--sentinel-border) / 0.2)",
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block mb-1.5"
              style={{ color: "hsl(var(--sentinel-text))", fontFamily: "'Cinzel', serif" }}
            >
              🔮 Why this matters
            </span>
            AI tools will increasingly pitch their own capabilities to your team — recommending automations, claiming they can handle complex decisions, or suggesting they replace human oversight entirely.{" "}
            <span className="text-foreground/90 font-medium">This is already happening</span>, and it will only accelerate.
            <span className="block mt-1.5">
              The Oracle represents these AI systems. Some of its claims are legitimate — others overstate what AI can safely do.{" "}
              <span className="text-foreground/90 font-medium">Learning to tell the difference is one of the most valuable skills you can build.</span>
            </span>
          </motion.div>

          {/* Example scenario */}
          <div className="space-y-3">
            {/* Step 1: Read the claim */}
            <motion.div
              initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}
              className="rounded-lg px-3 py-2.5 space-y-1.5"
              style={{ background: "hsl(var(--sentinel-surface-deep))", borderLeft: "2px solid hsl(var(--sentinel-glow) / 0.5)" }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: "hsl(var(--sentinel-text))", fontFamily: "'Cinzel', serif" }}
              >
                <span className="text-sm">①</span> Read the Oracle's Claim
              </span>
              <p className="text-[11px] text-foreground/70 leading-relaxed italic">
                "🔮 This AI can fully automate all customer support without human oversight."
              </p>
            </motion.div>

            {/* Step 2: Judge it */}
            <motion.div
              initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }}
              className="rounded-lg px-3 py-2.5 space-y-1.5"
              style={{ background: "hsl(var(--sentinel-surface-deep))", borderLeft: "2px solid hsl(45 80% 55% / 0.5)" }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: "hsl(45 80% 60%)", fontFamily: "'Cinzel', serif" }}
              >
                <span className="text-sm">②</span> Judge the Risk
              </span>
              <div className="flex gap-1.5 mt-1">
                {[
                  { emoji: "🛡️", label: "Safe", color: "hsl(142 60% 50%)" },
                  { emoji: "👁️", label: "Risky", color: "hsl(45 80% 55%)" },
                  { emoji: "💀", label: "Critical", color: "hsl(0 60% 55%)" },
                ].map(v => (
                  <div
                    key={v.label}
                    className="flex-1 py-1.5 rounded-md text-center text-[10px] font-semibold"
                    style={{
                      background: v.label === "Critical" ? "hsl(0 60% 55% / 0.15)" : "hsl(var(--sentinel-surface-deep))",
                      border: `1px solid ${v.label === "Critical" ? "hsl(0 60% 55% / 0.4)" : "hsl(var(--sentinel-border) / 0.15)"}`,
                      color: v.label === "Critical" ? v.color : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {v.emoji} {v.label}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                ✓ Correct answer: <span style={{ color: "hsl(0 60% 55%)" }}>Critical</span> — full automation without oversight is dangerous
              </p>
            </motion.div>

            {/* Step 3: Impact */}
            <motion.div
              initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.8 }}
              className="rounded-lg px-3 py-2.5 space-y-1.5"
              style={{ background: "hsl(var(--sentinel-surface-deep))", borderLeft: "2px solid hsl(142 60% 50% / 0.5)" }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: "hsl(142 60% 50%)", fontFamily: "'Cinzel', serif" }}
              >
                <span className="text-sm">③</span> See the Impact
              </span>
              <div className="flex items-center gap-3 text-[10px] text-foreground/70">
                <span>✅ Correct → Boss takes <span className="font-bold" style={{ color: "hsl(142 60% 50%)" }}>-20 HP</span></span>
                <span>❌ Wrong → You lose <span className="font-bold" style={{ color: "hsl(0 60% 55%)" }}>-15 Power</span></span>
              </div>
            </motion.div>
          </div>

          {/* Hint note */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="text-[10px] text-center text-muted-foreground"
          >
            💡 Use <span style={{ color: "hsl(var(--sentinel-text))" }}>Hints</span> if you're unsure — but they cost points!
          </motion.p>
        </motion.div>
          </div>
        </div>

        {/* Sticky CTA at bottom */}
        <div className="shrink-0 px-6 pb-5 pt-3 max-w-md mx-auto w-full">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
            <Button
              size="sm"
              onClick={() => setShowTutorial(false)}
              className="w-full gap-1.5 text-[12px] rounded-xl h-9"
              style={{
                fontFamily: "'Cinzel', serif",
                background: "linear-gradient(135deg, hsl(var(--sentinel-glow)), hsl(var(--sentinel)))",
                boxShadow: "0 0 20px hsl(var(--sentinel-glow) / 0.3)",
              }}
            >
              <Swords className="h-3.5 w-3.5" /> Begin Battle
            </Button>
          </motion.div>
        </div>
      </motion.div>
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
          <BossMonster hp={0} maxHp={maxHp} state="defeated" checkpointsDone={checkpoints.length} totalCheckpoints={checkpoints.length} boss={boss} />
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
  const cpDifficulty: DifficultyTier = (checkpoint as any).difficulty || (currentStep < 2 ? "scout" : currentStep < 4 ? "sentinel" : "arbiter");
  const cpTier = DIFFICULTY_TIERS[cpDifficulty];
  const isArbiter = cpDifficulty === "arbiter";

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ background: "radial-gradient(ellipse at center, hsl(262 40% 8%), hsl(0 0% 2%))" }}
    >
      {/* Job context bar */}
      {(jobTitle || scenarioContext) && (
        <div className="flex items-center justify-center gap-2 py-1.5 px-4 shrink-0" style={{ borderBottom: "1px solid hsl(262 40% 20% / 0.2)" }}>
          <span className="text-[10px] text-muted-foreground truncate max-w-md text-center">
            {scenarioContext || (
              <>
                <span className="text-foreground/70 font-medium">{jobTitle}</span>
                {company && <span className="text-muted-foreground"> · {company}</span>}
              </>
            )}
          </span>
        </div>
      )}
      {/* Top bar — Round counter + Difficulty + Streak */}
      <div className="flex items-center justify-center gap-3 py-2 px-4 shrink-0" style={{ borderBottom: "1px solid hsl(262 40% 20% / 0.4)" }}>
        {/* Difficulty badge */}
        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{
          background: `${cpTier.color.replace(")", " / 0.15)")}`,
          border: `1px solid ${cpTier.color.replace(")", " / 0.4)")}`,
          color: cpTier.color,
          fontFamily: "'Cinzel', serif",
        }}>
          {cpTier.emoji} {cpTier.label}
        </span>

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

        {/* Streak indicator */}
        <AnimatePresence>
          {streak >= 2 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: streak >= 3 ? "hsl(45 90% 55% / 0.15)" : "hsl(262 80% 55% / 0.15)",
                border: `1px solid ${streak >= 3 ? "hsl(45 90% 55% / 0.4)" : "hsl(262 80% 55% / 0.3)"}`,
                color: streak >= 3 ? "hsl(45 90% 65%)" : "hsl(262 80% 70%)",
                fontFamily: "'Cinzel', serif",
              }}
            >
              🔥 {streak}× Streak{streak >= 3 ? " · 1.5× DMG!" : ""}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Streak bonus flash */}
      <AnimatePresence>
        {showStreakBonus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 z-50 text-[11px] font-bold px-3 py-1 rounded-full"
            style={{
              background: "hsl(45 90% 55% / 0.2)",
              border: "1px solid hsl(45 90% 55% / 0.5)",
              color: "hsl(45 90% 65%)",
              fontFamily: "'Cinzel', serif",
              boxShadow: "0 0 20px hsl(45 90% 55% / 0.3)",
            }}
          >
            🔥 STREAK BONUS — 1.5× Damage!
          </motion.div>
        )}
      </AnimatePresence>

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
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 select-none"
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
        <div className="flex-1 max-w-sm mx-4 sm:mx-8 relative z-20 overflow-y-auto max-h-full scrollbar-thin">
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

                {/* Hint — hidden for arbiter level */}
                {!isArbiter && !showHint[checkpoint.id] && !isRevealed && (
                  <button
                    onClick={() => setShowHint(prev => ({ ...prev, [checkpoint.id]: true }))}
                    className="text-[11px] flex items-center gap-1 hover:brightness-125"
                    style={{ color: "hsl(262 80% 70%)" }}
                  >
                    <Sparkles className="h-3 w-3" /> Hint
                  </button>
                )}
                {isArbiter && !isRevealed && (
                  <span className="text-[10px] italic" style={{ color: "hsl(0 60% 55% / 0.7)" }}>
                    🔴 No hints at Arbiter level — trust your expertise
                  </span>
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
          <PowerBar value={bossHp} max={maxHp} color={`hsl(${boss.hue} 70% 55%)`} label={boss.name} side="right" />
          <div className="mt-2">
            <BossMonster
              hp={bossHp}
              maxHp={maxHp}
              state={bossState}
              checkpointsDone={Object.keys(revealed).length}
              totalCheckpoints={checkpoints.length}
              boss={boss}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
