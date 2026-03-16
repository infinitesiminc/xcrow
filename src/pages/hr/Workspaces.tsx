import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Users, Calendar, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface WorkspaceRow {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
  created_by: string;
  member_count: number;
  company_count: number;
  creator_name: string | null;
}

export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      // Fetch all workspaces
      const { data: ws } = await supabase
        .from("company_workspaces")
        .select("*")
        .order("created_at", { ascending: false });

      if (!ws || ws.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch member counts
      const { data: members } = await supabase
        .from("workspace_members")
        .select("workspace_id");

      // Fetch company counts
      const { data: companies } = await supabase
        .from("companies")
        .select("workspace_id")
        .not("workspace_id", "is", null);

      // Fetch creator profiles
      const creatorIds = [...new Set(ws.map((w) => w.created_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", creatorIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p.display_name])
      );

      const memberCounts = new Map<string, number>();
      (members ?? []).forEach((m) => {
        memberCounts.set(m.workspace_id, (memberCounts.get(m.workspace_id) ?? 0) + 1);
      });

      const companyCounts = new Map<string, number>();
      (companies ?? []).forEach((c) => {
        if (c.workspace_id) {
          companyCounts.set(c.workspace_id, (companyCounts.get(c.workspace_id) ?? 0) + 1);
        }
      });

      setWorkspaces(
        ws.map((w) => ({
          ...w,
          member_count: memberCounts.get(w.id) ?? 0,
          company_count: companyCounts.get(w.id) ?? 0,
          creator_name: profileMap.get(w.created_by) ?? null,
        }))
      );
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif text-foreground">All Workspaces</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Superadmin view of every workspace on the platform.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No workspaces found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {workspaces.map((ws) => (
            <Card
              key={ws.id}
              className="hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => navigate(`/hr/team-progress?workspace=${ws.id}`)}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">{ws.name}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {ws.join_code}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {ws.member_count} member{ws.member_count !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {ws.company_count} compan{ws.company_count !== 1 ? "ies" : "y"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Created {new Date(ws.created_at).toLocaleDateString()}
                  </span>
                  {ws.creator_name && (
                    <span>by {ws.creator_name}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
