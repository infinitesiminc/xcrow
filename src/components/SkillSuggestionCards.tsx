/**
 * SkillSuggestionCards — mini skill progress rings for homepage.
 * Shows top 5 active skills with XP progress + "Continue building" CTA.
 */
import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { aggregateSkillXP, type SimRecord, type SkillXP, LEVELS } from "@/lib/skill-map";

function MiniProgressRing({ progress, size = 36, strokeWidth = 3, active = true }: { progress: number; size?: number; strokeWidth?: number; active?: boolean }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={strokeWidth}
        opacity={0.3}
      />
      {active && (
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
    </svg>
  );
}

export default function SkillSuggestionCards() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topSkills, setTopSkills] = useState<SkillXP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    async function compute() {
      try {
        const { data: sims } = await supabase
          .from("completed_simulations")
          .select("job_title, task_name, skills_earned")
          .eq("user_id", user!.id)
          .limit(200);

        if (!sims || sims.length < 2) { setLoading(false); return; }

        const records: SimRecord[] = sims.map((s: any) => ({
          task_name: s.task_name,
          job_title: s.job_title,
          skills_earned: s.skills_earned,
        }));

        const all = aggregateSkillXP(records);
        const active = all.filter(s => s.xp > 0).sort((a, b) => b.xp - a.xp).slice(0, 5);
        setTopSkills(active);
      } catch {
        // Silent fail
      }
      setLoading(false);
    }

    compute();
  }, [user]);

  if (loading || topSkills.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full max-w-xl mx-auto mb-4"
    >
      <div className="flex items-center gap-2 mb-2.5 px-1">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">Your Skills</span>
        <button
          onClick={() => navigate("/map")}
          className="ml-auto text-[10px] text-primary hover:underline flex items-center gap-0.5"
        >
          View Skill Map <ArrowRight className="h-2.5 w-2.5" />
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 px-1">
        {topSkills.map((skill, i) => (
          <motion.button
            key={skill.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.06 }}
            onClick={() => navigate("/map")}
            className="flex flex-col items-center min-w-[80px] rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 p-2.5 transition-all hover:shadow-md hover:shadow-primary/10 group"
          >
            <MiniProgressRing progress={skill.progress} />
            <p className="text-[10px] font-semibold text-foreground mt-1.5 text-center leading-tight line-clamp-2">
              {skill.name}
            </p>
            <span className="text-[8px] text-primary font-medium mt-0.5">{skill.level}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
