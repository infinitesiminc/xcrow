import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StudentRow {
  seat_id: string;
  user_id: string | null;
  invite_email: string | null;
  status: string;
  provisioned_at: string;
  activated_at: string | null;
  display_name: string | null;
  email: string | null;
}

export default function SchoolStudents() {
  const { schoolId } = useAuth();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStudents = async () => {
    if (!schoolId) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("get_school_students" as any, { _school_id: schoolId });
    if (data) setStudents(data as any);
    if (error) console.error(error);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, [schoolId]);

  const revokeSeat = async (seatId: string) => {
    const { error } = await (supabase.from("school_seats" as any) as any)
      .update({ status: "revoked" })
      .eq("id", seatId);
    if (error) {
      toast({ title: "Error", description: "Failed to revoke seat.", variant: "destructive" });
    } else {
      toast({ title: "Seat revoked" });
      fetchStudents();
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Active</Badge>;
      case "invited": return <Badge variant="outline" className="text-amber-600 border-amber-500/30">Invited</Badge>;
      case "revoked": return <Badge variant="outline" className="text-destructive border-destructive/30">Revoked</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-foreground">Students</h1>
      <p className="text-sm text-muted-foreground">{students.length} total seats provisioned.</p>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Activated</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No students yet. Invite some!</TableCell>
              </TableRow>
            ) : (
              students.map((s) => (
                <TableRow key={s.seat_id}>
                  <TableCell className="font-medium">{s.display_name || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.email || s.invite_email || "—"}</TableCell>
                  <TableCell>{statusBadge(s.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.activated_at ? new Date(s.activated_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    {s.status !== "revoked" && (
                      <Button variant="ghost" size="sm" onClick={() => revokeSeat(s.seat_id)} className="text-destructive hover:text-destructive">
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
