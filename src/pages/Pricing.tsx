import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 30 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true } as const,
  transition: { duration: 0.5, delay },
});

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Try the lead hunter with no commitment.",
    cta: "Start Free",
    featured: false,
    features: [
      { text: "3 lead hunts per month", included: true },
      { text: "AI company DNA analysis", included: true },
      { text: "Prospect map generation", included: true },
      { text: "Up to 5 leads per hunt", included: true },
      { text: "Basic outreach drafts", included: true },
      { text: "1 workspace", included: true },
      { text: "Priority lead scoring", included: false },
      { text: "Email send & tracking", included: false },
      { text: "CRM pipeline management", included: false },
    ],
  },
  {
    name: "Starter",
    price: "$19",
    period: "/month",
    desc: "For solo founders ready to build consistent pipeline.",
    cta: "Get Starter",
    featured: false,
    features: [
      { text: "15 lead hunts per month", included: true },
      { text: "AI company DNA analysis", included: true },
      { text: "Prospect map generation", included: true },
      { text: "Up to 15 leads per hunt", included: true },
      { text: "Advanced outreach drafts", included: true },
      { text: "3 workspaces", included: true },
      { text: "Priority lead scoring", included: true },
      { text: "Email send & tracking", included: false },
      { text: "CRM pipeline management", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    desc: "For teams who need a full outbound engine.",
    cta: "Upgrade to Pro",
    featured: true,
    features: [
      { text: "Unlimited lead hunts", included: true },
      { text: "AI company DNA analysis", included: true },
      { text: "Prospect map generation", included: true },
      { text: "Up to 25 leads per hunt", included: true },
      { text: "Advanced outreach drafts", included: true },
      { text: "Unlimited workspaces", included: true },
      { text: "Priority lead scoring", included: true },
      { text: "Email send & tracking", included: true },
      { text: "CRM pipeline management", included: true },
    ],
  },
];
const FAQ = [
  { q: "Can I try Xcrow before paying?", a: "Yes — the Free plan gives you 3 lead hunts per month with no credit card required. You can upgrade anytime." },
  { q: "What counts as a lead hunt?", a: "One lead hunt = pasting a URL and generating a scored prospect list. Each hunt returns up to 5 leads on Free or 25 on Pro." },
  { q: "Can I cancel anytime?", a: "Yes. Pro is month-to-month with no contracts. Cancel from your Settings page and you'll keep access until the end of your billing period." },
  { q: "Do you offer team or enterprise plans?", a: "Not yet, but we're working on it. Contact us at jackson@xcrow.ai for custom pricing for teams of 5+." },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Pricing"
        description="Xcrow pricing — start free, upgrade when you need more leads. No contracts, cancel anytime."
        path="/pricing"
      />
      <Navbar />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-8 text-center">
            <motion.p {...fade()} className="text-primary text-sm font-semibold tracking-[0.2em] uppercase mb-6">
              Pricing
            </motion.p>
            <motion.h1 {...fade(0.1)} className="text-[2.5rem] sm:text-[3.5rem] md:text-[4rem] font-extrabold text-foreground leading-[1.05] tracking-[-0.02em] uppercase mb-6">
              Start Free. <span className="text-primary">Scale When Ready.</span>
            </motion.h1>
            <motion.p {...fade(0.2)} className="text-muted-foreground text-lg max-w-xl mx-auto">
              No credit card. No contracts. Get leads in 60 seconds.
            </motion.p>
          </div>
        </section>

        {/* Plans */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {PLANS.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  {...fade(i * 0.1)}
                  className={`relative bg-card border rounded-2xl p-8 ${
                    plan.featured
                      ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                      : "border-border"
                  }`}
                >
                  {plan.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-foreground uppercase tracking-tight">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-3 mb-2">
                    <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-8">{plan.desc}</p>

                  <Button
                    className={`w-full h-12 font-bold rounded-xl gap-2 ${plan.featured ? "shadow-md" : ""}`}
                    variant={plan.featured ? "default" : "outline"}
                    onClick={() => navigate(plan.featured ? "/leadhunter" : "/leadhunter")}
                  >
                    {plan.featured && <Sparkles className="w-4 h-4" />}
                    {plan.cta}
                  </Button>

                  <ul className="mt-8 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f.text} className={`flex items-start gap-3 text-sm ${f.included ? "text-foreground" : "text-muted-foreground/50"}`}>
                        {f.included ? (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-muted-foreground/30 shrink-0 mt-0.5" />
                        )}
                        {f.text}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-muted/30 py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase mb-4">FAQ</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight uppercase">
                Common Questions
              </h2>
            </motion.div>
            <div className="space-y-5">
              {FAQ.map((item, i) => (
                <motion.div key={i} {...fade(i * 0.06)} className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="font-bold text-foreground mb-2">{item.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary/[0.04] border-t border-primary/10 py-20 text-center">
          <motion.div {...fade()} className="max-w-2xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight uppercase mb-5">
              Your First Leads Are <span className="text-primary">Free</span>
            </h2>
            <p className="text-muted-foreground mb-10 text-lg">No credit card required. Start hunting in 60 seconds.</p>
            <Button size="lg" className="h-14 px-10 gap-2.5 text-base font-bold shadow-lg rounded-xl" onClick={() => navigate("/leadhunter")}>
              <ArrowRight className="w-5 h-5" />
              Start Hunting — It's Free
            </Button>
          </motion.div>
        </section>

        <Footer />
      </div>
    </>
  );
}
