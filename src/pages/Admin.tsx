import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Activity, Search, Trash2, Loader2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface UserStat {
  user_id: string;
  display_name: string;
  email: string;
  company: string;
  job_title: string;
  created_at: string;
  onboarding_completed: boolean;
  career_stage: string;
}

const Admin = () => {
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchUsers();
  }, [isSuperAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-list-users");
    if (!error && Array.isArray(data)) {
      setUsers(data);
    } else if (error) {
      toast({ title: "Error loading users", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    setDeleting(userId);
    const { error } = await supabase.functions.invoke("admin-delete-user", {
      body: { user_id: userId },
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User deleted", description: email });
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
    }
    setDeleting(null);
  };

  if (authLoading) return null;
  if (!user || !isSuperAdmin) return <Navigate to="/" replace />;

  const filtered = users.filter(
    (u) =>
      u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Users className="h-4 w-4" /> Total Users
              </div>
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Activity className="h-4 w-4" /> Onboarded
              </div>
              <p className="text-2xl font-bold text-foreground">
                {users.filter((u) => u.onboarding_completed).length}
              </p>
            </CardContent>
          </Card>
        </div>


        {/* User Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="text-lg">Users</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                     <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">
                          {u.display_name || "—"}
                          {u.onboarding_completed && (
                            <Badge variant="secondary" className="ml-2 text-[10px]">onboarded</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                        <TableCell className="text-sm">{u.company || "—"}</TableCell>
                        <TableCell className="text-sm">{u.job_title || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.created_at ? format(new Date(u.created_at), "MMM d, yyyy") : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            disabled={deleting === u.user_id}
                            onClick={() => handleDelete(u.user_id, u.email)}
                          >
                            {deleting === u.user_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
