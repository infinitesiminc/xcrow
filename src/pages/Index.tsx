/**
 * Index — Landing page with URL input that navigates to Academy results.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Footer from "@/components/Footer";
import heroImage from "@/assets/og-hero.png";
import { Target, Zap, BarChart3, Globe, Sparkles, Building2 } from "lucide-react";
import CompanyMarquee from "@/components/CompanyMarquee";
import { useAuth } from "@/contexts/AuthContext";

const MARQUEE_ROWS = [
  ["Apple", "Stripe", "OpenAI", "Netflix", "Figma", "Anthropic", "Canva", "Salesforce"],
  ["Datadog", "Notion", "Shopify", "HubSpot", "Snowflake", "Cloudflare", "Twilio", "Zoom"],
];

const VALUE_PROPS = [
  { icon: Globe, title: "One URL Input", desc: "Enter any company website. AI scrapes, analyzes, and maps your ideal customers automatically." },
  { icon: Target, title: "3-Layer ICP Map", desc: "Industry verticals → company segments → buyer personas. Full ICP tree in seconds." },
  { icon: Zap, title: "Instant Lead Pipeline", desc: "Find, enrich, and score prospects directly from your ICP map. No manual research." },
  { icon: BarChart3, title: "Outreach Ready", desc: "AI-drafted emails personalized to each lead. Send directly from the platform." },
];

export default function Index() {
  const { openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [websiteUrl, setWebsiteUrl] = useState("");

  const handleDiscover = (e: React.FormEvent) => {
    e.preventDefault();
    const url = websiteUrl.trim();
    if (!url) return;
    navigate(`/academy?website=${encodeURIComponent(url)}`);
  };

  const handleResearch = () => {
    navigate("/academy");
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
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-start px-4 pt-[48vh] pb-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-3 tracking-tight">
              One Website. Perfect Leads.
            </h1>

            <div className="flex items-center justify-center gap-3 my-4">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-border" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-border" />
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

            <div className="flex items-center gap-3 mt-4">
              <div className="w-12 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="w-12 h-px bg-border" />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-3 gap-2 text-muted-foreground hover:text-foreground"
              onClick={handleResearch}
            >
              <Building2 className="w-4 h-4" />
              Research a Specific Company
            </Button>
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
                className="bg-card border border-border rounded-lg p-5 text-center group hover:shadow-md transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/15 transition-colors">
                  <vp.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5">
                  {vp.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{vp.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom divider */}
        <div className="w-full flex justify-center py-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-24 h-px bg-gradient-to-r from-transparent to-border" />
            <span className="text-xs text-muted-foreground/50 tracking-widest uppercase">
              Forge your pipeline
            </span>
            <div className="w-24 h-px bg-gradient-to-l from-transparent to-border" />
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
