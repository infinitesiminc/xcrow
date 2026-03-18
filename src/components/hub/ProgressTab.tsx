import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Loader2, Eye, Zap, Compass, ArrowRight, MapPin, Sparkles,
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
  correct_answers: number;
  total_questions: number;
  completed_at: string;
}

interface AnalysisEntry {
  id: string;
  job_title: string;
  company: string | null;
  tasks_count: number;
  augmented_percent: number;
  analyzed_at: string;
}

export default function ProgressTab({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const [completions, setCompletions] = useState<CompletedSim[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [simRes, analysisRes] = await Promise.all([
        supabase.from("completed_simulations")
          .select("id, task_name, job_title, company, correct_answers, total_questions, completed_at")
          .eq("user_id", userId).order("completed_at", { ascending: false }),
        supabase.from("analysis_history")
          .select("id, job_title, company, tasks_count, augmented_percent, analyzed_at")
          .eq("user_id", userId).order("analyzed_at", { ascending: false }),
      ]);
      setCompletions((simRes.data as CompletedSim[]) || []);
      setAnalyses((analysisRes.data as AnalysisEntry[]) || []);
      setLoading(false);
    })();
  }, [userId]);

  /* ── Interest Map: roles viewed + attempted ── */
  const interestMap = useMemo(() => {
    const map = new Map<string, {
      jobTitle: string; company: string | null;
      viewed: boolean; practiced: boolean; practiceCount: number;
      lastActivity: string;
    }>();

    for (const a of analyses) {
      const key = a.job_title.toLowerCase() + "||" + (a.company?.toLowerCase() || "");
      map.set(key, {
        jobTitle: a.job_title, company: a.company,
        viewed: true, practiced: false, practiceCount: 0,
        lastActivity: a.analyzed_at,
      });
    }

    for (const c of completions) {
      const key = c.job_title.toLowerCase() + "||" + (c.company?.toLowerCase() || "");
      const existing = map.get(key);
      if (existing) {
        existing.practiced = true;
        existing.practiceCount += 1;
        if (c.completed_at > existing.lastActivity) existing.lastActivity = c.completed_at;
      } else {
        map.set(key, {
          jobTitle: c.job_title, company: c.company,
          viewed: false, practiced: true, practiceCount: 1,
          lastActivity: c.completed_at,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );
  }, [analyses, completions]);

  /* ── Skill Map: aggregate scores per task ── */
  const skillMap = useMemo(() => {
    const map = new Map<string, { taskName: string; jobTitle: string; totalCorrect: number; totalQ: number; sessions: number }>();

    for (const c of completions) {
      const key = c.task_name;
      const existing = map.get(key);
      if (existing) {
        existing.totalCorrect += c.correct_answers || 0;
        existing.totalQ += c.total_questions || 0;
        existing.sessions += 1;
      } else {
        map.set(key, {
          taskName: c.task_name,
          jobTitle: c.job_title,
          totalCorrect: c.correct_answers || 0,
          totalQ: c.total_questions || 0,
          sessions: 1,
        });
      }
    }

    return Array.from(map.values())
      .map(s => ({ ...s, score: s.totalQ > 0 ? Math.round((s.totalCorrect / s.totalQ) * 100) : 0 }))
      .sort((a, b) => b.score - a.score);
  }, [completions]);

  const overallScore = useMemo(() => {
    const totalC = completions.reduce((s, c) => s + (c.correct_answers || 0), 0);
    const totalQ = completions.reduce((s, c) => s + (c.total_questions || 0), 0);
    return totalQ > 0 ? Math.round((totalC / totalQ) * 100) : null;
  }, [completions]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 text-primary animate-spin" /></div>;
  }

  if (interestMap.length === 0 && skillMap.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Compass className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">Explore roles and practice tasks to build your interest and skill maps.</p>
          <Button size="sm" onClick={() => navigate("/")}>Explore Roles</Button>
        </CardContent>
      </Card>
    );
  }

  const goToRole = (jobTitle: string, company: string | null) => {
    const params = new URLSearchParams({ title: jobTitle });
    if (company) params.set("company", company);
    navigate(`/analysis?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* ── Interest Map ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Eye className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Interest Map</h2>
          <Badge variant="secondary" className="text-[10px]">{interestMap.length} roles</Badge>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">Roles you've explored and practiced — the more you engage, the better our recommendations get.</p>

        <div className="grid gap-2 sm:grid-cols-2">
          {interestMap.slice(0, 8).map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card
                className="cursor-pointer hover:border-primary/20 transition-colors group"
                onClick={() => goToRole(item.jobTitle, item.company)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.jobTitle}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.company && <span className="text-[10px] text-muted-foreground truncate">{item.company}</span>}
                      <div className="flex items-center gap-1">
                        {item.viewed && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/20 text-primary">
                            Viewed
                          </Badge>
                        )}
                        {item.practiced && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-success/30 text-success">
                            {item.practiceCount} session{item.practiceCount !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {interestMap.length > 8 && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">+{interestMap.length - 8} more roles explored</p>
        )}
      </section>

      {/* ── Skill Map ── */}
      {skillMap.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-warning" />
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Skill Map</h2>
            {overallScore !== null && (
              <Badge variant="secondary" className="text-[10px]">Avg {overallScore}%</Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">Your scored skills from practice sessions — each task builds your profile for smarter job matches.</p>

          <Card>
            <CardContent className="p-3 space-y-1">
              {skillMap.slice(0, 10).map((skill, i) => (
                <motion.div
                  key={skill.taskName}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{skill.taskName}</p>
                    <p className="text-[10px] text-muted-foreground">{skill.jobTitle} · {skill.sessions} session{skill.sessions !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-32">
                    <Progress value={skill.score} className="h-1.5 flex-1" />
                    <span className={`text-xs font-semibold w-8 text-right ${
                      skill.score >= 70 ? "text-success" : skill.score >= 40 ? "text-warning" : "text-destructive"
                    }`}>{skill.score}%</span>
                  </div>
                </motion.div>
              ))}
              {skillMap.length > 10 && (
                <p className="text-[10px] text-muted-foreground text-center pt-1">+{skillMap.length - 10} more skills</p>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* ── Recommendations teaser ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-dashed border-muted-foreground/20 bg-gradient-to-r from-primary/5 via-background to-accent/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Job recommendations coming soon</p>
              <p className="text-[11px] text-muted-foreground">
                {interestMap.length < 3
                  ? `Explore ${3 - interestMap.length} more role${3 - interestMap.length !== 1 ? "s" : ""} to unlock personalized job matches`
                  : skillMap.length < 2
                    ? "Practice a few more tasks to unlock personalized job matches"
                    : "We're building your profile — recommendations will appear here soon"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
