import { useState, useEffect } from "react";
import { Briefcase, Building2, Loader2, GraduationCap, BookOpen, ChevronRight } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingModalProps {
  open: boolean;
  onComplete: (jobTitle: string, company: string) => void;
  userId: string;
}

interface SchoolProgram {
  program_name: string;
  department: string | null;
  degree_type: string | null;
}

type Step = "role" | "program";

export default function OnboardingModal({ open, onComplete, userId }: OnboardingModalProps) {
  const [step, setStep] = useState<Step>("role");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // School-specific state
  const [schoolSeat, setSchoolSeat] = useState<{ school_id: string; school_name: string } | null>(null);
  const [programs, setPrograms] = useState<SchoolProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [programFilter, setProgramFilter] = useState("");
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  // Check if user has a school seat on mount
  useEffect(() => {
    if (!open || !userId) return;
    (async () => {
      const { data: seatData } = await supabase
        .from("school_seats")
        .select("school_id, school_accounts(name)")
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (seatData) {
        const seat = seatData as any;
        setSchoolSeat({
          school_id: seat.school_id,
          school_name: seat.school_accounts?.name || "Your School",
        });
      }
    })();
  }, [open, userId]);

  // Fetch programs when moving to program step
  useEffect(() => {
    if (step !== "program" || !schoolSeat) return;
    setLoadingPrograms(true);
    (async () => {
      const { data } = await supabase
        .from("school_courses")
        .select("program_name, department, degree_type")
        .eq("school_id", schoolSeat.school_id)
        .order("program_name");

      // Deduplicate by program_name + degree_type
      const seen = new Set<string>();
      const unique: SchoolProgram[] = [];
      for (const p of (data || []) as SchoolProgram[]) {
        const key = `${p.program_name}|${p.degree_type}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(p);
        }
      }
      setPrograms(unique);
      setLoadingPrograms(false);
    })();
  }, [step, schoolSeat]);

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) return;

    // If student has school seat, go to program picker
    if (schoolSeat && programs.length === 0) {
      // Pre-fetch programs
      setStep("program");
      return;
    }
    if (schoolSeat) {
      setStep("program");
      return;
    }

    // Non-school user: save directly
    await saveProfile();
  };

  const saveProfile = async (programName?: string) => {
    setSaving(true);
    const normalizedCompany = company.trim() && !company.trim().startsWith("http") ? `https://${company.trim()}` : company.trim();

    const updateData: any = {
      job_title: jobTitle.trim(),
      company: normalizedCompany || null,
      onboarding_completed: true,
    };

    if (programName) {
      updateData.program_name = programName;
    }

    if (schoolSeat) {
      updateData.school_name = schoolSeat.school_name;
      updateData.career_stage = "student";
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" });
    } else {
      onComplete(jobTitle.trim(), normalizedCompany);
    }
    setSaving(false);
  };

  const handleProgramSelect = async () => {
    await saveProfile(selectedProgram || undefined);
  };

  const handleSkip = async () => {
    if (step === "program") {
      // Skip program selection but still save role
      await saveProfile();
      return;
    }
    await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        ...(schoolSeat ? { school_name: schoolSeat.school_name, career_stage: "student" } : {}),
      } as any)
      .eq("id", userId);
    onComplete("", "");
  };

  const filteredPrograms = programs.filter(
    (p) =>
      p.program_name.toLowerCase().includes(programFilter.toLowerCase()) ||
      (p.department || "").toLowerCase().includes(programFilter.toLowerCase())
  );

  const degreeBadgeColor: Record<string, string> = {
    BS: "bg-[hsl(var(--neon-blue))]/15 text-[hsl(var(--neon-blue))]",
    BA: "bg-[hsl(var(--neon-cyan))]/15 text-[hsl(var(--neon-cyan))]",
    MS: "bg-[hsl(var(--neon-purple))]/15 text-[hsl(var(--neon-purple))]",
    MA: "bg-[hsl(var(--neon-purple))]/15 text-[hsl(var(--neon-purple))]",
    PhD: "bg-[hsl(var(--neon-pink))]/15 text-[hsl(var(--neon-pink))]",
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md p-6" onPointerDownOutside={(e) => e.preventDefault()}>
        <AnimatePresence mode="wait">
          {step === "role" && (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle className="text-xl font-sans font-bold">
                  {schoolSeat ? `Welcome, ${schoolSeat.school_name} student!` : "Tell us about your role"}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {schoolSeat
                    ? "We'll personalize your learning path based on your interests and program."
                    : "We'll personalize your experience — auto-analyze your role, tailor recommendations, and track what matters to you."}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleRoleSubmit} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {schoolSeat ? "What career are you exploring?" : "What's your current job title?"} *
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={schoolSeat ? "e.g. Software Engineer, Product Manager" : "e.g. Product Manager, Software Engineer"}
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      required
                      className="w-full rounded-xl border border-input bg-background pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      autoFocus
                    />
                  </div>
                </div>

                {!schoolSeat && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">University / School <span className="text-muted-foreground font-normal">(optional)</span></label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="e.g. MIT, Stanford, University of Lagos"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full rounded-xl border border-input bg-background pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">We'll tailor recommendations to your academic context</p>
                  </div>
                )}

                {schoolSeat && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 flex items-center gap-2.5">
                    <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-foreground">{schoolSeat.school_name}</p>
                      <p className="text-[10px] text-muted-foreground">Your learning path will be tailored to your school's curriculum</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" className="flex-1" onClick={handleSkip}>
                    Skip for now
                  </Button>
                  <Button type="submit" className="flex-1" disabled={saving || !jobTitle.trim()}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {schoolSeat ? "Next" : "Get started"}
                    {schoolSeat && <ChevronRight className="h-3.5 w-3.5 ml-1" />}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {step === "program" && (
            <motion.div
              key="program"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle className="text-xl font-sans font-bold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Select your program
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Choose your program at {schoolSeat?.school_name} to get curriculum-specific skill recommendations.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-3 space-y-3">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search programs…"
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  autoFocus
                />

                {/* Program list */}
                <div className="max-h-[280px] overflow-y-auto space-y-1.5 pr-1">
                  {loadingPrograms ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredPrograms.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No programs found</p>
                  ) : (
                    filteredPrograms.map((prog) => {
                      const key = `${prog.program_name}|${prog.degree_type}`;
                      const isSelected = selectedProgram === prog.program_name;
                      const badgeClass = degreeBadgeColor[prog.degree_type || ""] || "bg-muted text-muted-foreground";

                      return (
                        <motion.button
                          key={key}
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedProgram(prog.program_name)}
                          className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all ${
                            isSelected
                              ? "border-primary bg-primary/8 ring-1 ring-primary/30"
                              : "border-border/40 bg-card hover:border-border hover:bg-card/80"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">{prog.program_name}</span>
                            {prog.degree_type && (
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badgeClass}`}>
                                {prog.degree_type}
                              </span>
                            )}
                          </div>
                          {prog.department && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">{prog.department}</p>
                          )}
                        </motion.button>
                      );
                    })
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="ghost" className="flex-1" onClick={handleSkip}>
                    Skip
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    disabled={saving}
                    onClick={handleProgramSelect}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {selectedProgram ? "Start Learning" : "Continue without program"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
