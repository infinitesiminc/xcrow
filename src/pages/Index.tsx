/**
 * Index — Product picker: Upskill / Founder / Leadgen
 * Dark Fantasy RPG homepage with immersive stone-panel aesthetic.
 */
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import xcrowLogo from "@/assets/xcrow-logo.webp";
import heroImage from "@/assets/og-hero.png";
import { Map, Rocket, Target, ArrowRight, Sword, Shield, Flame } from "lucide-react";
import { useEffect, useRef } from "react";

const PRODUCTS = [
  {
    id: "upskill",
    name: "Xcrow Upskill",
    tagline: "Master 183 AI skills. Conquer every territory.",
    description:
      "AI-powered skill gap analysis, gamified quests, and territory conquest. Built for students and professionals navigating the AI economy.",
    icon: Sword,
    route: "/upskill",
    cta: "Begin Your Mission",
    glowHsl: "152 60% 45%",
    accentClass: "text-emerald-400",
    borderGlow: "hover:shadow-[0_0_30px_-5px_hsl(152_60%_45%/0.4)]",
  },
  {
    id: "founder",
    name: "Xcrow Founder",
    tagline: "One prompt. One founder. Ship an AI venture.",
    description:
      "Discover high-potential niches scored by AI agent disruption potential, then generate a complete builder spec to launch your venture.",
    icon: Flame,
    route: "/founder",
    cta: "Scout Opportunities",
    glowHsl: "262 83% 58%",
    accentClass: "text-violet-400",
    borderGlow: "hover:shadow-[0_0_30px_-5px_hsl(262_83%_58%/0.4)]",
  },
  {
    id: "leadgen",
    name: "Xcrow Leadgen",
    tagline: "AI agents that hunt your next customer.",
    description:
      "Autonomous agents discover, qualify, and reach out to high-intent prospects — filling your pipeline while you focus on closing.",
    icon: Shield,
    route: "/leadgen",
    cta: "Get Early Access",
    glowHsl: "38 92% 50%",
    accentClass: "text-amber-400",
    borderGlow: "hover:shadow-[0_0_30px_-5px_hsl(38_92%_50%/0.4)]",
  },
];

/* ── tiny ember particles ── */
function EmberCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
    };
    resize();
    window.addEventListener("resize", resize);
    const embers: { x: number; y: number; vy: number; vx: number; life: number; max: number; size: number }[] = [];
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (embers.length < 40 && Math.random() < 0.3) {
        embers.push({
          x: Math.random() * canvas.width,
          y: canvas.height + 10,
          vy: -(0.3 + Math.random() * 0.8),
          vx: (Math.random() - 0.5) * 0.4,
          life: 0,
          max: 120 + Math.random() * 180,
          size: 1.5 + Math.random() * 2,
        });
      }
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.x += e.vx;
        e.y += e.vy;
        e.life++;
        if (e.life > e.max) { embers.splice(i, 1); continue; }
        const alpha = 1 - e.life / e.max;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(30, 90%, 55%, ${alpha * 0.6})`;
        ctx.fill();
        // glow
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(30, 90%, 55%, ${alpha * 0.08})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

export default function Index() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Xcrow — AI Skills, Startups & Lead Generation"
        description="Three products. One platform. Master AI skills, launch AI-native startups, or let AI agents find your next customer."
        path="/"
      />
      <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        {/* Hero background image */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt=""
            className="w-full h-[75%] object-cover object-top"
            style={{ opacity: 1 }}
            draggable={false}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, 
                transparent 0%, 
                hsl(var(--background) / 0.2) 25%, 
                hsl(var(--background) / 0.7) 50%, 
                hsl(var(--background)) 70%)`,
            }}
          />
        </div>

        {/* Ambient background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-[hsl(262_83%_58%/0.06)] blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] rounded-full bg-[hsl(38_55%_45%/0.04)] blur-[100px]" />
        </div>

        {/* Ember particles */}
        <EmberCanvas />

        {/* Top filigree line */}
        <div className="rpg-filigree-top" />

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-start px-4 pt-[38vh] pb-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h1
              className="text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-wide"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Choose Your Path
            </h1>

            {/* Ornamental divider */}
            <div className="flex items-center justify-center gap-3 my-4">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-[hsl(var(--filigree)/0.5)]" />
              <div className="w-2 h-2 rotate-45 border border-[hsl(var(--filigree)/0.5)] bg-[hsl(var(--filigree)/0.15)]" />
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-[hsl(var(--filigree)/0.5)]" />
            </div>

            <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
              Three weapons forged for the AI economy. Pick the one that fits your quest.
            </p>
          </motion.div>

          {/* Product Cards — RPG Stone Panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl w-full">
            {PRODUCTS.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.12, duration: 0.6, ease: "easeOut" }}
                className="h-full"
              >
                <div
                  onClick={() => navigate(p.route)}
                  className={`rpg-panel rpg-filigree-top cursor-pointer transition-all duration-300 h-full flex flex-col rounded-lg p-6 group ${p.borderGlow}`}
                >
                  {/* Icon with territory glow */}
                  <div className="relative w-14 h-14 mb-5">
                    <div
                      className="absolute inset-0 rounded-lg blur-md opacity-30 group-hover:opacity-60 transition-opacity"
                      style={{ background: `hsl(${p.glowHsl})` }}
                    />
                    <div className="relative w-14 h-14 rpg-card flex items-center justify-center">
                      <p.icon className={`w-6 h-6 ${p.accentClass}`} />
                    </div>
                  </div>

                  <h2
                    className="text-lg font-bold text-foreground mb-1"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {p.name}
                  </h2>
                  <p className={`text-sm font-medium ${p.accentClass} mb-3`}>{p.tagline}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-6">
                    {p.description}
                  </p>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 w-full mt-auto border-[hsl(var(--filigree)/0.3)] hover:border-[hsl(var(--filigree)/0.6)] hover:bg-[hsl(var(--filigree)/0.08)] transition-all"
                  >
                    {p.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom filigree */}
        <div className="w-full flex justify-center py-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-24 h-px bg-gradient-to-r from-transparent to-[hsl(var(--filigree)/0.3)]" />
            <span className="text-[10px] text-[hsl(var(--filigree)/0.5)] tracking-[0.3em] uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
              Forge your future
            </span>
            <div className="w-24 h-px bg-gradient-to-l from-transparent to-[hsl(var(--filigree)/0.3)]" />
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
