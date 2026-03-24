/**
 * How It Works — Experience-focused preview to hook users.
 * Shows what you SEE and DO, not behind-the-scenes mechanics.
 */
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Sword, Map, ArrowRight, Sparkles, Search, Zap,
  Shield, BookOpen, Compass, Crown, Eye, Play,
  Target, TrendingUp, BarChart3, Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BOSS_ROSTER, type BossCharacter } from "@/lib/boss-roster";

import xcrowLogo from "@/assets/xcrow-logo.webp";
import simBriefing from "@/assets/sim-briefing.jpg";
import simVictory from "@/assets/sim-victory.jpg";
import heroConquer from "@/assets/hero-conquer.jpg";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

/* ═══ Boss Mini SVG ═══ */
function BossMiniSVG({ boss }: { boss: BossCharacter }) {
  const h = boss.hue;
  return (
    <svg viewBox="-10 -15 140 160" className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-lg">
      <defs>
        <radialGradient id={`bg-${boss.id}`} cx="50%" cy="40%">
          <stop offset="0%" stopColor={`hsl(${h}, 70%, 25%)`} />
          <stop offset="100%" stopColor={`hsl(${h}, 50%, 10%)`} />
        </radialGradient>
        <radialGradient id={`glow-${boss.id}`} cx="50%" cy="50%">
          <stop offset="0%" stopColor={`hsl(${h}, 80%, 60%)`} stopOpacity="0.5" />
          <stop offset="100%" stopColor={`hsl(${h}, 80%, 60%)`} stopOpacity="0" />
        </radialGradient>
      </defs>
      {boss.detailPaths.map((d, i) => (
        <path key={`d-${i}`} d={d} fill="none" stroke={`hsl(${h}, 50%, 40%)`} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      ))}
      <path d={boss.bodyPath} fill={`url(#bg-${boss.id})`} stroke={`hsl(${h}, 60%, 50%)`} strokeWidth="1.5" />
      <path d={boss.innerPath} fill="none" stroke={`hsl(${h}, 50%, 40%)`} strokeWidth="0.7" opacity="0.5" />
      {boss.crownPath && (
        <path d={boss.crownPath} fill="none" stroke={`hsl(${h}, 70%, 60%)`} strokeWidth="1.5" strokeLinecap="round" />
      )}
      {boss.eyePositions.map((eye, i) => (
        <circle key={`eye-${i}`} cx={eye.cx} cy={eye.cy} r={eye.r} fill={`url(#glow-${boss.id})`} stroke={`hsl(${h}, 80%, 70%)`} strokeWidth="1" />
      ))}
      {boss.runes.map((r, i) => (
        <circle key={i} cx={r.x} cy={r.y} r={r.r} fill={`hsl(${h}, 60%, 55%)`} opacity="0.6">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

const EXPERIENCE_STEPS = [
  {
    num: "01",
    title: "Search any job role",
    desc: "Type a role like 'Product Manager' or 'Data Analyst' and get an instant AI threat assessment — see exactly which tasks are being automated.",
    icon: Search,
    color: "var(--territory-analytical)",
    features: ["21,000+ real roles", "AI threat scores per task", "Skill gap breakdown"],
  },
  {
    num: "02",
    title: "Read the Mission Briefing",
    desc: "See which tasks AI is taking over, what skills you need to stay relevant, and how the role is changing — all in one interactive dashboard.",
    icon: Eye,
    color: "var(--territory-technical)",
    features: ["Task-by-task AI impact", "Required future skills", "Industry benchmarks"],
  },
  {
    num: "03",
    title: "Practice in AI Simulations",
    desc: "Enter realistic scenarios built from real job tasks. Compare AI tools, make strategic decisions, and build muscle memory for the AI-augmented workplace.",
    icon: Sword,
    color: "var(--territory-creative)",
    features: ["Hands-on practice", "Real job scenarios", "Instant AI feedback"],
  },
  {
    num: "04",
    title: "Level up & track progress",
    desc: "Watch your skills grow on the World Map. Earn XP, evolve castles, conquer kingdoms — and prove you're ready for the future of work.",
    icon: TrendingUp,
    color: "var(--territory-strategic)",
    features: ["Visual skill map", "XP & rankings", "Shareable profile"],
  },
];

const SIM_PREVIEW_FEATURES = [
  { icon: Brain, label: "AI Tool Comparison", desc: "Compare ChatGPT vs Claude vs Gemini on real tasks" },
  { icon: Shield, label: "Risk Assessment", desc: "Judge which AI outputs are safe to trust" },
  { icon: BarChart3, label: "Strategic Decisions", desc: "Make calls AI can't — ethics, nuance, judgment" },
  { icon: Sparkles, label: "Instant Scoring", desc: "Get scored on 4 dimensions with actionable feedback" },
];

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* ═══ HERO ═══ */}
        <section className="relative min-h-[70vh] flex items-center justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[180px] opacity-15"
              style={{ background: "hsl(var(--territory-technical))" }} />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[160px] opacity-10"
              style={{ background: "hsl(var(--territory-creative))" }} />
          </div>

          <motion.div {...fade()} className="text-center max-w-3xl relative z-10">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary font-fantasy text-xs tracking-wider">
              Free to play · No credit card
            </Badge>
            <h1 className="font-fantasy text-4xl md:text-6xl font-bold mb-4 leading-tight">
              See What <span style={{ color: "hsl(var(--filigree-glow))" }}>Xcrow</span> Looks Like
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-8">
              Search a role. See the AI threat. Practice in a simulation. Track your growth. All in under 5 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate("/")} className="text-base px-8 gap-2"
                style={{ boxShadow: "0 0 20px hsl(var(--filigree-glow) / 0.25)" }}>
                <Play className="h-5 w-5" /> Try It Free <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/skills")} className="text-base px-8 gap-2">
                <BookOpen className="h-5 w-5" /> Browse 183 Skills
              </Button>
            </div>
          </motion.div>
        </section>

        {/* ═══ 4-STEP EXPERIENCE FLOW ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-16">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">Your First Session</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">Four Steps to Future-Ready</h2>
            </motion.div>

            <div className="space-y-6">
              {EXPERIENCE_STEPS.map((step, i) => (
                <motion.div key={step.num} {...fade(i * 0.1)}
                  className="rounded-2xl border border-border/50 overflow-hidden"
                  style={{ background: "hsl(var(--card))", boxShadow: `inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))` }}>
                  <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center"
                        style={{ background: `hsl(${step.color} / 0.15)`, border: `1px solid hsl(${step.color} / 0.25)` }}>
                        <step.icon className="h-6 w-6" style={{ color: `hsl(${step.color})` }} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground/50 font-bold">{step.num}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-fantasy text-xl font-bold mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {step.features.map(f => (
                          <span key={f} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground">
                            <Sparkles className="h-3 w-3 text-primary" /> {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ WHAT A SIMULATION FEELS LIKE ═══ */}
        <section className="py-20 px-4" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary font-fantasy text-xs tracking-wider">
                Inside a Simulation
              </Badge>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">What You'll Actually Do</h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                Each simulation drops you into a real scenario. No lectures, no quizzes — pure hands-on practice.
              </p>
            </motion.div>

            {/* Preview images */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <motion.div {...fade(0.1)} className="rounded-2xl overflow-hidden border border-border/50 group">
                <div className="h-48 md:h-56 overflow-hidden relative">
                  <img src={simBriefing} alt="Mission briefing screen" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, hsl(var(--card)), transparent 60%)` }} />
                  <div className="absolute bottom-4 left-4 right-4">
                    <Badge className="bg-primary/20 text-primary border-primary/30 mb-2">Level 1 — AI Mastery</Badge>
                    <h4 className="font-fantasy font-bold text-lg">The Mission Briefing</h4>
                    <p className="text-xs text-muted-foreground mt-1">See exactly which tasks AI is disrupting in your role</p>
                  </div>
                </div>
              </motion.div>
              <motion.div {...fade(0.2)} className="rounded-2xl overflow-hidden border border-border/50 group">
                <div className="h-48 md:h-56 overflow-hidden relative">
                  <img src={simVictory} alt="Simulation victory screen" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, hsl(var(--card)), transparent 60%)` }} />
                  <div className="absolute bottom-4 left-4 right-4">
                    <Badge className="bg-destructive/20 text-destructive border-destructive/30 mb-2">Level 2 — Boss Battle</Badge>
                    <h4 className="font-fantasy font-bold text-lg">The Arena</h4>
                    <p className="text-xs text-muted-foreground mt-1">Face boss monsters that test your judgment under pressure</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* What you do in sims */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SIM_PREVIEW_FEATURES.map((feat, i) => (
                <motion.div key={feat.label} {...fade(i * 0.08)}
                  className="rounded-xl border border-border/50 p-5 text-center"
                  style={{ background: "hsl(var(--card))", boxShadow: `inset 0 1px 0 hsl(var(--emboss-light))` }}>
                  <feat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h4 className="font-fantasy font-semibold text-sm mb-1.5">{feat.label}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ MID-PAGE CTA ═══ */}
        <section className="py-16 px-4">
          <motion.div {...fade()} className="text-center max-w-lg mx-auto">
            <h3 className="font-fantasy text-2xl font-bold mb-3">Ready to try your first simulation?</h3>
            <p className="text-muted-foreground text-sm mb-6">Pick any role. Your first battle is free — see what the AI future holds.</p>
            <Button size="lg" onClick={() => navigate("/")} className="text-base px-8 gap-2"
              style={{ boxShadow: "0 0 20px hsl(var(--filigree-glow) / 0.25)" }}>
              <Sword className="h-5 w-5" /> Start Your First Battle
            </Button>
          </motion.div>
        </section>

        {/* ═══ BOSS BESTIARY ═══ */}
        <section className="py-20 px-4" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <Badge variant="outline" className="mb-4 border-destructive/30 text-destructive font-fantasy text-xs tracking-wider">
                Level 2 — Boss Battles
              </Badge>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">The Bestiary</h2>
              <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
                Twelve unique adversaries guard the Sentinel's Sanctum. Each boss rotates between battles — 
                no two encounters feel the same.
              </p>
            </motion.div>

            {/* Two-row auto-scrolling marquee */}
            <div className="relative overflow-hidden -mx-4 px-4 mask-marquee">
              {[0, 1].map(row => {
                const half = Math.ceil(BOSS_ROSTER.length / 2);
                const rowBosses = row === 0 ? BOSS_ROSTER.slice(0, half) : BOSS_ROSTER.slice(half);
                const duped = [...rowBosses, ...rowBosses];
                return (
                  <div key={row} className="flex gap-4 mb-4 w-max"
                    style={{
                      animation: `scroll-marquee ${rowBosses.length * 4}s linear infinite`,
                      animationDirection: row === 1 ? "reverse" : "normal",
                    }}>
                    {duped.map((boss, i) => (
                      <div
                        key={`${boss.id}-${i}`}
                        className="group relative flex flex-col items-center rounded-xl border border-border/50 p-4 text-center overflow-hidden shrink-0"
                        style={{
                          width: 160,
                          background: "hsl(var(--card))",
                          boxShadow: `0 4px 20px -6px hsl(${boss.hue}, 50%, 30%, 0.3)`,
                        }}
                      >
                        <div
                          className="absolute inset-x-0 top-0 h-16 opacity-20 pointer-events-none"
                          style={{
                            background: `radial-gradient(ellipse at 50% 0%, hsl(${boss.hue}, 60%, 50%), transparent 70%)`,
                          }}
                        />
                        <div className="relative z-10 mb-3">
                          <BossMiniSVG boss={boss} />
                        </div>
                        <span className="text-lg mb-1">{boss.emoji}</span>
                        <h4 className="font-fantasy font-bold text-sm leading-tight">{boss.name}</h4>
                        <p className="text-[10px] text-muted-foreground mt-1 italic leading-snug line-clamp-2">{boss.title}</p>
                        <div className="absolute inset-0 flex items-end justify-center p-3 bg-gradient-to-t from-background/95 via-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                          <p className="text-[11px] text-foreground italic text-center leading-snug">"{boss.quote}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══ WHAT YOU GET ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div {...fade()} className="text-center mb-12">
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">What You Walk Away With</h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                Every session builds something real. Not certificates — proof.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { emoji: "🗺️", title: "Your Skill Map", desc: "A living visual of every skill you've practiced, with growth rings showing depth of mastery." },
                { emoji: "🏰", title: "Evolved Castles", desc: "Each skill is a castle that levels up as you practice — from Ruins to Citadel." },
                { emoji: "📊", title: "Shareable Profile", desc: "Show employers exactly which AI skills you've practiced, not just studied." },
              ].map((item, i) => (
                <motion.div key={item.title} {...fade(i * 0.1)}
                  className="rounded-xl border border-border/50 p-6 text-center"
                  style={{ background: "hsl(var(--card))", boxShadow: `inset 0 1px 0 hsl(var(--emboss-light))` }}>
                  <span className="text-4xl mb-4 block">{item.emoji}</span>
                  <h4 className="font-fantasy font-semibold text-lg mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[200px] opacity-10"
              style={{ background: "hsl(var(--primary))" }} />
          </div>
          <motion.div {...fade()} className="text-center max-w-lg mx-auto relative z-10">
            <motion.img src={xcrowLogo} alt="Xcrow" className="h-16 w-16 mx-auto mb-6 crow-glow"
              animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
            <h2 className="font-fantasy text-3xl md:text-4xl font-bold mb-4">Your Future Starts Here</h2>
            <p className="text-muted-foreground mb-8">Search any role, run your first simulation, and see exactly how AI is changing your career — in under 5 minutes.</p>
            <Button size="lg" onClick={() => navigate("/")} className="text-base px-10"
              style={{ boxShadow: "0 0 24px hsl(var(--filigree-glow) / 0.3)" }}>
              <Play className="h-5 w-5 mr-2" /> Try Xcrow Free
            </Button>
          </motion.div>
        </section>
      </div>
      <Footer />
    </>
  );
}
