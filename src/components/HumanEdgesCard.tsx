/**
 * HumanEdgesCard — homepage discovery card that introduces the concept of
 * uniquely human skills ("edges") that AI cannot replace.
 * Each edge is a button that feeds a prompt into the homepage chat.
 */
import { motion } from "framer-motion";
import { Sparkles, Brain, Heart, Shield, ArrowRight } from "lucide-react";
const EDGE_EXAMPLES = [
  {
    icon: Brain,
    label: "System Thinking",
    desc: "Connecting dots AI can't see",
    prompt: "Show me roles where system thinking matters most — where connecting the big picture gives humans an edge over AI",
  },
  {
    icon: Heart,
    label: "Empathy & Culture",
    desc: "Building trust humans value",
    prompt: "What jobs rely most on empathy and cultural understanding? Show me where human connection is the real skill",
  },
  {
    icon: Shield,
    label: "Judgment Under Uncertainty",
    desc: "Deciding when data isn't enough",
    prompt: "Find me roles where judgment under uncertainty is critical — where humans must decide when AI can't",
  },
];

interface HumanEdgesCardProps {
  onEdgeClick?: (prompt: string) => void;
}

export default function HumanEdgesCard({ onEdgeClick }: HumanEdgesCardProps) {

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="rounded-2xl border border-border/50 bg-card p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Your Human Edges</h3>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Skills AI can't replace — click one to explore
          </p>
        </div>
      </div>

      {/* Edge buttons */}
      <div className="space-y-2">
        {EDGE_EXAMPLES.map(({ icon: Icon, label, desc, prompt }) => (
          <button
            key={label}
            onClick={() => handleClick(prompt)}
            className="w-full flex items-center gap-3 rounded-xl bg-muted/20 px-3 py-2.5 text-left hover:bg-muted/40 hover:border-primary/20 transition-colors group"
          >
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground">{label}</p>
              <p className="text-[10px] text-muted-foreground">{desc}</p>
            </div>
            <ArrowRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}
