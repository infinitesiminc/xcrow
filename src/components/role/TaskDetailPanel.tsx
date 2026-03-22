import { useState, useMemo, useEffect, useCallback } from "react";
import { isStandardEmoji } from "@/lib/emoji-utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, AlertTriangle, Sparkles, Clock, X, ArrowRight, Compass, Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskAnalysis } from "@/types/analysis";
import { exposureStyle } from "@/lib/exposure-colors";
import type { FuturePrediction } from "@/components/analysis/FutureTaskPreview";

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
  return Math.floor(Math.random() * 11) + 5; // 5-15
}

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
      <span className={`text-xs font-bold tabular-nums ${settled ? "text-primary" : "text-muted-foreground"}`}>
        +{display} XP
      </span>
      {settled && (
        <motion.span
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[10px] text-muted-foreground"
        >
          — {label}
        </motion.span>
      )}
    </motion.div>
  );
}

interface TaskDetailPanelProps {
  task: TaskAnalysis;
  prediction?: FuturePrediction;
  predictionsLoading: boolean;
  isCompleted: boolean;
  onPractice: (task: TaskAnalysis) => void;
  onClose: () => void;
  index?: number;
}

export function TaskDetailPanel({
  task, prediction, predictionsLoading, isCompleted, onPractice, onClose, index,
}: TaskDetailPanelProps) {
  const currentScore = task.aiExposureScore ?? 50;
  const futureScore = prediction?.future_exposure ?? currentScore;
  const currentStyle = exposureStyle(currentScore);
  const futureStyle = exposureStyle(futureScore);
  const delta = futureScore - currentScore;
  const isCollapsing = futureScore >= 80;

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
    setScoutXP(rollXP());
    setThreatRevealed(true);
  }, []);

  const handleDecode = useCallback(() => {
    setDecodeXP(rollXP());
    setSkillsUnlocked(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <span className="text-xs font-bold text-muted-foreground/60 tabular-nums">{index != null ? `${index + 1}.` : "⚔️"}</span>
            {task.name}
          </h3>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{task.description}</p>
          )}
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-muted/50 shrink-0">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Score: Today → Future */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${currentStyle.badge}`}>
          Now {currentScore}%
        </span>
        {prediction && threatRevealed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${futureStyle.badge}`}>
              Future {futureScore}%
            </span>
            {delta !== 0 && (
              <span className={`text-[10px] font-medium ${delta > 0 ? "text-destructive" : "text-success"}`}>
                ({delta > 0 ? "+" : ""}{delta})
              </span>
            )}
          </motion.div>
        )}
        {!prediction && predictionsLoading && (
          <>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </>
        )}
      </div>

      {/* Skeleton while predictions load */}
      {!prediction && predictionsLoading && (
        <div className="space-y-3 mb-4 pb-4 border-b border-border/30 animate-pulse">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
          <div className="flex items-start gap-2">
            <Skeleton className="h-3.5 w-3.5 rounded shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-2.5 w-full rounded" />
              <Skeleton className="h-2.5 w-4/5 rounded" />
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Skeleton className="h-3.5 w-3.5 rounded shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-2.5 w-full rounded" />
              <Skeleton className="h-2.5 w-3/5 rounded" />
            </div>
          </div>
        </div>
      )}

      {/* ─── INTEL QUEST 1: Scan the Horizon ─── */}
      <AnimatePresence mode="wait">
        {hasPrediction && !threatRevealed && (
          <motion.button
            key="scan-horizon"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            onClick={handleScout}
            className="group relative mb-4 rounded-xl border border-destructive/30 bg-gradient-to-br from-destructive/[0.08] to-destructive/[0.02] p-4 text-left hover:border-destructive/50 hover:shadow-lg hover:shadow-destructive/10 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--destructive)/0.08),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                <span className="text-xl leading-none">🧭</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-foreground mb-0.5 flex items-center gap-1.5">
                  Scan the Horizon
                  <span className="text-[9px] font-medium text-destructive/70 px-1.5 py-0.5 rounded-full bg-destructive/10">+5-15 XP</span>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  {scanFlavor}
                </p>
              </div>
              <div className="shrink-0 text-destructive/60 group-hover:text-destructive group-hover:translate-x-0.5 transition-all">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </motion.button>
        )}

        {hasPrediction && threatRevealed && (
          <motion.div
            key="threat-revealed"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3 mb-4 pb-4 border-b border-border/30 overflow-hidden"
          >
            {scoutXP !== null && <XPRollDisplay finalXP={scoutXP} label="Intel Gathered" />}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-1.5 flex-wrap"
            >
              <Badge className="bg-muted text-muted-foreground border-border/30 text-[10px] gap-1">
                <Clock className="h-2.5 w-2.5" /> {prediction!.timeline}
              </Badge>
              {prediction!.disrupting_tech.slice(0, 4).map((tech, i) => (
                <motion.div
                  key={tech}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 + i * 0.08 }}
                >
                  <Badge className="bg-accent text-foreground border-border/30 text-[10px]">
                    ⚡ {tech}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="flex items-start gap-2"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <span className="text-destructive font-medium">🔥 Threat: </span>{prediction!.collapse_summary}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-start gap-2"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <span className="text-primary font-medium">✦ Evolution: </span>{prediction!.new_human_role}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── INTEL QUEST 2: Unlock the Arsenal ─── */}
      <AnimatePresence mode="wait">
        {threatRevealed && hasSkills && !skillsUnlocked && (
          <motion.button
            key="unlock-arsenal"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ delay: 0.3 }}
            onClick={handleDecode}
            className="group relative mb-4 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/[0.08] to-primary/[0.02] p-4 text-left hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(var(--primary)/0.08),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xl leading-none">🗝️</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-foreground mb-0.5 flex items-center gap-1.5">
                  Unlock the Arsenal
                  <span className="text-[9px] font-medium text-primary/70 px-1.5 py-0.5 rounded-full bg-primary/10">+5-15 XP</span>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  {arsenalFlavor}
                </p>
              </div>
              <div className="shrink-0 text-primary/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </motion.button>
        )}

        {skillsUnlocked && hasSkills && (
          <motion.div
            key="skills-unlocked"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-4 overflow-hidden"
          >
            {decodeXP !== null && <XPRollDisplay finalXP={decodeXP} label="Arsenal Unlocked" />}

            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-2">
              🗺️ Skills to Unlock
            </h4>
            <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
              {prediction!.future_skills!.map((skill, i) => (
                <motion.button
                  key={skill.id}
                  initial={{ opacity: 0, y: 12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.08, type: "spring", damping: 20 }}
                  onClick={() => onPractice(task)}
                  className="sim-glow-border relative flex-none w-40 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-accent/[0.04] p-3.5 text-left hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all group"
                >
                  <div className="text-2xl mb-2">{isStandardEmoji(skill.icon_emoji) ? skill.icon_emoji : "⚡"}</div>
                  <div className="text-[11px] font-semibold text-foreground group-hover:text-primary transition-colors leading-tight mb-1">
                    {skill.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-snug line-clamp-2 mb-2.5">
                    {skill.description}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-medium text-primary/60 group-hover:text-primary transition-colors">
                    <Play className="h-2.5 w-2.5" />
                    Practice Quest
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Practice CTA */}
      <div className="mt-auto pt-3 border-t border-border/30">
        <Button
          size="sm"
          variant={isCompleted ? "secondary" : "default"}
          className="sim-glow-btn w-full h-8 text-xs rounded-full gap-1.5"
          onClick={() => onPractice(task)}
        >
          <Play className="h-3 w-3" />
          {intelComplete
            ? "⚔️ Begin Battle — Intel Advantage Active"
            : isCompleted
              ? "🔄 Retry Quest"
              : "⚔️ Accept Quest"}
        </Button>
      </div>
    </motion.div>
  );
}
