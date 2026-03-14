import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, Users, GraduationCap, Heart, ArrowRight,
  BarChart3, Layers, TrendingUp, ShieldCheck, Zap,
  CheckCircle2, Sparkles, FileBarChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Layers,
    title: "Bulk Role Analysis",
    description: "Upload your entire org chart or role list — get AI impact scores for every position in minutes.",
  },
  {
    icon: BarChart3,
    title: "Department Heatmaps",
    description: "Visualize which teams face the most disruption and where to focus upskilling budgets.",
  },
  {
    icon: TrendingUp,
    title: "Workforce Transition Planning",
    description: "Map at-risk roles to internal mobility pathways with skill overlap analysis.",
  },
  {
    icon: ShieldCheck,
    title: "Cohort Progress Tracking",
    description: "Monitor team-wide skill development with practice completions and simulation scores.",
  },
];

const orgTypes = [
  {
    icon: Building2,
    label: "Companies",
    tagline: "Workforce AI readiness",
    points: [
      "Audit AI exposure across departments",
      "Prioritize upskilling investments",
      "Reduce talent attrition from disruption",
    ],
  },
  {
    icon: Heart,
    label: "NGOs",
    tagline: "Reskilling programs",
    points: [
      "Identify at-risk roles in your cohort",
      "Map transition pathways for workers",
      "Track program outcomes with data",
    ],
  },
  {
    icon: GraduationCap,
    label: "Schools & Universities",
    tagline: "Curriculum alignment",
    points: [
      "Map courses to real job AI exposure",
      "Embed simulations as assessments",
      "Prepare graduates for AI-augmented work",
    ],
  },
];

const steps = [
  { num: "01", title: "Import your roles", description: "Upload a CSV, paste titles, or connect your HRIS" },
  { num: "02", title: "Get your workforce report", description: "Department-level heatmap with risk scores and skill gaps" },
  { num: "03", title: "Deploy & track", description: "Assign simulations to teams and monitor progress" },
];

export default function ForOrganizations() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-24">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
              Prepare your workforce<br />
              <em className="italic">for the AI era.</em>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Audit AI exposure across your entire organization, identify skill gaps by department, and deploy targeted upskilling — all from one platform.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/team-analysis")} className="gap-2 text-base px-8">
                Start Team Analysis <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/for-individuals")} className="text-base">
                For Individuals →
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-foreground">From audit to action</h2>
            <p className="mt-2 text-muted-foreground">Understand your org's AI exposure in three steps</p>
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
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-foreground">Enterprise-grade workforce intelligence</h2>
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
        <div className="mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-foreground">One platform, every organization</h2>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-6">
            {orgTypes.map((o, i) => {
              const Icon = o.icon;
              return (
                <motion.div
                  key={o.label}
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
                          <h3 className="text-base font-sans font-semibold text-foreground">{o.label}</h3>
                          <p className="text-xs text-muted-foreground">{o.tagline}</p>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {o.points.map(p => (
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

      {/* Stats */}
      <section className="px-4 py-16 bg-accent/20">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { value: "30+", label: "Roles analyzed" },
              { value: "240+", label: "Tasks mapped" },
              { value: "<30s", label: "Per-role analysis" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="text-3xl font-heading font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-accent/30 to-primary/5">
              <CardContent className="p-8 text-center">
                <FileBarChart className="mx-auto h-8 w-8 text-primary mb-4" />
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                  Ready to audit your workforce?
                </h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                  Start with a free team analysis — no commitment required.
                </p>
                <Button size="lg" onClick={() => navigate("/team-analysis")} className="mt-6 gap-2">
                  <Zap className="h-4 w-4" /> Start Team Analysis
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
