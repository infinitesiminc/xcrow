/**
 * /professionals — Landing page for career changers & working professionals.
 * Immersive RPG aesthetic matching /how-it-works.
 */
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, BarChart3, Brain, Briefcase, ChevronRight,
  Layers, LineChart, Map, Rocket, Shield, Sparkles, Target, TrendingUp, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import xcrowLogo from "@/assets/xcrow-logo.png";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

const BENEFITS = [
  { icon: Brain, title: "AI Readiness Score", desc: "See exactly how AI impacts your current role — task by task, skill by skill.", color: "territory-analytical" },
  { icon: Target, title: "Personalized Simulations", desc: "Practice real AI-augmented scenarios from your industry. Scored across 4 readiness pillars.", color: "territory-strategic" },
  { icon: TrendingUp, title: "Career Pathways", desc: "Discover lateral moves and upskill paths based on your existing skill profile.", color: "territory-creative" },
  { icon: Shield, title: "Proof of Readiness", desc: "Earn verifiable badges that show employers you can work alongside AI, not against it.", color: "territory-leadership" },
  { icon: Layers, title: "Skill Gap Analysis", desc: "Compare your skills against market demand. Know what to learn next — backed by live job data.", color: "territory-communication" },
  { icon: Rocket, title: "Action Plans", desc: "Get a week-by-week learning roadmap tailored to your career goals and timeline.", color: "territory-humanedge" },
];

const STEPS = [
  { step: "01", title: "Enter your role", desc: "Tell us your job title and company. We pull live market data instantly.", icon: BarChart3, color: "var(--territory-analytical)" },
  { step: "02", title: "See your AI exposure map", desc: "Every task in your role scored for automation risk and augmentation potential.", icon: LineChart, color: "var(--territory-strategic)" },
  { step: "03", title: "Train with simulations", desc: "Practice AI-augmented scenarios. Get scored on tool awareness, judgment, and adaptability.", icon: Sparkles, color: "var(--territory-creative)" },
  { step: "04", title: "Get your action plan", desc: "A personalized skill-up roadmap with weekly milestones and proof-of-readiness badges.", icon: Zap, color: "var(--territory-leadership)" },
];

const STATS = [
  { value: "400+", label: "Roles Mapped" },
  { value: "12K+", label: "Simulations Completed" },
  { value: "4", label: "Readiness Pillars" },
  { value: "89%", label: "Feel More Prepared" },
];

export default function Professionals() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* ═══ HERO ═══ */}
        <section className="relative min-h-[70vh] flex items-center justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[180px] opacity-15"
              style={{ background: "hsl(var(--territory-strategic))" }} />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[160px] opacity-10"
              style={{ background: "hsl(var(--territory-analytical))" }} />
          </div>

          <motion.div {...fade()} className="text-center max-w-3xl relative z-10">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">
              <Briefcase className="inline h-3 w-3 mr-1.5 -mt-0.5" style={{ color: "hsl(var(--territory-strategic))" }} />
              For Professionals
            </p>
            <h1 className="font-fantasy text-4xl md:text-6xl font-bold mb-4 leading-tight">
              AI is reshaping your role.
              <br />
              <span style={{ color: "hsl(var(--territory-strategic))" }}>Be the one who's ready.</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-8">
              Whether you're pivoting careers or future-proofing your current one — get a clear picture
              of where AI hits hardest and exactly what to do about it.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/auth")} className="text-base px-8 gap-2"
                style={{ boxShadow: "0 0 20px hsl(var(--territory-strategic) / 0.25)" }}>
                Start Free <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/pricing")}
                className="text-base px-8" style={{ borderColor: "hsl(var(--filigree) / 0.2)" }}>
                View Plans
              </Button>
            </div>
          </motion.div>
        </section>

        {/* ═══ STATS ═══ */}
        <section className="py-12 px-4 border-y border-border/50" style={{ background: "hsl(var(--secondary) / 0.3)" }}>
          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 md:gap-16">
            {STATS.map((s) => (
              <motion.div key={s.label} {...fade()} className="text-center">
                <p className="text-2xl md:text-3xl font-fantasy font-bold" style={{ color: "hsl(var(--territory-strategic))" }}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══ BENEFITS ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">Your Arsenal</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">Everything You Need to Stay Ahead</h2>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {BENEFITS.map((b, i) => (
                <motion.div key={b.title} {...fade(i * 0.08)}
                  className="rounded-2xl border border-border/50 p-6 group hover:border-border transition-colors relative overflow-hidden"
                  style={{ background: "hsl(var(--card))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))" }}>
                  <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `hsl(var(--${b.color}))` }} />
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `hsl(var(--${b.color}) / 0.1)`, border: `1px solid hsl(var(--${b.color}) / 0.2)` }}>
                    <b.icon className="h-5 w-5" style={{ color: `hsl(var(--${b.color}))` }} />
                  </div>
                  <h3 className="font-fantasy text-base font-bold mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="py-20 px-4" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
          <div className="max-w-4xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">The Quest Path</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">How It Works</h2>
            </motion.div>

            <div className="space-y-4">
              {STEPS.map((item, i) => (
                <motion.div key={item.step} {...fade(i * 0.1)}
                  className="flex items-center gap-4 rounded-xl border border-border/50 p-5"
                  style={{ background: "hsl(var(--card))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                    style={{ background: `hsl(${item.color} / 0.15)`, border: `1px solid hsl(${item.color} / 0.25)` }}>
                    <span className="text-sm font-bold font-fantasy" style={{ color: `hsl(${item.color})` }}>{item.step}</span>
                  </div>
                  <item.icon className="h-5 w-5 shrink-0" style={{ color: `hsl(${item.color})` }} />
                  <div className="flex-1">
                    <h3 className="font-fantasy font-semibold text-[15px]">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[200px] opacity-10"
              style={{ background: "hsl(var(--territory-strategic))" }} />
          </div>
          <motion.div {...fade()} className="text-center max-w-lg mx-auto relative z-10">
            <motion.img src={xcrowLogo} alt="Xcrow" className="h-16 w-16 mx-auto mb-6 crow-glow"
              animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
            <h2 className="font-fantasy text-3xl md:text-4xl font-bold mb-4">
              Your career won't wait for AI to settle down
            </h2>
            <p className="text-muted-foreground mb-8">
              Start free. See your exposure map in under 2 minutes.
            </p>
            <Button size="lg" onClick={() => navigate("/auth")} className="text-base px-10 gap-2"
              style={{ boxShadow: "0 0 24px hsl(var(--filigree-glow) / 0.3)" }}>
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </section>
      </div>
      <Footer />
    </>
  );
}
