import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Globe, Users, Swords, Target } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ResearchPhase, ResearchFinding } from "./ICPResearchStream";

interface ResearchProgressCompactProps {
  targetDomain: string;
  phases: ResearchPhase[];
  elapsedSeconds?: number;
  className?: string;
}

const PHASE_LABELS = ["Website DNA", "ICP & Personas", "Competitors", "Pipeline Seed"];
const PHASE_ICONS = [Globe, Users, Swords, Target];

function formatTime(s: number): string {
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  const tenths = Math.floor((s % 1) * 10);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${tenths}s`;
}

/** Collect all findings across all phases with phase context */
interface FindingWithPhase {
  phaseId: string;
  phaseLabel: string;
  phaseIdx: number;
  finding: ResearchFinding;
  key: string;
}

function collectAllFindings(phases: ResearchPhase[]): FindingWithPhase[] {
  const results: FindingWithPhase[] = [];
  phases.forEach((phase, idx) => {
    if (phase.findings) {
      phase.findings.forEach((f, fi) => {
        results.push({
          phaseId: phase.id,
          phaseLabel: PHASE_LABELS[idx] || phase.label,
          phaseIdx: idx,
          finding: f,
          key: `${phase.id}-${fi}`,
        });
      });
    }
  });
  return results;
}

/** Get streaming text from active phase */
function getActiveStreaming(phases: ResearchPhase[]): { text: string; phaseLabel: string } | null {
  const activeIdx = phases.findIndex(p => p.status === "active");
  if (activeIdx < 0) return null;
  const phase = phases[activeIdx];
  if (!phase.streamingText) return null;
  return { text: phase.streamingText, phaseLabel: PHASE_LABELS[activeIdx] || phase.label };
}

export default function ResearchProgressCompact({
  targetDomain,
  phases,
  elapsedSeconds = 0,
  className = "",
}: ResearchProgressCompactProps) {
  const displayDomain = targetDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const allFindings = collectAllFindings(phases);
  const activeStreaming = getActiveStreaming(phases);
  const feedEndRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const activeIdx = phases.findIndex(p => p.status === "active");
  const activePhase = activeIdx >= 0 ? phases[activeIdx] : null;

  // Auto-scroll to bottom when new findings arrive
  useEffect(() => {
    const currentCount = allFindings.length + (activeStreaming ? 1 : 0);
    if (currentCount > prevCountRef.current) {
      feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevCountRef.current = currentCount;
  }, [allFindings.length, activeStreaming]);

  return (
    <div className={`flex flex-col h-full w-full max-w-2xl mx-auto ${className}`}>
      {/* Header: Domain + timer */}
      <div className="flex items-center gap-4 w-full justify-between px-2 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-primary animate-pulse shadow-[0_0_12px_hsl(var(--primary))]" />
          <span className="font-mono text-sm text-primary">{displayDomain}</span>
        </div>
        <span className="font-mono text-sm text-muted-foreground tabular-nums">
          {formatTime(elapsedSeconds)}
        </span>
      </div>

      {/* Horizontal stepper */}
      <div className="flex items-center gap-0 w-full px-4 py-3 shrink-0">
        {phases.map((phase, i) => {
          const isComplete = phase.status === "complete";
          const isActive = phase.status === "active";
          const Icon = PHASE_ICONS[i];
          return (
            <div key={phase.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5 relative">
                <div
                  className={`size-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    isComplete
                      ? "bg-primary border-primary"
                      : isActive
                      ? "border-[hsl(270,80%,60%)] bg-background shadow-[0_0_15px_hsl(270,80%,60%,0.3)]"
                      : "border-muted-foreground/30 bg-background"
                  }`}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4 text-primary-foreground" />
                  ) : isActive ? (
                    <>
                      <div className="absolute size-9 rounded-full border border-[hsl(270,80%,60%)] animate-ping opacity-30" />
                      <Icon className="w-4 h-4 text-[hsl(270,80%,60%)]" />
                    </>
                  ) : (
                    <Icon className="w-3.5 h-3.5 text-muted-foreground/30" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium whitespace-nowrap ${
                    isComplete
                      ? "text-primary"
                      : isActive
                      ? "text-[hsl(270,80%,60%)]"
                      : "text-muted-foreground/50"
                  }`}
                >
                  {PHASE_LABELS[i] || phase.label}
                </span>
              </div>
              {i < phases.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-500 ${
                    isComplete ? "bg-primary" : "bg-muted-foreground/15"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Active phase label */}
      {activePhase && (
        <div className="flex items-center justify-center gap-3 py-2 shrink-0">
          <div className="flex gap-1">
            {[0, 150, 300].map((delay) => (
              <div
                key={delay}
                className="w-1 h-3 bg-[hsl(270,80%,60%)] rounded-sm animate-pulse"
                style={{ animationDelay: `${delay}ms`, opacity: 0.4 + delay / 500 }}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-foreground">{activePhase.label}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
            {activePhase.sublabel || "Analyzing"}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-border/40 mx-4 shrink-0" />

      {/* Live findings feed — scrollable */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-4 py-3 space-y-2">
          {allFindings.length === 0 && !activeStreaming && (
            <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
              <div className="w-4 h-4 border-2 border-[hsl(270,80%,60%)] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-mono">Connecting to research pipeline…</span>
            </div>
          )}

          {allFindings.map((item, i) => {
            const Icon = PHASE_ICONS[item.phaseIdx];
            const isNew = i >= allFindings.length - 2;
            return (
              <motion.div
                key={item.key}
                initial={isNew ? { opacity: 0, x: -8 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 items-start p-3 rounded-lg border transition-colors ${
                  item.finding.highlight
                    ? "border-[hsl(270,80%,60%,0.3)] bg-[hsl(270,80%,60%,0.04)]"
                    : "border-border/30 bg-card/30"
                }`}
              >
                {/* Phase icon */}
                <div
                  className={`size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    item.finding.highlight
                      ? "bg-[hsl(270,80%,60%,0.15)] text-[hsl(270,80%,60%)]"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`font-mono text-xs font-medium ${
                        item.finding.highlight ? "text-[hsl(270,80%,60%)]" : "text-primary"
                      }`}
                    >
                      {item.finding.label}
                    </span>
                    {item.finding.confidence && (
                      <span className="font-mono text-[10px] text-muted-foreground border border-border/50 px-1.5 py-0.5 rounded">
                        {item.finding.confidence}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.finding.value}
                  </p>
                </div>
              </motion.div>
            );
          })}

          {/* Live streaming text from active phase */}
          {activeStreaming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 items-start p-3 rounded-lg border border-[hsl(270,80%,60%,0.3)] bg-[hsl(270,80%,60%,0.04)]"
            >
              <div className="size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[hsl(270,80%,60%,0.15)]">
                <div className="w-2 h-2 bg-[hsl(270,80%,60%)] rounded-full animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-mono text-xs text-[hsl(270,80%,60%)] flex items-center gap-1.5 mb-1">
                  Analyzing…
                  <span className="size-1.5 bg-[hsl(270,80%,60%)] rounded-full animate-bounce" />
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed font-mono">
                  {activeStreaming.text.slice(-200)}
                  <span className="inline-block w-2 h-3.5 bg-[hsl(270,80%,60%)] ml-1 -mb-0.5 animate-pulse" />
                </p>
              </div>
            </motion.div>
          )}

          <div ref={feedEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
