/**
 * Schools page — 8 skill territories with market context.
 */
import { motion } from "framer-motion";
import { TERRITORIES } from "@/lib/territory-colors";
import TerritoryEmblem from "@/components/TerritoryEmblem";

interface Props {
  fade: (delay?: number) => object;
}

const TERRITORY_BENEFITS: Record<string, string> = {
  Technical: "Cloud, data pipelines, and system design — the foundation employers test first.",
  Analytical: "Data-driven reasoning and pattern recognition that AI augments but can't replace.",
  Strategic: "Long-term planning and resource allocation skills that define senior-level performance.",
  Creative: "Innovation, design thinking, and lateral problem-solving for differentiated outcomes.",
  Communication: "Stakeholder alignment, persuasion, and cross-functional clarity under pressure.",
  Leadership: "Team mobilization, conflict resolution, and decision-making when stakes are high.",
  "AI Mastery": "Prompt engineering, AI evaluation, and human-AI collaboration fluency.",
  "Human Edge": "Ethical reasoning, empathy, and judgment that no algorithm can replicate.",
};

export default function SchoolsSkillBattlegrounds({ fade }: Props) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {TERRITORIES.map((t, i) => (
        <motion.div key={t.category} {...fade(i * 0.06)}
          className="rounded-xl border border-border/50 p-5 text-center relative overflow-hidden group hover:border-border transition-colors"
          style={{
            background: "hsl(var(--card))",
            boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))",
          }}>
          <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: t.hsl }} />

          <div className="flex justify-center mb-3">
            <TerritoryEmblem category={t.category} size={36} />
          </div>

          <h3 className="font-fantasy text-sm font-bold mb-1" style={{ color: t.hsl }}>
            {t.terrain}
          </h3>
          <p className="text-[11px] text-muted-foreground leading-snug">
            {TERRITORY_BENEFITS[t.category] || t.category}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
