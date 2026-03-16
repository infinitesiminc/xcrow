import { motion } from "framer-motion";
import { MessageSquare, Bot, User, Shield, Brain, Wrench, Lightbulb } from "lucide-react";

const PILLARS = [
  { icon: Wrench, label: "Tool Awareness", score: 72, desc: "Knows which AI tools to use and when" },
  { icon: Shield, label: "Human Value-Add", score: 85, desc: "Identifies where human judgment is irreplaceable" },
  { icon: Brain, label: "Adaptive Thinking", score: 58, desc: "Pivots approach when AI outputs are unexpected" },
  { icon: Lightbulb, label: "Domain Judgment", score: 91, desc: "Applies expertise to validate AI recommendations" },
];

const MOCK_MESSAGES = [
  {
    role: "system" as const,
    text: "You're reviewing a contract amendment flagged by an AI tool. The AI suggests accepting all changes, but two clauses modify liability caps. What do you do?",
  },
  {
    role: "user" as const,
    text: "I'd review the liability clauses manually since AI often misses contextual legal nuances. I'd cross-reference with our standard terms and escalate to senior counsel if the caps fall below our threshold.",
  },
  {
    role: "assistant" as const,
    text: "Strong response. You correctly identified the AI's limitation with contextual legal analysis and proposed a systematic human review process. This demonstrates excellent domain judgment and appropriate tool awareness.",
  },
];

function scoreColor(s: number) {
  if (s >= 80) return "text-brand-human";
  if (s >= 60) return "text-brand-mid";
  return "text-brand-ai";
}

export default function StepSimPreview() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Each employee runs through AI-calibrated simulations that test how well they work{" "}
        <em>alongside</em> AI — not just whether they know the tools. Here's a sample exchange.
      </p>

      {/* Mock chat */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Simulation Preview
          </span>
        </div>

        {MOCK_MESSAGES.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
              m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}>
              {m.role === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
            </div>
            <div className={`text-sm leading-relaxed rounded-lg px-3 py-2 max-w-[85%] ${
              m.role === "user"
                ? "bg-primary text-primary-foreground"
                : m.role === "system"
                ? "bg-muted/50 border border-border italic"
                : "bg-muted/30 border border-border"
            }`}>
              {m.text}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pillar scores */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
          AI Readiness Pillars
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="rounded-lg border border-border/50 p-3 space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <p.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">{p.label}</span>
                </div>
                <span className={`text-sm font-mono font-bold ${scoreColor(p.score)}`}>
                  {p.score}%
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
