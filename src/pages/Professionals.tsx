/**
 * /professionals — AI career readiness for working professionals.
 * RPG aesthetic matching the rest of the site.
 */
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Brain, Shield, Sword, Target, TrendingUp, Zap,
  Map, Crown, Sparkles, Compass, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

const BENEFITS = [
  { icon: Target, title: "Benchmark Your Role", desc: "See exactly how AI is reshaping your current role — which tasks are automated, augmented, or uniquely human.", color: "territory-analytical" },
  { icon: Brain, title: "Close Skill Gaps Fast", desc: "AI-powered simulations built from real job tasks. Practice the exact scenarios you'll face, not generic courses.", color: "territory-technical" },
  { icon: Map, title: "Track Your Growth", desc: "Every simulation claims a skill tile on your territory map. Watch your expertise evolve across 8 skill territories.", color: "territory-creative" },
  { icon: Shield, title: "Prove Your Edge", desc: "Earn verified skill scores that show employers you can work alongside AI — not be replaced by it.", color: "territory-ethics" },
  { icon: TrendingUp, title: "Stay Ahead of the Curve", desc: "Real-time threat intelligence shows which skills are rising, falling, or transforming in your industry.", color: "territory-strategic" },
  { icon: Sword, title: "Career-Proof Your Future", desc: "Build the adaptive skills that matter: tool mastery, human judgment, and strategic thinking that AI can't replicate.", color: "territory-leadership" },
];

const STEPS = [
  { step: "01", title: "Analyze Your Role", desc: "Enter your job title and company. Our AI breaks it into tasks and reveals your automation exposure score.", color: "var(--territory-analytical)" },
  { step: "02", title: "Battle Real Scenarios", desc: "Jump into simulations modeled on actual job tasks. Get scored on tool awareness, adaptive thinking, and domain judgment.", color: "var(--territory-technical)" },
  { step: "03", title: "Level Up & Prove It", desc: "Earn XP, build skill castles, and generate a shareable profile that proves your AI-readiness to employers.", color: "var(--territory-creative)" },
];

const STATS = [
  { value: "21,000+", label: "Roles Analyzed" },
  { value: "34,000+", label: "Task Simulations" },
  { value: "3,600+", label: "Companies" },
  { value: "183", label: "Skills Tracked" },
];

export default function Professionals() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();

  const handleCTA = () => {
    if (user) navigate("/map");
    else openAuthModal();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 py-24 sm:py-32">
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse at 50% 0%, hsl(var(--filigree-glow) / 0.3), transparent 70%)" }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div {...fade(0)}>
            <span
              className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.14em]"
              style={{
                background: "hsl(var(--filigree) / 0.12)",
                color: "hsl(var(--filigree-glow))",
                border: "1px solid hsl(var(--filigree) / 0.25)",
                fontFamily: "'Cinzel', serif",
              }}
            >
              For Professionals
            </span>
          </motion.div>
          <motion.h1
            {...fade(0.1)}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight"
            style={{ fontFamily: "'Cinzel', serif", letterSpacing: "-0.01em" }}
          >
            Don't Get{" "}
            <span style={{ color: "hsl(var(--filigree-glow))", textShadow: "0 0 20px hsl(var(--filigree-glow) / 0.4)" }}>
              Replaced
            </span>
            .<br />
            Get Elevated.
          </motion.h1>
          <motion.p {...fade(0.2)} className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            AI is reshaping every role. Xcrow shows you exactly how — then gives you the simulations, skills, and proof to stay ahead.
          </motion.p>
          <motion.div {...fade(0.3)} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={handleCTA} className="gap-2 text-base font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
              <Sword className="h-5 w-5" />
              Analyze Your Role
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/how-it-works")} className="gap-2 text-base" style={{ fontFamily: "'Cinzel', serif" }}>
              <BookOpen className="h-5 w-5" />
              How It Works
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="px-4 py-12" style={{ background: "hsl(var(--surface-stone) / 0.5)" }}>
        <div className="mx-auto max-w-5xl grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map((s, i) => (
            <motion.div key={s.label} {...fade(i * 0.08)}>
              <p className="text-3xl sm:text-4xl font-extrabold" style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--filigree-glow))" }}>
                {s.value}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.h2 {...fade()} className="text-3xl sm:text-4xl font-extrabold text-center mb-4" style={{ fontFamily: "'Cinzel', serif" }}>
            Your Career Arsenal
          </motion.h2>
          <motion.p {...fade(0.1)} className="text-center text-muted-foreground mb-14 max-w-2xl mx-auto">
            Everything you need to understand, adapt to, and thrive in the AI-transformed workplace.
          </motion.p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={b.title}
                  {...fade(i * 0.06)}
                  className="rounded-xl p-6 transition-all hover:scale-[1.02]"
                  style={{
                    background: "hsl(var(--surface-stone) / 0.6)",
                    border: "1px solid hsl(var(--filigree) / 0.15)",
                  }}
                >
                  <div
                    className="inline-flex items-center justify-center h-11 w-11 rounded-lg mb-4"
                    style={{ background: `hsl(var(--${b.color}) / 0.15)` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: `hsl(var(--${b.color}))` }} />
                  </div>
                  <h3 className="text-base font-bold mb-2" style={{ fontFamily: "'Cinzel', serif" }}>{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-4 py-20" style={{ background: "hsl(var(--surface-stone) / 0.3)" }}>
        <div className="mx-auto max-w-4xl">
          <motion.h2 {...fade()} className="text-3xl sm:text-4xl font-extrabold text-center mb-14" style={{ fontFamily: "'Cinzel', serif" }}>
            Three Steps to Stay Ahead
          </motion.h2>
          <div className="space-y-10">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                {...fade(i * 0.1)}
                className="flex gap-6 items-start"
              >
                <div
                  className="shrink-0 flex items-center justify-center h-12 w-12 rounded-xl text-lg font-extrabold"
                  style={{
                    background: `color-mix(in srgb, ${s.color} 15%, transparent)`,
                    color: s.color,
                    fontFamily: "'Cinzel', serif",
                    border: `1px solid color-mix(in srgb, ${s.color} 25%, transparent)`,
                  }}
                >
                  {s.step}
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "'Cinzel', serif" }}>{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 py-20 sm:py-28 text-center">
        <motion.div {...fade()} className="mx-auto max-w-2xl">
          <Crown className="h-10 w-10 mx-auto mb-4" style={{ color: "hsl(var(--filigree-glow))" }} />
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ fontFamily: "'Cinzel', serif" }}>
            Ready to Future-Proof Your Career?
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Join thousands of professionals who are already using Xcrow to understand AI's impact on their role and build the skills that matter.
          </p>
          <Button size="lg" onClick={handleCTA} className="gap-2 text-base font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
            <Sparkles className="h-5 w-5" />
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
