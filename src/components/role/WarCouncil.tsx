import { useState, useMemo, useEffect, useCallback } from "react";
import type { IntelContext } from "@/lib/simulator";
import { isStandardEmoji } from "@/lib/emoji-utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, AlertTriangle, Sparkles, Clock, ArrowLeft, ArrowRight, Compass, Archive, Swords,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskAnalysis } from "@/types/analysis";
import { ThreatBar } from "./ThreatBar";
import type { FuturePrediction } from "@/components/analysis/FutureTaskPreview";

// ── Shared fantasy style ──────────────────────────────────────
const fantasyCard = {
  background: "hsl(var(--surface-stone))",
  border: "1px solid hsl(var(--filigree) / 0.2)",
  boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 2px 6px hsl(var(--emboss-shadow))",
};

// ── Flavor text pools ──────────────────────────────────────────
const SCAN_FLAVORS = [
  "The Crow spotted movement beyond the ridge…",
  "Dark clouds gather over this territory…",
  "Your scouts report incoming threats…",
  "A raven arrives bearing urgent intel…",
];

const ARSENAL_FLAVORS = [
  "Ancient scrolls reveal hidden skills…",
  "A merchant offers forbidden knowledge…",
  "The War Council has new intelligence…",
  "A cipher was found in the ruins…",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rollXP(): number {
  return Math.floor(Math.random() * 11) + 5;
}

// ── XP Roll animation ──────────────────────────────────────────
function XPRollDisplay({ finalXP, label }: { finalXP: number; label: string }) {
  const [display, setDisplay] = useState(0);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 8;
    const interval = setInterval(() => {
      frame++;
      if (frame >= totalFrames) {
        setDisplay(finalXP);
        setSettled(true);
        clearInterval(interval);
      } else {
        setDisplay(Math.floor(Math.random() * 11) + 5);
      }
    }, 60);
    return () => clearInterval(interval);
  }, [finalXP]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex items-center gap-1.5 mt-2"
    >
      <span
        className={`text-xs font-bold tabular-nums ${settled ? "" : "text-muted-foreground"}`}
        style={settled ? { color: "hsl(var(--filigree-glow))" } : undefined}
      >
        +{display} XP
      </span>
      {settled && (
        <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] text-muted-foreground">
          — {label}
        </motion.span>
      )}
    </motion.div>
  );
}

// ── War Council ────────────────────────────────────────────────
interface WarCouncilProps {
  task: TaskAnalysis;
  prediction?: FuturePrediction;
  predictionsLoading: boolean;
  isCompleted: boolean;
  onMarchToBattle: (task: TaskAnalysis, intel: IntelContext) => void;
  onSwitchTarget: () => void;
  onXPEarned: (xp: number) => void;
}

export function WarCouncil({
  task, prediction, predictionsLoading, isCompleted,
  onMarchToBattle, onSwitchTarget, onXPEarned,
}: WarCouncilProps) {
  const currentScore = task.aiExposureScore ?? 50;
  const futureScore = prediction?.future_exposure ?? currentScore;

  const [threatRevealed, setThreatRevealed] = useState(false);
  const [skillsUnlocked, setSkillsUnlocked] = useState(false);
  const [scoutXP, setScoutXP] = useState<number | null>(null);
  const [decodeXP, setDecodeXP] = useState<number | null>(null);

  const scanFlavor = useMemo(() => pickRandom(SCAN_FLAVORS), []);
  const arsenalFlavor = useMemo(() => pickRandom(ARSENAL_FLAVORS), []);

  const hasPrediction = !!prediction;
  const hasSkills = prediction?.future_skills && prediction.future_skills.length > 0;
  const intelComplete = threatRevealed && (skillsUnlocked || !hasSkills);

  const handleScout = useCallback(() => {
    const xp = rollXP();
    setScoutXP(xp);
    setThreatRevealed(true);
    onXPEarned(xp);
  }, [onXPEarned]);

  const handleDecode = useCallback(() => {
    const xp = rollXP();
    setDecodeXP(xp);
    setSkillsUnlocked(true);
    onXPEarned(xp);
  }, [onXPEarned]);

  const intelLabel = intelComplete
    ? "Full Intel Advantage"
    : threatRevealed
      ? "Partial Intel"
      : "No Intel";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center overflow-y-auto"
    >
      <div className="w-full max-w-xl px-4 py-6 space-y-5">
        {/* Back link */}
        <button
          onClick={onSwitchTarget}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Switch Target
        </button>

        {/* Battle header */}
        <div>
          <h2
            className="text-base font-bold text-foreground mb-1"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {task.name}
          </h2>
          {task.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>
          )}
        </div>

        {/* Threat bar */}
        <div className="rounded-xl p-3" style={fantasyCard}>
          <span
            className="text-[10px] uppercase tracking-wider mb-1.5 block"
            style={{ color: "hsl(var(--filigree))", fontFamily: "'Cinzel', serif" }}
          >
            Enemy Strength
          </span>
          <ThreatBar score={currentScore} size="md" />
          {prediction && threatRevealed && futureScore !== currentScore && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 pt-2"
              style={{ borderTop: "1px solid hsl(var(--filigree) / 0.15)" }}
            >
              <span
                className="text-[10px] uppercase tracking-wider mb-1.5 block"
                style={{ color: "hsl(var(--filigree))", fontFamily: "'Cinzel', serif" }}
              >
                Projected Strength
              </span>
              <ThreatBar score={futureScore} size="md" animate />
            </motion.div>
          )}
        </div>

        {/* Skeleton while predictions load */}
        {!prediction && predictionsLoading && (
          <div className="space-y-3 animate-pulse">
            <div className="rounded-xl p-4 space-y-3" style={fantasyCard}>
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-4/5 rounded" />
            </div>
          </div>
        )}

        {/* ─── RECON: Scan the Horizon ─── */}
        <AnimatePresence mode="wait">
          {hasPrediction && !threatRevealed && (
            <motion.button
              key="scan-horizon"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              onClick={handleScout}
              className="group relative w-full rounded-xl p-5 text-left hover:scale-[1.01] active:scale-[0.99] transition-all overflow-hidden"
              style={{
                background: "linear-gradient(135deg, hsl(var(--surface-stone)), hsl(var(--destructive) / 0.06))",
                border: "1px solid hsl(var(--destructive) / 0.25)",
                boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 2px 8px hsl(var(--emboss-shadow))",
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--destructive)/0.08),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-4">
                <div
                  className="h-12 w-12 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: "hsl(var(--destructive) / 0.1)",
                    border: "1px solid hsl(var(--destructive) / 0.2)",
                  }}
                >
                  <span className="text-2xl leading-none">🧭</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground mb-0.5 flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
                    Scan the Horizon
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ color: "hsl(var(--filigree-glow))", background: "hsl(var(--filigree) / 0.12)" }}
                    >
                      +5-15 XP
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground italic">{scanFlavor}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-destructive/60 group-hover:text-destructive group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </motion.button>
          )}

          {hasPrediction && threatRevealed && (
            <motion.div
              key="threat-revealed"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3 rounded-xl p-4 overflow-hidden"
              style={fantasyCard}
            >
              {scoutXP !== null && <XPRollDisplay finalXP={scoutXP} label="Intel Gathered" />}

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex items-center gap-1.5 flex-wrap">
                <Badge
                  className="text-[10px] gap-1"
                  style={{ background: "hsl(var(--surface-stone))", color: "hsl(var(--filigree))", border: "1px solid hsl(var(--filigree) / 0.2)" }}
                >
                  <Clock className="h-2.5 w-2.5" /> {prediction!.timeline}
                </Badge>
                {prediction!.disrupting_tech.slice(0, 4).map((tech, i) => (
                  <motion.div key={tech} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 + i * 0.08 }}>
                    <Badge
                      className="text-[10px]"
                      style={{ background: "hsl(var(--accent))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--filigree) / 0.15)" }}
                    >
                      ⚡ {tech}
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <span className="text-destructive font-medium">🔥 Threat: </span>{prediction!.collapse_summary}
                </p>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <span className="text-primary font-medium">✦ Evolution: </span>{prediction!.new_human_role}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── ARMORY: Unlock the Arsenal ─── */}
        <AnimatePresence mode="wait">
          {threatRevealed && hasSkills && !skillsUnlocked && (
            <motion.button
              key="unlock-arsenal"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ delay: 0.3 }}
              onClick={handleDecode}
              className="group relative w-full rounded-xl p-5 text-left hover:scale-[1.01] active:scale-[0.99] transition-all overflow-hidden"
              style={{
                background: "linear-gradient(135deg, hsl(var(--surface-stone)), hsl(var(--primary) / 0.06))",
                border: "1px solid hsl(var(--primary) / 0.25)",
                boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 2px 8px hsl(var(--emboss-shadow))",
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(var(--primary)/0.08),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-4">
                <div
                  className="h-12 w-12 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: "hsl(var(--primary) / 0.1)",
                    border: "1px solid hsl(var(--primary) / 0.2)",
                  }}
                >
                  <Archive className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground mb-0.5 flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
                    Unlock the Arsenal
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ color: "hsl(var(--filigree-glow))", background: "hsl(var(--filigree) / 0.12)" }}
                    >
                      +5-15 XP
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground italic">{arsenalFlavor}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-primary/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </motion.button>
          )}

          {skillsUnlocked && hasSkills && (
            <motion.div
              key="skills-unlocked"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              {decodeXP !== null && <XPRollDisplay finalXP={decodeXP} label="Arsenal Unlocked" />}

              <h4
                className="text-[10px] font-semibold uppercase tracking-wider mb-2 mt-2"
                style={{ color: "hsl(var(--filigree))", fontFamily: "'Cinzel', serif" }}
              >
                🛡️ Weapons for This Battle
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                {prediction!.future_skills!.map((skill, i) => (
                  <motion.div
                    key={skill.id}
                    initial={{ opacity: 0, y: 12, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.08, type: "spring", damping: 20 }}
                    className="rounded-xl p-3.5"
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--surface-stone)), hsl(var(--primary) / 0.04))",
                      border: "1px solid hsl(var(--primary) / 0.15)",
                      boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))",
                    }}
                  >
                    <div className="text-xl mb-1.5">{isStandardEmoji(skill.icon_emoji) ? skill.icon_emoji : "⚡"}</div>
                    <div className="text-[11px] font-semibold text-foreground leading-tight mb-1">{skill.name}</div>
                    <div className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{skill.description}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── MARCH TO BATTLE ─── */}
        <div className="pt-2">
          <Button
            size="lg"
            variant={isCompleted ? "secondary" : "default"}
            className="w-full h-11 text-sm rounded-full gap-2 font-bold"
            style={{ fontFamily: "'Cinzel', serif" }}
            onClick={() => {
              const intel: IntelContext = {
                hasFullIntel: intelComplete,
                threats: prediction?.disrupting_tech,
                timeline: prediction?.timeline,
                collapseSummary: prediction?.collapse_summary,
                evolutionSummary: prediction?.new_human_role,
                equippedSkills: skillsUnlocked && prediction?.future_skills ? prediction.future_skills.map(s => ({ name: s.name, description: s.description })) : undefined,
              };
              onMarchToBattle(task, intel);
            }}
          >
            <Swords className="h-4 w-4" />
            {intelComplete
              ? `⚔️ March to Battle — ${intelLabel}`
              : isCompleted
                ? "🔄 Reconquer — Reclaim This Ground"
                : `⚔️ March to Battle — ${intelLabel}`}
          </Button>
          {!intelComplete && !predictionsLoading && hasPrediction && (
            <p className="text-center text-[10px] text-muted-foreground/60 mt-1.5">
              Complete recon above to gain intel advantage
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
