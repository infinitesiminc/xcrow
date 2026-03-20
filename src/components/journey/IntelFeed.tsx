/**
 * IntelFeed — Quest Log (right panel).
 * Goal-specific: target role gaps, AI dispatches, role coverage progress.
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Zap, Target, TrendingUp, Scroll, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type SkillXP, SKILL_TAXONOMY } from "@/lib/skill-map";
import type { SavedRoleData } from "@/components/settings/JourneyDashboard";
import type { TargetRole } from "@/pages/Journey";

const FRONTIER_RELEASES = [
  { model: "Claude 4.7 Sonnet" },
  { model: "GPT-5.4" },
  { model: "Gemini 3.1 Flash" },
  { model: "Llama 4 Maverick" },
  { model: "Gemini 3.1 Pro" },
  { model: "Mistral Large 3" },
  { model: "GPT-5.3" },
  { model: "Claude 4.6" },
  { model: "Gemini 3 Flash" },
  { model: "DeepSeek R2 Lite" },
];

interface IntelFeedProps {
  skills: SkillXP[];
  savedRoles: SavedRoleData[];
  targetRoles: TargetRole[];
  targetSkillNames: Set<string>;
}

interface MarketSkill {
  skill_name: string;
  demand_count: number;
  avg_exposure: number;
}

export default function IntelFeed({ skills, savedRoles, targetRoles, targetSkillNames }: IntelFeedProps) {
  const [marketSkills, setMarketSkills] = useState<MarketSkill[]>([]);
  const [aiDropIndex, setAiDropIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const hasTargets = targetRoles.length > 0;

  useEffect(() => {
    supabase.rpc("get_market_skill_demand", { top_n: 20 }).then(({ data }) => {
      if (data) setMarketSkills(data as MarketSkill[]);
    });
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => setAiDropIndex(prev => (prev + 1) % FRONTIER_RELEASES.length), 3000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Gap skills: skills target roles need that user hasn't practiced
  const gapSkills = useMemo(() => {
    const activeNames = new Set(skills.filter(s => s.xp > 0).map(s => s.name.toLowerCase()));

    if (hasTargets) {
      // Show target-role gaps first, enriched with market data
      return Array.from(targetSkillNames)
        .filter(name => !activeNames.has(name))
        .map(name => {
          const market = marketSkills.find(m => m.skill_name.toLowerCase() === name);
          return {
            skill_name: name,
            demand_count: market?.demand_count || 0,
            avg_exposure: market?.avg_exposure || 0,
            isTargetGap: true,
          };
        })
        .sort((a, b) => b.demand_count - a.demand_count)
        .slice(0, 6);
    }

    // Fallback: generic market gaps
    return marketSkills
      .filter(ms => !activeNames.has(ms.skill_name.toLowerCase()))
      .slice(0, 5)
      .map(ms => ({ ...ms, isTargetGap: false }));
  }, [marketSkills, skills, targetSkillNames, hasTargets]);

  // Target role coverage progress
  const roleCoverage = useMemo(() => {
    if (!hasTargets) {
      // Use saved/bookmarked roles as fallback
      const activeCount = skills.filter(s => s.xp > 0).length;
      const total = SKILL_TAXONOMY.length;
      return savedRoles.slice(0, 4).map(r => ({
        title: r.job_title,
        company: r.company,
        coverage: Math.round((activeCount / total) * 100),
      }));
    }
    // For target roles, coverage = claimed skills out of needed skills
    // (simplified — we can't per-role here without per-role skill lists, so use global targetSkillNames)
    const activeNames = new Set(skills.filter(s => s.xp > 0).map(s => s.name.toLowerCase()));
    const claimed = Array.from(targetSkillNames).filter(n => activeNames.has(n)).length;
    const total = targetSkillNames.size || 1;
    return targetRoles.map(r => ({
      title: r.title,
      company: r.company,
      coverage: Math.round((claimed / total) * 100),
    }));
  }, [targetRoles, targetSkillNames, skills, savedRoles, hasTargets]);

  const visibleDrops = useMemo(() => {
    const result = [];
    for (let i = 0; i < 3; i++) {
      result.push(FRONTIER_RELEASES[(aiDropIndex + i) % FRONTIER_RELEASES.length]);
    }
    return result;
  }, [aiDropIndex]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Scroll className="h-3.5 w-3.5 text-white/40" />
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-white/55">Quest Log</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Skill Gaps — Goal-specific */}
        <QuestSection
          title={hasTargets ? "Frontier Skills" : "Active Quests"}
          subtitle={hasTargets ? "Needed for your target roles" : "Skills the market wants"}
          icon={hasTargets ? MapPin : Flame}
          color="hsl(330, 45%, 55%)"
        >
          {gapSkills.length > 0 ? (
            gapSkills.map((gs, i) => (
              <motion.div
                key={gs.skill_name}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                style={{ background: "hsla(240, 10%, 14%, 0.6)", border: gs.isTargetGap ? "1px solid hsla(330, 40%, 45%, 0.15)" : "1px solid hsla(330, 30%, 40%, 0.12)" }}
              >
                {gs.isTargetGap ? (
                  <Flame className="h-3 w-3 shrink-0" style={{ color: "hsl(330, 50%, 55%)" }} />
                ) : (
                  <TrendingUp className="h-3 w-3 shrink-0" style={{ color: "hsl(330, 45%, 55%)" }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-white/65 truncate capitalize">{gs.skill_name}</p>
                  <p className="text-[8px] text-white/28">
                    {gs.demand_count > 0 ? `${gs.demand_count} roles · ${Math.round(gs.avg_exposure)}% AI` : "Required by target"}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-[9px] text-white/20 px-3 py-2">
              {hasTargets ? "All target skills claimed! 🎉" : "Loading market data…"}
            </p>
          )}
        </QuestSection>

        {/* AI Dispatches */}
        <QuestSection title="AI Dispatches" subtitle="New model releases" icon={Zap} color="hsl(0, 60%, 55%)">
          <AnimatePresence mode="popLayout">
            {visibleDrops.map((drop, i) => (
              <motion.div
                key={`${drop.model}-${aiDropIndex}-${i}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                style={{ background: "hsla(240, 10%, 14%, 0.6)", border: "1px solid hsla(0, 40%, 40%, 0.1)" }}
              >
                <Zap className="h-3 w-3 shrink-0" style={{ color: "hsl(0, 55%, 55%)", opacity: 0.6 }} />
                <p className="text-[10px] font-mono font-medium text-white/55 truncate flex-1">{drop.model}</p>
                <span className="text-[8px] text-white/18 shrink-0">new</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </QuestSection>

        {/* Role Coverage Progress */}
        <QuestSection
          title={hasTargets ? "Target Progress" : "Role Unlocks"}
          subtitle={hasTargets ? "Coverage toward your goals" : "Roles within reach"}
          icon={Target}
          color="hsl(180, 45%, 50%)"
          noBorder
        >
          {roleCoverage.length > 0 ? (
            roleCoverage.map((role, i) => (
              <motion.div
                key={`${role.title}-${i}`}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                style={{ background: "hsla(240, 10%, 14%, 0.6)", border: "1px solid hsla(180, 30%, 40%, 0.1)" }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-white/65 truncate">{role.title}</p>
                  {role.company && <p className="text-[8px] text-white/25 truncate">{role.company}</p>}
                </div>
                <div className="shrink-0">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ border: `1.5px solid ${role.coverage >= 80 ? "hsl(150, 50%, 50%)" : "hsl(180, 45%, 50%)"}` }}>
                    <span className="text-[8px] font-mono font-bold" style={{ color: role.coverage >= 80 ? "hsl(150, 50%, 50%)" : "hsl(180, 45%, 50%)" }}>
                      {role.coverage}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-[9px] text-white/20 px-3 py-2">
              {hasTargets ? "Computing coverage…" : "Save roles to track unlocks"}
            </p>
          )}
        </QuestSection>
      </div>
    </div>
  );
}

function QuestSection({
  title, subtitle, icon: Icon, color, noBorder, children,
}: {
  title: string; subtitle: string; icon: React.ElementType; color: string; noBorder?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`px-4 py-3 ${noBorder ? "" : "border-b border-white/5"}`}>
      <div className="flex items-center gap-2 mb-2.5">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color }}>{title}</span>
          <p className="text-[8px] text-white/25">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
