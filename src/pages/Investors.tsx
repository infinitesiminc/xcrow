import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, Lightbulb, Target, TrendingUp, Users, DollarSign,
  BarChart3, Rocket, ArrowRight, Globe, Zap, Shield, Brain, Layers,
  CheckCircle2, ChevronDown, ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.45 },
};

/* ── Appendix toggle ── */
function AppendixSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div {...fadeUp} id={id}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 border-b border-border/40 group"
      >
        <span className="text-base font-semibold text-foreground group-hover:text-brand-ai transition-colors">{title}</span>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
          className="pt-6 pb-2"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function Investors() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">

      {/* ═══════════════════════════════════════════════
          HERO — 3 seconds
      ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-5 pt-20 pb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/30 via-background to-background" />
        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              Seed Round · 2026
            </Badge>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
              Every job is being rewritten by AI.
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-lg text-muted-foreground">
              We help companies get ahead of it.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-5 pb-20">

        {/* ═══════════════════════════════════════════════
            EXEC SUMMARY — 15-second scan
        ═══════════════════════════════════════════════ */}
        <section className="space-y-10 mb-20">

          {/* Scale of disruption */}
          <motion.div {...fadeUp}>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
              The Disruption
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { stat: "$8.5T", label: "Unrealized productivity from delayed AI adoption", source: "Accenture" },
                { stat: "40%", label: "Of core job tasks will be AI-exposed by 2028", source: "McKinsey" },
                { stat: "87%", label: "Of HR leaders lack tools to assess AI impact on roles", source: "Survey" },
                { stat: "0", label: "Platforms that map + train + adapt continuously", source: "Market gap" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                  className="rounded-xl border border-brand-ai/15 bg-brand-ai/5 p-5"
                >
                  <p className="text-3xl sm:text-4xl font-bold text-brand-ai leading-none">{item.stat}</p>
                  <p className="text-sm text-foreground mt-2 leading-snug">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.source}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* What we do — one sentence + loop */}
          <motion.div {...fadeUp}>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              What We Do
            </h2>
            <p className="text-base text-muted-foreground mb-6">
              An autonomous engine that maps every role's AI exposure, measures employee readiness, closes gaps through simulations, and re-calibrates when new models ship.
            </p>
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              {[
                { icon: Layers, label: "Map" },
                { icon: Target, label: "Assess" },
                { icon: Brain, label: "Train" },
                { icon: Zap, label: "Adapt" },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-2 sm:gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-ai/10 flex items-center justify-center">
                      <step.icon className="h-6 w-6 sm:h-7 sm:w-7 text-brand-ai" />
                    </div>
                    <p className="text-sm font-semibold text-foreground mt-2">{step.label}</p>
                  </div>
                  {i < 3 && <ArrowRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />}
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground/50 mt-3">↻ Loop re-runs automatically when new frontier models ship</p>
          </motion.div>

          {/* The Creation Shift */}
          <motion.div {...fadeUp}>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              The Job Description Is Dead
            </h2>
            <p className="text-base text-muted-foreground mb-6">
              AI agents are automating tasks. But the real shift is bigger: companies are pushing employees <span className="text-foreground font-semibold">up the value chain — from execution to creation</span>.
            </p>

            <div className="space-y-4">
              {/* Signal cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    signal: "Cash Prizes for Vibe-Coding",
                    detail: "Companies now offer bounties for employees who build and ship AI-powered apps to sell to clients — work that never existed in any job description.",
                  },
                  {
                    signal: "Every Employee = Builder",
                    detail: "When anyone can vibe-code a product in a weekend, the value of pure task execution drops to zero. The new currency is creation.",
                  },
                  {
                    signal: "AI Agents Replace Tasks",
                    detail: "Agents handle scheduling, reporting, data entry. What's left? Judgment, creativity, and the ability to build what doesn't exist yet.",
                  },
                  {
                    signal: "Job Descriptions Can't Keep Up",
                    detail: "Static JDs describe yesterday's work. The real job is whatever creates value tomorrow — and that changes weekly.",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.signal}
                    {...fadeUp}
                    transition={{ ...fadeUp.transition, delay: i * 0.06 }}
                    className="rounded-xl border border-brand-ai/15 bg-card p-5"
                  >
                    <p className="text-base font-semibold text-foreground mb-1">{item.signal}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.detail}</p>
                  </motion.div>
                ))}
              </div>

              {/* Why we still win */}
              <div className="rounded-2xl border border-brand-ai/20 bg-brand-ai/5 p-6">
                <p className="text-base font-bold text-foreground mb-3">Why Our Engine Catches This</p>
                <div className="space-y-3">
                  {[
                    { point: "Task-level skill graph trained on 100M+ jobs", detail: "We don't analyze job titles — we decompose roles into atomic tasks and score each one. When the task landscape shifts, we see it." },
                    { point: "Instant training when new AI capability drops", detail: "The moment a new model ships, new simulations are generated automatically. No waiting for L&D to design a course." },
                    { point: "Same engine powers creation skills", detail: "Hiring, onboarding, training, internal movement, assessment, even new project staffing — one engine, every use case. Including the skills employees need to build, not just execute." },
                    { point: "Plug and play — employees in training within minutes", detail: "No 6-month rollout. No IT project. Connect your org chart and employees are upskilling the same day." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-brand-ai shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.point}</p>
                        <p className="text-sm text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-sm text-muted-foreground italic">
                The acceleration gap isn't just about keeping up with AI — it's about preparing every employee to create value that AI can't automate. That's the real moat.
              </p>
            </div>
          </motion.div>

          {/* ROI headline */}
          <motion.div {...fadeUp}>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Enterprise ROI
            </h2>
            <p className="text-base text-muted-foreground mb-6">
              Every company should map its entire employee base 1:1. Here's what that unlocks.
            </p>

            {/* Giant ROI callout */}
            <div className="rounded-2xl bg-brand-ai/10 border border-brand-ai/20 p-6 sm:p-8 text-center mb-6">
              <p className="text-5xl sm:text-6xl font-bold text-brand-ai leading-none" style={{ textShadow: "0 0 30px hsl(var(--brand-ai) / 0.3)" }}>
                23–56×
              </p>
              <p className="text-lg font-semibold text-foreground mt-2">Return on Investment</p>
              <p className="text-sm text-muted-foreground mt-1">$5.8M–$14M value created vs. $250K contract</p>
            </div>

            {/* Industry examples — big, scannable */}
            <div className="space-y-3">
              {[
                { company: "JPMorgan Chase", industry: "Finance", employees: "310K", value: "$36M–$87M/yr" },
                { company: "Amazon", industry: "Tech / Retail", employees: "1.5M", value: "$174M–$420M/yr" },
                { company: "UnitedHealth", industry: "Healthcare", employees: "400K", value: "$46M–$112M/yr" },
                { company: "Deloitte", industry: "Prof. Services", employees: "460K", value: "$53M–$129M/yr" },
                { company: "Walmart", industry: "Retail", employees: "2.1M", value: "$243M–$588M/yr" },
              ].map((row, i) => (
                <motion.div
                  key={row.company}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.06 }}
                  className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-4"
                >
                  <div>
                    <p className="text-base font-semibold text-foreground">{row.company}</p>
                    <p className="text-sm text-muted-foreground">{row.industry} · {row.employees} employees</p>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-brand-ai text-right">{row.value}</p>
                </motion.div>
              ))}
              <p className="text-xs text-muted-foreground">At $10/employee/yr · Value modeled at $1,160–$2,800/employee/yr</p>
            </div>
          </motion.div>

          {/* TAM — single line */}
          <motion.div {...fadeUp}>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              $340B+ Market
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "HR Tech", value: "$230B+" },
                { label: "AI Consulting", value: "$50B+" },
                { label: "Corporate L&D", value: "$60B+" },
              ].map((seg) => (
                <div key={seg.label} className="text-center rounded-xl border border-border/40 bg-card p-4">
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{seg.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{seg.label}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              We sit at the intersection — no incumbent combines real-time AI exposure analysis with adaptive simulation training.
            </p>
          </motion.div>

          {/* Business model — one card */}
          <motion.div {...fadeUp}>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Business Model
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { tier: "Free", price: "$0", desc: "1 role, 1 sim" },
                { tier: "Growth", price: "From $19/role", desc: "Teams, bulk sync", highlighted: true },
                { tier: "Enterprise", price: "Custom", desc: "Full org mapping" },
              ].map((t) => (
                <div key={t.tier} className={`rounded-xl border p-4 text-center ${t.highlighted ? "border-brand-ai/30 bg-brand-ai/5" : "border-border/40 bg-card"}`}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">{t.tier}</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{t.price}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">Land with free analysis → convert to per-role billing → expand as orgs map more roles.</p>
          </motion.div>

          {/* CTA */}
          <motion.div {...fadeUp} className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <Button size="lg" className="w-full sm:w-auto" onClick={() => window.open("mailto:founders@infinitesim.ai", "_blank")}>
              <DollarSign className="h-4 w-4 mr-2" />
              Contact Founders
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={() => navigate("/case-study/anthropic")}>
              See Product Demo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════════
            APPENDIX — Detailed supporting data
        ═══════════════════════════════════════════════ */}
        <section>
          <motion.div {...fadeUp} className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Appendix</h2>
            <p className="text-sm text-muted-foreground mt-1">Tap any section to expand supporting data.</p>
          </motion.div>

          <div className="space-y-0">

            {/* A1: Solution Deep-Dive */}
            <AppendixSection id="solution-detail" title="Solution Deep-Dive">
              <div className="space-y-4">
                {[
                  {
                    icon: Layers, label: "Map · AI Exposure Scoring",
                    desc: "Every role decomposed into 8–15 task clusters, each scored for AI exposure. When new models ship, scores update automatically.",
                    detail: "400+ roles mapped in minutes",
                    sample: [
                      { task: "Financial Modeling", exposure: 78 },
                      { task: "Variance Analysis", exposure: 65 },
                      { task: "Board Reporting", exposure: 42 },
                      { task: "Stakeholder Advising", exposure: 15 },
                    ],
                  },
                  {
                    icon: Target, label: "Assess · Adaptive Simulations",
                    desc: "Calibrated simulations measure each employee across 4 readiness pillars. Real tested capability, not self-reported surveys.",
                    detail: "4-pillar scoring model",
                    pillars: [
                      { name: "Tool Awareness", score: 82 },
                      { name: "Domain Judgment", score: 71 },
                      { name: "Adaptive Thinking", score: 64 },
                      { name: "Human Value-Add", score: 88 },
                    ],
                  },
                  {
                    icon: Brain, label: "Train · Auto-Generated Practice",
                    desc: "Targeted practice sessions auto-generated from each employee's weak points. No manual L&D design.",
                    detail: "Zero L&D overhead",
                  },
                  {
                    icon: Zap, label: "Adapt · Model-Aware Re-Calibration",
                    desc: "When new frontier models drop, exposure scores automatically re-calibrate. Your workforce evolves as fast as AI does.",
                    detail: "Continuous, not quarterly",
                  },
                ].map((step) => (
                  <Card key={step.label} className="border-border/40">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-brand-ai/10 flex items-center justify-center shrink-0">
                          <step.icon className="h-5 w-5 text-brand-ai" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-foreground">{step.label}</h3>
                          <Badge variant="outline" className="text-xs border-brand-ai/20 text-brand-ai mt-0.5">{step.detail}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>

                      {step.sample && (
                        <div className="mt-4 space-y-2">
                          {step.sample.map((t) => (
                            <div key={t.task} className="flex items-center gap-3">
                              <span className="text-sm text-foreground w-36 shrink-0">{t.task}</span>
                              <div className="flex-1 h-4 bg-muted/40 rounded-full overflow-hidden">
                                <motion.div
                                  className={`h-full rounded-full ${t.exposure >= 60 ? "bg-brand-ai/60" : t.exposure >= 40 ? "bg-brand-mid/60" : "bg-brand-human/60"}`}
                                  initial={{ width: 0 }}
                                  whileInView={{ width: `${t.exposure}%` }}
                                  viewport={{ once: true }}
                                  transition={{ duration: 0.6 }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground w-10 text-right">{t.exposure}%</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {step.pillars && (
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          {step.pillars.map((p) => (
                            <div key={p.name} className="rounded-lg border border-border/30 p-3">
                              <div className="flex justify-between mb-2">
                                <span className="text-sm text-muted-foreground">{p.name}</span>
                                <span className="text-sm font-bold text-foreground">{p.score}</span>
                              </div>
                              <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-brand-ai/60"
                                  initial={{ width: 0 }}
                                  whileInView={{ width: `${p.score}%` }}
                                  viewport={{ once: true }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AppendixSection>

            {/* A2: ROI Breakdown */}
            <AppendixSection id="roi-detail" title="ROI Value Drivers">
              <div className="space-y-4">
                {[
                  { driver: "Avoided mis-hires & reskill waste", range: "$2.5M–$5M/yr", width: "85%", logic: "~5% workforce in wrong-fit roles × $50K avg replacement cost" },
                  { driver: "Faster redeployment", range: "$1M–$3M/yr", width: "55%", logic: "Weeks saved per mobility decision × 100+ moves/yr" },
                  { driver: "Attrition reduction", range: "$1M–$3M/yr", width: "55%", logic: "Proactive career pathing reduces voluntary turnover 5–10%" },
                  { driver: "Training budget efficiency", range: "$800K–$2M/yr", width: "40%", logic: "20–30% L&D spend redirected to targeted upskilling" },
                  { driver: "Reduced consultant spend", range: "$500K–$1M/yr", width: "25%", logic: "Replaces 2–4 McKinsey/Deloitte workforce strategy engagements" },
                ].map((d, i) => (
                  <div key={d.driver}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-sm font-medium text-foreground">{d.driver}</span>
                      <span className="text-sm font-semibold text-brand-ai">{d.range}</span>
                    </div>
                    <div className="h-4 bg-muted/40 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-brand-ai rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: d.width }}
                        transition={{ duration: 0.8, delay: i * 0.08 }}
                        viewport={{ once: true }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{d.logic}</p>
                  </div>
                ))}

                <div className="pt-3 border-t border-border/30">
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-sm text-muted-foreground">They pay us</span>
                    <span className="text-sm font-semibold text-muted-foreground">$250K/yr</span>
                  </div>
                  <div className="h-4 bg-muted/40 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-muted-foreground/30 rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: "4%" }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                      viewport={{ once: true }}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">Based on a 5,000-employee enterprise at $10/employee/yr.</p>
              </div>
            </AppendixSection>

            {/* A3: Competitive Landscape */}
            <AppendixSection id="competitive" title="Competitive Landscape">
              <Card className="border-border/40">
                <CardContent className="p-5">
                  <div className="relative w-full aspect-square max-w-sm mx-auto ml-8 mb-8">
                    {/* White space highlight */}
                    <div className="absolute rounded-lg bg-brand-ai/5 border border-brand-ai/10"
                      style={{ left: "50%", bottom: "50%", width: "50%", height: "50%" }} />

                    {[0, 2, 4, 6, 8, 10].map((tick) => {
                      const pct = `${tick * 10}%`;
                      return (
                        <div key={tick}>
                          <div className="absolute top-0 bottom-0 border-l border-dashed border-border/20" style={{ left: pct }} />
                          <div className="absolute left-0 right-0 border-t border-dashed border-border/20" style={{ bottom: pct }} />
                        </div>
                      );
                    })}

                    <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
                    <div className="absolute top-0 bottom-0 left-0 w-px bg-border" />

                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium">AI Exposure Intelligence →</span>
                    <span className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground font-medium whitespace-nowrap">Adaptive Upskilling →</span>

                    {[
                      { name: "LinkedIn Learning", x: 1.5, y: 5.5 },
                      { name: "Coursera", x: 1, y: 5 },
                      { name: "McKinsey", x: 6, y: 2 },
                      { name: "Deloitte", x: 5.5, y: 1.5 },
                      { name: "Eightfold", x: 5, y: 3 },
                      { name: "Gloat", x: 4.5, y: 3.5 },
                      { name: "Workday", x: 3, y: 2.5 },
                    ].map((c) => (
                      <div
                        key={c.name}
                        className="absolute flex flex-col items-center"
                        style={{ left: `${c.x * 10}%`, bottom: `${c.y * 10}%`, transform: "translate(-50%, 50%)" }}
                      >
                        <span className="text-xs font-medium mb-1 whitespace-nowrap text-muted-foreground">{c.name}</span>
                        <div className="h-3 w-3 rounded-full bg-brand-human/40" />
                      </div>
                    ))}

                    <div
                      className="absolute flex flex-col items-center"
                      style={{ left: "95%", bottom: "95%", transform: "translate(-50%, 50%)" }}
                    >
                      <span className="text-sm font-bold mb-1 whitespace-nowrap text-brand-ai">Infinite Sim</span>
                      <div className="h-4 w-4 rounded-full bg-brand-ai ring-4 ring-brand-ai/20 shadow-lg shadow-brand-ai/30" />
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    {[
                      { name: "Consultancies", gap: "Deep analysis but manual, $500K+/engagement, no ongoing training" },
                      { name: "L&D Platforms", gap: "Scalable training but generic content, zero AI exposure insight" },
                      { name: "HR Tech", gap: "Skills taxonomies but no task-level AI risk scoring or simulations" },
                    ].map((comp) => (
                      <div key={comp.name} className="p-3 rounded-lg bg-muted/30">
                        <p className="text-sm font-medium text-foreground mb-1">{comp.name}</p>
                        <p className="text-sm text-muted-foreground">{comp.gap}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </AppendixSection>

            {/* A4: Full Industry ROI Table */}
            <AppendixSection id="roi-table" title="Per-Industry ROI Table">
              <Card className="border-border/40">
                <CardContent className="p-5">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/30">
                          <th className="text-left py-2 text-muted-foreground font-medium">Company</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">Employees</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">Contract</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { company: "JPMorgan Chase", employees: "310K", contract: "$3.1M", value: "$36M–$87M" },
                          { company: "Deloitte", employees: "460K", contract: "$4.6M", value: "$53M–$129M" },
                          { company: "UnitedHealth Group", employees: "400K", contract: "$4.0M", value: "$46M–$112M" },
                          { company: "Amazon", employees: "1.5M", contract: "$15M", value: "$174M–$420M" },
                          { company: "Siemens", employees: "320K", contract: "$3.2M", value: "$37M–$90M" },
                          { company: "Walt Disney Co.", employees: "225K", contract: "$2.3M", value: "$26M–$63M" },
                          { company: "Walmart", employees: "2.1M", contract: "$21M", value: "$243M–$588M" },
                        ].map((row) => (
                          <tr key={row.company} className="border-b border-border/10">
                            <td className="py-2 text-foreground font-medium">{row.company}</td>
                            <td className="py-2 text-right text-muted-foreground">{row.employees}</td>
                            <td className="py-2 text-right text-muted-foreground">{row.contract}/yr</td>
                            <td className="py-2 text-right text-brand-ai font-semibold">{row.value}/yr</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Contract = $10/employee/yr. Value = $1,160–$2,800/employee/yr.</p>
                </CardContent>
              </Card>
            </AppendixSection>

            {/* A5: Revenue Scenarios */}
            <AppendixSection id="revenue" title="Revenue Scenarios">
              <Card className="border-border/40">
                <CardContent className="p-5">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">100 Customers</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-2 text-muted-foreground font-medium">Segment</th>
                          <th className="text-left py-2 text-muted-foreground font-medium">Avg Roles</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">ARR / Customer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { seg: "SMB (60%)", roles: "25", arr: "$8,700" },
                          { seg: "Mid-Market (30%)", roles: "150", arr: "$27,000" },
                          { seg: "Enterprise (10%)", roles: "1,000+", arr: "$250,000+" },
                        ].map((row) => (
                          <tr key={row.seg} className="border-b border-border/20 last:border-0">
                            <td className="py-2 text-foreground font-medium">{row.seg}</td>
                            <td className="py-2 text-muted-foreground">{row.roles}</td>
                            <td className="py-2 text-right text-foreground font-semibold">{row.arr}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Blended ARR at 100 customers: ~$3.8M. Path to $10M+ with 250 customers.</p>
                </CardContent>
              </Card>
            </AppendixSection>

            {/* A6: AI Exposure Data */}
            <AppendixSection id="exposure-data" title="AI Exposure Data by Industry">
              <Card className="border-border/40">
                <CardContent className="p-5">
                  <div className="space-y-3">
                    {[
                      { industry: "Financial Services", exposure: 72 },
                      { industry: "Technology", exposure: 68 },
                      { industry: "Professional Services", exposure: 65 },
                      { industry: "Healthcare Admin", exposure: 61 },
                      { industry: "Media & Marketing", exposure: 58 },
                      { industry: "Retail & E-Commerce", exposure: 54 },
                      { industry: "Manufacturing", exposure: 41 },
                      { industry: "Construction & Trades", exposure: 23 },
                    ].map((row) => (
                      <div key={row.industry} className="flex items-center gap-3">
                        <span className="text-sm text-foreground w-44 shrink-0">{row.industry}</span>
                        <div className="flex-1 h-5 bg-muted/40 rounded-full overflow-hidden relative">
                          <motion.div
                            className={`h-full rounded-full ${row.exposure >= 60 ? "bg-brand-ai/70" : row.exposure >= 40 ? "bg-brand-mid/70" : "bg-brand-human/70"}`}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${row.exposure}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                          />
                          <span className="absolute inset-y-0 right-2 flex items-center text-xs font-mono text-muted-foreground">{row.exposure}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-ai/70" /> High (&gt;60%)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-mid/70" /> Moderate</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-human/70" /> Lower</span>
                  </div>
                </CardContent>
              </Card>
            </AppendixSection>

            {/* A7: Traction */}
            <AppendixSection id="traction" title="Traction & Team">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { value: "Live", label: "Product Shipped", icon: Rocket },
                  { value: "7-Step", label: "Guided Case Study", icon: Layers },
                  { value: "400+", label: "Roles Analyzed", icon: BarChart3 },
                  { value: "B2B", label: "Enterprise-Ready", icon: Shield },
                ].map((s) => (
                  <div key={s.label} className="text-center rounded-xl border border-border/40 bg-card p-4">
                    <s.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <Card className="border-border/40">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">Founding team details available upon request.</p>
                  <Button variant="outline" className="mt-4" onClick={() => window.open("mailto:founders@infinitesim.ai", "_blank")}>
                    Request Intro Deck
                  </Button>
                </CardContent>
              </Card>
            </AppendixSection>

            {/* A8: Market Gap (White Space) */}
            <AppendixSection id="white-space" title="What Incumbents Miss — The White Space">
              <div className="space-y-4">
                {[
                  {
                    market: "HR Tech", size: "$230B+", players: "Workday, SAP, Eightfold",
                    gap: "Track employees, don't prepare them for AI disruption",
                    capabilities: [
                      { name: "Employee records & payroll", has: true },
                      { name: "Skills taxonomy", has: true },
                      { name: "AI exposure analysis", has: false },
                      { name: "Task-level risk scoring", has: false },
                    ],
                  },
                  {
                    market: "AI Consulting", size: "$50B+", players: "McKinsey, Deloitte, BCG",
                    gap: "Manual, expensive, one-time snapshots that go stale in weeks",
                    capabilities: [
                      { name: "Strategic AI assessment", has: true },
                      { name: "Executive advisory", has: true },
                      { name: "Continuous monitoring", has: false },
                      { name: "Automated re-calibration", has: false },
                    ],
                  },
                  {
                    market: "Corporate L&D", size: "$60B+", players: "LinkedIn Learning, Coursera, Udemy",
                    gap: "Generic course catalogs, no personalization or exposure scoring",
                    capabilities: [
                      { name: "Course libraries", has: true },
                      { name: "Completion tracking", has: true },
                      { name: "Adaptive simulation training", has: false },
                      { name: "Role-specific AI readiness paths", has: false },
                    ],
                  },
                ].map((seg) => (
                  <Card key={seg.market} className="border-border/40">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base font-semibold text-foreground">{seg.market}</span>
                        <span className="text-sm font-bold text-brand-ai">{seg.size}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 italic">"{seg.gap}"</p>
                      <p className="text-xs text-muted-foreground mb-2">{seg.players}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {seg.capabilities.map((cap) => (
                          <div key={cap.name} className="flex items-center gap-2">
                            {cap.has ? (
                              <CheckCircle2 className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-brand-ai/40 flex items-center justify-center shrink-0">
                                <Zap className="h-2.5 w-2.5 text-brand-ai" />
                              </div>
                            )}
                            <span className={`text-sm ${cap.has ? "text-muted-foreground/60" : "text-foreground font-medium"}`}>{cap.name}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AppendixSection>

          </div>
        </section>

      </div>
    </div>
  );
}
