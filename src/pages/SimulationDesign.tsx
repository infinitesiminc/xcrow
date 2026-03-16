import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Layers, Brain, Target, Sparkles, Gauge, Zap, BookOpen,
  ArrowRight, CheckCircle2, Settings2, Users, Bot, ShieldAlert,
  GraduationCap, BarChart3, Database, MessageSquare, AlertTriangle,
  RefreshCw, Wrench, Lightbulb, Building2, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

/* ── Simulation Formats ── */
const FORMATS = [
  {
    name: "Quick Pulse",
    score: "3–5",
    duration: "5 min",
    icon: Zap,
    description: "Fast awareness check for low-complexity tasks where AI involvement is minimal.",
    when: "Mostly Human tasks • Low impact • Helpful priority",
    color: "bg-dot-teal/10 text-dot-teal",
  },
  {
    name: "Deep Dive",
    score: "6–8",
    duration: "15 min",
    icon: BookOpen,
    description: "Thorough multi-stage scenario covering nuanced human-AI collaboration.",
    when: "Human+AI tasks • Medium impact • Important priority",
    color: "bg-dot-amber/10 text-dot-amber",
  },
  {
    name: "Case Challenge",
    score: "9+",
    duration: "25 min",
    icon: Target,
    description: "Full case study with branching decisions. Strategic thinking under AI-driven change.",
    when: "Mostly AI tasks • High impact • Critical priority",
    color: "bg-dot-purple/10 text-dot-purple",
  },
];

/* ── Scoring factors ── */
const SCORING_FACTORS = [
  { factor: "AI State", options: "Mostly Human (1) → Human+AI (2) → Mostly AI (3)", icon: Brain },
  { factor: "Impact Level", options: "Low (1) → Medium (2) → High (3)", icon: Gauge },
  { factor: "Priority", options: "Helpful (1) → Important (2) → Critical (3)", icon: Target },
  { factor: "Skill Count", options: "1–2 (+0) → 3–4 (+1) → 5+ (+2)", icon: Sparkles },
];

export default function SimulationDesign() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground mb-4">
              <Layers className="h-3.5 w-3.5" />
              How It Works
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold text-foreground leading-tight tracking-tight">
              The AI Transition,<br />deconstructed
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
              Three phases. Measurable at every step. Here's exactly how the platform takes your
              workforce from unknown exposure to auditable readiness.
            </p>
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button onClick={() => navigate("/case-study/anthropic")} className="gap-2">
                See It in Action <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/contact")}>
                Book a Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════ */}
      {/* PHASE 1: DIAGNOSE                                       */}
      {/* ════════════════════════════════════════════════════════ */}
      <section className="px-4 py-16 border-t border-border">
        <div className="mx-auto max-w-5xl">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Phase 01</span>
              <span className="text-xs font-semibold bg-dot-blue/10 text-dot-blue rounded-full px-2.5 py-0.5">Diagnose</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-2">
              Map your AI exposure at the task level
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mb-10">
              Connect your ATS, upload a CSV, or paste job descriptions. The AI Evolution Model scores
              every role's tasks — not the role title — producing a quantified exposure map across your entire org.
            </p>
          </motion.div>

          {/* How ingestion works */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { icon: Database, title: "Ingest", desc: "Connect Greenhouse, Lever, Workday — or upload CSV/JD. We pull every role, department, and location." },
              { icon: Layers, title: "Decompose", desc: "Each role is broken into 6–12 task clusters. Every task is scored for AI exposure (0–100%) and job impact." },
              { icon: BarChart3, title: "Score", desc: "Scores aggregate into department heatmaps, org-wide distributions, and ranked exposure tables." },
            ].map((step, i) => (
              <motion.div key={step.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Card className="h-full border-border/60">
                  <CardContent className="p-5">
                    <div className="h-9 w-9 rounded-lg bg-dot-blue/10 flex items-center justify-center mb-3">
                      <step.icon className="h-4.5 w-4.5 text-dot-blue" />
                    </div>
                    <h3 className="text-sm font-semibold mb-1">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Three lenses */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">Three Lenses on Every Role</h3>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Bot, title: "AI Exposure", value: "67%", barColor: "bg-dot-blue", definition: "Percentage of tasks where AI is actively involved — augmenting or performing.", formula: "Tasks with AI ÷ Total tasks" },
              { icon: ShieldAlert, title: "Replacement Risk", value: "22%", barColor: "bg-destructive", definition: "Tasks classified as 'Mostly AI' — performable end-to-end with minimal human oversight.", formula: "Mostly AI tasks ÷ Total tasks" },
              { icon: GraduationCap, title: "Upskill Urgency", value: "56%", barColor: "bg-dot-purple", definition: "Weighted measure of tasks demanding immediate attention based on priority and impact.", formula: "(Critical × 1.0 + High × 0.5) ÷ Total" },
            ].map((m, i) => (
              <motion.div key={m.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Card className="h-full border-border/60">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <m.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">{m.title}</span>
                      <span className="text-xs text-muted-foreground ml-auto font-mono">e.g. {m.value}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{m.definition}</p>
                    <div className="bg-muted/30 rounded px-2.5 py-1.5 mb-3">
                      <p className="text-[10px] text-muted-foreground font-mono">{m.formula}</p>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full rounded-full ${m.barColor}`} style={{ width: m.value }} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════ */}
      {/* PHASE 2: UPSKILL                                        */}
      {/* ════════════════════════════════════════════════════════ */}
      <section className="px-4 py-16 border-t border-border bg-card/50">
        <div className="mx-auto max-w-5xl">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Phase 02</span>
              <span className="text-xs font-semibold bg-dot-amber/10 text-dot-amber rounded-full px-2.5 py-0.5">Upskill</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-2">
              Close gaps through calibrated simulations
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mb-10">
              Every simulation is auto-generated from the diagnosis — calibrated to the employee's actual role,
              tasks, and company context. Not generic e-learning. Practice that matches the job.
            </p>
          </motion.div>

          {/* Simulation architecture */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">Three-Layer Simulation Architecture</h3>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              { step: "01", title: "Template", icon: Layers, desc: "Industry-validated scenario frameworks with role-specific question banks and scoring rubrics." },
              { step: "02", title: "Calibration", icon: Brain, desc: "AI injects company-specific context from job descriptions, real tool workflows, and seniority-based difficulty." },
              { step: "03", title: "Customization", icon: Settings2, desc: "Adjustable duration, custom scoring weights per competency, department-specific branching." },
            ].map((layer, i) => (
              <motion.div key={layer.step} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Card className="h-full border-border/60">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-dot-amber/10 flex items-center justify-center">
                        <layer.icon className="h-4 w-4 text-dot-amber" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{layer.step}</p>
                        <p className="text-sm font-semibold">{layer.title}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{layer.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Format assignment */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">Deterministic Format Assignment</h3>
            <p className="text-xs text-muted-foreground mb-6 max-w-2xl">
              Each task is scored across four dimensions. The total determines which simulation format
              provides the right depth and challenge level.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {SCORING_FACTORS.map((sf, i) => (
              <motion.div key={sf.factor} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Card className="border-border/60">
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <sf.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs font-semibold">{sf.factor}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{sf.options}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {FORMATS.map((fmt, i) => (
              <motion.div key={fmt.name} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Card className="h-full border-border/60">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-full ${fmt.color} flex items-center justify-center`}>
                        <fmt.icon className="h-4 w-4" />
                      </div>
                      <Badge variant="secondary" className="text-[10px]">Score: {fmt.score}</Badge>
                    </div>
                    <h3 className="text-sm font-semibold mb-0.5">{fmt.name}</h3>
                    <p className="text-[11px] text-muted-foreground mb-2">~{fmt.duration}</p>
                    <p className="text-xs text-muted-foreground mb-3">{fmt.description}</p>
                    <div className="bg-muted/30 rounded px-2.5 py-1.5">
                      <p className="text-[10px] text-muted-foreground">
                        <span className="font-semibold text-foreground">Best for: </span>{fmt.when}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Four pillars */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">Four Pillars of AI Readiness</h3>
            <p className="text-xs text-muted-foreground mb-6 max-w-2xl">
              Every simulation scores the employee across four complementary dimensions —
              measuring how well they work <em>alongside</em> AI, not just whether they know the tools.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Wrench, title: "Tool Awareness", desc: "Can the employee identify when and how to use AI tools for this task?" },
              { icon: Users, title: "Human Value-Add", desc: "Does the employee understand what uniquely human judgment this task requires?" },
              { icon: Brain, title: "Adaptive Thinking", desc: "Can they adjust their approach when AI capabilities change or fail?" },
              { icon: Lightbulb, title: "Domain Judgment", desc: "Do they apply deep domain expertise to validate and improve AI outputs?" },
            ].map((pillar, i) => (
              <motion.div key={pillar.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Card className="border-border/60">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <pillar.icon className="h-4 w-4 text-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-0.5">{pillar.title}</p>
                        <p className="text-xs text-muted-foreground">{pillar.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════ */}
      {/* PHASE 3: PLAN                                           */}
      {/* ════════════════════════════════════════════════════════ */}
      <section className="px-4 py-16 border-t border-border">
        <div className="mx-auto max-w-5xl">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Phase 03</span>
              <span className="text-xs font-semibold bg-dot-teal/10 text-dot-teal rounded-full px-2.5 py-0.5">Plan</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-2">
              Live dashboards, autonomous interventions
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mb-10">
              The platform doesn't just report — it acts. Bottleneck detection, adaptive retry queues,
              and coaching recommendations run continuously. Your board sees a live readiness score, not a quarterly deck.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { icon: TrendingUp, title: "Executive Dashboard", desc: "Org-wide readiness score, department breakdowns, velocity metrics. Updated in real-time as employees complete simulations." },
              { icon: AlertTriangle, title: "Action Center", desc: "Automatically flags bottleneck tasks and employees needing coaching. Prioritizes where HR should intervene." },
              { icon: RefreshCw, title: "Adaptive Engine", desc: "When an employee scores below threshold, the system auto-queues a retry with personalized coaching tips. Up to 3 attempts before escalation." },
            ].map((feature, i) => (
              <motion.div key={feature.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Card className="h-full border-border/60">
                  <CardContent className="p-5">
                    <div className="h-9 w-9 rounded-lg bg-dot-teal/10 flex items-center justify-center mb-3">
                      <feature.icon className="h-4.5 w-4.5 text-dot-teal" />
                    </div>
                    <h3 className="text-sm font-semibold mb-1">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* The adaptive loop */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Card className="border-border/60">
              <CardContent className="p-6">
                <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">The Adaptive Loop</h3>
                <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                  {[
                    { label: "Employee completes simulation", icon: MessageSquare },
                    { label: "Pillar scores calculated", icon: Target },
                    { label: "Below 60%? Auto-retry queued", icon: RefreshCw },
                    { label: "Coaching tip generated", icon: Lightbulb },
                    { label: "3 fails? Escalated to HR", icon: AlertTriangle },
                  ].map((step, i) => (
                    <div key={step.label} className="flex items-center gap-2">
                      {i > 0 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />}
                      <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs">
                        <step.icon className="h-3 w-3 text-muted-foreground" />
                        {step.label}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 py-16 bg-card/50 border-t border-border">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-3">
              See the full platform in action
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto">
              Walk through all three phases with real Anthropic data — from ATS import to executive
              dashboards — in our guided case study.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={() => navigate("/case-study/anthropic")} className="gap-2">
                Anthropic Case Study <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/contact")}>
                Book a Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
