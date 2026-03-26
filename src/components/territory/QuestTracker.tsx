/**
 * QuestTracker — Unified mission HUD replacing ScoutMissionHUD + CampaignTracker.
 * Shows the single overarching "Scout the AI Frontier" mission with phase indicators.
 */
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Swords, Crown, Award, Eye, ChevronRight } from "lucide-react";
import type { MissionPhase } from "@/hooks/use-scout-mission";

const cinzel = { fontFamily: "'Cinzel', serif" };

const PHASES: { key: MissionPhase; label: string; icon: typeof Compass; emoji: string }[] = [
  { key: "scout", label: "Scout", icon: Eye, emoji: "👁️" },
  { key: "battle", label: "Battle", icon: Swords, emoji: "⚔️" },
  { key: "conquer", label: "Conquer", icon: Crown, emoji: "👑" },
];

interface QuestTrackerProps {
  phase: MissionPhase;
  territoriesScouted: Set<string>;
  rolesSpokenTo: Set<string>;
  scoutedSkillCount: number;
  skillsConquered: number;
  missionProgress: number;
}

export default function QuestTracker({
  phase,
  territoriesScouted,
  rolesSpokenTo,
  scoutedSkillCount,
  skillsConquered,
  missionProgress,
}: QuestTrackerProps) {
  const phaseIndex = PHASES.findIndex(p => p.key === phase);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
    >
      <div
        className="rounded-xl backdrop-blur-xl overflow-hidden"
        style={{
          background: "hsl(var(--card) / 0.9)",
          border: "1px solid hsl(var(--border))",
          boxShadow: "0 8px 32px hsl(0 0% 0% / 0.5), inset 0 1px 0 hsl(var(--emboss-light))",
        }}
      >
        {/* Top row: Mission title + phase pipeline */}
        <div className="flex items-center gap-4 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary" style={cinzel}>
              Scout the AI Frontier
            </span>
          </div>

          <div className="w-px h-5 bg-border" />

          {/* Phase pipeline */}
          <div className="flex items-center gap-1">
            {PHASES.map((p, i) => {
              const isActive = p.key === phase;
              const isComplete = i < phaseIndex;
              const PhaseIcon = p.icon;
              return (
                <div key={p.key} className="flex items-center">
                  {i > 0 && (
                    <div
                      className="w-6 h-px mx-0.5"
                      style={{
                        background: isComplete
                          ? "hsl(var(--primary))"
                          : "hsl(var(--border))",
                      }}
                    />
                  )}
                  <motion.div
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      background: isActive
                        ? "hsl(var(--primary) / 0.15)"
                        : isComplete
                          ? "hsl(var(--primary) / 0.08)"
                          : "transparent",
                      color: isActive
                        ? "hsl(var(--primary))"
                        : isComplete
                          ? "hsl(var(--primary) / 0.6)"
                          : "hsl(var(--muted-foreground))",
                      border: isActive ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid transparent",
                    }}
                    animate={isActive ? { boxShadow: ["0 0 0px hsl(var(--primary) / 0)", "0 0 8px hsl(var(--primary) / 0.3)", "0 0 0px hsl(var(--primary) / 0)"] } : {}}
                    transition={isActive ? { duration: 2, repeat: Infinity } : {}}
                  >
                    <PhaseIcon className="h-3 w-3" />
                    {p.label}
                  </motion.div>
                </div>
              );
            })}
          </div>

          <div className="w-px h-5 bg-border" />

          {/* Stats */}
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span className="font-semibold text-foreground">{territoriesScouted.size}</span>
              <span>/8</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Award className="h-3 w-3" />
              <span className="font-semibold text-foreground">{scoutedSkillCount}</span>
              <span>scouted</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Swords className="h-3 w-3" />
              <span className="font-semibold text-foreground">{skillsConquered}</span>
              <span>conquered</span>
            </div>
          </div>

          {/* Overall progress */}
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${missionProgress}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
            <span className="text-[10px] font-bold text-primary">{missionProgress}%</span>
          </div>
        </div>

        {/* Phase-specific guidance bar */}
        <div
          className="px-4 py-1.5 text-[10px] flex items-center gap-2"
          style={{
            background: "hsl(var(--muted) / 0.5)",
            borderTop: "1px solid hsl(var(--border) / 0.5)",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          <ChevronRight className="h-3 w-3 text-primary" />
          {phase === "scout" && (
            <span>Talk to role characters across territories to discover skills. <strong className="text-foreground">Scout 3+ skills</strong> to unlock battles.</span>
          )}
          {phase === "battle" && (
            <span>Practice scouted skills in simulations. <strong className="text-foreground">Conquer 5+ skills</strong> to begin territory conquest.</span>
          )}
          {phase === "conquer" && (
            <span>Master territories and defeat Guardians. <strong className="text-foreground">Conquer all 8 territories</strong> to complete the mission.</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
