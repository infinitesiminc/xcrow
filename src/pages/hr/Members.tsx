import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: { display_name: string | null; job_title: string | null } | null;
}

export default function Members() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!user) return;
    setLoading(true);

    // Get workspace where user is admin
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!membership?.length) { setLoading(false); return; }
    const wsId = membership[0].workspace_id;
    setWorkspaceId(wsId);

    // Get all members with profile info
    const { data } = await supabase
      .from("workspace_members")
      .select("id, user_id, role, joined_at")
      .eq("workspace_id", wsId)
      .order("joined_at", { ascending: true });

    if (data) {
      // Fetch profiles for each member
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, job_title")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const enriched = data.map(m => ({
        ...m,
        profiles: profileMap.get(m.user_id) || null,
      }));
      setMembers(enriched);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, [user]);

  const removeMember = async (memberId: string) => {
    const { error } = await supabase.from("workspace_members").delete().eq("id", memberId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Member removed" });
      fetchMembers();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Members</h1>
          <p className="text-sm text-muted-foreground">{members.length} team member{members.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="space-y-2">
        {members.map((m) => (
          <Card key={m.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {(m.profiles?.display_name || "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {m.profiles?.display_name || "Unknown User"}
                </p>
                {m.profiles?.job_title && (
                  <p className="text-[11px] text-muted-foreground">{m.profiles.job_title}</p>
                )}
              </div>
              <Badge variant={m.role === "admin" ? "default" : "secondary"} className="text-[10px]">
                {m.role}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {new Date(m.joined_at).toLocaleDateString()}
              </span>
              {m.role !== "admin" && m.user_id !== user?.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeMember(m.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
