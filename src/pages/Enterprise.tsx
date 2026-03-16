import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Shield, Lock, Server, Globe,
  Building2, Brain, Target, Zap, CheckCircle2,
  BarChart3, Users, MessageSquare, Wrench, Lightbulb,
  AlertTriangle, RefreshCw, Clock, TrendingUp, Crosshair,
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

/* ── Why Now urgency columns ── */
const urgencyColumns = [
  {
    icon: Zap,
    stat: "Quarterly",
    title: "AI models ship quarterly",
    description: "Every 90 days, new capabilities make yesterday's workflows obsolete.",
  },
  {
    icon: Clock,
    stat: "Annually",
    title: "L&D plans ship annually",
    description: "Most organizations update workforce strategy once a year — if that.",
  },
  {
    icon: AlertTriangle,
    stat: "The Gap",
    title: "That gap is your risk",
    description: "Competitors who close it faster take your market share. Period.",
  },
];

/* ── Strategic proof points ── */
const proofPoints = [
  { metric: "62%", description: "faster role adaptation — your workforce keeps pace with AI, not behind it" },
  { metric: "3.2×", description: "faster than annual L&D — continuous adaptation vs. quarterly reviews" },
  { metric: "$4.1M", description: "average risk reduction from avoided mis-hiring and AI-driven attrition" },
];

/* ── Loop nodes ── */
const loopNodes = [
  {
    id: "map",
    label: "Map",
    icon: Crosshair,
    tagline: "See the exposure",
    description: "Every role, every task — scored for AI exposure in minutes. Not surveys. Not guesswork. Data.",
    highlights: ["Task-level scoring across entire org", "Department & function heatmaps", "400+ roles mapped in a single import"],
  },
  {
    id: "assess",
    label: "Assess",
    icon: Target,
    tagline: "Measure the readiness",
    description: "Calibrated simulations measure each employee across 4 readiness pillars. Not training completion — actual capability.",
    highlights: ["4-pillar scoring model", "Role-specific scenario generation", "Real performance data, not self-reports"],
  },
  {
    id: "train",
    label: "Train",
    icon: Brain,
    tagline: "Close the gaps",
    description: "Targeted practice sessions generated from each employee's actual weak points. No manual L&D design required.",
    highlights: ["Auto-generated from gap analysis", "Adaptive difficulty per employee", "Zero L&D overhead"],
  },
  {
    id: "adapt",
    label: "Adapt",
    icon: RefreshCw,
    tagline: "Evolve continuously",
    description: "Scores below threshold trigger automatic re-simulation with coaching tips. The system never stops improving your people.",
    highlights: ["Autonomous retry with coaching", "Threshold-based triggers", "Continuous — not quarterly"],
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

/* ── Loop Visual ── */
function AdaptiveLoopDiagram({ activeNode, setActiveNode }: {
  activeNode: string | null;
  setActiveNode: (id: string | null) => void;
}) {
  const positions = [
    { x: 50, y: 5 },   // Map — top
    { x: 95, y: 50 },  // Assess — right
    { x: 50, y: 95 },  // Train — bottom
    { x: 5, y: 50 },   // Adapt — left
  ];

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square">
      {/* Rotating orbit ring */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
          strokeDasharray="3 2"
        />
        {/* Animated arc highlight */}
        <motion.circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          strokeDasharray="25 227"
          strokeLinecap="round"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "50px 50px" }}
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Adaptive</p>
          <p className="text-lg font-display font-semibold text-foreground -mt-0.5">Engine</p>
        </div>
      </div>

      {/* Nodes */}
      {loopNodes.map((node, i) => {
        const pos = positions[i];
        const isActive = activeNode === node.id;
        return (
          <motion.button
            key={node.id}
            className={`absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onClick={() => setActiveNode(isActive ? null : node.id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-card border border-border text-foreground group-hover:border-primary/50 group-hover:shadow-md"
            }`}>
              <node.icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <span className={`text-xs font-semibold transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            }`}>
              {node.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ── Expanded node detail ── */
function NodeDetail({ node }: { node: typeof loopNodes[0] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <node.icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-xl font-semibold text-foreground">{node.label}</h3>
          <p className="text-sm text-muted-foreground">{node.tagline}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{node.description}</p>
      <ul className="space-y-1.5">
        {node.highlights.map((h) => (
          <li key={h} className="flex items-center gap-2 text-sm text-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
            {h}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function Enterprise() {
  const navigate = useNavigate();
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const activeNodeData = loopNodes.find((n) => n.id === activeNode) || null;

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
              The Adaptive Workforce Engine
            </span>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-foreground leading-[1.1] mt-4"
          >
            AI is rewriting every role.{" "}
            <span className="italic">We make your workforce ready&nbsp;— continuously.</span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            The companies that win won't just adopt AI tools. They'll have a workforce that knows
            how to work alongside them. Our platform maps exposure, runs calibrated simulations,
            and autonomously adapts your people — every week, not every quarter.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button size="lg" className="gap-2 text-base px-8" onClick={() => navigate("/contact")}>
              Book a Demo <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="gap-2 text-base px-8" onClick={() => navigate("/case-study/anthropic")}>
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

      {/* ── Why Now ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              The urgency is structural
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              AI capabilities compound quarterly. Workforce plans update annually. That gap is where you lose.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {urgencyColumns.map((col, i) => (
              <motion.div
                key={col.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <Card className="h-full border-border/60 text-center">
                  <CardContent className="p-6 sm:p-8 flex flex-col items-center">
                    <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
                      <col.icon className="h-6 w-6 text-foreground" />
                    </div>
                    <p className="font-display text-2xl font-semibold text-foreground mb-1">{col.stat}</p>
                    <h3 className="font-semibold text-sm text-foreground mb-2">{col.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{col.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 text-center text-muted-foreground text-sm max-w-lg mx-auto"
          >
            We close this gap with a system that adapts as fast as AI does.
          </motion.p>
        </div>
      </section>

      {/* ── The Adaptive Workforce Engine (Loop) ── */}
      <section className="px-4 py-20 bg-muted/20 border-y border-border">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-4">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              The Adaptive Workforce Engine
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Not a project. A system. It runs continuously.
            </p>
          </motion.div>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground mb-12"
          >
            Click a node to explore
          </motion.p>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Loop diagram */}
            <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.15 }}>
              <AdaptiveLoopDiagram activeNode={activeNode} setActiveNode={setActiveNode} />
            </motion.div>

            {/* Detail panel */}
            <div className="min-h-[280px] flex items-center">
              <AnimatePresence mode="wait">
                {activeNodeData ? (
                  <NodeDetail key={activeNodeData.id} node={activeNodeData} />
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center w-full"
                  >
                    <TrendingUp className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Select a stage to see how the engine works
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Map → Assess → Train → Adapt — then repeat
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ── Strategic Proof Points ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              Strategic impact, measured
            </h2>
            <p className="mt-3 text-muted-foreground">
              Early enterprise adopters report transformational outcomes.
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
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Case Study</p>
            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
              See how Anthropic audits AI readiness across 400+ roles
            </h3>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Walk through the full platform — from ATS import to executive dashboards — in a 6-step guided tour. No sign-up required.
            </p>
            <Button size="lg" onClick={() => navigate("/case-study/anthropic")} className="gap-2 mt-2">
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
              <motion.div key={t.title} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.05 }}>
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

      {/* ── Final CTA ── */}
      <section className="px-4 py-24 border-t border-border">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              Your competitors are adapting. Are you?
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
              Every workforce will transition. The only question is whether you'll lead it with a living system or react to it with last year's plan.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="gap-2 text-base px-8" onClick={() => navigate("/contact")}>
                Book a Demo <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="gap-2 text-base px-8" onClick={() => navigate("/how-it-works")}>
                How It Works
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
