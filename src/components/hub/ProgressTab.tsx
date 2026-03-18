import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2, Calendar, Briefcase, Loader2, BarChart3,
  ArrowRight, TrendingUp, Award,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface CompletedSim {
  id: string;
  task_name: string;
  job_title: string;
  company: string | null;
  rounds_completed: number;
  completed_at: string;
  correct_answers: number;
  total_questions: number;
}

interface AnalysisEntry {
  id: string;
  job_title: string;
  company: string | null;
  tasks_count: number;
  augmented_percent: number;
  automation_risk_percent: number;
  analyzed_at: string;
}

interface ProgressTabProps {
  userId: string;
}

export default function ProgressTab({ userId }: ProgressTabProps) {
  const navigate = useNavigate();
  const [completions, setCompletions] = useState<CompletedSim[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [simRes, analysisRes] = await Promise.all([
        supabase.from("completed_simulations").select("id, task_name, job_title, company, rounds_completed, completed_at, correct_answers, total_questions").eq("user_id", userId).order("completed_at", { ascending: false }),
        supabase.from("analysis_history").select("*").eq("user_id", userId).order("analyzed_at", { ascending: false }),
      ]);
      setCompletions((simRes.data as CompletedSim[]) || []);
      setAnalyses((analysisRes.data as AnalysisEntry[]) || []);
      setLoading(false);
    })();
  }, [userId]);

  const overallScore = useMemo(() => {
    if (!completions.length) return null;
    const totalCorrect = completions.reduce((s, c) => s + (c.correct_answers || 0), 0);
    const totalQ = completions.reduce((s, c) => s + (c.total_questions || 0), 0);
    return totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : null;
  }, [completions]);

  const uniqueTasks = new Set(completions.map(c => c.task_name)).size;

  // Group by role
  const grouped = useMemo(() => {
    const map: Record<string, { jobTitle: string; company: string | null; items: CompletedSim[] }> = {};
    for (const c of completions) {
      const key = c.job_title + "||" + (c.company || "");
      if (!map[key]) map[key] = { jobTitle: c.job_title, company: c.company, items: [] };
      map[key].items.push(c);
    }
    return Object.values(map);
  }, [completions]);

  // Recent 5 sessions for quick view
  const recentSessions = completions.slice(0, 8);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 text-primary animate-spin" />
      </div>
    );
  }

  if (completions.length === 0 && analyses.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">No activity yet — explore roles and practice to see your progress here.</p>
          <Button size="sm" onClick={() => navigate("/")}>Explore Roles</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{completions.length}</div>
            <div className="text-[11px] text-muted-foreground">Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{uniqueTasks}</div>
            <div className="text-[11px] text-muted-foreground">Tasks Practiced</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${
              overallScore === null ? "text-muted-foreground" : overallScore >= 70 ? "text-success" : overallScore >= 40 ? "text-warning" : "text-destructive"
            }`}>
              {overallScore !== null ? `${overallScore}%` : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground">Avg Score</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div>
          <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Recent Sessions</h3>
          <Card>
            <div className="divide-y divide-border/30">
              {recentSessions.map((c) => {
                const score = c.total_questions > 0 ? Math.round((c.correct_answers / c.total_questions) * 100) : null;
                return (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${
                      score !== null && score >= 70 ? "text-success" : score !== null && score >= 40 ? "text-warning" : "text-muted-foreground"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{c.task_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{c.job_title}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {score !== null && (
                        <span className={`text-sm font-semibold ${score >= 70 ? "text-success" : score >= 40 ? "text-warning" : "text-destructive"}`}>
                          {score}%
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(c.completed_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* By role */}
      {grouped.length > 0 && (
        <div>
          <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">By Role</h3>
          <div className="space-y-3">
            {grouped.map((group, gi) => {
              const totalCorrect = group.items.reduce((s, c) => s + (c.correct_answers || 0), 0);
              const totalQ = group.items.reduce((s, c) => s + (c.total_questions || 0), 0);
              const avgScore = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : null;

              return (
                <motion.div key={gi} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.04 }}>
                  <Card
                    className="cursor-pointer hover:border-primary/20 hover:shadow-md transition-all"
                    onClick={() => {
                      const params = new URLSearchParams({ title: group.jobTitle });
                      if (group.company) params.set("company", group.company);
                      navigate(`/analysis?${params.toString()}`, { state: { from: "dashboard" } });
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">{group.jobTitle}</p>
                          {group.company && <p className="text-[10px] text-muted-foreground truncate">{group.company}</p>}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge variant="secondary" className="text-[10px]">{group.items.length} session{group.items.length !== 1 ? "s" : ""}</Badge>
                          {avgScore !== null && (
                            <span className={`text-sm font-bold ${avgScore >= 70 ? "text-success" : avgScore >= 40 ? "text-warning" : "text-destructive"}`}>
                              {avgScore}%
                            </span>
                          )}
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Explored roles */}
      {analyses.length > 0 && (
        <div>
          <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Explored Roles</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {analyses.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card
                  className="cursor-pointer hover:border-primary/20 hover:shadow-md transition-all"
                  onClick={() => {
                    const params = new URLSearchParams({ title: a.job_title });
                    if (a.company) params.set("company", a.company);
                    navigate(`/analysis?${params.toString()}`, { state: { from: "dashboard" } });
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{a.job_title}</p>
                        {a.company && <p className="text-[10px] text-muted-foreground truncate">{a.company}</p>}
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0">{a.tasks_count} tasks</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                      <span>{a.augmented_percent}% AI tools</span>
                      <span>{a.automation_risk_percent}% risk</span>
                      <span className="ml-auto flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        {new Date(a.analyzed_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
