import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Layers, Brain, Target, Sparkles, Gauge, Zap, BookOpen, ArrowRight, CheckCircle2, Settings2, Users, Bot, ShieldAlert, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

/* ── Format cards data ── */
const FORMATS = [
  {
    name: "Quick Pulse",
    score: "3–5",
    duration: "5 min",
    icon: Zap,
    description: "Fast awareness check. Best for low-complexity tasks where AI involvement is minimal.",
    when: "Mostly Human tasks • Low impact • Helpful priority",
    color: "bg-success/10 text-success",
  },
  {
    name: "Deep Dive",
    score: "6–8",
    duration: "15 min",
    icon: BookOpen,
    description: "Thorough skill assessment with multi-stage scenarios. Covers nuanced human-AI collaboration.",
    when: "Human+AI tasks • Medium impact • Important priority",
    color: "bg-dot-amber/10 text-dot-amber",
  },
  {
    name: "Case Challenge",
    score: "9+",
    duration: "25 min",
    icon: Target,
    description: "Full-length case study with branching decisions. Tests strategic thinking under AI-driven transformation.",
    when: "Mostly AI tasks • High impact • Critical priority",
    color: "bg-destructive/10 text-destructive",
  },
];

/* ── Scoring factors ── */
const SCORING_FACTORS = [
  { factor: "AI State", options: "Mostly Human (1) → Human+AI (2) → Mostly AI (3)", icon: Brain },
  { factor: "Impact Level", options: "Low (1) → Medium (2) → High (3)", icon: Gauge },
  { factor: "Priority", options: "Helpful (1) → Important (2) → Critical (3)", icon: Target },
  { factor: "Skill Count", options: "1–2 (+0) → 3–4 (+1) → 5+ (+2)", icon: Sparkles },
];

/* ── Three layers ── */
const LAYERS = [
  {
    step: "01",
    title: "Template",
    subtitle: "Pre-built simulation structures",
    icon: Layers,
    points: [
      "Industry-validated scenario frameworks",
      "Role-specific question banks",
      "Scoring rubrics aligned to AI-readiness categories",
    ],
  },
  {
    step: "02",
    title: "Calibration",
    subtitle: "AI-driven context injection",
    icon: Brain,
    points: [
      "Company-specific context from job descriptions",
      "Real tool & workflow integration",
      "Dynamic difficulty based on role seniority",
    ],
  },
  {
    step: "03",
    title: "Customization",
    subtitle: "User-controlled stages & scoring",
    icon: Settings2,
    points: [
      "Adjustable simulation duration & depth",
      "Custom scoring weights per competency",
      "Department-specific scenario branching",
    ],
  },
];

export default function SimulationDesign() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground mb-4">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Simulation Methodology
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-foreground leading-tight tracking-tight">
              How We Design<br />AI-Ready Simulations
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
              Every simulation is built through a three-layer architecture that ensures relevance, accuracy, and actionable skill development — calibrated to your organization's actual roles and workflows.
            </p>
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button onClick={() => navigate("/products/simulation-builder")} className="gap-2">
                Try the Builder <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/contact")}>
                Talk to Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Three-Layer Architecture */}
      <section className="px-4 py-16 border-t border-border">
        <div className="mx-auto max-w-5xl">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.4 }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 text-center">Architecture</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground text-center mb-12">
              Three Layers, One Blueprint
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LAYERS.map((layer, i) => (
              <motion.div
                key={layer.step}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card className="h-full border-border hover:border-primary/20 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <layer.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{layer.step}</p>
                        <p className="text-lg font-bold text-foreground">{layer.title}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{layer.subtitle}</p>
                    <ul className="space-y-2">
                      {layer.points.map((point, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-foreground">
                          <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Format Assignment */}
      <section className="px-4 py-16 bg-card border-t border-border">
        <div className="mx-auto max-w-5xl">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.4 }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 text-center">Format Selection</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground text-center mb-4">
              Deterministic Format Assignment
            </h2>
            <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              Each task is scored across four dimensions. The total determines which simulation format provides the right depth and challenge level.
            </p>
          </motion.div>

          {/* Scoring factors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
            {SCORING_FACTORS.map((sf, i) => (
              <motion.div
                key={sf.factor}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <sf.icon className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold text-foreground">{sf.factor}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{sf.options}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Format cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FORMATS.map((fmt, i) => (
              <motion.div
                key={fmt.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card className="h-full border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-full ${fmt.color} flex items-center justify-center`}>
                        <fmt.icon className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" className="text-[10px]">Score: {fmt.score}</Badge>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">{fmt.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">~{fmt.duration}</p>
                    <p className="text-sm text-foreground mb-4">{fmt.description}</p>
                    <div className="bg-background rounded-md px-3 py-2">
                      <p className="text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">Best for: </span>{fmt.when}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI-Readiness Scoring */}
      <section className="px-4 py-16 border-t border-border">
        <div className="mx-auto max-w-4xl">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.4 }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 text-center">Assessment</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground text-center mb-12">
              Four Pillars of AI Readiness
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "AI Tool Awareness", desc: "Can the employee identify when and how to use AI tools for this task?" },
              { title: "Human Value-Add", desc: "Does the employee understand what uniquely human judgment this task requires?" },
              { title: "Adaptive Thinking", desc: "Can they adjust their approach when AI capabilities change or fail?" },
              { title: "Domain Judgment", desc: "Do they apply deep domain expertise to validate and improve AI outputs?" },
            ].map((pillar, i) => (
              <motion.div
                key={pillar.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="border-border">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">{i + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">{pillar.title}</p>
                        <p className="text-xs text-muted-foreground">{pillar.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 bg-card border-t border-border">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.4 }}>
            <Users className="h-10 w-10 mx-auto text-primary/60 mb-4" />
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Ready to upskill your team?
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto">
              See the simulation blueprint in action. Browse real roles, run AI analysis, and launch calibrated simulations for your workforce.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={() => navigate("/products/simulation-builder")} size="lg" className="gap-2">
                Open Simulation Builder <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/contact")}>
                Request Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
