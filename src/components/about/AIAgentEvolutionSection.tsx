import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import openclawChart from "@/assets/openclaw-adoption.png";
import { Bot, Cpu, Network, Users } from "lucide-react";

const fade = {
  hidden: { opacity: 0, y: 24 },
  visible: (d: number) => ({
    opacity: 1, y: 0,
    transition: { delay: d * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

/* Capability data: what % of a typical team's headcount can AI handle at each evolution stage */
const CAPABILITY_DATA = [
  { stage: "No AI", tool: 0, agent: 0, orchestrator: 0, label: "2020" },
  { stage: "Basic Tools", tool: 8, agent: 0, orchestrator: 0, label: "2022" },
  { stage: "Copilots", tool: 25, agent: 5, orchestrator: 0, label: "2023" },
  { stage: "Single Agents", tool: 30, agent: 35, orchestrator: 0, label: "2024" },
  { stage: "Multi-Agent", tool: 30, agent: 55, orchestrator: 15, label: "2025" },
  { stage: "Orchestrators", tool: 25, agent: 50, orchestrator: 60, label: "2026" },
  { stage: "Full Autonomy", tool: 20, agent: 40, orchestrator: 85, label: "2027+" },
];

const EVOLUTION_STEPS = [
  {
    icon: Cpu,
    title: "AI as Tool",
    subtitle: "~8-25% task replacement",
    desc: "Autocomplete, grammar check, basic automation. Humans do 100% of the thinking — AI just speeds up execution.",
    color: "hsl(var(--territory-technical))",
    bg: "hsl(var(--territory-technical) / 0.1)",
  },
  {
    icon: Bot,
    title: "AI as Agent",
    subtitle: "~35-55% task replacement",
    desc: "Autonomous agents that write code, run campaigns, analyze data, and make decisions. Each agent replaces a junior employee.",
    color: "hsl(var(--warning))",
    bg: "hsl(var(--warning) / 0.1)",
  },
  {
    icon: Network,
    title: "AI Agent Orchestrator",
    subtitle: "~60-85% task replacement",
    desc: "Platforms like OpenClaw coordinate fleets of specialized agents. One human manages what used to require an entire department.",
    color: "hsl(var(--destructive))",
    bg: "hsl(var(--destructive) / 0.1)",
  },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-xs">
      <p className="font-bold text-foreground mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-foreground">{p.value}%</span> of headcount replaceable
        </p>
      ))}
    </div>
  );
};

export default function AIAgentEvolutionSection() {
  return (
    <>
      {/* ═══ ADOPTION CHART ═══ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="py-20 px-6"
        style={{ background: "hsl(var(--surface-stone) / 0.4)" }}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fade} custom={0} className="text-center mb-10">
            <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">The Tipping Point</span>
            <h2 className="text-3xl sm:text-4xl font-fantasy font-bold mt-4">
              AI Agent Adoption is <span className="text-destructive">Exploding</span>
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              OpenClaw — the first open-source AI agent orchestration framework — went from zero to 140K+ GitHub stars in weeks, 
              eclipsing DeepSeek and Grok. This isn't a trend. It's a workforce revolution.
            </p>
          </motion.div>

          <motion.div variants={fade} custom={1} className="rounded-xl border border-border bg-card p-4 sm:p-6 overflow-hidden">
            <img
              src={openclawChart}
              alt="OpenClaw GitHub stars growth chart showing explosive adoption surpassing DeepSeek and Grok"
              className="w-full h-auto rounded-lg"
              loading="lazy"
            />
            <p className="text-xs text-muted-foreground mt-3 text-center italic">
              GitHub stars over time: OpenClaw's vertical adoption curve signals a paradigm shift from individual AI tools to orchestrated agent fleets.
            </p>
          </motion.div>

          {/* What this means callout */}
          <motion.div variants={fade} custom={2} className="mt-8 grid sm:grid-cols-3 gap-4">
            {[
              { icon: "📈", stat: "140K+", label: "Stars in weeks", sub: "Fastest-adopted AI framework in history" },
              { icon: "🏢", stat: "Enterprise", label: "Adoption wave", sub: "Companies replacing entire teams with agent fleets" },
              { icon: "⚡", stat: "10x", label: "Productivity claim", sub: "One human + orchestrator = former 10-person team" },
            ].map((item, i) => (
              <motion.div key={item.label} variants={fade} custom={i + 3} className="rounded-xl border border-border bg-card p-5 text-center">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-2xl font-bold font-fantasy mt-2 text-foreground">{item.stat}</p>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ═══ CAPABILITY EVOLUTION CHART ═══ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="py-20 px-6"
      >
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fade} custom={0} className="text-center mb-6">
            <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">The Evolution</span>
            <h2 className="text-3xl sm:text-4xl font-fantasy font-bold mt-4">
              Tool → Agent → <span className="text-destructive">Orchestrator</span>
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              Each leap in AI capability exponentially increases the percentage of a team's headcount that can be replaced. 
              The question isn't <em>if</em> — it's whether you'll be the one <strong>managing the agents</strong> or <strong>replaced by them</strong>.
            </p>
          </motion.div>

          {/* Evolution steps */}
          <motion.div variants={fade} custom={1} className="grid md:grid-cols-3 gap-4 mb-10">
            {EVOLUTION_STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                variants={fade}
                custom={i + 2}
                className="rounded-xl border border-border p-5 relative overflow-hidden"
                style={{ background: step.bg }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: step.color + "22" }}>
                    <step.icon className="h-5 w-5" style={{ color: step.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{step.title}</h3>
                    <p className="text-xs font-mono" style={{ color: step.color }}>{step.subtitle}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                {i < 2 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 text-2xl font-bold">
                    →
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Stacked area chart */}
          <motion.div variants={fade} custom={5} className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <h3 className="text-sm font-bold text-foreground mb-1">Workforce Headcount Replacement Capability</h3>
            <p className="text-xs text-muted-foreground mb-4">% of traditional team roles that AI can perform at each evolution stage</p>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={CAPABILITY_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTool" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(200, 70%, 50%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(200, 70%, 50%)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradAgent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(40, 90%, 55%)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="hsl(40, 90%, 55%)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradOrch" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 75%, 55%)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="hsl(0, 75%, 55%)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.06)" />
                <XAxis dataKey="label" tick={{ fill: "hsl(0 0% 60%)", fontSize: 11 }} axisLine={{ stroke: "hsl(0 0% 100% / 0.1)" }} />
                <YAxis tick={{ fill: "hsl(0 0% 60%)", fontSize: 11 }} axisLine={{ stroke: "hsl(0 0% 100% / 0.1)" }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={50} stroke="hsl(0 0% 100% / 0.15)" strokeDasharray="6 4" label={{ value: "50% threshold", fill: "hsl(0 0% 50%)", fontSize: 10, position: "right" }} />
                <Area type="monotone" dataKey="tool" name="AI Tools" stackId="1" stroke="hsl(200, 70%, 50%)" fill="url(#gradTool)" strokeWidth={2} />
                <Area type="monotone" dataKey="agent" name="AI Agents" stackId="1" stroke="hsl(40, 90%, 55%)" fill="url(#gradAgent)" strokeWidth={2} />
                <Area type="monotone" dataKey="orchestrator" name="Agent Orchestrators" stackId="1" stroke="hsl(0, 75%, 55%)" fill="url(#gradOrch)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs">
              {[
                { color: "hsl(200, 70%, 50%)", label: "AI Tools (Copilots, Autocomplete)" },
                { color: "hsl(40, 90%, 55%)", label: "AI Agents (Autonomous Workers)" },
                { color: "hsl(0, 75%, 55%)", label: "Agent Orchestrators (OpenClaw)" },
              ].map(l => (
                <span key={l.label} className="flex items-center gap-1.5">
                  <span className="w-3 h-1.5 rounded-full" style={{ background: l.color }} />
                  <span className="text-muted-foreground">{l.label}</span>
                </span>
              ))}
            </div>
          </motion.div>

          {/* Bottom insight */}
          <motion.div variants={fade} custom={6} className="mt-8 rounded-xl border p-5 text-center"
            style={{ borderColor: "hsl(var(--destructive) / 0.3)", background: "hsl(var(--destructive) / 0.05)" }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-5 w-5 text-destructive" />
              <span className="font-bold text-foreground">The Implication</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              By 2027, agent orchestrators could handle <strong className="text-foreground">85% of routine team tasks</strong>. 
              The remaining 15% — strategy, judgment, ethics, stakeholder trust — is where human value concentrates. 
              <span className="text-primary font-semibold"> That's exactly what Xcrow trains you for.</span>
            </p>
          </motion.div>
        </div>
      </motion.section>
    </>
  );
}
