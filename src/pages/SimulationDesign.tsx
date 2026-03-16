import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Layers, Brain, Target, Zap, BookOpen,
  ArrowRight, CheckCircle2, Users, Bot, ShieldAlert,
  GraduationCap, BarChart3, Database, MessageSquare, AlertTriangle,
  RefreshCw, Wrench, Lightbulb, Building2, TrendingUp,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6 },
};

/* ═══════════════════════════════════════════════════════════════ */
/*  ANIMATED VISUAL COMPONENTS                                     */
/* ═══════════════════════════════════════════════════════════════ */

function IngestionVisual() {
  const sources = [
    { name: "Greenhouse ATS", count: 217, status: "synced" },
    { name: "CSV Upload", count: 45, status: "synced" },
    { name: "JD Paste", count: 12, status: "synced" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3 w-full">
      <div className="flex items-center gap-2 mb-2">
        <Database className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Data Ingestion Pipeline
        </span>
      </div>
      {sources.map((s, i) => (
        <motion.div
          key={s.name}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i * 0.12, duration: 0.4 }}
          className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-4 py-2.5"
        >
          <span className="text-sm text-foreground font-medium">{s.name}</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-muted-foreground">{s.count} roles</span>
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 + i * 0.12, type: "spring" }}
            >
              <CheckCircle2 className="h-4 w-4 text-dot-teal" />
            </motion.div>
          </div>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1 }}
        className="text-center pt-1"
      >
        <span className="text-xs text-muted-foreground">274 roles decomposed into </span>
        <span className="text-xs font-semibold text-foreground">2,194 task clusters</span>
      </motion.div>
    </div>
  );
}

function ThreeLensesVisual() {
  const lenses = [
    { icon: Bot, title: "AI Exposure", value: 67, color: "bg-dot-blue", desc: "Tasks where AI is active" },
    { icon: ShieldAlert, title: "Replace Risk", value: 22, color: "bg-destructive", desc: "Mostly-AI tasks" },
    { icon: GraduationCap, title: "Upskill Urgency", value: 56, color: "bg-dot-purple", desc: "Weighted by priority" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 w-full">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Three Lenses on Every Role
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {lenses.map((l, i) => (
          <motion.div
            key={l.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
            className="text-center space-y-2"
          >
            <div className="mx-auto w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center">
              <l.icon className="h-5 w-5 text-foreground" />
            </div>
            <p className="text-xs font-semibold text-foreground">{l.title}</p>
            <div className="relative h-2 w-full rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${l.value}%` }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${l.color}`}
              />
            </div>
            <p className="text-lg font-bold font-mono text-foreground">{l.value}%</p>
            <p className="text-xs text-muted-foreground">{l.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SimulationVisual() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3 w-full">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Live Simulation Preview
        </span>
      </div>
      {/* Chat exchange */}
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex gap-3"
        >
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
            <Brain className="h-3.5 w-3.5" />
          </div>
          <div className="text-sm bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-muted-foreground max-w-[85%]">
            <em>Your AI assistant flagged two liability clauses in the vendor contract as non-standard. What's your next step?</em>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="flex gap-3 flex-row-reverse"
        >
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
            <Users className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div className="text-sm bg-primary text-primary-foreground rounded-xl px-4 py-2.5 max-w-[85%]">
            Review manually — AI misses contextual nuances in jurisdiction-specific indemnity language…
          </div>
        </motion.div>
      </div>
      {/* Pillar scores */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40"
      >
        {[
          { icon: Wrench, label: "Tool Awareness", score: 72 },
          { icon: Users, label: "Human Value-Add", score: 85 },
          { icon: Brain, label: "Adaptive Thinking", score: 58 },
          { icon: Lightbulb, label: "Domain Judgment", score: 91 },
        ].map((p, i) => (
          <motion.div
            key={p.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1 + i * 0.08 }}
            className="flex items-center gap-2 text-sm"
          >
            <p.icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{p.label}</span>
            <span className={`font-mono font-bold ml-auto ${
              p.score >= 80 ? "text-dot-teal" : p.score >= 60 ? "text-dot-amber" : "text-dot-purple"
            }`}>{p.score}%</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function FormatAssignmentVisual() {
  const formats = [
    { name: "Quick Pulse", range: "3–5", duration: "5 min", icon: Zap, color: "bg-dot-teal/10 text-dot-teal", width: "33%" },
    { name: "Deep Dive", range: "6–8", duration: "15 min", icon: BookOpen, color: "bg-dot-amber/10 text-dot-amber", width: "66%" },
    { name: "Case Challenge", range: "9+", duration: "25 min", icon: Target, color: "bg-dot-purple/10 text-dot-purple", width: "100%" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3 w-full">
      <div className="flex items-center gap-2 mb-2">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Deterministic Format Assignment
        </span>
      </div>
      {formats.map((f, i) => (
        <motion.div
          key={f.name}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + i * 0.12, duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <div className={`w-8 h-8 rounded-full ${f.color} flex items-center justify-center shrink-0`}>
            <f.icon className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-foreground">{f.name}</span>
              <span className="text-xs text-muted-foreground">Score {f.range} · ~{f.duration}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: f.width }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.12, duration: 0.6, ease: "easeOut" }}
                className={`h-full rounded-full ${f.color.split(" ")[0].replace("/10", "")}`}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AdaptiveLoopVisual() {
  const steps = [
    { icon: MessageSquare, label: "Simulation completed", color: "bg-muted" },
    { icon: Target, label: "Pillar scores calculated", color: "bg-muted" },
    { icon: AlertTriangle, label: "Below 60%? Retry queued", color: "bg-dot-amber/10" },
    { icon: Lightbulb, label: "Coaching tip generated", color: "bg-dot-teal/10" },
    { icon: RefreshCw, label: "3 fails → escalated to HR", color: "bg-dot-purple/10" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 w-full">
      <div className="flex items-center gap-2 mb-4">
        <RefreshCw className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          The Adaptive Loop
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {steps.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.12, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <div className={`w-9 h-9 rounded-full ${s.color} flex items-center justify-center shrink-0`}>
              <s.icon className="h-4 w-4 text-foreground" />
            </div>
            {i > 0 && (
              <motion.div
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + i * 0.12 }}
                className="absolute -mt-10 ml-[17px] w-px h-4 bg-border"
                style={{ transformOrigin: "top" }}
              />
            )}
            <span className="text-sm text-foreground">{s.label}</span>
            {i < steps.length - 1 && (
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DashboardVisual() {
  const kpis = [
    { label: "Org Readiness", value: "67%", delta: "+12%" },
    { label: "Assessed", value: "312/400", delta: "78%" },
    { label: "Avg Score", value: "71%", delta: "+8%" },
    { label: "Velocity", value: "4.2/wk", delta: "per emp" },
  ];

  const depts = [
    { name: "Engineering", score: 74, count: 89 },
    { name: "Legal", score: 61, count: 34 },
    { name: "Marketing", score: 68, count: 42 },
    { name: "Finance", score: 58, count: 28 },
    { name: "Product", score: 76, count: 38 },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4 w-full">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Executive Dashboard
        </span>
      </div>
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="text-center rounded-lg border border-border/50 bg-muted/20 py-3"
          >
            <p className="text-lg font-bold font-mono">{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </motion.div>
        ))}
      </div>
      {/* Department bars */}
      <div className="space-y-2">
        {depts.map((d, i) => (
          <motion.div
            key={d.name}
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + i * 0.06, duration: 0.4 }}
            style={{ transformOrigin: "left" }}
            className="flex items-center gap-3"
          >
            <span className="text-sm text-muted-foreground w-24 truncate">{d.name}</span>
            <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${d.score >= 70 ? "bg-dot-teal" : d.score >= 60 ? "bg-dot-amber" : "bg-dot-purple"}`}
                style={{ width: `${d.score}%`, opacity: 0.7 }}
              />
            </div>
            <span className="text-sm font-mono font-semibold w-10 text-right">{d.score}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  PHASE SECTIONS                                                 */
/* ═══════════════════════════════════════════════════════════════ */

interface PhaseProps {
  number: string;
  tag: string;
  tagColor: string;
  title: string;
  subtitle: string;
  bullets: string[];
  visuals: React.ReactNode[];
  reversed?: boolean;
}

function PhaseSection({ number, tag, tagColor, title, subtitle, bullets, visuals, reversed }: PhaseProps) {
  return (
    <section className="px-4 py-20 border-t border-border">
      <div className="mx-auto max-w-6xl">
        {/* Phase header */}
        <motion.div {...fadeUp} className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">
              Phase {number}
            </span>
            <span className={`text-sm font-semibold rounded-full px-3 py-1 ${tagColor}`}>
              {tag}
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground leading-tight mb-4">
            {title}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        </motion.div>

        {/* Content: text + visuals */}
        <div className={`grid lg:grid-cols-2 gap-10 items-start ${reversed ? "lg:direction-rtl" : ""}`}>
          {/* Bullets side */}
          <motion.div {...fadeUp} className="space-y-4" style={{ direction: "ltr" }}>
            {bullets.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                className="flex items-start gap-3"
              >
                <CheckCircle2 className="h-5 w-5 text-dot-teal shrink-0 mt-0.5" />
                <p className="text-base text-foreground leading-relaxed">{b}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Visuals side */}
          <div className="space-y-5" style={{ direction: "ltr" }}>
            {visuals.map((v, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.1 }}
              >
                {v}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                      */
/* ═══════════════════════════════════════════════════════════════ */

export default function SimulationDesign() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pt-24 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6">
              <Layers className="h-4 w-4" />
              Why Simulation
            </div>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground leading-[1.1] tracking-tight"
          >
            Why simulation is the{" "}
            <span className="italic">only answer</span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed"
          >
            Surveys guess. Certifications expire. Simulations prove readiness in real-time —
            calibrated to your roles, your company context, and every new model release.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"
          >
            <Button size="lg" onClick={() => navigate("/case-study/anthropic")} className="gap-2 text-base px-8">
              See It in Action <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/contact")} className="text-base px-8">
              Book a Demo
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Phase flow indicator ── */}
      <div className="flex justify-center py-6">
        <motion.div
          {...fadeUp}
          className="flex items-center gap-3 text-sm font-medium text-muted-foreground"
        >
          <span className="rounded-full border border-border bg-dot-blue/10 text-dot-blue px-4 py-1.5 font-semibold">Diagnose</span>
          <ArrowRight className="h-4 w-4" />
          <span className="rounded-full border border-border bg-dot-amber/10 text-dot-amber px-4 py-1.5 font-semibold">Upskill</span>
          <ArrowRight className="h-4 w-4" />
          <span className="rounded-full border border-border bg-dot-teal/10 text-dot-teal px-4 py-1.5 font-semibold">Plan</span>
        </motion.div>
      </div>

      {/* ── Phase 01: Diagnose ── */}
      <PhaseSection
        number="01"
        tag="Diagnose"
        tagColor="bg-dot-blue/10 text-dot-blue"
        title="Map your AI exposure at the task level"
        subtitle="Connect your ATS, upload a CSV, or paste job descriptions. Every role is decomposed into tasks and scored — not guesswork, not surveys."
        bullets={[
          "Connect Greenhouse, upload CSV, or paste JDs. Every role, department, and location ingested automatically.",
          "Each role is broken into 6–12 task clusters. Every task scored for AI Exposure (0–100%) and Job Impact.",
          "Three lenses on every role: AI Exposure, Replacement Risk, and Upskill Urgency — quantified, not estimated.",
          "Scores aggregate into department heatmaps, org-wide distributions, and ranked exposure tables.",
        ]}
        visuals={[<IngestionVisual />, <ThreeLensesVisual />]}
      />

      {/* ── Phase 02: Upskill ── */}
      <PhaseSection
        number="02"
        tag="Upskill"
        tagColor="bg-dot-amber/10 text-dot-amber"
        title="Close gaps through calibrated simulations"
        subtitle="Auto-generated simulations tailored to each role's actual tasks — calibrated by company context, seniority, and AI state. Not generic e-learning."
        bullets={[
          "Three-layer architecture: Template frameworks, AI-driven calibration with company context, and seniority-based difficulty.",
          "Deterministic format assignment — Quick Pulse (5 min), Deep Dive (15 min), or Case Challenge (25 min) — based on task complexity scores.",
          "Every simulation scores across four readiness pillars: Tool Awareness, Human Value-Add, Adaptive Thinking, and Domain Judgment.",
          "Open chat format where AI evaluates free-text reasoning, specificity, and depth — not multiple choice.",
        ]}
        visuals={[<SimulationVisual />, <FormatAssignmentVisual />]}
        reversed
      />

      {/* ── Phase 03: Plan ── */}
      <PhaseSection
        number="03"
        tag="Plan"
        tagColor="bg-dot-teal/10 text-dot-teal"
        title="Live dashboards, autonomous interventions"
        subtitle="The platform doesn't just report — it acts. Bottleneck detection, adaptive retry queues, and coaching run continuously. Your board sees a live readiness score."
        bullets={[
          "Executive dashboard with org-wide readiness score, department breakdowns, and velocity metrics — updated in real-time.",
          "Action Center flags bottleneck tasks and employees needing coaching. Prioritizes where HR should intervene.",
          "Scores below 60% in any pillar auto-trigger retry simulations with personalized coaching tips — up to 3 attempts before escalation.",
          "Adaptive loop runs autonomously: simulate → score → coach → retry → escalate. No manual intervention needed.",
        ]}
        visuals={[<DashboardVisual />, <AdaptiveLoopVisual />]}
      />

      {/* ── CTA ── */}
      <section className="px-4 py-24 border-t border-border bg-card/50">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-5" />
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-4">
              See the full platform in action
            </h2>
            <p className="text-base text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
              Walk through all three phases with real Anthropic data — from ATS import to executive
              dashboards — in our guided case study.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/case-study/anthropic")} className="gap-2 text-base px-8">
                Anthropic Case Study <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/contact")} className="text-base px-8">
                Book a Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
