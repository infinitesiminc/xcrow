/**
 * /schools — B2B university landing page.
 * Full RPG aesthetic highlighting gamified learning benefits for the shifting job market.
 */
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, BarChart3, BookOpen, Brain, Briefcase,
  Castle, Crosshair, Crown, Flame, GraduationCap, LayoutDashboard,
  Map, Shield, Sparkles, Sword, Swords, Target,
  Trophy, Users, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SchoolsBenefitsGrid from "@/components/schools/BenefitsGrid";
import SchoolsHowItWorks from "@/components/schools/HowItWorks";
import SchoolsSkillBattlegrounds from "@/components/schools/SkillBattlegrounds";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

const PROOF_STATS = [
  { value: "73%", label: "of employers now include AI in technical assessments", icon: Crosshair, color: "territory-creative" },
  { value: "183", label: "battle-tested skills mapped to real employer demand", icon: Sword, color: "territory-strategic" },
  { value: "10k+", label: "simulations built from actual job tasks across 3,600+ companies", icon: Swords, color: "territory-analytical" },
  { value: "3×", label: "higher pass rate on technical assessments for students who practice", icon: Trophy, color: "territory-leadership" },
];

export default function Schools() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* ═══ HERO ═══ */}
        <section className="relative min-h-[80vh] flex items-center justify-center px-4 overflow-hidden">
          {/* Atmospheric glows */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[200px] opacity-[0.08]"
              style={{ background: "hsl(var(--primary))" }} />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[180px] opacity-[0.06]"
              style={{ background: "hsl(var(--territory-strategic))" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[120px] opacity-[0.05]"
              style={{ background: "hsl(var(--territory-leadership))" }} />
          </div>

          <motion.div {...fade()} className="text-center max-w-4xl relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-mono uppercase tracking-[0.2em]"
              style={{
                background: "hsl(var(--primary) / 0.08)",
                border: "1px solid hsl(var(--primary) / 0.2)",
                color: "hsl(var(--primary))",
              }}>
              <GraduationCap className="h-3.5 w-3.5" />
              For Universities & Colleges
            </div>

            <h1 className="font-fantasy text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1]">
              The job market shifted.
              <br />
              <span style={{ color: "hsl(var(--primary))" }}>Arm your students.</span>
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
              Employers don't just test knowledge anymore — they test <strong className="text-foreground">AI-readiness</strong>,{" "}
              <strong className="text-foreground">critical thinking</strong>, and{" "}
              <strong className="text-foreground">adaptability</strong>. Your curriculum gives students the theory.
              We give them the <em>battleground</em> to prove they can perform.
            </p>

            <p className="text-sm font-medium mb-8" style={{ color: "hsl(var(--territory-strategic))" }}>
              <Flame className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
              183 skills. 10,000+ simulations. Built from real job tasks across 3,600+ companies.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/contact")}
                className="text-base px-8 gap-2 font-fantasy"
                style={{ boxShadow: "0 0 24px hsl(var(--primary) / 0.3)" }}>
                <Shield className="h-4 w-4" /> Start a Free Pilot <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/how-it-works")}
                className="text-base px-8 font-fantasy"
                style={{ borderColor: "hsl(var(--filigree) / 0.25)" }}>
                <Map className="h-4 w-4 mr-2" /> See the Quest System
              </Button>
            </div>
          </motion.div>
        </section>

        {/* ═══ PROOF BAR ═══ */}
        <section className="py-16 px-4" style={{ background: "hsl(var(--surface-stone) / 0.5)" }}>
          <div className="max-w-5xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PROOF_STATS.map((item, i) => (
                <motion.div key={item.value} {...fade(i * 0.08)}
                  className="rounded-xl border border-border/50 p-5 text-center relative overflow-hidden"
                  style={{
                    background: "hsl(var(--card))",
                    boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))",
                  }}>
                  <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `hsl(var(--${item.color}))` }} />
                  <item.icon className="h-5 w-5 mx-auto mb-2 opacity-60" style={{ color: `hsl(var(--${item.color}))` }} />
                  <span className="text-3xl font-bold font-fantasy" style={{ color: `hsl(var(--${item.color}))` }}>
                    {item.value}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ WHY GAMIFIED LEARNING ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
                <Flame className="inline h-3 w-3 mr-1" style={{ color: "hsl(var(--territory-creative))" }} />
                Why Gamified Skill Training
              </p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold mb-4">
                Lectures teach concepts.
                <br />
                <span style={{ color: "hsl(var(--primary))" }}>Battles build mastery.</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
                The skills employers test for — AI fluency, strategic reasoning, adaptive communication —
                can't be learned from slides. They need <em>repetition under pressure</em>, instant feedback,
                and progressive difficulty. That's what our quest system delivers.
              </p>
            </motion.div>

            <SchoolsBenefitsGrid fade={fade} />
          </div>
        </section>

        {/* ═══ THE SKILL BATTLEGROUNDS ═══ */}
        <section className="py-20 px-4" style={{ background: "hsl(var(--surface-stone) / 0.5)" }}>
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
                <Sword className="inline h-3 w-3 mr-1" style={{ color: "hsl(var(--territory-analytical))" }} />
                8 Skill Territories
              </p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold mb-4">
                Every skill employers demand.
                <br />
                <span style={{ color: "hsl(var(--territory-strategic))" }}>Mapped. Practiced. Proven.</span>
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Your students don't just learn "AI skills." They conquer 8 distinct territories —
                from Technical mastery to Human Edge — each with its own progression path.
              </p>
            </motion.div>

            <SchoolsSkillBattlegrounds fade={fade} />
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
                <Target className="inline h-3 w-3 mr-1" style={{ color: "hsl(var(--primary))" }} />
                Deploy in a Day
              </p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">
                Three steps to arm your cohort.
              </h2>
              <p className="text-muted-foreground mt-3 max-w-md mx-auto">
                No LMS integration. No IT overhead. Just results.
              </p>
            </motion.div>

            <SchoolsHowItWorks fade={fade} />
          </div>
        </section>

        {/* ═══ INSTITUTIONAL ARSENAL ═══ */}
        <section className="py-20 px-4" style={{ background: "hsl(var(--surface-stone) / 0.5)" }}>
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
                <Crown className="inline h-3 w-3 mr-1" style={{ color: "hsl(var(--territory-leadership))" }} />
                Your Arsenal
              </p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">
                Command center for career outcomes.
              </h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                Real-time visibility into which skills your students are building —
                and how they measure against what employers actually hire for.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: LayoutDashboard, title: "Skill-Gap War Room", desc: "See which of 183 market skills your students are conquering — and where the biggest gaps remain before graduation.", color: "territory-analytical" },
                { icon: Briefcase, title: "Employer Quest Feeds", desc: "Connect your employer partners' job feeds. Students practice the exact tasks your recruiters are hiring for — not generic exercises.", color: "territory-leadership" },
                { icon: Brain, title: "10k+ Battle Simulations", desc: "Every simulation is built from real job tasks. Each one builds Foundation, AI Mastery, and Human Edge skills simultaneously.", color: "territory-technical" },
                { icon: Users, title: "Bulk Deployment", desc: "Domain auto-enroll, CSV import, or invite links — seat your entire cohort in minutes. Zero IT tickets.", color: "territory-communication" },
                { icon: Trophy, title: "XP & Leaderboards", desc: "Gamified progression keeps students practicing consistently. Territory maps and skill castles make growth visible and addictive.", color: "territory-strategic" },
                { icon: BarChart3, title: "Cohort Analytics", desc: "Track engagement, skill growth, and employer-readiness scores across your entire student body in real time.", color: "territory-creative" },
              ].map((f, i) => (
                <motion.div key={f.title} {...fade(i * 0.08)}
                  className="rounded-2xl border border-border/50 p-6 group hover:border-border transition-colors relative overflow-hidden"
                  style={{
                    background: "hsl(var(--card))",
                    boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))",
                  }}>
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
              style={{
                background: "hsl(var(--card))",
                boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))",
              }}>
              <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: "hsl(var(--filigree-glow))" }} />
              <Castle className="h-6 w-6 mx-auto mb-4 opacity-40" style={{ color: "hsl(var(--filigree-glow))" }} />
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

        {/* ═══ MID-PAGE CTA ═══ */}
        <section className="py-16 px-4">
          <motion.div {...fade()} className="text-center max-w-lg mx-auto">
            <Button size="lg" onClick={() => navigate("/contact")}
              className="text-base px-8 gap-2 font-fantasy"
              style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.25)" }}>
              <Shield className="h-4 w-4" /> Schedule a Demo <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground mt-3">Free pilot for qualifying institutions · No IT integration needed</p>
          </motion.div>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section className="py-24 px-4 relative overflow-hidden" style={{ background: "hsl(var(--surface-stone) / 0.5)" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[200px] opacity-[0.08]"
              style={{ background: "hsl(var(--primary))" }} />
          </div>
          <motion.div {...fade()} className="text-center max-w-lg mx-auto relative z-10">
            <Swords className="h-12 w-12 mx-auto mb-6 opacity-60" style={{ color: "hsl(var(--primary))" }} />
            <h2 className="font-fantasy text-3xl md:text-4xl font-bold mb-4">
              Every student deserves a fighting chance.
              <br />
              <span style={{ color: "hsl(var(--primary))" }}>Equip them now.</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Seat your first cohort, connect your employer partners, and see measurable skill growth within weeks.
            </p>
            <Button size="lg" onClick={() => navigate("/contact")}
              className="text-base px-10 gap-2 font-fantasy"
              style={{ boxShadow: "0 0 24px hsl(var(--filigree-glow) / 0.3)" }}>
              <Shield className="h-4 w-4" /> Start a Free Pilot <ArrowRight className="h-4 w-4" />
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
