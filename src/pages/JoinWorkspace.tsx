import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function JoinWorkspace() {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleJoin = async () => {
    if (!user) { openAuthModal(); return; }
    if (!code.trim()) return;

    setJoining(true);
    // Look up workspace by join code
    const { data: ws, error: wsErr } = await supabase
      .from("company_workspaces")
      .select("id, name")
      .eq("join_code", code.trim().toUpperCase())
      .maybeSingle();

    if (wsErr || !ws) {
      toast({ title: "Invalid code", description: "No workspace found with that code.", variant: "destructive" });
      setJoining(false);
      return;
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", ws.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      toast({ title: "Already a member", description: `You're already in ${ws.name}.` });
      setJoining(false);
      setJoined(true);
      return;
    }

    // Join
    const { error } = await supabase.from("workspace_members").insert({
      workspace_id: ws.id,
      user_id: user.id,
      role: "member",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Joined!", description: `Welcome to ${ws.name}.` });
      setJoined(true);
    }
    setJoining(false);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              {joined ? <CheckCircle2 className="h-6 w-6 text-success" /> : <KeyRound className="h-6 w-6 text-primary" />}
            </div>
            <CardTitle>{joined ? "You're In!" : "Join Your Team"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {joined ? (
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Your simulation progress will now be visible to your team admin.
                </p>
                <Button onClick={() => navigate("/dashboard")} className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="join-code">Workspace Code</Label>
                  <Input
                    id="join-code"
                    placeholder="Enter 6-character code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-center text-lg font-mono tracking-widest"
                  />
                </div>
                <Button onClick={handleJoin} disabled={joining || code.length < 4} className="w-full gap-1.5">
                  {joining && <Loader2 className="h-4 w-4 animate-spin" />}
                  Join Workspace
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  Ask your HR admin for the workspace join code.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
