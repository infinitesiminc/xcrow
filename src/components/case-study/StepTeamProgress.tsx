import { motion } from "framer-motion";
import { TrendingUp, Users, BarChart3, Target } from "lucide-react";

const STATS = [
  { label: "Org Readiness Score", value: "67%", delta: "+12% since launch", icon: Target },
  { label: "Employees Assessed", value: "312 / 400", delta: "78% completion", icon: Users },
  { label: "Avg. Pillar Score", value: "71%", delta: "+8% vs. baseline", icon: BarChart3 },
  { label: "Upskill Velocity", value: "4.2 sims/wk", delta: "per employee avg", icon: TrendingUp },
];

const DEPT_DATA = [
  { name: "Engineering", score: 74, employees: 89, trend: "+6%" },
  { name: "Legal", score: 61, employees: 34, trend: "+14%" },
  { name: "Marketing", score: 68, employees: 42, trend: "+9%" },
  { name: "Finance", score: 58, employees: 28, trend: "+11%" },
  { name: "Operations", score: 72, employees: 55, trend: "+7%" },
  { name: "Product", score: 76, employees: 38, trend: "+5%" },
];

function readinessColor(s: number) {
  if (s >= 70) return "bg-dot-teal";
  if (s >= 60) return "bg-dot-amber";
  return "bg-dot-purple";
}

export default function StepTeamProgress() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        The executive dashboard gives CHROs a real-time view of organizational AI readiness.
        Here's what Anthropic's deployment looks like 8 weeks in.
      </p>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-border bg-card p-3 space-y-1"
          >
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <s.icon className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.delta}</p>
          </motion.div>
        ))}
      </div>

      {/* Department scorecard */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
          Department Readiness
        </h4>
        <div className="space-y-2">
          {DEPT_DATA.map((d, i) => (
            <motion.div
              key={d.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="flex items-center gap-3"
            >
              <span className="text-sm w-24 truncate">{d.name}</span>
              <div className="flex-1 h-5 bg-muted/30 rounded-md overflow-hidden">
                <div
                  className={`h-full rounded-md ${readinessColor(d.score)} transition-all`}
                  style={{ width: `${d.score}%`, opacity: 0.7 }}
                />
              </div>
              <span className="text-xs font-mono font-medium w-10 text-right">{d.score}%</span>
              <span className="text-[11px] text-dot-teal font-medium w-10">{d.trend}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
