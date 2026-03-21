/**
 * OnboardingQuest — Full-screen RPG onboarding flow.
 * 4 steps: Choose Class → Claim Kingdoms → First Quest → Map Reveal.
 */
import { useState, useEffect } from "react";
import {
  GraduationCap, Briefcase, Building2, Search, Loader2,
  ChevronRight, Swords, Shield, Map, Crown, Sparkles, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getCastleState } from "@/lib/castle-levels";

interface OnboardingQuestProps {
  open: boolean;
  userId: string;
  onComplete: () => void;
}

type QuestStep = "class" | "kingdoms" | "quest" | "reveal";

interface TargetRole {
  job_id: string;
  title: string;
  company: string | null;
  augmented: number;
}

const CLASSES = [
  {
    key: "student" as const,
    emoji: "🎓",
    title: "Student Explorer",
    desc: "Scouting future kingdoms to conquer after graduation",
    icon: GraduationCap,
  },
  {
    key: "professional" as const,
    emoji: "⚔️",
    title: "Career Warrior",
    desc: "Leveling up skills and defending your current territory",
    icon: Briefcase,
  },
  {
    key: "hr" as const,
    emoji: "👑",
    title: "Guild Leader",
    desc: "Building and training your team's skill territories",
    icon: Building2,
  },
];

const STEP_ORDER: QuestStep[] = ["class", "kingdoms", "quest", "reveal"];

export default function OnboardingQuest({ open, userId, onComplete }: OnboardingQuestProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<QuestStep>("class");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Kingdoms step
  const [targetRoles, setTargetRoles] = useState<TargetRole[]>([]);
  const [roleSearch, setRoleSearch] = useState("");
  const [roleResults, setRoleResults] = useState<TargetRole[]>([]);
  const [searchingRoles, setSearchingRoles] = useState(false);

  // School detection
  const [schoolSeat, setSchoolSeat] = useState<{ school_id: string; school_name: string } | null>(null);

  // Reveal animation
  const [revealPhase, setRevealPhase] = useState(0);

  const stepIndex = STEP_ORDER.indexOf(step);
  const progress = ((stepIndex + 1) / STEP_ORDER.length) * 100;

  // Check school seat on mount
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
        setSchoolSeat({ school_id: seat.school_id, school_name: seat.school_accounts?.name || "Your School" });
        setSelectedClass("student");
      }
    })();
  }, [open, userId]);

  // Search roles
  useEffect(() => {
    if (roleSearch.length < 2) { setRoleResults([]); return; }
    const timer = setTimeout(async () => {
      setSearchingRoles(true);
      const { data } = await supabase
        .from("jobs")
        .select("id, title, companies(name), augmented_percent")
        .ilike("title", `%${roleSearch}%`)
        .gt("augmented_percent", 0)
        .limit(8);

      if (data) {
        const seen = new Set<string>();
        const unique: TargetRole[] = [];
        for (const j of data as any[]) {
          const key = `${j.title}|${j.companies?.name || ""}`.toLowerCase();
          if (!seen.has(key) && !targetRoles.some(t => t.job_id === j.id)) {
            seen.add(key);
            unique.push({
              job_id: j.id,
              title: j.title,
              company: j.companies?.name || null,
              augmented: j.augmented_percent || 0,
            });
          }
        }
        setRoleResults(unique.slice(0, 5));
      }
      setSearchingRoles(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [roleSearch, targetRoles]);

  // Reveal animation phases
  useEffect(() => {
    if (step !== "reveal") return;
    const t1 = setTimeout(() => setRevealPhase(1), 400);
    const t2 = setTimeout(() => setRevealPhase(2), 1200);
    const t3 = setTimeout(() => setRevealPhase(3), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [step]);

  const nextStep = () => {
    const i = STEP_ORDER.indexOf(step);
    if (i < STEP_ORDER.length - 1) setStep(STEP_ORDER[i + 1]);
  };

  const handleClassSelect = (classKey: string) => {
    setSelectedClass(classKey);
  };

  const handleClassNext = () => {
    if (!selectedClass) return;
    nextStep();
  };

  const handleKingdomsNext = () => {
    nextStep();
  };

  const handleQuestNext = () => {
    nextStep();
  };

  const handleComplete = async () => {
    setSaving(true);
    const updateData: any = {
      onboarding_completed: true,
      career_stage: selectedClass || "professional",
      target_roles: targetRoles.map(r => ({ job_id: r.job_id, title: r.title, company: r.company })),
    };
    if (schoolSeat) {
      updateData.school_name = schoolSeat.school_name;
    }

    const { error } = await supabase.from("profiles").update(updateData).eq("id", userId);
    if (error) {
      toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" });
    }
    setSaving(false);
    onComplete();
  };

  const addTargetRole = (role: TargetRole) => {
    if (targetRoles.length >= 3) return;
    setTargetRoles(prev => [...prev, role]);
    setRoleSearch("");
    setRoleResults([]);
  };

  const removeTargetRole = (jobId: string) => {
    setTargetRoles(prev => prev.filter(r => r.job_id !== jobId));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      {/* Progress bar */}
      <div className="shrink-0 px-6 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Onboarding Quest — Step {stepIndex + 1}/{STEP_ORDER.length}
          </span>
          <span className="text-[10px] text-muted-foreground">⚔️ {Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5 bg-muted/30" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {/* ── Step 1: Choose Your Class ── */}
          {step === "class" && (
            <motion.div
              key="class"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg text-center"
            >
              <span className="text-4xl mb-4 block">🛡️</span>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
                Choose Your Class
              </h1>
              <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
                Your class shapes your starting quests and skill territory focus.
              </p>

              <div className="grid gap-3">
                {CLASSES.map((cls) => {
                  const isSelected = selectedClass === cls.key;
                  const isAutoSchool = schoolSeat && cls.key === "student";
                  return (
                    <motion.button
                      key={cls.key}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleClassSelect(cls.key)}
                      className={`relative flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/8 ring-1 ring-primary/30"
                          : "border-border/50 bg-card hover:border-border hover:bg-card/80"
                      }`}
                    >
                      <span className="text-2xl">{cls.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">{cls.title}</h3>
                          {isAutoSchool && (
                            <span className="text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-medium">
                              Auto-detected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{cls.desc}</p>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0"
                        >
                          <ChevronRight className="h-3 w-3 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {schoolSeat && (
                <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 flex items-center gap-2.5">
                  <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{schoolSeat.school_name}</span> — your quests will align with your curriculum
                  </p>
                </div>
              )}

              <Button
                className="w-full mt-6"
                size="lg"
                disabled={!selectedClass}
                onClick={handleClassNext}
              >
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </motion.div>
          )}

          {/* ── Step 2: Claim Your Kingdoms ── */}
          {step === "kingdoms" && (
            <motion.div
              key="kingdoms"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg text-center"
            >
              <span className="text-4xl mb-4 block">🏰</span>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
                Claim Your Kingdoms
              </h1>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Pick 1–3 roles you want to conquer. We'll build your skill territory around these targets.
              </p>

              {/* Selected kingdoms */}
              {targetRoles.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {targetRoles.map(role => (
                    <motion.div
                      key={role.job_id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/8 px-3 py-2"
                    >
                      <span className="text-sm">🏰</span>
                      <div className="text-left">
                        <span className="text-xs font-medium text-foreground block truncate max-w-[140px]">{role.title}</span>
                        {role.company && <span className="text-[10px] text-muted-foreground">{role.company}</span>}
                      </div>
                      <button onClick={() => removeTargetRole(role.job_id)} className="ml-1 hover:text-destructive transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Search */}
              {targetRoles.length < 3 && (
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search roles… e.g. Product Manager, Data Analyst"
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    autoFocus
                  />
                  {searchingRoles && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
              )}

              {/* Results */}
              {roleResults.length > 0 && (
                <div className="max-h-[200px] overflow-y-auto space-y-1.5 mb-4 text-left">
                  {roleResults.map(role => (
                    <button
                      key={role.job_id}
                      onClick={() => addTargetRole(role)}
                      className="w-full flex items-center gap-3 rounded-xl border border-border/40 bg-card hover:border-primary/30 px-3 py-2.5 transition-all"
                    >
                      <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{role.title}</p>
                        {role.company && <p className="text-[11px] text-muted-foreground">{role.company}</p>}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{role.augmented}% AI</span>
                    </button>
                  ))}
                </div>
              )}

              {roleSearch.length >= 2 && roleResults.length === 0 && !searchingRoles && (
                <p className="text-sm text-muted-foreground py-4">No kingdoms found — try different keywords</p>
              )}

              <div className="flex gap-3 mt-4">
                <Button variant="ghost" className="flex-1" onClick={handleKingdomsNext}>
                  {targetRoles.length === 0 ? "Skip for now" : ""}
                </Button>
                <Button className="flex-1" onClick={handleKingdomsNext}>
                  {targetRoles.length > 0
                    ? `Claim ${targetRoles.length} Kingdom${targetRoles.length > 1 ? "s" : ""}`
                    : "Continue"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: First Quest ── */}
          {step === "quest" && (
            <motion.div
              key="quest"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg text-center"
            >
              <span className="text-4xl mb-4 block">⚔️</span>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
                Your First Quest Awaits
              </h1>
              <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
                Every warrior starts somewhere. Your first quest will be assigned based on your chosen kingdoms.
              </p>

              {/* Quest preview cards */}
              <div className="space-y-3 mb-8">
                {targetRoles.length > 0 ? (
                  targetRoles.slice(0, 2).map((role, i) => (
                    <motion.div
                      key={role.job_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 text-left"
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Swords className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{role.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {role.company ? `${role.company} · ` : ""}Scout mission ready
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-primary">+125 XP</p>
                        <p className="text-[9px] text-muted-foreground">First quest bonus</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-xl border border-border/50 bg-card p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground">AI Career Scout</p>
                        <p className="text-[11px] text-muted-foreground">
                          Tell the AI what you're curious about — it'll find your first quest
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <Button className="w-full" size="lg" onClick={handleQuestNext}>
                Enter the Territory <Map className="h-4 w-4 ml-1" />
              </Button>
            </motion.div>
          )}

          {/* ── Step 4: Map Reveal ── */}
          {step === "reveal" && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-lg text-center"
            >
              {/* Animated reveal */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="mb-6"
              >
                <span className="text-6xl block mb-4">🗺️</span>
              </motion.div>

              <AnimatePresence>
                {revealPhase >= 1 && (
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3"
                  >
                    Your Territory Awaits
                  </motion.h1>
                )}

                {revealPhase >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2 mb-6"
                  >
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      {targetRoles.length > 0
                        ? `${targetRoles.length} kingdom${targetRoles.length > 1 ? "s" : ""} claimed. Your skill territory is charted.`
                        : "Your territory is uncharted — explore to reveal it."}
                    </p>

                    {/* Kingdom summary */}
                    {targetRoles.length > 0 && (
                      <div className="flex justify-center gap-3 mt-4">
                        {targetRoles.map((role, i) => (
                          <motion.div
                            key={role.job_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className="flex flex-col items-center gap-1"
                          >
                            <span className="text-2xl">🏚️</span>
                            <span className="text-[10px] text-muted-foreground font-medium max-w-[80px] truncate">
                              {role.title}
                            </span>
                            <span className="text-[9px] text-muted-foreground/60">Ruins</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {revealPhase >= 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Button
                      className="w-full max-w-xs mx-auto"
                      size="lg"
                      disabled={saving}
                      onClick={handleComplete}
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Crown className="h-4 w-4 mr-2" />}
                      Begin Your Journey
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
