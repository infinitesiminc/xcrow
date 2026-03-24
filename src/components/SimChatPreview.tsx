/**
 * Animated simulation chat preview for the How It Works page.
 * Shows a scripted back-and-forth between the AI sim engine and a user,
 * with chat bubbles that appear one by one on a timed loop.
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChatBubble {
  role: "system" | "ai" | "user";
  content: string;
  delay: number; // ms after previous bubble
}

const SCRIPT: ChatBubble[] = [
  { role: "system", content: "🎯 Simulation: \"Evaluate AI-generated marketing copy for a product launch\"", delay: 0 },
  { role: "ai", content: "You're a Senior Marketing Manager at a D2C brand. Your AI assistant just drafted 3 email variants for a product launch. Review them and decide which to send — or rewrite.", delay: 1200 },
  { role: "user", content: "Variant B has the strongest hook but the CTA is too aggressive for our brand voice. I'd edit the last paragraph and A/B test against Variant A.", delay: 2400 },
  { role: "ai", content: "Strong judgment. You identified tone misalignment — a common AI output trap. Your edit preserves the hook while staying on-brand. **+18 XP Strategic Thinking, +12 XP AI Output Validation.**", delay: 2200 },
  { role: "system", content: "⚔️ Round 2 of 4 — Difficulty adapting to your responses…", delay: 1800 },
  { role: "ai", content: "Plot twist: Your CEO just forwarded a competitor's launch email that outperforms yours 2:1 in open rate. It was fully AI-generated. How do you respond to the team?", delay: 2000 },
  { role: "user", content: "I'd analyze what made it work — subject line, timing, segmentation — rather than panic. AI-generated doesn't mean we copy it; we learn the pattern and apply our brand lens.", delay: 2800 },
  { role: "ai", content: "Excellent composure under pressure. You separated signal from noise and kept strategic ownership. **+22 XP Adaptive Thinking, +15 XP Domain Judgment.** 🏆", delay: 2000 },
];

const TOTAL_CYCLE = SCRIPT.reduce((t, b) => t + b.delay, 0) + 4000; // pause before restart

export default function SimChatPreview() {
  const [visibleCount, setVisibleCount] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let idx = 0;
    let accDelay = 800; // initial pause

    function scheduleNext() {
      if (idx < SCRIPT.length) {
        accDelay += SCRIPT[idx].delay;
        const currentIdx = idx + 1;
        timeoutRef.current = setTimeout(() => {
          setVisibleCount(currentIdx);
          idx++;
          scheduleNext();
        }, SCRIPT[idx].delay);
        idx++;
        // undo the idx++ above since we do it inside the timeout
        idx--;
        // Simplified: just schedule one at a time
      } else {
        // Restart after pause
        timeoutRef.current = setTimeout(() => {
          setVisibleCount(0);
          idx = 0;
          setTimeout(() => scheduleNext(), 600);
        }, 4000);
      }
    }

    // Sequential scheduling
    function runSequence() {
      if (idx >= SCRIPT.length) {
        timeoutRef.current = setTimeout(() => {
          setVisibleCount(0);
          idx = 0;
          setTimeout(() => runSequence(), 600);
        }, 4000);
        return;
      }
      const bubble = SCRIPT[idx];
      const thisIdx = idx + 1;
      timeoutRef.current = setTimeout(() => {
        setVisibleCount(thisIdx);
        idx++;
        runSequence();
      }, bubble.delay);
    }

    runSequence();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const displayed = SCRIPT.slice(0, visibleCount);

  return (
    <div className="max-w-2xl mx-auto rounded-2xl border border-border/50 overflow-hidden"
      style={{ background: "hsl(var(--card))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 8px 32px hsl(var(--emboss-shadow))" }}>

      {/* Header bar */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border/50"
        style={{ background: "hsl(var(--secondary) / 0.6)" }}>
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-fantasy font-semibold text-foreground">Live Simulation — Level 1</span>
        <Badge variant="outline" className="ml-auto text-[10px] border-primary/30 text-primary">AI-Powered</Badge>
      </div>

      {/* Chat area */}
      <div className="p-5 space-y-3 min-h-[320px] max-h-[420px] overflow-hidden relative">
        <AnimatePresence mode="popLayout">
          {displayed.map((bubble, i) => (
            <motion.div
              key={`${i}-${visibleCount > i ? "on" : "off"}`}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={`flex gap-2.5 ${bubble.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              {bubble.role !== "system" && (
                <div className={`shrink-0 h-7 w-7 rounded-lg flex items-center justify-center ${
                  bubble.role === "ai"
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {bubble.role === "ai" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
              )}

              {/* Bubble */}
              <div className={`rounded-xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed ${
                bubble.role === "system"
                  ? "w-full text-center text-xs font-mono text-muted-foreground bg-secondary/50 rounded-lg py-2"
                  : bubble.role === "ai"
                    ? "bg-secondary text-foreground"
                    : "text-foreground"
              }`}
                style={bubble.role === "user" ? {
                  background: "hsl(var(--primary) / 0.12)",
                  border: "1px solid hsl(var(--primary) / 0.2)",
                } : undefined}
              >
                {bubble.content.split("**").map((part, pi) =>
                  pi % 2 === 1
                    ? <strong key={pi} className="text-primary font-semibold">{part}</strong>
                    : <span key={pi}>{part}</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {visibleCount < SCRIPT.length && visibleCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-muted-foreground"
          >
            <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="flex gap-1 px-3 py-2 rounded-xl bg-secondary">
              {[0, 1, 2].map(d => (
                <span key={d} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
                  style={{ animation: `pulse 1.2s ease-in-out ${d * 0.2}s infinite` }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
          style={{ background: "linear-gradient(to top, hsl(var(--card)), transparent)" }} />
      </div>
    </div>
  );
}
