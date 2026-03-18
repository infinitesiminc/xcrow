import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Building2, Briefcase, Brain, Users, Loader2, Settings2, CheckCircle2, MapPin } from "lucide-react";

interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string | null;
}

export default function StatsPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [parsingLocations, setParsingLocations] = useState(false);
  const [parseProgress, setParseProgress] = useState("");

  useEffect(() => {
    (async () => {
      const [companies, jobs, clusters, sims, users, flagsRes, analyzedJobs] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("jobs").select("id", { count: "exact", head: true }),
        supabase.from("job_task_clusters").select("id", { count: "exact", head: true }),
        supabase.from("completed_simulations").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("feature_flags" as any).select("key, enabled, description").order("key"),
        supabase.from("job_task_clusters").select("job_id").then(res => {
          const unique = new Set((res.data || []).map((r: any) => r.job_id));
          return { count: unique.size };
        }),
      ]);

      setStats({
        companies: companies.count || 0,
        jobs: jobs.count || 0,
        analyzedJobs: analyzedJobs.count || 0,
        clusters: clusters.count || 0,
        sims: sims.count || 0,
        users: users.count || 0,
      });
      setFlags((flagsRes.data as any as FeatureFlag[]) || []);
      setLoading(false);
    })();
  }, []);

  const toggleFlag = async (key: string, newValue: boolean) => {
    setTogglingKey(key);
    await (supabase.from("feature_flags" as any) as any)
      .update({ enabled: newValue, updated_at: new Date().toISOString() })
      .eq("key", key);
    setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: newValue } : f));
    setTogglingKey(null);
  };

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
    { label: "Jobs Analyzed", value: stats.analyzedJobs, icon: CheckCircle2 },
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

      {flags.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Feature Flags</h2>
            </div>
            <div className="space-y-3">
              {flags.map(f => (
                <Card key={f.key}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor={f.key} className="text-sm font-medium cursor-pointer">
                        {f.key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </Label>
                      {f.description && (
                        <p className="text-xs text-muted-foreground">{f.description}</p>
                      )}
                    </div>
                    <Switch
                      id={f.key}
                      checked={f.enabled}
                      disabled={togglingKey === f.key}
                      onCheckedChange={(v) => toggleFlag(f.key, v)}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
