/**
 * TerritoryOverlay — full-screen RPG map with isometric grid layout.
 * Fixed zoom, drag-to-pan, permanent skill detail panel on right.
 */

import { useMemo, useCallback, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Swords, Shield, Brain, Zap, Lock } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SKILL_TAXONOMY, type SkillXP, getLevel, levelProgress, getNextLevel } from "@/lib/skill-map";
import { getCastleState, type CastleState } from "@/lib/castle-levels";
import { computeIsometricLayout, getCanvasSize } from "@/lib/isometric-layout";
import { SKILL_EDGES, getNeighbors } from "@/lib/skill-relationships";
import CastleNode from "./CastleNode";
import { Progress } from "@/components/ui/progress";

import castleRuins from "@/assets/castle-ruins.png";
import castleOutpost from "@/assets/castle-outpost.png";
import castleFortress from "@/assets/castle-fortress.png";
import castleCitadel from "@/assets/castle-citadel.png";

const TIER_IMAGES: Record<string, string> = {
  ruins: castleRuins,
  outpost: castleOutpost,
  fortress: castleFortress,
  citadel: castleCitadel,
};

interface TerritoryOverlayProps {
  open: boolean;
  onClose: () => void;
  skills: SkillXP[];
  lastPracticedSkillId?: string | null;
}

const FIXED_SCALE = 1.2;

export default function TerritoryOverlay({
  open,
  onClose,
  skills,
  lastPracticedSkillId,
}: TerritoryOverlayProps) {
  const skillMap = useMemo(() => new Map(skills.map((s) => [s.id, s])), [skills]);
  const positions = useMemo(() => computeIsometricLayout(), []);
  const posMap = useMemo(() => new Map(positions.map(p => [p.id, p])), [positions]);
  const canvasSize = useMemo(() => getCanvasSize(), []);

  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  const totalXP = useMemo(() => skills.reduce((sum, s) => sum + s.xp, 0), [skills]);
  const unlockedCount = useMemo(() => skills.filter((s) => s.xp >= 100).length, [skills]);

  // Center on open
  useEffect(() => {
    if (open && containerRef.current) {
      const el = containerRef.current;
      // Account for the detail panel width (320px) on the right
      const availableWidth = el.clientWidth;
      setPan({
        x: -(canvasSize.width * FIXED_SCALE - availableWidth) / 2,
        y: -(canvasSize.height * FIXED_SCALE - el.clientHeight) / 3,
      });
      setSelectedSkillId(null);
    }
  }, [open, canvasSize]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
  }, [pan]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setPan({
      x: dragRef.current.px + (e.clientX - dragRef.current.sx),
      y: dragRef.current.py + (e.clientY - dragRef.current.sy),
    });
  }, []);

  const handlePointerUp = useCallback(() => { dragRef.current = null; }, []);

  const handleNodeClick = useCallback((skillId: string) => {
    setSelectedSkillId(prev => prev === skillId ? null : skillId);
  }, []);

  // Selected skill data
  const selectedSkill = useMemo(() => {
    if (!selectedSkillId) return null;
    const taxonomy = SKILL_TAXONOMY.find(s => s.id === selectedSkillId);
    if (!taxonomy) return null;
    const sx = skillMap.get(selectedSkillId);
    const xp = sx?.xp ?? 0;
    const castle = getCastleState(xp);
    const neighbors = getNeighbors(selectedSkillId).map(n => {
      const t = SKILL_TAXONOMY.find(s => s.id === n.id);
      const nsx = skillMap.get(n.id);
      return { id: n.id, name: t?.name ?? n.id, strength: n.strength, xp: nsx?.xp ?? 0, unlocked: (nsx?.xp ?? 0) >= 100 };
    });
    const level = getLevel(xp);
    const nextLevel = getNextLevel(xp);
    const progress = levelProgress(xp);
    return { taxonomy, xp, castle, neighbors, level, nextLevel, progress, sx };
  }, [selectedSkillId, skillMap]);

  // Build edge line data
  const edgeLines = useMemo(() => {
    return SKILL_EDGES.map((edge, i) => {
      const from = posMap.get(edge.from);
      const to = posMap.get(edge.to);
      if (!from || !to) return null;

      const fromXP = skillMap.get(edge.from)?.xp ?? 0;
      const toXP = skillMap.get(edge.to)?.xp ?? 0;
      const bothUnlocked = fromXP >= 100 && toXP >= 100;
      const anyUnlocked = fromXP >= 100 || toXP >= 100;
      const isSelected = selectedSkillId && (edge.from === selectedSkillId || edge.to === selectedSkillId);

      return { key: i, from, to, strength: edge.strength, bothUnlocked, anyUnlocked, isSelected };
    }).filter(Boolean) as {
      key: number;
      from: { x: number; y: number };
      to: { x: number; y: number };
      strength: number;
      bothUnlocked: boolean;
      anyUnlocked: boolean;
      isSelected: boolean;
    }[];
  }, [posMap, skillMap, selectedSkillId]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="territory-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[60] bg-background/98 backdrop-blur-sm flex flex-col"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="flex items-center justify-between px-6 py-3 border-b border-border/30 shrink-0"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  Skill Territory
                </h2>
                <p className="text-xs text-muted-foreground">
                  {unlockedCount} castles claimed • {totalXP.toLocaleString()} total XP • Drag to explore
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.97] shadow-lg"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </motion.div>

          {/* Main: Map + Detail Panel */}
          <div className="flex-1 flex overflow-hidden">
            {/* Pannable Map */}
            <div
              ref={containerRef}
              className="flex-1 overflow-hidden select-none relative"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{ cursor: dragRef.current ? "grabbing" : "grab", touchAction: "none" }}
            >
              <TooltipProvider delayDuration={200}>
                <div
                  className="relative"
                  style={{
                    width: canvasSize.width,
                    height: canvasSize.height,
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${FIXED_SCALE})`,
                    transformOrigin: "0 0",
                  }}
                >
                  {/* Grid + lines */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ width: canvasSize.width, height: canvasSize.height }}
                  >
                    <defs>
                      <pattern id="iso-grid" width="260" height="160" patternUnits="userSpaceOnUse">
                        <path
                          d="M 130 0 L 260 80 L 130 160 L 0 80 Z"
                          fill="none"
                          stroke="hsl(var(--border))"
                          strokeWidth="0.5"
                          opacity="0.12"
                        />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#iso-grid)" />

                    {edgeLines.map((edge) => (
                      <line
                        key={edge.key}
                        x1={edge.from.x}
                        y1={edge.from.y}
                        x2={edge.to.x}
                        y2={edge.to.y}
                        stroke={
                          edge.isSelected
                            ? "hsl(var(--primary))"
                            : edge.bothUnlocked
                            ? "hsl(var(--primary))"
                            : edge.anyUnlocked
                            ? "hsl(var(--muted-foreground))"
                            : "hsl(var(--border))"
                        }
                        strokeWidth={edge.isSelected ? 2.5 : edge.strength === 3 ? 2 : edge.strength === 2 ? 1.5 : 1}
                        opacity={edge.isSelected ? 0.8 : edge.bothUnlocked ? 0.5 : edge.anyUnlocked ? 0.15 : 0.06}
                        strokeDasharray={edge.strength === 1 && !edge.isSelected ? "6 6" : undefined}
                      />
                    ))}
                  </svg>

                  {/* Castle nodes */}
                  {positions.map((pos, i) => {
                    const skill = SKILL_TAXONOMY.find(s => s.id === pos.id);
                    if (!skill) return null;

                    const sx = skillMap.get(pos.id);
                    const xp = sx?.xp ?? 0;
                    const castle = getCastleState(xp);
                    const isActive = lastPracticedSkillId === pos.id;

                    return (
                      <div
                        key={pos.id}
                        className="absolute"
                        style={{
                          left: pos.x - 50,
                          top: pos.y - 50,
                          width: 100,
                          height: 100,
                          zIndex: selectedSkillId === pos.id ? 9999 : Math.round(pos.y),
                        }}
                      >
                        <CastleNode
                          skillId={pos.id}
                          name={skill.name}
                          category={skill.category}
                          castle={castle}
                          xp={xp}
                          isActive={isActive}
                          onClick={() => handleNodeClick(pos.id)}
                          delay={i}
                        />
                      </div>
                    );
                  })}
                </div>
              </TooltipProvider>

              {/* Reset pan button */}
              <button
                onClick={() => {
                  if (!containerRef.current) return;
                  const el = containerRef.current;
                  setPan({
                    x: -(canvasSize.width * FIXED_SCALE - el.clientWidth) / 2,
                    y: -(canvasSize.height * FIXED_SCALE - el.clientHeight) / 3,
                  });
                }}
                className="absolute bottom-4 right-4 w-8 h-8 rounded-lg bg-card/90 border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-[10px] font-bold backdrop-blur-sm transition-colors active:scale-[0.95] z-10"
              >
                ⟲
              </button>
            </div>

            {/* Detail Panel */}
            <AnimatePresence mode="wait">
              {selectedSkill ? (
                <motion.div
                  key={selectedSkill.taxonomy.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="w-[320px] shrink-0 border-l border-border/30 bg-card/50 backdrop-blur-sm overflow-y-auto"
                >
                  <div className="p-5 space-y-5">
                    {/* Castle preview */}
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">
                        <img
                          src={TIER_IMAGES[selectedSkill.castle.tier]}
                          alt={selectedSkill.castle.label}
                          className="w-16 h-16 object-contain"
                          style={{
                            filter: selectedSkill.castle.unlocked ? "none" : "grayscale(0.8) brightness(0.4)",
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-foreground leading-tight">
                          {selectedSkill.taxonomy.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {selectedSkill.castle.emoji} {selectedSkill.castle.label}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-lg font-bold font-mono text-primary">
                            {selectedSkill.xp}
                          </span>
                          <span className="text-xs text-muted-foreground">XP</span>
                        </div>
                      </div>
                    </div>

                    {/* Level progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">
                          {selectedSkill.level.name}
                        </span>
                        {selectedSkill.nextLevel && (
                          <span className="text-muted-foreground">
                            {selectedSkill.nextLevel.xpNeeded} XP to {selectedSkill.nextLevel.name}
                          </span>
                        )}
                      </div>
                      <Progress value={selectedSkill.progress} className="h-2" />
                    </div>

                    {/* Castle tier progress */}
                    {selectedSkill.castle.xpToNextTier !== null && (
                      <div className="rounded-lg border border-border/40 p-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Castle upgrade</span>
                          <span className="font-mono text-foreground">
                            {selectedSkill.castle.tierProgress}%
                          </span>
                        </div>
                        <Progress value={selectedSkill.castle.tierProgress} className="h-1.5" />
                        <p className="text-[10px] text-muted-foreground">
                          {selectedSkill.castle.xpToNextTier} XP to next tier
                        </p>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: Zap, label: "AI Exposure", value: `${selectedSkill.taxonomy.aiExposure}%`, color: "text-primary" },
                        { icon: Shield, label: "Human Edge", value: selectedSkill.taxonomy.humanEdge ?? "—", color: "text-foreground" },
                        { icon: Brain, label: "Sims Done", value: `${selectedSkill.sx?.taskCount ?? 0}`, color: "text-foreground" },
                        { icon: Swords, label: "Avg Score", value: selectedSkill.sx?.avgToolAwareness ? `${Math.round(((selectedSkill.sx.avgToolAwareness + (selectedSkill.sx.avgAdaptiveThinking ?? 0) + (selectedSkill.sx.avgHumanValueAdd ?? 0) + (selectedSkill.sx.avgDomainJudgment ?? 0)) / 4))}%` : "—", color: "text-foreground" },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-lg border border-border/30 p-2.5 space-y-1"
                        >
                          <div className="flex items-center gap-1.5">
                            <stat.icon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                          </div>
                          <p className={`text-xs font-semibold ${stat.color} truncate`}>
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Connected skills */}
                    {selectedSkill.neighbors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Connected Skills
                        </h4>
                        <div className="space-y-1">
                          {selectedSkill.neighbors.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => setSelectedSkillId(n.id)}
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs hover:bg-muted/50 transition-colors text-left"
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  n.unlocked ? "bg-primary" : "bg-muted-foreground/30"
                                }`}
                              />
                              <span className={n.unlocked ? "text-foreground" : "text-muted-foreground"}>
                                {n.name}
                              </span>
                              <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                                {n.xp > 0 ? `${n.xp} XP` : ""}
                              </span>
                              {!n.unlocked && <Lock className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action */}
                    {!selectedSkill.castle.unlocked && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <p className="text-xs text-primary font-medium">
                          Complete a simulation to unlock this castle
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Practice tasks related to {selectedSkill.taxonomy.name} to earn XP
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty-panel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-[320px] shrink-0 border-l border-border/30 bg-card/30 flex items-center justify-center"
                >
                  <div className="text-center px-8 space-y-2">
                    <Sparkles className="h-8 w-8 text-muted-foreground/20 mx-auto" />
                    <p className="text-sm text-muted-foreground/60 font-medium">
                      Click a castle to inspect
                    </p>
                    <p className="text-[11px] text-muted-foreground/40">
                      View skill details, progress, and connected skills
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 px-6 py-2.5 border-t border-border/30 shrink-0 text-[10px] text-muted-foreground"
          >
            {[
              { emoji: "🏚️", label: "Ruins" },
              { emoji: "🏕️", label: "Outpost" },
              { emoji: "🏰", label: "Fortress" },
              { emoji: "⚔️", label: "Citadel" },
              { emoji: "🐦‍⬛", label: "Crowy" },
            ].map((l) => (
              <span key={l.label} className="flex items-center gap-1">
                <span>{l.emoji}</span> {l.label}
              </span>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
