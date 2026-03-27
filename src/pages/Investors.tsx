import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import HeaderVibeImages from "@/components/HeaderVibeImages";
import {
  Cpu, Megaphone, GraduationCap, Building2, Users, AlertTriangle,
  Zap, Target, TrendingUp, DollarSign, Swords, Shield, Globe,
  Clock, Flame, BookOpen, BarChart3, ArrowRight, Download, Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import founderImg from "@/assets/founder-jackson.png";
import investorHero from "@/assets/investor-hero.png";

const fade = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const stoneCard = {
  background: "hsl(var(--surface-stone))",
  border: "1px solid hsl(var(--filigree) / 0.2)",
  boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))",
};

const cinzel = { fontFamily: "'Cinzel', serif" };

/* ── 1. Cover ── */
const HERO = {
  badge: "Seed Round · $1M",
  headline: "The AI Job Market Is Collapsing.\nWe're Building the Skill Bridge.",
  sub: "Gamified AI Upskill Platform",
};

/* ── 2. The Crisis ── */
const CRISIS_STATS = [
  { value: "40%", label: "of entry-level tasks automatable by 2027", source: "World Economic Forum" },
  { value: "87%", label: "of graduates lack AI-era workplace skills", source: "McKinsey Global Institute" },
  { value: "5–7 yrs", label: "average curriculum update cycle", source: "ACE Survey" },
  { value: "6 mos", label: "AI rewrites job requirements", source: "LinkedIn Economic Graph" },
];

const CRISIS_POINTS = [
  { icon: AlertTriangle, title: "Mass Skill Obsolescence", desc: "AI agents are absorbing tasks faster than institutions can adapt. By the time a university adds an AI elective, the landscape has shifted three times." },
  { icon: Swords, title: "Unverifiable Readiness", desc: "Resumes and GPAs don't show if a candidate can delegate to AI agents, triage automated outputs, or exercise judgment under automation." },
  { icon: Shield, title: "No Shared Infrastructure", desc: "There's no common language between what schools teach, what employers need, and what students can actually do with AI." },
];

/* ── 3. Why Now ── */
const WHY_NOW = [
  { icon: Flame, title: "AI adoption hit an inflection point", desc: "ChatGPT to enterprise deployment in 18 months. Every company is restructuring workflows around AI — but 73% can't find AI-ready talent." },
  { icon: Clock, title: "Universities are panicking", desc: "Career services budgets are being questioned. Deans need proof of employability outcomes. Adding an AI elective isn't enough." },
  { icon: TrendingUp, title: "The window is closing", desc: "First-mover in AI skill infrastructure captures the taxonomy. Whoever defines the 183 skills becomes the credential standard." },
];

/* ── 4. Solution ── */
const FOUR_PHASES = [
  { phase: "Discover", icon: Target, desc: "Explore real roles via NPC encounters. Every job mapped for AI exposure, task automation risk, and required future skills.", color: "var(--territory-technical)" },
  { phase: "Experiment", icon: Zap, desc: "Practice in AI-native simulations: delegate tasks, triage outputs, negotiate with AI agents in realistic scenarios.", color: "var(--territory-creative)" },
  { phase: "Challenge", icon: Swords, desc: "Face Territory Guardians in multi-round boss battles. Adaptive difficulty, narrative stakes, skill-specific scoring.", color: "var(--territory-strategic)" },
  { phase: "Master", icon: Shield, desc: "Earn verified skill badges, build a portable AI-Readiness Profile, and climb the global leaderboard.", color: "var(--territory-leadership)" },
];

/* ── 5. Product (screenshots replaced with feature descriptions) ── */
const PRODUCT_FEATURES = [
  { icon: Globe, title: "Territory Map", desc: "Interactive skill landscape — 8 territories, 183 skills, real-time progression." },
  { icon: Users, title: "NPC Encounters", desc: "Chat with role-based NPCs, wandering guides, and territory guardians." },
  { icon: BarChart3, title: "Role Intelligence", desc: "100K+ real jobs analyzed at task level for AI exposure and skill requirements." },
  { icon: BookOpen, title: "Skill Codex", desc: "Living encyclopedia of 183 AI-era competencies with growth paths." },
  { icon: GraduationCap, title: "School Dashboard", desc: "Institutional analytics: curriculum gaps, student readiness, employability benchmarks." },
  { icon: Target, title: "AI-Readiness Profiles", desc: "Shareable credential showing simulation-verified skills employers can trust." },
];

/* ── 6. Business Model ── */
const BIZ_MODEL = [
  { channel: "B2C", model: "Champion Pass", price: "$12/mo", desc: "Unlimited simulations, full leaderboard, skill passports, referral rewards. Viral loop: 1 free month per successful referral.", color: "var(--territory-creative)" },
  { channel: "B2B Schools", model: "Per-Seat SaaS", price: "$8–15/seat/mo", desc: "50–200 seat university pilots. AI-Readiness Profiles for students, skill-gap war room for faculty.", color: "var(--territory-strategic)" },
  { channel: "B2B Enterprise", model: "Recruiting Intelligence", price: "Custom", desc: "Verified skill data, ATS integration, talent pipeline from simulation-proven candidates.", color: "var(--territory-analytical)" },
];

const FLYWHEEL = [
  "Students play free → discover skill gaps",
  "Viral referrals drive organic growth",
  "Universities adopt for outcome reporting",
  "Employer demand validates the credential",
  "More data → better AI models → deeper moat",
];

/* ── 7. Market ── */
const MARKET_STATS = [
  { value: "$300B+", label: "Global EdTech Market by 2028" },
  { value: "$8.5B", label: "Skills Assessment TAM" },
  { value: "4,000+", label: "US universities (initial SAM)" },
  { value: "73%", label: "Employers can't find AI-ready talent" },
];

/* ── 8. Traction ── */
const TRACTION = [
  { value: "183", label: "Canonical AI-Era Skills Mapped" },
  { value: "100,000+", label: "Real Roles Analyzed" },
  { value: "1,200+", label: "Task Clusters Catalogued" },
  { value: "8", label: "Skill Territories Live" },
  { value: "3", label: "School Pilots in Pipeline" },
  { value: "2", label: "Revenue Streams Active" },
];

const DATA_MOAT = [
  "Only platform mapping skills at task-level granularity across 100K+ roles",
  "Proprietary taxonomy — 183 skills, 8 territories, cross-referenced to real job requirements",
  "Every simulation generates training data for better AI models",
  "Network effects: more students = richer skill benchmarks = more valuable to institutions",
];

/* ── 9. Team ── */
const TEAM = {
  name: "Jackson Lam",
  title: "Founder & CEO",
  bio: "Built Xcrow from a simple question: why are we training students for jobs AI is already transforming? Combined deep product instinct with AI-native architecture to create the skill infrastructure the market is desperately missing.",
  location: "Los Angeles, CA",
  linkedin: "https://www.linkedin.com/in/jacksonlam/",
};

/* ── 10. The Ask ── */
const BUCKETS = [
  { label: "Engineering", pct: 35, amount: "$350K", icon: Cpu, color: "var(--territory-technical)", bullets: ["AI simulation engine", "Skill graph infrastructure", "Platform scalability"] },
  { label: "B2C Growth", pct: 20, amount: "$200K", icon: Megaphone, color: "var(--territory-creative)", bullets: ["Paid acquisition", "Content & community", "Referral optimization"] },
  { label: "B2B School GTM", pct: 20, amount: "$200K", icon: GraduationCap, color: "var(--territory-strategic)", bullets: ["University pilots", "Institutional partnerships", "Curriculum integration"] },
  { label: "Enterprise GTM", pct: 15, amount: "$150K", icon: Building2, color: "var(--territory-analytical)", bullets: ["Employer partnerships", "ATS integrations", "Sales motion"] },
  { label: "Team", pct: 10, amount: "$100K", icon: Users, color: "var(--territory-leadership)", bullets: ["Engineering hires", "Growth lead", "Partnership lead"] },
];

const MILESTONES = [
  { quarter: "Q2 2026", items: ["Launch Champion Pass", "10 school pilots signed", "500 active users"] },
  { quarter: "Q3 2026", items: ["Enterprise recruiting beta", "50 schools onboarded", "5,000 active users"] },
  { quarter: "Q4 2026", items: ["ATS integrations live", "First enterprise contracts", "15,000 active users"] },
  { quarter: "Q1 2027", items: ["Series A readiness", "$500K ARR target", "100+ institutional partners"] },
];

/* ── Reusable ── */
const Section = ({ children, className = "", glow }: { children: React.ReactNode; className?: string; glow?: string }) => (
  <motion.section
    className={`relative max-w-5xl mx-auto px-6 py-20 w-full ${className}`}
    initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade}
  >
    {glow && <div className="absolute inset-0 pointer-events-none" style={{ background: glow }} />}
    <div className="relative">{children}</div>
  </motion.section>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs uppercase tracking-[0.2em] mb-3" style={{ color: "hsl(var(--filigree))", ...cinzel }}>{children}</p>
);

const SectionTitle = ({ children, sub }: { children: React.ReactNode; sub?: string }) => (
  <div className="mb-12">
    <h2 className="text-2xl md:text-3xl font-bold" style={cinzel}>{children}</h2>
    {sub && <p className="text-muted-foreground mt-3 max-w-2xl">{sub}</p>}
  </div>
);

const Divider = () => (
  <div className="max-w-5xl mx-auto px-6">
    <div className="h-px w-full" style={{ background: "hsl(var(--filigree) / 0.12)" }} />
  </div>
);

const StatCard = ({ value, label, sub }: { value: string; label: string; sub?: string }) => (
  <motion.div variants={fade} className="rounded-lg p-5 text-center" style={stoneCard}>
    <p className="text-2xl md:text-3xl font-bold" style={{ ...cinzel, color: "hsl(var(--filigree))" }}>{value}</p>
    <p className="text-xs text-muted-foreground mt-1">{label}</p>
    {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
  </motion.div>
);

/* ── Page ── */
const Investors = () => (
  <div className="min-h-screen flex flex-col bg-background text-foreground">
    <SEOHead
      title="Xcrow.ai — Investor Deck | $1M Seed Round"
      description="Xcrow is building the skill infrastructure for the AI economy. 183 skills, 100K+ roles analyzed, gamified simulations. Raising $1M seed."
    />
    <Navbar />

    {/* ═══ 1. COVER ═══ */}
    <motion.section className="relative py-28 md:py-36 px-6 text-center overflow-hidden" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade}>
      {/* Hero background image */}
      <div className="absolute inset-0 z-0">
        <img src={investorHero} alt="" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, hsl(var(--background) / 0.55) 0%, hsl(var(--background) / 0.85) 60%, hsl(var(--background)) 100%)" }} />
      </div>
      <div className="relative max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.25em] mb-6 inline-block px-4 py-1.5 rounded-full" style={{ color: "hsl(var(--filigree))", background: "hsl(var(--filigree) / 0.08)", border: "1px solid hsl(var(--filigree) / 0.2)", ...cinzel }}>{HERO.badge}</p>
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 whitespace-pre-line leading-tight" style={cinzel}>{HERO.headline}</h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8">{HERO.sub}</p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/contact">
            <Button size="lg" className="gap-2" style={cinzel}>
              Schedule a Meeting <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.section>

    <Divider />

    {/* ═══ 2. THE CRISIS ═══ */}
    <Section>
      <SectionLabel>The Problem</SectionLabel>
      <SectionTitle sub="AI is eliminating entry-level tasks faster than institutions can adapt. The gap between education and employment has never been wider — and it's accelerating.">
        The Employability Crisis Is Here
      </SectionTitle>

      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10" variants={stagger}>
        {CRISIS_STATS.map((s) => (
          <StatCard key={s.label} value={s.value} label={s.label} sub={s.source} />
        ))}
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {CRISIS_POINTS.map((p) => {
          const Icon = p.icon;
          return (
            <motion.div key={p.title} variants={fade} className="rounded-lg p-6" style={stoneCard}>
              <div className="w-10 h-10 rounded-md flex items-center justify-center mb-4" style={{ background: "hsl(var(--destructive) / 0.1)" }}>
                <Icon className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="font-bold mb-2" style={cinzel}>{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </Section>

    <Divider />

    {/* ═══ 3. WHY NOW ═══ */}
    <Section glow="radial-gradient(ellipse at 50% 50%, hsl(var(--destructive) / 0.04) 0%, transparent 60%)">
      <SectionLabel>Why Now</SectionLabel>
      <SectionTitle sub="Three forces are converging to create a once-in-a-generation market opportunity.">
        The Window Is Open — And Closing Fast
      </SectionTitle>

      <div className="grid md:grid-cols-3 gap-6">
        {WHY_NOW.map((w) => {
          const Icon = w.icon;
          return (
            <motion.div key={w.title} variants={fade} className="rounded-lg p-6" style={stoneCard}>
              <div className="w-10 h-10 rounded-md flex items-center justify-center mb-4" style={{ background: "hsl(var(--primary) / 0.1)" }}>
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold mb-2" style={cinzel}>{w.title}</h3>
              <p className="text-sm text-muted-foreground">{w.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </Section>

    <Divider />

    {/* ═══ 4. SOLUTION — 4-Phase Mission ═══ */}
    <Section glow="radial-gradient(ellipse at 50% 50%, hsl(var(--territory-creative) / 0.05) 0%, transparent 60%)">
      <HeaderVibeImages seed={99} count={5} />
      <SectionLabel>The Solution</SectionLabel>
      <SectionTitle sub="Xcrow is a gamified career intelligence platform built on a proprietary taxonomy of 183 AI-era skills. Students progress through four phases to build verified, portable competencies.">
        The AI Scouting Mission
      </SectionTitle>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {FOUR_PHASES.map((p, i) => {
          const Icon = p.icon;
          return (
            <motion.div key={p.phase} variants={fade} className="rounded-lg p-6 relative overflow-hidden" style={stoneCard}>
              <div className="absolute top-0 left-0 w-full h-1" style={{ background: `hsl(${p.color})` }} />
              <div className="flex items-center gap-2 mb-3 mt-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `hsl(${p.color} / 0.15)`, color: `hsl(${p.color})`, ...cinzel }}>{i + 1}</div>
                <h3 className="font-bold" style={cinzel}>{p.phase}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </Section>

    <Divider />

    {/* ═══ 5. PRODUCT ═══ */}
    <Section>
      <SectionLabel>The Product</SectionLabel>
      <SectionTitle sub="Built on real labor market data — not synthetic scenarios. Every feature connects to the mission of making AI-readiness measurable and portable.">
        What We've Built
      </SectionTitle>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCT_FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <motion.div key={f.title} variants={fade} className="rounded-lg p-6" style={stoneCard}>
              <div className="w-10 h-10 rounded-md flex items-center justify-center mb-3" style={{ background: "hsl(var(--primary) / 0.1)" }}>
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold mb-1.5" style={cinzel}>{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </Section>

    <Divider />

    {/* ═══ 6. BUSINESS MODEL ═══ */}
    <Section>
      <SectionLabel>Business Model</SectionLabel>
      <SectionTitle sub="B2C virality feeds B2B institutional sales. Students play free, schools pay for the intelligence layer.">
        The Flywheel
      </SectionTitle>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {BIZ_MODEL.map((b) => (
          <motion.div key={b.channel} variants={fade} className="rounded-lg p-6 relative overflow-hidden" style={stoneCard}>
            <div className="absolute top-0 left-0 w-full h-1" style={{ background: `hsl(${b.color})` }} />
            <p className="text-xs uppercase tracking-[0.15em] mb-1 mt-1" style={{ color: "hsl(var(--filigree))", ...cinzel }}>{b.channel}</p>
            <h3 className="font-bold text-lg mb-1" style={cinzel}>{b.model}</h3>
            <p className="text-sm font-semibold text-primary mb-3">{b.price}</p>
            <p className="text-sm text-muted-foreground">{b.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Flywheel visual */}
      <div className="rounded-lg p-6" style={stoneCard}>
        <h4 className="font-bold text-sm mb-4" style={cinzel}>Growth Flywheel</h4>
        <div className="flex flex-wrap gap-3">
          {FLYWHEEL.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))", ...cinzel }}>{i + 1}</span>
              <span className="text-sm text-muted-foreground">{step}</span>
              {i < FLYWHEEL.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    </Section>

    <Divider />

    {/* ═══ 7. MARKET ═══ */}
    <Section glow="radial-gradient(ellipse at 50% 50%, hsl(var(--territory-analytical) / 0.06) 0%, transparent 60%)">
      <SectionLabel>Market Opportunity</SectionLabel>
      <SectionTitle sub="The convergence of AI workforce disruption and outdated education infrastructure creates a massive, urgent market.">
        $300B+ Market, Zero Infrastructure
      </SectionTitle>

      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" variants={stagger}>
        {MARKET_STATS.map((m) => (
          <StatCard key={m.label} value={m.value} label={m.label} />
        ))}
      </motion.div>
    </Section>

    <Divider />

    {/* ═══ 8. TRACTION & DATA MOAT ═══ */}
    <Section>
      <SectionLabel>Traction & Data Moat</SectionLabel>
      <SectionTitle sub="Early signals of product-market fit backed by a proprietary data advantage that deepens with every user.">
        Built on Real Data, Not Hype
      </SectionTitle>

      <motion.div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10" variants={stagger}>
        {TRACTION.map((m) => (
          <StatCard key={m.label} value={m.value} label={m.label} />
        ))}
      </motion.div>

      <div className="rounded-lg p-6" style={stoneCard}>
        <h4 className="font-bold text-sm mb-4" style={cinzel}>Why This Moat Matters</h4>
        <ul className="space-y-3">
          {DATA_MOAT.map((point) => (
            <li key={point} className="flex items-start gap-3 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </Section>

    <Divider />

    {/* ═══ 9. TEAM ═══ */}
    <Section>
      <SectionLabel>Team</SectionLabel>
      <SectionTitle>Founder-Market Fit</SectionTitle>

      <div className="rounded-lg p-8 max-w-2xl flex gap-6 items-start" style={stoneCard}>
        <img
          src={founderImg}
          alt="Jackson Lam — Founder & CEO"
          className="w-24 h-24 md:w-28 md:h-28 rounded-lg object-cover shrink-0"
          style={{ border: "2px solid hsl(var(--filigree) / 0.3)" }}
        />
        <div>
          <h3 className="text-xl font-bold mb-1" style={cinzel}>{TEAM.name}</h3>
          <p className="text-sm text-primary mb-3">{TEAM.title}</p>
          <p className="text-sm text-muted-foreground mb-4">{TEAM.bio}</p>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground/60">{TEAM.location}</p>
            <a href={TEAM.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Linkedin className="w-3.5 h-3.5" /> LinkedIn
            </a>
          </div>
        </div>
      </div>
    </Section>

    <Divider />

    {/* ═══ 10. THE ASK ═══ */}
    <Section>
      <SectionLabel>The Ask</SectionLabel>
      <SectionTitle sub="How we'll deploy $1M to reach Series A readiness in 12 months.">
        $1M Seed Round
      </SectionTitle>

      {/* Stacked bar */}
      <div className="flex h-5 rounded-full overflow-hidden mb-10 border" style={{ borderColor: "hsl(var(--filigree) / 0.3)" }}>
        {BUCKETS.map((b) => (
          <div key={b.label} style={{ width: `${b.pct}%`, background: `hsl(${b.color})` }} title={`${b.label} — ${b.pct}%`} />
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {BUCKETS.map((b) => {
          const Icon = b.icon;
          return (
            <motion.div key={b.label} variants={fade} className="rounded-lg p-6 flex flex-col" style={stoneCard}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: `hsl(${b.color} / 0.15)` }}>
                  <Icon className="w-5 h-5" style={{ color: `hsl(${b.color})` }} />
                </div>
                <div>
                  <p className="font-bold text-sm" style={cinzel}>{b.label}</p>
                  <p className="text-xs text-muted-foreground">{b.pct}% · {b.amount}</p>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 mt-auto">
                {b.bullets.map((t) => <li key={t} className="flex items-start gap-2"><span style={{ color: `hsl(${b.color})` }}>›</span>{t}</li>)}
              </ul>
            </motion.div>
          );
        })}
      </div>

      {/* Milestones */}
      <h3 className="font-bold text-lg mb-6" style={cinzel}>12-Month Roadmap</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MILESTONES.map((m) => (
          <motion.div key={m.quarter} variants={fade} className="rounded-lg p-6" style={stoneCard}>
            <p className="text-xs uppercase tracking-[0.15em] mb-3" style={{ color: "hsl(var(--filigree))", ...cinzel }}>{m.quarter}</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              {m.items.map((item) => <li key={item} className="flex items-start gap-2"><span className="text-primary">→</span>{item}</li>)}
            </ul>
          </motion.div>
        ))}
      </div>
    </Section>

    <Divider />

    {/* ═══ CTA ═══ */}
    <motion.section className="py-24 px-6 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade}>
      <h2 className="text-2xl md:text-3xl font-bold mb-4" style={cinzel}>Let's Build the Skill Bridge Together</h2>
      <p className="text-muted-foreground mb-8 max-w-lg mx-auto">We're raising $1M to make every graduate AI-ready. If you believe the employability gap is the defining challenge of this decade — let's talk.</p>
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <Link to="/contact">
          <Button size="lg" className="gap-2" style={cinzel}>
            Schedule a Meeting <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </motion.section>

    <Footer />
  </div>
);

export default Investors;
