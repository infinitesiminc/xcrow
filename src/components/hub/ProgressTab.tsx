import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Loader2, Eye, Zap, Compass, ArrowRight, Sparkles, TrendingUp,
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

/* ── Mock data for demo ── */
const MOCK_ANALYSES: AnalysisEntry[] = [
  { id: "m1", job_title: "Product Manager", company: "Stripe", tasks_count: 12, augmented_percent: 68, analyzed_at: "2026-03-17T10:00:00Z" },
  { id: "m2", job_title: "Marketing Manager", company: "HubSpot", tasks_count: 10, augmented_percent: 72, analyzed_at: "2026-03-16T14:00:00Z" },
  { id: "m3", job_title: "Data Analyst", company: null, tasks_count: 8, augmented_percent: 81, analyzed_at: "2026-03-15T09:00:00Z" },
  { id: "m4", job_title: "UX Designer", company: "Figma", tasks_count: 9, augmented_percent: 55, analyzed_at: "2026-03-14T11:00:00Z" },
  { id: "m5", job_title: "Software Engineer", company: "Vercel", tasks_count: 14, augmented_percent: 74, analyzed_at: "2026-03-13T16:00:00Z" },
  { id: "m6", job_title: "Content Strategist", company: null, tasks_count: 7, augmented_percent: 63, analyzed_at: "2026-03-10T08:00:00Z" },
];

const MOCK_COMPLETIONS: CompletedSim[] = [
  { id: "s1", task_name: "Write product requirements", job_title: "Product Manager", company: "Stripe", correct_answers: 4, total_questions: 5, completed_at: "2026-03-17T12:00:00Z" },
  { id: "s2", task_name: "Prioritize feature backlog", job_title: "Product Manager", company: "Stripe", correct_answers: 3, total_questions: 5, completed_at: "2026-03-17T13:00:00Z" },
  { id: "s3", task_name: "Analyze user funnel data", job_title: "Data Analyst", company: null, correct_answers: 5, total_questions: 5, completed_at: "2026-03-16T10:00:00Z" },
  { id: "s4", task_name: "Build campaign brief", job_title: "Marketing Manager", company: "HubSpot", correct_answers: 3, total_questions: 5, completed_at: "2026-03-16T15:00:00Z" },
  { id: "s5", task_name: "Create SQL dashboards", job_title: "Data Analyst", company: null, correct_answers: 4, total_questions: 5, completed_at: "2026-03-15T11:00:00Z" },
  { id: "s6", task_name: "Design user onboarding flow", job_title: "UX Designer", company: "Figma", correct_answers: 2, total_questions: 5, completed_at: "2026-03-14T12:00:00Z" },
  { id: "s7", task_name: "Write API documentation", job_title: "Software Engineer", company: "Vercel", correct_answers: 5, total_questions: 5, completed_at: "2026-03-13T17:00:00Z" },
  { id: "s8", task_name: "Code review pull requests", job_title: "Software Engineer", company: "Vercel", correct_answers: 4, total_questions: 5, completed_at: "2026-03-13T18:00:00Z" },
  { id: "s9", task_name: "Stakeholder presentation", job_title: "Product Manager", company: "Stripe", correct_answers: 3, total_questions: 5, completed_at: "2026-03-12T09:00:00Z" },
  { id: "s10", task_name: "SEO content audit", job_title: "Content Strategist", company: null, correct_answers: 2, total_questions: 5, completed_at: "2026-03-10T10:00:00Z" },
];

interface Recommendation {
  jobTitle: string;
  company: string | null;
  matchScore: number;
  reason: string;
  tag: "interest" | "skill" | "growth";
}

function generateRecommendations(
  interestMap: { jobTitle: string; company: string | null; practiced: boolean; practiceCount: number }[],
  skillMap: { taskName: string; jobTitle: string; score: number; sessions: number }[],
): Recommendation[] {
  const recs: Recommendation[] = [];

  // 1. Find strongest skill areas → recommend adjacent roles
  const topSkills = skillMap.filter(s => s.score >= 70);
  const strongRoles = new Set(topSkills.map(s => s.jobTitle.toLowerCase()));

  if (strongRoles.has("product manager")) {
    recs.push({ jobTitle: "Product Operations Manager", company: "Notion", matchScore: 91, reason: "Your product skills transfer directly — strong at requirements & prioritization", tag: "skill" });
    recs.push({ jobTitle: "Technical Program Manager", company: "Google", matchScore: 84, reason: "High overlap with stakeholder communication and backlog management", tag: "skill" });
  }
  if (strongRoles.has("data analyst")) {
    recs.push({ jobTitle: "Analytics Engineer", company: "dbt Labs", matchScore: 88, reason: "Your SQL & data analysis scores are strong — this role builds on that", tag: "skill" });
    recs.push({ jobTitle: "Business Intelligence Lead", company: "Looker", matchScore: 82, reason: "Combines your dashboard skills with strategic reporting", tag: "growth" });
  }
  if (strongRoles.has("software engineer")) {
    recs.push({ jobTitle: "DevOps Engineer", company: "GitLab", matchScore: 79, reason: "Your code review and documentation skills align with CI/CD workflows", tag: "skill" });
  }

  // 2. Interest-based: roles they viewed but haven't practiced
  const viewedOnly = interestMap.filter(i => !i.practiced);
  for (const v of viewedOnly.slice(0, 2)) {
    recs.push({ jobTitle: v.jobTitle, company: v.company, matchScore: 72, reason: `You explored this role — try a practice session to see how your skills match`, tag: "interest" });
  }

  // 3. Growth opportunities from weaker areas
  const weakSkills = skillMap.filter(s => s.score < 50 && s.score > 0);
  if (weakSkills.length > 0) {
    const weakRole = weakSkills[0];
    recs.push({ jobTitle: `${weakRole.jobTitle} (Growth Track)`, company: null, matchScore: 65, reason: `Improving "${weakRole.taskName}" would open up new opportunities`, tag: "growth" });
  }

  return recs.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
}

const TAG_STYLES: Record<string, string> = {
  skill: "border-success/30 text-success",
  interest: "border-primary/30 text-primary",
  growth: "border-warning/30 text-warning",
};
const TAG_LABELS: Record<string, string> = {
  skill: "Skills match",
  interest: "Based on interest",
  growth: "Growth opportunity",
};

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

      const realCompletions = (simRes.data as CompletedSim[]) || [];
      const realAnalyses = (analysisRes.data as AnalysisEntry[]) || [];

      // Use mock data when user has little/no real data
      const useMock = realCompletions.length < 3 && realAnalyses.length < 3;
      setCompletions(useMock ? MOCK_COMPLETIONS : realCompletions);
      setAnalyses(useMock ? MOCK_ANALYSES : realAnalyses);
      setLoading(false);
    })();
  }, [userId]);

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
          taskName: c.task_name, jobTitle: c.job_title,
          totalCorrect: c.correct_answers || 0, totalQ: c.total_questions || 0,
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

  const recommendations = useMemo(
    () => generateRecommendations(interestMap, skillMap),
    [interestMap, skillMap]
  );

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

      {/* ── Job Recommendations ── */}
      {recommendations.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Recommended for You</h2>
            <Badge variant="secondary" className="text-[10px]">{recommendations.length} matches</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">Based on your interests and practice scores, these roles are a strong fit.</p>

          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:border-primary/30 transition-all group hover:shadow-md"
                  onClick={() => goToRole(rec.jobTitle, rec.company)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground truncate">{rec.jobTitle}</p>
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 shrink-0 ${TAG_STYLES[rec.tag]}`}>
                            {TAG_LABELS[rec.tag]}
                          </Badge>
                        </div>
                        {rec.company && <p className="text-[11px] text-muted-foreground mb-1.5">{rec.company}</p>}
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{rec.reason}</p>
                      </div>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="relative w-11 h-11">
                          <svg viewBox="0 0 36 36" className="w-11 h-11 -rotate-90">
                            <circle cx="18" cy="18" r="15" fill="none" className="stroke-muted/20" strokeWidth="3" />
                            <circle
                              cx="18" cy="18" r="15" fill="none"
                              className={rec.matchScore >= 80 ? "stroke-success" : rec.matchScore >= 65 ? "stroke-primary" : "stroke-warning"}
                              strokeWidth="3"
                              strokeDasharray={`${(rec.matchScore / 100) * 94.2} 94.2`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-foreground">
                            {rec.matchScore}
                          </span>
                        </div>
                        <span className="text-[9px] text-muted-foreground">match</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
