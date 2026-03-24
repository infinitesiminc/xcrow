/**
 * Schools page — explicit benefits of gamified learning for the shifting job market.
 */
import { motion } from "framer-motion";
import { Brain, Flame, RefreshCcw, Shield, Sparkles, Zap } from "lucide-react";

interface Props {
  fade: (delay?: number) => object;
}

const BENEFITS = [
  {
    icon: Brain,
    title: "AI-Readiness Through Practice",
    desc: "73% of employers now test AI fluency. Our simulations let students practice prompting, evaluating AI output, and human-AI collaboration on real job tasks — not toy examples.",
    color: "territory-technical",
    stat: "73% of employers test for this",
  },
  {
    icon: Zap,
    title: "Retention Through Repetition",
    desc: "Gamified quests with XP, progression, and leaderboards drive 4× more practice sessions than traditional assignments. Skills stick because students actually want to practice.",
    color: "territory-strategic",
    stat: "4× more practice sessions",
  },
  {
    icon: RefreshCcw,
    title: "Curriculum That Updates Itself",
    desc: "Our skill map is built from live job postings across 3,600+ companies. When employer demand shifts, new simulations appear automatically — your students always train on what matters now.",
    color: "territory-analytical",
    stat: "Live market alignment",
  },
  {
    icon: Shield,
    title: "Human Edge Skills",
    desc: "AI can't replace strategic thinking, stakeholder management, or ethical reasoning. Our simulations specifically build these 'Human Edge' skills that make graduates irreplaceable.",
    color: "territory-leadership",
    stat: "31 human-edge skills mapped",
  },
  {
    icon: Flame,
    title: "Progressive Difficulty",
    desc: "Castle-based progression means students start with foundations and advance to boss-level challenges. No student is overwhelmed; every student is challenged.",
    color: "territory-creative",
    stat: "5 mastery levels per skill",
  },
  {
    icon: Sparkles,
    title: "Employer-Aligned Proof",
    desc: "Students build a verified skill portfolio mapped to real employer requirements. Career offices get hard data on employment readiness — not self-reported surveys.",
    color: "territory-communication",
    stat: "Verified skill portfolios",
  },
];

export default function SchoolsBenefitsGrid({ fade }: Props) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {BENEFITS.map((b, i) => (
        <motion.div key={b.title} {...fade(i * 0.08)}
          className="rounded-2xl border border-border/50 p-6 relative overflow-hidden group hover:border-border transition-colors"
          style={{
            background: "hsl(var(--card))",
            boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))",
          }}>
          <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `hsl(var(--${b.color}))` }} />

          <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-4"
            style={{ background: `hsl(var(--${b.color}) / 0.1)`, border: `1px solid hsl(var(--${b.color}) / 0.2)` }}>
            <b.icon className="h-5 w-5" style={{ color: `hsl(var(--${b.color}))` }} />
          </div>

          <h3 className="font-fantasy text-[15px] font-bold mb-2">{b.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{b.desc}</p>

          <span className="inline-flex items-center text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
              background: `hsl(var(--${b.color}) / 0.08)`,
              color: `hsl(var(--${b.color}))`,
              border: `1px solid hsl(var(--${b.color}) / 0.15)`,
            }}>
            {b.stat}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
