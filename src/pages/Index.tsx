/**
 * Index — Guest landing = Play page content.
 * Authenticated users who completed onboarding redirect to /map.
 */
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import {
  Map, Sword, Shield, Star, Crown, Sparkles, ArrowRight,
  Compass, Target, Zap, Trophy, ChevronDown, Users, Swords, BookOpen,
  Search, TestTube, Scroll,
} from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import OnboardingQuest from "@/components/OnboardingQuest";
import CompanyMarquee from "@/components/CompanyMarquee";
import { useState } from "react";
import CinematicHeroSlideshow from "@/components/CinematicHeroSlideshow";

import { TERRITORIES } from "@/lib/territory-colors";
import TerritoryEmblem from "@/components/TerritoryEmblem";
import Footer from "@/components/Footer";

import xcrowLogo from "@/assets/xcrow-logo.webp";
import castleRuins from "@/assets/castle-ruins.webp";
import castleOutpost from "@/assets/castle-outpost.webp";
import castleFortress from "@/assets/castle-fortress.webp";
import castleCitadel from "@/assets/castle-citadel.webp";
import simBriefing from "@/assets/sim-briefing.jpg";
import simVictory from "@/assets/sim-victory.jpg";
import heroConquer from "@/assets/hero-conquer.jpg";
import bossBattlePreview from "@/assets/boss-battle-preview.png";
import showcaseRoleNpc from "@/assets/showcase-role-npc.png";
import showcaseWanderingNpc from "@/assets/showcase-wandering-npc.png";
import showcaseGuardian from "@/assets/showcase-guardian.png";

import avatarCrow from "@/assets/avatars/crow.webp";
import avatarDragon from "@/assets/avatars/dragon.webp";
import avatarPhoenix from "@/assets/avatars/phoenix.webp";
import avatarWolf from "@/assets/avatars/wolf.webp";
import avatarHawk from "@/assets/avatars/hawk.webp";
import avatarLion from "@/assets/avatars/lion.webp";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const TERRITORY_HERO_SKILLS: Record<string, string> = {
  "territory-technical": "prompt-engineering",
  "territory-analytical": "ai-strategy-governance",
  "territory-strategic": "strategic-problem-solving",
  "territory-communication": "datadriven-narrative-development",
  "territory-leadership": "ethical-ai-leadership-governance",
  "territory-creative": "humancentric-design-empathy",
  "territory-ethics": "ai-ethics-governance",
  "territory-humanedge": "complex-problem-solving-humanai-teams",
};

const TERRITORY_DOMAINS = TERRITORIES.map(t => ({
  name: t.terrain,
  emoji: t.emoji,
  cssVar: t.cssVar,
  category: t.category,
  heroImg: `${SUPABASE_URL}/storage/v1/object/public/sim-images/skill-hero-${TERRITORY_HERO_SKILLS[t.cssVar] || "complex-threat-modeling"}.png`,
}));

const TERRITORY_BORDERS: string[] = [
  "0,0 240,0 260,120 220,270 0,270",
  "240,0 500,0 520,100 480,270 220,270 260,120",
  "500,0 720,0 740,130 700,270 480,270 520,100",
  "720,0 960,0 960,270 700,270 740,130",
  "0,270 220,270 240,400 200,540 0,540",
  "220,270 480,270 500,390 460,540 200,540 240,400",
  "480,270 700,270 720,410 680,540 460,540 500,390",
  "700,270 960,270 960,540 680,540 720,410",
];

const TERRITORY_CENTERS: [number, number][] = [
  [120, 140], [370, 130], [610, 135], [840, 140],
  [115, 400], [350, 400], [590, 405], [820, 400],
];

const CASTLE_STAGES = [
  { img: castleRuins, label: "Ruins", desc: "Uncharted skill", xp: "0 XP" },
  { img: castleOutpost, label: "Outpost", desc: "Foundation built", xp: "150 XP" },
  { img: castleFortress, label: "Fortress", desc: "Battle-tested", xp: "500 XP" },
  { img: castleCitadel, label: "Citadel", desc: "Mastery proven", xp: "1200 XP" },
];

const AVATARS = [
  { img: avatarCrow, name: "Crow" },
  { img: avatarDragon, name: "Dragon" },
  { img: avatarPhoenix, name: "Phoenix" },
  { img: avatarWolf, name: "Wolf" },
  { img: avatarHawk, name: "Hawk" },
  { img: avatarLion, name: "Lion" },
];

const MISSION_PHASES = [
  {
    step: "01",
    title: "Discover",
    subtitle: "Scout the Frontier",
    desc: "Talk to Role NPCs on the world map. Scout territories, collect skill intel, and identify which AI skills your target roles demand.",
    Icon: Search,
    color: "var(--territory-analytical)",
    img: simBriefing,
    metric: "3+ NPCs scouted",
  },
  {
    step: "02",
    title: "Experiment",
    subtitle: "Enter the Simulation",
    desc: "Jump into AI-powered quests built from real job tasks. Earn Bronze and Silver tiers, build castle foundations, and develop hands-on skill mastery.",
    Icon: TestTube,
    color: "var(--territory-creative)",
    img: simVictory,
    metric: "5+ skills practiced",
  },
  {
    step: "03",
    title: "Challenge",
    subtitle: "Face the Guardians",
    desc: "Unlock Guardian Trials and Boss Battles that test your strategic oversight. Reach Gold tier and prove you can spot what AI gets wrong.",
    Icon: Swords,
    color: "var(--territory-strategic)",
    img: bossBattlePreview,
    metric: "Guardian Trials unlocked",
  },
  {
    step: "04",
    title: "Master",
    subtitle: "Conquer Your Territory",
    desc: "Conquer 10+ skills to Platinum, build Citadels across territories, and forge a verified profile that proves you're future-ready.",
    Icon: Trophy,
    color: "var(--territory-leadership)",
    img: heroConquer,
    metric: "10+ skills conquered",
  },
];

const GAMEPLAY_FEATURES = [
  { emoji: "🗺️", title: "World Map", desc: "Explore 8 territories with 183 skills" },
  { emoji: "🗣️", title: "NPC Encounters", desc: "Talk to role NPCs to scout skill intel" },
  { emoji: "⚔️", title: "Quest Simulations", desc: "AI-powered tasks from real job data" },
  { emoji: "🏰", title: "Castle Progression", desc: "Evolve castles from Ruins to Citadel" },
  { emoji: "👹", title: "Guardian Trials", desc: "Boss battles that test strategic oversight" },
  { emoji: "📜", title: "Quest Journal", desc: "Track missions, intel, and battle record" },
];

const SOCIAL_STATS = [
  { value: "100,000+", label: "Real Jobs Analyzed" },
  { value: "183", label: "Skill Territories" },
  { value: "10", label: "Boss Monsters" },
  { value: "21,000+", label: "Roles to Scout" },
];

const Index = () => {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const isSignedIn = !!user;

  const showOnboarding = isSignedIn && (profile === null || (profile && !profile.onboardingCompleted));
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  if (isSignedIn && (!showOnboarding || onboardingDismissed)) {
    return <Navigate to="/map" replace />;
  }

  return (
    <>
      <SEOHead path="/" />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* ═══ HERO ═══ */}
        <section className="relative pt-24 md:pt-32 pb-0 px-4 overflow-hidden">
          <motion.div {...fade()} className="text-center max-w-3xl mx-auto relative z-10">
            <h1 className="font-fantasy text-4xl md:text-6xl font-bold mb-4 leading-tight">
              183 skills. 4 phases. 1 mission.
              <br />
              <span style={{ color: "hsl(var(--filigree-glow))" }}>Master the AI frontier.</span>
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-8">
              Discover roles, experiment with quests, challenge guardians, and master your territory — built from 100,000+ real jobs.
            </p>

            {/* Floating avatars */}
            <div className="flex justify-center gap-2 mb-8">
              {AVATARS.map((a, i) => (
                <motion.img
                  key={a.name}
                  src={a.img}
                  alt={a.name}
                  className="h-10 w-10 rounded-full border-2 border-border crow-glow"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                />
              ))}
              <motion.span
                className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold border-2 border-border bg-muted text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                +21k
              </motion.span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate("/map")}
                className="text-base px-8"
                style={{ boxShadow: "0 0 20px hsl(var(--filigree-glow) / 0.25)" }}>
                <Sword className="h-5 w-5 mr-2" />
                Begin Your Mission
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/how-it-works")}
                className="text-base px-8">
                See How It Works
              </Button>
            </div>
          </motion.div>

          {/* Cinematic hero image */}
          <motion.div
            {...fade(0.3)}
            className="relative max-w-5xl mx-auto mt-12 rounded-xl overflow-hidden border border-border/50"
            style={{
              aspectRatio: "16/7",
              boxShadow: "0 8px 40px hsl(var(--emboss-shadow)), inset 0 1px 0 hsl(var(--emboss-light))",
            }}
          >
            <CinematicHeroSlideshow />
            <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
              style={{ background: "linear-gradient(to top, hsl(var(--background)), transparent)" }} />
          </motion.div>
        </section>

        {/* ═══ SOCIAL PROOF + COMPANY MARQUEE (merged) ═══ */}
        <section className="py-12 px-4 overflow-hidden">
          <div className="max-w-5xl mx-auto">
            {/* Stats row */}
            <motion.div {...fade()} className="flex flex-wrap justify-center gap-8 md:gap-14 mb-8">
              {SOCIAL_STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl md:text-3xl font-fantasy font-bold" style={{ color: "hsl(var(--filigree-glow))" }}>
                    {s.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </motion.div>

            <motion.div {...fade(0.1)} className="text-center mb-6">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">Live Job Intelligence</p>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                Every skill, quest, and simulation is generated from live job postings at companies like these.
              </p>
            </motion.div>
            <motion.div {...fade(0.15)}>
              <CompanyMarquee
                rows={[
                  ["Google", "Microsoft", "Amazon", "Apple", "Meta", "Deloitte", "McKinsey", "JPMorgan", "Goldman Sachs", "Stripe"],
                  ["Salesforce", "Adobe", "Netflix", "Spotify", "Shopify", "Airbnb", "Uber", "Tesla", "NVIDIA", "IBM"],
                ]}
              />
            </motion.div>
          </div>
        </section>

        {/* ═══ THE MISSION — 4-Phase Journey ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-16">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">The AI Scouting Mission</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">
                Discover → Experiment → Challenge → Master
              </h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                A guided 4-phase journey from your first NPC encounter to territory mastery.
              </p>
            </motion.div>

            {/* Vertical timeline */}
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px hidden md:block"
                style={{ background: "linear-gradient(to bottom, hsl(var(--border)), hsl(var(--filigree-glow) / 0.3), hsl(var(--border)))" }} />

              <div className="space-y-8 md:space-y-12">
                {MISSION_PHASES.map((phase, i) => {
                  const isEven = i % 2 === 0;
                  return (
                    <motion.div
                      key={phase.step}
                      {...fade(i * 0.12)}
                      className={`relative flex flex-col md:flex-row items-stretch gap-4 md:gap-8 ${!isEven ? "md:flex-row-reverse" : ""}`}
                    >
                      {/* Timeline dot (desktop) */}
                      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-6 z-10">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center border-2"
                          style={{
                            background: `hsl(${phase.color} / 0.15)`,
                            borderColor: `hsl(${phase.color} / 0.4)`,
                            boxShadow: `0 0 12px hsl(${phase.color} / 0.2)`,
                          }}>
                          <span className="text-xs font-mono font-bold" style={{ color: `hsl(${phase.color})` }}>{phase.step}</span>
                        </div>
                      </div>

                      {/* Image card */}
                      <div className="md:w-[calc(50%-2rem)] rounded-xl overflow-hidden border border-border/50"
                        style={{ boxShadow: `inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))` }}>
                        <div className="h-44 md:h-52 overflow-hidden relative">
                          <img src={phase.img} alt={phase.title} className="w-full h-full object-cover opacity-80" loading="lazy" />
                          <div className="absolute inset-0" style={{ background: `linear-gradient(to top, hsl(var(--card)), transparent 60%)` }} />
                        </div>
                      </div>

                      {/* Text card */}
                      <div className="md:w-[calc(50%-2rem)] rounded-xl p-6 border border-border/50 flex flex-col justify-center"
                        style={{
                          background: "hsl(var(--card))",
                          boxShadow: `inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))`,
                        }}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-xl flex items-center justify-center md:hidden"
                            style={{ background: `hsl(${phase.color} / 0.15)`, border: `1px solid hsl(${phase.color} / 0.25)` }}>
                            <phase.Icon className="h-5 w-5" style={{ color: `hsl(${phase.color})` }} />
                          </div>
                          <div className="hidden md:flex h-10 w-10 rounded-xl items-center justify-center"
                            style={{ background: `hsl(${phase.color} / 0.15)`, border: `1px solid hsl(${phase.color} / 0.25)` }}>
                            <phase.Icon className="h-5 w-5" style={{ color: `hsl(${phase.color})` }} />
                          </div>
                          <div>
                            <span className="text-xs font-mono text-muted-foreground">Phase {phase.step}</span>
                            <h3 className="font-fantasy text-xl font-bold" style={{ color: `hsl(${phase.color})` }}>{phase.title}</h3>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">{phase.subtitle}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">{phase.desc}</p>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full bg-muted text-muted-foreground w-fit">
                          <Target className="h-3 w-3" /> {phase.metric}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <motion.div {...fade(0.5)} className="text-center mt-12">
              <Button size="lg" onClick={() => navigate("/map")}
                className="text-base px-8 font-fantasy"
                style={{ boxShadow: "0 0 20px hsl(var(--filigree-glow) / 0.2)" }}>
                <Compass className="h-5 w-5 mr-2" />
                Start Phase 1: Discover
              </Button>
            </motion.div>
          </div>
        </section>

        {/* ═══ KEY GAMEPLAY FEATURES ═══ */}
        <section className="py-16 px-4" style={{ background: "hsl(var(--secondary) / 0.3)" }}>
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-10">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">Key Gameplay</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">
                Everything You Need to Conquer
              </h2>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {GAMEPLAY_FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  {...fade(i * 0.08)}
                  className="rounded-xl p-5 border border-border/50 text-center hover:border-primary/30 transition-colors"
                  style={{
                    background: "hsl(var(--card))",
                    boxShadow: `inset 0 1px 0 hsl(var(--emboss-light)), 0 2px 12px hsl(var(--emboss-shadow))`,
                  }}
                >
                  <span className="text-3xl block mb-3">{f.emoji}</span>
                  <h4 className="font-fantasy text-sm md:text-base font-bold mb-1">{f.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ ENCOUNTER SHOWCASE ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div {...fade()} className="text-center mb-12">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">Meet the Characters</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">
                Every Encounter Shapes Your Journey
              </h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                Talk to Role NPCs, consult Wandering Guides, and face Territory Guardians — each with unique intel, lore, and challenges.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { src: showcaseRoleNpc, label: "Role NPC Encounter", desc: "Chat with real job roles to discover skills and scout intel" },
                { src: showcaseWanderingNpc, label: "Wandering NPC", desc: "Meet guides like the Lorekeeper who share industry wisdom" },
                { src: showcaseGuardian, label: "Territory Guardian", desc: "Face guardians who test your mastery with boss challenges" },
              ].map((card, i) => (
                <motion.div key={card.label} {...fade(i * 0.12)}
                  className="rounded-xl overflow-hidden border border-border/50 group hover:border-primary/40 transition-colors"
                  style={{ boxShadow: "0 4px 30px hsl(var(--primary) / 0.08), inset 0 1px 0 hsl(var(--emboss-light))" }}
                >
                  <div className="overflow-hidden">
                    <img src={card.src} alt={card.label}
                      className="w-full h-auto block group-hover:scale-[1.02] transition-transform duration-500"
                      loading="lazy" />
                  </div>
                  <div className="p-4 bg-card/80 backdrop-blur-sm">
                    <h3 className="font-fantasy text-sm font-bold">{card.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div {...fade(0.35)} className="text-center mt-8">
              <Button size="lg" variant="outline" onClick={() => navigate("/map")}
                className="text-sm px-6 font-fantasy">
                <Swords className="h-4 w-4 mr-2" />
                Explore the Map
              </Button>
            </motion.div>
          </div>
        </section>

        {/* ═══ CASTLE PROGRESSION ═══ */}
        <section className="py-20 px-4" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">Skill Progression</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">
                Every Skill Is a Castle to Build
              </h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                Complete quests to earn XP. Watch your castles evolve from ruins to citadels as your mastery grows.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {CASTLE_STAGES.map((c, i) => (
                <motion.div key={c.label} {...fade(i * 0.1)} className="text-center group">
                  <div className="relative mx-auto w-28 h-28 md:w-36 md:h-36 mb-4">
                    <motion.img
                      src={c.img}
                      alt={c.label}
                      className="w-full h-full object-contain drop-shadow-lg crow-glow"
                      whileHover={{ scale: 1.08, y: -4 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                  </div>
                  <h4 className="font-fantasy text-lg font-bold">{c.label}</h4>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                  <span className="inline-block mt-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {c.xp}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ TERRITORY MAP — 8 Domains ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">8 Skill Territories</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">
                Your World Map Awaits
              </h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                183 skills across 8 territories. Each territory is a domain of expertise with unique quests and boss battles.
              </p>
            </motion.div>

            <motion.div {...fade(0.1)} className="relative w-full" style={{ aspectRatio: "16/9" }}>
              <svg viewBox="0 0 960 540" className="w-full h-full" style={{ filter: "drop-shadow(0 0 40px hsl(var(--primary) / 0.08))" }}>
                <defs>
                  {TERRITORY_DOMAINS.map(t => (
                    <radialGradient key={`fill-${t.cssVar}`} id={`fill-${t.cssVar}`} cx="50%" cy="40%">
                      <stop offset="0%" stopColor={`hsl(var(--${t.cssVar}))`} stopOpacity="0.18" />
                      <stop offset="100%" stopColor={`hsl(var(--${t.cssVar}))`} stopOpacity="0.04" />
                    </radialGradient>
                  ))}
                </defs>

                {TERRITORY_DOMAINS.map((t, i) => {
                  const borders = TERRITORY_BORDERS[i];
                  const center = TERRITORY_CENTERS[i];
                  return (
                    <g key={t.cssVar}>
                      <polygon
                        points={borders}
                        fill={`url(#fill-${t.cssVar})`}
                        stroke={`hsl(var(--${t.cssVar}) / 0.3)`}
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <polygon
                        points={borders}
                        fill="none"
                        stroke={`hsl(var(--${t.cssVar}) / 0.08)`}
                        strokeWidth="3"
                        strokeLinejoin="round"
                      />

                      <foreignObject
                        x={center[0] - 26} y={center[1] - 50} width={52} height={52}
                        className="animate-territory-float"
                        style={{ animationDelay: `${i * 0.4}s` }}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <TerritoryEmblem category={t.category} size={48} />
                        </div>
                      </foreignObject>

                      <text x={center[0]} y={center[1] + 16} textAnchor="middle"
                        className="fill-foreground text-[11px] font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
                        {t.name}
                      </text>
                      <text x={center[0]} y={center[1] + 30} textAnchor="middle"
                        className="fill-muted-foreground text-[9px]">
                        {t.category}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </motion.div>

            <motion.div {...fade(0.2)} className="text-center mt-8">
              <Button size="lg" variant="outline" onClick={() => navigate("/skills")}
                className="text-sm px-6 font-fantasy">
                <BookOpen className="h-4 w-4 mr-2" />
                Browse All 183 Skills
              </Button>
            </motion.div>
          </div>
        </section>

        {/* ═══ SOCIAL — ALLIES & LEADERBOARD ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">Social Arena</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">
                You Don't Quest Alone
              </h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                Recruit allies, challenge friends, and compete on the global leaderboard. Every warrior needs a war party.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  emoji: "🤝",
                  title: "Recruit Allies",
                  desc: "Add friends, see what they're questing, and try their latest simulations. Your ally panel shows who's online now.",
                  cta: "Find Allies",
                  ctaPath: "/map",
                },
                {
                  emoji: "⚔️",
                  title: "Challenge Friends",
                  desc: "Send direct challenges to your allies. See who scores higher on the same simulation and earn bragging rights.",
                  cta: "Start a Duel",
                  ctaPath: "/map",
                },
                {
                  emoji: "🏆",
                  title: "Hall of Champions",
                  desc: "Climb the global leaderboard ranked by XP, skills unlocked, and quests completed. Your name in lights awaits.",
                  cta: "View Leaderboard",
                  ctaPath: "/leaderboard",
                },
              ].map((card, i) => (
                <motion.div
                  key={card.title}
                  {...fade(i * 0.12)}
                  className="rounded-2xl p-6 border border-border/50"
                  style={{
                    background: "hsl(var(--card))",
                    boxShadow: `inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))`,
                  }}
                >
                  <span className="text-4xl block mb-4">{card.emoji}</span>
                  <h3 className="font-fantasy text-xl font-bold mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{card.desc}</p>
                  <Button variant="ghost" size="sm" onClick={() => navigate(card.ctaPath)}
                    className="text-xs font-medium group">
                    {card.cta} <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Live activity teaser */}
            <motion.div {...fade(0.2)} className="mt-8 rounded-xl p-5 border border-border/50 flex flex-col sm:flex-row items-center gap-4"
              style={{ background: "hsl(var(--surface-stone))", boxShadow: `inset 0 1px 0 hsl(var(--emboss-light))` }}>
              <div className="flex -space-x-2">
                {AVATARS.slice(0, 4).map(a => (
                  <img key={a.name} src={a.img} alt={a.name} className="h-8 w-8 rounded-full border-2 border-background crow-glow" />
                ))}
              </div>
              <div className="text-center sm:text-left flex-1">
                <p className="text-sm font-medium">
                  <span style={{ color: "hsl(var(--filigree-glow))" }}>Phoenix</span>{" "}
                  <span className="text-muted-foreground">just conquered</span>{" "}
                  <span className="text-foreground font-semibold">Prompt Engineering</span>
                </p>
                <p className="text-xs text-muted-foreground">2 minutes ago · +85 XP earned</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/leaderboard")}
                className="shrink-0 text-xs font-fantasy"
                style={{ border: "1px solid hsl(var(--filigree) / 0.2)" }}>
                <Trophy className="h-3.5 w-3.5 mr-1" /> Leaderboard
              </Button>
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
            <motion.img
              src={xcrowLogo}
              alt="Xcrow"
              className="h-16 w-16 mx-auto mb-6 crow-glow"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <h2 className="font-fantasy text-3xl md:text-4xl font-bold mb-4">
              Your Territory Awaits
            </h2>
            <p className="text-muted-foreground mb-8">
              Free to start. No credit card required. Begin as a Recruit and forge your path to Legend.
            </p>
            <Button size="lg" onClick={() => navigate("/map")}
              className="text-base px-10"
              style={{ boxShadow: "0 0 24px hsl(var(--filigree-glow) / 0.3)" }}>
              <Map className="h-5 w-5 mr-2" />
              Enter the World Map
            </Button>
            <p className="text-[11px] text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
              <Sparkles className="h-3 w-3" style={{ color: "hsl(var(--filigree-glow))" }} />
              Join thousands of adventurers building future-proof careers
            </p>
          </motion.div>
        </section>
      </div>
      <Footer />

      {/* Onboarding overlay */}
      {showOnboarding && !onboardingDismissed && (
        <OnboardingQuest
          open
          userId={user!.id}
          onComplete={async () => {
            await refreshProfile();
            setOnboardingDismissed(true);
          }}
        />
      )}
    </>
  );
};

export default Index;
