/**
 * How It Works — The definitive progression explainer.
 * Merges the best of old /how-it-works + /progression into one page.
 */
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Sword, Map, Crown, ArrowRight, Sparkles, Target, Zap,
  Shield, BookOpen, Compass, Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BOSS_ROSTER, type BossCharacter } from "@/lib/boss-roster";

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
  { img: castleRuins, label: "Ruins", desc: "Unexplored", xp: "0 XP" },
  { img: castleOutpost, label: "Outpost", desc: "Foundation built", xp: "150 XP" },
  { img: castleFortress, label: "Fortress", desc: "Battle-tested", xp: "500 XP" },
  { img: castleCitadel, label: "Citadel", desc: "Mastery proven", xp: "1,200 XP" },
];

const RINGS = [
  { emoji: "🎓", name: "Foundation", desc: "Core knowledge from curricula and coursework", source: "Passive", color: "hsl(var(--muted-foreground))" },
  { emoji: "⚡", name: "AI Mastery", desc: "How AI reshapes this skill — tools & workflows", source: "Level 1 Sims", color: "hsl(var(--primary))" },
  { emoji: "✦", name: "Human Edge", desc: "What AI can't replace — judgment, empathy, creativity", source: "Level 2 Sims", color: "hsl(var(--spectrum-6))" },
];

const KINGDOM_TIERS = [
  { emoji: "🔭", name: "Scouted", req: "Viewed or bookmarked the role", unlocks: "Role briefing & task overview" },
  { emoji: "⚔️", name: "Contested", req: "1+ linked skill at Outpost tier", unlocks: "Level 1 simulations" },
  { emoji: "🏰", name: "Fortified", req: "3+ linked skills at Fortress tier", unlocks: "Level 2 — Sentinel's Sanctum", highlight: true },
  { emoji: "👑", name: "Conquered", req: "All linked skills at Citadel tier", unlocks: "Full mastery badge & leaderboard" },
];

const PLAYER_RANKS = [
  { emoji: "🌱", name: "Recruit", castles: "—", kingdoms: "—", desc: "Your journey begins" },
  { emoji: "🧭", name: "Explorer", castles: "5 at Outpost+", kingdoms: "—", desc: "Charting the landscape" },
  { emoji: "🗡️", name: "Strategist", castles: "15 at Fortress+", kingdoms: "2 Fortified", desc: "A force to reckon with" },
  { emoji: "⚔️", name: "Commander", castles: "30 at Fortress+", kingdoms: "5 Conquered", desc: "Leading the charge" },
  { emoji: "✨", name: "Legend", castles: "50 at Citadel+", kingdoms: "10 Conquered", desc: "A name etched in history" },
];

const RIPPLE_STEPS = [
  { step: "1", emoji: "⚔️", title: "Complete a Battle", desc: "Earn up to 100 XP per skill based on your score and context variety" },
  { step: "2", emoji: "💍", title: "Skill Rings Fill", desc: "L1 sims advance AI Mastery ⚡ — L2 sims advance Human Edge ✦" },
  { step: "3", emoji: "🏰", title: "Castle Evolves", desc: "As rings fill, your castle ascends from Ruins to Citadel" },
  { step: "4", emoji: "👑", title: "Kingdom Advances", desc: "Enough castles at the right tier and your Kingdom tier climbs" },
  { step: "5", emoji: "✨", title: "Rank Rises", desc: "Breadth of castles and kingdoms lifts your overall Player Rank" },
];

/* ═══ Boss Mini SVG ═══ */
function BossMiniSVG({ boss }: { boss: BossCharacter }) {
  const h = boss.hue;
  return (
    <svg viewBox="-10 -15 140 160" className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-lg">
      <defs>
        <radialGradient id={`bg-${boss.id}`} cx="50%" cy="40%">
          <stop offset="0%" stopColor={`hsl(${h}, 70%, 25%)`} />
          <stop offset="100%" stopColor={`hsl(${h}, 50%, 10%)`} />
        </radialGradient>
        <radialGradient id={`glow-${boss.id}`} cx="50%" cy="50%">
          <stop offset="0%" stopColor={`hsl(${h}, 80%, 60%)`} stopOpacity="0.5" />
          <stop offset="100%" stopColor={`hsl(${h}, 80%, 60%)`} stopOpacity="0" />
        </radialGradient>
      </defs>
      {boss.detailPaths.map((d, i) => (
        <path key={`d-${i}`} d={d} fill="none" stroke={`hsl(${h}, 50%, 40%)`} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      ))}
      <path d={boss.bodyPath} fill={`url(#bg-${boss.id})`} stroke={`hsl(${h}, 60%, 50%)`} strokeWidth="1.5" />
      <path d={boss.innerPath} fill="none" stroke={`hsl(${h}, 50%, 40%)`} strokeWidth="0.7" opacity="0.5" />
      {boss.crownPath && (
        <path d={boss.crownPath} fill="none" stroke={`hsl(${h}, 70%, 60%)`} strokeWidth="1.5" strokeLinecap="round" />
      )}
      {boss.eyePositions.map((eye, i) => (
        <circle key={`eye-${i}`} cx={eye.cx} cy={eye.cy} r={eye.r} fill={`url(#glow-${boss.id})`} stroke={`hsl(${h}, 80%, 70%)`} strokeWidth="1" />
      ))}
      {boss.runes.map((r, i) => (
        <circle key={i} cx={r.x} cy={r.y} r={r.r} fill={`hsl(${h}, 60%, 55%)`} opacity="0.6">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

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
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">📜 The Commander's Codex</p>
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
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary font-fantasy text-xs tracking-wider">
                Layer 1 — The Atom
              </Badge>
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
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: ring.color }} />
                    <span className="text-xs font-medium text-secondary-foreground">{ring.source}</span>
                  </div>
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
                  <span className="inline-block mt-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{c.xp}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ LAYER 2: KINGDOMS ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <Badge variant="outline" className="mb-4 font-fantasy text-xs tracking-wider"
                style={{ borderColor: "hsl(var(--territory-strategic) / 0.3)", color: "hsl(var(--territory-strategic))" }}>
                Layer 2 — Per Role
              </Badge>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">Kingdoms</h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                Each role becomes a Kingdom. Advance it by leveling the skills it demands.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-4">
              {KINGDOM_TIERS.map((tier, i) => (
                <motion.div key={tier.name} {...fade(i * 0.1)}
                  className={`rounded-xl border p-6 ${tier.highlight
                    ? "border-primary/40 ring-1 ring-primary/20"
                    : "border-border/50"}`}
                  style={{ background: "hsl(var(--card))", boxShadow: `inset 0 1px 0 hsl(var(--emboss-light))` }}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{tier.emoji}</span>
                    <h4 className="font-fantasy font-bold text-lg">{tier.name}</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Target className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Requires: </span>{tier.req}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Unlocks: </span>{tier.unlocks}
                      </p>
                    </div>
                  </div>
                  {tier.highlight && (
                    <div className="mt-3 rounded-lg px-3 py-2 text-xs font-medium text-center"
                      style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                      ⚡ Level 2 — Boss Battles unlock here
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* How skills feed kingdoms */}
            <motion.div {...fade(0.2)} className="mt-10 rounded-xl border border-border/50 p-6 sm:p-8"
              style={{ background: "hsl(var(--card))", boxShadow: `inset 0 1px 0 hsl(var(--emboss-light))` }}>
              <h4 className="font-fantasy font-semibold text-center mb-4">How Skills Feed Kingdoms</h4>
              <p className="text-sm text-muted-foreground text-center max-w-xl mx-auto leading-relaxed">
                Each role links to specific skills from our taxonomy of 183 canonical skills.
                As you level up those skill castles through simulations, your Kingdom tier advances automatically.
                No guessing — you always know which castles to build next.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ═══ MID-PAGE CTA ═══ */}
        <section className="py-16 px-4">
          <motion.div {...fade()} className="text-center max-w-lg mx-auto">
            <h3 className="font-fantasy text-2xl font-bold mb-3">Ready to claim your first castle?</h3>
            <p className="text-muted-foreground text-sm mb-6">Open the World Map and start your first quest — free, no credit card required.</p>
            <Button size="lg" onClick={() => navigate("/map")} className="text-base px-8 gap-2"
              style={{ boxShadow: "0 0 20px hsl(var(--filigree-glow) / 0.25)" }}>
              <Map className="h-5 w-5" /> Enter the World Map
            </Button>
          </motion.div>
        </section>

        {/* ═══ LAYER 3: PLAYER RANK ═══ */}
        <section className="py-20 px-4" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <Badge variant="outline" className="mb-4 font-fantasy text-xs tracking-wider"
                style={{ borderColor: "hsl(var(--territory-leadership) / 0.3)", color: "hsl(var(--territory-leadership))" }}>
                Layer 3 — Global
              </Badge>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">Player Rank</h2>
              <p className="text-muted-foreground mt-3 max-w-md mx-auto">
                Your rank reflects breadth — mastering many skills across many roles, not grinding one.
              </p>
            </motion.div>

            {/* Horizontal rank ladder with details */}
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-3 min-w-max mx-auto justify-center">
                {PLAYER_RANKS.map((rank, i) => (
                  <div key={rank.name} className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-border/50 p-5 w-[140px] text-center"
                      style={{ background: "hsl(var(--card))", boxShadow: `inset 0 1px 0 hsl(var(--emboss-light))` }}>
                      <span className="text-3xl">{rank.emoji}</span>
                      <span className="font-fantasy font-bold text-sm">{rank.name}</span>
                      <p className="text-[11px] text-muted-foreground leading-tight">{rank.desc}</p>
                      {rank.castles !== "—" && (
                        <div className="mt-2 space-y-1 w-full">
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span>🏰</span> {rank.castles}
                          </div>
                          {rank.kingdoms !== "—" && (
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <span>👑</span> {rank.kingdoms}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {i < PLAYER_RANKS.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-primary/40 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ BOSS BESTIARY ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <Badge variant="outline" className="mb-4 border-destructive/30 text-destructive font-fantasy text-xs tracking-wider">
                Level 2 — Boss Battles
              </Badge>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">The Bestiary</h2>
              <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
                Ten unique adversaries guard the Sentinel's Sanctum. Each boss rotates between battles — 
                no two encounters feel the same.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {BOSS_ROSTER.map((boss, i) => (
                <motion.div
                  key={boss.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  whileHover={{ y: -6, scale: 1.03 }}
                  className="group relative flex flex-col items-center rounded-xl border border-border/50 p-4 text-center overflow-hidden"
                  style={{
                    background: "hsl(var(--card))",
                    boxShadow: `0 4px 20px -6px hsl(${boss.hue}, 50%, 30%, 0.3)`,
                  }}
                >
                  <div
                    className="absolute inset-x-0 top-0 h-16 opacity-20 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at 50% 0%, hsl(${boss.hue}, 60%, 50%), transparent 70%)`,
                    }}
                  />
                  <div className="relative z-10 mb-3">
                    <BossMiniSVG boss={boss} />
                  </div>
                  <span className="text-lg mb-1">{boss.emoji}</span>
                  <h4 className="font-fantasy font-bold text-sm leading-tight">{boss.name}</h4>
                  <p className="text-[10px] text-muted-foreground mt-1 italic leading-snug line-clamp-2">{boss.title}</p>
                  <div className="absolute inset-0 flex items-end justify-center p-3 bg-gradient-to-t from-background/95 via-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <p className="text-[11px] text-foreground italic text-center leading-snug">"{boss.quote}"</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div {...fade(0.3)} className="mt-8 rounded-xl border border-border/50 p-5 sm:p-6 text-center"
              style={{ background: "hsl(var(--card))", boxShadow: `inset 0 1px 0 hsl(var(--emboss-light))` }}>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Smart Rotation:</span>{" "}
                Each battle picks from the roster while avoiding your last 4 opponents — 
                keeping every encounter fresh and unpredictable.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ═══ THE RIPPLE EFFECT ═══ */}
        <section className="py-20 px-4" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
          <div className="max-w-4xl mx-auto">
            <motion.div {...fade()} className="text-center mb-12">
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">The Ripple Effect</h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                Complete one simulation and watch the impact cascade upward through every layer of your progression.
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

            {/* Summary box */}
            <motion.div {...fade(0.3)}
              className="mt-10 rounded-xl border border-primary/30 p-6 sm:p-8 text-center"
              style={{ background: "hsl(var(--primary) / 0.05)" }}>
              <p className="font-fantasy text-lg sm:text-xl font-semibold">
                "Every action has a clear, visible ripple effect up the chain."
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                You always know: level up this skill castle → advance this kingdom → reach the next rank.
              </p>
            </motion.div>
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
