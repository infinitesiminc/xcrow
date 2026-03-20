/**
 * IntelFeed — Quest Log (right panel).
 * Active Quests (hot skills), Dispatches (AI drops), Role Unlocks.
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Zap, Unlock, TrendingUp, Scroll, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type SkillXP, SKILL_TAXONOMY } from "@/lib/skill-map";
import type { SavedRoleData } from "@/components/settings/JourneyDashboard";

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
}

interface MarketSkill {
  skill_name: string;
  demand_count: number;
  avg_exposure: number;
}

export default function IntelFeed({ skills, savedRoles }: IntelFeedProps) {
  const [marketSkills, setMarketSkills] = useState<MarketSkill[]>([]);
  const [aiDropIndex, setAiDropIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    supabase.rpc("get_market_skill_demand", { top_n: 20 }).then(({ data }) => {
      if (data) setMarketSkills(data as MarketSkill[]);
    });
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setAiDropIndex(prev => (prev + 1) % FRONTIER_RELEASES.length);
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const hotSkills = useMemo(() => {
    const activeIds = new Set(skills.filter(s => s.xp > 0).map(s => s.name.toLowerCase()));
    return marketSkills
      .filter(ms => !activeIds.has(ms.skill_name.toLowerCase()))
      .slice(0, 5);
  }, [marketSkills, skills]);

  const roleUnlocks = useMemo(() => {
    const activeCount = skills.filter(s => s.xp > 0).length;
    const total = SKILL_TAXONOMY.length;
    return savedRoles.slice(0, 4).map(r => ({
      title: r.job_title,
      company: r.company,
      coverage: Math.round((activeCount / total) * 100),
    }));
  }, [savedRoles, skills]);

  const visibleDrops = useMemo(() => {
    const result = [];
    for (let i = 0; i < 3; i++) {
      result.push(FRONTIER_RELEASES[(aiDropIndex + i) % FRONTIER_RELEASES.length]);
    }
    return result;
  }, [aiDropIndex]);

  const sections = [
    {
      id: "quests",
      title: "Active Quests",
      subtitle: "Skills the market wants",
      icon: Flame,
      color: "hsl(330, 45%, 55%)",
    },
    {
      id: "dispatches",
      title: "AI Dispatches",
      subtitle: "New model releases",
      icon: Zap,
      color: "hsl(0, 60%, 55%)",
    },
    {
      id: "unlocks",
      title: "Role Unlocks",
      subtitle: "Roles within reach",
      icon: Unlock,
      color: "hsl(180, 45%, 50%)",
    },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Scroll className="h-3.5 w-3.5 text-white/40" />
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-white/55">Quest Log</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Active Quests — Hot Skills */}
        <QuestSection
          title={sections[0].title}
          subtitle={sections[0].subtitle}
          icon={sections[0].icon}
          color={sections[0].color}
        >
          {hotSkills.length > 0 ? (
            hotSkills.map((hs, i) => (
              <motion.div
                key={hs.skill_name}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                style={{ background: "hsla(240, 10%, 14%, 0.6)", border: "1px solid hsla(330, 30%, 40%, 0.12)" }}
              >
                <TrendingUp className="h-3 w-3 shrink-0" style={{ color: "hsl(330, 45%, 55%)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-white/65 truncate">{hs.skill_name}</p>
                  <p className="text-[8px] text-white/28">{hs.demand_count} roles · {Math.round(hs.avg_exposure)}% AI</p>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-[9px] text-white/20 px-3 py-2">Loading market data…</p>
          )}
        </QuestSection>

        {/* AI Dispatches */}
        <QuestSection
          title={sections[1].title}
          subtitle={sections[1].subtitle}
          icon={sections[1].icon}
          color={sections[1].color}
        >
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

        {/* Role Unlocks */}
        <QuestSection
          title={sections[2].title}
          subtitle={sections[2].subtitle}
          icon={sections[2].icon}
          color={sections[2].color}
          noBorder
        >
          {roleUnlocks.length > 0 ? (
            roleUnlocks.map((role, i) => (
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
                  {role.company && (
                    <p className="text-[8px] text-white/25 truncate">{role.company}</p>
                  )}
                </div>
                <div className="shrink-0">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ border: "1.5px solid hsl(180, 45%, 50%)" }}>
                    <span className="text-[8px] font-mono font-bold" style={{ color: "hsl(180, 45%, 50%)" }}>
                      {role.coverage}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-[9px] text-white/20 px-3 py-2">Save roles to track unlocks</p>
          )}
        </QuestSection>
      </div>
    </div>
  );
}

/* ── Quest Section wrapper ── */
function QuestSection({
  title, subtitle, icon: Icon, color, noBorder, children,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  noBorder?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`px-4 py-3 ${noBorder ? "" : "border-b border-white/5"}`}>
      <div className="flex items-center gap-2 mb-2.5">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color }}>
            {title}
          </span>
          <p className="text-[8px] text-white/25">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {children}
      </div>
    </div>
  );
}
