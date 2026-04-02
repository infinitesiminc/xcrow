/**
 * Index — Leadgen-focused landing page with URL input + logo marquee.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Footer from "@/components/Footer";
import heroImage from "@/assets/og-hero.png";
import { ArrowRight, Target, Zap, Users, BarChart3, Globe, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import CompanyMarquee from "@/components/CompanyMarquee";

const MARQUEE_ROWS = [
  ["Apple", "Stripe", "OpenAI", "Netflix", "Figma", "Anthropic", "Canva", "Salesforce"],
  ["Datadog", "Notion", "Shopify", "HubSpot", "Snowflake", "Cloudflare", "Twilio", "Zoom"],
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

const VALUE_PROPS = [
  { icon: Target, title: "One URL, Full Profile", desc: "Drop in any website — we instantly map your ideal buyers, verticals, and personas." },
  { icon: Users, title: "AI Lead Discovery", desc: "Autonomous agents find, qualify, and enrich prospects that actually match your business." },
  { icon: Zap, title: "Instant Outreach", desc: "Generate personalized email sequences and export pipeline-ready lead lists in seconds." },
  { icon: BarChart3, title: "Pipeline Intelligence", desc: "Track lead status, outreach history, and conversion metrics across every niche." },
];

export default function Index() {
  const navigate = useNavigate();
  const [websiteUrl, setWebsiteUrl] = useState("");

  const handleDiscover = (e: React.FormEvent) => {
    e.preventDefault();
    const url = websiteUrl.trim();
    if (!url) return;
    navigate(`/leadgen?website=${encodeURIComponent(url)}`);
  };

  return (
    <>
      <SEOHead
        title="Xcrow — Find Hyper-Accurate Leads From a Single Website"
        description="The only lead hunter that turns one website into a full pipeline. Enter your URL — AI finds, qualifies, and delivers your perfect prospects in seconds."
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
                transparent 40%,
                hsl(var(--background) / 0.4) 55%, 
                hsl(var(--background) / 0.85) 68%, 
                hsl(var(--background)) 78%)`,
            }}
          />
        </div>

        {/* Ambient background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-[hsl(38_55%_45%/0.08)] blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] rounded-full bg-[hsl(262_83%_58%/0.04)] blur-[100px]" />
        </div>

        <EmberCanvas />
        <div className="rpg-filigree-top" />

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-start px-4 pt-[48vh] pb-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1
              className="text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-wide"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              One Website. Perfect Leads.
            </h1>

            <div className="flex items-center justify-center gap-3 my-4">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-[hsl(var(--filigree)/0.5)]" />
              <div className="w-2 h-2 rotate-45 border border-[hsl(var(--filigree)/0.5)] bg-[hsl(var(--filigree)/0.15)]" />
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-[hsl(var(--filigree)/0.5)]" />
            </div>

            <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto mb-8">
              The only lead hunter that finds hyper-accurate prospects from a single website entry. Drop your URL — AI does the rest.
            </p>

            <form onSubmit={handleDiscover} className="flex gap-2 max-w-md mx-auto w-full">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="yourcompany.com"
                  className="pl-9 h-12 text-sm bg-card/80 border-border/60 backdrop-blur"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-6 gap-2" disabled={!websiteUrl.trim()}>
                <Sparkles className="w-4 h-4" />
                Hunt Leads
              </Button>
            </form>
          </motion.div>

          {/* Logo Marquee Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="w-full max-w-4xl mx-auto"
          >
            <p className="text-center text-xs text-muted-foreground/70 mb-3 tracking-wide uppercase">
              Trusted across 3,700+ companies worldwide
            </p>
            <CompanyMarquee rows={MARQUEE_ROWS} />
          </motion.div>

          {/* Value Props */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl w-full mt-16"
          >
            {VALUE_PROPS.map((vp, i) => (
              <div
                key={i}
                className="rpg-panel p-5 rounded-lg text-center group hover:shadow-[0_0_20px_-5px_hsl(38_92%_50%/0.2)] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                  <vp.icon className="w-5 h-5 text-primary" />
                </div>
                <h3
                  className="text-sm font-bold text-foreground mb-1.5"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {vp.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{vp.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom filigree */}
        <div className="w-full flex justify-center py-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-24 h-px bg-gradient-to-r from-transparent to-[hsl(var(--filigree)/0.3)]" />
            <span className="text-[10px] text-[hsl(var(--filigree)/0.5)] tracking-[0.3em] uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
              Forge your pipeline
            </span>
            <div className="w-24 h-px bg-gradient-to-l from-transparent to-[hsl(var(--filigree)/0.3)]" />
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
