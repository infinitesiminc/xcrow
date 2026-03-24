/**
 * Index — Guest landing = Play page content.
 * Authenticated users who completed onboarding redirect to /map.
 */
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  Map, Sword, Shield, Star, Crown, Sparkles, ArrowRight,
  Compass, Target, Zap, Trophy, ChevronDown, Users,
} from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import OnboardingQuest from "@/components/OnboardingQuest";
import SkillSuggestionCards from "@/components/SkillSuggestionCards";
import { useState } from "react";
import CinematicHeroSlideshow from "@/components/CinematicHeroSlideshow";
import { TERRITORIES } from "@/lib/territory-colors";
import TerritoryEmblem from "@/components/TerritoryEmblem";
import Footer from "@/components/Footer";

import xcrowLogo from "@/assets/xcrow-logo.png";
import castleRuins from "@/assets/castle-ruins.png";
import castleOutpost from "@/assets/castle-outpost.png";
import castleFortress from "@/assets/castle-fortress.png";
import castleCitadel from "@/assets/castle-citadel.png";
import simBriefing from "@/assets/sim-briefing.jpg";
import simVictory from "@/assets/sim-victory.jpg";
import heroConquer from "@/assets/hero-conquer.jpg";

import avatarCrow from "@/assets/avatars/crow.png";
import avatarDragon from "@/assets/avatars/dragon.png";
import avatarPhoenix from "@/assets/avatars/phoenix.png";
import avatarWolf from "@/assets/avatars/wolf.png";
import avatarHawk from "@/assets/avatars/hawk.png";
import avatarLion from "@/assets/avatars/lion.png";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

const TERRITORY_DOMAINS = TERRITORIES.map(t => ({
  name: t.terrain,
  emoji: t.emoji,
  cssVar: t.cssVar,
  category: t.category,
}));

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

const RANK_LADDER = [
  { rank: "Recruit", emoji: "⚔️", color: "hsl(215, 20%, 55%)" },
  { rank: "Explorer", emoji: "🧭", color: "hsl(180, 45%, 50%)" },
  { rank: "Strategist", emoji: "⭐", color: "hsl(45, 70%, 55%)" },
  { rank: "Commander", emoji: "👑", color: "hsl(270, 50%, 60%)" },
  { rank: "Legend", emoji: "🏆", color: "hsl(340, 60%, 55%)" },
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
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* ═══ HERO ═══ */}
        <section className="relative min-h-[90vh] flex items-center justify-center px-4 overflow-hidden">
          {/* Cinematic skill hero slideshow */}
          <CinematicHeroSlideshow />

          <motion.div {...fade()} className="text-center max-w-3xl relative z-10">
            <motion.img
              src={xcrowLogo}
              alt="Xcrow"
              className="h-24 w-24 mx-auto mb-6 crow-glow"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            <h1 className="font-fantasy text-4xl md:text-6xl font-bold mb-4 leading-tight">
              Level Up Your Career.
              <br />
              <span style={{ color: "hsl(var(--filigree-glow))" }}>Play the Game.</span>
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-8">
              Conquer skill territories, battle AI bosses, and forge a career that's future-proof — 
              all through quests designed around real job market data.
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
                Start Your Quest
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/how-it-works")}
                className="text-base px-8">
                How It Works
              </Button>
            </div>

            <motion.div
              className="mt-12 flex justify-center"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChevronDown className="h-6 w-6 text-muted-foreground/40" />
            </motion.div>
          </motion.div>
        </section>

        {/* ═══ HOW IT WORKS — 3-Step Loop ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-16">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">The Quest Loop</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">
                Scout. Battle. Conquer.
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Compass,
                  step: "01",
                  title: "Scout Kingdoms",
                  desc: "Explore 21,000+ real roles across every industry. See which skills each kingdom demands and where AI is reshaping the battlefield.",
                  color: "var(--territory-analytical)",
                  img: simBriefing,
                },
                {
                  icon: Sword,
                  step: "02",
                  title: "Battle & Learn",
                  desc: "Enter AI-powered simulations built from real job tasks. Face boss monsters that test your judgment, strategy, and human edge.",
                  color: "var(--territory-creative)",
                  img: simVictory,
                },
                {
                  icon: Crown,
                  step: "03",
                  title: "Conquer Territories",
                  desc: "Earn XP, upgrade castles, and climb the rank ladder. Build a verified skill portfolio that proves you're future-ready.",
                  color: "var(--territory-strategic)",
                  img: heroConquer,
                },
              ].map((s, i) => (
                <motion.div
                  key={s.step}
                  {...fade(i * 0.15)}
                  className="rounded-2xl overflow-hidden border border-border/50 group"
                  style={{
                    background: "hsl(var(--card))",
                    boxShadow: `inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))`,
                  }}
                >
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TERRITORY_DOMAINS.map((t, i) => (
                <motion.div
                  key={t.name}
                  {...fade(i * 0.06)}
                  className="rounded-xl p-4 border border-border/50 cursor-default hover:border-border transition-colors"
                  style={{
                    background: `linear-gradient(135deg, hsl(var(--${t.cssVar}) / 0.06), hsl(var(--card)))`,
                    boxShadow: `inset 0 1px 0 hsl(var(--emboss-light))`,
                  }}
                >
                  <TerritoryEmblem category={t.category} size={40} className="mb-2" />
                  <h4 className="font-fantasy text-sm font-bold mb-1" style={{ color: `hsl(var(--${t.cssVar}))` }}>
                    {t.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{t.category}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ RANK LADDER ═══ */}
        <section className="py-20 px-4" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
          <div className="max-w-3xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">Player Rank</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">
                Climb the Rank Ladder
              </h2>
              <p className="text-muted-foreground mt-3 max-w-md mx-auto">
                Your rank reflects your breadth of mastery — not just one skill, but your entire career arsenal.
              </p>
            </motion.div>

            <div className="flex items-end justify-center gap-3 md:gap-6">
              {RANK_LADDER.map((r, i) => (
                <motion.div key={r.rank} {...fade(i * 0.1)} className="flex flex-col items-center">
                  <div
                    className="rounded-xl flex items-center justify-center mb-2 transition-all"
                    style={{
                      width: 48 + i * 8,
                      height: 48 + i * 8,
                      background: `linear-gradient(135deg, ${r.color}22, ${r.color}44)`,
                      border: `2px solid ${r.color}`,
                      boxShadow: `0 0 ${8 + i * 4}px ${r.color}33`,
                    }}
                  >
                    <span className="text-xl md:text-2xl">{r.emoji}</span>
                  </div>
                  <span className="text-xs font-fantasy font-bold" style={{ color: r.color }}>
                    {r.rank}
                  </span>
                  <div className="w-full rounded-full mt-1" style={{ height: 3, background: r.color, opacity: 0.5 }} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ WHO IS THIS FOR ═══ */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">
                Built for Every Adventurer
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: "🎓",
                  title: "Students",
                  desc: "Your degree is the foundation. Xcrow is the edge. Discover which skills employers actually demand and prove you have them — before graduation.",
                  cta: "Start as a Recruit",
                },
                {
                  icon: "💼",
                  title: "Professionals",
                  desc: "AI is rewriting your job description. Stay ahead by identifying which of your tasks are at risk and building the skills that keep you irreplaceable.",
                  cta: "Scout Your Role",
                },
                {
                  icon: "🔄",
                  title: "Career Changers",
                  desc: "Transitioning to a new field? Map the skill gap between where you are and where you want to be, then close it through targeted quests.",
                  cta: "Explore Kingdoms",
                },
              ].map((p, i) => (
                <motion.div
                  key={p.title}
                  {...fade(i * 0.12)}
                  className="rounded-2xl p-6 border border-border/50"
                  style={{
                    background: "hsl(var(--card))",
                    boxShadow: `inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))`,
                  }}
                >
                  <span className="text-4xl block mb-4">{p.icon}</span>
                  <h3 className="font-fantasy text-xl font-bold mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{p.desc}</p>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/map")}
                    className="text-xs font-medium group">
                    {p.cta} <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SOCIAL PROOF STRIP ═══ */}
        <section className="py-12 px-4 border-y border-border/50" style={{ background: "hsl(var(--secondary) / 0.3)" }}>
          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { value: "21,000+", label: "Kingdoms to Scout" },
              { value: "34,000+", label: "Quests Available" },
              { value: "183", label: "Skill Territories" },
              { value: "10", label: "Boss Monsters" },
            ].map((s) => (
              <motion.div key={s.label} {...fade()} className="text-center">
                <p className="text-2xl md:text-3xl font-fantasy font-bold" style={{ color: "hsl(var(--filigree-glow))" }}>
                  {s.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
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
