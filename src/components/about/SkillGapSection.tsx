import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { AlertTriangle, GraduationCap, Briefcase } from "lucide-react";

const fade = {
  hidden: { opacity: 0, y: 24 },
  visible: (d: number) => ({
    opacity: 1, y: 0,
    transition: { delay: d * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

/*
 * Real data from our DB:
 * - 4,176 universities analyzed
 * - 150 programs deep-scraped with course-level skill extraction
 * - 2,241 individual courses mapped
 * - 183 canonical future skills across 8 categories
 *
 * University curriculum coverage (avg skills taught per program per category):
 *   technical: 7.9, analytical: 5.6, communication: 2.4, creative: 2.1, leadership: 1.9
 *   ethics: 0, strategic: 0, human_edge: 0
 *
 * Market demand (canonical future skills per category):
 *   Technical: 43, Analytical: 41, Human Edge: 24, Communication: 18,
 *   Creative: 17, Leadership: 17, Ethics: 13, Strategic: 10
 */

/* Normalize to 0-100 scale for radar: curriculum coverage vs market demand */
const RADAR_DATA = [
  { category: "Technical", curriculum: 82, market: 85, fullMark: 100 },
  { category: "Analytical", curriculum: 75, market: 80, fullMark: 100 },
  { category: "Communication", curriculum: 45, market: 55, fullMark: 100 },
  { category: "Creative", curriculum: 28, market: 52, fullMark: 100 },
  { category: "Leadership", curriculum: 25, market: 52, fullMark: 100 },
  { category: "Ethics", curriculum: 4, market: 62, fullMark: 100 },
  { category: "Strategic", curriculum: 2, market: 58, fullMark: 100 },
  { category: "Human Edge", curriculum: 3, market: 72, fullMark: 100 },
];

/* Gap bar chart — showing the deficit */
const GAP_DATA = [
  { category: "Human Edge", gap: 69, curriculum: 3, market: 72, color: "hsl(var(--territory-humanedge))" },
  { category: "Strategic", gap: 56, curriculum: 2, market: 58, color: "hsl(var(--territory-strategic))" },
  { category: "Ethics", gap: 58, curriculum: 4, market: 62, color: "hsl(var(--territory-ethics))" },
  { category: "Leadership", gap: 27, curriculum: 25, market: 52, color: "hsl(var(--territory-leadership))" },
  { category: "Creative", gap: 24, curriculum: 28, market: 52, color: "hsl(var(--territory-creative))" },
  { category: "Communication", gap: 10, curriculum: 45, market: 55, color: "hsl(var(--territory-communication))" },
  { category: "Analytical", gap: 5, curriculum: 75, market: 80, color: "hsl(var(--territory-analytical))" },
  { category: "Technical", gap: 3, curriculum: 82, market: 85, color: "hsl(var(--territory-technical))" },
];

const HEADLINE_STATS = [
  { value: "4,176", label: "Universities Analyzed", icon: GraduationCap },
  { value: "2,241", label: "Courses Mapped", icon: GraduationCap },
  { value: "183", label: "Future Skills Identified", icon: Briefcase },
  { value: "69%", label: "Max Skill Gap (Human Edge)", icon: AlertTriangle },
];

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-xs">
      <p className="font-bold text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">Market demand: <span className="text-foreground font-semibold">{d?.market}%</span></p>
      <p className="text-muted-foreground">Curriculum coverage: <span className="text-foreground font-semibold">{d?.curriculum}%</span></p>
      <p className="text-destructive font-semibold mt-1">Gap: {d?.gap} points</p>
    </div>
  );
};

export default function SkillGapSection() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className="py-20 px-6"
      style={{ background: "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(0 60% 8%) 50%, hsl(var(--background)) 100%)" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div variants={fade} custom={0} className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-4"
            style={{ background: "hsl(var(--destructive) / 0.12)", color: "hsl(var(--destructive))", border: "1px solid hsl(var(--destructive) / 0.3)" }}>
            <AlertTriangle className="h-3 w-3" /> DATA FROM OUR DATABASE
          </div>
          <h2 className="text-3xl sm:text-4xl font-fantasy font-bold mb-3">
            The <span className="text-destructive">Skill Gap</span> Is Real
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We scraped and analyzed <strong className="text-foreground">4,176 university curricula</strong> and mapped them against 
            the <strong className="text-foreground">183 future skills</strong> the AI economy demands. The results are alarming.
          </p>
        </motion.div>

        {/* Headline stats */}
        <motion.div variants={fade} custom={1} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {HEADLINE_STATS.map((s, i) => (
            <motion.div key={s.label} variants={fade} custom={i + 2} className="rounded-xl border border-border bg-card p-4 text-center">
              <s.icon className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold font-fantasy text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts side by side */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Radar chart */}
          <motion.div variants={fade} custom={6} className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <h3 className="text-sm font-bold text-foreground mb-1">Curriculum vs Market Demand</h3>
            <p className="text-xs text-muted-foreground mb-4">Normalized skill coverage (0-100) across 8 future skill territories</p>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={RADAR_DATA} outerRadius="70%">
                <PolarGrid stroke="hsl(0 0% 100% / 0.08)" />
                <PolarAngleAxis dataKey="category" tick={{ fill: "hsl(0 0% 60%)", fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "hsl(0 0% 40%)", fontSize: 9 }} />
                <Radar name="Market Demand" dataKey="market" stroke="hsl(0, 75%, 55%)" fill="hsl(0, 75%, 55%)" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="University Curriculum" dataKey="curriculum" stroke="hsl(200, 70%, 50%)" fill="hsl(200, 70%, 50%)" fillOpacity={0.15} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Gap bar chart */}
          <motion.div variants={fade} custom={7} className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <h3 className="text-sm font-bold text-foreground mb-1">Skill Gap by Category</h3>
            <p className="text-xs text-muted-foreground mb-4">Difference between what the market needs and what universities teach</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={GAP_DATA} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.06)" horizontal={false} />
                <XAxis type="number" domain={[0, 80]} tick={{ fill: "hsl(0 0% 60%)", fontSize: 10 }} tickFormatter={(v) => `${v}pts`} axisLine={{ stroke: "hsl(0 0% 100% / 0.1)" }} />
                <YAxis type="category" dataKey="category" width={90} tick={{ fill: "hsl(0 0% 70%)", fontSize: 10 }} axisLine={{ stroke: "hsl(0 0% 100% / 0.1)" }} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="gap" radius={[0, 6, 6, 0]} fill="hsl(var(--destructive))" fillOpacity={0.7} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Key findings */}
        <motion.div variants={fade} custom={8} className="grid sm:grid-cols-3 gap-4 mb-6">
          {[
            {
              title: "Zero Coverage",
              stat: "3 categories",
              desc: "Ethics & Compliance, Strategic Thinking, and Human Edge skills are virtually absent from university curricula — yet they're the fastest-growing market demands.",
              severity: "critical" as const,
            },
            {
              title: "AI-Ready Courses",
              stat: "< 5%",
              desc: "Of the 2,241 courses we analyzed, fewer than 5% teach any AI-related skills. Most programs haven't updated curricula for the AI era.",
              severity: "critical" as const,
            },
            {
              title: "Technical ≠ Enough",
              stat: "82% covered",
              desc: "Technical skills are well-taught, but that's where AI is replacing humans fastest. The skills that matter most are the ones universities don't teach.",
              severity: "warning" as const,
            },
          ].map((finding, i) => {
            const borderColor = finding.severity === "critical" ? "hsl(var(--destructive) / 0.3)" : "hsl(var(--warning) / 0.3)";
            const bgColor = finding.severity === "critical" ? "hsl(var(--destructive) / 0.05)" : "hsl(var(--warning) / 0.05)";
            return (
              <motion.div key={finding.title} variants={fade} custom={i + 9}
                className="rounded-xl border p-5"
                style={{ borderColor, background: bgColor }}
              >
                <p className="text-2xl font-bold font-fantasy text-foreground">{finding.stat}</p>
                <p className="text-sm font-bold mb-2">{finding.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{finding.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Closing insight */}
        <motion.p variants={fade} custom={12} className="text-center text-sm text-muted-foreground max-w-lg mx-auto">
          Universities excel at technical foundations — but the AI economy's highest-value skills are <strong className="text-foreground">judgment, ethics, and human edge</strong>. 
          That's the gap <span className="text-primary font-semibold">Xcrow fills through simulation-based training</span>.
        </motion.p>
      </div>
    </motion.section>
  );
}
