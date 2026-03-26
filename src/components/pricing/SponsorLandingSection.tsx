/**
 * SponsorLandingSection — CTA section on the Pricing page for employers
 * to sponsor credits for candidates/employees.
 */

import { motion } from "framer-motion";
import { Building2, Users, BarChart3, Target, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const fade = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const cinzel = { fontFamily: "'Cinzel', serif" };
const stoneCard = {
  background: "hsl(var(--surface-stone))",
  border: "1px solid hsl(var(--filigree) / 0.2)",
  boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))",
};

const BENEFITS = [
  {
    icon: Target,
    title: "Targeted Skill Sponsorship",
    desc: "Fund specific skill territories — sponsor only the AI competencies your talent pipeline needs.",
  },
  {
    icon: Users,
    title: "Talent Pipeline Access",
    desc: "See anonymized leaderboard data and skill profiles of sponsored users who opt in.",
  },
  {
    icon: BarChart3,
    title: "ROI Dashboard",
    desc: "Track credit usage, skill completions, and candidate engagement in real time.",
  },
];

export default function SponsorLandingSection() {
  const navigate = useNavigate();

  return (
    <motion.section
      variants={fade}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="py-16"
    >
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-3">
          <Building2 size={14} />
          Employer Sponsorship
        </div>
        <h2
          className="text-2xl md:text-3xl font-bold text-foreground mb-3"
          style={cinzel}
        >
          Sponsor Your Future Workforce
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm">
          Purchase credit bundles for candidates, interns, or employees.
          They train on the exact AI skills your roles demand — you get visibility into their progress.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto mb-10">
        {BENEFITS.map((b, i) => (
          <motion.div
            key={b.title}
            variants={fade}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl p-5 text-center"
            style={stoneCard}
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <b.icon size={20} className="text-primary" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1.5" style={cinzel}>
              {b.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {b.desc}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Pricing tiers */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {[
          { credits: 100, price: "$49", perCredit: "$0.49" },
          { credits: 500, price: "$199", perCredit: "$0.40", popular: true },
          { credits: 2000, price: "$599", perCredit: "$0.30" },
        ].map(tier => (
          <div
            key={tier.credits}
            className={`rounded-xl px-6 py-4 text-center min-w-[160px] ${tier.popular ? "ring-2 ring-primary" : ""}`}
            style={stoneCard}
          >
            {tier.popular && (
              <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Most Popular</div>
            )}
            <div className="text-2xl font-bold text-foreground" style={cinzel}>
              {tier.credits}
            </div>
            <div className="text-xs text-muted-foreground mb-1">credits</div>
            <div className="text-lg font-bold text-foreground">{tier.price}</div>
            <div className="text-[10px] text-muted-foreground">{tier.perCredit}/credit</div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Button
          size="lg"
          className="gap-2"
          onClick={() => navigate("/contact")}
        >
          <Building2 size={16} />
          Contact for Sponsorship
          <ArrowRight size={14} />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Custom volumes available. Free pilot for first 50 credits.
        </p>
      </div>
    </motion.section>
  );
}
