/**
 * Index — Landing page with Gong-inspired bold design
 */
import { useState } from "react";
import logoCrow from "@/assets/logo-crow.png";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Footer from "@/components/Footer";
import { Globe, Sparkles, ArrowRight, Zap, Target, BarChart3, Users } from "lucide-react";
import { toast } from "sonner";
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
    // Strip protocol and validate domain format
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
        title="Xcrow — Find Hyper-Accurate Leads From a Single Website"
        description="The only lead hunter that turns one website into a full pipeline. Enter your URL — AI finds, qualifies, and delivers your perfect prospects in seconds."
        path="/"
      />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-16 relative">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-primary/[0.04] blur-[100px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center relative z-10 max-w-3xl mx-auto"
          >
            <img src={logoCrow} alt="Xcrow" className="h-16 w-16 object-contain mx-auto mb-4" />

            <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-5 tracking-tight leading-[1.1] uppercase">
              The <span className="text-primary">#1</span> AI Lead Hunter
              <br />
              <span className="text-foreground/80">for Revenue Teams</span>
            </h1>

            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Enter one website. Get a full ICP map, qualified decision-makers, and outreach-ready leads — in seconds.
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
              <Button type="submit" size="lg" className="h-13 px-7 gap-2 text-base font-semibold shadow-md" disabled={!websiteUrl.trim()}>
                <Sparkles className="w-4 h-4" />
                Hunt Leads
              </Button>
            </form>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-full max-w-3xl mx-auto mt-16 relative z-10"
          >
            <p className="text-center text-xs text-muted-foreground/60 mb-4 tracking-widest uppercase font-medium">
              Trusted across 3,700+ companies
            </p>
            <CompanyMarquee rows={MARQUEE_ROWS} />
          </motion.div>
        </div>

        {/* Value Props */}
        <div className="relative z-10 bg-muted/30">
          <div className="max-w-5xl mx-auto px-4 py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-3 tracking-tight">
                How it works
              </h2>
              <p className="text-muted-foreground text-center mb-12 max-w-md mx-auto">
                From URL to qualified pipeline in under 60 seconds.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {VALUE_PROPS.map((vp, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-xl p-6 group hover:shadow-lg hover:border-primary/20 transition-all duration-300"
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                      <vp.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-2 tracking-tight">
                      {vp.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{vp.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
