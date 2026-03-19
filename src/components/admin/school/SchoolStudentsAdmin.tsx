import { useState, useEffect } from "react";
import { Loader2, Mail, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SeatRow {
  seat_id: string;
  user_id: string | null;
  invite_email: string | null;
  status: string;
  provisioned_at: string;
  activated_at: string | null;
  display_name: string | null;
  email: string | null;
}

export default function SchoolStudentsAdmin({ schoolId }: { schoolId: string }) {
  const { toast } = useToast();
  const [seats, setSeats] = useState<SeatRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchSeats() {
    const { data } = await supabase.rpc("get_school_students", { _school_id: schoolId });
    setSeats((data as SeatRow[]) || []);
    setLoading(false);
  }

  useEffect(() => { fetchSeats(); }, [schoolId]);

  async function handleRevoke(seatId: string) {
    const { error } = await supabase.from("school_seats").update({ status: "revoked" }).eq("id", seatId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Seat revoked" }); fetchSeats(); }
  }

  const statusBadge = (s: string) =>
    s === "active" ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]" :
    s === "invited" ? "bg-[hsl(var(--neon-blue))]/15 text-[hsl(var(--neon-blue))]" :
    "bg-destructive/15 text-destructive";

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="mt-4">
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Student Seats ({seats.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {seats.length === 0 ? (
            <p className="text-sm text-muted-foreground">No seats provisioned yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Name / Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provisioned</TableHead>
                  <TableHead>Activated</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seats.map(s => (
                  <TableRow key={s.seat_id}>
                    <TableCell className="text-sm">{s.display_name || s.invite_email || s.email || "—"}</TableCell>
                    <TableCell><Badge className={`text-xs ${statusBadge(s.status)}`}>{s.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(s.provisioned_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.activated_at ? new Date(s.activated_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      {s.status === "active" && (
                        <Button variant="ghost" size="sm" onClick={() => handleRevoke(s.seat_id)}>
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
