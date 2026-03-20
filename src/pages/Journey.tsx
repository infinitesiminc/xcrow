import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

export interface SavedRoleData {
  job_title: string;
  company: string | null;
  bookmarked_at: string;
  augmented_percent: number | null;
  automation_risk_percent: number | null;
  new_skills_percent: number | null;
}

export interface PracticedRoleData {
  job_title: string;
  task_name: string;
  company: string | null;
  completed_at: string;
  correct_answers: number;
  total_questions: number;
  skills_earned: any;
  tool_awareness_score: number | null;
  human_value_add_score: number | null;
  adaptive_thinking_score: number | null;
  domain_judgment_score: number | null;
}
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

export interface TargetRole {
  job_id: string;
  title: string;
  company: string | null;
}

export default function Journey() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [savedRoles, setSavedRoles] = useState<SavedRoleData[]>([]);
  const [practicedRoles, setPracticedRoles] = useState<PracticedRoleData[]>([]);
  const [targetRoles, setTargetRoles] = useState<TargetRole[]>([]);
  const [targetSkillNames, setTargetSkillNames] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/"); return; }

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

    // Fetch target roles from profile
    const p3 = supabase
      .from("profiles")
      .select("target_roles")
      .eq("id", user.id)
      .single()
      .then(async ({ data }) => {
        const roles = ((data as any)?.target_roles || []) as TargetRole[];
        setTargetRoles(roles);

        // Fetch skill_names from job_task_clusters for target role job_ids
        if (roles.length > 0) {
          const jobIds = roles.map(r => r.job_id);
          const { data: clusters } = await supabase
            .from("job_task_clusters")
            .select("skill_names")
            .in("job_id", jobIds);

          const names = new Set<string>();
          for (const c of (clusters || [])) {
            for (const s of (c.skill_names || [])) {
              names.add(s.toLowerCase());
            }
          }
          setTargetSkillNames(names);
        }
      });

    Promise.all([p1, p2, p3]).then(() => setLoading(false));
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
        <div className="min-h-[calc(100vh-56px)] overflow-y-auto" style={{ background: "linear-gradient(180deg, hsl(240, 10%, 5%), hsl(240, 8%, 7%))" }}>
          <div className="border-b border-white/5">
            <PlayerHUD skills={skills} uniqueTasks={uniqueTasks} isEmpty={isEmpty} targetRoles={targetRoles} targetSkillNames={targetSkillNames} />
          </div>
          <div className="border-b border-white/5">
            <div className="min-h-[400px]">
              <CompactSkillGrid skills={skills} skillTasks={skillTasks} targetSkillNames={targetSkillNames} />
            </div>
          </div>
          <div>
            <IntelFeed skills={skills} savedRoles={savedRoles} targetRoles={targetRoles} targetSkillNames={targetSkillNames} />
          </div>
          <StickyTicker />
        </div>
      </>
    );
  }

  // Desktop: fixed-height 3-column RPG layout
  return (
    <>
      <Navbar />
      <div
        className="h-[calc(100vh-56px)] overflow-hidden flex flex-col"
        style={{ background: "linear-gradient(180deg, hsl(240, 10%, 5%), hsl(240, 8%, 7%))" }}
      >
        <div className="flex-1 grid grid-cols-[240px_1fr_260px] gap-0 min-h-0 overflow-hidden relative z-10">
          <div className="border-r border-white/[0.04] relative overflow-hidden" style={{ background: "hsl(240, 10%, 7%)" }}>
            <PlayerHUD skills={skills} uniqueTasks={uniqueTasks} isEmpty={isEmpty} targetRoles={targetRoles} targetSkillNames={targetSkillNames} />
          </div>
          <div className="relative overflow-hidden" style={{ background: "hsl(240, 10%, 6%)" }}>
            <CompactSkillGrid skills={skills} skillTasks={skillTasks} targetSkillNames={targetSkillNames} />
          </div>
          <div className="border-l border-white/[0.04] relative overflow-hidden" style={{ background: "hsl(240, 10%, 7%)" }}>
            <IntelFeed skills={skills} savedRoles={savedRoles} targetRoles={targetRoles} targetSkillNames={targetSkillNames} />
          </div>
        </div>
        <StickyTicker />
      </div>
    </>
  );
}
