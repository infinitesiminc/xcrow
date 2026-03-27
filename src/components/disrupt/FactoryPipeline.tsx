import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Circle, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { toast } from "sonner";

export type StageId = "market-intel" | "business-model" | "tech-blueprint" | "landing-page" | "launch-plan" | "pitch-summary";
export type StageStatus = "queued" | "running" | "complete";

export interface StageData {
  status: StageStatus;
  content: string;
}

const STAGE_META: { id: StageId; label: string; emoji: string; description: string }[] = [
  { id: "market-intel", label: "Market Intel", emoji: "🔍", description: "Pain points & competitor weaknesses" },
  { id: "business-model", label: "Business Model", emoji: "📋", description: "Lean canvas & pricing strategy" },
  { id: "tech-blueprint", label: "Tech Blueprint", emoji: "⚙️", description: "Stack, AI integrations, architecture" },
  { id: "landing-page", label: "Landing Page", emoji: "🌐", description: "Hero copy, features, CTA" },
  { id: "launch-plan", label: "Launch Plan", emoji: "🚀", description: "30-day go-to-market timeline" },
  { id: "pitch-summary", label: "Pitch Summary", emoji: "💼", description: "5-slide investor pitch outline" },
];

interface FactoryPipelineProps {
  stages: Record<StageId, StageData>;
}

export default function FactoryPipeline({ stages }: FactoryPipelineProps) {
  const [expanded, setExpanded] = useState<StageId | null>(null);

  const toggle = (id: StageId) => setExpanded(prev => prev === id ? null : id);

  const copyContent = (content: string, label: string) => {
    navigator.clipboard.writeText(content);
    toast.success(`${label} copied to clipboard`);
  };

  const completedCount = STAGE_META.filter(s => stages[s.id]?.status === "complete").length;

  return (
    <div className="flex flex-col h-full">
      {/* Progress header */}
      <div className="px-4 py-3 border-b border-border/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Factory Progress</span>
          <Badge variant="outline" className="text-[10px]">{completedCount}/6</Badge>
        </div>
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / 6) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Stages list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1.5">
          {STAGE_META.map((meta, i) => {
            const stage = stages[meta.id] || { status: "queued", content: "" };
            const isExpanded = expanded === meta.id;
            const hasContent = stage.content.length > 0;

            return (
              <div key={meta.id} className="rounded-lg border border-border/40 bg-card/50 overflow-hidden">
                <button
                  onClick={() => hasContent ? toggle(meta.id) : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${hasContent ? "hover:bg-muted/20 cursor-pointer" : "cursor-default"}`}
                >
                  {/* Status icon */}
                  {stage.status === "complete" ? (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  ) : stage.status === "running" ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                  )}

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{meta.emoji}</span>
                      <span className={`text-xs font-medium ${stage.status === "queued" ? "text-muted-foreground/50" : "text-foreground"}`}>
                        {meta.label}
                      </span>
                    </div>
                    {stage.status === "running" && (
                      <p className="text-[10px] text-primary mt-0.5 animate-pulse">Working...</p>
                    )}
                  </div>

                  {/* Expand arrow */}
                  {hasContent && (
                    isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && hasContent && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border/30"
                  >
                    <div className="px-3 py-2 max-h-64 overflow-y-auto">
                      <div className="prose prose-sm prose-invert max-w-none text-xs leading-relaxed">
                        <ReactMarkdown>{stage.content}</ReactMarkdown>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => copyContent(stage.content, meta.label)}>
                          <Copy className="w-3 h-3" /> Copy
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

export { STAGE_META };
