import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Target, Brain, TrendingUp, Shield, Zap, ArrowRight,
  CheckCircle2, BookOpen, Gamepad2, Award, Sparkles,
  Clock, Search, BarChart3, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const painPoints = [
  "Will AI replace my job?",
  "Which of my skills still matter?",
  "What should I learn next?",
  "Am I falling behind?",
];

const features = [
  {
    icon: Target,
    title: "Task-Level AI Risk Score",
    description: "Not a vague headline — a breakdown of every task in your role scored by automation likelihood and augmentation potential.",
    highlight: "See which 30% of your tasks are most exposed",
  },
  {
    icon: Gamepad2,
    title: "AI Collaboration Simulations",
    description: "Practice working alongside AI tools on your actual at-risk tasks. Build muscle memory before the shift happens.",
    highlight: "Interactive scenarios, not passive courses",
  },
  {
    icon: TrendingUp,
    title: "Career Transition Pathways",
    description: "Discover roles where your existing skills transfer with 60-80% overlap — with precise gap analysis and learning paths.",
    highlight: "Data-driven lateral moves, not guesswork",
  },
  {
    icon: BookOpen,
    title: "Personalized Action Plan",
    description: "A prioritized 30/60/90-day roadmap based on your role's specific AI exposure profile. Focus on what actually matters.",
    highlight: "Actionable steps, not generic advice",
  },
];

const steps = [
  {
    num: "01",
    title: "Enter your role",
    description: "Type your job title, search 500+ pre-analyzed roles, or paste a full job description for maximum accuracy.",
    icon: Search,
  },
  {
    num: "02",
    title: "Get your AI impact report",
    description: "Receive a task-by-task breakdown with risk scores, industry benchmarks, and skill gap analysis — in under 30 seconds.",
    icon: BarChart3,
  },
  {
    num: "03",
    title: "Practice & future-proof",
    description: "Run interactive simulations on your most at-risk tasks. Build the AI collaboration skills employers will demand.",
    icon: Gamepad2,
  },
];

const audiences = [
  {
    icon: Shield,
    label: "Working Professionals",
    tagline: "Protect and accelerate your career",
    points: [
      "Understand exactly how AI impacts your specific role",
      "Build verifiable AI collaboration skills",
      "Get ahead of restructuring conversations",
      "Track your readiness score over time",
    ],
  },
  {
    icon: Award,
    label: "Students & Job Seekers",
    tagline: "Enter the workforce AI-ready",
    points: [
      "Evaluate careers with real AI exposure data",
      "Practice before your first interview",
      "Choose roles with strong augmentation potential",
      "Build a portfolio that proves AI literacy",
    ],
  },
];

const stats = [
  { value: "500+", label: "Roles in database" },
  { value: "<30s", label: "Analysis time" },
  { value: "8-12", label: "Tasks per role analyzed" },
  { value: "Free", label: "To get started" },
];

export default function ForIndividuals() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
              Don't guess your AI risk.<br />
              <em className="italic">Know it. Then master it.</em>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Get a task-level AI impact analysis for any job role — then practice the exact skills
              that keep you irreplaceable. Powered by data from 500+ analyzed positions.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/")} className="gap-2 text-base px-8">
                Analyze Your Role Free <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/pricing")} className="text-base">
                View Plans →
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pain points ticker */}
      <section className="px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
              Sound familiar?
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {painPoints.map((q, i) => (
                <motion.span
                  key={q}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-sm text-muted-foreground"
                >
                  <AlertTriangle className="h-3 w-3 text-primary/60" />
                  {q}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="px-4 py-10 bg-accent/20">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <p className="text-2xl sm:text-3xl font-sans font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-foreground">From uncertainty to action in 30 seconds</h2>
            <p className="mt-2 text-muted-foreground">Three steps. No sign-up required to start.</p>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="border-border/50 h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl font-sans font-bold text-primary/20">{step.num}</span>
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <h3 className="text-base font-sans font-semibold text-foreground">{step.title}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 bg-accent/20">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-foreground">More than a score — a complete career defense system</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className="border-border/50 h-full hover:border-primary/20 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-4">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-base font-sans font-semibold text-foreground">{f.title}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                      <p className="mt-3 text-xs font-medium text-primary/80 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {f.highlight}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-foreground">Built for anyone navigating the AI shift</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-6">
            {audiences.map((a, i) => {
              const Icon = a.icon;
              return (
                <motion.div
                  key={a.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="border-border/50 h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-base font-sans font-semibold text-foreground">{a.label}</h3>
                          <p className="text-xs text-muted-foreground">{a.tagline}</p>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {a.points.map(p => (
                          <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-accent/30 to-primary/5">
              <CardContent className="p-8 text-center">
                <Brain className="mx-auto h-8 w-8 text-primary mb-4" />
                <h2 className="font-sans text-xl sm:text-2xl font-bold text-foreground">
                  Your role is changing. Are you ready?
                </h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                  Run your first analysis free — no sign-up, no credit card. See exactly where you stand in under 30 seconds.
                </p>
                <Button size="lg" onClick={() => navigate("/")} className="mt-6 gap-2">
                  <Zap className="h-4 w-4" /> Start Free Analysis
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
