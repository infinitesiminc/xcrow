/**
 * HumanEdgesCard — homepage discovery card that introduces the concept of
 * uniquely human skills ("edges") that AI cannot replace.
 */
import { motion } from "framer-motion";
import { Sparkles, Brain, Heart, Shield, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const EDGE_EXAMPLES = [
  { icon: Brain, label: "System Thinking", desc: "Connecting dots AI can't see" },
  { icon: Heart, label: "Empathy & Culture", desc: "Building trust humans value" },
  { icon: Shield, label: "Judgment Under Uncertainty", desc: "Deciding when data isn't enough" },
];

export default function HumanEdgesCard() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();

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
            Skills AI can't replace — and employers will pay a premium for
          </p>
        </div>
      </div>

      {/* Edge examples */}
      <div className="space-y-2">
        {EDGE_EXAMPLES.map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl bg-muted/20 px-3 py-2.5"
          >
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">{label}</p>
              <p className="text-[10px] text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => (user ? navigate("/journey") : openAuthModal())}
        className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors py-1.5"
      >
        {user ? "Discover your edges" : "Sign in to discover your edges"}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}
