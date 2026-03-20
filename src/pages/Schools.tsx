/**
 * /schools — B2B university landing page.
 * Position: Every student needs this to succeed. Schools get a customized
 * skill-gap dashboard + ability to connect their own employer jobs.
 */
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  Link2,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CompanyMarquee from "@/components/CompanyMarquee";

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

/* ─── Visual: School Dashboard Preview ─── */
function DashboardPreview() {
  const SKILLS = [
    { skill: "Prompt Engineering", demand: 84200, tier: "high", students: 12 },
    { skill: "Data Visualization", demand: 57800, tier: "strong", students: 89 },
    { skill: "AI / ML Pipelines", demand: 62400, tier: "emerging", students: 34 },
    { skill: "Cloud Architecture", demand: 51300, tier: "emerging", students: 18 },
    { skill: "Statistical Modeling", demand: 48600, tier: "strong", students: 76 },
    { skill: "UX Research", demand: 38900, tier: "high", students: 8 },
  ];

  const tierConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
    strong: { label: "Strong coverage", bg: "bg-spectrum-2/10", text: "text-spectrum-2", border: "border-spectrum-2/20" },
    emerging: { label: "Emerging", bg: "bg-spectrum-4/10", text: "text-spectrum-4", border: "border-spectrum-4/20" },
    high: { label: "High growth potential", bg: "bg-spectrum-6/10", text: "text-spectrum-6", border: "border-spectrum-6/20" },
  };

  return (
    <motion.div variants={fadeUp} custom={1} className="relative rounded-2xl overflow-hidden max-w-3xl mx-auto">
      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-spectrum-6 via-spectrum-3 to-spectrum-0" />
      <div className="border border-border/60 bg-card/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold">Your School Dashboard</h3>
            <p className="text-sm text-muted-foreground">Real-time skill demand across 3,600+ employers</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <span className="text-2xl font-bold text-spectrum-2">247</span>
              <p className="text-[10px] text-muted-foreground font-mono">STUDENTS</p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-spectrum-4">31</span>
              <p className="text-[10px] text-muted-foreground font-mono">SKILLS TRACKED</p>
            </div>
          </div>
        </div>

        {/* Skill rows */}
        <div className="space-y-2">
          {SKILLS.map((item, i) => {
            const tier = tierConfig[item.tier];
            return (
              <motion.div
                key={item.skill}
                variants={fadeUp}
                custom={i + 2}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-secondary/50 border border-border/30"
              >
                <div className="flex items-center gap-3">
                  {item.tier === "strong" ? (
                    <CheckCircle2 className="h-4 w-4 text-spectrum-2 shrink-0" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-spectrum-4 shrink-0" />
                  )}
                  <span className="text-sm font-medium">{item.skill}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-mono hidden sm:block">{item.demand.toLocaleString()} jobs</span>
                  <span className="text-xs text-muted-foreground font-mono">{item.students} practicing</span>
                  <span className={`text-[10px] font-medium ${tier.text} ${tier.bg} px-2 py-0.5 rounded-full border ${tier.border}`}>
                    {tier.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Customized to your programs &amp; employer partners</p>
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
            <Zap className="h-3 w-3" /> Live data
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Visual: Connect Employer Jobs ─── */
function ConnectJobsPreview() {
  const CONNECTED = [
    { company: "Deloitte", roles: 24, logo: "D" },
    { company: "JPMorgan Chase", roles: 18, logo: "JP" },
    { company: "Google", roles: 31, logo: "G" },
  ];
  const PENDING = [
    { company: "Local startup accelerator", roles: "—" },
    { company: "Regional hospital network", roles: "—" },
  ];

  return (
    <motion.div variants={fadeUp} custom={1} className="relative rounded-2xl overflow-hidden max-w-2xl mx-auto">
      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-spectrum-3 via-spectrum-4 to-spectrum-5" />
      <div className="border border-border/60 bg-card/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-5">
          <Briefcase className="h-4 w-4 text-spectrum-3" />
          <span className="text-sm font-bold">Connected Employers</span>
          <span className="text-[10px] font-mono text-muted-foreground ml-auto">3 connected · 2 pending</span>
        </div>

        <div className="space-y-2 mb-4">
          {CONNECTED.map((c, i) => (
            <motion.div
              key={c.company}
              variants={fadeUp}
              custom={i + 2}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-spectrum-2/5 border border-spectrum-2/15"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-spectrum-2/20 to-spectrum-3/20 border border-spectrum-2/20 flex items-center justify-center text-xs font-bold text-spectrum-2">
                  {c.logo}
                </div>
                <span className="text-sm font-medium">{c.company}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">{c.roles} live roles</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-spectrum-2" />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-2">
          {PENDING.map((p, i) => (
            <motion.div
              key={p.company}
              variants={fadeUp}
              custom={i + 5}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-secondary/50 border border-border/30 opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted border border-border/50 flex items-center justify-center">
                  <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">{p.company}</span>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Pending</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Connect your employer partners so students practice the exact skills your recruiters need.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── How It Works (rewritten) ─── */
const STEPS = [
  {
    icon: Users,
    title: "Enroll your students",
    desc: "Domain auto-enroll, CSV import, or invite links — seat your entire cohort in minutes. No IT integration needed.",
    color: "text-spectrum-0",
    gradient: "from-spectrum-0 via-spectrum-1 to-spectrum-2",
  },
  {
    icon: BarChart3,
    title: "Get your customized dashboard",
    desc: "We map 31 high-demand skills against 3,600+ employers so you see exactly where your students stand — updated weekly.",
    color: "text-spectrum-3",
    gradient: "from-spectrum-3 via-spectrum-4 to-spectrum-5",
  },
  {
    icon: Briefcase,
    title: "Connect your employer partners",
    desc: "Link employer job feeds so students practice skills your specific recruiters are hiring for. Your career office becomes a competitive advantage.",
    color: "text-spectrum-6",
    gradient: "from-spectrum-6 via-spectrum-5 to-spectrum-4",
  },
];

/* ─── Features ─── */
const FEATURES = [
  { icon: LayoutDashboard, title: "Skill-Gap Dashboard", desc: "See which of 31 market skills your students are growing — and where the biggest opportunities are.", gradient: "from-spectrum-0 to-spectrum-1" },
  { icon: Briefcase, title: "Custom Employer Jobs", desc: "Connect your employer partners' ATS feeds. Students practice the exact tasks your recruiters are hiring for.", gradient: "from-spectrum-6 to-spectrum-5" },
  { icon: Brain, title: "AI Simulation Library", desc: "10,000+ simulations built from real job tasks. Each one builds Foundation, AI Mastery, and Human Edge skills.", gradient: "from-spectrum-3 to-spectrum-4" },
  { icon: Users, title: "Bulk Provisioning", desc: "Domain auto-enroll, CSV import, or invite links — seat your entire cohort in minutes.", gradient: "from-spectrum-1 to-spectrum-2" },
  { icon: Trophy, title: "Gamified Engagement", desc: "XP leaderboards and skill territory maps keep students motivated and practicing consistently.", gradient: "from-spectrum-4 to-spectrum-5" },
  { icon: BarChart3, title: "Cohort Analytics", desc: "Track engagement, skill growth, and readiness scores across your entire student body.", gradient: "from-spectrum-5 to-spectrum-6" },
];

const SCHOOL_LOGOS = [
  ["UCLA", "MIT", "Stanford", "Carnegie Mellon", "Georgia Tech", "UT Austin"],
  ["NYU", "Michigan", "Berkeley", "Purdue", "Virginia Tech", "USC"],
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
              Every student needs this{" "}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-brand-human to-brand-ai bg-clip-text text-transparent">
                to compete.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed">
              Your students learn the theory. We give them the practice employers actually test for —
              mapped to 21,000+ real roles across 3,600+ companies.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-3 mb-10">
              <div className="flex items-center gap-2 text-sm font-medium text-brand-ai">
                <Sparkles className="h-4 w-4" />
                <span>Students who practice are 3× more likely to pass technical assessments</span>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/contact")} className="gap-2 text-base px-8 h-12 glow-purple">
                Start a Free Pilot <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="text-base px-8 h-12 border-border/60">
                See How It Works
              </Button>
            </motion.div>
          </div>
        </Section>

        {/* ═══ THE PROBLEM ═══ */}
        <Section className="py-20 sm:py-28 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 mb-4">
              <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">The Reality</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold mb-6">
              Employers aren't just testing knowledge.{" "}
              <span className="text-brand-ai">They're testing AI-readiness.</span>
            </motion.h2>
            <motion.div variants={fadeUp} custom={2} className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
              {[
                { value: "73%", label: "of employers now include AI in technical assessments", color: "text-spectrum-6", gradient: "from-spectrum-6 to-spectrum-5" },
                { value: "31", label: "core skills the market demands beyond what courses teach", color: "text-spectrum-4", gradient: "from-spectrum-4 to-spectrum-3" },
                { value: "2×", label: "faster skill shifts since 2024 — annual training can't keep up", color: "text-spectrum-0", gradient: "from-spectrum-0 to-spectrum-1" },
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
              Your curriculum gives students the foundation. We give them the practice environment
              to build the skills employers are actually testing for.
            </motion.p>
          </div>
        </Section>

        {/* ═══ HOW IT WORKS ═══ */}
        <Section className="py-20 sm:py-28 px-6">
          <div id="how-it-works" className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">How It Works</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-4 mb-4">Three steps. Zero IT overhead.</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">Launch in a day. No LMS integration needed.</p>
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

        {/* ═══ DASHBOARD PREVIEW ═══ */}
        <Section className="py-20 sm:py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
              <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">Your Dashboard</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-4 mb-4">See where your students stand — in real time</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                A customized skill-gap dashboard built from actual employer demand data. Updated weekly.
              </p>
            </motion.div>
            <DashboardPreview />
          </div>
        </Section>

        {/* ═══ CONNECT EMPLOYERS ═══ */}
        <Section className="py-20 sm:py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
              <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">Employer Connections</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-4 mb-4">
                Connect your recruiters.{" "}
                <span className="bg-gradient-to-r from-spectrum-3 to-spectrum-5 bg-clip-text text-transparent">Students practice what they hire for.</span>
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Link employer ATS feeds and your students will practice the exact tasks and skills those companies are hiring for. Your career office becomes a competitive advantage.
              </p>
            </motion.div>
            <ConnectJobsPreview />
          </div>
        </Section>

        {/* ═══ FEATURES ═══ */}
        <Section className="py-20 sm:py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything your institution needs</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                From skill tracking to employer alignment — one platform, zero IT overhead.
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

            <motion.div variants={fadeUp} custom={1} className="relative rounded-2xl overflow-hidden max-w-2xl mx-auto mt-12">
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-spectrum-3 via-spectrum-0 to-spectrum-1" />
              <blockquote className="border border-border/60 bg-card/80 backdrop-blur-sm rounded-2xl p-8 text-center">
                <p className="text-lg sm:text-xl italic text-foreground/80 leading-relaxed">
                  "Our students started practicing the exact skills our employer partners hire for —
                  within a week of launch. The career office now has data to prove employment outcomes."
                </p>
                <footer className="mt-4 text-sm text-muted-foreground">
                  — Associate Dean, R1 University (pilot participant)
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
              Give every student the edge they need.
              <br />
              <span className="text-primary">Start with a free pilot.</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-8 max-w-md mx-auto">
              Seat your first cohort, connect your employer partners, and see the impact within weeks.
            </motion.p>
            <motion.div variants={fadeUp} custom={2}>
              <Button size="lg" onClick={() => navigate("/contact")} className="gap-2 text-base px-10 h-12 glow-purple">
                Start a Free Pilot <ArrowRight className="h-4 w-4" />
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
