import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Shield, Lock, Server, Globe,
  Building2, Brain, Target, Zap, CheckCircle2,
  Users, Crosshair, RefreshCw, TrendingUp,
  AlertTriangle, Clock, Activity, Radar,
  Cpu, BarChart3, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CompanyMarquee from "@/components/CompanyMarquee";

const MARQUEE_ROWS = [
  ["Deloitte", "McKinsey", "Boeing", "FedEx", "Microsoft", "Apple", "Nvidia", "Stripe"],
  ["DeepMind", "CoreWeave", "Glean", "Deel", "Lockheed Martin", "Databricks", "Cohere", "Meta"],
];

const stats = [
  { value: "100M+", label: "Roles analyzed" },
  { value: "<3s", label: "Analysis speed" },
  { value: "4,200+", label: "Task-level data points" },
  { value: "98%", label: "Enterprise uptime SLA" },
];

const trustFeatures = [
  { icon: Lock, title: "SOC 2 Type II", description: "Audited annually with continuous monitoring" },
  { icon: Shield, title: "GDPR compliant", description: "Data residency controls, DPA included" },
  { icon: Server, title: "SSO & SCIM", description: "Okta, Azure AD, Google Workspace" },
  { icon: Globe, title: "Data residency", description: "Choose EU, US, or APAC data regions" },
];

/* ── Frontier model releases for hero ticker ── */
const FRONTIER_RELEASES = [
  { date: "2026-03-14", model: "Claude 4.7 Sonnet" },
  { date: "2026-03-09", model: "GPT-5.4" },
  { date: "2026-03-05", model: "Gemini 3.1 Flash" },
  { date: "2026-02-27", model: "Llama 4 Maverick" },
  { date: "2026-02-19", model: "Gemini 3.1 Pro" },
  { date: "2026-02-14", model: "Mistral Large 3" },
  { date: "2026-02-12", model: "GPT-5.3" },
  { date: "2026-02-05", model: "Claude 4.6" },
  { date: "2026-01-28", model: "Gemini 3 Flash" },
  { date: "2026-01-22", model: "DeepSeek R2 Lite" },
  { date: "2026-01-15", model: "GPT-5.2" },
  { date: "2026-01-08", model: "DeepSeek R2" },
  { date: "2025-12-18", model: "Claude 4.5 Opus" },
  { date: "2025-12-10", model: "Gemini 3 Pro" },
  { date: "2025-12-03", model: "Grok 3.5" },
  { date: "2025-11-19", model: "GPT-5.1" },
  { date: "2025-11-12", model: "Mistral Medium 3" },
  { date: "2025-11-05", model: "Llama 4 Scout" },
];

function daysAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "1d ago";
  return `${diff}d ago`;
}

/* ── Model releases for the acceleration gap visual ── */
const modelReleases = [
  { month: "Jan", models: ["GPT-5.2", "Gemini 3 Flash", "DeepSeek R2"] },
  { month: "Feb", models: ["Claude 4.6", "Gemini 3.1 Pro", "GPT-5.3"] },
  { month: "Mar", models: ["GPT-5.4", "Gemini 3.1 Flash"] },
];

const proofPoints = [
  { metric: "62%", description: "faster role adaptation — your workforce keeps pace with every model release" },
  { metric: "3×", description: "model releases per month — your people adapt continuously, not annually" },
  { metric: "$4.1M", description: "risk reduction — from closing the gap between AI capability and workforce readiness" },
];

/* ── Loop nodes ── */
const loopNodes = [
  {
    id: "map",
    label: "Map",
    icon: Crosshair,
    tagline: "Detect what changed",
    description: "Every role, every task — scored for AI exposure. When new models ship, exposure scores update automatically. Your risk surface is always current.",
    highlights: ["Task-level scoring across entire org", "Auto-updates when AI capabilities shift", "400+ roles mapped in a single import"],
  },
  {
    id: "assess",
    label: "Assess",
    icon: Target,
    tagline: "Measure readiness now",
    description: "Calibrated simulations measure each employee across 4 readiness pillars. Not training completion — actual, tested capability against today's AI landscape.",
    highlights: ["4-pillar scoring model", "Calibrated to current AI capabilities", "Real performance data, not self-reports"],
  },
  {
    id: "train",
    label: "Train",
    icon: Brain,
    tagline: "Close gaps autonomously",
    description: "Targeted practice sessions auto-generated from each employee's weak points. No manual L&D design. The system trains your people while you focus on strategy.",
    highlights: ["Auto-generated from gap analysis", "Adaptive difficulty per employee", "Zero L&D overhead"],
  },
  {
    id: "adapt",
    label: "Adapt",
    icon: RefreshCw,
    tagline: "Never stop improving",
    description: "Scores below threshold trigger automatic re-simulation with coaching. When new models drop and exposure shifts, the loop accelerates. Your workforce evolves as fast as AI does.",
    highlights: ["Autonomous retry with coaching", "Model-aware re-scoring triggers", "Continuous — not quarterly"],
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

/* ═══════════════════════════════════════════
   Acceleration Gap Visual — two curves
   ═══════════════════════════════════════════ */
function AccelerationGapVisual() {
  // AI capability curve (steep, stepping up)
  const aiPoints = [0, 8, 12, 22, 28, 42, 48, 65, 72, 88, 92, 100];
  // Traditional L&D (flat, annual bump)
  const ldPoints = [0, 2, 4, 5, 6, 7, 8, 9, 15, 16, 17, 18];
  // With our platform (tracks AI curve)
  const platformPoints = [0, 6, 10, 18, 24, 36, 42, 56, 64, 78, 84, 92];

  const toPath = (points: number[]) => {
    const stepX = 100 / (points.length - 1);
    return points
      .map((y, i) => `${i === 0 ? "M" : "L"} ${i * stepX} ${100 - y}`)
      .join(" ");
  };

  return (
    <motion.div
      {...fadeUp}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="rounded-2xl border border-border bg-card p-5 sm:p-8"
    >
      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          The Acceleration Gap
        </span>
      </div>

      {/* Chart */}
      <div className="relative aspect-[2/1] w-full">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          {/* Grid lines */}
          {[20, 40, 60, 80].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="hsl(var(--border))" strokeWidth="0.3" strokeDasharray="2 2" />
          ))}

          {/* Gap fill between AI and L&D */}
          <motion.path
            d={`${toPath(aiPoints)} L 100 100 L 0 100 Z`}
            fill="hsl(var(--destructive) / 0.06)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1, duration: 0.8 }}
          />

          {/* Traditional L&D — flat */}
          <motion.path
            d={toPath(ldPoints)}
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1.5"
            strokeDasharray="3 2"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 1.2 }}
          />

          {/* AI capability — steep */}
          <motion.path
            d={toPath(aiPoints)}
            fill="none"
            stroke="hsl(var(--destructive))"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 1.2 }}
          />

          {/* Our platform — tracking AI (blue) */}
          <motion.path
            d={toPath(platformPoints)}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, duration: 1.2 }}
          />

          {/* Model release markers on AI curve */}
          {[3, 6, 9].map((i) => (
            <motion.circle
              key={i}
              cx={i * (100 / 11)}
              cy={100 - aiPoints[i]}
              r="1.5"
              fill="hsl(var(--destructive))"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.2 + i * 0.1 }}
            />
          ))}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-1 -translate-x-full pr-2">
          <span className="text-[10px] text-muted-foreground">High</span>
          <span className="text-[10px] text-muted-foreground">Low</span>
        </div>

        {/* X-axis label */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full pt-2 flex justify-between">
          <span className="text-[10px] text-muted-foreground">Today</span>
          <span className="text-[10px] text-muted-foreground">12 months</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-8 justify-center">
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-5 bg-destructive rounded" />
          <span className="text-xs text-muted-foreground">AI capability</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-5 bg-muted-foreground rounded" style={{ backgroundImage: "repeating-linear-gradient(90deg, hsl(var(--muted-foreground)) 0 3px, transparent 3px 5px)" }} />
          <span className="text-xs text-muted-foreground">Traditional L&D</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-5 rounded" style={{ backgroundColor: "#2563eb" }} />
          <span className="text-xs font-medium" style={{ color: "#2563eb" }}>With our platform</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   Model-Aware Re-scoring Visual
   ═══════════════════════════════════════════ */
function ModelAwareVisual() {
  const timeline = [
    { event: "GPT-5.4 released", type: "model" as const },
    { event: "12 tasks re-scored ↑ exposure", type: "rescore" as const },
    { event: "38 employees flagged for re-assessment", type: "trigger" as const },
    { event: "Simulations auto-dispatched", type: "action" as const },
    { event: "Readiness scores updated", type: "result" as const },
  ];

  const colors = {
    model: "bg-destructive/10 text-destructive border-destructive/20",
    rescore: "bg-accent/50 text-foreground border-border",
    trigger: "bg-accent/50 text-foreground border-border",
    action: "bg-primary/10 text-primary border-primary/20",
    result: "bg-primary/10 text-primary border-primary/20",
  };

  const icons = {
    model: Cpu,
    rescore: Radar,
    trigger: AlertTriangle,
    action: Zap,
    result: CheckCircle2,
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Radar className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Model-Aware Re-scoring
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        When a new frontier model ships, the system reacts autonomously:
      </p>
      <div className="space-y-2">
        {timeline.map((item, i) => {
          const Icon = icons[item.type];
          return (
            <motion.div
              key={item.event}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.12, duration: 0.35 }}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-xs ${colors[item.type]}`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{item.event}</span>
              {i < timeline.length - 1 && (
                <ArrowRight className="h-3 w-3 ml-auto opacity-40 shrink-0" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Recent model releases ticker
   ═══════════════════════════════════════════ */
function ModelReleaseTicker() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Frontier Releases — Last 90 Days
        </span>
      </div>
      <div className="space-y-3">
        {modelReleases.map((month, i) => (
          <motion.div
            key={month.month}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="flex items-start gap-3"
          >
            <span className="text-xs font-mono font-semibold text-foreground w-8 shrink-0 pt-0.5">
              {month.month}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {month.models.map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] text-muted-foreground"
                >
                  <Cpu className="h-2.5 w-2.5" />
                  {m}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
        <span className="text-[11px] text-muted-foreground">
          8 frontier models in 90 days. Is your workforce keeping up?
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Adaptive Loop Diagram
   ═══════════════════════════════════════════ */
function AdaptiveLoopDiagram({ activeNode, setActiveNode }: {
  activeNode: string | null;
  setActiveNode: (id: string | null) => void;
}) {
  const positions = [
    { x: 50, y: 15 },  // Map — top
    { x: 85, y: 50 },  // Assess — right
    { x: 50, y: 85 },  // Train — bottom
    { x: 15, y: 50 },  // Adapt — left
  ];

  return (
    <div className="relative w-full max-w-sm mx-auto aspect-square">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <circle cx="50" cy="50" r="32" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="3 2" />
        <motion.circle
          cx="50" cy="50" r="32"
          fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5"
          strokeDasharray="20 181" strokeLinecap="round"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "50px 50px" }}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Continuous</p>
          <p className="text-lg font-display font-semibold text-foreground -mt-0.5">Parity</p>
        </div>
      </div>

      {loopNodes.map((node, i) => {
        const pos = positions[i];
        const isActive = activeNode === node.id;
        return (
          <button
            key={node.id}
            className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onClick={() => setActiveNode(isActive ? null : node.id)}
          >
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-card border border-border text-foreground group-hover:border-primary/50 group-hover:shadow-md"
            }`}>
              <node.icon className="h-5 w-5" />
            </div>
            <span className={`text-xs font-semibold transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            }`}>
              {node.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function NodeDetail({ node }: { node: typeof loopNodes[0] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <node.icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-xl font-semibold text-foreground">{node.label}</h3>
          <p className="text-sm text-muted-foreground">{node.tagline}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{node.description}</p>
      <ul className="space-y-1.5">
        {node.highlights.map((h) => (
          <li key={h} className="flex items-center gap-2 text-sm text-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
            {h}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════ */
export default function Enterprise() {
  const navigate = useNavigate();
  const [activeNode, setActiveNode] = useState<string | null>("map");
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-rotate every 2s (synced with 8s circle / 4 nodes)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveNode((prev) => {
        const idx = loopNodes.findIndex((n) => n.id === prev);
        return loopNodes[(idx + 1) % loopNodes.length].id;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleNodeClick = useCallback((id: string) => {
    setActiveNode(id);
    setIsPaused(true);
    if (pauseTimeout.current) clearTimeout(pauseTimeout.current);
    pauseTimeout.current = setTimeout(() => setIsPaused(false), 6000);
  }, []);

  const activeNodeData = loopNodes.find((n) => n.id === activeNode) || null;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky ticker ── */}
      <div className="sticky top-14 z-40 w-full overflow-hidden border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="relative h-[28px] overflow-hidden">
          <div className="flex animate-[ticker_18s_linear_infinite] whitespace-nowrap items-center h-full">
            {[...FRONTIER_RELEASES, ...FRONTIER_RELEASES].map((r, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-4 text-[11px] shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive/70 shrink-0" />
                <span className="font-mono text-[10px] text-muted-foreground/60">{daysAgo(r.date)}</span>
                <span className="font-medium text-foreground/70">{r.model}</span>
                <span className="text-muted-foreground/50">released</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pt-12 pb-20">

        <div className="mx-auto max-w-4xl text-center">
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground mb-6">
              <Activity className="h-3.5 w-3.5" />
              Workforce Adaptation at AI Speed
            </span>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-foreground leading-[1.1] mt-4"
          >
            Frontier models ship monthly.{" "}
            <span className="italic">Your workforce adapts annually.</span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Eight frontier models in 90 days — each one shifts which tasks AI can handle.
            We keep your workforce in lockstep, continuously and autonomously.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button size="lg" className="gap-2 text-base px-8" onClick={() => navigate("/contact")}>
              Book a Demo <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="gap-2 text-base px-8" onClick={() => navigate("/case-study/anthropic")}>
              See Anthropic Case Study
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Trusted by ── */}
      <section className="px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
            Trusted by teams at leading organizations
          </p>
          <CompanyMarquee rows={MARQUEE_ROWS} />
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {stats.map((s) => (
            <motion.div key={s.label} {...fadeUp} className="px-6 py-8 text-center">
              <p className="font-display text-3xl font-semibold text-foreground">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── The Acceleration Gap ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              Close the acceleration gap
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              AI capabilities compound monthly. With the right system, your workforce compounds too —
              turning every model release into a catalyst for growth, not a source of disruption.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Chart — wider */}
            <div className="lg:col-span-3">
              <AccelerationGapVisual />
            </div>
            {/* Model releases — narrower */}
            <div className="lg:col-span-2">
              <ModelReleaseTicker />
            </div>
          </div>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 text-center text-sm text-muted-foreground max-w-lg mx-auto"
          >
            The blue line is the only one that matters. We make it possible.
          </motion.p>
        </div>
      </section>

      {/* ── The Continuous Parity Engine (Loop) ── */}
      <section className="px-4 py-20 bg-muted/20 border-y border-border">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-4">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              Continuous parity with AI
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Not a project. Not a quarterly review. A living system that adapts your
              workforce as fast as frontier models evolve.
            </p>
          </motion.div>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground mb-12"
          >
            Auto-rotating · Click any node to pause
          </motion.p>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.15 }}>
              <AdaptiveLoopDiagram activeNode={activeNode} setActiveNode={handleNodeClick} />
            </motion.div>
            <div className="min-h-[280px] flex items-center">
              <AnimatePresence mode="wait">
                {activeNodeData && (
                  <NodeDetail key={activeNodeData.id} node={activeNodeData} />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ── Model-Aware Re-scoring ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              Model-aware adaptation
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              When a new frontier model ships, your exposure landscape changes. Our system detects
              the shift, re-scores affected tasks, and autonomously triggers re-assessment — before
              your competitors even notice the release.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }}>
              <ModelAwareVisual />
            </motion.div>
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col justify-center space-y-6"
            >
              {[
                {
                  icon: Cpu,
                  title: "Automatic detection",
                  text: "New model capabilities are mapped to your task taxonomy. Tasks that were safe yesterday may be exposed today.",
                },
                {
                  icon: Radar,
                  title: "Instant re-scoring",
                  text: "Affected roles are re-scored in seconds, not months. Your risk surface is always current.",
                },
                {
                  icon: Zap,
                  title: "Autonomous response",
                  text: "Employees with newly-exposed tasks are automatically queued for re-assessment and targeted training.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex gap-3"
                >
                  <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Strategic Proof Points ── */}
      <section className="px-4 py-20 bg-muted/30 border-y border-border">
        <div className="mx-auto max-w-4xl">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              Velocity, measured
            </h2>
            <p className="mt-3 text-muted-foreground">
              The only metrics that matter: how fast can your workforce keep pace?
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {proofPoints.map((p, i) => (
              <motion.div
                key={p.metric}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="text-center"
              >
                <p className="font-display text-4xl font-semibold text-foreground">{p.metric}</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Case Study CTA ── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <motion.div
            {...fadeUp}
            className="rounded-2xl border border-border bg-card p-8 sm:p-10 text-center space-y-4"
          >
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Case Study</p>
            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
              See how Anthropic keeps 400+ roles in parity with frontier AI
            </h3>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Walk through the full platform — from ATS import to continuous adaptation dashboards — in a 6-step guided tour. No sign-up required.
            </p>
            <Button size="lg" onClick={() => navigate("/case-study/anthropic")} className="gap-2 mt-2">
              Start the Tour <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Enterprise trust ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              Enterprise-grade from day one
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Built for security-conscious organizations. Your data stays yours.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {trustFeatures.map((t, i) => (
              <motion.div key={t.title} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.05 }}>
                <Card className="h-full border-border/60 text-center">
                  <CardContent className="p-6 flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                      <t.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">{t.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-4 py-24 border-t border-border">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              Make every model release your advantage.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
              When AI evolves, your workforce evolves with it — continuously, autonomously, measurably.
              Turn acceleration into opportunity.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="gap-2 text-base px-8" onClick={() => navigate("/contact")}>
                Book a Demo <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="gap-2 text-base px-8" onClick={() => navigate("/how-it-works")}>
                How It Works
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
