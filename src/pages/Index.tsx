/**
 * Index — Gong-inspired landing page for Xcrow Lead Gen
 */
import { useState, useRef, useEffect } from "react";
import logoCrow from "@/assets/logo-crow.png";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import Footer from "@/components/Footer";
import apolloComplexUi from "@/assets/apollo-complex-ui.png";
import {
  Globe, ArrowRight,
  CheckCircle2, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import CompanyMarquee from "@/components/CompanyMarquee";
import { useAuth } from "@/contexts/AuthContext";

/* ── data ── */
const MARQUEE_ROWS = [
  ["Apple", "Stripe", "OpenAI", "Netflix", "Figma", "Anthropic", "Canva", "Salesforce"],
  ["Datadog", "Notion", "Shopify", "HubSpot", "Snowflake", "Cloudflare", "Twilio", "Zoom"],
];

const STATS = [
  { value: "$49", label: "vs. $120+ on LinkedIn" },
  { value: "500", label: "Leads with emails" },
  { value: "10s", label: "To your first lead" },
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
  const { openAuthModal, user } = useAuth();
  const navigate = useNavigate();
  const [websiteUrl, setWebsiteUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // After login, check for a pending URL and navigate
  useEffect(() => {
    if (user) {
      const pending = sessionStorage.getItem("xcrow_pending_url");
      if (pending) {
        sessionStorage.removeItem("xcrow_pending_url");
        navigate(`/leadgen?website=${encodeURIComponent(pending)}`);
      }
    }
  }, [user, navigate]);

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
    if (!user) {
      sessionStorage.setItem("xcrow_pending_url", url);
      openAuthModal();
      return;
    }
    navigate(`/leadgen?website=${encodeURIComponent(url)}`);
  };

  const scrollToInput = () => {
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => inputRef.current?.focus(), 500);
  };

  return (
    <>
      <SEOHead
        title="Xcrow — The $49 Sales Team"
        description="Paste a URL. Get 5 ready-to-email decision-makers in 10 seconds. Apollo charges $99 for complexity. LinkedIn charges $120 for 50 InMails. We charge $49 for 500 leads with emails."
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
                THE $49 SALES TEAM
              </motion.p>

              {/* Headline */}
              <motion.h1
                {...fadeUp(0.1)}
                className="text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] font-extrabold text-foreground leading-[1.05] tracking-[-0.02em] uppercase mb-6"
              >
                Paste a URL.
                <br />
                <span className="text-primary">Skip the SDR.</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                {...fadeUp(0.2)}
                className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
              >
                Other tools give you a database and say <span className="text-foreground font-semibold">"figure it out."</span>
                <br />
                We give you <span className="text-primary font-semibold">5 ready-to-email decision-makers in 10 seconds.</span>
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
                <div className="relative group w-full sm:w-auto">
                  {/* Animated glow border */}
                  <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-primary/60 via-primary/30 to-primary/60 opacity-70 blur-[3px] group-hover:opacity-100 group-hover:blur-[5px] transition-all duration-500 animate-[glow-shift_3s_ease-in-out_infinite]" />
                  <Button
                    type="submit"
                    size="lg"
                    className="relative w-full sm:w-auto h-14 px-8 gap-2.5 text-base font-bold rounded-xl shadow-lg"
                    disabled={!websiteUrl.trim()}
                  >
                    <img src={logoCrow} alt="" className="w-6 h-6 object-contain brightness-0 invert" />
                    Hunt Leads
                  </Button>
                </div>
              </motion.form>

              <motion.p {...fadeUp(0.4)} className="text-sm text-muted-foreground/50 mt-5">
                Free to start · No credit card · No sales expertise needed
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


        <section className="py-20 sm:py-28">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <motion.div {...fadeInView()} className="text-center mb-14">
              <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase mb-4">
                Xcrow vs. Apollo
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight uppercase">
                240 Million Contacts.<br /><span className="text-primary">Good Luck Finding 5 That Matter.</span>
              </h2>
              <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
                Apollo gives you a database the size of a phonebook and charges you $99/mo to search it yourself.
                We give you the <span className="text-foreground font-semibold">right people, ready to email, in 10 seconds</span>.
              </p>
            </motion.div>

            <motion.div {...fadeInView(0.1)} className="grid md:grid-cols-2 gap-8 items-start">
              {/* Apollo side */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em] bg-muted px-3 py-1 rounded-full">Apollo.io</span>
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-border shadow-lg">
                  <img
                    src={apolloComplexUi}
                    alt="Apollo.io complex filter interface with dozens of options"
                    className="w-full"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-sm font-bold text-foreground">15+ filters. Dozens of menus. Workflow builders.</p>
                    <p className="text-xs text-muted-foreground mt-1">You need GTM expertise just to get started.</p>
                  </div>
                </div>
                 <ul className="space-y-2 text-sm text-muted-foreground pl-1">
                  <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive/60 shrink-0" /> $99/mo and you still do all the work</li>
                  <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive/60 shrink-0" /> 15+ filters you need GTM training to use</li>
                  <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive/60 shrink-0" /> No fit scoring — just raw contact dumps</li>
                  <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive/60 shrink-0" /> Need an SDR just to operate the tool</li>
                </ul>
              </div>

              {/* Xcrow side */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-[0.1em] bg-primary/10 px-3 py-1 rounded-full">Xcrow</span>
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-primary/20 shadow-lg bg-card p-8 flex flex-col items-center justify-center min-h-[320px]">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <img src={logoCrow} alt="" className="w-10 h-10 object-contain" />
                  </div>
                  <p className="text-2xl font-extrabold text-foreground mb-2 text-center tracking-tight">Paste one URL.</p>
                  <p className="text-2xl font-extrabold text-primary mb-4 text-center tracking-tight">Get perfect leads.</p>
                  <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3 w-full max-w-xs">
                    <Globe className="w-4 h-4 text-muted-foreground/60" />
                    <span className="text-sm text-muted-foreground">company.com</span>
                    <ArrowRight className="w-4 h-4 text-primary ml-auto" />
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-foreground pl-1">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Paste a URL. That's the whole process.</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> AI finds your market, you don't</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Every lead scored + email drafted</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> $49/mo. No SDR salary required.</li>
                </ul>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══ LinkedIn Sales Navigator comparison ═══ */}
        <section className="bg-muted/30 py-20 sm:py-28">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <motion.div {...fadeInView()} className="text-center mb-14">
              <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase mb-4">
                Xcrow vs. LinkedIn Sales Navigator
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight uppercase">
                $120/mo for 50 InMails.<br /><span className="text-primary">$49/mo for 500 Leads With Emails.</span>
              </h2>
              <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
                LinkedIn charges you <span className="text-foreground font-semibold">$2.40 per InMail</span> that might get ignored.
                We give you <span className="text-primary font-semibold">direct email addresses</span> you own forever.
              </p>
            </motion.div>

            <motion.div {...fadeInView(0.1)} className="grid md:grid-cols-2 gap-8 items-start">
              {/* LinkedIn side */}
              <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em] bg-muted px-3 py-1 rounded-full">LinkedIn Sales Navigator</span>
                </div>
                <div className="space-y-4">
                  {[
                    { plan: "Core", price: "$119.99/mo", annual: "$89.99/mo billed annually" },
                    { plan: "Advanced", price: "$179.99/mo", annual: "$139.99/mo billed annually" },
                    { plan: "Advanced Plus", price: "~$1,600/seat/yr", annual: "Custom pricing" },
                  ].map((tier) => (
                    <div key={tier.plan} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{tier.plan}</p>
                        <p className="text-xs text-muted-foreground">{tier.annual}</p>
                      </div>
                      <p className="text-sm font-bold text-foreground">{tier.price}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-center">
                  <p className="text-3xl font-extrabold text-destructive">50</p>
                  <p className="text-sm text-muted-foreground mt-1">InMails per month — <span className="text-destructive font-medium">and they expire</span></p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive/60 shrink-0" /> $2.40 per message that might get ignored</li>
                  <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive/60 shrink-0" /> No email addresses — ever</li>
                  <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive/60 shrink-0" /> You don't own the data. LinkedIn does.</li>
                </ul>
              </div>

              {/* Xcrow side */}
              <div className="bg-card border border-primary/20 rounded-2xl p-8 space-y-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-primary uppercase tracking-[0.1em] bg-primary/10 px-3 py-1 rounded-full">Xcrow Pro</span>
                </div>
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Pro Plan</p>
                    <p className="text-xs text-muted-foreground">Everything. No limits on outreach.</p>
                  </div>
                  <p className="text-2xl font-extrabold text-primary">$49<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                  <p className="text-3xl font-extrabold text-primary">500</p>
                  <p className="text-sm text-muted-foreground mt-1">Leads with <span className="text-primary font-medium">direct email addresses you keep</span></p>
                </div>
                <ul className="space-y-2 text-sm text-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> 10× more contacts than LinkedIn</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Real email addresses, not InMails</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> AI writes the outreach for you</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> 60% cheaper. 10× the reach.</li>
                </ul>
              </div>
            </motion.div>

            <motion.div {...fadeInView(0.2)} className="mt-10 text-center">
              <p className="text-foreground font-bold text-lg">
                LinkedIn: <span className="text-destructive">$120/mo → 50 messages</span> · Xcrow: <span className="text-primary">$49/mo → 500 leads with emails</span>
              </p>
              <p className="text-muted-foreground text-sm mt-2">Do the math. Then paste a URL.</p>
            </motion.div>
          </div>
        </section>

        {/* ═══ Bottom CTA ═══ */}
        <section className="bg-primary/[0.04] border-t border-primary/10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-24 text-center">
            <motion.div {...fadeInView()}>
              <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase mb-4">
                Still reading?
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight uppercase mb-5">
                Your Competitor Is Still
                <br />
                <span className="text-primary">Building Apollo Filters.</span>
              </h2>
              <p className="text-muted-foreground mb-10 max-w-md mx-auto text-lg">
                You could have leads by now. Paste a URL and find out.
              </p>
              <Button
                size="lg"
                className="h-14 px-10 gap-2.5 text-base font-bold shadow-lg rounded-xl"
                onClick={scrollToInput}
              >
                <img src={logoCrow} alt="" className="w-6 h-6 object-contain brightness-0 invert" />
                Hunt Leads — It's Free
              </Button>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
