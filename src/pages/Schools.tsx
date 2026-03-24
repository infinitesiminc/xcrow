/**
 * /schools — B2B university landing page.
 * Immersive RPG aesthetic matching /how-it-works.
 */
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, BarChart3, BookOpen, Brain, Briefcase,
  GraduationCap, LayoutDashboard, Link2, Sparkles,
  Trophy, Users, Zap,
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

const PROBLEM_STATS = [
  { value: "73%", label: "of employers now include AI in technical assessments", color: "territory-creative" },
  { value: "31", label: "core skills the market demands beyond what courses teach", color: "territory-strategic" },
  { value: "2×", label: "faster skill shifts since 2024 — annual training can't keep up", color: "territory-analytical" },
];

const STEPS = [
  { step: "01", title: "Enroll your students", desc: "Domain auto-enroll, CSV import, or invite links — seat your entire cohort in minutes.", icon: Users, color: "var(--territory-analytical)" },
  { step: "02", title: "Get your customized dashboard", desc: "We map 31 high-demand skills against 3,600+ employers so you see exactly where students stand.", icon: BarChart3, color: "var(--territory-strategic)" },
  { step: "03", title: "Connect your employer partners", desc: "Link employer job feeds so students practice skills your specific recruiters are hiring for.", icon: Briefcase, color: "var(--territory-leadership)" },
];

const FEATURES = [
  { icon: LayoutDashboard, title: "Skill-Gap Dashboard", desc: "See which of 31 market skills your students are growing — and where the biggest opportunities are.", color: "territory-analytical" },
  { icon: Briefcase, title: "Custom Employer Jobs", desc: "Connect your employer partners' ATS feeds. Students practice the exact tasks your recruiters hire for.", color: "territory-leadership" },
  { icon: Brain, title: "AI Simulation Library", desc: "10,000+ simulations built from real job tasks. Each one builds Foundation, AI Mastery, and Human Edge skills.", color: "territory-technical" },
  { icon: Users, title: "Bulk Provisioning", desc: "Domain auto-enroll, CSV import, or invite links — seat your entire cohort in minutes.", color: "territory-communication" },
  { icon: Trophy, title: "Gamified Engagement", desc: "XP leaderboards and skill territory maps keep students motivated and practicing consistently.", color: "territory-strategic" },
  { icon: BarChart3, title: "Cohort Analytics", desc: "Track engagement, skill growth, and readiness scores across your entire student body.", color: "territory-creative" },
];

export default function Schools() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* ═══ HERO ═══ */}
        <section className="relative min-h-[70vh] flex items-center justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full blur-[180px] opacity-12"
              style={{ background: "hsl(var(--primary))" }} />
            <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full blur-[160px] opacity-10"
              style={{ background: "hsl(var(--territory-strategic))" }} />
          </div>

          <motion.div {...fade()} className="text-center max-w-3xl relative z-10">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">
              <GraduationCap className="inline h-3 w-3 mr-1.5 -mt-0.5" style={{ color: "hsl(var(--primary))" }} />
              For Universities & Colleges
            </p>
            <h1 className="font-fantasy text-4xl md:text-6xl font-bold mb-4 leading-tight">
              Every student needs this
              <br />
              <span style={{ color: "hsl(var(--primary))" }}>to compete.</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-4">
              Your students learn the theory. We give them the practice employers actually test for —
              mapped to 21,000+ real roles across 3,600+ companies.
            </p>
            <p className="text-sm font-medium mb-8" style={{ color: "hsl(var(--territory-strategic))" }}>
              <Sparkles className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
              Students who practice are 3× more likely to pass technical assessments
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/contact")} className="text-base px-8 gap-2"
                style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.25)" }}>
                Start a Free Pilot <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/pricing")}
                className="text-base px-8" style={{ borderColor: "hsl(var(--filigree) / 0.2)" }}>
                See How It Works
              </Button>
            </div>
          </motion.div>
        </section>

        {/* ═══ THE PROBLEM ═══ */}
        <section className="py-20 px-4" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
          <div className="max-w-4xl mx-auto">
            <motion.div {...fade()} className="text-center mb-12">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">The Reality</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">
                Employers aren't just testing knowledge.
                <br />
                <span style={{ color: "hsl(var(--territory-creative))" }}>They're testing AI-readiness.</span>
              </h2>
            </motion.div>

            <div className="grid sm:grid-cols-3 gap-5">
              {PROBLEM_STATS.map((item, i) => (
                <motion.div key={item.value} {...fade(i * 0.1)}
                  className="rounded-xl border border-border/50 p-6 text-center relative overflow-hidden"
                  style={{ background: "hsl(var(--card))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
                  <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `hsl(var(--${item.color}))` }} />
                  <span className="text-3xl sm:text-4xl font-bold font-fantasy" style={{ color: `hsl(var(--${item.color}))` }}>{item.value}</span>
                  <p className="text-sm text-muted-foreground mt-2">{item.label}</p>
                </motion.div>
              ))}
            </div>

            <motion.p {...fade(0.3)} className="text-muted-foreground mt-8 max-w-lg mx-auto text-center">
              Your curriculum gives students the foundation. We give them the practice environment
              to build the skills employers are actually testing for.
            </motion.p>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">Zero IT Overhead</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">Three Steps to Launch</h2>
              <p className="text-muted-foreground mt-3 max-w-md mx-auto">Launch in a day. No LMS integration needed.</p>
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

        {/* ═══ FEATURES ═══ */}
        <section className="py-20 px-4" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">Your Arsenal</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">Everything Your Institution Needs</h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                From skill tracking to employer alignment — one platform, zero IT overhead.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f, i) => (
                <motion.div key={f.title} {...fade(i * 0.08)}
                  className="rounded-2xl border border-border/50 p-6 group hover:border-border transition-colors relative overflow-hidden"
                  style={{ background: "hsl(var(--card))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))" }}>
                  <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `hsl(var(--${f.color}))` }} />
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `hsl(var(--${f.color}) / 0.1)`, border: `1px solid hsl(var(--${f.color}) / 0.2)` }}>
                    <f.icon className="h-5 w-5" style={{ color: `hsl(var(--${f.color}))` }} />
                  </div>
                  <h3 className="font-fantasy text-base font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ TESTIMONIAL ═══ */}
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <motion.div {...fade()}
              className="rounded-2xl border border-border/50 p-8 text-center relative overflow-hidden"
              style={{ background: "hsl(var(--card))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))" }}>
              <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: "hsl(var(--filigree-glow))" }} />
              <blockquote className="text-lg sm:text-xl italic text-foreground/80 leading-relaxed mb-4">
                "Our students started practicing the exact skills our employer partners hire for —
                within a week of launch. The career office now has data to prove employment outcomes."
              </blockquote>
              <footer className="text-sm text-muted-foreground font-fantasy">
                — Associate Dean, R1 University (pilot participant)
              </footer>
            </motion.div>
          </div>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section className="py-24 px-4 relative overflow-hidden" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[200px] opacity-10"
              style={{ background: "hsl(var(--primary))" }} />
          </div>
          <motion.div {...fade()} className="text-center max-w-lg mx-auto relative z-10">
            <motion.img src={xcrowLogo} alt="Xcrow" className="h-16 w-16 mx-auto mb-6 crow-glow"
              animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
            <h2 className="font-fantasy text-3xl md:text-4xl font-bold mb-4">
              Give every student the edge they need.
              <br />
              <span style={{ color: "hsl(var(--primary))" }}>Start with a free pilot.</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Seat your first cohort, connect your employer partners, and see the impact within weeks.
            </p>
            <Button size="lg" onClick={() => navigate("/contact")} className="text-base px-10 gap-2"
              style={{ boxShadow: "0 0 24px hsl(var(--filigree-glow) / 0.3)" }}>
              Start a Free Pilot <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              <Sparkles className="inline h-3 w-3 mr-1" style={{ color: "hsl(var(--filigree-glow))" }} />
              Free for qualifying institutions. No IT integration required.
            </p>
          </motion.div>
        </section>
      </div>
      <Footer />
    </>
  );
}
