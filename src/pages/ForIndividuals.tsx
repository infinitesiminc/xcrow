import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Target, Brain, TrendingUp, Shield, Zap, ArrowRight,
  CheckCircle2, BarChart3, BookOpen, Gamepad2, Award, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Target,
    title: "AI Risk Score",
    description: "See exactly how AI impacts every task in your role — not just vague headlines, real task-level data.",
  },
  {
    icon: Gamepad2,
    title: "Practice Simulations",
    description: "Step into AI-augmented scenarios and practice the skills that matter before they become mandatory.",
  },
  {
    icon: TrendingUp,
    title: "Career Pathways",
    description: "Discover adjacent roles where your skills transfer — with overlap scores and gap analysis.",
  },
  {
    icon: BookOpen,
    title: "Personalized Action Plan",
    description: "Get a prioritized learning roadmap based on your role's specific AI exposure profile.",
  },
];

const steps = [
  { num: "01", title: "Enter your role", description: "Job title, company, or paste a job description" },
  { num: "02", title: "Get your report", description: "Task-level AI impact analysis in under 30 seconds" },
  { num: "03", title: "Practice & adapt", description: "Run simulations on your most at-risk tasks" },
];

const audiences = [
  {
    icon: Shield,
    label: "Professionals",
    tagline: "Future-proof your career",
    points: ["Understand your role's AI exposure", "Build in-demand skills", "Track progress over time"],
  },
  {
    icon: Award,
    label: "Students",
    tagline: "Launch AI-ready",
    points: ["Explore careers with real AI data", "Practice before you interview", "Build a verified skills portfolio"],
  },
];

export default function ForIndividuals() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-24">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
              Know your AI risk.<br />
              <em className="italic">Master what's next.</em>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Get a task-level AI impact analysis for any role — then practice the skills that keep you ahead. For professionals protecting their career and students building theirs.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/")} className="gap-2 text-base px-8">
                Analyze Your Role <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/for-organizations")} className="text-base">
                For Organizations →
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-foreground">Three steps to clarity</h2>
            <p className="mt-2 text-muted-foreground">From uncertainty to action in under a minute</p>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-border/50 h-full">
                  <CardContent className="p-6">
                     <span className="text-3xl font-sans font-bold text-primary/20">{step.num}</span>
                     <h3 className="mt-2 text-lg font-sans font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 bg-accent/20">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Everything you need to stay ahead</h2>
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
                      <h3 className="text-base font-heading font-semibold text-foreground">{f.title}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
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
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Built for you</h2>
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
                          <h3 className="text-base font-heading font-semibold text-foreground">{a.label}</h3>
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
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                  Ready to see where you stand?
                </h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                  Free analysis for any role. No sign-up required.
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
