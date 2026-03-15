import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Zap, ArrowRight, Layers, Brain, Settings2, Sparkles,
  GraduationCap, Timer, BarChart3, Building2, SlidersHorizontal,
  Play, ClipboardCheck, Users, Target, Puzzle, Compass,
  FileBarChart, BookOpen, ShieldCheck, CheckCircle2, FileText,
  MessageSquare, Award, Crosshair, Radio, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

/* ── Templates (Layer 1) ── */
const templates = [
  {
    name: "Quick Pulse",
    duration: "~3 min",
    format: "5 MCQs",
    useCase: "Upskilling",
    icon: Zap,
    color: "bg-dot-teal/10 text-dot-teal border-dot-teal/20",
    description: "Rapid-fire scenario MCQs testing AI-readiness on a single task. Perfect for daily microlearning or pulse checks.",
    stages: ["5 MCQs"],
  },
  {
    name: "Deep Dive",
    duration: "~15 min",
    format: "Briefing → MCQs → Open Response → Score",
    useCase: "L&D Programs",
    icon: GraduationCap,
    color: "bg-dot-blue/10 text-dot-blue border-dot-blue/20",
    description: "Structured learning module with context briefing, scenario questions, and open-ended analysis. Ideal for formal training programs.",
    stages: ["Briefing", "MCQ ×8", "Open Response"],
  },
  {
    name: "Case Challenge",
    duration: "~30 min",
    format: "Scenario Brief → Multi-step Deliverable → Rubric",
    useCase: "Assessment",
    icon: ClipboardCheck,
    color: "bg-dot-purple/10 text-dot-purple border-dot-purple/20",
    description: "Real-world case study requiring a multi-step deliverable scored against an AI-calibrated rubric. Built for hiring and promotion decisions.",
    stages: ["Scenario Brief", "Multi-step Deliverable", "Rubric Score"],
  },
  {
    name: "Full Panel",
    duration: "~60 min",
    format: "Multiple Task Clusters → Timed Stages → Composite",
    useCase: "Staffing",
    icon: Users,
    color: "bg-dot-amber/10 text-dot-amber border-dot-amber/20",
    description: "Comprehensive multi-stage assessment spanning multiple task clusters. The gold standard for project staffing and workforce planning.",
    stages: ["Task Cluster ×3", "Timed Stages", "Composite Score"],
  },
];

/* ── Calibration signals (Layer 2) ── */
const calibrationSignals = [
  { icon: Building2, title: "Company Context", description: "JD parsing, company scraping, and industry data automatically calibrate every simulation to your specific environment." },
  { icon: Brain, title: "AI State Injection", description: "Real-time data on which AI tools exist for each task, what's being automated, and where human judgment remains critical." },
  { icon: BarChart3, title: "Industry Benchmarks", description: "Peer comparison data shows how similar companies are deploying AI — so simulations reflect market reality, not theory." },
  { icon: Target, title: "Seniority Adjustment", description: "Junior candidates get foundational scenarios. Senior candidates get strategic, multi-variable problems. Same role, right difficulty." },
];

/* ── Simulation Formats (from HowItWorks) ── */
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
          Draft a 3-point recommendation covering <span className="text-primary font-medium">risk assessment</span>,
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

/* ── Scoring Axes ── */
const scoringAxes = [
  { name: "AI Tool Awareness", score: 82, desc: "Can you identify when and how to use AI tools effectively?" },
  { name: "Human Value-Add", score: 91, desc: "Do you focus on the judgment, creativity, and empathy AI can't replicate?" },
  { name: "Adaptive Thinking", score: 74, desc: "Can you pivot your approach when AI changes the rules?" },
  { name: "Domain Judgment", score: 88, desc: "Do you apply deep expertise to validate and direct AI outputs?" },
];

/* ── Calibration Examples ── */
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

/* ── Builder features (Layer 3) ── */
const builderFeatures = [
  { icon: Layers, title: "Drag-and-Drop Stages", description: "Add, remove, and reorder simulation stages visually. Briefings, MCQs, open responses, case deliverables — mix and match." },
  { icon: Timer, title: "Time Limits Per Stage", description: "Set stage-specific time constraints. Quick screening rounds can be tight; deep analysis stages can be generous." },
  { icon: SlidersHorizontal, title: "Scoring Weight Control", description: "Weight the four AI-readiness axes differently per use case. Assessment might weight Domain Judgment higher; upskilling might weight Adaptive Thinking." },
  { icon: Puzzle, title: "Proprietary Scenario Injection", description: "Inject your own scenarios, company-specific data, or internal tooling context. The engine weaves it into the simulation naturally." },
  { icon: Settings2, title: "Evaluation Modes", description: "Choose AI-scored for scale, human-reviewed for nuance, or hybrid for the best of both. Switch modes per stage if needed." },
  { icon: Play, title: "Live Preview", description: "Preview exactly what candidates will experience before deploying. Iterate the simulation design in real time." },
];

/* ── Use cases ── */
const useCases = [
  { icon: GraduationCap, title: "AI Upskilling", template: "Quick Pulse", description: "Daily microlearning simulations that teach employees how AI is changing their specific tasks — and how to work alongside it." },
  { icon: ClipboardCheck, title: "Candidate Assessment", template: "Case Challenge / Full Panel", description: "Score candidates on AI-readiness, not résumé keywords. Auto-generate skill simulations grounded in your role's disruption data." },
  { icon: FileBarChart, title: "Workforce Planning", template: "Bulk Analysis + Heatmaps", description: "Upload your org chart. See AI disruption heatmaps across departments. Allocate L&D budgets to the highest-impact areas." },
  { icon: Compass, title: "Career Transition", template: "Quick Pulse + Pathways", description: "Map skill transfer between roles, identify gaps, and let employees explore new careers through simulations before committing." },
  { icon: BookOpen, title: "L&D Content Engine", template: "Deep Dive", description: "Auto-generate structured learning modules — briefings, scenario MCQs, open responses, and scorecards — for any role and task." },
];

/* ── Live Timeline ── */
function LiveTimeline() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(start.getFullYear() + 3, start.getMonth(), 1);
  const totalMs = end.getTime() - start.getTime();
  const toPercent = (d: Date) => Math.max(0, Math.min(100, ((d.getTime() - start.getTime()) / totalMs) * 100));
  const nowPct = toPercent(now);
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const monthLines: { pct: number; label: string; isYear: boolean }[] = [];
  for (let i = 0; i <= 36; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const pct = toPercent(d);
    const isYear = d.getMonth() === 0;
    const isQuarter = d.getMonth() % 3 === 0;
    if (isYear || isQuarter) monthLines.push({ pct, label: isYear ? d.getFullYear().toString() : `Q${Math.floor(d.getMonth() / 3) + 1}`, isYear });
  }
  const PAD = 4;
  const toLeft = (pct: number) => `${PAD + pct * (100 - 2 * PAD) / 100}%`;

  return (
    <div className="relative px-2 pt-16 pb-16 rounded-xl border border-border/50 bg-muted/30 overflow-hidden">
      {monthLines.map((line) => (
        <div key={line.pct + line.label} className="absolute top-0 bottom-0 flex flex-col items-center" style={{ left: toLeft(line.pct) }}>
          <div className={`w-px h-full ${line.isYear ? "bg-border/60" : "bg-border/25"}`} />
          <span className={`absolute bottom-2 text-[9px] ${line.isYear ? "font-semibold text-foreground/60" : "text-muted-foreground/50"}`}>{line.label}</span>
        </div>
      ))}
      <div className="absolute h-[2px] bg-border/40" style={{ left: toLeft(0), right: toLeft(0), top: "68px" }} />
      <div className="absolute h-[2px] bg-primary/30" style={{ left: toLeft(0), width: `${nowPct * (100 - 2 * PAD) / 100}%`, top: "68px" }} />
      <div className="absolute z-20 flex flex-col items-center" style={{ left: toLeft(nowPct), top: "4px", transform: "translateX(-50%)" }}>
        <span className="text-[9px] font-bold uppercase tracking-wider text-primary-foreground bg-primary rounded-full px-2.5 py-1 whitespace-nowrap shadow-md">{dateStr}</span>
        <span className="text-[9px] font-mono text-primary mt-0.5 whitespace-nowrap">{timeStr}</span>
        <div className="w-px h-4 bg-primary mt-0.5" />
        <div className="h-4 w-4 rounded-full bg-primary shadow-lg shadow-primary/30 ring-4 ring-primary/10" />
      </div>
    </div>
  );
}

const fadeUp = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };
const fadeUpDelay = (d: number) => ({ ...fadeUp, transition: { delay: d } });

export default function SimulationBuilder() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground mb-6">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Simulation Blueprint System
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
              One engine. Four templates.<br />
              <em className="italic">Infinite calibrations.</em>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              A 3-layer architecture that generates role-specific, company-calibrated simulations
              automatically — from quick pulse checks to full-panel assessments.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/contact")} className="gap-2 text-base px-8">
                Request Access <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/analyze")} className="text-base px-8">
                Try a Quick Pulse
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Layer 1: Templates */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Layer 1</span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground mt-2">
              Pre-built simulation templates
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Four battle-tested structures covering every use case — from 3-minute pulse checks to 60-minute staffing panels.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-4">
            {templates.map((t, i) => (
              <motion.div key={t.name} {...fadeUpDelay(i * 0.08)}>
                <Card className="h-full border-border bg-card hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-9 w-9 rounded-lg border flex items-center justify-center ${t.color}`}>
                          <t.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-base">{t.name}</h3>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.useCase}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs font-medium">{t.duration}</span>
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

      {/* Simulation Formats */}
      <section className="px-4 py-16 bg-accent/30">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-[10px] uppercase tracking-wider">Simulation Formats</Badge>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground mb-3">Beyond multiple choice.</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              MCQs work for learning. High-stakes decisions need richer formats. The engine supports all of them.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {formats.map((f, i) => (
              <motion.div key={f.title} {...fadeUpDelay(i * 0.1)}>
                <Card className="h-full border-border bg-card">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <f.icon className="h-4 w-4 text-primary" />
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

      {/* Layer 2: Calibration */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Layer 2</span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground mt-2">AI-driven calibration</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              The AI Evolution Model automatically injects company context, task-level AI state, industry benchmarks,
              and seniority expectations — zero manual configuration.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-4">
            {calibrationSignals.map((s, i) => (
              <motion.div key={s.title} {...fadeUpDelay(i * 0.08)}>
                <Card className="h-full border-border bg-card">
                  <CardContent className="p-6">
                    <s.icon className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold text-foreground text-lg">{s.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Same Role, Different Simulation — with weight distributions */}
      <section className="px-4 py-16 bg-accent/30">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-[10px] uppercase tracking-wider">Auto-Calibration</Badge>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground mb-3">Same role. Different simulation.</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              The AI Evolution Model reads company context — from JDs, industry data, and AI adoption signals — to
              produce simulations tailored to each organization's reality.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-5">
            {calibrationExamples.map((ex, i) => (
              <motion.div key={ex.company} {...fadeUpDelay(i * 0.1)}>
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

      {/* 4-Axis Scoring Framework */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-[10px] uppercase tracking-wider">Scoring Framework</Badge>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground mb-3">Four axes of AI readiness.</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every simulation produces a measurable profile — not a pass/fail. Track growth over time across the dimensions that matter.
            </p>
          </motion.div>
          <motion.div {...fadeUpDelay(0.1)}>
            <Card className="border-border bg-card">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-foreground">AI Readiness Scorecard</span>
                  <Badge className="ml-auto text-[10px] bg-primary/10 text-primary border-primary/20">Example Output</Badge>
                </div>
                <div className="space-y-4">
                  {scoringAxes.map((axis, i) => (
                    <motion.div key={axis.name} {...fadeUpDelay(0.15 + i * 0.06)}>
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

      {/* Layer 3: Workflow Builder */}
      <section className="px-4 py-16 bg-accent/30">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Layer 3</span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground mt-2">Visual workflow builder</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Full control when you need it. Drag-and-drop stages, weight scoring axes, inject proprietary context, and choose evaluation modes.
            </p>
          </motion.div>

          {/* Builder Mockup */}
          <motion.div {...fadeUpDelay(0.1)}>
            <Card className="border-border bg-card mb-10 overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-primary/5 px-6 py-3 border-b border-border flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Workflow Builder</span>
                  <Badge variant="outline" className="ml-auto text-[10px]">Draft</Badge>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">1. Choose Template</label>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {["Quick Pulse", "Deep Dive", "Case Challenge", "Full Panel"].map((t, i) => (
                        <span key={t} className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${i === 2 ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"}`}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">2. Set Context</label>
                    <div className="mt-2 grid grid-cols-3 gap-3">
                      <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">Financial Analyst</div>
                      <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">Goldman Sachs</div>
                      <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground truncate">JD uploaded ✓</div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">3. Customize Stages</label>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {[{ label: "Briefing", time: "2 min" }, { label: "MCQ × 5", time: "8 min" }, { label: "Case Study", time: "15 min" }].map((s, i) => (
                        <div key={s.label} className="flex items-center gap-2">
                          {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                          <div className="rounded-lg border border-border bg-background px-3 py-2 text-center min-w-[80px]">
                            <div className="text-xs font-semibold text-foreground">{s.label}</div>
                            <div className="text-[10px] text-muted-foreground">{s.time}</div>
                          </div>
                        </div>
                      ))}
                      <button className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">+ Add</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">4. Scoring Weights</label>
                    <div className="mt-2 space-y-2">
                      {[{ label: "AI Tool Awareness", pct: 40 }, { label: "Human Value-Add", pct: 30 }, { label: "Domain Judgment", pct: 20 }, { label: "Adaptive Thinking", pct: 10 }].map((axis) => (
                        <div key={axis.label} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-36 shrink-0">{axis.label}</span>
                          <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${axis.pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-foreground w-8 text-right">{axis.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">5. Evaluation Mode</label>
                    <div className="mt-2 flex gap-2">
                      {["AI-scored", "Hybrid", "Human-only"].map((m, i) => (
                        <span key={m} className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${i === 1 ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"}`}>{m}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2 border-t border-border">
                    <Button variant="outline" size="sm" className="gap-1.5"><Play className="h-3.5 w-3.5" /> Preview</Button>
                    <Button size="sm" className="gap-1.5">Deploy <ArrowRight className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {builderFeatures.map((f, i) => (
              <motion.div key={f.title} {...fadeUpDelay(i * 0.06)}>
                <Card className="h-full border-border bg-card">
                  <CardContent className="p-5">
                    <f.icon className="h-6 w-6 text-primary mb-2" />
                    <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{f.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Signal + Timeline */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div {...fadeUp}>
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
            </p>
          </motion.div>
          <motion.div {...fadeUpDelay(0.15)} className="mx-auto max-w-3xl">
            <LiveTimeline />
          </motion.div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-4 py-16 bg-accent/30">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground">Five use cases. One engine.</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Every workforce challenge maps to a simulation blueprint — from individual upskilling to org-wide planning.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((uc, i) => (
              <motion.div key={uc.title} {...fadeUpDelay(i * 0.06)}>
                <Card className="h-full border-border bg-card hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <uc.icon className="h-7 w-7 text-primary" />
                      <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground">{uc.template}</span>
                    </div>
                    <h3 className="font-semibold text-foreground text-lg">{uc.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{uc.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground">
            Build simulations that adapt to your world.
          </h2>
          <p className="mt-3 text-muted-foreground">
            See the Simulation Blueprint System in action with a personalized demo.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate("/contact")} className="gap-2 text-base px-10">
              Request a Demo <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/analyze")} className="text-base px-8">
              Try a Quick Pulse
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
