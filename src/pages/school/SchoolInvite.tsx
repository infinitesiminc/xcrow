import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Globe } from "lucide-react";

export default function SchoolInvite() {
  const { schoolId } = useAuth();
  const [emails, setEmails] = useState("");
  const [sending, setSending] = useState(false);
  const [school, setSchool] = useState<{ total_seats: number; used_seats: number; domain: string | null } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      const { data } = await (supabase.from("school_accounts" as any) as any)
        .select("total_seats, used_seats, domain")
        .eq("id", schoolId)
        .single();
      if (data) setSchool(data);
    })();
  }, [schoolId]);

  const handleInvite = async () => {
    if (!schoolId || !school) return;
    const emailList = emails
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    if (emailList.length === 0) {
      toast({ title: "No valid emails", description: "Enter at least one valid email address.", variant: "destructive" });
      return;
    }

    const remaining = school.total_seats - school.used_seats;
    if (emailList.length > remaining) {
      toast({ title: "Not enough seats", description: `You have ${remaining} seats remaining but tried to invite ${emailList.length} students.`, variant: "destructive" });
      return;
    }

    setSending(true);
    const rows = emailList.map((e) => ({
      school_id: schoolId,
      invite_email: e,
      status: "invited",
      provisioned_at: new Date().toISOString(),
    }));

    const { error } = await (supabase.from("school_seats" as any) as any).insert(rows);
    setSending(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Invites sent", description: `${emailList.length} student(s) invited.` });
      setEmails("");
      // Refresh school data
      const { data } = await (supabase.from("school_accounts" as any) as any)
        .select("total_seats, used_seats, domain")
        .eq("id", schoolId)
        .single();
      if (data) setSchool(data);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-foreground">Invite Students</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Mail className="h-4 w-4" /> Email Invite</CardTitle>
          <CardDescription>Add student emails (one per line, or comma-separated). They'll get Pro access when they sign up.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={"student1@school.edu\nstudent2@school.edu\nstudent3@school.edu"}
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            rows={6}
            className="font-mono text-sm"
          />
          {school && (
            <p className="text-xs text-muted-foreground">
              {school.total_seats - school.used_seats} seats remaining out of {school.total_seats} total.
            </p>
          )}
          <Button onClick={handleInvite} disabled={sending || !emails.trim()} className="gap-1.5">
            {sending ? "Sending…" : "Send Invites"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Globe className="h-4 w-4" /> Domain Auto-Match</CardTitle>
          <CardDescription>Students who sign up with a matching email domain are automatically granted a seat.</CardDescription>
        </CardHeader>
        <CardContent>
          {school?.domain ? (
            <p className="text-sm text-foreground">
              Currently matching: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">@{school.domain}</code>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No domain configured. Contact support to set up domain matching.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
