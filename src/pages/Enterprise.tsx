/**
 * /enterprise — B2B landing page for companies & HR teams.
 * Position: Map AI readiness across your workforce. Upskill at scale.
 */
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, BarChart3, Brain, Briefcase, Building2, ChevronRight,
  Database, Layers, LineChart, Lock, Rocket, Shield, Sparkles, Target,
  TrendingUp, Users, Zap,
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

const CAPABILITIES = [
  { icon: Database, title: "ATS Integration", desc: "Connect Greenhouse, Lever, or any ATS. Every role ingested and scored automatically.", color: "territory-analytical" },
  { icon: BarChart3, title: "AI Threat Map", desc: "See which departments and roles face the highest AI disruption — down to individual tasks.", color: "spectrum-6" },
  { icon: Sparkles, title: "Workforce Simulations", desc: "Deploy AI-readiness simulations across teams. Scored on 4 pillars: tool awareness, judgment, adaptability, human edge.", color: "territory-strategic" },
  { icon: Users, title: "Team Dashboards", desc: "Real-time visibility into readiness scores across departments, seniority levels, and locations.", color: "territory-creative" },
  { icon: Shield, title: "War Room", desc: "Automated bottleneck detection, coaching interventions, and priority alerts — all in one command center.", color: "territory-leadership" },
  { icon: TrendingUp, title: "Model Adaptation", desc: "When a new AI model drops, scores re-calibrate in 24 hours. Your data stays current, always.", color: "neon-cyan" },
];

const LOGOS_PROOF = [
  { metric: "400+", label: "Roles Analyzed" },
  { metric: "50K+", label: "Tasks Scored" },
  { metric: "<2min", label: "Time to First Insight" },
  { metric: "24hrs", label: "Model Re-calibration" },
];

export default function Enterprise() {
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
            <Building2 className="h-3 w-3 text-[hsl(var(--territory-leadership))]" /> For Enterprise
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6 font-fantasy">
            Map AI readiness across
            <br />
            <span className="text-[hsl(var(--territory-leadership))]">your entire workforce</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2}
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Connect your ATS. See every role scored for AI disruption. Deploy simulations at scale.
            Turn your team from vulnerable to battle-ready.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate("/contact")} className="gap-2"
              style={{ boxShadow: "0 0 16px hsl(var(--territory-leadership) / 0.25)" }}>
              Book a Demo <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/pricing")}
              className="border-[hsl(var(--filigree)/0.2)]">
              View Plans
            </Button>
          </motion.div>
        </div>
      </Section>

      {/* Proof metrics */}
      <Section className="py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {LOGOS_PROOF.map((s, i) => (
            <motion.div key={s.label} variants={fadeUp} custom={i} className="text-center">
              <div className="text-3xl font-bold font-fantasy text-[hsl(var(--territory-leadership))]">{s.metric}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </Section>

      <CompanyMarquee />

      {/* Capabilities */}
      <Section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-3xl font-bold text-center mb-4 font-fantasy">
            Full-stack AI readiness platform
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            From ingestion to intervention — everything your L&D and HR teams need to navigate AI disruption.
          </motion.p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CAPABILITIES.map((c, i) => (
              <motion.div key={c.title} variants={fadeUp} custom={i + 2} className="relative rounded-2xl overflow-hidden group">
                <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `hsl(var(--${c.color}))` }} />
                <div className="border border-[hsl(var(--filigree)/0.12)] rounded-2xl p-6 h-full hover:border-[hsl(var(--filigree)/0.3)] transition-all"
                  style={{ background: "hsl(var(--surface-stone))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
                  <div className="h-11 w-11 rounded-xl border border-[hsl(var(--filigree)/0.15)] flex items-center justify-center mb-4"
                    style={{ background: `hsl(var(--${c.color}) / 0.1)` }}>
                    <c.icon className="h-5 w-5" style={{ color: `hsl(var(--${c.color}))` }} />
                  </div>
                  <h3 className="text-base font-bold mb-2 leading-snug font-fantasy">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* How it works — enterprise flow */}
      <Section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-3xl font-bold text-center mb-12 font-fantasy">
            Launch in days, not months
          </motion.h2>
          {[
            { step: "1", title: "Connect your ATS", desc: "Greenhouse, Lever, Ashby — 2-click integration. All roles imported instantly.", icon: Database },
            { step: "2", title: "Review the threat map", desc: "Every department color-coded by AI exposure. Drill into any role for task-level detail.", icon: BarChart3 },
            { step: "3", title: "Deploy simulations", desc: "Assign AI-readiness quests to targeted teams. Track completion and scores in real time.", icon: Sparkles },
            { step: "4", title: "Act on insights", desc: "The War Room surfaces bottlenecks, coaching opportunities, and priority alerts automatically.", icon: Shield },
          ].map((item, i) => (
            <motion.div key={item.step} variants={fadeUp} custom={i + 1} className="flex gap-4 mb-8 last:mb-0">
              <div className="flex-shrink-0 h-10 w-10 rounded-xl border border-[hsl(var(--filigree)/0.2)] flex items-center justify-center"
                style={{ background: "hsl(var(--surface-parchment))" }}>
                <span className="text-sm font-bold font-fantasy text-[hsl(var(--territory-leadership))]">{item.step}</span>
              </div>
              <div>
                <h3 className="text-base font-bold mb-1 font-fantasy">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Security / trust */}
      <Section className="py-12 px-6">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-6">
          {[
            { icon: Lock, title: "SOC 2 Ready", desc: "Enterprise-grade data handling and access controls." },
            { icon: Shield, title: "SSO & SCIM", desc: "Integrate with your identity provider. Auto-provision users." },
            { icon: Layers, title: "Custom Deployment", desc: "On-prem or private cloud options for regulated industries." },
          ].map((item, i) => (
            <motion.div key={item.title} variants={fadeUp} custom={i}
              className="text-center p-6 rounded-2xl border border-[hsl(var(--filigree)/0.12)]"
              style={{ background: "hsl(var(--surface-stone))" }}>
              <item.icon className="h-6 w-6 mx-auto mb-3 text-muted-foreground" />
              <h3 className="text-sm font-bold mb-1 font-fantasy">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center rounded-2xl border border-[hsl(var(--filigree)/0.15)] p-10"
          style={{ background: "hsl(var(--surface-stone))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 8px 32px hsl(var(--emboss-shadow))" }}>
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-3xl font-bold mb-4 font-fantasy">
            Ready to map your workforce?
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-6">
            Talk to our team. Get a pilot running in under a week.
          </motion.p>
          <motion.div variants={fadeUp} custom={2} className="flex items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate("/contact")} className="gap-2">
              Book a Demo <ChevronRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/pricing")}
              className="border-[hsl(var(--filigree)/0.2)]">
              See Pricing
            </Button>
          </motion.div>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
