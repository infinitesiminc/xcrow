import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, Lightbulb, Target, TrendingUp, Users, DollarSign,
  BarChart3, Rocket, ArrowRight, Globe, Zap, Shield, Brain, Layers,
  CheckCircle2, ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

function SectionHeader({ badge, title, subtitle }: { badge: string; title: string; subtitle?: string }) {
  return (
    <motion.div {...fadeUp} className="mb-8">
      <Badge variant="outline" className="mb-3 text-xs border-primary/30 text-primary">{badge}</Badge>
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{subtitle}</p>}
    </motion.div>
  );
}

function StatCard({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  return (
    <motion.div {...fadeUp}>
      <Card className="border-border/50 hover:border-primary/20 transition-colors">
        <CardContent className="p-5 text-center">
          <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Investors() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/30 via-background to-background" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge variant="outline" className="mb-4 text-xs border-primary/30 text-primary">
              Seed Round · 2026
            </Badge>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-foreground leading-tight tracking-tight">
              Every job is being rewritten by AI.<br />
              <span className="bg-gradient-to-r from-brand-ai to-brand-human bg-clip-text text-transparent">We help companies get ahead of it.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
              Infinite Sim is the AI readiness platform that decomposes every role into tasks,
              measures AI exposure, and upskills employees through adaptive simulations.
            </p>
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button size="lg" onClick={() => window.open("mailto:founders@infinitesim.ai", "_blank")}>
                <DollarSign className="h-4 w-4 mr-2" />
                Contact Founders
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/case-study/anthropic")}>
                See Product Demo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 pb-20 space-y-24">

        {/* ── Problem ── */}
        <section>
          <SectionHeader
            badge="The Problem"
            title="$8.5T in workforce disruption with no playbook"
            subtitle="AI agents are replacing task-level work faster than companies can react. Most HR leaders have no visibility into which roles are at risk or how to reskill at scale."
          />
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: AlertTriangle, stat: "40%", desc: "of core job tasks will be AI-exposed by 2028 (McKinsey)" },
              { icon: Users, stat: "87%", desc: "of HR leaders say they lack tools to assess AI impact on roles" },
              { icon: TrendingUp, stat: "$8.5T", desc: "unrealized productivity from delayed AI adoption (Accenture)" },
            ].map((item, i) => (
              <motion.div key={i} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }}>
                <Card className="border-brand-ai/20 bg-brand-ai/5 h-full">
                  <CardContent className="p-5">
                    <item.icon className="h-5 w-5 text-brand-ai mb-3" />
                    <p className="text-2xl font-bold text-foreground">{item.stat}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Solution ── */}
        <section>
          <SectionHeader
            badge="Our Solution"
            title="The Adaptive Workforce Engine"
            subtitle="An autonomous loop that maps AI exposure, measures readiness, closes gaps, and re-calibrates — continuously, without manual L&D overhead."
          />

          {/* Loop flow visual */}
          <motion.div {...fadeUp} className="mb-8">
            <Card className="border-brand-human/20 bg-gradient-to-br from-brand-ai/5 via-background to-brand-human/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                  {[
                    { icon: Layers, label: "Map", sub: "Detect exposure" },
                    { icon: Target, label: "Assess", sub: "Measure readiness" },
                    { icon: Brain, label: "Train", sub: "Close gaps" },
                    { icon: Zap, label: "Adapt", sub: "Re-calibrate" },
                  ].map((step, i) => (
                    <div key={step.label} className="flex items-center gap-2 sm:gap-4">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-xl bg-brand-human/10 flex items-center justify-center mb-1.5">
                          <step.icon className="h-5 w-5 text-brand-human" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">{step.label}</p>
                        <p className="text-[10px] text-muted-foreground">{step.sub}</p>
                      </div>
                      {i < 3 && <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-[-12px]" />}
                    </div>
                  ))}
                </div>
                <p className="text-center text-[10px] text-muted-foreground/60 mt-4">↻ Loop restarts automatically when new frontier models ship — workforce parity maintained continuously</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Component deep-dives with visuals */}
          <div className="space-y-4">
            {/* 1 — Map */}
            <motion.div {...fadeUp}>
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid sm:grid-cols-2">
                    <div className="p-5 sm:p-6 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-ai/10 flex items-center justify-center">
                          <Layers className="h-4 w-4 text-brand-ai" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">Map · AI Exposure Scoring</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">Every role decomposed into 8–15 task clusters, each scored for AI exposure. When new models ship, scores update automatically.</p>
                      <Badge variant="outline" className="text-[10px] border-brand-ai/20 text-brand-ai w-fit">400+ roles mapped in minutes</Badge>
                    </div>
                    <div className="bg-muted/20 border-l border-border/50 p-4 sm:p-5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium">Sample: Financial Analyst</p>
                      <div className="space-y-2">
                        {[
                          { task: "Financial Modeling", exposure: 78, state: "AI-Ready" },
                          { task: "Variance Analysis", exposure: 65, state: "Augmented" },
                          { task: "Board Reporting", exposure: 42, state: "Emerging" },
                          { task: "Stakeholder Advising", exposure: 15, state: "Human-Led" },
                        ].map((t) => (
                          <div key={t.task} className="flex items-center gap-2">
                            <span className="text-[10px] text-foreground w-28 truncate shrink-0">{t.task}</span>
                            <div className="flex-1 h-3 bg-muted/40 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${t.exposure >= 60 ? "bg-brand-ai/60" : t.exposure >= 40 ? "bg-brand-mid/60" : "bg-brand-human/60"}`}
                                initial={{ width: 0 }}
                                whileInView={{ width: `${t.exposure}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                              />
                            </div>
                            <span className="text-[9px] text-muted-foreground w-14 text-right shrink-0">{t.state}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 2 — Assess */}
            <motion.div {...fadeUp}>
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid sm:grid-cols-2">
                    <div className="p-5 sm:p-6 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-human/10 flex items-center justify-center">
                          <Target className="h-4 w-4 text-brand-human" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">Assess · Adaptive Simulations</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">Calibrated simulations measure each employee across 4 readiness pillars. Real tested capability, not self-reported surveys.</p>
                      <Badge variant="outline" className="text-[10px] border-brand-human/20 text-brand-human w-fit">4-pillar scoring model</Badge>
                    </div>
                    <div className="bg-muted/20 border-l border-border/50 p-4 sm:p-5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium">Readiness Pillars</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { pillar: "Tool Awareness", score: 82, color: "hsl(var(--brand-human) / 0.7)" },
                          { pillar: "Domain Judgment", score: 71, color: "hsl(var(--brand-mid) / 0.7)" },
                          { pillar: "Adaptive Thinking", score: 64, color: "hsl(var(--brand-human) / 0.5)" },
                          { pillar: "Human Value-Add", score: 88, color: "hsl(var(--brand-human) / 0.8)" },
                        ].map((p) => (
                          <div key={p.pillar} className="rounded-lg border border-border/30 p-2.5 bg-background/50">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] text-muted-foreground">{p.pillar}</span>
                              <span className="text-xs font-bold text-foreground">{p.score}</span>
                            </div>
                            <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                whileInView={{ width: `${p.score}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                style={{ backgroundColor: p.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 3 — Train */}
            <motion.div {...fadeUp}>
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid sm:grid-cols-2">
                    <div className="p-5 sm:p-6 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-human/10 flex items-center justify-center">
                          <Brain className="h-4 w-4 text-brand-human" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">Train · Auto-Generated Practice</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">Targeted practice sessions auto-generated from each employee's weak points. No manual L&D design — the system trains while you focus on strategy.</p>
                      <Badge variant="outline" className="text-[10px] border-brand-human/20 text-brand-human w-fit">Zero L&D overhead</Badge>
                    </div>
                    <div className="bg-muted/20 border-l border-border/50 p-4 sm:p-5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium">Adaptive Queue</p>
                      <div className="space-y-2">
                        {[
                          { task: "AI-Assisted Forecasting", weak: "Tool Awareness", score: 52, status: "In Progress" },
                          { task: "Prompt Engineering for Reports", weak: "Adaptive Thinking", score: 48, status: "Queued" },
                          { task: "Automated Compliance Check", weak: "Domain Judgment", score: 61, status: "Queued" },
                        ].map((s, i) => (
                          <div key={s.task} className="flex items-center gap-2 rounded-lg border border-border/30 bg-background/50 p-2">
                            <div className={`w-1.5 h-8 rounded-full shrink-0 ${i === 0 ? "bg-brand-human" : "bg-muted-foreground/20"}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-medium text-foreground truncate">{s.task}</p>
                              <p className="text-[9px] text-muted-foreground">Weak: {s.weak} ({s.score}%)</p>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 ${i === 0 ? "bg-brand-human/10 text-brand-human" : "bg-muted text-muted-foreground"}`}>{s.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 4 — Adapt */}
            <motion.div {...fadeUp}>
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid sm:grid-cols-2">
                    <div className="p-5 sm:p-6 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-mid/10 flex items-center justify-center">
                          <Zap className="h-4 w-4 text-brand-mid" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">Adapt · Model-Aware Re-Calibration</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">When new frontier models drop, exposure scores automatically re-calibrate and the loop accelerates. Your workforce evolves as fast as AI does.</p>
                      <Badge variant="outline" className="text-[10px] border-brand-mid/20 text-brand-mid w-fit">Continuous, not quarterly</Badge>
                    </div>
                    <div className="bg-muted/20 border-l border-border/50 p-4 sm:p-5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium">Auto Re-Calibration Timeline</p>
                      <div className="space-y-2.5">
                        {[
                          { date: "Mar 2026", event: "GPT-5 released", action: "Re-scored 400 roles", Icon: Zap },
                          { date: "Feb 2026", event: "Gemini 3 Pro", action: "18 roles escalated", Icon: AlertTriangle },
                          { date: "Jan 2026", event: "Claude 4 preview", action: "New sims generated", Icon: Brain },
                        ].map((e, i) => (
                          <div key={e.date} className="flex items-start gap-2.5">
                            <div className="flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? "bg-brand-ai/15" : "bg-muted/60"}`}>
                                <e.Icon className={`h-3 w-3 ${i === 0 ? "text-brand-ai" : "text-muted-foreground"}`} />
                              </div>
                              {i < 2 && <div className="w-px h-3 bg-border/50 mt-1" />}
                            </div>
                            <div>
                              <p className="text-[10px] font-medium text-foreground">{e.event}</p>
                              <p className="text-[9px] text-muted-foreground">{e.date} · {e.action}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* ── Market ── */}
        <section>
          <SectionHeader
            badge="Market Opportunity"
            title="$340B+ total addressable market"
            subtitle="Sitting at the intersection of HR Tech, AI consulting, and corporate L&D — three massive categories converging into one."
          />

          {/* Venn intersection visual */}
          <motion.div {...fadeUp} className="mb-6">
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="relative flex items-center justify-center h-[260px] sm:h-[300px]">
                  {/* Circle – HR Tech */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="absolute w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] rounded-full bg-brand-human/10 border border-brand-human/30 flex flex-col items-center justify-center -translate-x-[70px] sm:-translate-x-[90px] -translate-y-[30px]"
                  >
                    <span className="text-lg sm:text-xl font-bold text-brand-human">$230B+</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">HR Tech</span>
                  </motion.div>
                  {/* Circle – AI Consulting */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="absolute w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] rounded-full bg-brand-ai/10 border border-brand-ai/30 flex flex-col items-center justify-center translate-x-[70px] sm:translate-x-[90px] -translate-y-[30px]"
                  >
                    <span className="text-lg sm:text-xl font-bold text-brand-ai">$50B+</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">AI Consulting</span>
                  </motion.div>
                  {/* Circle – Corporate L&D */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="absolute w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] rounded-full bg-brand-mid/10 border border-brand-mid/30 flex flex-col items-center justify-center translate-y-[50px] sm:translate-y-[40px]"
                  >
                    <span className="text-lg sm:text-xl font-bold text-brand-mid">$60B+</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">Corporate L&D</span>
                  </motion.div>
                  {/* Center intersection */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.55 }}
                    className="absolute z-10 w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] rounded-full bg-gradient-to-br from-brand-ai/20 via-brand-mid/20 to-brand-human/20 border-2 border-foreground/20 flex flex-col items-center justify-center backdrop-blur-sm translate-y-[6px]"
                  >
                    <span className="text-[9px] sm:text-[10px] font-bold text-foreground leading-tight text-center">Infinite<br/>Sim</span>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard value="$230B+" label="HR Tech" icon={Globe} />
            <StatCard value="$50B+" label="AI Consulting" icon={Zap} />
            <StatCard value="$60B+" label="Corporate L&D" icon={Target} />
          </div>

          {/* Market gap breakdown */}
          <motion.div {...fadeUp}>
            <Card className="border-border/50">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">What Incumbents Miss — The White Space</p>
                <div className="space-y-5">
                  {[
                    {
                      market: "HR Tech",
                      size: "$230B+",
                      players: "Workday, SAP SuccessFactors, Eightfold",
                      gap: "Track employees, don't prepare them for AI disruption",
                      incumbentCoverage: 70,
                      missingCoverage: 15,
                      color: "brand-human",
                      capabilities: [
                        { name: "Employee records & payroll", has: true },
                        { name: "Skills taxonomy", has: true },
                        { name: "AI exposure analysis", has: false },
                        { name: "Task-level risk scoring", has: false },
                      ],
                    },
                    {
                      market: "AI Consulting",
                      size: "$50B+",
                      players: "McKinsey, Deloitte, BCG",
                      gap: "Manual, expensive ($500K+/engagement), one-time snapshots that go stale in weeks",
                      incumbentCoverage: 45,
                      missingCoverage: 20,
                      color: "brand-ai",
                      capabilities: [
                        { name: "Strategic AI assessment", has: true },
                        { name: "Executive advisory", has: true },
                        { name: "Continuous monitoring", has: false },
                        { name: "Automated re-calibration", has: false },
                      ],
                    },
                    {
                      market: "Corporate L&D",
                      size: "$60B+",
                      players: "LinkedIn Learning, Coursera, Udemy",
                      gap: "Generic course catalogs, no task-level personalization or exposure scoring",
                      incumbentCoverage: 60,
                      missingCoverage: 10,
                      color: "brand-mid",
                      capabilities: [
                        { name: "Course libraries", has: true },
                        { name: "Completion tracking", has: true },
                        { name: "Adaptive simulation training", has: false },
                        { name: "Role-specific AI readiness paths", has: false },
                      ],
                    },
                  ].map((seg) => (
                    <div key={seg.market} className="border border-border/40 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full bg-${seg.color}`} />
                          <span className="text-sm font-semibold text-foreground">{seg.market}</span>
                          <span className={`text-xs font-bold text-${seg.color}`}>{seg.size}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{seg.players}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 italic">"{seg.gap}"</p>

                      {/* Coverage bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Incumbent capability</span>
                          <span>White space</span>
                        </div>
                        <div className="h-3 w-full bg-muted/40 rounded-full overflow-hidden flex">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${seg.incumbentCoverage}%` }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className={`h-full bg-${seg.color}/30`}
                          />
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${100 - seg.incumbentCoverage}%` }}
                            transition={{ duration: 0.7, delay: 0.5 }}
                            className="h-full bg-brand-human/60 relative"
                          >
                            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-background">
                              Infinite Sim
                            </span>
                          </motion.div>
                        </div>
                      </div>

                      {/* Capability checklist */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {seg.capabilities.map((cap) => (
                          <div key={cap.name} className="flex items-center gap-1.5">
                            {cap.has ? (
                              <CheckCircle2 className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3 text-brand-human shrink-0" />
                            )}
                            <span className={`text-[10px] ${cap.has ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                              {cap.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* ── Product ── */}
        <section>
          <SectionHeader
            badge="Product"
            title="Live product — see it in action"
            subtitle="Our platform is live with real company data. The Anthropic case study walks through the full workflow."
          />
          <motion.div {...fadeUp}>
            <Card className="border-brand-human/20 bg-gradient-to-br from-brand-ai/5 via-background to-brand-human/5 overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="grid sm:grid-cols-2 gap-6 items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Anthropic Case Study</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      400+ roles decomposed, analyzed, and mapped in minutes.
                      Walk through the full ATS import → AI exposure analysis → simulation → action center pipeline.
                    </p>
                    <ul className="space-y-2 mb-6">
                      {["ATS auto-import & role decomposition", "Task-level AI exposure scoring", "Adaptive simulation engine", "Department scorecard & action center"].map((item) => (
                        <li key={item} className="flex items-center gap-2 text-xs text-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Button onClick={() => navigate("/case-study/anthropic")}>
                      View Live Demo
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard value="400+" label="Roles Mapped" icon={Layers} />
                    <StatCard value="<5min" label="Per Company" icon={Zap} />
                    <StatCard value="4" label="AI Readiness Pillars" icon={Brain} />
                    <StatCard value="85%" label="Task Coverage" icon={Target} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* ── Traction ── */}
        <section>
          <SectionHeader
            badge="Traction"
            title="Early signals of product-market fit"
          />
          <div className="grid sm:grid-cols-4 gap-4">
            <StatCard value="Live" label="Product Shipped" icon={Rocket} />
            <StatCard value="7-Step" label="Guided Case Study" icon={Layers} />
            <StatCard value="400+" label="Roles Analyzed" icon={BarChart3} />
            <StatCard value="B2B" label="Enterprise-Ready" icon={Shield} />
          </div>
        </section>

        {/* ── Business Model ── */}
        <section>
          <SectionHeader
            badge="Business Model"
            title="Per-role SaaS with built-in expansion"
            subtitle="Land with free analysis, convert to per-role billing ($29→$12/role/mo at scale), expand as orgs map more roles."
          />
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { title: "Free", price: "$0", arr: "—", example: "Individual ICs, consultants", features: ["1 role analysis", "1 simulation", "Personal dashboard"] },
              { title: "Growth", price: "From $19/role/mo", arr: "$50K–$250K", example: "Series A–C startups (50–200 roles)", highlighted: true, features: ["Unlimited analyses & sims", "Team dashboards & heatmaps", "Bulk ATS sync", "Volume discounts at scale"] },
              { title: "Enterprise", price: "Custom", arr: "$250K–$1M+", example: "Fortune 500 (1,000+ roles)", features: ["Everything in Growth", "SSO & admin controls", "Model-aware re-scoring SLA", "Dedicated account manager", "Custom integrations & API"] },
            ].map((tier, i) => (
              <motion.div key={i} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }}>
                <Card className={`h-full ${tier.highlighted ? "border-brand-human/30 bg-brand-human/5" : ""}`}>
                  <CardContent className="p-5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{tier.title}</p>
                    <p className="text-xl font-bold text-foreground mt-1">{tier.price}</p>
                    {tier.arr !== "—" && (
                      <p className="text-xs font-medium text-brand-human mt-0.5">ARR potential: {tier.arr}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 mt-1 italic">{tier.example}</p>
                    <ul className="mt-3 space-y-1.5">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* ARR scenario table */}
          <motion.div {...fadeUp} className="mt-6">
            <Card className="border-border/50">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Revenue Scenario · 100 Customers</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-2 text-muted-foreground font-medium">Segment</th>
                        <th className="text-left py-2 text-muted-foreground font-medium">Avg Roles</th>
                        <th className="text-left py-2 text-muted-foreground font-medium">Avg Price/Role</th>
                        <th className="text-right py-2 text-muted-foreground font-medium">ARR / Customer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { seg: "SMB (60%)", roles: "25", price: "$29", arr: "$8,700" },
                        { seg: "Mid-Market (30%)", roles: "150", price: "$15", arr: "$27,000" },
                        { seg: "Enterprise (10%)", roles: "1,000+", price: "Custom", arr: "$250,000+" },
                      ].map((row) => (
                        <tr key={row.seg} className="border-b border-border/20 last:border-0">
                          <td className="py-2 text-foreground font-medium">{row.seg}</td>
                          <td className="py-2 text-muted-foreground">{row.roles}</td>
                          <td className="py-2 text-muted-foreground">{row.price}</td>
                          <td className="py-2 text-right text-foreground font-semibold">{row.arr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-3">Blended ARR at 100 customers: ~$3.8M. Path to $10M+ with 250 customers.</p>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* ── Competitive Landscape ── */}
        <section>
          <SectionHeader
            badge="Competitive Landscape"
            title="Uniquely positioned at the intersection"
            subtitle="No incumbent combines real-time AI exposure analysis with adaptive simulation-based training."
          />
          <motion.div {...fadeUp}>
            <Card className="border-border/50">
              <CardContent className="p-5">
                {/* Quantified 2-axis chart */}
                <div className="relative w-full max-w-lg mx-auto" style={{ paddingBottom: "100%", maxHeight: "480px" }}>
                  <div className="absolute inset-0" style={{ left: "36px", bottom: "32px", right: "8px", top: "8px" }}>
                    {/* White space highlight — upper-right quadrant */}
                    <div className="absolute rounded-lg bg-brand-human/5 border border-brand-human/10"
                      style={{ left: "50%", bottom: "50%", width: "50%", height: "50%" }} />

                    {/* Gridlines */}
                    {[0, 2, 4, 6, 8, 10].map((tick) => (
                      <div key={`grid-${tick}`}>
                        <div className="absolute top-0 bottom-0 border-l border-dashed border-border/15" style={{ left: `${tick * 10}%` }} />
                        <div className="absolute left-0 right-0 border-t border-dashed border-border/15" style={{ bottom: `${tick * 10}%` }} />
                      </div>
                    ))}

                    {/* Axes */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-border/60" />
                    <div className="absolute top-0 bottom-0 left-0 w-px bg-border/60" />

                    {/* X-axis tick labels */}
                    {[0, 2, 4, 6, 8, 10].map((tick) => (
                      <span key={`x-${tick}`} className="absolute text-[9px] text-muted-foreground/50 font-mono"
                        style={{ left: `${tick * 10}%`, bottom: "-16px", transform: "translateX(-50%)" }}>
                        {tick}
                      </span>
                    ))}
                    {/* Y-axis tick labels */}
                    {[0, 2, 4, 6, 8, 10].map((tick) => (
                      <span key={`y-${tick}`} className="absolute text-[9px] text-muted-foreground/50 font-mono"
                        style={{ left: "-28px", bottom: `${tick * 10}%`, transform: "translateY(50%)" }}>
                        {tick}
                      </span>
                    ))}

                    {/* Axis labels */}
                    <span className="absolute text-[10px] text-muted-foreground font-medium uppercase tracking-wider"
                      style={{ bottom: "-28px", left: "50%", transform: "translateX(-50%)" }}>
                      AI Exposure Intelligence →
                    </span>
                    <span className="absolute text-[10px] text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap"
                      style={{ left: "-34px", top: "50%", transform: "translateY(-50%) rotate(-90deg)" }}>
                      Adaptive Upskilling →
                    </span>

                    {/* Quadrant labels */}
                    <span className="absolute top-2 left-2 text-[8px] text-muted-foreground/30 uppercase leading-tight pointer-events-none">Training Without<br />Intelligence</span>
                    <span className="absolute top-2 right-2 text-[8px] text-brand-human/40 uppercase text-right font-semibold leading-tight pointer-events-none">Adaptive AI<br />Readiness</span>
                    <span className="absolute bottom-2 left-2 text-[8px] text-muted-foreground/30 uppercase leading-tight pointer-events-none">Blind<br />Spot</span>
                    <span className="absolute bottom-2 right-2 text-[8px] text-muted-foreground/30 uppercase text-right leading-tight pointer-events-none">Analysis<br />Without Action</span>

                    {/* Competitors — spread out with offset labels to avoid overlap */}
                    {[
                      { name: "LinkedIn Learning", x: 1.5, y: 6.5, labelPos: "right" as const },
                      { name: "Coursera",          x: 1,   y: 4.5, labelPos: "right" as const },
                      { name: "McKinsey",           x: 7,   y: 2,   labelPos: "top" as const },
                      { name: "Deloitte",           x: 5.5, y: 1,   labelPos: "top" as const },
                      { name: "Eightfold",          x: 5,   y: 4,   labelPos: "left" as const },
                      { name: "Gloat",              x: 3.5, y: 3,   labelPos: "right" as const },
                      { name: "Workday",            x: 2.5, y: 1.5, labelPos: "right" as const },
                    ].map((c) => (
                      <div
                        key={c.name}
                        className="absolute group"
                        style={{ left: `${c.x * 10}%`, bottom: `${c.y * 10}%`, transform: "translate(-50%, 50%)" }}
                      >
                        <div className="h-2.5 w-2.5 rounded-full bg-brand-ai/50 border border-brand-ai/30" />
                        <span className={`absolute text-[10px] font-medium whitespace-nowrap text-muted-foreground ${
                          c.labelPos === "right" ? "left-4 top-1/2 -translate-y-1/2" :
                          c.labelPos === "left"  ? "right-4 top-1/2 -translate-y-1/2" :
                          "bottom-4 left-1/2 -translate-x-1/2"
                        }`}>
                          {c.name}
                        </span>
                      </div>
                    ))}

                    {/* Infinite Sim — leader position */}
                    <div
                      className="absolute"
                      style={{ left: "90%", bottom: "90%", transform: "translate(-50%, 50%)" }}
                    >
                      <div className="h-4 w-4 rounded-full bg-brand-human ring-4 ring-brand-human/20 shadow-lg shadow-brand-human/30" />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold whitespace-nowrap text-brand-human">
                        Infinite Sim
                      </span>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-8 grid sm:grid-cols-3 gap-3">
                  {[
                    { name: "Consultancies (McKinsey, Deloitte)", gap: "Deep analysis but manual, $500K+ per engagement, no ongoing training" },
                    { name: "L&D Platforms (LinkedIn, Coursera)", gap: "Scalable training but generic content, zero AI exposure insight" },
                    { name: "HR Tech (Eightfold, Gloat, Workday)", gap: "Skills taxonomies but no task-level AI risk scoring or simulations" },
                  ].map((comp) => (
                    <div key={comp.name} className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs font-medium text-foreground mb-1">{comp.name}</p>
                      <p className="text-[10px] text-muted-foreground">{comp.gap}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* ── Team ── */}
        <section>
          <SectionHeader
            badge="Team"
            title="Built by operators who've seen the problem firsthand"
            subtitle="We've worked across AI, enterprise SaaS, and workforce strategy. We're building the tool we wish we'd had."
          />
          <motion.div {...fadeUp}>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Founding team details available upon request.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => window.open("mailto:founders@infinitesim.ai", "_blank")}>
                  Request Intro Deck
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* ── AI Exposure Data ── */}
        <section>
          <SectionHeader
            badge="Our Data Advantage"
            title="100M+ job posts mapped to AI exposure"
            subtitle="We've scored task-level AI exposure across industries and company scales — revealing massive readiness gaps no one else can see."
          />

          {/* Industry exposure chart */}
          <motion.div {...fadeUp}>
            <Card className="border-border/50">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Avg. AI Exposure by Industry</p>
                <div className="space-y-3">
                  {[
                    { industry: "Financial Services", exposure: 72, roles: "18M" },
                    { industry: "Technology", exposure: 68, roles: "22M" },
                    { industry: "Professional Services", exposure: 65, roles: "14M" },
                    { industry: "Healthcare Admin", exposure: 61, roles: "12M" },
                    { industry: "Media & Marketing", exposure: 58, roles: "9M" },
                    { industry: "Retail & E-Commerce", exposure: 54, roles: "11M" },
                    { industry: "Manufacturing", exposure: 41, roles: "8M" },
                    { industry: "Construction & Trades", exposure: 23, roles: "6M" },
                  ].map((row) => (
                    <div key={row.industry} className="flex items-center gap-3">
                      <span className="text-xs text-foreground w-40 shrink-0 truncate">{row.industry}</span>
                      <div className="flex-1 h-5 bg-muted/40 rounded-full overflow-hidden relative">
                         <motion.div
                           className={`h-full rounded-full ${row.exposure >= 60 ? "bg-brand-ai/70" : row.exposure >= 40 ? "bg-brand-mid/70" : "bg-brand-human/70"}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${row.exposure}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.1 }}
                        />
                        <span className="absolute inset-y-0 right-2 flex items-center text-[10px] font-mono text-muted-foreground">{row.exposure}%</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 w-10 text-right shrink-0">{row.roles}</span>
                    </div>
                  ))}
                </div>
                 <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
                   <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-ai/70" /> High (&gt;60%)</span>
                   <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-mid/70" /> Moderate (40–60%)</span>
                   <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-human/70" /> Lower (&lt;40%)</span>
                  <span className="ml-auto">Posts analyzed ↗</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Company scale gap */}
          <motion.div {...fadeUp} className="mt-4">
            <Card className="border-border/50">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">AI Readiness Gap by Company Scale</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { scale: "Startup\n(1–50)", exposure: 64, readiness: 38, gap: 26 },
                    { scale: "SMB\n(50–500)", exposure: 61, readiness: 22, gap: 39 },
                    { scale: "Mid-Market\n(500–5K)", exposure: 58, readiness: 15, gap: 43 },
                    { scale: "Enterprise\n(5K+)", exposure: 55, readiness: 11, gap: 44 },
                  ].map((col) => (
                    <div key={col.scale} className="text-center">
                      <div className="relative h-40 flex items-end justify-center gap-1 mb-2">
                        <motion.div
                          className="w-6 bg-brand-ai/50 rounded-t"
                          initial={{ height: 0 }}
                          whileInView={{ height: `${col.exposure * 1.4}px` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6 }}
                        />
                        <motion.div
                          className="w-6 bg-brand-human/50 rounded-t"
                          initial={{ height: 0 }}
                          whileInView={{ height: `${col.readiness * 1.4}px` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.15 }}
                        />
                      </div>
                      <p className="text-[10px] text-foreground font-medium whitespace-pre-line leading-tight">{col.scale}</p>
                       <div className="mt-1.5 px-2 py-1 rounded bg-brand-ai/10">
                         <p className="text-xs font-bold text-brand-ai">{col.gap}pt gap</p>
                      </div>
                    </div>
                  ))}
                </div>
                 <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
                   <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-ai/50" /> AI Exposure</span>
                   <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-human/50" /> Workforce Readiness</span>
                   <span className="ml-auto text-brand-ai font-medium">Gap widens with company size →</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>


      </div>
    </div>
  );
}
