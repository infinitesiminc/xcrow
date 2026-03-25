import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Cpu, Megaphone, GraduationCap, Building2, Users, AlertTriangle, Zap, Target, TrendingUp, DollarSign, Swords, Shield, Globe } from "lucide-react";

const fade = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const stoneCard = {
  background: "hsl(var(--surface-stone))",
  border: "1px solid hsl(var(--filigree) / 0.2)",
  boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))",
};

const cinzel = { fontFamily: "'Cinzel', serif" };

/* ── Data ── */
const PROBLEM_POINTS = [
  { icon: AlertTriangle, title: "87% of graduates lack AI-era skills", desc: "Universities teach for yesterday's economy. Curricula update every 5–7 years; AI rewrites job requirements every 6 months." },
  { icon: Swords, title: "Employers can't verify readiness", desc: "Resumes and GPAs don't show whether a candidate can work alongside AI agents, delegate tasks, or exercise judgment under automation." },
  { icon: Shield, title: "No infrastructure for the skill shift", desc: "There's no shared language between what schools teach, what employers need, and what students can actually do with AI." },
];

const SOLUTION_POINTS = [
  { title: "183 Future Skills", desc: "A living taxonomy of AI-era competencies across 8 territories — from Prompt Architecture to Ethical Override — mapped to real job requirements." },
  { title: "AI-Native Simulations", desc: "Students prove skills in realistic workplace scenarios: negotiating with AI agents, triaging automated outputs, exercising human judgment." },
  { title: "Skill Passports", desc: "Verified, portable credentials that employers trust — replacing self-reported skills with simulation-backed proof." },
];

const MARKET_STATS = [
  { value: "$300B+", label: "Global EdTech Market" },
  { value: "$8.5B", label: "Skills Assessment TAM" },
  { value: "100M+", label: "University students globally" },
  { value: "73%", label: "Employers struggling to hire AI-ready talent" },
];

const PRODUCT_FEATURES = [
  { icon: Target, title: "Territory Map", desc: "Interactive skill landscape where students explore, practice, and conquer 8 domains of future-ready competencies." },
  { icon: Swords, title: "Boss Battles", desc: "Multi-round AI simulations that test real judgment — not memorization. Adaptive difficulty, narrative stakes, skill-specific scoring." },
  { icon: TrendingUp, title: "Role Intelligence", desc: "Every job analyzed for AI exposure, task automation risk, and required future skills — powered by live labor market data." },
  { icon: Globe, title: "School Platform", desc: "Institutional dashboard with curriculum gap analysis, student progress tracking, and employability benchmarking." },
];

const TRACTION = [
  { value: "183", label: "Future Skills Mapped" },
  { value: "100,000+", label: "Roles Analyzed" },
  { value: "8", label: "Skill Territories" },
  { value: "3", label: "School Pilots" },
  { value: "1,200+", label: "Tasks Catalogued" },
  { value: "2", label: "Revenue Streams Live" },
];

const BIZ_MODEL = [
  { channel: "B2C", model: "Freemium → Pro", price: "$12/mo", desc: "Students and professionals upgrade for unlimited simulations, skill passports, and leaderboard access." },
  { channel: "B2B Schools", model: "Per-seat SaaS", price: "$8–15/seat/mo", desc: "Universities license the platform for curriculum integration, student tracking, and employability reporting." },
  { channel: "B2B Enterprise", model: "Recruiting SaaS", price: "Custom", desc: "Employers access verified skill data, ATS integrations, and talent pipeline from simulation-proven candidates." },
];

const BUCKETS = [
  { label: "Engineering", pct: 35, amount: "$350K", icon: Cpu, color: "var(--territory-technical)", bullets: ["AI simulation engine", "Skill graph infrastructure", "Platform scalability"] },
  { label: "B2C Growth / Ads", pct: 20, amount: "$200K", icon: Megaphone, color: "var(--territory-creative)", bullets: ["Paid acquisition channels", "Content & community", "Conversion optimization"] },
  { label: "B2B School GTM", pct: 20, amount: "$200K", icon: GraduationCap, color: "var(--territory-strategic)", bullets: ["University pilot programs", "Institutional partnerships", "Curriculum integration"] },
  { label: "B2B Enterprise Recruiting", pct: 15, amount: "$150K", icon: Building2, color: "var(--territory-analytical)", bullets: ["Employer partnerships", "ATS integrations", "Enterprise sales motion"] },
  { label: "Team", pct: 10, amount: "$100K", icon: Users, color: "var(--territory-leadership)", bullets: ["Engineering hires", "Growth lead", "Partnership lead"] },
];

const MILESTONES = [
  { quarter: "Q2 2026", items: ["Launch B2C Pro tier", "10 school pilots signed", "500 active users"] },
  { quarter: "Q3 2026", items: ["Enterprise recruiting beta", "50 schools onboarded", "5,000 active users"] },
  { quarter: "Q4 2026", items: ["ATS integrations live", "First enterprise contracts", "15,000 active users"] },
  { quarter: "Q1 2027", items: ["Series A readiness", "$500K ARR target", "100+ institutional partners"] },
];

/* ── Section wrapper ── */
const Section = ({ children, className = "", glow }: { children: React.ReactNode; className?: string; glow?: string }) => (
  <motion.section
    className={`relative max-w-5xl mx-auto px-6 py-20 w-full ${className}`}
    initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade}
  >
    {glow && <div className="absolute inset-0 pointer-events-none" style={{ background: glow }} />}
    <div className="relative">{children}</div>
  </motion.section>
);

const SectionTitle = ({ children, sub }: { children: React.ReactNode; sub?: string }) => (
  <div className="text-center mb-12">
    <h2 className="text-2xl md:text-3xl font-bold" style={cinzel}>{children}</h2>
    {sub && <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{sub}</p>}
  </div>
);

const Divider = () => (
  <div className="max-w-5xl mx-auto px-6">
    <div className="h-px w-full" style={{ background: "hsl(var(--filigree) / 0.12)" }} />
  </div>
);

/* ── Page ── */
const Investors = () => (
  <div className="min-h-screen flex flex-col bg-background text-foreground">
    <Navbar />

    {/* 1 — Hero */}
    <motion.section className="relative py-28 px-6 text-center overflow-hidden" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, hsl(var(--territory-strategic) / 0.12) 0%, transparent 60%)" }} />
      <div className="relative max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] mb-4" style={{ color: "hsl(var(--filigree))", ...cinzel }}>Seed Round · $1M</p>
        <h1 className="text-4xl md:text-6xl font-bold mb-5" style={cinzel}>Building the Skill Infrastructure for the AI Economy</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">Xcrow maps, simulates, and verifies the 183 skills that separate humans who use AI from humans replaced by it.</p>
      </div>
    </motion.section>

    <Divider />

    {/* 2 — Problem */}
    <Section>
      <SectionTitle sub="The world is training students for jobs that AI is already transforming. The gap between education and employment has never been wider.">The Problem</SectionTitle>
      <div className="grid md:grid-cols-3 gap-6">
        {PROBLEM_POINTS.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.title} className="rounded-lg p-6" style={stoneCard}>
              <div className="w-10 h-10 rounded-md flex items-center justify-center mb-4" style={{ background: "hsl(var(--destructive) / 0.1)" }}>
                <Icon className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="font-bold mb-2" style={cinzel}>{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </div>
          );
        })}
      </div>
    </Section>

    <Divider />

    {/* 3 — Solution */}
    <Section>
      <SectionTitle sub="Xcrow is the operating system for AI-era employability — connecting skills, simulations, and credentials into one infrastructure layer.">The Solution</SectionTitle>
      <div className="grid md:grid-cols-3 gap-6">
        {SOLUTION_POINTS.map((s, i) => (
          <div key={s.title} className="rounded-lg p-6" style={stoneCard}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center mb-4 text-sm font-bold" style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>
              {i + 1}
            </div>
            <h3 className="font-bold mb-2" style={cinzel}>{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </Section>

    <Divider />

    {/* 4 — Market */}
    <Section glow="radial-gradient(ellipse at 50% 50%, hsl(var(--territory-analytical) / 0.06) 0%, transparent 60%)">
      <SectionTitle sub="The convergence of AI workforce disruption and outdated education infrastructure creates a massive market opportunity.">Market Opportunity</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {MARKET_STATS.map((m) => (
          <div key={m.label} className="rounded-lg p-5 text-center" style={stoneCard}>
            <p className="text-2xl md:text-3xl font-bold" style={{ ...cinzel, color: "hsl(var(--filigree))" }}>{m.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
          </div>
        ))}
      </div>
    </Section>

    <Divider />

    {/* 5 — Product */}
    <Section>
      <SectionTitle sub="A gamified skill infrastructure that makes future-readiness measurable, portable, and fun.">The Product</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-6">
        {PRODUCT_FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="rounded-lg p-6 flex gap-4" style={stoneCard}>
              <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ background: "hsl(var(--primary) / 0.1)" }}>
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold mb-1" style={cinzel}>{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Section>

    <Divider />

    {/* 6 — Business Model */}
    <Section>
      <SectionTitle sub="Three revenue channels targeting students, universities, and employers — with natural expansion from B2C virality to institutional contracts.">Business Model</SectionTitle>
      <div className="grid md:grid-cols-3 gap-6">
        {BIZ_MODEL.map((b) => (
          <div key={b.channel} className="rounded-lg p-6" style={stoneCard}>
            <p className="text-xs uppercase tracking-[0.15em] mb-1" style={{ color: "hsl(var(--filigree))", ...cinzel }}>{b.channel}</p>
            <h3 className="font-bold text-lg mb-1" style={cinzel}>{b.model}</h3>
            <p className="text-sm font-semibold text-primary mb-3">{b.price}</p>
            <p className="text-sm text-muted-foreground">{b.desc}</p>
          </div>
        ))}
      </div>
    </Section>

    <Divider />

    {/* 7 — Traction */}
    <Section glow="radial-gradient(ellipse at 50% 50%, hsl(var(--territory-leadership) / 0.06) 0%, transparent 60%)">
      <SectionTitle sub="Early signals of product-market fit and institutional demand.">Traction</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {TRACTION.map((m) => (
          <div key={m.label} className="rounded-lg p-5 text-center" style={stoneCard}>
            <p className="text-2xl md:text-3xl font-bold" style={{ ...cinzel, color: "hsl(var(--filigree))" }}>{m.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
          </div>
        ))}
      </div>
    </Section>

    <Divider />

    {/* 8 — Fund Allocation */}
    <Section>
      <SectionTitle sub="How we'll deploy $1M to reach Series A readiness in 12 months.">Use of Funds</SectionTitle>

      {/* Stacked bar */}
      <div className="flex h-5 rounded-full overflow-hidden mb-10 border" style={{ borderColor: "hsl(var(--filigree) / 0.3)" }}>
        {BUCKETS.map((b) => (
          <div key={b.label} style={{ width: `${b.pct}%`, background: `hsl(${b.color})` }} title={`${b.label} — ${b.pct}%`} />
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {BUCKETS.map((b) => {
          const Icon = b.icon;
          return (
            <div key={b.label} className="rounded-lg p-6 flex flex-col" style={stoneCard}>
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
            </div>
          );
        })}
      </div>
    </Section>

    <Divider />

    {/* 9 — Milestones */}
    <Section>
      <SectionTitle sub="Key milestones on the path to Series A.">12-Month Roadmap</SectionTitle>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MILESTONES.map((m, i) => (
          <div key={m.quarter} className="rounded-lg p-6" style={stoneCard}>
            <p className="text-xs uppercase tracking-[0.15em] mb-3" style={{ color: "hsl(var(--filigree))", ...cinzel }}>{m.quarter}</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              {m.items.map((item) => <li key={item} className="flex items-start gap-2"><span className="text-primary">→</span>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </Section>

    <Divider />

    {/* 10 — CTA */}
    <motion.section className="py-24 px-6 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade}>
      <h2 className="text-2xl md:text-3xl font-bold mb-4" style={cinzel}>Let's Build the Future of Work Together</h2>
      <p className="text-muted-foreground mb-8 max-w-lg mx-auto">We're raising $1M to make every graduate AI-ready. If you believe the employability gap is the defining challenge of this decade — let's talk.</p>
      <Link to="/contact" className="inline-flex items-center justify-center h-12 px-10 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
        Schedule a Meeting
      </Link>
    </motion.section>

    <Footer />
  </div>
);

export default Investors;
