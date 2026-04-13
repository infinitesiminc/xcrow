import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Tier {
  name: string;
  price: string;
  period: string;
  description: string;
  cta: string;
  features: string[];
  highlight: boolean;
  tier?: "starter" | "pro"; // maps to Stripe checkout tier
}

const TIERS: Tier[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try Xcrow with no commitment.",
    cta: "Get Started",
    features: [
      "30 leads per month",
      "AI niche & persona discovery",
      "Basic lead scoring",
      "CSV export",
    ],
    highlight: false,
  },
  {
    name: "Starter",
    price: "$29",
    period: "/mo",
    description: "For founders starting outbound.",
    cta: "Upgrade to Starter",
    tier: "starter",
    features: [
      "150 leads per month",
      "Verified email addresses",
      "AI-drafted outreach emails",
      "ICP research reports",
      "Priority support",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    description: "Your entire outbound engine.",
    cta: "Upgrade to Pro",
    tier: "pro",
    features: [
      "500 leads per month",
      "Everything in Starter",
      "Multi-workspace pipelines",
      "Advanced persona targeting",
      "Lead top-up packs ($10 / 50 leads)",
      "Dedicated onboarding call",
    ],
    highlight: true,
  },
];

export default function Pricing() {
  const { user, plan, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleCta = async (tier: Tier) => {
    // Free tier — just go to app
    if (!tier.tier) {
      if (user) navigate("/leadgen");
      else openAuthModal();
      return;
    }

    // Paid tier — must be logged in
    if (!user) {
      openAuthModal();
      return;
    }

    // Already on this plan
    if (
      (tier.tier === "starter" && plan === "starter") ||
      (tier.tier === "pro" && plan === "pro")
    ) {
      toast.info("You're already on this plan!");
      return;
    }

    setLoadingTier(tier.tier);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { tier: tier.tier },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setLoadingTier(null);
    }
  };

  const isCurrentPlan = (tier: Tier) => {
    if (!user) return false;
    if (!tier.tier && plan === "free") return true;
    if (tier.tier === "starter" && plan === "starter") return true;
    if (tier.tier === "pro" && plan === "pro") return true;
    return false;
  };

  return (
    <>
      <SEOHead
        title="Pricing"
        description="Simple, founder-friendly pricing. Start free, upgrade when you're ready. No sales team required."
        path="/pricing"
      />
      <Navbar />
      <main className="min-h-[70vh] bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase mb-4">
              Pricing
            </p>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-4">
              Your First Sales Hire Costs <span className="text-primary">$0</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              No contracts. No sales calls. Upgrade, downgrade, or cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((tier) => {
              const current = isCurrentPlan(tier);
              const loading = loadingTier === tier.tier;

              return (
                <div
                  key={tier.name}
                  className={`rounded-2xl border p-8 flex flex-col relative ${
                    tier.highlight
                      ? "border-primary/40 bg-primary/[0.03] shadow-lg ring-1 ring-primary/20"
                      : "border-border bg-card"
                  }`}
                >
                  {tier.highlight && (
                    <span className="text-xs font-bold text-primary uppercase tracking-[0.1em] mb-3">
                      Most Popular
                    </span>
                  )}
                  {current && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Your Plan
                    </span>
                  )}
                  <h2 className="text-xl font-bold text-foreground">{tier.name}</h2>
                  <div className="flex items-baseline gap-1 mt-2 mb-1">
                    <span className="text-4xl font-extrabold text-foreground">{tier.price}</span>
                    <span className="text-sm text-muted-foreground">{tier.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleCta(tier)}
                    className="w-full font-semibold"
                    variant={tier.highlight ? "default" : "outline"}
                    disabled={current || loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {current ? "Current Plan" : tier.cta}
                  </Button>
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-10">
            Need more?{" "}
            <a href="mailto:jackson@xcrow.ai" className="text-primary hover:underline">
              Talk to us
            </a>{" "}
            about custom volume pricing.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
