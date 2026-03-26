import { useState, useEffect } from "react";
import { Loader2, GraduationCap, Briefcase, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { AVATAR_OPTIONS, type AvatarOption } from "@/lib/avatars";

interface OnboardingModalProps {
  open: boolean;
  onComplete: (jobTitle: string, company: string) => void;
  userId: string;
}

type PlayerPath = "student" | "professional" | "explorer";
type Step = "path" | "interests" | "avatar";

const TERRITORY_OPTIONS = [
  { id: "Technical", emoji: "⚙️", label: "Technical" },
  { id: "Creative", emoji: "🎨", label: "Creative" },
  { id: "Analytical", emoji: "📊", label: "Analytical" },
  { id: "Strategic", emoji: "♟️", label: "Strategic" },
  { id: "Communication", emoji: "🗣️", label: "Communication" },
  { id: "Leadership", emoji: "👑", label: "Leadership" },
];

export default function OnboardingModal({ open, onComplete, userId }: OnboardingModalProps) {
  const [step, setStep] = useState<Step>("path");
  const [selectedPath, setSelectedPath] = useState<PlayerPath | null>(null);
  const [interests, setInterests] = useState<Set<string>>(new Set());
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const toggleInterest = (id: string) => {
    setInterests(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  };

  const handlePathSelect = (path: PlayerPath) => {
    setSelectedPath(path);
    if (path === "explorer") {
      // Skip interests, go to avatar
      setStep("avatar");
    } else {
      setStep("interests");
    }
  };

  const handleInterestsNext = () => {
    setStep("avatar");
  };

  const handleFinish = async () => {
    setSaving(true);

    const careerStage = selectedPath === "student" ? "student" : selectedPath === "professional" ? "professional" : null;

    const updateData: Record<string, unknown> = {
      onboarding_completed: true,
      avatar_id: selectedAvatar || "wolf",
    };

    if (careerStage) updateData.career_stage = careerStage;

    // Store interests as target_roles metadata
    if (interests.size > 0) {
      updateData.target_roles = Array.from(interests).map(cat => ({ category: cat }));
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" });
    } else {
      onComplete("", "");
    }
    setSaving(false);
  };

  const handleSkip = async () => {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true, avatar_id: selectedAvatar || "wolf" })
      .eq("id", userId);
    onComplete("", "");
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/50" onPointerDownOutside={(e) => e.preventDefault()}>
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-5 pb-1">
          {(["path", "interests", "avatar"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? "w-6 bg-primary" : i < ["path", "interests", "avatar"].indexOf(step) ? "w-1.5 bg-primary/50" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Pick Your Path */}
            {step === "path" && (
              <motion.div
                key="path"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1.5">
                  <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
                    Who are you?
                  </h2>
                  <p className="text-sm text-muted-foreground">Pick your path to personalize your journey</p>
                </div>

                <div className="grid gap-2.5">
                  {([
                    {
                      path: "student" as PlayerPath,
                      icon: GraduationCap,
                      label: "Student",
                      desc: "High school or university — exploring future careers",
                      color: "from-[hsl(var(--neon-blue))] to-[hsl(var(--neon-cyan))]",
                    },
                    {
                      path: "professional" as PlayerPath,
                      icon: Briefcase,
                      label: "Professional",
                      desc: "Working and upskilling — staying ahead of AI",
                      color: "from-[hsl(var(--neon-purple))] to-[hsl(var(--neon-pink))]",
                    },
                    {
                      path: "explorer" as PlayerPath,
                      icon: Compass,
                      label: "Just Exploring",
                      desc: "Curious about the AI skills landscape",
                      color: "from-[hsl(var(--neon-green))] to-[hsl(var(--neon-orange))]",
                    },
                  ]).map(({ path, icon: Icon, label, desc, color }) => (
                    <motion.button
                      key={path}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handlePathSelect(path)}
                      className="flex items-center gap-3.5 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:bg-card/80 px-4 py-3.5 text-left transition-all group"
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shrink-0 opacity-80 group-hover:opacity-100 transition-opacity`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{label}</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">{desc}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Pick Interests */}
            {step === "interests" && (
              <motion.div
                key="interests"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1.5">
                  <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
                    What interests you?
                  </h2>
                  <p className="text-sm text-muted-foreground">Pick 2–3 areas to explore first</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {TERRITORY_OPTIONS.map(({ id, emoji, label }) => {
                    const active = interests.has(id);
                    return (
                      <motion.button
                        key={id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleInterest(id)}
                        className={`rounded-xl border px-3 py-3 text-center transition-all ${
                          active
                            ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                            : "border-border/50 bg-card hover:border-border hover:bg-card/80"
                        }`}
                      >
                        <span className="text-lg">{emoji}</span>
                        <p className={`text-xs font-medium mt-0.5 ${active ? "text-primary" : "text-muted-foreground"}`}>
                          {label}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="ghost" size="sm" className="flex-1" onClick={() => setStep("avatar")}>
                    Skip
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1"
                    onClick={handleInterestsNext}
                    disabled={interests.size < 1}
                  >
                    Next ({interests.size}/3)
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Choose Avatar */}
            {step === "avatar" && (
              <motion.div
                key="avatar"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1.5">
                  <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
                    Choose your avatar
                  </h2>
                  <p className="text-sm text-muted-foreground">Your identity on the battlefield</p>
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                  {AVATAR_OPTIONS.map((avatar) => {
                    const active = selectedAvatar === avatar.id;
                    return (
                      <motion.button
                        key={avatar.id}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedAvatar(avatar.id)}
                        className={`rounded-xl border p-1.5 transition-all ${
                          active
                            ? "border-primary ring-2 ring-primary/40 bg-primary/5"
                            : "border-border/30 bg-card/50 hover:border-border"
                        }`}
                      >
                        <img
                          src={avatar.src}
                          alt={avatar.label}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <p className={`text-[9px] font-medium mt-1 truncate ${active ? "text-primary" : "text-muted-foreground"}`}>
                          {avatar.label}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="ghost" size="sm" className="flex-1" onClick={handleSkip} disabled={saving}>
                    Skip
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1"
                    onClick={handleFinish}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                    Enter the Map
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
