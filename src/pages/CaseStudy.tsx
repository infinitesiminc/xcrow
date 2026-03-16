import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Play, Database, BarChart3,
  Layers, MessageSquare, Users, AlertTriangle, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StepATSImport from "@/components/case-study/StepATSImport";
import StepExposureMap from "@/components/case-study/StepExposureMap";
import StepTaskDrilldown from "@/components/case-study/StepTaskDrilldown";
import StepSimPreview from "@/components/case-study/StepSimPreview";
import StepTeamProgress from "@/components/case-study/StepTeamProgress";
import StepActionCenter from "@/components/case-study/StepActionCenter";
import StepModelAdaptation from "@/components/case-study/StepModelAdaptation";

const STEPS = [
  {
    id: "ats",
    phase: "Diagnose",
    icon: Database,
    title: "Import from ATS",
    subtitle: "Connected to Greenhouse in 2 clicks. Every role ingested automatically.",
    component: <StepATSImport />,
  },
  {
    id: "exposure",
    phase: "Diagnose",
    icon: BarChart3,
    title: "AI Exposure Map",
    subtitle: "Every role scored at the task level. See where AI disruption hits hardest.",
    component: <StepExposureMap />,
  },
  {
    id: "tasks",
    phase: "Diagnose",
    icon: Layers,
    title: "Task-Level Drill-down",
    subtitle: "Zoom into any role to see exactly which tasks AI is transforming.",
    component: <StepTaskDrilldown />,
  },
  {
    id: "simulation",
    phase: "Upskill",
    icon: MessageSquare,
    title: "AI Readiness Simulation",
    subtitle: "Employees practice real scenarios — scored across 4 readiness pillars.",
    component: <StepSimPreview />,
  },
  {
    id: "progress",
    phase: "Plan",
    icon: Users,
    title: "Team Progress Dashboard",
    subtitle: "Real-time visibility into readiness scores across departments.",
    component: <StepTeamProgress />,
  },
  {
    id: "action",
    phase: "Plan",
    icon: AlertTriangle,
    title: "Action Center",
    subtitle: "Automated interventions. Bottleneck detection. Coaching at scale.",
    component: <StepActionCenter />,
  },
  {
    id: "adaptation",
    phase: "Plan",
    icon: Sparkles,
    title: "Real-Time Model Adaptation",
    subtitle: "A new frontier model drops. The engine adapts in under 24 hours — automatically.",
    component: <StepModelAdaptation />,
  },
];

const PHASE_COLORS: Record<string, string> = {
  Diagnose: "bg-dot-blue/10 text-dot-blue",
  Upskill: "bg-dot-amber/10 text-dot-amber",
  Plan: "bg-dot-teal/10 text-dot-teal",
};

export default function CaseStudy() {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);

  const current = STEPS[step];

  if (!started) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Case Study
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight font-display">
            See how Anthropic maps AI readiness across 400+ roles
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Walk through the full platform in 6 steps — from ATS import to
            executive dashboards. No sign-up required.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button size="lg" onClick={() => setStarted(true)} className="gap-2">
              <Play className="h-4 w-4" /> Start the Tour
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/contact")}>
              Book a Demo
            </Button>
          </div>

          {/* Step preview pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {STEPS.map((s, i) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted rounded-full px-2.5 py-1"
              >
                <span className="font-mono text-[10px] opacity-50">{i + 1}</span>
                {s.title}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Progress bar */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-medium uppercase tracking-widest px-2 py-0.5 rounded-full ${PHASE_COLORS[current.phase]}`}>
                {current.phase}
              </span>
              <span className="text-sm font-medium">{current.title}</span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {step + 1} / {STEPS.length}
            </span>
          </div>

          {/* Step dots */}
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i <= step ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Step header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <current.icon className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{current.title}</h2>
                <p className="text-sm text-muted-foreground">{current.subtitle}</p>
              </div>
            </div>

            {/* Step body */}
            {current.component}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step > 0 ? setStep(step - 1) : setStarted(false)}
            className="gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {step > 0 ? "Back" : "Overview"}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button size="sm" onClick={() => setStep(step + 1)} className="gap-1">
              Next <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => navigate("/contact")} className="gap-1">
                Book a Demo <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate("/auth")}>
                Try Free
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
