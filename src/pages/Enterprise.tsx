import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Shield, Lock, Server, Users, BarChart3,
  Brain, Target, TrendingUp, Zap, CheckCircle2,
  Building2, Globe, FileBarChart, Layers, Activity,
  GraduationCap, UserCheck, Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NewsTicker from "@/components/NewsTicker";
import CompanyMarquee from "@/components/CompanyMarquee";

const MARQUEE_ROWS = [
  ["Deloitte", "McKinsey", "Boeing", "FedEx", "Microsoft", "Apple", "Nvidia", "Stripe"],
  ["DeepMind", "CoreWeave", "Glean", "Deel", "Lockheed Martin", "Databricks", "Cohere", "Meta"],
];

/* ── Workflow phases ── */
const phases = [
  {
    number: "01",
    tag: "Diagnose",
    title: "Map your AI exposure",
    description:
      "Ingest your entire workforce — via CSV, HRIS, or API. Our AI Evolution Model scores every role at the task level, surfacing exactly where AI disruption hits hardest.",
    icon: BarChart3,
    features: [
      "Org-wide AI exposure heatmap",
      "Department & function-level risk scores",
      "Task-by-task automation probability",
      "Industry benchmark comparison",
    ],
    audience: "CHRO · VP of HR · CEO",
  },
  {
    number: "02",
    tag: "Upskill",
    title: "Close the gaps before they open",
    description:
      "Auto-generated, role-calibrated learning paths powered by our Simulation Engine. Every employee gets AI-aware practice scenarios tailored to their exact tasks — not generic courses.",
    icon: GraduationCap,
    features: [
      "AI-calibrated simulations per role",
      "Adaptive difficulty & real-time feedback",
      "Progress tracking per employee & team",
      "Skill gap → tool recommendation mapping",
    ],
    audience: "L&D · Managers · HR Business Partners",
  },
  {
    number: "03",
    tag: "Plan",
    title: "Model what comes next",
    description:
      "Translate diagnosis into action. Model headcount impact, identify internal mobility paths, and staff projects by AI-readiness — with hard data, not guesswork.",
    icon: Target,
    features: [
      "Headcount impact modelling",
      "Internal mobility suggestions",
      "Project staffing by AI-readiness score",
      "ROI dashboard: cost & time saved",
    ],
    audience: "Workforce Planning · Finance · COO",
  },
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
  {
    metric: "62%",
    description: "reduction in time-to-competency for AI-augmented roles",
  },
  {
    metric: "3.2×",
    description: "faster workforce transformation vs. traditional L&D programs",
  },
  {
    metric: "$4.1M",
    description: "average annual savings from reduced mis-hiring and attrition",
  },
];

/* ── How it differs ── */
const differentiators = [
  {
    icon: Activity,
    title: "Live signals, not stale reports",
    description: "Our AI Evolution Model updates continuously as AI capabilities change — your workforce strategy stays current, not quarterly.",
  },
  {
    icon: Brain,
    title: "Task-level, not role-level",
    description: "We don't say 'accountants are at risk.' We tell you which 4 of their 12 tasks face automation and which 3 become more valuable.",
  },
  {
    icon: Zap,
    title: "Diagnosis → action in one platform",
    description: "Most tools stop at the heatmap. We auto-generate simulations and learning paths directly from the diagnosis — zero handoff.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

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
              Enterprise Platform
            </span>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-foreground leading-[1.1] mt-4"
          >
            One platform to{" "}
            <span className="italic">diagnose, upskill &amp; plan</span>{" "}
            your workforce for AI
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            See exactly where AI disrupts your workforce at the task level. Auto-generate
            role-calibrated upskilling paths. Model headcount impact with hard data.
            All in one enterprise-grade platform.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button
              size="lg"
              className="gap-2 text-base px-8"
              onClick={() => window.open("https://calendly.com/jacksonlam", "_blank")}
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
              See How It Works
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {stats.map((s) => (
            <motion.div
              key={s.label}
              {...fadeUp}
              className="px-6 py-8 text-center"
            >
              <p className="font-display text-3xl font-semibold text-foreground">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Workflow: Diagnose → Upskill → Plan ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              Three phases. One platform.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Every enterprise follows the same arc — from awareness to action to strategy.
              We built the platform around it.
            </p>
          </motion.div>

          <div className="space-y-12">
            {phases.map((phase, i) => (
              <motion.div
                key={phase.tag}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <Card className="overflow-hidden border-border/60">
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-[200px_1fr] divide-y md:divide-y-0 md:divide-x divide-border/40">
                      {/* Left: Phase indicator */}
                      <div className="flex flex-col items-center justify-center gap-2 py-8 md:py-12 bg-muted/30">
                        <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                          Phase
                        </span>
                        <span className="font-display text-4xl font-semibold text-foreground">
                          {phase.number}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {phase.tag}
                        </span>
                        <phase.icon className="h-6 w-6 text-muted-foreground mt-1" />
                      </div>

                      {/* Right: Content */}
                      <div className="p-6 md:p-8">
                        <h3 className="font-display text-2xl font-semibold text-foreground">
                          {phase.title}
                        </h3>
                        <p className="mt-2 text-muted-foreground leading-relaxed">
                          {phase.description}
                        </p>

                        <ul className="mt-5 grid sm:grid-cols-2 gap-2">
                          {phase.features.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>

                        <p className="mt-5 text-xs tracking-wide text-muted-foreground uppercase">
                          Built for: {phase.audience}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Flow arrow connector */}
          <div className="flex justify-center my-6">
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
              <span className="rounded-full border border-border bg-muted/50 px-4 py-1.5">Diagnose</span>
              <ArrowRight className="h-4 w-4" />
              <span className="rounded-full border border-border bg-muted/50 px-4 py-1.5">Upskill</span>
              <ArrowRight className="h-4 w-4" />
              <span className="rounded-full border border-border bg-muted/50 px-4 py-1.5">Plan</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why different ── */}
      <section className="px-4 py-20 border-t border-border">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              Why this is different
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {differentiators.map((d, i) => (
              <motion.div
                key={d.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.06 }}
              >
                <Card className="h-full border-border/60">
                  <CardContent className="p-6">
                    <d.icon className="h-6 w-6 text-foreground mb-4" />
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {d.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {d.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
                <p className="font-display text-4xl font-semibold text-foreground">
                  {p.metric}
                </p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {p.description}
                </p>
              </motion.div>
            ))}
          </div>
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
              Ready to future-proof your workforce?
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
              Join forward-thinking enterprises that are turning AI disruption into a competitive advantage.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="gap-2 text-base px-8"
                onClick={() => window.open("https://calendly.com/jacksonlam", "_blank")}
              >
                Book a Demo
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 text-base px-8"
                onClick={() => navigate("/contact-org")}
              >
                Contact Sales
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card required · 30-minute setup · Custom onboarding included
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
