/**
 * OnboardingQuest — Cinematic RPG intro overlay.
 * 4 steps: Mission Intro → Choose Avatar → Set Username → Enter the Map.
 * Each step features a skill hero image backdrop for immersive atmosphere.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AVATAR_OPTIONS } from "@/lib/avatars";
import { Map, ChevronRight, Loader2, AtSign, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import xcrowLogo from "@/assets/xcrow-logo.webp";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/** One curated hero image per onboarding step for atmosphere */
const STEP_HERO_IMAGES: Record<string, string> = {
  intro: "complex-threat-modeling",
  avatar: "ethical-ai-leadership-governance",
  username: "prompt-engineering",
  launch: "strategic-problem-solving",
};

interface OnboardingQuestProps {
  open: boolean;
  userId: string;
  onComplete: () => void;
}

type Step = "intro" | "avatar" | "username" | "mode" | "launch";

function sanitizeUsername(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 24);
}

export default function OnboardingQuest({ open, userId, onComplete }: OnboardingQuestProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("intro");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("crow");
  const [saving, setSaving] = useState(false);
  const [playMode, setPlayMode] = useState<"explorer" | "fast_track">("explorer");

  // Username state
  const [usernameRaw, setUsernameRaw] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const username = sanitizeUsername(usernameRaw);

  // Check username availability with debounce
  useEffect(() => {
    if (username.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .neq("id", userId)
        .maybeSingle();
      setUsernameStatus(data ? "taken" : "available");
    }, 400);
    return () => clearTimeout(timer);
  }, [username, userId]);

  const handleComplete = useCallback(async () => {
    setSaving(true);
    const updates: any = {
      onboarding_completed: true,
      avatar_id: selectedAvatar,
      play_mode: playMode,
    };
    if (username.length >= 3 && usernameStatus === "available") {
      updates.username = username;
    }

    updates.id = userId;
    const { error } = await supabase
      .from("profiles")
      .upsert(updates, { onConflict: "id" });

    if (error) {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    }
    setSaving(false);
    onComplete();
  }, [userId, selectedAvatar, username, usernameStatus, onComplete, toast]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{
        background: "hsl(var(--background))",
      }}
    >
      {/* Skill hero backdrop — crossfades per step */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute inset-0 pointer-events-none"
        >
          <img
            src={`${SUPABASE_URL}/storage/v1/object/public/sim-images/skill-hero-${STEP_HERO_IMAGES[step]}.png`}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.15, filter: "saturate(0.8)" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse at center, hsl(var(--background) / 0.6) 0%, hsl(var(--background) / 0.92) 70%, hsl(var(--background)) 100%)",
          }} />
        </motion.div>
      </AnimatePresence>

      {/* Ambient glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[350px] rounded-full blur-[120px] pointer-events-none opacity-30"
        style={{ background: "radial-gradient(circle, hsl(var(--filigree-glow) / 0.15), transparent 70%)" }}
      />

      <AnimatePresence mode="wait">
        {/* ─── Step 1: Cinematic Intro ─── */}
        {step === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center max-w-md px-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative mx-auto w-24 h-24 mb-6"
            >
              <div
                className="absolute inset-0 rounded-full blur-2xl opacity-40"
                style={{ background: "hsl(var(--filigree-glow) / 0.3)" }}
              />
              <motion.img
                src={xcrowLogo}
                alt="Xcrow"
                className="relative h-24 w-24 mx-auto crow-glow"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-3xl md:text-4xl font-fantasy font-bold text-foreground mb-3"
            >
              A New Era Dawns
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-sm text-muted-foreground leading-relaxed mb-2 max-w-sm mx-auto"
            >
              The age of AI reshapes every kingdom. Old skills fade, new territories emerge.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-sm mx-auto"
            >
              You've been chosen to scout the frontier. Choose your companion and claim your place on the world map.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="flex items-center justify-center gap-3 mb-8"
            >
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-[hsl(var(--filigree)/0.3)]" />
              <span className="text-[hsl(var(--filigree-glow))] text-lg">⚔️</span>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-[hsl(var(--filigree)/0.3)]" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.4 }}
            >
              <Button
                size="lg"
                onClick={() => setStep("avatar")}
                className="px-8"
                style={{ boxShadow: "0 0 20px hsl(var(--filigree-glow) / 0.15)" }}
              >
                Begin Your Journey
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* ─── Step 2: Choose Avatar ─── */}
        {step === "avatar" && (
          <motion.div
            key="avatar"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="text-center max-w-md px-6"
          >
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-fantasy font-bold text-foreground mb-2"
            >
              Choose Your Companion
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-muted-foreground mb-6"
            >
              This creature will represent you across the realm
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-8 max-w-sm mx-auto"
            >
              {AVATAR_OPTIONS.map((av, i) => {
                const isSelected = selectedAvatar === av.id;
                return (
                  <motion.button
                    key={av.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.03 }}
                    onClick={() => setSelectedAvatar(av.id)}
                    className={`relative flex flex-col items-center gap-1 rounded-xl p-2 border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-transparent hover:border-border hover:bg-secondary/40"
                    }`}
                  >
                    <img
                      src={av.src}
                      alt={av.label}
                      className={`h-12 w-12 rounded-full object-cover transition-all ${
                        isSelected ? "drop-shadow-[0_0_8px_hsl(var(--filigree-glow)/0.4)]" : "opacity-70 hover:opacity-100"
                      }`}
                    />
                    <span className={`text-[9px] font-medium transition-colors ${
                      isSelected ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {av.label}
                    </span>
                    {isSelected && (
                      <motion.div
                        layoutId="avatar-ring"
                        className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center"
                      >
                        <span className="text-[7px] text-primary-foreground font-bold">✓</span>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                size="lg"
                onClick={() => setStep("username")}
                disabled={!selectedAvatar}
                className="px-8"
                style={{ boxShadow: "0 0 20px hsl(var(--filigree-glow) / 0.15)" }}
              >
                Summon {AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.label || "Companion"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* ─── Step 3: Choose Username ─── */}
        {step === "username" && (
          <motion.div
            key="username"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="text-center max-w-md px-6"
          >
            {/* Show selected avatar small */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="mx-auto w-16 h-16 mb-4"
            >
              <img
                src={AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.src}
                alt="Your companion"
                className="h-16 w-16 rounded-full object-cover border-2 border-primary/20 drop-shadow-[0_0_12px_hsl(var(--filigree-glow)/0.3)]"
              />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-2xl font-fantasy font-bold text-foreground mb-2"
            >
              Claim Your Name
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-sm text-muted-foreground mb-6"
            >
              Choose a unique name so allies can find and challenge you
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-xs mx-auto space-y-3"
            >
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. darkwolf, skyarcher"
                  value={usernameRaw}
                  onChange={(e) => setUsernameRaw(e.target.value)}
                  className="pl-10 pr-10 text-center"
                  autoFocus
                  maxLength={24}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && username.length >= 3 && usernameStatus === "available") {
                      setStep("launch");
                    }
                  }}
                />
                {/* Status indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === "checking" && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {usernameStatus === "available" && (
                    <Check className="h-4 w-4 text-success" />
                  )}
                  {usernameStatus === "taken" && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              </div>

              {/* Live URL preview */}
              {username.length >= 3 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-[11px] ${
                    usernameStatus === "taken" ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {usernameStatus === "taken"
                    ? "This name is already taken — try another"
                    : `xcrow.ai/u/${username}`}
                </motion.p>
              )}

              <Button
                size="lg"
                onClick={() => setStep("mode")}
                disabled={username.length < 3 || usernameStatus === "taken" || usernameStatus === "checking"}
                className="w-full"
                style={{ boxShadow: "0 0 20px hsl(var(--filigree-glow) / 0.15)" }}
              >
                Claim Name
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>

              <button
                onClick={() => setStep("mode")}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip — I'll set this later
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ─── Step 3.5: Choose Play Mode ─── */}
        {step === "mode" && (
          <motion.div
            key="mode"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="text-center max-w-lg px-6"
          >
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-fantasy font-bold text-foreground mb-2"
            >
              How Do You Want to Play?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-muted-foreground mb-6"
            >
              You can switch anytime in Settings
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto mb-8"
            >
              {/* Explorer Card */}
              <button
                onClick={() => setPlayMode("explorer")}
                className={`relative text-left rounded-xl border-2 p-5 transition-all ${
                  playMode === "explorer"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border/40 hover:border-border hover:bg-muted/20"
                }`}
              >
                <div className="text-2xl mb-2">🗺️</div>
                <h3 className="text-sm font-bold text-foreground mb-1">Explorer</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Full RPG experience — lore, guardians, deep sims. Best for 30+ min sessions.
                </p>
                {playMode === "explorer" && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>

              {/* Fast Track Card */}
              <button
                onClick={() => setPlayMode("fast_track")}
                className={`relative text-left rounded-xl border-2 p-5 transition-all ${
                  playMode === "fast_track"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border/40 hover:border-border hover:bg-muted/20"
                }`}
              >
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="text-sm font-bold text-foreground mb-1">Fast Track</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Career-focused sprints — targeted skills, compressed sims. Best for 10–20 min.
                </p>
                {playMode === "fast_track" && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                size="lg"
                onClick={() => setStep("launch")}
                className="px-8"
                style={{ boxShadow: "0 0 20px hsl(var(--filigree-glow) / 0.15)" }}
              >
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* ─── Step 4: Launch ─── */}
        {step === "launch" && (
          <motion.div
            key="launch"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md px-6"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", damping: 12 }}
              className="relative mx-auto w-28 h-28 mb-6"
            >
              <div
                className="absolute inset-0 rounded-full blur-2xl opacity-50"
                style={{ background: "hsl(var(--filigree-glow) / 0.25)" }}
              />
              <img
                src={AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.src}
                alt="Your companion"
                className="relative h-28 w-28 rounded-full object-cover border-2 border-primary/30 drop-shadow-[0_0_24px_hsl(var(--filigree-glow)/0.3)]"
              />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-fantasy font-bold text-foreground mb-1"
            >
              {username.length >= 3 && usernameStatus === "available"
                ? `${username}, The ${AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.label}`
                : `The ${AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.label} Stands Ready`}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-muted-foreground mb-8"
            >
              Your territory awaits. Scout kingdoms, conquer quests, and forge your skill arsenal.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                size="lg"
                onClick={handleComplete}
                disabled={saving}
                className="px-8"
                style={{ boxShadow: "0 0 24px hsl(var(--filigree-glow) / 0.2)" }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Map className="h-4 w-4 mr-2" />}
                Enter the World Map
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {(["intro", "avatar", "username", "mode", "launch"] as Step[]).map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              s === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
