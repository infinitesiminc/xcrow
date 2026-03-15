import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, Zap, ArrowRight, BarChart3, Layers,
  Users, TrendingUp, Sparkles, ShieldCheck, FileBarChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Layers,
    title: "Bulk Role Analysis",
    description: "Upload your org chart or paste 100+ role titles. The AI Replacement Model scores every position's task-level AI exposure in minutes.",
  },
  {
    icon: BarChart3,
    title: "Department Heatmaps",
    description: "Visualize AI disruption across teams. Identify which departments need upskilling investment — and which are already future-proof.",
  },
  {
    icon: TrendingUp,
    title: "Trend Forecasting",
    description: "See which tasks are trending toward full automation vs. stable augmentation. Plan restructuring before disruption forces it.",
  },
  {
    icon: ShieldCheck,
    title: "Budget Optimization",
    description: "Allocate L&D budgets to the highest-impact areas. Our model shows exactly where upskilling ROI is greatest across your org.",
  },
];

const metrics = [
  { value: "100+", label: "Roles per upload" },
  { value: "8-12", label: "Tasks per role analyzed" },
  { value: "3-axis", label: "Risk classification" },
  { value: "Real-time", label: "Trend tracking" },
];

export default function WorkforcePlanning() {
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
              Map AI disruption across<br />
              <em className="italic">your entire workforce.</em>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Upload your org chart. Get task-level AI risk scores for every role. Plan restructuring,
              upskilling, and hiring with data — not guesswork.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/company-dashboard")} className="gap-2 text-base px-8">
                See Company Demo <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/contact-org")} className="text-base px-8">
                Talk to Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Metrics */}
      <section className="px-4 pb-12">
        <div className="mx-auto max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-4">
          {metrics.map((s) => (
            <div key={s.label} className="text-center rounded-xl border border-border bg-card p-4">
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground text-center mb-12">
            From org chart to action plan
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

      {/* CTA */}
      <section className="px-4 py-20 bg-accent/30">
        <div className="mx-auto max-w-3xl text-center">
          <Building2 className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground">
            See the full picture before you restructure.
          </h2>
          <p className="mt-3 text-muted-foreground">Explore a live company dashboard with real AI risk data across departments.</p>
          <Button size="lg" onClick={() => navigate("/company-dashboard")} className="mt-8 gap-2 text-base px-10">
            Launch Company Demo <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
