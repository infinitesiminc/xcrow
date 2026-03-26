/**
 * ScoutMissionHUD — Persistent mission tracker on the World Map.
 * Single mission: "Scout the AI Frontier" — talk to role characters, collect skills.
 */
import { motion } from "framer-motion";
import { Compass, MessageCircle, Award, ChevronRight } from "lucide-react";
import type { FutureSkillCategory } from "@/hooks/use-future-skills";

const cinzel = { fontFamily: "'Cinzel', serif" };

const TERRITORIES: FutureSkillCategory[] = [
  "Technical", "Analytical", "Creative", "Strategic",
  "Communication", "Leadership", "Ethics & Compliance", "Human Edge",
];

const TERRITORY_ICONS: Record<string, string> = {
  "Technical": "⚔️", "Analytical": "🔮", "Creative": "🎨", "Strategic": "👑",
  "Communication": "📯", "Leadership": "🏰", "Ethics & Compliance": "🛡️", "Human Edge": "💎",
};

interface ScoutMissionHUDProps {
  territoriesScouted: Set<string>;
  rolesSpokenTo: number;
  skillsCollected: number;
}

export default function ScoutMissionHUD({ territoriesScouted, rolesSpokenTo, skillsCollected }: ScoutMissionHUDProps) {
  const progress = Math.round((territoriesScouted.size / TERRITORIES.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
    >
      <div
        className="rounded-xl px-4 py-2.5 backdrop-blur-xl flex items-center gap-4"
        style={{
          background: "hsl(var(--card) / 0.85)",
          border: "1px solid hsl(var(--border))",
          boxShadow: "0 8px 32px hsl(0 0% 0% / 0.4)",
        }}
      >
        {/* Mission title */}
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary" style={cinzel}>
            Scout the AI Frontier
          </span>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Territory progress dots */}
        <div className="flex items-center gap-1">
          {TERRITORIES.map(t => (
            <div
              key={t}
              className="w-3 h-3 rounded-full flex items-center justify-center text-[6px] transition-all"
              title={t}
              style={{
                background: territoriesScouted.has(t) ? "hsl(var(--primary))" : "hsl(var(--muted))",
                boxShadow: territoriesScouted.has(t) ? "0 0 8px hsl(var(--primary) / 0.5)" : "none",
              }}
            >
              {territoriesScouted.has(t) ? "✓" : ""}
            </div>
          ))}
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Stats */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            <MessageCircle className="h-3 w-3" />
            <span className="font-semibold text-foreground">{rolesSpokenTo}</span>
            <span>roles</span>
          </div>
          <div className="flex items-center gap-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            <Award className="h-3 w-3" />
            <span className="font-semibold text-foreground">{skillsCollected}</span>
            <span>skills</span>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <span className="text-[10px] font-bold text-primary">{progress}%</span>
        </div>
      </div>
    </motion.div>
  );
}
