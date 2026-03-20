/**
 * PlayerHUD — Left column of Mission Control.
 * Shows player stats + compact human edges list.
 */
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap, Target, Play, ShieldCheck, Lock, ArrowRight, Sparkles,
} from "lucide-react";
import {
  SKILL_TAXONOMY,
  CATEGORY_META,
  type SkillXP,
} from "@/lib/skill-map";

interface PlayerHUDProps {
  skills: SkillXP[];
  uniqueTasks: number;
  isEmpty: boolean;
}

export default function PlayerHUD({ skills, uniqueTasks, isEmpty }: PlayerHUDProps) {
  const navigate = useNavigate();

  const activeSkills = useMemo(() => skills.filter(s => s.xp > 0), [skills]);
  const leveledUp = useMemo(() => activeSkills.filter(s => s.levelIndex >= 1).length, [activeSkills]);
  const totalXP = useMemo(() => activeSkills.reduce((sum, s) => sum + s.xp, 0), [activeSkills]);

  // Human edges
  const discoveredEdges = useMemo(() =>
    activeSkills.filter(s => s.humanEdge).map(s => ({
      label: s.humanEdge!,
      skill: s.name,
      category: s.category,
      levelIndex: s.levelIndex,
    })),
    [activeSkills]
  );

  const lockedEdges = useMemo(() => {
    const activeIds = new Set(activeSkills.map(s => s.id));
    return SKILL_TAXONOMY
      .filter(t => t.humanEdge && !activeIds.has(t.id))
      .slice(0, 6);
  }, [activeSkills]);

  const stats = [
    { label: "XP", value: totalXP, icon: Zap },
    { label: "Skills", value: `${activeSkills.length}/${SKILL_TAXONOMY.length}`, icon: Target },
    { label: "Leveled", value: leveledUp, icon: Sparkles },
    { label: "Tasks", value: uniqueTasks, icon: Play },
  ];

  const levelLabels = ["BEG", "DEV", "PRO", "EXP"];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Panel header */}
      <div className="px-3 py-2.5 border-b border-white/5">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Player HUD</h2>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-1.5 p-3">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="rounded-lg p-2 text-center"
            style={{ background: "hsla(240, 10%, 10%, 0.7)", border: "1px solid hsla(0,0%,100%,0.06)" }}
          >
            <stat.icon className="h-3 w-3 mx-auto mb-0.5" style={{ color: "hsl(180, 90%, 60%)" }} />
            <p className="text-sm font-bold text-white font-mono tabular-nums">{stat.value}</p>
            <p className="text-[8px] uppercase tracking-wider text-white/30">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Human Edges */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
        <div className="flex items-center gap-1.5 mb-2 mt-1">
          <ShieldCheck className="h-3 w-3" style={{ color: "hsl(270, 80%, 65%)" }} />
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/40">Human Edges</span>
          <span className="ml-auto text-[9px] font-mono text-white/20">
            {discoveredEdges.length}/{discoveredEdges.length + lockedEdges.length}
          </span>
        </div>

        <div className="space-y-1">
          {discoveredEdges.map((edge, i) => (
            <motion.div
              key={edge.label}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5"
              style={{ background: "hsla(270, 40%, 20%, 0.3)", border: "1px solid hsla(270, 80%, 65%, 0.15)" }}
            >
              <ShieldCheck className="h-3 w-3 shrink-0" style={{ color: "hsl(270, 80%, 65%)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-white/80 truncate">{edge.label}</p>
                <p className="text-[8px] text-white/30 truncate">
                  {CATEGORY_META[edge.category].emoji} {edge.skill}
                </p>
              </div>
              <span className="text-[8px] font-mono shrink-0" style={{ color: "hsl(180, 90%, 60%)" }}>
                {levelLabels[edge.levelIndex]}
              </span>
            </motion.div>
          ))}

          {lockedEdges.map((tax) => (
            <div
              key={tax.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 opacity-40"
              style={{ border: "1px dashed hsla(0,0%,100%,0.08)" }}
            >
              <Lock className="h-2.5 w-2.5 shrink-0 text-white/20" />
              <p className="text-[10px] text-white/30 truncate flex-1">{tax.humanEdge}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA if empty */}
      {isEmpty && (
        <div className="p-3 border-t border-white/5">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-colors"
            style={{
              background: "linear-gradient(135deg, hsl(180, 90%, 50%), hsl(270, 80%, 60%))",
              color: "white",
            }}
          >
            Start Exploring <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
