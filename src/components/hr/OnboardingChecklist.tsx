import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Building2, Search, Users, Play, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ChecklistStep {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  done: boolean;
}

export default function OnboardingChecklist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<ChecklistStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Check workspace
      const { data: membership } = await supabase
        .from("workspace_members").select("workspace_id")
        .eq("user_id", user.id).limit(1);
      const hasWorkspace = !!membership?.length;
      const wsId = membership?.[0]?.workspace_id;

      // Check imported companies
      let hasCompanies = false;
      let hasAnalyzedRoles = false;
      let hasMembers = false;
      let hasSimulations = false;

      if (wsId) {
        const [companiesRes, membersRes, progressRes] = await Promise.all([
          supabase.from("companies").select("id").eq("workspace_id", wsId).limit(1),
          supabase.from("workspace_members").select("id").eq("workspace_id", wsId),
          supabase.rpc("get_workspace_progress", { p_workspace_id: wsId }),
        ]);

        hasCompanies = !!(companiesRes.data?.length);
        hasMembers = (membersRes.data?.length || 0) > 1; // More than just the creator

        if (hasCompanies) {
          // Check if any jobs have task clusters (analyzed)
          const { data: wsJobs } = await supabase
            .from("jobs").select("id")
            .eq("workspace_id", wsId).limit(1);
          if (wsJobs?.length) {
            const { data: clusters } = await supabase
              .from("job_task_clusters").select("id")
              .eq("job_id", wsJobs[0].id).limit(1);
            hasAnalyzedRoles = !!(clusters?.length);
          }
        }

        hasSimulations = !!(progressRes.data?.length);
      }

      setSteps([
        {
          key: "workspace",
          label: "Create workspace",
          description: "Set up your team workspace",
          icon: Building2,
          href: "/hr/settings",
          done: hasWorkspace,
        },
        {
          key: "import",
          label: "Import company roles",
          description: "Sync roles from your ATS or upload manually",
          icon: Search,
          href: "/hr/ats-sync",
          done: hasCompanies,
        },
        {
          key: "analyze",
          label: "Analyze roles",
          description: "Run AI exposure analysis on imported roles",
          icon: Rocket,
          href: "/hr/score-distributions",
          done: hasAnalyzedRoles,
        },
        {
          key: "invite",
          label: "Invite team members",
          description: "Share join code with your team",
          icon: Users,
          href: "/hr/members",
          done: hasMembers,
        },
        {
          key: "simulations",
          label: "Team completes simulations",
          description: "Track readiness as employees complete sims",
          icon: Play,
          href: "/hr/team-progress",
          done: hasSimulations,
        },
      ]);
      setLoading(false);
    })();
  }, [user]);

  if (loading || steps.length === 0) return null;

  const doneCount = steps.filter(s => s.done).length;
  const allDone = doneCount === steps.length;
  const progressPercent = Math.round((doneCount / steps.length) * 100);

  // Don't show if all done
  if (allDone) return null;

  // Find next step
  const nextStep = steps.find(s => !s.done);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Getting Started</h3>
          <span className="text-xs text-muted-foreground">{doneCount}/{steps.length} complete</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
        
        <div className="space-y-2">
          {steps.map((step) => (
            <button
              key={step.key}
              onClick={() => !step.done && navigate(step.href)}
              className={`flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
                step.done
                  ? "opacity-60"
                  : "hover:bg-primary/10 cursor-pointer"
              }`}
              disabled={step.done}
            >
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {!step.done && <step.icon className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>
          ))}
        </div>

        {nextStep && (
          <Button size="sm" className="w-full" onClick={() => navigate(nextStep.href)}>
            <nextStep.icon className="h-4 w-4 mr-2" />
            {nextStep.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
