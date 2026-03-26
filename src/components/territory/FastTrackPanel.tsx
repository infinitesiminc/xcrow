/**
 * FastTrackPanel — Compressed data dashboard for Fast Track (Professional) mode.
 * No RPG narrative — pure metrics, gaps, and action items.
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp, Target, BarChart3, ChevronRight,
  AlertTriangle, Zap, ArrowUpRight, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import XcrowLoader from "@/components/XcrowLoader";

interface TargetRole {
  job_id: string;
  title: string;
  company: string | null;
}

interface RoleMetric {
  jobId: string;
  title: string;
  company: string | null;
  simsCompleted: number;
  totalTasks: number;
  avgScore: number;
  topGap: string | null;
}

interface SkillGap {
  name: string;
  score: number;
  category: string;
}

const cardStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  boxShadow: "0 1px 3px hsl(var(--emboss-shadow) / 0.3)",
};

export default function FastTrackPanel() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<RoleMetric[]>([]);
  const [gaps, setGaps] = useState<SkillGap[]>([]);
  const [totalSims, setTotalSims] = useState(0);
  const [avgOverall, setAvgOverall] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const [profileRes, simsRes, tasksRes] = await Promise.all([
        supabase.from("profiles").select("target_roles").eq("id", user.id).single(),
        supabase
          .from("completed_simulations")
          .select("task_name, job_title, tool_awareness_score, human_value_add_score, adaptive_thinking_score, domain_judgment_score, completed_at")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false }),
        supabase.from("profiles").select("target_roles").eq("id", user.id).single(),
      ]);

      const sims = (simsRes.data || []) as any[];
      setTotalSims(sims.length);

      // Calculate average
      if (sims.length > 0) {
        const scores = sims.map(s => {
          const vals = [s.tool_awareness_score, s.human_value_add_score, s.adaptive_thinking_score, s.domain_judgment_score].filter(Boolean);
          return vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
        });
        setAvgOverall(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));
      }

      // Streak: consecutive days with sims
      if (sims.length > 0) {
        const days = new Set(sims.map(s => new Date(s.completed_at).toDateString()));
        let s = 0;
        const d = new Date();
        while (days.has(d.toDateString())) {
          s++;
          d.setDate(d.getDate() - 1);
        }
        setStreak(s);
      }

      // Role metrics
      const targetRoles = ((profileRes.data as any)?.target_roles || []) as TargetRole[];
      const roleMap = new Map<string, RoleMetric>();
      for (const tr of targetRoles) {
        roleMap.set(tr.title.toLowerCase(), {
          jobId: tr.job_id,
          title: tr.title,
          company: tr.company,
          simsCompleted: 0,
          totalTasks: 0,
          avgScore: 0,
          topGap: null,
        });
      }

      // Aggregate sim scores per role
      const roleScores = new Map<string, number[]>();
      const dimScores = new Map<string, { tool: number[]; human: number[]; adaptive: number[]; domain: number[] }>();
      for (const sim of sims) {
        const key = sim.job_title?.toLowerCase() || "";
        if (!roleScores.has(key)) roleScores.set(key, []);
        if (!dimScores.has(key)) dimScores.set(key, { tool: [], human: [], adaptive: [], domain: [] });
        const dims = dimScores.get(key)!;
        const vals = [sim.tool_awareness_score, sim.human_value_add_score, sim.adaptive_thinking_score, sim.domain_judgment_score].filter(Boolean);
        const avg = vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
        roleScores.get(key)!.push(avg);
        if (sim.tool_awareness_score) dims.tool.push(sim.tool_awareness_score);
        if (sim.human_value_add_score) dims.human.push(sim.human_value_add_score);
        if (sim.adaptive_thinking_score) dims.adaptive.push(sim.adaptive_thinking_score);
        if (sim.domain_judgment_score) dims.domain.push(sim.domain_judgment_score);

        const role = roleMap.get(key);
        if (role) role.simsCompleted++;
      }

      for (const [key, role] of roleMap) {
        const scores = roleScores.get(key);
        if (scores && scores.length > 0) {
          role.avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        }
        const dims = dimScores.get(key);
        if (dims) {
          const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 100;
          const dimAvgs = [
            { name: "Tool Awareness", score: avg(dims.tool) },
            { name: "Human Value-Add", score: avg(dims.human) },
            { name: "Adaptive Thinking", score: avg(dims.adaptive) },
            { name: "Domain Judgment", score: avg(dims.domain) },
          ];
          dimAvgs.sort((a, b) => a.score - b.score);
          role.topGap = dimAvgs[0].score < 70 ? dimAvgs[0].name : null;
        }
      }

      // Get task counts
      if (targetRoles.length > 0) {
        const jobIds = targetRoles.map(r => r.job_id);
        const { data: taskCounts } = await supabase
          .from("job_task_clusters")
          .select("job_id")
          .in("job_id", jobIds);
        const countMap = new Map<string, number>();
        for (const t of taskCounts || []) {
          countMap.set(t.job_id, (countMap.get(t.job_id) || 0) + 1);
        }
        for (const role of roleMap.values()) {
          role.totalTasks = countMap.get(role.jobId) || 0;
        }
      }

      setRoles(Array.from(roleMap.values()));

      // Build global skill gaps
      const allDims = { tool: [] as number[], human: [] as number[], adaptive: [] as number[], domain: [] as number[] };
      for (const sim of sims) {
        if (sim.tool_awareness_score) allDims.tool.push(sim.tool_awareness_score);
        if (sim.human_value_add_score) allDims.human.push(sim.human_value_add_score);
        if (sim.adaptive_thinking_score) allDims.adaptive.push(sim.adaptive_thinking_score);
        if (sim.domain_judgment_score) allDims.domain.push(sim.domain_judgment_score);
      }
      const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
      const gapList: SkillGap[] = [
        { name: "Tool Awareness", score: avg(allDims.tool), category: "AI Mastery" },
        { name: "Human Value-Add", score: avg(allDims.human), category: "Human Edge" },
        { name: "Adaptive Thinking", score: avg(allDims.adaptive), category: "AI Mastery" },
        { name: "Domain Judgment", score: avg(allDims.domain), category: "Human Edge" },
      ].filter(g => g.score > 0 && g.score < 80);
      gapList.sort((a, b) => a.score - b.score);
      setGaps(gapList);

      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <XcrowLoader title="Loading dashboard…" size="sm" />
      </div>
    );
  }

  const userName = profile?.displayName?.split(" ")[0];

  return (
    <div className="h-full overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-foreground">
          {userName ? `Welcome back, ${userName}` : "Career Dashboard"}
        </h2>
        <p className="text-xs text-muted-foreground">Your readiness metrics at a glance</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Sims Done", value: totalSims, icon: Activity, color: "hsl(var(--primary))" },
          { label: "Avg Score", value: `${avgOverall}%`, icon: TrendingUp, color: avgOverall >= 70 ? "hsl(var(--territory-analytical))" : "hsl(var(--territory-leadership))" },
          { label: "Streak", value: `${streak}d`, icon: Zap, color: "hsl(var(--filigree-glow))" },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-lg p-3 text-center" style={cardStyle}>
            <kpi.icon className="h-4 w-4 mx-auto mb-1" style={{ color: kpi.color }} />
            <p className="text-lg font-bold text-foreground">{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Skill Gaps */}
      {gaps.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            Skill Gaps to Close
          </h3>
          <div className="space-y-2">
            {gaps.map(gap => (
              <div key={gap.name} className="rounded-lg p-3" style={cardStyle}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-foreground">{gap.name}</span>
                  <span className="text-xs font-mono text-muted-foreground">{gap.score}%</span>
                </div>
                <Progress value={gap.score} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground mt-1">{gap.category}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target Roles */}
      {roles.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-primary" />
            Target Roles
          </h3>
          <div className="space-y-2">
            {roles.map(role => {
              const pct = role.totalTasks > 0 ? Math.round((role.simsCompleted / role.totalTasks) * 100) : 0;
              return (
                <button
                  key={role.jobId}
                  onClick={() => {
                    const slug = role.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                    navigate(`/role/${slug}?job=${role.jobId}`);
                  }}
                  className="w-full rounded-lg p-3 text-left transition-colors hover:bg-accent/50"
                  style={cardStyle}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground truncate">{role.title}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  </div>
                  {role.company && (
                    <p className="text-[10px] text-muted-foreground mb-1.5">{role.company}</p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-1.5">
                    <span>{role.simsCompleted}/{role.totalTasks} tasks</span>
                    {role.avgScore > 0 && (
                      <span className="font-medium" style={{ color: role.avgScore >= 70 ? "hsl(var(--territory-analytical))" : "hsl(var(--territory-leadership))" }}>
                        {role.avgScore}% avg
                      </span>
                    )}
                    {role.topGap && (
                      <span className="text-destructive">Gap: {role.topGap}</span>
                    )}
                  </div>
                  <Progress value={pct} className="h-1" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {roles.length === 0 && totalSims === 0 && (
        <div className="rounded-lg p-5 text-center" style={cardStyle}>
          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground mb-1">No Data Yet</h3>
          <p className="text-[11px] text-muted-foreground mb-3">
            Complete simulations to populate your career dashboard
          </p>
          <Button size="sm" onClick={() => navigate("/")}>
            <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" />
            Get Started
          </Button>
        </div>
      )}
    </div>
  );
}
