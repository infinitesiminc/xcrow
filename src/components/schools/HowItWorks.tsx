/**
 * Schools page — 3-step deployment flow.
 */
import { motion } from "framer-motion";
import { BarChart3, Briefcase, Users } from "lucide-react";

interface Props {
  fade: (delay?: number) => object;
}

const STEPS = [
  {
    step: "01",
    title: "Enroll Your Cohort",
    desc: "Domain auto-enroll, CSV import, or invite links — seat your entire student body in minutes. Zero IT tickets required.",
    icon: Users,
    color: "var(--territory-analytical)",
  },
  {
    step: "02",
    title: "Map the Battlefield",
    desc: "We analyze 183 high-demand skills against 3,600+ employer job feeds. You see exactly where your students stand — and where the gaps are.",
    icon: BarChart3,
    color: "var(--territory-strategic)",
  },
  {
    step: "03",
    title: "Connect Employer Quests",
    desc: "Link your employer partners' ATS feeds. Students practice tasks your specific recruiters hire for — building proof that matters.",
    icon: Briefcase,
    color: "var(--territory-leadership)",
  },
];

export default function SchoolsHowItWorks({ fade }: Props) {
  return (
    <div className="space-y-4">
      {STEPS.map((item, i) => (
        <motion.div key={item.step} {...fade(i * 0.1)}
          className="flex items-start gap-4 rounded-xl border border-border/50 p-5"
          style={{
            background: "hsl(var(--card))",
            boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))",
          }}>
          <div className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
            style={{ background: `hsl(${item.color} / 0.12)`, border: `1px solid hsl(${item.color} / 0.2)` }}>
            <span className="text-sm font-bold font-fantasy" style={{ color: `hsl(${item.color})` }}>
              {item.step}
            </span>
          </div>
          <item.icon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: `hsl(${item.color})` }} />
          <div className="flex-1">
            <h3 className="font-fantasy font-semibold text-[15px]">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
