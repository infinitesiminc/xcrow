/**
 * ToolDetailCard — Inline tool detail overlay for the map's Codex panel.
 * Shows rich info from the GTC registry when a collected tool is tapped.
 */
import { motion } from "framer-motion";
import { X, ExternalLink, Sparkles, Eye, Plus, Check } from "lucide-react";
import { GTC_TOOLS, CATEGORY_CONFIG } from "@/data/gtc-tools-registry";
import { getSkillsForTool } from "@/data/tool-skill-mappings";
import { useMyStack } from "@/hooks/use-my-stack";

interface Props {
  toolName: string;
  onClose: () => void;
  onSkillClick?: (skillName: string) => void;
}

export default function ToolDetailCard({ toolName, onClose, onSkillClick }: Props) {
  const tool = GTC_TOOLS.find(t => t.name === toolName);
  const { toggleTool, isInStack } = useMyStack();
  const skills = getSkillsForTool(toolName);

  if (!tool) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="px-3 pb-3"
      >
        <div className="rounded-xl p-3 text-center" style={{ background: "hsl(var(--muted) / 0.1)" }}>
          <p className="text-xs text-muted-foreground">Tool "{toolName}" not in registry yet.</p>
          <button onClick={onClose} className="text-[10px] text-primary mt-2 underline">Back</button>
        </div>
      </motion.div>
    );
  }

  const catConfig = CATEGORY_CONFIG[tool.category];
  const inStack = isInStack(tool.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="px-3 pb-3 space-y-3"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0 mt-0.5">{tool.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold" style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--foreground))" }}>
            {tool.name}
          </h3>
          <p className="text-[10px] text-muted-foreground">{tool.company}</p>
        </div>
        <button onClick={onClose} className="shrink-0 p-1 rounded-md hover:bg-muted/20">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {tool.version && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-mono" style={{ background: "hsl(var(--muted) / 0.3)", color: "hsl(var(--foreground))" }}>
            v{tool.version}
          </span>
        )}
        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: catConfig.color + "22", color: catConfig.color }}>
          {catConfig.label}
        </span>
        {tool.type === "learnable" ? (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ background: "hsl(140, 60%, 45%, 0.15)", color: "hsl(140, 60%, 45%)" }}>
            <Sparkles className="h-2.5 w-2.5" /> Hands-on
          </span>
        ) : (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ background: "hsl(var(--muted) / 0.2)", color: "hsl(var(--muted-foreground))" }}>
            <Eye className="h-2.5 w-2.5" /> Reference
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-[11px] leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.75)" }}>
        {tool.description}
      </p>

      {/* Skills you'll build */}
      {skills.length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
            Skills · Tap to explore on map
          </p>
          <div className="flex flex-wrap gap-1.5">
            {skills.map(skill => (
              <button
                key={skill}
                onClick={() => onSkillClick?.(skill)}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 transition-colors hover:opacity-80"
                style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
              >
                🎯 {skill}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      {tool.products && tool.products.length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
            Suite · {tool.products.length} products
          </p>
          <div className="space-y-1">
            {tool.products.slice(0, 4).map(p => (
              <div key={p.name} className="px-2 py-1.5 rounded-lg" style={{ background: "hsl(var(--muted) / 0.08)", border: "1px solid hsl(var(--border) / 0.12)" }}>
                <span className="text-[10px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>{p.name}</span>
                <p className="text-[9px] mt-0.5" style={{ color: "hsl(var(--foreground) / 0.5)" }}>{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-1.5 pt-1">
        <button
          onClick={() => toggleTool(tool.name)}
          className="w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
          style={{
            background: inStack ? "hsl(45, 90%, 55%, 0.15)" : "hsl(var(--muted) / 0.15)",
            border: `1px solid ${inStack ? "hsl(45, 90%, 55%, 0.4)" : "hsl(var(--border) / 0.2)"}`,
            color: inStack ? "hsl(45, 90%, 55%)" : "hsl(var(--foreground))",
            fontFamily: "'Cinzel', serif",
          }}
        >
          {inStack ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {inStack ? "In My Stack" : "Add to Stack"}
        </button>
        {tool.url && (
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-1.5 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1"
            style={{ border: "1px solid hsl(var(--border) / 0.2)", color: "hsl(var(--foreground) / 0.7)" }}
          >
            <ExternalLink className="h-2.5 w-2.5" /> Visit Website
          </a>
        )}
      </div>
    </motion.div>
  );
}
