/**
 * L2SimFormats — Interactive mockup comparing 4 Level 2 simulation formats.
 * Each tab is a self-contained mini-sim prototype with rubric-based coaching.
 */
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, RotateCcw, CheckCircle2, AlertTriangle, Shield, Users, MessageSquare, GitBranch } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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

/* ── FORMAT 3: Red Team / Audit ── */
function RedTeamFormat() {
  const [findings, setFindings] = useState<string[]>(["", "", ""]);
  const [submitted, setSubmitted] = useState(false);

  const aiOutput = {
    summary: "Campaign ROAS dropped 23% week-over-week. Primary driver: paid social CPM increased 18% while conversion rates held steady. Recommendation: shift 30% of paid social budget to programmatic display where CPM is 40% lower with comparable conversion rates.",
    dataPoints: [
      "Paid Social CPM: $12.40 → $14.63 (+18%)",
      "Display CPM: $8.20 (stable)",
      "Overall conversion rate: 2.1% (unchanged)",
      "Budget reallocation: $45K/day → $31.5K social + $13.5K display",
    ],
    autoAction: "AI will execute budget shift at midnight unless overridden.",
  };

  const hiddenFlaws = [
    { flaw: "Attribution window mismatch", hint: "The AI uses 7-day last-click. The brand campaign has a 21-day consideration cycle." },
    { flaw: "Audience overlap ignored", hint: "Shifting to display may just re-target the same users at lower quality touchpoints." },
    { flaw: "Seasonality not modeled", hint: "CPM spikes are normal in Q4 — the AI is reacting to a predictable pattern." },
    { flaw: "No incrementality test", hint: "Comparable conversion rates don't mean comparable incremental lift." },
    { flaw: "Stakeholder impact missing", hint: "The CMO's OKR is brand awareness, not ROAS — this shift undermines their goal." },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg p-4" style={{ background: "hsl(0 60% 55% / 0.08)", border: "1px solid hsl(0 60% 55% / 0.2)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4" style={{ color: "hsl(0 60% 55%)" }} />
          <h3 className="text-sm font-bold" style={{ fontFamily: "'Cinzel', serif", color: "hsl(0 60% 55%)" }}>
            🔴 Red Team Brief
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Below is an AI agent's analysis and auto-action. Your job: <strong className="text-foreground">find what's wrong, missing, or dangerous.</strong>
        </p>
      </div>

      {/* AI Output to Audit */}
      <div className="rounded-lg p-4 space-y-3" style={{ background: "hsl(var(--muted) / 0.1)", border: "1px solid hsl(var(--border) / 0.3)" }}>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold" style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>AI AGENT OUTPUT</span>
        </div>
        <p className="text-xs text-foreground">{aiOutput.summary}</p>
        <div className="grid grid-cols-2 gap-2">
          {aiOutput.dataPoints.map((dp, i) => (
            <div key={i} className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: "hsl(var(--muted) / 0.2)" }}>{dp}</div>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ background: "hsl(45 80% 55% / 0.1)", border: "1px solid hsl(45 80% 55% / 0.2)" }}>
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(45 80% 55%)" }} />
          <span className="text-[10px] text-foreground font-medium">{aiOutput.autoAction}</span>
        </div>
      </div>

      {/* Finding inputs */}
      {!submitted ? (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-foreground">Your Findings (identify at least 3 risks/flaws):</h4>
          {findings.map((f, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[10px] font-mono mt-2 shrink-0" style={{ color: "hsl(0 60% 55%)" }}>#{i + 1}</span>
              <Textarea
                value={f}
                onChange={e => { const next = [...findings]; next[i] = e.target.value; setFindings(next); }}
                placeholder={`Risk or flaw #${i + 1}...`}
                className="min-h-[50px] text-xs"
                style={{ background: "hsl(var(--surface-stone) / 0.5)" }}
              />
            </div>
          ))}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setFindings(prev => [...prev, ""])}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              + Add another finding
            </button>
            <Button size="sm" onClick={() => setSubmitted(true)} disabled={findings.filter(f => f.length > 10).length < 2} className="gap-1.5 text-xs">
              <Shield className="h-3 w-3" /> Submit Audit
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg p-4 space-y-2" style={{ background: "hsl(var(--muted) / 0.1)", border: "1px solid hsl(var(--border) / 0.3)" }}>
            <h4 className="text-xs font-bold" style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--filigree-glow))" }}>
              Hidden Flaws Revealed
            </h4>
            {hiddenFlaws.map((hf, i) => (
              <div key={i} className="flex gap-2 text-[11px]">
                <span className="shrink-0" style={{ color: "hsl(0 60% 55%)" }}>⚠</span>
                <div>
                  <span className="font-semibold text-foreground">{hf.flaw}:</span>{" "}
                  <span className="text-muted-foreground">{hf.hint}</span>
                </div>
              </div>
            ))}
          </div>
          <RubricFeedback scores={{
            risk_awareness: { score: 82, note: "You caught multiple flaws. Expert-level would also flag the missing incrementality test." },
            strategic_depth: { score: 70, note: "Good identification of surface issues. The stakeholder misalignment (CMO's OKRs) is the strategic layer." },
            human_value: { score: 78, note: "Your audit demonstrates exactly why human oversight of AI agents is non-negotiable." },
            actionability: { score: 60, note: "Strong diagnostics. Next: what specific guardrails would you add to prevent this class of error?" },
          }} />
          <Button variant="outline" size="sm" onClick={() => { setSubmitted(false); setFindings(["", "", ""]); }} className="gap-1.5 text-xs">
            <RotateCcw className="h-3 w-3" /> Reset Audit
          </Button>
        </div>
      )}
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