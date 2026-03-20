import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import type { PracticedRoleData, SavedRoleData } from "@/components/settings/JourneyDashboard";
import Navbar from "@/components/Navbar";
import PlayerHUD from "@/components/journey/PlayerHUD";
import CompactSkillGrid from "@/components/journey/CompactSkillGrid";
import IntelFeed from "@/components/journey/IntelFeed";
import StickyTicker from "@/components/StickyTicker";
import {
  aggregateSkillXP,
  matchTaskToSkills,
  type SimRecord,
} from "@/lib/skill-map";

export default function Journey() {
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const isMobile = useIsMobile();

  const [savedRoles, setSavedRoles] = useState<SavedRoleData[]>([]);
  const [practicedRoles, setPracticedRoles] = useState<PracticedRoleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { openAuthModal(); return; }

    const p1 = supabase
      .from("bookmarked_roles")
      .select("job_title, company, augmented_percent, automation_risk_percent, new_skills_percent")
      .eq("user_id", user.id)
      .order("bookmarked_at", { ascending: false })
      .then(({ data }) => setSavedRoles((data as SavedRoleData[]) || []));

    const p2 = supabase
      .from("completed_simulations")
      .select("job_title, task_name, company, completed_at, correct_answers, total_questions, tool_awareness_score, human_value_add_score, adaptive_thinking_score, domain_judgment_score, skills_earned")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .then(({ data }) => setPracticedRoles((data as PracticedRoleData[]) || []));

    Promise.all([p1, p2]).then(() => setLoading(false));
  }, [user, authLoading]);

  const simRecords: SimRecord[] = useMemo(() =>
    practicedRoles.map(r => ({ task_name: r.task_name, job_title: r.job_title, skills_earned: r.skills_earned })),
    [practicedRoles]
  );

  const skills = useMemo(() => aggregateSkillXP(simRecords), [simRecords]);
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

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-56px)]" style={{ background: "hsl(240, 10%, 4%)" }}>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "hsl(180, 90%, 60%)", borderTopColor: "transparent" }} />
        </div>
      </>
    );
  }

  const isEmpty = practicedRoles.length === 0;

  // Mobile: scrollable stacked layout
  if (isMobile) {
    return (
      <>
        <Navbar />
        <div className="min-h-[calc(100vh-56px)] overflow-y-auto" style={{ background: "linear-gradient(180deg, hsl(240, 10%, 4%), hsl(240, 8%, 8%))" }}>
          <div className="border-b border-white/5" style={{ background: "hsla(240, 10%, 6%, 0.9)" }}>
            <PlayerHUD skills={skills} uniqueTasks={uniqueTasks} isEmpty={isEmpty} />
          </div>
          <div className="border-b border-white/5" style={{ background: "hsla(240, 10%, 6%, 0.9)" }}>
            <div className="min-h-[400px]">
              <CompactSkillGrid skills={skills} skillTasks={skillTasks} />
            </div>
          </div>
          <div style={{ background: "hsla(240, 10%, 6%, 0.9)" }}>
            <IntelFeed skills={skills} savedRoles={savedRoles} />
          </div>
          <StickyTicker />
        </div>
      </>
    );
  }

  // Desktop: fixed-height 3-column grid
  return (
    <>
      <Navbar />
      <div
        className="h-[calc(100vh-56px)] overflow-hidden flex flex-col"
        style={{ background: "linear-gradient(180deg, hsl(240, 10%, 4%), hsl(240, 8%, 8%))" }}
      >
        {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.02]" style={{ background: "radial-gradient(circle, hsl(180, 40%, 50%), transparent 70%)" }} />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.02]" style={{ background: "radial-gradient(circle, hsl(270, 40%, 55%), transparent 70%)" }} />
        </div>

        {/* 3-column grid */}
        <div className="flex-1 grid grid-cols-[220px_1fr_250px] gap-0 min-h-0 relative z-10">
          {/* Left — Player HUD */}
          <div
            className="border-r border-white/5 relative"
            style={{ background: "hsl(240 10% 10%)", border: "1px solid hsl(240 10% 16%)" }}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, hsl(270 40% 55%), hsl(180 40% 50%))" }} />
            <PlayerHUD skills={skills} uniqueTasks={uniqueTasks} isEmpty={isEmpty} />
          </div>

          {/* Center — Skill Map */}
          <div
            className="relative"
            style={{ background: "hsla(240, 10%, 5%, 0.6)", backdropFilter: "blur(8px)" }}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, hsl(180, 40%, 50%), hsl(270, 40%, 55%), hsl(330, 45%, 50%))" }} />
            <CompactSkillGrid skills={skills} skillTasks={skillTasks} />
          </div>

          {/* Right — Intel Feed */}
          <div
            className="border-l border-white/5 relative"
            style={{ background: "hsla(240, 10%, 6%, 0.85)", backdropFilter: "blur(12px)" }}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, hsl(330, 45%, 50%), hsl(270, 40%, 55%))" }} />
            <IntelFeed skills={skills} savedRoles={savedRoles} />
          </div>
        </div>

        {/* Bottom ticker */}
        <StickyTicker />
      </div>
    </>
  );
}
