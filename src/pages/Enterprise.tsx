import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Shield, Lock, Server, Users, BarChart3,
  Brain, Target, Zap, CheckCircle2,
  Building2, Globe, Layers, MessageSquare,
  GraduationCap, AlertTriangle, RefreshCw,
  Wrench, Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NewsTicker from "@/components/NewsTicker";
import CompanyMarquee from "@/components/CompanyMarquee";

const MARQUEE_ROWS = [
  ["Deloitte", "McKinsey", "Boeing", "FedEx", "Microsoft", "Apple", "Nvidia", "Stripe"],
  ["DeepMind", "CoreWeave", "Glean", "Deel", "Lockheed Martin", "Databricks", "Cohere", "Meta"],
];

/* ── Stats ── */
const stats = [
  { value: "100M+", label: "Roles analyzed" },
  { value: "<3s", label: "Analysis speed" },
  { value: "4,200+", label: "Task-level data points" },
  { value: "98%", label: "Enterprise uptime SLA" },
];

/* ── Enterprise trust signals ── */
const trustFeatures = [
  { icon: Lock, title: "SOC 2 Type II", description: "Audited annually with continuous monitoring" },
  { icon: Shield, title: "GDPR compliant", description: "Data residency controls, DPA included" },
  { icon: Server, title: "SSO & SCIM", description: "Okta, Azure AD, Google Workspace" },
  { icon: Globe, title: "Data residency", description: "Choose EU, US, or APAC data regions" },
];

/* ── Customer proof points ── */
const proofPoints = [
  { metric: "62%", description: "reduction in time-to-competency for AI-augmented roles" },
  { metric: "3.2×", description: "faster workforce transformation vs. traditional L&D programs" },
  { metric: "$4.1M", description: "average annual savings from reduced mis-hiring and attrition" },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

/* ── Simplified product visual components ── */

function DiagnoseVisual() {
  const depts = [
    { name: "Engineering", roles: 89, exposure: 74, color: "bg-dot-amber" },
    { name: "Legal", roles: 34, exposure: 61, color: "bg-dot-amber" },
    { name: "Marketing", roles: 42, exposure: 68, color: "bg-dot-amber" },
    { name: "Finance", roles: 28, exposure: 82, color: "bg-dot-purple" },
    { name: "Operations", roles: 55, exposure: 45, color: "bg-dot-teal" },
    { name: "Product", roles: 38, exposure: 71, color: "bg-dot-amber" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          AI Exposure by Department
        </span>
      </div>
      {depts.map((d, i) => (
        <motion.div
          key={d.name}
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }}
          style={{ transformOrigin: "left" }}
          className="flex items-center gap-2"
        >
          <span className="text-[11px] text-muted-foreground w-20 truncate">{d.name}</span>
          <div className="flex-1 h-4 bg-muted/30 rounded overflow-hidden">
            <div className={`h-full rounded ${d.color}`} style={{ width: `${d.exposure}%`, opacity: 0.7 }} />
          </div>
          <span className="text-[11px] font-mono font-medium w-8 text-right">{d.exposure}%</span>
        </motion.div>
      ))}
    </div>
  );
}

function UpskillVisual() {
  const pillars = [
    { icon: Wrench, label: "Tool Awareness", score: 72 },
    { icon: Users, label: "Human Value-Add", score: 85 },
    { icon: Brain, label: "Adaptive Thinking", score: 58 },
    { icon: Lightbulb, label: "Domain Judgment", score: 91 },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          AI Readiness Scoring
        </span>
      </div>
      {/* Mini chat mockup */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Brain className="h-2.5 w-2.5" />
          </div>
          <div className="text-[11px] bg-muted/50 border border-border/50 rounded-lg px-2.5 py-1.5 italic text-muted-foreground max-w-[80%]">
            The AI flags two liability clauses. What's your next step?
          </div>
        </div>
        <div className="flex gap-2 flex-row-reverse">
          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Users className="h-2.5 w-2.5 text-primary-foreground" />
          </div>
          <div className="text-[11px] bg-primary text-primary-foreground rounded-lg px-2.5 py-1.5 max-w-[80%]">
            Review manually — AI misses contextual legal nuances…
          </div>
        </div>
      </div>
      {/* Pillar scores */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {pillars.map((p) => (
          <div key={p.label} className="flex items-center gap-1.5 text-[11px]">
            <p.icon className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{p.label}</span>
            <span className={`font-mono font-bold ml-auto ${
              p.score >= 80 ? "text-dot-teal" : p.score >= 60 ? "text-dot-amber" : "text-dot-purple"
            }`}>{p.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanVisual() {
  const kpis = [
    { label: "Org Readiness", value: "67%", delta: "+12%" },
    { label: "Assessed", value: "312/400", delta: "78%" },
    { label: "Avg Score", value: "71%", delta: "+8%" },
    { label: "Velocity", value: "4.2/wk", delta: "per emp" },
  ];

  const bottlenecks = [
    { task: "Contract Review", failures: 18, score: 38 },
    { task: "Financial Modeling", failures: 14, score: 42 },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Target className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Executive Dashboard
        </span>
      </div>
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-2">
        {kpis.map((k) => (
          <div key={k.label} className="text-center">
            <p className="text-sm font-bold">{k.value}</p>
            <p className="text-[9px] text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>
      {/* Bottleneck preview */}
      <div className="border-t border-border/40 pt-2 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 text-dot-amber" />
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Bottleneck Tasks</span>
        </div>
        {bottlenecks.map((b) => (
          <div key={b.task} className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-muted/30">
            <span>{b.task}</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{b.failures} failures</span>
              <span className="font-mono font-bold text-dot-purple">{b.score}%</span>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1">
          <RefreshCw className="h-2.5 w-2.5" />
          <span>Adaptive retries auto-queued</span>
        </div>
      </div>
    </div>
  );
}

/* ── Phase data with visuals ── */
const phases = [
  {
    number: "01",
    tag: "Diagnose",
    title: "See where AI hits your workforce",
    description: "Connect your ATS or upload roles. Every task is scored for AI exposure — not guesswork, not surveys.",
    highlights: ["Task-level scoring, not role-level", "400+ roles mapped in minutes", "Department & function heatmaps"],
    visual: <DiagnoseVisual />,
  },
  {
    number: "02",
    tag: "Upskill",
    title: "Close gaps with calibrated practice",
    description: "Auto-generated simulations tailored to each role's actual tasks. Scored across 4 readiness pillars.",
    highlights: ["AI-calibrated per role & task", "Adaptive difficulty", "Real-time pillar scoring"],
    visual: <UpskillVisual />,
  },
  {
    number: "03",
    tag: "Plan",
    title: "Live dashboards, not quarterly PDFs",
    description: "Track readiness across departments. Flag bottlenecks. The system acts autonomously with adaptive retries.",
    highlights: ["Org-wide readiness score", "Bottleneck detection", "Automated coaching interventions"],
    visual: <PlanVisual />,
  },
];

export default function Enterprise() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* ── Ticker ── */}
      <div className="px-4 pt-4 mx-auto max-w-4xl">
        <NewsTicker />
      </div>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pt-12 pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground mb-6">
              <Building2 className="h-3.5 w-3.5" />
              The AI Transition Platform
            </span>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-foreground leading-[1.1] mt-4"
          >
            Every workforce will transition.{" "}
            <span className="italic">We make it measurable.</span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            You audit financial risk quarterly. Your AI workforce risk isn't audited at all.
            We score every role at the task level, close gaps through calibrated simulations,
            and give you a live readiness dashboard — not a consultant's PDF.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button
              size="lg"
              className="gap-2 text-base px-8"
              onClick={() => navigate("/contact")}
            >
              Book a Demo
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 text-base px-8"
              onClick={() => navigate("/case-study/anthropic")}
            >
              See Anthropic Case Study
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Trusted by ── */}
      <section className="px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
            Trusted by teams at leading organizations
          </p>
          <CompanyMarquee rows={MARQUEE_ROWS} />
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {stats.map((s) => (
            <motion.div key={s.label} {...fadeUp} className="px-6 py-8 text-center">
              <p className="font-display text-3xl font-semibold text-foreground">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Workflow: Diagnose → Upskill → Plan with product visuals ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              Three phases. One platform.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              From awareness to action to strategy — built for the CEO and board, not just L&D.
            </p>
          </motion.div>

          <div className="space-y-10">
            {phases.map((phase, i) => (
              <motion.div
                key={phase.tag}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <Card className="overflow-hidden border-border/60">
                  <CardContent className="p-0">
                    <div className={`grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/40 ${
                      i % 2 === 1 ? "md:direction-rtl" : ""
                    }`}>
                      {/* Text side */}
                      <div className="p-6 md:p-8 flex flex-col justify-center" style={{ direction: "ltr" }}>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                            Phase {phase.number}
                          </span>
                          <span className="text-xs font-semibold text-foreground bg-muted rounded-full px-2.5 py-0.5">
                            {phase.tag}
                          </span>
                        </div>
                        <h3 className="font-display text-xl sm:text-2xl font-semibold text-foreground">
                          {phase.title}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                          {phase.description}
                        </p>
                        <ul className="mt-4 space-y-1.5">
                          {phase.highlights.map((h) => (
                            <li key={h} className="flex items-center gap-2 text-sm text-foreground">
                              <CheckCircle2 className="h-3.5 w-3.5 text-dot-teal shrink-0" />
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Visual side */}
                      <div className="p-5 md:p-6 bg-muted/20 flex items-center" style={{ direction: "ltr" }}>
                        {phase.visual}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Flow arrow connector */}
          <div className="flex justify-center my-8">
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
              <span className="rounded-full border border-border bg-muted/50 px-4 py-1.5">Diagnose</span>
              <ArrowRight className="h-4 w-4" />
              <span className="rounded-full border border-border bg-muted/50 px-4 py-1.5">Upskill</span>
              <ArrowRight className="h-4 w-4" />
              <span className="rounded-full border border-border bg-muted/50 px-4 py-1.5">Plan</span>
            </div>
          </div>

          <div className="text-center">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/how-it-works")}>
              Learn how it works in detail <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Proof points ── */}
      <section className="px-4 py-20 bg-muted/30 border-y border-border">
        <div className="mx-auto max-w-4xl">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              Measured impact
            </h2>
            <p className="mt-3 text-muted-foreground">
              Early enterprise adopters report transformational results.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {proofPoints.map((p, i) => (
              <motion.div
                key={p.metric}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="text-center"
              >
                <p className="font-display text-4xl font-semibold text-foreground">{p.metric}</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Case Study CTA ── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <motion.div
            {...fadeUp}
            className="rounded-2xl border border-border bg-card p-8 sm:p-10 text-center space-y-4"
          >
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Case Study
            </p>
            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
              See how Anthropic audits AI readiness across 400+ roles
            </h3>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Walk through the full platform — from ATS import to executive dashboards — in a
              6-step guided tour. No sign-up required.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/case-study/anthropic")}
              className="gap-2 mt-2"
            >
              Start the Tour <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Enterprise trust ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              Enterprise-grade from day one
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Built for security-conscious organizations. Your data stays yours.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {trustFeatures.map((t, i) => (
              <motion.div
                key={t.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.05 }}
              >
                <Card className="h-full border-border/60 text-center">
                  <CardContent className="p-6 flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                      <t.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">{t.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 py-24 border-t border-border">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              Don't guess. Measure.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
              Every workforce will transition. The only question is whether you'll lead it with data or react to it with panic.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="gap-2 text-base px-8"
                onClick={() => navigate("/contact")}
              >
                Book a Demo
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 text-base px-8"
                onClick={() => navigate("/how-it-works")}
              >
                How It Works
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
