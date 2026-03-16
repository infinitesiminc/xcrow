import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, CheckCircle2, X, RefreshCw, Brain, Target,
  Wrench, Lightbulb, Users, Bot, ShieldAlert, Zap,
  GraduationCap, BarChart3, Car, Building2, TrendingUp,
  MessageSquare, AlertTriangle, Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55 },
};

/* ═══════════════════════════════════════════════════════════════ */
/*  HERO                                                           */
/* ═══════════════════════════════════════════════════════════════ */

function Hero() {
  return (
    <section className="px-4 pt-32 pb-20">
      <div className="mx-auto max-w-4xl text-center">
        <motion.p
          {...fadeUp}
          className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-6"
        >
          From Autonomous Vehicles to Autonomous Teams
        </motion.p>
        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground leading-[1.1]"
        >
          We built simulations for{" "}
          <span className="italic">machines</span>.
          <br />
          Now we build them for{" "}
          <span className="italic">people</span>.
        </motion.h1>
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mx-auto mt-8 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed"
        >
          Autonomous driving sims test millions of edge cases so vehicles improve without crashing.
          Smart city sims model traffic, energy, and population flows so infrastructure adapts in real time.
          The workforce is the most complex system of all — it deserves the same rigour.
        </motion.p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  ORIGIN — AV ANALOGY                                            */
/* ═══════════════════════════════════════════════════════════════ */

const ANALOGIES = [
  {
    icon: Car,
    domain: "Autonomous Driving",
    principle: "Test millions of scenarios before anything goes live",
    workforce: "Every employee faces role-specific AI scenarios before exposure hits their actual work",
  },
  {
    icon: Building2,
    domain: "Smart Cities",
    principle: "Continuously recalibrate models against live data",
    workforce: "Scores recalibrate automatically with every new model release — no manual curriculum updates",
  },
  {
    icon: RefreshCw,
    domain: "Closed-Loop Systems",
    principle: "Failures trigger immediate retraining cycles",
    workforce: "Weak pillar scores auto-queue targeted retry simulations with coaching tips",
  },
  {
    icon: BarChart3,
    domain: "Scale Without Compromise",
    principle: "Run millions of simulations in parallel",
    workforce: "Assess thousands of employees simultaneously — same fidelity, no bottleneck",
  },
];

function OriginSection() {
  return (
    <section className="px-4 py-20 border-t border-border">
      <div className="mx-auto max-w-6xl">
        <motion.div {...fadeUp} className="mb-12">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Design Principles
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground leading-tight max-w-3xl">
            Four principles borrowed from autonomous systems — applied to your workforce
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6">
          {ANALOGIES.map((a, i) => (
            <motion.div
              key={a.domain}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-xl border border-border bg-card p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                  <a.icon className="h-5 w-5 text-foreground" />
                </div>
                <span className="text-sm font-semibold text-foreground">{a.domain}</span>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">In engineering:</span> {a.principle}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">In workforce:</span> {a.workforce}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  STATUS QUO — WHY NOT SURVEYS / CERTS                           */
/* ═══════════════════════════════════════════════════════════════ */

const STATUS_QUO = [
  {
    label: "Surveys",
    verdict: "Guess",
    confidence: "Low",
    shelfLife: "2 weeks",
    signal: "Self-reported",
    flaws: [
      "Employees game responses",
      "No behavioral measurement",
      "Stale before results are compiled",
    ],
    icon: AlertTriangle,
    failed: true,
  },
  {
    label: "Certifications",
    verdict: "Expire",
    confidence: "Medium",
    shelfLife: "6 months",
    signal: "Point-in-time",
    flaws: [
      "Generic curriculum — not role-specific",
      "Can't keep pace with monthly model releases",
      "No company context or tool awareness",
    ],
    icon: GraduationCap,
    failed: true,
  },
  {
    label: "Simulations",
    verdict: "Prove",
    confidence: "High",
    shelfLife: "Continuous",
    signal: "Behavioral & real-time",
    flaws: [
      "Role-specific, company-calibrated scenarios",
      "Auto-updates with every new model release",
      "Measures reasoning, not recall",
    ],
    icon: Target,
    failed: false,
  },
];

function StatusQuoSection() {
  return (
    <section className="px-4 py-20 border-t border-border">
      <div className="mx-auto max-w-6xl">
        <motion.div {...fadeUp} className="mb-12 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-4">
            The Problem
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground leading-tight max-w-3xl mx-auto">
            Why surveys and certifications can't solve this
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            18 frontier models released in 120 days. Your last skills assessment was 6 months ago.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {STATUS_QUO.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className={`rounded-xl border p-6 space-y-4 ${
                s.failed
                  ? "border-border bg-card"
                  : "border-brand-human/30 bg-brand-human/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <s.icon className={`h-5 w-5 ${s.failed ? "text-muted-foreground" : "text-brand-human"}`} />
                  <span className="font-semibold text-foreground">{s.label}</span>
                </div>
                <span className={`text-xs font-mono font-bold px-2 py-1 rounded-full ${
                  s.failed
                    ? "bg-destructive/10 text-destructive"
                    : "bg-brand-human/10 text-brand-human"
                }`}>
                  {s.verdict}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Confidence</p>
                  <p className="font-medium text-foreground">{s.confidence}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Shelf life</p>
                  <p className="font-medium text-foreground">{s.shelfLife}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/50">
                {s.flaws.map((f, j) => (
                  <div key={j} className="flex items-start gap-2 text-sm">
                    {s.failed ? (
                      <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-brand-human shrink-0 mt-0.5" />
                    )}
                    <span className="text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  ENGINE DESIGN — VISUAL EXAMPLES                                */
/* ═══════════════════════════════════════════════════════════════ */

function IngestionVisual() {
  const sources = [
    { name: "Greenhouse ATS", count: 400 },
    { name: "CSV Upload", count: 85 },
    { name: "JD Paste", count: 12 },
  ];
  const lenses = [
    { label: "AI Exposure", value: 67, color: "bg-brand-human" },
    { label: "Replace Risk", value: 22, color: "bg-brand-ai" },
    { label: "Upskill Urgency", value: 56, color: "bg-brand-mid" },
  ];
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="space-y-1.5">
        {sources.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2"
          >
            <span className="text-sm font-medium">{s.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">{s.count} roles</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-brand-human" />
            </div>
          </motion.div>
        ))}
      </div>
      <div className="pt-2 border-t border-border/40">
        <p className="text-[11px] text-muted-foreground mb-2">Each role scored across 3 lenses:</p>
        <div className="grid grid-cols-3 gap-2">
          {lenses.map((l, i) => (
            <motion.div
              key={l.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="text-center space-y-1"
            >
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${l.value}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7 + i * 0.1, duration: 0.6 }}
                  className={`h-full rounded-full ${l.color}`}
                />
              </div>
              <p className="text-xs font-mono font-bold">{l.value}%</p>
              <p className="text-[10px] text-muted-foreground">{l.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SimChatVisual() {
  const messages = [
    { role: "system" as const, text: "Your AI tool flagged two liability clauses in the vendor contract as non-standard. What's your next step?" },
    { role: "user" as const, text: "Review manually — AI misses contextual nuances in jurisdiction-specific indemnity language. I'd cross-reference with standard terms first." },
    { role: "assistant" as const, text: "Strong response. You identified the AI's limitation and proposed systematic human review." },
  ];
  const formats = [
    { name: "Quick Pulse", duration: "5 min", color: "text-brand-human" },
    { name: "Deep Dive", duration: "15 min", color: "text-brand-mid" },
    { name: "Case Challenge", duration: "25 min", color: "text-brand-ai" },
  ];
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="space-y-2">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.12 }}
            className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {m.role === "user" ? <Users className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
            </div>
            <div className={`text-xs leading-relaxed rounded-lg px-3 py-2 max-w-[85%] ${
              m.role === "user" ? "bg-primary text-primary-foreground"
              : m.role === "system" ? "bg-muted/50 border border-border italic text-muted-foreground"
              : "bg-muted/30 border border-border text-muted-foreground"
            }`}>
              {m.text}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="pt-2 border-t border-border/40 flex items-center gap-3">
        {formats.map((f) => (
          <div key={f.name} className="flex items-center gap-1.5 text-[10px]">
            <span className={`font-bold ${f.color}`}>●</span>
            <span className="text-muted-foreground">{f.name} · {f.duration}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PillarScoreVisual() {
  const pillars = [
    { icon: Wrench, label: "Tool Awareness", score: 72 },
    { icon: ShieldAlert, label: "Human Value-Add", score: 85 },
    { icon: Brain, label: "Adaptive Thinking", score: 58, weak: true },
    { icon: Lightbulb, label: "Domain Judgment", score: 91 },
  ];
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="grid grid-cols-2 gap-3">
        {pillars.map((p, i) => (
          <motion.div
            key={p.label}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className={`rounded-lg border p-3 space-y-2 ${p.weak ? "border-brand-ai/30 bg-brand-ai/5" : "border-border/50"}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <p.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">{p.label}</span>
              </div>
              <span className={`text-sm font-mono font-bold ${
                p.score >= 80 ? "text-dot-teal" : p.score >= 60 ? "text-dot-amber" : "text-dot-purple"
              }`}>{p.score}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${p.score}%` }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.6 }}
                className={`h-full rounded-full ${
                  p.score >= 80 ? "bg-dot-teal" : p.score >= 60 ? "bg-dot-amber" : "bg-dot-purple"
                }`}
              />
            </div>
            {p.weak && (
              <p className="text-[10px] text-dot-amber flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Below threshold — retry queued
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AdaptiveLoopVisual() {
  const events = [
    { icon: Zap, label: "New model released", time: "T+0h", color: "bg-dot-amber/10 text-dot-amber" },
    { icon: Brain, label: "34 task clusters reclassified", time: "T+2h", color: "bg-dot-blue/10 text-dot-blue" },
    { icon: RefreshCw, label: "Simulations regenerated", time: "T+6h", color: "bg-dot-purple/10 text-dot-purple" },
    { icon: Users, label: "127 employees re-queued", time: "T+24h", color: "bg-dot-teal/10 text-dot-teal" },
  ];
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      {events.map((e, i) => (
        <motion.div
          key={e.label}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + i * 0.1 }}
          className="flex items-center gap-3 rounded-lg border border-border/40 px-3 py-2.5"
        >
          <span className="text-xs font-mono font-bold text-muted-foreground w-10 shrink-0">{e.time}</span>
          <div className={`w-7 h-7 rounded-full ${e.color} flex items-center justify-center shrink-0`}>
            <e.icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm text-foreground">{e.label}</span>
          {i < events.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 ml-auto" />}
        </motion.div>
      ))}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8 }}
        className="text-[11px] text-muted-foreground text-center pt-1 flex items-center justify-center gap-1.5"
      >
        <RefreshCw className="h-3 w-3 text-dot-teal" /> No curriculum redesign. No committee. Fully automatic.
      </motion.p>
    </div>
  );
}

const ENGINE_STEPS = [
  {
    phase: "01",
    title: "Ingest & decompose every role",
    desc: "Job descriptions flow in from your ATS, CSV, or paste. The engine breaks each role into task clusters and scores AI exposure, replace risk, and upskill urgency — three lenses that tell you exactly where to act.",
    icon: Wrench,
    visual: <IngestionVisual />,
  },
  {
    phase: "02",
    title: "Generate role-specific simulations",
    desc: "Each task cluster becomes a simulation calibrated to the employee's actual work. Format is deterministic: low-complexity tasks get Quick Pulses, high-impact tasks get Case Challenges. No guesswork.",
    icon: Brain,
    visual: <SimChatVisual />,
  },
  {
    phase: "03",
    title: "Measure four pillars of readiness",
    desc: "Every response is scored across four pillars: Tool Awareness, Human Value-Add, Adaptive Thinking, and Domain Judgment. Scores below 60% trigger targeted retries — not generic courses.",
    icon: Target,
    visual: <PillarScoreVisual />,
  },
  {
    phase: "04",
    title: "Close the loop — automatically",
    desc: "New model released? The engine recalibrates every score and re-queues affected employees. Three failures escalate to the manager with specific recommendations.",
    icon: RefreshCw,
    visual: <AdaptiveLoopVisual />,
  },
];

function EngineSection() {
  return (
    <section className="px-4 py-20 border-t border-border">
      <div className="mx-auto max-w-5xl">
        <motion.div {...fadeUp} className="mb-14 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Engine Design
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground leading-tight max-w-3xl mx-auto">
            How the simulation engine delivers
          </h2>
        </motion.div>

        <div className="space-y-20">
          {ENGINE_STEPS.map((step, i) => (
            <motion.div
              key={step.phase}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55 }}
              className={`grid md:grid-cols-2 gap-8 items-start ${i % 2 === 1 ? "md:direction-rtl" : ""}`}
            >
              <div className="space-y-4" style={{ direction: "ltr" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted/50 border border-border flex items-center justify-center">
                    <step.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <span className="text-sm font-mono font-bold text-muted-foreground">{step.phase}</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
              <div style={{ direction: "ltr" }}>
                {step.visual}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  FEEDBACK LOOP VISUALIZATION                                    */
/* ═══════════════════════════════════════════════════════════════ */

const LOOP_NODES = [
  { label: "New model release", icon: Zap, color: "bg-dot-amber/10 text-dot-amber" },
  { label: "Engine recalibrates scores", icon: RefreshCw, color: "bg-dot-blue/10 text-dot-blue" },
  { label: "Simulations regenerated", icon: Brain, color: "bg-dot-purple/10 text-dot-purple" },
  { label: "Employees re-assessed", icon: Users, color: "bg-muted" },
  { label: "Weak pillars retrained", icon: Target, color: "bg-dot-teal/10 text-dot-teal" },
  { label: "Org readiness updated", icon: TrendingUp, color: "bg-muted" },
];

function FeedbackLoopSection() {
  return (
    <section className="px-4 py-20 border-t border-border">
      <div className="mx-auto max-w-5xl">
        <motion.div {...fadeUp} className="mb-12 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Always Adapting
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground leading-tight max-w-3xl mx-auto">
            The feedback loop that keeps your workforce ahead
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Every new model release triggers a chain reaction — no manual intervention, no curriculum committees.
          </p>
        </motion.div>

        {/* Loop visualization */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {LOOP_NODES.map((node, i) => (
            <motion.div
              key={node.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="relative rounded-xl border border-border bg-card p-5 flex items-center gap-4"
            >
              <div className="absolute -top-3 -left-1 text-xs font-mono font-bold text-muted-foreground bg-background px-2">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className={`w-10 h-10 rounded-full ${node.color} flex items-center justify-center shrink-0`}>
                <node.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-foreground">{node.label}</span>
              {i < LOOP_NODES.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 absolute -right-3 top-1/2 -translate-y-1/2 hidden md:block" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Loop-back indicator */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex items-center justify-center mt-6 gap-2 text-sm text-muted-foreground"
        >
          <RefreshCw className="h-4 w-4 text-dot-teal" />
          <span>Loop repeats with every frontier model — GPT-5, Gemini 3, Claude 5, and beyond</span>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  CTA                                                            */
/* ═══════════════════════════════════════════════════════════════ */

function CTASection() {
  const navigate = useNavigate();
  return (
    <section className="px-4 py-20 border-t border-border">
      <div className="mx-auto max-w-3xl text-center">
        <motion.div {...fadeUp} className="space-y-6">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
            See the engine in action
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Walk through a real deployment — 400+ roles at Anthropic decomposed, simulated, and tracked in real time.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Button size="lg" onClick={() => navigate("/case-study/anthropic")}>
              View Case Study
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/contact")}>
              Book a Demo
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  PAGE                                                           */
/* ═══════════════════════════════════════════════════════════════ */

export default function SimulationDesign() {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <OriginSection />
      <StatusQuoSection />
      <EngineSection />
      <FeedbackLoopSection />
      <CTASection />
    </div>
  );
}
