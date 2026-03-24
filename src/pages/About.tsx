/**
 * /about — Founder manifesto: Defense → Offense, why a real-time AI game is the only answer.
 */
import { useRef } from "react";
import founderImg from "@/assets/founder-jackson.png";
import { motion, useInView } from "framer-motion";
import xcrowLogo from "@/assets/xcrow-logo.webp";
import {
  ArrowRight, Brain, Crosshair, Database, Gamepad2,
  Layers, Linkedin, Radio, RefreshCw, Shield, ShieldAlert,
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
  { icon: Database, label: "Real-Time Job Market", desc: "5,000+ roles continuously analyzed. Tasks decomposed. AI exposure scored. Updated as companies evolve.", color: "territory-analytical" },
  { icon: Zap, label: "Real-Time AI Tool Tracking", desc: "Every major AI release tracked and mapped to task impact. Your simulations reflect today's capabilities, not last quarter's.", color: "territory-technical" },
  { icon: Gamepad2, label: "Real-Time Simulation Engine", desc: "Adaptive scenarios generated from live data. No static courses. Every battle is current, contextual, and challenging.", color: "territory-creative" },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* ═══ HERO: THE URGENCY ═══ */}
        <Section className="pt-28 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div variants={fade} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-destructive/30 bg-destructive/5 text-sm text-destructive mb-6">
              <ShieldAlert className="h-4 w-4" /> The workforce is under siege
            </motion.div>
            <motion.h1 variants={fade} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-fantasy font-bold leading-[1.08] tracking-tight mb-6">
              From <span className="text-destructive">Defense</span> to{" "}
              <span style={{ color: "hsl(var(--success))" }}>Offense</span>.
            </motion.h1>
            <motion.p variants={fade} custom={2} className="text-2xl sm:text-3xl font-fantasy font-semibold mb-4 italic" style={{ color: "hsl(var(--filigree-glow))" }}>
              Master AI. Or be mastered.
            </motion.p>
            <motion.p variants={fade} custom={3} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The world is stuck asking <em>"How do we protect jobs from AI?"</em>{" "}
              We're building the platform that answers a different question:{" "}
              <span className="text-foreground font-semibold">"How do we manage our AI agent employees?"</span>
            </motion.p>
          </div>
        </Section>

        {/* ═══ FOUNDER'S LETTER ═══ */}
        <Section className="py-20 px-6" style={{ background: "hsl(var(--surface-stone) / 0.4)" }}>
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
                  <span className="text-foreground font-semibold">Every company on Earth is about to hire AI agents.</span>{" "}
                  Not as tools. As employees. Agents that write code, run campaigns, negotiate deals, analyze markets, and make decisions.
                </p>
                <p>
                  The conversation right now is about <span className="text-destructive font-medium">defense</span> — which jobs will AI replace? How do we protect workers? That's the wrong question. It's like asking "How do we stop the internet?" in 1998.
                </p>
                <p>
                  The right question is <span className="font-medium" style={{ color: "hsl(var(--success))" }}>offense</span> — how do we train humans to <em>manage, direct, audit, and collaborate with</em> AI agents? How do we evolve from <strong>doing the work</strong> to <strong>leading the machines that do it</strong>?
                </p>
                <p className="text-foreground font-medium">
                  That's why I built Xcrow. Not a course platform. Not a career quiz. A real-time AI-powered game engine that evolves as fast as AI itself.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </Section>

        {/* ═══ WHY A GAME? ═══ */}
        <Section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fade} custom={0} className="text-center mb-12">
              <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">The Thesis</span>
              <h2 className="text-3xl sm:text-4xl font-fantasy font-bold mt-4">
                Why an AI-Powered <span className="text-primary">Game</span>?
              </h2>
            </motion.div>
            <motion.div variants={fade} custom={1} className="grid md:grid-cols-2 gap-6 mb-10">
              {[
                { icon: Shield, title: "Courses expire. Games evolve.", desc: "A course is a snapshot. It's outdated the moment a new model drops. A game engine regenerates its challenges from live data — every simulation reflects today's AI landscape, not last quarter's." },
                { icon: Sword, title: "Reading ≠ Readiness.", desc: "You can't learn to manage AI agents by reading about them. You need to practice — make decisions, audit AI output, catch hallucinations, evaluate tradeoffs. Under pressure. Repeatedly." },
                { icon: Target, title: "Motivation at scale.", desc: "Progression systems, boss battles, skill trees, and leaderboards create intrinsic motivation loops that courses can't match. Students practice 4x more when the learning feels like play." },
                { icon: Brain, title: "AI trains against AI.", desc: "Our simulation engine uses AI to generate scenarios, grade responses, and adapt difficulty — creating an infinite practice environment that no human instructor could deliver alone." },
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

        {/* ═══ THE REAL-TIME ENGINE ═══ */}
        <Section className="py-20 px-6" style={{ background: "hsl(var(--surface-stone) / 0.4)" }}>
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fade} custom={0} className="text-center mb-12">
              <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">The Engine</span>
              <h2 className="text-3xl sm:text-4xl font-fantasy font-bold mt-4">
                Zero-Gap: Learn → Apply → <span className="text-primary">Repeat</span>
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                Three real-time data streams feed one adaptive simulation engine. The gap between "learning" and "applying" collapses to zero.
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
            <motion.div variants={fade} custom={5} className="mt-10 flex items-center justify-center gap-3 text-sm text-muted-foreground">
              {["Job Market Shifts", "AI Tool Releases", "Sim Engine Regenerates", "Skills Re-Scored"].map((step, i) => (
                <span key={step} className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground">{step}</span>
                  {i < 3 && <ArrowRight className="h-3 w-3 text-primary" />}
                </span>
              ))}
            </motion.div>
          </div>
        </Section>

        {/* ═══ REVERSE ENGINEERING THE FUTURE: 183 SKILLS ═══ */}
        <Section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fade} custom={0} className="text-center mb-6">
              <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">The Catalogue</span>
              <h2 className="text-3xl sm:text-4xl font-fantasy font-bold mt-4">
                183 Skills Your Brain Must <span className="text-primary">Evolve</span> to Master
              </h2>
              <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
                We reverse-engineered the future. By analyzing how AI is reshaping 5,000+ roles and 33,000+ task clusters, we distilled the skills that will define human value in the AI economy — skills no algorithm can replicate.
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
              8 territories. 183 canonical skills. Each one simulation-ready — because knowing a skill exists isn't enough. You need to <em>practice</em> it.
            </motion.p>
          </div>
        </Section>

        {/* ═══ SKILL GAP: CURRICULUM vs MARKET ═══ */}
        <SkillGapSection />

        {/* ═══ LEVEL 2 GLIMPSE: BOSS BATTLE AUDIT ═══ */}
        <Section className="py-20 px-6" style={{ background: "linear-gradient(180deg, hsl(262 40% 8%) 0%, hsl(var(--background)) 100%)" }}>
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fade} custom={0} className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-4" style={{ background: "hsl(262 80% 55% / 0.15)", color: "hsl(262 80% 70%)", border: "1px solid hsl(262 80% 55% / 0.3)" }}>
                <Crosshair className="h-3 w-3" /> LEVEL 2 · HUMAN EDGE
              </div>
              <h2 className="text-3xl sm:text-4xl font-fantasy font-bold mb-3">
                Can You <span style={{ color: "hsl(262 80% 65%)" }}>Judge</span> an AI Agent?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Level 2 simulations pit you against AI claims pulled from real future scenarios. Your job isn't to <em>use</em> AI — it's to <strong>oversee</strong> it. To catch what it gets wrong. To know when to trust and when to intervene.
              </p>
            </motion.div>

            <motion.div variants={fade} custom={1} className="space-y-4">
              {L2_CHECKPOINTS.map((cp, i) => {
                const vs = VERDICT_STYLES[cp.verdict];
                return (
                  <motion.div key={i} variants={fade} custom={i + 2}
                    className="rounded-xl border p-5"
                    style={{ borderColor: "hsl(262 80% 55% / 0.15)", background: "hsl(262 30% 10% / 0.5)" }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "hsl(262 80% 55% / 0.15)", color: "hsl(262 80% 70%)" }}>
                        {cp.area}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: vs.bg, color: vs.text, border: `1px solid ${vs.border}` }}>
                        {vs.label}
                      </span>
                    </div>
                    <div className="mb-3 p-3 rounded-lg" style={{ background: "hsl(262 80% 55% / 0.06)", border: "1px solid hsl(262 80% 55% / 0.1)" }}>
                      <p className="text-sm font-medium flex items-start gap-2">
                        <Radio className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(262 80% 65%)" }} />
                        <span className="italic text-muted-foreground">"{cp.claim}"</span>
                      </p>
                    </div>
                    <p className="text-sm font-medium mb-2">{cp.question}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{cp.explanation}</p>
                  </motion.div>
                );
              })}
            </motion.div>

            <motion.p variants={fade} custom={5} className="text-center text-sm text-muted-foreground mt-8 max-w-lg mx-auto">
              This is what "staying ahead of AI" actually looks like — not learning to use the tools, but learning to <strong className="text-foreground">lead the machines</strong>.
            </motion.p>
          </div>
        </Section>

        {/* ═══ AI AGENT EVOLUTION ═══ */}
        <AIAgentEvolutionSection />

        {/* ═══ THE CROW ═══ */}
        <Section className="py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div variants={fade} custom={0} className="mb-8">
              <img src={xcrowLogo} alt="Xcrow logo" className="w-48 h-48 object-contain mx-auto crow-glow" />
            </motion.div>
            <motion.h2 variants={fade} custom={1} className="text-2xl sm:text-3xl font-fantasy font-bold mb-4">Why the Crow?</motion.h2>
            <motion.p variants={fade} custom={2} className="text-muted-foreground leading-relaxed max-w-xl mx-auto mb-4">
              Crows are the best problem solvers in the animal kingdom. They use tools, devise multi-step strategies, and adapt to environments they've never seen.
            </motion.p>
            <motion.p variants={fade} custom={3} className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
              <span className="text-foreground font-semibold">Xcrow</span> is the <span className="text-primary font-semibold">X — the multiplier</span> — applied to that innate problem-solving power. We take the adaptive intelligence nature perfected in the crow and amplify it for the AI economy. Not memorization. Not passive learning.{" "}
              <span className="text-foreground font-semibold">Multiplied human ingenuity</span>.
            </motion.p>
          </div>
        </Section>

        {/* ═══ CTA ═══ */}
        <Section className="py-20 px-6" style={{ background: "hsl(var(--surface-stone) / 0.4)" }}>
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2 variants={fade} custom={0} className="text-3xl sm:text-4xl font-fantasy font-bold mb-4">
              Stop defending. Start leading.
            </motion.h2>
            <motion.p variants={fade} custom={1} className="text-muted-foreground mb-8 max-w-md mx-auto">
              Whether you're a professional, student, or institution — the AI economy rewards those who move first.
            </motion.p>
            <motion.div variants={fade} custom={2} className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/contact")} className="gap-2 px-8">
                Get in Touch <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/")} className="px-8">
                Explore the Map
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
