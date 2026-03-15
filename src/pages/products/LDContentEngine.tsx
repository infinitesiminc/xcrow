import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  GraduationCap, Zap, ArrowRight, BookOpen, Brain,
  Sparkles, Target, Layers, Play, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Target,
    title: "Auto-Generated Microlearning",
    description: "The Universal Simulation Engine compiles briefings, scenario MCQs, and scoring rubrics for any role + task combination. No instructional designer needed.",
  },
  {
    icon: Brain,
    title: "AI-Replacement Context Built In",
    description: "Every module teaches through the AI lens — what tools exist, where humans add value, how to collaborate with AI. Not generic soft-skills content.",
  },
  {
    icon: Layers,
    title: "Infinite Scenario Variety",
    description: "Each simulation round explores a different angle of the task. The engine never repeats — generating fresh scenarios every time a learner returns.",
  },
  {
    icon: Play,
    title: "Two Learning Modes",
    description: "Exploring mode for newcomers provides jargon-free introductions. Practicing mode for experts delivers peer-level AI impact insights.",
  },
];

const pipeline = [
  { step: "01", title: "Feed it a role & task", desc: "From your AI Replacement Model analysis — or manually define any role + task combination." },
  { step: "02", title: "Engine compiles the module", desc: "Briefing, key terms, tips, system prompt, and opening scenario — all generated in seconds." },
  { step: "03", title: "Learner runs the simulation", desc: "Interactive MCQ rounds with AI Today/Human Edge feedback after each answer." },
  { step: "04", title: "Score & track progress", desc: "4-axis AI-readiness scoring. Results saved to learner profiles for compliance and tracking." },
];

const formats = [
  { label: "Scenario MCQ Rounds", desc: "Interactive branching scenarios with 3-option MCQs", icon: Play },
  { label: "AI Context Briefings", desc: "Auto-generated task briefings with key terms glossary", icon: BookOpen },
  { label: "Readiness Scorecards", desc: "4-axis scoring on AI Tool Awareness, Human Value-Add, and more", icon: FileText },
];

export default function LDContentEngine() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden px-4 pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground mb-6">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Powered by the Universal Simulation Engine
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
              Generate AI upskilling content<br />
              <em className="italic">for any role, instantly.</em>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Turn your AI Replacement Model data into interactive microlearning modules.
              The engine generates briefings, scenarios, and scorecards — no instructional design team required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/contact-org")} className="gap-2 text-base px-8">
                Request Demo <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/for-organizations")} className="text-base px-8">
                For Organizations
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Formats */}
      <section className="px-4 pb-12">
        <div className="mx-auto max-w-4xl grid sm:grid-cols-3 gap-4">
          {formats.map((f) => (
            <div key={f.label} className="text-center rounded-xl border border-border bg-card p-5">
              <f.icon className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-sm font-semibold text-foreground">{f.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground text-center mb-12">
            L&D content that writes itself
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

      {/* Pipeline */}
      <section className="px-4 py-16 bg-accent/30">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground text-center mb-12">From role to learning module in seconds</h2>
          <div className="space-y-6">
            {pipeline.map((s, i) => (
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
          <GraduationCap className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground">
            Stop building courses manually.
          </h2>
          <p className="mt-3 text-muted-foreground">Let the engine generate AI-aware training content for your entire org.</p>
          <Button size="lg" onClick={() => navigate("/contact-org")} className="mt-8 gap-2 text-base px-10">
            Get Started <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
