/**
 * Index — Landing page: zero-knowledge outbound lead hunter
 */
import { useState } from "react";
import logoCrow from "@/assets/logo-crow.png";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Footer from "@/components/Footer";
import {
  Globe, Sparkles, ArrowRight, Zap, Target, BarChart3,
  Search, Brain, ListChecks, Send, CheckCircle2, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import CompanyMarquee from "@/components/CompanyMarquee";
import { useAuth } from "@/contexts/AuthContext";

const MARQUEE_ROWS = [
  ["Apple", "Stripe", "OpenAI", "Netflix", "Figma", "Anthropic", "Canva", "Salesforce"],
  ["Datadog", "Notion", "Shopify", "HubSpot", "Snowflake", "Cloudflare", "Twilio", "Zoom"],
];

const STEPS = [
  {
    number: "01",
    icon: Globe,
    title: "Paste your website",
    desc: "AI scrapes your site, maps your products, and understands what you sell — automatically.",
  },
  {
    number: "02",
    icon: Brain,
    title: "AI builds your prospect map",
    desc: "Verticals, company segments, and decision-maker personas — a full targeting tree in seconds.",
  },
  {
    number: "03",
    icon: ListChecks,
    title: "Get scored, verified leads",
    desc: "Real people from Apollo with LinkedIn profiles, fit scores, and recommendation reasons.",
  },
  {
    number: "04",
    icon: Send,
    title: "Draft & send outreach",
    desc: "AI writes personalized emails per lead. Track opens, replies, and manage your pipeline.",
  },
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

export default function Index() {
  const { openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [websiteUrl, setWebsiteUrl] = useState("");

  const handleDiscover = (e: React.FormEvent) => {
    e.preventDefault();
    const url = websiteUrl.trim();
    if (!url) return;
    const domain = url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
    const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    if (!domainPattern.test(domain)) {
      toast.error("Please enter a valid website URL (e.g. company.com)");
      return;
    }
    navigate(`/leadhunter?website=${encodeURIComponent(url)}`);
  };

  return (
    <>
      <SEOHead
        title="Xcrow — The #1 Outbound Lead Hunter"
        description="Enter one website. Get a full prospect map, qualified decision-makers, and outreach-ready leads — in seconds. No GTM expertise required."
        path="/"
      />
      <div className="min-h-screen bg-background flex flex-col">
        {/* ── Hero ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-20 relative">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-primary/[0.04] blur-[100px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center relative z-10 max-w-3xl mx-auto"
          >
            <img src={logoCrow} alt="Xcrow" className="h-16 w-16 object-contain mx-auto mb-5" />

            <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-4">
              Outbound for everyone
            </p>

            <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 tracking-tight leading-[1.08] uppercase">
              One Website.
              <br />
              <span className="text-primary">Perfect Leads.</span>
            </h1>

            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Paste any URL — AI analyzes the company, maps decision-makers, and delivers a scored pipeline with outreach drafts. No sales experience needed.
            </p>

            <form onSubmit={handleDiscover} className="flex gap-3 max-w-lg mx-auto w-full">
              <div className="relative flex-1">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="yourcompany.com"
                  className="pl-10 h-[52px] text-base bg-background border-border shadow-sm"
                />
              </div>
              <Button type="submit" size="lg" className="h-[52px] px-7 gap-2 text-base font-semibold shadow-md" disabled={!websiteUrl.trim()}>
                <Sparkles className="w-4 h-4" />
                Hunt Leads
              </Button>
            </form>

            <p className="text-xs text-muted-foreground/50 mt-4">
              Free to try · No credit card · Results in 60 seconds
            </p>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-full max-w-3xl mx-auto mt-16 relative z-10"
          >
            <p className="text-center text-xs text-muted-foreground/60 mb-4 tracking-widest uppercase font-medium">
              Works with any B2B company
            </p>
            <CompanyMarquee rows={MARQUEE_ROWS} />
          </motion.div>
        </div>

        {/* ── How it works ── */}
        <div className="relative z-10 bg-muted/30">
          <div className="max-w-5xl mx-auto px-4 py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-3 tracking-tight">
                From URL to pipeline in 4 steps
              </h2>
              <p className="text-muted-foreground text-center mb-14 max-w-md mx-auto">
                No spreadsheets. No guesswork. No GTM expertise required.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {STEPS.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="bg-card border border-border rounded-xl p-6 group hover:shadow-lg hover:border-primary/20 transition-all duration-300 relative"
                  >
                    <span className="absolute top-4 right-4 text-3xl font-black text-muted-foreground/10 select-none">
                      {step.number}
                    </span>
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-2 tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Differentiator: Xcrow vs Others ── */}
        <div className="relative z-10">
          <div className="max-w-3xl mx-auto px-4 py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-3 tracking-tight">
                Built different
              </h2>
              <p className="text-muted-foreground text-center mb-12 max-w-md mx-auto">
                Other tools give you a database. Xcrow gives you a strategy.
              </p>

              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[1fr_100px_100px] md:grid-cols-[1fr_120px_120px] items-center px-5 py-3 border-b border-border bg-muted/50">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Feature</span>
                  <span className="text-xs font-bold text-primary text-center uppercase tracking-wider">Xcrow</span>
                  <span className="text-xs font-semibold text-muted-foreground text-center uppercase tracking-wider">Others</span>
                </div>
                {/* Rows */}
                {COMPARISONS.map((row, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-[1fr_100px_100px] md:grid-cols-[1fr_120px_120px] items-center px-5 py-3.5 ${
                      i < COMPARISONS.length - 1 ? "border-b border-border/50" : ""
                    } ${!row.xcrow ? "opacity-60" : ""}`}
                  >
                    <span className="text-sm text-foreground">{row.feature}</span>
                    <div className="flex justify-center">
                      {row.xcrow ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex justify-center">
                      {row.others ? (
                        <CheckCircle2 className="w-5 h-5 text-muted-foreground/60" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground/40" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div className="relative z-10 bg-muted/30">
          <div className="max-w-3xl mx-auto px-4 py-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 tracking-tight">
                Your first leads are one URL away
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Stop guessing who to sell to. Let AI do the research.
              </p>
              <Button
                size="lg"
                className="h-[52px] px-8 gap-2 text-base font-semibold shadow-md"
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>('input[placeholder="yourcompany.com"]');
                  if (input) {
                    input.scrollIntoView({ behavior: "smooth", block: "center" });
                    setTimeout(() => input.focus(), 500);
                  }
                }}
              >
                <ArrowRight className="w-4 h-4" />
                Start Hunting
              </Button>
            </motion.div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
