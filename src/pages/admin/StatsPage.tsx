import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Briefcase, Brain, Users, Loader2 } from "lucide-react";

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [companies, jobs, clusters, sims, users] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("jobs").select("id", { count: "exact", head: true }),
        supabase.from("job_task_clusters").select("id", { count: "exact", head: true }),
        supabase.from("completed_simulations").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        companies: companies.count || 0,
        jobs: jobs.count || 0,
        clusters: clusters.count || 0,
        sims: sims.count || 0,
        users: users.count || 0,
      });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cards = [
    { label: "Companies", value: stats.companies, icon: Building2 },
    { label: "Jobs", value: stats.jobs, icon: Briefcase },
    { label: "Task Clusters", value: stats.clusters, icon: Brain },
    { label: "Simulations Run", value: stats.sims, icon: Brain },
    { label: "Users", value: stats.users, icon: Users },
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Platform Stats</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(c => (
          <Card key={c.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{c.value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
