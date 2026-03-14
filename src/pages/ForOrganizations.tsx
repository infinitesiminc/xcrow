import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, Users, GraduationCap, Heart, ArrowRight,
  BarChart3, Layers, TrendingUp, ShieldCheck, Zap,
  CheckCircle2, FileBarChart, AlertTriangle,
  DollarSign, Clock, UserMinus, Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CompanyMarquee from "@/components/CompanyMarquee";

const MARQUEE_ROWS = [
  ["Microsoft", "Apple", "Nvidia", "Meta", "OpenAI", "Stripe", "Deloitte", "McKinsey", "Boeing", "FedEx"],
  ["Databricks", "Cohere", "Mistral", "Gong", "DeepMind", "CoreWeave", "Glean", "Deel", "Lockheed Martin"],
];

const challenges = [
  {
    icon: AlertTriangle,
    stat: "40%",
    label: "of tasks across roles face AI disruption in the next 2 years",
  },
  {
    icon: DollarSign,
    stat: "$24K",
    label: "average cost of replacing one mis-skilled employee",
  },
  {
    icon: UserMinus,
    stat: "67%",
    label: "of workers say they'd leave if not offered AI upskilling",
  },
];

const features = [
  {
    icon: Layers,
    title: "Bulk Role Analysis",
    description: "Upload your entire org chart, paste role lists, or connect your HRIS — get AI impact scores for every position in minutes, not months.",
    highlight: "Analyze 100+ roles in one upload",
  },
  {
    icon: BarChart3,
    title: "Department Heatmaps",
    description: "Visualize which teams face the most disruption. Identify exactly where to focus upskilling budgets for maximum ROI.",
    highlight: "Color-coded risk by department",
  },
  {
    icon: TrendingUp,
    title: "Internal Mobility Mapping",
    description: "Map at-risk roles to internal transition pathways with skill overlap analysis. Retain talent by moving them, not losing them.",
    highlight: "Reduce attrition from AI disruption",
  },
  {
    icon: ShieldCheck,
    title: "Progress Tracking & Reporting",
    description: "Monitor team-wide skill development with simulation completions, readiness scores, and exportable leadership reports.",
    highlight: "Board-ready workforce intelligence",
  },
];

const orgTypes = [
  {
    icon: Building2,
    label: "Companies",
    tagline: "Workforce AI readiness at scale",
    points: [
      "Audit AI exposure across every department",
      "Prioritize upskilling where ROI is highest",
      "Reduce talent attrition from AI disruption",
      "Get ahead of restructuring with data",
    ],
  },
  {
    icon: Heart,
    label: "NGOs & Workforce Programs",
    tagline: "Data-driven reskilling programs",
    points: [
      "Identify the most at-risk roles in your cohort",
      "Map realistic transition pathways for workers",
      "Track program outcomes with verifiable data",
      "Justify funding with impact reports",
    ],
  },
  {
    icon: GraduationCap,
    label: "Universities & Training Providers",
    tagline: "Future-proof your curriculum",
    points: [
      "Map courses to real-world AI exposure data",
      "Embed AI simulations as practical assessments",
      "Prepare graduates for AI-augmented work",
      "Differentiate with employer-aligned training",
    ],
  },
];

const steps = [
  {
    num: "01",
    title: "Import your roles",
    description: "Upload a CSV, paste job titles, or connect your HRIS. We support any format — from 10 roles to 10,000.",
  },
  {
    num: "02",
    title: "Get your workforce report",
    description: "Receive department-level heatmaps with risk scores, skill gaps, and transition pathway recommendations.",
  },
  {
    num: "03",
    title: "Deploy & measure",
    description: "Assign targeted simulations to at-risk teams. Track readiness scores and export progress reports.",
  },
];

const stats = [
  { value: "100M+", label: "Roles analyzed" },
  { value: "~3s", label: "Per-role analysis" },
  { value: "8-12", label: "Tasks mapped per role" },
  { value: "$15", label: "Per seat / month" },
];

const pricing = [
  { range: "1–10 seats", price: "$15/seat/mo" },
  { range: "11–50 seats", price: "$12/seat/mo" },
  { range: "51–200 seats", price: "$9/seat/mo" },
  { range: "200+ seats", price: "Custom" },
];

export default function ForOrganizations() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
              AI is reshaping your workforce.<br className="hidden sm:block" />
              <em className="italic">Are you leading or reacting?</em>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Audit AI exposure across your entire organization, identify skill gaps by department, and deploy targeted upskilling — before disruption becomes attrition.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/contact-org")} className="gap-2 text-base px-8">
                Book a Demo <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/")} className="text-base">
                Try Free Analysis →
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Challenge stats */}
      <section className="px-4 py-12 bg-accent/20">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-widest mb-6">
            The workforce challenge
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {challenges.map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mx-auto mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-sans font-bold text-foreground">{c.stat}</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">{c.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-foreground">From audit to action in three steps</h2>
            <p className="mt-2 text-muted-foreground">No consultants needed. Results in minutes, not months.</p>
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
                    <span className="text-2xl font-sans font-bold text-primary/20">{step.num}</span>
                    <h3 className="mt-2 text-base font-sans font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
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
            <p className="mt-2 text-muted-foreground">Everything you need to lead the AI transition — not just survive it</p>
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
        <div className="mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-foreground">Built for every organization navigating AI</h2>
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

      {/* Pricing preview */}
      <section className="px-4 py-16 bg-accent/20">
        <div className="mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-8">
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-foreground">Simple, per-seat pricing</h2>
            <p className="mt-2 text-muted-foreground">Volume discounts that scale with your team</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {pricing.map((p, i) => (
              <motion.div
                key={p.range}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="border-border/50 text-center">
                  <CardContent className="p-4">
                    <p className="text-lg font-sans font-bold text-primary">{p.price}</p>
                    <p className="text-xs text-muted-foreground mt-1">{p.range}</p>
                  </CardContent>
                </Card>
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
                <h2 className="font-sans text-xl sm:text-2xl font-bold text-foreground">
                  See it in action with your real roles
                </h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                  Book a 20-minute walkthrough. We'll analyze a sample of your workforce live — no commitment required.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button size="lg" onClick={() => navigate("/contact-org")} className="gap-2">
                    <Zap className="h-4 w-4" /> Book a Demo
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate("/")}>
                    Try Individual Analysis Free →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
