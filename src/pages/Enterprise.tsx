/**
 * /enterprise — B2B landing page for companies & HR teams.
 * Immersive RPG aesthetic matching /how-it-works.
 */
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, BarChart3, Building2, ChevronRight, Database,
  Layers, Lock, Shield, Sparkles, Target, TrendingUp, Users, Zap,
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

const CAPABILITIES = [
  { icon: Database, title: "ATS Integration", desc: "Connect Greenhouse, Lever, or any ATS. Every role ingested and scored automatically.", color: "territory-analytical" },
  { icon: BarChart3, title: "AI Threat Map", desc: "See which departments and roles face the highest AI disruption — down to individual tasks.", color: "territory-creative" },
  { icon: Sparkles, title: "Workforce Simulations", desc: "Deploy AI-readiness simulations across teams. Scored on 4 pillars: tool awareness, judgment, adaptability, human edge.", color: "territory-strategic" },
  { icon: Users, title: "Team Dashboards", desc: "Real-time visibility into readiness scores across departments, seniority levels, and locations.", color: "territory-communication" },
  { icon: Shield, title: "War Room", desc: "Automated bottleneck detection, coaching interventions, and priority alerts — all in one command center.", color: "territory-leadership" },
  { icon: TrendingUp, title: "Model Adaptation", desc: "When a new AI model drops, scores re-calibrate in 24 hours. Your data stays current, always.", color: "territory-humanedge" },
];

const STEPS = [
  { step: "01", title: "Connect your ATS", desc: "Greenhouse, Lever, Ashby — 2-click integration. All roles imported instantly.", icon: Database, color: "var(--territory-analytical)" },
  { step: "02", title: "Review the threat map", desc: "Every department color-coded by AI exposure. Drill into any role for task-level detail.", icon: BarChart3, color: "var(--territory-strategic)" },
  { step: "03", title: "Deploy simulations", desc: "Assign AI-readiness quests to targeted teams. Track completion and scores in real time.", icon: Sparkles, color: "var(--territory-creative)" },
  { step: "04", title: "Act on insights", desc: "The War Room surfaces bottlenecks, coaching opportunities, and priority alerts automatically.", icon: Shield, color: "var(--territory-leadership)" },
];

const STATS = [
  { value: "400+", label: "Roles Analyzed" },
  { value: "50K+", label: "Tasks Scored" },
  { value: "<2min", label: "Time to First Insight" },
  { value: "24hrs", label: "Model Re-calibration" },
];

const TRUST_ITEMS = [
  { icon: Lock, title: "SOC 2 Ready", desc: "Enterprise-grade data handling and access controls." },
  { icon: Shield, title: "SSO & SCIM", desc: "Integrate with your identity provider. Auto-provision users." },
  { icon: Layers, title: "Custom Deployment", desc: "On-prem or private cloud options for regulated industries." },
];

export default function Enterprise() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* ═══ HERO ═══ */}
        <section className="relative min-h-[70vh] flex items-center justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[180px] opacity-15"
              style={{ background: "hsl(var(--territory-leadership))" }} />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[160px] opacity-10"
              style={{ background: "hsl(var(--territory-strategic))" }} />
          </div>

          <motion.div {...fade()} className="text-center max-w-3xl relative z-10">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">
              <Building2 className="inline h-3 w-3 mr-1.5 -mt-0.5" style={{ color: "hsl(var(--territory-leadership))" }} />
              For Enterprise
            </p>
            <h1 className="font-fantasy text-4xl md:text-6xl font-bold mb-4 leading-tight">
              Map AI readiness across
              <br />
              <span style={{ color: "hsl(var(--territory-leadership))" }}>your entire workforce</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-8">
              Connect your ATS. See every role scored for AI disruption. Deploy simulations at scale.
              Turn your team from vulnerable to battle-ready.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/contact")} className="text-base px-8 gap-2"
                style={{ boxShadow: "0 0 20px hsl(var(--territory-leadership) / 0.25)" }}>
                Book a Demo <ArrowRight className="h-4 w-4" />
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
                <p className="text-2xl md:text-3xl font-fantasy font-bold" style={{ color: "hsl(var(--territory-leadership))" }}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══ CAPABILITIES ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">Full-Stack Platform</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">AI Readiness Command Center</h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                From ingestion to intervention — everything your L&D and HR teams need to navigate AI disruption.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {CAPABILITIES.map((c, i) => (
                <motion.div key={c.title} {...fade(i * 0.08)}
                  className="rounded-2xl border border-border/50 p-6 group hover:border-border transition-colors relative overflow-hidden"
                  style={{ background: "hsl(var(--card))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))" }}>
                  <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `hsl(var(--${c.color}))` }} />
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `hsl(var(--${c.color}) / 0.1)`, border: `1px solid hsl(var(--${c.color}) / 0.2)` }}>
                    <c.icon className="h-5 w-5" style={{ color: `hsl(var(--${c.color}))` }} />
                  </div>
                  <h3 className="font-fantasy text-base font-bold mb-2">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="py-20 px-4" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
          <div className="max-w-4xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">Launch in Days</p>
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

        {/* ═══ TRUST ═══ */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div {...fade()} className="text-center mb-10">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">Enterprise Grade</p>
              <h2 className="font-fantasy text-2xl md:text-3xl font-bold">Built for Security & Scale</h2>
            </motion.div>
            <div className="grid sm:grid-cols-3 gap-5">
              {TRUST_ITEMS.map((item, i) => (
                <motion.div key={item.title} {...fade(i * 0.1)}
                  className="text-center rounded-xl border border-border/50 p-6"
                  style={{ background: "hsl(var(--card))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
                  <item.icon className="h-6 w-6 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="font-fantasy text-sm font-bold mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section className="py-24 px-4 relative overflow-hidden" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[200px] opacity-10"
              style={{ background: "hsl(var(--territory-leadership))" }} />
          </div>
          <motion.div {...fade()} className="text-center max-w-lg mx-auto relative z-10">
            <motion.img src={xcrowLogo} alt="Xcrow" className="h-16 w-16 mx-auto mb-6 crow-glow"
              animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
            <h2 className="font-fantasy text-3xl md:text-4xl font-bold mb-4">Ready to map your workforce?</h2>
            <p className="text-muted-foreground mb-8">Talk to our team. Get a pilot running in under a week.</p>
            <div className="flex items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/contact")} className="text-base px-8 gap-2"
                style={{ boxShadow: "0 0 24px hsl(var(--filigree-glow) / 0.3)" }}>
                Book a Demo <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/pricing")}
                className="text-base px-8" style={{ borderColor: "hsl(var(--filigree) / 0.2)" }}>
                See Pricing
              </Button>
            </div>
          </motion.div>
        </section>
      </div>
      <Footer />
    </>
  );
}
