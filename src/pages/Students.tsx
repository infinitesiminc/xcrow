/**
 * /students — Marketing page targeting university students.
 * Explains the brand thesis via the "Skill Stack" Lego-block metaphor:
 *   Jobs → Tasks → Skills (transferable) → AI is shifting the stack.
 *
 * Visual vibe: gamified dark-mode with spectrum gradient borders, neon accents.
 * Messaging: Skill Builder angle, empowering & direct tone, real-time market transparency.
 */
import { useRef, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, Blocks, Brain, GraduationCap, Lock, Sparkles, Star, Target, Trophy, TrendingUp, Zap } from "lucide-react";
import CompanyMarquee from "@/components/CompanyMarquee";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SimulatorModal from "@/components/SimulatorModal";
import CompanyJobsPanel from "@/components/CompanyJobsPanel";

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

/* ─── Static Visual 1: Jobs share the same skill stack ─── */
function SharedSkillsVisual() {
  const ROLES = [
    {
      title: "Product Manager",
      skills: [
        { label: "Strategy", color: "human" as const },
        { label: "Data Analysis", color: "mid" as const },
        { label: "Communication", color: "human" as const },
        { label: "Research", color: "mid" as const },
      ],
    },
    {
      title: "Software Engineer",
      skills: [
        { label: "Programming", color: "mid" as const },
        { label: "Data Analysis", color: "mid" as const },
        { label: "System Design", color: "human" as const },
        { label: "Communication", color: "human" as const },
      ],
    },
    {
      title: "Data Scientist",
      skills: [
        { label: "Data Analysis", color: "mid" as const },
        { label: "Programming", color: "mid" as const },
        { label: "Research", color: "mid" as const },
        { label: "Strategy", color: "human" as const },
      ],
    },
  ];

  const SHARED = new Set(["Data Analysis", "Communication", "Strategy", "Programming", "Research"]);

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-5 max-w-2xl mx-auto">
      {ROLES.map((role, ri) => (
        <div key={role.title} className="flex flex-col items-center gap-1">
          <div className="flex flex-col gap-1 w-full">
            {role.skills.map((s, si) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                custom={ri * 0.5 + si}
                className={`relative rounded-lg overflow-hidden h-9 ${SHARED.has(s.label) ? "ring-1 ring-primary/30" : ""}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${
                  s.color === "human" ? "from-brand-human/50 via-indigo-400/30 to-brand-human/15"
                    : "from-brand-mid/50 via-violet-400/30 to-brand-mid/15"
                } rounded-lg`} />
                <div className="absolute inset-[1px] rounded-[7px] bg-card/90" />
                <div className={`relative h-full flex items-center justify-center text-[11px] sm:text-xs font-semibold px-2 ${
                  s.color === "human" ? "text-brand-human" : "text-brand-mid"
                }`}>
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
          <motion.span variants={fadeUp} custom={ri * 0.5 + 4} className="text-[10px] sm:text-xs font-mono text-muted-foreground mt-2 tracking-wide text-center">
            {role.title}
          </motion.span>
        </div>
      ))}
    </div>
  );
}

/* ─── Static Visual 2: AI shifts the stack ─── */
function SkillShiftVisual() {
  const AI_SKILLS = ["Data Entry & Sorting", "Report Generation", "Basic Analysis", "Template Drafting"];
  const HUMAN_SKILLS = ["Strategic Judgment", "Stakeholder Mgmt", "Ethical Reasoning", "Creative Problem-Solving"];

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-xl mx-auto">
      <motion.div variants={fadeUp} custom={0} className="relative rounded-xl overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-brand-ai/60 to-brand-ai/20" />
        <div className="border border-border/60 bg-card/80 rounded-xl p-4 pt-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="h-3.5 w-3.5 text-brand-ai" />
            <span className="text-[10px] font-mono text-brand-ai tracking-widest uppercase">Shrinking</span>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mb-3">AI automates these</p>
          <div className="flex flex-col gap-1">
            {AI_SKILLS.map((label, i) => (
              <motion.div key={label} variants={fadeUp} custom={i + 1} className="relative rounded-lg overflow-hidden h-9 opacity-60">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-ai/40 via-pink-500/20 to-brand-ai/10 rounded-lg" />
                <div className="absolute inset-[1px] rounded-[7px] bg-card/90" />
                <div className="relative h-full flex items-center justify-center text-[11px] font-semibold text-brand-ai px-2">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} custom={1} className="relative rounded-xl overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-brand-human/60 to-brand-human/20" />
        <div className="border border-brand-human/20 bg-card/80 rounded-xl p-4 pt-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-human/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-1.5 mb-1 relative">
            <TrendingUp className="h-3.5 w-3.5 text-brand-human" />
            <span className="text-[10px] font-mono text-brand-human tracking-widest uppercase">Growing</span>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mb-3 relative">Your new edge</p>
          <div className="flex flex-col gap-1 relative">
            {HUMAN_SKILLS.map((label, i) => (
              <motion.div key={label} variants={fadeUp} custom={i + 2} className="relative rounded-lg overflow-hidden h-9">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-human/50 via-indigo-400/30 to-brand-human/15 rounded-lg" />
                <div className="absolute inset-[1px] rounded-[7px] bg-card/90" />
                <div className="relative h-full flex items-center justify-center text-[11px] font-semibold text-brand-human px-2">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Auto-select company panel — shows jobs immediately on scroll ─── */
function AutoSelectCompanyPanel({
  selectedCompany,
  onSelect,
  onClose,
  onJobSelect,
}: {
  selectedCompany: string | null;
  onSelect: (name: string) => void;
  onClose: () => void;
  onJobSelect: (job: { role: string; company: string; task: string }) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [autoSelected, setAutoSelected] = useState(false);

  useEffect(() => {
    if (inView && !autoSelected && !selectedCompany) {
      const timer = setTimeout(() => {
        onSelect("Anthropic");
        setAutoSelected(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [inView, autoSelected, selectedCompany, onSelect]);

  return (
    <div ref={ref}>
      <CompanyJobsPanel
        companyName={selectedCompany}
        onClose={onClose}
        onJobSelect={onJobSelect}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
export default function Students() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const [simJob, setSimJob] = useState<{ role: string; company: string; task: string } | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const handleCompanyClick = useCallback((name: string) => {
    setSelectedCompany((prev) => (prev === name ? null : name));
  }, []);

  const handleGetStarted = () => {
    if (user) navigate("/");
    else openAuthModal?.();
  };

  const handleLaunchSim = (job: { role: string; company: string; task: string }) => {
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
              AI doesn't replace you.{" "}
              <br />
              <span className="bg-gradient-to-r from-brand-human to-brand-ai bg-clip-text text-transparent">
                It promotes you.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Every role is shifting up the value chain. We show you the higher-purpose tasks
              emerging in your field — and let you start practicing them today.
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

        {/* ═══ GAMIFICATION HOOK — XP Preview ═══ */}
        <Section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-3">
                <Trophy className="h-5 w-5 text-warning" />
                <span className="text-sm font-mono text-warning tracking-widest uppercase">Level Up Your Career</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                Every simulation unlocks{" "}
                <span className="bg-gradient-to-r from-warning to-spectrum-6 bg-clip-text text-transparent">real career intelligence</span>
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Practice tasks. Earn XP. Unlock how your role is evolving — insights most people won't see for years.
              </p>
            </motion.div>

            {/* Fake XP Dashboard */}
            <motion.div variants={fadeUp} custom={1} className="relative rounded-2xl overflow-hidden max-w-3xl mx-auto">
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-warning via-spectrum-6 to-spectrum-4" />
              <div className="border border-border/60 bg-card/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8">

                {/* Player header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-spectrum-6 flex items-center justify-center text-lg font-bold text-primary-foreground">
                      YO
                    </div>
                    <motion.div
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-warning flex items-center justify-center text-[10px] font-bold text-warning-foreground"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      5
                    </motion.div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">Your Profile</div>
                    <div className="text-xs text-muted-foreground">Level 5 · 1,240 XP</div>
                    <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-spectrum-4"
                        initial={{ width: "0%" }}
                        whileInView={{ width: "68%" }}
                        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                        viewport={{ once: true }}
                      />
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-2xl font-bold text-warning">1,240</div>
                    <div className="text-[10px] font-mono text-muted-foreground">TOTAL XP</div>
                  </div>
                </div>

                {/* Badge row */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-6">
                  {[
                    { icon: Zap, label: "First Sim", earned: true, color: "text-spectrum-0" },
                    { icon: Brain, label: "Deep Thinker", earned: true, color: "text-spectrum-3" },
                    { icon: Star, label: "Top 10%", earned: true, color: "text-warning" },
                    { icon: TrendingUp, label: "Role Evolved", earned: false, color: "text-spectrum-6" },
                    { icon: Trophy, label: "5 Roles", earned: false, color: "text-spectrum-4" },
                  ].map((badge, i) => (
                    <motion.div
                      key={badge.label}
                      variants={fadeUp}
                      custom={i + 2}
                      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border ${
                        badge.earned
                          ? "border-border/60 bg-card/60"
                          : "border-border/30 bg-card/30 opacity-50"
                      } ${i === 4 ? "hidden sm:flex" : ""}`}
                    >
                      {badge.earned ? (
                        <badge.icon className={`h-6 w-6 ${badge.color}`} />
                      ) : (
                        <Lock className="h-6 w-6 text-muted-foreground/40" />
                      )}
                      <span className="text-[10px] font-mono text-muted-foreground text-center leading-tight">
                        {badge.label}
                      </span>
                      {badge.earned && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-success flex items-center justify-center"
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
                          viewport={{ once: true }}
                        >
                          <span className="text-[8px] text-success-foreground">✓</span>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Elevation Teaser — locked card */}
                <motion.div
                  variants={fadeUp}
                  custom={7}
                  className="relative rounded-xl overflow-hidden"
                >
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-spectrum-6 via-spectrum-5 to-spectrum-4 opacity-60" />
                  <div className="border border-brand-human/20 bg-gradient-to-br from-brand-human/5 via-card/60 to-card/80 backdrop-blur-sm rounded-xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-human/10 border border-brand-human/20 flex items-center justify-center flex-shrink-0">
                      <motion.div
                        animate={{ rotateY: [0, 180, 360] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Sparkles className="h-5 w-5 text-brand-human" />
                      </motion.div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold mb-0.5">🔒 Role Evolution Insight</div>
                      <div className="text-xs text-muted-foreground">
                        Score 60%+ in any simulation to unlock how that role is shifting up the value chain — your personal career intelligence brief.
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleGetStarted} className="flex-shrink-0 border-brand-human/30 text-brand-human hover:bg-brand-human/10 hidden sm:flex gap-1.5">
                      <Zap className="h-3.5 w-3.5" /> Unlock
                    </Button>
                  </div>
                </motion.div>
              </div>
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

        {/* ═══ VISUAL 1 — Jobs share skills ═══ */}
        <Section className="py-20 sm:py-28 px-6">
          <div id="how-it-works" className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-4">
                <Blocks className="h-5 w-5 text-brand-mid" />
                <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">The Skill Stack</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                Every job is a <span className="bg-gradient-to-r from-spectrum-0 via-spectrum-3 to-spectrum-6 bg-clip-text text-transparent">stack of skills</span>.
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Different roles share the same building blocks. Skills are transferable — and that's your leverage.
              </p>
            </div>
            <SharedSkillsVisual />
          </div>
        </Section>

        {/* ═══ VISUAL 2 — AI shifts the stack ═══ */}
        <Section className="py-20 sm:py-28 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-brand-ai" />
                <span className="text-sm font-mono text-brand-ai tracking-widest uppercase">AI Reshuffles The Deck</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                Some skills <span className="text-brand-ai">shrink</span>. Others <span className="text-brand-human">grow</span>.
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                AI automates routine tasks while elevating human judgment. The students who practice the growing skills get hired.
              </p>
            </motion.div>
            <SkillShiftVisual />
          </div>
        </Section>

        {/* ═══ THREE STEPS TO JOB-MARKET FLUENCY ═══ */}
        <Section className="py-20 sm:py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Three steps to owning the top of your stack</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                From "what's changing?" to "I'm ready for it." Here's how.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Target,
                  title: "See Where You're Being Promoted",
                  desc: "We break every role into its core tasks and show you which ones AI is handling — and which higher-purpose tasks are emerging for you.",
                  color: "text-spectrum-0",
                  gradient: "from-spectrum-0 via-spectrum-1 to-spectrum-2",
                },
                {
                  icon: Brain,
                  title: "Practice The Tasks At The Top",
                  desc: "AI-powered simulations let you practice the strategic, human-centric tasks that define your new value — not the ones being automated away.",
                  color: "text-spectrum-3",
                  gradient: "from-spectrum-3 via-spectrum-4 to-spectrum-5",
                },
                {
                  icon: TrendingUp,
                  title: "Track Your Elevation",
                  desc: "Your skill map shows how you're moving up the value chain — which roles you're closest to and which skills unlock the most career paths.",
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
            <motion.div variants={fadeUp} custom={0} className="text-center mb-8 relative">
              <motion.span
                className="text-sm font-mono tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-muted-foreground via-primary to-muted-foreground bg-[length:200%_100%]"
                animate={{ backgroundPosition: ["100% 0%", "-100% 0%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                {selectedCompany ? `Exploring ${selectedCompany}` : "Click a company to explore real roles"}
              </motion.span>
              <motion.div
                className="absolute -bottom-2 left-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary/60 to-transparent"
                animate={{ width: ["0%", "60%", "0%"], x: ["-50%", "-50%", "-50%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
            <motion.div variants={fadeUp} custom={1}>
              <CompanyMarquee
                rows={[
                  ["Anthropic", "OpenAI", "Google DeepMind", "Stripe", "SpaceX", "Anduril", "xAI"],
                  ["Databricks", "Cohere", "Notion", "Deel", "Rubrik", "Instacart", "Esri"],
                ]}
                onCompanyClick={handleCompanyClick}
              />
            </motion.div>
            {/* Always show jobs panel — auto-select first company on scroll */}
            <AutoSelectCompanyPanel
              selectedCompany={selectedCompany}
              onSelect={setSelectedCompany}
              onClose={() => setSelectedCompany(null)}
              onJobSelect={handleLaunchSim}
            />
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
              AI is elevating every role.
              <br />
              <span className="bg-gradient-to-r from-brand-human to-brand-ai bg-clip-text text-transparent">Start climbing.</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-8 max-w-md mx-auto">
              Pick any role you're curious about. We'll show you where it's headed — and let you practice the tasks that put you at the top.
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
        guestMaxTurns={!user ? 3 : undefined}
      />

      <Footer />
    </>
  );
}
