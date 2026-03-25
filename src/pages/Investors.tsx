import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Cpu, Megaphone, GraduationCap, Building2, Users } from "lucide-react";

const fade = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const BUCKETS = [
  { label: "Engineering", pct: 35, amount: "$350K", icon: Cpu, color: "var(--territory-technical)", bullets: ["AI simulation engine", "Skill graph infrastructure", "Platform scalability"] },
  { label: "B2C Growth / Ads", pct: 20, amount: "$200K", icon: Megaphone, color: "var(--territory-creative)", bullets: ["Paid acquisition channels", "Content & community", "Conversion optimization"] },
  { label: "B2B School GTM", pct: 20, amount: "$200K", icon: GraduationCap, color: "var(--territory-strategic)", bullets: ["University pilot programs", "Institutional partnerships", "Curriculum integration"] },
  { label: "B2B Enterprise Recruiting", pct: 15, amount: "$150K", icon: Building2, color: "var(--territory-analytical)", bullets: ["Employer partnerships", "ATS integrations", "Enterprise sales motion"] },
  { label: "Team", pct: 10, amount: "$100K", icon: Users, color: "var(--territory-leadership)", bullets: ["Engineering hires", "Growth lead", "Partnership lead"] },
];

const METRICS = [
  { value: "183", label: "Future Skills Mapped" },
  { value: "8", label: "Skill Territories" },
  { value: "50+", label: "Roles Analyzed" },
  { value: "3", label: "School Pilots" },
];

const Investors = () => (
  <div className="min-h-screen flex flex-col bg-background text-foreground">
    <Navbar />

    {/* Hero */}
    <motion.section className="relative py-24 px-6 text-center overflow-hidden" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, hsl(var(--territory-strategic) / 0.12) 0%, transparent 60%)" }} />
      <div className="relative max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] mb-4" style={{ color: "hsl(var(--filigree))", fontFamily: "'Cinzel', serif" }}>Investor Brief</p>
        <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{ fontFamily: "'Cinzel', serif" }}>Seed Round: $1M</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">Closing the employability gap with AI-native skill infrastructure — preparing the next generation for the agent economy.</p>
      </div>
    </motion.section>

    {/* The Opportunity */}
    <motion.section className="max-w-4xl mx-auto px-6 py-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade}>
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center" style={{ fontFamily: "'Cinzel', serif" }}>The Opportunity</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {[
          { title: "$300B+ EdTech Market", desc: "Massive TAM with outdated skill-mapping infrastructure ripe for disruption by AI-native platforms." },
          { title: "AI Economy Gap", desc: "87% of graduates lack skills for AI-augmented roles. Universities need infrastructure, not just another elective." },
        ].map((item) => (
          <div key={item.title} className="rounded-lg p-6" style={{ background: "hsl(var(--surface-stone))", border: "1px solid hsl(var(--filigree) / 0.2)", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))" }}>
            <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "'Cinzel', serif" }}>{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </motion.section>

    {/* Fund Allocation */}
    <motion.section className="max-w-5xl mx-auto px-6 py-16 w-full" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade}>
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center" style={{ fontFamily: "'Cinzel', serif" }}>Fund Allocation</h2>

      {/* Stacked bar */}
      <div className="flex h-5 rounded-full overflow-hidden mb-10 border" style={{ borderColor: "hsl(var(--filigree) / 0.3)" }}>
        {BUCKETS.map((b) => (
          <div key={b.label} style={{ width: `${b.pct}%`, background: `hsl(${b.color})` }} title={`${b.label} — ${b.pct}%`} />
        ))}
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {BUCKETS.map((b) => {
          const Icon = b.icon;
          return (
            <div key={b.label} className="rounded-lg p-6 flex flex-col" style={{ background: "hsl(var(--surface-stone))", border: "1px solid hsl(var(--filigree) / 0.2)", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: `hsl(${b.color} / 0.15)` }}>
                  <Icon className="w-5 h-5" style={{ color: `hsl(${b.color})` }} />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ fontFamily: "'Cinzel', serif" }}>{b.label}</p>
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
    </motion.section>

    {/* Traction */}
    <motion.section className="max-w-4xl mx-auto px-6 py-16 w-full" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade}>
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center" style={{ fontFamily: "'Cinzel', serif" }}>Traction</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {METRICS.map((m) => (
          <div key={m.label} className="rounded-lg p-5 text-center" style={{ background: "hsl(var(--surface-stone))", border: "1px solid hsl(var(--filigree) / 0.15)" }}>
            <p className="text-3xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--filigree))" }}>{m.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
          </div>
        ))}
      </div>
    </motion.section>

    {/* CTA */}
    <motion.section className="py-20 px-6 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade}>
      <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ fontFamily: "'Cinzel', serif" }}>Interested?</h2>
      <p className="text-muted-foreground mb-6">Let's discuss how Xcrow is building the skill infrastructure for the AI economy.</p>
      <Link to="/contact" className="inline-flex items-center justify-center h-11 px-8 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
        Schedule a Meeting
      </Link>
    </motion.section>

    <Footer />
  </div>
);

export default Investors;
