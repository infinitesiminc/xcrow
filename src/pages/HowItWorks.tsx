/**
 * How It Works — The 183 Skills Story.
 * Narrative: What are they, why they matter, how the engine helps you acquire them.
 */
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Play, Sparkles, Search, Zap, BookOpen,
  Target, TrendingUp, BarChart3, Brain, Cpu, GraduationCap,
  RefreshCw, Sword, Eye, Map, Crown, Shield, Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TerritoryEmblem from "@/components/TerritoryEmblem";
import SimChatPreview from "@/components/SimChatPreview";
import { TERRITORIES as TERRITORY_COLORS } from "@/lib/territory-colors";

import xcrowLogo from "@/assets/xcrow-logo.webp";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const heroUrl = (id: string) => `${SUPABASE_URL}/storage/v1/object/public/sim-images/skill-hero-${id}.png`;

/* Curated skill hero images for section backdrops */
const HERO_IMAGES = {
  hero: heroUrl("strategic-ai-orchestration"),
  territories: heroUrl("crossfunctional-aidriven-collaboration"),
  engine: heroUrl("strategic-problem-solving"),
  cta: heroUrl("complex-problem-solving-humanai-teams"),
};

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

const TERRITORIES = [
  { category: "Technical" as const, name: "Technical", count: "Skills #1–#28", examples: ["Prompt Engineering", "AI Tool Selection", "Data Pipeline Design"] },
  { category: "Analytical" as const, name: "Analytical", count: "Skills #29–#52", examples: ["AI Output Validation", "Predictive Modeling", "Risk Assessment"] },
  { category: "Strategic" as const, name: "Strategic", count: "Skills #53–#76", examples: ["AI Integration Strategy", "Change Management", "Scenario Planning"] },
  { category: "Creative" as const, name: "Creative", count: "Skills #77–#100", examples: ["AI-Augmented Design", "Content Strategy", "Creative Direction"] },
  { category: "Communication" as const, name: "Communication", count: "Skills #101–#124", examples: ["AI-Assisted Writing", "Stakeholder Translation", "Data Storytelling"] },
  { category: "Leadership" as const, name: "Leadership", count: "Skills #125–#148", examples: ["Human-AI Team Management", "Ethical AI Governance", "Digital Transformation"] },
  { category: "Human Edge" as const, name: "Human Edge", count: "Skills #149–#166", examples: ["Judgment Under Ambiguity", "Empathy at Scale", "Cultural Intelligence"] },
  { category: "Ethics & Compliance" as const, name: "Ethics & Compliance", count: "Skills #167–#183", examples: ["AI Governance", "Regulatory Compliance", "Responsible AI Deployment"] },
];

const PROBLEM_CARDS = [
  {
    icon: Cpu,
    stat: "47%",
    title: "AI is rewriting job descriptions",
    desc: "Nearly half of workplace tasks are now AI-exposed. Roles that existed 2 years ago are unrecognizable.",
  },
  {
    icon: GraduationCap,
    stat: "18 mo",
    title: "Courses can't keep up",
    desc: "Average curriculum update cycle is 18 months. By the time it ships, the market has already moved.",
  },
  {
    icon: Target,
    stat: "3×",
    title: "Employers test differently",
    desc: "Hiring managers are 3× more likely to assess AI-readiness than traditional knowledge recall.",
  },
];

const ENGINE_STEPS = [
  {
    num: "01",
    icon: RefreshCw,
    title: "Ingest",
    desc: "We scan 3,600+ company job feeds daily, extracting tasks, skills, and AI-exposure signals from real postings.",
    color: "var(--territory-analytical)",
  },
  {
    num: "02",
    icon: Zap,
    title: "Generate",
    desc: "AI builds practice simulations from those real job tasks — not generic exercises or textbook quizzes.",
    color: "var(--territory-creative)",
  },
  {
    num: "03",
    icon: TrendingUp,
    title: "Adapt",
    desc: "Difficulty scales to your level. The skill catalogue evolves as the market shifts — your training never goes stale.",
    color: "var(--territory-strategic)",
  },
];

const LOOP_STEPS = [
  { icon: Search, verb: "Scout", desc: "Search any role — see which of the 183 skills it demands and where AI threatens it." },
  { icon: Sword, verb: "Battle", desc: "Enter simulations built from real job tasks. Compare AI tools. Make strategic calls." },
  { icon: Map, verb: "Grow", desc: "Earn XP, evolve skill castles, fill your territory map. Watch mastery compound." },
  { icon: Crown, verb: "Prove", desc: "Shareable profile showing skills you've practiced — not just studied. Proof employers trust." },
];

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* ═══ 1. HERO ═══ */}
        <section className="relative min-h-[70vh] flex items-center justify-center px-4 overflow-hidden">
          {/* Skill hero backdrop */}
          <div className="absolute inset-0 pointer-events-none">
            <img src={HERO_IMAGES.hero} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.12]" loading="eager" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, hsl(var(--background)), hsl(var(--background) / 0.6), hsl(var(--background)))" }} />
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[180px] opacity-15"
              style={{ background: "hsl(var(--territory-technical))" }} />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[160px] opacity-10"
              style={{ background: "hsl(var(--territory-creative))" }} />
          </div>

          <motion.div {...fade()} className="text-center max-w-3xl relative z-10">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary font-fantasy text-xs tracking-wider">
              183 Skills · 8 Territories · 1 Game Engine
            </Badge>
            <h1 className="font-fantasy text-4xl md:text-6xl font-bold mb-4 leading-tight">
              The job market runs on <span style={{ color: "hsl(var(--filigree-glow))" }}>183 skills</span>.<br />
              Most people can't name 10.
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-8">
              We reverse-engineered 3,600+ employer job feeds to identify the exact skills the AI economy rewards.
              Then we built a game engine to help you master them.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate("/skills")} className="text-base px-8 gap-2">
                <BookOpen className="h-5 w-5" /> Explore the 183 Skills
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/")} className="text-base px-8 gap-2"
                style={{ boxShadow: "0 0 20px hsl(var(--filigree-glow) / 0.25)" }}>
                <Play className="h-5 w-5" /> Start Playing <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </section>

        {/* ═══ 2. THE PROBLEM ═══ */}
        <section className="py-20 px-4" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">The Problem</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">Why 183?</h2>
            </motion.div>

            <div className="grid sm:grid-cols-3 gap-5 mb-10">
              {PROBLEM_CARDS.map((card, i) => (
                <motion.div key={card.title} {...fade(i * 0.1)}
                  className="rounded-xl border border-border/50 p-6 text-center"
                  style={{ background: "hsl(var(--card))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
                  <card.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <span className="block font-fantasy text-3xl font-bold text-primary mb-1">{card.stat}</span>
                  <h3 className="font-fantasy font-semibold text-[15px] mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.p {...fade(0.3)} className="text-center text-muted-foreground max-w-2xl mx-auto text-sm leading-relaxed">
              We mapped every skill employers actually hire for — across every department, seniority level, and industry —
              and distilled them to <span className="text-foreground font-semibold">183 battle-tested competencies</span>.
            </motion.p>
          </div>
        </section>

        {/* ═══ 3. THE 183 SKILLS — 8 TERRITORIES ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">The Skill Map</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">8 Territories. One Map.</h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                Skills are numbered #1–#183, ranked by market demand, and grouped into 8 territories.
                Each territory represents a domain of AI-era mastery.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {TERRITORIES.map((t, i) => (
                <motion.div key={t.category} {...fade(i * 0.06)}
                  className="rounded-xl border border-border/50 p-4 flex flex-col items-center text-center"
                  style={{ background: "hsl(var(--card))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
                  <div className="mb-3 animate-territory-float" style={{ animationDelay: `${i * 0.3}s` }}>
                    <TerritoryEmblem category={t.category} size={52} />
                  </div>
                  <h4 className="font-fantasy font-bold text-sm">{t.name}</h4>
                  <span className="text-[10px] text-muted-foreground font-mono mb-2">{t.count}</span>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {t.examples.map(e => (
                      <span key={e} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{e}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 4. THE ENGINE ═══ */}
        <section className="py-20 px-4" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
          <div className="max-w-4xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary font-fantasy text-xs tracking-wider">
                The Game Engine
              </Badge>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">Real Jobs In. Practice Out.</h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                Every simulation you play was born from a real job posting — not a textbook.
              </p>
            </motion.div>

            <div className="space-y-4">
              {ENGINE_STEPS.map((step, i) => (
                <motion.div key={step.num} {...fade(i * 0.1)}
                  className="flex items-start gap-5 rounded-xl border border-border/50 p-6"
                  style={{ background: "hsl(var(--card))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `hsl(${step.color} / 0.15)`, border: `1px solid hsl(${step.color} / 0.25)` }}>
                    <step.icon className="h-6 w-6" style={{ color: `hsl(${step.color})` }} />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-muted-foreground/50">{step.num}</span>
                    <h3 className="font-fantasy text-xl font-bold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 4b. SEE IT IN ACTION ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-12">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary font-fantasy text-xs tracking-wider">
                See It In Action
              </Badge>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">This Is What a Simulation Feels Like</h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                Real scenario. Real decisions. Real-time scoring. Watch a simulation unfold — this is how you build AI-era skills.
              </p>
            </motion.div>
            <motion.div {...fade(0.15)}>
              <SimChatPreview />
            </motion.div>
          </div>
        </section>

        {/* ═══ 5. THE PROGRESSION LOOP ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">The Loop</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">How You Level Up</h2>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {LOOP_STEPS.map((step, i) => (
                <motion.div key={step.verb} {...fade(i * 0.08)}
                  className="rounded-xl border border-border/50 p-5 text-center"
                  style={{ background: "hsl(var(--card))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
                  <step.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h4 className="font-fantasy font-bold text-lg mb-1">{step.verb}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 6. WHAT YOU WALK AWAY WITH ═══ */}
        <section className="py-20 px-4" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
          <div className="max-w-4xl mx-auto">
            <motion.div {...fade()} className="text-center mb-12">
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">What You Walk Away With</h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                Every session builds something real. Not certificates — proof.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { emoji: "🗺️", title: "Your Skill Map", desc: "A living visual of every skill you've practiced, with growth rings showing depth of mastery across all 8 territories." },
                { emoji: "🏰", title: "Evolved Castles", desc: "Each skill is a castle that levels up as you practice — from Ruins to Citadel. 183 castles to conquer." },
                { emoji: "📊", title: "Shareable Profile", desc: "Show employers exactly which AI skills you've practiced in real scenarios, not just studied in a course." },
              ].map((item, i) => (
                <motion.div key={item.title} {...fade(i * 0.1)}
                  className="rounded-xl border border-border/50 p-6 text-center"
                  style={{ background: "hsl(var(--card))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
                  <span className="text-4xl mb-4 block">{item.emoji}</span>
                  <h4 className="font-fantasy font-semibold text-lg mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 7. FINAL CTA ═══ */}
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[200px] opacity-10"
              style={{ background: "hsl(var(--primary))" }} />
          </div>
          <motion.div {...fade()} className="text-center max-w-lg mx-auto relative z-10">
            <motion.img src={xcrowLogo} alt="Xcrow" className="h-16 w-16 mx-auto mb-6 crow-glow"
              animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
            <h2 className="font-fantasy text-3xl md:text-4xl font-bold mb-4">
              Your future runs on 183 skills.<br />Start mastering them.
            </h2>
            <p className="text-muted-foreground mb-8">Search any role, run your first simulation, and see exactly how AI is changing your career.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate("/")} className="text-base px-10"
                style={{ boxShadow: "0 0 24px hsl(var(--filigree-glow) / 0.3)" }}>
                <Play className="h-5 w-5 mr-2" /> Start Playing
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/skills")} className="text-base px-8 gap-2">
                <BookOpen className="h-5 w-5" /> Browse 183 Skills
              </Button>
            </div>
          </motion.div>
        </section>
      </div>
      <Footer />
    </>
  );
}
