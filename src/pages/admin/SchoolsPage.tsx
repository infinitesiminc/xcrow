import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import SchoolsDataTable from "@/components/admin/SchoolsDataTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function SchoolsPage() {
  const [searchParams] = useSearchParams();
  const pipelineFilter = searchParams.get("pipeline") || undefined;
  const { toast } = useToast();

  const [schoolId, setSchoolId] = useState("");
  const [emails, setEmails] = useState("");
  const [provisioning, setProvisioning] = useState(false);
  const [results, setResults] = useState<{ email: string; status: string }[]>([]);

  const handleBatchProvision = async () => {
    if (!schoolId.trim() || !emails.trim()) return;
    setProvisioning(true);
    setResults([]);

    const emailList = emails
      .split(/[\n,;]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.includes("@"));

    const batchResults: { email: string; status: string }[] = [];

    for (const email of emailList) {
      try {
        const { error } = await (supabase.from("school_seats" as any) as any).insert({
          school_id: schoolId.trim(),
          invite_email: email,
          status: "invited",
        });
        batchResults.push({ email, status: error ? `Error: ${error.message}` : "✓ Invited" });
      } catch (err: any) {
        batchResults.push({ email, status: `Error: ${err.message}` });
      }
    }

    setResults(batchResults);
    const successCount = batchResults.filter(r => r.status.startsWith("✓")).length;
    toast({
      title: `Provisioned ${successCount}/${emailList.length} seats`,
      description: successCount < emailList.length ? "Some invites failed — check results below." : undefined,
    });
    setProvisioning(false);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">School Accounts</h1>

      {/* Batch Provision */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Batch Seat Provisioning
          </CardTitle>
          <CardDescription>
            Invite multiple students to a school account at once. Enter the school ID and a list of emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground font-medium">School Account ID</label>
              <Input
                placeholder="UUID of school account"
                value={schoolId}
                onChange={e => setSchoolId(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              Student Emails (one per line, or comma/semicolon separated)
            </label>
            <Textarea
              placeholder={"student1@university.edu\nstudent2@university.edu\nstudent3@university.edu"}
              value={emails}
              onChange={e => setEmails(e.target.value)}
              rows={5}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {emails.split(/[\n,;]+/).map(e => e.trim()).filter(e => e.includes("@")).length} email(s) detected
            </p>
            <Button onClick={handleBatchProvision} disabled={provisioning || !schoolId.trim() || !emails.trim()}>
              {provisioning ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <GraduationCap className="h-4 w-4 mr-1" />}
              Provision Seats
            </Button>
          </div>

          {results.length > 0 && (
            <div className="border rounded-lg divide-y max-h-48 overflow-auto">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 text-xs">
                  <code className="text-muted-foreground">{r.email}</code>
                  <Badge variant={r.status.startsWith("✓") ? "secondary" : "destructive"} className="text-[10px]">
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* School accounts table */}
      <SchoolsDataTable initialPipelineFilter={pipelineFilter} />
    </div>
  );
}
