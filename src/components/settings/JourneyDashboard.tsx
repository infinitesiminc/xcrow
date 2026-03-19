/**
 * Journey Dashboard — Skill Map Grid
 *
 * Replaces the bullseye/CareerReachMap with a gamified skill grid.
 * Stats ribbon → SkillMapGrid with category sections
 */
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Play, Target, Briefcase, ArrowRight, BookOpen, Zap,
} from "lucide-react";
import SkillMapGrid from "./SkillMapGrid";
import HumanEdgesSection from "./HumanEdgesSection";
import {
  aggregateSkillXP,
  matchTaskToSkills,
  type SimRecord,
} from "@/lib/skill-map";

/* ─── Types ─── */
export interface PracticedRoleData {
  job_title: string;
  task_name: string;
  company: string | null;
  completed_at: string;
  correct_answers: number;
  total_questions: number;
  tool_awareness_score: number | null;
  human_value_add_score: number | null;
  adaptive_thinking_score: number | null;
  domain_judgment_score: number | null;
  skills_earned?: { skill_id: string; xp: number }[] | null;
}

export interface SavedRoleData {
  job_title: string;
  company: string | null;
  augmented_percent: number | null;
  automation_risk_percent: number | null;
  new_skills_percent: number | null;
}

/* ─── Main Component ─── */

interface JourneyDashboardProps {
  practicedRoles: PracticedRoleData[];
  savedRoles: SavedRoleData[];
  loading: boolean;
}

export default function JourneyDashboard({ practicedRoles, savedRoles, loading }: JourneyDashboardProps) {
  const navigate = useNavigate();

  // Convert to SimRecord for aggregation
  const simRecords: SimRecord[] = useMemo(() =>
    practicedRoles.map(r => ({
      task_name: r.task_name,
      job_title: r.job_title,
      skills_earned: r.skills_earned,
    })),
    [practicedRoles]
  );

  const skills = useMemo(() => aggregateSkillXP(simRecords), [simRecords]);
  const activeSkills = useMemo(() => skills.filter(s => s.xp > 0), [skills]);
  const leveledUp = useMemo(() => activeSkills.filter(s => s.levelIndex >= 1).length, [activeSkills]);
  const uniqueTasks = useMemo(() => new Set(practicedRoles.map(r => r.task_name)).size, [practicedRoles]);

  // Build skill → tasks map for detail panel
  const skillTasks = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const sim of practicedRoles) {
      const ids = matchTaskToSkills(sim.task_name, sim.job_title);
      for (const id of ids) {
        const arr = map.get(id) || [];
        if (!arr.includes(sim.task_name)) arr.push(sim.task_name);
        map.set(id, arr);
      }
    }
    return map;
  }, [practicedRoles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isEmpty = practicedRoles.length === 0;

  return (
    <div>
      <div className="mb-1">
        <h2 className="text-xl font-bold text-foreground">My Skill Map</h2>
        <p className="text-sm text-muted-foreground">Build skills. Land jobs before you graduate.</p>
      </div>

      {/* ── Stats Ribbon ── */}
      <div className="grid grid-cols-3 gap-2 mt-4 mb-5">
        {[
          { label: "Skills", value: activeSkills.length, icon: Zap },
          { label: "Leveled Up", value: leveledUp, icon: Target },
          { label: "Tasks Practiced", value: uniqueTasks, icon: Play },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border/40 bg-card p-2.5 text-center">
            <stat.icon className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Empty State ── */}
      {isEmpty && (
        <div className="text-center py-16">
          <BookOpen className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No skills yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1 mb-4">Practice tasks to start building your skill map</p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Start Exploring <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Skill Map Grid ── */}
      {!isEmpty && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <SkillMapGrid skills={skills} skillTasks={skillTasks} />
        </motion.div>
      )}
    </div>
  );
}
