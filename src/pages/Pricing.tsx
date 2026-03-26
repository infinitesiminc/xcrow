/**
 * /pricing — The Armory: Individuals vs Institutions
 */
import { useState } from "react";
import SEOHead from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import SponsorLandingSection from "@/components/pricing/SponsorLandingSection";
import { motion } from "framer-motion";
import {
  Check, ArrowRight, Loader2, HelpCircle, Shield, Crown, Castle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const fade = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const cinzel = { fontFamily: "'Cinzel', serif" };
const stoneCard = {
  background: "hsl(var(--surface-stone))",
  border: "1px solid hsl(var(--filigree) / 0.2)",
  boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))",
};

const FREE_FEATURES = [
  "3 quests per moon (recruit allies for more!)",
  "Unlimited kingdom scouting",
  "Territory map (view only)",
  "Hall of Champions access",
];

const PRO_FEATURES = [
  "Unlimited quests & campaigns",
  "Full territory with 3-ring growth tracking",
  "Summon the Crow — AI Career Scout",
  "Human Edge & AI Mastery insights",
  "Exportable skill profile",
  "Priority ranking in the Hall of Champions",
];

const INSTITUTION_FEATURES = [
  "Everything in Champion for every user",
  "Program or department-specific skill gap analysis",
  "Custom quest campaigns & curriculum mapping",
  "Admin dashboard with cohort analytics",
  "Bulk provisioning & domain auto-enroll",
  "Cross-cohort benchmarks & reporting",
  "Dedicated onboarding & support",
  "ATS / LMS integration support",
];

const FAQS = [
  { q: "Is the Recruit plan really free?", a: "Yes! You get 3 quests per moon with unlimited kingdom scouting. Recruit allies to earn bonus quests — no cap." },
  { q: "What does Champion unlock?", a: "Champion removes all quest limits, unlocks full 3-ring growth tracking, AI Career Scout, and exportable skill profiles." },
  { q: "Can my school or company cover this?", a: "Absolutely. If your institution has a license, your admin will invite you and you'll get Champion access automatically." },
  { q: "How does institutional pricing work?", a: "We customize pricing based on cohort size, programs, and outcomes. Contact our team to discuss — free pilots available." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from settings and keep access until the end of your billing period." },
];

const Divider = () => (
  <div className="max-w-5xl mx-auto px-6">
    <div className="h-px w-full" style={{ background: "hsl(var(--filigree) / 0.12)" }} />
  </div>
);

export default function Pricing() {
  const { user, plan, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const handleUpgrade = async () => {
    if (!user) { openAuthModal(); return; }
    setLoadingCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead title="Pricing" description="Free to start. Champion plan for unlimited quests, full territory access, and AI Career Scout." path="/pricing" />

      {/* ═══ HERO ═══ */}
      <motion.section className="relative py-24 px-6 text-center overflow-hidden" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, hsl(var(--territory-strategic) / 0.12) 0%, transparent 60%)" }} />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] mb-4" style={{ color: "hsl(var(--filigree))", ...cinzel }}>The Armory</p>
          <h1 className="text-3xl sm:text-5xl font-bold mb-4" style={cinzel}>Choose Your Path</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">Simple pricing for individuals. Custom plans for institutions.</p>
        </div>
      </motion.section>

      <Divider />

      {/* ═══ INDIVIDUAL PLANS ═══ */}
      <motion.section className="max-w-4xl mx-auto px-6 py-20 w-full" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade}>
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold" style={cinzel}>For Individuals</h2>
          <p className="text-muted-foreground mt-2">Students and professionals building AI-era skills.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Recruit (Free) */}
          <div className="rounded-lg p-6 flex flex-col" style={stoneCard}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: "hsl(var(--muted) / 0.5)" }}>
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={cinzel}>Recruit</h3>
                <p className="text-xs text-muted-foreground">Free forever</p>
              </div>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold" style={cinzel}>$0</span>
              <span className="text-sm text-muted-foreground">forever</span>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Start your journey. Scout kingdoms for free.</p>
            <ul className="space-y-2.5 flex-1 mb-6">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--territory-analytical))" }} />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" disabled={plan === "free"}
              onClick={() => plan === "free" ? null : navigate("/")}
              style={{ borderColor: "hsl(var(--filigree) / 0.3)" }}>
              {plan === "free" ? "Current Plan" : "Get Started Free"}
            </Button>
          </div>

          {/* Champion (Pro) */}
          <div className="relative rounded-lg p-6 flex flex-col" style={{ ...stoneCard, borderColor: "hsl(var(--filigree) / 0.4)" }}>
            <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: "hsl(var(--territory-strategic))" }} />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider shadow-lg"
              style={{ background: "hsl(var(--territory-strategic))", color: "hsl(var(--background))", ...cinzel }}>
              Most Popular
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: "hsl(var(--territory-strategic) / 0.15)" }}>
                <Crown className="h-5 w-5" style={{ color: "hsl(var(--territory-strategic))" }} />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={cinzel}>Champion</h3>
                <p className="text-xs text-muted-foreground">Pro tier</p>
              </div>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold" style={cinzel}>$12</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Unlimited quests. Full territory. Stay ahead.</p>
            <ul className="space-y-2.5 flex-1 mb-6">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--territory-strategic))" }} />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full" disabled={plan === "pro" || plan === "school" || loadingCheckout}
              onClick={handleUpgrade}
              style={{ boxShadow: "0 0 20px hsl(var(--territory-strategic) / 0.25)" }}>
              {loadingCheckout && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {plan === "pro" ? "Current Plan" : plan === "school" ? "Included via Institution" : "Ascend to Champion"}
            </Button>
          </div>
        </div>
      </motion.section>

      <Divider />

      {/* ═══ INSTITUTIONS ═══ */}
      <motion.section className="max-w-5xl mx-auto px-6 py-20 w-full" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade}>
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold" style={cinzel}>For Institutions</h2>
          <p className="text-muted-foreground mt-2">Schools · Universities · Companies — custom plans built around your cohort.</p>
        </div>

        <div className="rounded-lg p-8 flex flex-col md:flex-row gap-8" style={{ ...stoneCard, borderColor: "hsl(var(--filigree) / 0.3)" }}>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: "hsl(var(--territory-leadership) / 0.15)" }}>
                <Castle className="h-5 w-5" style={{ color: "hsl(var(--territory-leadership))" }} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={cinzel}>Institutional License</h3>
                <p className="text-xs text-muted-foreground">Guild Hall · War Room</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Whether you're a university preparing students for the AI era or a company upskilling your workforce — we'll build a plan that fits. Free pilot available.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" onClick={() => navigate("/contact")}
                style={{ boxShadow: "0 0 20px hsl(var(--territory-leadership) / 0.25)" }}>
                Talk to Sales <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/contact")}
                style={{ borderColor: "hsl(var(--filigree) / 0.3)" }}>
                Start Free Pilot
              </Button>
            </div>
          </div>
          <div className="flex-1">
            <ul className="space-y-2.5">
              {INSTITUTION_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--territory-leadership))" }} />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.section>

      <Divider />

      {/* ═══ FAQ ═══ */}
      <motion.section className="max-w-2xl mx-auto px-6 py-20 w-full" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade}>
        <div className="text-center mb-12">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md" style={{ background: "hsl(var(--surface-stone))", border: "1px solid hsl(var(--filigree) / 0.2)" }}>
            <HelpCircle className="h-5 w-5" style={{ color: "hsl(var(--filigree))" }} />
          </div>
          <h2 className="text-2xl font-bold" style={cinzel}>Frequently Asked Questions</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} style={{ borderColor: "hsl(var(--filigree) / 0.1)" }}>
              <AccordionTrigger className="text-sm text-foreground text-left">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.section>

      {/* Employer Sponsorship */}
      <SponsorLandingSection />
    </div>
  );
}
