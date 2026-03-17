import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Globe, Loader2, CheckCircle2, ArrowRight, Users, Rocket,
  Copy, Check, ChevronRight, GraduationCap, UserCheck, BarChart3, FolderKanban, Briefcase,
} from "lucide-react";
import Navbar from "@/components/Navbar";

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

interface StepProps {
  onNext: () => void;
}

/* ─── Step 1: Create Workspace ─── */
function StepCreateWorkspace({ onNext }: StepProps) {
  const { user } = useAuth();
  const { refresh } = useWorkspace();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
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
      setCreating(false);
      return;
    }

    if (data) {
      await supabase.from("workspace_members").insert({
        workspace_id: data.id,
        user_id: user.id,
        role: "admin",
      });
      await refresh();
      toast({ title: "Workspace created!" });
      onNext();
    }
    setCreating(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground">Name your workspace</h2>
        <p className="text-sm text-muted-foreground mt-1">
          This is your team's home. Use your company or department name.
        </p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="e.g. Acme Corp, Engineering Team"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>
        <Button onClick={handleCreate} disabled={creating || !name.trim()} className="w-full">
          {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Create Workspace
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Step 2: Import Company ─── */
function StepImportCompany({ onNext }: StepProps) {
  const { toast } = useToast();
  const { workspaceId } = useWorkspace();
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importedName, setImportedName] = useState<string | null>(null);

  const handleImport = async () => {
    if (!url.trim() || !workspaceId) return;
    setImporting(true);

    try {
      // Scrape company info
      const { data: scrapeResult, error: scrapeError } = await supabase.functions.invoke("scrape-company", {
        body: { url: url.trim() },
      });

      if (scrapeError) throw scrapeError;

      const companyName = scrapeResult?.company_name || new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "").split(".")[0];

      // Insert company
      const { data: company, error: insertError } = await supabase
        .from("companies")
        .insert({
          name: companyName,
          website: url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`,
          workspace_id: workspaceId,
          industry: scrapeResult?.industry || null,
          description: scrapeResult?.tagline || null,
          logo_url: scrapeResult?.logo || null,
        })
        .select("id, name")
        .single();

      if (insertError) throw insertError;

      // Sync jobs
      await supabase.functions.invoke("sync-company-jobs", {
        body: { step: "jobs", companyName: company.name, workspaceId },
      });

      setImportedName(company.name);
      toast({ title: `${company.name} imported!`, description: "Roles are being synced." });

      // Brief delay to show success state
      setTimeout(onNext, 1500);
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message || "Try again", variant: "destructive" });
    }
    setImporting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground">Import your company</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your company website. We'll automatically find open roles and import them.
        </p>
      </div>

      {importedName ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">{importedName} imported successfully</p>
            <p className="text-xs text-muted-foreground">Syncing roles...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="e.g. acme.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-10"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
            />
          </div>
          <Button onClick={handleImport} disabled={importing || !url.trim()} className="w-full">
            {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Import & Sync Roles
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <button onClick={onNext} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2">
            Skip — I'll add roles later
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Step 3: Invite Team ─── */
function StepInviteTeam({ onNext }: StepProps) {
  const { workspace } = useWorkspace();
  const [copied, setCopied] = useState(false);

  const joinUrl = workspace ? `${window.location.origin}/join?code=${workspace.join_code}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground">Invite your team</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Share this link with your team members so they can join your workspace.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border">
          <code className="text-sm text-foreground flex-1 truncate">{joinUrl}</code>
          <Button size="sm" variant="outline" onClick={copyLink} className="shrink-0">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {workspace && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Join code:</span>
            <code className="font-mono font-bold text-foreground bg-secondary px-2 py-0.5 rounded">{workspace.join_code}</code>
          </div>
        )}

        <Button onClick={onNext} className="w-full">
          Continue to Dashboard
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <button onClick={onNext} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2">
          Skip — I'll invite later
        </button>
      </div>
    </div>
  );
}

/* ─── Steps config ─── */
const STEPS = [
  { key: "workspace", label: "Create Workspace", icon: Building2 },
  { key: "import", label: "Import Company", icon: Globe },
  { key: "invite", label: "Invite Team", icon: Users },
] as const;

/* ─── Main Onboarding Page ─── */
export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workspaceId, loading: wsLoading } = useWorkspace();
  const [step, setStep] = useState(0);

  // If user already has a workspace, skip step 1
  useEffect(() => {
    if (!wsLoading && workspaceId && step === 0) {
      setStep(1);
    }
  }, [wsLoading, workspaceId, step]);

  const handleComplete = () => {
    navigate("/hr/team-progress");
  };

  const progressPercent = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const isActive = i === step;
                const isDone = i < step;
                return (
                  <div key={s.key} className="flex items-center gap-2 flex-1">
                    <div className={`flex items-center gap-1.5 ${
                      isDone ? "text-success" : isActive ? "text-foreground" : "text-muted-foreground/40"
                    }`}>
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                          isActive ? "border-foreground text-foreground" : "border-muted-foreground/30 text-muted-foreground/40"
                        }`}>
                          {i + 1}
                        </div>
                      )}
                      <span className={`text-xs font-medium hidden sm:inline ${
                        isDone ? "text-success" : isActive ? "text-foreground" : "text-muted-foreground/40"
                      }`}>
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-px mx-2 ${isDone ? "bg-success" : "bg-border"}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <Progress value={progressPercent} className="h-1" />
          </div>

          {/* Step content */}
          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  {step === 0 && <StepCreateWorkspace onNext={() => setStep(1)} />}
                  {step === 1 && <StepImportCompany onNext={() => setStep(2)} />}
                  {step === 2 && <StepInviteTeam onNext={handleComplete} />}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Subtle help text */}
          <p className="text-center text-[11px] text-muted-foreground mt-4">
            You can always change these settings later in your workspace.
          </p>
        </div>
      </div>
    </div>
  );
}
