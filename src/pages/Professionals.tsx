/**
 * /professionals — Practice simulations for live jobs at leading companies.
 * AI is collapsing the job market. This is the tool to stay ahead.
 */
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Brain, Briefcase, Building2, Flame, Globe,
  Crosshair, Crown, Shield, Sparkles, Sword, Swords,
  Target, TrendingDown, TrendingUp, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CompanyMarquee from "@/components/CompanyMarquee";
import { brandfetchFromName } from "@/lib/logo";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

/* ── Company marquee rows ── */
const MARQUEE_ROWS = [
  ["Google", "Microsoft", "Apple", "Meta", "Amazon", "Nvidia", "OpenAI", "Stripe"],
  ["Deloitte", "McKinsey", "Boeing", "FedEx", "Databricks", "Deel", "Gong", "CoreWeave"],
];

/* ── Emerging trends from top companies ── */
const EMERGING_TRENDS = [
  {
    trend: "AI-Augmented Decision Making",
    companies: ["Google", "Microsoft", "Meta"],
    growth: "+340%",
    desc: "Roles now require evaluating AI recommendations and making judgment calls on AI-generated outputs.",
    color: "territory-technical",
    direction: "up" as const,
  },
  {
    trend: "Prompt Engineering & AI Orchestration",
    companies: ["OpenAI", "Databricks", "Nvidia"],
    growth: "+580%",
    desc: "New roles demand crafting complex AI workflows, not just writing prompts — orchestrating multi-model pipelines.",
    color: "territory-analytical",
    direction: "up" as const,
  },
  {
    trend: "Human-AI Collaboration Design",
    companies: ["Apple", "Stripe", "Deloitte"],
    growth: "+210%",
    desc: "Companies hiring for roles that design how humans and AI systems work together effectively.",
    color: "territory-creative",
    direction: "up" as const,
  },
  {
    trend: "Traditional Data Entry & Processing",
    companies: ["Fortune 500 avg."],
    growth: "-67%",
    desc: "Routine cognitive tasks are being automated at unprecedented speed. Pure execution roles are vanishing.",
    color: "destructive",
    direction: "down" as const,
  },
];

/* ── Why simulations beat courses ── */
const SIM_ADVANTAGES = [
  { icon: Crosshair, title: "Real Job Tasks", desc: "Every simulation is built from actual job postings at companies like Google, Deloitte, and Stripe — not textbook scenarios.", color: "territory-analytical" },
  { icon: Swords, title: "Boss-Level Challenges", desc: "Progressive difficulty from foundation to boss battles. AI-scored on tool mastery, strategic thinking, and human judgment.", color: "territory-strategic" },
  { icon: Brain, title: "AI Fluency Training", desc: "Practice prompting, evaluating AI output, and human-AI collaboration on the exact workflows employers test for.", color: "territory-technical" },
  { icon: Shield, title: "Verified Skill Proof", desc: "Build a verified skill portfolio mapped to real employer requirements. Not certificates — demonstrable capability.", color: "territory-leadership" },
  { icon: TrendingUp, title: "Live Market Intelligence", desc: "Our skill map updates from 3,600+ company job feeds. When demand shifts, new simulations appear automatically.", color: "territory-creative" },
  { icon: Flame, title: "3× Assessment Pass Rate", desc: "Professionals who practice simulations are 3× more likely to pass technical interviews and AI-readiness assessments.", color: "territory-communication" },
];

/* ── How it works ── */
const STEPS = [
  { step: "01", title: "Scout the Battlefield", desc: "Enter your target role and company. We break it into tasks and show you exactly which skills are under threat from AI — and which are rising.", color: "var(--territory-analytical)" },
  { step: "02", title: "Battle Real Scenarios", desc: "Jump into simulations built from live job postings at companies like Microsoft, McKinsey, and Apple. Get scored on AI fluency, strategic thinking, and domain expertise.", color: "var(--territory-technical)" },
  { step: "03", title: "Conquer & Prove", desc: "Earn XP, build skill castles across 8 territories, and generate a verified skill profile that proves to employers you can thrive in an AI-augmented workplace.", color: "var(--territory-creative)" },
];

const STATS = [
  { value: "21,000+", label: "Live Roles Analyzed" },
  { value: "10,000+", label: "Job Simulations" },
  { value: "3,600+", label: "Companies Mapped" },
  { value: "183", label: "Skills Tracked" },
];

/* ── Small company logo helper ── */
function CompanyLogoPill({ name }: { name: string }) {
  const logoUrl = brandfetchFromName(name);
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ background: "hsl(var(--muted) / 0.6)", border: "1px solid hsl(var(--border))" }}>
      {logoUrl && (
        <img src={logoUrl} alt={name} className="h-3.5 w-3.5 rounded-full object-contain grayscale opacity-70" />
      )}
      {name}
    </span>
  );
}

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

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden px-4 py-24 sm:py-32">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full blur-[200px] opacity-[0.08]"
            style={{ background: "hsl(var(--primary))" }} />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full blur-[160px] opacity-[0.06]"
            style={{ background: "hsl(var(--territory-strategic))" }} />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div {...fade(0)}>
            <span className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-[0.2em]"
              style={{
                background: "hsl(var(--primary) / 0.08)",
                border: "1px solid hsl(var(--primary) / 0.2)",
                color: "hsl(var(--primary))",
              }}>
              <Sword className="h-3.5 w-3.5" />
              For Professionals
            </span>
          </motion.div>

          <motion.h1 {...fade(0.1)}
            className="font-fantasy text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] mb-6">
            AI is collapsing the job market.
            <br />
            <span style={{ color: "hsl(var(--primary))", textShadow: "0 0 30px hsl(var(--primary) / 0.3)" }}>
              Practice or perish.
            </span>
          </motion.h1>

          <motion.p {...fade(0.2)} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4">
            Every week, top companies rewrite job requirements. New skills emerge. Old ones vanish.
            Xcrow gives you <strong className="text-foreground">10,000+ simulations built from live job postings</strong> at
            companies like Google, Microsoft, and Deloitte — so you practice the exact tasks employers are hiring for <em>right now</em>.
          </motion.p>

          <motion.p {...fade(0.25)} className="text-sm font-medium mb-8" style={{ color: "hsl(var(--territory-strategic))" }}>
            <Flame className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
            Professionals who practice are 3× more likely to pass AI-readiness assessments
          </motion.p>

          <motion.div {...fade(0.3)} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={handleCTA} className="gap-2 text-base font-fantasy"
              style={{ boxShadow: "0 0 24px hsl(var(--primary) / 0.3)" }}>
              <Sword className="h-4 w-4" /> Start Practicing <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/how-it-works")}
              className="gap-2 text-base font-fantasy"
              style={{ borderColor: "hsl(var(--filigree) / 0.25)" }}>
              <Target className="h-4 w-4" /> See How It Works
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══ COMPANY SOCIAL PROOF MARQUEE ═══ */}
      <section className="py-10 px-4" style={{ background: "hsl(var(--surface-stone) / 0.4)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.p {...fade()} className="text-center text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">
            <Building2 className="inline h-3 w-3 mr-1.5" style={{ color: "hsl(var(--primary))" }} />
            Practice simulations built from live jobs at
          </motion.p>
          <CompanyMarquee rows={MARQUEE_ROWS} />
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="px-4 py-14" style={{ background: "hsl(var(--surface-stone) / 0.5)" }}>
        <div className="mx-auto max-w-5xl grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map((s, i) => (
            <motion.div key={s.label} {...fade(i * 0.08)}
              className="rounded-xl border border-border/50 p-4"
              style={{ background: "hsl(var(--card))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
              <p className="text-2xl sm:text-3xl font-bold font-fantasy" style={{ color: "hsl(var(--primary))" }}>
                {s.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ EMERGING JOB TRENDS ═══ */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fade()} className="text-center mb-14">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
              <Globe className="inline h-3 w-3 mr-1" style={{ color: "hsl(var(--territory-analytical))" }} />
              Live Market Intelligence
            </p>
            <h2 className="font-fantasy text-3xl md:text-4xl font-bold mb-4">
              The job market is shifting under your feet.
              <br />
              <span style={{ color: "hsl(var(--primary))" }}>Here's where it's going.</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              These are the fastest-moving skill trends across top companies right now.
              Our simulations update automatically to match.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-5">
            {EMERGING_TRENDS.map((t, i) => (
              <motion.div key={t.trend} {...fade(i * 0.08)}
                className="rounded-2xl border border-border/50 p-6 relative overflow-hidden"
                style={{
                  background: "hsl(var(--card))",
                  boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))",
                }}>
                <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `hsl(var(--${t.color}))` }} />

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {t.direction === "up" ? (
                      <TrendingUp className="h-4 w-4" style={{ color: `hsl(var(--${t.color}))` }} />
                    ) : (
                      <TrendingDown className="h-4 w-4" style={{ color: `hsl(var(--${t.color}))` }} />
                    )}
                    <span className="font-fantasy text-sm font-bold">{t.trend}</span>
                  </div>
                  <span className="text-sm font-bold font-mono" style={{ color: `hsl(var(--${t.color}))` }}>
                    {t.growth}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{t.desc}</p>

                <div className="flex flex-wrap gap-1.5">
                  {t.companies.map((c) => (
                    <CompanyLogoPill key={c} name={c} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY SIMULATIONS ═══ */}
      <section className="px-4 py-20" style={{ background: "hsl(var(--surface-stone) / 0.5)" }}>
        <div className="mx-auto max-w-5xl">
          <motion.div {...fade()} className="text-center mb-14">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
              <Swords className="inline h-3 w-3 mr-1" style={{ color: "hsl(var(--territory-strategic))" }} />
              Your Battle Arsenal
            </p>
            <h2 className="font-fantasy text-3xl md:text-4xl font-bold mb-4">
              Courses teach theory.
              <br />
              <span style={{ color: "hsl(var(--primary))" }}>Simulations build proof.</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every simulation is extracted from a live job posting. You practice the task.
              AI scores your performance. Your skill map grows.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SIM_ADVANTAGES.map((b, i) => (
              <motion.div key={b.title} {...fade(i * 0.06)}
                className="rounded-2xl border border-border/50 p-6 relative overflow-hidden group hover:border-border transition-colors"
                style={{
                  background: "hsl(var(--card))",
                  boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))",
                }}>
                <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `hsl(var(--${b.color}))` }} />
                <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `hsl(var(--${b.color}) / 0.1)`, border: `1px solid hsl(var(--${b.color}) / 0.2)` }}>
                  <b.icon className="h-5 w-5" style={{ color: `hsl(var(--${b.color}))` }} />
                </div>
                <h3 className="font-fantasy text-[15px] font-bold mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div {...fade()} className="text-center mb-14">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
              <Target className="inline h-3 w-3 mr-1" style={{ color: "hsl(var(--primary))" }} />
              The Quest Loop
            </p>
            <h2 className="font-fantasy text-3xl md:text-4xl font-bold">
              Three steps to stay ahead of the curve.
            </h2>
          </motion.div>

          <div className="space-y-4">
            {STEPS.map((s, i) => (
              <motion.div key={s.step} {...fade(i * 0.1)}
                className="flex items-start gap-4 rounded-xl border border-border/50 p-5"
                style={{
                  background: "hsl(var(--card))",
                  boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))",
                }}>
                <div className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
                  style={{ background: `hsl(${s.color} / 0.12)`, border: `1px solid hsl(${s.color} / 0.2)` }}>
                  <span className="text-sm font-bold font-fantasy" style={{ color: `hsl(${s.color})` }}>
                    {s.step}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-fantasy font-semibold text-[15px]">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="px-4 py-24 relative overflow-hidden" style={{ background: "hsl(var(--surface-stone) / 0.5)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[200px] opacity-[0.08]"
            style={{ background: "hsl(var(--primary))" }} />
        </div>
        <motion.div {...fade()} className="text-center max-w-lg mx-auto relative z-10">
          <Crown className="h-12 w-12 mx-auto mb-6 opacity-60" style={{ color: "hsl(var(--primary))" }} />
          <h2 className="font-fantasy text-3xl md:text-4xl font-bold mb-4">
            The market won't wait for you.
            <br />
            <span style={{ color: "hsl(var(--primary))" }}>Start practicing now.</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            10,000+ simulations built from live jobs at the world's top companies.
            Free to start. No credit card required.
          </p>
          <Button size="lg" onClick={handleCTA} className="gap-2 text-base font-fantasy"
            style={{ boxShadow: "0 0 24px hsl(var(--primary) / 0.3)" }}>
            <Sparkles className="h-4 w-4" /> Get Started Free <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
