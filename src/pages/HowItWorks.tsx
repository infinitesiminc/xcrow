import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Zap, Brain, Target, ArrowRight, Clock, Layers,
  BarChart3, Users, Sliders, CheckCircle2, Play,
  FileText, MessageSquare, Award, Crosshair,
  Radio, TrendingUp, Sparkles, GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

/* ── Live Timeline — starts from today, 3 years forward, monthly grid ── */
function getTimelineConfig() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1); // first of current month
  const end = new Date(start.getFullYear() + 3, start.getMonth(), 1); // 3 years later
  return { start, end, now };
}

const AI_MILESTONES = [
  { monthsFromNow: 0, label: "Now", sublabel: "Agent era" },
  { monthsFromNow: 6, label: "Q4 2026", sublabel: "Autonomous agents" },
  { monthsFromNow: 12, label: "2027", sublabel: "Multi-agent systems" },
  { monthsFromNow: 18, label: "Mid 2027", sublabel: "AI colleagues" },
  { monthsFromNow: 24, label: "2028", sublabel: "Frontier roles" },
  { monthsFromNow: 36, label: "2029", sublabel: "Post-AI landscape" },
];

function LiveTimeline() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const config = getTimelineConfig();
  const totalMs = config.end.getTime() - config.start.getTime();
  const totalMonths = 36;

  const toPercent = (date: Date) => {
    const elapsed = date.getTime() - config.start.getTime();
    return Math.max(0, Math.min(100, (elapsed / totalMs) * 100));
  };

  const nowPercent = toPercent(now);
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // Generate monthly grid lines
  const monthLines: { pct: number; label: string; isYear: boolean }[] = [];
  for (let i = 0; i <= totalMonths; i++) {
    const d = new Date(config.start.getFullYear(), config.start.getMonth() + i, 1);
    const pct = toPercent(d);
    const isYear = d.getMonth() === 0;
    const isQuarter = d.getMonth() % 3 === 0;
    if (isYear || isQuarter) {
      monthLines.push({
        pct,
        label: isYear ? d.getFullYear().toString() : `Q${Math.floor(d.getMonth() / 3) + 1}`,
        isYear,
      });
    }
  }

  // Map milestones to dates
  const milestones = AI_MILESTONES.map((m) => {
    const d = new Date(config.start.getFullYear(), config.start.getMonth() + m.monthsFromNow, 1);
    return { ...m, date: d, pct: toPercent(d) };
  });

  const PAD = 4;
  const toLeft = (pct: number) => `${PAD + pct * (100 - 2 * PAD) / 100}%`;

  return (
    <div className="relative px-2 pt-16 pb-12 rounded-xl border border-border/50 bg-muted/30 overflow-hidden">
      {/* Monthly grid lines */}
      {monthLines.map((line) => (
        <div key={line.pct + line.label} className="absolute top-0 bottom-0 flex flex-col items-center" style={{ left: toLeft(line.pct) }}>
          <div className={`w-px h-full ${line.isYear ? "bg-border/60" : "bg-border/25"}`} />
          <span className={`absolute bottom-1 text-[8px] ${line.isYear ? "font-semibold text-foreground/60" : "text-muted-foreground/50"}`}>
            {line.label}
          </span>
        </div>
      ))}

      {/* Track */}
      <div className="absolute h-[2px] bg-border/40" style={{ left: toLeft(0), right: toLeft(0), top: "68px" }} />
      <div className="absolute h-[2px] bg-primary/30" style={{ left: toLeft(0), width: `${nowPercent * (100 - 2 * PAD) / 100}%`, top: "68px" }} />

      {/* Live indicator */}
      <div className="absolute z-20 flex flex-col items-center" style={{ left: toLeft(nowPercent), top: "4px", transform: "translateX(-50%)" }}>
        <span className="text-[9px] font-bold uppercase tracking-wider text-primary-foreground bg-primary rounded-full px-2.5 py-1 whitespace-nowrap shadow-md">
          LIVE
        </span>
        <span className="text-[9px] font-mono text-primary mt-0.5 whitespace-nowrap">{timeStr}</span>
        <div className="w-px h-4 bg-primary mt-0.5" />
        <div className="h-4 w-4 rounded-full bg-primary shadow-lg shadow-primary/30 ring-4 ring-primary/10" />
      </div>

      {/* Milestone dots on rail */}
      {milestones.map((m) => (
        <div
          key={m.label}
          className="absolute z-10 flex flex-col items-center"
          style={{ left: toLeft(m.pct), top: "61px", transform: "translateX(-50%)" }}
        >
          <div className={`h-3 w-3 rounded-full border-2 ${m.date <= now ? "bg-primary/60 border-primary/60" : "bg-card border-border"}`} />
          <span className={`mt-1.5 text-[10px] font-semibold whitespace-nowrap ${m.date <= now ? "text-foreground" : "text-foreground/50"}`}>{m.label}</span>
          <span className="text-[8px] text-muted-foreground mt-0.5 whitespace-nowrap">{m.sublabel}</span>
        </div>
      ))}

      {/* Date label below live dot */}
      <div className="absolute z-10" style={{ left: toLeft(nowPercent), top: "96px", transform: "translateX(-50%)" }}>
        <span className="text-[10px] font-medium text-primary whitespace-nowrap">{dateStr}</span>
      </div>
    </div>
  );
}
  );
}

/* ── Animation helpers ── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.45, delay },
});

/* ─────────────────────────────────────────────
   Section 1 — Blueprint Templates
   ───────────────────────────────────────────── */
const templates = [
  {
    name: "Quick Pulse",
    icon: Zap,
    time: "~3 min",
    stages: ["5 MCQs"],
    useCase: "Individual upskilling",
    color: "bg-dot-teal/10 text-dot-teal border-dot-teal/20",
    description: "Fast check on AI-readiness for a single task. Ideal for daily learning habits.",
  },
  {
    name: "Deep Dive",
    icon: Brain,
    time: "~12 min",
    stages: ["Briefing", "MCQ ×8", "Open Response"],
    useCase: "L&D training programs",
    color: "bg-dot-blue/10 text-dot-blue border-dot-blue/20",
    description: "Structured learning module with context, assessment, and reflection. Perfect for team training.",
  },
  {
    name: "Case Challenge",
    icon: Target,
    time: "~20 min",
    stages: ["Scenario Brief", "Multi-step Deliverable", "Rubric Score"],
    useCase: "Candidate assessment",
    color: "bg-dot-purple/10 text-dot-purple border-dot-purple/20",
    description: "High-stakes evaluation with real-world case study. AI scores against a structured rubric.",
  },
  {
    name: "Full Panel",
    icon: Layers,
    time: "~45 min",
    stages: ["Task Cluster ×3", "Timed Stages", "Composite Score"],
    useCase: "Enterprise staffing",
    color: "bg-dot-amber/10 text-dot-amber border-dot-amber/20",
    description: "Multi-cluster assessment covering an entire role. Produces a comprehensive readiness profile.",
  },
];

/* ─────────────────────────────────────────────
   Section 2 — Simulation Formats
   ───────────────────────────────────────────── */
const formats = [
  {
    title: "MCQ Scenarios",
    icon: CheckCircle2,
    description: "AI-generated multiple-choice questions grounded in real task context. Each option includes rationale explaining why it's right or wrong.",
    visual: (
      <div className="space-y-2.5 mt-4">
        {["Automate with AI pipeline", "Augment with human review", "Keep fully manual", "Outsource entirely"].map((opt, i) => (
          <div key={opt} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs transition-all ${i === 1 ? "border-primary bg-primary/5 text-foreground font-medium" : "border-border text-muted-foreground"}`}>
            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${i === 1 ? "border-primary" : "border-muted-foreground/40"}`}>
              {i === 1 && <div className="h-2 w-2 rounded-full bg-primary" />}
            </div>
            {opt}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Case Deliverables",
    icon: FileText,
    description: "Open-ended scenarios where candidates produce a real work artifact — a recommendation memo, audit plan, or strategy brief.",
    visual: (
      <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Scenario Brief</div>
        <p className="text-xs text-foreground/80 leading-relaxed">
          Your company's quarterly financial close takes 12 days. An AI tool promises to cut it to 4 days.
          Draft a 3-point recommendation to the CFO covering <span className="text-primary font-medium">risk assessment</span>,
          <span className="text-primary font-medium"> pilot plan</span>, and <span className="text-primary font-medium">success metrics</span>.
        </p>
        <div className="mt-3 h-16 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground">Candidate response area</span>
        </div>
      </div>
    ),
  },
  {
    title: "AI Mentor Chat",
    icon: MessageSquare,
    description: "Interactive conversation with an AI mentor that guides learners through scenarios, provides feedback, and adapts difficulty in real-time.",
    visual: (
      <div className="mt-4 space-y-2">
        {[
          { role: "mentor", text: "The marketing team wants to use AI for ad copy. What's your first concern?" },
          { role: "user", text: "Brand consistency — AI might go off-tone without guardrails." },
          { role: "mentor", text: "Good instinct. How would you build those guardrails?" },
        ].map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`rounded-xl px-3 py-1.5 text-xs max-w-[85%] ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/80"}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

/* ─────────────────────────────────────────────
   Section 3 — Scoring Axes
   ───────────────────────────────────────────── */
const scoringAxes = [
  { name: "AI Tool Awareness", score: 82, desc: "Can you identify when and how to use AI tools effectively?" },
  { name: "Human Value-Add", score: 91, desc: "Do you focus on the judgment, creativity, and empathy AI can't replicate?" },
  { name: "Adaptive Thinking", score: 74, desc: "Can you pivot your approach when AI changes the rules?" },
  { name: "Domain Judgment", score: 88, desc: "Do you apply deep expertise to validate and direct AI outputs?" },
];

/* ─────────────────────────────────────────────
   Section 4 — Calibration Example
   ───────────────────────────────────────────── */
const calibrationExamples = [
  {
    company: "Goldman Sachs",
    role: "Financial Analyst",
    focus: ["Bloomberg Terminal AI integration", "Regulatory compliance automation", "Quantitative modeling with AI"],
    weight: { "AI Tool Awareness": 45, "Human Value-Add": 20, "Adaptive Thinking": 10, "Domain Judgment": 25 },
  },
  {
    company: "Series-B Startup",
    role: "Financial Analyst",
    focus: ["FP&A automation with AI", "Cash flow forecasting", "Multi-hat role with AI leverage"],
    weight: { "AI Tool Awareness": 30, "Human Value-Add": 30, "Adaptive Thinking": 25, "Domain Judgment": 15 },
  },
];

/* ─────────────────────────────────────────────
   Section 5 — Workflow Builder Preview
   ───────────────────────────────────────────── */
function WorkflowBuilderMockup() {
  const stages = [
    { label: "Briefing", time: "2 min", color: "bg-dot-teal" },
    { label: "MCQ ×5", time: "8 min", color: "bg-dot-blue" },
    { label: "Case Study", time: "15 min", color: "bg-dot-purple" },
  ];
  const weights = [
    { axis: "AI Tool Awareness", pct: 40 },
    { axis: "Human Value-Add", pct: 30 },
    { axis: "Domain Judgment", pct: 20 },
    { axis: "Adaptive Thinking", pct: 10 },
  ];

  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="border-b border-border px-5 py-3 flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Simulation Blueprint Builder</span>
          </div>
          <Badge variant="outline" className="text-[10px]">Draft</Badge>
        </div>

        <div className="p-5 space-y-5">
          {/* Template selector */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">Template</label>
            <div className="flex gap-2">
              {["Quick Pulse", "Deep Dive", "Case Challenge", "Full Panel"].map((t, i) => (
                <div key={t} className={`rounded-lg border px-3 py-1.5 text-xs cursor-pointer transition-all ${i === 2 ? "border-primary bg-primary/5 text-foreground font-medium" : "border-border text-muted-foreground hover:border-foreground/20"}`}>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Context inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">Role</label>
              <div className="rounded-lg border border-border bg-secondary/20 px-3 py-2 text-xs text-foreground">Financial Analyst</div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">Company</label>
              <div className="rounded-lg border border-border bg-secondary/20 px-3 py-2 text-xs text-foreground">Goldman Sachs</div>
            </div>
          </div>

          {/* Stages */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">Stages</label>
            <div className="flex items-center gap-2">
              {stages.map((s, i) => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className="rounded-lg border border-border bg-card px-3 py-2 text-center min-w-[80px]">
                    <div className={`h-1.5 w-8 rounded-full ${s.color} mx-auto mb-1.5`} />
                    <span className="text-xs font-medium text-foreground block">{s.label}</span>
                    <span className="text-[10px] text-muted-foreground">{s.time}</span>
                  </div>
                  {i < stages.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
                </div>
              ))}
              <button className="h-10 w-10 rounded-lg border border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:border-foreground/40 transition-colors text-lg">
                +
              </button>
            </div>
          </div>

          {/* Scoring weights */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">Scoring Weights</label>
            <div className="space-y-2">
              {weights.map((w) => (
                <div key={w.axis} className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground w-32 shrink-0">{w.axis}</span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${w.pct}%` }} />
                  </div>
                  <span className="text-[11px] font-semibold text-foreground w-8 text-right">{w.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Evaluation mode */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">Evaluation</label>
              <div className="flex gap-1.5 mt-1.5">
                {["AI-scored", "Hybrid", "Human"].map((mode, i) => (
                  <div key={mode} className={`rounded-md px-2.5 py-1 text-[10px] border transition-all ${i === 1 ? "border-primary bg-primary/5 text-foreground font-medium" : "border-border text-muted-foreground"}`}>
                    {mode}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs h-8">
                <Play className="h-3 w-3 mr-1" /> Preview
              </Button>
              <Button size="sm" className="text-xs h-8">
                Deploy <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════ */
export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div {...fadeUp()}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Inside the Engine
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
              One engine. Every format.<br />
              <em className="italic">Infinite configurations.</em>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              From a 3-minute upskill pulse to a 45-minute enterprise panel — the same AI Evolution Model
              calibrates every simulation to the role, the company, and where AI capability is <em>right now</em>.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── 1. Blueprint Templates ── */}
      <section className="px-4 pb-20">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-[10px] uppercase tracking-wider">Simulation Templates</Badge>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground mb-3">
              Four templates. Every stake level.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Choose a starting blueprint that matches the stakes — then customize every detail.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            {templates.map((t, i) => (
              <motion.div key={t.name} {...fadeUp(i * 0.08)}>
                <Card className="h-full border-border bg-card hover:border-primary/20 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-9 w-9 rounded-lg border flex items-center justify-center ${t.color}`}>
                          <t.icon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-base">{t.name}</h3>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.useCase}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs font-medium">{t.time}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{t.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {t.stages.map((s) => (
                        <span key={s} className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground">{s}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Simulation Formats ── */}
      <section className="px-4 py-20 bg-accent/30">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-[10px] uppercase tracking-wider">Simulation Formats</Badge>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground mb-3">
              Beyond multiple choice.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              MCQs work for learning. High-stakes decisions need richer formats. The engine supports all of them.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {formats.map((f, i) => (
              <motion.div key={f.title} {...fadeUp(i * 0.1)}>
                <Card className="h-full border-border bg-card">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <f.icon className="h-4.5 w-4.5 text-primary" />
                      <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                    {f.visual}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. 4-Axis Scoring ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-[10px] uppercase tracking-wider">Scoring Framework</Badge>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground mb-3">
              Four axes of AI readiness.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every simulation produces a measurable profile — not a pass/fail. Track growth over time across the dimensions that matter.
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.1)}>
            <Card className="border-border bg-card">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-foreground">AI Readiness Scorecard</span>
                  <Badge className="ml-auto text-[10px] bg-primary/10 text-primary border-primary/20">Example Output</Badge>
                </div>
                <div className="space-y-4">
                  {scoringAxes.map((axis, i) => (
                    <motion.div key={axis.name} {...fadeUp(0.15 + i * 0.06)}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{axis.name}</span>
                        <span className="text-sm font-bold text-primary">{axis.score}/100</span>
                      </div>
                      <Progress value={axis.score} className="h-2.5 mb-1" />
                      <p className="text-[11px] text-muted-foreground">{axis.desc}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">Overall AI Readiness</span>
                    <span className="text-2xl font-bold text-foreground ml-3">84<span className="text-sm text-muted-foreground font-normal">/100</span></span>
                  </div>
                  <Badge className="bg-dot-teal/10 text-dot-teal border-dot-teal/20">Strong Readiness</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── 4. Calibration: Same Role, Different Company ── */}
      <section className="px-4 py-20 bg-accent/30">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-[10px] uppercase tracking-wider">Auto-Calibration</Badge>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground mb-3">
              Same role. Different simulation.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              The AI Evolution Model reads company context — from JDs, industry data, and AI adoption signals — to
              produce simulations tailored to each organization's reality.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {calibrationExamples.map((ex, i) => (
              <motion.div key={ex.company} {...fadeUp(i * 0.1)}>
                <Card className="h-full border-border bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground text-base">{ex.role}</h3>
                        <span className="text-xs text-primary font-medium">{ex.company}</span>
                      </div>
                      <Crosshair className="h-5 w-5 text-primary/40" />
                    </div>
                    <div className="mb-4">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-2">Simulation Focus</span>
                      <div className="flex flex-wrap gap-1.5">
                        {ex.focus.map((f) => (
                          <span key={f} className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground">{f}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-2">Scoring Weight Distribution</span>
                      <div className="space-y-1.5">
                        {Object.entries(ex.weight).map(([axis, pct]) => (
                          <div key={axis} className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground w-28 shrink-0">{axis}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] font-semibold text-foreground w-7 text-right">{pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Workflow Builder Preview ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-[10px] uppercase tracking-wider">Workflow Builder</Badge>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground mb-3">
              Build. Customize. Deploy.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Start from a template, adjust stages and scoring weights, preview the candidate experience, then deploy — all from one interface.
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.1)}>
            <WorkflowBuilderMockup />
          </motion.div>
        </div>
      </section>

      {/* ── 6. Real-Time Signal ── */}
      <section className="px-4 py-20 bg-accent/30">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div {...fadeUp()}>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-5">
              <Radio className="h-3.5 w-3.5" />
              Live Signal
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground mb-4">
              Every scenario is calibrated to where<br className="hidden sm:block" /> AI is right now — and where it's heading.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              The AI Evolution Model continuously tracks capability progression across every task category.
              When a new AI tool launches, every simulation that touches that skill updates automatically.
              Training that never goes stale.
            </p>
          </motion.div>

          {/* Timeline */}
          <motion.div {...fadeUp(0.15)} className="mx-auto max-w-3xl">
            <LiveTimeline />
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground">
            See it in action.
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Analyze any role in 3 seconds. Run a simulation. Experience the engine yourself.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate("/")} className="gap-2 text-base px-8">
              Try It Free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/platform")} className="text-base px-8">
              Platform Overview
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}