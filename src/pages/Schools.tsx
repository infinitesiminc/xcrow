/**
 * /schools — B2B university landing page targeting deans & provosts.
 * Key hook: "Free Curriculum Audit" showing opportunity to add high-demand skills.
 * Visual vibe: gamified dark-mode with spectrum gradient borders, neon accents.
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

/* ─── Mock data for the live preview ─── */
const MOCK_SKILLS = [
  { skill: "Prompt Engineering", demand: 84200, covered: false },
  { skill: "AI / ML Pipelines", demand: 62400, covered: false },
  { skill: "Data Visualization (Tableau/PowerBI)", demand: 57800, covered: true },
  { skill: "Cloud Architecture (AWS/GCP)", demand: 51300, covered: false },
  { skill: "Statistical Modeling", demand: 48600, covered: true },
  { skill: "API Integration", demand: 43100, covered: false },
  { skill: "UX Research", demand: 38900, covered: false },
  { skill: "Agile / Scrum", demand: 35200, covered: true },
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
    color: "text-spectrum-0",
    gradient: "from-spectrum-0 via-spectrum-1 to-spectrum-2",
  },
  {
    icon: BarChart3,
    title: "Spotlight your strengths & opportunities",
    desc: "We cross-reference your curriculum against 1M+ real job task clusters to spotlight your strongest coverage and highest-impact opportunities.",
    color: "text-spectrum-3",
    gradient: "from-spectrum-3 via-spectrum-4 to-spectrum-5",
  },
  {
    icon: Zap,
    title: "Unlock new skills with simulations",
    desc: "For every opportunity we find, students get targeted AI simulations that build the exact skills employers are hiring for.",
    color: "text-spectrum-6",
    gradient: "from-spectrum-6 via-spectrum-5 to-spectrum-4",
  },
];

/* ─── Feature Grid Items ─── */
const FEATURES = [
  { icon: BookOpen, title: "Curriculum Insights Report", desc: "Program-by-program breakdown of skill coverage and highest-impact opportunities.", gradient: "from-spectrum-0 to-spectrum-1" },
  { icon: Brain, title: "AI Simulation Library", desc: "10,000+ simulations mapped to your courses and learning outcomes.", gradient: "from-spectrum-6 to-spectrum-5" },
  { icon: LayoutDashboard, title: "Admin Dashboard", desc: "Cohort analytics, engagement tracking, and accreditation-ready reports.", gradient: "from-spectrum-3 to-spectrum-4" },
  { icon: Users, title: "Bulk Provisioning", desc: "Domain auto-enroll, CSV import, or SSO — seat students in minutes.", gradient: "from-spectrum-1 to-spectrum-2" },
  { icon: GraduationCap, title: "Student Skill Maps", desc: "Every student gets a visual profile of their growth potential across 4 pillars.", gradient: "from-spectrum-4 to-spectrum-5" },
  { icon: BarChart3, title: "XP Leaderboard", desc: "Gamified engagement that drives practice and healthy competition.", gradient: "from-spectrum-5 to-spectrum-6" },
];

export default function Schools() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* ═══ HERO ═══ */}
        <Section className="pt-28 pb-20 px-6 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center relative">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-6 glow-purple">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">For Universities & Colleges</span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-[1.08] tracking-tight mb-6">
              Your curriculum built the foundation.
              <br />
              Now let's{" "}
              <span className="bg-gradient-to-r from-brand-human to-brand-ai bg-clip-text text-transparent">
                future-proof it.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed">
              We scan your course catalog, map it against 1M+ real job tasks, and spotlight
              the highest-impact skills you can add next.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-3 mb-10">
              <div className="flex items-center gap-2 text-sm font-medium text-brand-ai">
                <Sparkles className="h-4 w-4" />
                <span>67% of in-demand skills can be added through simulations — no curriculum overhaul needed</span>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/contact")} className="gap-2 text-base px-8 h-12 glow-purple">
                Get a Free Curriculum Audit <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="text-base px-8 h-12 border-border/60">
                See How It Works
              </Button>
            </motion.div>
          </div>
        </Section>

        {/* ═══ THE OPPORTUNITY ═══ */}
        <Section className="py-20 sm:py-28 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 mb-4">
              <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">The Opportunity</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold mb-6">
              Three timelines.{" "}
              <span className="text-brand-ai">One chance to connect them.</span>
            </motion.h2>
            <motion.div variants={fadeUp} custom={2} className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
              {[
                { value: "Monthly", label: "AI capabilities evolve", color: "text-spectrum-6", gradient: "from-spectrum-6 to-spectrum-5" },
                { value: "Yearly", label: "Curricula update", color: "text-spectrum-4", gradient: "from-spectrum-4 to-spectrum-3" },
                { value: "Decades", label: "Careers span", color: "text-spectrum-0", gradient: "from-spectrum-0 to-spectrum-1" },
              ].map((item, i) => (
                <motion.div key={item.label} variants={fadeUp} custom={i + 3} className="relative rounded-xl overflow-hidden">
                  <div className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${item.gradient}`} />
                  <div className="border border-border/60 bg-card/80 backdrop-blur-sm rounded-xl p-6">
                    <span className={`text-3xl sm:text-4xl font-bold font-display ${item.color}`}>{item.value}</span>
                    <p className="text-sm text-muted-foreground mt-2">{item.label}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <motion.p variants={fadeUp} custom={6} className="text-muted-foreground mt-8 max-w-lg mx-auto">
              Your accreditation shows rigor. Market data shows where to grow next.
              We bring both together.
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
                <motion.div key={step.title} variants={fadeUp} custom={i + 1} className="relative rounded-xl">
                  <div className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${step.gradient}`} />
                  <div className="border border-border/60 bg-card/80 backdrop-blur-sm rounded-xl p-6 sm:p-8 relative h-full">
                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg shadow-primary/30">
                      {i + 1}
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-card border border-border/60 flex items-center justify-center mb-4 mt-2">
                      <step.icon className={`h-5 w-5 ${step.color}`} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* ═══ LIVE PREVIEW ═══ */}
        <Section className="py-20 sm:py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
              <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">Live Preview</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-4 mb-4">See your curriculum insights in minutes</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Here's what a real audit looks like. Every school gets this — free.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={1} className="relative rounded-2xl overflow-hidden max-w-3xl mx-auto">
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-spectrum-6 via-spectrum-3 to-spectrum-0" />
              <div className="border border-border/60 bg-card/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8">
                {/* Mock header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold">Sample University — CS Department</h3>
                    <p className="text-sm text-muted-foreground">42 courses analyzed · 1,280 task clusters mapped</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <span className="text-2xl font-bold text-spectrum-2">38%</span>
                      <p className="text-[10px] text-muted-foreground font-mono">COVERAGE</p>
                    </div>
                    <div className="text-center">
                      <span className="text-2xl font-bold text-spectrum-4">62%</span>
                      <p className="text-[10px] text-muted-foreground font-mono">GROWTH POTENTIAL</p>
                    </div>
                  </div>
                </div>

                {/* Skill list */}
                <div className="space-y-2">
                  {MOCK_SKILLS.map((item, i) => (
                    <motion.div
                      key={item.skill}
                      variants={fadeUp}
                      custom={i + 2}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-secondary/50 border border-border/30"
                    >
                      <div className="flex items-center gap-3">
                        {item.covered ? (
                          <CheckCircle2 className="h-4 w-4 text-spectrum-2 shrink-0" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-spectrum-4 shrink-0" />
                        )}
                        <span className="text-sm font-medium">{item.skill}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-mono">{item.demand.toLocaleString()} tasks</span>
                        {!item.covered && (
                          <span className="text-[10px] font-medium text-spectrum-4 bg-spectrum-4/10 px-2 py-0.5 rounded-full border border-spectrum-4/20">OPPORTUNITY</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">5 high-impact skills ready to add to your catalog</p>
                  <Button size="sm" variant="outline" onClick={() => navigate("/contact")} className="text-xs border-border/60">
                    Get your full report <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
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
                From curriculum insights to student engagement — one platform, no IT overhead.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feat, i) => (
                <motion.div key={feat.title} variants={fadeUp} custom={i + 1} className="relative rounded-xl overflow-hidden group">
                  <div className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${feat.gradient} opacity-70 group-hover:opacity-100 transition-opacity`} />
                  <div className="border border-border/60 bg-card/80 backdrop-blur-sm rounded-xl p-6 h-full">
                    <div className="h-9 w-9 rounded-xl bg-card border border-border/60 flex items-center justify-center mb-3">
                      <feat.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold mb-1">{feat.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* ═══ SOCIAL PROOF ═══ */}
        <Section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-8">
              <p className="text-sm font-mono text-muted-foreground tracking-widest uppercase">
                Trusted by forward-thinking institutions
              </p>
            </motion.div>
            <CompanyMarquee rows={SCHOOL_LOGOS} />

            {/* Testimonial */}
            <motion.div variants={fadeUp} custom={1} className="relative rounded-2xl overflow-hidden max-w-2xl mx-auto mt-12">
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-spectrum-3 via-spectrum-0 to-spectrum-1" />
              <blockquote className="border border-border/60 bg-card/80 backdrop-blur-sm rounded-2xl p-8 text-center">
                <p className="text-lg sm:text-xl italic text-foreground/80 leading-relaxed">
                  "crowy.ai helped us identify 12 high-demand skills we could integrate into existing
                  courses — our students started practicing them the same week."
                </p>
                <footer className="mt-4 text-sm text-muted-foreground">
                  — Department Chair, R1 University (pilot participant)
                </footer>
              </blockquote>
            </motion.div>
          </div>
        </Section>

        {/* ═══ FINAL CTA ═══ */}
        <Section className="py-20 sm:py-28 px-6 relative">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/6 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-3xl mx-auto text-center relative">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold mb-4">
              Give your students every advantage.
              <br />
              <span className="text-primary">The future rewards prepared graduates.</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-8 max-w-md mx-auto">
              Get a free curriculum insights report — we'll spotlight your highest-impact
              opportunities within 48 hours.
            </motion.p>
            <motion.div variants={fadeUp} custom={2}>
              <Button size="lg" onClick={() => navigate("/contact")} className="gap-2 text-base px-10 h-12 glow-purple">
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
