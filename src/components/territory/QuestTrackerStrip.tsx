/**
 * QuestTrackerStrip — Compact inline quest progress for the map nav bar.
 */
import { Search, Beaker, Swords, Crown, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { MissionPhase } from "@/hooks/use-scout-mission";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const PHASES: { key: MissionPhase; label: string; icon: typeof Search }[] = [
  { key: "discover", label: "Discover", icon: Search },
  { key: "experiment", label: "Experiment", icon: Beaker },
  { key: "challenge", label: "Challenge", icon: Swords },
  { key: "master", label: "Master", icon: Crown },
];

interface QuestTrackerStripProps {
  phase: MissionPhase;
  territoriesScouted: Set<string>;
  scoutedSkillCount: number;
  skillsConquered: number;
  missionProgress: number;
}

export default function QuestTrackerStrip({
  phase,
  territoriesScouted,
  scoutedSkillCount,
  skillsConquered,
  missionProgress,
}: QuestTrackerStripProps) {
  const phaseIndex = PHASES.findIndex(p => p.key === phase);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 cursor-help">
          {/* Phase dots */}
          <div className="flex items-center gap-0.5">
            {PHASES.map((p, i) => {
              const isActive = p.key === phase;
              const isComplete = i < phaseIndex;
              const PhaseIcon = p.icon;
              return (
                <div key={p.key} className="flex items-center">
                  {i > 0 && (
                    <div
                      className="w-3 h-px"
                      style={{
                        background: isComplete
                          ? "hsl(var(--primary))"
                          : "hsl(var(--border))",
                      }}
                    />
                  )}
                  <div
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                    style={{
                      background: isActive
                        ? "hsl(var(--primary) / 0.15)"
                        : "transparent",
                      color: isActive
                        ? "hsl(var(--primary))"
                        : isComplete
                          ? "hsl(var(--primary) / 0.6)"
                          : "hsl(var(--muted-foreground) / 0.5)",
                      border: isActive ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid transparent",
                    }}
                  >
                    <PhaseIcon className="h-2.5 w-2.5" />
                    {p.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Separator */}
          <div className="w-px h-4 opacity-30" style={{ background: "hsl(var(--filigree))" }} />

          {/* Progress bar */}
          <div className="flex items-center gap-1.5">
            <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "hsl(var(--primary))" }}
                initial={{ width: 0 }}
                animate={{ width: `${missionProgress}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
            <span className="text-[10px] font-bold" style={{ color: "hsl(var(--primary))" }}>
              {missionProgress}%
            </span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[260px]">
        <p className="font-semibold text-xs mb-1" style={{ fontFamily: "'Cinzel', serif" }}>
          Scout the AI Frontier
        </p>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span><Search className="inline h-3 w-3 mr-0.5" /><strong className="text-foreground">{territoriesScouted.size}</strong>/8 territories</span>
          <span><Swords className="inline h-3 w-3 mr-0.5" /><strong className="text-foreground">{skillsConquered}</strong> conquered</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-primary" />
          {phase === "discover" && "Talk to NPCs to discover 3+ skills and unlock experiments"}
          {phase === "experiment" && "Try skills in guided sims — practice 5+ to unlock challenges"}
          {phase === "challenge" && "Push deeper — conquer 10+ skills to become a master"}
          {phase === "master" && "Master territories and defeat all Guardians"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
