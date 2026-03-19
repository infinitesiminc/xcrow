import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Zap, Target } from "lucide-react";

interface StudentAnalytics {
  user_id: string;
  display_name: string;
  total_sims: number;
  total_xp: number;
  avg_score: number;
}

export default function SchoolAnalytics() {
  const { schoolId } = useAuth();
  const [data, setData] = useState<StudentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      const { data: rows } = await supabase.rpc("get_school_analytics" as any, { _school_id: schoolId });
      if (rows) setData(rows as any);
      setLoading(false);
    })();
  }, [schoolId]);

  const totalSims = data.reduce((s, d) => s + d.total_sims, 0);
  const totalXP = data.reduce((s, d) => s + d.total_xp, 0);
  const avgScore = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.avg_score, 0) / data.length) : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-foreground">Cohort Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Simulations</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{totalSims}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total XP Earned</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <span className="text-2xl font-bold text-foreground">{totalXP.toLocaleString()}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg. Score</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-500" />
            <span className="text-2xl font-bold text-foreground">{avgScore}%</span>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead className="text-right">Simulations</TableHead>
              <TableHead className="text-right">XP</TableHead>
              <TableHead className="text-right">Avg Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No activity yet.</TableCell>
              </TableRow>
            ) : (
              data.sort((a, b) => b.total_xp - a.total_xp).map((s) => (
                <TableRow key={s.user_id}>
                  <TableCell className="font-medium">{s.display_name}</TableCell>
                  <TableCell className="text-right">{s.total_sims}</TableCell>
                  <TableCell className="text-right">{s.total_xp.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{Math.round(s.avg_score)}%</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
