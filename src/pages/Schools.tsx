/**
 * /schools — B2B university landing page targeting deans & provosts.
 * Key hook: "Free Curriculum Audit" showing gap between catalog and market demand.
 */
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  Search,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CompanyMarquee from "@/components/CompanyMarquee";

/* ─── Animation ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (d: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: d * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.section ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} className={`relative ${className}`}>
      {children}
    </motion.section>
  );
}

/* ─── Mock gap data for the live preview ─── */
const MOCK_GAPS = [
  { skill: "Prompt Engineering", demand: 84200, coverage: false },
  { skill: "AI / ML Pipelines", demand: 62400, coverage: false },
  { skill: "Data Visualization (Tableau/PowerBI)", demand: 57800, coverage: true },
  { skill: "Cloud Architecture (AWS/GCP)", demand: 51300, coverage: false },
  { skill: "Statistical Modeling", demand: 48600, coverage: true },
  { skill: "API Integration", demand: 43100, coverage: false },
  { skill: "UX Research", demand: 38900, coverage: false },
  { skill: "Agile / Scrum", demand: 35200, coverage: true },
];

const SCHOOL_LOGOS = [
  ["UCLA", "MIT", "Stanford", "Carnegie Mellon", "Georgia Tech", "UT Austin"],
  ["NYU", "Michigan", "Berkeley", "Purdue", "Virginia Tech", "USC"],
];

/* ─── How It Works Steps ─── */
const STEPS = [
  {
    icon: Search,
    title: "We scan your catalog",
    desc: "Point us at your course catalog URL. Our AI parses every program, course, and learning outcome — no LMS integration needed.",
    color: "text-brand-human",
  },
  {
    icon: BarChart3,
    title: "Map to market demand",
    desc: "We cross-reference your curriculum against 1M+ real job task clusters to calculate coverage, gaps, and AI readiness scores.",
    color: "text-brand-mid",
  },
  {
    icon: Zap,
    title: "Close the gaps with simulations",
    desc: "For every gap we find, students get targeted AI simulations that build the exact skills employers are hiring for.",
    color: "text-brand-ai",
  },
];

/* ─── Feature Grid Items ─── */
const FEATURES = [
  { icon: BookOpen, title: "Curriculum Gap Analysis", desc: "Program-by-program breakdown of skill coverage vs. market demand." },
  { icon: Brain, title: "AI Simulation Library", desc: "10,000+ simulations mapped to your courses and learning outcomes." },
  { icon: LayoutDashboard, title: "Admin Dashboard", desc: "Cohort analytics, engagement tracking, and accreditation-ready reports." },
  { icon: Users, title: "Bulk Provisioning", desc: "Domain auto-enroll, CSV import, or SSO — seat students in minutes." },
  { icon: GraduationCap, title: "Student Skill Maps", desc: "Every student gets a visual profile of their AI-readiness across 4 pillars." },
  { icon: BarChart3, title: "XP Leaderboard", desc: "Gamified engagement that drives practice and healthy competition." },
];

export default function Schools() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* ═══ HERO ═══ */}
        <Section className="pt-28 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 rounded-full border border-brand-mid/30 bg-brand-mid/5 px-4 py-1.5 mb-6">
              <GraduationCap className="h-3.5 w-3.5 text-brand-mid" />
              <span className="text-xs font-medium text-brand-mid">For Universities & Colleges</span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-[1.08] tracking-tight mb-6">
              Your curriculum was designed
              <br />
              before GPT.{" "}
              <span className="bg-gradient-to-r from-brand-human to-brand-mid bg-clip-text text-transparent">
                Your students weren't.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed">
              We scan your course catalog, map it against 1M+ real job tasks, and show you exactly
              where your students are falling behind — and how to close the gap.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-3 mb-10">
              <div className="flex items-center gap-2 text-sm font-medium text-brand-ai">
                <Sparkles className="h-4 w-4" />
                <span>67% of skills in the average catalog are AI-exposed</span>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/contact")} className="gap-2 text-base px-8 h-12">
                Get a Free Curriculum Audit <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="text-base px-8 h-12">
                See How It Works
              </Button>
            </motion.div>
          </div>
        </Section>

        {/* ═══ THE PROBLEM ═══ */}
        <Section className="py-20 sm:py-28 px-6 bg-secondary/30">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 mb-4">
              <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">The Problem</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold mb-6">
              The skills gap isn't coming.{" "}
              <span className="text-brand-ai">It's already here.</span>
            </motion.h2>
            <motion.div variants={fadeUp} custom={2} className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
              {[
                { value: "Monthly", label: "AI capabilities evolve", color: "text-brand-ai" },
                { value: "Yearly", label: "Curricula update", color: "text-brand-mid" },
                { value: "Decades", label: "Careers span", color: "text-brand-human" },
              ].map((item, i) => (
                <motion.div key={item.label} variants={fadeUp} custom={i + 3} className="rounded-xl border border-border bg-card p-6">
                  <span className={`text-3xl sm:text-4xl font-bold font-display ${item.color}`}>{item.value}</span>
                  <p className="text-sm text-muted-foreground mt-2">{item.label}</p>
                </motion.div>
              ))}
            </motion.div>
            <motion.p variants={fadeUp} custom={6} className="text-muted-foreground mt-8 max-w-lg mx-auto">
              Your accreditation reports say you're compliant. The job market says your graduates aren't ready.
              We show you the difference — with data.
            </motion.p>
          </div>
        </Section>

        {/* ═══ HOW IT WORKS ═══ */}
        <Section className="py-20 sm:py-28 px-6">
          <div id="how-it-works" className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">How It Works</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-4 mb-4">Three steps. Zero IT overhead.</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">No LMS integration. No faculty surveys. Just a URL.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {STEPS.map((step, i) => (
                <motion.div key={step.title} variants={fadeUp} custom={i + 1} className="rounded-xl border border-border bg-card p-6 sm:p-8 relative">
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {i + 1}
                  </div>
                  <step.icon className={`h-8 w-8 ${step.color} mb-4`} />
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* ═══ LIVE GAP PREVIEW ═══ */}
        <Section className="py-20 sm:py-28 px-6 bg-secondary/30">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
              <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">Live Preview</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-4 mb-4">See your curriculum gaps in minutes</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Here's what a real audit looks like. Every school gets this — free.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={1} className="rounded-2xl border border-border bg-card p-6 sm:p-8 max-w-3xl mx-auto">
              {/* Mock header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold">Sample University — CS Department</h3>
                  <p className="text-sm text-muted-foreground">42 courses analyzed · 1,280 task clusters mapped</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-brand-ai">38%</span>
                    <p className="text-[10px] text-muted-foreground font-mono">COVERAGE</p>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-warning">72%</span>
                    <p className="text-[10px] text-muted-foreground font-mono">AI READINESS</p>
                  </div>
                </div>
              </div>

              {/* Gap list */}
              <div className="space-y-2">
                {MOCK_GAPS.map((gap, i) => (
                  <motion.div
                    key={gap.skill}
                    variants={fadeUp}
                    custom={i + 2}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      {gap.coverage ? (
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-brand-ai/40 shrink-0" />
                      )}
                      <span className={`text-sm font-medium ${gap.coverage ? "text-foreground" : "text-foreground"}`}>
                        {gap.skill}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono">{gap.demand.toLocaleString()} tasks</span>
                      {!gap.coverage && (
                        <span className="text-[10px] font-medium text-brand-ai bg-brand-ai/10 px-2 py-0.5 rounded-full">GAP</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground">5 of 8 high-demand skills missing from your catalog</p>
                <Button size="sm" variant="outline" onClick={() => navigate("/contact")} className="text-xs">
                  Get your full report <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </motion.div>
          </div>
        </Section>

        {/* ═══ FEATURES ═══ */}
        <Section className="py-20 sm:py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything your institution needs</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                From gap analysis to student engagement — one platform, no IT overhead.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feat, i) => (
                <motion.div key={feat.title} variants={fadeUp} custom={i + 1} className="rounded-xl border border-border bg-card p-6">
                  <feat.icon className="h-7 w-7 text-primary mb-3" />
                  <h3 className="font-bold mb-1">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* ═══ SOCIAL PROOF ═══ */}
        <Section className="py-16 px-6 bg-secondary/30">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-8">
              <p className="text-sm font-mono text-muted-foreground tracking-widest uppercase">
                Trusted by forward-thinking institutions
              </p>
            </motion.div>
            <CompanyMarquee rows={SCHOOL_LOGOS} />

            {/* Testimonial placeholder */}
            <motion.blockquote variants={fadeUp} custom={1} className="max-w-2xl mx-auto mt-12 text-center">
              <p className="text-lg sm:text-xl italic text-foreground/80 leading-relaxed">
                "We discovered that 62% of the skills employers want from our CS graduates weren't
                being taught in any course. crowy.ai showed us exactly where — and gave students
                a way to practice immediately."
              </p>
              <footer className="mt-4 text-sm text-muted-foreground">
                — Department Chair, R1 University (pilot participant)
              </footer>
            </motion.blockquote>
          </div>
        </Section>

        {/* ═══ FINAL CTA ═══ */}
        <Section className="py-20 sm:py-28 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold mb-4">
              Your students are already falling behind.
              <br />
              <span className="text-primary">Now you can see why.</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-8 max-w-md mx-auto">
              Get a free, no-obligation curriculum audit. We'll scan your catalog and deliver a
              skills gap report within 48 hours.
            </motion.p>
            <motion.div variants={fadeUp} custom={2}>
              <Button size="lg" onClick={() => navigate("/contact")} className="gap-2 text-base px-10 h-12">
                Book a Curriculum Audit <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.p variants={fadeUp} custom={3} className="text-xs text-muted-foreground mt-4">
              Free for qualifying institutions. No IT integration required.
            </motion.p>
          </div>
        </Section>
      </div>
      <Footer />
    </>
  );
}
