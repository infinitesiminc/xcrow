import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2, Target, AlertTriangle, Zap, Users, Clock, ExternalLink, BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { type DemoFunnelStats, generateMockFromDB } from "@/data/demo-team-progress";

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
  tool_awareness_score?: number;
  human_value_add_score?: number;
  adaptive_thinking_score?: number;
  domain_judgment_score?: number;
}

interface QueueItem {
  id: string;
  user_id: string;
  job_title: string;
  task_name: string;
  weak_category: string;
  weak_score: number;
  coaching_tip: string | null;
  attempt_number: number;
  max_attempts: number;
  status: string;
}

const THRESHOLD = 60;

const CATEGORY_LABELS: Record<string, string> = {
  tool_awareness_score: "Tool Awareness",
  human_value_add_score: "Human Value-Add",
  adaptive_thinking_score: "Adaptive Thinking",
  domain_judgment_score: "Domain Judgment",
};

export default function ActionCenter() {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      setLoading(true);

      const { data: membership } = await supabase
        .from("workspace_members").select("workspace_id")
        .eq("user_id", user.id).eq("role", "admin");

      if (!membership?.length) { setLoading(false); return; }
      const wsId = membership[0].workspace_id;

      // Fetch progress + queue in parallel
      const [progressRes, queueRes, mockData] = await Promise.all([
        supabase.rpc("get_workspace_progress", { p_workspace_id: wsId }),
        supabase.from("simulation_queue").select("*").eq("status", "pending").order("created_at", { ascending: false }),
        generateMockFromDB(),
      ]);

      const dbRows = (progressRes.data as ProgressRow[] || []).filter(r => r.user_id !== user.id);
      setProgress([...mockData.progress, ...dbRows]);
      setQueue((queueRes.data as QueueItem[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const metrics = useMemo(() => {
    const categories = ["tool_awareness_score", "human_value_add_score", "adaptive_thinking_score", "domain_judgment_score"] as const;

    const taskFailCounts: Record<string, number> = {};
    const userFailCounts: Record<string, { name: string; count: number; jobTitle: string; dept: string; userId: string }> = {};
    let totalBelowThreshold = 0;

    progress.forEach(r => {
      categories.forEach(cat => {
        const score = r[cat];
        if (score != null && score < THRESHOLD) {
          totalBelowThreshold++;
          taskFailCounts[r.task_name] = (taskFailCounts[r.task_name] || 0) + 1;
          if (!userFailCounts[r.user_id]) {
            userFailCounts[r.user_id] = { name: r.display_name, count: 0, jobTitle: r.job_title, dept: r.department || "Other", userId: r.user_id };
          }
          userFailCounts[r.user_id].count++;
        }
      });
    });

    const bottleneckTasks = Object.entries(taskFailCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([task, count]) => ({ task, count }));

    const escalatedUsers = Object.values(userFailCounts)
      .filter(u => u.count >= 3).sort((a, b) => b.count - a.count).slice(0, 10);

    const uniqueUsersWithIssues = Object.keys(userFailCounts).length;
    const uniqueUsers = new Set(progress.map(r => r.user_id)).size;

    return { bottleneckTasks, escalatedUsers, totalBelowThreshold, uniqueUsersWithIssues, uniqueUsers };
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
        <Zap className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Sign In Required</h2>
        <p className="text-sm text-muted-foreground mb-4">Sign in to access the Action Center.</p>
        <Button onClick={() => openAuthModal()}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Action Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time view of who needs help and where to intervene.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold text-foreground">{metrics.uniqueUsers}</p>
            <p className="text-[11px] text-muted-foreground">Active Employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto text-destructive mb-1" />
            <p className="text-2xl font-bold text-destructive">{metrics.uniqueUsersWithIssues}</p>
            <p className="text-[11px] text-muted-foreground">Need Attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 mx-auto text-warning mb-1" />
            <p className="text-2xl font-bold text-foreground">{metrics.totalBelowThreshold}</p>
            <p className="text-[11px] text-muted-foreground">Failed Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold text-foreground">{queue.length}</p>
            <p className="text-[11px] text-muted-foreground">Pending Retries</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bottleneck tasks */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-destructive" />
              <p className="text-sm font-semibold text-foreground">Bottleneck Tasks</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Tasks where employees most frequently score below {THRESHOLD}%</p>
            {metrics.bottleneckTasks.length === 0 ? (
              <p className="text-xs text-success">All tasks above threshold ✓</p>
            ) : (
              <div className="space-y-2">
                {metrics.bottleneckTasks.map(({ task, count }) => (
                  <div key={task} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                    <span className="text-xs text-foreground flex-1 truncate">{task}</span>
                    <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">{count} fails</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employees needing coaching */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <p className="text-sm font-semibold text-foreground">Employees Needing Coaching</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Employees with 3+ readiness categories below {THRESHOLD}%</p>
            {metrics.escalatedUsers.length === 0 ? (
              <p className="text-xs text-success">No employees flagged ✓</p>
            ) : (
              <div className="space-y-2">
                {metrics.escalatedUsers.map(u => (
                  <div key={u.userId} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center text-[10px] font-bold text-destructive shrink-0">
                      {u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.dept} · {u.jobTitle}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">{u.count} areas</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending retry queue */}
      {queue.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Pending Retries</p>
              <Badge variant="secondary" className="text-[10px] ml-auto">{queue.length}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Employees queued for re-simulation based on weak scores</p>
            <div className="space-y-2 max-h-64 overflow-auto">
              {queue.slice(0, 15).map(q => (
                <div key={q.id} className="flex items-center gap-2 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{q.task_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {q.job_title} · {CATEGORY_LABELS[q.weak_category] || q.weak_category} ({q.weak_score}%)
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Attempt {q.attempt_number}/{q.max_attempts}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate("/hr/team-progress")}>
          <BarChart3 className="h-3.5 w-3.5" /> View Team Progress
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate("/hr/simulations")}>
          <ExternalLink className="h-3.5 w-3.5" /> Role Explorer
        </Button>
      </div>
    </div>
  );
}
