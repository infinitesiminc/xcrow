/**
 * /about — Problem-Solution narrative for university leadership:
 * Employability Crisis → Evidence → Why It's Getting Worse → Why Fixes Fail → Solution → Proof → CTA
 */
import { useRef } from "react";
import founderImg from "@/assets/founder-jackson.png";
import { motion, useInView } from "framer-motion";
import xcrowLogo from "@/assets/xcrow-logo.webp";
import {
  ArrowRight, Brain, Crosshair, Database, Gamepad2,
  GraduationCap, Layers, Linkedin, Radio, RefreshCw, Shield, ShieldAlert,
  Sword, Target, TrendingUp, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TerritoryEmblem from "@/components/TerritoryEmblem";
import AIAgentEvolutionSection from "@/components/about/AIAgentEvolutionSection";
import SkillGapSection from "@/components/about/SkillGapSection";
import type { FutureSkillCategory } from "@/hooks/use-future-skills";
import { FUTURE_CATEGORY_META } from "@/hooks/use-future-skills";

const fade = {
  hidden: { opacity: 0, y: 24 },
  visible: (d: number) => ({
    opacity: 1, y: 0,
    transition: { delay: d * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

function Section({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.section ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} className={`relative ${className}`} style={style}>
      {children}
    </motion.section>
  );
}

/* ── L2 CHECKPOINT GLIMPSE ── */
const L2_CHECKPOINTS = [
  {
    area: "Risk Awareness",
    claim: "Our AI agent can autonomously negotiate vendor contracts up to $500K with 94% satisfaction rates.",
    question: "What's the hidden risk in this AI claim?",
    verdict: "critical" as const,
    explanation: "Autonomous negotiation without human oversight on high-value contracts creates legal liability, removes relationship context, and assumes satisfaction metrics capture long-term value.",
  },
  {
    area: "Strategic Depth",
    claim: "AI-generated market analysis shows a 73% probability of competitor entry within 6 months — recommend immediate price reduction.",
    question: "Should you trust the probability and act on the recommendation?",
    verdict: "risky" as const,
    explanation: "Probability estimates from AI models lack causal reasoning. A price war based on a single model's prediction ignores strategic options like differentiation and alliance-building.",
  },
  {
    area: "Human Value-Add",
    claim: "The AI content pipeline has reduced editorial staff needs by 80% while maintaining brand voice consistency scores of 92%.",
    question: "Is this metric proving what it claims?",
    verdict: "risky" as const,
    explanation: "Voice consistency scores measure pattern matching, not brand authenticity. Reducing editorial oversight risks cultural insensitivity, tone-deaf messaging, and gradual brand erosion invisible to automated metrics.",
  },
];

const VERDICT_STYLES = {
  safe: { bg: "hsl(var(--success) / 0.15)", border: "hsl(var(--success) / 0.4)", text: "hsl(var(--success))", label: "Safe" },
  risky: { bg: "hsl(var(--warning) / 0.15)", border: "hsl(var(--warning) / 0.4)", text: "hsl(var(--warning))", label: "Risky" },
  critical: { bg: "hsl(var(--destructive) / 0.15)", border: "hsl(var(--destructive) / 0.4)", text: "hsl(var(--destructive))", label: "Critical" },
};

/* ── SKILL CATALOGUE SAMPLE ── */
const SKILL_SAMPLES: { cat: FutureSkillCategory; skills: string[] }[] = [
  { cat: "Technical", skills: ["AI System Architecture", "Prompt Engineering", "Multi-Agent Orchestration"] },
  { cat: "Strategic", skills: ["AI ROI Forecasting", "Automation Portfolio Strategy", "Disruption Mapping"] },
  { cat: "Analytical", skills: ["Algorithmic Bias Detection", "Predictive Model Validation", "Data Provenance Auditing"] },
  { cat: "Ethics & Compliance", skills: ["AI Governance Framework Design", "Responsible AI Oversight", "Regulatory Impact Analysis"] },
  { cat: "Human Edge", skills: ["Cross-Cultural AI Negotiation", "Stakeholder Trust Architecture", "Adaptive Crisis Leadership"] },
  { cat: "Leadership", skills: ["Human-AI Team Orchestration", "Change Velocity Management", "AI Transformation Storytelling"] },
  { cat: "Creative", skills: ["Generative Concept Direction", "AI-Augmented Design Thinking", "Synthetic Media Curation"] },
  { cat: "Communication", skills: ["AI Translation & Localization", "Algorithmic Narrative Design", "Human-in-the-Loop Briefing"] },
];

/* ── REAL-TIME ENGINE PILLARS ── */
const ENGINE_PILLARS = [
  { icon: Database, label: "Real-Time Job Market", desc: "5,000+ roles continuously analyzed. Tasks decomposed. AI exposure scored. Your curriculum layer stays current without manual updates.", color: "territory-analytical" },
  { icon: Zap, label: "Real-Time AI Tool Tracking", desc: "Every major AI release tracked and mapped to task impact. Simulations reflect today's capabilities, not last semester's syllabus.", color: "territory-technical" },
  { icon: Gamepad2, label: "Adaptive Simulation Engine", desc: "Scenarios generated from live data. No static content. Every challenge is current, contextual, and mapped to employer demand.", color: "territory-creative" },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* ═══ 1. HERO: THE EMPLOYABILITY CRISIS ═══ */}
        <Section className="pt-28 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div variants={fade} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-destructive/30 bg-destructive/5 text-sm text-destructive mb-6">
              <GraduationCap className="h-4 w-4" /> FOR UNIVERSITY LEADERSHIP
            </motion.div>
            <motion.h1 variants={fade} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-fantasy font-bold leading-[1.08] tracking-tight mb-6">
              Your Students Graduate Into an{" "}
              <span className="text-primary">AI Economy</span>.{" "}
              <span className="text-destructive">Are They Ready?</span>
            </motion.h1>
            <motion.p variants={fade} custom={2} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4">
              Employers say graduates lack AI-era skills. Rankings increasingly weight employability outcomes.
              Yet most curricula haven't been updated for a world where <span className="text-foreground font-semibold">every role now has an AI agent counterpart</span>.
            </motion.p>
            <motion.p variants={fade} custom={3} className="text-base text-muted-foreground max-w-xl mx-auto">
              We analyzed <strong className="text-foreground">4,176 university programs</strong> against real job market demand.
              The gap is measurable — and alarming.
            </motion.p>
          </div>
        </Section>

        {/* ═══ 2. EVIDENCE: THE SKILL GAP IS MEASURABLE ═══ */}
        <SkillGapSection />

        {/* ═══ 3. JENSEN HUANG QUOTE — "Roles evolve, curricula don't" ═══ */}
        <Section className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <motion.blockquote variants={fade} custom={0} className="relative rounded-xl border p-6 sm:p-8"
              style={{ borderColor: "hsl(var(--filigree) / 0.25)", background: "hsl(var(--surface-stone) / 0.25)" }}
            >
              <span className="absolute -top-4 left-6 text-5xl font-serif" style={{ color: "hsl(var(--filigree) / 0.4)" }}>"</span>
              <p className="text-base sm:text-lg leading-relaxed text-muted-foreground italic mb-4">
                People kept saying radiologists would be replaced by AI because all scans would be read by machines. 
                But the opposite happened — <span className="text-foreground font-semibold not-italic">demand for radiologists went up</span>. 
                Because when you can read more scans, you find more things. When you find more things, 
                you need more experts to decide what to do about them. 
                <span className="text-foreground font-semibold not-italic"> AI doesn't replace the expert — it elevates the role</span>.
              </p>
              <footer className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>
                  JH
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Jensen Huang</p>
                  <p className="text-xs text-muted-foreground">CEO, NVIDIA</p>
                </div>
              </footer>
            </motion.blockquote>
            <motion.p variants={fade} custom={1} className="text-center text-sm text-muted-foreground mt-6 max-w-xl mx-auto">
              Every discipline your university teaches is undergoing this transformation.
              Roles aren't disappearing — they're <strong className="text-foreground">evolving faster than curricula can follow</strong>.
            </motion.p>
          </div>
        </Section>

        {/* ═══ 4. WHY IT'S GETTING WORSE: AI AGENT EVOLUTION ═══ */}
        <Section className="py-4 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div variants={fade} custom={0}>
              <span className="text-sm font-mono text-destructive/80 tracking-widest uppercase">Why It's Accelerating</span>
              <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-base">
                The roles your <strong className="text-foreground">2027 graduates</strong> will fill don't exist in your current curriculum.
                AI agents are evolving from simple tools to autonomous employees — and they're reshaping every job function.
              </p>
            </motion.div>
          </div>
        </Section>
        <AIAgentEvolutionSection />

        {/* ═══ 5. WHY TRADITIONAL APPROACHES FAIL ═══ */}
        <Section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fade} custom={0} className="text-center mb-12">
              <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">The Hard Truth</span>
              <h2 className="text-3xl sm:text-4xl font-fantasy font-bold mt-4">
                Adding an AI Elective <span className="text-destructive">Isn't Enough</span>
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                Traditional approaches fail because the AI landscape moves faster than any curriculum committee.
              </p>
            </motion.div>
            <motion.div variants={fade} custom={1} className="grid md:grid-cols-2 gap-6 mb-10">
              {[
                { icon: Shield, title: "Courses expire. The market doesn't wait.", desc: "A course is a snapshot. It's outdated the moment a new model drops. Your LMS can't regenerate content weekly — but the job market shifts that fast." },
                { icon: Sword, title: "Reading ≠ Readiness.", desc: "Students can't learn to manage AI agents by reading about them. They need to practice — make decisions, audit AI output, catch hallucinations — under pressure. Employers expect day-one competence." },
                { icon: Target, title: "Engagement is the bottleneck.", desc: "Completion rates on supplemental modules average 23%. Progression systems, boss battles, and leaderboards create intrinsic motivation loops — students practice 4x more when learning feels like play." },
                { icon: Brain, title: "Faculty can't scale this alone.", desc: "AI-era skills span every department. No single instructor can build and maintain simulations across 183 skills. You need an engine that generates, grades, and adapts automatically." },
              ].map((item, i) => (
                <motion.div key={item.title} variants={fade} custom={i + 2} className="rounded-xl border border-border bg-card p-6">
                  <item.icon className="h-6 w-6 text-primary mb-3" />
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </Section>

        {/* ═══ 6. SOLUTION: ZERO-GAP INSTITUTIONAL INFRASTRUCTURE ═══ */}
        <Section className="py-20 px-6" style={{ background: "hsl(var(--surface-stone) / 0.4)" }}>
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fade} custom={0} className="text-center mb-12">
              <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">The Solution</span>
              <h2 className="text-3xl sm:text-4xl font-fantasy font-bold mt-4">
                A Curriculum Layer That <span className="text-primary">Never Goes Stale</span>
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                Xcrow is institutional infrastructure — three real-time data streams feeding one adaptive simulation engine.
                Deploy it across departments. The gap between "learning" and "applying" collapses to zero.
              </p>
            </motion.div>
            <motion.div variants={fade} custom={1} className="grid md:grid-cols-3 gap-6">
              {ENGINE_PILLARS.map((p, i) => (
                <motion.div key={p.label} variants={fade} custom={i + 2} className="rounded-xl border border-border bg-card p-6 text-center">
                  <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: `hsl(var(--${p.color}) / 0.12)` }}>
                    <p.icon className="h-6 w-6" style={{ color: `hsl(var(--${p.color}))` }} />
                  </div>
                  <h3 className="font-bold mb-2">{p.label}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </motion.div>
              ))}
            </motion.div>
            {/* Loop visualization */}
            <motion.div variants={fade} custom={5} className="mt-10 flex items-center justify-center gap-3 text-sm text-muted-foreground flex-wrap">
              {["Job Market Shifts", "AI Tool Releases", "Sim Engine Regenerates", "Skills Re-Scored"].map((step, i) => (
                <span key={step} className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground">{step}</span>
                  {i < 3 && <ArrowRight className="h-3 w-3 text-primary" />}
                </span>
              ))}
            </motion.div>
          </div>
        </Section>

        {/* ═══ 7. 183 SKILLS CATALOGUE ═══ */}
        <Section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fade} custom={0} className="text-center mb-6">
              <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">The Catalogue</span>
              <h2 className="text-3xl sm:text-4xl font-fantasy font-bold mt-4">
                183 Skills Mapped to <span className="text-primary">Employer Demand</span>
              </h2>
              <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
                By analyzing how AI is reshaping 5,000+ roles and 33,000+ task clusters, we distilled the skills that define human value in the AI economy — organized into 8 territories, each simulation-ready.
              </p>
            </motion.div>
            <motion.div variants={fade} custom={1} className="flex flex-wrap justify-center gap-2 mb-8">
              {SKILL_SAMPLES.map(({ cat }) => {
                const meta = FUTURE_CATEGORY_META[cat];
                return (
                  <div key={cat} className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium" style={{ borderColor: `hsl(var(--${cssVar(cat)}) / 0.3)`, background: `hsl(var(--${cssVar(cat)}) / 0.08)`, color: `hsl(var(--${cssVar(cat)}))` }}>
                    <TerritoryEmblem category={cat} size={18} />
                    {meta.terrain}
                  </div>
                );
              })}
            </motion.div>
            <motion.div variants={fade} custom={2} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SKILL_SAMPLES.map(({ cat, skills }, i) => (
                <motion.div key={cat} variants={fade} custom={i + 3} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TerritoryEmblem category={cat} size={28} />
                    <span className="font-bold text-sm">{cat}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {skills.map(s => (
                      <li key={s} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">◆</span> {s}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </motion.div>
            <motion.p variants={fade} custom={11} className="text-center text-sm text-muted-foreground mt-6">
              8 territories. 183 canonical skills. Each one simulation-ready — because knowing a skill exists isn't enough. Your students need to <em>practice</em> it.
            </motion.p>
          </div>
        </Section>

        {/* ═══ 8. L2 CHECKPOINT — "What graduates need to do on day one" ═══ */}
        <Section className="py-20 px-6" style={{ background: "linear-gradient(180deg, hsl(262 40% 8%) 0%, hsl(var(--background)) 100%)" }}>
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fade} custom={0} className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-4" style={{ background: "hsl(262 80% 55% / 0.15)", color: "hsl(262 80% 70%)", border: "1px solid hsl(262 80% 55% / 0.3)" }}>
                <Crosshair className="h-3 w-3" /> LEVEL 2 · HUMAN EDGE
              </div>
              <h2 className="text-3xl sm:text-4xl font-fantasy font-bold mb-3">
                This Is What Your Graduates Need to Do on <span style={{ color: "hsl(262 80% 65%)" }}>Day One</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Level 2 simulations pit students against AI claims pulled from real future scenarios. The task isn't to <em>use</em> AI — it's to <strong>oversee</strong> it. To catch what it gets wrong. To know when to trust and when to intervene.
              </p>
            </motion.div>

            <motion.div variants={fade} custom={1} className="grid md:grid-cols-3 gap-5">
              {L2_CHECKPOINTS.map((cp, i) => {
                const vs = VERDICT_STYLES[cp.verdict];
                return (
                  <motion.div key={i} variants={fade} custom={i + 2}
                    className="rounded-xl border p-6 flex flex-col"
                    style={{ borderColor: "hsl(262 80% 55% / 0.2)", background: "hsl(262 30% 10% / 0.6)" }}
                  >
                    <span className="text-xs font-mono px-2 py-0.5 rounded self-start mb-4" style={{ background: "hsl(262 80% 55% / 0.15)", color: "hsl(262 80% 70%)" }}>
                      {cp.area}
                    </span>

                    <p className="text-base sm:text-lg font-medium italic text-muted-foreground leading-relaxed mb-4 flex-1">
                      "{cp.claim}"
                    </p>

                    <p className="text-sm font-semibold text-foreground mb-3">{cp.question}</p>

                    <p className="text-xs text-muted-foreground leading-relaxed mb-5">{cp.explanation}</p>

                    <button
                      className="w-full py-3 rounded-lg text-sm font-bold tracking-wide transition-all cursor-default"
                      style={{
                        background: vs.bg,
                        color: vs.text,
                        border: `1.5px solid ${vs.border}`,
                      }}
                    >
                      ✦ {vs.label}
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>

            <motion.p variants={fade} custom={5} className="text-center text-sm text-muted-foreground mt-8 max-w-lg mx-auto">
              This is what "AI-ready graduates" actually means — not learning to use the tools, but learning to <strong className="text-foreground">lead the machines</strong>.
            </motion.p>
          </div>
        </Section>

        {/* ═══ 9. CREDIBILITY: FOUNDER LETTER (condensed) ═══ */}
        <Section className="py-16 px-6" style={{ background: "hsl(var(--surface-stone) / 0.4)" }}>
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fade} custom={0} className="flex flex-col md:flex-row gap-8 items-start">
              <div className="shrink-0 mx-auto md:mx-0">
                <div className="w-28 h-28 rounded-2xl overflow-hidden border-2" style={{ borderColor: "hsl(var(--filigree))" }}>
                  <img src={founderImg} alt="Jackson Lam, Founder & CEO" className="w-full h-full object-cover object-top" />
                </div>
                <div className="text-center mt-3">
                  <p className="text-sm font-bold">Jackson Lam</p>
                  <p className="text-xs text-muted-foreground">Founder & CEO</p>
                  <a href="https://linkedin.com/in/jacksonlamkh" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1">
                    <Linkedin className="h-3 w-3" /> LinkedIn
                  </a>
                </div>
              </div>
              <motion.div variants={fade} custom={1} className="space-y-4 text-muted-foreground leading-relaxed">
                <p className="text-lg">
                  <span className="text-foreground font-semibold">Every company on Earth is about to hire AI agents — not as tools, but as employees.</span>{" "}
                  The question isn't whether jobs will change. It's whether your institution is preparing graduates for the jobs that exist <em>now</em>.
                </p>
                <p>
                  I built Xcrow because the gap between what universities teach and what employers need isn't shrinking — it's accelerating.
                  A real-time simulation engine was the only architecture that could keep pace.
                </p>
                <p className="text-foreground font-medium">
                  We've already mapped 4,176 university programs against market demand. The data is clear. Let us show you where your institution stands.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </Section>

        {/* ═══ 10. CTA: EQUIP YOUR INSTITUTION ═══ */}
        <Section className="py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div variants={fade} custom={0} className="mb-4">
              <img src={xcrowLogo} alt="Xcrow logo" className="w-24 h-24 object-contain mx-auto crow-glow" />
            </motion.div>
            <motion.h2 variants={fade} custom={1} className="text-3xl sm:text-4xl font-fantasy font-bold mb-4">
              Equip Your Institution for the <span className="text-primary">AI Economy</span>
            </motion.h2>
            <motion.p variants={fade} custom={2} className="text-muted-foreground mb-8 max-w-md mx-auto">
              See exactly where your curriculum stands — and deploy the infrastructure to close the gap. No course redesign required.
            </motion.p>
            <motion.div variants={fade} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/contact")} className="gap-2 px-8">
                Schedule a Pilot <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/schools")} className="px-8">
                See the Schools Program
              </Button>
            </motion.div>
          </div>
        </Section>
      </div>
      <Footer />
    </>
  );
}

function cssVar(cat: FutureSkillCategory): string {
  const map: Record<FutureSkillCategory, string> = {
    Technical: "territory-technical",
    Analytical: "territory-analytical",
    Strategic: "territory-strategic",
    Communication: "territory-communication",
    Leadership: "territory-leadership",
    Creative: "territory-creative",
    "Ethics & Compliance": "territory-ethics",
    "Human Edge": "territory-humanedge",
  };
  return map[cat] ?? "primary";
}
