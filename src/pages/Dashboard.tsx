import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, Calendar, Briefcase, Loader2, Play, BarChart3, Bot,
  ShieldAlert, ArrowRight, Bookmark, Target, Sparkles, GraduationCap,
  Zap, ExternalLink, Settings, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CompletedSim {
  id: string;
  task_name: string;
  job_title: string;
  company: string | null;
  rounds_completed: number;
  completed_at: string;
  correct_answers: number;
  total_questions: number;
  experience_level: string | null;
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

interface BookmarkedRole {
  id: string;
  job_title: string;
  company: string | null;
  augmented_percent: number;
  automation_risk_percent: number;
  new_skills_percent: number;
  bookmarked_at: string;
}

const Dashboard = () => {
  const { user, loading: authLoading, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [completions, setCompletions] = useState<CompletedSim[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisEntry[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkedRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteAnalysis = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId) return;
    setDeletingId(id);
    const { error } = await supabase.from("analysis_history").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    } else {
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Analysis deleted" });
    }
    setDeletingId(null);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [simRes, analysisRes, bookmarkRes] = await Promise.all([
        supabase.from("completed_simulations").select("*").eq("user_id", user.id).order("completed_at", { ascending: false }),
        supabase.from("analysis_history").select("*").eq("user_id", user.id).order("analyzed_at", { ascending: false }),
        supabase.from("bookmarked_roles").select("*").eq("user_id", user.id).order("bookmarked_at", { ascending: false }),
      ]);
      setCompletions((simRes.data as CompletedSim[]) || []);
      setAnalyses((analysisRes.data as AnalysisEntry[]) || []);
      setBookmarks((bookmarkRes.data as BookmarkedRole[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  const uniqueTasks = new Set(completions.map((c) => c.task_name)).size;

  // Find user's own role analysis if profile has job title
  const myRoleAnalysis = profile?.jobTitle
    ? analyses.find((a) => a.job_title.toLowerCase() === profile.jobTitle!.toLowerCase())
    : null;

  const hasProfile = !!(profile?.jobTitle);

  // Generate action plan based on profile + analyses
  const actionItems = (() => {
    const items: { text: string; icon: typeof Bot; priority: "high" | "medium" | "low" }[] = [];

    // Profile-aware suggestions
    if (hasProfile && !myRoleAnalysis) {
      items.push({ text: `Analyze your role: ${profile!.jobTitle}`, icon: Zap, priority: "high" });
    }
    if (myRoleAnalysis && myRoleAnalysis.automation_risk_percent >= 40) {
      items.push({ text: `Your role has ${myRoleAnalysis.automation_risk_percent}% automation risk — explore adjacent roles`, icon: ShieldAlert, priority: "high" });
    }
    if (myRoleAnalysis && myRoleAnalysis.augmented_percent >= 50) {
      items.push({ text: `Upskill on AI-augmented tasks for your role`, icon: Bot, priority: "medium" });
    }
    if (completions.length === 0) {
      items.push({ text: "Complete your first simulation to build skills", icon: GraduationCap, priority: "medium" });
    }

    // Add suggestions from other analyses
    analyses.filter(a => a !== myRoleAnalysis).slice(0, 2).forEach((a) => {
      if (a.automation_risk_percent >= 40) {
        items.push({ text: `Explore AI-adjacent skills for ${a.job_title}`, icon: ShieldAlert, priority: "high" });
      }
    });

    return items.slice(0, 5);
  })();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-foreground">
            {profile?.displayName ? `Welcome, ${profile.displayName}` : "Your Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {profile?.jobTitle ? (
              <>{profile.jobTitle}{profile.company ? ` at ${profile.company}` : ""}</>
            ) : (
              user.email
            )}
          </p>
        </motion.div>

        {/* Your Role Card */}
        {hasProfile && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
            {myRoleAnalysis ? (
              <Card
                className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/10 cursor-pointer hover:shadow-md transition-all"
                onClick={() => {
                  const params = new URLSearchParams({ title: myRoleAnalysis.job_title });
                  if (myRoleAnalysis.company) params.set("company", myRoleAnalysis.company);
                   navigate(`/analysis?${params.toString()}`, { state: { from: "dashboard" } });
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Your Role</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-foreground">{myRoleAnalysis.job_title}</h3>
                      {myRoleAnalysis.company && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <ExternalLink className="h-3 w-3" />{myRoleAnalysis.company}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-4 shrink-0">
                      <div className="text-center">
                        <div className="text-xl font-bold text-foreground">{myRoleAnalysis.augmented_percent}%</div>
                        <div className="text-[10px] text-muted-foreground">AI Involvement</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-foreground">{myRoleAnalysis.automation_risk_percent}%</div>
                        <div className="text-[10px] text-muted-foreground">Automation Risk</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                    <Badge variant="secondary" className="text-[10px]">{myRoleAnalysis.tasks_count} tasks analyzed</Badge>
                    <span className="text-[10px] text-muted-foreground ml-auto">View full report →</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-primary/30">
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Analyze your role</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Get a personalized AI impact report for <span className="font-medium text-foreground">{profile!.jobTitle}</span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      const params = new URLSearchParams({ title: profile!.jobTitle! });
                      if (profile!.company) params.set("company", profile!.company);
                      navigate(`/analysis?${params.toString()}`, { state: { from: "dashboard" } });
                    }}
                  >
                    <Zap className="h-3.5 w-3.5 mr-1" /> Analyze
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* No profile prompt */}
        {!hasProfile && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
            <Card className="border-dashed">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Complete your profile</p>
                  <p className="text-xs text-muted-foreground">Add your job title to get personalized insights</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate("/settings")}>
                  <Settings className="h-3.5 w-3.5 mr-1" /> Settings
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: "Jobs Analyzed", value: analyses.length, icon: BarChart3 },
            { label: "Tasks Upskilled", value: uniqueTasks, icon: Play },
            { label: "Sessions", value: completions.length, icon: CheckCircle2 },
            { label: "Saved Roles", value: bookmarks.length, icon: Bookmark },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-3 text-center">
                <stat.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                <div className="text-xl font-bold text-foreground">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Action Plan */}
        {actionItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Your Action Plan</h2>
            </div>
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5">
              <CardContent className="p-4 space-y-2">
                {actionItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-3 py-1.5">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        item.priority === "high" ? "bg-destructive" : item.priority === "medium" ? "bg-warning" : "bg-success"
                      }`} />
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground">{item.text}</span>
                    </div>
                  );
                })}
                <p className="text-[10px] text-muted-foreground pt-2 border-t border-border/50">
                  Based on your {analyses.length} analyzed role{analyses.length !== 1 ? "s" : ""}. Analyze more roles for better recommendations.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Bookmarked Roles */}
        {bookmarks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="mb-8">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <Bookmark className="h-3.5 w-3.5" /> Saved Roles
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {bookmarks.map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 + i * 0.04 }}>
                  <Card
                    className="cursor-pointer hover:border-primary/20 hover:shadow-md transition-all"
                    onClick={() => {
                      const params = new URLSearchParams({ title: b.job_title });
                      if (b.company) params.set("company", b.company);
                      navigate(`/analysis?${params.toString()}`, { state: { from: "dashboard" } });
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">{b.job_title}</p>
                          {b.company && <p className="text-xs text-muted-foreground truncate">{b.company}</p>}
                        </div>
                        <Bookmark className="h-3.5 w-3.5 text-primary fill-primary shrink-0 mt-0.5" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-xs font-bold text-foreground">{b.augmented_percent}%</div>
                          <div className="text-[9px] text-muted-foreground">AI</div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">{b.automation_risk_percent}%</div>
                          <div className="text-[9px] text-muted-foreground">Risk</div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">{b.new_skills_percent}%</div>
                          <div className="text-[9px] text-muted-foreground">New Skills</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Analyzed Jobs */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-8">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Analyzed Jobs</h2>
          {analyses.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">No analyses yet</p>
                <Button size="sm" onClick={() => navigate("/")}>Analyze a Role</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {analyses.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.04 }}>
                  <Card
                    className="cursor-pointer hover:border-primary/20 hover:shadow-md transition-all"
                    onClick={() => {
                      const params = new URLSearchParams({ title: a.job_title });
                      if (a.company) params.set("company", a.company);
                      navigate(`/analysis?${params.toString()}`, { state: { from: "dashboard" } });
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">{a.job_title}</p>
                          {a.company && <p className="text-xs text-muted-foreground truncate">{a.company}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={(e) => deleteAnalysis(a.id, e)}
                          disabled={deletingId === a.id}
                        >
                          {deletingId === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Bot className="h-3 w-3 text-primary shrink-0" />
                          <div className="flex-1">
                            <div className="flex justify-between text-[10px] mb-0.5">
                              <span className="text-muted-foreground">AI-augmented</span>
                              <span className="font-medium text-foreground">{a.augmented_percent}%</span>
                            </div>
                            <Progress value={a.augmented_percent} className="h-1" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="h-3 w-3 text-destructive shrink-0" />
                          <div className="flex-1">
                            <div className="flex justify-between text-[10px] mb-0.5">
                              <span className="text-muted-foreground">Automation risk</span>
                              <span className="font-medium text-foreground">{a.automation_risk_percent}%</span>
                            </div>
                            <Progress value={a.automation_risk_percent} className="h-1" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                        <Badge variant="secondary" className="text-[10px]">{a.tasks_count} tasks</Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          {new Date(a.analyzed_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Practice History — grouped by job with scores */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Upskill History</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
          ) : completions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">No upskill sessions yet</p>
                <Button size="sm" onClick={() => navigate("/")}>Start Upskilling</Button>
              </CardContent>
            </Card>
          ) : (() => {
              const grouped = completions.reduce((acc, c) => {
                const key = c.job_title + "||" + (c.company || "");
                if (!acc[key]) acc[key] = { jobTitle: c.job_title, company: c.company, items: [] };
                acc[key].items.push(c);
                return acc;
              }, {} as Record<string, { jobTitle: string; company: string | null; items: CompletedSim[] }>);

              return (
                <div className="space-y-5">
                  {Object.values(grouped).map((group, gi) => {
                    const totalCorrect = group.items.reduce((s, c) => s + (c.correct_answers || 0), 0);
                    const totalQ = group.items.reduce((s, c) => s + (c.total_questions || 0), 0);
                    const avgScore = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : null;

                    return (
                      <motion.div key={gi} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + gi * 0.05 }}>
                        <Card className="overflow-hidden">
                          <div
                            className="flex items-center justify-between gap-3 px-4 py-3 bg-accent/30 border-b border-border/40 cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => {
                              const params = new URLSearchParams({ title: group.jobTitle });
                              if (group.company) params.set("company", group.company);
                              navigate(`/analysis?${params.toString()}`, { state: { from: "dashboard" } });
                            }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Briefcase className="h-4 w-4 text-primary shrink-0" />
                              <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-foreground truncate">{group.jobTitle}</h3>
                                {group.company && <p className="text-[10px] text-muted-foreground truncate">{group.company}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <Badge variant="secondary" className="text-[10px]">{group.items.length} session{group.items.length !== 1 ? "s" : ""}</Badge>
                              {avgScore !== null && (
                                <div className="text-center">
                                  <div className={`text-sm font-bold ${avgScore >= 70 ? "text-success" : avgScore >= 40 ? "text-warning" : "text-destructive"}`}>{avgScore}%</div>
                                  <div className="text-[9px] text-muted-foreground">avg score</div>
                                </div>
                              )}
                              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          </div>
                          <CardContent className="p-0">
                            <div className="divide-y divide-border/30">
                              {group.items.map((c) => {
                                const score = c.total_questions > 0 ? Math.round((c.correct_answers / c.total_questions) * 100) : null;
                                return (
                                  <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                                    <p className="text-sm text-foreground truncate flex-1">{c.task_name}</p>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {score !== null && (
                                        <span className={`text-xs font-semibold ${score >= 70 ? "text-success" : score >= 40 ? "text-warning" : "text-destructive"}`}>
                                          {c.correct_answers}/{c.total_questions}
                                        </span>
                                      )}
                                      <Badge variant="outline" className="text-[10px]">{c.rounds_completed}r</Badge>
                                      <span className="text-[10px] text-muted-foreground">
                                        {new Date(c.completed_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })()
          }
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
