/**
 * L2SimFormats — Interactive mockup comparing 4 Level 2 simulation formats.
 * Each tab is a self-contained mini-sim prototype with rubric-based coaching.
 */
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, RotateCcw, CheckCircle2, AlertTriangle, Shield, Users, MessageSquare, GitBranch, HelpCircle, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

/* ── Shared scenario context ── */
const SCENARIO = {
  role: "Marketing Manager",
  task: "Campaign Performance Analysis",
  futureState: `Your company has deployed an AI agent pipeline that autonomously runs end-to-end campaign analysis: it pulls data from 6 platforms, generates attribution models, produces executive summaries, and auto-adjusts ad spend within pre-set guardrails. Your role has shifted from doing analysis to overseeing the AI's output and making strategic calls it can't.`,
};

const RUBRIC_DIMENSIONS = [
  { key: "risk_awareness", label: "Risk Awareness", desc: "Identified failure modes, blind spots, or edge cases" },
  { key: "strategic_depth", label: "Strategic Depth", desc: "Went beyond surface-level to structural/systemic thinking" },
  { key: "human_value", label: "Human Value-Add", desc: "Articulated what humans uniquely contribute here" },
  { key: "actionability", label: "Actionability", desc: "Proposed concrete next steps, not just observations" },
];

type Tab = "case" | "decision" | "redteam" | "stakeholder";
const TABS: { key: Tab; label: string; icon: typeof MessageSquare; desc: string }[] = [
  { key: "case", label: "Case Study", icon: MessageSquare, desc: "Write your strategic response to a future scenario" },
  { key: "decision", label: "Decision Tree", icon: GitBranch, desc: "Navigate branching choices — no right answer, just tradeoffs" },
  { key: "redteam", label: "Red Team", icon: Shield, desc: "Find risks and failure modes in an AI agent's output" },
  { key: "stakeholder", label: "Stakeholder Sim", icon: Users, desc: "Role-play as a specific stakeholder in a disrupted org" },
];

/* ── Rubric Feedback Component ── */
function RubricFeedback({ scores }: { scores: Record<string, { score: number; note: string }> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg p-4 space-y-3"
      style={{ background: "hsl(var(--surface-stone) / 0.6)", border: "1px solid hsl(var(--filigree) / 0.2)" }}
    >
      <h4 className="text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--filigree-glow))" }}>
        Coaching Rubric
      </h4>
      {RUBRIC_DIMENSIONS.map(dim => {
        const s = scores[dim.key] || { score: 0, note: "Not yet evaluated" };
        const pct = Math.min(100, s.score);
        const color = pct >= 70 ? "hsl(142 60% 50%)" : pct >= 40 ? "hsl(45 80% 55%)" : "hsl(0 60% 55%)";
        return (
          <div key={dim.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-foreground">{dim.label}</span>
              <span className="text-[10px] font-mono" style={{ color }}>{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "hsl(var(--muted) / 0.3)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: color }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground italic">{s.note}</p>
          </div>
        );
      })}
    </motion.div>
  );
}

/* ── FORMAT 1: Case Study + Open Response ── */
function CaseStudyFormat() {
  const [response, setResponse] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mockScores: Record<string, { score: number; note: string }> = {
    risk_awareness: { score: 75, note: "Good — you identified data quality and attribution model drift. Consider also: what happens when the AI optimizes for a metric that no longer reflects business value?" },
    strategic_depth: { score: 60, note: "You addressed immediate oversight. Push deeper: how does this change the marketing team's skill profile over 12 months?" },
    human_value: { score: 85, note: "Strong articulation of brand intuition and stakeholder context as irreplaceable inputs." },
    actionability: { score: 55, note: "Your recommendations are directional. Try: 'I would implement a weekly 30-min review ritual with these 3 specific checkpoints...'" },
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg p-4" style={{ background: "hsl(var(--muted) / 0.15)", border: "1px solid hsl(var(--border) / 0.3)" }}>
        <h3 className="text-sm font-bold text-foreground mb-2" style={{ fontFamily: "'Cinzel', serif" }}>📋 Scenario Briefing</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{SCENARIO.futureState}</p>
        <div className="mt-3 p-3 rounded-md" style={{ background: "hsl(var(--filigree-glow) / 0.08)", border: "1px solid hsl(var(--filigree) / 0.15)" }}>
          <p className="text-xs font-semibold text-foreground mb-1">Your Mission:</p>
          <p className="text-xs text-muted-foreground">The AI agent just flagged a 23% drop in ROAS across two channels and auto-paused spend. Your CMO wants your strategic assessment in 30 minutes. What do you do — and what does the AI miss?</p>
        </div>
      </div>

      {!submitted ? (
        <div className="space-y-2">
          <Textarea
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Write your strategic response... What would you investigate? What does the AI's analysis likely miss? What's your recommendation to the CMO?"
            className="min-h-[140px] text-xs"
            style={{ background: "hsl(var(--surface-stone) / 0.5)" }}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{response.length} chars · aim for 150+</span>
            <Button
              size="sm"
              disabled={response.length < 30}
              onClick={() => setSubmitted(true)}
              className="gap-1.5 text-xs"
            >
              <Send className="h-3 w-3" /> Submit Response
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Response submitted — here's your coaching feedback:</span>
          </div>
          <RubricFeedback scores={mockScores} />
          <Button variant="outline" size="sm" onClick={() => { setSubmitted(false); setResponse(""); }} className="gap-1.5 text-xs">
            <RotateCcw className="h-3 w-3" /> Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── FORMAT 2: Decision Tree Dialogue ── */
function DecisionTreeFormat() {
  const [step, setStep] = useState(0);
  const [path, setPath] = useState<string[]>([]);

  const tree = [
    {
      narration: "The AI agent has auto-paused $45K/day in ad spend after detecting a ROAS anomaly. Your dashboard shows the pause happened 12 minutes ago. What's your first move?",
      choices: [
        { label: "Review the AI's reasoning log before doing anything", next: 1, tag: "analytical" },
        { label: "Override the pause — the Q4 campaign can't afford downtime", next: 2, tag: "action-first" },
        { label: "Call the data engineering team to verify the underlying data", next: 3, tag: "systemic" },
      ],
    },
    {
      narration: "The AI's log shows it weighted last-touch attribution heavily. You notice it didn't account for a brand campaign that launched 3 days ago — those conversions are delayed by design. The AI correctly detected a pattern drop but missed the strategic context.",
      choices: [
        { label: "Manually adjust the attribution window and re-run", next: 4, tag: "hands-on" },
        { label: "Flag this as a systemic gap — the AI needs brand-campaign awareness", next: 4, tag: "systemic" },
      ],
    },
    {
      narration: "You resume spend immediately. Two hours later, the ROAS drops further — the AI was partially right. The CMO is asking why you overrode the system. However, you preserved campaign momentum during a critical window.",
      choices: [
        { label: "Acknowledge the tradeoff and propose a 'soft pause' protocol", next: 4, tag: "adaptive" },
        { label: "Argue that campaign continuity was worth the short-term cost", next: 4, tag: "conviction" },
      ],
    },
    {
      narration: "Data engineering confirms a tracking pixel was miscounting on one channel for 48 hours. The AI's anomaly detection was actually catching a data quality issue, not a real performance drop. Good instinct to check upstream.",
      choices: [
        { label: "Document this as a playbook for 'AI alert triage'", next: 4, tag: "process" },
        { label: "Push for automated data quality checks before AI decisions", next: 4, tag: "prevention" },
      ],
    },
    {
      narration: null, // Terminal
      choices: [],
    },
  ];

  const current = tree[step];
  const isTerminal = step === 4;

  const tradeoffInsights: Record<string, string> = {
    analytical: "You prioritized understanding before action — reducing error risk but accepting delay.",
    "action-first": "You prioritized momentum — preserving business velocity but accepting AI override risk.",
    systemic: "You investigated root causes — slower response but potentially preventing future incidents.",
    "hands-on": "You solved the immediate problem but the systemic gap remains for next time.",
    adaptive: "You balanced accountability with forward-looking process improvement.",
    conviction: "You stood by your judgment — important for trust, but requires strong evidence.",
    process: "You're building organizational memory — high long-term value.",
    prevention: "You're designing systems that reduce human oversight burden — the ideal L2 outcome.",
  };

  return (
    <div className="space-y-4">
      {!isTerminal ? (
        <>
          <div className="rounded-lg p-4" style={{ background: "hsl(var(--muted) / 0.15)", border: "1px solid hsl(var(--border) / 0.3)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: "hsl(var(--filigree) / 0.12)", color: "hsl(var(--filigree-glow))" }}>
                Node {step + 1}/{tree.length - 1}
              </span>
              {path.length > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  Path: {path.map(p => p.charAt(0).toUpperCase()).join(" → ")}
                </span>
              )}
            </div>
            <p className="text-xs text-foreground leading-relaxed">{current.narration}</p>
          </div>
          <div className="space-y-2">
            {current.choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => { setPath(prev => [...prev, choice.tag]); setStep(choice.next); }}
                className="w-full text-left p-3 rounded-lg text-xs transition-all hover:brightness-110 active:scale-[0.99]"
                style={{
                  background: "hsl(var(--surface-stone) / 0.6)",
                  border: "1px solid hsl(var(--filigree) / 0.15)",
                }}
              >
                <span className="font-bold mr-2" style={{ color: "hsl(var(--filigree-glow))" }}>{String.fromCharCode(65 + i)}.</span>
                {choice.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg p-4" style={{ background: "hsl(var(--filigree-glow) / 0.08)", border: "1px solid hsl(var(--filigree) / 0.2)" }}>
            <h4 className="text-xs font-bold mb-2" style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--filigree-glow))" }}>
              🗺️ Your Decision Path
            </h4>
            <p className="text-[11px] text-muted-foreground mb-3">There was no "right" path. Here's what your choices revealed about your strategic style:</p>
            <div className="space-y-2">
              {path.map((tag, i) => (
                <div key={i} className="flex gap-2 text-[11px]">
                  <span className="font-mono shrink-0" style={{ color: "hsl(var(--filigree-glow))" }}>→</span>
                  <span className="text-foreground">{tradeoffInsights[tag] || tag}</span>
                </div>
              ))}
            </div>
          </div>
          <RubricFeedback scores={{
            risk_awareness: { score: path.includes("systemic") ? 80 : 50, note: path.includes("systemic") ? "You investigated root causes — strong risk orientation." : "Consider spending more time understanding why the AI flagged this." },
            strategic_depth: { score: path.includes("prevention") ? 90 : 60, note: path.includes("prevention") ? "You moved from reaction to system design — excellent." : "Good tactical thinking. Next level: how do you prevent this class of problem?" },
            human_value: { score: 70, note: "Your path showed judgment the AI couldn't replicate — contextual awareness of business timing and stakeholder dynamics." },
            actionability: { score: path.includes("process") ? 85 : 65, note: path.includes("process") ? "Building playbooks = durable organizational value." : "Solid in-the-moment decisions. Try also: what process would you create?" },
          }} />
          <Button variant="outline" size="sm" onClick={() => { setStep(0); setPath([]); }} className="gap-1.5 text-xs">
            <RotateCcw className="h-3 w-3" /> Restart Tree
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── FORMAT 3: Red Team / Guided Audit ── */
type AuditVerdict = "safe" | "risky" | "critical" | null;

interface AuditCheckpoint {
  id: string;
  area: string;
  question: string;
  hint: string;
  aiClaim: string;
  correctVerdict: AuditVerdict;
  explanation: string;
  realWorldExample: string;
  coachTip: string;
}

const AUDIT_CHECKPOINTS: AuditCheckpoint[] = [
  {
    id: "attribution",
    area: "📊 Attribution Model",
    question: "The AI uses 7-day last-click attribution to calculate ROAS. The brand campaign has a 21-day consideration cycle. Is this a concern?",
    hint: "Think about what happens to conversions that take longer than 7 days to complete.",
    aiClaim: "ROAS dropped 23% — primary driver: paid social CPM +18%.",
    correctVerdict: "critical",
    explanation: "The attribution window is too short for this campaign type. Conversions happening on days 8-21 are being credited to other channels or lost entirely, making social appear less effective than it is.",
    realWorldExample: "In 2023, Airbnb reported that shortening their attribution window from 30 to 7 days made paid social appear 40% less effective. When they restored the longer window, they discovered social was actually their highest-LTV acquisition channel — they had been systematically under-investing for two quarters.",
    coachTip: "Always check if the measurement window matches the customer journey length. This is the #1 most common AI analytics failure.",
  },
  {
    id: "audience",
    area: "👥 Audience Overlap",
    question: "The AI recommends shifting 30% of social budget to display where CPM is 40% lower. Both channels target similar audiences. Is this safe?",
    hint: "Consider: are these truly different audiences, or will you show the same people cheaper but lower-quality ads?",
    aiClaim: "Display CPM $8.20 vs Social CPM $14.63 — shift budget for efficiency.",
    correctVerdict: "risky",
    explanation: "Display and social audiences often overlap significantly. Shifting budget may just retarget the same users at lower-quality touchpoints, reducing overall impact while appearing cheaper on paper.",
    realWorldExample: "Chase JPMorgan ran an experiment in 2019 where they reduced their programmatic display from 400,000 websites to just 5,000 pre-approved sites. Performance stayed identical — proving that most of their 'broad reach' display was hitting the same users on low-quality sites. The AI's CPM comparison was meaningless because it wasn't comparing equivalent impressions.",
    coachTip: "Cost efficiency ≠ effectiveness. Always ask: 'Am I reaching new people or the same people worse?'",
  },
  {
    id: "seasonality",
    area: "📅 Seasonality",
    question: "Social CPM jumped 18% this week. The AI flagged this as anomalous and triggered a budget reallocation. It's currently Q4. Should the AI react this way?",
    hint: "What typically happens to ad costs during Q4 holiday season?",
    aiClaim: "Paid Social CPM: $12.40 → $14.63 (+18%) — flagged as performance degradation.",
    correctVerdict: "critical",
    explanation: "Q4 CPM spikes are entirely predictable. Every advertiser is competing for attention during holidays. The AI is treating a normal seasonal pattern as an anomaly and making a costly overreaction.",
    realWorldExample: "Meta's own 2022 data showed CPMs increase 30-50% every Q4 across all advertisers. An e-commerce brand using automated bidding pulled back spend in November 2022 when their AI flagged 'rising costs' — they missed Black Friday entirely and lost an estimated $2.3M in revenue. Their competitor, who manually overrode the same signal, had their best quarter ever.",
    coachTip: "AI systems without calendar/seasonal context will repeatedly overreact to predictable market patterns. This is a design flaw to flag.",
  },
  {
    id: "incrementality",
    area: "🔬 Incrementality",
    question: "The AI notes that conversion rates are 'comparable' across social and display. Does this mean the channels are equally valuable?",
    hint: "Conversion rate tells you who converted, but not whether the ad caused the conversion.",
    aiClaim: "Overall conversion rate: 2.1% (unchanged across channels).",
    correctVerdict: "risky",
    explanation: "Same conversion rate doesn't mean same incremental lift. Some conversions would have happened anyway (organic). Without an incrementality test, you can't tell which channel is actually driving new revenue vs. getting credit for existing demand.",
    realWorldExample: "eBay ran one of the most famous incrementality studies in marketing history (2014). They discovered that their Google branded search ads — which showed a high conversion rate — had nearly zero incremental impact. People searching 'eBay' were going to click through to eBay anyway. They were paying for conversions that would have happened for free, costing $20M+/year.",
    coachTip: "This is the 'correlation vs. causation' blind spot in AI analytics. Always ask: 'Would this sale have happened without the ad?'",
  },
  {
    id: "stakeholder",
    area: "🎯 Stakeholder Alignment",
    question: "The AI optimises for ROAS (return on ad spend). The CMO's OKR this quarter is brand awareness growth. Is the AI optimising for the right objective?",
    hint: "Who set the AI's objective function, and does it match what leadership actually cares about?",
    aiClaim: "Recommendation: shift budget to maximise ROAS efficiency.",
    correctVerdict: "critical",
    explanation: "The AI is optimising for the wrong metric. The CMO wants awareness (reach, impressions, brand lift), not short-term ROAS. This auto-action directly undermines the executive's stated goal — a dangerous misalignment.",
    realWorldExample: "Adidas publicly admitted in 2019 that they had over-invested in performance marketing (optimising for ROAS) and neglected brand building for years because their attribution models couldn't measure brand impact. Their former global media director said: 'We were over-investing in digital performance at the expense of brand building by 23%.' The AI was maximising what it could measure, not what actually mattered.",
    coachTip: "The most dangerous AI failures aren't bugs — they're objective misalignment. The AI did exactly what it was told. It just wasn't told the right thing.",
  },
];

/* ── Deep-Dive Chat for Red Team Checkpoints ── */
function CheckpointChat({ checkpoint }: { checkpoint: AuditCheckpoint }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg = { role: "user" as const, content: text };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setInput("");
    setIsStreaming(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/checkpoint-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMsgs.map(m => ({ role: m.role, content: m.content })),
          checkpoint: {
            area: checkpoint.area,
            question: checkpoint.question,
            explanation: checkpoint.explanation,
            realWorldExample: checkpoint.realWorldExample,
            coachTip: checkpoint.coachTip,
            correctVerdict: checkpoint.correctVerdict,
          },
        }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, couldn't connect. Try again." }]);
    }

    setIsStreaming(false);
  }, [input, isStreaming, messages, checkpoint]);

  // Auto-scroll
  if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-lg overflow-hidden"
      style={{ background: "hsl(var(--muted) / 0.06)", border: "1px solid hsl(var(--border) / 0.15)" }}>
      <div className="px-3 py-1.5 flex items-center gap-1.5" style={{ borderBottom: "1px solid hsl(var(--border) / 0.1)" }}>
        <HelpCircle className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-semibold text-muted-foreground">Deep Dive — ask anything about this checkpoint</span>
      </div>
      <div ref={scrollRef} className="max-h-[180px] overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && (
          <p className="text-[10px] text-muted-foreground text-center py-2 italic">
            e.g. "How would I detect this in my own data?" or "What guardrail prevents this?"
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`text-[11px] leading-relaxed ${msg.role === "user" ? "text-right" : ""}`}>
            <div className={`inline-block max-w-[90%] rounded-md px-2.5 py-1.5 text-left ${
              msg.role === "user" ? "bg-primary/10 text-foreground" : ""
            }`} style={msg.role === "assistant" ? { background: "hsl(var(--surface-stone) / 0.6)" } : undefined}>
              {msg.role === "assistant" ? (
                <div className="prose prose-xs dark:prose-invert max-w-none [&_p]:mb-1 [&_p]:mt-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : msg.content}
            </div>
          </div>
        ))}
        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
          </div>
        )}
      </div>
      <div className="px-2 py-1.5 flex gap-1.5" style={{ borderTop: "1px solid hsl(var(--border) / 0.1)" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask about this checkpoint…"
          className="flex-1 bg-transparent rounded-md px-2 py-1 text-[11px] outline-none focus:ring-1 focus:ring-primary/30"
          style={{ background: "hsl(var(--muted) / 0.1)" }}
        />
        <Button size="icon" onClick={sendMessage} disabled={isStreaming || !input.trim()} className="h-6 w-6 rounded-md shrink-0">
          <Send className="h-2.5 w-2.5" />
        </Button>
      </div>
    </motion.div>
  );
}

function RedTeamFormat() {
  const [currentStep, setCurrentStep] = useState(0);
  const [verdicts, setVerdicts] = useState<Record<string, AuditVerdict>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState(false);

  const checkpoint = AUDIT_CHECKPOINTS[currentStep];
  const totalCorrect = AUDIT_CHECKPOINTS.filter(cp => verdicts[cp.id] === cp.correctVerdict).length;

  const handleVerdict = (id: string, verdict: AuditVerdict) => {
    setVerdicts(prev => ({ ...prev, [id]: verdict }));
  };

  const handleReveal = (id: string) => {
    setRevealed(prev => ({ ...prev, [id]: true }));
  };

  const handleNext = () => {
    if (currentStep < AUDIT_CHECKPOINTS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const verdictColors: Record<string, { bg: string; border: string; text: string }> = {
    safe: { bg: "hsl(142 60% 50% / 0.1)", border: "hsl(142 60% 50% / 0.3)", text: "hsl(142 60% 50%)" },
    risky: { bg: "hsl(45 80% 55% / 0.1)", border: "hsl(45 80% 55% / 0.3)", text: "hsl(45 80% 55%)" },
    critical: { bg: "hsl(0 60% 55% / 0.1)", border: "hsl(0 60% 55% / 0.3)", text: "hsl(0 60% 55%)" },
  };

  const aiOutput = {
    summary: "Campaign ROAS dropped 23% week-over-week. Primary driver: paid social CPM increased 18% while conversion rates held steady. Recommendation: shift 30% of paid social budget to programmatic display where CPM is 40% lower with comparable conversion rates.",
    autoAction: "AI will execute budget shift at midnight unless overridden.",
  };

  if (completed) {
    return (
      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-lg p-5 text-center"
          style={{ background: "hsl(var(--surface-stone) / 0.6)", border: "1px solid hsl(var(--filigree) / 0.2)" }}>
          <h3 className="text-base font-bold mb-1" style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--filigree-glow))" }}>
            Audit Complete
          </h3>
          <p className="text-2xl font-bold text-foreground">{totalCorrect}/{AUDIT_CHECKPOINTS.length}</p>
          <p className="text-xs text-muted-foreground mt-1">checkpoints correctly assessed</p>
        </motion.div>

        {/* Per-checkpoint summary */}
        <div className="space-y-2">
          {AUDIT_CHECKPOINTS.map(cp => {
            const isCorrect = verdicts[cp.id] === cp.correctVerdict;
            return (
              <div key={cp.id} className="flex items-start gap-2 text-[11px] p-2 rounded-md"
                style={{ background: isCorrect ? "hsl(142 60% 50% / 0.06)" : "hsl(0 60% 55% / 0.06)" }}>
                <span className="shrink-0 mt-0.5">{isCorrect ? "✅" : "❌"}</span>
                <div>
                  <span className="font-semibold text-foreground">{cp.area}</span>
                  <span className="text-muted-foreground"> — You said <strong>{verdicts[cp.id]}</strong>, answer was <strong>{cp.correctVerdict}</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        <RubricFeedback scores={{
          risk_awareness: { score: Math.round((totalCorrect / AUDIT_CHECKPOINTS.length) * 100), note: totalCorrect >= 4 ? "Excellent threat detection — you caught the key failure modes." : "Review the checkpoints you missed. Each represents a common AI oversight pattern." },
          strategic_depth: { score: totalCorrect >= 3 ? 75 : 50, note: "The stakeholder alignment question tests strategic vs. tactical thinking." },
          human_value: { score: 80, note: "Every checkpoint represents a judgment call that AI cannot make autonomously." },
          actionability: { score: 65, note: "Now practice: for each flaw found, what guardrail would you add to prevent it?" },
        }} />

        <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setVerdicts({}); setRevealed({}); setShowHint({}); setCompleted(false); }} className="gap-1.5 text-xs">
          <RotateCcw className="h-3 w-3" /> Restart Audit
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Brief */}
      <div className="rounded-lg p-3" style={{ background: "hsl(0 60% 55% / 0.06)", border: "1px solid hsl(0 60% 55% / 0.15)" }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" style={{ color: "hsl(0 60% 55%)" }} />
            <span className="text-xs font-bold" style={{ fontFamily: "'Cinzel', serif", color: "hsl(0 60% 55%)" }}>Guided Audit</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: "hsl(var(--muted) / 0.2)" }}>
            {currentStep + 1} / {AUDIT_CHECKPOINTS.length}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Review each checkpoint. Assess whether this aspect of the AI's output is <strong className="text-foreground">Safe</strong>, <strong style={{ color: "hsl(45 80% 55%)" }}>Risky</strong>, or <strong style={{ color: "hsl(0 60% 55%)" }}>Critical</strong>.
        </p>
      </div>

      {/* AI claim context */}
      <div className="rounded-md px-3 py-2 text-[10px] font-mono" style={{ background: "hsl(var(--muted) / 0.12)", border: "1px solid hsl(var(--border) / 0.2)" }}>
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--primary))" }}>AI Says: </span>
        {checkpoint.aiClaim}
      </div>

      {/* Checkpoint card */}
      <AnimatePresence mode="wait">
        <motion.div key={checkpoint.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          className="rounded-lg p-4 space-y-3" style={{ background: "hsl(var(--surface-stone) / 0.5)", border: "1px solid hsl(var(--filigree) / 0.15)" }}>
          <div className="flex items-start gap-2">
            <span className="text-base">{checkpoint.area.split(" ")[0]}</span>
            <div>
              <h4 className="text-xs font-bold text-foreground">{checkpoint.area.split(" ").slice(1).join(" ")}</h4>
              <p className="text-[11px] text-muted-foreground mt-1">{checkpoint.question}</p>
            </div>
          </div>

          {/* Hint toggle */}
          {!showHint[checkpoint.id] && !revealed[checkpoint.id] && (
            <button onClick={() => setShowHint(prev => ({ ...prev, [checkpoint.id]: true }))}
              className="text-[10px] underline underline-offset-2 transition-colors"
              style={{ color: "hsl(var(--filigree-glow))" }}>
              💡 Need a hint?
            </button>
          )}
          {showHint[checkpoint.id] && !revealed[checkpoint.id] && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-[10px] px-3 py-2 rounded-md italic"
              style={{ background: "hsl(45 80% 55% / 0.08)", border: "1px solid hsl(45 80% 55% / 0.15)", color: "hsl(var(--foreground))" }}>
              💡 {checkpoint.hint}
            </motion.div>
          )}

          {/* Verdict buttons */}
          {!revealed[checkpoint.id] && (
            <div className="flex gap-2">
              {(["safe", "risky", "critical"] as AuditVerdict[]).map(v => {
                if (!v) return null;
                const selected = verdicts[checkpoint.id] === v;
                const colors = verdictColors[v];
                return (
                  <button key={v} onClick={() => handleVerdict(checkpoint.id, v)}
                    className="flex-1 py-2 px-3 rounded-md text-[11px] font-semibold capitalize transition-all"
                    style={{
                      background: selected ? colors.bg : "hsl(var(--muted) / 0.1)",
                      border: `1.5px solid ${selected ? colors.border : "hsl(var(--border) / 0.2)"}`,
                      color: selected ? colors.text : "hsl(var(--muted-foreground))",
                    }}>
                    {v === "safe" ? "✅ " : v === "risky" ? "⚠️ " : "🚨 "}{v}
                  </button>
                );
              })}
            </div>
          )}

          {/* Lock in / reveal */}
          {verdicts[checkpoint.id] && !revealed[checkpoint.id] && (
            <Button size="sm" onClick={() => handleReveal(checkpoint.id)} className="w-full gap-1.5 text-xs">
              <CheckCircle2 className="h-3 w-3" /> Lock In & See Answer
            </Button>
          )}

          {/* Revealed explanation */}
          {revealed[checkpoint.id] && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="flex items-center gap-2">
                {verdicts[checkpoint.id] === checkpoint.correctVerdict ? (
                  <span className="text-[11px] font-bold" style={{ color: "hsl(142 60% 50%)" }}>✅ Correct!</span>
                ) : (
                  <span className="text-[11px] font-bold" style={{ color: "hsl(0 60% 55%)" }}>
                    ❌ The answer was <span className="capitalize">{checkpoint.correctVerdict}</span>
                  </span>
                )}
              </div>
              <div className="rounded-md p-3 text-[11px] space-y-2" style={{ background: "hsl(var(--muted) / 0.1)", border: "1px solid hsl(var(--border) / 0.2)" }}>
                <p className="text-foreground">{checkpoint.explanation}</p>
                {/* Real-world example */}
                <div className="rounded-md p-2.5 mt-2" style={{ background: "hsl(var(--filigree-glow) / 0.06)", border: "1px solid hsl(var(--filigree) / 0.12)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px]">📰</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--filigree-glow))" }}>Real-World Case</span>
                  </div>
                  <p className="text-[10px] text-foreground/80 leading-relaxed">{checkpoint.realWorldExample}</p>
                </div>
                <div className="flex gap-1.5 items-start pt-1" style={{ borderTop: "1px solid hsl(var(--border) / 0.15)" }}>
                  <span className="text-[10px]">🎓</span>
                  <p className="text-[10px] font-medium" style={{ color: "hsl(var(--filigree-glow))" }}>{checkpoint.coachTip}</p>
                </div>
              </div>
              {/* Deep-dive chat */}
              <CheckpointChat checkpoint={checkpoint} />
              <Button size="sm" variant="outline" onClick={handleNext} className="w-full gap-1.5 text-xs">
                {currentStep < AUDIT_CHECKPOINTS.length - 1 ? "Next Checkpoint →" : "View Results"}
              </Button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5">
        {AUDIT_CHECKPOINTS.map((cp, i) => (
          <div key={cp.id} className="h-1.5 rounded-full transition-all"
            style={{
              width: i === currentStep ? 20 : 8,
              background: revealed[cp.id]
                ? verdicts[cp.id] === cp.correctVerdict ? "hsl(142 60% 50%)" : "hsl(0 60% 55%)"
                : i === currentStep ? "hsl(var(--filigree-glow))" : "hsl(var(--muted) / 0.3)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── FORMAT 4: Stakeholder Simulation ── */
function StakeholderFormat() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: "user" | "npc"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [roundCount, setRoundCount] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const roles = [
    { id: "vp", label: "VP of Marketing", desc: "You oversee strategy. The AI agent reports to your team.", emoji: "👔" },
    { id: "ethics", label: "Ethics & Compliance Lead", desc: "You ensure AI decisions meet regulatory and ethical standards.", emoji: "⚖️" },
    { id: "analyst", label: "Senior Data Analyst", desc: "You built the attribution models the AI uses. You see flaws others don't.", emoji: "📊" },
  ];

  const npcResponses: Record<string, string[]> = {
    vp: [
      "CMO (NPC): 'The AI paused our biggest Q4 campaign. The board meeting is in 3 days. I need you to tell me: do we trust the system or override it? And I need that answer backed by something more than gut feel.'",
      "CMO (NPC): 'Interesting. But here's what I'm really asking — should we be giving this AI the authority to pause spend at all? Or should it only recommend, with a human in the loop? That changes our headcount plan.'",
      "CMO (NPC): 'OK, I'm hearing you say we need a hybrid model. Write me a one-pager for the board: what decisions stay AI-automated, what requires human sign-off, and what's the cost of each approach.'",
    ],
    ethics: [
      "Chief Legal Officer (NPC): 'The AI auto-shifted budget away from channels that over-index on diverse audiences. That's a potential fair lending / equal access issue in some jurisdictions. How do we audit for this?'",
      "Chief Legal Officer (NPC): 'So you're proposing a bias audit layer. How often? Pre-deployment or continuous? And who reviews the audit — the team that built the model, or an independent group?'",
      "Chief Legal Officer (NPC): 'Good framework. One more: if the AI's budget shift inadvertently reduces reach to a protected demographic by more than 15%, should that trigger an automatic halt? Or is that too restrictive?'",
    ],
    analyst: [
      "Head of Data (NPC): 'I designed this attribution model 18 months ago. The market has changed — multi-touch is probably wrong for our new product line. But the AI doesn't know that. How do we surface model staleness?'",
      "Head of Data (NPC): 'Model versioning is one thing. But the real issue is: who decides when a model is 'stale enough' to retire? The AI can detect drift, but deciding to act on it requires business context it doesn't have.'",
      "Head of Data (NPC): 'Exactly. So we need a 'model health review' — quarterly, with business and data stakeholders. Can you draft what that meeting agenda looks like?'",
    ],
  };

  const handleSend = () => {
    if (!input.trim() || !selectedRole) return;
    const newMessages = [...messages, { role: "user" as const, content: input }];
    const npcIdx = Math.min(roundCount, (npcResponses[selectedRole]?.length || 1) - 1);
    const npcReply = npcResponses[selectedRole]?.[npcIdx] || "NPC: 'That's a thoughtful perspective. Let's move to evaluation.'";
    newMessages.push({ role: "npc" as const, content: npcReply });
    setMessages(newMessages);
    setInput("");
    setRoundCount(prev => prev + 1);
  };

  const isComplete = roundCount >= 3;

  return (
    <div className="space-y-4">
      {!selectedRole ? (
        <div className="space-y-3">
          <div className="rounded-lg p-4" style={{ background: "hsl(var(--muted) / 0.15)", border: "1px solid hsl(var(--border) / 0.3)" }}>
            <h3 className="text-sm font-bold text-foreground mb-1" style={{ fontFamily: "'Cinzel', serif" }}>🎭 Choose Your Role</h3>
            <p className="text-xs text-muted-foreground">{SCENARIO.futureState}</p>
            <p className="text-xs text-foreground mt-2 font-medium">You'll engage in a dialogue with an NPC stakeholder. Pick your perspective:</p>
          </div>
          {roles.map(r => (
            <button
              key={r.id}
              onClick={() => {
                setSelectedRole(r.id);
                setMessages([{ role: "npc", content: npcResponses[r.id][0] }]);
              }}
              className="w-full text-left p-3 rounded-lg transition-all hover:brightness-110 active:scale-[0.99]"
              style={{ background: "hsl(var(--surface-stone) / 0.6)", border: "1px solid hsl(var(--filigree) / 0.15)" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{r.emoji}</span>
                <div>
                  <span className="text-xs font-bold text-foreground">{r.label}</span>
                  <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: "hsl(var(--filigree) / 0.12)", color: "hsl(var(--filigree-glow))" }}>
              Playing: {roles.find(r => r.id === selectedRole)?.label} · Round {Math.min(roundCount + 1, 3)}/3
            </span>
          </div>

          {/* Chat thread */}
          <div className="space-y-2 max-h-[280px] overflow-y-auto rounded-lg p-3" style={{ background: "hsl(var(--muted) / 0.08)" }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`text-xs p-2.5 rounded-lg ${msg.role === "user" ? "ml-6" : "mr-6"}`}
                style={{
                  background: msg.role === "user" ? "hsl(var(--primary) / 0.12)" : "hsl(var(--surface-stone) / 0.8)",
                  border: `1px solid ${msg.role === "user" ? "hsl(var(--primary) / 0.2)" : "hsl(var(--border) / 0.2)"}`,
                }}
              >
                {msg.role === "user" && <span className="text-[9px] font-bold text-primary block mb-0.5">You ({roles.find(r => r.id === selectedRole)?.label})</span>}
                <span className="text-foreground leading-relaxed">{msg.content}</span>
              </div>
            ))}
          </div>

          {!isComplete ? (
            <div className="flex gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Respond in character..."
                className="min-h-[60px] text-xs flex-1"
                style={{ background: "hsl(var(--surface-stone) / 0.5)" }}
              />
              <Button size="sm" onClick={handleSend} disabled={!input.trim()} className="self-end">
                <Send className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Dialogue complete — coaching evaluation:</span>
              </div>
              <RubricFeedback scores={{
                risk_awareness: { score: 72, note: "You navigated the NPC's challenges well. Strong awareness of organizational dynamics." },
                strategic_depth: { score: 78, note: "Good escalation from tactical to structural thinking across the dialogue." },
                human_value: { score: 85, note: "Excellent demonstration of stakeholder empathy and contextual judgment." },
                actionability: { score: 68, note: "Your proposals were strong. Try making them even more specific with timelines and metrics." },
              }} />
              <Button variant="outline" size="sm" onClick={() => { setSelectedRole(null); setMessages([]); setRoundCount(0); }} className="gap-1.5 text-xs">
                <RotateCcw className="h-3 w-3" /> Try Different Role
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ── */
export default function L2SimFormats() {
  const [activeTab, setActiveTab] = useState<Tab>("case");

  const FormatComponent = {
    case: CaseStudyFormat,
    decision: DecisionTreeFormat,
    redteam: RedTeamFormat,
    stakeholder: StakeholderFormat,
  }[activeTab];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] px-4 py-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
          ⚔️ Level 2 Simulation Formats
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Compare 4 formats for novel future scenarios. Each uses <strong>rubric-based coaching</strong> — no scores, just growth dimensions.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1" style={{ borderBottom: "1px solid hsl(var(--filigree) / 0.15)" }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-t-md text-xs font-medium transition-all shrink-0"
              style={{
                fontFamily: "'Cinzel', serif",
                ...(isActive
                  ? { color: "hsl(var(--filigree-glow))", background: "hsl(var(--filigree) / 0.1)", borderBottom: "2px solid hsl(var(--filigree-glow))" }
                  : { color: "hsl(var(--muted-foreground))" }),
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Format description */}
      <p className="text-[11px] text-muted-foreground italic mb-4">
        {TABS.find(t => t.key === activeTab)?.desc}
      </p>

      {/* Active format */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <FormatComponent />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}