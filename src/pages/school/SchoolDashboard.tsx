import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, UserMinus, Calendar, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SchoolData {
  name: string;
  total_seats: number;
  used_seats: number;
  expires_at: string | null;
  domain: string | null;
}

export default function SchoolDashboard() {
  const { schoolId } = useAuth();
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      const { data } = await (supabase.from("school_accounts" as any) as any)
        .select("name, total_seats, used_seats, expires_at, domain")
        .eq("id", schoolId)
        .single();
      if (data) setSchool(data);
      setLoading(false);
    })();
  }, [schoolId]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!school) {
    return <div className="p-8 text-center text-muted-foreground">School not found.</div>;
  }

  const remaining = school.total_seats - school.used_seats;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{school.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your institutional license and student seats.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Seats</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{school.total_seats}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active Students</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-emerald-500" />
            <span className="text-2xl font-bold text-foreground">{school.used_seats}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Remaining</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2">
            <UserMinus className="h-5 w-5 text-amber-500" />
            <span className="text-2xl font-bold text-foreground">{remaining}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wider">License Expires</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {school.expires_at ? new Date(school.expires_at).toLocaleDateString() : "No expiry"}
            </span>
          </CardContent>
        </Card>
      </div>

      {school.domain && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Auto-enroll domain:</strong>{" "}
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">@{school.domain}</code>
              {" "}— Students signing up with this email domain are automatically activated.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button onClick={() => navigate("/school/invite")} className="gap-1.5">
          <Mail className="h-4 w-4" /> Invite Students
        </Button>
        <Button variant="outline" onClick={() => navigate("/school/students")}>
          <Users className="h-4 w-4 mr-1.5" /> Manage Students
        </Button>
      </div>
    </div>
  );
}
