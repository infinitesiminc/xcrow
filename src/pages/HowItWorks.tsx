/**
 * How It Works — Immersive RPG-themed explainer page
 * Draws from /progression content with /play visual style
 */
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Sword, Map, Crown, ArrowRight, Sparkles, Target, Zap,
  Shield, BookOpen, Compass, Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TERRITORIES } from "@/lib/territory-colors";
import TerritoryEmblem from "@/components/TerritoryEmblem";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import xcrowLogo from "@/assets/xcrow-logo.png";
import castleRuins from "@/assets/castle-ruins.png";
import castleOutpost from "@/assets/castle-outpost.png";
import castleFortress from "@/assets/castle-fortress.png";
import castleCitadel from "@/assets/castle-citadel.png";
import simBriefing from "@/assets/sim-briefing.jpg";
import simVictory from "@/assets/sim-victory.jpg";
import heroConquer from "@/assets/hero-conquer.jpg";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

const QUEST_STEPS = [
  {
    step: "01", icon: Compass, title: "Scout a Kingdom",
    desc: "Pick any role from 21,000+ real jobs. The Mission Briefing reveals which skills it demands and how AI is reshaping it.",
    color: "var(--territory-analytical)", img: simBriefing,
  },
  {
    step: "02", icon: Sword, title: "Battle & Learn",
    desc: "Enter AI simulations built from real tasks. Face boss monsters that test your judgment, tool awareness, and human edge.",
    color: "var(--territory-creative)", img: simVictory,
  },
  {
    step: "03", icon: Crown, title: "Conquer & Rank Up",
    desc: "Earn XP, evolve skill castles, advance kingdoms, and climb the global rank ladder — proving you're future-ready.",
    color: "var(--territory-strategic)", img: heroConquer,
  },
];

const CASTLE_STAGES = [
  { img: castleRuins, label: "Ruins", desc: "Unexplored", ring: "0%" },
  { img: castleOutpost, label: "Outpost", desc: "Foundation built", ring: "25%" },
  { img: castleFortress, label: "Fortress", desc: "Battle-tested", ring: "65%" },
  { img: castleCitadel, label: "Citadel", desc: "Mastery proven", ring: "100%" },
];

const RINGS = [
  { emoji: "🎓", name: "Foundation", desc: "Core knowledge from curricula and coursework", source: "Passive" },
  { emoji: "⚡", name: "AI Mastery", desc: "How AI reshapes this skill — tools & workflows", source: "Level 1 Sims" },
  { emoji: "✦", name: "Human Edge", desc: "What AI can't replace — judgment, empathy, creativity", source: "Level 2 Sims" },
];

const KINGDOM_TIERS = [
  { emoji: "🔭", name: "Scouted", req: "View or bookmark a role" },
  { emoji: "⚔️", name: "Contested", req: "1+ linked skill at Outpost" },
  { emoji: "🏰", name: "Fortified", req: "3+ linked skills at Fortress" },
  { emoji: "👑", name: "Conquered", req: "All linked skills at Citadel" },
];

const RANK_LADDER = [
  { rank: "Recruit", emoji: "⚔️", color: "hsl(215, 20%, 55%)" },
  { rank: "Explorer", emoji: "🧭", color: "hsl(180, 45%, 50%)" },
  { rank: "Strategist", emoji: "⭐", color: "hsl(45, 70%, 55%)" },
  { rank: "Commander", emoji: "👑", color: "hsl(270, 50%, 60%)" },
  { rank: "Legend", emoji: "🏆", color: "hsl(340, 60%, 55%)" },
];

const RIPPLE_STEPS = [
  { step: "1", emoji: "⚔️", title: "Complete a Battle", desc: "Earn XP based on score & context variety" },
  { step: "2", emoji: "💍", title: "Skill Rings Fill", desc: "L1 → AI Mastery ⚡ · L2 → Human Edge ✦" },
  { step: "3", emoji: "🏰", title: "Castle Evolves", desc: "Rings fill → castle ascends tier" },
  { step: "4", emoji: "👑", title: "Kingdom Advances", desc: "Enough castles → kingdom tier climbs" },
  { step: "5", emoji: "✨", title: "Rank Rises", desc: "Breadth of mastery lifts your global rank" },
];

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* ═══ HERO ═══ */}
        <section className="relative min-h-[70vh] flex items-center justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[180px] opacity-15"
              style={{ background: "hsl(var(--territory-technical))" }} />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[160px] opacity-10"
              style={{ background: "hsl(var(--territory-creative))" }} />
          </div>

          <motion.div {...fade()} className="text-center max-w-3xl relative z-10">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">📜 The Quest Log</p>
            <h1 className="font-fantasy text-4xl md:text-6xl font-bold mb-4 leading-tight">
              How <span style={{ color: "hsl(var(--filigree-glow))" }}>Xcrow</span> Works
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-8">
              Three layers of progression. Every simulation ripples upward. Here's the complete system.
            </p>

            {/* Flow diagram */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              {[
                { emoji: "⚔️", label: "Battle" },
                { emoji: "💍", label: "Skill Rings" },
                { emoji: "🏰", label: "Castle" },
                { emoji: "👑", label: "Kingdom" },
                { emoji: "✨", label: "Rank" },
              ].map((s, i) => (
                <div key={s.label} className="flex items-center gap-2 sm:gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl sm:text-3xl">{s.emoji}</span>
                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</span>
                  </div>
                  {i < 4 && <ArrowRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />}
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ═══ 3-STEP QUEST LOOP ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-16">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">The Core Loop</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">Scout. Battle. Conquer.</h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {QUEST_STEPS.map((s, i) => (
                <motion.div key={s.step} {...fade(i * 0.15)}
                  className="rounded-2xl overflow-hidden border border-border/50 group"
                  style={{ background: "hsl(var(--card))", boxShadow: `inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))` }}>
                  <div className="h-40 overflow-hidden relative">
                    <img src={s.img} alt={s.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to top, hsl(var(--card)), transparent)` }} />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                        style={{ background: `hsl(${s.color} / 0.15)`, border: `1px solid hsl(${s.color} / 0.25)` }}>
                        <s.icon className="h-5 w-5" style={{ color: `hsl(${s.color})` }} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{s.step}</span>
                    </div>
                    <h3 className="font-fantasy text-xl font-bold mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ LAYER 1: SKILL CASTLES ═══ */}
        <section className="py-20 px-4" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <span className="inline-block text-xs font-mono uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-3"
                style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.2)" }}>
                Layer 1 — The Atom
              </span>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">Skill Castles</h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                Every skill is a castle powered by three growth rings. Fill them through simulations and watch your castle ascend.
              </p>
            </motion.div>

            {/* 3-Ring Model */}
            <div className="grid sm:grid-cols-3 gap-4 mb-14">
              {RINGS.map((ring, i) => (
                <motion.div key={ring.name} {...fade(i * 0.1)}
                  className="rounded-xl border border-border/50 p-6 text-center"
                  style={{ background: "hsl(var(--card))", boxShadow: `inset 0 1px 0 hsl(var(--emboss-light))` }}>
                  <div className="text-3xl mb-3">{ring.emoji}</div>
                  <h4 className="font-fantasy font-semibold text-lg mb-2">{ring.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{ring.desc}</p>
                  <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{ring.source}</span>
                </motion.div>
              ))}
            </div>

            {/* Castle Evolution */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {CASTLE_STAGES.map((c, i) => (
                <motion.div key={c.label} {...fade(i * 0.1)} className="text-center">
                  <div className="relative mx-auto w-28 h-28 md:w-36 md:h-36 mb-4">
                    <motion.img src={c.img} alt={c.label}
                      className="w-full h-full object-contain drop-shadow-lg crow-glow"
                      whileHover={{ scale: 1.08, y: -4 }}
                      transition={{ type: "spring", stiffness: 300 }} />
                  </div>
                  <h4 className="font-fantasy text-lg font-bold">{c.label}</h4>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                  <span className="inline-block mt-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{c.ring}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ LAYER 2: KINGDOMS ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <span className="inline-block text-xs font-mono uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-3"
                style={{ background: "hsl(var(--territory-strategic) / 0.1)", color: "hsl(var(--territory-strategic))", border: "1px solid hsl(var(--territory-strategic) / 0.2)" }}>
                Layer 2 — Per Role
              </span>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">Kingdoms</h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                Each role becomes a Kingdom. Advance it by leveling the skills it demands.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-4">
              {KINGDOM_TIERS.map((tier, i) => (
                <motion.div key={tier.name} {...fade(i * 0.1)}
                  className={`rounded-xl border p-6 ${tier.name === "Fortified"
                    ? "border-primary/40 ring-1 ring-primary/20"
                    : "border-border/50"}`}
                  style={{ background: "hsl(var(--card))", boxShadow: `inset 0 1px 0 hsl(var(--emboss-light))` }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{tier.emoji}</span>
                    <h4 className="font-fantasy font-bold text-lg">{tier.name}</h4>
                  </div>
                  <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">{tier.req}</p>
                  </div>
                  {tier.name === "Fortified" && (
                    <div className="mt-3 rounded-lg px-3 py-2 text-xs font-medium text-center"
                      style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                      ⚡ Level 2 — Boss Battles unlock here
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ LAYER 3: RANK LADDER ═══ */}
        <section className="py-20 px-4" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
          <div className="max-w-3xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <span className="inline-block text-xs font-mono uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-3"
                style={{ background: "hsl(var(--territory-leadership) / 0.1)", color: "hsl(var(--territory-leadership))", border: "1px solid hsl(var(--territory-leadership) / 0.2)" }}>
                Layer 3 — Global
              </span>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">Player Rank</h2>
              <p className="text-muted-foreground mt-3 max-w-md mx-auto">
                Your rank reflects breadth — mastering many skills across many roles, not grinding one.
              </p>
            </motion.div>

            <div className="flex items-end justify-center gap-3 md:gap-6">
              {RANK_LADDER.map((r, i) => (
                <motion.div key={r.rank} {...fade(i * 0.1)} className="flex flex-col items-center">
                  <div className="rounded-xl flex items-center justify-center mb-2"
                    style={{
                      width: 48 + i * 8, height: 48 + i * 8,
                      background: `linear-gradient(135deg, ${r.color}22, ${r.color}44)`,
                      border: `2px solid ${r.color}`,
                      boxShadow: `0 0 ${8 + i * 4}px ${r.color}33`,
                    }}>
                    <span className="text-xl md:text-2xl">{r.emoji}</span>
                  </div>
                  <span className="text-xs font-fantasy font-bold" style={{ color: r.color }}>{r.rank}</span>
                  <div className="w-full rounded-full mt-1" style={{ height: 3, background: r.color, opacity: 0.5 }} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ THE RIPPLE EFFECT ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div {...fade()} className="text-center mb-12">
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">The Ripple Effect</h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                One simulation → five layers of impact. Watch your progress cascade upward.
              </p>
            </motion.div>

            <div className="space-y-3">
              {RIPPLE_STEPS.map((item, i) => (
                <motion.div key={item.step} {...fade(i * 0.08)}
                  className="flex items-center gap-4 rounded-xl border border-border/50 p-5"
                  style={{ background: "hsl(var(--card))", boxShadow: `inset 0 1px 0 hsl(var(--emboss-light))` }}>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
                    style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                    <span className="text-sm font-bold">{item.step}</span>
                  </div>
                  <span className="text-2xl shrink-0">{item.emoji}</span>
                  <div className="flex-1">
                    <h4 className="font-fantasy font-semibold text-[15px]">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  {i < RIPPLE_STEPS.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground/30 hidden sm:block" />}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[200px] opacity-10"
              style={{ background: "hsl(var(--primary))" }} />
          </div>
          <motion.div {...fade()} className="text-center max-w-lg mx-auto relative z-10">
            <motion.img src={xcrowLogo} alt="Xcrow" className="h-16 w-16 mx-auto mb-6 crow-glow"
              animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
            <h2 className="font-fantasy text-3xl md:text-4xl font-bold mb-4">Ready to Begin?</h2>
            <p className="text-muted-foreground mb-8">Open the World Map and start your first quest. Free to play — no credit card required.</p>
            <Button size="lg" onClick={() => navigate("/map")} className="text-base px-10"
              style={{ boxShadow: "0 0 24px hsl(var(--filigree-glow) / 0.3)" }}>
              <Map className="h-5 w-5 mr-2" /> Enter the World Map
            </Button>
          </motion.div>
        </section>
      </div>
      <Footer />
    </>
  );
}
