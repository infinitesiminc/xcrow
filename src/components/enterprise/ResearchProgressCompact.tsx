import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import type { ResearchPhase, ResearchFinding } from "./ICPResearchStream";

interface ResearchProgressCompactProps {
  targetDomain: string;
  phases: ResearchPhase[];
  elapsedSeconds?: number;
  className?: string;
}

const PHASE_LABELS = ["Website DNA", "ICP & Personas", "Competitors", "Pipeline Seed"];

function formatTime(s: number): string {
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  const tenths = Math.floor((s % 1) * 10);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${tenths}s`;
}

/** Extract persona-like findings from Phase 2 */
function extractPersonaChips(phases: ResearchPhase[]): string[] {
  const phase2 = phases.find(p => p.id === "PHASE_02");
  if (!phase2?.findings) return [];
  return phase2.findings
    .map(f => {
      // Try to extract a concise persona label from the finding
      const titleMatch = f.label.match(/(VP|Director|CTO|CEO|CFO|COO|Head|Manager|Chief|SVP|EVP|President)[\s\w&/·-]*/i);
      if (titleMatch) return titleMatch[0].trim().slice(0, 40);
      // Fall back to first 30 chars of label
      return f.label.slice(0, 30);
    })
    .filter(Boolean)
    .slice(0, 5);
}

/** Get a live ticker string from the latest finding across all active/complete phases */
function getLatestTicker(phases: ResearchPhase[]): string | null {
  // Walk backwards through phases to find the most recent finding
  for (let i = phases.length - 1; i >= 0; i--) {
    const p = phases[i];
    if (p.findings && p.findings.length > 0) {
      const latest = p.findings[p.findings.length - 1];
      return `${latest.label}: ${latest.value.slice(0, 80)}${latest.value.length > 80 ? "…" : ""}`;
    }
    if (p.streamingText) {
      return p.streamingText.slice(0, 100);
    }
  }
  return null;
}

export default function ResearchProgressCompact({
  targetDomain,
  phases,
  elapsedSeconds = 0,
  className = "",
}: ResearchProgressCompactProps) {
  const displayDomain = targetDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const personaChips = extractPersonaChips(phases);
  const ticker = getLatestTicker(phases);
  const [tickerVisible, setTickerVisible] = useState(true);
  const prevTickerRef = useRef(ticker);

  // Animate ticker change
  useEffect(() => {
    if (ticker !== prevTickerRef.current) {
      setTickerVisible(false);
      const t = setTimeout(() => {
        prevTickerRef.current = ticker;
        setTickerVisible(true);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [ticker]);

  const activeIdx = phases.findIndex(p => p.status === "active");
  const activePhase = activeIdx >= 0 ? phases[activeIdx] : null;

  return (
    <div className={`flex flex-col items-center justify-center gap-6 ${className}`}>
      {/* Domain + timer */}
      <div className="flex items-center gap-4 w-full max-w-lg justify-between">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-primary animate-pulse shadow-[0_0_12px_hsl(var(--primary))]" />
          <span className="font-mono text-sm text-primary">
            {displayDomain}
          </span>
        </div>
        <span className="font-mono text-sm text-muted-foreground tabular-nums">
          {formatTime(elapsedSeconds)}
        </span>
      </div>

      {/* Horizontal stepper */}
      <div className="flex items-center gap-0 w-full max-w-lg">
        {phases.map((phase, i) => {
          const isComplete = phase.status === "complete";
          const isActive = phase.status === "active";
          return (
            <div key={phase.id} className="flex items-center flex-1">
              {/* Node */}
              <div className="flex flex-col items-center gap-1.5 relative">
                <div className={`size-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  isComplete
                    ? "bg-primary border-primary"
                    : isActive
                    ? "border-[hsl(270,80%,60%)] bg-background shadow-[0_0_15px_hsl(270,80%,60%,0.3)]"
                    : "border-muted-foreground/30 bg-background"
                }`}>
                  {isComplete ? (
                    <Check className="w-4 h-4 text-primary-foreground" />
                  ) : isActive ? (
                    <>
                      <div className="absolute size-8 rounded-full border border-[hsl(270,80%,60%)] animate-ping opacity-30" />
                      <div className="size-2.5 bg-[hsl(270,80%,60%)] rounded-full" />
                    </>
                  ) : (
                    <div className="size-2 bg-muted-foreground/20 rounded-full" />
                  )}
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap ${
                  isComplete ? "text-primary" : isActive ? "text-[hsl(270,80%,60%)]" : "text-muted-foreground/50"
                }`}>
                  {PHASE_LABELS[i] || phase.label}
                </span>
              </div>
              {/* Connector */}
              {i < phases.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-500 ${
                  isComplete ? "bg-primary" : "bg-muted-foreground/15"
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Active phase label */}
      {activePhase && (
        <motion.div
          key={activePhase.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="flex gap-1">
            {[0, 150, 300].map(delay => (
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
        </motion.div>
      )}

      {/* Persona chips */}
      <AnimatePresence>
        {personaChips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex flex-wrap gap-2 justify-center max-w-lg"
          >
            {personaChips.map((chip, i) => (
              <motion.span
                key={chip}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(270,80%,60%,0.1)] border border-[hsl(270,80%,60%,0.25)] text-xs font-medium text-[hsl(270,80%,60%)]"
              >
                🎯 {chip}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live ticker */}
      <div className="h-8 flex items-center justify-center w-full max-w-lg overflow-hidden">
        <AnimatePresence mode="wait">
          {ticker && tickerVisible && (
            <motion.p
              key={ticker}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-muted-foreground text-center truncate px-4 font-mono"
            >
              ▸ {ticker}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
