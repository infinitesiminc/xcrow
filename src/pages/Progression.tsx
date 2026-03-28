import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sword, Castle, Crown, Shield, Sparkles, Target, Map, Zap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BOSS_ROSTER, type BossCharacter } from "@/lib/boss-roster";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55 },
};

/* ═══════════════════════════════════════════════════════════════ */
/*  HERO                                                          */
/* ═══════════════════════════════════════════════════════════════ */

function Hero() {
  return (
    <section className="relative px-4 pt-32 pb-24 overflow-hidden">
      {/* Atmospheric gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="mx-auto max-w-4xl text-center relative z-10">
        <motion.p
          {...fadeUp}
          className="text-xs font-medium uppercase tracking-[0.25em] text-primary mb-6"
        >
          ⚔️ The Commander's Codex
        </motion.p>
        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-['Cinzel'] text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-[1.1]"
        >
          Your Path to{" "}
          <span className="text-primary">Mastery</span>
        </motion.h1>
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed"
        >
          Every simulation ripples through your entire career map.
          Three layers — Skills, Kingdoms, Rank — each feeding the next.
        </motion.p>

        {/* Flow diagram */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-12 flex items-center justify-center gap-2 sm:gap-3 flex-wrap"
        >
          {[
            { emoji: "⚔️", label: "Battle" },
            { emoji: "💍", label: "Skill Rings" },
            { emoji: "🏰", label: "Castle" },
            { emoji: "👑", label: "Kingdom" },
            { emoji: "✨", label: "Rank" },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2 sm:gap-3">
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl sm:text-3xl">{step.emoji}</span>
                <span className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {step.label}
                </span>
              </div>
              {i < 4 && (
                <ArrowRight className="w-4 h-4 text-primary/50 shrink-0" />
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  LAYER 1: SKILL CASTLES                                        */
/* ═══════════════════════════════════════════════════════════════ */

const CASTLE_TIERS = [
  { emoji: "🏚️", name: "Ruins", xp: "0", desc: "Unexplored — a crumbling foundation awaits your claim", color: "text-muted-foreground" },
  { emoji: "🏕️", name: "Outpost", xp: "150", desc: "Claimed — your foothold is established, patrols begin", color: "text-primary" },
  { emoji: "🏰", name: "Fortress", xp: "500", desc: "Fortified — walls rise, AI tools become second nature", color: "text-primary" },
  { emoji: "⚔️", name: "Citadel", xp: "1,200", desc: "Mastered — an impregnable stronghold of expertise", color: "text-primary" },
  { emoji: "✨", name: "Grandmaster", xp: "2,500", desc: "Legendary — your skill radiates across the realm", color: "text-warning" },
];

const RINGS = [
  { emoji: "🎓", name: "Foundation", desc: "Core knowledge — what curricula cover today", color: "hsl(var(--muted-foreground))", source: "Passive (curriculum data)" },
  { emoji: "⚡", name: "AI Mastery", desc: "How AI reshapes this skill — tools, workflows, augmentation", color: "hsl(var(--primary))", source: "Level 1 Simulations" },
  { emoji: "✦", name: "Human Edge", desc: "What AI can't replace — judgment, empathy, creativity", color: "hsl(var(--spectrum-6))", source: "Level 2 Simulations" },
];

function SkillCastlesSection() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <motion.div {...fadeUp} className="text-center mb-14">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary font-['Cinzel'] text-xs tracking-wider">
            Layer 1 — The Atom
          </Badge>
          <h2 className="font-['Cinzel'] text-3xl sm:text-4xl font-bold text-foreground">
            Skill Castles
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-[15px] leading-relaxed">
            Every skill is a castle that evolves as you master it.
            Three rings power its growth — fill them through simulations and watch your castle ascend.
          </p>
        </motion.div>

        {/* 3-Ring Model */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="mb-16">
          <h3 className="font-['Cinzel'] text-xl font-semibold text-foreground text-center mb-8">
            The Three Rings of Growth
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {RINGS.map((ring) => (
              <div
                key={ring.name}
                className="rounded-xl border border-border bg-card p-6 text-center"
              >
                <div className="text-3xl mb-3">{ring.emoji}</div>
                <h4 className="font-['Cinzel'] font-semibold text-foreground text-lg mb-2">
                  {ring.name}
                </h4>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {ring.desc}
                </p>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: ring.color }} />
                  <span className="text-xs font-medium text-secondary-foreground">
                    {ring.source}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Castle Tiers */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          <h3 className="font-['Cinzel'] text-xl font-semibold text-foreground text-center mb-8">
            Castle Evolution
          </h3>
          <div className="space-y-3">
            {CASTLE_TIERS.map((tier, i) => (
              <div
                key={tier.name}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 sm:p-5"
              >
                <span className="text-3xl sm:text-4xl shrink-0">{tier.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`font-['Cinzel'] font-bold text-base sm:text-lg ${tier.color}`}>
                      {tier.name}
                    </span>
                    <Badge variant="secondary" className="text-[11px]">
                      {tier.xp} XP
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{tier.desc}</p>
                </div>
                <div className="hidden sm:block w-32">
                  <Progress value={(i / (CASTLE_TIERS.length - 1)) * 100} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  LAYER 2: KINGDOMS                                              */
/* ═══════════════════════════════════════════════════════════════ */

const KINGDOM_TIERS = [
  { emoji: "🔭", name: "Scouted", req: "Viewed or bookmarked the role", unlocks: "Role briefing & task overview" },
  { emoji: "⚔️", name: "Contested", req: "1+ linked skill at Outpost tier", unlocks: "Level 1 simulations" },
  { emoji: "🏰", name: "Fortified", req: "3+ linked skills at Fortress tier", unlocks: "Level 2 — Sentinel's Sanctum", highlight: true },
  { emoji: "👑", name: "Conquered", req: "All linked skills at Citadel tier", unlocks: "Full mastery badge & leaderboard" },
];

function KingdomsSection() {
  return (
    <section className="px-4 py-20 bg-secondary/30">
      <div className="mx-auto max-w-5xl">
        <motion.div {...fadeUp} className="text-center mb-14">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary font-['Cinzel'] text-xs tracking-wider">
            Layer 2 — Per Role
          </Badge>
          <h2 className="font-['Cinzel'] text-3xl sm:text-4xl font-bold text-foreground">
            Kingdoms
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-[15px] leading-relaxed">
            Each role you explore becomes a Kingdom. Advance it by leveling up the skills linked to that role.
            Your Kingdom tier tells you exactly what to do next.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {KINGDOM_TIERS.map((tier) => (
            <motion.div
              key={tier.name}
              {...fadeUp}
              className={`rounded-xl border p-6 ${
                tier.highlight
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{tier.emoji}</span>
                <h4 className="font-['Cinzel'] font-bold text-lg text-foreground">
                  {tier.name}
                </h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Requires: </span>
                    {tier.req}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Unlocks: </span>
                    {tier.unlocks}
                  </p>
                </div>
              </div>
              {tier.highlight && (
                <div className="mt-4 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary text-center">
                  ⚡ This is where Level 2 content unlocks
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* How it works callout */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="mt-10 rounded-xl border border-border bg-card p-6 sm:p-8">
          <h4 className="font-['Cinzel'] font-semibold text-foreground text-center mb-4">
            How Skills Feed Kingdoms
          </h4>
          <p className="text-sm text-muted-foreground text-center max-w-xl mx-auto leading-relaxed">
            Each role links to specific skills from our taxonomy of 183 canonical skills.
            As you level up those skill castles through simulations, your Kingdom tier advances automatically.
            No guessing — you always know which castles to build next.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  LAYER 3: PLAYER RANK                                           */
/* ═══════════════════════════════════════════════════════════════ */

const PLAYER_RANKS = [
  { emoji: "🌱", name: "Recruit", castles: "—", kingdoms: "—", desc: "Your journey begins" },
  { emoji: "🧭", name: "Explorer", castles: "5 at Outpost+", kingdoms: "—", desc: "Charting the landscape" },
  { emoji: "🗡️", name: "Strategist", castles: "15 at Fortress+", kingdoms: "2 Fortified", desc: "A force to reckon with" },
  { emoji: "⚔️", name: "Commander", castles: "30 at Fortress+", kingdoms: "5 Conquered", desc: "Leading the charge" },
  { emoji: "✨", name: "Legend", castles: "50 at Citadel+", kingdoms: "10 Conquered", desc: "A name etched in history" },
];

function PlayerRankSection() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <motion.div {...fadeUp} className="text-center mb-14">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary font-['Cinzel'] text-xs tracking-wider">
            Layer 3 — Aggregate
          </Badge>
          <h2 className="font-['Cinzel'] text-3xl sm:text-4xl font-bold text-foreground">
            Player Rank
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-[15px] leading-relaxed">
            Your overall rank reflects breadth — not grinding.
            It rewards mastering many skills across many roles, not repeating one.
          </p>
        </motion.div>

        {/* Horizontal rank ladder */}
        <motion.div {...fadeUp} className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max mx-auto justify-center">
            {PLAYER_RANKS.map((rank, i) => (
              <div key={rank.name} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 w-[140px] text-center">
                  <span className="text-3xl">{rank.emoji}</span>
                  <span className="font-['Cinzel'] font-bold text-foreground text-sm">{rank.name}</span>
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
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  RIPPLE EFFECT                                                  */
/* ═══════════════════════════════════════════════════════════════ */

function RippleSection() {
  return (
    <section className="px-4 py-20 bg-secondary/30">
      <div className="mx-auto max-w-4xl">
        <motion.div {...fadeUp} className="text-center mb-12">
          <h2 className="font-['Cinzel'] text-3xl sm:text-4xl font-bold text-foreground">
            The Ripple Effect
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-[15px] leading-relaxed">
            Complete one simulation and watch the impact cascade upward through every layer of your progression.
          </p>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="space-y-4">
          {[
            { step: "1", emoji: "⚔️", title: "Complete a Battle", desc: "Earn up to 100 XP per skill based on your score and context variety" },
            { step: "2", emoji: "💍", title: "Skill Rings Fill", desc: "L1 sims advance AI Mastery ⚡ — L2 sims advance Human Edge ✦" },
            { step: "3", emoji: "🏰", title: "Castle Evolves", desc: "As rings fill, your castle ascends from Ruins to Citadel" },
            { step: "4", emoji: "👑", title: "Kingdom Advances", desc: "Enough castles at the right tier and your Kingdom tier climbs" },
            { step: "5", emoji: "✨", title: "Rank Rises", desc: "Breadth of castles and kingdoms lifts your overall Player Rank" },
          ].map((item, i) => (
            <div
              key={item.step}
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                {item.step}
              </div>
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl shrink-0">{item.emoji}</span>
                <div>
                  <h4 className="font-['Cinzel'] font-semibold text-foreground text-[15px]">
                    {item.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Summary box */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.3 }}
          className="mt-10 rounded-xl border border-primary/30 bg-primary/5 p-6 sm:p-8 text-center"
        >
          <p className="font-['Cinzel'] text-lg sm:text-xl font-semibold text-foreground">
            "Every action has a clear, visible ripple effect up the chain."
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            You always know: level up this skill castle → advance this kingdom → reach the next rank.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  BOSS BESTIARY                                                  */
/* ═══════════════════════════════════════════════════════════════ */

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
      {/* Creature detail paths (legs, tentacles, wings, etc.) */}
      {boss.detailPaths.map((d, i) => (
        <path key={`d-${i}`} d={d} fill="none" stroke={`hsl(${h}, 50%, 40%)`} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      ))}
      {/* Body */}
      <path d={boss.bodyPath} fill={`url(#bg-${boss.id})`} stroke={`hsl(${h}, 60%, 50%)`} strokeWidth="1.5" />
      <path d={boss.innerPath} fill="none" stroke={`hsl(${h}, 50%, 40%)`} strokeWidth="0.7" opacity="0.5" />
      {/* Crown / horns / ears */}
      {boss.crownPath && (
        <path d={boss.crownPath} fill="none" stroke={`hsl(${h}, 70%, 60%)`} strokeWidth="1.5" strokeLinecap="round" />
      )}
      {/* Eyes from eyePositions */}
      {boss.eyePositions.map((eye, i) => (
        <circle key={`eye-${i}`} cx={eye.cx} cy={eye.cy} r={eye.r} fill={`url(#glow-${boss.id})`} stroke={`hsl(${h}, 80%, 70%)`} strokeWidth="1" />
      ))}
      {/* Runes */}
      {boss.runes.map((r, i) => (
        <circle key={i} cx={r.x} cy={r.y} r={r.r} fill={`hsl(${h}, 60%, 55%)`} opacity="0.6">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

function BossBestiarySection() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <motion.div {...fadeUp} className="text-center mb-14">
          <Badge variant="outline" className="mb-4 border-destructive/30 text-destructive font-['Cinzel'] text-xs tracking-wider">
            Level 2 — Boss Battles
          </Badge>
          <h2 className="font-['Cinzel'] text-3xl sm:text-4xl font-bold text-foreground">
            The Bestiary
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-[15px] leading-relaxed">
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
              className="group relative flex flex-col items-center rounded-xl border border-border bg-card p-4 text-center overflow-hidden"
              style={{
                boxShadow: `0 4px 20px -6px hsl(${boss.hue}, 50%, 30%, 0.3)`,
              }}
            >
              {/* Subtle hue tint at top */}
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
              <h4 className="font-['Cinzel'] font-bold text-foreground text-sm leading-tight">
                {boss.name}
              </h4>
              <p className="text-[10px] text-muted-foreground mt-1 italic leading-snug line-clamp-2">
                {boss.title}
              </p>

              {/* Hover quote tooltip */}
              <div className="absolute inset-0 flex items-end justify-center p-3 bg-gradient-to-t from-background/95 via-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <p className="text-[11px] text-foreground italic text-center leading-snug">
                  "{boss.quote}"
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Rotation callout */}
        <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-6 text-center">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Smart Rotation:</span>{" "}
            Each battle picks from the roster while avoiding your last 4 opponents — 
            keeping every encounter fresh and unpredictable.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  CTA                                                            */
/* ═══════════════════════════════════════════════════════════════ */

function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="px-4 py-24 text-center">
      <motion.div {...fadeUp} className="mx-auto max-w-lg">
        <h2 className="font-['Cinzel'] text-2xl sm:text-3xl font-bold text-foreground mb-4">
          Ready to Claim Your First Castle?
        </h2>
        <p className="text-muted-foreground mb-8 text-[15px]">
          Open the World Map, scout a role, and begin your first battle.
        </p>
        <Button
          size="lg"
          onClick={() => navigate("/upskill")}
          className="font-['Cinzel'] font-semibold gap-2"
        >
          Enter the World Map
          <Map className="w-4 h-4" />
        </Button>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  PAGE                                                           */
/* ═══════════════════════════════════════════════════════════════ */

export default function Progression() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <Hero />
        <SkillCastlesSection />
        <KingdomsSection />
        <PlayerRankSection />
        <BossBestiarySection />
        <RippleSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
