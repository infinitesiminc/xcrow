import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, Users, CheckCircle2, TrendingUp, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProgressRow {
  user_id: string;
  display_name: string;
  job_title: string;
  task_name: string;
  sim_job_title: string;
  correct_answers: number;
  total_questions: number;
  completed_at: string;
  department: string | null;
}

const DEMO_PROGRESS: ProgressRow[] = [
  // Engineering
  { user_id: "demo-1", display_name: "Sarah Chen", job_title: "Applied AI Engineer", task_name: "Prompt Engineering for Enterprise Clients", sim_job_title: "Applied AI Engineer", correct_answers: 5, total_questions: 5, completed_at: "2026-03-15T09:30:00Z", department: "Engineering" },
  { user_id: "demo-1", display_name: "Sarah Chen", job_title: "Applied AI Engineer", task_name: "Model Integration Testing", sim_job_title: "Applied AI Engineer", correct_answers: 4, total_questions: 5, completed_at: "2026-03-14T14:00:00Z", department: "Engineering" },
  { user_id: "demo-1", display_name: "Sarah Chen", job_title: "Applied AI Engineer", task_name: "Safety Evaluation Report", sim_job_title: "Applied AI Engineer", correct_answers: 5, total_questions: 5, completed_at: "2026-03-12T16:45:00Z", department: "Engineering" },
  // AI / Research
  { user_id: "demo-2", display_name: "Marcus Rivera", job_title: "Research Scientist, Alignment Finetuning", task_name: "RLHF Evaluation Protocol", sim_job_title: "Research Scientist", correct_answers: 4, total_questions: 5, completed_at: "2026-03-15T10:00:00Z", department: "AI / Research" },
  { user_id: "demo-2", display_name: "Marcus Rivera", job_title: "Research Scientist, Alignment Finetuning", task_name: "Red-Teaming Methodology Design", sim_job_title: "Research Scientist", correct_answers: 5, total_questions: 5, completed_at: "2026-03-14T08:30:00Z", department: "AI / Research" },
  { user_id: "demo-2", display_name: "Marcus Rivera", job_title: "Research Scientist, Alignment Finetuning", task_name: "Interpretability Experiment Review", sim_job_title: "Research Scientist", correct_answers: 3, total_questions: 5, completed_at: "2026-03-13T15:20:00Z", department: "AI / Research" },
  // Sales
  { user_id: "demo-3", display_name: "Priya Sharma", job_title: "Enterprise Account Executive, Financial Services", task_name: "Enterprise Deal Qualification", sim_job_title: "Enterprise Account Executive", correct_answers: 4, total_questions: 5, completed_at: "2026-03-15T13:00:00Z", department: "Sales" },
  { user_id: "demo-3", display_name: "Priya Sharma", job_title: "Enterprise Account Executive, Financial Services", task_name: "Procurement Negotiation Strategy", sim_job_title: "Enterprise Account Executive", correct_answers: 5, total_questions: 5, completed_at: "2026-03-14T09:45:00Z", department: "Sales" },
  { user_id: "demo-3", display_name: "Priya Sharma", job_title: "Enterprise Account Executive, Financial Services", task_name: "ROI Business Case Preparation", sim_job_title: "Enterprise Account Executive", correct_answers: 3, total_questions: 5, completed_at: "2026-03-12T11:30:00Z", department: "Sales" },
  // Data
  { user_id: "demo-4", display_name: "David Kim", job_title: "Analytics Data Engineer", task_name: "Pipeline Optimization Review", sim_job_title: "Analytics Data Engineer", correct_answers: 4, total_questions: 5, completed_at: "2026-03-14T16:00:00Z", department: "Data" },
  { user_id: "demo-4", display_name: "David Kim", job_title: "Analytics Data Engineer", task_name: "Data Quality Framework", sim_job_title: "Analytics Data Engineer", correct_answers: 3, total_questions: 5, completed_at: "2026-03-13T10:30:00Z", department: "Data" },
  // Security
  { user_id: "demo-5", display_name: "James Okafor", job_title: "Application Security Engineer", task_name: "Threat Model Review", sim_job_title: "Application Security Engineer", correct_answers: 5, total_questions: 5, completed_at: "2026-03-15T08:00:00Z", department: "Security" },
  { user_id: "demo-5", display_name: "James Okafor", job_title: "Application Security Engineer", task_name: "Penetration Test Analysis", sim_job_title: "Application Security Engineer", correct_answers: 3, total_questions: 5, completed_at: "2026-03-13T14:45:00Z", department: "Security" },
  // Marketing
  { user_id: "demo-6", display_name: "Emily Watson", job_title: "Communications Manager, Enterprise", task_name: "Product Launch Messaging", sim_job_title: "Communications Manager", correct_answers: 5, total_questions: 5, completed_at: "2026-03-15T11:00:00Z", department: "Marketing" },
  { user_id: "demo-6", display_name: "Emily Watson", job_title: "Communications Manager, Enterprise", task_name: "Analyst Briefing Preparation", sim_job_title: "Communications Manager", correct_answers: 4, total_questions: 5, completed_at: "2026-03-14T13:30:00Z", department: "Marketing" },
  // People
  { user_id: "demo-7", display_name: "Aisha Patel", job_title: "Recruiting Data Engineering & Analytics", task_name: "Hiring Pipeline Analytics", sim_job_title: "Recruiting Data Engineering", correct_answers: 5, total_questions: 5, completed_at: "2026-03-14T10:00:00Z", department: "People" },
  { user_id: "demo-7", display_name: "Aisha Patel", job_title: "Recruiting Data Engineering & Analytics", task_name: "Talent Funnel Optimization", sim_job_title: "Recruiting Data Engineering", correct_answers: 4, total_questions: 5, completed_at: "2026-03-13T09:30:00Z", department: "People" },
  // Finance
  { user_id: "demo-8", display_name: "Tom Lindqvist", job_title: "Corporate Finance & Strategy, Workforce & OPEX", task_name: "Headcount Budget Forecast", sim_job_title: "Corporate Finance & Strategy", correct_answers: 4, total_questions: 5, completed_at: "2026-03-15T14:30:00Z", department: "Finance" },
  { user_id: "demo-8", display_name: "Tom Lindqvist", job_title: "Corporate Finance & Strategy, Workforce & OPEX", task_name: "OPEX Variance Analysis", sim_job_title: "Corporate Finance & Strategy", correct_answers: 5, total_questions: 5, completed_at: "2026-03-13T12:00:00Z", department: "Finance" },
  // Legal
  { user_id: "demo-9", display_name: "Rachel Nguyen", job_title: "Commercial Counsel, GTM", task_name: "Enterprise License Agreement Review", sim_job_title: "Commercial Counsel", correct_answers: 4, total_questions: 5, completed_at: "2026-03-15T09:00:00Z", department: "Legal" },
  { user_id: "demo-9", display_name: "Rachel Nguyen", job_title: "Commercial Counsel, GTM", task_name: "Data Processing Addendum Drafting", sim_job_title: "Commercial Counsel", correct_answers: 5, total_questions: 5, completed_at: "2026-03-14T11:00:00Z", department: "Legal" },
  // Compliance
  { user_id: "demo-10", display_name: "Daniel Mora", job_title: "Crisis Management Specialist", task_name: "Incident Response Tabletop Exercise", sim_job_title: "Crisis Management Specialist", correct_answers: 3, total_questions: 5, completed_at: "2026-03-14T15:00:00Z", department: "Compliance" },
  { user_id: "demo-10", display_name: "Daniel Mora", job_title: "Crisis Management Specialist", task_name: "Regulatory Impact Assessment", sim_job_title: "Crisis Management Specialist", correct_answers: 4, total_questions: 5, completed_at: "2026-03-12T10:00:00Z", department: "Compliance" },
  // Operations
  { user_id: "demo-11", display_name: "Lena Park", job_title: "Data Center Operations Lead", task_name: "Infrastructure Capacity Planning", sim_job_title: "Data Center Operations Lead", correct_answers: 5, total_questions: 5, completed_at: "2026-03-15T07:30:00Z", department: "Operations" },
  { user_id: "demo-11", display_name: "Lena Park", job_title: "Data Center Operations Lead", task_name: "Incident Escalation Workflow", sim_job_title: "Data Center Operations Lead", correct_answers: 4, total_questions: 5, completed_at: "2026-03-13T16:00:00Z", department: "Operations" },
  // Communications
  { user_id: "demo-12", display_name: "Alex Dubois", job_title: "Developer Relations, MCP", task_name: "Community Engagement Strategy", sim_job_title: "Developer Relations", correct_answers: 4, total_questions: 5, completed_at: "2026-03-14T12:00:00Z", department: "Communications" },
  { user_id: "demo-12", display_name: "Alex Dubois", job_title: "Developer Relations, MCP", task_name: "Technical Blog Post Review", sim_job_title: "Developer Relations", correct_answers: 5, total_questions: 5, completed_at: "2026-03-12T14:30:00Z", department: "Communications" },
];

interface WorkspaceRow {
  id: string;
  name: string;
}

export default function TeamProgress() {
  const { user, openAuthModal } = useAuth();
  const [workspace, setWorkspace] = useState<WorkspaceRow | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"aggregate" | "individual">("aggregate");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      // Find workspace where user is admin
      const { data: membership } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .eq("role", "admin");

      if (!membership?.length) { setLoading(false); return; }

      const wsId = membership[0].workspace_id;
      const { data: ws } = await supabase
        .from("company_workspaces")
        .select("id, name")
        .eq("id", wsId)
        .single();
      if (ws) setWorkspace(ws);

      // Fetch progress via security definer function
      const { data: rows } = await supabase.rpc("get_workspace_progress", { p_workspace_id: wsId });
      if (rows) setProgress([...DEMO_PROGRESS, ...(rows as ProgressRow[])]);
      setLoading(false);
    })();
  }, [user]);

  // Aggregate stats
  const stats = useMemo(() => {
    const uniqueUsers = new Set(progress.map(r => r.user_id));
    const totalSims = progress.length;
    const avgScore = totalSims > 0
      ? Math.round(progress.reduce((acc, r) => acc + (r.total_questions > 0 ? (r.correct_answers / r.total_questions) * 100 : 0), 0) / totalSims)
      : 0;
    const roleBreakdown: Record<string, number> = {};
    progress.forEach(r => {
      roleBreakdown[r.sim_job_title] = (roleBreakdown[r.sim_job_title] || 0) + 1;
    });
    const deptBreakdown: Record<string, { count: number; totalScore: number }> = {};
    progress.forEach(r => {
      const dept = r.department || "Uncategorized";
      if (!deptBreakdown[dept]) deptBreakdown[dept] = { count: 0, totalScore: 0 };
      deptBreakdown[dept].count += 1;
      deptBreakdown[dept].totalScore += r.total_questions > 0 ? (r.correct_answers / r.total_questions) * 100 : 0;
    });
    return { uniqueUsers: uniqueUsers.size, totalSims, avgScore, roleBreakdown, deptBreakdown };
  }, [progress]);

  // Group by user for individual view
  const userGroups = useMemo(() => {
    const groups: Record<string, { name: string; jobTitle: string; sims: ProgressRow[] }> = {};
    progress.forEach(r => {
      if (!groups[r.user_id]) groups[r.user_id] = { name: r.display_name || "Unknown", jobTitle: r.job_title || "", sims: [] };
      groups[r.user_id].sims.push(r);
    });
    return Object.entries(groups).sort((a, b) => b[1].sims.length - a[1].sims.length);
  }, [progress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Sign In Required</h2>
        <p className="text-sm text-muted-foreground mb-4">Sign in to view your team's progress.</p>
        <Button onClick={() => openAuthModal()}>Sign In</Button>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-8 text-center">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">No Workspace Found</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Create a workspace first to start tracking your team's progress.
        </p>
        <Button onClick={() => window.location.href = "/hr/settings"}>Create Workspace</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{workspace.name}</h1>
          <p className="text-sm text-muted-foreground">Team simulation progress & results</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "aggregate" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("aggregate")}
          >
            Aggregate
          </Button>
          <Button
            variant={viewMode === "individual" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("individual")}
          >
            Individual
          </Button>
        </div>
      </div>

      {/* Aggregate stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.uniqueUsers}</p>
              <p className="text-xs text-muted-foreground">Active Members</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalSims}</p>
              <p className="text-xs text-muted-foreground">Simulations Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-dot-amber/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-dot-amber" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.avgScore}%</p>
              <p className="text-xs text-muted-foreground">Avg. Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === "aggregate" ? (
        <div className="space-y-6">
          {/* Department breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Completion by Department</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(stats.deptBreakdown).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No simulation data yet.</p>
              ) : (
                Object.entries(stats.deptBreakdown)
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([dept, data]) => {
                    const avgPct = Math.round(data.totalScore / data.count);
                    return (
                      <div key={dept} className="flex items-center gap-3">
                        <span className="text-sm text-foreground flex-1 truncate">{dept}</span>
                        <Badge variant="secondary" className="text-xs">{data.count} sims</Badge>
                        <span className={`text-xs font-semibold ${avgPct >= 70 ? "text-success" : "text-dot-amber"}`}>{avgPct}%</span>
                        <Progress value={Math.min((data.count / Math.max(stats.totalSims, 1)) * 100, 100)} className="w-24 h-1.5" />
                      </div>
                    );
                  })
              )}
            </CardContent>
          </Card>

          {/* Role breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Completion by Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(stats.roleBreakdown).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No simulation data yet. Share the join code with your team to get started.</p>
              ) : (
                Object.entries(stats.roleBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([role, count]) => (
                    <div key={role} className="flex items-center gap-3">
                      <span className="text-sm text-foreground flex-1 truncate">{role}</span>
                      <Badge variant="secondary" className="text-xs">{count} sims</Badge>
                      <Progress value={Math.min((count / Math.max(stats.totalSims, 1)) * 100, 100)} className="w-24 h-1.5" />
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Individual: User drill-down */
        <div className="space-y-2">
          {userGroups.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No team members have completed simulations yet.
              </CardContent>
            </Card>
          ) : (
            userGroups.map(([userId, group]) => {
              const isExpanded = expandedUser === userId;
              const userAvg = group.sims.length > 0
                ? Math.round(group.sims.reduce((acc, s) => acc + (s.total_questions > 0 ? (s.correct_answers / s.total_questions) * 100 : 0), 0) / group.sims.length)
                : 0;

              return (
                <Card key={userId} className="overflow-hidden">
                  <button
                    className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedUser(isExpanded ? null : userId)}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {group.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{group.name}</p>
                      {group.jobTitle && <p className="text-[11px] text-muted-foreground">{group.jobTitle}</p>}
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">{group.sims.length} sims</Badge>
                    <span className="text-xs font-semibold text-foreground">{userAvg}%</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-border"
                      >
                        <div className="p-4 space-y-2 bg-muted/10">
                          {group.sims.map((sim, i) => {
                            const pct = sim.total_questions > 0 ? Math.round((sim.correct_answers / sim.total_questions) * 100) : 0;
                            return (
                              <div key={i} className="flex items-center gap-3 text-sm">
                                <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${pct >= 70 ? "text-success" : "text-dot-amber"}`} />
                                <span className="flex-1 truncate text-foreground">{sim.task_name}</span>
                                <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">{sim.sim_job_title}</span>
                                <span className={`text-xs font-semibold ${pct >= 70 ? "text-success" : "text-dot-amber"}`}>{pct}%</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(sim.completed_at).toLocaleDateString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
