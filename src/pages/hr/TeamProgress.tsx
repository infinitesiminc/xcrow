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
}

const DEMO_PROGRESS: ProgressRow[] = [
  { user_id: "demo-1", display_name: "Sarah Chen", job_title: "Senior Software Engineer", task_name: "Code Review with AI Copilot", sim_job_title: "Software Engineer", correct_answers: 5, total_questions: 5, completed_at: "2026-03-15T09:30:00Z" },
  { user_id: "demo-1", display_name: "Sarah Chen", job_title: "Senior Software Engineer", task_name: "Automated Test Generation", sim_job_title: "Software Engineer", correct_answers: 4, total_questions: 5, completed_at: "2026-03-14T14:00:00Z" },
  { user_id: "demo-1", display_name: "Sarah Chen", job_title: "Senior Software Engineer", task_name: "Incident Response Triage", sim_job_title: "Software Engineer", correct_answers: 3, total_questions: 5, completed_at: "2026-03-13T11:15:00Z" },
  { user_id: "demo-1", display_name: "Sarah Chen", job_title: "Senior Software Engineer", task_name: "Architecture Decision Record", sim_job_title: "Software Engineer", correct_answers: 5, total_questions: 5, completed_at: "2026-03-12T16:45:00Z" },
  { user_id: "demo-2", display_name: "Marcus Rivera", job_title: "ML Research Scientist", task_name: "Model Evaluation Report", sim_job_title: "Data Scientist", correct_answers: 4, total_questions: 5, completed_at: "2026-03-15T10:00:00Z" },
  { user_id: "demo-2", display_name: "Marcus Rivera", job_title: "ML Research Scientist", task_name: "Dataset Bias Audit", sim_job_title: "Data Scientist", correct_answers: 5, total_questions: 5, completed_at: "2026-03-14T08:30:00Z" },
  { user_id: "demo-2", display_name: "Marcus Rivera", job_title: "ML Research Scientist", task_name: "Experiment Design Review", sim_job_title: "Data Scientist", correct_answers: 3, total_questions: 5, completed_at: "2026-03-13T15:20:00Z" },
  { user_id: "demo-3", display_name: "Priya Sharma", job_title: "Product Manager", task_name: "Feature Prioritization Matrix", sim_job_title: "Product Manager", correct_answers: 4, total_questions: 5, completed_at: "2026-03-15T13:00:00Z" },
  { user_id: "demo-3", display_name: "Priya Sharma", job_title: "Product Manager", task_name: "Stakeholder Alignment Brief", sim_job_title: "Product Manager", correct_answers: 5, total_questions: 5, completed_at: "2026-03-14T09:45:00Z" },
  { user_id: "demo-3", display_name: "Priya Sharma", job_title: "Product Manager", task_name: "Competitive Landscape Analysis", sim_job_title: "Product Manager", correct_answers: 3, total_questions: 5, completed_at: "2026-03-12T11:30:00Z" },
  { user_id: "demo-3", display_name: "Priya Sharma", job_title: "Product Manager", task_name: "Go-to-Market Strategy", sim_job_title: "Product Manager", correct_answers: 4, total_questions: 5, completed_at: "2026-03-11T14:00:00Z" },
  { user_id: "demo-3", display_name: "Priya Sharma", job_title: "Product Manager", task_name: "User Story Mapping", sim_job_title: "Product Manager", correct_answers: 5, total_questions: 5, completed_at: "2026-03-10T10:15:00Z" },
  { user_id: "demo-4", display_name: "David Kim", job_title: "Data Engineer", task_name: "Pipeline Optimization Review", sim_job_title: "Data Engineer", correct_answers: 4, total_questions: 5, completed_at: "2026-03-14T16:00:00Z" },
  { user_id: "demo-4", display_name: "David Kim", job_title: "Data Engineer", task_name: "Data Quality Framework", sim_job_title: "Data Engineer", correct_answers: 3, total_questions: 5, completed_at: "2026-03-13T10:30:00Z" },
  { user_id: "demo-5", display_name: "Emily Watson", job_title: "UX Designer", task_name: "AI-Assisted Wireframing", sim_job_title: "UX Designer", correct_answers: 5, total_questions: 5, completed_at: "2026-03-15T11:00:00Z" },
  { user_id: "demo-5", display_name: "Emily Watson", job_title: "UX Designer", task_name: "Usability Test Analysis", sim_job_title: "UX Designer", correct_answers: 4, total_questions: 5, completed_at: "2026-03-14T13:30:00Z" },
  { user_id: "demo-5", display_name: "Emily Watson", job_title: "UX Designer", task_name: "Design System Audit", sim_job_title: "UX Designer", correct_answers: 4, total_questions: 5, completed_at: "2026-03-12T09:00:00Z" },
  { user_id: "demo-6", display_name: "James Okafor", job_title: "DevOps Engineer", task_name: "CI/CD Pipeline Automation", sim_job_title: "DevOps Engineer", correct_answers: 5, total_questions: 5, completed_at: "2026-03-15T08:00:00Z" },
  { user_id: "demo-6", display_name: "James Okafor", job_title: "DevOps Engineer", task_name: "Infrastructure Cost Analysis", sim_job_title: "DevOps Engineer", correct_answers: 3, total_questions: 5, completed_at: "2026-03-13T14:45:00Z" },
  { user_id: "demo-7", display_name: "Aisha Patel", job_title: "Technical Writer", task_name: "API Documentation Review", sim_job_title: "Technical Writer", correct_answers: 5, total_questions: 5, completed_at: "2026-03-14T10:00:00Z" },
  { user_id: "demo-7", display_name: "Aisha Patel", job_title: "Technical Writer", task_name: "Release Notes Drafting", sim_job_title: "Technical Writer", correct_answers: 4, total_questions: 5, completed_at: "2026-03-13T09:30:00Z" },
  { user_id: "demo-7", display_name: "Aisha Patel", job_title: "Technical Writer", task_name: "Knowledge Base Restructure", sim_job_title: "Technical Writer", correct_answers: 4, total_questions: 5, completed_at: "2026-03-11T15:00:00Z" },
  { user_id: "demo-8", display_name: "Tom Lindqvist", job_title: "Security Analyst", task_name: "Threat Modeling Exercise", sim_job_title: "Cybersecurity Analyst", correct_answers: 4, total_questions: 5, completed_at: "2026-03-15T14:30:00Z" },
  { user_id: "demo-8", display_name: "Tom Lindqvist", job_title: "Security Analyst", task_name: "Vulnerability Assessment Report", sim_job_title: "Cybersecurity Analyst", correct_answers: 5, total_questions: 5, completed_at: "2026-03-13T12:00:00Z" },
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
    return { uniqueUsers: uniqueUsers.size, totalSims, avgScore, roleBreakdown };
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
        /* Aggregate: Role breakdown */
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
