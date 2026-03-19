/**
 * /students — Marketing page targeting university students.
 * Explains the brand thesis via the "Skill Stack" Lego-block metaphor:
 *   Jobs → Tasks → Skills (transferable) → AI is shifting the stack.
 */
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Blocks, Bot, Brain, Briefcase, Play, Sparkles, Target, TrendingUp, Zap } from "lucide-react";
import CompanyMarquee from "@/components/CompanyMarquee";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

/* ─── Shared animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (d: number) => ({ opacity: 1, y: 0, transition: { delay: d * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } }),
};

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={`relative ${className}`}
    >
      {children}
    </motion.section>
  );
}

/* ─── Skill block component (the Lego brick) ─── */
interface SkillBlockProps {
  label: string;
  color: "ai" | "human" | "mid";
  className?: string;
  small?: boolean;
  glow?: boolean;
  delay?: number;
}

function SkillBlock({ label, color, className = "", small, glow, delay = 0 }: SkillBlockProps) {
  const gradient = {
    ai: "from-brand-ai/80 via-brand-ai/60 to-pink-500/70",
    human: "from-brand-human/80 via-brand-human/60 to-indigo-400/70",
    mid: "from-brand-mid/80 via-brand-mid/60 to-violet-400/70",
  }[color];
  const shadow = {
    ai: "shadow-brand-ai/25",
    human: "shadow-brand-human/25",
    mid: "shadow-brand-mid/25",
  }[color];

  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      className={`
        bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center font-semibold text-white backdrop-blur-sm
        ${small ? "h-10 text-xs px-3" : "h-12 sm:h-14 text-sm px-4"}
        ${glow ? `shadow-lg ${shadow} ring-1 ring-white/25` : `shadow-md ${shadow}`}
        ${className}
      `}
    >
      {label}
    </motion.div>
  );
}

/* ─── Job stack (vertical column of blocks) ─── */
function JobStack({ title, skills, delay = 0 }: {
  title: string;
  skills: { label: string; color: "ai" | "human" | "mid" }[];
  delay?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[140px] sm:min-w-[180px]">
      <div className="flex flex-col-reverse gap-1.5 w-full">
        {skills.map((s, i) => (
          <SkillBlock key={s.label} {...s} delay={delay + i} />
        ))}
      </div>
      <motion.span variants={fadeUp} custom={delay + skills.length} className="text-xs font-mono text-muted-foreground mt-2 tracking-wide">
        {title}
      </motion.span>
    </div>
  );
}

/* ─── Proof stat pill ─── */
function Stat({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <motion.div variants={fadeUp} custom={delay} className="flex flex-col items-center gap-1">
      <span className="text-2xl sm:text-3xl font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground font-mono tracking-wide">{label}</span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
export default function Students() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();

  const handleGetStarted = () => {
    if (user) navigate("/");
    else openAuthModal?.();
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ═══ HERO ═══ */}
      <Section className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 rounded-full border border-brand-mid/30 bg-brand-mid/5 px-4 py-1.5 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-brand-mid" />
            <span className="text-xs font-medium text-brand-mid">Built for the next generation of work</span>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
            Your degree teaches you subjects.
            <br />
            <span className="text-brand-human">The job market</span> needs <span className="text-brand-ai">skills</span>.
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Every job is a stack of skills — and AI is reshuffling which ones matter.
            We help you see what's changing and practice what counts, before you graduate.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={handleGetStarted} className="gap-2 text-base px-8">
              Explore Your First Role <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="text-base px-8">
              See How It Works
            </Button>
          </motion.div>
        </div>
      </Section>

      {/* ═══ PROOF BAR ═══ */}
      <Section className="py-10 border-y border-border/50">
        <div className="max-w-3xl mx-auto flex items-center justify-around gap-6 px-6">
          <Stat value="5,000+" label="ROLES MAPPED" delay={0} />
          <Stat value="3,600+" label="COMPANIES" delay={1} />
          <Stat value="10,000+" label="SIMULATIONS" delay={2} />
          <Stat value="1M+" label="DATA POINTS" delay={3} />
        </div>
      </Section>

      {/* ═══ THE THESIS — Skill Stack Diagram ═══ */}
      <Section className="py-20 sm:py-28 px-6" >
        <div id="how-it-works" className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4">
              <Blocks className="h-5 w-5 text-brand-mid" />
              <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">The Skill Stack</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Every job is made of the same building blocks</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Different roles share the same underlying skills — learn one, and you unlock many.
            </p>
          </motion.div>

          {/* Three job stacks side by side */}
          <div className="flex items-end justify-center gap-4 sm:gap-8 mb-8 overflow-x-auto pb-4">
            <JobStack
              title="Product Manager"
              delay={1}
              skills={[
                { label: "Strategy", color: "human" },
                { label: "Communication", color: "human" },
                { label: "Data Analysis", color: "ai" },
                { label: "Leadership", color: "human" },
                { label: "Judgment", color: "human" },
              ]}
            />
            <JobStack
              title="Software Engineer"
              delay={3}
              skills={[
                { label: "Programming", color: "ai" },
                { label: "Data Analysis", color: "ai" },
                { label: "Design & UX", color: "mid" },
                { label: "Judgment", color: "human" },
                { label: "Communication", color: "human" },
              ]}
            />
            <JobStack
              title="Data Scientist"
              delay={5}
              skills={[
                { label: "Data Analysis", color: "ai" },
                { label: "AI / ML Tools", color: "ai" },
                { label: "Programming", color: "ai" },
                { label: "Strategy", color: "human" },
                { label: "Communication", color: "human" },
              ]}
            />
          </div>

          {/* Arrow annotation */}
          <motion.div variants={fadeUp} custom={8} className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <div className="h-px w-12 bg-brand-human/40" />
            <span>Same skills, different stacks</span>
            <div className="h-px w-12 bg-brand-ai/40" />
          </motion.div>

          {/* Color legend */}
          <motion.div variants={fadeUp} custom={9} className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-brand-human" />
              <span className="text-xs text-muted-foreground">Human-dominant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-brand-mid" />
              <span className="text-xs text-muted-foreground">Augmented</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-brand-ai" />
              <span className="text-xs text-muted-foreground">AI-exposed</span>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ═══ AI IS SHIFTING THE STACK ═══ */}
      <Section className="py-20 sm:py-28 px-6 bg-secondary/30">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-brand-ai" />
              <span className="text-sm font-mono text-brand-ai tracking-widest uppercase">The AI Shift</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">AI is rewriting the skill stack</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              New capabilities are emerging every quarter. The skills that land you a job in 2027
              don't exist in most curricula today.
            </p>
          </motion.div>

          {/* Today / Tomorrow comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Today */}
            <motion.div variants={fadeUp} custom={1} className="rounded-xl border border-border bg-card p-6">
              <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-4 block">What you're learning now</span>
              <div className="flex flex-col gap-1.5">
                <SkillBlock label="Data Analysis" color="mid" small delay={2} />
                <SkillBlock label="Programming" color="mid" small delay={3} />
                <SkillBlock label="Communication" color="human" small delay={4} />
                <SkillBlock label="Leadership" color="human" small delay={5} />
                <SkillBlock label="Domain Knowledge" color="human" small delay={6} />
              </div>
            </motion.div>

            {/* Tomorrow */}
            <motion.div variants={fadeUp} custom={2} className="rounded-xl border border-brand-ai/30 bg-card p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-brand-ai/5 to-transparent pointer-events-none" />
              <span className="text-xs font-mono text-brand-ai tracking-widest uppercase mb-4 block relative">What employers will need</span>
              <div className="flex flex-col gap-1.5 relative">
                <SkillBlock label="AI Agent Orchestration" color="ai" small glow delay={3} />
                <SkillBlock label="Prompt Engineering" color="ai" small glow delay={4} />
                <SkillBlock label="Human-AI Collaboration" color="ai" small delay={5} />
                <SkillBlock label="Strategic Judgment" color="human" small delay={6} />
                <SkillBlock label="Cross-Functional Comm." color="human" small delay={7} />
                <SkillBlock label="Adaptive Thinking" color="human" small glow delay={8} />
              </div>
            </motion.div>
          </div>

          <motion.p variants={fadeUp} custom={9} className="text-center text-sm text-muted-foreground mt-8 max-w-lg mx-auto">
            The students who thrive won't be the ones with the most knowledge —
            they'll be the ones who practiced the skills the market is moving toward.
          </motion.p>
        </div>
      </Section>

      {/* ═══ WHAT WE DO (3 pillars) ═══ */}
      <Section className="py-20 sm:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How we prepare you</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Three steps from "what should I learn?" to "I'm ready."
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: "See What's Changing",
                desc: "We break every role into its core tasks and score each one for AI exposure. See exactly which skills are growing, shrinking, or shifting.",
                color: "text-brand-human",
              },
              {
                icon: Brain,
                title: "Practice What Counts",
                desc: "AI-powered simulations let you practice real workplace tasks — not generic quizzes. Build the four pillars: Tool Awareness, Human Value-Add, Adaptive Thinking, Domain Judgment.",
                color: "text-brand-mid",
              },
              {
                icon: TrendingUp,
                title: "Track Your Readiness",
                desc: "Your skill profile maps which roles you're closest to and which skills unlock the most career paths. Every simulation moves you closer.",
                color: "text-brand-ai",
              },
            ].map((pillar, i) => (
              <motion.div
                key={pillar.title}
                variants={fadeUp}
                custom={i + 1}
                className="rounded-xl border border-border bg-card p-6 sm:p-8"
              >
                <pillar.icon className={`h-8 w-8 ${pillar.color} mb-4`} />
                <h3 className="text-lg font-bold mb-2">{pillar.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{pillar.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>
      {/* ═══ SOCIAL PROOF — Company Marquee ═══ */}
      <Section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-8">
            <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">Practice on roles from</span>
          </motion.div>
          <motion.div variants={fadeUp} custom={1}>
            <CompanyMarquee rows={[
              ["Anthropic", "OpenAI", "Google DeepMind", "Meta", "Stripe", "Nvidia", "Apple"],
              ["McKinsey", "Deloitte", "Boeing", "Databricks", "Cohere", "Mistral", "FedEx"],
            ]} />
          </motion.div>
        </div>
      </Section>

      {/* ═══ SIMULATION EXPERIENCE — Live Jobs ═══ */}
      <Section className="py-20 sm:py-28 px-6 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 mb-4">
              <Play className="h-5 w-5 text-primary" />
              <span className="text-sm font-mono text-primary tracking-widest uppercase">Not Hypothetical</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Practice on real jobs, not textbook exercises</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every simulation is built from a live job posting — the same roles companies are hiring for right now.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { role: "AI Research Engineer", company: "Anthropic", dept: "Research", exposure: 62, tasks: 12 },
              { role: "Product Marketing Manager", company: "Stripe", dept: "Marketing", exposure: 71, tasks: 9 },
              { role: "Data Scientist", company: "Meta", dept: "Analytics", exposure: 78, tasks: 11 },
              { role: "Solutions Architect", company: "Databricks", dept: "Engineering", exposure: 55, tasks: 8 },
              { role: "Strategy Consultant", company: "McKinsey", dept: "Advisory", exposure: 45, tasks: 10 },
              { role: "ML Platform Engineer", company: "OpenAI", dept: "Infrastructure", exposure: 68, tasks: 14 },
            ].map((job, i) => (
              <motion.div
                key={job.role}
                variants={fadeUp}
                custom={i + 1}
                className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors group cursor-pointer"
                onClick={handleGetStarted}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{job.company}</span>
                </div>
                <h3 className="text-sm font-bold mb-1 group-hover:text-primary transition-colors">{job.role}</h3>
                <p className="text-xs text-muted-foreground mb-3">{job.dept} · {job.tasks} practiceable tasks</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5 text-brand-ai" />
                    <span className="text-xs font-mono text-brand-ai">{job.exposure}% AI exposed</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    Practice →
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p variants={fadeUp} custom={8} className="text-center text-sm text-muted-foreground mt-8">
            5,000+ roles across 3,600+ companies — all mapped, scored, and ready to practice.
          </motion.p>
        </div>
      </Section>


      <Section className="py-20 sm:py-28 px-6 bg-secondary/30">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold mb-4">
            Don't chase job titles.
            <br />
            <span className="text-brand-human">Build</span> the <span className="text-brand-ai">skills</span>.
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-8 max-w-md mx-auto">
            Start with any role you're curious about. We'll show you what it's really made of — and what to practice first.
          </motion.p>
          <motion.div variants={fadeUp} custom={2}>
            <Button size="lg" onClick={handleGetStarted} className="gap-2 text-base px-10 h-12">
              Get Started — Free <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.p variants={fadeUp} custom={3} className="text-xs text-muted-foreground mt-4">
            No credit card required. Explore 5,000+ roles instantly.
          </motion.p>
        </div>
      </Section>

    </div>
  );
}
