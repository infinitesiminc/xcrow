import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap, Brain, Target, ArrowRight, Layers, Users,
  Compass, GraduationCap, ClipboardCheck, Building2,
  ChevronRight, Sparkles, BarChart3, Play, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/* ── Engine primitives ── */
const primitives = [
  {
    icon: Target,
    title: "AI Replacement Model",
    role: "The Diagnostic",
    description:
      "Scores every task in any job role against a 1-3 year AI disruption horizon. Maps current state (human-led → AI-driven), trend direction, and impact level to produce a composite Agent Replacement Risk score.",
    stats: ["100M+ roles modeled", "8-12 tasks per role", "3-axis risk classification"],
  },
  {
    icon: Brain,
    title: "Universal Simulation Engine",
    role: "The Action Layer",
    description:
      "Compiles interactive, AI-aware learning scenarios for any role + task combination. Generates briefings, MCQ rounds with real-world context, and scores learners on a 4-axis AI-readiness framework.",
    stats: ["Infinite scenario variety", "2 experience modes", "4-axis readiness scoring"],
  },
];

/* ── Product cards ── */
const products = [
  {
    icon: Zap,
    title: "AI Upskilling",
    tagline: "Practice the tasks AI is coming for",
    audience: "Individual workers",
    description:
      "Identify your most vulnerable tasks, then run interactive simulations that teach you to work alongside AI — not be replaced by it.",
    path: "/products/upskilling",
    color: "bg-dot-teal/10 text-dot-teal",
  },
  {
    icon: ClipboardCheck,
    title: "Candidate Assessment",
    tagline: "Hire for the AI-augmented workplace",
    audience: "Hiring & staffing teams",
    description:
      "Auto-generate skill simulations grounded in disruption data. Score candidates on AI-readiness, not just résumé keywords.",
    path: "/products/candidate-assessment",
    color: "bg-dot-blue/10 text-dot-blue",
  },
  {
    icon: Building2,
    title: "Workforce Planning",
    tagline: "Map disruption across your org",
    audience: "HR & strategy leaders",
    description:
      "Upload your org chart and get task-level AI risk scores for every role. Plan restructuring and upskilling with data.",
    path: "/products/workforce-planning",
    color: "bg-dot-purple/10 text-dot-purple",
  },
  {
    icon: Compass,
    title: "Career Transition",
    tagline: "Pivot into AI-resilient roles",
    audience: "Career changers & job seekers",
    description:
      "See exact skill transfer rates between roles, explore target tasks in simulation, and choose careers where humans stay essential.",
    path: "/products/career-transition",
    color: "bg-dot-amber/10 text-dot-amber",
  },
  {
    icon: GraduationCap,
    title: "L&D Content Engine",
    tagline: "Generate training content instantly",
    audience: "L&D leaders & training teams",
    description:
      "Turn AI Replacement Model data into interactive microlearning modules — briefings, scenarios, and scorecards — with zero instructional design effort.",
    path: "/products/ld-content-engine",
    color: "bg-dot-teal/10 text-dot-teal",
  },
];

/* ── Architecture flow steps ── */
const flowSteps = [
  {
    num: "01",
    label: "Input",
    title: "Any role enters the model",
    desc: "Job title, job description, or full org chart. The AI Replacement Model decomposes it into individual tasks.",
    icon: Layers,
  },
  {
    num: "02",
    label: "Score",
    title: "Task-level risk assessment",
    desc: "Each task is scored on current AI state, trend direction, and impact level — producing a composite disruption score.",
    icon: BarChart3,
  },
  {
    num: "03",
    label: "Simulate",
    title: "Engine compiles scenarios",
    desc: "The Universal Simulation Engine generates briefings, MCQ rounds, and mentor prompts — all contextualized to the task's AI status.",
    icon: Play,
  },
  {
    num: "04",
    label: "Measure",
    title: "4-axis readiness scoring",
    desc: "AI Tool Awareness, Human Value-Add, Adaptive Thinking, Domain Judgment — a measurable profile that tracks growth over time.",
    icon: Shield,
  },
];

export default function Platform() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Platform Architecture
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
              One model. One engine.<br />
              <em className="italic">Five ways to act.</em>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              The <strong className="text-foreground">AI Replacement Model</strong> diagnoses task-level AI exposure.
              The <strong className="text-foreground">Universal Simulation Engine</strong> turns that diagnosis into action.
              Every product on the platform runs on the same truth.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Two Primitives ── */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-5xl grid md:grid-cols-2 gap-5">
          {primitives.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Card className="h-full border-border bg-card">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <p.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg leading-tight">{p.title}</h3>
                      <span className="text-xs text-muted-foreground">{p.role}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {p.stats.map((s) => (
                      <span key={s} className="inline-block rounded-md bg-secondary px-2.5 py-1 text-[11px] font-medium text-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Architecture Flow ── */}
      <section className="px-4 py-16 bg-accent/30">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground text-center mb-4">
            How it flows
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            From a single job title to a measurable AI-readiness profile — in seconds.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {flowSteps.map((s, i) => (
              <motion.div key={s.num} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Card className="h-full border-border bg-card relative overflow-hidden">
                  <CardContent className="p-5">
                    <span className="text-[40px] font-bold text-primary/[0.07] font-mono absolute top-2 right-3 leading-none">{s.num}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-2 block">{s.label}</span>
                    <s.icon className="h-6 w-6 text-primary/60 mb-2" />
                    <h3 className="font-semibold text-foreground text-sm">{s.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{s.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Products Grid ── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground text-center mb-4">
            Five products, one truth
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Every product draws from the same AI Replacement Model and Simulation Engine — tailored to different stakeholders.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <Card
                  className="h-full border-border bg-card hover:border-primary/20 transition-colors cursor-pointer group"
                  onClick={() => navigate(p.path)}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className={`h-9 w-9 rounded-lg ${p.color} flex items-center justify-center mb-3`}>
                      <p.icon className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="font-semibold text-foreground text-base">{p.title}</h3>
                    <p className="text-xs text-primary/70 font-medium mt-0.5">{p.tagline}</p>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">{p.description}</p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{p.audience}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 py-20 bg-accent/30">
        <div className="mx-auto max-w-3xl text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground">
            Start with a single role.<br />Scale to the entire org.
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Analyze any job in 3 seconds. Every insight feeds back into the same model — whether you're an individual or an enterprise.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate("/")} className="gap-2 text-base px-8">
              Try It Free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/contact-org")} className="text-base px-8">
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
