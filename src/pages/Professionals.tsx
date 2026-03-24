/**
 * /professionals — Landing page for career changers & working professionals.
 */
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, BarChart3, Brain, Briefcase, ChevronRight,
  Layers, LineChart, Rocket, Shield, Sparkles, Target, TrendingUp, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CompanyMarquee from "@/components/CompanyMarquee";

const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: (d: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: d * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.section ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} className={`relative ${className}`}>
      {children}
    </motion.section>
  );
}

function BenefitCard({ icon: Icon, title, desc, color, delay }: {
  icon: any; title: string; desc: string; color: string; delay: number;
}) {
  return (
    <motion.div variants={fadeUp} custom={delay} className="relative rounded-2xl overflow-hidden group">
      <div className={`absolute top-0 inset-x-0 h-[3px]`} style={{ background: `hsl(var(--${color}))` }} />
      <div className="border border-[hsl(var(--filigree)/0.12)] rounded-2xl p-6 h-full hover:border-[hsl(var(--filigree)/0.3)] transition-all"
        style={{ background: "hsl(var(--surface-stone))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
        <div className="h-11 w-11 rounded-xl border border-[hsl(var(--filigree)/0.15)] flex items-center justify-center mb-4"
          style={{ background: `hsl(var(--${color}) / 0.1)` }}>
          <Icon className="h-5 w-5" style={{ color: `hsl(var(--${color}))` }} />
        </div>
        <h3 className="text-base font-bold mb-2 leading-snug font-fantasy">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

const BENEFITS = [
  { icon: Brain, title: "AI Readiness Score", desc: "See exactly how AI impacts your current role — task by task, skill by skill.", color: "territory-analytical" },
  { icon: Target, title: "Personalized Simulations", desc: "Practice real AI-augmented scenarios from your industry. Scored across 4 readiness pillars.", color: "territory-strategic" },
  { icon: TrendingUp, title: "Career Pathways", desc: "Discover lateral moves and upskill paths based on your existing skill profile.", color: "territory-creative" },
  { icon: Shield, title: "Proof of Readiness", desc: "Earn verifiable badges that show employers you can work alongside AI, not against it.", color: "territory-leadership" },
  { icon: Layers, title: "Skill Gap Analysis", desc: "Compare your skills against market demand. Know what to learn next — backed by live job data.", color: "neon-cyan" },
  { icon: Rocket, title: "Action Plans", desc: "Get a week-by-week learning roadmap tailored to your career goals and timeline.", color: "neon-lime" },
];

const STATS = [
  { value: "400+", label: "Roles Mapped" },
  { value: "12K+", label: "Simulations Completed" },
  { value: "4", label: "Readiness Pillars" },
  { value: "89%", label: "Report Feeling More Prepared" },
];

export default function Professionals() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <Section className="pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[hsl(var(--filigree)/0.2)] text-xs font-medium text-muted-foreground mb-6"
            style={{ background: "hsl(var(--surface-parchment))" }}>
            <Briefcase className="h-3 w-3 text-[hsl(var(--territory-strategic))]" /> For Professionals
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6 font-fantasy">
            AI is reshaping your role.
            <br />
            <span className="text-[hsl(var(--territory-strategic))]">Be the one who's ready.</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2}
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Whether you're pivoting careers or future-proofing your current one — get a clear picture
            of where AI hits hardest and exactly what to do about it.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate("/auth")} className="gap-2"
              style={{ boxShadow: "0 0 16px hsl(var(--territory-strategic) / 0.25)" }}>
              Start Free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/pricing")}
              className="border-[hsl(var(--filigree)/0.2)]">
              View Plans
            </Button>
          </motion.div>
        </div>
      </Section>

      {/* Stats */}
      <Section className="py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div key={s.label} variants={fadeUp} custom={i} className="text-center">
              <div className="text-3xl font-bold font-fantasy text-[hsl(var(--territory-strategic))]">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </Section>

      <CompanyMarquee rows={[
        ["Anthropic", "OpenAI", "Google DeepMind", "Stripe", "Spotify", "SpaceX"],
        ["McKinsey", "Deloitte", "JPMorgan", "Goldman Sachs", "Bain", "BCG"],
      ]} />

      {/* Benefits */}
      <Section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-3xl font-bold text-center mb-12 font-fantasy">
            Everything you need to stay ahead
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b, i) => (
              <BenefitCard key={b.title} {...b} delay={i + 1} />
            ))}
          </div>
        </div>
      </Section>

      {/* How it works */}
      <Section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-3xl font-bold text-center mb-12 font-fantasy">
            How it works
          </motion.h2>
          {[
            { step: "1", title: "Enter your role", desc: "Tell us your job title and company. We pull live market data instantly.", icon: BarChart3 },
            { step: "2", title: "See your AI exposure map", desc: "Every task in your role scored for automation risk and augmentation potential.", icon: LineChart },
            { step: "3", title: "Train with simulations", desc: "Practice AI-augmented scenarios. Get scored on tool awareness, judgment, and adaptability.", icon: Sparkles },
            { step: "4", title: "Get your action plan", desc: "A personalized skill-up roadmap with weekly milestones and proof-of-readiness badges.", icon: Zap },
          ].map((item, i) => (
            <motion.div key={item.step} variants={fadeUp} custom={i + 1}
              className="flex gap-4 mb-8 last:mb-0">
              <div className="flex-shrink-0 h-10 w-10 rounded-xl border border-[hsl(var(--filigree)/0.2)] flex items-center justify-center"
                style={{ background: "hsl(var(--surface-parchment))" }}>
                <span className="text-sm font-bold font-fantasy text-[hsl(var(--territory-strategic))]">{item.step}</span>
              </div>
              <div>
                <h3 className="text-base font-bold mb-1 font-fantasy">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center rounded-2xl border border-[hsl(var(--filigree)/0.15)] p-10"
          style={{ background: "hsl(var(--surface-stone))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 8px 32px hsl(var(--emboss-shadow))" }}>
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-3xl font-bold mb-4 font-fantasy">
            Your career won't wait for AI to settle down
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-6">
            Start free. See your exposure map in under 2 minutes.
          </motion.p>
          <motion.div variants={fadeUp} custom={2}>
            <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
              Get Started <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
