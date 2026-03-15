import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap, Brain, Target, Play, ArrowRight, CheckCircle2,
  Shield, TrendingUp, Sparkles, BarChart3, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const engineFeatures = [
  {
    icon: Target,
    title: "Task-Level Precision",
    description: "Our AI Replacement Model scores every task in your role — not the job title. Know exactly which 30% of your work is most exposed.",
  },
  {
    icon: Brain,
    title: "Adaptive Scenario Engine",
    description: "The Universal Simulation Engine generates real-world scenarios calibrated to your task's AI disruption status. Practice what matters.",
  },
  {
    icon: BarChart3,
    title: "AI-Readiness Scoring",
    description: "Four-axis scoring — AI Tool Awareness, Human Value-Add, Adaptive Thinking, Domain Judgment — gives you a measurable readiness profile.",
  },
  {
    icon: Layers,
    title: "Progressive Difficulty",
    description: "Choose Exploring or Practicing mode. The engine adapts language, depth, and scenario complexity to your experience level.",
  },
];

const howItWorks = [
  { step: "01", title: "Analyze your role", desc: "Enter your job title. The AI Replacement Model maps every task and scores its AI exposure in ~3 seconds." },
  { step: "02", title: "Pick a vulnerable task", desc: "See tasks ranked by disruption score. The most at-risk tasks surface first — start where it matters most." },
  { step: "03", title: "Run the simulation", desc: "The Universal Engine compiles a briefing, generates MCQ scenarios, and mentors you through AI-aware practice rounds." },
  { step: "04", title: "Get scored & repeat", desc: "Receive your AI-readiness score across 4 categories. Track progress over time as you upskill task by task." },
];

const stats = [
  { value: "100M+", label: "Roles in our model" },
  { value: "~3s", label: "Analysis speed" },
  { value: "4-axis", label: "Readiness scoring" },
  { value: "∞", label: "Scenario variety" },
];

export default function Upskilling() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground mb-6">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Powered by the Universal Simulation Engine
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
              Upskill on the exact tasks<br />
              <em className="italic">AI is coming for.</em>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Our AI Replacement Model identifies your most vulnerable tasks. The Universal Simulation Engine
              then generates interactive scenarios so you can build the skills that keep you irreplaceable.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/")} className="gap-2 text-base px-8">
                Analyze Your Role <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/pricing")} className="text-base px-8">
                View Pricing
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 pb-12">
        <div className="mx-auto max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center rounded-xl border border-border bg-card p-4">
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* The Model */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground">
              Two engines. One mission.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              The <strong>AI Replacement Model</strong> tells you what's at risk.
              The <strong>Universal Simulation Engine</strong> helps you act on it.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {engineFeatures.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Card className="h-full border-border bg-card">
                  <CardContent className="p-6">
                    <f.icon className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold text-foreground text-lg">{f.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16 bg-accent/30">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground text-center mb-12">How it works</h2>
          <div className="space-y-6">
            {howItWorks.map((s, i) => (
              <motion.div key={s.step} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex gap-5 items-start">
                <span className="text-3xl font-bold text-primary/30 font-mono shrink-0">{s.step}</span>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                </div>
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
            Don't wait for the disruption.
          </h2>
          <p className="mt-3 text-muted-foreground">Start with a free role analysis. Upskill on your most vulnerable tasks today.</p>
          <Button size="lg" onClick={() => navigate("/")} className="mt-8 gap-2 text-base px-10">
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
