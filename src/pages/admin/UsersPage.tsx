import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, UserPlus, Activity, Zap, Search, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, subDays, startOfDay } from "date-fns";

interface UserRow {
  user_id: string;
  display_name: string;
  email: string;
  career_stage: string | null;
  school_name: string | null;
  company: string | null;
  job_title: string | null;
  created_at: string;
  onboarding_completed: boolean;
  total_sims: number;
  total_analyses: number;
  total_xp: number;
  last_active: string | null;
}

type SortKey = "created_at" | "total_sims" | "total_xp" | "last_active" | "display_name";

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("get_admin_user_stats" as any);
      if (!error && data) setUsers(data as any as UserRow[]);
      setLoading(false);
    })();
  }, []);

  const today = startOfDay(new Date());
  const day7 = subDays(today, 7);
  const day30 = subDays(today, 30);

  const metrics = useMemo(() => {
    const total = users.length;
    const last7 = users.filter(u => new Date(u.created_at) >= day7).length;
    const last30 = users.filter(u => new Date(u.created_at) >= day30).length;
    const active7 = users.filter(u => u.last_active && new Date(u.last_active) >= day7).length;
    const totalSims = users.reduce((s, u) => s + u.total_sims, 0);
    const totalXP = users.reduce((s, u) => s + u.total_xp, 0);
    const onboarded = users.filter(u => u.onboarding_completed).length;
    return { total, last7, last30, active7, totalSims, totalXP, onboarded };
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = users.filter(u =>
      u.display_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.school_name || "").toLowerCase().includes(q) ||
      (u.company || "").toLowerCase().includes(q)
    );
    list.sort((a, b) => {
      let av: any, bv: any;
      if (sortKey === "display_name") { av = a.display_name.toLowerCase(); bv = b.display_name.toLowerCase(); }
      else if (sortKey === "total_sims") { av = a.total_sims; bv = b.total_sims; }
      else if (sortKey === "total_xp") { av = a.total_xp; bv = b.total_xp; }
      else if (sortKey === "last_active") { av = a.last_active || ""; bv = b.last_active || ""; }
      else { av = a.created_at; bv = b.created_at; }
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [users, search, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const kpiCards = [
    { label: "Total Users", value: metrics.total, icon: Users, color: "text-primary" },
    { label: "New (7d)", value: metrics.last7, icon: UserPlus, color: "text-emerald-500" },
    { label: "New (30d)", value: metrics.last30, icon: UserPlus, color: "text-blue-500" },
    { label: "Active (7d)", value: metrics.active7, icon: Activity, color: "text-amber-500" },
    { label: "Total Sims", value: metrics.totalSims, icon: Zap, color: "text-purple-500" },
    { label: "Onboarded", value: `${metrics.onboarded}/${metrics.total}`, icon: Users, color: "text-teal-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">User Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map(c => (
          <Card key={c.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold">{typeof c.value === "number" ? c.value.toLocaleString() : c.value}</p>
                <p className="text-[11px] text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Table */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, school, company..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="rounded-md border overflow-auto max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Name" sortKey="display_name" current={sortKey} asc={sortAsc} onSort={toggleSort} />
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Stage</TableHead>
                  <TableHead className="text-xs">School / Company</TableHead>
                  <SortableHead label="Sims" sortKey="total_sims" current={sortKey} asc={sortAsc} onSort={toggleSort} />
                  <SortableHead label="XP" sortKey="total_xp" current={sortKey} asc={sortAsc} onSort={toggleSort} />
                  <SortableHead label="Joined" sortKey="created_at" current={sortKey} asc={sortAsc} onSort={toggleSort} />
                  <SortableHead label="Last Active" sortKey="last_active" current={sortKey} asc={sortAsc} onSort={toggleSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(u => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium text-sm">
                        {u.display_name}
                        {u.onboarding_completed && (
                          <Badge variant="outline" className="ml-2 text-[9px] py-0">✓</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{u.email}</TableCell>
                      <TableCell>
                        {u.career_stage && (
                          <Badge variant="secondary" className="text-[10px]">{u.career_stage}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.school_name || u.company || "—"}
                      </TableCell>
                      <TableCell className="text-sm font-mono">{u.total_sims}</TableCell>
                      <TableCell className="text-sm font-mono">{u.total_xp.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(u.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.last_active ? format(new Date(u.last_active), "MMM d, yyyy") : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">{filtered.length} of {users.length} users</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SortableHead({
  label, sortKey, current, asc, onSort,
}: {
  label: string; sortKey: SortKey; current: SortKey; asc: boolean;
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <TableHead
      className="text-xs cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${active ? "text-primary" : "text-muted-foreground/50"}`} />
      </span>
    </TableHead>
  );
}
