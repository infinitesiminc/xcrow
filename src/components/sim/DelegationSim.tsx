/**
 * DelegationSim — Platinum Tier: End-to-end agent delegation simulation.
 * User delegates an entire workflow to AI agents and scores oversight quality.
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Eye, AlertTriangle, CheckCircle2, XCircle, RotateCcw,
  Play, Pause, ChevronRight, Shield, Zap, Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const cinzel = { fontFamily: "'Cinzel', serif" };
const stoneCard = {
  background: "hsl(var(--surface-stone))",
  border: "1px solid hsl(var(--filigree) / 0.2)",
  boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))",
};

interface AgentStep {
  id: string;
  label: string;
  tool: string;
  status: "pending" | "running" | "completed" | "error" | "flagged";
  output?: string;
  hasAnomaly?: boolean;
  anomalyHint?: string;
}

interface OversightScore {
  anomalies_caught: number;
  anomalies_total: number;
  false_alarms: number;
  interventions: number;
  delegation_confidence: number;
}

const MOCK_STEPS: AgentStep[] = [
  { id: "1", label: "Research market data", tool: "Web Search Agent", status: "pending" },
  { id: "2", label: "Analyze competitor pricing", tool: "Data Analysis Agent", status: "pending", hasAnomaly: true, anomalyHint: "Agent used outdated data source" },
  { id: "3", label: "Draft pricing proposal", tool: "Document Agent", status: "pending" },
  { id: "4", label: "Generate financial model", tool: "Spreadsheet Agent", status: "pending", hasAnomaly: true, anomalyHint: "Formula references circular dependency" },
  { id: "5", label: "Create presentation deck", tool: "Slides Agent", status: "pending" },
  { id: "6", label: "Send to stakeholders", tool: "Email Agent", status: "pending" },
];

interface DelegationSimProps {
  taskName?: string;
  onComplete?: (score: OversightScore) => void;
}

export default function DelegationSim({ taskName = "Quarterly Pricing Review", onComplete }: DelegationSimProps) {
  const [steps, setSteps] = useState<AgentStep[]>(MOCK_STEPS);
  const [currentStep, setCurrentStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [interventions, setInterventions] = useState<Set<string>>(new Set());
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [completed, setCompleted] = useState(false);

  const advanceStep = useCallback(() => {
    setSteps(prev => {
      const next = [...prev];
      // Complete current step
      if (currentStep >= 0 && currentStep < next.length) {
        const step = next[currentStep];
        if (step.hasAnomaly && !interventions.has(step.id)) {
          next[currentStep] = { ...step, status: "error" };
        } else {
          next[currentStep] = { ...step, status: "completed" };
        }
      }
      // Start next step
      const nextIdx = currentStep + 1;
      if (nextIdx < next.length) {
        next[nextIdx] = { ...next[nextIdx], status: "running" };
      }
      return next;
    });

    const nextIdx = currentStep + 1;
    setCurrentStep(nextIdx);

    if (nextIdx >= MOCK_STEPS.length) {
      setRunning(false);
      setCompleted(true);
    }
  }, [currentStep, interventions]);

  const handleStart = () => {
    setRunning(true);
    setCurrentStep(0);
    setSteps(prev => {
      const next = [...prev];
      next[0] = { ...next[0], status: "running" };
      return next;
    });
  };

  const handleIntervene = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    if (step.hasAnomaly) {
      setInterventions(prev => new Set(prev).add(stepId));
      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, status: "flagged" } : s));
    } else {
      setFalseAlarms(prev => prev + 1);
    }
  };

  const anomaliesTotal = MOCK_STEPS.filter(s => s.hasAnomaly).length;
  const anomaliesCaught = Array.from(interventions).filter(id => MOCK_STEPS.find(s => s.id === id)?.hasAnomaly).length;
  const progressPct = Math.round(((currentStep + 1) / MOCK_STEPS.length) * 100);

  const score: OversightScore = {
    anomalies_caught: anomaliesCaught,
    anomalies_total: anomaliesTotal,
    false_alarms: falseAlarms,
    interventions: interventions.size,
    delegation_confidence: Math.max(0, Math.round(
      ((anomaliesCaught / Math.max(1, anomaliesTotal)) * 70) -
      (falseAlarms * 10) +
      30
    )),
  };

  return (
    <div className="rounded-xl p-6" style={stoneCard}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/15">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold" style={cinzel}>Agent Delegation</h3>
          <p className="text-[10px] text-muted-foreground">{taskName}</p>
        </div>
        <Badge className="text-[9px]" variant="outline">
          <Crown className="h-3 w-3 mr-1" /> Platinum Tier
        </Badge>
      </div>

      {/* Instructions */}
      {currentStep < 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg p-4 mb-5 bg-primary/5 border border-primary/15">
          <div className="flex items-start gap-2">
            <Eye className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground mb-1">Your Mission: Oversee, Don't Operate</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                AI agents will execute this workflow autonomously. Your job is to monitor for anomalies and
                intervene only when necessary. Catching real issues earns points. False alarms cost you.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress */}
      {currentStep >= 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground">Workflow Progress</span>
            <span className="text-[10px] font-mono text-muted-foreground">{Math.min(currentStep + 1, MOCK_STEPS.length)}/{MOCK_STEPS.length}</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      )}

      {/* Steps */}
      <div className="space-y-2 mb-5">
        {steps.map((step, i) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: step.status === "pending" ? 0.4 : 1 }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
            style={{
              background: step.status === "running" ? "hsl(var(--primary) / 0.08)" :
                step.status === "error" ? "hsl(0, 60%, 50% / 0.08)" :
                step.status === "flagged" ? "hsl(var(--territory-strategic) / 0.08)" :
                "transparent",
              border: step.status === "running" ? "1px solid hsl(var(--primary) / 0.2)" :
                step.status === "error" ? "1px solid hsl(0, 60%, 50% / 0.2)" :
                "1px solid transparent",
            }}
          >
            {/* Status icon */}
            <div className="shrink-0">
              {step.status === "pending" && <div className="h-4 w-4 rounded-full border border-muted-foreground/20" />}
              {step.status === "running" && <Zap className="h-4 w-4 text-primary animate-pulse" />}
              {step.status === "completed" && <CheckCircle2 className="h-4 w-4" style={{ color: "hsl(var(--territory-analytical))" }} />}
              {step.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
              {step.status === "flagged" && <AlertTriangle className="h-4 w-4" style={{ color: "hsl(var(--territory-strategic))" }} />}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{step.label}</p>
              <p className="text-[9px] text-muted-foreground">{step.tool}</p>
            </div>

            {/* Intervene button */}
            {step.status === "running" && (
              <Button
                size="sm"
                variant="outline"
                className="text-[10px] h-7 px-2 gap-1"
                onClick={() => handleIntervene(step.id)}
                style={{ borderColor: "hsl(var(--territory-strategic) / 0.4)", color: "hsl(var(--territory-strategic))" }}
              >
                <AlertTriangle className="h-3 w-3" /> Flag
              </Button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {currentStep < 0 && (
          <Button onClick={handleStart} className="gap-2 flex-1">
            <Play className="h-4 w-4" /> Launch Agents
          </Button>
        )}
        {running && currentStep < MOCK_STEPS.length && (
          <Button onClick={advanceStep} className="gap-2 flex-1">
            <ChevronRight className="h-4 w-4" /> Advance Step
          </Button>
        )}
        {completed && (
          <Button variant="outline" onClick={() => {
            setSteps(MOCK_STEPS);
            setCurrentStep(-1);
            setRunning(false);
            setCompleted(false);
            setInterventions(new Set());
            setFalseAlarms(0);
          }} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Retry
          </Button>
        )}
      </div>

      {/* Score Card */}
      <AnimatePresence>
        {completed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 rounded-xl p-5"
            style={{ ...stoneCard, borderColor: "hsl(var(--primary) / 0.3)" }}
          >
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2" style={cinzel}>
              <Shield className="h-4 w-4 text-primary" /> Oversight Report
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground">Anomalies Caught</p>
                <p className="text-lg font-bold" style={{ color: "hsl(var(--territory-analytical))" }}>
                  {score.anomalies_caught}/{score.anomalies_total}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">False Alarms</p>
                <p className="text-lg font-bold text-destructive">{score.false_alarms}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Delegation Confidence</p>
                <p className="text-lg font-bold text-primary">{score.delegation_confidence}%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Total Interventions</p>
                <p className="text-lg font-bold text-foreground">{score.interventions}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
