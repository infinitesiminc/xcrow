import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, RefreshCw, Brain, Users, TrendingUp, AlertTriangle } from "lucide-react";

const ROTATING_MODELS = [
  "GPT-5.4", "Claude 4.7 Sonnet", "Gemini 3.1 Flash", "Llama 4 Maverick",
  "Gemini 3.1 Pro", "Mistral Large 3", "GPT-5.3", "Claude 4.6",
  "Gemini 3 Flash", "DeepSeek R2 Lite", "GPT-5.2", "DeepSeek R2",
];

const TIMELINE_TAIL = [
  { time: "T+2h", event: "Engine detects 34 task clusters affected", icon: Brain, color: "bg-dot-blue/10 text-dot-blue" },
  { time: "T+6h", event: "Risk scores recalibrated across Legal & Finance", icon: RefreshCw, color: "bg-dot-purple/10 text-dot-purple" },
  { time: "T+12h", event: "19 new simulations generated for affected roles", icon: Brain, color: "bg-muted" },
  { time: "T+24h", event: "127 employees re-queued with updated scenarios", icon: Users, color: "bg-dot-teal/10 text-dot-teal" },
];

const SCORE_SHIFTS = [
  { task: "Contract Review & Redlining", before: 52, after: 74, dept: "Legal", reason: "GPT-5 handles clause extraction natively" },
  { task: "Financial Report Summarization", before: 61, after: 83, dept: "Finance", reason: "Multi-doc reasoning now production-grade" },
  { task: "Compliance Policy Drafting", before: 38, after: 67, dept: "Legal", reason: "Regulatory language generation significantly improved" },
  { task: "Marketing Copy A/B Testing", before: 70, after: 88, dept: "Marketing", reason: "Variant generation + performance prediction combined" },
];

const IMPACT_SUMMARY = [
  { label: "Tasks reclassified", value: "34", detail: "from Human+AI → Mostly AI" },
  { label: "Employees affected", value: "127", detail: "across 3 departments" },
  { label: "New simulations", value: "19", detail: "auto-generated, role-specific" },
  { label: "Time to adapt", value: "<24h", detail: "zero manual intervention" },
];

export default function StepModelAdaptation() {
  const [modelIdx, setModelIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setModelIdx((prev) => (prev + 1) % ROTATING_MODELS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        When a new frontier model drops, the engine doesn't wait for a curriculum committee.
        Here's what happened at Anthropic when GPT-5 was released — fully automated, zero human intervention.
      </p>

      {/* Impact summary */}
      <div className="grid grid-cols-2 gap-3">
        {IMPACT_SUMMARY.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-border bg-card p-3 space-y-1"
          >
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {s.label}
            </span>
            <p className="text-xl font-bold font-mono">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.detail}</p>
          </motion.div>
        ))}
      </div>

      {/* Adaptation timeline */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-3.5 w-3.5 text-dot-amber" />
          <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Adaptation Timeline
          </h4>
        </div>
        <div className="space-y-2">
          {TIMELINE.map((t, i) => (
            <motion.div
              key={t.time}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              className="flex items-center gap-3 rounded-lg border border-border/40 px-3 py-2"
            >
              <span className="text-xs font-mono font-bold text-muted-foreground w-12 shrink-0">
                {t.time}
              </span>
              <div className={`w-7 h-7 rounded-full ${t.color} flex items-center justify-center shrink-0`}>
                <t.icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm text-foreground">{t.event}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Score shifts */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-3.5 w-3.5 text-dot-teal" />
          <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            AI Exposure Score Shifts
          </h4>
        </div>
        <div className="space-y-2">
          {SCORE_SHIFTS.map((s, i) => (
            <motion.div
              key={s.task}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="rounded-lg border border-border/40 px-3 py-2.5 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{s.task}</span>
                <div className="flex items-center gap-1.5 text-sm font-mono">
                  <span className="text-muted-foreground">{s.before}%</span>
                  <span className="text-muted-foreground/50">→</span>
                  <span className="font-bold text-dot-amber">{s.after}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground">
                  {s.dept}
                </span>
                <span className="text-[11px] text-muted-foreground">{s.reason}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Auto-requeue callout */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="rounded-xl border border-dot-teal/20 bg-dot-teal/5 p-4 flex items-start gap-3"
      >
        <RefreshCw className="h-4 w-4 text-dot-teal mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Always adapting — no manual intervention
          </p>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Every employee whose tasks shifted above the AI exposure threshold was automatically
            re-queued with new simulations calibrated to GPT-5's capabilities. Coaching tips updated.
            Manager dashboards refreshed. The entire adaptation cycle completed in under 24 hours.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
