/**
 * /pricing — The Armory: Individuals vs Institutions
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check, ArrowRight, Loader2, HelpCircle, Shield, Crown, Castle, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import xcrowLogo from "@/assets/xcrow-logo.webp";

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
    <div className="min-h-screen bg-background">
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden px-4 pt-16 sm:pt-20 pb-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(var(--filigree-glow) / 0.08), transparent 70%)" }} />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
          className="relative mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-4"
            style={{ borderColor: "hsl(var(--filigree) / 0.3)", background: "hsl(var(--surface-parchment))" }}>
            <img src={xcrowLogo} alt="" className="h-4 w-4" />
            <span className="text-foreground/70 font-fantasy text-xs">The Armory</span>
          </div>
          <h1 className="font-fantasy text-3xl sm:text-5xl font-bold text-foreground tracking-tight">
            Choose Your Path
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base sm:text-lg text-muted-foreground">
            Simple pricing for individuals. Custom plans for institutions.
          </p>
        </motion.div>
      </section>

      {/* ═══ INDIVIDUAL PLANS ═══ */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-4xl">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-center text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-6">
            For Individuals
          </motion.p>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Recruit (Free) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border/60 p-6 flex flex-col"
              style={{ background: "hsl(var(--surface-stone))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center border border-border/60"
                  style={{ background: "hsl(var(--surface-stone))" }}>
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground font-fantasy">Recruit</h3>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-foreground">$0</span>
                <span className="text-sm text-muted-foreground">forever</span>
              </div>
              <p className="text-sm text-muted-foreground mb-5">Start your journey. Scout kingdoms for free.</p>
              <ul className="space-y-2.5 flex-1 mb-6">
                {FREE_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--territory-analytical))" }} />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" disabled={plan === "free"}
                onClick={() => plan === "free" ? null : navigate("/")}>
                {plan === "free" ? "Current Plan" : "Get Started Free"}
              </Button>
            </motion.div>

            {/* Champion (Pro) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="relative rounded-2xl border p-6 flex flex-col"
              style={{
                borderColor: "hsl(var(--filigree) / 0.4)",
                background: "hsl(var(--surface-stone))",
                boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))",
              }}>
              <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: "hsl(var(--territory-strategic))" }} />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider shadow-lg font-fantasy"
                style={{ background: "hsl(var(--territory-strategic))", color: "hsl(var(--background))" }}>
                Most Popular
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center border"
                  style={{ background: "hsl(var(--territory-strategic) / 0.15)", borderColor: "hsl(var(--territory-strategic) / 0.3)" }}>
                  <Crown className="h-5 w-5" style={{ color: "hsl(var(--territory-strategic))" }} />
                </div>
                <h3 className="text-lg font-bold text-foreground font-fantasy">Champion</h3>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-foreground">$9.99</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mb-5">Unlimited quests. Full territory. Stay ahead.</p>
              <ul className="space-y-2.5 flex-1 mb-6">
                {PRO_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--territory-strategic))" }} />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" disabled={plan === "pro" || plan === "school" || loadingCheckout}
                onClick={handleUpgrade}
                style={{ boxShadow: "0 0 20px hsl(var(--territory-strategic) / 0.25)" }}>
                {loadingCheckout && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {plan === "pro" ? "Current Plan" : plan === "school" ? "Included via Institution" : "Ascend to Champion"}
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ INSTITUTIONS ═══ */}
      <section className="px-4 pb-16" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
        <div className="mx-auto max-w-4xl py-16">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-center mb-10">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">For Institutions</p>
            <h2 className="font-fantasy text-3xl sm:text-4xl font-bold text-foreground">
              Schools · Universities · Companies
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Custom plans built around your cohort size, programs, and outcomes. Free pilot available.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-2xl border p-8 flex flex-col md:flex-row gap-8"
            style={{
              borderColor: "hsl(var(--filigree) / 0.3)",
              background: "hsl(var(--surface-stone))",
              boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))",
            }}>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center border"
                  style={{ background: "hsl(var(--territory-leadership) / 0.15)", borderColor: "hsl(var(--territory-leadership) / 0.3)" }}>
                  <Castle className="h-5 w-5" style={{ color: "hsl(var(--territory-leadership))" }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground font-fantasy">Institutional License</h3>
                  <p className="text-xs text-muted-foreground">Guild Hall · War Room</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Whether you're a university preparing students for the AI era or a company upskilling your workforce — we'll build a plan that fits.
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
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-8">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border"
              style={{ borderColor: "hsl(var(--filigree) / 0.2)", background: "hsl(var(--surface-stone))" }}>
              <HelpCircle className="h-5 w-5" style={{ color: "hsl(var(--filigree-glow))" }} />
            </div>
            <h2 className="font-fantasy text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
          </motion.div>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} style={{ borderColor: "hsl(var(--filigree) / 0.1)" }}>
                <AccordionTrigger className="text-sm text-foreground text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
