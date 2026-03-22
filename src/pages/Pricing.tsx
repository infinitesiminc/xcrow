import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import xcrowLogo from "@/assets/xcrow-logo.png";

const FREE_FEATURES = [
  "3 quests per moon (earn more by recruiting allies!)",
  "Unlimited kingdom scouting",
  "Territory map (view only)",
  "Hall of Champions access",
  "Kingdom exploration feed",
];

const PRO_FEATURES = [
  "Unlimited quests & campaigns",
  "Unlimited kingdom scouting",
  "Full territory with 3-ring growth tracking",
  "Summon the Crow — AI Career Scout",
  "Human Edge & AI Mastery insights",
  "Exportable skill profile",
  "Priority ranking in the Hall of Champions",
];

const SCHOOL_FEATURES = [
  "Everything in Champion for every student",
  "Program-specific curriculum gap analysis",
  "Quest library mapped to your courses",
  "Guild admin dashboard & cohort analytics",
  "Bulk student provisioning & domain auto-enroll",
  "Cross-guild territory benchmarks",
  "Dedicated onboarding & support",
];

const faqs = [
  { q: "Is it really free?", a: "Yes! The Recruit plan gives you 3 quests per moon with unlimited kingdom scouting and a view-only territory map. Recruit allies to earn +2 bonus quests each — no cap!" },
  { q: "What does Champion unlock?", a: "Champion removes all quest limits, unlocks full 3-ring growth tracking (Foundation, AI Mastery, Human Edge) on your territory, and lets you summon the Crow — your AI Career Scout." },
  { q: "How does the Guild Hall work?", a: "We work with universities to create custom packages based on student count, programs, and desired outcomes. Contact our team to discuss pricing and start a free pilot." },
  { q: "Can I cancel anytime?", a: "Absolutely. Cancel from your settings and you'll keep access until the end of your billing period." },
  { q: "What if my school already has a license?", a: "If your university has an Xcrow.ai Guild license, your guild admin will invite you via email. You'll automatically get Champion access at no cost to you." },
  { q: "Do guilds get a free pilot?", a: "Yes — we offer a no-cost pilot so guilds can see the impact before committing. Talk to our team to get started." },
];

export default function Pricing() {
  const { user, plan, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    setLoadingCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoadingCheckout(false);
    }
  };

  const tiers = [
    {
      name: "Recruit",
      price: "$0",
      period: "forever",
      description: "Begin your journey. Scout kingdoms, claim your first tiles.",
      features: FREE_FEATURES,
      icon: Shield,
      cta: plan === "free" ? "Current Plan" : "Downgrade",
      ctaDisabled: plan === "free",
      onCta: () => navigate("/"),
      highlight: false,
      territoryColor: "territory-analytical",
    },
    {
      name: "Champion",
      price: "$9.99",
      period: "/month",
      description: "Unlimited quests. Full territory. Summon the Crow.",
      features: PRO_FEATURES,
      icon: Crown,
      cta: plan === "pro" ? "Current Plan" : plan === "school" ? "Included via Guild" : "Ascend to Champion",
      ctaDisabled: plan === "pro" || plan === "school",
      onCta: handleUpgrade,
      highlight: true,
      territoryColor: "territory-strategic",
    },
    {
      name: "Guild Hall",
      price: "Custom",
      period: "",
      description: "AI readiness for your entire university guild.",
      features: SCHOOL_FEATURES,
      icon: Castle,
      cta: plan === "school" ? "Active License" : "Summon Sales",
      ctaDisabled: plan === "school",
      onCta: () => navigate("/contact"),
      highlight: false,
      territoryColor: "territory-leadership",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-16 sm:pt-20 pb-8 sm:pb-12">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(var(--filigree-glow) / 0.08), transparent 70%)" }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[hsl(var(--filigree)/0.3)] bg-[hsl(var(--surface-parchment))] text-xs font-medium mb-4">
              <img src={xcrowLogo} alt="" className="h-4 w-4" />
              <span className="text-foreground/70 font-fantasy">The Armory</span>
            </div>
            <h1 className="font-fantasy text-3xl sm:text-5xl font-bold text-foreground tracking-tight">
              Choose Your Path
            </h1>
            <p className="mx-auto mt-3 sm:mt-4 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Every legend starts as a Recruit. Ascend when you're ready to conquer.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tier Cards */}
      <section className="px-4 pb-16 sm:pb-20">
        <div className="mx-auto max-w-5xl grid md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl"
            >
              {/* Territory-colored top border */}
              <div className={`absolute top-0 inset-x-0 h-[3px] bg-${tier.territoryColor}`} />

              <div className={`border rounded-2xl p-6 flex flex-col h-full transition-all ${
                tier.highlight
                  ? "border-[hsl(var(--filigree)/0.4)] bg-[hsl(var(--surface-stone))] shadow-lg shadow-[hsl(var(--filigree-glow)/0.1)]"
                  : "border-border/60 bg-[hsl(var(--surface-stone))]"
              }`}
                style={{ boxShadow: tier.highlight ? `inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))` : `inset 0 1px 0 hsl(var(--emboss-light))` }}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[hsl(var(--territory-strategic))] text-background text-[10px] font-semibold uppercase tracking-wider shadow-lg"
                    style={{ fontFamily: "'Cinzel', serif" }}>
                    Most Popular
                  </div>
                )}

                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center border ${
                      tier.highlight ? "bg-[hsl(var(--territory-strategic)/0.15)] border-[hsl(var(--territory-strategic)/0.3)]" : "bg-[hsl(var(--surface-stone))] border-border/60"
                    }`}>
                      <tier.icon className={`h-5 w-5 ${tier.highlight ? "text-[hsl(var(--territory-strategic))]" : "text-muted-foreground"}`} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground font-fantasy">{tier.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">{tier.price}</span>
                    <span className="text-sm text-muted-foreground">{tier.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1.5">{tier.description}</p>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className={`h-4 w-4 shrink-0 mt-0.5 text-${tier.territoryColor}`} />
                      <span className="text-foreground/80">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${tier.highlight ? "" : ""}`}
                  variant={tier.highlight ? "default" : "outline"}
                  disabled={tier.ctaDisabled || (loadingCheckout && tier.name === "Champion")}
                  onClick={tier.onCta}
                  style={tier.highlight ? { boxShadow: "0 0 20px hsl(var(--territory-strategic) / 0.25)" } : undefined}
                >
                  {loadingCheckout && tier.name === "Champion" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : null}
                  {tier.cta}
                  {!tier.ctaDisabled && tier.name !== "Recruit" && <ArrowRight className="h-3.5 w-3.5 ml-1.5" />}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Guild CTA */}
      <section className="px-4 pb-16 sm:pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative mx-auto max-w-2xl rounded-2xl overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-[3px] bg-[hsl(var(--filigree))]" />
          <div className="border border-[hsl(var(--filigree)/0.2)] rounded-2xl p-8 text-center"
            style={{ background: "hsl(var(--surface-parchment))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
            <Castle className="h-8 w-8 text-[hsl(var(--filigree-glow))] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground mb-1 font-fantasy">
              Bring the Guild to Your University
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Give every student quest-based AI-readiness training mapped to your curriculum. Free pilot available.
            </p>
            <Button variant="outline" onClick={() => navigate("/contact")} className="border-[hsl(var(--filigree)/0.3)]">
              Summon Sales <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-20 sm:pb-24">
        <div className="mx-auto max-w-2xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-8">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[hsl(var(--filigree)/0.2)]"
              style={{ background: "hsl(var(--surface-stone))" }}>
              <HelpCircle className="h-5 w-5 text-[hsl(var(--filigree-glow))]" />
            </div>
            <h2 className="font-fantasy text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
          </motion.div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-[hsl(var(--filigree)/0.1)]">
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
