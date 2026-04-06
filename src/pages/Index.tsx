/**
 * Index — Gong-inspired landing page for Xcrow Lead Hunter
 */
import { useState, useRef } from "react";
import logoCrow from "@/assets/logo-crow.png";
import WebsiteToLeadsVisual from "@/components/home/WebsiteToLeadsVisual";
import TargetingControlsVisual from "@/components/home/TargetingControlsVisual";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import Footer from "@/components/Footer";
import {
  Globe, Sparkles, ArrowRight,
  Search, Brain, ListChecks, Send,
  CheckCircle2, XCircle, Zap, Shield, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import CompanyMarquee from "@/components/CompanyMarquee";
import { useAuth } from "@/contexts/AuthContext";

/* ── data ── */
const MARQUEE_ROWS = [
  ["Apple", "Stripe", "OpenAI", "Netflix", "Figma", "Anthropic", "Canva", "Salesforce"],
  ["Datadog", "Notion", "Shopify", "HubSpot", "Snowflake", "Cloudflare", "Twilio", "Zoom"],
];

const STEPS = [
  { icon: Globe, title: "Paste a website", desc: "Drop any company URL. Our AI scrapes and analyzes the business in seconds." },
  { icon: Brain, title: "AI maps your prospects", desc: "Verticals, personas, and decision-makers — an entire targeting tree, automatically." },
  { icon: ListChecks, title: "Get scored leads", desc: "Real people with verified LinkedIn profiles, fit scores, and recommendation reasons." },
  { icon: Send, title: "Send outreach", desc: "Personalized emails drafted per lead. Track opens, replies, and manage your pipeline." },
];

const STATS = [
  { value: "60s", label: "From URL to leads" },
  { value: "0", label: "GTM expertise needed" },
  { value: "100%", label: "Verified profiles" },
];

const COMPARISONS = [
  { feature: "Zero GTM knowledge needed", xcrow: true, others: false },
  { feature: "One URL → full prospect map", xcrow: true, others: false },
  { feature: "AI-analyzed company DNA", xcrow: true, others: false },
  { feature: "Verified LinkedIn profiles", xcrow: true, others: true },
  { feature: "Per-lead fit score + reason", xcrow: true, others: false },
  { feature: "Built-in outreach drafts", xcrow: true, others: false },
  { feature: "Massive contact database", xcrow: false, others: true },
  { feature: "Complex workflow builder", xcrow: false, others: true },
];

const VALUE_PROPS = [
  { icon: Zap, title: "Instant pipeline", desc: "No manual research. AI builds your entire prospect list from a single URL." },
  { icon: Shield, title: "Verified data only", desc: "Every lead comes from Apollo with real LinkedIn profiles — zero hallucinated contacts." },
  { icon: BarChart3, title: "Smart scoring", desc: "AI scores each lead on fit, seniority, and buying signals so you focus on the best." },
];

/* ── animation helpers ── */
const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: EASE },
});

const fadeInView = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" as const },
  transition: { duration: 0.6, delay, ease: EASE },
});

export default function Index() {
  const { openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [websiteUrl, setWebsiteUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDiscover = (e: React.FormEvent) => {
    e.preventDefault();
    const url = websiteUrl.trim();
    if (!url) return;
    const domain = url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
    const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    if (!domainPattern.test(domain)) {
      toast.error("Enter a valid website URL (e.g. company.com)");
      return;
    }
    navigate(`/leadhunter?website=${encodeURIComponent(url)}`);
  };

  const scrollToInput = () => {
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => inputRef.current?.focus(), 500);
  };

  return (
    <>
      <SEOHead
        title="Xcrow — The #1 Outbound Lead Hunter"
        description="Enter one website. Get a full prospect map, qualified decision-makers, and outreach-ready leads — in seconds. No GTM expertise required."
        path="/"
      />

      

      <div className="min-h-screen bg-background flex flex-col">

        {/* ═══════════════════════════════════════════
            HERO — big, bold, Gong-style
        ═══════════════════════════════════════════ */}
        <section className="relative overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] rounded-full bg-primary/[0.03] blur-[120px]" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full bg-primary/[0.02] blur-[100px]" />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-24">
            <div className="text-center max-w-4xl mx-auto">

              {/* Eyebrow */}
              <motion.p
                {...fadeUp(0)}
                className="text-primary text-sm font-semibold tracking-[0.2em] uppercase mb-6"
              >
                The #1 Outbound Lead Hunter
              </motion.p>

              {/* Headline — Gong style: big uppercase with accent color */}
              <motion.h1
                {...fadeUp(0.1)}
                className="text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] font-extrabold text-foreground leading-[1.05] tracking-[-0.02em] uppercase mb-6"
              >
                One Website.
                <br />
                <span className="text-primary">Perfect Leads.</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                {...fadeUp(0.2)}
                className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
              >
                Paste any company URL — AI analyzes the business, maps decision-makers,
                and delivers a scored pipeline with outreach drafts. No sales experience needed.
              </motion.p>

              {/* CTA Input */}
              <motion.form
                {...fadeUp(0.3)}
                onSubmit={handleDiscover}
                className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto w-full"
              >
                <div className="relative flex-1">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                  <Input
                    ref={inputRef}
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="company.com"
                    className="pl-12 h-14 text-base bg-background border-border shadow-sm rounded-xl"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-14 px-8 gap-2.5 text-base font-bold shadow-lg rounded-xl"
                  disabled={!websiteUrl.trim()}
                >
                  <Sparkles className="w-5 h-5" />
                  Hunt Leads
                </Button>
              </motion.form>

              <motion.p {...fadeUp(0.4)} className="text-sm text-muted-foreground/50 mt-5">
                Free to start · No credit card · Results in 60 seconds
              </motion.p>
            </div>

            {/* Stats row */}
            <motion.div
              {...fadeUp(0.5)}
              className="flex justify-center gap-12 sm:gap-20 mt-16"
            >
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══ Social proof marquee ═══ */}
        <section className="border-y border-border/40 bg-muted/20 py-8">
          <motion.div {...fadeInView()} className="max-w-5xl mx-auto px-4">
            <p className="text-center text-xs text-muted-foreground/60 tracking-[0.2em] uppercase font-medium mb-5">
              Works with any B2B company
            </p>
            <CompanyMarquee rows={MARQUEE_ROWS} />
          </motion.div>
        </section>

        {/* ═══ Visual 1: Website → Leads pipeline ═══ */}
        <WebsiteToLeadsVisual />

        {/* ═══ Visual 2: Targeting controls ═══ */}
        <TargetingControlsVisual />

        {/* ═══ Value props — 3 columns ═══ */}
        <section className="py-20 sm:py-28">
            <motion.div {...fadeInView()} className="text-center mb-16">
              <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase mb-4">
                Why Xcrow
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight uppercase">
                Outbound Without the Overhead
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {VALUE_PROPS.map((vp, i) => (
                <motion.div
                  key={i}
                  {...fadeInView(i * 0.1)}
                  className="text-center px-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <vp.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 tracking-tight">
                    {vp.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{vp.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ How it works — numbered steps ═══ */}
        <section className="bg-muted/30 py-20 sm:py-28">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <motion.div {...fadeInView()} className="text-center mb-16">
              <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase mb-4">
                How it works
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight uppercase">
                From URL to Pipeline in 4 Steps
              </h2>
              <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
                No spreadsheets. No guesswork. No GTM expertise required.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  {...fadeInView(i * 0.1)}
                  className="relative bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group"
                >
                  {/* Step number */}
                  <span className="absolute top-5 right-5 text-4xl font-black text-primary/[0.07] select-none leading-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2 tracking-tight">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Comparison table ═══ */}
        <section className="py-20 sm:py-28">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <motion.div {...fadeInView()} className="text-center mb-14">
              <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase mb-4">
                Xcrow vs. the rest
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight uppercase">
                Built Different
              </h2>
              <p className="text-muted-foreground mt-4 max-w-md mx-auto">
                Other tools give you a database. Xcrow gives you a strategy.
              </p>
            </motion.div>

            <motion.div {...fadeInView(0.1)} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              {/* Header */}
              <div className="grid grid-cols-[1fr_100px_100px] sm:grid-cols-[1fr_120px_120px] items-center px-6 py-4 border-b border-border bg-muted/40">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em]">Feature</span>
                <span className="text-xs font-bold text-primary text-center uppercase tracking-[0.1em]">Xcrow</span>
                <span className="text-xs font-bold text-muted-foreground text-center uppercase tracking-[0.1em]">Others</span>
              </div>
              {COMPARISONS.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[1fr_100px_100px] sm:grid-cols-[1fr_120px_120px] items-center px-6 py-4 ${
                    i < COMPARISONS.length - 1 ? "border-b border-border/40" : ""
                  } ${!row.xcrow ? "opacity-50" : ""}`}
                >
                  <span className="text-sm text-foreground font-medium">{row.feature}</span>
                  <div className="flex justify-center">
                    {row.xcrow ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <XCircle className="w-5 h-5 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex justify-center">
                    {row.others ? (
                      <CheckCircle2 className="w-5 h-5 text-muted-foreground/50" />
                    ) : (
                      <XCircle className="w-5 h-5 text-muted-foreground/30" />
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══ Bottom CTA ═══ */}
        <section className="bg-primary/[0.04] border-t border-primary/10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-24 text-center">
            <motion.div {...fadeInView()}>
              <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase mb-4">
                Ready?
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight uppercase mb-5">
                Your First Leads Are
                <br />
                <span className="text-primary">One URL Away</span>
              </h2>
              <p className="text-muted-foreground mb-10 max-w-md mx-auto text-lg">
                Stop guessing who to sell to. Let AI do the research.
              </p>
              <Button
                size="lg"
                className="h-14 px-10 gap-2.5 text-base font-bold shadow-lg rounded-xl"
                onClick={scrollToInput}
              >
                <ArrowRight className="w-5 h-5" />
                Start Hunting — It's Free
              </Button>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
