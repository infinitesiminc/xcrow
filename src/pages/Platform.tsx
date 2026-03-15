import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap, Brain, Target, ArrowRight, Layers, Users,
  Compass, GraduationCap, ClipboardCheck, Building2,
  ChevronRight, Sparkles, BarChart3, Play, Shield,
  Radio, TrendingUp, Crosshair,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMemo } from "react";

/* ── Capability Radar Chart ── */
const DIMENSIONS = [
  { label: "Traditional\nRoles", short: "Traditional", value: 0.95, example: "Accountant, Paralegal" },
  { label: "Emerging\nRoles", short: "Emerging", value: 0.88, example: "AI Ethicist, Prompt Engineer" },
  { label: "Frontier\nRoles", short: "Frontier", value: 0.82, example: "Quantum AI, Neurotech" },
  { label: "Individual\nCareer", short: "Individual", value: 0.92, example: "Upskilling, Career Pivot" },
  { label: "Team &\nHiring", short: "Team", value: 0.90, example: "Assessment, Staffing" },
  { label: "Enterprise\nWorkforce", short: "Enterprise", value: 0.85, example: "Org Planning, L&D" },
];

function CapabilityRadar() {
  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const rings = [0.25, 0.5, 0.75, 1.0];
  const maxR = size * 0.38;

  const points = useMemo(() => {
    return DIMENSIONS.map((d, i) => {
      const angle = (Math.PI * 2 * i) / DIMENSIONS.length - Math.PI / 2;
      const r = d.value * maxR;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        lx: cx + (maxR + 28) * Math.cos(angle),
        ly: cy + (maxR + 28) * Math.sin(angle),
        ax: cx + maxR * Math.cos(angle),
        ay: cy + maxR * Math.sin(angle),
        ...d,
        angle,
      };
    });
  }, []);

  const polygonPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";

  return (
    <div className="flex flex-col items-center gap-6">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[420px] aspect-square">
        {/* Rings */}
        {rings.map((r) => (
          <polygon
            key={r}
            points={DIMENSIONS.map((_, i) => {
              const angle = (Math.PI * 2 * i) / DIMENSIONS.length - Math.PI / 2;
              return `${cx + r * maxR * Math.cos(angle)},${cy + r * maxR * Math.sin(angle)}`;
            }).join(" ")}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={r === 1 ? 1.2 : 0.6}
            strokeDasharray={r === 1 ? "none" : "3 3"}
          />
        ))}
        {/* Axis lines */}
        {points.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p.ax} y2={p.ay} stroke="hsl(var(--border))" strokeWidth={0.5} />
        ))}
        {/* Filled area */}
        <motion.polygon
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          points={polygonPath.replace("M", "").replace(" Z", "").replace(/L/g, " ")}
          fill="hsl(var(--primary) / 0.12)"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
        />
        {/* Data points */}
        {points.map((p, i) => (
          <motion.circle
            key={i}
            initial={{ r: 0 }}
            whileInView={{ r: 4 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.08 }}
            cx={p.x}
            cy={p.y}
            fill="hsl(var(--primary))"
            stroke="hsl(var(--background))"
            strokeWidth={2}
          />
        ))}
        {/* Labels */}
        {points.map((p, i) => (
          <text
            key={i}
            x={p.lx}
            y={p.ly}
            textAnchor={Math.abs(p.angle) < 0.1 || Math.abs(p.angle - Math.PI) < 0.3 ? "middle" : p.lx > cx ? "start" : "end"}
            dominantBaseline="middle"
            className="fill-foreground text-[10px] font-semibold"
          >
            {p.short}
          </text>
        ))}
        {/* Center label */}
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-primary text-[9px] font-bold uppercase tracking-widest">Engine</text>
        <text x={cx} y={cx + 6} textAnchor="middle" className="fill-muted-foreground text-[8px]">Coverage</text>
      </svg>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
        {DIMENSIONS.map((d) => (
          <div key={d.short} className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
            <div>
              <span className="text-xs font-semibold text-foreground block leading-tight">{d.short}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{d.example}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Engine primitives ── */
const primitives = [
  {
    icon: Target,
    title: "AI Evolution Model",
    role: "The Diagnostic",
    description:
      "Tracks AI capability progression across every task in any job role. Maps current state, trend direction, and growth trajectory to reveal where AI is heading — so you can move first.",
    stats: ["100M+ roles modeled", "8-12 tasks per role", "Real-time signal tracking"],
  },
  {
    icon: Brain,
    title: "Universal Simulation Engine",
    role: "The Action Layer",
    description:
      "Compiles interactive, AI-calibrated learning scenarios for any role + task combination. Every scenario reflects where AI tools are today and where they're heading — so training never goes stale.",
    stats: ["Infinite scenario variety", "2 experience modes", "4-axis readiness scoring"],
  },
];

/* ── Product cards ── */
const products = [
  {
    icon: Zap,
    title: "AI Upskilling",
    tagline: "Practice the tasks AI is coming for",
    audience: "Individual workers",
    description:
      "Identify your most vulnerable tasks, then run interactive simulations that teach you to work alongside AI — not be replaced by it.",
    path: "/products/upskilling",
    color: "bg-dot-teal/10 text-dot-teal",
  },
  {
    icon: ClipboardCheck,
    title: "Candidate Assessment",
    tagline: "Hire for the AI-augmented workplace",
    audience: "Hiring & staffing teams",
    description:
      "Auto-generate skill simulations grounded in disruption data. Score candidates on AI-readiness, not just résumé keywords.",
    path: "/products/candidate-assessment",
    color: "bg-dot-blue/10 text-dot-blue",
  },
  {
    icon: Building2,
    title: "Workforce Planning",
    tagline: "Map disruption across your org",
    audience: "HR & strategy leaders",
    description:
      "Upload your org chart and get task-level AI risk scores for every role. Plan restructuring and upskilling with data.",
    path: "/products/workforce-planning",
    color: "bg-dot-purple/10 text-dot-purple",
  },
  {
    icon: Compass,
    title: "Career Transition",
    tagline: "Pivot into AI-resilient roles",
    audience: "Career changers & job seekers",
    description:
      "See exact skill transfer rates between roles, explore target tasks in simulation, and choose careers where humans stay essential.",
    path: "/products/career-transition",
    color: "bg-dot-amber/10 text-dot-amber",
  },
  {
    icon: GraduationCap,
    title: "L&D Content Engine",
    tagline: "Generate training content instantly",
    audience: "L&D leaders & training teams",
    description:
      "Turn AI Evolution Model data into interactive microlearning modules — briefings, scenarios, and scorecards — with zero instructional design effort.",
    path: "/products/ld-content-engine",
    color: "bg-dot-teal/10 text-dot-teal",
  },
];

/* ── Architecture flow steps ── */
const flowSteps = [
  {
    num: "01",
    label: "Input",
    title: "Any role enters the model",
    desc: "Job title, job description, or full org chart. The AI Replacement Model decomposes it into individual tasks.",
    icon: Layers,
  },
  {
    num: "02",
    label: "Score",
    title: "Task-level risk assessment",
    desc: "Each task is scored on current AI state, trend direction, and impact level — producing a composite disruption score.",
    icon: BarChart3,
  },
  {
    num: "03",
    label: "Simulate",
    title: "Engine compiles scenarios",
    desc: "The Universal Simulation Engine generates briefings, MCQ rounds, and mentor prompts — all contextualized to the task's AI status.",
    icon: Play,
  },
  {
    num: "04",
    label: "Measure",
    title: "4-axis readiness scoring",
    desc: "AI Tool Awareness, Human Value-Add, Adaptive Thinking, Domain Judgment — a measurable profile that tracks growth over time.",
    icon: Shield,
  },
];

export default function Platform() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Platform Architecture
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
              One model. One engine.<br />
              <em className="italic">Five ways to act.</em>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              The <strong className="text-foreground">AI Evolution Model</strong> tracks where AI capability is heading.
              The <strong className="text-foreground">Universal Simulation Engine</strong> turns that signal into action.
              Every product on the platform runs on the same truth.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Two Primitives ── */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-5xl grid md:grid-cols-2 gap-5">
          {primitives.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Card className="h-full border-border bg-card">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <p.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg leading-tight">{p.title}</h3>
                      <span className="text-xs text-muted-foreground">{p.role}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {p.stats.map((s) => (
                      <span key={s} className="inline-block rounded-md bg-secondary px-2.5 py-1 text-[11px] font-medium text-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Capability Radar ── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl text-center mb-10">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground mb-3">
            One engine. Infinite use cases.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From defending legacy roles against disruption to staffing the quantum frontier — the same model adapts across every dimension.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <CapabilityRadar />
        </motion.div>
      </section>

      {/* ── Vision: Real-Time Calibration ── */}
      <section className="px-4 py-20 bg-accent/30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-5">
              <Radio className="h-3.5 w-3.5" />
              Live Signal Architecture
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground mb-4">
              Every scenario is calibrated to where<br className="hidden sm:block" /> AI is right now — and where it's heading.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Most training becomes outdated the moment it's published. Our engine doesn't work that way.
              The AI Evolution Model continuously tracks capability progression — so every simulation,
              every assessment, every recommendation reflects the live frontier.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: Radio,
                title: "Always Current",
                description: "Simulations reflect where AI tools are today, not where they were when training was authored. No manual updates needed.",
                accent: "bg-dot-teal/10 text-dot-teal",
              },
              {
                icon: TrendingUp,
                title: "Predictive Trajectories",
                description: "The model doesn't just measure current state — it projects 1-3 year capability curves, so learners practice for tomorrow's workplace.",
                accent: "bg-dot-blue/10 text-dot-blue",
              },
              {
                icon: Crosshair,
                title: "Contextually Adaptive",
                description: "A Financial Analyst scenario in 2024 teaches different AI collaboration skills than the same role in 2026 — automatically.",
                accent: "bg-dot-purple/10 text-dot-purple",
              },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full border-border bg-card">
                  <CardContent className="p-6">
                    <div className={`h-10 w-10 rounded-xl ${item.accent} flex items-center justify-center mb-4`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-foreground text-base mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Timeline visual */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="mt-12 mx-auto max-w-3xl">
            <div className="relative flex items-center justify-between px-4">
              <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
              <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-primary/0 via-primary/50 to-primary animate-pulse" />
              {["2024", "Now", "2025", "2026", "2027"].map((label, i) => (
                <div key={label} className="relative flex flex-col items-center z-10">
                  <div className={`h-3 w-3 rounded-full border-2 ${label === "Now" ? "bg-primary border-primary scale-125 shadow-lg shadow-primary/30" : "bg-card border-border"}`} />
                  <span className={`mt-2 text-[10px] font-semibold ${label === "Now" ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                  {label === "Now" && (
                    <span className="absolute -top-6 text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-2 py-0.5">Live</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-[11px] text-muted-foreground mt-6">
              The model tracks AI capability progression in real time — simulations auto-calibrate as the frontier moves.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Architecture Flow ── */}
      <section className="px-4 py-16 bg-accent/30">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground text-center mb-4">
            How it flows
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            From a single job title to a measurable AI-readiness profile — in seconds.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {flowSteps.map((s, i) => (
              <motion.div key={s.num} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Card className="h-full border-border bg-card relative overflow-hidden">
                  <CardContent className="p-5">
                    <span className="text-[40px] font-bold text-primary/[0.07] font-mono absolute top-2 right-3 leading-none">{s.num}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-2 block">{s.label}</span>
                    <s.icon className="h-6 w-6 text-primary/60 mb-2" />
                    <h3 className="font-semibold text-foreground text-sm">{s.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{s.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Products Grid ── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground text-center mb-4">
            Five products, one truth
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Every product draws from the same AI Replacement Model and Simulation Engine — tailored to different stakeholders.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <Card
                  className="h-full border-border bg-card hover:border-primary/20 transition-colors cursor-pointer group"
                  onClick={() => navigate(p.path)}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className={`h-9 w-9 rounded-lg ${p.color} flex items-center justify-center mb-3`}>
                      <p.icon className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="font-semibold text-foreground text-base">{p.title}</h3>
                    <p className="text-xs text-primary/70 font-medium mt-0.5">{p.tagline}</p>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">{p.description}</p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{p.audience}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 py-20 bg-accent/30">
        <div className="mx-auto max-w-3xl text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-foreground">
            Start with a single role.<br />Scale to the entire org.
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Analyze any job in 3 seconds. Every insight feeds back into the same model — whether you're an individual or an enterprise.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate("/")} className="gap-2 text-base px-8">
              Try It Free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/contact-org")} className="text-base px-8">
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
