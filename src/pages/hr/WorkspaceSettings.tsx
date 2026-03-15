import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check, Building2 } from "lucide-react";

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function WorkspaceSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workspace, setWorkspace] = useState<{ id: string; name: string; join_code: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("company_workspaces")
        .select("id, name, join_code")
        .eq("created_by", user.id)
        .limit(1)
        .maybeSingle();
      if (data) setWorkspace(data);
      setLoading(false);
    })();
  }, [user]);

  const createWorkspace = async () => {
    if (!user || !name.trim()) return;
    setCreating(true);
    const code = generateCode();
    const { data, error } = await supabase
      .from("company_workspaces")
      .insert({ name: name.trim(), join_code: code, created_by: user.id })
      .select("id, name, join_code")
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      // Also add creator as admin member
      await supabase.from("workspace_members").insert({
        workspace_id: data.id,
        user_id: user.id,
        role: "admin",
      });
      setWorkspace(data);
      toast({ title: "Workspace created!", description: `Join code: ${data.join_code}` });
    }
    setCreating(false);
  };

  const copyCode = () => {
    if (!workspace) return;
    navigator.clipboard.writeText(workspace.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-foreground">Workspace Settings</h1>

      {workspace ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {workspace.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Join Code</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 bg-secondary rounded-md px-3 py-2 text-lg font-mono font-bold text-foreground tracking-widest text-center">
                  {workspace.join_code}
                </code>
                <Button variant="outline" size="sm" onClick={copyCode} className="gap-1.5">
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Share this code with your team. They can join at <span className="font-medium">/join</span> after signing in.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Create Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ws-name">Workspace Name</Label>
              <Input
                id="ws-name"
                placeholder="e.g. Acme Corp L&D"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button onClick={createWorkspace} disabled={creating || !name.trim()} className="w-full gap-1.5">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Workspace
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
