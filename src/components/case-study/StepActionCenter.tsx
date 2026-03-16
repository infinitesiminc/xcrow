import { motion } from "framer-motion";
import { AlertTriangle, User, RefreshCw, ChevronRight } from "lucide-react";

const BOTTLENECKS = [
  { task: "Contract Review & Redlining", failures: 18, pillar: "Tool Awareness", avgScore: 38 },
  { task: "Financial Modeling & Forecasting", failures: 14, pillar: "Adaptive Thinking", avgScore: 42 },
  { task: "Incident Response Triage", failures: 11, pillar: "Domain Judgment", avgScore: 45 },
  { task: "Content Compliance Screening", failures: 9, pillar: "Human Value-Add", avgScore: 51 },
];

const AT_RISK = [
  { name: "Sarah Chen", role: "Paralegal", weakAreas: 4, lowestPillar: "Tool Awareness", score: 28 },
  { name: "Marcus Johnson", role: "Financial Analyst", weakAreas: 3, lowestPillar: "Adaptive Thinking", score: 35 },
  { name: "Priya Patel", role: "Content Strategist", weakAreas: 3, lowestPillar: "Domain Judgment", score: 39 },
];

const QUEUE_ITEMS = [
  { employee: "Sarah Chen", task: "Contract Review", category: "Tool Awareness", attempt: 2, tip: "Focus on understanding which AI tools exist for your domain" },
  { employee: "Marcus Johnson", task: "Financial Modeling", category: "Adaptive Thinking", attempt: 1, tip: "Practice pivoting your approach when AI outputs are unexpected" },
];

function pillarColor(score: number) {
  if (score >= 60) return "text-brand-human";
  if (score >= 40) return "text-brand-mid";
  return "text-brand-ai";
}

export default function StepActionCenter() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        The Action Center transforms data into interventions. It flags bottleneck tasks,
        identifies employees needing coaching, and shows the adaptive retry queue working automatically.
      </p>

      {/* Bottleneck tasks */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-3.5 w-3.5 text-brand-ai" />
          <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Bottleneck Tasks
          </h4>
        </div>
        <div className="space-y-2">
          {BOTTLENECKS.map((b, i) => (
            <motion.div
              key={b.task}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2 hover:bg-muted/20 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate block">{b.task}</span>
                <span className="text-[11px] text-muted-foreground">
                  {b.failures} failures · Weakest: {b.pillar}
                </span>
              </div>
              <span className={`text-sm font-mono font-bold ml-2 ${pillarColor(b.avgScore)}`}>
                {b.avgScore}%
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-1" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* At-risk employees */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="h-3.5 w-3.5 text-brand-ai" />
          <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Employees Needing Coaching
          </h4>
        </div>
        <div className="space-y-2">
          {AT_RISK.map((e, i) => (
            <motion.div
              key={e.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2"
            >
              <div>
                <span className="text-sm font-medium">{e.name}</span>
                <span className="text-[11px] text-muted-foreground ml-2">{e.role}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-muted-foreground">
                  {e.weakAreas} weak areas
                </span>
                <span className={`text-xs font-mono font-bold ml-2 ${pillarColor(e.score)}`}>
                  {e.score}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Retry queue */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="h-3.5 w-3.5 text-dot-blue" />
          <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Adaptive Retry Queue
          </h4>
        </div>
        <div className="space-y-2">
          {QUEUE_ITEMS.map((q, i) => (
            <motion.div
              key={`${q.employee}-${q.task}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.06 }}
              className="rounded-lg border border-border/40 px-3 py-2 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{q.employee}</span>
                <span className="text-[11px] text-muted-foreground">
                  Attempt {q.attempt}/3
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {q.task} · {q.category}
              </p>
              <p className="text-[11px] italic text-muted-foreground/70">💡 {q.tip}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
