import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Medal, Award, Star, Shield, CheckCircle, Swords, Timer,
  Brain, Zap, Users, GraduationCap, Map, Share2, Crown, Flame, Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { TERRITORIES } from "@/lib/territory-colors";

/* ── Config ── */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const EVENT_DATE = new Date("2026-06-22T09:00:00-06:00");

/* Curated hero images for the cinematic banner */
const HERO_SKILL_IDS = [
  "complex-threat-modeling",
  "ai-ethics-governance",
  "strategic-narrative-design",
  "predictive-analytics",
  "human-ai-collaboration",
];

/* Battle arena skill images — one per territory */
const ARENA_SKILLS: { id: string; territory: string; name: string }[] = [
  { id: "prompt-engineering", territory: "Technical", name: "Prompt Engineering" },
  { id: "strategic-forecasting-scenario-planning", territory: "Analytical", name: "Scenario Planning" },
  { id: "strategic-ai-orchestration", territory: "Strategic", name: "AI Orchestration" },
  { id: "brand-narrative-development", territory: "Communication", name: "Brand Narrative" },
  { id: "culture-architecting", territory: "Leadership", name: "Culture Architecting" },
  { id: "creative-direction-innovation", territory: "Creative", name: "Creative Direction" },
  { id: "ai-ethics-governance", territory: "Ethics & Compliance", name: "AI Ethics" },
  { id: "emotional-intelligence-empathy", territory: "Human Edge", name: "Emotional Intelligence" },
];

function skillHeroUrl(id: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/sim-images/skill-hero-${id}.png`;
}

/* ── Countdown Hook ── */
function useCountdown(target: Date) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

/* ── Hero Slideshow (inline) ── */
function HeroSlideshow() {
  const [idx, setIdx] = useState(0);
  const [urls, setUrls] = useState<string[]>([]);
  const interval = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const built = HERO_SKILL_IDS.map(skillHeroUrl);
    let loaded = 0;
    const verified: string[] = [];
    built.forEach((url, i) => {
      const img = new Image();
      img.onload = () => { verified[i] = url; loaded++; if (loaded === built.length) setUrls(verified.filter(Boolean)); };
      img.onerror = () => { verified[i] = ""; loaded++; if (loaded === built.length) setUrls(verified.filter(Boolean)); };
      img.src = url;
    });
  }, []);

  useEffect(() => {
    if (urls.length < 2) return;
    interval.current = setInterval(() => setIdx((p) => (p + 1) % urls.length), 5000);
    return () => clearInterval(interval.current);
  }, [urls.length]);

  if (!urls.length) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.div key={idx} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2, ease: "easeInOut" }}>
          <motion.img src={urls[idx]} alt="" className="w-full h-full object-cover" initial={{ scale: 1.05 }} animate={{ scale: 1.15 }} transition={{ duration: 7, ease: "linear" }} />
        </motion.div>
      </AnimatePresence>
      {/* Overlay for text readability */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, hsl(var(--background) / 0.6) 0%, hsl(var(--background) / 0.82) 50%, hsl(var(--background)) 100%)" }} />
      {/* Side vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 40%, hsl(var(--background) / 0.7) 100%)" }} />
    </div>
  );
}

/* ── Animation Helper ── */
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, delay },
});

/* ── Data ── */
const prizes = [
  { place: "1st Place", amount: "$500K", icon: Crown, gradient: "from-yellow-400 to-amber-600", glow: "shadow-[0_0_40px_hsl(38_92%_50%/0.3)]", label: "Grand Champion" },
  { place: "2nd Place", amount: "$250K", icon: Medal, gradient: "from-slate-300 to-slate-400", glow: "shadow-[0_0_30px_hsl(220_10%_70%/0.25)]", label: "Champion" },
  { place: "3rd Place", amount: "$150K", icon: Award, gradient: "from-amber-600 to-orange-700", glow: "shadow-[0_0_30px_hsl(30_80%_50%/0.25)]", label: "Elite" },
  { place: "Top 10", amount: "$10K each", icon: Star, gradient: "from-violet-400 to-purple-600", glow: "shadow-[0_0_25px_hsl(262_83%_58%/0.2)]", label: "Vanguard" },
];

const steps = [
  { icon: GraduationCap, title: "Register", desc: "Sign up with your .edu email. Verify enrollment at any US college or university.", color: "hsl(var(--neon-cyan))" },
  { icon: Swords, title: "Qualify", desc: "Practice on the Xcrow platform. Top performers from each region advance to the championship.", color: "hsl(var(--neon-purple))" },
  { icon: Brain, title: "Compete", desc: "On June 10, face live simulation challenges across all 183 skill territories.", color: "hsl(var(--neon-pink))" },
  { icon: Trophy, title: "Win", desc: "Top competitors claim their share of $1,000,000 in cash prizes.", color: "hsl(var(--warning))" },
];

const battleFormats = [
  { icon: Timer, title: "Timed AI Simulations", desc: "Real-world tasks from actual companies, scored in real-time against the clock.", color: "hsl(var(--neon-cyan))" },
  { icon: Shield, title: "L2 Checkpoint Challenges", desc: "Deep-dive assessments that test judgment, not just speed.", color: "hsl(var(--neon-purple))" },
  { icon: Zap, title: "Boss Battles", desc: "High-stakes scenario challenges where one wrong call eliminates your run.", color: "hsl(var(--neon-pink))" },
];

const stats = [
  { value: "4,176", label: "Universities", icon: GraduationCap },
  { value: "183", label: "Skill Territories", icon: Map },
  { value: "8", label: "Battle Arenas", icon: Flame },
  { value: "$1M", label: "Cash Prizes", icon: Trophy },
];

/* ── Arena Card with image fallback ── */
function ArenaCard({ skill, territory, index }: { skill: typeof ARENA_SKILLS[number]; territory: (typeof TERRITORIES)[number]; index: number }) {
  const [imgStatus, setImgStatus] = useState<"loading" | "loaded" | "error">("loading");
  const cssVar = territory?.cssVar || "primary";

  return (
    <motion.div
      {...fade(index * 0.06)}
      className="group relative rounded-2xl overflow-hidden cursor-pointer"
      style={{
        border: `1px solid hsl(var(--${cssVar}) / 0.3)`,
        boxShadow: `0 0 20px hsl(var(--${cssVar}) / 0.1)`,
      }}
      whileHover={{ scale: 1.03, y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="aspect-[3/4] relative overflow-hidden">
        {/* Gradient fallback — always rendered behind image */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, hsl(var(--background)), hsl(var(--${cssVar}) / 0.2))`,
          }}
        >
          {imgStatus !== "loaded" && (
            <span className="text-5xl sm:text-6xl opacity-60 select-none">{territory?.emoji}</span>
          )}
        </div>

        {imgStatus !== "error" && (
          <img
            src={skillHeroUrl(skill.id)}
            alt={skill.name}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imgStatus === "loaded" ? "opacity-100" : "opacity-0"}`}
            loading="lazy"
            onLoad={() => setImgStatus("loaded")}
            onError={() => setImgStatus("error")}
          />
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.6) 40%, transparent 70%)` }}
        />
        {/* Territory glow edge */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: territory?.hsl || "hsl(var(--primary))" }} />
      </div>

      {/* Label */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-sm">{territory?.emoji}</span>
          <span className="text-[9px] uppercase tracking-[0.15em] font-bold" style={{ color: territory?.hsl }}>{territory?.terrain}</span>
        </div>
        <h3 className="text-sm sm:text-base font-bold leading-tight">{skill.name}</h3>
      </div>
    </motion.div>
  );
}


export default function Competition() {
  const { openAuthModal } = useAuth();
  const { toast } = useToast();
  const countdown = useCountdown(EVENT_DATE);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: "National Xcrow Championship", text: "$1M prize pool for US college students!", url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Share it with your campus." });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 overflow-hidden">
        <HeroSlideshow />

        {/* Extra atmospheric glows */}
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-[250px] h-[250px] rounded-full opacity-60 blur-[100px] pointer-events-none" style={{ background: "hsl(var(--neon-pink) / 0.12)" }} />

        <motion.div {...fade()} className="relative z-10 max-w-3xl mx-auto text-center space-y-7">
          <Badge
            className="text-[10px] tracking-[0.2em] uppercase border-primary/30 px-4 py-1.5"
            style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))", fontFamily: "'Cinzel', serif" }}
          >
            ⚔️ June 10, 2026 · Denver, CO & Virtual
          </Badge>

          <h1
            className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.1]"
            style={{ fontFamily: "'Cinzel', serif", textShadow: "0 0 60px hsl(var(--primary) / 0.25)" }}
          >
            The National<br />Xcrow Championship
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
            All US college students. One day.{" "}
            <span className="font-black text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>$1,000,000</span>{" "}
            in prizes.
          </p>

          {/* Countdown — stone-style boxes */}
          <div className="flex justify-center gap-3 sm:gap-4">
            {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
              <div
                key={unit}
                className="flex flex-col items-center rounded-xl px-4 py-3 min-w-[68px] sm:min-w-[80px]"
                style={{
                  background: "hsl(var(--surface-stone) / 0.6)",
                  border: "1px solid hsl(var(--filigree) / 0.2)",
                  boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))",
                  backdropFilter: "blur(12px)",
                }}
              >
                <span
                  className="text-3xl sm:text-4xl font-black tabular-nums text-primary"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", textShadow: "0 0 20px hsl(var(--primary) / 0.3)" }}
                >
                  {String(countdown[unit]).padStart(2, "0")}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
                  {unit}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              size="lg"
              className="text-base px-10 py-6 gap-2"
              style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.05em", boxShadow: "0 0 30px hsl(var(--primary) / 0.3)" }}
              onClick={() => openAuthModal?.()}
            >
              <Swords className="h-5 w-5" /> Enter the Arena
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 py-6 gap-2"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" /> Tell Your Campus
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════ STATS STRIP ═══════════════ */}
      <section className="relative py-8 overflow-hidden" style={{ background: "hsl(var(--surface-stone) / 0.5)", borderTop: "1px solid hsl(var(--filigree) / 0.15)", borderBottom: "1px solid hsl(var(--filigree) / 0.15)" }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {stats.map((s, i) => (
              <motion.div key={s.label} {...fade(i * 0.08)} className="flex flex-col items-center gap-1">
                <s.icon className="h-5 w-5 text-primary mb-1" />
                <span className="text-xl sm:text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</span>
                <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PRIZE BREAKDOWN ═══════════════ */}
      <section className="py-24 px-4 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[hsl(var(--warning)/0.06)] blur-[150px] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div {...fade()} className="text-center mb-14">
            <Badge className="mb-4 bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.2)] text-[10px] tracking-[0.2em] uppercase">
              💰 Prize Pool
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black" style={{ fontFamily: "'Cinzel', serif" }}>
              $1,000,000
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">The largest cash prize in career-readiness competition history.</p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {prizes.map((p, i) => (
              <motion.div
                key={p.place}
                {...fade(i * 0.1)}
                className={`relative rounded-2xl p-6 text-center ${p.glow}`}
                style={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--filigree) / 0.2)",
                  boxShadow: `inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))`,
                }}
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${p.gradient} text-white mb-3`}>
                  <p.icon className="h-6 w-6" />
                </div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">{p.label}</div>
                <div className="text-2xl sm:text-3xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {p.amount}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{p.place}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ BATTLE ARENAS (skill hero images) ═══════════════ */}
      <section className="py-24 px-4 relative overflow-hidden" style={{ background: "hsl(var(--muted) / 0.3)" }}>
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[400px] h-[600px] rounded-full bg-primary/5 blur-[140px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div {...fade()} className="text-center mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-[10px] tracking-[0.2em] uppercase">
              ⚔️ 8 Territory Arenas
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black" style={{ fontFamily: "'Cinzel', serif" }}>
              Where Champions Are Forged
            </h2>
            <p className="text-muted-foreground mt-2 text-sm max-w-lg mx-auto">
              Compete across every skill territory. Each arena tests a different dimension of AI-era readiness.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {ARENA_SKILLS.map((skill, i) => {
              const territory = TERRITORIES.find((t) => t.category === skill.territory);
              return <ArenaCard key={skill.id} skill={skill} territory={territory!} index={i} />;
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fade()} className="text-center mb-14">
            <Badge className="mb-4 bg-[hsl(var(--neon-cyan)/0.1)] text-[hsl(var(--neon-cyan))] border-[hsl(var(--neon-cyan)/0.2)] text-[10px] tracking-[0.2em] uppercase">
              🗺️ Your Path
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black" style={{ fontFamily: "'Cinzel', serif" }}>
              From Campus to Champion
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                {...fade(i * 0.1)}
                className="relative rounded-2xl p-6 space-y-3"
                style={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--filigree) / 0.18)",
                  boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))",
                }}
              >
                {/* Step number badge */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center h-10 w-10 rounded-xl"
                    style={{ background: `${s.color}20`, color: s.color }}
                  >
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span
                    className="text-xs font-black uppercase tracking-[0.15em]"
                    style={{ color: s.color, fontFamily: "'Cinzel', serif" }}
                  >
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                {/* Connecting line (not on last) */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px" style={{ background: `hsl(var(--filigree) / 0.3)` }} />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ WHAT YOU'LL BATTLE ═══════════════ */}
      <section className="py-24 px-4 relative overflow-hidden" style={{ background: "hsl(var(--muted) / 0.3)" }}>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[hsl(var(--neon-pink)/0.06)] blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div {...fade()} className="text-center mb-14">
            <Badge className="mb-4 bg-[hsl(var(--neon-pink)/0.1)] text-[hsl(var(--neon-pink))] border-[hsl(var(--neon-pink)/0.2)] text-[10px] tracking-[0.2em] uppercase">
              🔥 Battle Formats
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black" style={{ fontFamily: "'Cinzel', serif" }}>
              Not Trivia. Proof of Readiness.
            </h2>
            <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
              Real-world job tasks from actual companies. Speed, judgment, and AI mastery all count.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {battleFormats.map((b, i) => (
              <motion.div
                key={b.title}
                {...fade(i * 0.1)}
                className="rounded-2xl p-6 space-y-4"
                style={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--filigree) / 0.18)",
                  boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))",
                }}
              >
                <div
                  className="flex items-center justify-center h-14 w-14 rounded-2xl"
                  style={{ background: `${b.color}15`, color: b.color }}
                >
                  <b.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ ELIGIBILITY ═══════════════ */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fade()} className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "'Cinzel', serif" }}>
              Eligibility & Rules
            </h2>
          </motion.div>

          <motion.div {...fade(0.1)} className="space-y-3">
            {[
              "Must be currently enrolled at a US college or university",
              "Individual competition — no teams",
              "All 183 skill territories are in play",
              "Qualification period opens May 1, 2026",
              "Must be 18+ to claim prizes",
            ].map((rule) => (
              <div
                key={rule}
                className="flex items-start gap-3 rounded-xl p-4"
                style={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--filigree) / 0.15)",
                  boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))",
                }}
              >
                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{rule}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="py-28 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[180px] pointer-events-none" />

        <motion.div {...fade()} className="relative z-10 max-w-xl mx-auto space-y-6">
          <Target className="h-10 w-10 mx-auto text-primary" />
          <h2 className="text-3xl sm:text-5xl font-black" style={{ fontFamily: "'Cinzel', serif" }}>
            Claim Your Spot
          </h2>
          <p className="text-muted-foreground text-lg">
            Registration is free. The glory is priceless.<br />The cash is very real.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              size="lg"
              className="text-base px-12 py-6 gap-2"
              style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.05em", boxShadow: "0 0 40px hsl(var(--primary) / 0.3)" }}
              onClick={() => openAuthModal?.()}
            >
              <Swords className="h-5 w-5" /> Enter the Arena
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 py-6 gap-2"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" /> Tell Your Campus
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
