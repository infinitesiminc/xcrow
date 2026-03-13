import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Calendar, Briefcase, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CompletedSim {
  id: string;
  task_name: string;
  job_title: string;
  company: string | null;
  rounds_completed: number;
  completed_at: string;
}

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [completions, setCompletions] = useState<CompletedSim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchCompletions = async () => {
      const { data } = await supabase
        .from("completed_simulations")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });
      setCompletions((data as CompletedSim[]) || []);
      setLoading(false);
    };
    fetchCompletions();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  const uniqueTasks = new Set(completions.map((c) => c.task_name)).size;
  const uniqueRoles = new Set(completions.map((c) => c.job_title)).size;

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="-ml-2 text-muted-foreground h-7 text-xs">
              <ArrowLeft className="w-3 h-3 mr-1" /> Home
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground h-7 text-xs">
              Sign out
            </Button>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Your Practice Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Sessions", value: completions.length, icon: CheckCircle2 },
            { label: "Tasks Practiced", value: uniqueTasks, icon: Play },
            { label: "Roles Explored", value: uniqueRoles, icon: Briefcase },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <stat.icon className="h-5 w-5 text-primary mx-auto mb-1.5" />
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-[11px] text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Completion list */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Practice History</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
          ) : completions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">No practice sessions yet</p>
                <Button size="sm" onClick={() => navigate("/")}>Start Practicing</Button>
              </CardContent>
            </Card>
          ) : (() => {
              // Group by job_title
              const grouped = completions.reduce((acc, c) => {
                const key = c.job_title + (c.company ? ` · ${c.company}` : "");
                if (!acc[key]) acc[key] = [];
                acc[key].push(c);
                return acc;
              }, {} as Record<string, CompletedSim[]>);
              const groups = Object.entries(grouped);
              const needsGrouping = groups.length > 1;

              if (!needsGrouping) {
                return (
                  <div className="space-y-2">
                    {completions.map((c, i) => (
                      <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.03 }}>
                        <Card className="hover:border-primary/20 transition-colors">
                          <CardContent className="p-4 flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{c.task_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{c.job_title}{c.company ? ` · ${c.company}` : ""}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <Badge variant="outline" className="text-[10px]">{c.rounds_completed} rounds</Badge>
                              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                                <Calendar className="h-2.5 w-2.5" />
                                {new Date(c.completed_at).toLocaleDateString()}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {groups.map(([groupLabel, items], gi) => (
                    <motion.div key={groupLabel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + gi * 0.05 }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">{groupLabel}</h3>
                        <Badge variant="secondary" className="text-[10px]">{items.length} session{items.length !== 1 ? "s" : ""}</Badge>
                      </div>
                      <div className="space-y-1.5 ml-6">
                        {items.map((c) => (
                          <Card key={c.id} className="hover:border-primary/20 transition-colors">
                            <CardContent className="p-3 flex items-center gap-3">
                              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                              <p className="text-sm font-medium text-foreground truncate flex-1">{c.task_name}</p>
                              <div className="text-right shrink-0 flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">{c.rounds_completed} rounds</Badge>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-2.5 w-2.5" />
                                  {new Date(c.completed_at).toLocaleDateString()}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              );
            })()
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
