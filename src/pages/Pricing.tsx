import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check, X, Zap, Building2, ArrowRight, Users,
  Sparkles, HelpCircle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_PRICES } from "@/lib/stripe-config";
import { toast } from "sonner";

/* ── feature rows ── */
const individualFeatures = [
  { label: "Role analyses", free: "2 / month", pro: "Unlimited" },
  { label: "Practice simulations", free: "3 / month", pro: "Unlimited" },
  { label: "Career pathways", free: "Basic", pro: "Full + AI recommendations" },
  { label: "Action plan", free: "Summary", pro: "Detailed with tool links" },
  { label: "Dashboard & history", free: true, pro: true },
  { label: "Priority support", free: false, pro: true },
];

const orgExtras = [
  "Everything in Individual Pro",
  "Bulk role upload & batch analysis",
  "Department heatmaps",
  "Team dashboards & cohort tracking",
  "Admin controls & SSO",
  "Dedicated account manager",
];

const tiers = [
  { seats: "1–10", price: "$15" },
  { seats: "11–50", price: "$12" },
  { seats: "51–200", price: "$9" },
  { seats: "200+", price: "Custom" },
];

const faqs = [
  {
    q: "Is there a free trial for Pro?",
    a: "Yes — every new account starts with a 14-day Pro trial. No credit card required.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Cancel from your settings page and you'll retain access until the end of your billing period.",
  },
  {
    q: "How does organization billing work?",
    a: "You're billed monthly per active seat. Volume discounts apply automatically as you add seats. Annual billing is available on request.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards. Enterprise customers can also pay via invoice.",
  },
  {
    q: "Can I switch between monthly and annual?",
    a: "Yes, you can switch at any time. When moving to annual, you'll receive a prorated credit for the remainder of your current month.",
  },
];

/* ── helpers ── */
function FeatureValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="h-4 w-4 text-primary" />;
  if (value === false) return <X className="h-4 w-4 text-muted-foreground/40" />;
  return <span className="text-sm text-foreground">{value}</span>;
}

/* ── page ── */
export default function Pricing() {
  const navigate = useNavigate();
  const { user, isPro, openAuthModal, subscription } = useAuth();
  const [annual, setAnnual] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const monthlyPrice = 19;
  const annualPrice = 190;
  const displayPrice = annual ? Math.round(annualPrice / 12) : monthlyPrice;
  const period = annual ? "/mo, billed yearly" : "/month";

  const handleUpgrade = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    if (isPro) {
      toast.info("You're already on Pro!");
      return;
    }

    setCheckoutLoading(true);
    try {
      const priceId = annual ? STRIPE_PRICES.PRO_ANNUAL : STRIPE_PRICES.PRO_MONTHLY;
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Portal error:", err);
      toast.error("Failed to open subscription management.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
              Simple, transparent pricing
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground leading-relaxed">
              Start free. Upgrade when you need more power.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Toggle */}
      <div className="flex items-center justify-center gap-3 pb-10">
        <span className={`text-sm font-medium ${!annual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
        <Switch checked={annual} onCheckedChange={setAnnual} />
        <span className={`text-sm font-medium ${annual ? "text-foreground" : "text-muted-foreground"}`}>
          Annual <span className="text-xs text-primary font-semibold ml-1">Save 17%</span>
        </span>
      </div>

      {/* Cards */}
      <section className="px-4 pb-20">
        <div className="mx-auto max-w-5xl grid lg:grid-cols-2 gap-8">
          {/* ── Individual ── */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-border/50 h-full flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-sans">Individual</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">For professionals and students</p>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col gap-6 pt-4">
                {/* Free vs Pro headers */}
                <div className="grid grid-cols-[1fr_80px_120px] gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
                  <span />
                  <span className="text-center">Free</span>
                  <span className="text-center">Pro</span>
                </div>

                {/* Feature rows */}
                <div className="space-y-3">
                  {individualFeatures.map((f) => (
                    <div key={f.label} className="grid grid-cols-[1fr_80px_120px] gap-2 items-center">
                      <span className="text-sm text-foreground">{f.label}</span>
                      <span className="flex justify-center"><FeatureValue value={f.free} /></span>
                      <span className="flex justify-center"><FeatureValue value={f.pro} /></span>
                    </div>
                  ))}
                </div>

                {/* Price + CTAs */}
                <div className="mt-auto pt-6 border-t border-border space-y-4">
                  <div className="flex items-end gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Free</p>
                      <p className="text-2xl font-bold text-foreground font-sans">$0</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pro</p>
                      <p className="text-2xl font-bold text-foreground font-sans">
                        ${displayPrice}
                        <span className="text-sm font-normal text-muted-foreground">{period}</span>
                      </p>
                      {annual && (
                        <p className="text-xs text-primary mt-0.5">${annualPrice}/year</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {!user ? (
                      <>
                        <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>
                          Get started free
                        </Button>
                        <Button className="flex-1 gap-1.5" onClick={openAuthModal}>
                          <Zap className="h-4 w-4" /> Upgrade to Pro
                        </Button>
                      </>
                    ) : isPro ? (
                      <>
                        <Button variant="outline" className="flex-1" disabled>
                          <Check className="h-4 w-4 mr-1.5" /> Current plan
                        </Button>
                        <Button variant="secondary" className="flex-1" onClick={handleManageSubscription}>
                          Manage subscription
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard")}>
                          Current: Free
                        </Button>
                        <Button
                          className="flex-1 gap-1.5"
                          onClick={handleUpgrade}
                          disabled={checkoutLoading}
                        >
                          {checkoutLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Zap className="h-4 w-4" />
                          )}
                          Upgrade to Pro
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Organization ── */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <Card className="border-primary/20 h-full flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                Best value
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-sans">Organization</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">Per seat, volume discounts</p>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col gap-6 pt-4">
                {/* Volume table */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="grid grid-cols-2 text-xs font-medium text-muted-foreground uppercase tracking-widest bg-muted/50 px-4 py-2">
                    <span>Seats</span>
                    <span className="text-right">Price / seat / mo</span>
                  </div>
                  {tiers.map((t) => (
                    <div key={t.seats} className="grid grid-cols-2 px-4 py-2.5 border-t border-border">
                      <span className="text-sm text-foreground flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" /> {t.seats}
                      </span>
                      <span className="text-sm font-semibold text-foreground text-right">{t.price}</span>
                    </div>
                  ))}
                </div>

                {/* Includes */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Includes</p>
                  <ul className="space-y-2">
                    {orgExtras.map((e) => (
                      <li key={e} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTAs */}
                <div className="mt-auto pt-6 border-t border-border flex flex-col sm:flex-row gap-2">
                  <Button className="flex-1 gap-1.5" onClick={() => navigate("/contact-org")}>
                    Start team trial <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => navigate("/contact-org")}>
                    Talk to sales
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-2xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-8">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-sans text-2xl font-bold text-foreground">Frequently asked questions</h2>
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
