import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check, Zap, GraduationCap, Building2, ArrowRight, Loader2, Crown, HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const FREE_FEATURES = [
  "3 simulations per month",
  "3 role analyses per month",
  "Skill territory (view only)",
  "Leaderboard access",
  "Role exploration feed",
];

const PRO_FEATURES = [
  "Unlimited simulations",
  "Unlimited role analyses",
  "Full skill territory with 3-ring growth tracking",
  "AI career coach",
  "Human edge & AI mastery insights",
  "Exportable skill profile",
  "Priority on leaderboard",
];

const SCHOOL_FEATURES = [
  "Everything in Pro for every student",
  "Program-specific curriculum gap analysis",
  "AI simulation library mapped to your courses",
  "School admin dashboard & cohort analytics",
  "Bulk student provisioning & domain auto-enroll",
  "Cross-school skill territory benchmarks",
  "Dedicated onboarding & support",
];

const faqs = [
  { q: "Is it really free?", a: "Yes! The Free plan gives you 3 simulations and 3 analyses per month with a view-only skill territory — perfect for getting started." },
  { q: "What does Pro unlock?", a: "Pro removes all limits on simulations and analyses, unlocks full 3-ring growth tracking (Foundation, AI Mastery, Human Edge) on your skill territory, and gives you access to the AI career coach." },
  { q: "How does the School plan work?", a: "We work with universities to create custom packages based on student count, programs, and desired outcomes. Contact our team to discuss pricing and start a free pilot." },
  { q: "Can I cancel anytime?", a: "Absolutely. Cancel from your settings and you'll keep access until the end of your billing period." },
  { q: "What if my school already has a license?", a: "If your university has a crowy.ai license, your school admin will invite you via email. You'll automatically get Pro access at no cost to you." },
  { q: "Do schools get a free pilot?", a: "Yes — we offer a no-cost pilot so schools can see the impact before committing. Talk to our team to get started." },
];

const TIER_GRADIENTS = [
  "from-spectrum-0 via-spectrum-1 to-spectrum-2",
  "from-spectrum-3 via-spectrum-6 to-spectrum-5",
  "from-spectrum-4 via-spectrum-3 to-spectrum-0",
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
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Start exploring your career path",
      features: FREE_FEATURES,
      icon: Zap,
      cta: plan === "free" ? "Current Plan" : "Downgrade",
      ctaDisabled: plan === "free",
      onCta: () => navigate("/"),
      highlight: false,
      checkColor: "text-spectrum-0",
    },
    {
      name: "Pro",
      price: "$9.99",
      period: "/month",
      description: "Unlimited access to build your skill map",
      features: PRO_FEATURES,
      icon: Crown,
      cta: plan === "pro" ? "Current Plan" : plan === "school" ? "Included via School" : "Upgrade to Pro",
      ctaDisabled: plan === "pro" || plan === "school",
      onCta: handleUpgrade,
      highlight: true,
      checkColor: "text-primary",
    },
    {
      name: "School",
      price: "Custom",
      period: "",
      description: "AI readiness for your entire university",
      features: SCHOOL_FEATURES,
      icon: Building2,
      cta: plan === "school" ? "Active License" : "Talk to Sales",
      ctaDisabled: plan === "school",
      onCta: () => navigate("/contact"),
      highlight: false,
      checkColor: "text-spectrum-4",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-16 sm:pt-20 pb-8 sm:pb-12">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium mb-4 glow-purple">
              <GraduationCap className="h-3.5 w-3.5" />
              Built for students
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-foreground tracking-tight">
              Simple pricing, powerful skills
            </h1>
            <p className="mx-auto mt-3 sm:mt-4 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Start free. Upgrade when you're ready to go all-in on your career readiness.
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
              {/* Spectrum gradient top border */}
              <div className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${TIER_GRADIENTS[i]}`} />

              <div className={`border rounded-2xl p-6 flex flex-col h-full ${
                tier.highlight
                  ? "border-primary/40 bg-card/90 backdrop-blur-sm shadow-lg shadow-primary/10"
                  : "border-border/60 bg-card/80 backdrop-blur-sm"
              }`}>
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider shadow-lg shadow-primary/30">
                    Most Popular
                  </div>
                )}

                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center border ${
                      tier.highlight ? "bg-primary/15 border-primary/30" : "bg-card border-border/60"
                    }`}>
                      <tier.icon className={`h-5 w-5 ${tier.highlight ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
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
                      <Check className={`h-4 w-4 shrink-0 mt-0.5 ${tier.checkColor}`} />
                      <span className="text-foreground/80">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${tier.highlight ? "glow-purple" : ""}`}
                  variant={tier.highlight ? "default" : "outline"}
                  disabled={tier.ctaDisabled || (loadingCheckout && tier.name === "Pro")}
                  onClick={tier.onCta}
                >
                  {loadingCheckout && tier.name === "Pro" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : null}
                  {tier.cta}
                  {!tier.ctaDisabled && tier.name !== "Free" && <ArrowRight className="h-3.5 w-3.5 ml-1.5" />}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* School CTA */}
      <section className="px-4 pb-16 sm:pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative mx-auto max-w-2xl rounded-2xl overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-spectrum-3 via-spectrum-0 to-spectrum-1" />
          <div className="border border-border/60 bg-card/80 backdrop-blur-sm rounded-2xl p-8 text-center">
            <Building2 className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground mb-1">
              Bring crowy.ai to your university
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Give every student personalized AI-readiness training mapped to your curriculum. Free pilot available.
            </p>
            <Button variant="outline" onClick={() => navigate("/contact")} className="border-border/60">
              Talk to Sales <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-20 sm:pb-24">
        <div className="mx-auto max-w-2xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-8">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/30">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">Frequently asked questions</h2>
          </motion.div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
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
