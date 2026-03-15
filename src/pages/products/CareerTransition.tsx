import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Compass, Zap, ArrowRight, TrendingUp, Brain,
  Sparkles, Target, GitBranch, Map, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: GitBranch,
    title: "Skill Transfer Mapping",
    description: "Our AI Replacement Model calculates exact skill overlap between your current role and target careers. See 60-80% transfer rates with precision.",
  },
  {
    icon: Map,
    title: "Gap Analysis & Pathways",
    description: "Know exactly which skills you need to bridge the gap. Get a prioritized learning path with specific tools and courses.",
  },
  {
    icon: Brain,
    title: "Explore Before You Commit",
    description: "Use 'Exploring' mode in the Simulation Engine to experience tasks from a new role. Understand what you'd actually do — and how AI shapes it.",
  },
  {
    icon: Target,
    title: "AI-Resilient Role Selection",
    description: "Compare roles by their AI disruption profile. Choose careers where your human skills create lasting value, not temporary advantage.",
  },
];

const journeys = [
  { from: "Marketing Manager", to: "Product Manager", overlap: "72%", gap: "Data analytics, Sprint planning" },
  { from: "Accountant", to: "Financial Analyst", overlap: "65%", gap: "Financial modeling, Python basics" },
  { from: "Software Engineer", to: "DevOps Engineer", overlap: "78%", gap: "Infrastructure as code, CI/CD pipelines" },
];

export default function CareerTransition() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden px-4 pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground mb-6">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Powered by the AI Replacement Model
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
              Transition into roles<br />
              <em className="italic">AI can't replace.</em>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              See exactly which of your skills transfer, what gaps remain, and how AI shapes your target role —
              then practice the new tasks before making the leap.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/")} className="gap-2 text-base px-8">
                Explore Transitions <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/for-individuals")} className="text-base px-8">
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground text-center mb-12">
            Data-driven career moves
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
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

      {/* Example Transitions */}
      <section className="px-4 py-16 bg-accent/30">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground text-center mb-10">Example transitions</h2>
          <div className="space-y-3">
            {journeys.map((j, i) => (
              <motion.div key={j.from} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="border-border bg-card">
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground min-w-0 flex-1">
                      <span>{j.from}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{j.to}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-dot-teal" /> {j.overlap} overlap
                      </span>
                      <span className="text-muted-foreground/60">Gap: {j.gap}</span>
                    </div>
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
          <Compass className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground">
            Your next career move, backed by data.
          </h2>
          <p className="mt-3 text-muted-foreground">Analyze your role and discover AI-resilient career pathways today.</p>
          <Button size="lg" onClick={() => navigate("/")} className="mt-8 gap-2 text-base px-10">
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
