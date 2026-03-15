import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap, ArrowRight, Layers, Brain, Settings2, Sparkles,
  GraduationCap, Timer, BarChart3, Building2, SlidersHorizontal,
  Play, ClipboardCheck, Users, Target, Puzzle, Compass, GitBranch,
  Map, TrendingUp, FileBarChart, BookOpen, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const templates = [
  {
    name: "Quick Pulse",
    duration: "~3 min",
    format: "5 MCQs",
    useCase: "Upskilling",
    icon: Zap,
    description: "Rapid-fire scenario MCQs testing AI-readiness on a single task. Perfect for daily microlearning or pulse checks.",
  },
  {
    name: "Deep Dive",
    duration: "~15 min",
    format: "Briefing → MCQs → Open Response → Score",
    useCase: "L&D Programs",
    icon: GraduationCap,
    description: "Structured learning module with context briefing, scenario questions, and open-ended analysis. Ideal for formal training programs.",
  },
  {
    name: "Case Challenge",
    duration: "~30 min",
    format: "Scenario Brief → Multi-step Deliverable → Rubric",
    useCase: "Assessment",
    icon: ClipboardCheck,
    description: "Real-world case study requiring a multi-step deliverable scored against an AI-calibrated rubric. Built for hiring and promotion decisions.",
  },
  {
    name: "Full Panel",
    duration: "~60 min",
    format: "Multiple Task Clusters → Timed Stages → Composite",
    useCase: "Staffing",
    icon: Users,
    description: "Comprehensive multi-stage assessment spanning multiple task clusters. The gold standard for project staffing and workforce planning.",
  },
];

const calibrationSignals = [
  {
    icon: Building2,
    title: "Company Context",
    description: "JD parsing, company scraping, and industry data automatically calibrate every simulation to your specific environment.",
  },
  {
    icon: Brain,
    title: "AI State Injection",
    description: "Real-time data on which AI tools exist for each task, what's being automated, and where human judgment remains critical.",
  },
  {
    icon: BarChart3,
    title: "Industry Benchmarks",
    description: "Peer comparison data shows how similar companies are deploying AI — so simulations reflect market reality, not theory.",
  },
  {
    icon: Target,
    title: "Seniority Adjustment",
    description: "Junior candidates get foundational scenarios. Senior candidates get strategic, multi-variable problems. Same role, right difficulty.",
  },
];

const builderFeatures = [
  {
    icon: Layers,
    title: "Drag-and-Drop Stages",
    description: "Add, remove, and reorder simulation stages visually. Briefings, MCQs, open responses, case deliverables — mix and match.",
  },
  {
    icon: Timer,
    title: "Time Limits Per Stage",
    description: "Set stage-specific time constraints. Quick screening rounds can be tight; deep analysis stages can be generous.",
  },
  {
    icon: SlidersHorizontal,
    title: "Scoring Weight Control",
    description: "Weight the four AI-readiness axes differently per use case. Assessment might weight Domain Judgment higher; upskilling might weight Adaptive Thinking.",
  },
  {
    icon: Puzzle,
    title: "Proprietary Scenario Injection",
    description: "Inject your own scenarios, company-specific data, or internal tooling context. The engine weaves it into the simulation naturally.",
  },
  {
    icon: Settings2,
    title: "Evaluation Modes",
    description: "Choose AI-scored for scale, human-reviewed for nuance, or hybrid for the best of both. Switch modes per stage if needed.",
  },
  {
    icon: Play,
    title: "Live Preview",
    description: "Preview exactly what candidates will experience before deploying. Iterate the simulation design in real time.",
  },
];

const differentiators = [
  {
    role: "Financial Analyst",
    companyA: "Goldman Sachs",
    companyB: "Series-B Startup",
    focusA: "Quantitative modeling, regulatory compliance, Bloomberg Terminal AI integration",
    focusB: "FP&A automation, cash flow forecasting, wearing multiple hats with AI tools",
  },
  {
    role: "Software Engineer",
    companyA: "Google",
    companyB: "Healthcare SaaS",
    focusA: "Large-scale systems, ML pipeline integration, code review with AI copilots",
    focusB: "HIPAA compliance automation, EHR integrations, rapid prototyping with AI",
  },
];

const fadeUp = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

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
              <Button size="lg" onClick={() => navigate("/contact-org")} className="gap-2 text-base px-8">
                Request Access <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/how-it-works")} className="text-base px-8">
                See How It Works
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
              <motion.div key={t.name} {...fadeUp} transition={{ delay: i * 0.08 }}>
                <Card className="h-full border-border bg-card hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <t.icon className="h-8 w-8 text-primary" />
                      <div className="flex gap-2">
                        <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground">{t.duration}</span>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-foreground">{t.useCase}</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground text-lg">{t.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{t.format}</p>
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{t.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Layer 2: Calibration */}
      <section className="px-4 py-16 bg-accent/30">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Layer 2</span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground mt-2">
              AI-driven calibration
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              The AI Evolution Model automatically injects company context, task-level AI state, industry benchmarks,
              and seniority expectations — zero manual configuration.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-4">
            {calibrationSignals.map((s, i) => (
              <motion.div key={s.title} {...fadeUp} transition={{ delay: i * 0.08 }}>
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

      {/* Differentiator: Same Role, Different Simulation */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <motion.div {...fadeUp} className="text-center mb-10">
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground">
              Same role. Different simulation.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              The calibration layer tailors every simulation to company context — automatically.
            </p>
          </motion.div>
          <div className="space-y-6">
            {differentiators.map((d, i) => (
              <motion.div key={d.role} {...fadeUp} transition={{ delay: i * 0.1 }}>
                <Card className="border-border bg-card overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-primary/5 px-6 py-3 border-b border-border">
                      <h3 className="font-semibold text-foreground">{d.role}</h3>
                    </div>
                    <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                      <div className="p-5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">at {d.companyA}</span>
                        <p className="text-sm text-foreground mt-2 leading-relaxed">{d.focusA}</p>
                      </div>
                      <div className="p-5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">at {d.companyB}</span>
                        <p className="text-sm text-foreground mt-2 leading-relaxed">{d.focusB}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Layer 3: Customization / Workflow Builder */}
      <section className="px-4 py-16 bg-accent/30">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Layer 3</span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground mt-2">
              Visual workflow builder
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Full control when you need it. Drag-and-drop stages, weight scoring axes, inject proprietary context, and choose evaluation modes.
            </p>
          </motion.div>

          {/* Builder Mockup */}
          <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
            <Card className="border-border bg-card mb-10 overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-primary/5 px-6 py-3 border-b border-border flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Workflow Builder</span>
                </div>
                <div className="p-6 space-y-6">
                  {/* Template selector */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">1. Choose Template</label>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {["Quick Pulse", "Deep Dive", "Case Challenge", "Full Panel"].map((t, i) => (
                        <span key={t} className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${i === 2 ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"}`}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Context */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">2. Set Context</label>
                    <div className="mt-2 grid grid-cols-3 gap-3">
                      <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">Financial Analyst</div>
                      <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">Goldman Sachs</div>
                      <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground truncate">JD uploaded ✓</div>
                    </div>
                  </div>

                  {/* Stages */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">3. Customize Stages</label>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {[
                        { label: "Briefing", time: "2 min" },
                        { label: "MCQ × 5", time: "8 min" },
                        { label: "Case Study", time: "15 min" },
                      ].map((s, i) => (
                        <div key={s.label} className="flex items-center gap-2">
                          {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                          <div className="rounded-lg border border-border bg-background px-3 py-2 text-center min-w-[80px]">
                            <div className="text-xs font-semibold text-foreground">{s.label}</div>
                            <div className="text-[10px] text-muted-foreground">{s.time}</div>
                          </div>
                        </div>
                      ))}
                      <button className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* Scoring */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">4. Scoring Weights</label>
                    <div className="mt-2 space-y-2">
                      {[
                        { label: "AI Tool Awareness", pct: 40 },
                        { label: "Human Value-Add", pct: 30 },
                        { label: "Domain Judgment", pct: 20 },
                        { label: "Adaptive Thinking", pct: 10 },
                      ].map((axis) => (
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

                  {/* Eval mode */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">5. Evaluation Mode</label>
                    <div className="mt-2 flex gap-2">
                      {["AI-scored", "Hybrid", "Human-only"].map((m, i) => (
                        <span key={m} className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${i === 1 ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"}`}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2 border-t border-border">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Play className="h-3.5 w-3.5" /> Preview
                    </Button>
                    <Button size="sm" className="gap-1.5">
                      Deploy <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {builderFeatures.map((f, i) => (
              <motion.div key={f.title} {...fadeUp} transition={{ delay: i * 0.06 }}>
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

      {/* Use Cases */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground">
              Five use cases. One engine.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Every workforce challenge maps to a simulation blueprint — from individual upskilling to org-wide planning.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: GraduationCap,
                title: "AI Upskilling",
                template: "Quick Pulse",
                description: "Daily microlearning simulations that teach employees how AI is changing their specific tasks — and how to work alongside it.",
              },
              {
                icon: ClipboardCheck,
                title: "Candidate Assessment",
                template: "Case Challenge / Full Panel",
                description: "Score candidates on AI-readiness, not résumé keywords. Auto-generate skill simulations grounded in your role's disruption data.",
              },
              {
                icon: FileBarChart,
                title: "Workforce Planning",
                template: "Bulk Analysis + Heatmaps",
                description: "Upload your org chart. See AI disruption heatmaps across departments. Allocate L&D budgets to the highest-impact areas.",
              },
              {
                icon: Compass,
                title: "Career Transition",
                template: "Quick Pulse + Pathways",
                description: "Map skill transfer between roles, identify gaps, and let employees explore new careers through simulations before committing.",
              },
              {
                icon: BookOpen,
                title: "L&D Content Engine",
                template: "Deep Dive",
                description: "Auto-generate structured learning modules — briefings, scenario MCQs, open responses, and scorecards — for any role and task.",
              },
            ].map((uc, i) => (
              <motion.div key={uc.title} {...fadeUp} transition={{ delay: i * 0.06 }}>
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
      <section className="px-4 py-20 bg-accent/30">
        <div className="mx-auto max-w-3xl text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground">
            Build simulations that adapt to your world.
          </h2>
          <p className="mt-3 text-muted-foreground">
            See the Simulation Blueprint System in action with a personalized demo.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate("/contact-org")} className="gap-2 text-base px-10">
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
