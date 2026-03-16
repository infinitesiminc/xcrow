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
              <span className="text-primary">We help companies get ahead of it.</span>
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
                <Card className="border-destructive/20 bg-destructive/5 h-full">
                  <CardContent className="p-5">
                    <item.icon className="h-5 w-5 text-destructive mb-3" />
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
            title="AI readiness, automated end-to-end"
            subtitle="Infinite Sim maps every role to its constituent tasks, scores AI exposure per task, and generates personalized simulation-based training — all in minutes."
          />
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Layers, title: "Role Decomposition Engine", desc: "Breaks any job into 8–15 task clusters with AI exposure scores using frontier models" },
              { icon: BarChart3, title: "AI Exposure Heatmap", desc: "Organization-wide view of which departments, roles, and tasks are most at risk" },
              { icon: Brain, title: "Adaptive Simulations", desc: "AI-generated scenario training that adapts to each employee's skill gaps" },
              { icon: Target, title: "Action Center", desc: "Prioritized interventions: who to reskill, which tasks to automate, and what to delegate to AI" },
            ].map((item, i) => (
              <motion.div key={i} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }}>
                <Card className="h-full">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Market ── */}
        <section>
          <SectionHeader
            badge="Market Opportunity"
            title="$340B+ total addressable market"
            subtitle="Sitting at the intersection of HR Tech, AI consulting, and corporate L&D — three massive categories converging into one."
          />
          <div className="grid grid-cols-3 gap-4">
            <StatCard value="$340B+" label="Total Addressable Market" icon={Globe} />
            <StatCard value="$45B" label="AI in HR Tech (2027)" icon={Zap} />
            <StatCard value="$12B" label="Skills Assessment & Simulation" icon={Target} />
          </div>
          <motion.div {...fadeUp} className="mt-6">
            <Card className="border-border/50">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Competitive Landscape</p>
                <div className="space-y-2">
                  {[
                    { name: "McKinsey / Deloitte", gap: "Manual, expensive, one-time assessments — $500K+ per engagement" },
                    { name: "LinkedIn Learning / Coursera", gap: "Generic content, no task-level personalization or risk scoring" },
                    { name: "Eightfold / Gloat", gap: "Skills taxonomies but no AI exposure analysis or simulation-based training" },
                  ].map((comp) => (
                    <div key={comp.name} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-foreground">{comp.name}</span>
                        <p className="text-xs text-muted-foreground">{comp.gap}</p>
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
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
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
            title="SaaS with usage-based expansion"
            subtitle="Land with workspace-level subscriptions, expand as organizations analyze more roles and run more simulations."
          />
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { title: "Starter", price: "Free", features: ["5 role analyses/mo", "3 simulations/mo", "1 workspace"] },
              { title: "Pro", price: "$49/mo", features: ["Unlimited analyses", "Unlimited simulations", "Team workspace", "Action Center"] },
              { title: "Enterprise", price: "Custom", features: ["ATS integration", "SSO & compliance", "Dedicated support", "Custom simulations"] },
            ].map((tier, i) => (
              <motion.div key={i} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }}>
                <Card className={`h-full ${i === 1 ? "border-primary/30 bg-primary/5" : ""}`}>
                  <CardContent className="p-5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{tier.title}</p>
                    <p className="text-xl font-bold text-foreground mt-1">{tier.price}</p>
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

        {/* ── The Ask ── */}
        <section>
          <SectionHeader
            badge="The Ask"
            title="Raising a seed round to scale GTM"
          />
          <motion.div {...fadeUp}>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="p-6 sm:p-8 text-center space-y-6">
                <div className="grid sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Use of Funds</p>
                    <ul className="text-sm text-foreground space-y-1">
                      <li>Engineering & AI R&D</li>
                      <li>Go-to-market & sales</li>
                      <li>ATS integrations</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Key Milestones</p>
                    <ul className="text-sm text-foreground space-y-1">
                      <li>10 enterprise pilots</li>
                      <li>3 ATS integrations</li>
                      <li>$500K ARR</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Why Now</p>
                    <ul className="text-sm text-foreground space-y-1">
                      <li>AI agents shipping weekly</li>
                      <li>Enterprise urgency at all-time high</li>
                      <li>No incumbent solution</li>
                    </ul>
                  </div>
                </div>
                <div className="pt-4 border-t border-border/30">
                  <Button size="lg" onClick={() => window.open("mailto:founders@infinitesim.ai", "_blank")}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Get in Touch
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">founders@infinitesim.ai</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

      </div>
    </div>
  );
}
