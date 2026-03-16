import { useState } from "react";
import { Briefcase, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingModalProps {
  open: boolean;
  onComplete: (jobTitle: string, company: string) => void;
  userId: string;
}

export default function OnboardingModal({ open, onComplete, userId }: OnboardingModalProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) return;
    const normalizedCompany = company.trim() && !company.trim().startsWith("http") ? `https://${company.trim()}` : company.trim();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        job_title: jobTitle.trim(),
        company: normalizedCompany || null,
        onboarding_completed: true,
      } as any)
      .eq("id", userId);

    if (error) {
      toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" });
    } else {
      onComplete(jobTitle.trim(), company.trim());
    }
    setSaving(false);
  };

  const handleSkip = async () => {
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true } as any)
      .eq("id", userId);
    onComplete("", "");
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md p-6" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-sans font-bold">
            Tell us about your role
          </DialogTitle>
          <DialogDescription className="text-sm">
            We'll personalize your experience — auto-analyze your role, tailor recommendations, and track what matters to you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">What's your current job title? *</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="e.g. Product Manager, Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
                className="w-full rounded-xl border border-input bg-background pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Company website <span className="text-muted-foreground font-normal">(optional)</span></label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="e.g. acme.com"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-xl border border-input bg-background pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">We'll use this to contextualize your analysis</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={handleSkip}>
              Skip for now
            </Button>
            <Button type="submit" className="flex-1" disabled={saving || !jobTitle.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Get started
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
