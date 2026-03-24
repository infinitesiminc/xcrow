import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, Star, Shield, CheckCircle, Swords, Timer, Brain, Zap, Users, GraduationCap, Map, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const EVENT_DATE = new Date("2026-06-10T09:00:00-06:00");

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

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, delay },
});

const prizes = [
  { place: "1st Place", amount: "$500,000", icon: Trophy, gradient: "from-yellow-400 to-amber-600", ring: "ring-yellow-400/40", bg: "bg-yellow-400/10" },
  { place: "2nd Place", amount: "$250,000", icon: Medal, gradient: "from-slate-300 to-slate-500", ring: "ring-slate-300/40", bg: "bg-slate-300/10" },
  { place: "3rd Place", amount: "$150,000", icon: Award, gradient: "from-amber-600 to-orange-800", ring: "ring-amber-600/40", bg: "bg-amber-600/10" },
  { place: "Top 10", amount: "$10,000 each", icon: Star, gradient: "from-violet-400 to-purple-600", ring: "ring-violet-400/40", bg: "bg-violet-400/10" },
];

const steps = [
  { icon: GraduationCap, title: "Register", desc: "Sign up with your .edu email. Verify enrollment at any US college or university." },
  { icon: Swords, title: "Qualify", desc: "Practice on the Xcrow platform. Top performers from each region advance to the championship." },
  { icon: Brain, title: "Compete", desc: "On June 10, face live simulation challenges across all 183 skill territories. Speed, accuracy, and AI-tool mastery count." },
  { icon: Trophy, title: "Win", desc: "Top competitors take home their share of $1,000,000 in cash prizes." },
];

const battleFormats = [
  { icon: Timer, title: "Timed AI Simulations", desc: "Real-world tasks from actual companies, scored in real-time against the clock." },
  { icon: Shield, title: "L2 Checkpoint Challenges", desc: "Deep-dive assessments that test judgment, not just speed." },
  { icon: Zap, title: "Boss Battles", desc: "High-stakes scenario challenges where one wrong call eliminates your run." },
];

const stats = [
  { value: "4,176", label: "Universities analyzed", icon: GraduationCap },
  { value: "183", label: "Skill territories", icon: Map },
  { value: "50,000+", label: "Students eligible", icon: Users },
];

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
      {/* ── Hero ── */}
      <section className="relative pt-28 pb-20 px-4 text-center overflow-hidden">
        {/* Atmospheric glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[160px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[hsl(var(--neon-pink)/0.08)] blur-[120px] pointer-events-none" />

        <motion.div {...fade()} className="relative z-10 max-w-3xl mx-auto space-y-6">
          <Badge className="bg-primary/15 text-primary border-primary/20 text-xs tracking-widest uppercase">
            June 10, 2026 · Denver, CO & Virtual
          </Badge>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            The National Xcrow Championship
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
            All US college students. One day. <span className="text-primary font-bold">$1,000,000</span> in prizes.
          </p>

          {/* Countdown */}
          <div className="flex justify-center gap-3 sm:gap-5">
            {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
              <div key={unit} className="flex flex-col items-center">
                <span
                  className="text-3xl sm:text-5xl font-black tabular-nums text-primary"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {String(countdown[unit]).padStart(2, "0")}
                </span>
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground mt-1">
                  {unit}
                </span>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            className="text-base px-10 py-6"
            style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.05em" }}
            onClick={() => openAuthModal?.()}
          >
            Register Now
          </Button>
        </motion.div>
      </section>

      {/* ── Prize Breakdown ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.h2 {...fade()} className="text-3xl sm:text-4xl font-bold text-center mb-4" style={{ fontFamily: "'Cinzel', serif" }}>
            $1,000,000 Prize Pool
          </motion.h2>
          <motion.p {...fade(0.1)} className="text-muted-foreground text-center mb-12 max-w-md mx-auto">
            The largest cash prize in career-readiness competition history.
          </motion.p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {prizes.map((p, i) => (
              <motion.div
                key={p.place}
                {...fade(i * 0.1)}
                className={`relative rounded-2xl border border-border/50 p-6 text-center ${p.bg} ring-1 ${p.ring} backdrop-blur-sm`}
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${p.gradient} text-white mb-4`}>
                  <p.icon className="h-6 w-6" />
                </div>
                <div className="text-2xl sm:text-3xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {p.amount}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{p.place}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 px-4" style={{ background: "hsl(var(--muted) / 0.4)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.h2 {...fade()} className="text-3xl sm:text-4xl font-bold text-center mb-12" style={{ fontFamily: "'Cinzel', serif" }}>
            How It Works
          </motion.h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div key={s.title} {...fade(i * 0.1)} className="relative rounded-2xl border border-border/50 bg-card p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Step {i + 1}</span>
                </div>
                <h3 className="text-lg font-bold">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Eligibility ── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.h2 {...fade()} className="text-3xl sm:text-4xl font-bold text-center mb-10" style={{ fontFamily: "'Cinzel', serif" }}>
            Eligibility & Rules
          </motion.h2>

          <motion.div {...fade(0.1)} className="space-y-4">
            {[
              "Must be currently enrolled at a US college or university",
              "Individual competition — no teams",
              "All 183 skill territories are in play",
              "Qualification period opens May 1, 2026",
              "Must be 18+ to claim prizes",
            ].map((rule) => (
              <div key={rule} className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-4">
                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{rule}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── What You'll Battle ── */}
      <section className="py-20 px-4" style={{ background: "hsl(var(--muted) / 0.4)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.h2 {...fade()} className="text-3xl sm:text-4xl font-bold text-center mb-4" style={{ fontFamily: "'Cinzel', serif" }}>
            What You'll Battle
          </motion.h2>
          <motion.p {...fade(0.1)} className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
            Real-world job tasks from actual companies. Not trivia — proof of readiness.
          </motion.p>

          <div className="grid md:grid-cols-3 gap-6">
            {battleFormats.map((b, i) => (
              <motion.div key={b.title} {...fade(i * 0.1)} className="rounded-2xl border border-border/50 bg-card p-6 space-y-3">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary">
                  <b.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof Strip ── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-6 text-center">
            {stats.map((s, i) => (
              <motion.div key={s.label} {...fade(i * 0.1)} className="space-y-2">
                <s.icon className="h-6 w-6 mx-auto text-primary" />
                <div className="text-2xl sm:text-3xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
          <motion.p {...fade(0.3)} className="text-center text-muted-foreground mt-8 text-sm">
            Your university could be represented. Will you put it on the map?
          </motion.p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
        <motion.div {...fade()} className="relative z-10 max-w-xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
            Claim Your Spot
          </h2>
          <p className="text-muted-foreground">
            Registration is free. The glory is priceless. The cash is very real.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="text-base px-10 py-6"
              style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.05em" }}
              onClick={() => openAuthModal?.()}
            >
              Register Now
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
