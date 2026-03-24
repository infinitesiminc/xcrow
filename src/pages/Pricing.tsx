/**
 * /pricing — The Armory: Choose your path.
 * Targets 4 segments: Students, Professionals, Universities, Companies/HR.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check, ArrowRight, Loader2, HelpCircle, Shield, Crown, Castle, Building2,
  GraduationCap, Briefcase, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import xcrowLogo from "@/assets/xcrow-logo.png";

/* ─── Feature lists ─── */
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

const COMPANY_FEATURES = [
  "AI-readiness mapping for every role",
  "Task-level exposure & augmentation scoring",
  "Team progress dashboard & skill heatmaps",
  "ATS integration for auto-import",
  "Custom quest campaigns per department",
  "Exportable reports & benchmarks",
  "Dedicated account manager",
];

const GROWTH_TIERS = [
  { roles: "1–10", price: "$29" },
  { roles: "11–50", price: "$19" },
  { roles: "51–200", price: "$12" },
  { roles: "200+", price: "Custom" },
];

/* ─── Segment Tabs ─── */
type Segment = "students" | "professionals" | "institutions";

const faqs: Record<Segment, { q: string; a: string }[]> = {
  students: [
    { q: "Is it really free?", a: "Yes! The Recruit plan gives you 3 quests per moon with unlimited kingdom scouting. Recruit allies to earn +2 bonus quests each — no cap!" },
    { q: "What does Champion unlock?", a: "Champion removes all quest limits, unlocks full 3-ring growth tracking, and lets you summon the Crow — your AI Career Scout." },
    { q: "What if my school already has a license?", a: "If your university has an Xcrow Guild license, your guild admin will invite you via email. You'll automatically get Champion access at no cost." },
    { q: "Can I cancel anytime?", a: "Absolutely. Cancel from your settings and you'll keep access until the end of your billing period." },
  ],
  professionals: [
    { q: "How is this different from LinkedIn Learning?", a: "Xcrow maps your actual job tasks against AI impact, then builds quest-based training on YOUR specific skill gaps — not generic courses." },
    { q: "Can my company pay for Champion?", a: "Yes! Ask your L&D team about our War Room plan, which includes Champion access for all mapped employees." },
    { q: "Do I keep my progress if my company signs up?", a: "Yes — your personal territory, quests, and skill data carry over seamlessly." },
    { q: "Can I cancel anytime?", a: "Absolutely. Cancel from your settings and keep access until the end of your billing period." },
  ],
  institutions: [
    { q: "How does the Guild Hall work?", a: "We work with universities to create custom packages based on student count, programs, and desired outcomes. Contact our team to discuss pricing and start a free pilot." },
    { q: "Do guilds get a free pilot?", a: "Yes — we offer a no-cost pilot so guilds can see the impact before committing. Talk to our team to get started." },
    { q: "How does per-role pricing work?", a: "Companies pay per role mapped. Volume discounts kick in at 11+ roles. Each mapped role includes full task analysis, AI exposure scoring, and quest generation." },
    { q: "Can we integrate with our ATS?", a: "Yes — we support Greenhouse, Lever, Ashby, and manual CSV import. Roles sync automatically once connected." },
  ],
};

export default function Pricing() {
  const { user, plan, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [segment, setSegment] = useState<Segment>("students");

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
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-16 sm:pt-20 pb-6 sm:pb-10">
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
            <p className="mx-auto mt-3 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Whether you're a student, professional, university, or enterprise — there's a path for you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Segment Tabs */}
      <section className="px-4 pb-4">
        <div className="mx-auto max-w-5xl flex justify-center">
          <Tabs value={segment} onValueChange={(v) => setSegment(v as Segment)}>
            <TabsList className="bg-[hsl(var(--surface-stone))] border border-border/60">
              <TabsTrigger value="students" className="gap-1.5 text-xs sm:text-sm">
                <GraduationCap className="h-3.5 w-3.5" /> Students
              </TabsTrigger>
              <TabsTrigger value="professionals" className="gap-1.5 text-xs sm:text-sm">
                <Briefcase className="h-3.5 w-3.5" /> Professionals
              </TabsTrigger>
              <TabsTrigger value="institutions" className="gap-1.5 text-xs sm:text-sm">
                <Building2 className="h-3.5 w-3.5" /> Institutions
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* Individual Plans (Students & Professionals) */}
      {(segment === "students" || segment === "professionals") && (
        <IndividualPlans
          segment={segment}
          plan={plan}
          loadingCheckout={loadingCheckout}
          onUpgrade={handleUpgrade}
          onNavigate={navigate}
        />
      )}

      {/* Institutional Plans */}
      {segment === "institutions" && (
        <InstitutionalPlans plan={plan} onNavigate={navigate} />
      )}

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
            {faqs[segment].map((faq, i) => (
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

/* ═══════════════════════════════════════════
   Individual Plans — Students & Professionals
   ═══════════════════════════════════════════ */
function IndividualPlans({ segment, plan, loadingCheckout, onUpgrade, onNavigate }: {
  segment: "students" | "professionals";
  plan: string;
  loadingCheckout: boolean;
  onUpgrade: () => void;
  onNavigate: (path: string) => void;
}) {
  const isStudent = segment === "students";

  const tiers = [
    {
      name: "Recruit",
      price: "$0",
      period: "forever",
      description: isStudent
        ? "Start your journey. Scout kingdoms before graduation."
        : "Explore your role's AI exposure. No commitment.",
      features: FREE_FEATURES,
      icon: Shield,
      cta: plan === "free" ? "Current Plan" : "Downgrade",
      ctaDisabled: plan === "free",
      onCta: () => onNavigate("/"),
      highlight: false,
      territoryColor: "territory-analytical",
    },
    {
      name: "Champion",
      price: "$9.99",
      period: "/month",
      description: isStudent
        ? "Unlimited quests. Full territory. Graduate AI-ready."
        : "Unlimited quests. Full territory. Stay ahead of AI disruption.",
      features: PRO_FEATURES,
      icon: Crown,
      cta: plan === "pro" ? "Current Plan" : plan === "school" ? "Included via Guild" : "Ascend to Champion",
      ctaDisabled: plan === "pro" || plan === "school",
      onCta: onUpgrade,
      highlight: true,
      territoryColor: "territory-strategic",
    },
  ];

  return (
    <section className="px-4 pb-12 sm:pb-16">
      <div className="mx-auto max-w-3xl grid sm:grid-cols-2 gap-6">
        {tiers.map((tier, i) => (
          <TierCard key={tier.name} tier={tier} index={i} loadingCheckout={loadingCheckout} />
        ))}
      </div>

      {/* Upsell to institutional */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mx-auto max-w-2xl mt-10 rounded-2xl border border-[hsl(var(--filigree)/0.15)] p-6 text-center"
        style={{ background: "hsl(var(--surface-parchment))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}
      >
        {isStudent ? (
          <>
            <Castle className="h-7 w-7 text-[hsl(var(--filigree-glow))] mx-auto mb-2" />
            <h3 className="text-base font-bold text-foreground font-fantasy mb-1">Your university can cover this</h3>
            <p className="text-sm text-muted-foreground mb-3">Ask your career center about Xcrow Guild — students get Champion for free.</p>
            <Button variant="outline" size="sm" onClick={() => onNavigate("/contact")} className="border-[hsl(var(--filigree)/0.3)]">
              Tell My School <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </>
        ) : (
          <>
            <Building2 className="h-7 w-7 text-[hsl(var(--territory-leadership))] mx-auto mb-2" />
            <h3 className="text-base font-bold text-foreground font-fantasy mb-1">Need this for your team?</h3>
            <p className="text-sm text-muted-foreground mb-3">The War Room maps every role and upskills your entire workforce.</p>
            <Button variant="outline" size="sm" onClick={() => onNavigate("/contact")} className="border-[hsl(var(--filigree)/0.3)]">
              Talk to Sales <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </>
        )}
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Institutional Plans — Universities & Companies
   ═══════════════════════════════════════════ */
function InstitutionalPlans({ plan, onNavigate }: {
  plan: string;
  onNavigate: (path: string) => void;
}) {
  const tiers = [
    {
      name: "Guild Hall",
      subtitle: "For Universities",
      price: "Custom",
      period: "per seat / year",
      description: "AI readiness for your entire university guild. Free pilot available.",
      features: SCHOOL_FEATURES,
      icon: Castle,
      cta: plan === "school" ? "Active License" : "Start Free Pilot",
      ctaDisabled: plan === "school",
      onCta: () => onNavigate("/contact"),
      highlight: false,
      territoryColor: "territory-leadership",
    },
    {
      name: "War Room",
      subtitle: "For Companies",
      price: "From $12",
      period: "/ role / month",
      description: "Map every role's AI exposure. Upskill your workforce with targeted quests.",
      features: COMPANY_FEATURES,
      icon: Building2,
      cta: "Talk to Sales",
      ctaDisabled: false,
      onCta: () => onNavigate("/contact"),
      highlight: true,
      territoryColor: "territory-strategic",
    },
  ];

  return (
    <section className="px-4 pb-12 sm:pb-16">
      <div className="mx-auto max-w-4xl grid md:grid-cols-2 gap-6">
        {tiers.map((tier, i) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative rounded-2xl"
          >
            <div className={`absolute top-0 inset-x-0 h-[3px] bg-[hsl(var(--${tier.territoryColor}))]`} />
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
                  Popular with HR
                </div>
              )}

              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center border ${
                    tier.highlight ? "bg-[hsl(var(--territory-strategic)/0.15)] border-[hsl(var(--territory-strategic)/0.3)]" : "bg-[hsl(var(--surface-stone))] border-border/60"
                  }`}>
                    <tier.icon className={`h-5 w-5 ${tier.highlight ? "text-[hsl(var(--territory-strategic))]" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground font-fantasy leading-tight">{tier.name}</h3>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{tier.subtitle}</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-3xl font-bold text-foreground">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">{tier.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5">{tier.description}</p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`h-4 w-4 shrink-0 mt-0.5 text-[hsl(var(--${tier.territoryColor}))]`} />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={tier.highlight ? "default" : "outline"}
                disabled={tier.ctaDisabled}
                onClick={tier.onCta}
                style={tier.highlight ? { boxShadow: "0 0 20px hsl(var(--territory-strategic) / 0.25)" } : undefined}
              >
                {tier.cta}
                {!tier.ctaDisabled && <ArrowRight className="h-3.5 w-3.5 ml-1.5" />}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Volume pricing table for War Room */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mx-auto max-w-md mt-10"
      >
        <h3 className="text-center text-sm font-semibold text-foreground mb-3 font-fantasy">War Room Volume Pricing</h3>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-2 text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-widest bg-muted/50 px-5 py-3">
            <span>Roles mapped</span>
            <span className="text-right">Price / role / mo</span>
          </div>
          {GROWTH_TIERS.map((t) => (
            <div key={t.roles} className="grid grid-cols-2 px-5 py-3.5 border-t border-border items-center">
              <span className="text-sm text-foreground flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> {t.roles} roles
              </span>
              <span className="text-xl sm:text-2xl font-bold text-foreground text-right">{t.price}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Shared Tier Card (Recruit / Champion)
   ═══════════════════════════════════════════ */
function TierCard({ tier, index, loadingCheckout }: {
  tier: {
    name: string; price: string; period: string; description: string;
    features: string[]; icon: any; cta: string; ctaDisabled: boolean;
    onCta: () => void; highlight: boolean; territoryColor: string;
  };
  index: number;
  loadingCheckout: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative rounded-2xl"
    >
      <div className={`absolute top-0 inset-x-0 h-[3px] bg-[hsl(var(--${tier.territoryColor}))]`} />
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
              <Check className={`h-4 w-4 shrink-0 mt-0.5 text-[hsl(var(--${tier.territoryColor}))]`} />
              <span className="text-foreground/80">{f}</span>
            </li>
          ))}
        </ul>

        <Button
          className="w-full"
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
  );
}
