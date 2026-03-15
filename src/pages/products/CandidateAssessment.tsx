import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, ClipboardCheck, Zap, ArrowRight, BarChart3,
  Target, Brain, Sparkles, ShieldCheck, Award, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Target,
    title: "Skill-Mapped Simulations",
    description: "Define project skills. The Universal Engine auto-generates scenario-based assessments tailored to each skill's AI disruption context.",
  },
  {
    icon: Brain,
    title: "AI-Readiness Scoring",
    description: "Candidates are scored on AI Tool Awareness, Human Value-Add, Adaptive Thinking, and Domain Judgment — not just knowledge recall.",
  },
  {
    icon: BarChart3,
    title: "Fit Score Rankings",
    description: "Rank candidates by skill coverage, proficiency, and AI-readiness. See exactly who can work alongside AI — not just who knows the theory.",
  },
  {
    icon: ShieldCheck,
    title: "Future-Proof Hiring",
    description: "Powered by our AI Replacement Model, assessments test for the skills that will still matter in 2-3 years — not the ones being automated.",
  },
];

const useCases = [
  { title: "Project Staffing", desc: "Match internal talent to projects by testing their AI-readiness on required skills.", icon: Layers },
  { title: "New Hire Assessment", desc: "Screen candidates on their ability to collaborate with AI tools in your specific context.", icon: ClipboardCheck },
  { title: "Promotion Readiness", desc: "Verify that candidates for advancement can adapt to the AI-augmented version of the role.", icon: Award },
];

export default function CandidateAssessment() {
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
              Assess candidates for the<br />
              <em className="italic">AI-augmented workplace.</em>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Auto-generate skill simulations grounded in your AI Replacement Model data.
              Score candidates on their ability to work with AI — not just their résumé keywords.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/project-staffing")} className="gap-2 text-base px-8">
                Try Project Staffing <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/contact-org")} className="text-base px-8">
                Talk to Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground text-center mb-12">
            Assessments built on disruption data
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

      {/* Use Cases */}
      <section className="px-4 py-16 bg-accent/30">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground text-center mb-10">Use cases</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {useCases.map((u, i) => (
              <motion.div key={u.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full border-border bg-card">
                  <CardContent className="p-5 text-center">
                    <u.icon className="h-7 w-7 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold text-foreground">{u.title}</h3>
                    <p className="text-xs text-muted-foreground mt-2">{u.desc}</p>
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
            Hire for the future, not the past.
          </h2>
          <p className="mt-3 text-muted-foreground">See the assessment builder in action with a live project staffing demo.</p>
          <Button size="lg" onClick={() => navigate("/project-staffing")} className="mt-8 gap-2 text-base px-10">
            Launch Demo <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
