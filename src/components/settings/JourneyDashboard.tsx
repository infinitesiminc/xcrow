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
  Play, Target, ArrowRight, Zap, Sparkles, ShieldCheck, Lock,
} from "lucide-react";
import SkillMapGrid from "./SkillMapGrid";
import HumanEdgesSection from "./HumanEdgesSection";
import {
  aggregateSkillXP,
  matchTaskToSkills,
  SKILL_TAXONOMY,
  CATEGORY_META,
  type SimRecord,
  type SkillCategory,
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

/* ─── Preview data for empty state ─── */
const PREVIEW_SKILLS: { id: string; name: string; category: SkillCategory; humanEdge: string; aiExposure: number }[] = [
  { id: "code-dev", name: "Software Development", category: "technical", humanEdge: "System thinking", aiExposure: 72 },
  { id: "data-analysis", name: "Data Analysis", category: "analytical", humanEdge: "Asking the right questions", aiExposure: 80 },
  { id: "stakeholder-mgmt", name: "Stakeholder Management", category: "communication", humanEdge: "Trust building", aiExposure: 15 },
  { id: "strategy", name: "Strategy & Planning", category: "leadership", humanEdge: "Competitive intuition", aiExposure: 25 },
  { id: "design-ux", name: "Design & UX", category: "creative", humanEdge: "Empathy-driven design", aiExposure: 55 },
  { id: "regulatory", name: "Regulatory & Legal", category: "compliance", humanEdge: "Jurisdictional judgment", aiExposure: 45 },
];

const PREVIEW_EDGES = [
  { label: "System thinking", skill: "Software Development", emoji: "⚙️", aiExposure: 72 },
  { label: "Trust building", skill: "Stakeholder Management", emoji: "💬", aiExposure: 15 },
  { label: "Competitive intuition", skill: "Strategy & Planning", emoji: "🎯", aiExposure: 25 },
];

/* ─── Main Component ─── */

interface JourneyDashboardProps {
  practicedRoles: PracticedRoleData[];
  savedRoles: SavedRoleData[];
  loading: boolean;
}

export default function JourneyDashboard({ practicedRoles, savedRoles, loading }: JourneyDashboardProps) {
  const navigate = useNavigate();

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
          { label: "Skills", value: isEmpty ? `0 / ${SKILL_TAXONOMY.length}` : `${activeSkills.length} / ${SKILL_TAXONOMY.length}`, icon: Zap },
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

      {/* ── Empty State with Preview ── */}
      {isEmpty && (
        <div className="space-y-6">
          {/* Preview skill categories */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              {SKILL_TAXONOMY.length} skills to unlock across {Object.keys(CATEGORY_META).length} categories
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PREVIEW_SKILLS.map((skill, i) => {
                const catMeta = CATEGORY_META[skill.category];
                return (
                  <motion.div
                    key={skill.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 0.6, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="rounded-xl border border-dashed border-border/40 bg-card/50 p-3 relative overflow-hidden"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-xs">{catMeta.emoji}</span>
                      <p className="text-[11px] font-medium text-foreground/70 truncate">{skill.name}</p>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                      <div className="h-full rounded-full bg-primary/20 w-0" />
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1">Beginner · 0 XP</p>
                    <Lock className="absolute top-2 right-2 h-3 w-3 text-muted-foreground/30" />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Preview human edges */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-primary/40" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {SKILL_TAXONOMY.length} human edges to discover
              </p>
            </div>
            <div className="space-y-1.5">
              {PREVIEW_EDGES.map((edge, i) => (
                <motion.div
                  key={edge.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 0.5, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-border/30 bg-card/30 px-4 py-2.5"
                >
                  <ShieldCheck className="h-4 w-4 text-primary/30 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground/50">{edge.label}</p>
                    <p className="text-[10px] text-muted-foreground/50">
                      {edge.emoji} {edge.skill} · {edge.aiExposure}% AI exposure
                    </p>
                  </div>
                  <Lock className="h-3 w-3 text-muted-foreground/20 shrink-0" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center pt-2 pb-4">
            <p className="text-xs text-muted-foreground/60 mb-3">
              Practice your first task to start unlocking skills & edges
            </p>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Start Exploring <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Skill Map Grid ── */}
      {!isEmpty && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <SkillMapGrid skills={skills} skillTasks={skillTasks} />
          <HumanEdgesSection skills={skills} />
        </motion.div>
      )}
    </div>
  );
}
