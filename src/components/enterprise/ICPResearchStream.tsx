import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Types ── */
export type PhaseStatus = "pending" | "active" | "complete";

export interface ResearchPhase {
  id: string;
  label: string;
  sublabel?: string;
  status: PhaseStatus;
  progress?: number; // 0-100
  findings?: ResearchFinding[];
  streamingText?: string;
}

export interface ResearchFinding {
  label: string;
  value: string;
  confidence?: number; // 0-100
  highlight?: boolean;
}

interface ICPResearchStreamProps {
  targetDomain: string;
  phases: ResearchPhase[];
  elapsedSeconds?: number;
  className?: string;
}

/* ── Helpers ── */
function PhaseNode({ status }: { status: PhaseStatus }) {
  if (status === "complete") {
    return (
      <div className="size-8 bg-background border border-primary rounded-full flex items-center justify-center shadow-[0_0_15px_hsl(var(--primary)/0.25)] z-10">
        <div className="size-2.5 bg-primary rounded-full" />
      </div>
    );
  }
  if (status === "active") {
    return (
      <div className="size-8 bg-background border-2 border-[hsl(270,80%,60%)] rounded-full flex items-center justify-center shadow-[0_0_20px_hsl(270,80%,60%,0.3)] z-10 relative">
        <div className="absolute size-8 rounded-full border border-[hsl(270,80%,60%)] animate-ping opacity-50" />
        <div className="size-2.5 bg-[hsl(270,80%,60%)] rounded-full shadow-[0_0_10px_hsl(270,80%,60%)]" />
      </div>
    );
  }
  return (
    <div className="size-8 bg-background border border-muted-foreground/30 rounded-full z-10" />
  );
}

function formatTime(s: number): string {
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(Math.floor(secs)).padStart(2, "0")}.${String(Math.floor((secs % 1) * 10))}s`;
}

/* ── Phase Card ── */
function PhaseCard({ phase }: { phase: ResearchPhase }) {
  const isActive = phase.status === "active";
  const isComplete = phase.status === "complete";
  const isPending = phase.status === "pending";

  if (isPending) {
    return (
      <div className="bg-transparent border border-border/40 border-dashed rounded-2xl p-6 opacity-30 saturate-0">
        <div className="flex justify-between items-center">
          <h2 className="text-lg text-muted-foreground font-medium flex items-center gap-3 tracking-tight">
            <span className="font-mono text-xs text-muted-foreground bg-muted/30 border border-border/50 px-2.5 py-1 rounded">
              {phase.id}
            </span>
            {phase.label}
          </h2>
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            Awaiting Signals
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl transition-colors duration-500 ${
        isActive
          ? "bg-card/70 border border-[hsl(270,80%,60%,0.4)] shadow-[inset_0_0_40px_hsl(270,80%,60%,0.05),0_0_20px_hsl(270,80%,60%,0.05)]"
          : "bg-card/50 border border-border/30 hover:border-primary/30"
      }`}
    >
      {/* Ambient pulse for active card */}
      {isActive && (
        <div className="absolute right-0 top-0 w-[300px] h-[300px] bg-[hsl(270,80%,60%,0.08)] blur-[90px] rounded-full pointer-events-none animate-pulse" />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg text-foreground font-medium flex items-center gap-3 tracking-tight">
            <span className={`font-mono text-xs px-2.5 py-1 rounded ${
              isActive
                ? "text-background bg-[hsl(270,80%,60%)] border border-[hsl(270,80%,60%)] shadow-[0_0_15px_hsl(270,80%,60%,0.3)]"
                : "text-primary bg-primary/10 border border-primary/20 shadow-[0_0_10px_hsl(var(--primary)/0.15)]"
            }`}>
              {phase.id}
            </span>
            {phase.label}
          </h2>

          {isActive ? (
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-widest text-[hsl(270,80%,60%)] font-mono animate-pulse">
                {phase.sublabel || "Synthesizing"}
              </span>
              <div className="flex gap-1">
                {[0, 150, 300].map(delay => (
                  <div
                    key={delay}
                    className="w-1 h-3 bg-[hsl(270,80%,60%)] animate-pulse"
                    style={{ animationDelay: `${delay}ms`, opacity: 0.4 + delay / 500 }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <span className="font-mono text-sm text-primary flex items-center gap-2">
              <span className="text-muted-foreground text-xs uppercase tracking-widest">Status</span>
              {phase.progress ?? 100}%
            </span>
          )}
        </div>

        {/* Findings */}
        {phase.findings && phase.findings.length > 0 && (
          <div className="flex flex-col gap-4">
            {phase.findings.map((f, i) => (
              <div
                key={i}
                className={`flex gap-4 items-stretch p-4 rounded-xl ${
                  f.highlight
                    ? "border border-[hsl(270,80%,60%,0.3)] bg-[hsl(270,80%,60%,0.03)]"
                    : "border border-border/30 bg-background/40"
                }`}
              >
                <div className={`w-1.5 rounded-full shrink-0 ${
                  f.highlight
                    ? "bg-gradient-to-b from-[hsl(270,80%,60%)] to-transparent"
                    : "bg-primary/50 shadow-[0_0_8px_hsl(var(--primary)/0.15)]"
                }`} />
                <div className="flex flex-col gap-1.5 w-full">
                  <div className="flex justify-between items-center">
                    <span className={`font-mono text-sm tracking-tight ${
                      f.highlight ? "text-[hsl(270,80%,60%)]" : "text-primary"
                    }`}>
                      {f.label}
                    </span>
                    {f.confidence && (
                      <span className="font-mono text-xs text-muted-foreground border border-border/50 px-2 py-0.5 rounded">
                        {f.confidence}% conf.
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.value}</p>
                </div>
              </div>
            ))}

            {/* Streaming cursor */}
            {isActive && phase.streamingText && (
              <div className="flex gap-4 items-stretch p-4 rounded-xl border border-[hsl(270,80%,60%,0.3)] bg-[hsl(270,80%,60%,0.03)]">
                <div className="w-1.5 bg-gradient-to-b from-[hsl(270,80%,60%)] to-transparent rounded-full shrink-0" />
                <div className="flex flex-col gap-2 w-full">
                  <span className="font-mono text-sm text-[hsl(270,80%,60%)] flex items-center gap-2">
                    Generating…
                    <span className="size-1.5 bg-[hsl(270,80%,60%)] rounded-full animate-bounce shadow-[0_0_5px_hsl(270,80%,60%)]" />
                  </span>
                  <div className="font-mono text-sm text-muted-foreground leading-loose">
                    {phase.streamingText}
                    <span className="inline-block w-2.5 h-4 bg-[hsl(270,80%,60%)] ml-1.5 -mb-0.5 animate-pulse shadow-[0_0_8px_hsl(270,80%,60%)]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty active state */}
        {isActive && (!phase.findings || phase.findings.length === 0) && (
          <div className="flex items-center gap-3 font-mono text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-[hsl(270,80%,60%)] border-t-transparent rounded-full animate-spin" />
            <span>Analyzing website content…</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main Component ── */
export default function ICPResearchStream({
  targetDomain,
  phases,
  elapsedSeconds = 0,
  className = "",
}: ICPResearchStreamProps) {
  const displayDomain = targetDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className={`flex flex-col gap-10 relative ${className}`}>
      {/* Subtitle */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-[hsl(270,80%,60%)] uppercase tracking-widest animate-pulse">
          Deep Research in Progress
        </span>
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          This takes 30-90 seconds
        </span>
      </div>

      {/* Phase pipeline with spine */}
      <div className="relative pl-14 flex flex-col gap-8">
        {/* The vertical spine */}
        <div className="absolute left-[27px] top-4 bottom-8 w-px bg-gradient-to-b from-primary via-[hsl(270,80%,60%)] to-muted-foreground/10 shadow-[0_0_8px_hsl(var(--primary)/0.3)]" />

        <AnimatePresence>
          {phases.map((phase) => (
            <div key={phase.id} className="relative">
              {/* Node on the spine */}
              <div className="absolute -left-14 top-4">
                <PhaseNode status={phase.status} />
              </div>
              <PhaseCard phase={phase} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
