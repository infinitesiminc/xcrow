import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap, Building2, ArrowRight,
  Sparkles, HelpCircle, Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import PricingTierCard from "@/components/pricing/PricingTierCard";
import GrowthPricingTable from "@/components/pricing/GrowthPricingTable";

const faqs = [
  { q: "What counts as a 'role'?", a: "A role is any unique job title you analyze on the platform — e.g. 'Product Manager' or 'Senior Data Engineer'. Analyzing the same role multiple times doesn't count as additional roles." },
  { q: "Can I try it before committing?", a: "Yes — every account gets 1 free role analysis and 1 simulation to experience the full platform." },
  { q: "How does Growth billing work?", a: "You're billed monthly based on the number of active roles in your workspace. Volume discounts apply automatically as you add roles. Annual billing is available on request." },
  { q: "Can I cancel anytime?", a: "Absolutely. Cancel from your settings page and you'll retain access until the end of your billing period." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards. Enterprise customers can also pay via invoice." },
  { q: "What happens to my data if I downgrade?", a: "Your analysis history and simulation results are preserved. You just won't be able to analyze new roles beyond your tier's limit until you upgrade again." },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-16 sm:pt-20 pb-8 sm:pb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-foreground tracking-tight">
              Map one role free.<br />Scale to your whole org.
            </h1>
            <p className="mx-auto mt-3 sm:mt-4 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              See exactly how AI impacts any role — then expand coverage across your workforce.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tier Cards */}
      <section className="px-4 pb-16 sm:pb-20">
        <div className="mx-auto max-w-5xl grid md:grid-cols-3 gap-5">

          {/* Free */}
          <PricingTierCard
            icon={<Sparkles className="h-5 w-5" />}
            name="Free"
            description="For individual exploration"
            price="$0"
            priceNote="Account required"
            accentClass="border-border/50"
            features={[
              "1 role analysis",
              "1 upskill simulation",
              "Task breakdown & risk gauge",
              "Career pathway preview",
              "Personal dashboard",
            ]}
            cta={
              <Button variant="outline" size="lg" className="w-full text-sm" onClick={() => navigate("/")}>
                Get started free
              </Button>
            }
          />

          {/* Growth */}
          <PricingTierCard
            icon={<Zap className="h-5 w-5 text-brand-mid" />}
            name="Growth"
            description="Scale across your team"
            price="From $19"
            priceNote="/role/month"
            accentClass="border-brand-mid/40"
            highlighted
            badge="Most popular"
            features={[
              "Unlimited analyses & simulations",
              "Team dashboards & heatmaps",
              "Bulk role upload (ATS sync)",
              "Workspace & member management",
              "Volume discounts at scale",
            ]}
            cta={
              <Button size="lg" className="w-full gap-1.5 text-sm" onClick={() => navigate("/contact")}>
                <ArrowRight className="h-4 w-4" /> Contact us
              </Button>
            }
          />

          {/* Enterprise */}
          <PricingTierCard
            icon={<Building2 className="h-5 w-5" />}
            name="Enterprise"
            description="For org-wide transformation"
            price="Custom"
            priceNote="Tailored to your org"
            accentClass="border-brand-ai/30"
            features={[
              "Everything in Growth",
              "SSO & admin controls",
              "Model-aware re-scoring SLA",
              "Dedicated account manager",
              "Custom integrations & API",
            ]}
            cta={
              <Button size="lg" className="w-full gap-1.5 text-sm" onClick={() => navigate("/contact")}>
                <ArrowRight className="h-4 w-4" /> Talk to sales
              </Button>
            }
          />

        </div>
      </section>

      {/* Growth Volume Pricing */}
      <section className="px-4 pb-16 sm:pb-20">
        <div className="mx-auto max-w-2xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-8">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mid/10">
              <Crown className="h-5 w-5 text-brand-mid" />
            </div>
            <h2 className="font-sans text-2xl font-bold text-foreground">Growth volume pricing</h2>
            <p className="text-sm text-muted-foreground mt-2">The more roles you map, the less you pay per role.</p>
          </motion.div>
          <GrowthPricingTable />
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-20 sm:pb-24">
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
