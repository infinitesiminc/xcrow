/**
 * IntelFeed — Right column of Mission Control.
 * Hot Skills (market demand gaps), AI Drops, Role Unlocks.
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Flame, Zap, Unlock, TrendingUp, AlertTriangle } from "lucide-react";
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

  // Fetch market demand
  useEffect(() => {
    supabase.rpc("get_market_skill_demand", { top_n: 20 }).then(({ data }) => {
      if (data) setMarketSkills(data as MarketSkill[]);
    });
  }, []);

  // Rotate AI drops
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setAiDropIndex(prev => (prev + 1) % FRONTIER_RELEASES.length);
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Hot skills: market demand that user hasn't practiced
  const hotSkills = useMemo(() => {
    const activeIds = new Set(skills.filter(s => s.xp > 0).map(s => s.name.toLowerCase()));
    return marketSkills
      .filter(ms => !activeIds.has(ms.skill_name.toLowerCase()))
      .slice(0, 6);
  }, [marketSkills, skills]);

  // Role unlocks: roles user saved, with skill coverage estimate
  const roleUnlocks = useMemo(() => {
    const activeCount = skills.filter(s => s.xp > 0).length;
    const total = SKILL_TAXONOMY.length;
    return savedRoles.slice(0, 5).map(r => ({
      title: r.job_title,
      company: r.company,
      coverage: Math.round((activeCount / total) * 100),
    }));
  }, [savedRoles, skills]);

  // Visible AI drops (show 4 at a time)
  const visibleDrops = useMemo(() => {
    const result = [];
    for (let i = 0; i < 4; i++) {
      result.push(FRONTIER_RELEASES[(aiDropIndex + i) % FRONTIER_RELEASES.length]);
    }
    return result;
  }, [aiDropIndex]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-3 py-2.5 border-b border-white/5">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Intel Feed</h2>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Hot Skills */}
        <div className="p-3 border-b border-white/5">
          <div className="flex items-center gap-1.5 mb-2">
            <Flame className="h-3 w-3" style={{ color: "hsl(330, 90%, 60%)" }} />
            <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: "hsl(330, 90%, 60%)" }}>
              Hot Skills
            </span>
          </div>
          {hotSkills.length > 0 ? (
            <div className="space-y-1">
              {hotSkills.map((hs, i) => (
                <motion.div
                  key={hs.skill_name}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                  style={{ background: "hsla(330, 40%, 15%, 0.3)", border: "1px solid hsla(330, 90%, 60%, 0.12)" }}
                >
                  <TrendingUp className="h-2.5 w-2.5 shrink-0" style={{ color: "hsl(330, 90%, 60%)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-white/70 truncate">{hs.skill_name}</p>
                    <p className="text-[8px] text-white/25">{hs.demand_count} roles · {Math.round(hs.avg_exposure)}% AI</p>
                  </div>
                  <AlertTriangle className="h-2.5 w-2.5 shrink-0" style={{ color: "hsl(330, 90%, 60%)", opacity: 0.5 }} />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-[9px] text-white/20">Loading market data…</p>
          )}
        </div>

        {/* AI Drops */}
        <div className="p-3 border-b border-white/5">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="h-3 w-3 text-destructive" />
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-destructive">
              AI Drops
            </span>
          </div>
          <div className="space-y-1">
            {visibleDrops.map((drop, i) => (
              <motion.div
                key={`${drop.model}-${aiDropIndex}-${i}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                style={{ background: "hsla(0, 50%, 15%, 0.3)", border: "1px solid hsla(0, 80%, 50%, 0.12)" }}
              >
                <Zap className="h-2.5 w-2.5 shrink-0 text-destructive/60" />
                <p className="text-[10px] font-mono font-medium text-white/60 truncate">{drop.model}</p>
                <span className="text-[8px] text-white/20 shrink-0">released</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Role Unlocks */}
        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Unlock className="h-3 w-3" style={{ color: "hsl(180, 90%, 60%)" }} />
            <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: "hsl(180, 90%, 60%)" }}>
              Role Unlocks
            </span>
          </div>
          {roleUnlocks.length > 0 ? (
            <div className="space-y-1">
              {roleUnlocks.map((role, i) => (
                <motion.div
                  key={`${role.title}-${i}`}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                  style={{ background: "hsla(180, 30%, 12%, 0.3)", border: "1px solid hsla(180, 90%, 60%, 0.12)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-white/70 truncate">{role.title}</p>
                    {role.company && (
                      <p className="text-[8px] text-white/25 truncate">{role.company}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[9px] font-mono font-bold" style={{ color: "hsl(180, 90%, 60%)" }}>
                      {role.coverage}%
                    </p>
                    <p className="text-[7px] text-white/20">match</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-[9px] text-white/20">Save roles to track unlocks</p>
          )}
        </div>
      </div>
    </div>
  );
}
