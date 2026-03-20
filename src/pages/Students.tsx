/**
 * /students — Marketing page targeting university students.
 * Explains the brand thesis via the "Skill Stack" Lego-block metaphor:
 *   Jobs → Tasks → Skills (transferable) → AI is shifting the stack.
 *
 * Visual vibe: gamified dark-mode with spectrum gradient borders, neon accents.
 * Messaging: Skill Builder angle, empowering & direct tone, real-time market transparency.
 */
import { useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Blocks, Bot, Brain, Briefcase, GraduationCap, Play, Sparkles, Target, TrendingUp, Zap } from "lucide-react";
import CompanyMarquee from "@/components/CompanyMarquee";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SimulatorModal from "@/components/SimulatorModal";

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

/* ─── Spectrum gradient borders for cards ─── */
const SPECTRUM_GRADIENTS = [
  "from-spectrum-0 via-spectrum-1 to-spectrum-2",
  "from-spectrum-6 via-spectrum-5 to-spectrum-4",
  "from-spectrum-3 via-spectrum-4 to-spectrum-5",
  "from-spectrum-1 via-spectrum-2 to-spectrum-3",
  "from-spectrum-4 via-spectrum-3 to-spectrum-6",
  "from-spectrum-2 via-spectrum-0 to-spectrum-1",
];

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
  const borderGradient = {
    ai: "from-brand-ai/60 via-pink-500/40 to-brand-ai/20",
    human: "from-brand-human/60 via-indigo-400/40 to-brand-human/20",
    mid: "from-brand-mid/60 via-violet-400/40 to-brand-mid/20",
  }[color];
  const innerGlow = {
    ai: "from-brand-ai/15 via-pink-500/8 to-transparent",
    human: "from-brand-human/15 via-indigo-400/8 to-transparent",
    mid: "from-brand-mid/15 via-violet-400/8 to-transparent",
  }[color];
  const textColor = {
    ai: "text-brand-ai",
    human: "text-brand-human",
    mid: "text-brand-mid",
  }[color];
  const shadow = {
    ai: "shadow-brand-ai/15",
    human: "shadow-brand-human/15",
    mid: "shadow-brand-mid/15",
  }[color];

  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      className={`
        relative rounded-xl overflow-hidden
        ${small ? "h-10" : "h-12 sm:h-14"}
        ${glow ? `shadow-lg ${shadow}` : `shadow-md ${shadow}`}
        ${className}
      `}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${borderGradient} rounded-xl`} />
      <div className={`absolute inset-[1px] rounded-[11px] bg-card/90 backdrop-blur-sm`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${innerGlow} rounded-[11px]`} />
      </div>
      <div className={`relative h-full flex items-center justify-center font-semibold ${textColor} ${small ? "text-xs px-3" : "text-sm px-4"}`}>
        {label}
      </div>
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
function Stat({ value, label, delay, color }: { value: string; label: string; delay: number; color: string }) {
  return (
    <motion.div variants={fadeUp} custom={delay} className="flex flex-col items-center gap-1 px-4">
      <span className={`text-2xl sm:text-3xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground font-mono tracking-wide">{label}</span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
export default function Students() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const [simJob, setSimJob] = useState<{ role: string; company: string; task: string } | null>(null);

  const handleGetStarted = () => {
    if (user) navigate("/");
    else openAuthModal?.();
  };

  const handleLaunchSim = (job: { role: string; company: string; task: string }) => {
    if (!user) {
      openAuthModal?.();
      return;
    }
    setSimJob(job);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* ═══ HERO ═══ */}
        <Section className="pt-28 pb-20 px-6 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center relative">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-6 glow-purple">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Updated weekly from 5,000+ live job postings</span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-[1.08] tracking-tight mb-6">
              See the job market{" "}
              <span className="bg-gradient-to-r from-brand-human to-brand-ai bg-clip-text text-transparent">
                in real time.
              </span>
              <br />
              Build the skills that actually get hired.
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              We break every role into its core tasks, show you which ones AI is changing,
              and let you practice the skills employers are hiring for — right now.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={handleGetStarted} className="gap-2 text-base px-8 h-12 glow-purple">
                Explore Your First Role <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="text-base px-8 h-12 border-border/60">
                See How It Works
              </Button>
            </motion.div>
          </div>
        </Section>

        {/* ═══ PROOF BAR ═══ */}
        <Section className="py-10 border-y border-border/30">
          <div className="max-w-3xl mx-auto flex items-center justify-around gap-6 px-6">
          <Stat value="21,000+" label="ROLES MAPPED" delay={0} color="text-spectrum-3" />
            <Stat value="3,600+" label="COMPANIES" delay={1} color="text-spectrum-0" />
            <Stat value="34,000+" label="TASKS ANALYZED" delay={2} color="text-spectrum-4" />
            <Stat value="300+" label="INDUSTRIES" delay={3} color="text-spectrum-6" />
          </div>
        </Section>

        {/* ═══ THE THESIS — Skill Stack Diagram ═══ */}
        <Section className="py-20 sm:py-28 px-6">
          <div id="how-it-works" className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 mb-4">
                <Blocks className="h-5 w-5 text-brand-mid" />
                <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">The Skill Stack</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Every job is a stack of skills. We show you which ones matter.</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Different roles share the same underlying skills — learn one, and you unlock many.
              </p>
            </motion.div>

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

            <motion.div variants={fadeUp} custom={8} className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <div className="h-px w-12 bg-brand-human/40" />
              <span>Same skills, different stacks</span>
              <div className="h-px w-12 bg-brand-ai/40" />
            </motion.div>

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

        {/* ═══ THE MARKET IS SHIFTING ═══ */}
        <Section className="py-20 sm:py-28 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <div className="inline-flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-brand-ai" />
                <span className="text-sm font-mono text-brand-ai tracking-widest uppercase">The Market Is Moving</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">The market is shifting. Now you can see it happening.</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                New skills are emerging every quarter — and you can start practicing them today.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* What you're learning */}
              <motion.div variants={fadeUp} custom={1} className="relative rounded-xl overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-spectrum-0 via-spectrum-1 to-spectrum-2" />
                <div className="border border-border/60 bg-card/80 backdrop-blur-sm rounded-xl p-6 pt-5">
                  <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-4 block">What you're learning now</span>
                  <div className="flex flex-col gap-1.5">
                    <SkillBlock label="Data Analysis" color="mid" small delay={2} />
                    <SkillBlock label="Programming" color="mid" small delay={3} />
                    <SkillBlock label="Communication" color="human" small delay={4} />
                    <SkillBlock label="Leadership" color="human" small delay={5} />
                    <SkillBlock label="Domain Knowledge" color="human" small delay={6} />
                  </div>
                </div>
              </motion.div>

              {/* What employers are hiring for */}
              <motion.div variants={fadeUp} custom={2} className="relative rounded-xl overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-spectrum-6 via-spectrum-5 to-spectrum-4" />
                <div className="border border-brand-ai/20 bg-card/80 backdrop-blur-sm rounded-xl p-6 pt-5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-brand-ai/5 to-transparent pointer-events-none" />
                  <span className="text-xs font-mono text-brand-ai tracking-widest uppercase mb-4 block relative">What employers are hiring for</span>
                  <div className="flex flex-col gap-1.5 relative">
                    <SkillBlock label="AI Agent Orchestration" color="ai" small glow delay={3} />
                    <SkillBlock label="Prompt Engineering" color="ai" small glow delay={4} />
                    <SkillBlock label="Human-AI Collaboration" color="ai" small delay={5} />
                    <SkillBlock label="Strategic Judgment" color="human" small delay={6} />
                    <SkillBlock label="Cross-Functional Comm." color="human" small delay={7} />
                    <SkillBlock label="Adaptive Thinking" color="human" small glow delay={8} />
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.p variants={fadeUp} custom={9} className="text-center text-sm text-muted-foreground mt-8 max-w-lg mx-auto">
              The students who thrive will be the ones who practiced the skills the market is moving toward.
              That practice starts here.
            </motion.p>
          </div>
        </Section>

        {/* ═══ THREE STEPS TO JOB-MARKET FLUENCY ═══ */}
        <Section className="py-20 sm:py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Three steps to job-market fluency</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                From "what should I learn?" to "I'm ready." Here's how.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Target,
                  title: "See What's Changing",
                  desc: "We break every role into its core tasks and score each one for AI exposure. See exactly which skills are growing, shifting, or emerging.",
                  color: "text-spectrum-0",
                  gradient: "from-spectrum-0 via-spectrum-1 to-spectrum-2",
                },
                {
                  icon: Brain,
                  title: "Practice What Counts",
                  desc: "AI-powered simulations let you practice real workplace tasks — not generic quizzes. Build the four pillars: Tool Awareness, Human Value-Add, Adaptive Thinking, Domain Judgment.",
                  color: "text-spectrum-3",
                  gradient: "from-spectrum-3 via-spectrum-4 to-spectrum-5",
                },
                {
                  icon: TrendingUp,
                  title: "Track Your Growth",
                  desc: "Your skill map shows which roles you're closest to and which skills unlock the most career paths. Every simulation moves you forward.",
                  color: "text-spectrum-6",
                  gradient: "from-spectrum-6 via-spectrum-5 to-spectrum-4",
                },
              ].map((pillar, i) => (
                <motion.div
                  key={pillar.title}
                  variants={fadeUp}
                  custom={i + 1}
                  className="relative rounded-xl overflow-hidden group"
                >
                  <div className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${pillar.gradient} opacity-80 group-hover:opacity-100 transition-opacity`} />
                  <div className="border border-border/60 bg-card/80 backdrop-blur-sm rounded-xl p-6 sm:p-8 h-full">
                    <div className="h-10 w-10 rounded-xl bg-card border border-border/60 flex items-center justify-center mb-4">
                      <pillar.icon className={`h-5 w-5 ${pillar.color}`} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{pillar.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{pillar.desc}</p>
                  </div>
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
        <Section className="py-20 sm:py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <div className="inline-flex items-center gap-2 mb-4">
                <Play className="h-5 w-5 text-primary" />
                <span className="text-sm font-mono text-primary tracking-widest uppercase">Real Jobs, Real Practice</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Practice on real jobs, not textbook exercises</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Every simulation is built from a live job posting — the same roles companies are hiring for right now.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                { role: "AI Research Engineer", company: "Anthropic", dept: "Research", exposure: 62, tasks: 12, task: "Design evaluation benchmarks for language model safety" },
                { role: "Product Marketing Manager", company: "Stripe", dept: "Marketing", exposure: 71, tasks: 9, task: "Create go-to-market strategy for new API product" },
                { role: "Data Scientist", company: "Meta", dept: "Analytics", exposure: 78, tasks: 11, task: "Build predictive model for user engagement patterns" },
                { role: "Solutions Architect", company: "Databricks", dept: "Engineering", exposure: 55, tasks: 8, task: "Design data lakehouse architecture for enterprise client" },
                { role: "Strategy Consultant", company: "McKinsey", dept: "Advisory", exposure: 45, tasks: 10, task: "Conduct market sizing analysis for new vertical" },
                { role: "ML Platform Engineer", company: "OpenAI", dept: "Infrastructure", exposure: 68, tasks: 14, task: "Optimize model serving pipeline for production scale" },
              ].map((job, i) => {
                const spectrumGradient = SPECTRUM_GRADIENTS[i % SPECTRUM_GRADIENTS.length];
                return (
                  <motion.div
                    key={job.role}
                    variants={fadeUp}
                    custom={i + 1}
                    className="relative rounded-xl overflow-hidden group cursor-pointer"
                    onClick={() => handleLaunchSim({ role: job.role, company: job.company, task: job.task })}
                  >
                    <div className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${spectrumGradient} opacity-70 group-hover:opacity-100 transition-opacity`} />
                    <div className="border border-border/60 bg-card/80 backdrop-blur-sm rounded-xl p-5 h-full">
                      <div className="flex items-center gap-2 mb-3">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{job.company}</span>
                      </div>
                      <h3 className="text-sm font-bold mb-1 group-hover:text-primary transition-colors">{job.role}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{job.dept} · {job.tasks} practiceable tasks</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Bot className="h-3.5 w-3.5 text-brand-ai" />
                          <span className="text-xs font-mono text-brand-ai">{job.exposure}%</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="h-3 w-3" />
                          Practice
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.p variants={fadeUp} custom={8} className="text-center text-sm text-muted-foreground mt-8">
              21,000+ roles across 3,600+ companies — all mapped, scored, and ready to practice.
            </motion.p>
          </div>
        </Section>

        {/* ═══ VIRAL CTA — Tell Your Professor ═══ */}
        <Section className="py-16 px-6">
          <div className="max-w-2xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="relative rounded-2xl overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-spectrum-3 via-spectrum-4 to-spectrum-5" />
              <div className="border border-border/60 bg-card/80 backdrop-blur-sm rounded-2xl p-8 text-center">
                <GraduationCap className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Your school isn't on crowy yet?</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Tell your professor or career center. We'll give them a free curriculum audit
                  and get your whole cohort set up.
                </p>
                <Button variant="outline" onClick={() => navigate("/contact")} className="gap-2 border-border/60">
                  Share with your school <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        </Section>

        {/* ═══ FINAL CTA ═══ */}
        <Section className="py-20 sm:py-28 px-6 relative">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/6 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-3xl mx-auto text-center relative">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold mb-4">
              The market is moving.
              <br />
              <span className="bg-gradient-to-r from-brand-human to-brand-ai bg-clip-text text-transparent">Start building.</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-8 max-w-md mx-auto">
              Pick any role you're curious about. We'll show you what it's really made of — and what to practice first.
            </motion.p>
            <motion.div variants={fadeUp} custom={2}>
              <Button size="lg" onClick={handleGetStarted} className="gap-2 text-base px-10 h-12 glow-purple">
                Get Started — Free <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.p variants={fadeUp} custom={3} className="text-xs text-muted-foreground mt-4">
              No credit card required. Explore 21,000+ roles instantly.
            </motion.p>
          </div>
        </Section>

      </div>

      <SimulatorModal
        open={!!simJob}
        onClose={() => setSimJob(null)}
        taskName={simJob?.task ?? ""}
        jobTitle={simJob?.role ?? ""}
        company={simJob?.company ?? ""}
        mode="assess"
      />

      <Footer />
    </>
  );
}
